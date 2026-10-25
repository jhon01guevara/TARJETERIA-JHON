# Accesibilidad (Fase 9, 15 y 18)

Objetivo: acercar la web a WCAG 2.1 AA **sin cambiar el aspecto ni la lógica**. Todo lo de esta fase es aditivo: atributos ARIA, un poco de CSS que solo se nota al usar el teclado, y un script pequeño (`js/a11y.js`). No se tocó Firebase, ni las reglas, ni los manejadores de `app.js`.

## Cómo se midió

- Auditoría estática de `index.html`, `css/`, `js/` y `apps/` (incluido el HTML que `app.js` genera con plantillas).
- axe-core 4 con Chrome headless sobre la página servida en local: pantalla de inicio de sesión (escritorio) y tienda pública `?tienda` (escritorio y móvil). El área autenticada **no** se pudo medir con axe porque requiere sesión.

| Vista | Antes (nodos) | Después (nodos) |
|---|---|---|
| Login, escritorio | 12 (2 críticos: campos sin etiqueta; 10 `region`) | **0** |
| Tienda, escritorio | 13 (2 contraste, 1 orden de encabezados, 1 nombre≠texto visible, 9 `region`) | 11 (2 contraste, 9 `region`) |
| Tienda, móvil | 12 (2 contraste, 1 encabezados, 1 región con scroll sin teclado, 8 `region`) | 10 (2 contraste, 8 `region`) |

## Qué se corrigió

**Teclado**
- Enlace «Saltar al contenido principal» (invisible hasta pulsar Tab; mueve el foco a `<main id="contenido">` sin cambiar la URL).
- `js/a11y.js` hace operables con Tab, Enter y Espacio los elementos que ya reaccionaban al clic pero no eran botones (`<div data-h-click>`: menú lateral y menú inferior, celdas de la agenda, filas del chat, tarjetas del marketing, plantillas de factura, etc.). Les pone `role="button"` y `tabindex="0"`, y Enter/Espacio llaman a `click()`, que pasa por el mismo delegador de `app.js` que el ratón. Solo actúa sobre lo que él mismo marcó (`data-a11y-kb`), así que no hay doble disparo con botones, enlaces ni campos.
- En tarjetas que ya contienen un botón propio (p. ej. «favorito» en la tienda) o en etiquetas donde ARIA no permite `button` (`<article>`), se hace operable la **imagen** de la tarjeta (con su `alt`), no el contenedor, para no anidar controles.
- `:focus-visible` con contorno azul para enlaces, selects, `summary` y elementos con `role="button"`. Solo aparece al navegar con teclado. Botones y menú ya lo tenían (`uber-skin.css`); los campos de texto conservan su resalte; la tienda conserva el suyo.

**Lectores de pantalla**
- `lang="es"` ya estaba. Menús `<nav>` con nombre («Menú principal», «Menú inferior»).
- Ventanas: `#mb` (modal del panel), `#shopm` (modal de la tienda), `#auth` (inicio de sesión) y los zooms de imagen con `role="dialog"` y `aria-modal="true"`.
- Avisos: `#ksnack` (tienda) con `role="status"`; `#agToast` (recordatorios de agenda) con `aria-live="polite"`.
- 38 botones de solo icono (🗑 ✕ ✏️ ⬇ ↑ ↓ ‹ › ➕ ↶ ↷ ⧉ 🧾) con `aria-label` («Eliminar», «Cerrar», «Mes anterior», …). Se añadió al final de los atributos para no alterar el resto.
- Login: `<label for>` real en Correo y Contraseña.
- Resto de campos con `<label>` pegada pero sin enlace: `a11y.js` les añade `aria-labelledby` (solo lee la etiqueta, no cambia su texto).
- Botón de tema de la tienda: el nombre accesible ahora incluye el texto visible («Tema Auto: cambiar tema visual») y se actualiza al cambiar de tema.
- Encabezado «Explora por ocasión»: `aria-level="2"` (sin cambiar su estilo) para no saltar de h1 a h3.
- Tablas: `th` sin `scope` reciben `scope="col"` o `"row"`.
- SVG decorativos sin título: `aria-hidden="true"`. Logos y miniaturas decorativas de documentos impresos: `alt=""`. iframes de vista previa con `title`. Botón 🗑 de `apps/modelos.html` con `aria-label`.

