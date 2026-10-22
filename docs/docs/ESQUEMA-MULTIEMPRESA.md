# Esquema multiempresa definitivo — TARJETERIA-JHON

Fecha: 2026-10-21 · Estado: **Fases 1-5 completas · Fase 6 lista para ejecutar · Fase 7 implementada pero INACTIVA (MULTIEMP=false)**. La activación real exige: proyecto Firebase de pruebas validado con la herramienta de la Fase 6 + informe aprobado + pruebas de aceptación en verde (ver checklist en §4).

Empresa inicial: `tarjeteria-jhon` (id estable; ver `js/empresa-contexto.js`).

**Estado de fases:** F1 diagnóstico ✅ · F2 respaldo ✅ · F3 módulo Empresas ✅ · F4 contexto ✅ · F5 simulación ✅ · **F6 herramienta de migración de prueba lista** (`migraciones/migrar-pruebas.html`, guía en `docs/FASE6-MIGRACION-PRUEBAS.md`) · **F7 código integrado e inerte** (`fbCol`/`lsk` enrutan TODO el panel, apps externas incluidas vía proxy del puente; se activa cambiando `MULTIEMP=false` → `true` en `js/empresa-contexto.js`, línea 11) · F8 reglas objetivo redactadas (§3; se despliegan al activar) · F9 dominios/DNS futura · el cierre/go-live con la tabla §5.

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

## 3. Reglas Firestore objetivo (Fase 8 — borrador)

```
function esEmpresa(eid) {
  // administración global (UID maestro) o miembro declarado de la empresa
  return isAdmin() ||
         exists(/databases/$(database)/documents/empresas/$(eid)/miembros/$(request.auth.uid));
}
match /empresas/{eid}/{document=**} {
  allow read, write: if isAdmin() || esEmpresa(eid);
}
match /empresas/{eid}/tienda_items/{document=**} {
  allow read: if true;              // catálogo público
  allow write: if esEmpresa(eid) && request.auth.token.admin == true;
}
match /dominios/{host} { allow read: if true; allow write: if isAdmin(); }
// roles/perfiles/presencia: como hoy (identidad global)
```

Pendiente de diseño fino en la Fase 8: esquemas estrictos por colección (como los actuales de `tienda_leads`/`tienda_pedidos`), miembro-administrador por empresa (`miembros/{uid}` con rol), y pruebas de acceso cruzado (empresa A no lee empresa B).

## 4. Flujo con contexto activo (Fase 7 — IMPLEMENTADO e inerte; checklist de activación)

**Ya integrado en el panel (sin efecto mientras MULTIEMP=false):**
1. Login → identidad global (`roles/{uid}`).
2. `TJEmpresa.empActiva()` resuelve la empresa (URL `?emp=` → preferencia → inicial).
3. `fbCol(nombre)` (app.js) enruta TODAS las colecciones de negocio (panel, panel_public, vendedores, catalogo, tienda_*, galeria, chats, llamadas, wa_conversaciones, investigacion_items) a `empresas/{eid}/…` cuando la bandera esté activa; `publicRef()/privateRef()/contadorRef()/clientesRef()/LBG_DOC` y la tienda pública ya pasan por ahí. Identidad (roles/perfiles/presencia) queda global.
4. Apps externas (apps/investigacion.js) también quedan enrutadas: `__panelBridge().db` devuelve un proxy que redirige `.collection()`.
5. `saveLocal()` usa `lsk('tj_db')` = `empLSKey`; IndexedDB abre `tj_cat`/`tj_loginbg` por empresa (la inicial conserva los nombres actuales).
6. Cambio de empresa (`empActivar` con bandera activa) = recarga limpia con `?emp=`.

**Checklist de activación (sesión futura, en este orden):**
1. Fase 6 validada: copia verificada en el proyecto de pruebas (todo verde) + ensayo de borrado/repetición hecho (requisitos a/b/c de §6).
2. Agregar el botón de migración REAL a la herramienta (escribe `empresas/tarjeteria-jhon/…` en PRODUCCIÓN; aditivo, sin tocar rutas actuales) y ejecutarlo.
3. Cambiar `MULTIEMP=false` → `true` en `js/empresa-contexto.js` (una línea) y subir a GitHub.
4. Desplegar las reglas objetivo de §3 (Fase 8) en la consola.
5. Ejecutar la tabla de pruebas de aceptación (§5) y crear ZIP con fecha.

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
