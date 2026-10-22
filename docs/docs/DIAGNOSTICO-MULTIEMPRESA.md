# Diagnóstico multiempresa — TARJETERIA-JHON (Fase 1 del plan)

Fecha: 2026-10-21 · Estado: inventario de solo lectura. **No se modificó producción.**

Proyecto Firebase: `tarjeteria-jhon` (config en `js/app.js`, línea 90).
UID de administrador fijo: `js/app.js:107` y `firestore.rules:15` (`o7bHndKtswSHreFnVwORqBSUKL43`).

---

## 1. Colecciones Firestore (17 + 1 solo en reglas)

### panel_public — datos comunes a todos los roles
| Documento | Uso | Escritura |
|---|---|---|
| `panel_public/general` | Productos + configuración compartida para facturar `{prod, cfg:PUBLIC_CFG, _ts}` (app.js:128) | admin |
| `panel_public/contador` | Contador único de numeración de facturas `{sig}`, reserva por transacción (app.js:191) | admin y vendedores (+1) |
| `panel_public/clientes` | Lista compartida de clientes `{cli:[], _ts, mig}`, fusión por id en transacción (app.js:219) | admin y vendedores (solo agregar) |

### panel — solo administrador
| Documento | Uso |
|---|---|
| `panel/data` | **DB completo del admin**: `{cli, fac, ubi, agenda, cfg (incluye users, sesionMin, navOrder), _ts}` (app.js:129) |
| `panel/migracion_roles_v1` | Marca de la migración que repartió facturas por vendedor (app.js:293) |
| `panel/loginbg` | Fondo de la pantalla de login `{mode, kind, url, img, dim, blur, ts}` (app.js:4069) |

### vendedores
| Ruta | Uso |
|---|---|
| `vendedores/{uid}/privado/data` | Datos privados de cada vendedor `{cli, fac, ubi, agenda, cfg:PUBLIC_CFG, _ts}` (app.js:129) |

### Catálogo y tienda pública
| Colección | Uso |
|---|---|
| `catalogo/{id}` | Archivos del catálogo con imagen en base64 ≤ ~700 KB (app.js:351) |
| `tienda_items/{id}` | Productos publicados en la tienda (app.js:3363) |
| `tienda_items/__cfg` | Config. de apariencia de la tienda: tema, paleta, wordmark, hero*, logo, redes, contacto, fletes, base, build, rev (app.js:804, 3159) |
| `tienda_leads/{id}` | Registros de clientes desde la tienda (app.js:3452) |
| `tienda_pedidos/{id}` | Pedidos de la tienda `{id,cid,lead,items,total,nota,ref,ts,estado}` (app.js:3840) |

### Comunicación y presencia
| Colección | Uso |
|---|---|
| `galeria/{id}` | Fotos (base64) con dueño `o` (app.js:2038) |
| `chats/{id}` + `chats/{id}/msgs/{id}` | Chat directo/grupo entre admin y vendedores (app.js:2414) |
| `llamadas/{id}` + `llamadas/{id}/ice/{c}` | Señalización WebRTC de llamadas de voz (app.js:2128) |
| `perfiles/{uid}` | Avatar/emoji de cada usuario (app.js:2244) |
| `presencia/{uid}` | Estado en línea/inactivo (app.js:2266) |
| `roles/{uid}` | Rol y paneles permitidos `{rol, n, email, panels}` (app.js:4013) |
| `wa_conversaciones/{phone}` | Conversaciones del bot de WhatsApp (app.js:4145) |
| `investigacion_items/{id}` | **Solo en reglas** (firestore.rules:181); su consumidor es `apps/investigacion.html`, no presente en esta carpeta local |

## 2. Claves localStorage (30)

**Crítica**: `tj_db` (app.js:79/86) — copia completa del objeto DB en una única clave global; mezcla datos del último usuario conectado. Debe particionarse por empresa.

