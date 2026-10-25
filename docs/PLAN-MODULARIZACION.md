# Plan de modularización de `js/app.js` (Fase 10)

Objetivo: dividir `js/app.js` (5.045 líneas, ~600 KB) en archivos pequeños **sin cambiar el comportamiento** y sin romper el panel ni la tienda. Se hace en pasos pequeños, uno por PR, cada uno con pruebas y reversible.

## 1. Cómo está organizado hoy `app.js`

Es **un solo script clásico** (sin bundler, sin ES modules) que `index.html` carga al final del `<body>` con `<script src="js/app.js?v=...">`. Todo vive en el ámbito global del script:

- **Cifras (antes de la extracción):** 558 `function` de nivel superior, 257 `const`, 37 `let`, 1 `var`, ~330 líneas de más de 300 caracteres y 17 de más de 1.500 (muchas funciones están en una sola línea).
- **Eventos:** desde SEG-04 casi no hay `onclick=` en el HTML: se usa delegación (`data-h-click="..."`, `data-a-click="..."`) con el registro global `__H` (líneas 1-23). Quedan ~29 `onclick=`/`onchange=` dentro de plantillas de la tienda (`shopPresetVideo`, `shopBrandSave`, `shopVideoUpload`…). Esas funciones están publicadas con `window.xxx=xxx` (15 asignaciones). **Cualquier función que se use así tiene que seguir siendo global.**
- **Estado global compartido** (los `let` de nivel superior): `DB` (todos los datos), `SES` (sesión), `vista`, `items`, `CL`/`CU` (catálogo), `CHS`/`CH` (chat), `AG` (agenda), `GAL`, `PERF`, `PRES`, `WA`, `fbDb` y otros de Firebase. Casi todo el código lee o escribe `DB`, `SES` y `fbDb`.
- **Orden de ejecución:** el archivo se ejecuta de arriba abajo una sola vez. Hay código que corre al cargar (`setInterval(reloj,...)`, `nav()`, lectura de `localStorage`, `iniciarFirebase`…) y funciones que solo se llaman después.
- **Secciones reconocibles** (por comentarios; números de línea de `main` antes de la Fase 10):

| Líneas aprox. | Sección | Acoplamiento |
|---|---|---|
| 1-30 | Delegación de eventos (`__H`), `$`, `b64ToUtf8` | `$` lo usa todo |
| 27-125 | Estado `DB`, `cardState`, tarjetas de Configuración, `save`/`saveLocal` | Alto (estado central) |
| 91-340 | Firebase: init, sincronización, contador, clientes compartidos, fotos del catálogo | Alto (`DB`, `SES`, `fbDb`) |
| 396-472 | Moneda/`uid`/`esc` y redes sociales + contacto de la tienda | Bajo (redes) |
| 473-824 | Políticas de privacidad (texto legal + registro de consentimientos) | Bajo-medio (casi todo texto) |
| 825-885 | Carrusel de destacados, saneo de documentos públicos, navegación, fechas | Medio |
| 886-1420 | Vistas del panel `R.home`, facturas, agenda, reportes, clientes | Alto |
| 1423-1717 | Mapa/ubicación de clientes, catálogo (IndexedDB) | Medio-alto |
| 1718-1965 | Descarga de modelos como imagen, TJ LIVE | Medio |
| 1966-2620 | Usuarios/PIN/permisos, respaldo, galería, llamadas WebRTC, chat, GIF, dashboard | Alto |
| 2621-3440 | Tienda virtual, transportistas, etiquetas de envío | Medio-alto |
| 3432-4160 | Página pública del cliente, anti-bot, EmailJS, comprobante | Medio-alto |
| 4162-4460 | Personalización (logos, banners), sincronización de configuración | Medio |
| 4463-5032 | Mapa de clientes (Leaflet), TJ LIVE handlers | Medio |

## 2. Riesgos al dividir (y cómo se controlan)

