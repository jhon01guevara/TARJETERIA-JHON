/* Fases 17-19 — recorrido comparable en Chrome real. Entra con cada usuario de prueba, abre TODAS las pantallas de su menú,
   guarda una captura por pantalla, y recoge: avisos/errores de consola (con conteo), violaciones CSP, errores de página,
   el contenido de la barra de Inicio (cintillo) y una huella del texto de cada pantalla. Sirve para comparar «main» contra la rama.
   Uso: BASE=http://localhost:8901/ OUT=/tmp/antes ROLES=admin.prueba@example.com,vendedor.prueba@example.com [VP=1366x900] [SW=block] node recorrido.js
   Requiere PRUEBA_PASSWORD; playwright-core con PW=/ruta. NUNCA contra producción. */
const {chromium}=require(process.env.PW||'playwright-core');
const fs=require('fs'),crypto=require('crypto');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,OUT=process.env.OUT||'/tmp/recorrido';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const ROLES=(process.env.ROLES||'admin.prueba@example.com,vendedor.prueba@example.com').split(',');
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number);
fs.mkdirSync(OUT,{recursive:true});
const ruido=/Failed to load resource|favicon|catalogo_default|ERR_INTERNET_DISCONNECTED|chrome-extension/;
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const res={base:BASE,vp:W+'x'+H,roles:{}};
 for(const rol of ROLES){
  const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:process.env.SW==='allow'?'allow':'block',reducedMotion:'reduce'});
  const R={consola:{},csp:[],pageerrors:[],pantallas:{},cintillo:null};res.roles[rol]=R;
  const nota=(t,x)=>{if(ruido.test(x))return;const k=t+': '+x.slice(0,220);R.consola[k]=(R.consola[k]||0)+1};
  const hook=p=>{p.on('console',m=>{if(['error','warning'].includes(m.type())||/Content Security Policy|error ignorado/i.test(m.text()))nota(m.type(),m.text())});p.on('pageerror',e=>R.pageerrors.push(e.message.slice(0,200)))};
  ctx.on('page',hook);
  await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,90)))});
  const page=await ctx.newPage();
  await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
  await page.fill('#au_e',rol);await page.fill('#au_p',PASS);await page.click('text=Entrar');
  await page.waitForSelector('.ni',{timeout:30000});await page.waitForTimeout(3500);
  R.cintillo=await page.evaluate(()=>{const b=document.getElementById('cint');return b?{oculto:b.hidden,tag:(document.getElementById('cintTag')||{}).textContent,n:document.querySelectorAll('#cintTr .ci').length,imgs:document.querySelectorAll('#cintTr .ci img').length,imgsOk:[...document.querySelectorAll('#cintTr .ci img')].filter(i=>i.naturalWidth>0).length,primero:((document.querySelector('#cintTr .ci strong')||{}).textContent)||''}:null});
  const slug=s=>s.replace(/[^a-z0-9]+/gi,'_');
  await page.screenshot({path:`${OUT}/${slug(rol.split('@')[0])}-login-inicio.png`});
  const keys=[...new Set(await page.$$eval('#nav .ni',els=>els.map(e=>e.dataset.k)))];
  for(const k of keys){
   try{await page.click('#nav .ni[data-k="'+k+'"]',{timeout:5000});await page.waitForTimeout(2000);
    if(k==='config'){try{await page.click('text=Expandir todo',{timeout:2000});await page.waitForTimeout(1000)}catch(e){}}
    const txt=await page.evaluate(()=>{const m=document.querySelector('main')||document.getElementById('app')||document.body;return (m.innerText||'').replace(/\d{1,2}[:\/.]\d{2}([:\/.]\d{2,4})?/g,'#').replace(/\s+/g,' ').trim()});
    R.pantallas[k]={chars:txt.length,hash:crypto.createHash('md5').update(txt).digest('hex').slice(0,10)};
    await page.screenshot({path:`${OUT}/${slug(rol.split('@')[0])}-${slug(k)}.png`});
   }catch(e){R.pantallas[k]={error:e.message.slice(0,100)}}
  }
  R.csp=await page.evaluate(()=>window.__csp).catch(()=>[]);
  // tienda pública
  const pt=await ctx.newPage();await pt.goto(BASE+'?tienda',{waitUntil:'load'});await pt.waitForTimeout(4500);
  await pt.screenshot({path:`${OUT}/${slug(rol.split('@')[0])}-tienda.png`});
  R.cspTienda=await pt.evaluate(()=>window.__csp).catch(()=>[]);
  await ctx.close();
 }
 fs.writeFileSync(OUT+'/resultado.json',JSON.stringify(res,null,1));
 for(const [r,x] of Object.entries(res.roles))console.log(r,'pantallas:',Object.keys(x.pantallas).length,'consola distintos:',Object.keys(x.consola).length,'pageerrors:',x.pageerrors.length,'csp:',x.csp.length+x.cspTienda.length,'cintillo:',JSON.stringify(x.cintillo));
 await br.close();
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
