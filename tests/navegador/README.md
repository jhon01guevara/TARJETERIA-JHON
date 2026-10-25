# Pruebas en Chrome real (Fase 15)

Estos scripts **no** corren con `npm test` (ese solo ejecuta `tests/*.test.js`, sin navegador). Sirven para repetir las mediciones de la Fase 15 contra una copia local o el panel de prueba.

Requisitos (fuera del repo): `npm i playwright-core axe-core`, Google Chrome instalado, y la variable de entorno `PRUEBA_PASSWORD` con la contraseña de los usuarios de prueba (`admin.prueba@example.com`, `vendedor.prueba@example.com`). **Nunca contra producción.**

| Script | Qué hace | Ejemplo |
|---|---|---|
| `medir-avisos-onclick.js` | Recorre el panel como administrador y cuenta los avisos «Executing inline event handler»; lista los elementos con atributos `on…=` | `BASE=http://localhost:8802/ TAG=nuevo node medir-avisos-onclick.js` |
| `axe-contraste.js` | axe-core (regla `color-contrast` u otras con `RULES=`) en todas las pantallas, temas claro/nocturno y tienda | `BASE=… TAG=axe ROLES=admin.prueba@example.com,vendedor.prueba@example.com node axe-contraste.js` |
| `modales.js` | Comprueba role/nombre, foco, Tab atrapado, Esc y devolución del foco en login, `#md`, Investigación, visor PDF, detalle/carrito/zoom de la tienda | `BASE=… node modales.js` |
| `imprimir-constancia.js` | Abre la constancia legal y comprueba que «Imprimir» llama a `print()` | `BASE=… node imprimir-constancia.js` |

| `modelos-fase16.js` | Fase 16: `modelos.js` no se pide en la carga inicial, el SW lo guarda en un momento libre o al primer uso, Check abre (admin), funciona sin conexión, vendedor, tienda pública, 0 violaciones CSP | `PW=… BASE=https://tarjeteria-jhon-prueba.web.app/ node modelos-fase16.js` |
| `servidor-medicion.js` + `medir-carga.js` | Servidor estático con gzip (y `KBPS=200` opcional) que cuenta bytes por archivo, y medición de la 1.ª visita | `node servidor-medicion.js /ruta/copia 8811` y `BASE=http://localhost:8811/ node medir-carga.js` |
| `actualizacion-sw.js` | Camino de actualización del SW (versión anterior → nueva): que la caché nueva acabe con `modelos.js` | `ANTES=/copia-main DESPUES=/copia-nueva node actualizacion-sw.js` |

`BASE` es la URL (con `/` al final) de una copia servida en local (`python3 -m http.server`) o `https://tarjeteria-jhon-prueba.web.app/`.

## Fases 17-19
| Script | Qué hace |
|---|---|
| `recorrido.js` | Entra con admin y vendedor, abre todas las pantallas del menú y la tienda; guarda capturas y un `resultado.json` (consola, CSP, huellas de texto, barra de Inicio). `BASE=… OUT=/tmp/antes node recorrido.js` |
| `comparar.py` | Compara dos carpetas de `recorrido.js` (antes/después): consola nueva, CSP, pantallas y diferencia de píxeles. `python3 comparar.py /tmp/antes /tmp/despues` |
| `cintillo-fase17.js` | Barra «Modelos» de Inicio: 30 modelos con imagen, sin avisos, sin pedir `modelos.js`. |
| `axe-completo.js` | Fase 18: axe-core con todas las reglas WCAG A/AA + mejores prácticas + `target-size` en panel (admin/vendedor) y tienda; `VP=390x844` para móvil real. |
| `axe-detalle.js` | Como el anterior pero imprime pantalla y HTML de cada nodo de las reglas pedidas (`RULES=label,region`). |
| `tamano-zonas.js` | Fase 18: lista los controles de menos de 24×24 px (WCAG 2.2 · 2.5.8) por pantalla y selector. `VP=390x844` por defecto. |
| `funcional-fase19.js` | Fase 19: ejecuta en la página, con entradas fijas, las funciones movidas a `gif.js`, `promo.js`, `transportistas.js` y `etiquetas.js` (PDF de etiquetas incluido) y imprime huellas; deben ser idénticas entre `main` y la rama. `ROL=vendedor.prueba@example.com` para el vendedor. |
| `banners-fase22.js` | Fase 22: banners WebP/JPG en la tienda (escritorio y móvil, sin soporte WebP, red lenta, los 14 banners) | `BASE=… OUT=/tmp/b22 node banners-fase22.js` |
| `funcional-fase21.js` | Fase 21: ejecuta en la página, con una base de datos de ejemplo solo en memoria, las funciones movidas a `mapa-clientes.js`, `fondo-login.js`, `dashboard-vendedor.js` y `plantillas-factura.js` e imprime huellas; deben ser idénticas entre `main` y la rama **servidos desde el mismo origen** (el enlace de la tienda lleva el puerto). `ROL=vendedor.prueba@example.com` para el vendedor. | `BASE=… node funcional-fase21.js` |
| `verificar-movimiento-literal.js` | Fase 21: comprueba (sin navegador) que los 4 archivos nuevos son un movimiento literal desde `js/app.js` de `origin/main` (contiguo, una vez, `app.js` nuevo = `main` menos los bloques). | `node tests/navegador/verificar-movimiento-literal.js [rama-base]` |

## Fase 20
| Script | Qué hace |
|---|---|
| `hallazgos-fase20.js` | Tienda pública: la copia local `tj_cached_items` ya no supera la cuota, no avisa en consola, se guarda dentro de un presupuesto, pinta sin Firestore y se limpia sola bajo presión de memoria (incluye un fallo de `setItem` simulado). Puntos del carrusel ≥24×24, `#k_wa` dentro de un landmark (axe `region`), y la barra «Modelos» del vendedor (sin permiso a Check/Catálogo el toque no hace nada; con el permiso, navega). `BASE=… [VP=390x844] node hallazgos-fase20.js` |
| `tienda-fase23.js` | Fase 23: geometría de la tienda pública (alto de `#shop .kwrap`, redes y pie al final, WhatsApp fijo, filtros, carrito sin enviar pedido) en escritorio y móvil. Ver `docs/GUIA-PRUEBAS-TIENDA.md` | `DIR=/ruta/copia PUERTO=8941 node tienda-fase23.js` |
