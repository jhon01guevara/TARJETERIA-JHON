/* Fase 11: js/app.js se está dividiendo en scripts clásicos (js/utils.js, js/sanear.js, ...).
   Los tests que buscan texto "del panel" leen app.js MÁS los archivos extraídos, para que seguir
   moviendo código literal no los rompa. Al añadir una extracción nueva, se añade aquí. */
const fs=require('node:fs');
const path=require('node:path');
const EXTRAIDOS=['js/utils.js','js/sanear.js','js/redes.js','js/politicas.js'];
/* Fase 13: estilos que antes inyectaba app.js con createElement('style') y ahora viven en css/inyectados.css. */
const ESTILOS=['css/inyectados.css'];
const leer=f=>fs.readFileSync(path.join(__dirname,'..','..',f),'utf8');
const appTodo=()=>[...EXTRAIDOS,...ESTILOS,'js/app.js'].map(leer).join('\n');
module.exports={EXTRAIDOS,ESTILOS,appTodo,leer};
