/* Textos, iconos y manifest de Tarjetería Jhon que NO deben aparecer en otra empresa (genuine-prueba, SOLO en el proyecto de PRUEBA).
   Requiere la empresa sembrada con tests/navegador/genuine-siembra.js y PRUEBA_PASSWORD.
   Tienda pública: sin manifest ni canonical de Tarjetería, iconos = logo de la empresa, metas con el nombre de la empresa, sin «Por ocasión»/temas de Tarjetería (categorías propias);
   panel: logo del menú, textos de compartir del vendedor, nombres de archivo, etiquetas de tema y factura sin nada de Tarjetería; la empresa INICIAL no cambia.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/otras-empresas-textos.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP=process.env.EMP||'genuine-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const cabeza=()=>({manifest:!!document.querySelector('link[rel=manifest]'),canonical:!!document.querySelector('link[rel=canonical]'),
 icon:(document.querySelector('link[rel=icon]')||{}).href||'',apple:(document.querySelector('link[rel=apple-touch-icon]')||{}).href||'',
 metas:[...document.querySelectorAll('meta[name=apple-mobile-web-app-title],meta[name=description],meta[property^="og:"],meta[name^="twitter:"]')].map(m=>m.getAttribute('content')||'').join(' | '),
 title:document.title,ogurl:!!document.querySelector('meta[property="og:url"]')});
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 console.log('\n== 1) tienda pública de OTRA empresa: cabecera del documento ==');
 let c=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),p=await c.newPage();
 await p.goto(BASE+'?tienda=1&emp='+EMP,{waitUntil:'load'});await p.waitForSelector('#k_footer',{timeout:25000});await p.waitForTimeout(5000);
 let h=await p.evaluate(cabeza);
 chk('sin manifest de Tarjetería',!h.manifest);chk('sin canonical ni og:url de Tarjetería',!h.canonical&&!h.ogurl);
 chk('iconos = logo de la empresa (data:image), no icon-192.png ni apple-touch-icon.png',/^data:image/.test(h.icon)&&/^data:image/.test(h.apple)&&!/icon-192|apple-touch/.test(h.icon+h.apple),h.icon.slice(0,40));
 chk('metas y título con el nombre de la empresa, sin «Tarjeter»',!/Tarjeter/i.test(h.metas+h.title)&&/Genuine/.test(h.metas+h.title),(h.title+' · '+h.metas).slice(0,160));
 const sh=await p.evaluate(()=>({t:document.getElementById('shop').innerText,chips:[...document.querySelectorAll('#sh_ch .kchip')].map(x=>x.innerText.trim()),temas:TEMAS.length,cats:document.querySelectorAll('.kcat-pill').length}));
 chk('sin «Por ocasión» ni temas de Tarjetería; filtro «Categorías» con las categorías propias (Motor)',!/Por ocasión|Explora por ocasión|Quincea|Baby shower/i.test(sh.t)&&/Categorías/.test(sh.t)&&sh.temas===0&&sh.cats===0&&sh.chips.some(x=>/Motor/.test(x)),JSON.stringify(sh.chips));
 if(SHOTS)await p.screenshot({path:SHOTS+'/b1-tienda-otra-empresa.png'});
 await c.close();
 console.log('\n== 2) tienda de la empresa INICIAL: sin cambios ==');
 c=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});p=await c.newPage();
 await p.goto(BASE+'?tienda=1',{waitUntil:'load'});await p.waitForSelector('#k_footer',{timeout:25000});await p.waitForTimeout(5000);
 h=await p.evaluate(cabeza);const ini=await p.evaluate(()=>({temas:TEMAS.length,t:document.getElementById('shop').innerText}));
 chk('manifest, canonical e iconos de Tarjetería intactos',h.manifest&&h.canonical&&/icon-192/.test(h.icon)&&/apple-touch/.test(h.apple),JSON.stringify({m:h.manifest,c:h.canonical,i:h.icon.slice(-12)}));
 chk('17 temas y «Por ocasión» como siempre',ini.temas===17&&/por ocasión/i.test(ini.t),ini.temas);
 await c.close();
 console.log('\n== 3) panel de OTRA empresa (administrador) ==');
 c=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'});p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,200)));p.on('dialog',d=>d.accept());
 await p.goto(BASE+'?emp='+EMP,{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:25000});await p.waitForTimeout(1200);
 await p.fill('#au_e','admin.prueba@example.com');await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
 await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(4000);
 const lg=await p.evaluate(()=>{const i=document.querySelector('.brand .logo img');return{src:i.getAttribute('src').slice(0,30),alt:i.alt}});
 chk('logo del menú lateral: de la empresa, no assets/logo.png de Tarjetería',!/assets\/logo\.png/.test(lg.src)&&!/Tarjeter/i.test(lg.alt),JSON.stringify(lg));
 const d=await p.evaluate(async()=>{const u=[];window.open=x=>{u.push(decodeURIComponent(x));return null};
  DB.cfg.nombre='';vdShareWa();const wa=u[0]||'';
  const ics=nomArch('agenda_tarjeteria_jhon','agenda_')+'.ics',zip=nomArch('catalogo_tarjeteria_jhon','catalogo_');
  DB.cfg.nombre='Genuine Prueba';
  const f={id:'x',n:1,fecha:'2026-10-25',cli:'Cliente',lineas:[],items:[],total:0,tpl:'apple'};
  const fa=facApple?facApple(Object.assign({},DB.fac[0]||{id:'x',n:1,fecha:'2026-10-25',cli:'Cliente',items:[],total:0,pagos:[]})):'';
  const fc=(function(){try{return facHTML(DB.fac[0]?DB.fac[0].id:'x')}catch(e){return ''}})();
  return{wa,ics,zip,fa:/assets\/logo/.test(fa)||/TARJETAS PARA TODA/i.test(fa),fImg:(fa.match(/ap-brand"><img src="([^"]{0,40})/)||[])[1]||''}});
 chk('texto de compartir del vendedor sin «Tarjetería Jhon»',d.wa&&!/Tarjeter/i.test(d.wa),d.wa.slice(0,90));
 chk('nombres de archivo con la empresa (no tarjeteria_jhon)',!/tarjeteria/i.test(d.ics+d.zip),d.ics+' '+d.zip);
 chk('factura (plantilla Apple) sin logo ni eslogan de Tarjetería',!d.fa,d.fImg);
 await p.evaluate(()=>ir('tienda'));await p.waitForTimeout(2500);
 const tm=await p.evaluate(()=>({tdtm:document.querySelectorAll('.tdtgk').length,filas:document.querySelectorAll('.tdck').length,t:document.getElementById('v').innerText}));
 chk('panel de la tienda: sin selector de temas de Tarjetería (Quinceañero, Boda…)',tm.filas>0&&tm.tdtm===0&&!/Quincea|Baby shower|Bautizo/i.test(tm.t),'filas '+tm.filas+' · '+(tm.t.match(/.{30}(Quincea|Baby shower|Bautizo).{30}/i)||[''])[0].replace(/\n/g,' '));
 if(SHOTS)await p.screenshot({path:SHOTS+'/b1-panel-tienda.png'});
 await p.evaluate(()=>ir('home'));await p.waitForTimeout(1500);if(SHOTS)await p.screenshot({path:SHOTS+'/b1-panel-inicio.png'});
 chk('sin errores JS',errs.length===0,errs.join(' ; '));
 await c.close();await br.close();
 console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
