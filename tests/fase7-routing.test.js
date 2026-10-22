const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

function ctxEmpresa(){
 const ctx={};vm.createContext(ctx);
 vm.runInContext(leer('js/empresa-contexto.js'),ctx);
 return ctx;
}

test('La separación está ACTIVADA y empColPath enruta el negocio a la empresa inicial',()=>{
 const c=ctxEmpresa();
 assert.equal(c.MULTIEMP,true,'activada 2026-10-22');
 for(const n of ['panel','panel_public','vendedores','catalogo','tienda_items','tienda_leads',
  'tienda_pedidos','galeria','chats','llamadas','wa_conversaciones','investigacion_items'])
  assert.equal(c.TJEmpresa.empColPath(n),'empresas/tarjeteria-jhon/'+n);
});

test('Identidad y metadatos NUNCA se enrutan, aunque la bandera esté activa',()=>{
 const c=ctxEmpresa();c.MULTIEMP=true;
 for(const n of ['roles','perfiles','presencia','empresas','dominios','colección_inexistente'])
  assert.equal(c.TJEmpresa.empColPath(n),n);
});

test('Con MULTIEMP=true el negocio baja a empresas/{empresa activa}/…',()=>{
 const c=ctxEmpresa();c.MULTIEMP=true;
 assert.equal(c.TJEmpresa.empColPath('catalogo'),'empresas/tarjeteria-jhon/catalogo');
 assert.equal(c.TJEmpresa.empColPath('panel_public'),'empresas/tarjeteria-jhon/panel_public');
 c.localStorage={_v:'dulceria-la-central',getItem(){return this._v},setItem(k,v){this._v=v}};
 assert.equal(c.TJEmpresa.empColPath('tienda_items'),'empresas/dulceria-la-central/tienda_items');
});

test('La bandera se lee en cada llamada: apagarla (reversión) es cambiar la variable',()=>{
 const c=ctxEmpresa();
 assert.equal(c.TJEmpresa.empColPath('chats'),'empresas/tarjeteria-jhon/chats','activa por defecto');
 c.MULTIEMP=false;
 assert.equal(c.TJEmpresa.empColPath('chats'),'chats','reversión instantánea a rutas raíz');
 c.MULTIEMP=true;
 assert.equal(c.TJEmpresa.empColPath('chats'),'empresas/tarjeteria-jhon/chats');
});

test('app.js enruta TODO el negocio por fbCol y la identidad sigue directa',()=>{
 const app=leer('js/app.js');
 assert.match(app,/const fbCol=n=>fbDb&&fbDb\.collection\(TJEmpresa\.empColPath\(n\)\)/);
 assert.match(app,/const lsk=k=>TJEmpresa\.empLSKey\(k\)/);
 for(const n of ['panel','panel_public','vendedores','catalogo','tienda_items','tienda_leads',
  'tienda_pedidos','galeria','chats','llamadas','wa_conversaciones','investigacion_items'])
  assert.doesNotMatch(app,new RegExp("fbDb\\.collection\\([\"']"+n+"[\"']\\)"),'quedó '+n+' sin enrutar');
 for(const n of ['perfiles','presencia','roles'])
  assert.match(app,new RegExp("fbDb\\.collection\\('"+n+"'\\)"),n+' sigue global (por diseño)');
});

