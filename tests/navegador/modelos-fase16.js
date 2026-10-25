/* Fase 16 — Chrome real: apps/modelos.js (módulo Check) no se pide en la carga inicial, se guarda en la caché del SW en un momento libre,
   Check funciona (admin y vendedor), sin conexión tras el primer uso, y la tienda pública no lo pide.
   Uso: BASE=https://tarjeteria-jhon-prueba.web.app/ PRUEBA_PASSWORD=… node modelos-fase16.js   (NUNCA contra producción)
   playwright-core se resuelve desde el directorio actual o con PW=/ruta/a/playwright-core. */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,TAG=process.env.TAG||'f16';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const R=[];const ok=(n,c,d)=>{R.push((c?'OK    ':'FALLA ')+n+(d?' — '+d:''));console.log(R[R.length-1])};
const PORT_RE=/modelos\.js/;
async function sesion(rol,{ctx,page}){
 await page.fill('#au_e',rol);await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('.ni',{timeout:30000});await page.waitForTimeout(2500);
}
function vigilar(ctx,page,acc){
 ctx.on('request',r=>{if(PORT_RE.test(r.url()))acc.req.push({url:r.url().replace(/^https?:\/\/[^/]+\//,''),sw:!!r.serviceWorker(),t:Date.now()-acc.t0})});
 ctx.on('requestfinished',async r=>{if(PORT_RE.test(r.url())){try{const s=await r.sizes();acc.fin.push({url:r.url().replace(/^https?:\/\/[^/]+\//,''),body:s.responseBodySize})}catch(e){}}});
 page.on('console',m=>{const t=m.text();if(m.type()==='error'||m.type()==='warning'||/Content Security Policy/i.test(t))acc.cons.push(m.type()+': '+t.slice(0,200))});
 page.on('pageerror',e=>acc.cons.push('pageerror: '+e.message.slice(0,200)));
 page.on('framenavigated',()=>{});
}
async function inyectarCSP(page){await page.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,80)))})}
async function estadoCheck(page){
 const fh=await page.waitForSelector('#checkFrame',{timeout:15000});const fr=await fh.contentFrame();
 await fr.waitForFunction(()=>typeof IMGS!=='undefined'&&document.querySelectorAll('#list .row').length>0,null,{timeout:30000});
 await page.waitForTimeout(1500);
 return fr.evaluate(()=>({imgs:Object.keys(IMGS).length,data:(typeof DATA!=='undefined'&&DATA.length)||-1,cats:CATS.length,filas:document.querySelectorAll('#list .row').length,
  rotas:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.src&&!i.loading).length,conImg:[...document.images].filter(i=>i.naturalWidth>0).length}));
}
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 // ---- 1. Primera visita (contexto limpio, con service worker), admin
 let ctx=await br.newContext({viewport:{width:1366,height:900}});let page=await ctx.newPage();
 let acc={req:[],fin:[],cons:[],t0:Date.now()};vigilar(ctx,page,acc);await inyectarCSP(page);
 await page.goto(BASE,{waitUntil:'load'});
 ok('1a carga inicial: ninguna petición a modelos.js hasta el evento load',acc.req.length===0,JSON.stringify(acc.req));
 await page.waitForTimeout(3500);
 ok('1b a los 3,5 s (antes del momento libre) todavía no se pidió',acc.req.length===0,JSON.stringify(acc.req));
 await page.waitForTimeout(16000);
 const ver=await page.evaluate(async()=>{const o={};for(const k of await caches.keys()){const c=await caches.open(k);o[k]=(await c.keys()).map(r=>new URL(r.url).pathname+new URL(r.url).search).filter(p=>/modelos/.test(p))}return o});
 console.log('   cachés:',JSON.stringify(ver),' peticiones modelos.js:',JSON.stringify(acc.req),' bytes:',JSON.stringify(acc.fin));
 ok('1c el service worker lo guardó en un momento libre (1 sola petición, hecha por el SW)',acc.req.length===1&&acc.req[0].sw,JSON.stringify(acc.req));
 ok('1d quedó en la caché del SW con ?v=rendimiento-fase-16',Object.values(ver).some(a=>a.some(p=>/modelos\.js\?v=rendimiento-fase-16/.test(p))));
 await sesion(process.env.PUSER||'admin.prueba@example.com',{ctx,page});
 const n0=acc.req.length;
 await page.evaluate(()=>ir('check'));
 let st=await estadoCheck(page);console.log('   estado Check admin:',JSON.stringify(st));
 ok('2a admin: Check abre y trae modelos (63 imágenes)',st.imgs===63&&st.conImg>0&&st.rotas===0,JSON.stringify(st));
 await page.screenshot({path:`/tmp/${TAG}-check-admin.png`});
 const modelosUso=acc.req.slice(n0);
 ok('2b abrir Check hace como mucho 1 petición de la página a modelos.js (la del SW es la misma, pasa por él)',modelosUso.filter(x=>!x.sw).length<=1,JSON.stringify(modelosUso));
 const csp=await page.evaluate(()=>window.__csp);const cspF=await (await page.$('#checkFrame')).contentFrame().then(f=>f.evaluate(()=>window.__csp||[]));
 ok('2c 0 violaciones CSP (página e iframe) en este recorrido',csp.length===0,JSON.stringify(csp.slice(0,5)));
 // pantalla Inicio y barra de Modelos
 await page.evaluate(()=>ir('home'));await page.waitForTimeout(1500);
 // ---- 3. Sin conexión (con la sesión abierta): Check se vuelve a abrir y su modelos.js sale de la caché del service worker
 // (nota: recargar la página entera sin conexión no muestra el menú ni en main: la sesión necesita red; por eso se prueba así)
 await ctx.setOffline(true);
 await page.evaluate(()=>ir('home'));await page.waitForTimeout(600);await page.evaluate(()=>ir('check'));
 try{st=await estadoCheck(page);ok('3a sin conexión Check abre con sus 63 modelos (modelos.js desde la caché del SW)',st.imgs===63&&st.filas===63&&st.rotas===0,JSON.stringify(st));await page.screenshot({path:`/tmp/${TAG}-check-offline.png`})}catch(e){ok('3a sin conexión Check abre con sus 63 modelos',false,e.message.slice(0,120))}
 await ctx.setOffline(false);
 const util=acc.cons.filter(c=>!/Failed to load resource|favicon|catalogo_default|net::ERR_INTERNET_DISCONNECTED|ERR_FAILED/.test(c));
 console.log('   consola (sin ruido de red/offline):',JSON.stringify(util.slice(0,10)));
 ok('3b sin errores de consola propios de la fase',!util.some(c=>/modelos|IMGS|DATA|CATS|Content Security Policy/i.test(c)),JSON.stringify(util.filter(c=>/modelos|IMGS|DATA|CATS|Content Security Policy/i.test(c)).slice(0,4)));
 await ctx.close();
 // ---- 4. Primer uso SIN precalentamiento (se anula el mensaje al SW): Check debe cargar igual y el SW lo guarda al primer uso
 ctx=await br.newContext({viewport:{width:1366,height:900}});page=await ctx.newPage();acc={req:[],fin:[],cons:[],t0:Date.now()};vigilar(ctx,page,acc);await inyectarCSP(page);
 await page.addInitScript(()=>{try{ServiceWorker.prototype.postMessage=function(){}}catch(e){}});
 await page.goto(BASE,{waitUntil:'load'});
 await sesion(process.env.PUSER||'admin.prueba@example.com',{ctx,page});
 const antes=await page.evaluate(async()=>{let n=0;for(const k of await caches.keys()){const c=await caches.open(k);n+=(await c.keys()).filter(r=>/modelos\.js/.test(r.url)).length}return n});
 ok('4a antes de abrir Check no hay modelos.js en la caché (precalentamiento anulado)',antes===0&&acc.req.length===0,'caché='+antes+' req='+JSON.stringify(acc.req));
 await page.evaluate(()=>ir('check'));
 try{st=await estadoCheck(page);ok('4b primer uso: Check abre con sus 63 modelos',st.imgs===63&&st.filas===63,JSON.stringify(st))}catch(e){ok('4b primer uso: Check abre',false,e.message.slice(0,120))}
 await page.waitForTimeout(3000);
 const desp=await page.evaluate(async()=>{let n=0;for(const k of await caches.keys()){const c=await caches.open(k);n+=(await c.keys()).filter(r=>/modelos\.js/.test(r.url)).length}return n});
 ok('4c tras el primer uso el SW lo guardó en su caché',desp===1,'caché='+desp+' req='+JSON.stringify(acc.req));
 ok('4d 0 violaciones CSP',(await page.evaluate(()=>window.__csp)).length===0);
 await ctx.close();
 // ---- 4e. Vendedor: el panel carga y no pide modelos.js (en la copia de prueba su menú no incluye Check)
 ctx=await br.newContext({viewport:{width:1366,height:900}});page=await ctx.newPage();acc={req:[],fin:[],cons:[],t0:Date.now()};vigilar(ctx,page,acc);await inyectarCSP(page);
 await page.goto(BASE,{waitUntil:'load'});
 await sesion('vendedor.prueba@example.com',{ctx,page});
 for(const k of ['home','fac','cli','prod'])await page.evaluate(x=>ir(x),k).then(()=>page.waitForTimeout(800));
 const menus=await page.evaluate(()=>[...new Set([...document.querySelectorAll('.ni')].map(e=>e.dataset.k))]);
 ok('4e vendedor: panel y pantallas cargan, 0 violaciones CSP',(await page.evaluate(()=>window.__csp)).length===0&&menus.length>3,'menús='+menus.join(','));
 await ctx.close();
 // ---- 5. Tienda pública: sin SW y sin modelos.js
 ctx=await br.newContext({viewport:{width:1366,height:900}});page=await ctx.newPage();acc={req:[],fin:[],cons:[],t0:Date.now()};vigilar(ctx,page,acc);await inyectarCSP(page);
 await page.goto(BASE+'?tienda',{waitUntil:'load'});await page.waitForTimeout(18000);
 const sws=await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length);
 ok('5a tienda pública: sin service worker registrado y sin petición a modelos.js',sws===0&&acc.req.length===0,'sw='+sws+' req='+JSON.stringify(acc.req));
 await page.screenshot({path:`/tmp/${TAG}-tienda.png`});
 ok('5b tienda: 0 violaciones CSP',(await page.evaluate(()=>window.__csp)).length===0);
 await ctx.close();
 await br.close();
 const f=R.filter(x=>x.startsWith('FALLA'));console.log(`\n${R.length-f.length}/${R.length} OK`);process.exit(f.length?1:0);
})().catch(e=>{console.error('ERROR',e.message);process.exit(2)});
