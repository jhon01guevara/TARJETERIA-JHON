# Aislamiento entre empresas en `firestore.rules` — diseño, informe de riesgo y plan de publicación

> **Estado: PROPUESTA (2026-10-26). NO publicada en producción.** Rama `aislamiento-empresas-reglas`. Lo publica el asistente principal tras la confirmación de John.
> Reglas publicadas hoy (copia exacta, verificada contra la consola): [`respaldo-reglas-anteriores-2026-10-26.rules`](respaldo-reglas-anteriores-2026-10-26.rules).

## 1. Qué problema resuelve

Hoy `isAdmin()` es **global**: cualquier cuenta con `roles/{uid}.rol == 'admin'` lee y escribe **todas** las empresas (`empresas/*/…`, incluida la raíz heredada de Tarjetería). Mientras el único administrador sea John da igual; en cuanto VEN CRM venda a otras empresas (cada una con su administrador) un administrador vería los clientes, facturas, chats y la tienda de las demás. Hay que cerrarlo **antes de cobrar**.

## 2. Diseño (3 niveles)

| Concepto | Regla | Quién |
|---|---|---|
| `isMaster()` | UID fijo `o7bHnd…` (el mismo de `js/app.js`) | John. Ve **todas** las empresas, la raíz heredada, lista `roles`, crea/borra empresas. Nada cambia para él. |
| `esRolAdmin()` | maestro, o `roles/{uid}.rol == 'admin'` | Solo **identidad**: ya no da acceso a datos de empresas. |
| `adminDe(eid)` | maestro, o `esRolAdmin()` **y** existe `empresas/{eid}/miembros/{uid}` | Administrador **de esa empresa**. Es lo que usan ahora todas las reglas de `empresas/{eid}/…`. |
| `esMiembroEmpresa(eid)` | `adminDe(eid)` o existe `miembros/{uid}` | Vendedores y administradores de esa empresa. |
| `meEn(eid)` | `'admin'` si `adminDe(eid)`, si no el UID | Sustituye a `me()` dentro de `empresas/{eid}/…`: el administrador de la empresa A **no hereda la identidad «admin» de B** (chats, mensajes, llamadas, galería, pedidos, leads). |

Otros cambios:
- `empresas/{id}`: leer = miembro/administrador de esa empresa; **crear y borrar = solo maestro**; editar = `adminDe(id)`.
- `dominios/{host}` (lectura pública, igual): un administrador solo crea/edita/borra dominios cuyo `empresaId` es una empresa que administra → **no puede secuestrar** el dominio de otra.
- `roles/{uid}`: `list` solo maestro. Un administrador que no es el maestro solo puede crear/editar/borrar **vendedores** (`rol: 'vend'`); no crea administradores ni toca a otro administrador (no se puede autopromover ni degradar a otro).
- Raíz heredada (`panel`, `panel_public`, `catalogo`, `galeria`, `vendedores`, `chats`, `llamadas`, `investigacion_items`, `wa_conversaciones`, lectura de `tienda_leads/pedidos`): **solo maestro** (antes cualquier admin y, en lectura, cualquier cuenta con rol: p. ej. `panel_public/clientes` de Tarjetería era legible por todo vendedor de cualquier empresa).
- `empresas/{eid}/vendedores/{uid}/privado`: el vendedor accede a su espacio solo si además es miembro de esa empresa.
- Sin cambios: tienda pública (leer productos, crear lead/pedido sin sesión con el esquema estricto), `perfiles` (identidad global, lectura para cuentas con rol), `presencia` (la leen los administradores), el catch-all final `deny`.

## 3. Pruebas

- **Emulador de Firestore** (`tests/herramientas/reglas-emulador/`, `./run.sh ../../../firestore.rules <archivo>`): `reglas-aislamiento.test.js` **19/19** (nuevas), `reglas-generales.test.js` **27/27** (2 pruebas se actualizaron a propósito: admin por rol ahora exige ser miembro; la raíz heredada ya no es legible por vendedores), `reglas-pedido-envio.test.js` **32/32**. Las 19 nuevas **fallan 10 contra las reglas anteriores** (prueba de que miden algo).
- `npm test`: pruebas de texto actualizadas + `tests/aislamiento-reglas.test.js`.
- **Proyecto de PRUEBA** (`tarjeteria-jhon-prueba`): publiqué temporalmente estas reglas, sembré `empresas/*/miembros/{admin.prueba}` y corrí la suite de humo en Chrome real como administrador **no maestro y miembro**: **20/20 bien** (login, clientes, productos, factura, catálogo, tienda pública, pedido, marca). Después **restauré las reglas anteriores** en el proyecto de prueba. (Los `miembros` sembrados para `admin.prueba` quedan; son inocuos.)

