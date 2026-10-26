/* Una empresa NUEVA (sin datos) no hereda el catálogo de Tarjetería Jhon: Chrome real contra la copia de PRUEBA (proyecto tarjeteria-jhon-prueba).
   Crea SOLO el registro vacío empresas/vacia-prueba en el proyecto de PRUEBA (sin catálogo, tienda ni panel) y comprueba:
   (1) sin sesión: la base local del catálogo de la empresa queda vacía (antes se le volcaban los 88 modelos de catalogo_default.zip);
   (2) con sesión de administrador: Catálogo, Productos, Inicio (barra «Modelos»), Check y Tienda (pestaña del panel) no ofrecen modelos de Tarjetería,
       y Firestore empresas/vacia-prueba/catalogo sigue vacío (no se sube nada);
   (3) la tienda pública ?tienda=1&emp=vacia-prueba muestra el estado vacío neutro, sin modelos, categorías ni carrusel;
   (4) el carrito/pedido no ofrece nada; (5) la empresa INICIAL conserva su catálogo de fábrica (88 modelos).
   La copia debe llevar catalogo_default.zip como GitHub Pages: CON_ZIP=1 node tests/navegador/copia-prueba.js /tmp/copia.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/catalogo-vacio.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP=process.env.EMP||'vacia-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const idbCount=(page,name)=>page.evaluate(n=>new Promise(r=>{const q=indexedDB.open(n,1);q.onupgradeneeded=()=>q.result.createObjectStore('f',{keyPath:'id'});q.onsuccess=()=>{const db=q.result,c=db.transaction('f').objectStore('f').count();c.onsuccess=()=>{db.close();r(c.result)}};q.onerror=()=>r(-1)}),name);
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const nuevo=async()=>{const c=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'});return c};
 console.log('\n== 0) reinicio de la empresa de PRUEBA «'+EMP+'» (solo en el proyecto de PRUEBA): registro vacío y sin datos ==');
 {const c0=await nuevo(),p0=await c0.newPage();
  await p0.goto(BASE+'?emp='+EMP,{waitUntil:'load'});await p0.waitForSelector('#au_e',{timeout:25000});await p0.waitForTimeout(1200);
  await p0.fill('#au_e','admin.prueba@example.com');await p0.fill('#au_p',process.env.PRUEBA_PASSWORD);await p0.click('text=Entrar');
  await p0.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p0.waitForTimeout(2500);
  const r0=await p0.evaluate(async(emp)=>{if(!/tarjeteria-jhon-prueba/.test(JSON.stringify(firebase.app().options)))throw new Error('NO ES PRUEBA');
   const base='empresas/'+emp;let n=0;
   for(const col of ['catalogo','panel_public','panel','tienda_items']){const s=await fbDb.collection(base+'/'+col).get();for(const d of s.docs){if(col==='panel'&&d.id==='migracion_roles_v1')continue;await d.ref.delete();n++}}
   await fbDb.collection('empresas').doc(emp).set({id:emp,slug:emp,nombre:'Vacía Prueba',logo:'',estado:'activa',ts:Date.now()},{merge:true});return n},EMP);
  console.log('  documentos de prueba borrados: '+r0);await c0.close()}
 console.log('\n== 1) sin sesión: base local del catálogo de una empresa nueva ==');
 let c=await nuevo(),p=await c.newPage();
 await p.goto(BASE+'?emp='+EMP,{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:25000});await p.waitForTimeout(9000);
 chk('IndexedDB de la empresa nueva vacía (tj_cat_'+EMP+')',await idbCount(p,'tj_cat_'+EMP)===0,await idbCount(p,'tj_cat_'+EMP));
 chk('no se creó la base de la empresa inicial por error (tj_cat)',await idbCount(p,'tj_cat')===0,await idbCount(p,'tj_cat'));
 await c.close();
 console.log('\n== 2) administrador en la empresa nueva ==');
 c=await nuevo();p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,200)));p.on('dialog',d=>d.accept());
 await p.goto(BASE+'?emp='+EMP,{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:25000});await p.waitForTimeout(1200);
 await p.fill('#au_e','admin.prueba@example.com');await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
 await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(9000);
 chk('IndexedDB sigue vacía tras iniciar sesión',await idbCount(p,'tj_cat_'+EMP)===0,await idbCount(p,'tj_cat_'+EMP));
 const nube=await p.evaluate(async()=>{const s=await fbCol('catalogo').get();return s.size});
 chk('Firestore empresas/'+EMP+'/catalogo vacío (no se sube nada)',nube===0,nube);
 await p.evaluate(()=>ir('cat'));await p.waitForTimeout(1500);
 let txt=await p.evaluate(()=>({n:(typeof CL!=='undefined'?CL.length:-1),t:document.getElementById('v').innerText}));
 chk('Catálogo: 0 modelos y sin PW0xx',txt.n===0&&!/PW0\d\d/.test(txt.t),txt.n+' · '+txt.t.slice(0,120).replace(/\n/g,' | '));
 if(SHOTS)await p.screenshot({path:SHOTS+'/a-panel-catalogo.png'});
 await p.evaluate(()=>ir('prod'));await p.waitForTimeout(1000);
 txt=await p.evaluate(()=>({n:DB.prod.length,t:document.getElementById('v').innerText}));
 chk('Productos: vacío',txt.n===0&&!/PW0\d\d/.test(txt.t),txt.n);
 await p.evaluate(()=>ir('home'));await p.waitForTimeout(2500);
 const cint=await p.evaluate(()=>{const b=document.getElementById('cint');return{hidden:b?b.hidden:true,t:b?b.innerText:'',imgs:b?b.querySelectorAll('img').length:0}});
 chk('Inicio: la barra «Modelos» no muestra modelos de Tarjetería (sin miniaturas ni PW0xx)',cint.imgs===0&&!/PW0\d\d|Cumplea|Boda/i.test(cint.t),JSON.stringify(cint).slice(0,160));
 if(SHOTS)await p.screenshot({path:SHOTS+'/a-panel-inicio.png'});
 await p.evaluate(()=>ir('check'));await p.waitForTimeout(3500);
 const chkv=await p.evaluate(()=>({f:!!document.getElementById('checkFrame'),t:document.getElementById('v').innerText}));
 chk('Check: sin el módulo de modelos de Tarjetería; estado vacío neutro',!chkv.f&&/aún no tiene/i.test(chkv.t),JSON.stringify(chkv).slice(0,160));
 if(SHOTS)await p.screenshot({path:SHOTS+'/a-panel-check.png'});
 await p.evaluate(()=>ir('tienda'));await p.waitForTimeout(2500);
 txt=await p.evaluate(()=>({rows:tdRows().length,t:document.getElementById('v').innerText}));
 chk('Panel de la tienda: sin modelos para publicar',txt.rows===0&&!/PW0\d\d/.test(txt.t),txt.rows+' · '+txt.t.slice(0,160).replace(/\n/g,' | '));
 if(SHOTS)await p.screenshot({path:SHOTS+'/a-panel-tienda.png'});
 chk('sin errores JS',errs.length===0,errs.join(' ; '));
 await c.close();
 console.log('\n== 3) tienda pública de la empresa nueva ==');
 c=await nuevo();p=await c.newPage();
 await p.goto(BASE+'?tienda=1&emp='+EMP,{waitUntil:'load'});await p.waitForSelector('#k_footer',{timeout:25000});await p.waitForTimeout(6000);
 const sh=await p.evaluate(()=>({t:document.getElementById('shop').innerText,cards:document.querySelectorAll('#sh_g .kc:not(.ksk)').length,hero:document.querySelectorAll('.kfloat-card').length,chips:document.querySelectorAll('#sh_ch .kchip').length,cats:document.querySelectorAll('.kcat-pill').length,items:SH.items.length}));
 chk('sin tarjetas, carrusel, chips ni categorías',sh.cards===0&&sh.hero===0&&sh.chips===0&&sh.cats===0&&sh.items===0,JSON.stringify({c:sh.cards,h:sh.hero,ch:sh.chips,ca:sh.cats,i:sh.items}));
 chk('estado vacío neutro «Esta tienda aún no tiene productos»',/Esta tienda aún no tiene productos/.test(sh.t),'');
 chk('nada de modelos de Tarjetería (PW0xx)',!/PW0\d\d/.test(sh.t));
 const ls=await p.evaluate(()=>Object.keys(localStorage).filter(k=>/tj_cached_items|tj_cart|tj_fav/.test(k)));
 if(SHOTS)await p.screenshot({path:SHOTS+'/a-tienda-vacia.png'});
 await c.close();
 console.log('\n== 4) la empresa INICIAL conserva su catálogo de fábrica ==');
 c=await nuevo();p=await c.newPage();
 await p.goto(BASE,{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:25000});await p.waitForTimeout(12000);
 const ini=await idbCount(p,'tj_cat');
 chk('empresa inicial: se precargan los 88 modelos de fábrica',ini===88,ini);
 await c.close();await br.close();
 console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
