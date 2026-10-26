/* WhatsApp de la tienda = teléfono de la empresa por defecto, con campo propio opcional que lo sobrescribe y casilla para desactivarlo.
   Chrome real contra la copia de PRUEBA (empresa genuine-prueba, SOLO en el proyecto de PRUEBA; al final deja el contacto como estaba).
   Requiere genuine-siembra.js y PRUEBA_PASSWORD. Comprueba (con la tienda pública sin sesión): (1) WhatsApp vacío + teléfono «(507) 555-0101» → botón flotante y fila
   «WhatsApp» con 5075550101; (2) WhatsApp propio → manda el propio; (3) «No mostrar» → sin botón ni fila; (4) teléfono fijo inválido → sin botón; (5) la empresa inicial no cambia.
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/whatsapp-tienda.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP=process.env.EMP||'genuine-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message.slice(0,200)));page.on('dialog',d=>d.accept());
 await page.goto(BASE+'?emp='+EMP,{waitUntil:'load'});await page.waitForSelector('#au_e',{timeout:25000});await page.waitForTimeout(1200);
 await page.fill('#au_e','admin.prueba@example.com');await page.fill('#au_p',process.env.PRUEBA_PASSWORD);await page.click('text=Entrar');
 await page.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await page.waitForTimeout(3500);
 const orig=await page.evaluate(async()=>{if(!/tarjeteria-jhon-prueba/.test(JSON.stringify(firebase.app().options)))throw new Error('NO ES PRUEBA');const d=await fbCol('tienda_items').doc('__cfg').get();return (d.data()||{}).contacto||{}});
 const guardar=async(tel,wa,off)=>{
  await page.evaluate(()=>{ir('config');cfgTab('web')});await page.waitForTimeout(1500);
  const r=await page.evaluate(async([tel,wa,off])=>{const set=(id,v)=>{const e=document.getElementById(id);if(!e)return false;e.value=v;RS_DRAFT[id]=v;return true};
   const o=document.getElementById('ct_waOff');const ok=set('ct_tel',tel)&&set('ct_wa',wa)&&!!o;if(o){o.checked=off;RS_DRAFT.ct_waOff=off}
   await redesGuardar();return{ok,msg:(document.getElementById('rs_est')||{}).textContent}},[tel,wa,off]);
  await page.waitForTimeout(1500);return r};
 const visita=async(emp)=>{const c=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const p=await c.newPage();
  await p.goto(BASE+'?tienda=1'+(emp?'&emp='+emp:''),{waitUntil:'load'});await p.waitForSelector('#k_footer button',{timeout:25000});await p.waitForTimeout(4000);
  const b=await p.evaluate(()=>{const w=document.getElementById('k_wa');return{href:w&&!w.hidden?w.getAttribute('href'):'',vis:!!(w&&!w.hidden)}});
  await p.locator('#k_footer button:has-text("Contacto oficial")').click();await p.waitForTimeout(800);
  const modal=await p.evaluate(()=>{const m=document.getElementById('shopm');return m&&m.style.display!=='none'?m.innerText:''});
  return{b,modal,p,c}};
 console.log('\n== 1) WhatsApp vacío + teléfono de la empresa ==');
 let g=await guardar('(507) 555-0101','',false);chk('formulario del panel con campo WhatsApp y casilla «No mostrar»',g.ok,g.msg);
 let v=await visita(EMP);
 chk('botón flotante con el teléfono de la empresa (5075550101)',v.b.vis&&/wa\.me\/5075550101\?/.test(v.b.href),v.b.href.slice(0,40));
 chk('Contacto oficial: fila WhatsApp +5075550101',/WhatsApp[\s\S]*\+5075550101/.test(v.modal),v.modal.replace(/\n/g,' | ').slice(0,100));
 if(SHOTS)await v.p.screenshot({path:SHOTS+'/wa-1-por-telefono.png'});await v.c.close();
 console.log('\n== 2) WhatsApp propio ==');
 await guardar('(507) 555-0101','6123-4567',false);v=await visita(EMP);
 chk('usa el propio (50761234567), no el teléfono',v.b.vis&&/wa\.me\/50761234567\?/.test(v.b.href),v.b.href.slice(0,40));await v.c.close();
 console.log('\n== 3) «No mostrar el botón de WhatsApp» ==');
 await guardar('(507) 555-0101','6123-4567',true);v=await visita(EMP);
 chk('sin botón flotante ni fila WhatsApp',!v.b.vis&&!/WhatsApp/.test(v.modal),JSON.stringify(v.b));await v.c.close();
 console.log('\n== 4) teléfono sin formato de celular (7 dígitos) y sin WhatsApp propio ==');
 await guardar('555-0101','',false);v=await visita(EMP);
 chk('sin botón (no inventa un número)',!v.b.vis&&!/WhatsApp/.test(v.modal),JSON.stringify(v.b));await v.c.close();
 console.log('\n== 5) la casilla y los datos persisten al reabrir el panel; restaurar contacto original ==');
 await guardar('(507) 555-0101','',true);await page.reload({waitUntil:'load'});await page.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await page.waitForTimeout(4000);
 await page.evaluate(()=>{ir('config');cfgTab('web')});await page.waitForTimeout(1500);
 const per=await page.evaluate(()=>({off:(document.getElementById('ct_waOff')||{}).checked,tel:(document.getElementById('ct_tel')||{}).value}));
 chk('casilla marcada y teléfono guardados tras recargar',per.off===true&&per.tel==='(507) 555-0101',JSON.stringify(per));
 if(SHOTS)await page.screenshot({path:SHOTS+'/wa-panel-config.png'});
 await page.evaluate(async o=>{await fbCol('tienda_items').doc('__cfg').update({contacto:o})},{tel:orig.tel||'',wa:orig.wa||'',email:orig.email||'',dir:orig.dir||'',horario:orig.horario||''});
 const rest=await page.evaluate(async()=>(await fbCol('tienda_items').doc('__cfg').get()).data().contacto);
 chk('contacto de PRUEBA restaurado (sin waOff)',!rest.waOff&&rest.tel===(orig.tel||''),JSON.stringify(rest).slice(0,100));
 chk('sin errores JS',errs.length===0,errs.join(' ; '));
 await ctx.close();
 console.log('\n== 6) empresa inicial: la lógica es la misma, sin cambios de texto ==');
 const c6=await br.newContext({serviceWorkers:'block'});const p6=await c6.newPage();await p6.goto(BASE+'?tienda=1',{waitUntil:'load'});await p6.waitForSelector('#k_footer',{timeout:25000});await p6.waitForTimeout(4000);
 const w6=await p6.evaluate(()=>({f:typeof contWa,tel:contWa({tel:'+507 6074-1150'}),off:contWa({tel:'+507 6074-1150',waOff:true}),pro:contWa({tel:'+507 6074-1150',wa:'6000-0000'})}));
 chk('contWa: teléfono → 50760741150; waOff → vacío; propio manda',w6.f==='function'&&w6.tel==='50760741150'&&w6.off===''&&w6.pro==='50760000000',JSON.stringify(w6));
 await c6.close();await br.close();
 console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
