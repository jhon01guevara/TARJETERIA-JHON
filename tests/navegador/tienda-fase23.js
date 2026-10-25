/* Fase 23 — batería de la TIENDA PÚBLICA en Chrome real (escritorio 1366x900 y móvil 390x844).
   Nace del error de la Fase 20 (PR 25): la clase `kwrap` (contenedor principal de la tienda, `#shop .kwrap`) se reutilizó para la envoltura
   del botón de WhatsApp con `height:0` y la tienda quedó con 48 px de alto en vez de ~6100 px: redes, pie, «Políticas» y «Contacto» subieron arriba.
   Son MEDICIONES deterministas de geometría (no se comparan píxeles: el orden de los productos es aleatorio).
   No envía pedidos: llega hasta ver el botón «Enviar pedido» y vigila que shopSend() nunca se llame. El carrito vive solo en localStorage del
   contexto del navegador (nuevo y vacío en cada corrida). La tienda LEE los productos de Firestore (solo lectura, como cualquier visitante).
   Uso:
     DIR=/ruta/copia PUERTO=8941 node tests/navegador/tienda-fase23.js      (levanta python3 -m http.server en un puerto libre y lo apaga)
     BASE=http://127.0.0.1:8941/ node tests/navegador/tienda-fase23.js        (si ya hay un servidor sirviendo la copia)
   Variables: PW (ruta de playwright-core, por defecto «playwright-core»), VPS (ej. «1366x900,390x844»), ESPERA (ms para ver productos, 40000).
   Código de salida: 0 todo bien · 1 alguna comprobación falló · 2 no se pudo preparar la prueba (sin productos, sin servidor…). */
const {chromium}=require(process.env.PW||'playwright-core');
const net=require('node:net'),path=require('node:path'),{spawn}=require('node:child_process');
const VPS=(process.env.VPS||'1366x900,390x844').split(',').map(s=>s.split('x').map(Number));
const ESPERA=+process.env.ESPERA||40000;
if(/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(process.env.BASE||''))throw new Error('Esta prueba se corre contra una copia local, no contra producción');

const libre=p=>new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))});
async function servidor(){
 if(process.env.BASE)return {base:process.env.BASE.replace(/\/?$/,'/'),parar(){}};
 const dir=path.resolve(process.env.DIR||path.join(__dirname,'..','..')),puerto=+process.env.PUERTO||8941;
 if(!await libre(puerto))throw new Error('El puerto '+puerto+' ya está en uso: elige otro con PUERTO=');
 const p=spawn('python3',['-m','http.server',String(puerto),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});
 for(let i=0;i<50&&await libre(puerto);i++)await new Promise(r=>setTimeout(r,100));
 return {base:'http://127.0.0.1:'+puerto+'/',parar(){p.kill()}};
}

const R=[];let fallos=0;
const chk=(vp,n,ok,det)=>{R.push({vp,n,ok});if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(det?'  ['+det+']':''))};
const omit=(vp,n,why)=>console.log('  omitido '+n+'  ['+why+']');

/* Mide la geometría de la tienda DENTRO de la página. Todo en coordenadas de ventana (getBoundingClientRect), así que las diferencias no dependen del scroll. */
const medir=()=>{
 const q=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const rc=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right,width:r.width}};
 const vis=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.height>0&&r.width>0};
 const shop=q('#shop'),kw=all('#shop .kwrap'),g=q('#sh_g'),redes=q('#k_redes'),foot=q('#k_footer'),wa=q('#k_wa');
 const cards=g?[...g.children].filter(vis):[];const ult=cards.reduce((a,c)=>!a||c.getBoundingClientRect().bottom>a.getBoundingClientRect().bottom?c:a,null);
 const k0=kw[0];
 const bloques=shop?[...shop.children].filter(c=>{const s=getComputedStyle(c);return vis(c)&&(s.position==='static'||s.position==='relative')}).map(c=>c.id||c.className||c.tagName):[];
 const chips=foot?[...foot.querySelectorAll('button,a')].map(b=>({t:b.textContent.trim(),r:rc(b)})):[];
 const wr=wa?wa.closest('[role=complementary]'):null;
 return {
  vh:innerHeight,vw:innerWidth,
  kwrapTotal:all('.kwrap').length,kwrapFuera:all('.kwrap').filter(e=>!e.closest('#shop')).length,kwrapEnShop:kw.length,
  kw:rc(k0),kwScroll:k0?k0.scrollHeight:0,shopScrollH:shop?shop.scrollHeight:0,
  tarjetas:cards.length,grid:rc(g),ultima:ult?rc(ult):null,
  redes:rc(redes),redesVis:vis(redes),redesOculto:!!(redes&&redes.hidden),foot:rc(foot),footVis:vis(foot),bloques,chips,
  wa:{existe:!!wa,oculto:!!(wa&&(wa.hidden||!vis(wa))),pos:wa?getComputedStyle(wa).position:null,r:rc(wa)},
  wrap:wr?{rol:wr.getAttribute('role'),etq:wr.getAttribute('aria-label'),alto:wr.getBoundingClientRect().height,clases:wr.className,tieneKwrap:wr.classList.contains('kwrap'),oculto:wr.hidden}:null
 };
};