**Movimiento**
- `prefers-reduced-motion`: ya existían reglas en muchas partes; se añadió una capa global (animaciones y transiciones casi instantáneas y sin scroll suave) y se apaga la vibración del botón de WhatsApp. Quien no active «reducir movimiento» en su sistema no ve ningún cambio.

**Cache**
- `sw.js`: `tj-net-first-5` → `tj-net-first-6` (index.html y app.js están precacheados). `app.js` y `marketing.js` cambian su `?v=` para evitar la caché del navegador.

## Fase 15 · contrastes, ventanas modales, iframes y `onclick=`

### 1. `onclick=` sobrantes y botón «Imprimir» de la constancia legal
- **Origen de los avisos «Executing inline event handler»:** se midieron en Chrome real (observador de DOM + eventos `securitypolicyviolation`). **Todos** venían de un solo bloque: las tarjetas de **Configuración → Personalización web → portada de la tienda** (`js/app.js`, función de la portada). Eran 15 atributos (12 `onclick=` y 3 `onchange=`) y se repiten en cada pintado de la pantalla, por eso salían cientos de avisos. Ningún otro archivo (`marketing.js`, `empresas.js`, `index.html`, `apps/*`) tiene atributos en línea: lo que hay son asignaciones `el.onclick = …` por código, que la CSP **no** bloquea.
- **Por qué era seguro quitarlos:** cada uno de esos botones ya tenía al lado su `data-h-click="call"` / `data-h-change="call"` con el mismo nombre de función y los mismos argumentos, y esa función está exportada en `window` (es lo que usa el delegador `call`). La CSP bloqueaba el `onclick=`, así que hoy el único que funcionaba ya era el delegador; quitar el atributo no cambia lo que hace el botón. Se comprobó con un script que, antes de borrar cada atributo, exigía: mismo nombre, mismos argumentos y `window.<función>=`. En los 3 `onchange="…(event)"` la equivalencia es porque esas funciones, si no reciben evento, leen el `<input>` por su id.
- **Medido:** en un recorrido automático de todas las pantallas del panel (administrador, con las tarjetas de Configuración abiertas) y de la tienda pública: **144 avisos → 0**, y 15 atributos `on…=` distintos en el DOM → 0. En el uso real salían ~360 porque la pantalla de Configuración se repinta muchas veces.
- **Cierre:** `tests/onclick-fase15.test.js` falla si alguna plantilla vuelve a escribir un atributo `on…=` en línea y comprueba que cada `data-h-click="call"` apunte a una función global que existe.
- **Botón «Imprimir» de la constancia legal** (`js/politicas.js`): la ventana que se abre (`window.open('')`) hereda la CSP de la página, que bloqueaba su `onclick="window.print()"`; el botón no hacía nada. Ahora el botón no tiene `onclick`, y tras escribir el documento se le añade un `addEventListener('click', …)` que llama a `print()` de esa ventana. **No se tocó la CSP.** El `<style>` de esa ventana ya estaba permitido por hash.
- **Pendiente de este bloque:** nada en plantillas. Quedan las asignaciones por código (`el.onclick = …`, p. ej. en `apps/investigacion.js`), que no generan avisos y no conviene reescribir sin necesidad.

### 2. Contrastes (WCAG AA, 4.5:1 en texto normal)
Medido con axe-core en Chrome real sobre el panel de prueba local (administrador y vendedor, todas las pantallas, temas **claro** y **nocturno**) y la tienda pública (claro y oscuro).

| | Antes | Después |
|---|---|---|
| Nodos con contraste insuficiente | 64 (25 combinaciones distintas) | **0** |

