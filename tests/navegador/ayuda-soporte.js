/* Pantalla «Ayuda y soporte» (js/ayuda.js) en Chrome real contra la copia de PRUEBA (proyecto tarjeteria-jhon-prueba).
   Usa SOLO una empresa de prueba propia («ayuda-prueba», vacía al empezar y al terminar). Producción bloqueada en la red del navegador.
   Comprueba: entrada «Ayuda y soporte» en el menú; tarjeta de la guía; 12 preguntas (administrador) con botones «Ir a…» que funcionan; contacto de la empresa (de «Datos de la empresa»);
   soporte de VEN CRM: sin canal por defecto (no se inventa nada) y con canales válidos/inválidos simulados; datos para soporte + copiar; botón desde la tarjeta «Primeros pasos»;
   vendedor (solo sus preguntas); tienda pública sin ayuda; SOLO LECTURA (0 escrituras a Firestore); axe-core claro/nocturno; móvil sin desbordes y con la entrada alcanzable; sin errores ni CSP.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] [PW=/ruta/playwright-core] [AXE=/ruta/axe.min.js] node tests/navegador/ayuda-soporte.js   (0 bien · 1 falla)
   La copia: CON_ZIP=1 node tests/navegador/copia-prueba.js /tmp/copia  y  python3 -m http.server PUERTO --bind 127.0.0.1 (dentro de esa carpeta). */
const {chromium}=require(process.env.PW||'playwright-core');
const fs=require('node:fs'),path=require('node:path');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP='ayuda-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
if(!process.env.PRUEBA_PASSWORD)throw new Error('Falta PRUEBA_PASSWORD');
const AXE=process.env.AXE||path.join(path.dirname(process.env.PW||''),'axe-core','axe.min.js');
const PROD=/(projects(\/|%2F)tarjeteria-jhon(\/|%2F|$)|tarjeteria-jhon\.(web\.app|firebaseapp\.com|firebasestorage\.app)|\/b\/tarjeteria-jhon\.|AIzaSyBle5zbvVjXIVXvOz8tgxBBbu8-Ty1Msrs|vencrm\.com|jhon01guevara\.github\.io)/i;
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const tocoProd=[],errs=[];
const shot=async(p,n,o)=>{if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot(Object.assign({path:path.join(SHOTS,n+'.png')},o||{}))}};
const COLS=['catalogo','panel_public','panel','tienda_items','tienda_leads','tienda_pedidos','chats','vendedores'];
let br;
async function contexto(o){const c=await br.newContext(Object.assign({viewport:{width:1366,height:900},serviceWorkers:'block'},o||{}));
 await c.route(PROD,r=>{tocoProd.push(r.request().url().slice(0,100));r.abort()});await c.route(/api\.emailjs\.com/,r=>r.abort());
 await c.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective));window.print=()=>{}});return c}
