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
| Quitar `apps/modelos.js` de `PRE` en `sw.js` (y subir la caché a `tj-net-first-7`) | −1,6 MB en la instalación del service worker | Bajo/medio: pérdida de uso offline del módulo Check la primera vez | Probar abriendo Check con internet, luego sin conexión. |
| Sacar las 63 fotos de `modelos.js` a archivos `.jpg` y que `modelos.html` las cargue bajo demanda | ~1,6 MB menos en un solo archivo; carga progresiva | Medio: cambia la lógica de `modelos.html` y de `cintChk` | Requiere pruebas del módulo Check y de `js/app.js` L1085 (lee `const IMGS` del HTML). |
| Quitar miniaturas duplicadas del `manifest.json` (67 únicas de 88; ~1,1 MB sin comprimir) | ~0,8 MB | Medio: cambia el formato del manifest y la lógica de importación | Requiere tocar `precargarCatalogoDeFabrica` y el exportador del catálogo. |
| Banners en WebP/AVIF con `<source type>` y JPEG de reserva | 25–35 % en banners | Medio: cambia el HTML generado; hay que mantener las rutas JPEG | Se debe comprobar el aspecto con SSIM sobre la versión decodificada. |
| Catálogo de fábrica en Firebase Storage / carga por partes | hasta −12 MB en el primer arranque | Alto: toca Firebase, reglas y la lógica de carga | Solo con confirmación expresa. |
| Recompresión de banners con calidad ~80 | ~25 % | Medio: pérdida visible en banners con degradados (SSIM 0,94–0,97) | Solo si John acepta una pérdida mínima. |

## Respaldo y cómo revertir

El `catalogo_default.zip` original está en el Release [`respaldo-fase-8`](https://github.com/jhon01guevara/TARJETERIA-JHON/releases/tag/respaldo-fase-8) (`respaldo-fase-8.zip`, SHA-256 `650c2ef0b5fa5a2a7d322234e375196cdef594ca50ff8d64bd47380150b33a61`, con `SHA256SUMS.txt`; el original tiene SHA-256 `665e2d23c92f355de9755ccea26ce9dd625a3003749cf86e7225c8b518734a7f`). También sigue en el historial de Git.

Para restaurarlo, cualquiera de estas dos formas:
1. Revertir el PR de la fase 8 en GitHub (botón *Revert*).
2. Descargar `respaldo-fase-8.zip`, descomprimirlo, copiar `catalogo_default.zip` a la raíz del repo y subirlo con un PR; comprobar con `sha256sum -c SHA256SUMS.txt`.

Los dispositivos que ya tienen el catálogo cargado no vuelven a descargar el zip, así que el cambio solo afecta a los primeros arranques.
