# Guía de pruebas — Fase 23 (pruebas del pedido y del panel)

Objetivo: que un error como el de la Fase 20 (la tienda quedó con 48 px de alto) o uno en el pedido/permisos no pueda volver a pasar sin que lo detecte una prueba.

## Qué se agregó
| Archivo | Qué hace |
|---|---|
| `tests/pedido-panel-fase23.test.js` (`npm test`) | Estático: orden de validaciones de `shopSend` y `shopRegSend`, campos del pedido contra `firestore.rules`, el pedido no usa WhatsApp, límites del carrito, `puede()` y mensaje de «sin acceso». |
| `tests/navegador/tienda-pedido-fase23.js` | Chrome real, escritorio y móvil: carrito → «Su pedido» → validaciones → registro → «¡Pedido enviado!». **No escribe nada**: `shopSend` se sustituye por un contador (parte A); con el real se prueban las validaciones con un doble de escritura ya puesto (B); el flujo completo corre con `fbDb` sustituido por un doble y con `/Write/channel` de Firestore y EmailJS bloqueados en la red (C). |
| `tests/navegador/panel-fase23.js` | Chrome real contra la **copia de prueba**: administrador, vendedor y «sin permisos» (menú esperado, las pantallas se abren, sin errores de JS ni CSP, permisos), y el formulario de acceso. Solo navega. |
| `tests/navegador/copia-prueba.js` | Prepara una copia del repo apuntando a `tarjeteria-jhon-prueba` (lee el `firebaseConfig` público de la copia desplegada; desactiva App Check y EmailJS). |

## Cómo correrlas
```
export PW=/ruta/playwright-core  PRUEBA_PASSWORD=…     # la contraseña NO se guarda en el repo
# Pedido de la tienda (lee productos de la tienda real; no escribe):
PUERTO=8942 node tests/navegador/tienda-pedido-fase23.js
# Panel (copia de prueba):
node tests/navegador/copia-prueba.js /tmp/copia-prueba && (cd /tmp/copia-prueba && python3 -m http.server 8951 --bind 127.0.0.1 &)
BASE=http://127.0.0.1:8951/ node tests/navegador/panel-fase23.js          # y VP=390x844 para móvil
```
Salida: 0 todo bien · 1 alguna falló · 2 no se pudo preparar.

## Cómo es el pedido (importante)
- El pedido **no se envía por WhatsApp**. Se guarda en Firestore (`tienda_pedidos`) y el cliente ve su comprobante (imagen/PDF). El botón flotante de WhatsApp solo abre un chat con un saludo fijo; la prueba comprueba ese enlace.
- El catálogo real de la tienda tiene **todos los precios en 0** («Consultar»). La prueba comprueba ese modo y después fija precios solo en memoria para verificar los totales.

## Hallazgos menores (no se cambió nada)
1. **Se pide aceptar las políticas dos veces.** Tras llenar el registro (que ya exige aceptar Términos y Privacidad), el pedido vuelve a «Su pedido» con la casilla sin marcar y un aviso «Debe marcar la casilla…»; hay que marcarla otra vez y pulsar «Enviar pedido».
2. **«Volver al pedido» desde el registro pierde la nota** escrita en el pedido (el cuadro vuelve vacío).
3. **Cuota de Firestore de la copia de prueba**: el plan gratuito se agota (429 `resource-exhausted`); provoca ruido en consola y, a veces, un corte del canal de escritura. La prueba del panel lo tolera como ruido conocido.
4. `catalogo_default.zip` no está en la copia de prueba (404 conocido).

## Parte B (modularización): qué probar a mano
Panel de prueba: https://tarjeteria-jhon-prueba.web.app/ (usuarios en `GUIA-PRUEBA.md`), ventana de incógnito + Ctrl+Shift+R. Cuando este cambio se despliegue allí:
1. **Agenda:** crea un evento con aviso para dentro de 1 minuto: debe sonar la campana, salir el aviso en pantalla con «Hecho» y «Posponer», y (si diste permiso) la notificación del sistema. En Configuración, el botón de probar sonido y el cambio de tono.
2. **Configuración de la tienda (administrador):** cambia el tipo de fondo (foto, video, colores, liso), el color, el movimiento y la marca de agua; sube una foto, un video y un logo (y comprueba los avisos de tamaño y de tipo de archivo) y pulsa Guardar.
3. **Tienda pública:** recarga la tienda dos veces (la segunda debe pintar al instante desde la copia local), filtra por tema, mira los iconos del menú.
4. **Comprobante:** haz un pedido de prueba en la copia de prueba y comprueba «Ver comprobante», «Descargar PDF» y la imagen.
Comprobaciones automáticas: `npm test`, `node tests/navegador/verificar-movimiento-literal-23.js <base>` y `tests/navegador/funcional-fase23.js` (huellas iguales entre `main` y la rama).
