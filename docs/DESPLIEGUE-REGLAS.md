# Despliegue seguro de las reglas propuestas (`firestore.rules.propuesta`)

> **Estado: NADA está desplegado.** `firestore.rules` (producción, proyecto `tarjeteria-jhon`) **no se ha modificado** y es idéntico a lo publicado. Las reglas nuevas están en `firestore.rules.propuesta`, que Firebase no lee por sí solo. Las reglas propuestas se publicaron únicamente en el proyecto de pruebas `tarjeteria-jhon-prueba`.

Orden obligatorio: **1) probar en `tarjeteria-jhon-prueba` → 2) decidir → 3) publicar en producción** (solo cuando tú lo confirmes).

## 0. Qué cambian las reglas propuestas

Origen: `docs/AUDITORIA-SEGURIDAD.md` y `docs/PROPUESTA-SEGURIDAD-REGLAS.md`. Resumen:

- `empresas/{eid}/{document=**}` deja de dar lectura/escritura a cualquier miembro: solo administración. Los vendedores acceden únicamente a las rutas con regla específica (datos comunes de su empresa, su espacio privado, chats, llamadas, galería, tienda…).
- Las rutas de negocio exigen tener documento en `roles/` (staff) o ser miembro de la empresa (`empresas/{eid}/miembros/{uid}`), no solo tener sesión.
- Chats: un vendedor solo lee los chats donde está en `members`.
- La tienda pública sigue creando leads/pedidos sin sesión, pero con esquema estricto y límites de tamaño.
- `panel/loginbg` (fondo de login) pasa a ser solo para administración.

### Efectos conocidos (decide si los aceptas)

1. **Fondo de login en vendedores.** Hoy cada vendedor sincroniza `empresas/{eid}/panel/loginbg` desde la nube. Con las reglas nuevas solo lo lee el admin. `lbgPull` (en `js/app.js`) ya captura el error y no muestra nada: el vendedor simplemente conserva el fondo que tenga guardado en su navegador (o el predeterminado). No se abrió la regla.
2. **Pertenencia a la empresa (`miembros`).** Un vendedor solo accede a los datos de la empresa si existe `empresas/{eid}/miembros/{uid}`. En la app, esos documentos los crea la administración **al abrir la vista «Marketing»** (función `mktMiembros`, una vez por sesión del admin). Si un vendedor no está en `miembros`, **perdería el acceso** a sus datos. Un vendedor nuevo creado después necesita que el admin vuelva a abrir Marketing (o crear su documento a mano).
3. **Baja de vendedores.** Con este PR, `vendDel` borra también `empresas/{eid}/miembros/{uid}` (si falla, no interrumpe la baja). Un vendedor eliminado *antes* de este cambio conserva su documento `miembros`: bórralo a mano (ver paso 2.3).
4. **Límites de la tienda.** Empresa ≤ 120 y dirección ≤ 200 caracteres (el formulario ya tiene `maxlength` con esos valores).
5. Los tests de `tests/reglas-propuestas.test.js` verifican el texto de la propuesta; los de `firestore.rules` siguen verificando producción.

## 1. Antes de empezar: copia de seguridad

1. Firebase Console → proyecto **`tarjeteria-jhon`** → Firestore Database → pestaña **Reglas**.
2. Selecciona todo el texto y guárdalo en un archivo con fecha, p. ej. `reglas-produccion-AAAA-MM-DD.rules`. (Debe ser idéntico a `firestore.rules` del repo; compáralo.)
3. Haz lo mismo con el proyecto de pruebas antes de cambiarlo.

## 2. Prueba en `tarjeteria-jhon-prueba`

### 2.1 Publicar la propuesta SOLO en pruebas

- **Consola:** proyecto `tarjeteria-jhon-prueba` → Firestore → Reglas → pega el contenido de `firestore.rules.propuesta` → **Publicar**.
- **CLI:** desde una copia temporal del repo (para no tocar `firestore.rules`):
  ```bash
  mkdir /tmp/prueba && cp firestore.rules.propuesta /tmp/prueba/firestore.rules
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

Puedes crear el vendedor A desde la vista «Vendedores» del panel (si lo abres apuntando a pruebas) o a mano en la consola, y abrir «Marketing» una vez como admin para que se generen los `miembros`.

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
- [ ] Todos los vendedores reales tienen documento en `empresas/tarjeteria-jhon/miembros/` (se ve en Firestore → `empresas` → `tarjeteria-jhon` → `miembros`). Si falta alguno: entra como admin, abre «Marketing» y vuelve a mirar.
- [ ] Aceptas los efectos de la sección 0.
- [ ] Tienes la copia de las reglas actuales (sección 1).
- [ ] Haces el cambio en un momento de poco uso y puedes probar con un vendedor real justo después.

## 4. Publicar en producción (solo cuando tú lo decidas)

- **Consola:** proyecto **`tarjeteria-jhon`** → Firestore → Reglas → pega `firestore.rules.propuesta` → **Publicar**.
- **CLI:** igual que en 2.1, pero con `--project tarjeteria-jhon`, y sabiendo que desplegará lo que haya en ese archivo.
- Para que el repo y producción coincidan, después se reemplaza `firestore.rules` por la propuesta en un PR aparte (y se actualizan los tests de `firestore.rules`, que hoy validan las reglas antiguas).

Tras publicar, prueba de inmediato con la cuenta admin y con un vendedor real (lista 2.4, versión corta). Las reglas pueden tardar unos segundos en propagarse.

## 5. Revertir

1. Firestore → Reglas → **Historial/versiones** de la pestaña Reglas: elige la versión anterior y publícala; **o**
2. pega la copia guardada en el paso 1 (o el contenido actual de `firestore.rules` del repo) y pulsa **Publicar**.
3. Con CLI: `firebase deploy --only firestore:rules --project tarjeteria-jhon` desde una carpeta cuyo `firestore.rules` sea la copia antigua.

Revertir no borra datos: las reglas solo controlan el acceso. Si borraste `miembros` por error, el admin puede recrearlos abriendo «Marketing».
