// Uso: ANTES=/ruta/copia-main DESPUES=/ruta/copia-nueva node actualizacion-sw.js (cada copia con una caché de SW distinta en su sw.js)
// Camino de actualización: usuario que ya tenía el SW anterior (main, caché tj-before con modelos.js) y recibe la fase 16 (tj-after).
const {chromium}=require(process.env.PW||'playwright-core');const {spawn}=require('child_process');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let srv;const levantar=d=>{if(srv)srv.kill();srv=spawn('node',[''+__dirname+'/servidor-medicion.js',d,'8830'],{stdio:'ignore'})};
const caches=p=>p.evaluate(async()=>{const o={};for(const k of await caches.keys()){const c=await caches.open(k);o[k]=(await c.keys()).map(r=>new URL(r.url).pathname+new URL(r.url).search).filter(x=>/modelos\.js/.test(x))}return o});
(async()=>{levantar(process.env.ANTES);await sleep(800);
 const br=await chromium.launch({channel:'chrome',headless:true});const ctx=await br.newContext();const page=await ctx.newPage();
 await page.goto('http://localhost:8830/',{waitUntil:'load'});await sleep(8000);
 console.log('1) versión anterior instalada:',JSON.stringify(await caches(page)));
 levantar(process.env.DESPUES);await sleep(800);
 await page.reload({waitUntil:'load'});
 for(const t of [3,10,20]){await sleep((t===3?3:t===10?7:10)*1000);console.log(`2) +${t}s tras actualizar:`,JSON.stringify(await caches(page)))}
 const ks=await page.evaluate(()=>caches.keys());console.log('cachés existentes:',JSON.stringify(ks));
 await br.close();srv.kill()})()
