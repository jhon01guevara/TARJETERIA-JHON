/* Fase 19: extracciones 6a (transportistas), 7a (gif), 12a (etiquetas) y 13 (promo) de js/app.js.
   Complementa tests/modularizacion-fase11.test.js (que ya comprueba existencia, compilación, símbolos y orden de carga). */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {leer,appTodo}=require('./helpers/app-fuentes');
const NUEVOS=['js/gif.js','js/promo.js','js/transportistas.js','js/etiquetas.js'];
const cuenta=(s,t)=>s.split(t).length-1;

test('cada archivo de la fase 19 empieza con su cabecera y se carga en el vacío sin errores (no depende de app.js al cargar)',()=>{
 for(const f of NUEVOS){
  const s=leer(f);assert.match(s,/^\/\* Fase 19 \(extracción \d+[a-z]?\)/,f);
  assert.doesNotThrow(()=>vm.runInContext(s,vm.createContext({})),f+' falla al cargar solo');
 }
});
test('las marcas FLE y ETQ viajan con el bloque y aparecen una sola vez en todo el código del panel',()=>{
 const t=appTodo();
 for(const m of ['/*FLE-INI*/','/*FLE-FIN*/','/*ETQ-INI*/','/*ETQ-FIN*/'])assert.equal(cuenta(t,m),1,m);
 const f=leer('js/transportistas.js'),e=leer('js/etiquetas.js');
 assert.ok(f.indexOf('/*FLE-INI*/')<f.indexOf('/*FLE-FIN*/')&&e.indexOf('/*ETQ-INI*/')<e.indexOf('/*ETQ-FIN*/'));
 // las marcas de interfaz se quedan en app.js
 const a=leer('js/app.js');
 for(const m of ['/*FLE-UI-INI*/','/*FLE-UI-FIN*/','/*ETQ-UI-INI*/','/*ETQ-UI-FIN*/'])assert.equal(cuenta(a,m),1,m+' debe seguir en app.js');
});
test('index.html carga los 4 archivos nuevos, sin defer/async/module, antes de app.js y con ?v=',()=>{
 const h=leer('index.html'),app=h.indexOf('js/app.js?v=');
 for(const f of NUEVOS){
  const m=new RegExp('<script src="'+f.replace('.','\\.')+'\\?v=(modulos-fase-19[a-z]|banners-fase-22)"></script>').exec(h);
  assert.ok(m,f+' sin <script> con ?v=');assert.ok(m.index<app,f+' debe ir antes de app.js');
  assert.equal(cuenta(h,f+'?v='),1,f+' cargado dos veces');
 }
});
test('sw.js precachea los 4 archivos antes de app.js y la caché es tj-net-first-15 o posterior',()=>{
 const s=leer('sw.js'),pre=/const PRE=\[([^\]]*)\]/.exec(s)[1];
 for(const f of NUEVOS){assert.ok(pre.includes("'"+f+"'"),f+' falta en PRE');assert.ok(pre.indexOf("'"+f+"'")<pre.indexOf("'js/app.js'"),f)}
 assert.ok(+/tj-net-first-(\d+)/.exec(s)[1]>=15);
});
test('app.js ya no declara lo movido y sus usos se resuelven en un contexto con todos los archivos cargados',()=>{
 const a=leer('js/app.js');
 for(const n of ['gifComprimir','_gifEncode','promoSlide','PROMO','fleBuscar','fleSanCfg','etqPDF','etqFlow','code128B','ETQ_TAM'])
  assert.ok(!new RegExp('(^|[;\\n])\\s*(const|let|var|async function|function)\\s+'+n+'\\b').test(a),n+' sigue declarado en app.js');
 const ctx=vm.createContext({});
 for(const f of NUEVOS)vm.runInContext(leer(f),ctx,{filename:f});
 for(const n of ['gifComprimir','promoSlide','fleBuscar','fleSanCfg','etqPDF','etqFlow','code128B'])assert.equal(vm.runInContext('typeof '+n,ctx),'function',n);
 for(const n of ['PROMO','FLE_DEF','ETQ_TAM','C128','_u8b64'])assert.notEqual(vm.runInContext('typeof '+n,ctx),'undefined',n);
});
test('comportamiento: code128B, fleBuscar, fleSanCfg y etqTxt',()=>{
 const ctx=vm.createContext({});for(const f of NUEVOS)vm.runInContext(leer(f),ctx,{filename:f});
 const r=JSON.parse(vm.runInContext(`JSON.stringify({
  c:code128B('A1'),f:fleBuscar('fedex',null).id,g:fleBuscar('zz',null),n:FLE_DEF.length,
  s:fleSanCfg({on:['fedex','zzz','fedex'],extra:[{id:'bad',n:'x'}],img:{ups:'x'}}),t:etqTxt('  a   b  '),pr:PROMO.length})`,ctx));
 assert.equal(r.f,'fedex');assert.equal(r.g,null);assert.equal(r.n,13);assert.deepEqual(r.s,{on:['fedex'],extra:[],img:{}});
 assert.equal(r.t,'a b');assert.equal(r.pr,14);assert.equal(typeof r.c,'string');assert.ok(r.c.length>10);
});