1. **Globales entre scripts clásicos.** Los scripts clásicos comparten un único ámbito global. Una `function` de nivel superior pasa a ser propiedad de `window`; una `const`/`let` de nivel superior es global **pero no es propiedad de `window`**, y se ve desde otros scripts clásicos por su nombre. Mover una `const` a otro script clásico mantiene esa visibilidad; convertirla en `window.x` o en módulo ES **no** es equivalente. → Se mueve **literalmente** (mismo tipo de declaración) y se prueba por nombre desde un segundo script.
2. **Declarar dos veces.** Si un símbolo `const`/`let` queda declarado en dos scripts clásicos, el segundo da `SyntaxError` y la página queda muerta. → Test que comprueba que cada símbolo movido solo se declara en un archivo.
3. **Orden de carga y TDZ.** Un `const`/`let` no se puede usar antes de su declaración (error de zona muerta temporal). El archivo nuevo se carga **antes** de `app.js` y sin `defer`/`async`/`type=module`; `defer` en unos y no en otros cambiaría el orden. Mover algo más arriba solo es seguro si no depende de nada de `app.js` al ejecutarse; las utilidades puras no dependen de nada.
4. **Scripts anteriores a `app.js`** (`empresas.js`, `marketing.js`…) usan `typeof esc==='function'` dentro de funciones que se ejecutan después de cargar todo, por lo que no cambian. Por eso el archivo nuevo se coloca **justo antes de `app.js`** y no más arriba: así esos scripts ven exactamente el mismo estado que antes cuando se cargan.
5. **`onclick` en línea.** Las pocas funciones llamadas desde HTML (`shop*`) deben seguir siendo globales. No se mueven hasta que cada una tenga su `window.x=x` verificado por test.
6. **Tests que leen `app.js` como texto o lo ejecutan en `vm`.** Hay tests que buscan texto en `js/app.js` (`estructura-panel`, `reglas-firestore`, `tiktok-live`, …) y otros que lo ejecutan en una VM (`carga`, `fase7-routing`). Al mover código, el texto buscado puede quedar en otro archivo y la VM debe cargar primero los archivos nuevos. → Se actualiza cada test que lo necesite y se añaden tests nuevos.
7. **Service worker.** `sw.js` precachea `js/app.js`; el archivo nuevo debe estar en `PRE` y la caché debe subir de nombre para que los clientes descarguen los dos archivos juntos (`tj-net-first-6` → `tj-net-first-7`). Si un cliente tuviera un `index.html` nuevo con un `app.js` viejo (o al revés), podría romper: por eso el SW es *network-first* y ambos archivos cambian de `?v=` en el mismo PR.
8. **Caché del navegador.** Cada archivo lleva `?v=`; se sube el de `app.js` y el nuevo nace con su propio `?v=`.
9. **Código en una sola línea muy larga.** Cualquier corte debe hacerse en límites de sentencia; por eso se mueven líneas completas, nunca fragmentos.

## 3. Enfoque elegido

**Scripts clásicos adicionales `js/<nombre>.js`, cargados en orden explícito justo antes de `app.js`, sin ES modules todavía.**

- Preserva todos los globales (`function`, `const`, `let`) sin tocar a quien los usa.
- No requiere bundler ni cambios en el despliegue de GitHub Pages.
- Cada paso es una simple "mover líneas + registrar el archivo", fácil de revisar con `git diff` y de revertir.
- Los ES modules se dejarán para el final (si se hacen), porque obligan a `import`/`export` explícitos de cientos de símbolos y cambian el ámbito de `const`/`let`.

**Regla de cada extracción:** (1) mover literalmente, (2) un solo bloque cohesionado por PR, (3) mismo tipo de declaración, (4) archivo cargado con `?v=` y sin `defer`, (5) añadido a `PRE` de `sw.js` y caché +1, (6) tests actualizados y nuevos, (7) prueba de humo en navegador (login, tienda, y panel con usuarios de prueba) comparando capturas antes/después.

## 4. Primera extracción (hecha en este PR): `js/utils.js`

Se movieron **8 símbolos** de utilidades puras, literalmente y sin reescribir lógica:

| Símbolo | Tipo | Qué hace | Usos en `app.js` |
|---|---|---|---|
| `$` | `const` flecha | `document.getElementById` | ~640 |
| `$$` | `const` flecha | formatea moneda (`'$'+n.toFixed(2)`) | ~100 |
| `esc` | `const` flecha | escapa HTML (anti-XSS) | ~430 |
| `uid` | `const` flecha | genera ids | ~25 |
| `fdate`, `ymd`, `hoy` | `const` flecha | fechas `dd/mm/aaaa` y `aaaa-mm-dd` | ~85 |
| `b64ToUtf8` | `function` | base64 → texto UTF-8 (hoy sin usos; se conserva) | 0 |

Por qué este bloque: no toca `DB`, `SES` ni Firebase; no tiene estado propio; es lo más usado de `app.js`, así que **cualquier error saldría de inmediato** en las pruebas de humo (un riesgo de detección rápida, no oculto); y deja la base para que los siguientes archivos usen `esc`/`$`/`$$` sin depender de `app.js`.

