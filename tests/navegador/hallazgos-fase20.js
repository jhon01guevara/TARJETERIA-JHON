/* Fase 20 — hallazgos menores. Comprueba en Chrome real:
   1) Tienda pública: la copia local de artículos (tj_cached_items) ya no revienta la cuota de localStorage ni avisa en consola,
      se guarda dentro de un presupuesto, sirve para pintar sin red (antes nunca se guardaba), respeta la memoria de otras claves y se
      limpia sola cuando el navegador está lleno; las copias de otras empresas se borran si hace falta espacio.
   2) Puntos del carrusel de la tienda: 24×24 px (activo 38×24, el punto visible sigue midiendo 8 px / 22×8 px) y sin solaparse.
   3) Botón de WhatsApp (#k_wa) dentro de un landmark (axe «region» sin nodos de #k_wa).
   4) Barra «Modelos» del vendedor: sus toques NO hacen nada porque su rol no tiene permiso para «Check»/«Catálogo»; con el permiso, sí navegan.
   Uso: BASE=http://localhost:8921/ [VP=390x844] [OUT=/tmp/f20] [AXE=/ruta/axe.min.js] node hallazgos-fase20.js     Requiere PRUEBA_PASSWORD (paso 4). NUNCA contra producción. */
const {chromium}=require(process.env.PW||'playwright-core');const fs=require('fs');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,OUT=process.env.OUT||'/tmp/f20';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number);
const AXE=process.env.AXE||'/workspace/a11y/node_modules/axe-core/axe.min.js';
fs.mkdirSync(OUT,{recursive:true});
const R={base:BASE,vp:W+'x'+H,checks:{}};let fallos=0;
const ok=(n,c,d)=>{R.checks[n]={ok:!!c,d};if(!c)fallos++;console.log((c?'OK   ':'FALLA'),n,d===undefined?'':JSON.stringify(d))};
const ls=()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=(localStorage.getItem(k)||'').length}return o};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const mk=(bypass)=>br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600,bypassCSP:!!bypass}); // bypassCSP solo para inyectar axe-core en el paso 3
 /* ---------- 1) copia local de la tienda ---------- */
 let ctx=await mk(),p=await ctx.newPage();const avisos=[];
 p.on('console',m=>{if(/error ignorado|quota|Quota|exceeded/i.test(m.text()))avisos.push(m.text().slice(0,200))});
 await p.goto(BASE+'?tienda=1',{waitUntil:'load'});await p.waitForTimeout(6500);
 const n1=await p.evaluate(()=>SH.items.length);
 const l1=await p.evaluate(ls);const tot1=Object.values(l1).reduce((a,b)=>a+b,0);
 ok('1a sin avisos de cuota/«error ignorado» en la carga',avisos.length===0,avisos);
 ok('1b tj_cached_items guardado, ≤2 M caracteres y total ≤3,8 M',l1.tj_cached_items>0&&l1.tj_cached_items<=2000000&&tot1<=3800000,{items:l1.tj_cached_items,total:tot1,articulosNube:n1});
 const guardados=await p.evaluate(()=>{const a=JSON.parse(localStorage.getItem('tj_cached_items'));return {n:a.length,conFoto:a.filter(x=>x.img).length,ids:a.map(x=>x.id).slice(0,3),nubeIds:SH.items.map(x=>x.id).slice(0,3)}});
 ok('1c los guardados son los más nuevos y completos (con foto)',guardados.n>0&&guardados.conFoto===guardados.n&&JSON.stringify(guardados.ids)===JSON.stringify(guardados.nubeIds),guardados);
 // Firestore colgado (sin snapshot): debe pintar desde la copia local
 const p2=await ctx.newPage();await p2.route(/firestore\.googleapis\.com/,()=>{}); /* la petición queda colgada: no llega ningún snapshot y se ve lo que haya en la copia local */
 await p2.goto(BASE+'?tienda=1',{waitUntil:'load'});await p2.waitForTimeout(4500);
 const off=await p2.evaluate(()=>({items:SH.items.length,ok:SH.ok,tarjetas:document.querySelectorAll('#sh_g .kc, #sh_g [data-h-click]').length,err:SH.err||0}));
 ok('1d con Firestore sin responder pinta desde la copia local (antes: nunca había copia)',off.items>0&&off.ok===1&&off.tarjetas>0,off);
 await p2.screenshot({path:OUT+'/tienda-sin-red-'+W+'.png'});await p2.close();
 // Presión de memoria: otras claves ocupan casi todo → no revienta, no avisa, no deja la clave a medias
 const pr=await p.evaluate(()=>{
  const out={};const K='tj_cached_items';const orig=localStorage.getItem(K);
  const falla=()=>{try{shopCacheItems(SH.items);return 'sin excepción'}catch(e){return 'EXCEPCIÓN '+e.message}};
  localStorage.setItem('zz_relleno','x'.repeat(2900000));out.holgura=falla();out.holguraLen=(localStorage.getItem(K)||'').length;
  out.holguraTotal=(()=>{let t=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);t+=k.length+localStorage.getItem(k).length}return t})();
  localStorage.removeItem(K);localStorage.setItem('zz_relleno','x'.repeat(4700000));out.llena=falla();out.llenaLen=(localStorage.getItem(K)||'').length;
  localStorage.removeItem('zz_relleno');
  // reintento tras fallo real: el 1.er setItem de tj_cached_items falla; se borran las copias de otras empresas y se reintenta con la mitad
  localStorage.setItem('tj_cached_items_otra',JSON.stringify([{id:'x',img:'y'.repeat(50000)}]));localStorage.setItem('tj_cached_items_otra2','z');
  const sI=Storage.prototype.setItem;let veces=0;Storage.prototype.setItem=function(k,v){if(k===K&&veces++===0)throw new DOMException('cuota simulada','QuotaExceededError');return sI.call(this,k,v)};
  out.reintento=falla();Storage.prototype.setItem=sI;out.setItemLlamadas=veces;out.otrasBorradas=!localStorage.getItem('tj_cached_items_otra')&&!localStorage.getItem('tj_cached_items_otra2');out.reintentoLen=(localStorage.getItem(K)||'').length;
  // siempre falla: queda sin copia y sin excepción
  Storage.prototype.setItem=function(k,v){if(k===K)throw new DOMException('cuota simulada','QuotaExceededError');return sI.call(this,k,v)};
  out.siempreFalla=falla();Storage.prototype.setItem=sI;out.siempreFallaLen=(localStorage.getItem(K)||'').length;
  falla();return out});
 ok('1e memoria con holgura: guarda menos y el total no pasa de 3,8 M',pr.holgura==='sin excepción'&&pr.holguraLen>0&&pr.holguraLen<=3800000-2900000+10&&pr.holguraTotal<=3800000,pr);
 ok('1f memoria casi llena: sin excepción y sin copia a medias',pr.llena==='sin excepción'&&pr.llenaLen===0,{llena:pr.llena,len:pr.llenaLen});
 ok('1g fallo real de setItem: borra copias de otras empresas, reintenta con la mitad y guarda',pr.reintento==='sin excepción'&&pr.otrasBorradas&&pr.reintentoLen>0&&pr.setItemLlamadas>=2,{r:pr.reintento,borradas:pr.otrasBorradas,len:pr.reintentoLen,llamadas:pr.setItemLlamadas});
 ok('1h si siempre falla: sin excepción y sin clave a medias',pr.siempreFalla==='sin excepción'&&pr.siempreFallaLen===0,{r:pr.siempreFalla,len:pr.siempreFallaLen});
 await ctx.close();
 /* ---------- 2) puntos del carrusel + 3) WhatsApp ---------- */
 ctx=await mk(true);p=await ctx.newPage();await p.goto(BASE+'?tienda=1',{waitUntil:'load'});await p.waitForTimeout(6000);
 const dots=await p.evaluate(()=>[...document.querySelectorAll('.khero-dots')].map(c=>{const b=[...c.children].map(x=>{const r=x.getBoundingClientRect();return {w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10,x:r.left,on:x.classList.contains('on')}});
  const sol=b.some((x,i)=>i&&b[i-1].x+b[i-1].w>x.x+0.5);const cs=c.children[0]?getComputedStyle(c.children[0]):null;const cr=c.getBoundingClientRect();
  return {n:b.length,min:Math.min(...b.map(x=>Math.min(x.w,x.h))),on:b.filter(x=>x.on).map(x=>x.w+'x'+x.h),solapan:sol,clip:cs&&cs.backgroundClip,cont:{l:Math.round(cr.left),r:Math.round(cr.right),b:Math.round(innerHeight-cr.bottom)},vw:innerWidth}}));
 ok('2 puntos del carrusel ≥24×24 px, sin solaparse y dentro de la pantalla',dots.length>0&&dots.every(d=>d.min>=24&&!d.solapan&&d.cont.l>=0&&d.cont.r<=d.vw),dots);
 const hero=await p.$('.khero, .kbanner, #k_banner');if(hero)await hero.screenshot({path:OUT+'/hero-'+W+'.png'});
 await p.addScriptTag({path:AXE});
 const wa=await p.evaluate(async()=>{const a=document.getElementById('k_wa');const g=a&&a.parentNode;const vis=a&&!a.hidden;const r=await axe.run(document,{runOnly:['region']});
  const nodos=r.violations.flatMap(v=>v.nodes.map(n=>n.target.join(' ')));return {existe:!!a,visible:vis,envoltura:g&&g.className,rol:g&&g.getAttribute('role'),nombre:g&&g.getAttribute('aria-label'),ocultaEnvoltura:g&&g.hidden,pos:a&&getComputedStyle(a).position,rect:a&&a.getBoundingClientRect().toJSON(),regionViolaciones:nodos.length,conWa:nodos.filter(t=>/k_wa|kwa/.test(t)),nodos:nodos.slice(0,6)}});
 ok('3 #k_wa dentro de un landmark y axe «region» sin #k_wa',wa.existe&&wa.rol==='complementary'&&!!wa.nombre&&wa.conWa.length===0&&wa.pos==='fixed',wa);
 await p.screenshot({path:OUT+'/tienda-'+W+'.png'});await ctx.close();
 /* ---------- 4) barra «Modelos» del vendedor ---------- */
 if(PASS){
  for(const rol of ['vendedor.prueba@example.com','admin.prueba@example.com']){
   ctx=await mk();p=await ctx.newPage();await p.goto(BASE,{waitUntil:'load'});await p.waitForTimeout(2500);
   await p.fill('#au_e',rol);await p.fill('#au_p',PASS);await p.click('text=Entrar');await p.waitForSelector('.ni',{state:'attached',timeout:30000});await p.waitForTimeout(4500);
   const e=await p.evaluate(()=>({tag:(document.getElementById('cintTag')||{}).textContent,n:document.querySelectorAll('#cintTr .ci').length,clicables:document.querySelectorAll('#cintTr .ci[data-h-click]').length,vista:vista,puedeCheck:puede('check'),puedeCat:puede('cat'),panels:esAdmin()?'(admin)':(usr().panels||[])}));
   if(e.n&&e.clicables){
    await p.click('#cintTr .ci[data-h-click]');await p.waitForTimeout(1500);const a=await p.evaluate(()=>vista);
    let con=null;
    if(!e.puedeCheck&&!e.puedeCat){await p.evaluate(()=>{usr().panels.push('check','cat')});await p.click('#cintTr .ci[data-h-click]');await p.waitForTimeout(1500);con=await p.evaluate(()=>vista)}
    ok('4 '+rol.split('.')[0]+': toque en la barra Modelos',e.puedeCheck||e.puedeCat?(a==='check'||a==='cat'):(a==='home'&&(con==='check'||con==='cat')),{...e,despuesDelToque:a,conPermisoSimulado:con});
   }else ok('4 '+rol.split('.')[0]+': barra Modelos sin elementos clicables (agenda/otra cinta)',true,e);
   await ctx.close();
  }
 }
 await br.close();fs.writeFileSync(OUT+'/hallazgos-'+W+'.json',JSON.stringify(R,null,1));
 console.log(fallos?('FALLAS: '+fallos):'TODO OK');process.exit(fallos?1:0);
})().catch(e=>{console.error('ERROR',e);process.exit(2)});
