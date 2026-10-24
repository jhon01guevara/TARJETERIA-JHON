# Despliegue seguro de las reglas nuevas (`firestore.rules`)

> **Estado: publicado en producción el 2026-10-24** (proyecto `tarjeteria-jhon`). `firestore.rules` del repo es idéntico a lo publicado (antes se llamaba `firestore.rules.propuesta`; ese archivo ya no existe). Las reglas anteriores se conservan en [`respaldo-reglas-anteriores-2026-10-24.rules`](respaldo-reglas-anteriores-2026-10-24.rules) para poder revertir (ver sección 5). El resto de este documento es el procedimiento que se siguió, con los nombres de archivo de entonces.

Orden obligatorio: **1) probar en `tarjeteria-jhon-prueba` → 2) decidir → 3) publicar en producción** (solo cuando tú lo confirmes).

## 0. Qué cambian las reglas nuevas respecto a las anteriores

Origen: `docs/AUDITORIA-SEGURIDAD.md` y `docs/PROPUESTA-SEGURIDAD-REGLAS.md`. Resumen:

- `empresas/{eid}/{document=**}` deja de dar lectura/escritura a cualquier miembro: solo administración. Los vendedores acceden únicamente a las rutas con regla específica (datos comunes de su empresa, su espacio privado, chats, llamadas, galería, tienda…).
- Las rutas de negocio exigen tener documento en `roles/` (staff) o ser miembro de la empresa (`empresas/{eid}/miembros/{uid}`), no solo tener sesión.
- Chats: un vendedor solo lee los chats donde está en `members`.
- La tienda pública sigue creando leads/pedidos sin sesión, pero con esquema estricto y límites de tamaño.
- `panel/loginbg` (fondo de login) pasa a ser solo para administración.

### Efectos conocidos (decide si los aceptas)

1. **Fondo de login en vendedores.** Hoy cada vendedor sincroniza `empresas/{eid}/panel/loginbg` desde la nube. Con las reglas nuevas solo lo lee el admin. `lbgPull` (en `js/app.js`) ya captura el error y no muestra nada: el vendedor simplemente conserva el fondo que tenga guardado en su navegador (o el predeterminado). No se abrió la regla.
2. **Pertenencia a la empresa (`miembros`).** Un vendedor solo accede a los datos de la empresa si existe `empresas/{eid}/miembros/{uid}` (formato `{uid, ts}`). La app los crea de dos formas, ambas ejecutadas por el admin y con el mismo formato (función `mktMiembroSet` en `js/marketing.js`):
   - **Vendedores existentes:** al abrir la vista «Marketing» (`mktMiembros`, una vez por sesión del admin, idempotente: no pisa los que ya existen).
   - **Vendedores nuevos:** al crearlos en «Vendedores» (`vendSave`), si `MULTIEMP` está activo y hay empresa activa. Va en su propio `try/catch`: si falla, el alta del vendedor no se corta (y el documento se completará al abrir Marketing).
   Un vendedor que no esté en `miembros` perdería el acceso a sus datos al publicar las reglas, por eso la comprobación previa de abajo es obligatoria.
3. **Baja de vendedores.** Con este PR, `vendDel` borra también `empresas/{eid}/miembros/{uid}` (si falla, no interrumpe la baja). Un vendedor eliminado *antes* de este cambio conserva su documento `miembros`: bórralo a mano (ver paso 2.3).
4. **Límites de la tienda.** Empresa ≤ 120 y dirección ≤ 200 caracteres (el formulario ya tiene `maxlength` con esos valores).
5. Los tests de `tests/reglas-firestore.test.js` (antes `reglas-propuestas.test.js`) y los demás que leen `firestore.rules` verifican el texto publicado.

## 1. Antes de empezar: copia de seguridad

1. Firebase Console → proyecto **`tarjeteria-jhon`** → Firestore Database → pestaña **Reglas**.
2. Selecciona todo el texto y guárdalo en un archivo con fecha, p. ej. `reglas-produccion-AAAA-MM-DD.rules`. (Antes de la publicación del 2026-10-24 era idéntico al `firestore.rules` anterior del repo; esa copia está en `docs/respaldo-reglas-anteriores-2026-10-24.rules`.)
3. Haz lo mismo con el proyecto de pruebas antes de cambiarlo.

## 2. Prueba en `tarjeteria-jhon-prueba`

### 2.1 Publicar la propuesta SOLO en pruebas

- **Consola:** proyecto `tarjeteria-jhon-prueba` → Firestore → Reglas → pega el contenido de `firestore.rules` → **Publicar**.
- **CLI:** desde una copia temporal del repo:
  ```bash
  mkdir /tmp/prueba && cp firestore.rules /tmp/prueba/firestore.rules
  cd /tmp/prueba
  echo '{"firestore":{"rules":"firestore.rules"}}' > firebase.json
  firebase deploy --only firestore:rules --project tarjeteria-jhon-prueba
  ```
  **Comprueba siempre que el nombre del proyecto termina en `-prueba`** antes de ejecutar.

### 2.2 Datos de prueba que hay que crear

El proyecto de pruebas está vacío. Crea:

| Qué | Cómo |
|---|---|
| **Admin** | Usuario en Authentication (correo/contraseña) y documento `roles/{uid}` con `rol: "admin"` (las reglas también reconocen el UID fijo de la administración de producción, que allí no existe). |
| **Vendedor A (miembro)** | Usuario en Authentication + `roles/{uidA}` = `{rol:'vend', n:'Vendedor A', email, panels:[…]}` + `empresas/tarjeteria-jhon/miembros/{uidA}` = `{uid, ts}`. |
| **Vendedor B (otra empresa)** | Usuario + `roles/{uidB}` + `empresas/otra-empresa/miembros/{uidB}`, **sin** miembros en `tarjeteria-jhon`. |
| **Datos mínimos** | Algunos documentos en `empresas/tarjeteria-jhon/panel_public/general`, `…/clientes`, `…/catalogo` y un chat entre admin y A. |

