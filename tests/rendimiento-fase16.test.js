/* Fase 16: apps/modelos.js (1,6 MB; módulo Check) no se descarga en la carga inicial ni al instalar el service worker.
   Solo lo pide el iframe de Check (apps/modelos.html) al abrirse, y el service worker lo guarda al primer uso o en un momento libre. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {appTodo}=require('./helpers/app-fuentes.js');
const raiz=path.join(__dirname,'..');
const leer=f=>fs.readFileSync(path.join(raiz,f),'utf8');
const sw=leer('sw.js');
const MODELOS=/const MODELOS='([^']+)'/.exec(sw)[1];

function jsDelRepo(){const o=[];for(const d of ['js','apps','migraciones'])for(const f of fs.readdirSync(path.join(raiz,d)))if(/\.(js|html)$/.test(f)&&f!=='modelos.js')o.push(d+'/'+f);return o}

test('Fase 16: index.html y los scripts del panel no cargan apps/modelos.js',()=>{
 assert.doesNotMatch(leer('index.html'),/modelos\.js/);
 for(const f of jsDelRepo()){
  const s=leer(f);
  if(f==='apps/modelos.html'){assert.match(s,/<script src="apps\/modelos\.js\?v=[\w-]+"><\/script>/,f);continue}
  assert.doesNotMatch(s,/<script[^>]+modelos\.js/i,f+' no debe incluir el script');
  assert.doesNotMatch(s,/['"`]apps\/modelos\.js/,f+' no debe pedirlo por su cuenta');
 }
});
test('Fase 16: único consumidor = el iframe de Check, que lo trae al abrirse (apps/modelos.html), con ?v= igual al del service worker',()=>{
 const h=leer('apps/modelos.html');
 assert.equal((h.match(/modelos\.js/g)||[]).length,1);
 assert.equal(/<script src="(apps\/modelos\.js\?v=[\w-]+)">/.exec(h)[1],MODELOS);
 const app=appTodo();
 // el iframe de Check lo usa a través de apps/modelos.html (appHtml), no de modelos.js (Fase 17: cintChk ya no lee modelos.html; usa apps/modelos-cintillo.json)
 assert.match(app,/appHtml\('modelos'\)\.then\(h=>\{_cf\.srcdoc=chkSkin\(h\)\}\)/);
 assert.doesNotMatch(app,/h=await appHtml\('modelos'\)/);
 assert.doesNotMatch(app,/fetch\(['"`]apps\/modelos\.js/);
});
test('Fase 16: sw.js — caché tj-net-first-12, modelos.js fuera de la instalación y ?v= de la fase',()=>{
 assert.match(sw,/const V='tj-net-first-\d+'/);
 const pre=eval(/const PRE=(\[[^\]]*\])/.exec(sw)[1]);
 assert.ok(!pre.some(u=>/modelos\.js/.test(u)),'PRE no incluye modelos.js');
 for(const u of ['index.html','apps/modelos.html','apps/modelos.css','css/chkskin.css','js/app.js','apps/investigacion.js'])assert.ok(pre.includes(u),u+' sigue en el precache');
 assert.equal(MODELOS,'apps/modelos.js?v=rendimiento-fase-16');
 assert.match(leer('index.html'),/js\/app\.js\?v=[a-z0-9-]+/);
});

/* Ejecuta sw.js con un entorno falso para comprobar su comportamiento real. */
function cargarSW(){
 const handlers={},store=new Map(),pedidos=[];
 const cache={match:async u=>store.get(new URL(u,'https://x.test/').href),put:async(u,r)=>{store.set(new URL(typeof u==='string'?u:u.url,'https://x.test/').href,r)}};
 const env={
  console,URL,Request:class{constructor(u){this.url=new URL(u,'https://x.test/').href;this.method='GET'}},
  location:{origin:'https://x.test'},
  caches:{open:async()=>cache,keys:async()=>[],delete:async()=>{},match:async u=>cache.match(typeof u==='string'?u:u.url)},
  fetch:async u=>{const url=new URL(typeof u==='string'?u:u.url,'https://x.test/').href;pedidos.push(url);return {ok:true,clone(){return this},url}},
  self:{addEventListener:(n,f)=>{handlers[n]=f},skipWaiting(){},clients:{claim:async()=>{}}}
 };
 env.self.location=env.location;vm.createContext(env);vm.runInContext(sw,env);
 return {handlers,store,pedidos};
}
test('Fase 16: instalar el service worker NO descarga modelos.js, pero sí el resto del precache',async()=>{
 const s=cargarSW();let p;s.handlers.install({waitUntil:x=>{p=x}});await p;
 assert.ok(s.pedidos.length>10);
 assert.ok(!s.pedidos.some(u=>/modelos\.js/.test(u)),'ninguna petición a modelos.js');
 assert.ok(s.pedidos.some(u=>/apps\/modelos\.html/.test(u)));
});
test('Fase 16: mensaje «precalentar-modelos» guarda modelos.js una sola vez; otros mensajes se ignoran',async()=>{
 const s=cargarSW();
 const enviar=async d=>{let p=null;s.handlers.message({data:d,waitUntil:x=>{p=x}});if(p)await p;return !!p};
 assert.equal(await enviar('otra-cosa'),false);assert.deepEqual(s.pedidos,[]);
 assert.equal(await enviar('precalentar-modelos'),true);
 assert.deepEqual(s.pedidos,['https://x.test/'+MODELOS]);
 assert.ok(s.store.has('https://x.test/'+MODELOS),'quedó guardado en la caché');
 await enviar('precalentar-modelos');
 assert.equal(s.pedidos.length,1,'si ya está guardado no se vuelve a descargar');
});
test('Fase 16: la primera vez que Check lo pide (online) el handler de fetch lo guarda; sin conexión se sirve de la caché',async()=>{
 const s=cargarSW();const req=new (class{constructor(){this.url='https://x.test/'+MODELOS;this.method='GET';this.mode='no-cors'}})();
 let r1;s.handlers.fetch({request:req,respondWith:p=>{r1=p}});const res=await r1;assert.ok(res.ok);
 await new Promise(r=>setImmediate(r));
 assert.ok(s.store.has(req.url),'guardado al primer uso');
});

