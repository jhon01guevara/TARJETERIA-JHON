# Optimización de peso (fase 8)

Objetivo: que la web pese menos **sin cambiar nada de lo que ve el usuario** ni la lógica de la app.
Regla aplicada: solo se cambia lo que se puede demostrar idéntico y reversible; lo dudoso queda como propuesta.

## Resumen antes / después

| Archivo | Antes (bytes) | Después (bytes) | Ahorro | Estado |
|---|---:|---:|---:|---|
| `catalogo_default.zip` | 13.887.369 | 12.101.079 | −1.786.290 (−12,9 %) | **Aplicado** (reempaquetado sin pérdida) |
| `banners/*.jpg` (28 archivos) | 7.511.181 | 7.511.181 | 0 | No aplicado (ver abajo) |
| `apps/modelos.js` | 1.592.163 | 1.592.163 | 0 | No aplicado (propuesta) |
| **Total repo (3 archivos objetivo)** | 22.990.713 | 21.204.423 | −1.786.290 (−7,8 %) | |

## Cómo se usa cada archivo

| Archivo | Cuándo se descarga | ¿Lo precachea `sw.js`? |
|---|---|---|
| `catalogo_default.zip` | `js/app.js` (`precargarCatalogoDeFabrica`, ~L1849) hace `fetch('catalogo_default.zip')` **solo si** la base local (IndexedDB) del catálogo está vacía, JSZip está cargado y la URL no es de tienda (`?tienda`). Es decir, una sola vez por dispositivo/navegador en la primera apertura del panel. | No |
| `apps/modelos.js` | Lo carga `apps/modelos.html` (`<script src="apps/modelos.js">`), que se abre en el iframe del módulo **Check** del panel. Es decir, bajo demanda. Contiene 63 fotos JPEG en base64 (`const IMGS`), logo, `DATA`, `CATS`, etc. | **Sí** (lista `PRE`): se descarga en segundo plano al instalar/actualizar el service worker. |
| `banners/*.jpg` | Rutas literales en `PROMO_IMG` (`js/app.js` ~L3578). Cada post usa `<picture>` con `-m.jpg` en pantallas ≤700 px y la versión grande en el resto, con `loading="lazy"`. Se descarga solo la variante que corresponde y solo cuando el carrusel la necesita. | No |

El `.zip` contiene: `manifest.json` (4,6 MB; 88 elementos, cada uno con una miniatura JPEG en base64) y 88 PDFs en `files/*.bin` (≈9,2 MB). Todo estaba guardado **sin compresión** (método "stored"): por eso el reempaquetado con DEFLATE gana espacio sin tocar ningún dato.

## Qué se hizo

### `catalogo_default.zip`: reempaquetado sin pérdida
- Cada entrada se recomprimió con DEFLATE (Zopfli, 15 iteraciones). Si una entrada no mejoraba ≥1 %, se dejó almacenada tal cual.
- Mismos nombres de archivo, mismo orden, misma carpeta `files/`, mismas fechas y mismo formato zip estándar: `JSZip.loadAsync` lo lee igual que antes (JSZip soporta DEFLATE de forma nativa). El código de la app no cambia.
- Efecto: el primer arranque descarga 1,8 MB menos. El navegador descomprime en milisegundos.

**Evidencias de que el contenido es idéntico** (verificado con JSZip 3.10.2, la misma versión que usa `index.html`, replicando el flujo de `precargarCatalogoDeFabrica`):
- 90 entradas, mismos nombres y mismo orden.
- `manifest.json`: SHA-256 idéntico (`c4dced0d5d0382a3…`).
- Los 88 `blobFile`: tamaño y SHA-256 de cada archivo descomprimido **idénticos** a los del zip original.
- `unzip -t`: sin errores. Nuevo test `tests/catalogo-zip.test.js` (CRC de cada entrada, manifest válido, todos los `blobFile` existen y miden lo declarado).
- SHA-256 del zip nuevo: `5fbf81dc15367deed9c7f4c47ce0d07aef85f460026c532f4aeb65f3bd79f417`.

## Qué NO se hizo y por qué

### Banners (`banners/*.jpg`) — descartado
Ya son JPEG progresivos con calidad ≈85 (tablas de cuantización estándar de calidad 85).
- **Recompresión con pérdida (calidad 82, progresivo, optimizada)**: ahorraría ≈22 % (7,51 → 5,83 MB), pero el SSIM contra el original quedó entre 0,943 y 0,984, y **solo 3 de 28 archivos** llegan a 0,98 (los de `boda`). Se aplicó el criterio de no tocar nada con SSIM < 0,98. Aplicarlo solo a 3 archivos ahorraría ~136 KB y dejaría las imágenes de un mismo carrusel con calidades distintas: no compensa.
- **Optimización sin pérdida (mozjpeg)**: los píxeles salen idénticos, pero el ahorro es solo 0,8–3,5 % (−163 KB en total), por debajo del umbral de 15 %. No se aplicó para no tocar 28 archivos por tan poco.
- Además los banners no pesan en la primera carga: son `lazy` y solo baja una variante (móvil o escritorio) por post.