- Las `const` siguen siendo globales de script (no propiedades de `window`), igual que antes; `b64ToUtf8` sigue siendo `function` (propiedad de `window`).
- `index.html`: `js/utils.js?v=modulos-fase-10a` se carga justo antes de `js/app.js` (que pasa a `?v=tiktok-live-20261027c`). `uber-nav.js` y `a11y.js` siguen después.
- `sw.js`: `js/utils.js` en `PRE` y caché `tj-net-first-7`.
- `app.js`: 5.045 → 5.040 líneas (se movieron 5 líneas, que son las más usadas).
- **Cómo revertir:** revertir el PR (devuelve las 5 líneas a `app.js`, quita `utils.js` y el `<script>`).

## 5. Siguientes extracciones (de menor a mayor riesgo)

Las estimaciones son de trabajo de un PR con pruebas y prueba de humo (no incluyen el tiempo de revisión del usuario).

| # | Bloque | Archivo sugerido | Líneas aprox. | Riesgo | Estimación |
|---|---|---|---|---|---|
| 1 | Saneo de documentos públicos: `SAFE_ID`, `sTxt`, `sNum`, `sanLead`, `sanPed`, `sanGal`, `sanEnv` (hoy `sanEnv` está en otro lugar, ~L3012) | `js/sanear.js` | ~30 | Bajo (puro; seguridad: ya hay tests) | 1 PR corto |
| 2 | Redes sociales y contacto: `RED_DEF`, `RED_HOST`, `RED_SVG`, `redUrl`, `redesLista`, `contLimpio`… (excluir `RS_DRAFT`, que es estado de la pantalla) | `js/redes.js` | ~70 | Bajo | 1 PR |
| 3 | Textos legales: `TJ_POLITICAS` y helpers de evidencia | `js/politicas.js` | ~350 | Bajo-medio (usa getters de la empresa activa) | 1 PR |
| 4 | Formateo y utilidades de catálogo (`fmtKB`, `tam`, `ext`, `shopN`…) | `js/utils.js` (ampliar) | ~20 | Bajo | 1 PR corto |
| 5 | Etiquetas de envío (dibujo en canvas/PDF) | `js/etiquetas.js` | ~500 | Medio (usa `DB` y pedidos) | 1-2 PR |
| 6 | Directorio de transportistas | `js/transportistas.js` | ~200 | Medio | 1 PR |
| 7 | Compresión de GIF y perfiles/emojis | `js/gif-perfil.js` | ~100 | Medio | 1 PR |
| 8 | Llamadas de voz (WebRTC) | `js/llamadas.js` | ~75 | Medio-alto (estado `LL`, Firestore) | 1 PR + prueba manual con 2 usuarios |
| 9 | Mapa de clientes (Leaflet) | `js/mapa.js` | ~570 | Medio-alto | 1-2 PR |
| 10 | Chat interno | `js/chat.js` | ~150 | Alto (estado `CH`, `CHS`, Firestore en tiempo real) | 1-2 PR + prueba manual |
| 11 | Tienda pública y personalización | `js/tienda.js` | ~1.500 | Alto (`onclick`, `window.x`, mucho estado) | 3+ PR |
| 12 | Vistas del panel `R.*`, facturas, agenda, Firebase/sync, sesión | `js/panel-*.js`, `js/sync.js` | ~2.500 | Muy alto (estado central `DB`/`SES`) | Al final; solo con más pruebas |

Después de los primeros cuatro, `app.js` bajaría a ~4.500 líneas sin tocar nada delicado. Dividirlo "a la mitad" exige los pasos 5 a 11, que sí tocan estado compartido y requieren pruebas manuales con usuarios.

## 6. Verificación usada en cada extracción

- `npm test` (todo en verde, incluido `tests/modularizacion.test.js`).
- `node --check` en todos los `.js`.
- Prueba de humo con Chrome headless: sin `pageerror` ni `ReferenceError`, login visible, tienda `?tienda=1` visible, capturas antes/después idénticas (escritorio y móvil).
- Panel de prueba (`tarjeteria-jhon-prueba`) con admin y vendedor: entra y carga sin errores.

## 7. Fase 11: extracciones 1 a 4 (un commit por extracción)