async function checarDiseno(page,vp,etapa){
 const m=await page.evaluate(medir),E=etapa?' ('+etapa+')':'';
 chk(vp,'hay productos en la grilla'+E,m.tarjetas>0,m.tarjetas+' tarjetas');
 chk(vp,'solo existe UN elemento .kwrap y está dentro de #shop'+E,m.kwrapTotal===1&&m.kwrapEnShop===1&&m.kwrapFuera===0,'total '+m.kwrapTotal+', fuera de #shop '+m.kwrapFuera);
 const kh=m.kw?m.kw.height:0;
 chk(vp,'#shop .kwrap mide más de 1000 px'+E,kh>1000,Math.round(kh)+' px');
 chk(vp,'#shop .kwrap es al menos tan alto como su contenido'+E,!!m.kw&&kh>=m.kwScroll-1,'alto '+Math.round(kh)+' · contenido '+m.kwScroll);
 chk(vp,'#shop .kwrap abarca toda la grilla de productos'+E,!!m.kw&&!!m.grid&&m.kw.bottom>=m.grid.bottom-1,m.kw&&m.grid?'kwrap hasta '+Math.round(m.kw.bottom)+' · grilla hasta '+Math.round(m.grid.bottom):'');
 if(m.redesOculto)omit(vp,'redes sociales debajo de la grilla'+E,'#k_redes está oculto: la tienda no tiene redes configuradas');
 else{
  chk(vp,'#k_redes es visible'+E,m.redesVis);
  chk(vp,'#k_redes está DEBAJO del último producto'+E,!!m.redes&&!!m.ultima&&m.redes.top>=m.ultima.bottom,m.redes&&m.ultima?'redes '+Math.round(m.redes.top)+' ≥ último producto '+Math.round(m.ultima.bottom):'');
  chk(vp,'#k_redes está debajo de la grilla (#sh_g)'+E,!!m.redes&&!!m.grid&&m.redes.top>=m.grid.bottom);
 }
 chk(vp,'#k_footer es visible'+E,m.footVis);
 chk(vp,'#k_footer está DEBAJO del último producto'+E,!!m.foot&&!!m.ultima&&m.foot.top>=m.ultima.bottom,m.foot&&m.ultima?'pie '+Math.round(m.foot.top)+' ≥ último producto '+Math.round(m.ultima.bottom):'');
 chk(vp,'#k_footer está debajo de las redes'+E,m.redesOculto||(!!m.foot&&!!m.redes&&m.foot.top>=m.redes.bottom-1));
 chk(vp,'el pie es el ÚLTIMO bloque visible dentro de #shop'+E,m.bloques[m.bloques.length-1]==='k_footer','bloques: '+m.bloques.join(' > '));
 const pol=m.chips.find(c=>/Pol[ií]ticas y Privacidad/i.test(c.t)),con=m.chips.find(c=>/Contacto oficial/i.test(c.t));
 chk(vp,'chips «Políticas y Privacidad» y «Contacto oficial» están dentro de #k_footer'+E,!!pol&&!!con&&m.foot&&[pol,con].every(c=>c.r.top>=m.foot.top-1&&c.r.bottom<=m.foot.bottom+1));
 chk(vp,'los chips quedan debajo de la grilla y del último producto'+E,!!pol&&!!con&&!!m.ultima&&[pol,con].every(c=>c.r.top>=m.ultima.bottom),pol&&con?'chips '+Math.round(Math.min(pol.r.top,con.r.top))+' ≥ '+Math.round(m.ultima.bottom):'');
 const w=m.wa,wr=m.wrap;
 chk(vp,'#k_wa existe y está dentro de un contenedor role="complementary" con nombre'+E,w.existe&&!!wr&&wr.rol==='complementary'&&!!wr.etq,wr?wr.rol+' / '+wr.etq:'sin contenedor');
 chk(vp,'el contenedor de WhatsApp mide alto 0 y NO lleva la clase kwrap'+E,!!wr&&wr.alto===0&&!wr.tieneKwrap,wr?'alto '+wr.alto+' · clases «'+wr.clases+'»':'');
 if(w.oculto)omit(vp,'botón de WhatsApp flotante'+E,'#k_wa oculto: la tienda no tiene WhatsApp configurado');
 else{
  chk(vp,'#k_wa es position:fixed'+E,w.pos==='fixed',w.pos);
  chk(vp,'#k_wa queda dentro de la ventana'+E,!!w.r&&w.r.top>=0&&w.r.bottom<=m.vh&&w.r.left>=0&&w.r.right<=m.vw,w.r?Math.round(w.r.left)+','+Math.round(w.r.top)+' → '+Math.round(w.r.right)+','+Math.round(w.r.bottom):'');
 }
 return m;
}

