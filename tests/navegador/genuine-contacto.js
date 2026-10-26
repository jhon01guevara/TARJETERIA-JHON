/* «Datos de la empresa» → contacto, nombre y políticas de la web, en Chrome real contra la copia de PRUEBA (empresa genuine-prueba, SOLO en el proyecto de prueba).
   Requiere la empresa sembrada con tests/navegador/genuine-siembra.js y PRUEBA_PASSWORD (admin.prueba@example.com del proyecto de PRUEBA).
   Comprueba: (1) el administrador guarda Datos de la empresa y la web (Contacto oficial, Políticas y Privacidad, pie) muestra esos mismos datos; (2) cambiarlos
   los cambia en la web; (3) una empresa sin datos publicados muestra un texto neutro, nunca el correo/teléfono de Tarjetería; (4) la sincronización de una sola
   vez rellena solo lo que la web tenga vacío y no pisa lo ya publicado; (5) la empresa inicial conserva su respaldo de siempre; (6) sin errores JS ni CSP.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/genuine-contacto.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP=process.env.EMP||'genuine-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const D1={nombre:'Genuine Prueba SA',tel:'(507) 555-0101',dir:'Calle 50, Ciudad de Panamá',email:'ventas@genuine-prueba.test'};
const D2={nombre:'Genuine Prueba SA',tel:'(507) 555-0202',dir:'Av. Balboa, Ciudad de Panamá',email:'info@genuine-prueba.test'};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message.slice(0,200)));page.on('dialog',d=>d.accept());
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))});
 const entrar=async()=>{await page.goto(BASE+'?emp='+EMP,{waitUntil:'load'});
  if(await page.locator('#au_e').count()||await page.waitForSelector('#au_e',{timeout:8000}).then(()=>1,()=>0)){await page.waitForTimeout(1200);
   await page.fill('#au_e','admin.prueba@example.com');await page.fill('#au_p',process.env.PRUEBA_PASSWORD);await page.click('text=Entrar')}
  await page.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await page.waitForTimeout(3500)};
 await entrar();
 const guardar=async D=>{await page.evaluate(()=>ir('config'));await page.waitForTimeout(1500);
  await page.evaluate(()=>{cfgTab('gen');if(!cardState.cfg_empresa)toggleCard('cfg_empresa')});await page.waitForTimeout(700);
  await page.click('#btnEditCfg');await page.fill('#c1',D.nombre);await page.fill('#c3',D.tel);await page.fill('#c4',D.dir);await page.fill('#c6',D.email);
  if(SHOTS&&D===D1)await page.screenshot({path:SHOTS+'/pr4-panel-datos-empresa.png'});
  await page.click('#btnSaveCfg');await page.waitForTimeout(3500)};
 const leer=()=>page.evaluate(async()=>{const d=await fbCol('tienda_items').doc('__cfg').get();const x=d.data()||{};return{contacto:x.contacto||{},nombre:x.empresaNombre,sync:x.contactoSync}});
 const visita=async(emp,tienda)=>{const c=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const p=await c.newPage();
  await p.goto(BASE+'?tienda=1&emp='+emp,{waitUntil:'load'});await p.waitForSelector('#k_footer button',{timeout:25000});await p.waitForTimeout(4500);
  const pie=await p.locator('#k_footer').innerText();
  await p.locator('#k_footer button:has-text("Contacto oficial")').click();await p.waitForTimeout(900);
  const modal=()=>p.evaluate(()=>{const m=document.getElementById('shopm');return m&&m.style.display!=='none'?m.innerText:''});
  const contacto=await modal();if(SHOTS&&tienda)await p.screenshot({path:SHOTS+'/pr4-'+tienda+'-contacto.png'});
  let pol='';
  for(const k of ['1','2','3','4','5','6']){await p.evaluate(k=>shopPoliticas(k),k);await p.waitForTimeout(250);pol+='\n'+await modal();if(k==='5'&&SHOTS&&tienda)await p.screenshot({path:SHOTS+'/pr4-'+tienda+'-politicas.png'})}
  const todo=pol;
  await c.close();return{pie,contacto,pol,todo}};
 // 1) guardar Datos de la empresa y ver la web
 await guardar(D1);
 let cf=await leer();
 chk('Datos de la empresa se copian a la plantilla web (nombre, correo, teléfono y dirección)',cf.nombre===D1.nombre&&cf.contacto.email===D1.email&&cf.contacto.tel===D1.tel&&cf.contacto.dir===D1.dir,JSON.stringify(cf));
 let v=await visita(EMP,'genuine');
 chk('pie de la web: nombre de la empresa',v.pie.includes(D1.nombre),v.pie.slice(0,60));
 chk('Contacto oficial muestra el teléfono, el correo y la dirección del panel (con paréntesis en el teléfono)',[D1.tel,D1.email,D1.dir].every(s=>v.contacto.includes(s)),v.contacto.replace(/\s+/g,' ').slice(0,200));
 chk('Políticas y Privacidad usa el mismo correo y teléfono del panel',v.todo.includes(D1.email)&&v.todo.includes(D1.tel),'');
 chk('nada de Tarjetería en el contacto ni en las políticas',!/tarjeteriajhon@gmail|6074-1150|Tarjeter[ií]a/i.test(v.contacto+v.todo),(/tarjeteriajhon@gmail|6074-1150|Tarjeter[ií]a/i.exec(v.contacto+v.todo)||[''])[0]);
 // 2) cambiar y ver que cambia
 await guardar(D2);v=await visita(EMP,'');
 chk('al cambiar los datos en el panel, la web muestra los nuevos y no los anteriores',[D2.tel,D2.email,D2.dir].every(s=>v.contacto.includes(s))&&!v.contacto.includes(D1.email)&&!v.todo.includes(D1.tel),v.contacto.replace(/\s+/g,' ').slice(0,160));
 // 3) empresa sin datos publicados
 v=await visita('sin-datos-prueba','vacia');
 chk('empresa sin datos: texto neutro, nunca el correo/teléfono de Tarjetería',/aún no ha publicado sus datos de contacto/.test(v.contacto)&&!/tarjeteriajhon@gmail|6074-1150|Tarjeter[ií]a/i.test(v.contacto+v.pol+v.pie),v.contacto.replace(/\s+/g,' ').slice(0,120));
 // 4) sincronización de una vez: la web tiene SOLO el teléfono (distinto) y sin marca
 await page.evaluate(async()=>{await fbCol('tienda_items').doc('__cfg').set({contacto:{tel:'555-9999',email:'',dir:''},contactoSync:firebase.firestore.FieldValue.delete()},{merge:true})});
 await entrar();await page.waitForTimeout(3500);cf=await leer();
 chk('sincronización única: rellena correo y dirección vacíos de la web y NO pisa el teléfono ya publicado',cf.contacto.tel==='555-9999'&&cf.contacto.email===D2.email&&cf.contacto.dir===D2.dir&&cf.sync===true,JSON.stringify(cf));
 // 5) empresa inicial
 v=await visita('tarjeteria-jhon','ini');
 chk('la empresa inicial conserva su contacto (publicado o su respaldo de siempre) y no muestra datos de Genuine',/tarjeteriajhon@gmail|@|\d{4}-\d{4}|Teléfono|Correo/.test(v.contacto)&&!/genuine/i.test(v.contacto),v.contacto.replace(/\s+/g,' ').slice(0,120));
 // se deja la prueba con D1
 await guardar(D1);
 chk('sin errores JS ni CSP',errs.length===0&&(await page.evaluate(()=>window.__csp)).length===0,errs.join('|'));
 await br.close();process.exit(fallos?1:0);
})();
