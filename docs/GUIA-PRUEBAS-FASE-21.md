# Guía de pruebas — Fase 21 (modularización, 4 extracciones)

## Qué cambió, en simple
`js/app.js` es un archivo enorme. En esta fase se **cortaron y pegaron, sin cambiar ni una letra**, 4 trozos a archivos propios. La pantalla debe verse y funcionar **exactamente igual** que antes; lo único que cambia es dónde vive el código.

| Archivo nuevo | Qué contiene | Dónde se nota |
|---|---|---|
| `js/mapa-clientes.js` | Mapa de clientes (selector del formulario, filtros, mapa general, tarjeta del Inicio) | Clientes → ubicación; Inicio → tarjeta del mapa; menú Mapa (admin) |
| `js/fondo-login.js` | Fondo personalizado del inicio de sesión (imagen, video o degradado) | Pantalla de entrada; Configuración → fondo del inicio de sesión |
| `js/dashboard-vendedor.js` | Resumen de ventas por vendedor | Inicio (el vendedor ve el suyo; el admin ve el de todos y su detalle) |
| `js/plantillas-factura.js` | Plantillas de factura, sello PAGADO/VENCIDA…, visor de factura y «cobrar» | Facturas → ver factura; Configuración → plantillas |

`app.js` pasó de 4.459 a 4.203 líneas. Caché del service worker `tj-net-first-18`; `js/app.js?v=modulos-fase-21d`.

## Dónde probar
Panel de prueba: https://tarjeteria-jhon-prueba.web.app/ (usuarios en `GUIA-PRUEBA.md`). Ventana de incógnito + Ctrl+Shift+R (el service worker nuevo tarda un recargo en tomar el control).

## Pasos (10 minutos)
1. **Entrada:** carga la página: se ve el inicio de sesión. Si hay fondo personalizado, se ve igual. Entra como administrador.
2. **Inicio (admin):** se ve el resumen por vendedor; toca un vendedor: abre su detalle; cambia el periodo (Hoy / 7 días / Este mes / Este año / Todo).
3. **Facturas:** abre una factura (visor): zoom + / −, botón maximizar; cambia la plantilla; el sello (PAGADO, PAGO PARCIAL, VENCIDA, ANULADA) coincide con el estado. «Cobrar» solo para administrador.
4. **Configuración → Plantillas de factura:** aparece la tarjeta con las plantillas y la vista previa.
5. **Mapa de clientes:** menú «Mapa» (admin): se ve el mapa y los filtros (Todos, Compra, Sin compra, Deuda, Vencidas) y el buscador. En Clientes, el selector de ubicación del formulario.
6. **Vendedor:** entra con el vendedor de prueba: Inicio con su resumen y su enlace de tienda; no ve el menú Mapa.
7. **Móvil (390×844):** lo mismo, rápido.
8. **Consola (F12):** sin errores rojos ni mensajes de «Content Security Policy» nuevos.

## Lo que NO se tocó y tú deberías probar a mano antes de moverlo en otra fase
Llamadas de voz (dos personas), perfil y emojis, chat, tienda pública completa (temporada, audio, carrito, pedido), mapas de ubicaciones con GPS, impresión de etiquetas reales, TJ LIVE. Detalle y motivos en `docs/PLAN-MODULARIZACION.md` §9.

## Pruebas automáticas
- `npm test` (217 pasan; `tests/modularizacion-fase21.test.js` es nuevo).
- Sin navegador: `node tests/navegador/verificar-movimiento-literal.js` demuestra que los 4 archivos son copia literal de `origin/main` y que `app.js` nuevo es `main` menos esos bloques.
- Chrome real (necesita `PRUEBA_PASSWORD`; nunca producción): `BASE=… node tests/navegador/funcional-fase21.js` (también `ROL=vendedor.prueba@example.com` y `VP=390x844`) y `recorrido.js` + `comparar.py`. Las huellas deben ser idénticas entre `main` y la rama (servidas desde el mismo origen).

## Si algo falla
Revierte el PR (o un solo commit con `git revert`, empezando por el último). Es un movimiento literal: no hay lógica nueva que arreglar.
