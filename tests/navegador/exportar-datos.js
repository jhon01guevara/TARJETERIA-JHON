/* Exportar los datos de la empresa (js/exportar-datos.js) en Chrome real contra la copia de PRUEBA (proyecto tarjeteria-jhon-prueba).
   Usa SOLO una empresa de prueba propia («export-prueba»: se vacía al empezar y al terminar). Producción está bloqueada en la red del navegador.
   Comprueba: tarjeta en Configuración → General solo para el administrador, con conteos reales; cada descarga (5 CSV, ZIP y JSON) con el contenido esperado (tildes, comillas, fórmulas neutralizadas,
   pedidos de la tienda leídos de la nube); SOLO LECTURA (ninguna escritura/borrado a Firestore durante las descargas y los documentos quedan idénticos); un vendedor no ve la tarjeta ni puede descargar;
   empresa vacía → archivos solo con encabezados; móvil sin desbordes; axe-core; sin errores ni violaciones CSP.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] [PW=/ruta/playwright-core] [AXE=/ruta/axe.min.js] node tests/navegador/exportar-datos.js   (0 bien · 1 falla)
   La copia se hace con: CON_ZIP=1 node tests/navegador/copia-prueba.js /tmp/copia  y se sirve con python3 -m http.server. */
const {chromium}=require(process.env.PW||'playwright-core');
const fs=require('node:fs'),path=require('node:path');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP='export-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
if(!process.env.PRUEBA_PASSWORD)throw new Error('Falta PRUEBA_PASSWORD');
const AXE=process.env.AXE||path.join(path.dirname(process.env.PW||''),'axe-core','axe.min.js');
const PROD=/(projects(\/|%2F)tarjeteria-jhon(\/|%2F|$)|tarjeteria-jhon\.(web\.app|firebaseapp\.com|firebasestorage\.app)|\/b\/tarjeteria-jhon\.|AIzaSyBle5zbvVjXIVXvOz8tgxBBbu8-Ty1Msrs|vencrm\.com|jhon01guevara\.github\.io)/i;
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const tocoProd=[],errs=[];
const shot=async(p,n,o)=>{if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot(Object.assign({path:path.join(SHOTS,n+'.png')},o||{}))}};
const shotEl=async(p,n)=>{if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.locator('#exportCard').scrollIntoViewIfNeeded();await p.waitForTimeout(200);await p.screenshot({path:path.join(SHOTS,n+'.png')})}};
const COLS=['catalogo','panel_public','panel','tienda_items','tienda_leads','tienda_pedidos','chats','vendedores'];
let br;
async function contexto(o){const c=await br.newContext(Object.assign({viewport:{width:1366,height:900},serviceWorkers:'block',acceptDownloads:true},o||{}));
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
   if(sembrar)await fbDb.collection('empresas').doc(emp).set({id:emp,slug:emp,nombre:'Exportación Prueba',logo:'',estado:'activa',ts:Date.now()},{merge:true});
   else await fbDb.collection('empresas').doc(emp).delete();return k},[EMP,sembrar,COLS])}finally{await c.close()}}
