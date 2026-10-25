/* Fase 22 — banners WebP en Chrome real (tienda pública). Comprueba, en escritorio (1366x900) y móvil (390x844):
   1) con WebP: cada <img> del carrusel resuelve a .webp (currentSrc), carga (naturalWidth>0) y se descargan solo .webp (nada de JPG);
   2) sin soporte WebP (simulado: se reescribe type="image/webp" -> tipo desconocido en js/promo.js, que es exactamente lo que hace un navegador sin WebP): resuelve a .jpg y carga;
   3) con red limitada (CDP, ~1,6 Mbit/s, 150 ms) bytes de banners y tiempo hasta que el primer banner está completo;
   4) capturas del carrusel (webp / jpg) para compararlas a ojo y por píxeles.
   Uso: BASE=http://localhost:8931/ OUT=/tmp/b22 [PW=/ruta/playwright-core] node banners-fase22.js. NUNCA contra producción. */
const {chromium}=require(process.env.PW||'playwright-core');
const fs=require('fs');
const BASE=process.env.BASE,OUT=process.env.OUT||'/tmp/b22';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
fs.mkdirSync(OUT,{recursive:true});
const R={base:BASE,casos:{}};let fallos=0;
const ok=(c,m)=>{if(!c){fallos++;console.log('  FALLA:',m)}return c};
async function caso(br,nombre,{w,h,sinWebp,limitar}){
 const ctx=await br.newContext({viewport:{width:w,height:h},serviceWorkers:'block',reducedMotion:'reduce',isMobile:w<600,hasTouch:w<600});
 const page=await ctx.newPage();const csp=[],cons=[],reqs=[];
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,90)))});
 page.on('console',m=>{if(['error','warning'].includes(m.type())&&!/Failed to load resource|catalogo_default|favicon|tj_cached_items/.test(m.text()))cons.push(m.text().slice(0,160))});
 page.on('pageerror',e=>cons.push('pageerror '+e.message.slice(0,160)));
 page.on('response',async r=>{const u=new URL(r.url());if(u.pathname.startsWith('/banners/')){let b=0;try{b=(await r.body()).length}catch(e){}reqs.push({p:u.pathname,b,s:r.status(),t:Date.now()})}});
 if(sinWebp)await ctx.route('**/js/promo.js*',async route=>{const r=await route.fetch();let t=await r.text();t=t.split('type="image/webp"').join('type="image/x-sin-soporte"');await route.fulfill({response:r,body:t})});
 if(limitar){const cdp=await ctx.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200*1024,uploadThroughput:100*1024})}
 const t0=Date.now();
 await page.goto(BASE+'?tienda',{waitUntil:'load'});
 await page.waitForSelector('#k_promo .khero-slide img',{state:'attached',timeout:30000});
 // espera a que el primer banner (visible) termine de cargar
 await page.waitForFunction(()=>{const i=document.querySelector('#k_promo .khero-slide img');return i&&i.complete&&i.naturalWidth>0},null,{timeout:limitar?90000:20000});
 const tPrimero=Date.now()-t0;
 await page.waitForTimeout(limitar?3000:1500);
 const info=await page.evaluate(()=>{const L=[...document.querySelectorAll('#k_promo .khero-slide img')];return {n:L.length,actuales:L.map(i=>(i.currentSrc||'').split('/').pop()),ok:L.filter(i=>i.complete&&i.naturalWidth>0).length,primero:L[0]?{cs:L[0].currentSrc.split('/').pop(),w:L[0].naturalWidth,h:L[0].naturalHeight}:null,vw:innerWidth}});
 await (await page.$('#k_promo')).screenshot({path:`${OUT}/${nombre}.png`});
 if(!limitar){ // fuerza la carga de los 14 banners (son lazy) y comprueba que TODOS cargan en el formato esperado
  await page.evaluate(()=>document.querySelectorAll('#k_promo .khero-slide img').forEach(i=>{i.loading='eager'}));
  await page.waitForFunction(()=>[...document.querySelectorAll('#k_promo .khero-slide img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000}).catch(()=>{});
  const todas=await page.evaluate(()=>[...document.querySelectorAll('#k_promo .khero-slide img')].map(i=>({s:i.currentSrc.split('/').pop(),ok:i.complete&&i.naturalWidth>0})));
  R.todas=R.todas||{};R.todas[nombre]=todas;
  ok(todas.length===14&&todas.every(t=>t.ok),'los 14 banners cargan: '+todas.filter(t=>!t.ok).map(t=>t.s));
  ok(todas.every(t=>(sinWebp?/\.jpg$/:/\.webp$/).test(t.s)),'los 14 resuelven al formato esperado');
 }
 const e=await page.evaluate(()=>window.__csp);
 const web=reqs.filter(r=>/\.webp$/.test(r.p)),jpg=reqs.filter(r=>/\.jpg$/.test(r.p));
 const c={w,sinWebp:!!sinWebp,limitar:!!limitar,imgs:info.n,cargadas:info.ok,primero:info.primero,tPrimeroMs:tPrimero,webp:{n:web.length,bytes:web.reduce((a,r)=>a+r.b,0)},jpg:{n:jpg.length,bytes:jpg.reduce((a,r)=>a+r.b,0)},status404:reqs.filter(r=>r.s>=400).map(r=>r.p),csp:e,consola:[...new Set(cons)]};
 R.casos[nombre]=c;
 const esperado=sinWebp?/\.jpg$/:/\.webp$/,movil=w<700;
 console.log(nombre,JSON.stringify({imgs:c.imgs,cargadas:c.cargadas,primero:c.primero,tPrimeroMs:c.tPrimeroMs,webp:c.webp,jpg:c.jpg,csp:c.csp.length,consola:c.consola.length}));
 ok(info.n>=14,'hay 14 banners');ok(info.ok>=1&&c.primero&&esperado.test(c.primero.cs),'el primero resuelve a '+(sinWebp?'jpg':'webp')+': '+(c.primero&&c.primero.cs));
 ok(info.actuales.filter(s=>s).every(s=>esperado.test(s)),'todos los cargados resuelven al formato esperado');
 ok(movil===/-m\./.test(c.primero.cs),'variante móvil/escritorio correcta: '+c.primero.cs);
 ok(sinWebp?web.length===0:jpg.length===0,'no se descarga el otro formato');ok(!c.status404.length,'sin 404 en banners');ok(!c.csp.length,'sin violaciones CSP');ok(!c.consola.length,'sin errores de consola: '+c.consola.join(' | '));
 await ctx.close();
}
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 for(const [n,w,h] of [['desktop',1366,900],['movil',390,844]]){
  await caso(br,n+'-webp',{w,h});await caso(br,n+'-jpg-sin-soporte',{w,h,sinWebp:1});await caso(br,n+'-webp-red-lenta',{w,h,limitar:1});
 }
 await br.close();fs.writeFileSync(OUT+'/resultado.json',JSON.stringify(R,null,1));
 console.log(fallos?`FALLÓ (${fallos})`:'TODO BIEN');process.exit(fallos?1:0);
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
