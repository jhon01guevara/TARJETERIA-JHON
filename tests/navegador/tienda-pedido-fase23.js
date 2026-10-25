/* Fase 23 — flujo del PEDIDO de la tienda pública en Chrome real (escritorio 1366x900 y móvil 390x844): carrito → hoja «Su pedido» → validaciones → registro → pedido enviado.
   La tienda LEE los productos de Firestore (solo lectura, como cualquier visitante). NO se envía ni se escribe NADA:
   · Parte A: `shopSend` se sustituye por un contador (el botón «Enviar pedido» debe llamarlo exactamente una vez por pulsación) y se prueban cantidades, subtotales y totales.
   · Parte B: con el `shopSend` REAL se prueban las validaciones (política sin aceptar, datos del registro). Todas paran ANTES de cualquier escritura.
   · Parte C: el flujo completo válido se corre con `fbDb` sustituido por un doble que captura las escrituras a `tienda_pedidos` y `tienda_leads` (las lecturas siguen siendo reales), con EmailJS desactivado
     y con el tráfico de escritura de Firestore (`/Write/channel`) y de EmailJS BLOQUEADO a nivel de red; se exige que no se haya pedido ninguna escritura real.
   Nota: en esta tienda el pedido NO se envía por WhatsApp: se guarda en Firestore (colección tienda_pedidos) y el cliente ve su comprobante. El botón flotante de WhatsApp solo abre un chat con el mensaje fijo de saludo: se comprueba su enlace.
   Uso:  DIR=/ruta/copia PUERTO=8942 node tests/navegador/tienda-pedido-fase23.js     (o BASE=http://127.0.0.1:8942/ si ya hay un servidor)
   Variables: PW, VPS (ej. «1366x900,390x844»), ESPERA (ms para ver productos, 40000). Salida: 0 bien · 1 alguna falló · 2 no se pudo preparar. */
const {chromium}=require(process.env.PW||'playwright-core');
const net=require('node:net'),path=require('node:path'),{spawn}=require('node:child_process');
const VPS=(process.env.VPS||'1366x900,390x844').split(',').map(s=>s.split('x').map(Number));
const ESPERA=+process.env.ESPERA||40000;
if(/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(process.env.BASE||''))throw new Error('Esta prueba se corre contra una copia local, no contra producción');
const libre=p=>new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))});
async function servidor(){
 if(process.env.BASE)return {base:process.env.BASE.replace(/\/?$/,'/'),parar(){}};
 const dir=path.resolve(process.env.DIR||path.join(__dirname,'..','..')),puerto=+process.env.PUERTO||8942;
 if(!await libre(puerto))throw new Error('El puerto '+puerto+' ya está en uso: elige otro con PUERTO=');
 const p=spawn('python3',['-m','http.server',String(puerto),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});
 for(let i=0;i<50&&await libre(puerto);i++)await new Promise(r=>setTimeout(r,100));
 return {base:'http://127.0.0.1:'+puerto+'/',parar(){p.kill()}};
}
let fallos=0,total=0;
const chk=(n,ok,det)=>{total++;if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(det?'  ['+det+']':''))};
const dinero=t=>{const m=String(t).match(/\d[\d.,]*/);return m?parseFloat(m[0].replace(/,/g,'')):NaN};
const cerca=(a,b)=>Math.abs(a-b)<0.005;

