# Guía de pruebas de la CSP (Fase 13) — para John

La CSP es la "lista de permitidos" del navegador: dice qué scripts y estilos puede cargar el panel.
En esta fase se hizo más estricta. **Lo único que puede salir mal** es que el navegador bloquee algo legítimo; si pasa,
lo verás como **un mensaje rojo en la consola** (no se pierden datos). Esta guía te dice cómo mirarlo.

> Antes de unir el PR, prueba en la **copia de prueba**: https://tarjeteria-jhon-prueba.web.app/
> (usuarios de `GUIA-PRUEBA.md`; contraseña de prueba, la que ya usas). Ahí ya está desplegada la rama.
> Después de unir el PR, repite el recorrido corto (sección 4) en producción.

## 1. Cómo abrir la consola (F12)

1. Abre el panel en **Chrome** (o Edge).
2. Pulsa **F12** (en Mac: Cmd+Opt+I). Se abre un panel; ve a la pestaña **Console** (Consola).
3. Arriba a la derecha de la consola, comprueba que el filtro de niveles muestre **Errors** (Errores).
4. Pulsa el icono 🚫 (Clear console) para limpiarla y recarga con **Ctrl+Shift+R** (recarga sin caché).
5. Deja la consola abierta mientras haces el recorrido.

## 2. Qué buscar

Busca en rojo frases como:

* `Refused to apply inline style because it violates the following Content Security Policy directive: "style-src-elem …"`
* `Refused to load the script '…' because it violates the following Content Security Policy directive: "script-src …"`
* `Refused to load the stylesheet …`

Si aparece una de esas, **cópiala completa** (clic derecho → *Copy message*) y mándamela, y dime en qué pantalla estabas.

**Esto es normal y NO es culpa de esta fase** (ya salía antes):

* `Executing inline event handler violates the following Content Security Policy directive 'script-src …'` — aparece una vez
  al abrir ciertas pantallas (ajustes de la tienda). No rompe nada: los botones funcionan por otro camino.
* Avisos 404 de `catalogo_default.zip` en la copia de prueba (ese archivo no está allí).
* En la copia de prueba, avisos de App Check o EmailJS desactivados.

## 3. Recorrido completo (≈ 15 minutos, con la consola abierta)

Marca cada punto: **✅ se ve bien y la consola no muestra "Refused…"** o **❌ (copia el mensaje)**.

| # | Pantalla / acción | Qué debe pasar |
|---|---|---|
| 1 | **Login**: cerrar sesión y volver a entrar | La pantalla de acceso se ve normal (colores, logo); entra sin errores |
| 2 | **Inicio** | Tarjetas de ventas, gráfico de "Evolución de ventas" (Chart.js) dibujado, hora arriba |
| 3 | **Nueva factura**: emitir una de prueba | Se calcula el total; se guarda |
| 4 | **Facturas → abrir una → botón PDF** | Se descarga el PDF y **se ve igual que antes** (usa html2canvas + jsPDF; es la prueba más importante de esta fase) |
| 5 | **Inicio → Reporte en PDF** (elige "mes") | Se descarga el PDF del reporte |
| 6 | **Catálogo** y **Productos** | Se ven las tarjetas/estilos; en Catálogo prueba **PDF** o **Compartir** si tienes datos |
| 7 | **Marketing** | Abre el editor, se ven los paneles; crea un diseño de prueba y exporta la imagen |
| 8 | **Empresas** | Lista de empresas con estilos normales |
| 9 | **Mapa de clientes** y **Ubicación** | El mapa (Leaflet) se ve con sus mosaicos y marcadores, con controles de zoom bien colocados |
| 10 | **Check** | El módulo de modelos se ve con el fondo rosa/azul "cristal" (si lo ves plano y blanco, es un fallo) |
| 11 | **Configuración → Investigación de productos** | Abre el panel a pantalla completa con fuente "Instrument Sans" y se ve ordenado |
| 12 | **Tienda virtual** (menú *Tienda virtual*) y la **tienda pública** `…/?tienda` | Carrusel, botón verde de WhatsApp flotante y redes sociales con estilo |
| 13 | **Pedidos de la tienda → Constancia legal** (si tienes un pedido con términos aceptados) | Se abre una pestaña con el texto formateado (título grande, tabla con bordes). El botón "Imprimir" de esa pestaña no funcionaba antes tampoco: usa Ctrl+P |
| 14 | **reCAPTCHA / App Check** (solo en **producción**, no en la copia de prueba) | En la consola no debe salir ningún "Refused" que mencione `recaptcha`, `gstatic.com` o `google.com`; la lista de pedidos/datos carga con normalidad |
| 15 | **EmailJS** (solo producción): envía un correo de prueba desde donde lo uses (p. ej. recuperar/enviar comprobante) | Se envía; sin "Refused" que mencione `emailjs` o `api.emailjs.com` |
| 16 | Tema oscuro/claro (selector arriba a la derecha) | Los colores cambian |

## 4. Recorrido corto en producción (≈ 3 minutos, tras unir el PR)

Con F12 abierto y **Ctrl+Shift+R**: entrar (1) → Inicio (2) → una factura en PDF (4) → Check (10) → Mapa (9) → tienda pública (12).
Si todo está en ✅, la fase está lista. En el panel de **Firebase → App Check**, la lista de "Supervisión" debe seguir en ≈ 98 %.

## 5. Si algo se rompe: cómo volver atrás

* El cambio vive en el PR de la rama `csp-fase-13`. Para deshacerlo: en GitHub, abre el PR ya unido y pulsa **Revert**
  (o dime y lo reviertes conmigo). Vuelve exactamente a la CSP anterior.
* El service worker sube la caché a `tj-net-first-9`: el navegador baja los archivos nuevos solo. Si ves algo viejo, **Ctrl+Shift+R**.
* Mientras se revierte, el panel sigue funcionando; el único riesgo es estético o de una función concreta, no de datos.

## 6. Qué cambió (resumen)

* Los estilos del panel (`<style>` en `index.html`) pasaron a archivos: `css/panel.css`, `css/inyectados.css`, `css/chkskin.css`,
  `apps/modelos.css`, `apps/investigacion.css`. Cero cambios de aspecto (se comparó pantalla por pantalla contra la versión anterior:
  solo difiere el reloj).
* `style-src-elem` ya no permite estilos en línea (solo archivos del sitio, Google Fonts, leaflet y tres "huellas" exactas).
  Los `style="…"` pequeños dentro del HTML generado siguen permitidos (`style-src-attr`).
* `script-src` ya no permite sitios completos (cdnjs, jsdelivr, gstatic, google): solo la carpeta exacta de cada biblioteca.
  También se quitó `apis.google.com`.
* Detalle técnico y riesgos: `docs/AUDITORIA-SEGURIDAD.md` (sección 2).
