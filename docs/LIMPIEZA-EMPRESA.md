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
