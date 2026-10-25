# Guía de pruebas — Fase 22 (banners en WebP)

## Qué cambió, en simple
Los banners del carrusel de la tienda ahora se sirven en **WebP** (≈ 22 % menos peso: hasta ~1 MB menos por visitante en escritorio y ~0,6 MB en móvil). Los JPG originales **siguen ahí** y se usan solos en un navegador que no entienda WebP. A simple vista **no debe notarse ninguna diferencia**.

## Dónde probar
Panel/tienda de prueba: https://tarjeteria-jhon-prueba.web.app/ y tienda en https://tarjeteria-jhon-prueba.web.app/?tienda . Ventana de incógnito + Ctrl+Shift+R.

## Pasos (5 minutos)
1. Abre la tienda (`?tienda`). El carrusel de portada («Tu fiesta, tu estilo.», «Un año más, a celebrarlo.»…) se ve **igual** que antes: textos nítidos, colores iguales, sin bandas en los fondos.
2. Pasa los 14 banners con las flechas ‹ › (o espera). Mira con atención **Cumpleaños** y **Felicitaciones**: son los de mayor diferencia técnica; el texto pequeño («Colección · Felicitaciones») debe verse limpio.
3. F12 → pestaña **Red** → filtra por «banners»: los archivos son `.webp` (tipo `webp`), no `.jpg`.
4. Repite en el celular (o F12 → modo móvil 390×844): se piden los `…-m.webp`.
5. Panel (admin y vendedor): entra y recorre las pantallas; todo igual. Consola (F12): sin errores nuevos.
6. Si tienes banners propios subidos (Configuración → Plantilla de la web → Banners promocionales), esos **no cambian**.

## Pruebas automáticas
- `npm test`: `tests/banners-webp-fase22.test.js` comprueba que cada banner tiene su WebP (≥ 15 % más ligero, sin metadatos), que los JPG siguen, el orden de `<source>`/`<img>` en `promoSlide`, el caso «sin WebP» y la CSP.
- Chrome real (necesita `PRUEBA_PASSWORD` para el recorrido; el de banners no): `BASE=… OUT=/tmp/b22 node tests/navegador/banners-fase22.js` (escritorio y móvil, WebP / sin soporte WebP / red lenta, los 14 banners) y `recorrido.js` + `comparar.py` contra `main`.

## Si algo se ve peor
Dime qué banner. Se deja ese en JPG quitando sus entradas `.webp` de `PROMO_IMG` (js/promo.js), o se revierte el PR. Para cambiar la calidad global: `python3 docs/generar-banners-webp.py --escribir` tras editar el rango de calidades.
