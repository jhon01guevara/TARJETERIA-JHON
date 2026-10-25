/* Marca VEN CRM — prueba en Chrome real de la pantalla de acceso del PANEL y de que la TIENDA conserva su marca. No inicia sesión ni escribe nada.
   Corre contra la COPIA DE PRUEBA (`node tests/navegador/copia-prueba.js /tmp/copia` + `python3 -m http.server 89xx --bind 127.0.0.1` en esa carpeta); nunca producción.
   Uso: BASE=http://127.0.0.1:8961/ PW=/ruta/a/playwright-core SHOTS=/tmp/capturas node tests/navegador/marca-ven-crm.js
   Comprueba (panel): <html class="ven-crm">, manifest = manifest-ven-crm.json (nombre «VEN CRM», íconos cargables), título, íconos del <head>, logo VEN CRM del acceso cargado, pie «VEN CRM», sin violaciones CSP ni errores.
   Comprueba (tienda ?tienda=1): sin clase ni logo VEN, manifest = manifest.json, íconos/título/apple-title de Tarjetería Jhon.  Código de salida: 0 bien · 1 falla · 2 no se pudo preparar. */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Esta prueba solo corre contra la copia de PRUEBA (BASE=…)');
const RUIDO=/Failed to load resource: the server responded with a status of (404|429)|Service Worker registration blocked|resource-exhausted|Quota exceeded|Failed to load resource: net::ERR/;
let fallos=0;const chk=(n,ok,det)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(det?'  ['+det+']':''))};
async function pagina(br,url,vp){
 const ctx=await br.newContext({viewport:vp,serviceWorkers:'block',reducedMotion:'reduce',isMobile:vp.width<600,hasTouch:vp.width<600});
 const page=await ctx.newPage(),S={err:[],cons:[]};
 page.on('pageerror',e=>S.err.push(e.message.slice(0,200)));
 page.on('console',m=>{const t=m.text();if(['error','warning'].includes(m.type())||/Content Security Policy/i.test(t)){if(!RUIDO.test(t))S.cons.push(m.type()+': '+t.slice(0,200))}});
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,80)))});
 await page.goto(url,{waitUntil:'load'});
 return {ctx,page,S};
}
const manifest=async(page)=>{const c=await page.context().newCDPSession(page);await c.send('Page.enable');const r=await c.send('Page.getAppManifest');return r};
const cabeza=page=>page.evaluate(()=>({
 clase:document.documentElement.classList.contains('ven-crm'),titulo:document.title,
 manifest:document.querySelector('link[rel=manifest]').getAttribute('href'),icono:document.querySelector('link[rel=icon]').getAttribute('href'),
 apple:document.querySelector('link[rel=apple-touch-icon]').getAttribute('href'),appleTitulo:document.querySelector('meta[name=apple-mobile-web-app-title]').content,
 tema:document.querySelector('meta[name=theme-color]').content,csp:window.__csp.slice()}));
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 for(const [etq,vp] of [['escritorio',{width:1366,height:900}],['móvil',{width:390,height:844}]]){
  console.log('\n== PANEL · acceso ('+etq+') ==');
  const {ctx,page,S}=await pagina(br,BASE,vp);
  await page.waitForSelector('#au_e',{timeout:20000});await page.waitForTimeout(1200);
  const h=await cabeza(page);
  chk('html.ven-crm',h.clase);chk('título «VEN CRM · Panel»',h.titulo==='VEN CRM · Panel',h.titulo);
  chk('manifest del head = manifest-ven-crm.json',h.manifest==='manifest-ven-crm.json',h.manifest);
  chk('favicon, apple-touch y apple-title de VEN CRM',/ven-crm\/favicon\.svg$/.test(h.icono)&&/ven-crm\/apple-touch-icon-180\.png$/.test(h.apple)&&h.appleTitulo==='VEN CRM',h.icono+' '+h.apple+' '+h.appleTitulo);
  chk('theme-color #000000',h.tema==='#000000',h.tema);
  const m=await manifest(page);
  chk('Chrome carga manifest-ven-crm.json sin errores',/manifest-ven-crm\.json$/.test(m.url)&&!(m.errors||[]).length,m.url+' '+JSON.stringify(m.errors||[]));
  let mj={};try{mj=JSON.parse(m.data)}catch(e){}
  chk('manifest: name/short_name «VEN CRM», id, 3 íconos (any 192/512 + maskable 512)',mj.name==='VEN CRM'&&mj.short_name==='VEN CRM'&&!!mj.id&&(mj.icons||[]).length===3&&mj.icons.some(i=>i.purpose==='maskable'),JSON.stringify(mj.icons&&mj.icons.map(i=>i.sizes+':'+i.purpose)));
  const lg=await page.evaluate(()=>{const i=document.querySelector('#authc .vlogo img');return i?{ok:i.complete&&i.naturalWidth>0,w:Math.round(i.getBoundingClientRect().width),h:Math.round(i.getBoundingClientRect().height),vis:getComputedStyle(document.getElementById('auth')).display}:null});
  chk('logo VEN CRM visible en el acceso',lg&&lg.ok&&lg.w>=150&&lg.vis==='flex',JSON.stringify(lg));
  const pie=await page.evaluate(()=>(document.querySelector('#authc .afoot')||{}).textContent||'');
  chk('pie del acceso «VEN CRM»',/VEN CRM/.test(pie)&&!/Panel de Facturación/.test(pie),pie);
  const des=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);chk('sin desbordamiento horizontal',des);
  chk('sin violaciones CSP',h.csp.length===0,h.csp.join(' | '));
  chk('sin errores de JS/consola',S.err.length===0&&S.cons.length===0,S.err.concat(S.cons).join(' | ').slice(0,300));
  if(SHOTS)await page.screenshot({path:SHOTS+'/login-'+(vp.width<600?'movil':'escritorio')+'.png'});
  await ctx.close();
 }
 console.log('\n== TIENDA (?tienda=1) conserva su marca ==');
 {const {ctx,page,S}=await pagina(br,BASE+'?tienda=1',{width:390,height:844});
  await page.waitForTimeout(2500);
  const h=await cabeza(page);
  chk('sin html.ven-crm',!h.clase);chk('título sin «VEN CRM»',!/VEN CRM/.test(h.titulo),h.titulo);
  chk('manifest = manifest.json',h.manifest==='manifest.json',h.manifest);
  chk('íconos y apple-title de Tarjetería Jhon',h.icono==='icon-192.png'&&h.apple==='apple-touch-icon.png'&&h.appleTitulo==='Tarjetería Jhon',h.icono+' '+h.apple+' '+h.appleTitulo);
  
  const m=await manifest(page);chk('Chrome carga manifest.json',/\/manifest\.json$/.test(m.url),m.url);
  const nv=await page.evaluate(()=>({vlogo:document.querySelectorAll('.vlogo,img[src*="ven-crm"]').length,auth:!!document.getElementById('auth')&&getComputedStyle(document.getElementById('auth')).display!=='none'}));
  chk('la tienda no muestra logo VEN ni pantalla de acceso',nv.vlogo===0&&!nv.auth,JSON.stringify(nv));
  chk('sin violaciones CSP',h.csp.length===0,h.csp.join(' | '));
  if(SHOTS)await page.screenshot({path:SHOTS+'/tienda.png'});
  await ctx.close();}
 await br.close();
 console.log('\n'+(fallos?fallos+' FALLA(S)':'TODO BIEN'));process.exit(fallos?1:0);
})().catch(e=>{console.error('ERROR: '+e.message);process.exit(2)});
