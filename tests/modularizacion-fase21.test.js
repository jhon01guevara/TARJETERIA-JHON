/* Fase 21: extracciones 1 a 4 de js/app.js (mapa de clientes, fondo del inicio de sesión, dashboard por vendedor, plantillas de factura).
   Complementa tests/modularizacion-fase11.test.js (existencia, compilación, símbolos, orden) y tests/modularizacion-fase19.test.js. */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {leer}=require('./helpers/app-fuentes');
const NUEVOS=['js/mapa-clientes.js','js/fondo-login.js','js/dashboard-vendedor.js','js/plantillas-factura.js'];
const cuenta=(s,t)=>s.split(t).length-1;

test('cada archivo de la fase 21 empieza con su cabecera de 3 líneas y se carga en el vacío sin errores (no usa app.js al cargar)',()=>{
 NUEVOS.forEach((f,i)=>{
  const s=leer(f);assert.match(s,new RegExp('^/\\* Fase 21 \\(extracción '+(i+1)+'\\)'),f);
  assert.equal(s.split('\n').findIndex(l=>/\*\/\s*$/.test(l)),2,f+': la cabecera son 3 líneas');
  assert.doesNotThrow(()=>vm.runInContext(s,vm.createContext({})),f+' falla al cargar solo');
 });
});
test('index.html carga los 4 archivos nuevos, clásicos, después de etiquetas.js, antes de app.js, en orden y con ?v=modulos-fase-21x',()=>{
 const h=leer('index.html'),app=h.indexOf('js/app.js?v='),etq=h.indexOf('js/etiquetas.js?v=');
 let prev=etq;
 NUEVOS.forEach((f,i)=>{
  const m=new RegExp('<script src="'+f.replace('.','\\.')+'\\?v=modulos-fase-21'+'abcd'[i]+'"></script>').exec(h);
  assert.ok(m,f+' sin <script> con ?v=');assert.ok(m.index>prev,f+' fuera de orden');assert.ok(m.index<app,f+' debe ir antes de app.js');
  assert.equal(cuenta(h,f+'?v='),1,f+' cargado dos veces');prev=m.index;
 });
 assert.match(h,/js\/app\.js\?v=modulos-fase-21d/);
});
test('sw.js precachea los 4 archivos antes de app.js y la caché es tj-net-first-18 o posterior',()=>{
 const s=leer('sw.js'),pre=/const PRE=\[([^\]]*)\]/.exec(s)[1];
 for(const f of NUEVOS){assert.ok(pre.includes("'"+f+"'"),f+' falta en PRE');assert.ok(pre.indexOf("'"+f+"'")<pre.indexOf("'js/app.js'"),f)}
 assert.ok(+/tj-net-first-(\d+)/.exec(s)[1]>=18);
});
test('app.js ya no declara lo movido (y lo movido está declarado una sola vez en todo el código del panel)',()=>{
 const a=leer('js/app.js');
 const nombres=['MC','MC_VACIO','mcTieneLoc','mcPintar','mcHomeHTML','LBG','LBG_PRE','LBG_DEF','lbgMeta','lbgFill','lbgApply','VD','VDP','vdOwn','vdIni','vdStats','vdHTML','vdAdmHTML','TPLS','VF','facTpl','facEstado','facSello','tplCard','verFactura','verTpl','facCobrar'];
 const todo=[...NUEVOS,'js/app.js'].map(leer).join('\n');
 for(const n of nombres){
  assert.ok(!new RegExp('(^|[;\\n])\\s*(const|let|var|async function|function)\\s+'+n+'\\b').test(a),n+' sigue declarado en app.js');
  assert.ok(new RegExp('(^|[;\\n])\\s*(const|let|var|async function|function)\\s+'+n+'\\b').test(todo),n+' no está declarado en ningún archivo');
 }
});
test('todo lo movido se resuelve en un contexto con los 4 archivos cargados (function y const, y el wrapper que usa tplCard al cargar)',()=>{
 const ctx=vm.createContext({});for(const f of NUEVOS)vm.runInContext(leer(f),ctx,{filename:f});
 for(const n of ['mcTieneLoc','mcHomeHTML','mcPintar','lbgMeta','lbgApply','vdOwn','vdIni','vdStats','vdHTML','vdAdmHTML','facTpl','facEstado','facSello','tplCard','verFactura','facCobrar','vfFit'])
  assert.equal(vm.runInContext('typeof '+n,ctx),'function',n);
 for(const n of ['MC','LBG','LBG_PRE','LBG_DEF','VD','VDP','TPLS','VF'])assert.notEqual(vm.runInContext('typeof '+n,ctx),'undefined',n);
 // tplCard (usada por un wrapper de app.js al cargar) existe antes de app.js: const _tc0=tplCard
 assert.match(leer('js/app.js'),/const _tc0=tplCard;tplCard=function/);
});
test('comportamiento: mcTieneLoc, vdOwn, facTpl, lbgMeta (con localStorage falso) y constantes',()=>{
 const ctx=vm.createContext({localStorage:{getItem:()=>null},lsk:k=>k});for(const f of NUEVOS)vm.runInContext(leer(f),ctx,{filename:f});
 const r=JSON.parse(vm.runInContext(`JSON.stringify({
  a:mcTieneLoc({lat:8.9,lng:-79.5}),b:mcTieneLoc({lat:'8',lng:1}),c:mcTieneLoc(null),
  d:vdOwn({vend:'admin'},'admin'),e:vdOwn({},'admin'),f:vdOwn({vend:'v1'},'admin'),g:vdOwn({vend:'v1'},'v1'),
  h:facTpl({tpl:'dorado'}),i:facTpl({tpl:'zzz'}),n:TPLS.length,v:MESC.length,vp:VDP.map(x=>x[0]),
  l:lbgMeta().mode,lc:LBG.k,vm:MC_VACIO(),vf:VF})`,ctx));
 assert.equal(r.a,true);assert.equal(r.b,false);assert.equal(r.c,false);
 assert.deepEqual([r.d,r.e,r.f,r.g],[true,true,false,true]);
 assert.equal(r.h,'dorado');assert.equal(r.i,'clasica');assert.equal(r.n,14);assert.equal(r.v,12);assert.deepEqual(r.vp,['hoy','sem','mes','anio','todo']);
 assert.equal(r.l,'aurora');assert.equal(r.lc,'tj_lbg');assert.deepEqual(r.vm,{t:0,n:0,ult:'',pend:0,venc:0,vend:{}});assert.deepEqual(r.vf,{z:1,mx:false});
});
test('lo que NO se movió sigue en app.js (R.mapa, authUI de lbg, wrappers de R.home y tplCard)',()=>{
 const a=leer('js/app.js');
 for(const t of ['R.mapa=function','const _au0=authUI;authUI=function','const _homeBase=R.home','const _tc0=tplCard;tplCard=function'])assert.equal(cuenta(a,t),1,t);
});
