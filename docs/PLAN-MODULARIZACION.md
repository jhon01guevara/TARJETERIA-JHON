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
