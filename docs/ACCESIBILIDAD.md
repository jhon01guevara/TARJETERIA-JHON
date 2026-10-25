# Accesibilidad (Fase 9)

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

## Qué queda pendiente

| Pendiente | Riesgo | Esfuerzo | Nota |
|---|---|---|---|
| Contraste: texto blanco del botón «Carrito» (`.kha.pri`) y título del hero sobre fondo amarillo (tienda) | Medio | Bajo | Hay que cambiar colores, así que no se tocó en esta fase. Medir también el panel (no se pudo sin sesión). |
| Marcas de región (`region` de axe) en la tienda: no hay `<main>` ni encabezado/pie como landmarks | Medio | Medio | Poner `role="main"` en `#shop` generó otros avisos (header/footer dentro de main). Requiere reestructurar el DOM. |
| Modales: cerrar con Esc, atrapar el foco dentro y devolverlo al cerrar (`#md`, `#shopm`) | Medio | Medio | Es lógica nueva; un Esc accidental podría perder un formulario a medio llenar. |
| `apps/investigacion.html` (≈38 campos) y `apps/modelos.html` (≈5) sin `label`/`aria-label` | Bajo | Medio | Van dentro de iframes (`srcdoc`), donde `a11y.js` no corre. Hay que editarlos a mano. |
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