Lo corregido, con cambios mínimos de color (`css/accesibilidad.css`, bloque «CONTRASTE (Fase 15)»):
- Textos de estado (verde «✔ Publicado» y «Sincronizado», verde/ámbar/rojo/gris del resumen del mapa, estado de sincronización de la portada): ahora usan variables `--okt`, `--warnt`, `--errt`, `--mutet`, un tono un poco más oscuro en los temas claros y más claro en «Nocturno». En `app.js` llevan color de respaldo (`var(--okt,#15803d)`).
- Etiqueta del carrusel de la portada (`#cintTag`): `#6b6b6b` → `#5c5c5c`.
- Agenda: los días de otro mes ya no se atenúan con `opacity:.45` (daba 2.9:1); ahora el número usa el gris del tema y se atenúan solo el fondo y los puntos.
- Tema Nocturno: gris secundario `--gris` `#9b9b9b` → `#a8a8a8` (`css/uber-skin.css`).
- Tienda en modo oscuro: botón «Carrito» (blanco sobre `#7c66ff` = 4.04) pasa a `#6a54f0` (5.1:1).
- Barra de la ventana «Investigación de productos»: su título salía oscuro sobre la barra oscura y el botón «Cerrar» se montaba encima del texto; ahora tiene texto claro y el mismo diseño de barra que el visor de PDF. (Era un fallo visual que ya existía.)

### 3. Ventanas modales (centralizado en `js/a11y.js`)
Un observador mira las ventanas que ya existen (`#md`/`#mb` del panel, `#shopm` de la tienda, los zooms `#kzoom` `#avzoom` `#tdzoom`, `#pdfv`, `#imgv`, `#investOv` y el login `#auth`) y les añade, sin reescribir ninguna:
- **Esc cierra** la ventana usando el mismo mecanismo que el ratón (un `click()` sobre el fondo o sobre su botón «Cerrar»), así no se salta lógica de `app.js`. `#imgv` ya se cerraba con Esc por su cuenta y no se duplica. El login no se cierra con Esc.
- **Excepción deliberada:** si ya escribiste algo en un campo de la ventana, Esc **no** la cierra (para no perder un formulario a medias); se cierra con su botón «Cancelar/Cerrar».
- **Foco atrapado:** Tab y Mayús+Tab dan la vuelta dentro de la ventana; si el foco se escapa, vuelve a entrar.
- **Foco al abrir y al cerrar:** al abrir, el foco pasa al primer control (si la app ya puso el foco dentro, se respeta); al cerrar, vuelve al elemento que abrió la ventana (si sigue en pantalla).
- **Nombre accesible:** `role="dialog"` `aria-modal="true"` y `aria-labelledby` apuntando al título de la ventana (h1–h3 o la barra del visor); si no hay título, queda un `aria-label`.
- **Visores con iframe (PDF):** el visor del navegador puede quedarse con el foco al cargar y entonces Esc no llega a la página; al terminar de cargar, el foco vuelve a la barra de la ventana.

### 4. Apps en iframes y etiquetas
- `<iframe id="checkFrame">`: `title="Check"` → `title="Check: modelos de tarjetas"` (el de Investigación y el del visor PDF ya tenían título).
- `apps/modelos.html` y `apps/investigacion.html` ya declaran `lang="es"`. Se añadió nombre accesible (`aria-label`) al selector de trabajos y a los selectores y el buscador de Investigación.
- Panel: `aria-label` en las casillas y listas de la tabla de productos de la tienda, en los tres selectores de acciones masivas y en el filtro de tipos de la agenda (axe: 0 `label` y 0 `select-name` en las pantallas recorridas).

### Qué sigue pendiente después de la Fase 15
- Esc dentro de un iframe (p. ej. escribiendo dentro de Investigación): el teclado del iframe no llega a la página padre; se cierra con el botón «Cerrar» o Tab hasta él.
- Marcas de región (`region`) y landmarks de la tienda, tablas sin `caption`, zonas táctiles pequeñas (ver tabla de arriba).
- Pruebas con lector de pantalla reales (NVDA/VoiceOver): aquí solo se comprobaron atributos ARIA y comportamiento de teclado en Chrome.
- Safari, Firefox e iOS no se probaron.

## Fase 18 · landmarks, tablas, zonas táctiles y reglas serias de axe

