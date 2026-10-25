/* Fase 24 — cuenta cuántos documentos de Firestore entrega cada escucha (onSnapshot) del panel de administración, para entender la cuota gratuita (50 000 lecturas/día) de la copia de PRUEBA.
   Instrumenta `Query/DocumentReference.onSnapshot` anteponiendo un parche a js/app.js SOLO en el navegador (no se modifica ningún archivo). No guarda nada.
   Uso: BASE=http://127.0.0.1:8948/ PRUEBA_PASSWORD=… node tests/navegador/medir-lecturas-fase24.js     (copia hecha con copia-prueba.js; nunca producción) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),PASS=process.env.PRUEBA_PASSWORD;
if(!process.env.BASE||/\/\/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
if(!PASS)throw new Error('Falta PRUEBA_PASSWORD');
const INS=`;(function(){window.__lec=[];const wrap=(P,tag)=>{const o=P.onSnapshot;P.onSnapshot=function(){const a=[].slice.call(arguments);let lbl='?';try{lbl=(this._delegate&&this._delegate._query?this._delegate._query.path.canonicalString():this._delegate&&this._delegate._key?this._delegate._key.path.canonicalString():'?')}catch(e){}
 const rec={tag,lbl,docs:0,snaps:0,stack:(new Error().stack.split('\\n')[2]||'').trim().slice(-40)};window.__lec.push(rec);
 const cb=a.find(x=>typeof x==='function');if(cb){const i=a.indexOf(cb);a[i]=function(s){rec.snaps++;try{rec.docs+=s.docs?(s.docChanges?s.docChanges().length:s.docs.length):(s.exists?1:0)}catch(e){}return cb.apply(this,arguments)}}
 else if(a[0]&&typeof a[0].next==='function'){const n=a[0].next;a[0].next=function(s){rec.snaps++;try{rec.docs+=s.docs?s.docChanges().length:(s.exists?1:0)}catch(e){}return n.apply(this,arguments)}}
 return o.apply(this,a)}};wrap(firebase.firestore.Query.prototype,'q');wrap(firebase.firestore.DocumentReference.prototype,'d');})();\n`;
(async()=>{const br=await chromium.launch({channel:'chrome',headless:true});const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const page=await ctx.newPage();
 await ctx.route(/\/js\/app\.js/,async r=>{const resp=await r.fetch();let b=await resp.text();r.fulfill({response:resp,body:INS+b})});
 let w=0;page.on('request',r=>{if(/Write\/channel/.test(r.url())&&r.method()==='POST')w++});
 await page.goto(BASE,{waitUntil:'load'});await page.waitForSelector('#au_e');await page.fill('#au_e','admin.prueba@example.com');await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('.ni',{state:'attached',timeout:40000});await page.waitForTimeout(8000);
 const f=async t=>{const l=await page.evaluate(()=>window.__lec);const tot=l.reduce((s,x)=>s+x.docs,0);console.log('--',t,'listeners',l.length,'docs entregados',tot);return l};
 let l=await f('tras iniciar sesión (admin)');
 const claves=await page.evaluate(()=>[...new Set([...document.querySelectorAll('#nav .ni')].map(e=>e.dataset.k))]);
 for(const k of claves){try{await page.click('#nav .ni[data-k="'+k+'"]',{timeout:5000});await page.waitForTimeout(1200)}catch(e){}}
 l=await f('tras recorrer todas las pantallas');
 const m={};l.forEach(x=>{const k=x.lbl;m[k]=m[k]||{n:0,docs:0,snaps:0};m[k].n++;m[k].docs+=x.docs;m[k].snaps+=x.snaps});
 console.log(Object.entries(m).sort((a,b)=>b[1].docs-a[1].docs).map(([k,v])=>k+': listeners '+v.n+', snapshots '+v.snaps+', docs '+v.docs).join('\n'));
 console.log('POST Write/channel:',w);
 await br.close()})();
