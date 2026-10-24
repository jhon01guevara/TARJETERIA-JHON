# Personalización completa · 23 de octubre de 2026

Todo lo que ve el cliente y el equipo, editable **por empresa** desde Configuración. Suite: 98 pruebas.

## 1 · 🔐 Configuración de inicio de sesión (pestaña 🌐)
- **Logo de la pantalla de acceso**: imagen, **GIF animado** o **video corto** (MP4/WebM). Subida directa
  (videos van a Firebase Storage; imágenes/GIF se guardan comprimidas) o **enlace URL**. Se sincroniza
  a todos los dispositivos de la empresa.
- **Título y descripción** encima del formulario (por defecto: el nombre de la empresa).
- **Fondo** (ya existente): imagen/video HD, 5 presets, oscurecer y desenfoque.
- Fallbacks en cadena: logo de sesión → logo de factura → logo del panel.

## 2 · 🏢 Datos de la empresa (pestaña ⚙️) — logo en la factura
- Nuevo campo **"Logo de la empresa (aparece en la factura)"** (imagen ≤150 KB, comprimida sola).
- La factura (plantilla clásica y Apple) usa su logo con fallback al del panel.
- La plantilla Apple usa la descripción del login como lema bajo el nombre.

## 3 · 🖼 Plantilla de la web (pestaña 🌐, primera tarjeta)
Reúne en UN lugar (antes "Temática de temporada"):
- **Temáticas de temporada** (Madres, Navidad, Galaxia…) y **Paletas PRO** de color.
- **Logo, portada, foto/video de fondo, watermark** y animaciones (guardar con el botón violeta).
- **🎠 Banners promocionales (NUEVO)**: hasta 6 imágenes propias (subida ≤250 KB o enlace),
  con orden y borrado. Si no agrega ninguno, la tienda usa los banners que trae el panel.
- **🔘 Forma de los botones (NUEVO)**: píldora / redondeado / casi cuadrado — aplica al instante
  en la tienda pública (`--kbtn-r`).
- **Carrusel** de portada y enlaces de vendedores.
- **🛡️ Políticas (NUEVA UBICACIÓN)**: ahora en la pestaña web. Todos los textos (tienda, constancia
  legal, copia al portapapeles) usan **el nombre real de la empresa activa** y su correo/teléfono de
  Datos de la empresa — mismo texto legal, cero nombres fijos.

## 4 · Empresas nuevas: nacen con demo completo (GENUINE incluida si se recrea)
Al crear una empresa se genera automáticamente:
- Plantilla con **SU nombre** (título de portada, login, WhatsApp, políticas).
- **3 productos de ejemplo** con imagen SVG de demostración (editable/borrable).
- `panel/data` arranca con `cfg.nombre` correcto y **sin banners heredados**.
- En todo el panel, los textos fijos "Tarjetería Jhon" fueron reemplazados por
  `nombreNegocio()` (empresa activa → cfg.nombre → histórico).

## Notas técnicas
- Videos del logo de sesión usan Firebase Storage (como el fondo). GIF se guarda intacto (≤900 KB).
- Banners y forma de botones viven en `tienda_items/__cfg` (`banners`, `btnRadio`) — por empresa.
- `nombreNegocio()` (app.js) + `empNombreActiva()` (empresas.js) resuelven el nombre en cascada.
- Tests: `tests/personalizacion.test.js` (7) — suite total **98**.
- Sin cambios de reglas ni de facturacion.js.
