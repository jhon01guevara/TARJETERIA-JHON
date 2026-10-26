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
| `tienda-pedido-fase23.js` | Fase 23: flujo del pedido de la tienda (cantidades, totales, validaciones, registro, pedido enviado con escrituras desviadas a un doble y bloqueadas en red; no envía nada). Ver `docs/GUIA-PRUEBAS-FASE-23.md` | `PUERTO=8942 node tienda-pedido-fase23.js` |
| `panel-fase23.js` + `copia-prueba.js` | Fase 23: panel con administrador, vendedor y «sin permisos» contra la copia de prueba (menú, pantallas, CSP, permisos, formulario de acceso). Requiere `PRUEBA_PASSWORD`. | `node copia-prueba.js /tmp/copia` y `BASE=http://127.0.0.1:8951/ node panel-fase23.js` |
| `funcional-fase23.js` + `verificar-movimiento-literal-23.js` | Fase 23: equivalencia de lo movido a `agenda-alertas.js`, `tienda-config-medios.js`, `tienda-copia-local.js`, `tienda-temas.js` y `comprobante-pedido.js` (huellas iguales entre `main` y la rama, servidas desde el mismo origen) y comprobación de movimiento literal. Requiere `PRUEBA_PASSWORD`. | `BASE=http://127.0.0.1:8953/ node funcional-fase23.js` y `node verificar-movimiento-literal-23.js main` |

## Fase 24
| Script | Qué hace |
|---|---|
| `pedido-envio-fase24.js` | Pedido de la tienda con transportista (`envio`). Modo doble (local, sin escribir) y modo `REAL=1` contra la copia de PRUEBA (verifica que apunta a `tarjeteria-jhon-prueba`, exige que la primera escritura con `envio` sea aceptada, lee el pedido con el administrador de prueba y borra los datos de prueba). Ver `docs/GUIA-PRUEBAS-FASE-24.md`. |

## Marca VEN CRM
| Script | Qué hace |
|---|---|
| `marca-ven-crm.js` | Acceso del panel y tienda: manifest, íconos, título, logo (sin iniciar sesión). |
| `marca-ven-crm-interior.js` | Interior del panel con admin de PRUEBA: logo/símbolo/pie VEN CRM, empresa intacta (con `ANTES=` contra una copia de `main`), sin rosado, contraste claro/nocturno, recorrido por todas las pantallas, tienda sin cambios. `BASE=… [ANTES=…] [VP=390x844] [SHOTS=…] node marca-ven-crm-interior.js` |

## Empresa GENUINE (tienda y panel de otra empresa)
| Script | Qué hace |
|---|---|
| `genuine-siembra.js` | Crea/actualiza la empresa de PRUEBA `genuine-prueba` (logo ancho, plantilla y contacto propios) SOLO en `tarjeteria-jhon-prueba`; aborta si la app no apunta a PRUEBA. `BASE=… PRUEBA_PASSWORD=… PW=… node genuine-siembra.js` |
| `genuine-tienda.js` | Tienda de otra empresa en Chrome real (sin sesión): ni logo ni textos de Tarjetería en ningún instante (línea de tiempo cada 15 ms), esqueleto sin copia local, primer pintado desde la copia local con Firestore bloqueado, inicial si no hay logo, y la empresa inicial intacta. `BASE=… [EMP=genuine-prueba] [SHOTS=/ruta] PW=… node genuine-tienda.js` |
| `genuine-logo-tienda.js` | Logo de la tienda web desde Configuración (admin de PRUEBA): sube un PNG transparente de ~400 KB, comprueba que se guarda al instante (≤250 000 car., ≤800 px, transparencia), que la cabecera de la tienda pública lo usa, «Quitar» → inicial de la empresa. `BASE=… PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=… node genuine-logo-tienda.js` |
| `genuine-contacto.js` | «Datos de la empresa» → web (admin de PRUEBA, `genuine-prueba`): guarda nombre, teléfono, correo y dirección y comprueba que Contacto oficial, Políticas y Privacidad y el pie de la tienda pública muestran esos mismos datos; que cambiarlos los cambia en la web; que una empresa sin datos muestra un texto neutro (nunca Tarjetería); que la sincronización única solo rellena lo vacío sin pisar lo publicado; y que la empresa inicial conserva su contacto. Requiere `PRUEBA_PASSWORD`. |
| `catalogo-vacio.js` | Una empresa NUEVA (`vacia-prueba`, solo en PRUEBA; el script borra sus datos de prueba al empezar) no hereda el catálogo de Tarjetería: base local vacía con y sin sesión, nada subido a Firestore, Catálogo/Productos/Inicio/Check/Tienda del panel sin modelos, tienda pública con estado vacío neutro, y la empresa inicial conserva sus 88 modelos. La copia debe llevar el zip: `CON_ZIP=1 node copia-prueba.js /tmp/copia`. `BASE=… PRUEBA_PASSWORD=… [SHOTS=…] PW=… node catalogo-vacio.js` |
