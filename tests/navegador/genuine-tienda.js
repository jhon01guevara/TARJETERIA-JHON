/* Tienda de OTRA empresa (genuine-prueba) en Chrome real contra la copia de PRUEBA: ni logo ni textos de Tarjetería Jhon en ningún instante.
   Requiere la empresa sembrada con tests/navegador/genuine-siembra.js. Solo LEE Firestore como cualquier visitante (contexto nuevo, sin sesión).
   Comprueba: (1) sin copia local y sin red de Firestore → huecos neutros, nada de Tarjetería; (2) carga normal → logo y textos de la empresa en la
   cabecera y la portada, nada de Tarjetería durante TODA la carga (línea de tiempo cada 15 ms); (3) recarga con Firestore bloqueado → el primer pintado
   ya sale de la copia local con el logo y los textos correctos; (4) sin logo propio → inicial de la empresa; (5) la empresa inicial no cambia.
   Uso: BASE=http://127.0.0.1:PUERTO/ [EMP=genuine-prueba] [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/genuine-tienda.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP=process.env.EMP||'genuine-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const sonda=()=>{window.__fuga=[];window.__tl=[];
 const f=()=>{const q=s=>document.querySelector(s),sh=q('#shop');if(!sh)return;
  const im=q('#shop .kbrand img'),txt=sh.innerText||'';
  const p=[];if(im&&/assets\/logo(-t)?\.png/.test(im.getAttribute('src')||im.src))p.push('logo-tarjeteria');
  if(/Tarjeter[ií]a/i.test(txt))p.push('texto-tarjeteria');if(/Cada momento merece/i.test(txt))p.push('eslogan-tarjeteria');if(/Tarjetas para/i.test(txt))p.push('promo-tarjetas');
  if(p.length)window.__fuga.push(p.join('+')+' @'+Math.round(performance.now()));
  const st=[im?'img':(q('#shop .klogo-ph')?'hueco':q('#shop .klogo-mono')?'inicial':'sin-logo'),(q('.khero-title')||{textContent:'-'}).textContent.trim()||'(vacío)'].join('|');
  if(!window.__tl.length||window.__tl[window.__tl.length-1]!==st)window.__tl.push(st)};
 setInterval(f,15)};
const estado=page=>page.evaluate(()=>{const q=s=>document.querySelector(s),im=q('#shop .kbrand img');
 return{img:im?im.getAttribute('src').slice(0,30):null,hueco:!!q('#shop .klogo-ph'),inicial:(q('#shop .klogo-mono')||{}).textContent||null,titulo:(q('.khero-title')||{}).textContent,sub:(q('.khero-wordmark-sub')||{}).textContent,fuga:window.__fuga,tl:window.__tl,doc:document.title,
  promo:!!q('#k_promo .khero-slide')}});
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const nuevo=async(bloquear)=>{const c=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});await c.addInitScript(sonda);if(bloquear)await c.route(/firestore\.googleapis\.com/,r=>r.abort());return c};
 const url=BASE+'?tienda=1&emp='+EMP;
 console.log('\n== 1) sin copia local y sin Firestore (peor caso) ==');
 let c=await nuevo(true),p=await c.newPage();await p.goto(url,{waitUntil:'load'});await p.waitForTimeout(3500);
 let e=await estado(p);
 chk('hueco neutro en la cabecera (sin logo de Tarjetería)',e.hueco&&!e.img,JSON.stringify(e.tl));
 chk('portada sin título ni eslogan de Tarjetería (esqueleto)',!/Tarjeter/i.test(e.titulo||'')&&e.fuga.length===0,JSON.stringify(e.fuga));
 if(SHOTS)await p.screenshot({path:SHOTS+'/tienda-1-sin-copia-sin-red.png'});
 await c.close();
 console.log('\n== 2) carga normal (línea de tiempo cada 15 ms) ==');
 c=await nuevo(false);p=await c.newPage();await p.goto(url,{waitUntil:'load'});await p.waitForTimeout(6000);e=await estado(p);
 chk('cabecera con el logo de la empresa (data:image)',/^data:image/.test(e.img||''),e.img);
 chk('portada con el título y el eslogan de la empresa',e.titulo==='Global Online Part'&&/automóvil/.test(e.sub||''),e.titulo+' / '+e.sub);
 chk('NINGÚN instante con logo, nombre ni eslogan de Tarjetería',e.fuga.length===0,e.fuga.join(' ; '));
 chk('sin banners promocionales de Tarjetería',!e.promo);
 chk('título de la pestaña = empresa',/Genuine/.test(e.doc),e.doc);
 console.log('  línea de tiempo: '+e.tl.join('  →  '));
 if(SHOTS)await p.screenshot({path:SHOTS+'/tienda-2-carga-normal.png'});
 const ls=await p.evaluate(()=>Object.keys(localStorage).filter(k=>/tj_cached_cfg/.test(k)));
 chk('copia local de la plantilla guardada solo con el sufijo de la empresa',ls.length===1&&ls[0].endsWith('_'+EMP),ls.join(','));
 console.log('\n== 3) recarga con Firestore bloqueado: primer pintado desde la copia local ==');
 await p.close();await c.route(/firestore\.googleapis\.com/,r=>r.abort());
 p=await c.newPage();await p.goto(url,{waitUntil:'load'});await p.waitForTimeout(2500);e=await estado(p);
 chk('cabecera con el logo de la empresa desde el primer instante',/^data:image/.test(e.img||'')&&e.tl.length===1&&e.tl[0]==='img|Global Online Part',e.tl.join(' → '));
 chk('título y eslogan de la empresa',e.titulo==='Global Online Part'&&/automóvil/.test(e.sub||''),e.titulo);
 chk('nada de Tarjetería',e.fuga.length===0,e.fuga.join(' ; '));
 if(SHOTS)await p.screenshot({path:SHOTS+'/tienda-3-recarga-desde-copia.png'});
 console.log('\n== 4) empresa sin logo propio → inicial ==');
 await p.evaluate(()=>{SH.logoUrl='';TD.logoUrl='';shopBrandRefresh()});e=await estado(p);
 chk('inicial de la empresa (G) y ninguna imagen de Tarjetería',e.inicial==='G'&&!e.img,JSON.stringify({i:e.inicial,img:e.img}));
 await c.close();
 console.log('\n== 5) la empresa INICIAL no cambia ==');
 c=await nuevo(false);p=await c.newPage();await p.goto(BASE+'?tienda=1',{waitUntil:'load'});await p.waitForTimeout(6000);
 const ini=await p.evaluate(()=>({img:(document.querySelector('#shop .kbrand img')||{}).src||'',t:(document.querySelector('.khero-title')||{}).textContent,promo:!!document.querySelector('#k_promo .khero-slide'),sub:(document.querySelector('.khero-wordmark-sub')||{}).textContent||''}));
 chk('logo de Tarjetería, su título, su eslogan y sus banners',/assets\/logo/.test(ini.img)&&/Tarjeter/i.test(ini.t)&&/Cada momento/.test(ini.sub)&&ini.promo,JSON.stringify(ini));
 await c.close();await br.close();
 console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
