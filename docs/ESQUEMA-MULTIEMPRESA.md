# Esquema multiempresa definitivo — TARJETERIA-JHON

Fecha: 2026-10-21 · Actualizado 2026-10-22 · Estado: **Fases 1-5 completas · FASE 6 VALIDADA (2026-10-22: proyecto de pruebas creado, informe sin riesgos, copia verificada y ensayo repetido) · Fase 7 lista para activar · Reglas Fase 8 listas para desplegar**.

Empresa inicial: `tarjeteria-jhon` (id estable; ver `js/empresa-contexto.js`). Empresa 2 registrada en metadatos: `genuine` (GENUINE).

**Estado de fases:** F1 diagnóstico ✅ · F2 respaldo ✅ · F3 módulo Empresas ✅ · F4 contexto ✅ · F5 simulación ✅ · **F6 migración de prueba VALIDADA 2026-10-22** (informe `ok:true` sin alertas: 11 facturas admin, 2 vendedores, 63 items tienda, 52 investigación, contador 1080) · **F7 código integrado e inerte** (`fbCol`/`lsk` enrutan TODO el panel, apps externas incluidas vía proxy del puente; se activa cambiando `MULTIEMP=false` → `true` en `js/empresa-contexto.js`, línea 11; la herramienta ya tiene el modo REAL: `migraciones/migrar-pruebas.html?modo=real`) · **F8 reglas por empresa incluidas en `firestore.rules`** (desplegar antes de activar) · F9 dominios/DNS futura · cierre/go-live con la tabla §5.

---

## 1. Mapeo colección por colección (17)

Decisión de diseño: **replicar la arquitectura actual un nivel abajo** (`empresas/{eid}/…`) en lugar de desarmar los documentos-array en subcolecciones. Razón: la sincronización actual (save/mergeRemote/contador/clientes compartidos) funciona sobre documentos con arrays; replicarla por empresa es una adaptación mecánica y reversible, mientras que reestructurar a subcolecciones obligaría a reescribir todo el módulo de datos de una vez (el riesgo principal que señala el plan).

| Origen actual | Destino multiempresa | Notas |
|---|---|---|
| `panel/data` | `empresas/{eid}/panel/data` | DB del admin **de esa empresa** (cli, fac, ubi, agenda, cfg con users/sesionMin/navOrder) |
| `panel/loginbg` | `empresas/{eid}/panel/loginbg` | Fondo de login por empresa |
| `panel_public/general` | `empresas/{eid}/panel_public/general` | Productos + PUBLIC_CFG de la empresa |
| `panel_public/contador` | `empresas/{eid}/panel_public/contador` | Numeración independiente por empresa (iniciar en max(n)+1, ver simulación) |
| `panel_public/clientes` | `empresas/{eid}/panel_public/clientes` | Lista compartida admin+vendedores de la empresa |
| `vendedores/{uid}/privado/data` | `empresas/{eid}/vendedores/{uid}/privado/data` | Un vendedor puede existir en varias empresas: la identidad es global (roles), el trabajo es por empresa |
| `catalogo/{id}` | `empresas/{eid}/catalogo/{id}` | Archivos base64, espejo de IndexedDB `tj_cat_{eid}` |
| `tienda_items/{id}` + `__cfg` | `empresas/{eid}/tienda_items/…` | Productos publicados + apariencia de la tienda |
| `tienda_leads/{id}` | `empresas/{eid}/tienda_leads/{id}` | Registros de clientes de la tienda |
| `tienda_pedidos/{id}` | `empresas/{eid}/tienda_pedidos/{id}` | Pedidos |
| `galeria/{id}` | `empresas/{eid}/galeria/{id}` | Fotos |
| `chats/{id}` + `/msgs` | `empresas/{eid}/chats/…` | Chat del equipo de la empresa |
| `llamadas/{id}` + `/ice` | `empresas/{eid}/llamadas/…` | Señalización de llamadas |
| `wa_conversaciones/{phone}` | `empresas/{eid}/wa_conversaciones/…` | Bot de WhatsApp por tienda |
| `investigacion_items/{id}` | `empresas/{eid}/investigacion_items/{id}` | Investigación de productos |
| `roles/{uid}` | **global, sin cambio** | Identidad de personas: rol, nombre, paneles |
| `perfiles/{uid}`, `presencia/{uid}` | **global, sin cambio** | Avatar y presencia de personas |
| (nueva) `empresas/{id}` | metadatos: nombre, slug, logo, colores, contacto, estado, inicial | ya implementado (Fase 3) |
| (nueva) `dominios/{host}` | `{empresaId, tipo, verificado, estado}` | ya implementado; lectura pública para resolver hostname (Fase 9) |

