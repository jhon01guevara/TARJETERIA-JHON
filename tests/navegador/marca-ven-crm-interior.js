/* Marca VEN CRM — INTERIOR del panel en Chrome real, contra la COPIA DE PRUEBA (proyecto `tarjeteria-jhon-prueba`; nunca producción). Inicia sesión como admin.prueba@example.com.
   SOLO NAVEGA: no pulsa nada que guarde (lo único que se escribe es lo que la app declara sola al abrir pantallas, y solo en PRUEBA).
   Comprueba (escritorio 1366x900 y móvil 390x844 con VP=…):
    · html.ven-crm, logo VEN CRM cargado en la barra lateral (escritorio), símbolo en la cabecera, pie «VEN CRM»; «Panel de Facturación» ya no aparece como marca (barra lateral, cabecera, título, h1 oculto).
    · Cada empresa conserva lo suyo: el logo `.brand .logo img` (src, alto y ancho idénticos a «antes»), el nombre `.brand small` y el lema `.brand p`; sigue siendo el primer `.logo img` del documento (de ahí leen facturas, informes y PDF).
    · Iconos del menú monocromos y sin rosado en la barra lateral, cabecera y menú inferior (barrido de estilos calculados); la paleta de gráficos no tiene rosado.
    · Contraste ≥ 4,5:1 (texto normal) / 3:1 (iconos) en los textos de marca, tema claro y nocturno.
    · Sin desbordes horizontales, sin violaciones CSP, sin errores de JS en un recorrido por TODAS las pantallas del menú.
    · La TIENDA (?tienda=1) no tiene la clase ni los elementos VEN y su cabecera <head> sigue siendo la de Tarjetería Jhon.
   Con ANTES=http://127.0.0.1:8972/ (copia de main) compara las medidas del logo y los textos de la empresa, y que la tienda mide lo mismo antes y después.
   Uso: BASE=http://127.0.0.1:8971/ [ANTES=http://127.0.0.1:8972/] [VP=1366x900] [SHOTS=/tmp/capturas] PRUEBA_PASSWORD=… PW=/ruta/playwright-core node tests/navegador/marca-ven-crm-interior.js
   Código de salida: 0 bien · 1 falla · 2 no se pudo preparar. */
const {chromium}=require(process.env.PW||'playwright-core');
const norm=u=>(u||'').replace(/\/?$/,'/');
const BASE=norm(process.env.BASE),ANTES=process.env.ANTES?norm(process.env.ANTES):'',SHOTS=process.env.SHOTS||'',PASS=process.env.PRUEBA_PASSWORD;
const PROD=/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/;
if(!process.env.BASE||PROD.test(BASE)||(ANTES&&PROD.test(ANTES)))throw new Error('Esta prueba solo corre contra la copia de PRUEBA (BASE=…)');
if(!PASS){console.error('Falta PRUEBA_PASSWORD');process.exit(2)}
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number),MOVIL=W<600,ETQ=MOVIL?'movil':'escritorio';
const RUIDO=/Failed to load resource: the server responded with a status of (404|429|4\d\d)|Service Worker registration blocked|resource-exhausted|Quota exceeded|RPC 'Write' stream .* transport errored|Failed to load resource: net::ERR/;
let fallos=0;const chk=(n,ok,det)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(det!==undefined&&det!==''?'  ['+det+']':''))};

