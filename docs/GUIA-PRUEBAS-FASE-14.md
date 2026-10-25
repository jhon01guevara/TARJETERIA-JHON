# Guía de pruebas — Fase 14 (dos errores de la consola)

Esta fase arregla dos errores pequeños que salían en la consola (F12). Ya existían antes; no los causó la CSP nueva.

| # | Error rojo/amarillo | Qué pasaba | Qué cambió |
|---|---|---|---|
| A | `Cannot access 'lsk' before initialization` (en `app.js`, líneas 28 y 77; sale como «error ignorado») | El panel intentaba leer su copia guardada en el navegador antes de saber cómo se llama la llave. Por eso **no recordaba** qué tarjetas de Configuración dejaste abiertas, ni tenía la copia local de datos al arrancar. | La llave (`lsk`) ahora se define antes de usarse. |
| B | `Cannot read properties of undefined (reading '_leaflet_pos')` | Si cambiabas de pantalla rápido, el mapa ya no existía cuando el temporizador intentaba «refrescarlo». | Antes de refrescar el mapa se comprueba que sigue en pantalla. Si no, no hace nada. |

Los datos de cada empresa siguen separados: la llave local de la empresa inicial es `tj_db`, y la de otra empresa es `tj_db_<empresa>`. Cambiar de empresa recarga la página, así que nunca se lee la copia de otra empresa.

## Dónde probar
Primero en el **panel de prueba** (ya tiene estos cambios): https://tarjeteria-jhon-prueba.web.app/
Usuarios y contraseña: ver `GUIA-PRUEBA.md` (admin.prueba / vendedor.prueba). En el panel de prueba **no** está `catalogo_default.zip`, así que verás 404 de ese archivo y un aviso amarillo «Unexpected token 'm'… is not valid JSON». Es normal ahí y no pasa en producción.

Antes de empezar: Ctrl+Shift+R (recarga sin caché) y abre la consola con **F12 → pestaña Console**. Si ves muchos avisos sobre «inline event handler» o «Content Security Policy» de `onclick`, son los avisos conocidos de la CSP (están en la lista de pendientes). Ignóralos.

## Pasos (unos 10 minutos)

### 1. Cero errores `lsk`
1. Entra como administrador. En la consola, escribe `lsk` en el filtro.
2. **Debe salir: nada.** (Antes salían dos avisos amarillos «error ignorado … Cannot access 'lsk'».)

### 2. Las tarjetas de Configuración se recuerdan
1. Ve a **Configuración**. Abre una tarjeta cerrada (por ejemplo «Notificaciones») y cierra otra que estuviera abierta.
2. Recarga con F5.
3. Vuelve a Configuración. **Debe estar igual que la dejaste.** (Antes volvía siempre al estado inicial.)
4. Prueba también los botones «Expandir todo» y «Contraer todo», y recarga.

### 3. Los datos cargan igual que antes
Revisa que todo se vea como siempre y que arriba diga «☁ Sincronizado»:
- **Clientes:** deben salir los mismos clientes (en el panel de prueba, 2).
- **Facturas:** las mismas (en prueba, la Nº 1000).
- **Productos y Catálogo:** igual.
- Crea un cliente de prueba, recarga (F5) y comprueba que sigue ahí. Bórralo después.

### 4. Cero errores de mapas
1. Abre **Ubicación**, espera a que cargue el mapa. Pasa a **Clientes** (tiene un mapa para marcar el negocio), a **Inicio** (mapa central) y otra vez a **Ubicación**.
2. Repite cambiando de pantalla **muy rápido** (clic, clic, clic sin esperar), unas 10 veces.
3. En la consola **no debe salir** «_leaflet_pos». Los mapas deben dibujarse completos, sin cuadros grises ni cortados.

### 5. Prueba con vendedor
1. Cierra sesión (Salir) y entra como `vendedor.prueba@example.com`.
2. Revisa que ve sus clientes y su factura, sin errores `lsk` ni `_leaflet_pos`.

### 6. Dos empresas no se mezclan (opcional)
1. En la consola escribe: `localStorage.setItem('tj_db_otraempresa', JSON.stringify({cli:[{id:'X1',n:'Cliente de OTRA empresa'}]}))` y pulsa Enter.
2. Abre https://tarjeteria-jhon-prueba.web.app/?emp=otraempresa y, en la consola, escribe `DB.cli.map(c=>c.n)`.
   **Debe salir solo** `['Cliente de OTRA empresa']`.
3. Abre la dirección normal (sin `?emp=`) y escribe lo mismo: **no debe aparecer** «Cliente de OTRA empresa».
4. Limpia: `localStorage.removeItem('tj_db_otraempresa')`.

## Cómo saber que todo salió bien
- Pasos 1 y 4: consola sin `lsk` ni `_leaflet_pos`.
- Paso 2: las tarjetas se recuerdan tras recargar.
- Paso 3: los datos son los mismos que siempre.

## Si algo sale mal
Dime la pantalla, qué hiciste y el texto del error. Si algo se ve roto, uso «Revert» del PR y vuelve al estado anterior. Nada de esta fase toca las reglas ni los datos de Firestore.

## Qué sí queda igual (a propósito)
Los avisos de `onclick` en línea y el botón «Imprimir» de la constancia legal se arreglan en otra fase.