## 2. Partición de almacenamiento local por empresa

Regla: `empLSKey(clave)` (js/empresa-contexto.js) — la empresa inicial **conserva las claves actuales** (retro-compatible); cualquier otra empresa añade sufijo `_{slug}`.

- localStorage: `tj_db` → `tj_db_{slug}`; igual para `tj_cards`, `tj_lbg`, `tj_img_kb`, `tj_tpl_min`, `tj_etq_*`, `tj_td_min`, `tj_ag_n`, `tj_voz`.
- Tienda pública: `tj_shop_cart`, `tj_shop_cli`, `tj_shop_fav`, `tj_shop_orders`, `tj_cached_cfg`, `tj_cached_items` → sufijo por empresa (el visitante de tienda2.com no debe ver el carrito de tienda1).
- IndexedDB: `tj_cat` → `tj_cat_{slug}`; `tj_loginbg` → `tj_loginbg_{slug}`.
- Claves por persona que NO se particionan: `tj_tema_{uid}`, `tj_chr_{uid}`, `tj_act`, `tj_sesmin`, `tj_cfg_tab` (preferencias del navegador).

## 3. Reglas Firestore por empresa (Fase 8 — INCLUIDAS en `firestore.rules`)

La versión desplegable ya está al final de `firestore.rules` (bloques `empresas/{eid}/…`). Diseño:
`esEmpresa(eid)` = administración global (UID maestro) o miembro declarado (`empresas/{eid}/miembros/{uid}`, uso futuro).
El árbol general de la empresa queda para `esEmpresa`; las colecciones que la tienda pública y los
vendedores usan se espejan con las mismas reglas de hoy (tienda_items lectura pública, leads/pedidos
creación anónima con esquema estricto, contador +1, clientes solo crecen, privado por UID, chats por
miembro, llamadas por participante). Desplegar ANTES de activar MULTIEMP: no cambian nada de las
rutas raíz actuales — solo habilitan el árbol nuevo.

Pendiente de diseño fino más adelante: miembro-administrador por empresa (`miembros/{uid}` con rol)
y pruebas formales de acceso cruzado (empresa A no lee empresa B).

## 4. Flujo con contexto activo (Fase 7 — IMPLEMENTADO e inerte; checklist de activación)

**Ya integrado en el panel (sin efecto mientras MULTIEMP=false):**
1. Login → identidad global (`roles/{uid}`).
2. `TJEmpresa.empActiva()` resuelve la empresa (URL `?emp=` → preferencia → inicial).
3. `fbCol(nombre)` (app.js) enruta TODAS las colecciones de negocio (panel, panel_public, vendedores, catalogo, tienda_*, galeria, chats, llamadas, wa_conversaciones, investigacion_items) a `empresas/{eid}/…` cuando la bandera esté activa; `publicRef()/privateRef()/contadorRef()/clientesRef()/LBG_DOC` y la tienda pública ya pasan por ahí. Identidad (roles/perfiles/presencia) queda global.
4. Apps externas (apps/investigacion.js) también quedan enrutadas: `__panelBridge().db` devuelve un proxy que redirige `.collection()`.
5. `saveLocal()` usa `lsk('tj_db')` = `empLSKey`; IndexedDB abre `tj_cat`/`tj_loginbg` por empresa (la inicial conserva los nombres actuales).
6. Cambio de empresa (`empActivar` con bandera activa) = recarga limpia con `?emp=`.