### Miniaturas dentro de `manifest.json` — descartado
Se probó optimizar sin pérdida (mozjpeg) las 67 miniaturas únicas: ahorro de solo −5,6 % (145 KB) y **elimina el perfil de color ICC** incrustado, lo que podría cambiar levemente el color en navegadores con gestión de color. Descartado.

### PDFs del catálogo — no se tocaron
Reoptimizar el interior de los PDFs (qpdf/mutool) podría cambiar su aspecto o su compatibilidad. Solo se comprimió el contenedor zip.

### `apps/modelos.js` y `sw.js` — no se tocaron
Quitar `apps/modelos.js` de la lista `PRE` de `sw.js` reduciría la descarga en segundo plano (1,6 MB cada vez que cambia el service worker), pero **no es 100 % seguro**: hoy ese archivo queda disponible sin conexión desde el primer momento. Si se quita, una persona que nunca abrió el módulo Check con internet y luego lo abre sin conexión vería el módulo sin sus datos (el service worker sí lo guardaría tras el primer uso con conexión, porque cachea lo que descarga). Como el requisito es no romper nada, se deja como propuesta. `sw.js` y el nombre de caché (`tj-net-first-5`) no cambian.

## Propuestas siguientes (con riesgos)

| Propuesta | Ahorro estimado | Riesgo | Notas |
|---|---|---|---|
| ~~Quitar `apps/modelos.js` de `PRE` en `sw.js`~~ | −1,6 MB en la instalación del service worker | Bajo/medio | **Aplicado en la fase 16** (ver abajo, con precalentamiento en momento libre para no perder el uso offline). |
| Sacar las 63 fotos de `modelos.js` a archivos `.jpg` y que `modelos.html` las cargue bajo demanda | ~1,6 MB menos en un solo archivo; carga progresiva | Medio: cambia la lógica de `modelos.html` y de `cintChk` | Requiere pruebas del módulo Check y de `js/app.js` L1085 (lee `const IMGS` del HTML). |
| Quitar miniaturas duplicadas del `manifest.json` (67 únicas de 88; ~1,1 MB sin comprimir) | ~0,8 MB | Medio: cambia el formato del manifest y la lógica de importación | Requiere tocar `precargarCatalogoDeFabrica` y el exportador del catálogo. |
| Banners en WebP/AVIF con `<source type>` y JPEG de reserva | 25–35 % en banners | Medio: cambia el HTML generado; hay que mantener las rutas JPEG | Se debe comprobar el aspecto con SSIM sobre la versión decodificada. |
| Catálogo de fábrica en Firebase Storage / carga por partes | hasta −12 MB en el primer arranque | Alto: toca Firebase, reglas y la lógica de carga | Solo con confirmación expresa. |
| Recompresión de banners con calidad ~80 | ~25 % | Medio: pérdida visible en banners con degradados (SSIM 0,94–0,97) | Solo si John acepta una pérdida mínima. |

## Fase 16: `apps/modelos.js` fuera de la instalación del service worker

### Qué se encontró (y qué no)
- **No existe `js/modelos.js`.** El archivo es `apps/modelos.js` (1.592.163 bytes; **1.170.834 bytes con gzip**, ≈1,1 MiB; las 63 fotos JPEG en base64 de `const IMGS`, el logo, `DATA`, `CATS`…).
- **`index.html` nunca lo ha cargado.** Solo lo carga `apps/modelos.html` (`<script src="apps/modelos.js?v=…">`), que `js/app.js` abre en el iframe del módulo **Check** (`check()`, ~L666, vía `appHtml('modelos')`) y lee `cintChk()` (~L714). Es decir, ya era «bajo demanda» **para el navegador**: la ventana de inicio (`load`) no lo descarga ni lo ejecuta, ni en el panel ni en la tienda pública.
- Lo que sí lo traía «de forma temprana» era el **service worker**: `sw.js` lo tenía en la lista `PRE`, y por eso se descargaba en cuanto el service worker se instalaba (≈0,9 s después del `load` en la medición), compitiendo con el resto del precache, **cada vez que se sube la versión de la caché**. En la tienda pública (`?tienda`) no se registra el service worker, así que allí nunca se descargaba (antes ni después).
- Por eso **no hizo falta un cargador `cargarModelos()` con inyección de `<script>`**: no hay ningún consumidor síncrono ni ninguna otra pieza que lea sus variables globales (`IMGS`, `LOGO`, `DATA`, `CATS`…). Solo las lee el propio `apps/modelos.js`/`modelos.html` dentro de su iframe. Añadir una capa de promesas habría sido riesgo sin beneficio.

