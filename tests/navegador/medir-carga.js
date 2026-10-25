// Uso: BASE=http://localhost:PUERTO/ [SEG=25] [RUTA=?tienda] PW=/ruta/playwright-core node medir-carga.js
// Mide la primera visita (contexto limpio, con service worker): bytes que sirve el origen, por fase y por archivo.
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=process.env.BASE,SEG=+(process.env.SEG||25);
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:1366,height:900}});
 const page=await ctx.newPage();const cons=[];
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')cons.push(m.type()+': '+m.text().slice(0,160))});
 page.on('pageerror',e=>cons.push('pageerror: '+e.message.slice(0,160)));
 await fetch(BASE+'__reset');
 const t0=Date.now();
 await page.goto(BASE+(process.env.RUTA||''),{waitUntil:'load'});const tLoad=Date.now()-t0;
 const nav=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)}});
 const sumLoad=await (await fetch(BASE+'__log')).json();
 await page.waitForTimeout(4000);const a4=await (await fetch(BASE+'__log')).json();
 await page.waitForTimeout((SEG-4)*1000);
 const all=await (await fetch(BASE+'__log')).json();
 const tot=a=>a.reduce((s,x)=>s+x.b,0);
 const alLoad=sumLoad.filter(x=>x.t<=tLoad+50);
 const mod=all.filter(x=>/modelos\.js/.test(x.p));
 const sinMod=all.filter(x=>!/modelos\.js/.test(x.p));const out={tUltimoArchivoQueNoEsModelosMs:Math.max(...sinMod.map(x=>x.t)),bytesSinModelos:tot(sinMod),BASE,tLoadMs:tLoad,nav,bytesHastaLoad:tot(alLoad),bytesHastaLoadMas4s:tot(a4),bytesTotalTrasEspera:tot(all),reqs:all.length,modelosJs:mod.map(x=>({t:x.t,b:x.b})),modelosEnCargaInicial:alLoad.some(x=>/modelos\.js/.test(x.p)),
  swCaches:await page.evaluate(async()=>{const o={};for(const k of await caches.keys()){const c=await caches.open(k);o[k]=(await c.keys()).map(r=>new URL(r.url).pathname).filter(p=>/modelos/.test(p))}return o}),consola:cons.slice(0,8)};
 console.log(JSON.stringify(out,null,1));require('fs').writeFileSync(process.env.LOGF||'/tmp/log.json',JSON.stringify(all));
 await br.close();
})();
