/* Fase 18 — WCAG 2.2 criterio 2.5.8 (tamaño mínimo del objetivo, 24x24 px CSS). Recorre todas las pantallas del panel (admin y vendedor) y la tienda
   y lista los controles visibles (a, button, input, select, textarea, summary, [role=button], [tabindex], [data-h-click] clicables) que miden menos de 24 px
   en algún lado. Excluye enlaces dentro de texto corrido y checkboxes/radios nativos pequeños SOLO si su etiqueta (label) los rodea y mide >=24.
   Uso: BASE=… VP=390x844 TAG=/tmp/zonas node tamano-zonas.js   (NUNCA contra producción)   Resultado: TAG.json y un resumen por selector. */
const {chromium}=require(process.env.PW||'playwright-core');const fs=require('fs');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,TAG=process.env.TAG||'/tmp/zonas';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const [W,H]=(process.env.VP||'390x844').split('x').map(Number);
const ROLES=(process.env.ROLES||'admin.prueba@example.com,vendedor.prueba@example.com').split(',');
const medir=()=>{
 const SEL='a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[tabindex]:not([tabindex="-1"]),[data-h-click]';
 const vis=e=>{const r=e.getBoundingClientRect();if(r.width===0||r.height===0)return false;const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)return false;if(e.closest('[hidden],[inert],[aria-hidden=true]'))return false;return true};
 const out=[];
 document.querySelectorAll(SEL).forEach(e=>{
  if(!vis(e))return;
  let r=e.getBoundingClientRect();
  // un checkbox/radio dentro de un label: el objetivo es el label
  const lb=(e.type==='checkbox'||e.type==='radio')&&e.closest('label');if(lb&&vis(lb))r=lb.getBoundingClientRect();
  // enlace en línea dentro de un párrafo de texto
  if(e.tagName==='A'&&getComputedStyle(e).display==='inline'){const p=e.parentElement;if(p&&/^(P|LI|SMALL|SPAN|DIV|TD)$/.test(p.tagName)&&(p.textContent||'').trim().length>(e.textContent||'').trim().length+8)return}
  if(r.width<23.5||r.height<23.5){
   const c=(e.className&&e.className.toString().trim().split(/\s+/).slice(0,2).join('.'))||'';
   out.push({k:e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(c?'.'+c:'')+(e.type?'['+e.type+']':''),w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10,t:((e.getAttribute('aria-label')||e.textContent||e.title||'')+'').trim().slice(0,24)});
  }
 });
 return out;
};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});const res={};
 const reg=(n,l)=>{res[n]=l};
 for(const user of ROLES){
  const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600});const page=await ctx.newPage();
  await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
  reg(user.split('.')[0]+':login',await page.evaluate(medir));
  await page.fill('#au_e',user);await page.fill('#au_p',PASS);await page.click('text=Entrar');
  await page.waitForSelector('.ni',{state:'attached',timeout:30000});await page.waitForTimeout(3000);
  const keys=[...new Set(await page.$$eval('#nav .ni',els=>els.map(e=>e.dataset.k)))];
  for(const k of keys){try{await page.evaluate(x=>ir(x),k);await page.waitForTimeout(1600);
   if(k==='config'){try{await page.click('text=Expandir todo',{timeout:2000});await page.waitForTimeout(900)}catch(e){}}
   reg(user.split('.')[0]+':'+k,await page.evaluate(medir))}catch(e){}}
  await ctx.close();
 }
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600});const p=await ctx.newPage();
 await p.goto(BASE+'?tienda',{waitUntil:'load'});await p.waitForTimeout(4500);reg('tienda',await p.evaluate(medir));
 await p.evaluate(()=>window.scrollTo(0,0));await ctx.close();await br.close();
 fs.writeFileSync(TAG+'.json',JSON.stringify(res,null,1));
 const agg={};let total=0;for(const [pant,l] of Object.entries(res))l.forEach(o=>{total++;const a=(agg[o.k]=agg[o.k]||{n:0,pants:new Set(),w:o.w,h:o.h,t:o.t});a.n++;a.pants.add(pant.split(':')[1]||pant)});
 console.log('TOTAL controles <24 px:',total,'| selectores distintos:',Object.keys(agg).length);
 Object.entries(agg).sort((a,b)=>b[1].n-a[1].n).forEach(([k,a])=>console.log(String(a.n).padStart(4),k.padEnd(48),a.w+'x'+a.h,'|',[...a.pants].slice(0,5).join(','),'|',a.t));
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