Medido con `tests/navegador/axe-completo.js` (axe-core 4.14: reglas WCAG 2.0/2.1/2.2 A y AA + mejores prácticas + `target-size`) sobre **todas** las pantallas del panel (admin y vendedor, 18 y 7 pantallas) y la tienda pública, en escritorio (1366×900) y móvil real emulado (390×844, `isMobile`), contra una copia local apuntada al proyecto de **prueba**.

| Regla de axe | Impacto | Antes (esc. / móvil) | Después |
|---|---|---|---|
| `label` (campos sin etiqueta: línea de factura, descuento, enlace de tienda) | crítico | 9 / 9 nodos | **0** |
| `select-name` (producto de la factura, filtro del mapa) | crítico | 3 / 3 | **0** |
| `aria-command-name` (barra inferior sin texto a ≤480 px) | serio | 0 / **348** | **0** |
| `label-title-only` (casillas con solo `title`) | serio | 15 / 15 | **0** |
| `color-contrast` (tarjetas de Inicio en móvil) | serio | 0 / 4 | **0** |
| `scrollable-region-focusable` (gráfico de ventas en móvil) | serio | 0 / 1 | **0** |
| `region` (contenido fuera de landmarks) | moderado | 9 / 8 | 1 (`#k_wa`, ver abajo) |
| `page-has-heading-one` (móvil: la barra lateral con el h1 se oculta) | moderado | 0 / 25 | **0** |
| `empty-table-header` | menor | 30 / 30 | **0** |
| `presentation-role-conflict` (imágenes `alt=""` clicables) | menor | 64 / 64 | **0** |
| `target-size` de axe | — | 0 / 0 | 0 |

**Qué se hizo**
- **Landmarks del panel:** `<aside>` con nombre («Barra lateral»), los dos `<nav>` ya nombrados, la barra de Inicio como `role="region"` con nombre y un `<h1 class="sr-only h1m">` dentro de `<main>` que solo existe en pantallas ≤820 px (en escritorio basta el h1 de la barra lateral). Cada pantalla ya tenía `<main id="contenido">`.
- **Landmarks de la tienda** (en `js/a11y.js`, función `tienda()`, sin tocar la estructura): `role="main"` en el área de filtros y resultados (`.kmain`) solo si el `<main>` del panel no se muestra; los filtros (`<aside>`) pasan a `region` («Filtros»), las secciones y menús sin nombre reciben `aria-label`, los avisos de temporada (`.kxb`) son regiones y las bandas decorativas (`.kgd`) y el confeti de Panamá se ocultan a lectores.
- **Tablas:** `aria-label` automático (el encabezado `h2/h3/summary` más cercano por encima, o el título de la pantalla), sin añadir `<caption>` para no alterar `rows`/`children` que usa `app.js`. Las cabeceras `<th>` vacías reciben un texto solo-lector («Acciones», «Seleccionar» o «Imagen» según la columna). No se toca la vista previa de facturas ni las tarjetas impresas.
- **Campos:** `aria-label` en las plantillas (líneas de factura, descuento, filtro del mapa, enlace de la tienda, casillas de etiquetas) y, de forma central, cualquier campo que solo tuviera `title` lo copia a `aria-label`.
- **Barra inferior móvil (≤480 px):** el texto de cada botón se ocultaba con `display:none` y los botones quedaban sin nombre; ahora sigue oculto a la vista pero legible. (No se usó `aria-label` en los botones porque axe exige que el nombre contenga el texto visible, p. ej. «Chat 3».)
- **Contraste en móvil:** «● En línea», «facturas este mes» y otras cifras de color de las tarjetas de Inicio usan variables de tema (`--okt`, `--warnt`, `--viot`).
- **Zonas táctiles (WCAG 2.2 · 2.5.8, 24×24 px)**, solo en ≤820 px: `summary`, títulos de tarjeta clicables y el enlace «¿Olvidó su contraseña?» con `min-height:24px`; enlaces y casillas en línea con `padding-block` (en elementos en línea no mueve el texto); casillas de etiquetas con 24 px. Controles <24 px en móvil: **43 → 14**; los 14 que quedan son los puntos del carrusel de banners de la tienda (8×8 y 22×8), que tienen una alternativa equivalente en la misma página (las flechas «Banner anterior/siguiente», de más de 24 px): excepción «equivalente» del criterio.
- **Se descubrió y se corrigió una trampa:** un `.sr-only` con `position:absolute` dentro de una celda de tabla escapaba del scroll horizontal de `.tw` y ensanchaba la página en móvil real; por eso las cabeceras usan la variante `.sr-only-th` (sin `position:absolute`). Hay una prueba que lo vigila.

