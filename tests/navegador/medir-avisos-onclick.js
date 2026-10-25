// Mide avisos de manejadores en línea (CSP script-src-attr) y recopila qué elementos tienen atributos on*.
const {chromium}=require('playwright-core');
const BASE=process.env.BASE, USER=process.env.PUSER||'admin.prueba@example.com', PASS=process.env.PRUEBA_PASSWORD;
const TAG=process.env.TAG||'run';
const cspv={}, onattrs={}, errs=[];let inl=0;
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
 await ctx.addInitScript(()=>{
  window.__on={};
  const chk=el=>{if(el.nodeType!==1)return;const all=[el].concat([].slice.call(el.querySelectorAll('*')));all.forEach(e=>{for(const a of e.attributes){if(/^on/.test(a.name)){const k=e.tagName+'|'+a.name+'|'+a.value.slice(0,70)+'|id='+(e.id||'');window.__on[k]=(window.__on[k]||0)+1}}})};
  const start=()=>{new MutationObserver(ms=>{ms.forEach(m=>{if(m.type==='attributes'){if(/^on/.test(m.attributeName))chk(m.target)}else m.addedNodes.forEach(chk)})}).observe(document.documentElement,{childList:true,subtree:true,attributes:true})};
  if(document.documentElement)start();else document.addEventListener('DOMContentLoaded',start);
 });
 const hook=p=>{p.on('console',m=>{const t=m.text();if(/inline event handler/.test(t))inl++;else if(m.type()==='error')errs.push(t.slice(0,200))});p.on('pageerror',e=>errs.push('pageerror '+e.message.slice(0,200)))};
 ctx.on('page',hook);
 const page=await ctx.newPage();
 const grab=async p=>{try{const o=await p.evaluate(()=>window.__on||{});for(const k in o)onattrs[k]=(onattrs[k]||0)+o[k]}catch(e){}};
 await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
 await page.fill('#au_e',USER);await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('.ni',{timeout:25000});await page.waitForTimeout(3000);
 const keys=await page.$$eval('#nav .ni',els=>els.map(e=>e.dataset.k));
 for(const k of [...new Set(keys)]){try{await page.click('#nav .ni[data-k="'+k+'"]',{timeout:4000});await page.waitForTimeout(1800);
   if(k==='config'){ // expandir todo
     try{await page.click('text=Expandir todo',{timeout:2000});await page.waitForTimeout(1200)}catch(e){}
     for(const t of ['cfgTabGen','cfgTabWeb']){try{await page.click('#'+t,{timeout:2000});await page.waitForTimeout(800);try{await page.click('text=Expandir todo',{timeout:1500});await page.waitForTimeout(1500)}catch(e){}}catch(e){}}
   }
 }catch(e){errs.push('navfail '+k)}}
 await grab(page);
 const pt=await ctx.newPage();await pt.goto(BASE+'?tienda',{waitUntil:'load'});await pt.waitForTimeout(4000);
 await pt.evaluate(()=>window.scrollTo(0,99999));await pt.waitForTimeout(1000);await grab(pt);
 console.log(JSON.stringify({TAG,inlineWarnings:inl,distinctOnAttrs:Object.keys(onattrs).length,errs:[...new Set(errs)].slice(0,15)}));
 require('fs').writeFileSync(TAG+'-onattrs.json',JSON.stringify(onattrs,null,1));
 await br.close();
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
