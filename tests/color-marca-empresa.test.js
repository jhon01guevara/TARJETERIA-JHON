/* Color de marca de comprobantes, reportes y marketing: la empresa inicial conserva su rosa; las demás NO heredan el rosa de Tarjetería (azul sobrio de VEN CRM). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function ctx(emp){
 const c={localStorage:{getItem:k=>k==='tj_emp'?emp:null,setItem(){}}};vm.createContext(c);
 vm.runInContext(leer('js/empresa-contexto.js'),c);return c;
}
test('empresa inicial: rosa de siempre; otra empresa: azul VEN CRM',()=>{
 assert.equal(ctx(null).TJEmpresa.colorMarca(),'#E0457B');
 assert.equal(ctx('tarjeteria-jhon').TJEmpresa.colorMarca(),'#E0457B');
 assert.equal(ctx('genuine').TJEmpresa.colorMarca(),'#1A56DB');
});
test('los sitios de comprobante, reporte y marketing usan colorMarca() y solo dejan el rosa como respaldo',()=>{
 for(const f of ['js/comprobante-pedido.js','js/marketing.js','js/mkt-editor.js']){
  const s=leer(f);
  for(const m of s.matchAll(/#E0457B/gi)){
   const ctxTxt=s.slice(Math.max(0,m.index-90),m.index+10);
   assert.ok(/TJEmpresa\.colorMarca\?TJEmpresa\.colorMarca\(\):'$/.test(ctxTxt)||/colorMarca\(\):'#E0457B/.test(s.slice(m.index-30,m.index+10)),f+': rosa fijo sin colorMarca');
  }
 }
 assert.match(leer('js/app.js'),/AC=\(typeof TJEmpresa!=='undefined'&&TJEmpresa\.colorMarca\?TJEmpresa\.colorMarca\(\):'#E0457B'\)/,'reporte PDF');
});
test('el pie de la etiqueta de envío usa el nombre de la empresa, no «Tarjetería Jhon» fijo',()=>{
 const s=leer('js/etiquetas.js');
 assert.ok(!/d\.text\('Tarjetería Jhon'/.test(s));assert.match(s,/nombreNegocio\(\)/);
});