**Qué sigue pendiente (no se arregló a propósito)**
- **Escritorio:** 55 controles de menos de 24 px (resúmenes `<summary>`, botones `.btn.s`, casillas de tablas, títulos plegables). Arreglarlos cambia el aspecto de escritorio, que esta fase prometía no tocar.
- `#k_wa` (botón flotante de WhatsApp de la tienda) queda fuera de un landmark (`region`, moderado): envolverlo cambiaría su posicionamiento fijo.
- Carrusel de banners: puntos de 8 px (excepción «equivalente», ver arriba).
- Decoraciones de temporada sin identificar (`#k_snow`, `#k_stars`, `#k_hearts`, `#k_conf`…) no se ocultaron a lectores por no poder comprobar cada una.
- Safari, Firefox, iOS y lectores de pantalla reales no se probaron.

## Qué quedaba pendiente tras la Fase 9 (ver arriba lo resuelto en la 15)

| Pendiente | Riesgo | Esfuerzo | Nota |
|---|---|---|---|
| ~~Contraste: texto blanco del botón «Carrito» (`.kha.pri`) y título del hero sobre fondo amarillo (tienda)~~ | Medio | Bajo | Hay que cambiar colores, así que no se tocó en esta fase. Medir también el panel (no se pudo sin sesión). **Resuelto en Fase 15 (ver abajo)** |
| Marcas de región (`region` de axe) en la tienda: no hay `<main>` ni encabezado/pie como landmarks | Medio | Medio | Poner `role="main"` en `#shop` generó otros avisos (header/footer dentro de main). Requiere reestructurar el DOM. |
| ~~Modales: cerrar con Esc, atrapar el foco dentro y devolverlo al cerrar (`#md`, `#shopm`)~~ | Medio | Medio | Es lógica nueva; un Esc accidental podría perder un formulario a medio llenar. **Resuelto en Fase 15 (ver abajo)** |
| ~~`apps/investigacion.html` (≈38 campos) y `apps/modelos.html` (≈5) sin `label`/`aria-label`~~ | Bajo | Medio | Van dentro de iframes (`srcdoc`), donde `a11y.js` no corre. Hay que editarlos a mano. **Fase 15: selectores con nombre y title en los iframes; el resto ya tenía etiqueta** |
| Elementos clicables sin texto ni título: miniaturas de la galería (`.th`), flechas de reordenar menú (`.mv i`, solo en modo edición) | Bajo | Bajo | `a11y.js` no los marca si no pueden tener nombre. Se resuelven añadiendo `aria-label`/`title` en la plantilla. |
| Título clicable de «Correos predeterminados» (`h3`) | Bajo | Bajo | Ya tiene un botón Maximizar/Minimizar equivalente. |
| Avisos con `alert()` y el estado de nube (`.cloudSt`) sin `aria-live` | Bajo | Bajo | Anunciar cada cambio de sincronización sería ruidoso. |
| Tablas sin `<caption>` ni `aria-label` | Bajo | Bajo | |
| Tamaño de zonas táctiles (varios botones `.btn.s` < 44 px) | Bajo | Medio | WCAG 2.1 AA no lo exige (sí 2.2 AA, 24 px); cambiaría el diseño. |
| Botones sin `type="button"` (~440) | — | — | No es un problema de accesibilidad y no hay `<form>`; se deja como está para no arriesgar nada. |
| Auditoría con axe del panel autenticado (admin y vendedor) | — | Bajo | Hacerla con el emulador de Firebase y un usuario de prueba, sin tocar producción. |

## Cómo probar con teclado

