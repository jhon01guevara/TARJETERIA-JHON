/* Fase 11: js/app.js se está dividiendo en scripts clásicos (js/utils.js, js/sanear.js, ...).
   Los tests que buscan texto "del panel" leen app.js MÁS los archivos extraídos, para que seguir
   moviendo código literal no los rompa. Al añadir una extracción nueva, se añade aquí. */
const fs=require('node:fs');
const path=require('node:path');
const EXTRAIDOS=['js/utils.js','js/sanear.js','js/redes.js','js/politicas.js','js/etiquetas.js','js/transportistas.js','js/promo.js','js/gif.js','js/mapa-clientes.js','js/fondo-login.js','js/dashboard-vendedor.js','js/plantillas-factura.js','js/agenda-alertas.js','js/tienda-config-medios.js','js/tienda-copia-local.js','js/tienda-temas.js','js/comprobante-pedido.js'];
/* Fase 13: estilos que antes inyectaba app.js con createElement('style') y ahora viven en css/inyectados.css. */
const ESTILOS=['css/inyectados.css'];
const leer=f=>fs.readFileSync(path.join(__dirname,'..','..',f),'utf8');
const appTodo=()=>[...EXTRAIDOS,...ESTILOS,'js/app.js'].map(leer).join('\n');
module.exports={EXTRAIDOS,ESTILOS,appTodo,leer};
