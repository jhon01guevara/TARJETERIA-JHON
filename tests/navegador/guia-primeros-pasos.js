/* Guía «Primeros pasos» y ayudas contextuales (js/guia.js) en Chrome real contra la copia de PRUEBA (proyecto tarjeteria-jhon-prueba).
   Usa SOLO una empresa de prueba propia («guia-prueba», que vacía al empezar y al terminar). La guía solo escribe en localStorage: la prueba además
   comprueba que ninguna escritura a Firestore menciona la guía. Producción está bloqueada en la red del navegador.
   Comprueba: tarjeta con 7 pasos y progreso (0 de 7); «Ir» lleva a la pantalla y enfoca el campo; la barra «Siguiente paso» fuera de Inicio; los pasos se
   marcan SOLOS al crear cliente, producto y factura (con aviso a lectores de pantalla); «Omitir»/«Ya lo hice» y «Quitar la marca»; ocultar y volver a abrir (persisten
   al recargar); progreso separado por empresa y por usuario; 7 de 7 → «¡Listo!»; vendedor (pasos según permisos); nunca en la tienda pública; estados vacíos y
   «¿Cómo funciona?» en Clientes, Productos, Facturas, Catálogo, Tienda y Nueva factura; móvil sin desbordes; axe-core en tema claro y nocturno; sin errores ni CSP.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] [PW=/ruta/playwright-core] [AXE=/ruta/axe-core/axe.min.js] node tests/navegador/guia-primeros-pasos.js   (0 bien · 1 falla)
   La copia se hace con: CON_ZIP=1 node tests/navegador/copia-prueba.js /tmp/copia  y se sirve con python3 -m http.server. */
const {chromium}=require(process.env.PW||'playwright-core');
const fs=require('node:fs'),path=require('node:path');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP='guia-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
if(!process.env.PRUEBA_PASSWORD)throw new Error('Falta PRUEBA_PASSWORD');
const PROD=/(projects(\/|%2F)tarjeteria-jhon(\/|%2F|$)|tarjeteria-jhon\.(web\.app|firebaseapp\.com|firebasestorage\.app)|\/b\/tarjeteria-jhon\.|AIzaSyBle5zbvVjXIVXvOz8tgxBBbu8-Ty1Msrs|vencrm\.com|jhon01guevara\.github\.io)/i;
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const tocoProd=[],escriturasGuia=[],errs=[];
const shot=async(p,n,o)=>{if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot(Object.assign({path:path.join(SHOTS,n+'.png')},o||{}))}};
const COLS=['catalogo','panel_public','panel','tienda_items','tienda_leads','tienda_pedidos','chats','vendedores'];
let br;
async function contexto(o){const c=await br.newContext(Object.assign({viewport:{width:1366,height:900},serviceWorkers:'block'},o||{}));
 await c.route(PROD,r=>{tocoProd.push(r.request().url().slice(0,100));r.abort()});await c.route(/api\.emailjs\.com/,r=>r.abort());
 await c.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective));window.print=()=>{}});return c}
async function pagina(c,url){const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message.slice(0,160)));p.on('dialog',d=>d.accept());
 p.on('request',r=>{if(/firestore\.googleapis\.com/.test(r.url())&&r.method()==='POST'){const b=r.postData()||'';if(/tj_guia|guiaCard|guiaPista|primeros pasos/i.test(b))escriturasGuia.push(r.url().slice(-60))}});
 await p.goto(BASE+url,{waitUntil:'load'});return p}
