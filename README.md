# Tarjetería Jhon · Panel de Facturación

Panel web (PWA) de ventas y facturación de **Tarjetería Jhon**, con catálogo, tienda pública, chat de equipo,
editor de marketing y soporte multiempresa. Funciona como sitio estático (HTML + JavaScript, sin paso de compilación)
y guarda sus datos en **Firebase** (proyecto `tarjeteria-jhon`).

> Publicado con GitHub Pages: <https://jhon01guevara.github.io/TARJETERIA-JHON/>

## Qué incluye

Según el código y la documentación de `docs/`:

- **Facturación y ventas**: facturas, clientes, ubicaciones y agenda (`js/facturacion.js` contiene los cálculos puros).
- **Roles**: administrador y vendedores, cada vendedor con sus propios datos (ver `migracion-panel-roles.md`).
- **Catálogo y tienda pública**: productos publicados, pedidos y registro de clientes de la tienda.
- **Personalización por empresa**: logo, pantalla de acceso, temáticas, paletas y banners (`docs/PERSONALIZACION.md`).
- **Marketing Studio**: editor de diseños por capas para imágenes publicitarias (`docs/MARKETING-STUDIO.md`).
- **Multiempresa**: esquema `empresas/{eid}/…` y herramientas de migración (`docs/ESQUEMA-MULTIEMPRESA.md`).
- **PWA**: `manifest.json` y service worker `sw.js` (red primero; usa la copia guardada si no hay conexión).
- **Apps auxiliares** en `apps/`: *Modelos* e *Investigación de productos*.

## Estructura de carpetas

```
.
├── index.html                 # Página principal (panel y tienda)
├── manifest.json              # Manifiesto PWA
├── sw.js                      # Service worker
├── firestore.rules            # Reglas de seguridad de Firestore
├── estilo-tienda-shop.css     # Estilos de la tienda
├── css/                       # Estilos adicionales (uber-skin.css)
├── js/                        # Lógica del panel (app.js, facturacion.js, empresas.js, marketing.js, ...)
├── apps/                      # Apps auxiliares (modelos, investigacion)
├── migraciones/               # Herramientas de migración multiempresa
├── docs/                      # Documentación técnica
├── tests/                     # Pruebas automáticas (Node)
├── assets/ banners/           # Imágenes y recursos
├── catalogo_default.zip       # Catálogo por defecto que carga la app
├── icon-*.png, apple-touch-icon.png # Iconos de la PWA
└── .github/workflows/facturacion.yml  # CI: ejecuta las pruebas
```

> Los recursos del video promocional (logos y tarjetas, antes en `video-assets/`) se archivaron en el [Release `respaldo-video-assets`](https://github.com/jhon01guevara/TARJETERIA-JHON/releases/tag/respaldo-video-assets).

## Cómo ejecutarlo en local

No hay compilación. Sirve la carpeta con cualquier servidor estático, por ejemplo:

```bash
python3 -m http.server 8080
# o: npx serve .
```

Luego abre <http://localhost:8080>. (Algunas funciones, como el inicio de sesión y la sincronización,
necesitan conexión a Firebase y un usuario válido.)

## Pruebas

Requiere Node.js (el CI usa Node 20). No hay dependencias que instalar:

```bash
npm test
```

Ejecuta `node --test tests/*.test.js` (la suite actual tiene 98 pruebas). El workflow
`.github/workflows/facturacion.yml` las corre en cada *push* y *pull request*.

## Despliegue (GitHub Pages)

El sitio se publica como estático desde GitHub Pages. Los cambios que se unen a `main` se publican.
Antes de unir cambios, confirma que GitHub Actions termina en verde.

## Firebase y reglas de seguridad

- Proyecto Firebase: `tarjeteria-jhon` (configuración en `js/app.js`).
- Las reglas están en `firestore.rules` y **no se despliegan solas**: se copian a
  Firebase Console → Firestore Database → Rules y se pulsa **Publicar**.
- Las colecciones no listadas en las reglas quedan denegadas por defecto.
- Detalle de colecciones y permisos: `docs/DIAGNOSTICO-MULTIEMPRESA.md` y `docs/ESQUEMA-MULTIEMPRESA.md`.

## Documentación

| Documento | Contenido |
|---|---|
| `docs/DIAGNOSTICO-MULTIEMPRESA.md` | Diagnóstico de la arquitectura, colecciones y reglas |
| `docs/ESQUEMA-MULTIEMPRESA.md` | Esquema multiempresa y estado de fases |
| `docs/FASE6-MIGRACION-PRUEBAS.md` | Migración de prueba en un proyecto Firebase aparte |
| `docs/MARKETING-STUDIO.md` | Módulo de marketing |
| `docs/PERSONALIZACION.md` | Opciones de personalización por empresa |
| `migracion-panel-roles.md` | Separación de datos por rol y orden seguro de publicación |

## Pendientes (TODO)

- TODO: añadir capturas de pantalla del panel y de la tienda.
- TODO: añadir un archivo `LICENSE` (el autor debe elegir la licencia).
- TODO: completar esta sección con datos de contacto del proyecto, si se desea.
