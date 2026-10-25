# Guía de pruebas · Fase 24 (hallazgos del flujo de pedido)

Cada arreglo va en su propio PR. Esta guía crece con cada uno.

## PR «registro y pedido» (hallazgos 3 y 4)

**Qué se arregló** (solo `js/app.js`, tienda pública):

- **Nota perdida.** «Volver al pedido» desde «Último paso» borraba la nota que el cliente había escrito. Ahora `shopCart()` la recupera de `SH.pendNote` cuando no hay campo de nota en pantalla. Una nota que el cliente borra a propósito no «resucita».
- **Políticas aceptadas dos veces.** Tras registrarse, el pedido volvía con la casilla sin marcar y el aviso «Debe marcar la casilla…». Ahora la aceptación dada en el pedido (y la del registro, que es obligatoria) se conserva: la casilla vuelve marcada y el pedido sale solo.
- **La exigencia legal no cambia:** `shopSend` sigue exigiendo `chk.checked` antes de escribir cualquier cosa y sigue añadiendo a la nota la constancia «🛡️ Aceptó Términos y Privacidad Ley 81» con fecha y hora, más `lead.terminos`. La aceptación pendiente (`SH.poliOk`) solo se activa si la casilla estaba marcada en el pedido o si se superó la validación del registro (casilla obligatoria), se consume al volver al pedido y se descarta al cerrar la hoja.
- Mejora asociada: al cambiar cantidades en «Su pedido» la casilla ya marcada no se desmarca.

**Pruebas**

1. `npm test` (incluye `tests/pedido-fase24.test.js`, estática).
2. Chrome real, escritorio y móvil, contra una copia local (nada se envía ni se escribe: doble de escritura + bloqueo de red):
   ```bash
   PUERTO=8943 node tests/navegador/tienda-pedido-fase23.js
   PUERTO=8944 node tests/navegador/tienda-fase23.js        # geometría de la tienda: 140/140
   ```
   El primero ahora exige: la nota se conserva al volver del registro, la aceptación se conserva, una nota vacía sigue vacía, y tras registrarse el pedido sale directo con la constancia en la nota.

## Hallazgo 1 · productos con precio 0 («Consultar») — revisión, sin cambios

No se tocaron datos ni precios (son del dueño). Se revisó el código y no se encontró ningún error:

| Dónde | Qué hace con precio 0 | Verificado |
|---|---|---|
| `shopLines` | `p:+i.price\|\|0` (texto, vacío o NaN → 0) | estático |
| Hoja de cantidad (`shopPickUpd`) y botón flotante | subtotal «Consultar»; el botón flotante omite el total | Chrome real (`tienda-pedido-fase23.js`, modo «a consultar» con el catálogo real: todos a precio 0) |
| «Su pedido» (`shopCart`) | precio unitario «Consultar» (`tdMoney`), total «Consultar» si la suma es 0 | Chrome real |
| Pedido guardado | `p:0`, `total:0` (las reglas admiten `total >= 0`) | reglas en el emulador |
| Comprobante (PDF/imagen/HTML) y «Mi cuenta» | precio «Consultar», subtotal «—», total «Consultar» | estático |
| Panel (`tdPedidos`) | total «Consultar» | estático |

Observación (no es un error con los datos actuales, todos a 0): si algún día hay un pedido con productos con y sin precio, el total mostrado es la suma de los que sí tienen precio, sin aviso de que falta lo «a consultar». No se cambió porque es una decisión de presentación.

## PR «WhatsApp opcional tras el pedido» (hallazgo 2)

**Qué se añadió** (solo `js/app.js`): tras «¡Pedido enviado!» aparece, **si hay un número de WhatsApp configurado** (el mismo que usa el botón flotante `#k_wa`), el botón **«💬 Enviar también por WhatsApp»** (`#k_pwa`) con el aviso «Opcional: su pedido ya quedó guardado». Es un enlace `https://wa.me/<número>?text=…` que abre en pestaña nueva (`noopener`).

