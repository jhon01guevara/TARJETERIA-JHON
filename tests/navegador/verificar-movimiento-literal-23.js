/* Fase 23: comprueba que los 5 archivos nuevos son un MOVIMIENTO LITERAL desde js/app.js de la rama base.
   Uso: node tests/navegador/verificar-movimiento-literal-23.js [rama-base]   (por defecto origin/main — o la base de la fase: el commit anterior a la extracción)
   Para cada archivo: quita la cabecera (3 líneas de comentario) y parte el resto en bloques por las líneas de comentario «---- bloque N»; cada bloque debe aparecer UNA sola vez, contiguo,
   en el app.js de la base, y el app.js nuevo debe ser EXACTAMENTE el de la base menos esos bloques. No necesita navegador. Sale con código 1 si algo difiere. */
const {execFileSync}=require('node:child_process');const fs=require('node:fs');
const base=process.argv[2]||'origin/main';
const ARCH=['js/agenda-alertas.js','js/tienda-config-medios.js','js/tienda-copia-local.js','js/tienda-temas.js','js/comprobante-pedido.js'];
const orig=execFileSync('git',['show',base+':js/app.js'],{encoding:'utf8',maxBuffer:1<<26}).split('\n');
const nuevo=fs.readFileSync('js/app.js','utf8').split('\n');
let mal=0;const quitar=new Set();const ok=(c,m)=>{console.log((c?'OK   ':'FALLA ')+m);if(!c)mal++};
for(const f of ARCH){
 const L=fs.readFileSync(f,'utf8').split('\n');if(L[L.length-1]==='')L.pop();
 const cab=L.findIndex(l=>/\*\/\s*$/.test(l));ok(cab===2,f+': la cabecera son 3 líneas');
 const bloques=[[]];for(const l of L.slice(cab+1)){if(/^\/\* ---- bloque \d+ /.test(l))bloques.push([]);else bloques[bloques.length-1].push(l)}
 bloques.forEach((cuerpo,k)=>{
  const pos=[];for(let i=0;i+cuerpo.length<=orig.length;i++){if(orig[i]===cuerpo[0]&&cuerpo.every((l,j)=>orig[i+j]===l))pos.push(i)}
  ok(pos.length===1,f+' bloque '+(k+1)+' ('+cuerpo.length+' líneas) aparece contiguo y 1 sola vez en '+base+(pos.length?' (línea '+(pos[0]+1)+')':''));
  if(pos.length===1)for(let j=0;j<cuerpo.length;j++)quitar.add(pos[0]+j);
 });
}
const esperado=orig.filter((_,i)=>!quitar.has(i));
ok(esperado.length===nuevo.length&&esperado.every((l,i)=>l===nuevo[i]),'js/app.js nuevo = app.js de '+base+' menos los bloques ('+quitar.size+' líneas quitadas; '+orig.length+' → '+nuevo.length+')');
process.exit(mal?1:0);