Globales del panel: `tj_db`, `tj_cards`, `tj_cfg_tab`, `tj_ag_n`, `tj_img_kb`, `tj_tiktok_live_draft_v1`, `tj_act`, `tj_sesmin`, `tj_sesion_note`, `tj_voz`, `tj_tpl_min`, `tj_etq_cfg`, `tj_etq_env`, `tj_td_min`, `tj_lbg`.
Por usuario: `tj_tema_{uid}`, `tj_chr_{chatMe()}`, `tj_cli_term_{cid}`.
Tienda pública (visitante): `tj_shop_theme`, `tj_cached_cfg`, `tj_cached_items`, `tj_shop_cart`, `tj_shop_rl`, `tj_shop_cli`, `tj_shop_fav`, `tj_shop_orders`.

## 3. IndexedDB (2 bases)

- `tj_cat` (store `f`) — catálogo completo local con blobs; Firestore `catalogo` es el espejo (app.js:1514).
- `tj_loginbg` (store `f`, clave `'bg'`) — blob del fondo de login (app.js:4035).

Ambas son únicas por navegador → particionar por empresa en la migración.

## 4. Flujo de sincronización actual

1. `save()` = `saveLocal()` (todo DB → `localStorage.tj_db`) + `syncToCloud()` (debounce 700 ms).
2. `publicRef()` = `panel_public/general`; `privateRef()` = admin → `panel/data`, vendedor → `vendedores/{uid}/privado/data`.
3. Admin escribe: su DB en `panel/data`, payload público en `panel_public/general`, devuelve facturas editadas a cada vendedor y fusiona clientes compartidos.
4. Vendedor escribe solo su doc privado + clientes compartidos; lee productos/cfg de `panel_public/general`.
5. `mergeRemote()`/`mergeVendedor()` aplican cambios remotos sobre DB local y re-guardan.
6. Contador de facturas por transacción en `panel_public/contador`.
7. Catálogo: `catalogo` (nube) ↔ `tj_cat` (IndexedDB local).

**Riesgo técnico principal (señalado por el plan):** el documento global `panel/data` y esta sincronización están diseñados alrededor de una DB central. La separación por empresa requiere esquema, migración, reglas y compatibilidad — no un cambio superficial.

## 5. Reglas Firestore — auditoría

- `isAdmin()` = UID fijo **o** `roles/{uid}.rol=='admin'`; `me()` = 'admin' o UID; `validRef(ref)` valida referencias de tienda; `chatMember(data)` para chats.
- Catch-all final `/{document=**} { allow read, write: if false }` → **toda colección no listada queda denegada**. Por eso la colección nueva `empresas` requiere bloques de reglas nuevos antes de poder escribirse.
- Escrituras restringidas quirúrgicamente: vendedor solo puede cambiar `imp` (leads) o `estado` (pedidos) de lo suyo; clientes solo crecer; contador +1.

## 6. Módulos y archivos

- `js/app.js` (~5.900 líneas): todo el negocio, vistas (`R`), menú (`V`), roles (`esAdmin/esVend/puede`), tienda pública y panel.
- `js/facturacion.js` (74 líneas): cálculos puros, sin persistencia (testeable en Node).
- `js/inicio.js` (6 líneas): anti-clickjacking + `window._tjw`.
- `js/tema.js` (22 líneas): tema pre-pintado de la tienda (lee `tj_shop_theme`).
- `apps/` no existe en la copia local: `modelos` e `investigacion` se cargan por `appHtml()` desde el despliegue.
- `sw.js` y `manifest.json` referenciados pero **no presentes** en la carpeta local (registro de SW falla en silencio por diseño).

## 7. Riesgos para la migración (resumen)

1. `tj_db` global mezcla contexto si no se particiona por empresa antes del cambio de contexto.
2. `panel/data` puede acercarse al límite de 1 MB por documento (validar en la simulación de la Fase 5).
3. Clientes compartidos y contador son globales → deben replicarse por empresa conservando IDs.
4. El UID de admin está fijado en código y reglas → el multiempresa debe mantenerlo como super-administrador.
5. Chats/llamadas/presencia mezclan identidad (personas) con negocio → decisión de esquema: identidad global, negocio por empresa.