- **No cambia el flujo:** el pedido se guarda primero en Firestore (`tienda_pedidos`) como siempre; el botón se pinta después y no sustituye nada. Sin número configurado (o inválido) el botón no aparece.
- **Mensaje** (`shopPedidoWAurl`, todo con `encodeURIComponent`, sin caracteres de control ni `<>`):
  ```
  Hola, acabo de hacer un pedido en <negocio>.
  Pedido N° ABC123
  • 12 × Producto A
  • 7 × Producto B
  Total: $90.00        (o «Total: a consultar» si no hay precios; «Total parcial: $X (hay artículos a consultar)» si hay mezcla)
  Nombre: Cliente
  ```
  Máximo 15 líneas de artículos («… y N más»). **No** lleva teléfono, correo, dirección, empresa, nota, constancia de políticas ni datos de envío.

**Pruebas**

1. `npm test`: `tests/pedido-fase24.test.js` ejecuta las funciones reales en un contexto aislado (número normalizado, texto exacto, escapado, sin datos sensibles, precio 0, límite de líneas, sin botón sin número) y comprueba que `shopSend` no usa `wa.me` ni `window.open`.
2. Chrome real, escritorio y móvil: `tienda-pedido-fase23.js` (ahora incluye el botón: visible, abre `wa.me` —interceptado en red— con el resumen del pedido recién enviado, sin datos extra) y `tienda-fase23.js` 140/140.
## PR «reglas de Firestore: `envio` en `tienda_pedidos`» (hallazgo 5)

Detalle del cambio y de cómo revertir: `docs/DESPLIEGUE-REGLAS.md`, sección 6.

1. **Emulador** (`tests/herramientas/reglas-emulador`, ver su README): 32 pruebas nuevas (`reglas-pedido-envio.test.js`) y las 27 existentes (`reglas-generales.test.js`).
   - Reglas nuevas: 32/32 y 27/27.
   - Reglas anteriores (producción al 2026-10-25) con `EXPECT_ENVIO=0`: 32/32 (rechazan `envio`, que es justo el defecto) y 27/27.
   - Cubre, en `tienda_pedidos` y `empresas/{eid}/tienda_pedidos`: con `envio` válido (nacional, internacional, mínimo, límites exactos) pasa; sin `envio` pasa; `tipo`, `agencia`, tamaños de los 11 campos, tipos de dato, `envio` que no es mapa y claves extra (incluidas `guia, cont, obs, bultos, peso, etq`) fallan; lo demás del pedido no cambia (estado, total, artículos, `ref`, `cid`, `ts`, claves extra, `lead`, id distinto); invitados y cuentas ajenas no leen, actualizan ni borran; el vendedor solo cambia `estado`; la administración sí actualiza la guía.
2. **Estáticas** (`npm test`): `tests/reglas-envio-fase24.test.js` (límites iguales a `sanEnv`, claves = las que arma `shopEnvDatos`, las únicas diferencias con el respaldo son `envio`).
3. **Chrome real + copia de prueba** (`tests/navegador/pedido-envio-fase24.js`): con las reglas nuevas publicadas SOLO en `tarjeteria-jhon-prueba`, un pedido real de prueba con transportista nacional (Ferguson) y otro internacional (DHL): la primera escritura con `envio` es aceptada (sin reintento), el administrador de prueba lo lee y los datos de prueba se borran.
   ```bash
   node tests/navegador/copia-prueba.js /tmp/copia && (cd /tmp/copia && python3 -m http.server 8948 --bind 127.0.0.1 &)
   REAL=1 BASE=http://127.0.0.1:8948/ node tests/navegador/pedido-envio-fase24.js    # requiere PRUEBA_PASSWORD
   PUERTO=8947 node tests/navegador/pedido-envio-fase24.js                           # sin escribir nada (doble local)
   ```