Misma regla de la Fase 10: se mueven líneas completas, literalmente, a scripts clásicos que se cargan **después de `js/utils.js` y antes de `js/app.js`**; las `const` siguen siendo globales de script y las `function` siguen siendo propiedades de `window`. La caché del service worker sube a `tj-net-first-8` y `app.js` pasa a `?v=modulos-fase-11x`. `tests/helpers/app-fuentes.js` hace que los tests que buscan texto del panel lean `app.js` más los archivos extraídos. `tests/modularizacion-fase11.test.js` es una tabla única (existencia, compilación, declaraciones, sin duplicados, orden en `index.html`, precaché, resolución por nombre y comportamiento).

### Extracción 1: `js/sanear.js` (hecha)

`SAFE_ID`, `sTxt`, `sNum`, `sanLead`, `sanPed`, `sanGal` y `sanEnv` (esta última estaba ~2.100 líneas más abajo, junto a las etiquetas de envío). Solo dependen entre sí; no tocan `DB`, `SES` ni Firebase. `sanPed` llama a `sanEnv` al ejecutarse (no al cargar), y ambas viven ahora en el mismo archivo. 25 líneas movidas.

### Extracción 2: `js/redes.js` (hecha)

`RED_DEF`, `RED_HOST`, `RED_SVG`, `CONT_DEF`, `redUrl`, `contLimpio` y `redesLista`: la validación y limpieza de las redes sociales y los datos de contacto (solo reglas y datos). Se **quedó en `app.js`** el estado de la pantalla (`RS_DRAFT`, `RS_MSG`, que es un `let` mutable), el CSS, `redLink` y todo lo que dibuja (`shopRedes`, `shopContacto`, `redesCard`, `redesFill`, `redesGuardar`). 34 líneas movidas.

### Extracción 3: `js/politicas.js` (hecha)

Textos legales y registro de consentimientos: `TJ_POLITICAS` (con getters que se evalúan al usarse) y las 8 funciones `shopPoliticas`, `poliVerEvidencia`, `poliImprimirEvidencia`, `poliCopiarEvidencia`, `poliVerRegistroAuditoria`, `poliExportarCSV`, `poliCopiar` y `poliAdmCard`. 315 líneas (el bloque completo, de comentario a comentario). Por qué es seguro mover también las funciones: a nivel superior solo hay declaraciones (un test lo comprueba línea por línea); usan `DB`, `SES`, `nombreNegocio`, `shopM`, `_ha` y `esc`, pero **solo al ejecutarse**, y los botones las llaman con `data-h-click="call"` → `window[nombre]`, que sigue funcionando porque siguen siendo `function` globales. Nota: `TJ_POLITICAS` hoy no tiene ningún uso en el código (solo se declara); se movió igual, sin borrarla.

### Extracción 4: ampliar `js/utils.js` (hecha)

`ext`, `tam`, `shopN` (`const`) y `fmtKB` (`function`), 4 líneas movidas al final de `js/utils.js` (`?v=modulos-fase-11d`). Comprobado: ningún otro script declara esos nombres a nivel superior (hay un `const tam` local dentro de `etqGenerar` y un `var tam` dentro de una función de la migración; son variables locales y no chocan con la global). `tam` y `fmtKB` se parecen pero redondean distinto (mínimo 1 KB en `tam`); se conservan las dos tal cual, sin unificarlas.

### Qué NO se movió en la Fase 11 (a propósito)

- `RS_DRAFT` y `RS_MSG` (`let` mutables, estado de la pantalla de redes): se quedan en `app.js`.
- `redLink`, `shopRedes`, `shopContacto`, `redesCard`, `redesFill`, `redesGuardar` y el CSS `redCss`: dibujan y escriben en `DB`/`TD`; pertenecen a la futura extracción de la tienda.
- `etqNum`, `etqEnvio` y el resto de las etiquetas de envío: siguen para la extracción 5.

### Líneas de `app.js`

5.040 (antes de la Fase 11) → 4.662 (−378): −25 (sanear) −34 (redes) −315 (políticas) −4 (utils). `js/utils.js` pasa de 12 a 19 líneas; nuevos: `sanear.js` (31), `redes.js` (41), `politicas.js` (324).

## 8. Fase 19: extracciones 6a, 7a, 12a y 13 (un commit por extracción)

Misma regla de siempre: se mueven líneas completas, **literalmente**, a scripts clásicos (sin ES modules, sin `defer`/`async`) cargados justo **antes de `js/app.js`**. Las `const` siguen siendo globales de script y las `function` siguen siendo propiedades de `window`. Criterio de esta fase: solo se mueve un bloque si se puede **demostrar** que es equivalente. Se eligieron los 4 bloques que **no usan nada de `app.js` al cargarse** (no leen `DB`, `SES`, `TD`, ni ningún `let` de `app.js`; lo que usan lo usan dentro de funciones que se ejecutan después de cargar todo).