async function correr(br,base,[W,H]){
 const vp=W+'x'+H;console.log('\n== '+vp+(W<600?' (móvil)':' (escritorio)')+' ==');
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))});
 await page.goto(base+'?tienda=1',{waitUntil:'load'});
 try{await page.waitForFunction(()=>document.querySelectorAll('#sh_g > *').length>0&&document.querySelector('#k_footer'),null,{timeout:ESPERA})}
 catch(e){console.log('  NO SE PUDO PREPARAR: la grilla no mostró productos en '+ESPERA+' ms (¿sin conexión a Firestore?)');await ctx.close();return 2}
 await page.waitForTimeout(2500);
 await page.evaluate(()=>{window.__envios=0;window.shopSend=function(){window.__envios++}});   // red de seguridad: nunca se envía un pedido

 await checarDiseno(page,vp,'');

 /* el scroll de la tienda llega a mostrar redes y pie. La grilla carga más productos al bajar (scroll infinito): se baja hasta que el alto deja de crecer. */
 const sc=await page.evaluate(async()=>{const s=document.querySelector('#shop'),d=document.scrollingElement;let previo=-1,igual=0;
  for(let i=0;i<60&&igual<3;i++){s.scrollTop=s.scrollHeight;window.scrollTo(0,d.scrollHeight);await new Promise(r=>setTimeout(r,350));const h=Math.max(s.scrollHeight,d.scrollHeight);igual=h===previo?igual+1:0;previo=h}
  const f=document.querySelector('#k_footer').getBoundingClientRect(),r=document.querySelector('#k_redes'),rr=r.getBoundingClientRect();
  return {vh:innerHeight,shopSH:s.scrollHeight,shopCH:s.clientHeight,shopST:s.scrollTop,docSH:d.scrollHeight,docST:d.scrollTop,docCH:d.clientHeight,fTop:f.top,fBot:f.bottom,rHidden:r.hidden,rTop:rr.top,rBot:rr.bottom,tarjetas:document.querySelectorAll('#sh_g > *').length}});
 chk(vp,'el contenido desplazable de la tienda es largo (≥ 2 pantallas y > 1000 px)',Math.max(sc.shopSH,sc.docSH)>=sc.vh*2&&Math.max(sc.shopSH,sc.docSH)>1000,'#shop '+sc.shopSH+' · documento '+sc.docSH+' · ventana '+sc.vh+' · '+sc.tarjetas+' tarjetas');
 chk(vp,'al bajar hasta el final se ve el pie completo dentro de la ventana',sc.fBot<=sc.vh+1&&sc.fTop<sc.vh&&sc.fTop>=0,'pie '+Math.round(sc.fTop)+'–'+Math.round(sc.fBot)+' · ventana '+sc.vh);
 if(sc.rHidden)omit(vp,'al bajar se ven las redes','#k_redes oculto');else chk(vp,'al bajar hasta el final también se ven las redes sociales',sc.rBot<=sc.vh+1&&sc.rBot>0&&sc.rTop<sc.vh,'redes '+Math.round(sc.rTop)+'–'+Math.round(sc.rBot));
 await page.evaluate(()=>{document.querySelector('#shop').scrollTop=0;window.scrollTo(0,0)});await page.waitForTimeout(300);

 /* filtros: abrir, cambiar un filtro, aplicar, limpiar, cerrar; el diseño no cambia */
 const fb=page.locator('.kfilter-btn:visible').first(),abrirFiltros=async()=>{if(await fb.count())await fb.click();else await page.evaluate(()=>shopFilterSheet())};   // en escritorio el botón no se muestra: se abre la misma hoja
 {
  await abrirFiltros();await page.waitForSelector('#shopm .kfilter-sheet',{timeout:5000});
  chk(vp,'filtros: la hoja se abre (#shopm visible con «Filtros»)',await page.evaluate(()=>{const m=document.querySelector('#shopm');return getComputedStyle(m).display==='flex'&&/Filtros/.test(m.textContent)}));
  await page.locator('#shopm .kavail button[data-a-click=\'["in"]\']').click();
  chk(vp,'filtros: «Disponibles» queda marcado',await page.evaluate(()=>/Disponibles/.test(document.querySelector('#shopm .kavail .on')?.textContent||'')));
  await page.locator('#shopm button:has-text("Ver resultados")').click();await page.waitForTimeout(800);
  chk(vp,'filtros: «Ver resultados» cierra la hoja',await page.evaluate(()=>getComputedStyle(document.querySelector('#shopm')).display==='none'));
  await checarDiseno(page,vp,'con filtro «Disponibles»');
  await abrirFiltros();await page.waitForSelector('#shopm .kfilter-sheet');await page.locator('#shopm button:has-text("Limpiar filtros")').click();await page.waitForSelector('#shopm .kfilter-sheet');
  await page.locator('#shopm button:has-text("Ver resultados")').click();await page.waitForTimeout(800);
  chk(vp,'filtros: «Limpiar filtros» + «Ver resultados» deja el filtro en «Todos»',await page.evaluate(()=>SH.avail==='all'&&!SH.sel.length&&getComputedStyle(document.querySelector('#shopm')).display==='none'));
 }

 /* carrito: agregar, ver contador, ver el pedido (sin enviarlo), quitar */
 const cont=()=>page.evaluate(()=>{const n=Object.values(SH.cart).reduce((s,x)=>s+x,0);const b=[...document.querySelectorAll('.kbdg')].filter(e=>e.getBoundingClientRect().height>0).map(e=>+e.textContent);return {n,ids:Object.keys(SH.cart).length,vis:b}});
 const c0=await cont();chk(vp,'carrito: empieza vacío',c0.n===0&&c0.vis.length===0);
 const add=page.locator('#sh_g .kc .kadd').first();
 await add.scrollIntoViewIfNeeded();await add.click();await page.waitForSelector('#shopm .kpk',{timeout:5000});
 chk(vp,'carrito: «Agregar» abre la hoja de cantidad',await page.evaluate(()=>document.querySelector('#k_pb')&&/Agregar al carrito/.test(document.querySelector('#k_pb').textContent)));
 await page.click('#k_pb');await page.waitForTimeout(600);
 const c1=await cont();
 chk(vp,'carrito: el contador muestra la cantidad agregada',c1.ids===1&&c1.n>0&&c1.vis.length>0&&c1.vis.every(v=>v===c1.n),'carrito '+c1.n+' · insignias '+c1.vis.join(','));
 await page.waitForTimeout(2600);   // que se vaya el aviso «Agregado»
 await page.locator('.krail-cart:visible, #k_ha .kha.pri:visible, #k_nav button:has-text("Carrito"):visible').first().click();await page.waitForSelector('#sh_sb',{timeout:5000});
 const ped=await page.evaluate(()=>{const b=document.querySelector('#sh_sb'),r=b.getBoundingClientRect();return {txt:b.textContent.trim(),vis:r.height>0,sheet:/Su pedido/.test(document.querySelector('#shopm').textContent),poli:!!document.querySelector('#sh_chk_poli'),total:/Total/.test(document.querySelector('#shopm').textContent)}});
 chk(vp,'carrito: «Su pedido» muestra el total, la aceptación de políticas y el botón «Enviar pedido» (NO se pulsa)',ped.sheet&&ped.total&&ped.poli&&ped.vis&&/Enviar pedido/.test(ped.txt));
 await page.locator('#shopm .kdel').first().click();await page.waitForTimeout(600);
 const c2=await cont();
 chk(vp,'carrito: «Quitar» lo vacía y desaparece el contador',c2.n===0&&c2.vis.length===0&&await page.evaluate(()=>/carrito está vac/.test(document.querySelector('#shopm').textContent)));
 await page.locator('#shopm button:has-text("Seguir viendo")').click();await page.waitForTimeout(300);
 chk(vp,'carrito: «Seguir viendo» cierra la hoja',await page.evaluate(()=>getComputedStyle(document.querySelector('#shopm')).display==='none'));
 await checarDiseno(page,vp,'después del carrito');

 const fin=await page.evaluate(()=>({env:window.__envios,csp:window.__csp.length}));
 chk(vp,'no se envió ningún pedido (shopSend nunca se llamó)',fin.env===0);
 chk(vp,'sin errores de JavaScript no capturados',errs.length===0,errs.slice(0,2).join(' | '));
 chk(vp,'sin violaciones de la CSP',fin.csp===0,fin.csp+' violaciones');
 await ctx.close();return 0;
}

(async()=>{
 const sv=await servidor();let br,prep=0;
 try{
  br=await chromium.launch({channel:'chrome',headless:true});
  for(const v of VPS)prep=Math.max(prep,await correr(br,sv.base,v));
 }catch(e){console.log('ERROR: '+e.message);prep=2}
 finally{if(br)await br.close();sv.parar()}
 console.log('\n'+(R.length-fallos)+' comprobaciones correctas, '+fallos+' fallidas');
 process.exit(prep===2?2:fallos?1:0);
})();