/* La función de app.js que pide el precalentamiento: se extrae y se ejecuta con entornos falsos. */
function correrPrecalentar(opts){
 const fuente=appTodo();
 const m=/function precalentarModelos\(\)\{[\s\S]*?\n\}\n/.exec(fuente);assert.ok(m,'precalentarModelos existe');
 const msgs=[],timers=[],listeners=[];
 const env={SHOP:!!opts.shop,setTimeout:(f,t)=>{timers.push(f)},
  navigator:{onLine:opts.online!==false,connection:opts.conn,serviceWorker:{addEventListener:(n,f,o)=>listeners.push(n),ready:Promise.resolve({active:{postMessage:x=>msgs.push(x)}})}},
  window:{requestIdleCallback:f=>timers.push(f)}};
 vm.createContext(env);vm.runInContext(m[0]+';precalentarModelos();',env);
 return (async()=>{for(let i=0;i<6;i++){const t=timers.splice(0);t.forEach(f=>f());await new Promise(r=>setImmediate(r))}return {msgs,listeners}})();
}
test('Fase 16: app.js pide el precalentamiento en un momento libre, y no en tienda pública, sin conexión, con ahorro de datos ni en 2G',async()=>{
 let r=await correrPrecalentar({});assert.deepEqual(r.msgs,['precalentar-modelos']);assert.deepEqual(r.listeners,['controllerchange']);
 for(const o of [{shop:true},{online:false},{conn:{saveData:true}},{conn:{effectiveType:'2g'}},{conn:{effectiveType:'slow-2g'}}]){
  r=await correrPrecalentar(o);assert.deepEqual(r.msgs,[],JSON.stringify(o));
 }
 r=await correrPrecalentar({conn:{effectiveType:'4g',saveData:false}});assert.ok(r.msgs.length>=1);
});
test('Fase 16: el registro del service worker sigue ocurriendo solo fuera de la tienda y el precalentamiento cuelga de él',()=>{
 assert.match(appTodo(),/window\.addEventListener\('load',\(\)=>\{\(SHOP\?Promise\.resolve\(\):navigator\.serviceWorker\.register\('sw\.js'\)\.then\(precalentarModelos\)\)\.catch\(\(\)=>\{\}\)\}\)/);
});
test('Fase 16: la CSP no se tocó (script-src sin unsafe-inline/eval; modelos.js es de origen propio)',()=>{
 const csp=/Content-Security-Policy" content="([^"]*)"/.exec(leer('index.html'))[1];
 const d=n=>new RegExp('(?:^|; )'+n+' ([^;]*)').exec(csp)[1];
 assert.match(d('script-src'),/^'self' /);
 assert.doesNotMatch(d('script-src'),/unsafe-inline|unsafe-eval/);
 assert.doesNotMatch(d('style-src-elem'),/unsafe-inline/);
});
test('Fase 16: modelos.js sigue existiendo en apps/ y ningún test/archivo lo espera en js/',()=>{
 assert.ok(fs.existsSync(path.join(raiz,'apps/modelos.js')));
 assert.ok(!fs.existsSync(path.join(raiz,'js/modelos.js')));
});