test('fbCol en app.js funciona en VM: rutas actuales hoy, enrutadas con la bandera',()=>{
 /* Firestore que graba las rutas pedidas; el resto se absorbe como en carga.test.js. */
 const rutas=[];
 function mkWrap(p){return new Proxy({},{get(t,k){
  if(k==='p')return p;
  if(k==='then')return undefined;
  if(k===Symbol.toPrimitive)return()=>p;
  if(k==='collection')return n=>mkWrap(p+'/'+n);
  return subP},apply:()=>subP})}
 const subP=new Proxy(function(){},{get(t,k){
  if(k==='then')return undefined;
  if(k===Symbol.toPrimitive)return()=>'';
  if(k==='collection')return n=>mkWrap(n);
  return subP},apply:()=>subP});
 const dbP=new Proxy(function(){},{get(t,k){
  if(k==='then')return undefined;
  if(k===Symbol.toPrimitive)return()=>'';
  if(k==='collection')return n=>{rutas.push(n);return mkWrap(n)};
  return subP},apply:()=>subP});
 const fbP=new Proxy(function(){},{get(t,k){
  if(k==='firestore')return()=>dbP;
  if(k==='then')return undefined;
  if(k===Symbol.toPrimitive)return()=>'';
  return fbP},apply:()=>fbP});
 const mk=()=>new Proxy(function(){},{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>'';if(k==='then')return undefined;if(k==='length')return 0;if(k===Symbol.iterator)return function*(){};return mk()},apply:()=>mk(),construct:()=>mk()});
 const U=mk(),store={},ls={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:()=>null,length:0};
 const ctx={console:{log(){},warn(){},error(){},info(){}},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},
  requestAnimationFrame:()=>0,localStorage:ls,sessionStorage:ls,navigator:U,
  location:{href:'https://x.github.io/app/',search:'',protocol:'https:',hostname:'x.github.io',host:'x.github.io',pathname:'/app/',hash:'',origin:'https://x.github.io',replace(){}},
  document:U,firebase:fbP,history:U,Notification:U,URL,URLSearchParams,JSON,Math,Date,Promise,Intl,TextDecoder,TextEncoder,
  addEventListener(){},removeEventListener(){},matchMedia:()=>U,innerWidth:1200,screen:U,performance:{now:()=>0},crypto:U,indexedDB:U,caches:U,
  fetch:()=>Promise.resolve(U),Blob,speechSynthesis:U,AudioContext:U,IntersectionObserver:U,MutationObserver:U,ResizeObserver:U,Image:U,FileReader:U,atob,btoa,Uint8Array,ArrayBuffer};
 ctx.window=ctx;ctx.self=ctx;
 vm.createContext(ctx);
 for(const f of ['js/empresa-contexto.js','js/empresas.js','migraciones/migracion-multiempresa.js'])
  vm.runInContext(leer(f),ctx,{filename:f});
 vm.runInContext(leer('js/app.js'),ctx,{filename:'js/app.js'});
 /* Con la bandera apagada: rutas actuales (simula reversión) */
 vm.runInContext('MULTIEMP=false',ctx);
 assert.equal(vm.runInContext('fbCol("catalogo").p',ctx),'catalogo');
 assert.equal(vm.runInContext('fbCol("panel_public").p',ctx),'panel_public');
 /* Borrar lo grabado y activar la bandera: mismo panel, rutas por empresa. */
 rutas.length=0;
 vm.runInContext('MULTIEMP=true',ctx);
 assert.equal(vm.runInContext('fbCol("catalogo").p',ctx),'empresas/tarjeteria-jhon/catalogo');
 assert.equal(vm.runInContext('fbCol("vendedores").p',ctx),'empresas/tarjeteria-jhon/vendedores');
 vm.runInContext('MULTIEMP=false',ctx);
 assert.equal(vm.runInContext('fbCol("catalogo").p',ctx),'catalogo');
});

test('Las claves locales de negocio pasan por lsk; las de persona no se particionan',()=>{
 const app=leer('js/app.js');
 assert.match(app,/localStorage\.getItem\(lsk\('tj_db'\)\)/);
 assert.match(app,/localStorage\.setItem\(lsk\('tj_db'\),/);
 assert.match(app,/indexedDB\.open\(TJEmpresa\.empLSKey\('tj_cat'\),1\)/);
 assert.match(app,/indexedDB\.open\(TJEmpresa\.empLSKey\('tj_loginbg'\),1\)/);
 assert.match(app,/localStorage\.setItem\(lsk\(TJLIVE_KEY\),/);
 for(const k of ['tj_shop_cart','tj_shop_cli','tj_shop_fav','tj_cards'])
  assert.match(app,new RegExp("lsk\\('"+k+"'\\)"),k+' debe particionarse');
 assert.match(app,/const OKEY='tj_shop_orders';/,'constante del histórico de pedidos');
 assert.match(app,/localStorage\.getItem\(lsk\(OKEY\)\)/,'pedidos de la tienda particionados');
 assert.match(app,/lsk\(RL_KEY\)/,'reconocimiento legal particionado');
 assert.match(app,/lsk\(LBG\.k\)/,'fondo de login particionado');
 assert.doesNotMatch(app,/lsk\(CFG_TAB_KEY\)/);
 assert.doesNotMatch(app,/lsk\(_ACT\)|lsk\(_SMN\)/);
 assert.match(app,/localStorage\.getItem\(CFG_TAB_KEY\)/,'preferencia de pestañas sigue sin particionar');
});

test('El puente para apps externas (investigación) enruta .collection sin tocar su código',()=>{
 const app=leer('js/app.js');
 assert.match(app,/window\.__panelBridge=\(\)=>\(\{db:fbDb\?new Proxy\(fbDb,\{get\(t,p\)\{if\(p==='collection'\)return n=>fbCol\(n\)/);
 assert.match(app,/col:fbCol\}\);/);
});