**Checklist de activación (Fase 7 — ejecutada 2026-10-22):**
1. ✅ Fase 6 validada (2026-10-22): copia verificada en el proyecto de pruebas + ensayo de borrado/repetición hecho (requisitos a/b/c de §6).
2. ✅ Migración REAL ejecutada y verificada (2026-10-22): `empresas/tarjeteria-jhon/…` completo en producción (17 colecciones; los ✖ de chats/llamadas en la primera verificación eran doble conteo de msgs/ice en la tabla — verificador corregido).
3. ✅ `MULTIEMP=true` (js/empresa-contexto.js) + versión de caché 20261024a — preparado y probado (suite 75/75).
4. ✅ Reglas Fase 8 desplegadas (evidencia: la escritura de la migración real fue aceptada).
5. ⏳ Tabla de pruebas de aceptación (§5) tras subir la activación.

**Notas técnicas:** `sw.js` usa redes-primero (la caché es solo respaldo sin conexión) → no requiere cambios. `js/tema.js` lee `tj_shop_theme` sin particionar (cosmético, solo tema de la tienda pública). La barra superior del panel (loginbg en Firebase Storage) queda global por ahora (Fase 9+).

## 5. Pruebas de aceptación (del plan; deben pasar ANTES de producción)

| Prueba | Resultado requerido |
|---|---|
| Abrir Tarjetería Jhon | Datos y configuración existentes; cantidades e IDs conservados |
| Crear empresa nueva | No hereda datos de otra salvo copia explícita |
| Cambiar empresa | Panel e identidad cambian; sin datos viejos visibles |
| Crear factura | Se guarda en la empresa activa y respeta SU numeración |
| Acceso cruzado | Firestore deniega entre empresas |
| Tienda por dominio | Dominio verificado carga la empresa correcta sin datos privados |
| Sin conexión/recarga | Caché, localStorage y carrito sin mezclas |
| Restauración | Se recupera la versión anterior con el procedimiento abajo |

## 6. Reversibilidad y restauración

**Cómo volver atrás en cualquier momento (sin git local):**
1. Respaldo previo completo: `Escritorio\Respaldo-premultiempresa-2026-10-21.zip` (sitio completo + copias del Escritorio). Descomprimir sobre la carpeta del sitio y volver a subir a GitHub para restaurar la web anterior.
2. Datos: el panel guarda respaldo descargable (Configuración → Respaldo) y la copia local `tj_db` no se modifica mientras `MULTIEMP=false` — esta entrega no toca datos de Firestore existentes (solo añade, si usted lo decide, metadatos en las colecciones nuevas `empresas`/`dominios`).
3. Reglas: si se despliegan y se quiere revertir, quitar los bloques `empresas`/`dominios` de firestore.rules y volver a desplegar (las colecciones quedan huérfanas pero inofensivas).
4. Al terminar cada fase futura, crear un nuevo ZIP con fecha (snapshot) antes de la siguiente.

**Criterio de arranque de Fase 6:** (a) proyecto Firebase de pruebas creado, (b) informe de simulación descargado y aprobado (0 riesgos rojos o aceptados por escrito), (c) restauración probada sobre el proyecto de pruebas.

## 7. Despliegue de las reglas (acción del administrador)

Consola Firebase → Firestore Database → Reglas → pegar el contenido de `firestore.rules` → Publicar. Hasta hacerlo, el módulo Empresas mostrará "No se pudo leer la colección empresas" (esperado y sin riesgo). Las reglas nuevas solo afectan a las colecciones `empresas` y `dominios`; el resto queda byte a byte igual.
