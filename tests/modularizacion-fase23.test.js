/* Fase 23: extracciones 1 a 5 de js/app.js (avisos de la Agenda, controles de configuración de la tienda, copia local del catálogo, temas e iconos, comprobante del pedido).
   Complementa tests/modularizacion-fase11.test.js, fase19 y fase21. Comprobación de movimiento literal: tests/navegador/verificar-movimiento-literal-23.js */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {leer,EXTRAIDOS}=require('./helpers/app-fuentes');
const NUEVOS=['js/agenda-alertas.js','js/tienda-config-medios.js','js/tienda-copia-local.js','js/tienda-temas.js','js/comprobante-pedido.js'];
const SIMBOLOS={
 'js/agenda-alertas.js':{consts:['AGSND'],funcs:['agSound','cfgSnd','agPerm','agToast','agAlert','agTest','agCheck']},
 'js/tienda-config-medios.js':{consts:[],funcs:['shopCfgBgTypeSet','shopCfgColorSet','shopCfgMotionSet','shopCfgWmSet','shopPhotoUpload','shopPhotoClear','shopVideoUpload','shopVideoClear','shopPresetVideo','shopLogoUpload','shopLogoClear']},
 'js/tienda-copia-local.js':{consts:[],funcs:['shopCacheItems']},
 'js/tienda-temas.js':{consts:['TEMAS','temaOf','temaMeta','KI','kico'],funcs:[]},
 'js/comprobante-pedido.js':{consts:[],funcs:['shopPdfPrint','shopPdf','shopPdfVer','shopRecCanvas','shopImgVer']}
};
const cuenta=(s,t)=>s.split(t).length-1;
const app=leer('js/app.js');