async function entrar(p){await p.waitForSelector('#au_e',{timeout:30000});await p.waitForTimeout(900);
 const id=await p.evaluate(()=>firebase.app().options.projectId);if(id!=='tarjeteria-jhon-prueba')throw new Error('La copia NO apunta a PRUEBA: '+id);
 await p.fill('#au_e','admin.prueba@example.com');await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
 await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(2500);
 await p.waitForFunction(()=>{const e=window.guiaEstado&&guiaEstado();return e&&e.listo},null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(500)}
async function vaciar(sembrar){const c=await contexto(),p=await pagina(c,'?emp='+EMP);
 try{await entrar(p);return await p.evaluate(async([emp,sembrar,cols])=>{let k=0;for(const col of cols){const s=await fbDb.collection('empresas/'+emp+'/'+col).get();for(const d of s.docs){if(col==='panel'&&d.id==='migracion_roles_v1')continue;await d.ref.delete();k++}}
   if(sembrar)await fbDb.collection('empresas').doc(emp).set({id:emp,slug:emp,nombre:'Guía Prueba',logo:'',estado:'activa',ts:Date.now()},{merge:true});
   else await fbDb.collection('empresas').doc(emp).delete();return k},[EMP,sembrar,COLS])}finally{await c.close()}}
const est=p=>p.evaluate(()=>{const e=guiaEstado();return e&&{h:e.hechos,t:e.total,ids:e.items.map(i=>i.p.id),hecho:e.items.filter(i=>i.hecho).map(i=>i.p.id),sig:e.sig&&e.sig.p.id,oculta:e.oculta,listo:e.listo}});
const esperaH=(p,n,ms)=>p.waitForFunction(n=>{const e=window.guiaEstado&&guiaEstado();return e&&e.hechos===n},n,{timeout:ms||9000}).then(()=>true,()=>false);
const guardado=p=>p.evaluate(()=>{const k=Object.keys(localStorage).filter(x=>/^tj_guia_/.test(x));return k.map(x=>[x,JSON.parse(localStorage.getItem(x))])});
(async()=>{
 br=await chromium.launch({channel:'chrome',headless:true});
 console.log('\n== 0) preparación: empresa de PRUEBA «'+EMP+'» vacía ==');
 console.log('  documentos borrados: '+await vaciar(true));
 const c=await contexto(),p=await pagina(c,'?emp='+EMP);await entrar(p);
 console.log('\n== 1) empresa nueva (administrador): tarjeta «Primeros pasos» en Inicio ==');
 let e=await est(p);
 chk('7 pasos para el administrador, 0 hechos, el primero es el siguiente',e&&e.t===7&&e.h===0&&e.sig==='empresa',JSON.stringify(e&&{t:e.t,h:e.h,sig:e.sig}));
 const card=await p.evaluate(()=>{const c=document.getElementById('guiaCard'),pr=c&&c.querySelector('progress');return c&&{t:c.querySelector('h3').textContent,li:c.querySelectorAll('li').length,pr:pr&&[pr.value,pr.max],cnt:c.querySelector('.guia-cnt').textContent,lab:c.getAttribute('aria-labelledby'),sec:c.tagName,botones:[...c.querySelectorAll('button')].every(b=>b.hasAttribute('aria-label')||b.textContent.trim()),prim:c.parentElement===document.getElementById('v')&&c===document.getElementById('v').firstElementChild}});
 chk('título con la marca VEN CRM, 7 pasos, barra 0/7 y contador «0 de 7 pasos»',card&&/VEN CRM/.test(card.t)&&card.li===7&&card.pr[0]===0&&card.pr[1]===7&&card.cnt==='0 de 7 pasos',JSON.stringify(card));
 chk('accesible: <section aria-labelledby>, botones con nombre, es lo primero de Inicio',card&&card.sec==='SECTION'&&card.lab==='guiaT'&&card.botones&&card.prim);
 await shot(p,'1-inicio-escritorio');
 console.log('\n== 2) «Ir» lleva a la pantalla y enfoca el campo; barra «Siguiente paso» fuera de Inicio ==');
 await p.locator('[data-gid="producto"] [data-gbtn="go"]').click();await p.waitForTimeout(900);
 let r=await p.evaluate(()=>({v:vista,foco:document.activeElement&&document.activeElement.id,pista:!document.getElementById('guiaPista').hidden,tx:document.getElementById('guiaPista').innerText}));
 chk('«Crear producto» abre Productos y deja el cursor en «Nombre»',r.v==='prod'&&r.foco==='pn',JSON.stringify({v:r.v,f:r.foco}));
 chk('en Productos la barra dice que está en el lugar correcto y qué hacer',r.pista&&/lugar correcto/.test(r.tx)&&/Agregar/.test(r.tx)&&/paso 2 de 7/.test(r.tx),r.tx.replace(/\s+/g,' ').slice(0,160));
 await shot(p,'2-productos-con-barra');
 await p.evaluate(()=>ir('fac'));await p.waitForTimeout(700);
 r=await p.evaluate(()=>({pista:!document.getElementById('guiaPista').hidden,tx:document.getElementById('guiaPista').innerText,btn:!!document.querySelector('#guiaPista [data-gbtn="go"]')}));
 chk('en otra pantalla la barra lleva al siguiente paso con «Ir ahora»',r.pista&&/Complete los datos de su empresa/.test(r.tx)&&r.btn,r.tx.replace(/\s+/g,' ').slice(0,120));
 await p.locator('#guiaPista [data-gbtn="go"]').click();await p.waitForTimeout(900);
 r=await p.evaluate(()=>({v:vista,foco:document.activeElement&&document.activeElement.id,ed:!!document.getElementById('btnEditCfg')}));
 chk('«Ir ahora» abre Configuración y enfoca «Editar» de Datos de la empresa',r.v==='config'&&r.foco==='btnEditCfg',JSON.stringify(r));
 console.log('\n== 3) los pasos se marcan SOLOS al crear datos ==');
 await p.evaluate(()=>ir('cli'));await p.waitForSelector('#cn');
 chk('Clientes: estado vacío con el siguiente paso y «¿Cómo funciona?» de 2-3 líneas',await p.evaluate(()=>{const v=document.getElementById('v'),d=v.querySelector('details.ayuda'),vac=v.querySelector('.vacio');return !!d&&/¿Cómo funciona\?/.test(d.querySelector('summary').textContent)&&d.querySelector('p').textContent.length<260&&!!vac&&/Aún no hay clientes registrados/.test(vac.innerText)&&/Agregar/.test(vac.innerText)}));
 await p.waitForFunction(()=>typeof _cliBase!=='undefined'&&_cliBase!==null,null,{timeout:30000}).catch(()=>{});
 await shot(p,'3-clientes-vacio-y-ayuda');
 await p.locator('#v details.ayuda summary').click();await p.waitForTimeout(200);
 chk('«¿Cómo funciona?» se abre con el teclado/clic y muestra el texto',await p.evaluate(()=>document.querySelector('#v details.ayuda').open&&document.querySelector('#v details.ayuda p').offsetHeight>0));
 await shot(p,'3b-ayuda-abierta');
 await p.fill('#cn','Cliente Guía');await p.fill('#ct2','6123-4567');await p.click('#v .card:first-of-type button.btn.p:has-text("Agregar")');
 chk('crear un cliente marca «Registre su primer cliente» (1 de 7)',await esperaH(p,1),JSON.stringify(await est(p)));
 chk('aviso para lectores de pantalla («Paso completado…»)',await p.waitForFunction(()=>{const v=document.getElementById('guiaVoz');return !!v&&v.getAttribute('aria-live')==='polite'&&/Paso completado\. Lleva 1 de 7/.test(v.textContent)},null,{timeout:8000}).then(()=>true,()=>false));
 await p.evaluate(()=>ir('prod'));await p.waitForSelector('#pn');
 chk('Productos: estado vacío útil y ayuda',await p.evaluate(()=>{const v=document.getElementById('v');return /Todavía no tiene productos/.test(v.innerText)&&!!v.querySelector('details.ayuda')}));
 await p.fill('#pn','Producto Guía');await p.fill('#pp','10');await p.click('#v .card:first-of-type button.btn.p:has-text("Agregar")');
 chk('crear un producto marca «Cree su primer producto» (2 de 7)',await esperaH(p,2),JSON.stringify(await est(p)));
 await p.evaluate(()=>ir('fac'));await p.waitForTimeout(500);
 chk('Facturas: estado vacío con botón «Hacer mi primera factura» y ayuda',await p.evaluate(()=>{const v=document.getElementById('v');return /Todavía no tiene facturas/.test(v.innerText)&&!!v.querySelector('.vacio button')&&!!v.querySelector('details.ayuda')}));
 await shot(p,'3c-facturas-vacio');
 await p.locator('#v .vacio button').click();await p.waitForSelector('#f_cs');
 chk('«Hacer mi primera factura» abre Nueva factura (con ayuda)',await p.evaluate(()=>vista==='nueva'&&!!document.querySelector('#v details.ayuda')));
 await p.selectOption('#fi tr:first-child select',await p.evaluate(()=>DB.prod[0].id));await p.waitForTimeout(300);
 await p.click('button:has-text("Emitir factura")');await p.waitForTimeout(1200);
 chk('emitir una factura marca «Haga su primera factura» (3 de 7)',await esperaH(p,3),JSON.stringify(await est(p)));
 e=await est(p);chk('los pasos hechos son cliente, producto y venta; el siguiente sigue siendo los datos de la empresa',e.hecho.join()==='producto,cliente,venta'&&e.sig==='empresa',JSON.stringify(e));
 await p.evaluate(()=>ir('cat'));await p.waitForTimeout(1500);
 chk('Catálogo: estado vacío útil y ayuda',await p.evaluate(()=>{const v=document.getElementById('v');return /El catálogo está vacío\. Suba su primer archivo arriba/.test(v.innerText)&&!!v.querySelector('details.ayuda')}));
 await p.evaluate(()=>ir('tienda'));await p.waitForTimeout(2500);
 chk('Tienda: pedidos vacío con el siguiente paso y ayuda',await p.evaluate(()=>{const v=document.getElementById('v');return /Aún no hay pedidos/.test(v.innerText)&&/Comparta el enlace/.test(v.innerText)&&!!v.querySelector('details.ayuda')}));
 console.log('\n== 4) «Omitir», «Ya lo hice», «Quitar la marca», ocultar y volver a abrir (persisten al recargar) ==');
 await p.evaluate(()=>ir('home'));await p.waitForSelector('#guiaCard');
 await p.locator('[data-gid="catalogo"] [data-gbtn="ok"]').click();await p.waitForTimeout(400);
 e=await est(p);chk('«Omitir» (paso opcional) lo cuenta como hecho (4 de 7)',e.h===4&&e.hecho.includes('catalogo'),JSON.stringify(e.hecho));
 let st=await guardado(p);
 chk('el progreso se guarda por empresa y usuario en localStorage (tj_guia_admin_'+EMP+')',st.length===1&&st[0][0]==='tj_guia_admin_'+EMP&&st[0][1].hechos.catalogo===1&&st[0][1].hechos.cliente===2,JSON.stringify(st.map(x=>x[0])));
 await p.locator('[data-gid="catalogo"] [data-gbtn="ok"]').click();await p.waitForTimeout(400);
 e=await est(p);chk('«Quitar la marca» lo devuelve a pendiente (3 de 7)',e.h===3&&!e.hecho.includes('catalogo'),JSON.stringify(e.hecho));
 await p.locator('[data-gid="catalogo"] [data-gbtn="ok"]').click();await p.waitForTimeout(300);
 await p.locator('#guiaOcultar').click();await p.waitForTimeout(400);
 r=await p.evaluate(()=>({card:!!document.getElementById('guiaCard'),min:(document.getElementById('guiaAbrir')||{}).textContent,foco:document.activeElement&&document.activeElement.id}));
 chk('«Ocultar» deja solo el botón «Primeros pasos · 4 de 7» (con el foco ahí)',!r.card&&/4 de 7/.test(r.min)&&r.foco==='guiaAbrir',JSON.stringify(r));
 await shot(p,'4-guia-oculta');
 await p.evaluate(()=>ir('prod'));await p.waitForTimeout(700);
 chk('oculta: la barra «Siguiente paso» tampoco aparece',await p.evaluate(()=>document.getElementById('guiaPista').hidden));
 await p.reload({waitUntil:'load'});await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(1500);await p.evaluate(()=>ir('home'));await p.waitForFunction(()=>window.guiaEstado&&guiaEstado().listo,null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(700);
 r=await p.evaluate(()=>({card:!!document.getElementById('guiaCard'),min:(document.getElementById('guiaAbrir')||{}).textContent}));
 chk('tras recargar sigue oculta (progreso 4 de 7 guardado)',!r.card&&/4 de 7/.test(r.min||''),JSON.stringify(r));
 await p.locator('#guiaAbrir').click();await p.waitForTimeout(500);
 r=await p.evaluate(()=>({card:!!document.getElementById('guiaCard'),foco:document.activeElement&&document.activeElement.id}));
 chk('«Primeros pasos» vuelve a abrir la guía y manda el foco al título',r.card&&r.foco==='guiaT',JSON.stringify(r));
 console.log('\n== 5) completar todo → «¡Listo!»; cerrar; progreso por empresa ==');
 for(const id of ['empresa','tienda','vendedor']){await p.locator('[data-gid="'+id+'"] [data-gbtn="ok"]').click();await p.waitForTimeout(250)}
 e=await est(p);r=await p.evaluate(()=>({fin:(document.querySelector('.guia-fin')||{}).innerText,cerrar:document.getElementById('guiaOcultar').textContent}));
 chk('7 de 7: mensaje «¡Listo!» y botón «Cerrar guía»',e.h===7&&/¡Listo!/.test(r.fin||'')&&r.cerrar==='Cerrar guía',JSON.stringify({h:e.h,c:r.cerrar}));
 await shot(p,'5-guia-completa');
 await p.locator('#guiaOcultar').click();await p.waitForTimeout(300);
 chk('cerrada: el botón dice «completados ✔» y se puede volver a abrir',await p.evaluate(()=>/completados/.test((document.getElementById('guiaAbrir')||{}).textContent||'')));
 const p2=await c.newPage();p2.on('pageerror',x=>errs.push(x.message.slice(0,160)));p2.on('dialog',d=>d.accept());await p2.goto(BASE+'?emp=vacia-prueba',{waitUntil:'load'});
 await p2.waitForSelector('#nav .ni',{state:'attached',timeout:45000}).catch(()=>{});await p2.waitForTimeout(2000);
 await p2.waitForFunction(()=>window.guiaEstado&&guiaEstado()&&guiaEstado().listo,null,{timeout:30000}).catch(()=>{});
 const o2=await p2.evaluate(()=>({e:guiaEstado()&&guiaEstado().hechos,llaves:Object.keys(localStorage).filter(k=>/^tj_guia_/.test(k)),emp:TJEmpresa.empActiva()}));
 chk('otra empresa (vacia-prueba) empieza en 0 con su propia clave: el progreso es por empresa',o2.emp==='vacia-prueba'&&o2.e===0&&o2.llaves.includes('tj_guia_admin_vacia-prueba')&&o2.llaves.includes('tj_guia_admin_'+EMP),JSON.stringify(o2));
 await p2.close();
 console.log('\n== 6) vendedor: solo los pasos de sus permisos ==');
 await p.evaluate(()=>{window.__ses=SES;SES={id:'vend-x',u:{rol:'vend',n:'Vendedor X',panels:['cli','nueva']}}});
 const ev=await p.evaluate(()=>{const e=guiaEstado();return e.items.map(i=>i.p.id).join()});
 chk('con permisos de Clientes y Nueva factura solo ve «cliente» y «venta» (sin datos de empresa ni vendedores)',ev==='cliente,venta',ev);
 await p.evaluate(()=>{SES=window.__ses});
 console.log('\n== 7) móvil 390×844 ==');
 {const cm=await contexto({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),pm=await pagina(cm,'?emp=vacia-prueba');await entrar(pm);
  await pm.evaluate(()=>{const k=Object.keys(localStorage).filter(x=>/^tj_guia_/.test(x));k.forEach(x=>localStorage.removeItem(x))});await pm.reload({waitUntil:'load'});await pm.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await pm.waitForTimeout(1500);
  await pm.waitForFunction(()=>window.guiaEstado&&guiaEstado()&&guiaEstado().listo&&document.getElementById('guiaCard'),null,{timeout:30000}).catch(()=>{});await pm.waitForTimeout(500);
  const m=await pm.evaluate(()=>{const d=document.documentElement,c=document.getElementById('guiaCard'),bs=c?[...c.querySelectorAll('button')].map(b=>b.getBoundingClientRect()):[];return{sw:d.scrollWidth,cw:d.clientWidth,card:!!c,cardW:c&&Math.round(c.getBoundingClientRect().width),minAlto:bs.length?Math.round(Math.min(...bs.map(b=>b.height))):0,fuera:c?[...c.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>d.clientWidth+1).length:0}});
  chk('la tarjeta cabe en pantalla, sin desborde horizontal y con botones ≥ 24 px de alto',m.card&&m.sw<=m.cw+1&&m.fuera===0&&m.minAlto>=24,JSON.stringify(m));
  await shot(pm,'7-movil-inicio');await pm.locator('#guiaCard').scrollIntoViewIfNeeded();await shot(pm,'7b-movil-tarjeta',{fullPage:false});
  await pm.evaluate(()=>ir('cli'));await pm.waitForTimeout(800);
  const pi=await pm.evaluate(()=>({h:document.getElementById('guiaPista').hidden,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
  chk('móvil: la barra «Siguiente paso» se ve y no desborda',!pi.h&&pi.sw<=pi.cw+1,JSON.stringify(pi));await shot(pm,'7c-movil-clientes-barra');
  chk('móvil: sin violaciones de CSP',(await pm.evaluate(()=>window.__csp)).length===0);await cm.close()}
 console.log('\n== 8) tienda pública: nunca aparece la guía ==');
 {const ct=await contexto(),pt=await pagina(ct,'?tienda=1&emp='+EMP);await pt.waitForSelector('#k_footer',{timeout:30000});await pt.waitForTimeout(3000);
  const t=await pt.evaluate(()=>({card:!!document.getElementById('guiaCard'),min:!!document.getElementById('guiaMin'),pista:(document.getElementById('guiaPista')||{hidden:true}).hidden,voz:!!document.getElementById('guiaVoz'),fn:typeof guiaEstado,ayuda:typeof guiaAyuda,html:/Primeros pasos|¿Cómo funciona\?/.test(document.body.innerText)}));
  chk('sin tarjeta, sin botón, sin barra, sin textos de la guía y sin el módulo cargado en la tienda',!t.card&&!t.min&&t.pista&&!t.voz&&t.fn==='undefined'&&t.ayuda==='undefined'&&!t.html,JSON.stringify(t));await ct.close()}
 console.log('\n== 9) accesibilidad (axe-core) en la guía ==');
 let axe=process.env.AXE;
 if(!axe){try{axe=require.resolve('axe-core/axe.min.js',{paths:[path.dirname(require.resolve(process.env.PW||'playwright-core'))+'/..','/workspace/csp13-test/node_modules']})}catch(x){}}
 if(axe&&fs.existsSync(axe)){
  const src=fs.readFileSync(axe,'utf8');
  for(const [nom,tema,vp,mob] of [['escritorio claro','claro',{width:1366,height:900},false],['escritorio nocturno','nocturno',{width:1366,height:900},false],['móvil claro','claro',{width:390,height:844},true],['móvil nocturno','nocturno',{width:390,height:844},true]]){
   const ca=await contexto({viewport:vp,isMobile:mob,hasTouch:mob}),pa=await pagina(ca,'?emp=vacia-prueba');await entrar(pa);
   await pa.evaluate(t=>{Object.keys(localStorage).filter(x=>/^tj_guia_/.test(x)).forEach(x=>localStorage.removeItem(x));aplicarTema(t,false)},tema);await pa.reload({waitUntil:'load'});await pa.waitForSelector('#nav .ni',{state:'attached',timeout:45000});
   await pa.evaluate(t=>aplicarTema(t,false),tema);await pa.waitForFunction(()=>window.guiaEstado&&guiaEstado()&&guiaEstado().listo&&document.getElementById('guiaCard'),null,{timeout:30000}).catch(()=>{});await pa.waitForTimeout(600);
   await pa.evaluate(src);
   const v1=await pa.evaluate(async()=>{const r=await axe.run({include:[['#guiaCard']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});return r.violations.map(v=>v.id+' ('+v.nodes.length+')'+v.nodes.slice(0,2).map(n=>' '+n.target.join(' ')+': '+(n.any[0]||n.all[0]||{}).message).join(' |'))});
   await pa.evaluate(()=>ir('cli'));await pa.waitForTimeout(900);
   const v2=await pa.evaluate(async()=>{const r=await axe.run({include:[['#guiaPista'],['#v details.ayuda'],['#v .vacio']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});return r.violations.map(v=>v.id+' ('+v.nodes.length+')'+v.nodes.slice(0,2).map(n=>' '+n.target.join(' ')+': '+(n.any[0]||n.all[0]||{}).message).join(' |'))});
   chk('axe · tarjeta, barra, ayuda y estado vacío · '+nom+': 0 problemas',v1.length===0&&v2.length===0,v1.concat(v2).join(' ;; ').slice(0,400));
   if(nom==='escritorio nocturno')await shot(pa,'9-nocturno-clientes');await ca.close()}
 }else console.log('  (axe-core no encontrado: indique AXE=/ruta/axe.min.js; se omite)');
 chk('sin errores de JavaScript',errs.length===0,errs.slice(0,3).join(' | '));
 chk('sin violaciones de CSP (escritorio)',(await p.evaluate(()=>window.__csp)).length===0);
 chk('la guía no escribió nada en Firestore (solo localStorage)',escriturasGuia.length===0,escriturasGuia.join(','));
 chk('ninguna petición a producción (bloqueadas: '+tocoProd.length+')',tocoProd.length===0,tocoProd.join(' '));
 await c.close();
 console.log('\n== limpieza ==');console.log('  documentos de prueba borrados: '+await vaciar(false));
 await br.close();
 console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})().catch(async e=>{console.error('ERROR: '+e.message);try{if(br)await br.close()}catch(x){}process.exit(2)});
