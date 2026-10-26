/* Fase 24: extracción 1 de js/app.js: reportes de ventas (js/reportes-ventas.js).
   Complementa fase11/19/21/23. Movimiento literal: node tests/navegador/verificar-movimiento-literal-24.js origin/main (antes de mergear) */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {leer,EXTRAIDOS}=require('./helpers/app-fuentes');
const F='js/reportes-ventas.js',CONSTS=['REPP'],FUNCS=['repData','repHTML','buildRepBlob','repPDF','repWA','repMail','repModal'];
const cuenta=(s,t)=>s.split(t).length-1;
const app=leer('js/app.js'),src=leer(F);

test('cabecera de 3 líneas y carga en contexto vacío sin usar app.js al cargarse',()=>{
 assert.match(src,/^\/\* Fase 24 \(extracción 1\)/);
 assert.equal(src.split('\n').findIndex(l=>/\*\/\s*$/.test(l)),2);
 assert.doesNotThrow(()=>vm.runInContext(src,vm.createContext({window:{}})));
});
test('index.html: clásico, justo antes de manifest-tienda/app.js, una sola vez y con ?v=; sw.js lo precachea antes de app.js',()=>{
 const h=leer('index.html'),i=h.indexOf('js/reportes-ventas.js?v=modulos-fase-24'),ia=h.indexOf('js/app.js?v=');
 assert.ok(i>0&&i<ia&&i>h.indexOf('js/comprobante-pedido.js?v='));assert.equal(cuenta(h,'js/reportes-ventas.js'),1);
 assert.doesNotMatch(h,/<script[^>]*(defer|async|type="module")[^>]*src="js\/reportes-ventas/);
 const pre=/const PRE=\[([^\]]*)\]/.exec(leer('sw.js'))[1];assert.ok(pre.includes("'"+F+"'")&&pre.indexOf("'"+F+"'")<pre.indexOf("'js/app.js'"));
 assert.ok(EXTRAIDOS.includes(F));
});
test('cada símbolo se declara en UN solo archivo y app.js ya no lo contiene',()=>{
 for(const n of FUNCS){assert.equal((src.match(new RegExp('(^|\\n)(async )?function '+n+'\\(','g'))||[]).length,1,n);
  assert.equal((app.match(new RegExp('(^|\\n)(async )?function '+n+'\\(','g'))||[]).length,0,n+' sigue en app.js')}
 for(const n of CONSTS){assert.equal(cuenta(src,'\nconst '+n+'=')+(src.includes('\nconst '+n+'=')?0:(src.startsWith('const '+n+'=')?1:0)),1,n);assert.ok(!app.includes('\nconst '+n+'='),n+' sigue en app.js')}
 /* repPer y repLibs (const flecha) también viajan con el bloque */
 assert.ok(/\nconst repPer=/.test(src)&&!/\nconst repPer=/.test(app));
});
test('los llamadores que quedan en app.js usan los símbolos movidos solo dentro de funciones (no al cargar)',()=>{
 const r=vm.createContext({window:{}});vm.runInContext(src,r);
 for(const n of FUNCS)assert.equal(vm.runInContext('typeof '+n,r),'function',n);
 assert.equal(vm.runInContext('JSON.stringify(REPP.map(x=>x[0]))',r),JSON.stringify(['hoy','sem','mes','anio','todo']));
});
