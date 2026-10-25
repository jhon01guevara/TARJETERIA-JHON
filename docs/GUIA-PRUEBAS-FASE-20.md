# Guía de pruebas — Fase 20 (hallazgos menores)

## Qué cambió, en simple
1. **Aviso de «quota» en la tienda (resuelto).** La tienda guardaba en el navegador una copia de los 180 primeros artículos para abrir más rápido, pero cada foto va dentro del artículo (unos 120 000 caracteres): con 63 artículos son ~7,3 millones de caracteres y el navegador solo deja ~5. Por eso **la copia nunca se guardó** y la consola avisaba «exceeded the quota» en cada carga. Ahora se guardan los artículos **más nuevos** que quepan en un presupuesto (máx. 2 millones de caracteres y sin quitarle espacio al resto de datos del panel). Si el navegador está lleno, se borra la copia de otras empresas, se reintenta con la mitad y, si no cabe, no se guarda nada y no se avisa. Efecto visible: al volver a abrir la tienda, los primeros artículos aparecen al instante (antes no había copia); en cuanto llega la nube se muestra el catálogo completo.
2. **Toques del vendedor en la barra «Modelos» (no es un error, es por permisos).** El vendedor de prueba no tiene permiso para «Check» ni «Catálogo» (sus menús son Inicio, Nueva factura, Facturas, Productos, Clientes, Chat…). Al tocar un modelo, el panel intenta abrir «Check» o «Catálogo», no tiene permiso y lo devuelve a Inicio, donde ya estaba: parece que «no hace nada». Con el permiso (lo da el administrador en la pantalla de vendedores), el toque sí navega (lo comprobé dándole el permiso en memoria). **No se cambió nada**: si quieres, otra fase puede mostrar esos modelos sin flecha ni cursor de mano a quien no puede abrirlos.
3. **Zonas táctiles de escritorio (WCAG 2.5.8).** Los 55 controles de escritorio por debajo de 24×24 px (resúmenes «Ver datos», títulos plegables, enlace «¿Olvidó su contraseña?», casillas de etiquetas y de factura, botones pequeños «Ley 81», enlaces sueltos) ahora miden al menos 24 px, con el cambio visual mínimo (unos píxeles de alto). Móvil y escritorio: **0 controles por debajo de 24 px** (antes 55 y 14).
4. **Puntos del carrusel de la tienda:** el botón mide 24×24 px y el punto que se ve sigue siendo de 8 px. Quedan más separados entre sí.
5. **`#k_wa` (botón de WhatsApp de la tienda):** ahora está dentro de una zona con nombre «Contacto por WhatsApp» para lectores de pantalla. Se ve y se coloca igual.
6. Caché del service worker `tj-net-first-17`, `js/app.js?v=hallazgos-fase-20`, `css/accesibilidad.css?v=4`.

## Dónde probar
Panel de prueba: https://tarjeteria-jhon-prueba.web.app/ (usuarios en `GUIA-PRUEBA.md`). Ventana de incógnito + Ctrl+Shift+R.

## Pasos (10 minutos)
1. **Tienda** (`?tienda=1`), consola (F12): **no** debe salir «error ignorado … exceeded the quota». Ve a F12 → Application → Local Storage: aparece `tj_cached_items`. Recarga: los primeros artículos salen de inmediato y luego se completa el catálogo.
2. **Carrusel de la tienda:** los puntos se ven pequeños (8 px) como antes, pero más separados; al tocar uno cambia el banner. En móvil caben dentro de la pantalla.
3. **Escritorio, administrador:** recorre el menú. Debe verse igual que antes. En Configuración, «Ver datos» y los títulos plegables tienen un poco más de alto de clic. Inicio → «🛡️ Ley 81» sigue igual.
4. **Vendedor:** entra, mira la barra «Modelos» de Inicio: al tocar un modelo no pasa nada (es lo esperado, ver punto 2 arriba). Como administrador, el mismo toque lleva a Check.
5. **Móvil (390×844):** Inicio y tienda, igual que antes.
6. **Consola (F12):** sin «Content Security Policy» nuevos ni errores rojos nuevos.

## Pruebas automáticas
- `npm test` (todo verde; `tests/hallazgos-fase20.test.js` prueba la copia local con una cuota simulada igual a la de Chrome: guardado dentro del presupuesto, memoria casi llena, fallo de `setItem`, lista vacía).
- Chrome real (necesita `PRUEBA_PASSWORD`; nunca producción): `BASE=… node tests/navegador/hallazgos-fase20.js` (también `VP=390x844`) y `BASE=… VP=1366x900 node tests/navegador/tamano-zonas.js`.

## Hallazgo extra (no se tocó)
`tj_cached_cfg` (copia local de la configuración de la tienda: tema, banners…) **tampoco se escribía nunca**: el código que la guardaba usaba la variable `cf`, que solo existe dentro de un bloque anterior (ReferenceError atrapado y silencioso). Arreglarlo cambiaría el primer pintado de la tienda (aplicaría el tema guardado antes de que llegue la nube), por eso se deja como decisión tuya.

## Si algo falla
Revierte el PR de la fase 20. Cada cosa es independiente: la copia local está en `shopCacheItems` (`js/app.js`), y los estilos en el bloque «FASE 20» de `css/accesibilidad.css`.