async function correr(br,base,[W,H]){
 const vp=W+'x'+H;console.log('\n== '+vp+(W<600?' (móvil)':' (escritorio)')+' ==');
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600});
 const page=await ctx.newPage(),errs=[],bloqueadas=[];page.on('pageerror',e=>errs.push(e.message));
 /* red de seguridad a nivel de red: ninguna escritura de Firestore ni envío de EmailJS sale del navegador */
 await ctx.route(/firestore\.googleapis\.com\/.*\/Write\/channel/,r=>{bloqueadas.push('Firestore Write');r.abort()});
 await ctx.route(/api\.emailjs\.com/,r=>{bloqueadas.push('EmailJS');r.abort()});
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))});
 await page.goto(base+'?tienda=1',{waitUntil:'load'});
 try{await page.waitForFunction(()=>document.querySelectorAll('#sh_g .kc .kadd').length>1&&document.querySelector('#k_footer'),null,{timeout:ESPERA})}
 catch(e){console.log('  NO SE PUDO PREPARAR: la grilla no mostró productos en '+ESPERA+' ms');await ctx.close();return 2}
 await page.waitForTimeout(3000);   // el antibots exige 2,5 s desde que se abrió la tienda

 const cont=()=>page.evaluate(()=>({n:Object.values(SH.cart).reduce((s,x)=>s+x,0),ids:Object.keys(SH.cart).length,vis:[...document.querySelectorAll('.kbdg')].filter(e=>e.getBoundingClientRect().height>0).map(e=>+e.textContent)}));
 const hoja=()=>page.evaluate(()=>{const m=document.querySelector('#shopm');return {k:m.dataset.k,on:getComputedStyle(m).display!=='none',txt:m.innerText}});
 /* ---------- PARTE A: shopSend → contador ---------- */
 await page.evaluate(()=>{window.__orig=window.shopSend;window.__envios=0;window.shopSend=function(){window.__envios++}});
 /* El catálogo REAL de la tienda está todo «a consultar» (precio 0). Primero se prueba ese modo y luego se fijan precios SOLO EN MEMORIA (nada se guarda) para comprobar los totales. */
 const precios=()=>page.evaluate(()=>{SH.items.forEach((i,k)=>{i.price=((k%7)+1)*1.25})});
 const real=await page.evaluate(()=>({n:SH.items.length,consultar:SH.items.filter(i=>!(+i.price>0)).length}));
 chk('hay productos en la tienda',real.n>=2,real.n+' productos');
 if(real.consultar===real.n){
  const a0=page.locator('#sh_g .kc .kadd').first();await a0.scrollIntoViewIfNeeded();await a0.click();await page.waitForSelector('#shopm .kpk',{timeout:5000});
  const cs=await page.evaluate(()=>({sub:document.querySelector('#k_ps').textContent,pu:document.querySelector('#shopm .kpk small').textContent}));
  chk('producto sin precio: la hoja muestra «Precio a consultar» y el subtotal «Consultar»',/Precio a consultar/.test(cs.pu)&&cs.sub==='Consultar',JSON.stringify(cs));
  await page.click('#k_pb');await page.waitForTimeout(500);await page.waitForTimeout(2600);
  await page.click('.kfab');await page.waitForSelector('#sh_sb',{timeout:5000});
  const tc=await page.evaluate(()=>{const tot=[...document.querySelectorAll('#shopm div')].find(d=>/^Total/.test(d.textContent.trim())&&d.children.length===2);return tot.lastElementChild.textContent});
  chk('pedido sin precios: el total dice «Consultar»',tc==='Consultar',tc);
  await page.locator('#shopm .kdel').first().click();await page.waitForTimeout(500);await page.locator('#shopm button:has-text("Seguir viendo")').click();await page.waitForTimeout(300);
  chk('pedido sin precios: se vacía el carrito',(await cont()).n===0);
 }else console.log('  omitido modo «a consultar»  [la tienda ya tiene precios reales]');
 await precios();
 /* se agrega por la interfaz el 1.º y el 2.º producto visibles con precio (se lee SH.pi, el producto de la hoja) */
 const agregar=async(idx,botonQty,otra)=>{
  await precios();const loc=page.locator('#sh_g .kc .kadd').nth(idx);await loc.scrollIntoViewIfNeeded();await loc.click();await page.waitForSelector('#shopm .kpk',{timeout:5000});
  const pid=await page.evaluate(()=>SH.pi),pr=await page.evaluate(()=>{const i=SH.items.find(x=>x.id===SH.pi);return {id:i.id,price:+i.price,name:i.name,out:i.stock==='out'||i.stock==='disc'}});
  if(botonQty)await page.click('#shopm .kqb[data-n="'+botonQty+'"]');
  if(otra!=null){await page.fill('#k_pq',String(otra));await page.dispatchEvent('#k_pq','input')}
  const sub=await page.$eval('#k_ps',e=>e.textContent),bt=await page.$eval('#k_pb',e=>e.textContent),q=await page.evaluate(()=>SH.pq);
  return {pid,pr,sub,bt,q};
 };
 /* producto 1: 12 unidades (botón «12») */
 let p1,p2;
 for(let i=0;i<6&&!p1;i++){const r=await agregar(i,12);if(r.pr.price>0&&!r.pr.out){p1=r}else{await page.click('#shopm .sbtn.g')}}
 chk('hoja de cantidad: el subtotal es cantidad × precio ('+(p1?p1.q+' × '+p1.pr.price:'?')+')',!!p1&&cerca(dinero(p1.sub),p1.q*p1.pr.price),p1&&p1.sub);
 chk('hoja de cantidad: el botón dice «Agregar al carrito · 12 (1 docena)»',!!p1&&/^Agregar al carrito · 12 \(1 docena\)$/.test(p1.bt),p1&&p1.bt);
 /* límites de «Otra cantidad»: 0 y vacío → 1 ; 99999 → 9999 ; decimal se redondea */
 await page.fill('#k_pq','0');await page.dispatchEvent('#k_pq','input');await page.click('#k_pb',{trial:true});
 const lim=await page.evaluate(()=>{const o={};const t=v=>{shopPickSet(v,false);return SH.pq};o.cero=t(0);o.neg=t(-5);o.nan=t('abc');o.grande=t(99999);o.dec=t(7.6);return o});
 chk('«Otra cantidad»: 0, negativos y texto vuelven a 1',lim.cero===1&&lim.neg===1&&lim.nan===1,JSON.stringify(lim));
 chk('«Otra cantidad»: máximo 9999 y los decimales se redondean',lim.grande===9999&&lim.dec===8,JSON.stringify(lim));
 await page.evaluate(()=>shopPickSet(12,false));
 await page.click('#k_pb');await page.waitForTimeout(500);
 let c=await cont();chk('carrito: 1 producto, 12 unidades, insignias iguales',c.ids===1&&c.n===12&&c.vis.every(v=>v===12),JSON.stringify(c));
 await page.waitForTimeout(2600);
 /* producto 2: cantidad libre 7 */
 for(let i=0;i<8&&!p2;i++){const r=await agregar(i,null,7);if(r.pid!==p1.pid&&r.pr.price>0&&!r.pr.out){p2=r}else{await page.click('#shopm .sbtn.g')}}
 chk('hoja de cantidad con «Otra cantidad» 7: el subtotal es 7 × precio',!!p2&&p2.q===7&&cerca(dinero(p2.sub),7*p2.pr.price),p2&&p2.sub);
 await page.click('#k_pb');await page.waitForTimeout(500);await page.waitForTimeout(2600);
 c=await cont();chk('carrito: 2 productos, 19 unidades',c.ids===2&&c.n===19,JSON.stringify(c));
 const esperado=12*p1.pr.price+7*p2.pr.price;
 const fab=await page.evaluate(()=>(document.querySelector('.kfab')||{}).textContent||'');
 chk('botón flotante: «Ver pedido · 19 · total»',/Ver pedido\s*·\s*19/.test(fab)&&cerca(dinero(fab.split('·').pop()),esperado),fab.trim());
 await precios();await page.click('.kfab');await page.waitForSelector('#sh_sb',{timeout:5000});
 const ped=await page.evaluate(()=>{const lns=[...document.querySelectorAll('#shopm .kln')].map(l=>({n:l.querySelector('b').textContent,p:l.querySelector('small').textContent,q:+l.querySelector('.kqn').textContent}));const tot=[...document.querySelectorAll('#shopm div')].find(d=>/^Total/.test(d.textContent.trim())&&d.children.length===2);return {lns,tot:tot&&tot.lastElementChild.textContent,poli:document.querySelector('#sh_chk_poli')&&document.querySelector('#sh_chk_poli').checked,nota:!!document.querySelector('#sh_nt'),precios:/Precios sin ITBMS/.test(document.querySelector('#shopm').textContent)}});
 chk('«Su pedido»: muestra las 2 líneas con cantidad y precio unitario correctos',ped.lns.length===2&&ped.lns.some(l=>l.q===12&&cerca(dinero(l.p),p1.pr.price))&&ped.lns.some(l=>l.q===7&&cerca(dinero(l.p),p2.pr.price)),JSON.stringify(ped.lns));
 chk('«Su pedido»: el total es la suma exacta ('+esperado.toFixed(2)+')',cerca(dinero(ped.tot),esperado),ped.tot);
 chk('«Su pedido»: la casilla de políticas empieza SIN marcar y hay campo de notas',ped.poli===false&&ped.nota);
 chk('«Su pedido»: avisa que los precios son sin ITBMS',ped.precios);
 /* + / − dentro de la hoja recalculan el total */
 await page.locator('#shopm .kln').first().locator('.kst button[aria-label="Agregar uno"]').click();await page.waitForTimeout(300);
 const t2=await page.evaluate(()=>{const tot=[...document.querySelectorAll('#shopm div')].find(d=>/^Total/.test(d.textContent.trim())&&d.children.length===2);return tot.lastElementChild.textContent});
 const lns2=await page.evaluate(()=>[...document.querySelectorAll('#shopm .kln')].map(l=>({n:l.querySelector('b').textContent,q:+l.querySelector('.kqn').textContent})));
 const l1=lns2.find(l=>l.n===p1.pr.name)||lns2[0],mas=lns2.reduce((s,l)=>s+l.q,0);
 const exp2=Object.fromEntries([[p1.pr.name,p1.pr.price],[p2.pr.name,p2.pr.price]]);
 const tot2=lns2.reduce((s,l)=>s+l.q*(exp2[l.n]||0),0);
 chk('«+» suma una unidad y el total se recalcula',mas===20&&cerca(dinero(t2),tot2),'unidades '+mas+' · total '+t2);
 await page.locator('#shopm .kln').first().locator('.kst button[aria-label="Quitar uno"]').click();await page.waitForTimeout(300);
 chk('«−» la devuelve a 19 unidades',(await cont()).n===19);
 /* la nota se conserva al editar cantidades */
 await page.fill('#sh_nt','Nota de prueba: entregar por la tarde');await page.locator('#shopm .kln').first().locator('.kst button[aria-label="Agregar uno"]').click();await page.waitForTimeout(300);
 chk('la nota escrita se conserva al cambiar cantidades',await page.$eval('#sh_nt',e=>e.value)==='Nota de prueba: entregar por la tarde');
 await page.locator('#shopm .kln').first().locator('.kst button[aria-label="Quitar uno"]').click();await page.waitForTimeout(300);
 /* el carrito sobrevive a recargar (localStorage) */
 const guardado=await page.evaluate(()=>JSON.parse(localStorage.getItem(lsk('tj_shop_cart'))||'{}'));
 chk('el carrito se guarda en localStorage (2 productos, 19 unidades)',Object.keys(guardado).length===2&&Object.values(guardado).reduce((a,b)=>a+b,0)===19,JSON.stringify(guardado));
 /* «Enviar pedido» llama a shopSend (contador) */
 await page.click('#sh_sb');await page.waitForTimeout(300);
 chk('«Enviar pedido» llama exactamente una vez a shopSend (sustituido por un contador)',await page.evaluate(()=>window.__envios)===1);
 await page.click('#sh_sb');await page.waitForTimeout(300);
 chk('cada pulsación cuenta una vez (2 pulsaciones = 2 llamadas)',await page.evaluate(()=>window.__envios)===2);
 await page.evaluate(()=>{window.shopSend=window.__orig});

 /* Doble de escritura puesto ANTES de las validaciones: si alguna fallara y dejara pasar un envío, se captura aquí en vez de llegar a Firestore. */
 const prep=await page.evaluate(()=>{
  window.emailjs=null;                                    // EmailJS desactivado: shopRegSend va directo a shopRegFinish
  window.__escr=[];const real=fbDb;
  const doble={collection(p){
   if(/tienda_(pedidos|leads)$/.test(p))return {doc(id){return {set:async d=>{window.__escr.push({col:p.split('/').pop(),id,d:JSON.parse(JSON.stringify(d))})}}},where(){return {get:async()=>({docs:[]})}}};
   return real.collection(p)}};
  const proxy=new Proxy(real,{get(t,k){if(k==='collection')return doble.collection;const v=t[k];return typeof v==='function'?v.bind(t):v}});
  fbDb=proxy;
  const chkDoble=fbCol('tienda_pedidos');
  return {emailListo:!!emailjsListo(),doble:typeof chkDoble.doc==='function'&&typeof chkDoble.get!=='function'&&!!chkDoble.where};
 });
 chk('seguridad: EmailJS desactivado y escrituras desviadas al doble',!prep.emailListo&&prep.doble,JSON.stringify(prep));
 if(prep.emailListo||!prep.doble){console.log('  ABORTA: no se puede garantizar que no se escriba; no se siguen las partes B y C');await ctx.close();return 2}
 /* ---------- PARTE B: shopSend REAL, validaciones (todas paran antes de escribir) ---------- */
 await page.click('#sh_sb');await page.waitForTimeout(400);
 const v1=await page.evaluate(()=>({msg:document.querySelector('#sh_m2').textContent,borde:document.querySelector('#sh_poli_box').style.borderColor,k:document.querySelector('#shopm').dataset.k,boton:document.querySelector('#sh_sb').disabled,foco:document.activeElement&&document.activeElement.id}));
 chk('políticas sin aceptar: avisa «Debe marcar la casilla…» y no avanza',/Debe marcar la casilla aceptando los Términos y la Política de Privacidad/.test(v1.msg)&&v1.k==='cart'&&!v1.boton,v1.msg);
 chk('políticas sin aceptar: la caja se marca en rojo y el foco va a la casilla',/239|ef4444/i.test(v1.borde)&&v1.foco==='sh_chk_poli',v1.borde+' · foco '+v1.foco);
 await page.check('#sh_chk_poli');await page.waitForTimeout(250);
 const v2=await page.evaluate(()=>({msg:document.querySelector('#sh_m2').textContent,borde:document.querySelector('#sh_poli_box').style.borderColor}));
 chk('al marcar la casilla se limpia el aviso y el borde rojo',v2.msg===''&&!/239|ef4444/i.test(v2.borde),JSON.stringify(v2));
 await page.click('#sh_sb');await page.waitForTimeout(700);
 const v3=await hoja();
 chk('con políticas aceptadas y sin cliente registrado pide los datos («Último paso»)',v3.k==='reg'&&/Último paso/.test(v3.txt)&&/Nombre completo \*/.test(v3.txt)&&/Correo electrónico \*/.test(v3.txt));
 const campos=await page.evaluate(()=>['sh_n','sh_t','sh_e','sh_c','sh_d','sh_chk_poli_reg','sh_b'].map(id=>!!document.getElementById(id)));
 chk('el formulario tiene nombre, teléfono, correo, empresa, dirección, política y botón',campos.every(Boolean),JSON.stringify(campos));
 const reg=async(n,t,e,marcar)=>{await page.fill('#sh_n',n);await page.fill('#sh_t',t);await page.fill('#sh_e',e);if(marcar)await page.check('#sh_chk_poli_reg');else await page.uncheck('#sh_chk_poli_reg');await page.click('#sh_b');await page.waitForTimeout(350);return page.$eval('#sh_m',x=>x.textContent)};
 let m=await reg('Cliente de Prueba','61234567','prueba@example.com',false);
 chk('registro sin aceptar políticas: «Debe aceptar los Términos y la Política de Privacidad para registrarse.»',/Debe aceptar los Términos/.test(m),m);
 m=await reg('A','61234567','prueba@example.com',true);chk('nombre de 1 letra: «Escriba su nombre.»',m==='Escriba su nombre.',m);
 m=await reg('Cliente de Prueba','123','prueba@example.com',true);chk('teléfono corto: «Escriba un teléfono válido.»',m==='Escriba un teléfono válido.',m);
 m=await reg('Cliente de Prueba','61234567','correo-malo',true);chk('correo sin @: «Escriba un correo válido.»',m==='Escriba un correo válido.',m);
 m=await reg('Cliente de Prueba','61234567','a@b',true);chk('correo sin dominio: «Escriba un correo válido.»',m==='Escriba un correo válido.',m);
 /* trampa para bots: el campo oculto relleno bloquea el registro */
 await page.evaluate(()=>{document.querySelector('#sh_hp').value='http://spam.example'});
 m=await reg('Cliente de Prueba','61234567','prueba@example.com',true);
 chk('campo trampa (honeypot) relleno: el registro se rechaza con aviso y no escribe nada',m==='No se pudo registrar. Intente de nuevo.'&&await page.evaluate(()=>window.__escr.length)===0,m);
 await page.evaluate(()=>{document.querySelector('#sh_hp').value=''});
 chk('hasta aquí no se escribió nada (ni en el doble, ni cliente guardado, ni pedidos)',await page.evaluate(()=>window.__escr.length===0&&!localStorage.getItem(lsk('tj_shop_cli'))&&!(SH.last)&&!shopOrdLoad().length));
 /* «Volver al pedido» regresa a la hoja del pedido con el carrito intacto */
 await page.click('#shopm button:has-text("Volver al pedido")');await page.waitForTimeout(400);
 chk('«Volver al pedido» regresa a «Su pedido» con el carrito intacto',(await hoja()).k==='cart'&&(await cont()).n===19);
 const notaVuelta=await page.$eval('#sh_nt',e=>e.value),poliVuelta=await page.$eval('#sh_chk_poli',e=>e.checked);
 chk('Fase 24 · «Volver al pedido» CONSERVA la nota que el cliente escribió',notaVuelta==='Nota de prueba: entregar por la tarde',JSON.stringify(notaVuelta));
 chk('Fase 24 · «Volver al pedido» conserva la aceptación de políticas que ya dio en el pedido',poliVuelta===true);
 /* una nota que el cliente borra no resucita: se vacía, se va al registro, se vuelve y sigue vacía; luego se escribe de nuevo */
 await page.fill('#sh_nt','');await page.click('#sh_sb');await page.waitForSelector('#sh_n',{timeout:5000});await page.click('#shopm button:has-text("Volver al pedido")');await page.waitForTimeout(400);
 chk('Fase 24 · una nota vacía sigue vacía al volver del registro',await page.$eval('#sh_nt',e=>e.value)==='');
 await page.fill('#sh_nt','Nota de prueba: entregar por la tarde');

 /* ---------- PARTE C: flujo completo con escrituras capturadas por un doble ---------- */
 /* el doble ya está puesto desde la parte B */
 await page.check('#sh_chk_poli');await page.click('#sh_sb');await page.waitForSelector('#sh_n',{timeout:5000});
 await page.fill('#sh_n','Cliente de Prueba');await page.fill('#sh_t','6123-4567');await page.fill('#sh_e','prueba@example.com');await page.fill('#sh_c','Empresa de Prueba');await page.fill('#sh_d','Ciudad de Panamá');
 await page.check('#sh_chk_poli_reg');await page.click('#sh_b');
 await page.waitForFunction(()=>window.__escr.some(e=>e.col==='tienda_leads')&&document.querySelector('#shopm').dataset.k==='cart',null,{timeout:15000}).catch(()=>{});
 await page.waitForTimeout(600);
 const trasReg=await page.evaluate(()=>({k:document.querySelector('#shopm').dataset.k,poli:document.querySelector('#sh_chk_poli')&&document.querySelector('#sh_chk_poli').checked,msg:(document.querySelector('#sh_m2')||{}).textContent,leads:window.__escr.filter(e=>e.col==='tienda_leads').length,peds:window.__escr.filter(e=>e.col==='tienda_pedidos').length}));
 chk('Fase 24 · tras registrarse se guarda el cliente (1 registro) y el pedido sale directo («¡Pedido enviado!») sin pasar otra vez por la casilla',trasReg.k==='ok'&&trasReg.leads===1&&trasReg.peds===1,JSON.stringify(trasReg));
 /* Fase 24: la aceptación dada en el pedido/registro se conserva: tras registrarse la casilla queda marcada y el envío automático sigue sin pedir aceptar otra vez */
 await page.waitForFunction(()=>window.__escr.some(e=>e.col==='tienda_pedidos'),null,{timeout:15000}).catch(()=>{});
 chk('Fase 24 · tras el registro NO se vuelve a pedir aceptar las políticas: el pedido se envía solo, con la aceptación registrada',trasReg.peds===1||await page.evaluate(()=>window.__escr.filter(e=>e.col==='tienda_pedidos').length)===1,JSON.stringify(trasReg));
 await page.waitForFunction(()=>window.__escr.some(e=>e.col==='tienda_pedidos'),null,{timeout:15000}).catch(()=>{});
 await page.waitForTimeout(800);
 const fin=await page.evaluate(()=>({escr:window.__escr,k:document.querySelector('#shopm').dataset.k,txt:document.querySelector('#shopm').innerText,cart:Object.keys(SH.cart).length,ls:localStorage.getItem(lsk('tj_shop_cart')),cli:JSON.parse(localStorage.getItem(lsk('tj_shop_cli'))||'null'),ords:shopOrdLoad().length,fab:(document.querySelector('.kfab')||{}).textContent||''}));
 const lead=fin.escr.find(e=>e.col==='tienda_leads'),ord=fin.escr.find(e=>e.col==='tienda_pedidos');
 chk('se «escribió» (en el doble) 1 registro de cliente y 1 pedido',fin.escr.length===2&&!!lead&&!!ord,fin.escr.map(e=>e.col).join(', '));
 chk('registro del cliente: nombre, teléfono, correo, empresa y dirección tal como se escribieron',!!lead&&lead.d.name==='Cliente de Prueba'&&lead.d.tel==='6123-4567'&&lead.d.email==='prueba@example.com'&&lead.d.empresa==='Empresa de Prueba'&&lead.d.dir==='Ciudad de Panamá'&&lead.d.imp===false);
 if(ord){const d=ord.d,esp=Object.fromEntries([[p1.pid,12],[p2.pid,7]]);
  chk('pedido: total = suma de cantidad × precio ('+esperado.toFixed(2)+')',cerca(d.total,esperado),String(d.total));
  chk('pedido: 2 líneas con id, nombre, precio y cantidad correctos',d.items.length===2&&d.items.every(i=>esp[i.id]===i.q&&typeof i.n==='string'&&i.n.length>0&&i.p>0),JSON.stringify(d.items.map(i=>[i.id,i.q,i.p])));
  chk('pedido: estado «nuevo», datos del cliente y vínculo con el registro',d.estado==='nuevo'&&d.cid===lead.d.id&&d.lead.name==='Cliente de Prueba'&&d.lead.email==='prueba@example.com');
  chk('pedido: la nota conserva lo escrito (incluso tras pasar por el registro) y añade la constancia de aceptación de la Ley 81',/^Nota de prueba: entregar por la tarde · \[🛡️ Aceptó Términos y Privacidad Ley 81: /.test(d.nota),d.nota);
  chk('pedido: auditoría de términos (ok, versión, fecha ISO)',d.lead.terminos&&d.lead.terminos.ok===true&&/Ley 81/.test(d.lead.terminos.ver)&&!isNaN(Date.parse(d.lead.terminos.fecha)));
  chk('pedido: sin campos extraños (solo los que admiten las reglas)',Object.keys(d).every(k=>['id','cid','lead','items','total','nota','ref','ts','estado','envio'].includes(k)),Object.keys(d).join(','));
 }
 chk('termina en «¡Pedido enviado!» con botones de comprobante',fin.k==='ok'&&/¡Pedido enviado!/.test(fin.txt)&&/Ver comprobante/.test(fin.txt)&&/Descargar PDF/.test(fin.txt)&&/Mis pedidos/.test(fin.txt));
 chk('el carrito queda vacío (memoria, localStorage y botón flotante)',fin.cart===0&&(!fin.ls||fin.ls==='{}')&&fin.fab==='');
 chk('el cliente y su pedido quedan guardados en el navegador',!!fin.cli&&fin.cli.name==='Cliente de Prueba'&&fin.ords===1);
 await page.click('#shopm button:has-text("Mis pedidos")');await page.waitForTimeout(600);
 const acc=await hoja();chk('«Mis pedidos» lista el pedido recién hecho con su total',acc.k==='acc'&&cerca(dinero((acc.txt.match(/\$\s?[\d.,]+/g)||[]).map(dinero).find(v=>cerca(v,esperado))||NaN),esperado)||new RegExp(esperado.toFixed(2).replace('.','\\.')).test(acc.txt),acc.txt.replace(/\s+/g,' ').slice(0,120));
 /* ---------- botón de WhatsApp: enlace y mensaje fijo ---------- */
 const wa=await page.evaluate(()=>{const a=document.getElementById('k_wa');return a&&!a.hidden?{href:a.getAttribute('href'),rel:a.rel,target:a.target}:null});
 if(!wa)console.log('  omitido botón de WhatsApp  [la tienda no tiene WhatsApp configurado]');
 else{const u=new URL(wa.href);
  chk('WhatsApp: enlace https://wa.me/<número>?text=… con el saludo fijo',u.origin==='https://wa.me'&&/^\/\d{8,15}$/.test(u.pathname)&&decodeURIComponent(u.searchParams.get('text'))==='Hola, vi su catálogo virtual de Tarjetería Jhon y quisiera más información.',wa.href.replace(/\d{4}(?=\d{3}$)/,'····'));
  chk('WhatsApp: abre en pestaña nueva sin dar acceso a la ventana (rel noopener)',wa.target==='_blank'&&/noopener/.test(wa.rel),wa.target+' '+wa.rel)}
 /* ---------- cierre ---------- */
 chk('no se pidió ninguna escritura real a Firestore ni a EmailJS (bloqueadas a nivel de red: '+bloqueadas.length+')',bloqueadas.length===0,bloqueadas.join(','));
 const csp=await page.evaluate(()=>window.__csp.length);
 chk('sin errores de JavaScript no capturados',errs.length===0,errs.slice(0,2).join(' | '));
 chk('sin violaciones de la CSP',csp===0,csp+' violaciones');
 await ctx.close();return 0;
}

(async()=>{
 const sv=await servidor();let br,prep=0;
 try{br=await chromium.launch({channel:'chrome',headless:true});for(const v of VPS)prep=Math.max(prep,await correr(br,sv.base,v))}
 catch(e){console.log('ERROR: '+e.message);prep=2}
 finally{if(br)await br.close();sv.parar()}
 console.log('\n'+(total-fallos)+' comprobaciones correctas, '+fallos+' fallidas');
 process.exit(prep===2?2:fallos?1:0);
})();
