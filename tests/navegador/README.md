# Pruebas en Chrome real (Fase 15)

Estos scripts **no** corren con `npm test` (ese solo ejecuta `tests/*.test.js`, sin navegador). Sirven para repetir las mediciones de la Fase 15 contra una copia local o el panel de prueba.

Requisitos (fuera del repo): `npm i playwright-core axe-core`, Google Chrome instalado, y la variable de entorno `PRUEBA_PASSWORD` con la contraseña de los usuarios de prueba (`admin.prueba@example.com`, `vendedor.prueba@example.com`). **Nunca contra producción.**

| Script | Qué hace | Ejemplo |
|---|---|---|
| `medir-avisos-onclick.js` | Recorre el panel como administrador y cuenta los avisos «Executing inline event handler»; lista los elementos con atributos `on…=` | `BASE=http://localhost:8802/ TAG=nuevo node medir-avisos-onclick.js` |
| `axe-contraste.js` | axe-core (regla `color-contrast` u otras con `RULES=`) en todas las pantallas, temas claro/nocturno y tienda | `BASE=… TAG=axe ROLES=admin.prueba@example.com,vendedor.prueba@example.com node axe-contraste.js` |
| `modales.js` | Comprueba role/nombre, foco, Tab atrapado, Esc y devolución del foco en login, `#md`, Investigación, visor PDF, detalle/carrito/zoom de la tienda | `BASE=… node modales.js` |
| `imprimir-constancia.js` | Abre la constancia legal y comprueba que «Imprimir» llama a `print()` | `BASE=… node imprimir-constancia.js` |

`BASE` es la URL (con `/` al final) de una copia servida en local (`python3 -m http.server`) o `https://tarjeteria-jhon-prueba.web.app/`.