| Extracción | Archivo | Qué se movió | Líneas movidas |
|---|---|---|---|
| 7a | `js/gif.js` | Compresor de GIF animados del perfil: `_gifMedianCut`, `_gifLZW`, `_gifEncode`, `_u8b64` (`const`), `gifComprimir` | 43 |
| 13 | `js/promo.js` | Carrusel promocional de la tienda: `PROMO_IMG`, `PROMO` (`const`) y `promoSlide` | 5 |
| 6a | `js/transportistas.js` | Directorio de transportistas (datos `FLE_DEF` y utilidades puras: `fleSanCfg`, `fleBuscar`, `fleLogo`, `fleMono`…), con las marcas `/*FLE-INI*/ … /*FLE-FIN*/` | 60 |
| 12a | `js/etiquetas.js` | Motor de etiquetas de envío: `ETQ_TAM`, `C128`, `code128B`, `etqTxt`, `etqBarras`, `etqFlow`, `etqDibujar`, `etqPDF`, con las marcas `/*ETQ-INI*/ … /*ETQ-FIN*/` | 80 |

Cada archivo empieza con un comentario de 3 líneas (fase, qué contiene, por qué es seguro); el resto es idéntico al original.

### Cómo se comprobó que es equivalente
1. **Movimiento literal:** un script compara `main` con la rama: cada bloque aparece **contiguo y una sola vez** en el `app.js` de `main`, y `app.js` nuevo es exactamente `app.js` de `main` menos esos 4 bloques (188 líneas). Nada se reescribió.
2. **Carga en vacío:** cada archivo nuevo se ejecuta en un contexto `vm` vacío sin error (no depende de `app.js` al cargar).
3. **Tests (`npm test`):** `tests/modularizacion-fase11.test.js` ahora cubre los 8 archivos extraídos (existen, compilan, solo declaraciones, ningún símbolo declarado dos veces, orden de carga en `index.html`, precaché del SW, resolución desde otro script); `tests/carga.test.js` carga todos los archivos extraídos antes de `app.js`; `tests/modularizacion-fase19.test.js` añade las comprobaciones propias de esta fase (marcas, orden, PRE, cabeceras, líneas).
4. **Chrome real, funciones:** `tests/navegador/funcional-fase19.js` ejecuta en la página, con entradas fijas, `promoSlide`, `fleSanCfg`, `fleBuscar`, `fleLogo`, `etqDatos`+`etqPDF` (los 6 tamaños de rollo/hoja, comparando el contenido del PDF byte a byte salvo fecha e ID), `code128B`, `_gifEncode` y `gifComprimir` (con un GIF real y `ImageDecoder`). Las huellas son **idénticas** entre `main` y la rama, como administrador y como vendedor.
5. **Chrome real, recorrido:** `recorrido.js` + `comparar.py` (todas las pantallas de administrador y vendedor, escritorio y móvil 390×844, y tienda pública): sin consola, CSP ni errores de página nuevos.

### Líneas de `app.js`
| | Líneas | Bytes |
|---|---|---|
| `main` antes de la Fase 19 | 4.647 | 578.060 |
| Después de la Fase 19 | 4.459 (−188) | 556.932 (−21.128) |

Archivos nuevos: `gif.js` (46 líneas), `promo.js` (8), `transportistas.js` (63), `etiquetas.js` (83).

### Qué NO se movió en la Fase 19 (a propósito) y por qué
- **Perfil y emojis (`PERF`, `PF`, `EMO` y su pantalla):** son `let` mutables compartidos con la pantalla y con el código de GIF (`_perfLeer` escribe en `PF`). Moverlos cambiaría quién declara esos `let`; se deja para cuando se mueva toda la pantalla de perfil junta.
- **Llamadas de voz (WebRTC, estado `LL`, Firestore):** necesitan una prueba manual con dos usuarios reales que aquí no se puede hacer.
- **Interfaz de transportistas (`/*FLE-UI-INI*/`) e interfaz de etiquetas (`/*ETQ-UI-INI*/`):** leen y escriben `DB`, `TD` y el DOM al ejecutarse y usan `let` de pantalla; se moverán con la tienda.
- **`etqDatos`, `etqEnvio`, `etqNum`, `fleNotaEnv`:** dependen de `DB`/`TD` (se quedan en `app.js`).
- **Tienda, chat, mapa, vistas del panel, sincronización:** riesgo alto o muy alto (estado central); no se tocan sin pruebas manuales.

