# Ayuda y soporte dentro de VEN CRM (Etapa 5)

**Dónde:** menú **❓ Ayuda y soporte** (grupo «Más» del menú, también en la barra inferior del teléfono) y botón «Ayuda y soporte» al final de la tarjeta «Primeros pasos» de Inicio. Lo ve **todo usuario con sesión** (administrador y vendedores); nunca aparece en la tienda pública.

**Qué tiene**
1. **🚀 Primeros pasos:** cuántos pasos lleva y botón para continuar la guía.
2. **❓ Preguntas frecuentes** (12, cortas): factura, cliente, producto, anular, tienda en línea, datos/logo de la empresa, invitar vendedor, copia/exportar datos, instalar la app, contraseña olvidada, app que se ve vieja, dónde se guardan los datos. Cada una con botón «Ir a…». **Según el rol:** el vendedor solo ve las preguntas que no son de administrador y de pantallas a las que tiene permiso.
3. **💬 Contacto y soporte:**
   - **Su empresa:** teléfono y correo que la empresa ya escribió en «Datos de la empresa» (botones WhatsApp, Llamar y correo). Si no hay, no se muestra.
   - **Soporte de VEN CRM:** viene de `js/soporte-config.js`. **Hoy está vacío**: no existe todavía un correo ni WhatsApp de soporte (no se inventó ninguno) y la pantalla dice «Todavía no hay un canal de soporte público activo… escríbale a la persona que le dio acceso a VEN CRM».
   - **Datos para soporte:** empresa, tipo de usuario, pantalla desde la que abrió la ayuda, si la app está instalada, versión de la app y navegador, listos para copiar y pegar. Sin contraseñas ni datos de clientes.

## Cómo activar el soporte de VEN CRM (decisión de John)
1. Cree un canal que **alguien atienda**: un número de WhatsApp y/o un correo (por ejemplo, `soporte@vencrm.com` con *Email Forwarding* de Namecheap, ver `docs/MARCA-VEN-CRM.md` punto 9; hoy **no está creado**).
2. Edite **solo** `js/soporte-config.js`:
   ```js
   window.VEN_SOPORTE = { whatsapp: '50761234567', correo: 'soporte@vencrm.com', horario: 'Lunes a viernes, 8 a. m. a 5 p. m. (hora de Panamá)' };
   ```
   `whatsapp`: solo dígitos con código de país. `correo`: dirección válida. `horario`: opcional. Un campo vacío o inválido simplemente no se muestra.
3. Suba el número de `?v=` de `js/soporte-config.js` en `index.html` y la versión de caché de `sw.js`; pase `npm test`, `npm run comprobar` y `npm run humo`, y despliegue como siempre (`docs/LISTA-ANTES-DE-DESPLEGAR.md`).

## Detalles técnicos
- `js/ayuda.js` solo **lee** (no escribe en Firestore ni en localStorage, no usa red). Añade `['ayuda','❓','Ayuda y soporte']` a `V` y `R.ayuda`.
- `js/app.js`: `puede()` deja pasar a `ayuda` a todo usuario con sesión (`(k==='ayuda'&&!!SES)`); el resto de permisos no cambia.
- Estilos en `css/guia.css`. Sin `<style>` ni `onclick` en línea (CSP intacta).
- **Quitarlo:** borrar los dos `<script>` de `index.html`, sus entradas de `sw.js`, el botón de `js/guia.js` y `(k==='ayuda'&&!!SES)||` de `puede()`.
- **Pruebas:** `tests/ayuda.test.js` y `tests/navegador/ayuda-soporte.js` (Chrome real, proyecto de PRUEBA, empresa `ayuda-prueba`).
