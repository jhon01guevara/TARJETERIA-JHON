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
| Banners en WebP/AVIF con `<source type>` y JPEG de reserva | 25–50 % en banners | Medio: cambia el HTML generado; hay que mantener las rutas JPEG | **Aplicado en la Fase 22** (ver sección «Fase 22»): −22 % (1,68 MB menos entre los 28 archivos), con pérdida visual leve aceptada por John (SSIM 0,945–0,972). |
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


## Fase 17: `cintChk()` y `apps/modelos-cintillo.json`
- `cintChk()` (barra «Modelos» de Inicio) leía `const IMGS`/`const DATA` de `apps/modelos.html`; esos datos viven en `apps/modelos.js` desde SEG-04 etapa 3B, así que la lectura fallaba en silencio y la barra mostraba solo la tarjeta genérica.
- Solución: `apps/modelos-cintillo.json` (94,9 KB; 30 modelos, miniatura 88×88) generado por `tests/herramientas/generar-cintillo.py` a partir de `apps/modelos.js`. Se pide solo cuando la barra no tiene agenda ni catálogo propio que mostrar. Se añade a `PRE` de `sw.js` (caché `tj-net-first-13`). `modelos.js` sigue sin descargarse al inicio. El test `tests/avisos-fase-17.test.js` falla si el JSON deja de coincidir con `modelos.js`.
- `catalogo_default.zip`: existe y carga en producción (GitHub Pages, 200, mismo SHA-256 que el repo). El 404 sale solo en las copias de Firebase (prueba y `tarjeteria-jhon.web.app`), que no incluyen ese archivo. Sin cambios de código.

## Fase 12: banners en WebP (medido; lo aplicado está en la Fase 22, al final)

**Resultado: no se aplicó ningún cambio al sitio.** Los banners siguen siendo los mismos 28 JPG (7.511.181 bytes). Se midió WebP y no cumple el criterio acordado (SSIM ≥ 0,985 **y** ahorro ≥ 20 %), así que ningún archivo recibió versión WebP.

### Cómo se sirven hoy los banners
- `js/app.js` (`promoSlide`, ~L3198) genera `<picture><source media="(max-width:700px)" srcset="banners/<id>-m.jpg"><img src="banners/<id>.jpg" loading="lazy"></picture>`. Rutas literales en `PROMO_IMG` (~L3196). No hay CSS `background` ni URLs construidas en otro sitio.
- `sw.js` **no** precachea los banners (solo los guarda si se descargan). Por eso añadir WebP no habría exigido cambiar la caché del service worker.
- Dimensiones reales: escritorio 2400×853 px, móvil 1100×1100 px, sin perfil de color ICC. No se redimensiona nada.
- Con `<picture>` el cambio técnico habría sido sencillo y con fallback nativo a JPG (`<source type="image/webp">` antes del `<source>`/`<img>` JPG). El obstáculo es la calidad, no el código.

### Medición (Pillow 13, WebP `method=6`, SSIM por canal con scikit-image, comparando píxeles decodificados contra el JPG original)

| Variante | JPG actual (bytes) | WebP q85 | Ahorro q85 | SSIM q85 (mín–máx) | WebP q90 | Ahorro q90 | SSIM q90 (mín–máx) |
|---|---:|---:|---:|---|---:|---:|---|
| Escritorio (14 × 2400×853) | 4.828.235 | 2.503.180 | 48,2 % | 0,934–0,957 | 3.565.702 | 26,1 % | 0,946–0,969 |
| Móvil (14 × 1100×1100) | 2.682.946 | 1.318.560 | 50,9 % | 0,940–0,962 | 1.907.290 | 28,9 % | 0,949–0,970 |

Pruebas adicionales en `boda2`, `boda2-m` y `cumple` (los de mejor y peor SSIM): q91 ahorra 21–25 % con SSIM 0,948–0,972; q93–q94 llega a SSIM 0,978–0,980 pero el ahorro baja a 0–8 %; con q95 el WebP pesa **más** que el JPG. En ningún punto se juntan SSIM ≥ 0,985 y ahorro ≥ 20 %. Una causa es que el JPG de origen ya es de calidad ~85 y tiene degradados suaves, donde WebP con pérdida introduce bandas sutiles.

**Bytes que descarga un visitante (los 14 posts del carrusel, todos con `lazy`):** hoy 4,83 MB en escritorio o 2,68 MB en móvil. El WebP potencial sería 3,57/1,91 MB (q90) o 2,50/1,32 MB (q85), pero con pérdida visible según SSIM, por lo que no se aplica.

