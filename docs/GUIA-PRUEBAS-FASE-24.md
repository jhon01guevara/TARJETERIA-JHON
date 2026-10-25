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
