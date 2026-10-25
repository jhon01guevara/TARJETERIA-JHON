// Auditoría axe (contraste y reglas de modales/iframes) en panel (admin y vendedor, 4 temas) y tienda (claro/oscuro).
const {chromium}=require('playwright-core');const fs=require('fs');
const axeSrc=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,TAG=process.env.TAG||'axe';
const ROLES=(process.env.ROLES||'admin.prueba@example.com').split(',');
const RULES=(process.env.RULES||'color-contrast').split(',');
const res={};
const add=(ctxn,r)=>{r.violations.forEach(v=>v.nodes.forEach(n=>{const d=(n.any[0]&&n.any[0].data)||{};const k=v.id+'|'+n.target.join(' ');(res[ctxn]=res[ctxn]||{});res[ctxn][k]={rule:v.id,fg:d.fgColor,bg:d.bgColor,ratio:d.contrastRatio,exp:d.expectedContrastRatio,size:d.fontSize,html:n.html.slice(0,110)}}))};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const run=async(page,name)=>{await page.evaluate(axeSrc);const r=await page.evaluate(async rules=>await axe.run(document,{runOnly:{type:'rule',values:rules}}),RULES);add(name,r)};
 for(const user of ROLES){
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const page=await ctx.newPage();
  await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
  await run(page,user.split('.')[0]+':login');
  await page.fill('#au_e',user);await page.fill('#au_p',PASS);await page.click('text=Entrar');
  await page.waitForSelector('.ni',{timeout:25000});await page.waitForTimeout(3000);
  const keys=[...new Set(await page.$$eval('#nav .ni',els=>els.map(e=>e.dataset.k)))];
  for(const th of (process.env.THEMES||'claro,nocturno').split(',')){
   await page.evaluate(t=>aplicarTema(t,false),th);
   for(const k of keys){try{await page.click('#nav .ni[data-k="'+k+'"]',{timeout:4000});await page.waitForTimeout(1500);
     if(k==='config'){try{await page.click('text=Expandir todo',{timeout:2000});await page.waitForTimeout(1000)}catch(e){}}
     await run(page,user.split('.')[0]+':'+th+':'+k)}catch(e){console.log('navfail',k,e.message.split('\n')[0])}}
  }
  await ctx.close();
 }
 if(!process.env.NOSHOP){for(const th of ['light','dark']){
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});await ctx.addInitScript(t=>localStorage.setItem('tj_shop_theme',t),th);
  const p=await ctx.newPage();await p.goto(BASE+'?tienda',{waitUntil:'load'});await p.waitForTimeout(4500);await run(p,'tienda:'+th);
  // carrito abierto
  await ctx.close();}}
 fs.writeFileSync(TAG+'.json',JSON.stringify(res,null,1));
 // resumen por contexto y global (único por selector+colores)
 const uniq={};let total=0;for(const c in res){const n=Object.keys(res[c]).length;total+=n;console.log(c.padEnd(32),n)}
 for(const c in res)for(const k in res[c]){const v=res[c][k];const g=c.split(':')[0]+(c.includes('dark')||c.includes('nocturno')?':oscuro':':claro')+'|'+k.split('|')[1]+'|'+v.fg+'|'+v.bg;uniq[g]=v}
 console.log('TOTAL nodos',total,'| combinaciones únicas',Object.keys(uniq).length);
 await br.close();
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