### Qué se cambió
| Archivo | Cambio |
|---|---|
| `sw.js` | `apps/modelos.js` sale de `PRE` (ya no se descarga al instalar). Nueva constante `MODELOS='apps/modelos.js?v=rendimiento-fase-16'` y un manejador `message`: ante `'precalentar-modelos'` descarga y guarda ese archivo en la caché **solo si aún no está**. Caché `tj-net-first-12`. |
| `js/app.js` | `precalentarModelos()` (tras registrar el service worker): 5 s después del `load`, y en un momento libre del navegador (`requestIdleCallback`, máximo 10 s más), pide al service worker que guarde `modelos.js`. **No lo pide** en la tienda pública, sin conexión, con «ahorro de datos» activado ni con conexión 2G. También lo pide 8 s después de un cambio de service worker (usuarios que se actualizan desde la fase anterior). |
| `apps/modelos.html` | `<script src="apps/modelos.js?v=rendimiento-fase-16">`. Misma ruta propia (`'self'`), la CSP no cambia. |
| `index.html` | `js/app.js?v=rendimiento-fase-16`. |

### Offline
- Si el precalentamiento llega a ejecutarse (lo normal), `modelos.js` queda en la caché sin conexión como antes, pero **después** de pintar el panel y fuera de la instalación.
- Si no llega (ahorro de datos, 2G, el usuario cerró la pestaña antes), se guarda **la primera vez que se abre Check con conexión** (el manejador `fetch` del service worker ya guardaba todo lo que descargaba). Solo en ese caso concreto —nunca abrió Check y está sin conexión— Check no tendría datos, igual que ya pasaba con otros archivos fuera de `PRE`.
- Para quitar el precalentamiento y dejarlo 100 % bajo demanda basta borrar `.then(precalentarModelos)` en `js/app.js` (el resto sigue valiendo).

### Medidas (Chrome real 1.ª visita con contexto limpio, panel de prueba en local con servidor que aplica gzip, como GitHub Pages)
| Medida | Antes (main) | Después (fase 16) |
|---|---:|---:|
| Tamaño `apps/modelos.js` sin comprimir / gzip | 1.592.163 / 1.170.834 | igual (no se tocó el archivo) |
| ¿Se pide en la carga inicial (hasta el evento `load`)? | No | No |
| Cuándo lo pide el service worker (sin límite de ancho de banda) | 1,0 s tras empezar | 5,9 s |
| Bytes servidos hasta 4 s después del `load` | 3.086.436 | 1.915.278 (**−1.171.158, −38 %**) |
| Bytes servidos en los primeros 30 s | 3.155.372 | 3.156.536 (el precalentamiento sigue ocurriendo, más tarde) |
| Evento `load` (sin límite / 200 KB/s) | 0,82 s / 4,12 s | 0,84 s / 4,07 s (sin cambio: nunca estuvo en el camino) |
| Tienda pública (`?tienda`) | 0 bytes de `modelos.js`, sin service worker | igual |

**Lectura honesta:** el `load` no mejora, porque `modelos.js` no estaba en el camino de la primera pantalla. Lo que mejora es la ventana inmediata posterior (≈1,1 MiB menos compitiendo con el resto del precache, las llamadas a Firebase y la navegación del usuario), y se evita el gasto con «ahorro de datos» o 2G. A los 30 s el total descargado es el mismo, a menos que se quite el precalentamiento (alternativa 100 % bajo demanda, arriba).

### Hallazgo aparte (no corregido; ya existía)
`cintChk()` (`js/app.js` ~L714, tarjeta «Modelos» de la franja de Inicio) busca `const IMGS = ` **dentro de `apps/modelos.html`**, pero desde la fase SEG-04 etapa 3B ese dato vive en `apps/modelos.js`; por eso `indexOf` devuelve −1, el `JSON.parse` falla y se queda en el aviso silencioso «error ignorado … Unexpected token 'm', "ml>" is not valid JSON». El resultado es la franja de reserva. Arreglarlo exigiría que Inicio descargue `modelos.js` (1,1 MiB) o separar el dato; se deja como propuesta porque contradice el objetivo de esta fase.

## Respaldo y cómo revertir

El `catalogo_default.zip` original está en el Release [`respaldo-fase-8`](https://github.com/jhon01guevara/TARJETERIA-JHON/releases/tag/respaldo-fase-8) (`respaldo-fase-8.zip`, SHA-256 `650c2ef0b5fa5a2a7d322234e375196cdef594ca50ff8d64bd47380150b33a61`, con `SHA256SUMS.txt`; el original tiene SHA-256 `665e2d23c92f355de9755ccea26ce9dd625a3003749cf86e7225c8b518734a7f`). También sigue en el historial de Git.

Para restaurarlo, cualquiera de estas dos formas:
1. Revertir el PR de la fase 8 en GitHub (botón *Revert*).
2. Descargar `respaldo-fase-8.zip`, descomprimirlo, copiar `catalogo_default.zip` a la raíz del repo y subirlo con un PR; comprobar con `sha256sum -c SHA256SUMS.txt`.

Los dispositivos que ya tienen el catálogo cargado no vuelven a descargar el zip, así que el cambio solo afecta a los primeros arranques.