const irConfig=async p=>{await p.evaluate(()=>{ir('config');if(typeof cfgTab==='function')cfgTab('gen')});await p.waitForSelector('#exportCard',{timeout:15000});await p.evaluate(()=>{if(!cardState.exportCard)toggleCard('exportCard')});await p.waitForSelector('#exportCard button[aria-label^="Descargar"]',{state:'visible'})};
async function bajar(p,boton){const [d]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.click(boton)]);const f=await d.path();return{nombre:d.suggestedFilename(),buf:fs.readFileSync(f)}}
const lineas=b=>b.toString('utf8').replace(/^\ufeff/,'').trim().split('\r\n');
(async()=>{
 br=await chromium.launch({channel:'chrome',headless:true});
 console.log('\n== 0) preparación: empresa de PRUEBA «'+EMP+'» vacía ==');
 console.log('  documentos borrados: '+await vaciar(true));
 const c=await contexto(),p=await pagina(c,'?emp='+EMP);await entrar(p);

 console.log('\n== 1) empresa vacía: la tarjeta existe y los archivos salen solo con encabezados ==');
 await p.evaluate(()=>{ir('config');cfgTab('gen')});await p.waitForSelector('#exportCard',{timeout:15000});
 const plegada=await p.evaluate(()=>{const c=document.getElementById('exportCard'),b=document.getElementById('body_exportCard');return{minimizada:b&&b.style.display==='none',antes:c.previousElementSibling&&c.previousElementSibling.id,desp:c.nextElementSibling&&c.nextElementSibling.id}});
 chk('la tarjeta aparece minimizada como las demás de Configuración, junto a «Copia de seguridad»',plegada.minimizada&&plegada.desp==='bkCard',JSON.stringify(plegada));
 await p.evaluate(()=>{ir('home')});await p.waitForTimeout(400);await p.evaluate(()=>expIr());await p.waitForTimeout(800);
 chk('expIr() (enlace de la Ayuda) abre Configuración → General, despliega la tarjeta y enfoca el primer botón',await p.evaluate(()=>vista==='config'&&!!cardState.exportCard&&document.getElementById('body_exportCard').style.display!=='none'&&/Descargar/.test(document.activeElement.getAttribute('aria-label')||'')));
 let t=await p.evaluate(()=>{const c=document.getElementById('exportCard');return{h:c.querySelector('h3').textContent,txt:c.innerText.replace(/\s+/g,' '),botones:[...c.querySelectorAll('button[aria-label^="Descargar"]')].map(b=>b.getAttribute('aria-label')||b.textContent.trim()),sinNombre:[...c.querySelectorAll('button[aria-label^="Descargar"]')].filter(b=>!(b.getAttribute('aria-label')||b.textContent.trim())).length,padre:c.parentElement.id,visible:c.offsetHeight>0,nombre:nombreNegocio()}});
 chk('tarjeta «Exportar los datos de mi empresa» en Configuración → General, con la empresa activa y la promesa «no se borra ni se cambia nada»',t.h.includes('Exportar los datos de mi empresa')&&t.padre==='cfgGenExtra'&&t.visible&&t.txt.includes('de '+t.nombre)&&/no se borra ni se cambia nada/.test(t.txt),t.txt.slice(0,140));
 chk('7 botones (5 CSV, ZIP y JSON), todos con nombre accesible',t.botones.length===7&&t.sinNombre===0,t.botones.join(' | '));
 chk('conteos en cero',/0<\/b>|Ahora tiene: 0 clientes · 0 productos · 0 facturas · 0 pedidos/.test(await p.evaluate(()=>document.getElementById('exp_cnt').innerHTML))||/Ahora tiene: 0 clientes · 0 productos · 0 facturas · 0 pedidos/.test(t.txt),t.txt.slice(t.txt.indexOf('Ahora tiene'),t.txt.indexOf('Ahora tiene')+80));
 await shotEl(p,'1-tarjeta-vacia');
 let d=await bajar(p,'#exportCard button[aria-label="Descargar clientes en CSV"]');
 chk('clientes vacío: nombre ven-crm_export-prueba_<fecha>_clientes.csv y solo el encabezado',/^ven-crm_export-prueba_\d{4}-\d\d-\d\d_clientes\.csv$/.test(d.nombre)&&lineas(d.buf).length===1&&d.buf.slice(0,3).equals(Buffer.from([0xEF,0xBB,0xBF])),d.nombre+' '+lineas(d.buf)[0]);
 chk('mensaje de confirmación sin cambios',/Se descargó el archivo \(0 filas\)\. No se cambió nada/.test(await p.textContent('#exp_msg')));

 console.log('\n== 2) con datos (clientes, productos, facturas y un pedido de la tienda) ==');
 await p.evaluate(async()=>{
  DB.cli.push({id:'c1',n:'Ana "La Jefa", Ñandú',r:'8-123-456',t:'+507 6123-4567',d:'Calle 1',m:'ana@example.com'},{id:'c2',n:'=HYPERLINK("http://x","y")',r:'',t:'',d:''});
  DB.prod.push({id:'p1',n:'Tarjeta cumpleaños',p:1.3},{id:'p2',n:'Sobre',p:0.5});
  DB.fac.push({id:'f1',n:1,fecha:'2026-10-01',cli:'Ana',ruc:'8-123-456',dir:'X',pago:'Efectivo',items:[{d:'Tarjeta',q:3,p:1.3},{d:'Sobre',q:1,p:0.5}],sub:4.4,ds:0.4,itbms:0.28,itbmsp:7,total:4.28,nota:'Entregar, viernes'},
   {id:'f2',n:2,fecha:'2026-10-02',cli:'Consumidor final',ruc:'',dir:'',pago:'Yappy',items:[{d:'Sobre',q:2,p:0.5}],sub:1,ds:0,itbms:0.07,itbmsp:7,total:1.07,anulada:true});
  save();
  await fbDb.collection('empresas/'+TJEmpresa.empActiva()+'/tienda_pedidos').doc('q1').set({id:'q1',cid:'c1',lead:{name:'Luis Pérez',tel:'6000-0000',email:'l@x.com',empresa:'LL',dir:'Av 5'},items:[{id:'p1',n:'Tarjeta cumpleaños',p:1.3,q:2}],total:2.6,nota:'',ref:'admin',ts:Date.now(),estado:'nuevo'});
 });
 await p.waitForTimeout(2500);
 await p.reload({waitUntil:'load'});await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(3000);
 await irConfig(p);
 const cnt=await p.evaluate(()=>document.getElementById('exp_cnt').innerText);
 chk('los conteos reflejan los datos reales',/2 clientes · 2 productos · 2 facturas · 1 pedidos/.test(cnt),cnt);
 await shotEl(p,'2-tarjeta-con-datos');
 // contadores de escritura
 await p.evaluate(()=>{window.__w=0;const F=firebase.firestore;for(const [o,ms] of [[F.DocumentReference.prototype,['set','update','delete']],[F.CollectionReference.prototype,['add']],[F.WriteBatch.prototype,['commit']]])ms.forEach(m=>{const f=o[m];o[m]=function(){window.__w++;return f.apply(this,arguments)}});const FP=Object.getPrototypeOf(fbDb),f2=FP.runTransaction;FP.runTransaction=function(){window.__w++;return f2.apply(this,arguments)}});
 const antes=await p.evaluate(async()=>{const o={};for(const col of ['panel','panel_public','tienda_pedidos','clientes','vendedores']){try{const s=await fbDb.collection('empresas/'+TJEmpresa.empActiva()+'/'+col).get();o[col]=s.docs.map(x=>x.id+':'+JSON.stringify(x.data()).length).sort().join()}catch(e){o[col]='x'}}return o});
 const sel=n=>'#exportCard button[aria-label="'+n+'"]';
 d=await bajar(p,sel('Descargar clientes en CSV'));let L=lineas(d.buf);
 chk('clientes.csv: 3 líneas, comillas bien escapadas, tildes, teléfono intacto y la fórmula neutralizada',L.length===3&&L[1].includes('"Ana ""La Jefa"", Ñandú"')&&L[1].includes('+507 6123-4567')&&L[2].includes("'=HYPERLINK"),L.slice(1).join(' // ').slice(0,200));
 d=await bajar(p,sel('Descargar productos en CSV'));L=lineas(d.buf);
 chk('productos.csv: 2 productos con su precio',L.length===3&&L[1]==='p1,Tarjeta cumpleaños,1.3'&&L[2]==='p2,Sobre,0.5',L.join(' // '));
 d=await bajar(p,sel('Descargar facturas en CSV'));L=lineas(d.buf);
 chk('facturas.csv: ordenadas, totales, anulada «Sí», nota con coma entre comillas',L.length===3&&/^1,2026-10-01,Ana,.*,4\.4,0\.4,7,0\.28,4\.28,No,,"Entregar, viernes",Tarjeta x3 a 1\.30 \| Sobre x1 a 0\.50$/.test(L[1])&&/^2,2026-10-02,.*Yappy,1,0,7,0\.07,1\.07,Sí/.test(L[2]),L[1].slice(0,160));
 d=await bajar(p,sel('Descargar las líneas de las facturas en CSV'));L=lineas(d.buf);
 chk('lineas-de-facturas.csv: 3 líneas con importe',L.length===4&&L[1]==='1,2026-10-01,Ana,Tarjeta,3,1.3,3.9'&&/\.csv$/.test(d.nombre)&&/lineas-de-facturas/.test(d.nombre),d.nombre+' '+L[1]);
 d=await bajar(p,sel('Descargar pedidos de la tienda en CSV'));L=lineas(d.buf);
 chk('pedidos.csv: el pedido de la tienda (leído de la nube) con cliente, artículos y total',L.length===2&&/^q1,\d{4}-\d\d-\d\d \d\d:\d\d,Nuevo,Luis Pérez,6000-0000,l@x\.com,LL,Av 5,Tarjeta cumpleaños x2 a 1\.30,2\.6,/.test(L[1]),L[1]);
 d=await bajar(p,'#exp_zip');
 const zip=await p.evaluate(async b64=>{const z=await JSZip.loadAsync(b64,{base64:true});const o={};for(const n of Object.keys(z.files))o[n]=(await z.files[n].async('string')).length;return o},d.buf.toString('base64'));
 chk('ZIP: 5 CSV + LEEME.txt, nombre ven-crm_export-prueba_<fecha>_todo-csv.zip',Object.keys(zip).length===6&&/todo-csv\.zip$/.test(d.nombre)&&Object.keys(zip).some(n=>/_clientes\.csv$/.test(n))&&Object.keys(zip).includes('LEEME.txt'),d.nombre+' '+Object.keys(zip).join());
 d=await bajar(p,sel('Descargar todo en un archivo JSON'));
 const j=JSON.parse(d.buf.toString('utf8'));
 chk('JSON: formato, empresa, resumen y los 4 grupos; sin configuración ni accesos',j.formato==='ven-crm-exportacion'&&j.empresa.id===EMP&&j.resumen.clientes===2&&j.resumen.pedidos===1&&j.clientes.length===2&&j.productos.length===2&&j.facturas.length===2&&j.pedidos.length===1&&!('cfg' in j)&&!('usuarios' in j),JSON.stringify(j.resumen));
 chk('SOLO LECTURA: ninguna escritura ni borrado a Firestore durante las 7 descargas',await p.evaluate(()=>window.__w)===0);
 const despues=await p.evaluate(async()=>{const o={};for(const col of ['panel','panel_public','tienda_pedidos','clientes','vendedores']){try{const s=await fbDb.collection('empresas/'+TJEmpresa.empActiva()+'/'+col).get();o[col]=s.docs.map(x=>x.id+':'+JSON.stringify(x.data()).length).sort().join()}catch(e){o[col]='x'}}return o});
 chk('los documentos de la empresa quedaron idénticos (antes = después)',JSON.stringify(antes)===JSON.stringify(despues));
 chk('mensaje de éxito con «No se cambió nada»',/No se cambió nada/.test(await p.textContent('#exp_msg')));

 console.log('\n== 3) permisos: un vendedor no ve la tarjeta ni puede descargar ==');
 await p.evaluate(()=>{window.__ses=SES;SES={id:'vend-x',u:{rol:'vend',n:'Vendedor X',panels:['cli','nueva']}}});
 const bloqueo=await p.evaluate(async()=>{const n0=document.querySelectorAll('a[download]').length;window.__dl=0;const orig=URL.createObjectURL;URL.createObjectURL=function(){window.__dl++;return orig.apply(this,arguments)};
  document.getElementById('exportCard').remove();expMontar();const hay=!!document.getElementById('exportCard');await expDescargar('clientes');await expDescargar('json');URL.createObjectURL=orig;return{hay,dl:window.__dl}});
 chk('con sesión de vendedor la tarjeta no se dibuja y expDescargar no genera ninguna descarga',!bloqueo.hay&&bloqueo.dl===0,JSON.stringify(bloqueo));
 await p.evaluate(()=>{SES=window.__ses;expMontar()});
 chk('sin errores de página ni violaciones CSP',!errs.length&&await p.evaluate(()=>window.__csp.length)===0,errs.join('|'));

 console.log('\n== 4) accesibilidad (axe-core) y móvil ==');
 if(fs.existsSync(AXE)){await p.evaluate(fs.readFileSync(AXE,'utf8'));
  for(const tema of ['claro','nocturno']){await p.evaluate(t=>{aplicarTema(t,false)},tema);await p.waitForTimeout(250);
   const r=await p.evaluate(async()=>{const x=await axe.run({include:[['#exportCard']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}});return x.violations.filter(v=>v.id!=='region').map(v=>v.id+'×'+v.nodes.length)});
   chk('axe-core en tema '+tema+': 0 violaciones en la tarjeta',r.length===0,r.join())}
  await p.evaluate(()=>aplicarTema('claro',false))}else console.log('  (axe-core no encontrado: se omite)');
 {const cm=await contexto({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),pm=await pagina(cm,'?emp='+EMP);await entrar(pm);await irConfig(pm);
  const m=await pm.evaluate(()=>{const d=document.documentElement,c=document.getElementById('exportCard'),bs=[...c.querySelectorAll('button')].map(b=>b.getBoundingClientRect());return{sw:d.scrollWidth,cw:d.clientWidth,fuera:[...c.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>d.clientWidth+1).length,minAlto:Math.round(Math.min(...bs.map(b=>b.height)))}});
  chk('móvil 390×844: la tarjeta cabe, sin desborde horizontal y con botones ≥ 24 px de alto',m.sw<=m.cw+1&&m.fuera===0&&m.minAlto>=24,JSON.stringify(m));
  await pm.locator('#exportCard').scrollIntoViewIfNeeded();await shot(pm,'4-movil');await cm.close()}
 await c.close();

 console.log('\n== 5) limpieza: se deja la empresa de prueba vacía ==');
 console.log('  documentos borrados: '+await vaciar(false));
 chk('nunca se tocó producción',tocoProd.length===0,tocoProd.slice(0,3).join(' | '));
 await br.close();
 console.log(fallos?'\nFALLAN '+fallos+' comprobaciones':'\nTODO BIEN');process.exit(fallos?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
