# Accesibilidad (Fase 9 y Fase 15)

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

## Cómo revertir

Revertir el PR. Para desactivar solo el comportamiento nuevo sin revertir los atributos: quitar de `index.html` el `<script src="js/a11y.js">` y el `<link href="css/accesibilidad.css">`.
