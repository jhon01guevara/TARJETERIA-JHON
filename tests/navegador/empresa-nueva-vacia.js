/* Alta de «Nueva empresa» y «Quitar ejemplos» en Chrome real contra la copia de PRUEBA (admin de PRUEBA, SOLO tarjeteria-jhon-prueba).
   Empresa activa del administrador: vacia-prueba. Crea y al final BORRA dos empresas de prueba: ej-sin-prueba (sin casilla) y ej-con-prueba (con ejemplos).
   Comprueba: (1) sin la casilla la empresa nace vacía (solo __cfg con su nombre + panel/data), sin productos ni catálogo; (2) NADA se escribe en la empresa activa
   (antes el alta guardaba los ejemplos y el nombre en la tienda de la empresa en uso); (3) con la casilla: 3 productos demo:1 y banner en la empresa NUEVA;
   (4) «Quitar ejemplos» (vista previa + confirmación) deja la empresa sin ejemplos y sin tocar lo demás; (5) la tienda pública de ambas abre con su estado vacío.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/empresa-nueva-vacia.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),SHOTS=process.env.SHOTS||'',ACT='vacia-prueba',SIN='ej-sin-prueba',CON='ej-con-prueba';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const entrar=async(emp)=>{const c=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'}),p=await c.newPage();p.__e=[];p.on('pageerror',e=>p.__e.push(e.message.slice(0,200)));p.on('dialog',d=>d.accept());
  await p.goto(BASE+'?emp='+emp,{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:25000});await p.waitForTimeout(1200);
  await p.fill('#au_e','admin.prueba@example.com');await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
  await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(3000);
  await p.evaluate(()=>{if(!/tarjeteria-jhon-prueba/.test(JSON.stringify(firebase.app().options)))throw new Error('NO ES PRUEBA')});return{c,p}};
 const ids=(p,path)=>p.evaluate(async x=>(await fbDb.collection(x).get()).docs.map(d=>d.id).sort(),path);
 const limpiar=(p)=>p.evaluate(async(emps)=>{for(const e of emps){for(const col of ['tienda_items','panel','panel_public','catalogo','tienda_leads','tienda_pedidos']){const s=await fbDb.collection('empresas/'+e+'/'+col).get();for(const d of s.docs)await d.ref.delete()}await fbDb.collection('empresas').doc(e).delete()}},[SIN,CON]);
 let {c,p}=await entrar(ACT);
 await limpiar(p);
 console.log('\n== 0) estado de la empresa activa «'+ACT+'» antes ==');
 const antes={items:await ids(p,'empresas/'+ACT+'/tienda_items'),cfg:await p.evaluate(async a=>{const d=(await fbDb.doc('empresas/'+a+'/tienda_items/__cfg').get()).data()||{};return{t:d.heroTitle,n:d.empresaNombre,b:JSON.stringify(d.banners||null),demo:d.demo||0}},ACT),panel:await p.evaluate(async a=>JSON.stringify((await fbDb.doc('empresas/'+a+'/panel/data').get()).data()||{}).length,ACT)};
 console.log('  '+JSON.stringify(antes.items)+' '+JSON.stringify(antes.cfg));
 const crear=async(nombre,slug,ejemplos)=>{await p.evaluate(()=>{ir('empresas')});await p.waitForTimeout(1200);await p.evaluate(()=>empNueva());await p.waitForTimeout(600);
  await p.fill('#em_nombre',nombre);await p.fill('#em_slug',slug);
  const ch=await p.evaluate(()=>{const e=document.getElementById('em_ejemplos');return e?e.checked:null});
  if(ejemplos)await p.check('#em_ejemplos');
  if(SHOTS&&ejemplos===false)await p.screenshot({path:SHOTS+'/e2-formulario-nueva-empresa.png'});
  await p.click('text=Guardar empresa');await p.waitForTimeout(4500);return ch};
 console.log('\n== 1) alta SIN ejemplos ==');
 const ch0=await crear('Ejemplo Sin Prueba',SIN,false);
 chk('la casilla «Incluir contenido de ejemplo» existe y empieza sin marcar',ch0===false,ch0);
 const msg1=await p.evaluate(()=>(document.querySelector('.nota')||{innerText:''}).innerText);chk('mensaje: la empresa nació vacía',/nació vacía/.test(msg1),msg1.slice(0,90));
 chk('empresas/'+SIN+'/tienda_items = solo __cfg (sin productos)',JSON.stringify(await ids(p,'empresas/'+SIN+'/tienda_items'))==='["__cfg"]',JSON.stringify(await ids(p,'empresas/'+SIN+'/tienda_items')));
 const cs=await p.evaluate(async s=>({c:(await fbDb.doc('empresas/'+s+'/tienda_items/__cfg').get()).data(),p:(await fbDb.doc('empresas/'+s+'/panel/data').get()).data(),cat:(await fbDb.collection('empresas/'+s+'/catalogo').get()).size}),SIN);
 chk('__cfg con su nombre y sin banner/foto/textos de muestra',cs.c.empresaNombre==='Ejemplo Sin Prueba'&&cs.c.heroTitle==='Ejemplo Sin Prueba'&&!cs.c.banners&&!cs.c.heroPhotoUrl&&!cs.c.heroSub&&!cs.c.demo,JSON.stringify(cs.c).slice(0,160));
 chk('panel/data solo con nombre y título de login; catálogo vacío',cs.p&&cs.p.cfg&&cs.p.cfg.nombre==='Ejemplo Sin Prueba'&&!cs.p.cfg.loginDesc&&!cs.p.cfg.loginLogoSrc&&!cs.p.demo&&cs.cat===0,JSON.stringify(cs.p).slice(0,120));
 console.log('\n== 2) la empresa ACTIVA no se tocó (antes los ejemplos y el nombre caían aquí) ==');
 const desp1={items:await ids(p,'empresas/'+ACT+'/tienda_items'),cfg:await p.evaluate(async a=>{const d=(await fbDb.doc('empresas/'+a+'/tienda_items/__cfg').get()).data()||{};return{t:d.heroTitle,n:d.empresaNombre,b:JSON.stringify(d.banners||null),demo:d.demo||0}},ACT)};
 chk('tienda_items de «'+ACT+'» idéntica',JSON.stringify(desp1.items)===JSON.stringify(antes.items),JSON.stringify(desp1.items));
 chk('__cfg de «'+ACT+'» igual (título, nombre, banners)',JSON.stringify(desp1.cfg)===JSON.stringify(antes.cfg),JSON.stringify(desp1.cfg));
 console.log('\n== 3) alta CON ejemplos ==');
 await crear('Ejemplo Con Prueba',CON,true);
 const itC=await ids(p,'empresas/'+CON+'/tienda_items');chk('3 productos de ejemplo + __cfg en la empresa nueva',JSON.stringify(itC)==='["__cfg","demo_1","demo_2","demo_3"]',JSON.stringify(itC));
 const cc=await p.evaluate(async s=>({c:(await fbDb.doc('empresas/'+s+'/tienda_items/__cfg').get()).data(),d:(await fbDb.doc('empresas/'+s+'/tienda_items/demo_1').get()).data()}),CON);
 chk('productos y portada marcados demo:1; banner demo_b1',cc.c.demo===1&&cc.d.demo===1&&cc.c.banners[0].id==='demo_b1'&&/ejemplo/i.test(cc.d.name),cc.d.name);
 chk('«'+ACT+'» sigue igual tras el 2.º alta',JSON.stringify(await ids(p,'empresas/'+ACT+'/tienda_items'))===JSON.stringify(antes.items));
 chk('sin errores JS',p.__e.length===0,p.__e.join(' ; '));
 await c.close();
 console.log('\n== 4) «Quitar ejemplos» desde la empresa «'+CON+'» ==');
 ({c,p}=await entrar(CON));
 await p.evaluate(()=>{ir('empresas')});await p.waitForTimeout(3500);
 const card=await p.evaluate(()=>(document.getElementById('emLimp')||{innerText:''}).innerText);
 chk('la tarjeta de limpieza lista lo que hay (3 productos, banner, portada)',/3 productos de ejemplo/.test(card)&&/banner de ejemplo/.test(card)&&/Quitar ejemplos/.test(card),card.replace(/\n/g,' | ').slice(0,200));
 if(SHOTS)await p.screenshot({path:SHOTS+'/e2-limpieza-antes.png'});
 let dlg='';p.removeAllListeners('dialog');p.on('dialog',d=>{dlg=d.message();d.accept()});
 await p.click('text=Quitar ejemplos');await p.waitForTimeout(3500);
 chk('pidió confirmación con el detalle',/Se quitará de/.test(dlg)&&/3 productos de ejemplo/.test(dlg)&&/No se borra nada más/.test(dlg),dlg.replace(/\n/g,' ').slice(0,160));
 chk('quedó solo __cfg',JSON.stringify(await ids(p,'empresas/'+CON+'/tienda_items'))==='["__cfg"]',JSON.stringify(await ids(p,'empresas/'+CON+'/tienda_items')));
 const c2=await p.evaluate(async s=>(await fbDb.doc('empresas/'+s+'/tienda_items/__cfg').get()).data(),CON);
 chk('__cfg: sin banner/portada de muestra ni marca demo; nombre y título intactos',!c2.demo&&(c2.banners||[]).length===0&&c2.heroBgType==='none'&&!c2.heroPhotoUrl&&!c2.heroSub&&c2.empresaNombre==='Ejemplo Con Prueba'&&c2.heroTitle==='Ejemplo Con Prueba',JSON.stringify(c2).slice(0,200));
 const card2=await p.evaluate(()=>(document.getElementById('emLimp')||{innerText:''}).innerText);
 chk('la tarjeta ahora dice que no hay ejemplos y sin botón',/no tiene contenido de ejemplo/.test(card2)&&!/Quitar ejemplos/.test(card2),card2.replace(/\n/g,' | ').slice(0,160));
 if(SHOTS)await p.screenshot({path:SHOTS+'/e2-limpieza-despues.png'});
 chk('sin errores JS',p.__e.length===0,p.__e.join(' ; '));
 await c.close();
 console.log('\n== 5) tienda pública de las dos empresas nuevas ==');
 for(const e of [SIN,CON]){const c3=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),p3=await c3.newPage();p3.__e=[];p3.on('pageerror',x=>p3.__e.push(x.message.slice(0,200)));
  await p3.goto(BASE+'?tienda=1&emp='+e,{waitUntil:'load'});await p3.waitForSelector('#k_footer',{timeout:25000});await p3.waitForTimeout(5000);
  const t=await p3.evaluate(()=>({t:document.getElementById('shop').innerText,cards:document.querySelectorAll('#sh_g .kc:not(.ksk)').length}));
  chk(e+': estado vacío neutro, sin tarjetas, sin «Producto de ejemplo» ni Tarjetería',/Esta tienda aún no tiene productos/.test(t.t)&&t.cards===0&&!/Producto de ejemplo|Tarjeter/i.test(t.t)&&/Ejemplo (Sin|Con) Prueba/i.test(t.t),t.t.replace(/\n/g,' ').slice(0,100));
  if(SHOTS)await p3.screenshot({path:SHOTS+'/e2-tienda-'+e+'.png'});chk(e+': sin errores JS',p3.__e.length===0,p3.__e.join(' ; '));await c3.close()}
 console.log('\n== 6) limpieza de las empresas de prueba creadas ==');
 ({c,p}=await entrar(ACT));await limpiar(p);
 const rest=await p.evaluate(async e=>{const o=[];for(const s of e){o.push((await fbDb.collection('empresas/'+s+'/tienda_items').get()).size+(await fbDb.collection('empresas').doc(s).get()).exists)}return o},[SIN,CON]);
 chk('empresas de prueba borradas',rest.every(x=>x===0||x==='0false'||x===0),JSON.stringify(rest));
 await c.close();await br.close();console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
