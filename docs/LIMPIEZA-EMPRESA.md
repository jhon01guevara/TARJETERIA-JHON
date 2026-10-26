# Limpieza de la empresa activa (Etapa 3)

Herramientas del **administrador** en la pantalla **Empresas** (`js/limpieza-empresa.js`). Actúan solo sobre la **empresa en uso** (botón «Usar»), nunca sobre otra y **nunca sobre la empresa inicial** (Tarjetería Jhon). Siempre con vista previa y confirmación. No existen para vendedores.

## 1. Alta de «Nueva empresa»: vacía por defecto
- La empresa nace **realmente vacía**: solo su nombre en la plantilla de la tienda (`tienda_items/__cfg`: `empresaNombre`, `heroTitle`) y del panel (`panel/data`: `cfg.nombre`, `cfg.loginTitulo`). Sin productos, sin catálogo, sin banner, sin textos de muestra.
- La casilla **«Incluir contenido de ejemplo»** (sin marcar por defecto) añade 3 «Producto de ejemplo» (`demo:1`), un banner (`demo_b1`) y textos de portada/inicio de sesión de muestra.
- **Corrección importante:** antes `empCrearDemo` usaba `fbCol()`, que escribe en la empresa **activa** (en la que está el administrador). Al crear una empresa nueva desde otra, los productos de ejemplo y el nombre/portada de la nueva se guardaban en la tienda y el panel de **la empresa activa** (sobrescribiendo con `merge` su título de portada, banners y nombre). Ahora todo se escribe en `empresas/<id nueva>/…`.
  - **Si ya creaste empresas con la versión anterior** estando dentro de otra (p. ej. dentro de Tarjetería), revisa en esa empresa: productos «Producto de ejemplo 1-3» en la tienda, banner de ejemplo, y el título de portada / nombre de la empresa recién creada. «Quitar ejemplos» (abajo) quita los productos y el banner de ejemplo; el título y el nombre hay que corregirlos a mano en Configuración si cambiaron.

## 2. «Quitar ejemplos» (un clic)
Tarjeta «🧹 Limpieza de «<empresa>»» al final de **Empresas** (visible solo si estás dentro de una empresa que no es la inicial):
- Muestra qué hay de ejemplo (productos `demo_N` con `demo:1`, banner `demo_b1`, portada de muestra).
- «🗑 Quitar ejemplos» → confirmación con el detalle → borra **solo** esos productos y quita el banner/portada de muestra de `tienda_items/__cfg` (y su marca `demo`). No toca productos reales (aunque se llamen parecido: se exige `demo:1` **y** el id `demo_N`), catálogo, clientes, facturas ni la configuración propia. Los textos de inicio de sesión de muestra del panel se editan en Configuración.

## Pruebas
- `tests/empresa-nueva-vacia.test.js` (npm test, Firestore simulado).
- `tests/navegador/empresa-nueva-vacia.js` (Chrome real, copia de PRUEBA; crea y borra `ej-sin-prueba` y `ej-con-prueba`).

## 3. «Quitar lo heredado de Tarjetería» (empresas creadas con la versión anterior)
Antes del arreglo, una empresa nueva podía heredar de Tarjetería: modelos del catálogo de fábrica, los 6 productos de arranque y datos de contacto. La misma tarjeta de limpieza trae un segundo bloque **«Datos heredados de Tarjetería Jhon»** con dos pasos:
1. **«Ver vista previa»** (solo lectura, no escribe nada): cuenta lo que se quitaría.
2. **«Quitar lo heredado»** → confirmación con el detalle («SOLO de esta empresa», «no se puede deshacer») → vuelve a escanear justo antes de borrar → borra.

Qué se considera heredado (coincidencia **exacta**, para no tocar lo propio):
- **Catálogo (nube), tienda y este dispositivo:** modelos cuyo **id Y nombre** coinciden con la lista de fábrica de `catalogo_default.zip` (88 modelos). Un modelo que subiste tú, aunque se llame parecido, no se toca.
- **Productos de arranque:** `p0…p5` con el nombre «TARJETAS DE TODA OCACION[ DISTRUBUCION]» y su precio original.
- **Contacto:** nombre, teléfono y correo de Tarjetería, solo si el valor es idéntico (dirección, banco, RUC… nunca se tocan: «Banco General» o «Panamá Oeste» pueden ser legítimos).

Límites a tener presentes:
- Solo actúa en la empresa **activa** y no aparece en la empresa inicial.
- Los cambios del panel se guardan por el camino normal (`save`); si otro dispositivo tiene el panel abierto con datos viejos, debe **recargar** antes de seguir editando (si no, podría volver a subirlos).
- El catálogo de los otros dispositivos se limpia solo al sincronizar los borrados de la nube.
- Probado únicamente en PRUEBA. **No se ha ejecutado en producción**; si decides limpiar una empresa real, hazlo tú desde el panel, con la vista previa primero.

## Pruebas del bloque heredado
- `tests/limpieza-heredado.test.js` (npm test; incluye la lista de fábrica real de 88 modelos).
- `tests/navegador/quitar-heredado.js` (Chrome real, copia de PRUEBA con `CON_ZIP=1`; siembra y reinicia `vacia-prueba`, comprueba que no cambia nada en la vista previa, que lo propio queda, que tras recargar no reaparece y que la empresa inicial no muestra la herramienta).