### Qué se hizo y qué no
- No se generó ni se subió ningún `.webp`, no se cambió `js/app.js`, `index.html` ni `sw.js`, y la caché sigue en `tj-net-first-8`.
- Se añade `docs/medir-webp-banners.py` para repetir la medición.
- Opciones si John acepta una pérdida leve (SSIM ≈ 0,95–0,97, similar al q82 JPEG descartado en la fase 8): WebP q85–q90 con `<picture>` y fallback JPG. Ahorro real esperable: ≈ 1,3–2,3 MB por visitante. Antes habría que revisarlo a ojo, sobre todo `cumple` y `felic` (SSIM más bajo).
- Alternativa sin pérdida de calidad percibida: regenerar los banners **desde su diseño original** (no desde el JPG ya comprimido) directamente en WebP. Requiere los archivos fuente.

## Fase 22: banners en WebP con respaldo JPG (aplicado)

John aceptó una pérdida leve de calidad (la Fase 12 había medido que ningún banner cumple SSIM ≥ 0,985 con ≥ 20 % de ahorro). Se aplica WebP con `<picture>` y el JPG original como respaldo. **Los 28 JPG no se tocan ni se borran.**

### Cómo se eligió la calidad
`docs/generar-banners-webp.py` prueba, por imagen, calidades de 92 a 85 (Pillow, `method=6`, sin metadatos EXIF/XMP/ICC) y se queda con la **más alta** que ahorra **≥ 20 %** de bytes frente al JPG (si ni a q85 llegara al 15 %, no se genera el `.webp` y el banner queda en JPG; **no hizo falta: los 28 cumplen**). Con calidades más altas no hay ahorro real: q94 ahorra 0–7 %, q96 pesa más que el JPG. Resultado: q90–q92, SSIM 0,945–0,972.

| Banner | JPG (bytes) | WebP (bytes) | Calidad | Ahorro | SSIM |
|---|---:|---:|---:|---:|---:|
| `amor-m` | 189.309 | 146.548 | q92 | 22.6 % | 0.9639 |
| `amor` | 343.376 | 262.042 | q91 | 23.7 % | 0.9601 |
| `amor2-m` | 183.291 | 139.660 | q92 | 23.8 % | 0.9641 |
| `amor2` | 320.725 | 249.654 | q92 | 22.2 % | 0.9591 |
| `baby-m` | 187.083 | 145.038 | q91 | 22.5 % | 0.9657 |
| `baby` | 337.129 | 267.638 | q91 | 20.6 % | 0.9638 |
| `baby2-m` | 178.004 | 135.270 | q91 | 24.0 % | 0.9644 |
| `baby2` | 293.120 | 229.786 | q91 | 21.6 % | 0.9664 |
| `boda-m` | 178.049 | 133.504 | q91 | 25.0 % | 0.9710 |
| `boda` | 341.111 | 272.736 | q91 | 20.0 % | 0.9706 |
| `boda2-m` | 182.622 | 136.420 | q91 | 25.3 % | 0.9717 |
| `boda2` | 325.870 | 258.240 | q91 | 20.8 % | 0.9721 |
| `cumple-m` | 199.740 | 157.940 | q92 | 20.9 % | 0.9521 |
| `cumple` | 368.979 | 288.112 | q91 | 21.9 % | 0.9477 |
| `cumple2-m` | 190.282 | 150.826 | q92 | 20.7 % | 0.9537 |
| `cumple2` | 345.414 | 261.446 | q91 | 24.3 % | 0.9446 |
| `felic-m` | 207.616 | 161.116 | q91 | 22.4 % | 0.9554 |
| `felic` | 392.495 | 300.266 | q90 | 23.5 % | 0.9517 |
| `felic2-m` | 210.341 | 163.968 | q91 | 22.0 % | 0.9537 |
| `felic2` | 364.130 | 285.628 | q91 | 21.6 % | 0.9513 |
| `grad-m` | 196.938 | 151.604 | q91 | 23.0 % | 0.9656 |
| `grad` | 357.599 | 281.192 | q91 | 21.4 % | 0.9648 |
| `grad2-m` | 186.216 | 140.052 | q91 | 24.8 % | 0.9654 |
| `grad2` | 316.202 | 248.026 | q91 | 21.6 % | 0.9642 |
| `quince-m` | 196.068 | 150.372 | q91 | 23.3 % | 0.9612 |
| `quince` | 361.007 | 285.882 | q91 | 20.8 % | 0.9589 |
| `quince2-m` | 197.387 | 147.570 | q91 | 25.2 % | 0.9608 |
| `quince2` | 361.078 | 280.258 | q91 | 22.4 % | 0.9598 |
| **Escritorio (14)** | **4.828.235** | **3.770.906** | | **21.9 %** | |
| **Móvil (14)** | **2.682.946** | **2.059.888** | | **23.2 %** | |
| **Total (28)** | **7.511.181** | **5.830.794** | | **22.4 %** | |

(Bytes sin comprimir; los banners ya son imágenes comprimidas, gzip no los reduce.)