test('cada archivo de la fase 23 empieza con su cabecera de 3 líneas y carga en un contexto vacío (con window) sin usar app.js al cargarse',()=>{
 NUEVOS.forEach((f,i)=>{
  const s=leer(f);assert.match(s,new RegExp('^/\\* Fase 23 \\(extracción '+(i+1)+'\\)'),f);
  assert.equal(s.split('\n').findIndex(l=>/\*\/\s*$/.test(l)),2,f+': la cabecera son 3 líneas');
  assert.doesNotThrow(()=>vm.runInContext(s,vm.createContext({window:{}})),f+' falla al cargar solo');
 });
});
test('index.html carga los 5 archivos nuevos, clásicos, después de plantillas-factura.js y antes de app.js, en orden, con ?v=modulos-fase-23a',()=>{
 const h=leer('index.html'),ia=h.indexOf('js/app.js?v='),pf=h.indexOf('js/plantillas-factura.js?v=');
 let prev=pf;
 for(const f of NUEVOS){
  const m=new RegExp('<script src="'+f.replace('.','\\.')+'\\?v=modulos-fase-23a"></script>').exec(h);
  assert.ok(m,f+' sin <script> con ?v=');assert.ok(m.index>prev,f+' fuera de orden');assert.ok(m.index<ia,f+' debe ir antes de app.js');
  assert.equal(cuenta(h,f+'?v='),1,f+' cargado dos veces');prev=m.index;
 }
 assert.match(h,/<script src="js\/app\.js\?v=(modulos-fase-23a|modulos-fase-2[4-9][a-z])"><\/script>/);
 assert.doesNotMatch(h,/<script[^>]*(defer|async|type="module")[^>]*src="js\/(agenda-alertas|tienda-|comprobante-)/);
});
test('sw.js precachea los 5 archivos antes de app.js y la caché es tj-net-first-20 o posterior',()=>{
 const s=leer('sw.js'),pre=/const PRE=\[([^\]]*)\]/.exec(s)[1];
 for(const f of NUEVOS){assert.ok(pre.includes("'"+f+"'"),f+' falta en PRE');assert.ok(pre.indexOf("'"+f+"'")<pre.indexOf("'js/app.js'"),f)}
 assert.ok(+/tj-net-first-(\d+)/.exec(s)[1]>=20);
});
test('cada símbolo movido se declara en UN solo archivo (ni app.js ni otro) y con el mismo tipo de declaración',()=>{
 const todos=[...EXTRAIDOS,'js/app.js'].map(f=>[f,leer(f)]);
 for(const f of NUEVOS){
  const {consts,funcs}=SIMBOLOS[f];
  for(const n of consts)for(const [g,s] of todos){const k=cuenta(s,'\nconst '+n+'=')+(s.startsWith('const '+n+'=')?1:0)+cuenta(s,'\nconst '+n+'=[');assert.ok(g===f?k>=1:k===0,n+' (const) en '+g)}
  for(const n of funcs)for(const [g,s] of todos){const k=(s.match(new RegExp('(^|\\n)(async )?function '+n+'\\(','g'))||[]).length;assert.equal(k,g===f?1:0,n+' (function) en '+g)}
 }
});
test('el orden de EXTRAIDOS (tests) incluye los 5 archivos nuevos para que los tests que leen «el panel» sigan viendo su texto',()=>{
 for(const f of NUEVOS)assert.ok(EXTRAIDOS.includes(f),f);
});
test('app.js ya no contiene los bloques movidos (cabeceras de función/const) y conserva sus llamadores',()=>{
 for(const f of NUEVOS){const {consts,funcs}=SIMBOLOS[f];
  for(const n of funcs)assert.equal((app.match(new RegExp('(^|\\n)(async )?function '+n+'\\(','g'))||[]).length,0,n+' sigue en app.js');
  for(const n of consts)assert.ok(!app.includes('\nconst '+n+'='),n+' sigue en app.js');
 }
 assert.match(app,/shopCacheItems\(SH\.items\)/);assert.match(app,/setInterval\(agCheck|setTimeout\(agCheck/);assert.match(app,/shopPdf\(/);
});
test('resolución conjunta: cargando los archivos en el orden de index.html, todos los símbolos movidos existen y son del tipo esperado',()=>{
 const ctx=vm.createContext({window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){},key:()=>null,length:0},lsk:k=>k});
 for(const f of NUEVOS)vm.runInContext(leer(f),ctx);
 for(const f of NUEVOS){const {consts,funcs}=SIMBOLOS[f];
  for(const n of funcs)assert.equal(vm.runInContext('typeof '+n,ctx),'function',n);
  for(const n of consts)assert.notEqual(vm.runInContext('typeof '+n,ctx),'undefined',n);
 }
 assert.equal(vm.runInContext('typeof window.shopCacheItems',ctx),'function','window.shopCacheItems publicada');
 for(const n of SIMBOLOS['js/tienda-config-medios.js'].funcs)assert.equal(vm.runInContext('typeof window.'+n,ctx),'function','window.'+n+' publicada (la usa el delegador «call»)');
});
test('comportamiento: temaOf/temaMeta/kico dan lo mismo que antes y KI queda completo (Object.assign incluido)',()=>{
 const ctx=vm.createContext({window:{},shopN:s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')});
 vm.runInContext(leer('js/tienda-temas.js'),ctx);
 assert.equal(vm.runInContext("JSON.stringify(temaOf({name:'Boda elegante'}))",ctx),JSON.stringify(['boda']));
 assert.equal(vm.runInContext("JSON.stringify(temaOf({tags:['amor']}))",ctx),JSON.stringify(['amor']));
 assert.equal(vm.runInContext("JSON.stringify(temaOf({name:'zzz'}))",ctx),JSON.stringify(['otros']));
 assert.equal(vm.runInContext("JSON.stringify(temaOf({tags:[]}))",ctx),JSON.stringify(['otros']));
 assert.equal(vm.runInContext("temaMeta('baby').n",ctx),'Baby shower');
 assert.equal(vm.runInContext("temaMeta('zz').e",ctx),'🏷️');
 assert.equal(vm.runInContext('TEMAS.length',ctx),17);
 assert.match(vm.runInContext('kico(KI.menu,18)',ctx),/^<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3 18h18v-2H3v2z/);
 assert.ok(vm.runInContext('Object.keys(KI).length',ctx)>=12);
});
test('comportamiento: shopCacheItems respeta el presupuesto y no pisa la copia con una lista vacía',()=>{
 const m=new Map(),ls={get length(){return m.size},key:i=>[...m.keys()][i]??null,getItem:k=>m.has(k)?m.get(k):null,removeItem:k=>{m.delete(k)},setItem:(k,v)=>{m.set(k,String(v))}};
 const ctx=vm.createContext({window:{},localStorage:ls,lsk:k=>k});vm.runInContext(leer('js/tienda-copia-local.js'),ctx);
 const art=i=>({id:'a'+i,img:'x'.repeat(120000)});
 vm.runInContext('shopCacheItems',ctx)(Array.from({length:63},(_,i)=>art(i)));
 const g=JSON.parse(ls.getItem('tj_cached_items'));assert.ok(g.length>=10&&g.length<=16,String(g.length));
 vm.runInContext('shopCacheItems',ctx)([]);assert.equal(JSON.parse(ls.getItem('tj_cached_items')).length,g.length,'la lista vacía no pisa la copia');
});
test('comportamiento: agCheck no avisa si no hay agenda ni avisos pendientes (usa AGN/AGSN/agAlert de app.js solo al ejecutarse)',()=>{
 const ctx=vm.createContext({window:{},DB:{agenda:[]},AG:{q:'',c:''},AGN:{},AGSN:{}});vm.runInContext(leer('js/agenda-alertas.js'),ctx);
 assert.doesNotThrow(()=>vm.runInContext('agCheck()',ctx));
 assert.equal(vm.runInContext('typeof agSound',ctx),'function');
});
test('el plan de modularización documenta la Fase 23 y la guía de pruebas existe',()=>{
 assert.match(leer('docs/PLAN-MODULARIZACION.md'),/## 10\. Fase 23/);
 assert.ok(leer('docs/GUIA-PRUEBAS-FASE-23.md').length>1500);
});
