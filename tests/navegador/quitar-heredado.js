/* «Quitar datos heredados de Tarjetería» de una empresa en Chrome real contra la copia de PRUEBA (admin de PRUEBA, SOLO tarjeteria-jhon-prueba, empresa de prueba vacia-prueba).
   Siembra en vacia-prueba lo que una empresa nueva heredaba antes del arreglo (2 modelos del zip de fábrica en catálogo y tienda, los 6 productos de arranque, nombre/teléfono/correo de Tarjetería)
   más cosas PROPIAS (un modelo, un producto de tienda, un producto de arranque propio, dirección/banco/RUC), y comprueba: vista previa exacta y sin escribir, confirmación con detalle,
   se quita solo lo heredado (nube y este dispositivo), lo propio queda, tras recargar no reaparece, la empresa inicial no muestra la herramienta. Al final reinicia vacia-prueba.
   La copia debe llevar el zip: CON_ZIP=1 node tests/navegador/copia-prueba.js /tmp/copia.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/quitar-heredado.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),SHOTS=process.env.SHOTS||'',EMP='vacia-prueba';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const entrar=async(emp)=>{const c=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'}),p=await c.newPage();p.__e=[];p.on('pageerror',e=>p.__e.push(e.message.slice(0,200)));p.on('dialog',d=>d.accept());
  await p.goto(BASE+(emp?'?emp='+emp:''),{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:25000});await p.waitForTimeout(1200);
  await p.fill('#au_e','admin.prueba@example.com');await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
  await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(3500);
  await p.evaluate(()=>{if(!/tarjeteria-jhon-prueba/.test(JSON.stringify(firebase.app().options)))throw new Error('NO ES PRUEBA')});return{c,p}};
 const reiniciar=(p)=>p.evaluate(async emp=>{for(const col of ['catalogo','panel_public','panel','tienda_items']){const s=await fbDb.collection('empresas/'+emp+'/'+col).get();for(const d of s.docs){if(col==='panel'&&d.id==='migracion_roles_v1')continue;await d.ref.delete()}}
   await fbDb.collection('empresas').doc(emp).set({id:emp,slug:emp,nombre:'Vacía Prueba',logo:'',estado:'activa',ts:Date.now()},{merge:true})},EMP);
 let {c,p}=await entrar(EMP);
 await reiniciar(p);
 console.log('\n== 1) siembra de lo heredado y de lo propio (solo en «'+EMP+'» de PRUEBA) ==');
 const zip=await p.evaluate(async()=>{const r=await fetch('catalogo_default.zip');if(!r.ok)return null;const z=await JSZip.loadAsync(await r.arrayBuffer());const m=JSON.parse(await z.file('manifest.json').async('string'));return m.items.slice(0,3).map(i=>({id:i.id,name:i.name}))});
 chk('la copia lleva catalogo_default.zip (CON_ZIP=1)',!!zip&&zip.length===3,JSON.stringify(zip));if(!zip)process.exit(1);
 await p.evaluate(async(z)=>{const col=n=>fbDb.collection('empresas/'+TJEmpresa.empActiva()+'/'+n),ts=Date.now();
  const cat=(id,name)=>({id,name,ext:'pdf',cat:'General',price:0,desc:'',type:'application/pdf',size:3,date:new Date().toISOString(),data:'AAAA',ts});
  await col('catalogo').doc(z[0].id).set(cat(z[0].id,z[0].name));await col('catalogo').doc(z[1].id).set(cat(z[1].id,z[1].name));await col('catalogo').doc('propio-mod-1').set(cat('propio-mod-1','Modelo propio de la empresa'));
  await col('tienda_items').doc(z[0].id).set({id:z[0].id,name:z[0].name,cat:'General',price:0,img:'data:image/png;base64,AAAA',ts});
  await col('tienda_items').doc('propio-prod-1').set({id:'propio-prod-1',name:'Filtro de aceite propio',cat:'Motor',price:12,img:'data:image/png;base64,AAAA',ts});
  await col('tienda_items').doc('__cfg').set({__cfg:true,empresaNombre:'Vacía Prueba',heroTitle:'Vacía Prueba',ts},{merge:true});
  DB.prod=[['TARJETAS DE TODA OCACION',1.30],['TARJETAS DE TODA OCACION',1.25],['TARJETAS DE TODA OCACION',1.20],['TARJETAS DE TODA OCACION',1.15],['TARJETAS DE TODA OCACION',1.00],['TARJETAS DE TODA OCACION DISTRUBUCION',0.95]].map((q,i)=>({id:'p'+i,n:q[0],p:q[1]})).concat([{id:'propio-p',n:'Aceite 10W40',p:7.5}]);
  Object.assign(DB.cfg,{nombre:'Tarjetería Jhon',tel:'(507) 6074-1150',email:'Tarjeteriajhon@gmail.com',dir:'Calle 5, David',banco:'Banco Nacional',ruc:'8-123-456'});save()},zip);
 await p.waitForTimeout(3500);await c.close();
 ({c,p}=await entrar(EMP));await p.waitForTimeout(3000);
 const base=await p.evaluate(()=>({prod:DB.prod.length,cfgN:DB.cfg.nombre,cl:CL.length,clIds:CL.map(f=>f.name)}));
 chk('tras recargar, el panel trae lo sembrado (7 productos, nombre de Tarjetería, modelos del catálogo)',base.prod===7&&base.cfgN==='Tarjetería Jhon'&&base.cl>=3,JSON.stringify(base));
 console.log('\n== 2) vista previa (no escribe nada) ==');
 await p.evaluate(()=>ir('empresas'));await p.waitForSelector('#emLimp',{timeout:15000});await p.waitForTimeout(1500);
 const snap0=await p.evaluate(async()=>{const n={};for(const k of ['catalogo','tienda_items']){n[k]=(await fbCol(k).get()).size}n.prod=DB.prod.length;return n});
 await p.click('text=Ver vista previa');await p.waitForFunction(()=>/Esto se quitaría/.test((document.getElementById('emLimp')||{innerText:''}).innerText),null,{timeout:60000});
 const vp=await p.evaluate(()=>document.getElementById('emLimp').innerText);
 chk('lista 2 modelos de catálogo, 1 publicado, 2 en este dispositivo, 6 productos de arranque y los 3 datos de Tarjetería',/Modelos en el catálogo \(nube\): 2/.test(vp)&&/publicados en la tienda: 1/.test(vp)&&/en este dispositivo: [2-9]/.test(vp)&&/Productos de arranque: 6/.test(vp)&&/nombre, teléfono, correo/.test(vp),vp.replace(/\n+/g,' | ').slice(0,420));
 if(SHOTS)await p.screenshot({path:SHOTS+'/e3-heredado-vista-previa.png'});
 const snap1=await p.evaluate(async()=>{const n={};for(const k of ['catalogo','tienda_items']){n[k]=(await fbCol(k).get()).size}n.prod=DB.prod.length;return n});
 chk('la vista previa no cambió nada',JSON.stringify(snap0)===JSON.stringify(snap1),JSON.stringify(snap1));
 console.log('\n== 3) quitar lo heredado (con confirmación) ==');
 let dlg='';p.removeAllListeners('dialog');p.on('dialog',d=>{dlg=d.message();d.accept()});
 await p.click('text=Quitar lo heredado');await p.waitForFunction(()=>/Se quitó lo heredado/.test((document.getElementById('emLimp')||{innerText:''}).innerText),null,{timeout:60000});await p.waitForTimeout(3500);
 chk('pidió confirmación con el detalle, «solo de esta empresa» y «no se puede deshacer»',/Se quitará de «Vacía Prueba»/.test(dlg)&&/SOLO de esta empresa/.test(dlg)&&/no se puede deshacer/.test(dlg)&&/2 modelos del catálogo/.test(dlg),dlg.replace(/\n+/g,' ').slice(0,200));
 const ids=async k=>p.evaluate(async k=>(await fbCol(k).get()).docs.map(d=>d.id).sort(),k);
 chk('catálogo en la nube: solo el modelo propio',JSON.stringify(await ids('catalogo'))==='["propio-mod-1"]',JSON.stringify(await ids('catalogo')));
 chk('tienda: queda el producto propio y __cfg; el modelo heredado salió',JSON.stringify(await ids('tienda_items'))==='["__cfg","propio-prod-1"]',JSON.stringify(await ids('tienda_items')));
 const des=await p.evaluate(()=>({prod:DB.prod.map(x=>x.n),cfg:JSON.stringify({n:DB.cfg.nombre,t:DB.cfg.tel,e:DB.cfg.email,d:DB.cfg.dir,b:DB.cfg.banco,r:DB.cfg.ruc}),cl:CL.map(f=>f.name)}));
 chk('productos: solo el propio «Aceite 10W40»',JSON.stringify(des.prod)==='["Aceite 10W40"]',JSON.stringify(des.prod));
 chk('contacto de Tarjetería fuera; dirección, banco y RUC propios intactos',/"d":"Calle 5, David","b":"Banco Nacional","r":"8-123-456"/.test(des.cfg)&&!/Tarjeter|6074/i.test(des.cfg),des.cfg);
 chk('este dispositivo: solo queda el modelo propio',des.cl.length===1&&/propio/i.test(des.cl[0]),JSON.stringify(des.cl));
 const fin=await p.evaluate(()=>(document.getElementById('emLimp')||{innerText:''}).innerText);chk('la tarjeta confirma lo quitado',/Se quitó lo heredado de Tarjetería/.test(fin),fin.replace(/\n+/g,' | ').slice(0,200));
 if(SHOTS)await p.screenshot({path:SHOTS+'/e3-heredado-despues.png'});
 chk('sin errores JS',p.__e.length===0,p.__e.join(' ; '));
 console.log('\n== 4) tras recargar no reaparece nada ==');
 await c.close();({c,p}=await entrar(EMP));await p.waitForTimeout(3500);
 const rec=await p.evaluate(async()=>({prod:DB.prod.map(x=>x.n),nombre:DB.cfg.nombre||'',tel:DB.cfg.tel||'',cl:CL.length,pub:(await fbCol('panel_public').doc('general').get()).data()}));
 chk('productos y datos siguen limpios tras recargar (nube y local)',JSON.stringify(rec.prod)==='["Aceite 10W40"]'&&!/Tarjeter/i.test(rec.nombre)&&!/6074/.test(rec.tel)&&rec.cl===1&&JSON.stringify(rec.pub.prod.map(x=>x.n))==='["Aceite 10W40"]'&&!/Tarjeter|6074/i.test(JSON.stringify(rec.pub.cfg||{})),JSON.stringify({p:rec.prod,n:rec.nombre,cl:rec.cl}));
 await p.evaluate(()=>ir('empresas'));await p.waitForSelector('#emLimp',{timeout:15000});await p.click('text=Ver vista previa');await p.waitForFunction(()=>/no tiene datos heredados/.test((document.getElementById('emLimp')||{innerText:''}).innerText),null,{timeout:60000}).then(()=>chk('una nueva vista previa dice que no queda nada heredado',true),()=>chk('una nueva vista previa dice que no queda nada heredado',false));
 await c.close();
 console.log('\n== 5) la empresa INICIAL no ofrece la herramienta ==');
 ({c,p}=await entrar(''));await p.evaluate(()=>ir('empresas'));await p.waitForTimeout(3000);
 const ini=await p.evaluate(()=>({tarjeta:!!document.getElementById('emLimp'),activa:TJEmpresa.empActiva()}));chk('sin tarjeta de limpieza en '+ini.activa,ini.tarjeta===false&&ini.activa==='tarjeteria-jhon',JSON.stringify(ini));
 await c.close();
 console.log('\n== 6) reinicio de «'+EMP+'» ==');
 ({c,p}=await entrar(EMP));await reiniciar(p);await c.close();
 await br.close();console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
