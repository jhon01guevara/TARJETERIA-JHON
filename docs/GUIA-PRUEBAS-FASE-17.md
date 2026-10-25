# Guía de pruebas — Fase 17 (barra «Modelos» de Inicio y `catalogo_default.zip`)

## Qué cambió, en simple
1. **Barra de Inicio («🎴 Modelos»).** Cuando no hay eventos en la agenda ni catálogo propio con miniaturas, la barra de la parte de arriba de Inicio debía mostrar los primeros modelos de Check. Desde SEG-04 etapa 3B (los datos pasaron a `apps/modelos.js`) la función `cintChk()` buscaba los datos en el sitio equivocado (`apps/modelos.html`): fallaba en silencio (aviso amarillo `error ignorado … Unexpected token 'm'`) y la barra solo mostraba la tarjeta genérica «Tarjetería Jhon». Ahora lee `apps/modelos-cintillo.json` (**95 KB**: los 30 primeros modelos con miniatura de 88 px) y vuelve a mostrar los modelos. **No** se descargan los 1,6 MB de `modelos.js`.
2. **`catalogo_default.zip`.** En el sitio real (GitHub Pages) el archivo existe, responde 200 y es idéntico al del repositorio (SHA-256 `5fbf81dc…f417`, 12.101.079 bytes). El 404 solo ocurre en las copias de Firebase (`tarjeteria-jhon-prueba.web.app` y `tarjeteria-jhon.web.app`), que nunca llevaron ese archivo. **No se cambió nada** del código del zip; solo se añadió una prueba que vigila que siga en el repo y que se pida desde la raíz y solo con la base local vacía.
3. Caché del service worker `tj-net-first-13` y `?v=avisos-fase-17` en `app.js`.

## Dónde probar
Panel de prueba: https://tarjeteria-jhon-prueba.web.app/ (usuarios en `GUIA-PRUEBA.md`). Ventana de incógnito nueva y Ctrl+Shift+R.

## Pasos (5 minutos)
1. Entra como **administrador**. En **Inicio**, arriba, debe verse la barra «🎴 Modelos» con miniaturas (PW020, PW01, PW07…) y un contador «1 / 30». Antes solo salía la tarjeta «Tarjetería Jhon». (Si el panel tiene agenda o catálogo propio con miniaturas, se ve eso, como siempre.)
2. Toca un modelo: abre **Check**.
3. F12 → Console: **no** debe salir `error ignorado … Unexpected token 'm'`. (Sí pueden salir los avisos de `contentscript.js` —extensión— y, en la tienda, un aviso de «quota» de `tj_cached_items` que ya existía.)
4. F12 → Network, filtro `modelos`: aparece `modelos-cintillo.json` (≈95 KB) y no se pide `modelos.js` por esta vía.
5. Entra como **vendedor**: la barra se ve igual (el vendedor no tiene Check en su menú, así que tocar un modelo no cambia de pantalla; ya era así).
6. En el **sitio real** (https://jhon01guevara.github.io/TARJETERIA-JHON/) el zip carga: https://jhon01guevara.github.io/TARJETERIA-JHON/catalogo_default.zip descarga ≈12 MB.

## Si algo falla
Revierte el PR de la fase 17 (botón «Revert»). Regenerar el JSON si cambian las imágenes: `python3 tests/herramientas/generar-cintillo.py`.