### Cómo revertir
Revertir el PR (devuelve las 188 líneas a `app.js`, quita los 4 archivos y sus `<script>`, y vuelve la caché del SW a `tj-net-first-14`). Para revertir una sola extracción, `git revert` de su commit.

## 9. Fase 21: extracciones 1 a 4 (un commit por extracción)

Misma regla de las fases 11 y 19: se mueven líneas completas, **literalmente**, a scripts clásicos (sin ES modules, sin `defer`/`async`) cargados justo **antes de `js/app.js`**, en este orden: `mapa-clientes.js`, `fondo-login.js`, `dashboard-vendedor.js`, `plantillas-factura.js` (después de `etiquetas.js`). Solo se movió un bloque si se pudo **demostrar** que es equivalente: son bloques contiguos formados únicamente por declaraciones (`function` y `const`) que **no leen nada de `app.js` al cargarse** (un análisis del árbol sintáctico con `acorn` no encontró ninguna referencia a símbolos de fuera del bloque fuera de cuerpos de funciones).

| # | Archivo | Qué se movió | Líneas |
|---|---|---|---|
| 1 | `js/mapa-clientes.js` | Mapa de clientes: `MC`, `MC_VACIO`, `mcTieneLoc` (`const`) y las funciones `mc*` (selector del formulario, filtros, mapa general, tarjeta del Inicio) | 155 |
| 2 | `js/fondo-login.js` | Fondo personalizado del inicio de sesión: `LBG`, `LBG_PRE`, `LBG_DEF`, `lbgMeta`, `lbgSave`, `lbgFill`, `lbgApply`… | 27 |
| 3 | `js/dashboard-vendedor.js` | Dashboard por vendedor: `VD`, `MESC`, `VDP`, `vdOwn`, `vdIni`, `vdStats`, `vdBars`, `vdHTML`, `vdAdmHTML`, `vdShare*`… | 42 |
| 4 | `js/plantillas-factura.js` | Plantillas de factura, sello de estado y visor: `TPLS`, `VF`, `facTpl`, `facEstado`, `facSello`, `tplCard`, `tplRef`, `tplSet`, `tplPrev`, `vfFit`, `vfZoom`, `vfMax`, `verFactura`, `verTpl`, `facCobrar` | 32 |

Cada archivo empieza con un comentario de 3 líneas (fase, qué contiene, por qué es seguro); el resto es idéntico al original. Los comentarios que explicaban cada bloque viajan con él.

### Dos detalles que se comprobaron a propósito
- **`tplCard`:** `app.js` lo usa AL CARGARSE (`const _tc0=tplCard;tplCard=function…`). Funciona porque `plantillas-factura.js` carga antes que `app.js` (y se corrigió `tests/fase7-routing.test.js`, que cargaba una lista fija de scripts). Mover un bloque más temprano nunca crea una zona muerta (TDZ); mover el que usa algo de `app.js` sí podría, por eso solo se movieron bloques que no usan nada al cargarse.
- **`lsk` en `fondo-login.js`:** `lbgMeta` y `lbgSave` llaman a `lsk()` (definida en `app.js`) pero solo dentro de funciones flecha que se ejecutan después de cargar todo. `tests/arreglos-fase14.test.js` ahora lo permite solo para ese archivo y exige que cargue en un contexto vacío sin error.

### Cómo se comprobó que es equivalente
1. **Movimiento literal:** `node tests/navegador/verificar-movimiento-literal.js` (contra `origin/main`): cada bloque aparece contiguo y una sola vez en el `app.js` de `main`, y el `app.js` nuevo es exactamente el de `main` menos esos 4 bloques (256 líneas). Nada se reescribió.
2. **Carga en vacío:** cada archivo se ejecuta en un contexto `vm` vacío sin error.
3. **Tests (`npm test`, 217 pasan):** `tests/modularizacion-fase21.test.js` (cabeceras, orden en `index.html`, precaché del SW, nada declarado dos veces, resolución con los 4 cargados, comportamiento de `mcTieneLoc`, `vdOwn`, `facTpl`, `lbgMeta`); los de fase 11 y 19 siguen pasando; cada commit pasa los tests por separado.
4. **Chrome real, funciones:** `tests/navegador/funcional-fase21.js` ejecuta en la página, con una base de datos de ejemplo solo en memoria, las funciones movidas (plantillas, estados y sellos de factura, tarjeta de plantillas, visor con zoom y maximizar; filtros y buscador del mapa de clientes, marcadores, tarjeta de Inicio; estadísticas, barras, HTML y resumen del dashboard en los 5 periodos, vista de administrador; fondo del inicio de sesión: presets, metadatos, imagen, video y degradados) e imprime huellas SHA-256. Resultado: **huellas idénticas entre `main` y la rama** como administrador y como vendedor, en escritorio (1366×900) y móvil (390×844), servidas desde el mismo origen (si se sirven desde puertos distintos cambian 6 huellas, porque el enlace de la tienda que sale en el dashboard incluye el puerto).
5. **Chrome real, recorrido:** `recorrido.js` + `comparar.py` (todas las pantallas de administrador y vendedor, escritorio y móvil, y la tienda): sin consola, CSP ni errores de página nuevos; mismos textos de pantalla.

