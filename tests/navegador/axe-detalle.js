/* Fase 18 — como axe-completo.js pero imprime, para las reglas pedidas (RULES=a,b), la pantalla y el HTML de cada nodo.
   Uso: BASE=… VP=390x844 RULES=label,select-name node axe-detalle.js */
const {chromium}=require(process.env.PW||'playwright-core');const fs=require('fs');
const axeSrc=fs.readFileSync(process.env.AXE||require.resolve('axe-core/axe.min.js'),'utf8');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD;
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number);const RULES=(process.env.RULES||'label').split(',');
const ROLES=(process.env.ROLES||'admin.prueba@example.com').split(',');const MAX=+process.env.MAX||3;
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const run=async(page,name)=>{await page.evaluate(axeSrc);const r=await page.evaluate(async rules=>await axe.run(document,{runOnly:{type:'rule',values:rules},rules:{'target-size':{enabled:true}}}),RULES);
  r.violations.forEach(v=>v.nodes.slice(0,MAX).forEach(n=>console.log(`[${name}] ${v.id} (${v.nodes.length} nodos) ${n.target.join(' ').slice(0,80)}\n    ${n.html.slice(0,260)}\n    ${(n.any[0]||n.all[0]||n.none[0]||{}).message||''}`)))};
 for(const user of ROLES){
  const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',isMobile:W<600,hasTouch:W<600});const page=await ctx.newPage();
  await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
  await page.fill('#au_e',user);await page.fill('#au_p',PASS);await page.click('text=Entrar');
  await page.waitForSelector('.ni',{state:'attached',timeout:25000});await page.waitForTimeout(3000);
  const keys=[...new Set(await page.$$eval('#nav .ni',els=>els.map(e=>e.dataset.k)))];
  for(const k of keys){try{await page.evaluate(x=>ir(x),k);await page.waitForTimeout(1500);
    if(k==='config'){try{await page.click('text=Expandir todo',{timeout:2000});await page.waitForTimeout(900)}catch(e){}}
    await run(page,user.split('.')[0]+':'+k)}catch(e){}}
  await ctx.close();
 }
 if(!process.env.NOSHOP){const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block'});const p=await ctx.newPage();await p.goto(BASE+'?tienda',{waitUntil:'load'});await p.waitForTimeout(4500);await run(p,'tienda');await ctx.close()}
 await br.close();
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