Puedes crear el vendedor A desde la vista «Vendedores» del panel (si lo abres apuntando a pruebas) o a mano en la consola, y abrir «Marketing» una vez como admin para que se generen los `miembros` (los vendedores creados desde «Vendedores» ya generan el suyo al darlos de alta).

### 2.3 Abrir una copia del panel apuntando a pruebas

Sirve el repo en local con `firebaseConfig` del proyecto de pruebas (**no lo subas al repo**), o usa la herramienta de `migraciones/` ya preparada para pruebas. Verifica en la consola del navegador que `projectId` sea `tarjeteria-jhon-prueba`.

### 2.4 Lista de comprobación (marca cada punto)

Como **admin**:
- [ ] Inicia sesión y se ven Inicio, facturas, clientes y catálogo.
- [ ] Vendedores: crear, editar y **eliminar** un vendedor (comprueba que desaparecen `roles/{uid}` y `miembros/{uid}`).
- [ ] Marketing: abre la vista (crea `miembros`), crea un diseño, cambia la marca.
- [ ] Chat: ver todas las conversaciones; crear un grupo; borrarlo.
- [ ] Llamadas: iniciar una a un vendedor.
- [ ] Tienda virtual: editar configuración, subir un producto; la tienda pública carga.
- [ ] Galería: subir y borrar fotos.
- [ ] Fondo de login: guardarlo y recuperarlo.
- [ ] Vista «Empresas».

Como **vendedor A (miembro)**:
- [ ] Inicia sesión; ve sus facturas y clientes de la empresa.
- [ ] Crea una factura (el contador avanza de uno en uno).
- [ ] Chat: ve solo sus conversaciones; envía mensajes.
- [ ] Llamada con admin.
- [ ] Galería: sube una foto y puede borrar solo la suya.
- [ ] Tienda: ve sus leads/pedidos.
- [ ] El fondo de login no da error ni mensajes (se queda el predeterminado).
- [ ] **No** puede abrir vistas de admin (Vendedores, Mapa, Config, Empresas).

Como **vendedor B (otra empresa)** y **usuario sin rol**:
- [ ] No ve clientes, facturas ni chats de la empresa `tarjeteria-jhon`.
- [ ] Un usuario sin documento en `roles/` no lee nada de negocio.

Como **cliente de la tienda pública (sin sesión)**:
- [ ] Ve la tienda, se registra (empresa/dirección con el límite de longitud) y envía un pedido.

Si algo falla, anota la ruta exacta del error (consola del navegador → «Missing or insufficient permissions») y **no pases a producción**.

## 3. Decidir

Pasa a producción solo si toda la lista anterior está en verde, y confirma:
- [ ] **Paso previo a la publicación:** antes de publicar, el admin abre la vista «Marketing» una vez y verifica en Firebase Console que cada vendedor activo tiene su documento en `empresas/{eid}/miembros` (Firestore → `empresas` → `tarjeteria-jhon` → `miembros`; el ID del documento es el UID del vendedor, el mismo que en `roles/{uid}`).
  - Si falta alguno: recarga el panel como admin, abre «Marketing» de nuevo y vuelve a mirar (ten en cuenta que `mktMiembros` solo corre una vez por sesión).
  - Si sigue faltando, créalo a mano en la consola: en `empresas/{eid}/miembros` pulsa «Agregar documento», **ID del documento = UID del vendedor**, campos `uid` (string, el mismo UID) y `ts` (number, p. ej. `1790000000000`).
- [ ] Aceptas los efectos de la sección 0.
- [ ] Tienes la copia de las reglas actuales (sección 1).
- [ ] Haces el cambio en un momento de poco uso y puedes probar con un vendedor real justo después.

## 4. Publicar en producción (solo cuando tú lo decidas)

- **Consola:** proyecto **`tarjeteria-jhon`** → Firestore → Reglas → pega `firestore.rules` → **Publicar**. *(Hecho el 2026-10-24.)*
- **CLI:** igual que en 2.1, pero con `--project tarjeteria-jhon`, y sabiendo que desplegará lo que haya en ese archivo.
- El repo y producción coinciden: `firestore.rules` es el texto publicado y los tests se actualizaron para validarlo.

Tras publicar, prueba de inmediato con la cuenta admin y con un vendedor real (lista 2.4, versión corta). Las reglas pueden tardar unos segundos en propagarse.

## 5. Revertir

1. Firestore → Reglas → **Historial/versiones** de la pestaña Reglas: elige la versión anterior y publícala; **o**
2. pega la copia guardada en el paso 1 (la del repo: `docs/respaldo-reglas-anteriores-2026-10-24.rules`) y pulsa **Publicar**. Las reglas anteriores abrían más acceso (p. ej. comodín `esEmpresa(eid)` en el árbol por empresa); revertir es solo una salida de emergencia.
3. Con CLI: `firebase deploy --only firestore:rules --project tarjeteria-jhon` desde una carpeta cuyo `firestore.rules` sea la copia antigua (`cp docs/respaldo-reglas-anteriores-2026-10-24.rules /tmp/rev/firestore.rules`). Si lo haces, restaura también `firestore.rules` del repo con otro PR para que sigan coincidiendo.

Revertir no borra datos: las reglas solo controlan el acceso. Si borraste `miembros` por error, el admin puede recrearlos abriendo «Marketing» (los vendedores nuevos ya se crean solos al darlos de alta).