### Líneas de `app.js`
| | Líneas | Bytes |
|---|---|---|
| `main` antes de la Fase 21 | 4.459 | 556.932 |
| Después de la Fase 21 | 4.203 (−256) | 522.136 (−34.796) |

Archivos nuevos: `mapa-clientes.js` (158 líneas), `fondo-login.js` (30), `dashboard-vendedor.js` (45), `plantillas-factura.js` (35).

### Qué NO se movió en la Fase 21 (a propósito) y por qué
Se respetó el máximo de 4 extracciones por fase. El análisis encontró solo bloques pequeños más que cumplen la misma regla (p. ej. `shopPhotoUpload`/`shopLogoUpload`/`shopVideoUpload`, 12-13 líneas cada uno, y el código de TJ LIVE, ~39 líneas, que lee `lsk` y `DB` en funciones); son parte de la tienda y de TJ LIVE y se dejan para moverlos junto con su pantalla (son los que más se beneficiarían de una prueba manual tuya). El resto del archivo tiene alguna de estas características y **necesita una prueba manual tuya** antes de moverlo:
- **Llamadas de voz (WebRTC, estado `LL`):** hacen falta dos usuarios reales con micrófono. Qué probar: llamar, contestar, rechazar, colgar, llamada perdida, con dos navegadores distintos.
- **Perfil y emojis (`PERF`, `PF`, `EMO`):** son `let` compartidos con la pantalla y con el compresor de GIF. Qué probar: cambiar foto/GIF/emoji de perfil y que se vea en chat y menú tras recargar.
- **Chat (listeners de Firestore, `fitChat`, mensajes y avisos con voz):** tiempo real entre dos usuarios. Qué probar: enviar/recibir texto, imagen y archivo; grupo; avisos.
- **Tienda pública (estado `SH`, efectos de temporada, audio, carrito, pedidos):** muchos `let` mutables y efectos que solo se ven en un navegador real. Qué probar: temporada (Navidad/Panamá), «Escuchar», carrito y envío de un pedido de prueba.
- **Interfaz del mapa (`R.mapa`, mapas de ubicaciones, Mapa Central):** `R.mapa=` modifica la tabla de vistas `R` y los mapas usan Leaflet y ubicación real. Qué probar: abrir cada mapa en escritorio y celular, marcar una ubicación, filtros.
- **Interfaz de transportistas y de etiquetas (`FLE-UI`, `ETQ-UI`), `etqDatos`/`etqEnvio`:** usan `DB`, `TD` y el DOM al ejecutarse. Qué probar: imprimir una etiqueta real en cada tamaño de rollo.
- **TJ LIVE, sincronización, vistas del panel (`R.*`), `authUI`/`ir` y sus wrappers:** estado central; no se tocan sin pruebas manuales.

### Cómo revertir (Fase 21)
Revertir el PR (devuelve las 256 líneas a `app.js`, quita los 4 archivos y sus `<script>`, y vuelve la caché del SW a `tj-net-first-16`). Para revertir una sola extracción, `git revert` de su commit (empezando por la última: las 4 tocan `index.html` y `sw.js` en líneas contiguas).

## 10. Fase 23: extracciones 1 a 5 (un archivo por bloque)

Misma regla de las fases 11, 19 y 21: líneas completas movidas **literalmente** a scripts clásicos (sin ES modules, sin `defer`/`async`) cargados justo **antes de `js/app.js`**, después de `plantillas-factura.js`, con `?v=modulos-fase-23a`. Caché del service worker `tj-net-first-19` → `tj-net-first-20`. Los 5 se eligieron con un análisis del árbol sintáctico (`acorn`): son solo declaraciones (`function`, `const` y los `window.x=x` que las publican) cuyas referencias al cargarse son únicamente a navegadores/otros scripts previos o a ellas mismas, y cuyo nombre no está declarado en ningún otro sitio. Se **evitaron** WebRTC, chat, TJ LIVE y presencia.

