# Propuesta de endurecimiento de `firestore.rules` (APLICADA el 2026-10-24)

> **Estado: Publicado en producción el 2026-10-24.** Este documento es la propuesta original (histórica). La versión final, probada con emulador y en `tarjeteria-jhon-prueba`, es hoy `firestore.rules` (antes `firestore.rules.propuesta`), idéntica a lo publicado. Las reglas anteriores están en `docs/respaldo-reglas-anteriores-2026-10-24.rules`. Procedimiento: `docs/DESPLIEGUE-REGLAS.md`.
>
> *Texto original de la propuesta:*
> **Estado:** solo propuesta.
> Las reglas **no se despliegan desde git**: se publican desde la consola de Firebase o con `firebase deploy --only firestore:rules`.
> Los diffs de abajo **no se ejecutaron en el emulador** (el equipo donde se preparó no tenía Java, que el emulador necesita).
> Trátelos como borrador: pruébelos con el emulador (sección 3) antes de publicar nada.
>
> Contexto y evidencia de cada hallazgo (H1…H5): `docs/AUDITORIA-SEGURIDAD.md`.
> **No se propone quitar el UID del administrador** (`firestore.rules:15`): los tests y el arranque del panel dependen de él.

## 0. Principios para no romper nada

1. **Copie el texto actual** de las reglas (Firestore → Reglas) en un archivo antes de publicar. Así puede volver atrás en un minuto.
2. Aplique **un cambio a la vez**, en este orden: A → (comprobar miembros) → B → C → D.
3. Pruebe cada cambio con el emulador **y** con cuentas reales de prueba (una de administrador y una de vendedor).
4. Publique en un horario de poco uso y revise la pestaña **Uso/Monitor** de Firestore por errores `permission-denied`.
5. Al cambiar el texto de `firestore.rules` en el repo, hay que actualizar `tests/fase8-reglas.test.js` (hecho el 2026-10-24).

---

## A. (H1, Alta) El comodín `empresas/{eid}/{document=**}` no debe dar escritura a los miembros

Hoy (líneas 236-238) cualquier miembro lee/escribe todo bajo la empresa, incluido `panel/data` (la base del admin) y los
datos de otros vendedores. Todas las colecciones que un vendedor realmente necesita ya tienen una regla específica más abajo
(`panel_public`, `vendedores/{uid}/privado`, `catalogo`, `galeria`, `tienda_*`, `chats`, `llamadas`, `marketing_*`), así que el comodín
solo necesita servir al administrador (igual que la raíz).

```diff
--- a/firestore.rules
+++ b/firestore.rules
@@ -233,7 +233,13 @@
     // Árbol general de la empresa (panel, catálogo, chats, llamadas, wa…):
-    // administración global o miembros. Las colecciones que la tienda pública
-    // y los vendedores usan se espejan abajo con las mismas reglas de hoy.
+    // SOLO administración global. Las colecciones que usan los vendedores y la tienda
+    // pública tienen su regla específica más abajo. Un comodín que admitiera miembros
+    // anularía esas reglas (en Firestore basta que UNA regla permita).
     match /empresas/{eid}/{document=**} {
-      allow read, write: if esEmpresa(eid);
+      allow read, write: if isAdmin();
     }
+
+    match /empresas/{eid}/miembros/{uid} {
+      allow read: if isAdmin() || (logged() && request.auth.uid == uid);
+      allow write: if isAdmin();
+    }
```

**Qué puede fallar:** que el panel de un vendedor lea/escriba algún documento del árbol por empresa que **no** tenga regla
específica. Con la lista de `EMP_NEGOCIO` (`js/empresa-contexto.js:59`) no encontré ninguno; **compruébelo** con una cuenta
de vendedor de prueba recorriendo todas las pestañas (facturas, clientes, chat, llamadas, galería, tienda, marketing).
**Cómo deshacer:** volver a publicar el texto guardado.

## B. (H3, Alta/Media) Exigir pertenencia a la empresa en los espejos del árbol

**Requisito previo (importante):** todo vendedor debe existir en `empresas/{eid}/miembros/{uid}`. Hoy lo crea el admin al
abrir Marketing Studio (`js/marketing.js:37-48`). Verifíquelo en la consola; si falta alguno, ese vendedor **perdería acceso**.
Una forma segura es que el admin abra Marketing Studio con la empresa activa y luego comparar `miembros` con la lista de vendedores.

Mueva la función `esMiembroEmpresa` (hoy línea 355) por encima de su primer uso y cambie `logged()` por `esMiembroEmpresa(eid)` en
las **lecturas y actualizaciones** del árbol de empresa:

