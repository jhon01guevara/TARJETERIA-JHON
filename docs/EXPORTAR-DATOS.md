# Exportar los datos de la empresa (Etapa 5)

**Dónde:** Configuración → **Ajustes generales del panel** → tarjeta **«📤 Exportar los datos de mi empresa»** (junto a «Copia de seguridad»; viene minimizada como las demás). También se llega desde **Ayuda y soporte**.

**Quién:** solo el administrador de la empresa. Los vendedores no ven la tarjeta y la descarga lo vuelve a comprobar.

**Qué baja** (solo de la **empresa activa**):
| Botón | Archivo | Contenido |
|---|---|---|
| Clientes | `ven-crm_<empresa>_<fecha>_clientes.csv` | nombre, RUC/cédula, teléfono, dirección, correo, origen, ubicación |
| Productos | `…_productos.csv` | nombre y precio |
| Facturas | `…_facturas.csv` | una fila por factura: número, fecha, cliente, pago, subtotal, descuento, ITBMS, total, anulada, vendedor, nota, resumen de artículos |
| Líneas de facturas | `…_lineas-de-facturas.csv` | una fila por artículo vendido |
| Pedidos de la tienda | `…_pedidos.csv` | pedidos hechos desde la tienda pública (se leen de nuevo de la nube) |
| Todo en un ZIP | `…_todo-csv.zip` | los 5 CSV + `LEEME.txt` |
| Todo en JSON | `…_todo.json` | los 4 grupos con todos sus campos, `formato: ven-crm-exportacion`, `version: 1` |

**Garantías**
- **Solo lectura:** no escribe ni borra nada en Firestore ni cambia nada en el panel (la prueba cuenta las escrituras: 0, y compara los documentos antes y después).
- **No incluye** contraseñas, accesos de vendedores ni configuración.
- Los CSV llevan BOM UTF-8 (tildes bien en Excel), separador coma, y las celdas que empiezan con `=`, `+`, `-` o `@` (salvo números y teléfonos) llevan un `'` delante para que Excel no las ejecute como fórmula.
- La descarga ocurre en el navegador: ningún dato sale a otro servidor.

**Límites conocidos**
- Exporta lo que el panel ya tiene cargado más los pedidos de la tienda (que vuelve a leer). Las fotos del catálogo y de la galería **no** se exportan (use «Copia de seguridad» para eso).
- Si una empresa tiene decenas de miles de facturas, la descarga puede tardar unos segundos.
- Pendiente (Etapa 5): borrar los datos de una empresa a petición. Este módulo no borra nada.

**Quitarlo:** borrar `<script src="js/exportar-datos.js">` de `index.html` y su entrada en `sw.js`.
**Pruebas:** `tests/exportar-datos.test.js` y `tests/navegador/exportar-datos.js` (Chrome real, proyecto de PRUEBA, empresa `export-prueba`).