async function pagina(c,url){const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message.slice(0,160)));p.on('dialog',d=>d.accept());await p.goto(BASE+url,{waitUntil:'load'});return p}
async function entrar(p){await p.waitForSelector('#au_e',{timeout:30000});await p.waitForTimeout(900);
 const id=await p.evaluate(()=>firebase.app().options.projectId);if(id!=='tarjeteria-jhon-prueba')throw new Error('La copia NO apunta a PRUEBA: '+id);
 await p.fill('#au_e','admin.prueba@example.com');await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
 await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(2500);
 await p.waitForFunction(()=>{const e=window.guiaEstado&&guiaEstado();return e&&e.listo},null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(500)}
async function vaciar(sembrar){const c=await contexto(),p=await pagina(c,'?emp='+EMP);
 try{await entrar(p);return await p.evaluate(async([emp,sembrar,cols])=>{let k=0;for(const col of cols){const s=await fbDb.collection('empresas/'+emp+'/'+col).get();for(const d of s.docs){if(col==='panel'&&d.id==='migracion_roles_v1')continue;await d.ref.delete();k++}}
   if(sembrar)await fbDb.collection('empresas').doc(emp).set({id:emp,slug:emp,nombre:'Ayuda Prueba',logo:'',estado:'activa',ts:Date.now()},{merge:true});
   else await fbDb.collection('empresas').doc(emp).delete();return k},[EMP,sembrar,COLS])}finally{await c.close()}}
const ayuda=async p=>{await p.evaluate(()=>ir('ayuda'));await p.waitForSelector('#ayFaq',{timeout:10000});await p.waitForTimeout(250)};
const vista=p=>p.evaluate(()=>vista);
(async()=>{
 br=await chromium.launch({channel:'chrome',headless:true});
 console.log('\n== 0) preparación: empresa de PRUEBA «'+EMP+'» vacía ==');
 console.log('  documentos borrados: '+await vaciar(true));
 const c=await contexto({permissions:['clipboard-read','clipboard-write']}),p=await pagina(c,'?emp='+EMP);await entrar(p);
 await p.evaluate(()=>{window.__w=0;const F=firebase.firestore;for(const [o,ms] of [[F.DocumentReference.prototype,['set','update','delete']],[F.CollectionReference.prototype,['add']],[F.WriteBatch.prototype,['commit']]])ms.forEach(m=>{const f=o[m];o[m]=function(){window.__w++;return f.apply(this,arguments)}});const FP=Object.getPrototypeOf(fbDb),f2=FP.runTransaction;FP.runTransaction=function(){window.__w++;return f2.apply(this,arguments)}});

 console.log('\n== 1) administrador: entrada en el menú y pantalla ==');
 const item=await p.evaluate(()=>{const n=document.querySelector('#nav .ni[data-k="ayuda"]'),n2=document.querySelector('#nav2 .ni[data-k="ayuda"]');return{lat:n&&n.innerText.trim(),inf:!!n2,grupo:n&&(()=>{let e=n.previousElementSibling;while(e&&!e.classList.contains('ug'))e=e.previousElementSibling;return e&&e.textContent})()}});
 chk('«Ayuda y soporte» está en el menú lateral (grupo «Más») y en la barra inferior',/Ayuda y soporte/.test(item.lat||'')&&item.inf&&item.grupo==='Más',JSON.stringify(item));
 await p.click('#nav .ni[data-k="ayuda"]');await p.waitForSelector('#ayFaq');await p.waitForTimeout(300);
 let r=await p.evaluate(()=>({v:vista,tt:document.getElementById('tt').textContent,h:document.querySelector('#v h3').textContent,preg:document.querySelectorAll('#ayFaq details.ay-q').length,cards:[...document.querySelectorAll('#v > .card')].map(x=>x.id||x.className.replace('card ','')),guia:!!document.getElementById('ayGuia')}));
 chk('al tocarla abre la pantalla con título, guía, 12 preguntas y contacto',r.v==='ayuda'&&r.tt==='Ayuda y soporte'&&/Ayuda y soporte/.test(r.h)&&r.preg===12&&r.guia&&r.cards.join()==='ay-cab,ayGuia,ayFaq,ayContacto',JSON.stringify(r));
 await shot(p,'1-ayuda-escritorio',{fullPage:false});
 chk('la barra «Siguiente paso» de la guía sigue funcionando en esta pantalla',await p.evaluate(()=>!document.getElementById('guiaPista').hidden));

 console.log('\n== 2) guía y preguntas frecuentes ==');
 chk('tarjeta «Primeros pasos» con el avance (0 de 7)',/Lleva 0 de 7 pasos/.test(await p.textContent('#ayGuia')));
 await p.click('#ayGuia button');await p.waitForTimeout(700);
 chk('«Continuar la guía» lleva a Inicio con la tarjeta de pasos abierta',await p.evaluate(()=>vista==='home'&&!!document.getElementById('guiaCard')));
 chk('la tarjeta de Inicio tiene el botón «Ayuda y soporte» y lo abre',await (async()=>{await p.click('#guiaAyuda');await p.waitForSelector('#ayFaq');return (await vista(p))==='ayuda'})());
 await p.click('#ayFaq details[data-faq="factura"] summary');
 chk('una pregunta se abre con un toque y muestra su respuesta corta',await p.evaluate(()=>{const d=document.querySelector('details[data-faq="factura"]');return d.open&&/Emitir factura/.test(d.querySelector('p').textContent)&&d.querySelector('p').offsetHeight>0}));
 await shot(p,'2-pregunta-abierta');
 await p.click('#ayFaq details[data-faq="factura"] .ay-bt button');await p.waitForTimeout(500);
 chk('«Ir a Nueva factura» lleva a esa pantalla',(await vista(p))==='nueva');
 await ayuda(p);await p.click('#ayFaq details[data-faq="datos"] summary');await p.click('#ayFaq details[data-faq="datos"] .ay-bt button');await p.waitForTimeout(700);
 chk('«Ir a Datos de la empresa» abre Configuración y enfoca «Editar»',await p.evaluate(()=>vista==='config'&&document.activeElement&&document.activeElement.id==='btnEditCfg'));
 await ayuda(p);await p.click('#ayFaq details[data-faq="copia"] summary');await p.click('#ayFaq details[data-faq="copia"] .ay-bt button');await p.waitForTimeout(900);
 chk('«Ir a Exportar mis datos» abre Configuración → General con la tarjeta de exportación desplegada',await p.evaluate(()=>vista==='config'&&!!document.getElementById('exportCard')&&document.getElementById('body_exportCard').style.display!=='none'));
 await ayuda(p);
 for(const id of ['cliente','producto','anular','tienda','vendedor']){const ok=await p.evaluate(id=>{const d=document.querySelector('details[data-faq="'+id+'"]');return !!d&&!!d.querySelector('.ay-bt button')},id);chk('pregunta «'+id+'» con botón «Ir a…»',ok)}
 chk('todas las preguntas del administrador están y cada una tiene respuesta',await p.evaluate(()=>[...document.querySelectorAll('#ayFaq details')].every(d=>d.querySelector('summary').textContent.length>5&&d.querySelector('p').textContent.length>40)));

 console.log('\n== 3) contacto: empresa y soporte de VEN CRM (nada inventado) ==');
 let ct=await p.evaluate(()=>({emp:!!document.getElementById('ayEmpresa'),sop:document.getElementById('aySoporte').innerText.replace(/\s+/g,' '),botones:[...document.querySelectorAll('#aySoporte a')].length,mails:(document.getElementById('ayContacto').innerHTML.match(/mailto:[^"]+/g)||[])}));
 chk('sin datos de empresa no hay bloque «Su empresa»; sin configurar, el soporte de VEN CRM lo dice y no muestra botones ni correos',!ct.emp&&/Todavía no hay un canal de soporte público activo/.test(ct.sop)&&ct.botones===0&&ct.mails.length===0,ct.sop.slice(0,150));
 await p.locator('#ayContacto').scrollIntoViewIfNeeded();await shot(p,'3a-contacto-sin-configurar',{fullPage:false});
 await p.evaluate(()=>{DB.cfg.tel='6123-4567';DB.cfg.email='contacto@miempresa.com';ayudaRender()});
 ct=await p.evaluate(()=>({txt:document.getElementById('ayEmpresa').innerText.replace(/\s+/g,' '),hrefs:[...document.querySelectorAll('#ayEmpresa a')].map(a=>a.getAttribute('href'))}));
 chk('con teléfono y correo en «Datos de la empresa» salen WhatsApp (con 507), Llamar y correo',ct.hrefs.some(h=>/^https:\/\/wa\.me\/50761234567\?text=/.test(h))&&ct.hrefs.includes('tel:6123-4567'.replace('-',''))&&ct.hrefs.includes('mailto:contacto@miempresa.com'),ct.hrefs.join(' | '));
 chk('los enlaces externos abren aparte y sin referencia (noopener)',await p.evaluate(()=>[...document.querySelectorAll('#ayContacto a[target]')].every(a=>/noopener/.test(a.rel))));
 await p.evaluate(()=>{window.VEN_SOPORTE={whatsapp:'+507 6000-0000',correo:'soporte@ejemplo.test',horario:'Lunes a viernes, 8 a. m. a 5 p. m.'};ayudaRender()});
 ct=await p.evaluate(()=>({sop:document.getElementById('aySoporte').innerText.replace(/\s+/g,' '),hrefs:[...document.querySelectorAll('#aySoporte a')].map(a=>a.getAttribute('href'))}));
 chk('con canales configurados (simulados en la prueba) salen WhatsApp, correo y horario',ct.hrefs.length===2&&/^https:\/\/wa\.me\/50760000000\?text=/.test(ct.hrefs[0])&&/^mailto:soporte@ejemplo\.test/.test(ct.hrefs[1])&&/Lunes a viernes/.test(ct.sop)&&!/Todavía no hay un canal/.test(ct.sop),ct.hrefs.join(' | '));
 await p.locator('#ayContacto').scrollIntoViewIfNeeded();await shot(p,'3b-contacto-configurado',{fullPage:false});
 await p.evaluate(()=>{window.VEN_SOPORTE={whatsapp:'12',correo:'no-es-correo',horario:''};ayudaRender()});
 chk('valores inválidos no se muestran',await p.evaluate(()=>document.querySelectorAll('#aySoporte a').length===0&&/Todavía no hay un canal/.test(document.getElementById('aySoporte').innerText)));
 await p.evaluate(()=>{window.VEN_SOPORTE={whatsapp:'',correo:'',horario:''};DB.cfg.tel='';DB.cfg.email='';ayudaRender()});
 await p.click('#ayDatos summary');await p.waitForTimeout(150);
 const datos=await p.inputValue('#ay_datos');
 chk('«Datos para soporte»: empresa, usuario, pantalla, navegador y fecha; sin contraseñas ni datos de clientes',/^VEN CRM · datos para soporte\nEmpresa: ayuda-prueba/.test(datos)&&/Usuario: Administrador/.test(datos)&&/Navegador: Mozilla/.test(datos)&&/Fecha y hora:/.test(datos)&&!/contraseñ|password|@/i.test(datos),datos.split('\n').slice(0,4).join(' / '));
 await p.click('#ayDatos .ay-bt button');await p.waitForTimeout(400);
 const clip=await p.evaluate(()=>navigator.clipboard.readText());
 chk('«Copiar datos» deja el texto en el portapapeles y lo confirma',clip===datos&&/Copiado/.test(await p.textContent('#ay_msg')));
 await shot(p,'3c-datos-para-soporte');

 console.log('\n== 4) solo lectura y limpieza ==');
 chk('SOLO LECTURA: ninguna escritura ni borrado a Firestore al usar la ayuda',await p.evaluate(()=>window.__w)===0);
 chk('sin errores de página ni violaciones CSP',!errs.length&&await p.evaluate(()=>window.__csp.length)===0,errs.join('|'));

 console.log('\n== 5) vendedor (permisos Clientes y Nueva factura) ==');
 await p.evaluate(()=>{window.__ses=SES;SES={id:'vend-x',u:{rol:'vend',n:'Vendedor X',panels:['cli','nueva']}};nav()});
 chk('el vendedor ve la entrada «Ayuda y soporte» en su menú',await p.evaluate(()=>!!document.querySelector('#nav .ni[data-k="ayuda"]')&&puede('ayuda')&&!puede('config')&&!puede('vend')));
 await p.evaluate(()=>ir('ayuda'));await p.waitForSelector('#ayFaq');
 const fv=await p.evaluate(()=>({ids:[...document.querySelectorAll('#ayFaq details')].map(d=>d.dataset.faq),vista:vista,rol:document.getElementById('ay_datos').value.match(/Usuario: (.*)/)[1],exp:/Exportar/.test(document.getElementById('v').innerText)}));
 chk('solo ve las preguntas que le corresponden (sin anular, vendedores, copias ni pantallas sin permiso)',fv.vista==='ayuda'&&fv.ids.join()==='factura,cliente,instalar,clave,vieja,seguro'&&!fv.exp&&fv.rol==='Vendedor',JSON.stringify(fv));
 await p.evaluate(()=>{SES=window.__ses;nav()});
 await c.close();

 console.log('\n== 6) tienda pública: sin ayuda del panel ==');
 {const cs=await contexto(),ps=await pagina(cs,'?tienda=1&emp='+EMP);await ps.waitForTimeout(4000);
  chk('la tienda no carga la pantalla ni el menú de ayuda',await ps.evaluate(()=>typeof window.ayudaRender==='undefined'&&!document.querySelector('[data-k="ayuda"]')&&!/Ayuda y soporte/.test(document.getElementById('shop')?document.getElementById('shop').innerText:'')));
  await cs.close()}

 console.log('\n== 7) accesibilidad (axe-core) y móvil ==');
 const c2=await contexto({viewport:{width:1366,height:900}}),p2=await pagina(c2,'?emp='+EMP);await entrar(p2);await ayuda(p2);
 if(fs.existsSync(AXE)){await p2.evaluate(fs.readFileSync(AXE,'utf8'));
  for(const tema of ['claro','nocturno']){await p2.evaluate(t=>{aplicarTema(t,false)},tema);await p2.waitForTimeout(250);
   const r=await p2.evaluate(async()=>{const x=await axe.run({include:[['#v']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}});return x.violations.filter(v=>v.id!=='region').map(v=>v.id+'×'+v.nodes.length+' '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(','))});
   chk('axe-core en tema '+tema+': 0 violaciones en la pantalla de ayuda',r.length===0,r.join(' | '))}
  await p2.evaluate(()=>aplicarTema('claro',false))}else console.log('  (axe-core no encontrado: se omite)');
 await c2.close();
 {const cm=await contexto({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),pm=await pagina(cm,'?emp='+EMP);await entrar(pm);
  const n=await pm.evaluate(()=>{const bn=document.getElementById('nav2'),it=bn.querySelector('.ni[data-k="ayuda"]');return{hay:!!it,scroll:bn.scrollWidth>bn.clientWidth}});
  await pm.evaluate(()=>{const it=document.querySelector('#nav2 .ni[data-k="ayuda"]');if(it)it.scrollIntoView({inline:'center'})});await pm.waitForTimeout(200);
  await pm.evaluate(()=>{document.querySelector('#nav2 .ni[data-k="ayuda"]').click()});await pm.waitForSelector('#ayFaq');await pm.waitForTimeout(300);
  const m=await pm.evaluate(()=>{const d=document.documentElement,v=document.getElementById('v'),bs=[...v.querySelectorAll('button,a.btn,summary')].map(b=>b.getBoundingClientRect());return{sw:d.scrollWidth,cw:d.clientWidth,fuera:[...v.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>d.clientWidth+1).length,minAlto:Math.round(Math.min(...bs.map(b=>b.height))),vista:vista}});
  chk('móvil 390×844: la entrada es alcanzable en la barra inferior y la pantalla cabe sin desborde horizontal (controles ≥ 24 px)',n.hay&&m.vista==='ayuda'&&m.sw<=m.cw+1&&m.fuera===0&&m.minAlto>=24,JSON.stringify({n,m}));
  await shot(pm,'7-movil');await pm.click('#ayFaq details[data-faq="instalar"] summary');await pm.locator('#ayFaq details[data-faq="instalar"]').scrollIntoViewIfNeeded();await shot(pm,'7b-movil-pregunta');await cm.close()}

 console.log('\n== 8) limpieza ==');
 console.log('  documentos borrados: '+await vaciar(false));
 chk('nunca se tocó producción',tocoProd.length===0,tocoProd.slice(0,3).join(' | '));
 await br.close();
 console.log(fallos?'\nFALLAN '+fallos+' comprobaciones':'\nTODO BIEN');process.exit(fallos?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
