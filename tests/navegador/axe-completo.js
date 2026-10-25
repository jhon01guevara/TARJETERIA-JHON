/* Fase 18 — axe-core con TODAS las reglas WCAG 2.x A/AA + mejores prácticas + target-size (WCAG 2.2) en panel (admin y vendedor) y tienda,
   en escritorio (1366x900) o móvil (VP=390x844). Resumen por regla/impacto y selectores de ejemplo.
   Uso: BASE=… VP=390x844 TAG=/tmp/axe-m ROLES=admin.prueba@example.com,vendedor.prueba@example.com node axe-completo.js   (NUNCA contra producción)
   Requiere playwright-core (PW=/ruta) y axe-core (AXE=/ruta/axe.min.js si no se resuelve). */
const {chromium}=require(process.env.PW||'playwright-core');const fs=require('fs');
const axeSrc=fs.readFileSync(process.env.AXE||require.resolve('axe-core/axe.min.js'),'utf8');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,TAG=process.env.TAG||'/tmp/axe';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number);
const ROLES=(process.env.ROLES||'admin.prueba@example.com,vendedor.prueba@example.com').split(',');
const TAGS=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'];
const res={};
const add=(ctx,r)=>r.violations.forEach(v=>{const x=(res[v.id]=res[v.id]||{impact:v.impact,nodos:0,ctx:{},ej:{}});v.nodes.forEach(n=>{x.nodos++;x.ctx[ctx]=(x.ctx[ctx]||0)+1;const s=n.target.join(' ').slice(0,90);x.ej[s]=(x.ej[s]||0)+1})});
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const run=async(page,name)=>{try{await page.evaluate(axeSrc);const r=await page.evaluate(async tags=>await axe.run(document,{runOnly:{type:'tag',values:tags},rules:{'target-size':{enabled:true}}}),TAGS);add(name,r)}catch(e){console.log('axe falló en',name,e.message.slice(0,80))}};
 for(const user of ROLES){
  const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',isMobile:W<600,hasTouch:W<600});const page=await ctx.newPage();
  await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);await run(page,user.split('.')[0]+':login');
  await page.fill('#au_e',user);await page.fill('#au_p',PASS);await page.click('text=Entrar');
  await page.waitForSelector('.ni',{state:'attached',timeout:25000});await page.waitForTimeout(3000);
  const sel=W<600?'#nav2 .ni, #nav .ni':'#nav .ni';
  const keys=[...new Set(await page.$$eval('#nav .ni',els=>els.map(e=>e.dataset.k)))];
  for(const k of keys){try{await page.evaluate(x=>ir(x),k);await page.waitForTimeout(1600);
    if(k==='config'){try{await page.click('text=Expandir todo',{timeout:2000});await page.waitForTimeout(900)}catch(e){}}
    await run(page,user.split('.')[0]+':'+k)}catch(e){console.log('navfail',k)}}
  await ctx.close();
 }
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',isMobile:W<600,hasTouch:W<600});const p=await ctx.newPage();
 await p.goto(BASE+'?tienda',{waitUntil:'load'});await p.waitForTimeout(4500);await run(p,'tienda');await ctx.close();
 fs.writeFileSync(TAG+'.json',JSON.stringify(res,null,1));
 for(const [id,x] of Object.entries(res).sort((a,b)=>({critical:0,serious:1,moderate:2,minor:3}[a[1].impact]-({critical:0,serious:1,moderate:2,minor:3}[b[1].impact]))))
  console.log(String(x.impact).padEnd(9),id.padEnd(34),String(x.nodos).padStart(5),'nodos en',Object.keys(x.ctx).length,'pantallas | ej:',Object.entries(x.ej).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]).join(' ; ').slice(0,200));
 await br.close();
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