1. Abre la web y pulsa **Tab** una vez: aparece arriba a la izquierda «Saltar al contenido principal». Pulsa Enter: el foco salta al contenido (la URL no cambia).
2. Inicia sesión solo con teclado: Tab hasta Correo y Contraseña, Enter en «Entrar».
3. En el panel, recorre el menú lateral con **Tab**: cada opción muestra un contorno azul y se abre con **Enter** o **Espacio**.
4. En Agenda, Chat, Marketing y Facturas comprueba que las filas/tarjetas clicables se pueden enfocar y abrir igual que con el ratón. Pulsar Enter o Espacio **una sola vez** debe abrir **una sola vez**.
5. En la tienda (`?tienda`): Tab llega a las imágenes de producto (Enter abre el detalle), a «Favorito» y a los botones de compra.
6. Sistema con «reducir movimiento» activado (Windows: Efectos de animación; macOS: Reducir movimiento): no deben verse animaciones largas ni vibración del botón de WhatsApp.

## Cómo probar con lector de pantalla

- **Windows:** NVDA (gratuito) con Firefox o Chrome. **Mac/iPhone:** VoiceOver (Cmd+F5). **Android:** TalkBack.
- Comprueba: en el login se anuncia «Correo, campo de edición» y «Contraseña»; los botones de icono se leen como «Eliminar, botón», «Cerrar, botón»; al abrir una ventana se anuncia como diálogo; al añadir al carrito en la tienda se anuncia el aviso; el menú se lee como «Menú principal, navegación».

## Pruebas automáticas

`tests/accesibilidad.test.js` verifica `lang`, skip-link, nombres de `nav`, `role="dialog"` del modal, el CSS (`:focus-visible`, skip-link oculto, `prefers-reduced-motion`, sin redefinir colores), que ningún botón de solo icono quede sin `aria-label`, el login con `label for`, y simula el delegador de teclado (Enter/Espacio activan una vez, no actúan sobre botones nativos ni sobre lo que no marcó el script).

## Fase 20: zonas táctiles de escritorio, puntos del carrusel y landmark de WhatsApp

Cierra tres de los pendientes de la Fase 18 (los números son de `tests/navegador/tamano-zonas.js` en Chrome real, panel de administrador, vendedor y tienda):

| | Antes (`main`) | Después |
|---|---|---|
| Controles de escritorio (1366×900) por debajo de 24×24 px | 55 | 0 |
| Controles de móvil (390×844) por debajo de 24×24 px | 14 (puntos del carrusel) | 0 |
| axe `region`: `#k_wa` fuera de landmark | 1 nodo | 0 |

- **Escritorio:** las reglas de móvil de la Fase 18 (`summary`, `h3[data-h-click]`, «¿Olvidó su contraseña?», casillas de etiquetas, `input.etqcb`) se repiten dentro de `@media(min-width:821px)`. Las casillas con etiqueta de bloque o flex usan `min-height:24px`; las de `display:inline` usan `padding-block` (no mueve el texto). Los botones `.btn.s` pequeños suben a 24 px con `:where(.btn.s)` (especificidad 0), así no pisa el `min-height:36px` que `panel.css` ya les da en móvil.
- **Puntos del carrusel (`.khero-dots button`):** el botón mide 24×24 px (el activo 38×24) y el punto visible sigue midiendo 8 px (22×8 el activo), porque se dibuja con `background-clip:content-box` sobre un `padding` de 8 px. Se quitó el `gap` y se corrió el contenedor 8 px hacia dentro para que el último punto quede donde estaba. Los puntos quedan más separados (24 px entre centros en vez de 14).
- **`#k_wa`:** el botón sigue siendo `position:fixed`, pero ahora vive dentro de `<div class="kwrap" role="complementary" aria-label="Contacto por WhatsApp">` (alto 0, no ocupa lugar), que se oculta junto con el botón cuando la empresa no tiene número.

## Cómo revertir

Revertir el PR. Para desactivar solo el comportamiento nuevo sin revertir los atributos: quitar de `index.html` el `<script src="js/a11y.js">` y el `<link href="css/accesibilidad.css">`.