### Revisión visual (a ojo, lado a lado, al 100 %)
Se compararon JPG y WebP de `cumple`, `felic` (los de SSIM más bajo, 0,945–0,955), `quince`, `boda` y las variantes móviles, y una hoja con la **diferencia ×6 de los 14 banners de escritorio**: la diferencia está solo en los bordes de los textos y de las ilustraciones (ruido de compresión), **sin bandas en los degradados ni en los fondos planos**. Lo que SSIM penaliza es el *grano* fino del fondo plano del JPG original (p. ej. el amarillo de `cumple`), que el WebP suaviza; a tamaño normal es imperceptible, y el texto fino («Colección · Felicitaciones», subtítulos) se ve igual de nítido. Ninguno se dejó en JPG por calidad.

### Qué cambió en el código
| Archivo | Cambio |
|---|---|
| `banners/*.webp` | 28 archivos nuevos (14 escritorio 2400×853 y 14 móvil 1100×1100), junto a cada JPG. |
| `js/promo.js` | `PROMO_IMG[id]` gana dos entradas (`[2]` WebP escritorio, `[3]` WebP móvil). `promoSlide` genera `<picture><source media="(max-width:700px)" srcset="…-m.webp" type="image/webp"><source media="(max-width:700px)" srcset="…-m.jpg"><source srcset="….webp" type="image/webp"><img src="….jpg"></picture>`. Un navegador sin WebP salta los `<source type="image/webp">` y usa el JPG. Si un banner no tuviera `.webp`, basta no ponerle esas dos entradas. Los banners propios (subidos por el dueño, `data:`) no cambian. |
| `index.html` | `js/promo.js?v=banners-fase-22`. |
| `sw.js` | Caché `tj-net-first-16`. Los banners nunca estuvieron en `PRE` (se guardan al descargarse, con el manejador `fetch`), así que no se precachean los nuevos: sería +1,7 MB en cada instalación para algo que se ve con `lazy`. |
| CSP | Sin cambios: `img-src 'self'` ya cubre `/banners/*.webp`. |
| Otros usos | Se buscaron todos: solo `js/promo.js` nombra los banners (no hay `background-image`, ni rutas construidas en `app.js`, ni en CSS). |

### Verificación en Chrome real (`tests/navegador/banners-fase22.js`)
- Con WebP: los 14 `<img>` del carrusel resuelven a `.webp` y cargan (`naturalWidth>0`), en escritorio (1366×900, `*.webp`) y en móvil (390×844, `*-m.webp`); no se descarga ningún JPG; 0 violaciones CSP, 0 errores de consola, 0 respuestas 404.
- **Respaldo:** simulando un navegador sin WebP (se reescribe `type="image/webp"` por un tipo desconocido, que es lo que hace un navegador sin soporte), los 14 resuelven al JPG, cargan, y la captura es **idéntica píxel a píxel** a la de `main` (diferencia media 0,000).
- Red limitada (CDP, 200 KB/s y 150 ms): se descarga WebP; primeros banners de escritorio 566.140 bytes (WebP) frente a 722.085 (JPG), de móvil 433.212 frente a 571.459.
- Captura del carrusel WebP frente a `main`: diferencia media 1,04 (escritorio) y 0,65 (móvil) sobre 255; SSIM 0,986 y 0,993.
- Panel (admin y vendedor, todas las pantallas) y tienda: sin consola, CSP ni errores de página nuevos respecto a `main` (`recorrido.js` + `comparar.py`).
- No se puede probar un Chrome real sin soporte WebP (no existe uno actual); el respaldo se verificó como se describe arriba. Una limitación conocida de `<picture>`: si el navegador **soporta** WebP pero el archivo no llega (red caída), no vuelve a probar el JPG.

### Bytes por visitante (14 banners, todos con `loading="lazy"`; el carrusel los va pidiendo)
| | JPG | WebP | Ahorro |
|---|---:|---:|---:|
| Escritorio | 4.828.235 | 3.770.906 | 1.057.329 (21,9 %) |
| Móvil | 2.682.946 | 2.059.888 | 623.058 (23,2 %) |

**Lectura honesta:** el ahorro es de ~0,6–1,1 MB por visitante que recorre todo el carrusel (≈22 %), menor que el 1,3–2,3 MB estimado en la Fase 12, porque se eligió una calidad alta (q90–q92) en lugar de q85. Con q85 se ahorraría ~48 % (≈2,3 MB en escritorio) a costa de SSIM ≈ 0,94–0,96; si se quiere más ahorro basta bajar el tope en `docs/generar-banners-webp.py` y regenerar.

### Cómo revertir
Revertir el PR (quita los `.webp` y devuelve `promoSlide` al `<picture>` de solo JPG) o, sin tocar nada más, borrar las dos entradas `.webp` de cada banner en `PROMO_IMG`.
