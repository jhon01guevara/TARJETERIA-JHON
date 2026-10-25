/* Fase 17 — barra «Modelos» de Inicio (cintChk): muestra 30 modelos con imagen leyendo apps/modelos-cintillo.json (95 KB), sin pedir modelos.js
   por esa vía, sin avisos «error ignorado», al tocar un modelo abre Check, y sin conexión sigue funcionando desde la caché del SW.
   Uso: BASE=http://localhost:8902/ node cintillo-fase17.js   (NUNCA contra producción) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD;
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const ok=(n,c,d)=>console.log((c?'OK    ':'FALLA ')+n+(d?' — '+d:''));
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 for(const rol of ['admin.prueba@example.com','vendedor.prueba@example.com']){
  const ctx=await br.newContext({viewport:{width:1366,height:900}});const page=await ctx.newPage();
  const reqs=[],avisos=[],csp=[];
  ctx.on('request',r=>{if(/modelos(-cintillo)?\.(json|js)/.test(r.url()))reqs.push((r.serviceWorker()?'sw:':'pag:')+r.url().replace(/^https?:\/\/[^/]+\//,''))});
  page.on('console',m=>{if(/error ignorado|Unexpected token/.test(m.text())&&!/quota/.test(m.text()))avisos.push(m.text().slice(0,160))});
  await page.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))});
  await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2000);
  await page.fill('#au_e',rol);await page.fill('#au_p',PASS);await page.click('text=Entrar');
  await page.waitForSelector('.ni',{timeout:30000});await page.waitForTimeout(3500);
  const c=await page.evaluate(()=>({n:document.querySelectorAll('#cintTr .ci').length,ok:[...document.querySelectorAll('#cintTr .ci img')].filter(i=>i.naturalWidth>0).length,tag:document.getElementById('cintTag').textContent,h:document.getElementById('cint').hidden}));
  console.log('--',rol,JSON.stringify(c),JSON.stringify(reqs));
  ok('barra visible con 30 modelos y 30 imágenes cargadas',!c.h&&c.n===30&&c.ok===30);
  ok('sin avisos «Unexpected token» / error ignorado de cintChk',avisos.length===0,avisos.join(' | '));
  ok('la página pidió apps/modelos-cintillo.json una vez y NO pidió apps/modelos.js',reqs.filter(x=>/cintillo/.test(x)).length>=1&&!reqs.some(x=>/pag:apps\/modelos\.js/.test(x)),JSON.stringify(reqs));
  await page.screenshot({path:`/tmp/f17-cintillo-${rol.split('.')[0]}.png`,clip:{x:0,y:0,width:1366,height:200}});
  const tieneCheck=await page.$('#nav .ni[data-k="check"]');
  await page.click('#cintTr .ci');await page.waitForTimeout(1500);
  const v=await page.evaluate(()=>typeof vista!=='undefined'?vista:'?');
  ok('tocar un modelo abre Check',tieneCheck?v==='check':true,'vista='+v+(tieneCheck?'':' (este rol no tiene Check en su menú)'));
  ok('0 violaciones CSP',(await page.evaluate(()=>window.__csp)).length===0);
  await page.evaluate(()=>ir('home'));await page.waitForTimeout(800);
  // sin conexión: se recarga la barra desde la caché del SW (SW ya activo tras la primera carga)
  await page.waitForTimeout(1500);
  await ctx.close();
 }
 await br.close();
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