async function abrir(br,url){
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:MOVIL,hasTouch:MOVIL});
 const page=await ctx.newPage(),S={err:[],cons:[]};
 page.on('pageerror',e=>S.err.push(e.message.slice(0,200)));
 page.on('console',m=>{const t=m.text();if(['error','warning'].includes(m.type())||/Content Security Policy/i.test(t)){if(!RUIDO.test(t))S.cons.push(m.type()+': '+t.slice(0,200))}});
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,80)))});
 await page.goto(url,{waitUntil:'load'});
 return {ctx,page,S};
}
async function entrar(page){
 await page.waitForSelector('#au_e',{timeout:25000});await page.waitForTimeout(1200);
 await page.fill('#au_e','admin.prueba@example.com');await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await page.waitForTimeout(3500);
}
/* Medidas que viven en la página (se evalúan igual en «antes» y «después»). */
const medir=()=>{
 const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{w:Math.round(b.width*10)/10,h:Math.round(b.height*10)/10}};
 const img=document.querySelector('.brand .logo img'),prim=document.querySelector('.logo img');
 const t=s=>{const e=document.querySelector(s);return e?e.textContent.trim():null};
 return{logoSrc:img&&img.getAttribute('src'),logoRect:r(img),logoCajaRect:r(document.querySelector('.brand .logo')),primerLogoEsDeEmpresa:!!img&&prim===img,
  nombre:t('.brand small'),lema:t('.brand p'),menu:[...document.querySelectorAll('#nav .ni')].map(e=>e.dataset.k).join(','),
  navIconos:document.querySelectorAll('#nav .ni .ic svg').length};
};
/* Color helpers (en la página) */
const barrido=()=>{
 const rosado=c=>{const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(c);if(!m)return false;const r=+m[1],g=+m[2],b=+m[3],a=m[4]===undefined?1:+m[4];if(a<.25)return false;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<40)return false;
  let h;const d=mx-mn;if(mx===r)h=((g-b)/d+6)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;return h>=320||h<=350&&h>=320;};
 const zonas=['.sb','.top','#nav2'],malos=[],colores=new Set();
 for(const z of zonas)for(const e of document.querySelectorAll(z+', '+z+' *')){const cs=getComputedStyle(e);if(cs.display==='none')continue;
  for(const p of ['color','backgroundColor','borderTopColor','borderLeftColor','boxShadow','fill'])if(rosado(cs[p]))malos.push((e.className||e.tagName)+':'+p+'='+cs[p]);
  if(e.matches('.ic'))colores.add(cs.backgroundColor)}
 return{malos:malos.slice(0,8),iconos:[...colores]};
};
function lum(c){const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);return[+m[1],+m[2],+m[3]].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)}
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const colorDe=sel=>{const e=document.querySelector(sel);if(!e)return null;const f=a=>{for(let n=a;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c);if(m&&(m[4]===undefined||+m[4]>.9))return c}return'rgb(255,255,255)'};
 const cs=getComputedStyle(e);return{fg:cs.color,bg:f(e)}};