## 4. Informe de riesgo (qué puede romper al publicar)

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Existe en producción **otra cuenta con `rol: 'admin'`** distinta del maestro y sin `miembros/{uid}` → perdería acceso a todo | Baja (la app solo crea `rol:'vend'`; el panel trata al maestro por UID) | Alto para esa cuenta; el maestro no se afecta | **Comprobación previa obligatoria** (§5, paso 1) y crear sus `miembros` antes de publicar. |
| R2 | Un vendedor sin `miembros/{uid}` en su empresa | Baja (ya era requisito de las reglas del 24-oct) | Pierde acceso (igual que hoy) | Paso 2 de la comprobación; abrir «Marketing» como administrador los crea. |
| R3 | **Reversión `MULTIEMP=false`** ya no sirve para vendedores (la raíz es solo del maestro). El maestro sí. | Muy baja (producción usa `MULTIEMP=true` desde 2026-10-22) | Medio | Si hiciera falta volver a la raíz, publicar el respaldo de reglas (un minuto). |
| R4 | **Un administrador que no es el maestro** no puede listar la colección `empresas` (la pantalla «Empresas» le falla) ni **crear empresas**. Comprobado en PRUEBA: `registro-empresas` y `guia-primeros-pasos` fallan con admin no maestro. | Nula hoy (solo el maestro usa «Empresas») | Bloquea el **alta autoservicio** (Etapa 4) | Aceptado: es lo que se quiere para el maestro. Para el alta autoservicio hará falta crear la empresa y su `miembros` con una Cloud Function (plan Blaze) o añadir un campo `admins` consultable en `empresas/{id}`. **Decisión pendiente (Etapa 4).** |
| R5 | **Limitación conocida de `roles`**: es identidad global; un administrador de empresa podría editar/borrar el rol de un **vendedor de otra empresa** (hay prueba que lo documenta). No puede crear/degradar administradores. | Baja | Medio | Solución real: gestionar usuarios desde una Cloud Function (Blaze). Mientras solo el maestro administre, no aplica. |
| R6 | En `rules_version 2` el comodín `empresas/{eid}/{document=**}` también cubre `empresas/{eid}`: el administrador DE esa empresa podría borrar su propio documento de metadatos (no los datos). | Muy baja | Bajo | Aceptado; no cruza empresas. |
| R7 | Más lecturas de reglas por petición (`exists`/`get` de `roles` y `miembros`): hasta ~3 por petición de un administrador no maestro; el maestro no paga extra (cortocircuito). Límite de Firestore: 10. | Baja | Bajo | Las pruebas del emulador (que aplica el límite) pasan. |
| R8 | `validRef(ref)` de la tienda sigue aceptando el UID de cualquier vendedor (no comprueba que sea de esa empresa): un pedido público podría apuntar a un vendedor de otra empresa. | Baja | Bajo (spam) | Endurecer después con `miembros`; no se hizo para no romper pedidos de vendedores sin `miembros`. |

## 5. Plan de publicación (lo ejecuta el asistente principal, con la confirmación de John)

1. **Comprobación previa (solo lectura, consola de producción → Firestore → `roles`)**: listar los documentos con `rol == 'admin'`. Si solo está (o no está) el maestro → seguir. Si hay otro administrador real: crearle `empresas/{eid}/miembros/{uid}` = `{uid, ts}` en cada empresa que deba administrar, **antes** de publicar.
2. Comprobar que cada vendedor activo (`roles` con `rol: 'vend'`) tiene `miembros/{uid}` en su(s) empresa(s) (lo crea «Marketing» como administrador).
3. **Respaldo**: ya está en `docs/respaldo-reglas-anteriores-2026-10-26.rules` (verificado idéntico a lo publicado). Guardar además el texto de la pestaña **Reglas** de la consola con fecha.
4. Fusionar el PR (CI verde) y publicar **solo reglas** (no hosting): `firebase deploy --only firestore:rules --project tarjeteria-jhon` desde una copia temporal con `firebase.json` = `{"firestore":{"rules":"firestore.rules"}}`, o pegar el texto en la consola → **Publicar**.
5. **Verificar de inmediato** (Chrome real, sesión del maestro): entrar al panel, Inicio, Clientes, Facturas, Chat, «Empresas» (lista y entrar a Genuine), tienda pública `?tienda=1` y `?tienda=1&emp=genuine`. Vigilar en Firestore → Uso errores `permission-denied`. Probar un vendedor real si existe.
6. **Reversión** (si algo falla, < 1 minuto): publicar el contenido de `docs/respaldo-reglas-anteriores-2026-10-26.rules`.
7. Opcional después: publicar también en `tarjeteria-jhon-prueba`. **Aviso**: con estas reglas el administrador de prueba (`admin.prueba@example.com`) deja de ser «global»: ya tiene `miembros` en las 4 empresas de prueba, pero las suites que **crean empresas o listan «Empresas»** (`registro-empresas`, `guia-primeros-pasos`, `empresa-nueva-vacia`…) fallarán con él (R4). Hay que decidir si el proyecto de prueba debe usar al maestro o se acepta.

## 6. Lo que NO hace (a propósito)

No toca Auth, App Check, reCAPTCHA, EmailJS ni datos. No cambia la app (solo reglas y pruebas). No convierte a nadie en maestro: el UID fijo es el mismo de siempre.
