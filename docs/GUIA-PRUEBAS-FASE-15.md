# Guía de pruebas — Fase 15 (avisos `onclick`, «Imprimir», contrastes, ventanas y teclado)

Qué cambió, en simple:

| # | Tema | Qué se arregló |
|---|---|---|
| 1 | Avisos en la consola | Se quitaron 15 `onclick=` / `onchange=` sobrantes de las tarjetas de portada de la tienda (Configuración). Los botones siguen funcionando igual, por otro mecanismo que ya existía. |
| 2 | Botón «Imprimir constancia» | Antes **no hacía nada** (la CSP bloqueaba el botón de la ventana nueva). Ahora imprime. |
| 3 | Colores | Algunos textos pequeños (verde «Publicado», «Sincronizado», resumen del mapa, días de otro mes en la Agenda, gris del tema Nocturno, botón Carrito de la tienda oscura, etiqueta del carrusel) se ven **un poco** más oscuros o más claros para leerse mejor. |
| 4 | Ventanas (modales) | Se cierran con **Esc**, **Tab** no se sale de la ventana, el foco vuelve al botón que la abrió y tienen nombre para lectores de pantalla. |
| 5 | Apps dentro del panel (Check, Investigación) | Nombres (`title`/`aria-label`) para lectores de pantalla. Sin cambios de lógica. |

## Dónde probar
Primero en el **panel de prueba** (ya tiene estos cambios): https://tarjeteria-jhon-prueba.web.app/  
Usuarios y contraseña: ver `GUIA-PRUEBA.md` (admin.prueba / vendedor.prueba).

Antes de empezar: **Ctrl+Shift+R** (recarga sin caché) y abre la consola con **F12 → pestaña Console**. Los avisos amarillos de `contentscript.js` vienen de una extensión de tu navegador: ignóralos (o prueba en una ventana de incógnito).

## Pasos (unos 20 minutos)

### 1. Avisos «inline event handler» (consola)
1. Entra como administrador, con la consola abierta y vacía (icono 🚫 para limpiarla).
2. Ve a **Configuración → Personalización y configuración web**. Abre (Maximizar) las tarjetas de la tienda: portada, fondo, colores, movimiento, marca de agua. Cambia de pestaña y vuelve 3 veces.
3. En el filtro de la consola escribe `inline event handler`.
4. **Debe salir: nada.** (Antes salían decenas de avisos cada vez que se dibujaba esa pantalla.)

### 2. Los botones de la portada siguen funcionando (importante)
En la misma pantalla, comprueba **cada uno** y que el resultado sea el de siempre:
- Tipo de fondo: Normal / Foto / Video / Colores / Color sólido → el botón elegido se marca y aparecen sus opciones.
- Colores del degradado (Aurora, Atardecer, …) y estilo de movimiento (Constelación, Brillo, Ondas, Pulso, Minimal).
- Marca de agua: elige un color.
- Los 3 botones de video de ejemplo (abren/ponen el video en el campo).
- **Subir un logo**, **una foto** y **un video pequeño**: debe aparecer la vista previa. Prueba también «Quitar logo / foto / video».
- «💾 Guardar cambios de portada» (arriba y abajo). Debe salir el mensaje de guardado, como antes. (En prueba no afecta producción.)

### 3. «Imprimir constancia» de la ventana legal
1. En el panel de prueba normalmente **no hay pedidos con aceptación de términos**. Para probar: abre la consola (F12) y pega esto (si Chrome te dice que escribas `allow pasting`, escríbelo primero):
   `TD.peds.unshift({id:'PRUEBA-LEGAL-1',ts:Date.now(),nota:'Aceptó Términos',lead:{name:'Cliente Prueba',tel:'60000000',email:'a@b.c',terminos:{ok:true,ver:'1.0',ua:'prueba'}}});poliVerEvidencia('PRUEBA-LEGAL-1')`
   (Solo vive en la memoria de esa pestaña; no se guarda.)
