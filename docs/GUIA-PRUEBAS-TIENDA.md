# Guía de pruebas de la tienda pública (Fase 23)

Sirve para comprobar que la **tienda pública** (`?tienda=1`) conserva su diseño y su flujo clave después de cualquier cambio de HTML/CSS/JS.
Nació del error de la Fase 20 (PR 25): la clase `kwrap`, que es el contenedor principal de la tienda (`#shop .kwrap`), se reutilizó para la envoltura del botón de WhatsApp con `height:0`. La tienda quedó con 48 px de alto en vez de ~6100 px y las redes, el pie y los botones «Políticas y Privacidad (Ley 81)» y «Contacto oficial» aparecieron **arriba** en lugar de al final.

Son dos capas:

| Capa | Archivo | Se corre con | Qué detecta |
|---|---|---|---|
| Estática | `tests/tienda-fase23.test.js` | `npm test` (sin navegador, sin red) | `kwrap` usado más de una vez en el HTML generado, reglas `.kwrap` fuera de `css/panel.css` o con `height:0`/`display:none`/`position:fixed`, envoltura de WhatsApp sin `kwa-wrap` |
| Chrome real | `tests/navegador/tienda-fase23.js` | a mano (no entra en `npm test`) | La geometría real de la página renderizada, en escritorio (1366×900) y móvil (390×844) |

## Qué comprueba el script de Chrome

Son **mediciones deterministas** (no compara píxeles: el orden de los productos es aleatorio). Para cada tamaño de pantalla:

1. Solo existe un elemento `.kwrap` y está dentro de `#shop`.
2. `#shop .kwrap` mide **más de 1000 px**, al menos lo que mide su contenido, y abarca toda la grilla `#sh_g`.
3. `#k_redes` y `#k_footer` están **debajo del último producto** (su `top` es mayor que el `bottom` de la grilla) y el pie está debajo de las redes.
4. El pie es el **último bloque visible** dentro de `#shop`.
5. Los botones «Políticas y Privacidad» y «Contacto oficial» están dentro de `#k_footer` y debajo de la grilla.
6. `#k_wa` es `position:fixed`, queda dentro de la ventana y está dentro de un contenedor `role="complementary"` con nombre, de alto 0 y **sin** clase `kwrap`.
7. Al bajar hasta el final (la grilla carga más productos al desplazarse; el script baja hasta que el alto deja de crecer) se ven las redes y el pie completos dentro de la ventana.
8. Filtros: se abre la hoja, se marca «Disponibles», «Ver resultados» la cierra, «Limpiar filtros» vuelve a «Todos». Después se repiten las medidas de diseño.
9. Carrito: empieza vacío; «+» abre la hoja de cantidad; «Agregar al carrito» muestra el contador; «Su pedido» muestra total, aceptación de políticas y el botón **«Enviar pedido»** (existe y es visible, **no se pulsa**); «Quitar» vacía el carrito y desaparece el contador. Se repiten las medidas de diseño.
10. Ningún pedido se envía (el script sustituye `shopSend()` por un contador que debe quedar en 0), sin errores de JavaScript y sin violaciones de la CSP.

Si la tienda no tiene redes o WhatsApp configurados, las comprobaciones que dependen de ellos aparecen como «omitido» (no fallan).

## Requisitos

- Google Chrome instalado y `playwright-core` (fuera del repo: `npm i playwright-core`).
- `python3` (para el servidor estático local).
- Conexión a internet: la tienda **lee** los productos del Firestore del proyecto, como cualquier visitante. La prueba **no escribe** nada en Firestore: el carrito vive solo en el `localStorage` de un contexto de navegador nuevo y vacío, y el pedido nunca se envía.
- No se corre contra producción: el script se niega si `BASE` apunta a `tarjeteria-jhon.web.app`, `firebaseapp.com` o `github.io`.

## Cómo correrlo

1. Elige un **puerto libre** (comprueba antes que no esté en uso; no reutilices los de otras pruebas abiertas):

   ```bash
   ss -ltn | grep 8941      # sin salida = libre
   ```

2. Opción A, el script levanta y apaga el servidor por ti:

   ```bash
   PW=/ruta/a/node_modules/playwright-core PUERTO=8941 node tests/navegador/tienda-fase23.js
   ```

   Opción B, usas tu propio servidor (por ejemplo para probar otra copia del repositorio):

   ```bash
   cd /ruta/a/otra/copia && python3 -m http.server 8941 --bind 127.0.0.1 &
   PW=/ruta/a/node_modules/playwright-core BASE=http://127.0.0.1:8941/ node tests/navegador/tienda-fase23.js
   kill %1
   ```

### Variables

| Variable | Qué hace | Por omisión |
|---|---|---|
| `BASE` | URL (con `/` final) de una copia ya servida. Si se da, el script no levanta servidor. | — |
| `DIR` | Carpeta a servir cuando no hay `BASE` (útil con un `git worktree` de otra versión). | la raíz del repo |
| `PUERTO` | Puerto del servidor que levanta el script. Si está ocupado, el script se detiene y lo dice. | `8941` |
| `PW` | Ruta de `playwright-core`. | `playwright-core` |
| `VPS` | Tamaños a probar, separados por coma. | `1366x900,390x844` |
| `ESPERA` | Milisegundos que espera a que aparezcan productos. | `40000` |

### Código de salida

- `0`: todas las comprobaciones pasaron.
- `1`: alguna falló (el nombre de la comprobación y las medidas salen en pantalla con `FALLA`).
- `2`: no se pudo preparar la prueba (puerto ocupado, sin productos, sin red).

## Verificar que la prueba detecta el error

Sirve una copia del commit con el error (`f4d5a40`, Fase 20 con `.kwrap{height:0}`) y debe **fallar** en alto y posición:

```bash
git worktree add /workspace/tienda-con-error f4d5a40
DIR=/workspace/tienda-con-error PUERTO=8942 PW=... node tests/navegador/tienda-fase23.js; echo "salida $?"   # debe ser 1
git worktree remove --force /workspace/tienda-con-error
```

Contra `main` debe dar `0`. La prueba estática (`npm test`) falla si alguien vuelve a poner `class="kwrap"` en otro elemento o define `.kwrap` en `accesibilidad.css`.

## Cuándo correrlo

Antes de unir cualquier PR que toque `index.html`, `css/panel.css`, `css/accesibilidad.css`, `css/inyectados.css` o la plantilla de la tienda en `js/app.js`.
