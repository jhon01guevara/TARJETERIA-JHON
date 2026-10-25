# Guía de pruebas — Fase 19 (modularización de `app.js`)

## Qué cambió, en simple
**Nada debe notarse.** Se movieron 188 líneas de `js/app.js` a 4 archivos nuevos, sin cambiar una sola línea de lógica:
1. `js/gif.js` — compresión de GIF animados al subir la foto de perfil.
2. `js/promo.js` — banners promocionales del carrusel de la tienda.
3. `js/transportistas.js` — directorio de transportistas (FedEx, DHL, Ferguson…).
4. `js/etiquetas.js` — dibujo del PDF de la etiqueta de envío (código de barras incluido).

`app.js` baja de 4.647 a 4.459 líneas. Caché del service worker `tj-net-first-15`.

## Dónde probar
Panel de prueba: https://tarjeteria-jhon-prueba.web.app/ (usuarios en `GUIA-PRUEBA.md`). Ventana de incógnito + Ctrl+Shift+R.

## Pasos (10 minutos)
1. **Administrador:** entra y recorre todo el menú. Todo igual que antes.
2. **Etiquetas de envío:** En los pedidos de la tienda, abre un pedido y pulsa el botón 🏷️ de etiqueta («Etiqueta de envío · Pedido …») → prueba 100×150 mm y «Hoja A4 con 4 etiquetas». El PDF se abre con remitente, destinatario, código de barras y logo de la agencia.
3. **Transportistas:** Configuración → «Transportistas de carga»: salen las 13 empresas; busca una por nombre; al pedir en la tienda el cliente puede escoger una y sus datos llegan a la etiqueta.
4. **Tienda pública** (`?tienda=1`): el carrusel de promociones se ve y avanza; los banners llevan a su categoría.
5. **Perfil:** Mi perfil → sube un GIF animado pesado: se comprime y se guarda (si el navegador no soporta `ImageDecoder`, se usa la foto tal cual, como antes).
6. **Vendedor:** entra y recorre sus pantallas (Inicio, Facturas, Clientes, Agenda…). Igual que antes.
7. **Móvil (390×844):** Inicio, tienda y una etiqueta. Igual que antes.
8. **Consola (F12):** sin «Content Security Policy» nuevos ni errores rojos nuevos (en la consola no debe aparecer «is not defined»).

## Pruebas automáticas
- `npm test` (todo verde).
- En Chrome real (necesita `PRUEBA_PASSWORD`, nunca producción): `BASE=… OUT=/tmp/x node tests/navegador/recorrido.js` y `BASE=… node tests/navegador/funcional-fase19.js` contra `main` y contra la rama; las huellas del segundo deben ser idénticas.

## Si algo falla
Revierte el PR de la fase 19. Si solo falla una cosa, di cuál de los 4 archivos es (el error de consola dice el archivo) y se revierte ese commit.