| # | Archivo | Qué se movió | Líneas |
|---|---|---|---|
| 1 | `js/agenda-alertas.js` | Avisos de la Agenda: `AGSND` (const), `agSound`, `cfgSnd`, `agPerm`, `agToast`, `agAlert`, `agTest`, `agCheck` | 14 |
| 2 | `js/tienda-config-medios.js` | Controles de la configuración de la tienda: `shopCfgBgTypeSet`, `shopCfgColorSet`, `shopCfgMotionSet`, `shopCfgWmSet`, `shopPhoto*`, `shopVideo*`, `shopPresetVideo`, `shopLogo*` (con su `window.x=x`) | 98 |
| 3 | `js/tienda-copia-local.js` | Copia local del catálogo de la tienda: `shopCacheItems` (+ su comentario de la Fase 20 y `window.shopCacheItems`) | 30 |
| 4 | `js/tienda-temas.js` | `TEMAS`, `temaOf`, `temaMeta`, `KI`, `kico` (const) y el `Object.assign(KI,…)` que completa los iconos | 23 |
| 5 | `js/comprobante-pedido.js` | Comprobante del pedido: `shopPdfPrint`, `shopPdf`, `shopPdfVer` y `shopRecCanvas`, `shopImgVer` (dos bloques separados en `app.js`, marcados con `---- bloque 2` en el archivo) | 68 |

Los archivos nuevos empiezan con una cabecera de 3 líneas (fase, contenido, por qué es seguro). `js/agenda-alertas.js` no incluye los `setInterval(agCheck…)`/`setTimeout(agCheck…)` que lo ponen en marcha: siguen en `app.js`.

### Cómo se comprobó que es equivalente
1. **Movimiento literal:** `node tests/navegador/verificar-movimiento-literal-23.js <rama-base>`: cada bloque aparece contiguo y una sola vez en el `app.js` de la base y el `app.js` nuevo es exactamente el de la base menos esas 233 líneas.
2. **Carga en vacío y resolución:** `tests/modularizacion-fase23.test.js` (cabeceras, orden en `index.html`, precaché del SW, nada declarado dos veces, `window.x` publicadas, comportamiento de `temaOf`/`temaMeta`/`kico`, `shopCacheItems`, `agCheck`). Se actualizaron los tests que cargaban una lista fija de scripts (`fase7-routing`) o leían `app.js` como texto (`hallazgos-fase20`, `onclick-fase15`, `arreglos-fase14`).
3. **Chrome real, funciones:** `tests/navegador/funcional-fase23.js` ejecuta en la página (copia de prueba, usuario administrador, datos solo en memoria, `AudioContext`/`Notification`/`window.open` sustituidos por dobles) todas las funciones movidas: temas, iconos, copia local con 63 fotos, sonidos y avisos de la Agenda, controles de la configuración con un DOM de ejemplo y subidas de archivos reales (foto, video, logo, con sus avisos de tamaño y tipo), comprobante (ventana de impresión, PDF con visor, imagen). Las huellas SHA-256 son **idénticas entre `main` y la rama** servidas desde el mismo origen (`node tests/navegador/copia-prueba.js` prepara cada copia).
4. **Chrome real, recorrido:** `recorrido.js` + `comparar.py` (18 pantallas de administrador y 7 de vendedor y la tienda): mismos textos, sin errores de página ni CSP nuevos.
5. **Tienda y pedido:** `tienda-fase23.js` (geometría de la tienda: contenedor alto, pie al final) y `tienda-pedido-fase23.js` en escritorio y móvil.

### Líneas de `app.js`
| | Líneas | Bytes |
|---|---|---|
| `main` antes de la Fase 23 | 4.233 | 524.368 |
| Después | 4.000 (−233) | 501.208 (−23.160) |

### Qué NO se movió y por qué
Llamadas de voz (WebRTC, `LL`), chat, presencia (`PRES`), TJ LIVE, perfiles/emojis (`PERF`/`PF`/`EMO`), el estado `SH`/`TD` de la tienda y las vistas `R.*`: comparten estado mutable central o dependen de dos usuarios reales. Siguen necesitando prueba manual antes de moverse.

### Cómo revertir
Revertir el PR (devuelve las 233 líneas a `app.js`, quita los 5 archivos y sus `<script>`, y vuelve la caché del SW a `tj-net-first-19`).
