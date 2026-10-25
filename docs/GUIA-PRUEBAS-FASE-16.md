# Guía de pruebas — Fase 16 (`modelos.js` ya no se descarga al instalar la app)

## Qué cambió, en simple
`apps/modelos.js` es el archivo grande (**1,1 MB comprimido**) del módulo **Check** (las 63 fotos de modelos). Antes, la app lo descargaba en segundo plano apenas se instalaba, junto con todo lo demás. Ahora:
- **No se descarga al instalar.** Se guarda unos segundos después, cuando la pantalla ya cargó y el navegador está libre.
- **Tampoco se guarda** si tienes activado «ahorro de datos», la conexión es 2G, estás sin internet, o estás en la **tienda pública** (ahí nunca se descarga).
- Si todavía no se guardó cuando abres **Check**, se descarga en ese momento (como siempre) y queda guardado para usarlo sin internet.
- Check se ve y funciona **igual**. No cambia ninguna pantalla, ni la seguridad (CSP).

## Dónde probar
Primero en el **panel de prueba** (ya tiene estos cambios): https://tarjeteria-jhon-prueba.web.app/  
Usuarios y contraseña: ver `GUIA-PRUEBA.md` (admin.prueba / vendedor.prueba).  
Usa una **ventana de incógnito nueva** para que sea una «primera visita» de verdad. Los avisos amarillos de `contentscript.js` vienen de una extensión: ignóralos.

## Pasos (unos 10 minutos)

### 1. Primera visita: `modelos.js` no sale al principio
1. Abre una ventana de incógnito, pulsa **F12 → pestaña Network (Red)**.
2. En el filtro de Network escribe `modelos`. Marca «Disable cache» **desactivado** (no lo marques).
3. Entra a https://tarjeteria-jhon-prueba.web.app/ (aún sin iniciar sesión).
4. **Debe verse:** durante los primeros ~5 segundos **no aparece ninguna fila** `modelos.js`. 
5. Espera ~10 segundos más. **Debe aparecer** una fila `modelos.js?v=rendimiento-fase-16` (tamaño ≈ 1,1 MB; en la columna «Initiator» dirá `sw.js` / service worker). Una sola vez.
   - Si activaste «ahorro de datos» en Chrome (o usas una conexión 2G) **no debe aparecer**: es lo esperado.

### 2. Check funciona igual
1. Inicia sesión como **administrador**. Ve a **Check** (menú).
2. **Debe verse:** el módulo «Modelos — Tarjetería John 2026», con **63 modelos**, las fotos, las categorías (Todos, Cumpleaños, 15 años, …) y el buscador.
3. Prueba: buscar `PW020`, filtrar una categoría, marcar «acotejado» en un modelo, abrir una foto grande, exportar o imprimir. Todo igual que antes.
4. En la consola (pestaña Console) **no debe salir** ningún mensaje que diga «Content Security Policy» ni errores de `IMGS`, `DATA` o `modelos`.

### 3. Primer uso sin esperar (Check abre aunque no se haya precalentado)
1. Otra ventana de incógnito nueva, Network con filtro `modelos`.
2. Entra e inicia sesión rápido como administrador (en menos de ~5 s después de cargar la página, o simplemente abre **Check** apenas entres).
3. **Debe verse:** Check abre normal; `modelos.js` aparece en Network (descargado en ese momento, o desde el service worker si ya estaba).

### 4. Sin internet (importante)
1. En la misma ventana donde abriste Check con internet (paso 2), abre F12 → Network → cambia «No throttling» por **Offline**.
2. Ve a **Inicio** y luego otra vez a **Check**.
3. **Debe verse:** Check abre con sus 63 modelos y fotos, sin internet. (Los datos que vienen de la nube, como chat o facturas, no cargarán sin internet: eso ya era así.)
4. Vuelve a poner «No throttling».

### 5. Tienda pública
1. Ventana de incógnito nueva, abre https://tarjeteria-jhon-prueba.web.app/?tienda
2. En Network, filtro `modelos`: **no debe aparecer nada**, ni al principio ni después de 30 segundos. (Antes y después de esta fase es igual: la tienda no instala el service worker.)

### 6. Vendedor
Inicia sesión como `vendedor.prueba`: el panel y las pantallas (Inicio, Facturas, Clientes, Productos) se ven y funcionan como siempre. En la copia de prueba su menú **no** incluye Check.

## Cómo saber si salió bien
| Lo que miras | Debe pasar |
|---|---|
| Network, primeros ~5 s de una primera visita | Sin `modelos.js` |
| Network, ~10 s después | Una sola fila `modelos.js?v=rendimiento-fase-16`, hecha por el service worker |
| Check (admin) | 63 modelos, fotos, igual que siempre |
| Check sin internet (tras abrirlo una vez con internet) | Abre igual |
| Tienda pública | Nunca aparece `modelos.js` |
| Consola | Sin avisos de «Content Security Policy» nuevos |

Para ver la caché nueva: F12 → Application → Cache Storage → debe existir `tj-net-first-12` (y no la `tj-net-first-11` anterior) con `modelos.js?v=rendimiento-fase-16` dentro tras unos segundos.

## Qué NO se pudo probar
Safari, Firefox, iOS; el panel real de producción (se verá al unir); ahorro de datos real en un teléfono (solo está cubierto con pruebas automáticas); el vendedor abriendo Check (su menú de prueba no lo tiene).

## Si algo falla
Anota el paso, el usuario y lo que ves en Console/Network y avísame. Se revierte con el botón **Revert** del PR. Para dejar `modelos.js` 100 % «solo cuando lo uses» (sin precalentarlo nunca), se quita una sola línea (`.then(precalentarModelos)` en `js/app.js`).