```diff
@@ match /empresas/{eid}/panel_public/general
-      allow read: if logged();
+      allow read: if esMiembroEmpresa(eid);
@@ match /empresas/{eid}/panel_public/contador
-      allow read: if logged();
+      allow read: if esMiembroEmpresa(eid);
-      allow update: if isAdmin() || (logged() && request.resource.data.sig == resource.data.sig + 1);
+      allow update: if isAdmin() || (esMiembroEmpresa(eid) && request.resource.data.sig == resource.data.sig + 1);
@@ match /empresas/{eid}/panel_public/clientes
-      allow read: if logged();
+      allow read: if esMiembroEmpresa(eid);
-      allow update: if logged() && (isAdmin() || request.resource.data.cli.size() >= resource.data.cli.size());
+      allow update: if esMiembroEmpresa(eid) && (isAdmin() || request.resource.data.cli.size() >= resource.data.cli.size());
@@ match /empresas/{eid}/catalogo/{doc}
-      allow read: if logged();
+      allow read: if esMiembroEmpresa(eid);
@@ match /empresas/{eid}/galeria/{doc}
-      allow read: if logged();
-      allow create: if logged() && request.resource.data.o == me();
+      allow read: if esMiembroEmpresa(eid);
+      allow create: if esMiembroEmpresa(eid) && request.resource.data.o == me();
```

(`chats` y `llamadas` ya limitan por participante; opcionalmente añada también `esMiembroEmpresa(eid)` a su `create`.)
**Nota de rendimiento:** `esMiembroEmpresa` hace una consulta `exists()` por solicitud; Firestore limita las consultas de
reglas por solicitud (10 en operaciones simples). Mídalo con el emulador.

## C. (H2, Alta) Sustituir «tener sesión» por «tener rol» en datos de negocio

```diff
@@ después de la función logged() (línea 11)
+    // Cuenta con sesión Y con documento en roles/ (admin o vendedor activo).
+    // exists() no falla si el documento no existe.
+    function isStaff() {
+      return logged()
+        && (request.auth.uid == 'o7bHndKtswSHreFnVwORqBSUKL43'
+          || exists(/databases/$(database)/documents/roles/$(request.auth.uid)));
+    }
@@ raíz: panel_public/general, contador, clientes, catalogo, galeria, perfiles (lectura)
-      allow read: if logged();
+      allow read: if isStaff();
@@ panel_public/contador y clientes (update)
-      allow update: if isAdmin() || (logged() && request.resource.data.sig == resource.data.sig + 1);
+      allow update: if isAdmin() || (isStaff() && request.resource.data.sig == resource.data.sig + 1);
-      allow update: if logged() && (isAdmin() || request.resource.data.cli.size() >= resource.data.cli.size());
+      allow update: if isStaff() && (isAdmin() || request.resource.data.cli.size() >= resource.data.cli.size());
@@ galeria (create) y chats (create) y llamadas (create)
-      allow create: if logged() && …
+      allow create: if isStaff() && …
```

Efecto: un vendedor eliminado (`vendDel` borra `roles/{uid}`) o una cuenta creada por registro abierto **deja de leer** clientes, banco y
catálogo. **Riesgo:** el comentario de las líneas 5-8 indica que se evitó `exists()` para no romper consultas completas; el
emulador y una prueba real de las pantallas (clientes, galería, chats) deben confirmar que no vuelve ese problema.
Alternativa a medio plazo: *custom claims* (rol dentro del token, sin consultas extra) establecidos desde una Cloud Function.

## D. (H4/H5, Media/Baja) Endurecer la creación pública y otros detalles

Se pueden hacer después, son de bajo riesgo si se prueban:

```diff
@@ tienda_leads (create), raíz y empresas
+        && request.resource.data.empresa is string && request.resource.data.empresa.size() <= 120
+        && request.resource.data.dir is string && request.resource.data.dir.size() <= 200
@@ tienda_pedidos (create)
+        && request.resource.data.lead.keys().hasOnly(['name','tel','email','empresa','dir','terminos'])
+        && request.resource.data.lead.size() <= 8
@@ galeria (update): no cambiar el dueño
-      allow update, delete: if isAdmin() || resource.data.o == me();
+      allow update: if isAdmin() || (resource.data.o == me() && request.resource.data.o == resource.data.o);
+      allow delete: if isAdmin() || resource.data.o == me();
```

**Cuidado:** `js/app.js:3903` guarda `lead.terminos` (mapa de auditoría Ley 81) dentro de `lead`; la lista `hasOnly` debe incluir
**todos** los campos que el cliente envía hoy. Confirme los campos reales de `lead` antes de aplicarlo (por ejemplo, creando
un pedido de prueba y mirando el documento) o el pedido público fallaría. Los campos de `empresa` y `dir` deben ser siempre cadenas
(`js/app.js:3515, 3794` envían `g('sh_c')`/`g('sh_d')`; si pudieran faltar, la regla los rechazaría).

La protección real contra el spam en la tienda pública es **App Check en modo Enforce** (ver auditoría §6.2), no las reglas.

---

## 3. Cómo probar las reglas con el emulador de Firebase (sin tocar producción)