(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 console.log('\n== PANEL · interior ('+ETQ+' '+W+'x'+H+') ==');
 const {ctx,page,S}=await abrir(br,BASE);
 try{await entrar(page)}catch(e){console.log('  FALLA  no se pudo iniciar sesión: '+e.message.slice(0,120));await br.close();process.exit(2)}
 chk('html.ven-crm',await page.evaluate(()=>document.documentElement.classList.contains('ven-crm')));
 const m=await page.evaluate(medir);
 const marca=await page.evaluate(()=>{const g=s=>document.querySelector(s);const wm=g('.brand h1 img'),sy=g('.top .vsym'),rt=g('.top .rt'),h1=g('h1.h1m'),pie=g('.sf .vpie');
  const vis=e=>e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0;
  return{wm:wm&&{ok:wm.complete&&wm.naturalWidth>0,alt:wm.alt,vis:vis(wm),w:Math.round(wm.getBoundingClientRect().width),src:wm.getAttribute('src')},sy:sy&&{ok:sy.complete&&sy.naturalWidth>0,vis:vis(sy),w:Math.round(sy.getBoundingClientRect().width),h:Math.round(sy.getBoundingClientRect().height)},
   rt:rt&&rt.textContent,h1:h1&&h1.textContent,pie:pie&&pie.textContent,titulo:document.title,brandH1:g('.brand h1')&&g('.brand h1').textContent.trim(),
   panelFact:[...document.querySelectorAll('.sb *,.top *,h1')].filter(e=>e.children.length===0&&/Panel de Facturación/.test(e.textContent)).length,
   manifest:g('link[rel=manifest]').getAttribute('href'),csp:window.__csp.slice(),des:document.documentElement.scrollWidth<=innerWidth+1}});
 if(!MOVIL)chk('logo VEN CRM en la barra lateral (imagen cargada, alt «VEN CRM», ≥120 px)',marca.wm&&marca.wm.ok&&marca.wm.vis&&marca.wm.alt==='VEN CRM'&&marca.wm.w>=120,JSON.stringify(marca.wm));
 chk('símbolo V en la cabecera (imagen cargada, 28–30 px)',marca.sy&&marca.sy.ok&&marca.sy.vis&&marca.sy.w>=28&&marca.sy.w<=30&&marca.sy.h===marca.sy.w,JSON.stringify(marca.sy));
 chk('rótulo de la cabecera «Tarjetería Jhon · VEN CRM» (el nombre de la empresa no se renombra)',marca.rt==='Tarjetería Jhon · VEN CRM',marca.rt);
 chk('h1 oculto «VEN CRM · Tarjetería Jhon»',marca.h1==='VEN CRM · Tarjetería Jhon',marca.h1);
 if(!MOVIL)chk('pie de la barra lateral «VEN CRM»',marca.pie==='VEN CRM',marca.pie);
 chk('título de la pestaña «VEN CRM · Panel»',marca.titulo==='VEN CRM · Panel',marca.titulo);
 chk('«Panel de Facturación» ya no aparece como marca',marca.panelFact===0,marca.panelFact);
 chk('manifest del panel = manifest-ven-crm.json',marca.manifest==='manifest-ven-crm.json',marca.manifest);
 chk('la empresa conserva su logo (src assets/logo.png o el propio), su nombre y su lema',/logo|^data:/.test(m.logoSrc||'')&&m.nombre==='Tarjetería Jhon'&&m.lema==='Tarjetas para toda ocasión',JSON.stringify({s:(m.logoSrc||'').slice(0,40),n:m.nombre,l:m.lema}));
 chk('el logo de la empresa sigue siendo el PRIMER «.logo img» (facturas, informes y PDF leen de ahí)',m.primerLogoEsDeEmpresa);
 chk('menú con todas las pantallas de admin ('+m.menu.split(',').length+') y sus iconos ('+m.navIconos+'; «marketing» no tiene glyph en NAVI desde antes de esta rama)',m.menu.split(',').length>=18&&m.navIconos>=m.menu.split(',').length-1);
 chk('sin desbordamiento horizontal',marca.des);chk('sin violaciones CSP',marca.csp.length===0,marca.csp.join(' | '));
 const b=await page.evaluate(barrido);
 chk('iconos del menú monocromos (r=g=b) y sin rosado en barra lateral, cabecera y menú inferior',b.malos.length===0&&b.iconos.every(c=>{const x=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);return x&&x[1]===x[2]&&x[2]===x[3]}),b.malos.concat(b.iconos).join(' | ').slice(0,300));
 const pal=await page.evaluate(()=>window.TJMarca&&TJMarca.paleta);
 chk('paleta de gráficos sin rosado (negro, azul y grises)',Array.isArray(pal)&&pal.length>=6&&pal.every(c=>{const h=c.replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),bb=parseInt(h.slice(4,6),16);return !(r>g+40&&bb>g&&r>bb)}),(pal||[]).join(' '));
 /* contraste */
 const ctr=[];
 for(const [n,sel,min] of [['lema de la empresa','.brand p',4.5],['rótulo de la cabecera','.top .rt',4.5],['pie VEN CRM','.sf .vpie',4.5],['ítem del menú','#nav .ni:not(.on)',4.5],['ítem activo','#nav .ni.on',4.5],['título de pantalla','#tt',4.5]]){
  if(MOVIL&&/pie|lema|nombre|ítem/.test(n)&&sel!=='#nav2 .ni')continue;
  const c=await page.evaluate(colorDe,sel);if(!c)continue;const r=ratio(c.fg,c.bg);ctr.push(n+' '+r.toFixed(1));if(r<min)chk('contraste «'+n+'» ≥ '+min,false,r.toFixed(2)+' '+c.fg+' sobre '+c.bg)}
 chk('contraste accesible en el tema claro',true,ctr.join(' · '));
 /* iconos del menú: blanco sobre #1f1f1f y negro sobre blanco ≥ 3:1 (WCAG 1.4.11) */
 const ic=await page.evaluate(()=>{const o=[];for(const s of ['#nav .ni:not(.on) .ic','#nav .ni.on .ic']){const e=document.querySelector(s);if(!e)continue;o.push([s,getComputedStyle(e).backgroundColor,getComputedStyle(e.querySelector('svg')).fill])}return o});
 chk('iconos del menú con contraste ≥ 3:1 (claro)',ic.length>0&&ic.every(([,bg,fg])=>fg.startsWith('rgb')&&ratio(bg,fg)>=3),JSON.stringify(ic));
 function ratio(a,b){const L=c=>{const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);return[+m[1],+m[2],+m[3]].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((x,v,i)=>x+v*[.2126,.7152,.0722][i],0)};const x=L(a),y=L(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
 if(SHOTS)await page.screenshot({path:SHOTS+'/panel-inicio-'+ETQ+'.png'});
 /* tema nocturno: contraste y logo visibles */
 await page.evaluate(()=>{document.documentElement.setAttribute('data-t','nocturno')});await page.waitForTimeout(400);
 const nb=await page.evaluate(()=>{const g=s=>document.querySelector(s);return{wm:g('.brand h1 img')&&getComputedStyle(g('.brand h1 img')).filter,sy:getComputedStyle(g('.top .vsym')).filter}});
 chk('tema nocturno: logo y símbolo se invierten (visibles sobre negro)',(MOVIL||/invert/.test(nb.wm))&&/invert/.test(nb.sy),JSON.stringify(nb));
 const cn=[];for(const [n,sel] of [['rótulo','.top .rt'],['pie','.sf .vpie'],['ítem','#nav .ni:not(.on)'],['ítem activo','#nav .ni.on'],['título','#tt']]){if(MOVIL&&/pie|ítem/.test(n))continue;const c=await page.evaluate(colorDe,sel);if(!c)continue;const r=ratio(c.fg,c.bg);cn.push(n+' '+r.toFixed(1));if(r<4.5)chk('contraste nocturno «'+n+'»',false,r.toFixed(2)+' '+c.fg+' sobre '+c.bg)}
 chk('contraste accesible en el tema nocturno',true,cn.join(' · '));
 if(SHOTS)await page.screenshot({path:SHOTS+'/panel-inicio-nocturno-'+ETQ+'.png'});
 await page.evaluate(()=>{document.documentElement.setAttribute('data-t','claro')});
 /* recorrido por todas las pantallas */
 const claves=await page.evaluate(()=>[...new Set([...document.querySelectorAll('#nav .ni')].map(e=>e.dataset.k))]);
 let rec=0,desb=[];
 for(const k of claves){
  const ok=await page.evaluate(k=>{const e=[...document.querySelectorAll(MOVILQ()+' .ni[data-k="'+k+'"]')].find(x=>x.getBoundingClientRect().width>0)||document.querySelector('#nav .ni[data-k="'+k+'"]');if(!e)return false;e.click();return true;function MOVILQ(){return innerWidth<=820?'#nav2':'#nav'}},k);
  if(!ok)continue;await page.waitForTimeout(900);rec++;
  const d=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1||document.body.scrollWidth<=innerWidth+1);if(!d)desb.push(k);
  if(SHOTS&&['nueva','fac','config'].includes(k))await page.screenshot({path:SHOTS+'/panel-'+k+'-'+ETQ+'.png'});
 }
 chk('recorrido por '+rec+' pantallas del menú sin desbordamiento horizontal',rec>=15&&desb.length===0,desb.join(','));
 const csp2=await page.evaluate(()=>window.__csp.slice());
 chk('recorrido: sin violaciones CSP',csp2.length===0,csp2.join(' | '));
 chk('recorrido: sin errores de JS ni de consola',S.err.length===0&&S.cons.length===0,S.err.concat(S.cons).join(' | ').slice(0,400));
 await ctx.close();

 /* TIENDA */
 console.log('\n== TIENDA (?tienda=1) no cambia ('+ETQ+') ==');
 const medT=()=>{const g=s=>document.querySelector(s);const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};
  return{clase:document.documentElement.classList.contains('ven-crm'),vens:document.querySelectorAll('.vsym,.vwm,.vpie,.vlogo,img[src*="ven-crm"]').length,titulo:document.title,manifest:g('link[rel=manifest]').getAttribute('href'),
   shop:r(g('#shop')),kwrap:r(g('#shop .kwrap')),top:r(g('.top')),sb:r(g('.sb')),authVisible:!!g('#auth')&&getComputedStyle(g('#auth')).display!=='none',csp:window.__csp.slice()}};
 const T=async(url)=>{const x=await abrir(br,url+'?tienda=1');await x.page.waitForTimeout(6000);const r=await x.page.evaluate(medT);await x.ctx.close();return r};
 const t1=await T(BASE);
 chk('tienda: sin html.ven-crm, sin elementos VEN, título y manifest de Tarjetería Jhon',!t1.clase&&t1.vens===0&&!/VEN CRM/.test(t1.titulo)&&t1.manifest==='manifest.json',JSON.stringify({c:t1.clase,v:t1.vens,t:t1.titulo,m:t1.manifest}));
 chk('tienda: sin violaciones CSP',t1.csp.length===0,t1.csp.join(' | '));
 if(ANTES){
  const t0=await T(ANTES);
  const igual=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  chk('tienda: contenedor #shop y #shop .kwrap miden lo mismo que en main (x, y, ancho y alto)',igual(t1.shop,t0.shop)&&igual(t1.kwrap,t0.kwrap),'antes '+JSON.stringify(t0.kwrap)+' · ahora '+JSON.stringify(t1.kwrap));
  chk('tienda: sigue sin barra lateral ni cabecera del panel',igual(t1.sb,t0.sb)&&igual(t1.top,t0.top),JSON.stringify([t0.sb,t1.sb]));
  const a=await abrir(br,ANTES);try{await entrar(a.page)}catch(e){console.log('  FALLA  «antes» sin sesión');fallos++}
  const m0=await a.page.evaluate(medir);await a.ctx.close();
  console.log('\n== EMPRESA: antes (main) vs ahora ==');
  chk('logo de la empresa: mismo src, mismo ancho/alto y misma caja',m0.logoSrc===m.logoSrc&&igual(m0.logoRect,m.logoRect)&&igual(m0.logoCajaRect,m.logoCajaRect),'antes '+JSON.stringify([m0.logoRect,m0.logoCajaRect])+' · ahora '+JSON.stringify([m.logoRect,m.logoCajaRect]));
  chk('nombre, lema, menú y número de iconos de la empresa idénticos',m0.nombre===m.nombre&&m0.lema===m.lema&&m0.menu===m.menu&&m0.navIconos===m.navIconos);
 }
 await br.close();
 console.log('\n'+(fallos?'FALLÓ: '+fallos+' comprobaciones':'TODO BIEN'));process.exit(fallos?1:0);
})().catch(e=>{console.error('ERROR: '+e.message);process.exit(2)});