2. En la ventana que sale, pulsa **«🖨️ Imprimir constancia»**. Debe abrirse una pestaña nueva con la constancia y, en ella, el botón **«🖨️ Imprimir»**.
3. Pulsa ese botón: **debe abrirse el cuadro de impresión de Chrome.** (Antes no pasaba nada.) Ciérralo con Cancelar. En la vista de impresión el botón no debe aparecer en el papel.
4. Si el navegador bloquea la pestaña nueva, permite ventanas emergentes para el sitio.

### 4. Colores (revisa que se vea «igual, pero legible»)
Con tema **Claro** y luego **Nocturno** (selector arriba a la derecha):
- **Agenda:** los días del mes anterior/siguiente (28, 29, 30, 1, 2…) se leen en gris, ya no casi invisibles. Hoy sigue marcado en negro/rosa.
- **Tienda virtual (panel):** en la lista de productos, «✔ Publicado» en verde más oscuro.
- **Mapa de clientes:** los contadores de colores (con compras, por cobrar, vencidos, sin compras).
- **Barra lateral:** «☁ Sincronizado» en verde.
- **Inicio:** la etiqueta pequeña debajo del carrusel («MODELOS»).
- **Tienda pública** (`?tienda`) en modo oscuro: el botón «Carrito» es de un morado un poco más oscuro.
- **Configuración → Investigación de productos** (botón «Abrir»): ahora el título de la barra superior se lee (antes salía oscuro sobre oscuro) y el botón «Cerrar» ya no tapa el título.
Si algún color te parece raro o muy distinto, anota la pantalla y el tema.

### 5. Ventanas con teclado (modales)
**Panel (administrador):**
1. **Agenda → «➕ Nuevo evento».** La ventana abre con el cursor en el campo de título. Pulsa **Tab** muchas veces: el foco **no debe salir** de la ventana (da la vuelta). Prueba **Mayús+Tab**.
2. Pulsa **Esc**: la ventana se cierra y el foco vuelve al botón «Nuevo evento».
3. Ábrela otra vez, **escribe algo** en el título y pulsa **Esc**: **no se cierra** (a propósito, para no perder lo que escribiste). Ciérrala con «Cancelar».
4. Ábrela y haz clic en el fondo oscuro: sigue cerrando como siempre.
5. Prueba otras ventanas: **Facturas → Ver** (abre la factura) y **Vendedores → «+ Crear vendedor»**: abre, Tab, Esc (sin escribir). El foco debe volver al botón que pulsaste.
6. **Investigación de productos** (Configuración): se cierra con el botón «Cerrar» (si el cursor está dentro de la app de Investigación, Esc no llega; usa «Cerrar»).
7. Visor de PDF (cuando aparezca uno, por ejemplo al ver un comprobante en la tienda): Esc lo cierra.

**Tienda pública (`?tienda`):**
1. Con Tab llega a una imagen de producto y pulsa **Enter**: abre el detalle. **Tab** no se sale. **Esc** lo cierra y el foco vuelve a esa imagen.
2. Abre el carrito (Enter en «Carrito»): Esc lo cierra. Abre el zoom de una foto: Esc lo cierra.
3. **Inicio de sesión del panel:** al cargar, el cursor queda en «Correo». Tab da la vuelta dentro del cuadro de inicio.

### 6. Lector de pantalla (opcional, si tienes NVDA o VoiceOver)
Al abrir «Nuevo evento» debe anunciar «Nuevo evento, cuadro de diálogo». Al abrir el detalle de un producto, debe decir el nombre del producto como título del cuadro de diálogo.

### 7. Comparación general (con administrador **y** vendedor)
Recorre todo el menú. Todo debe verse y funcionar como antes: crear/editar/borrar cliente y producto, emitir factura, chat, agenda, mapa. En la consola no deben aparecer errores rojos nuevos (el 404 de `catalogo_default.zip` en el panel de prueba es normal).

## Si algo sale mal
Anota usuario, pantalla, qué hiciste y qué mensaje salió (o una captura de pantalla). Para revertir todo: «Revert» del PR en GitHub (esta fase no toca datos, reglas ni la CSP).