Requisitos en su computadora: Node 18+ y **Java 11+** (el emulador de Firestore lo necesita).

1. En una carpeta **aparte** (no en el repo de producción):
   ```bash
   mkdir pruebas-reglas && cd pruebas-reglas
   npm init -y
   npm i -D firebase-tools @firebase/rules-unit-testing firebase
   cp ../TARJETERIA-JHON/firestore.rules firestore.propuesta.rules   # copie y edite SOLO esta copia
   ```
2. `firebase.json`:
   ```json
   { "firestore": { "rules": "firestore.propuesta.rules" },
     "emulators": { "firestore": { "port": 8080 }, "ui": { "enabled": false } } }
   ```
3. `reglas.test.js` (Node, `node --test`). Casos mínimos a cubrir:
   ```js
   const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
   const fs = require('fs'); const test = require('node:test');
   let env;
   test.before(async () => {
     env = await initializeTestEnvironment({ projectId: 'demo-tarjeteria',
       firestore: { rules: fs.readFileSync('firestore.propuesta.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
     await env.withSecurityRulesDisabled(async (c) => {           // datos de prueba
       const db = c.firestore();
       await db.doc('roles/vend1').set({ rol: 'vend', n: 'V1', panels: ['home'] });
       await db.doc('roles/vend2').set({ rol: 'vend', n: 'V2', panels: ['home'] });
       await db.doc('empresas/emp1/miembros/vend1').set({ uid: 'vend1' });
       await db.doc('empresas/emp1/panel/data').set({ cli: [], fac: [] });
       await db.doc('empresas/emp2/panel_public/clientes').set({ cli: [{ id: 'x' }] });
       await db.doc('vendedores/vend2/privado/data').set({ fac: [] });
     });
   });
   test.after(() => env.cleanup());
   const as = (uid) => env.authenticatedContext(uid).firestore();
   const admin = () => env.authenticatedContext('o7bHndKtswSHreFnVwORqBSUKL43').firestore();
   const anon = () => env.unauthenticatedContext().firestore();

   test('un vendedor NO puede editar su rol ni el de otro', async () => {
     await assertFails(as('vend1').doc('roles/vend1').set({ rol: 'admin' }));
     await assertFails(as('vend1').doc('roles/vend2').set({ rol: 'admin' }));
   });
   test('un vendedor NO lee la base del admin ni los datos de otro vendedor', async () => {
     await assertFails(as('vend1').doc('empresas/emp1/panel/data').get());      // H1
     await assertFails(as('vend1').doc('empresas/emp1/panel/data').set({ cli: [] }));
     await assertFails(as('vend1').doc('vendedores/vend2/privado/data').get());
     await assertFails(as('vend1').doc('empresas/emp1/miembros/vend1').set({ uid: 'x' }));
   });
   test('un vendedor de emp1 NO lee clientes de emp2', async () => {            // H3 (tras propuesta B)
     await assertFails(as('vend1').doc('empresas/emp2/panel_public/clientes').get());
   });
   test('una cuenta sin rol NO lee clientes (H2, tras propuesta C)', async () => {
     await assertFails(as('intruso').doc('panel_public/clientes').get());
   });
   test('el admin conserva el acceso', async () => {
     await assertSucceeds(admin().doc('empresas/emp1/panel/data').get());
     await assertSucceeds(admin().doc('roles/vend1').set({ rol: 'vend', n: 'V1', panels: ['home'] }));
   });
   test('un vendedor SÍ lee lo suyo', async () => {
     await assertSucceeds(as('vend2').doc('vendedores/vend2/privado/data').get());
     await assertSucceeds(as('vend1').doc('roles/vend1').get());
   });
   test('la tienda pública sigue funcionando', async () => {
     await assertSucceeds(anon().doc('tienda_items/abc').get());
     // y un pedido/lead válido debe poder crearse sin sesión (use los campos reales)
   });
   ```
4. Ejecute: `npx firebase emulators:exec --only firestore "node --test reglas.test.js"`.
5. Resultado esperado con las reglas **actuales**: fallan (como evidencia de H1/H2/H3) los casos `assertFails` de empresa, `intruso`
   y miembros; con las **propuestas** deben pasar todos. Añada un caso por cada pantalla del panel que use Firestore.
6. Antes de publicar: pruebe en el navegador con `firebase serve` o con el sitio apuntando al emulador (opcional) y, sobre todo,
   con una cuenta real de vendedor de prueba después de publicar.

## 4. Publicación (cuando esté listo)
1. Guarde el texto actual de las reglas.
2. Firestore → **Reglas** → pegue el texto nuevo → **Publicar** (o `firebase deploy --only firestore:rules`).
3. Inicie sesión como admin y como vendedor de prueba; abra Facturas, Clientes, Chat, Galería, Tienda y Marketing.
4. Si algo falla, vuelva a publicar el texto guardado (o use el historial de versiones de reglas de la consola si lo muestra).
