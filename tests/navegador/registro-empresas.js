/* Registro de Empresas (VEN CRM) en Chrome real contra la copia de PRUEBA (admin de PRUEBA): el formulario «Nueva empresa» y la lista no muestran colores ni textos de Tarjetería Jhon;
   no guarda nada (solo abre el formulario). Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/registro-empresas.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const c=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,200)));
 await p.goto(BASE+'?emp=genuine-prueba',{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:25000});await p.waitForTimeout(1200);
 await p.fill('#au_e','admin.prueba@example.com');await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
 await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(3500);
 await p.evaluate(()=>{ir('empresas')});await p.waitForTimeout(2500);
 let lista=await p.evaluate(()=>document.getElementById('v').innerText);
 if(SHOTS)await p.screenshot({path:SHOTS+'/b2-empresas-lista.png'});
 await p.evaluate(()=>empNueva());await p.waitForTimeout(800);
 const f=await p.evaluate(()=>({t:document.getElementById('v').innerText,c1:document.getElementById('em_color').value,c2:document.getElementById('em_color2').value,tel:document.getElementById('em_tel').placeholder,em:document.getElementById('em_email').placeholder,telv:document.getElementById('em_tel').value,emv:document.getElementById('em_email').value,nom:document.getElementById('em_nombre').value}));
 if(SHOTS)await p.screenshot({path:SHOTS+'/b2-empresas-formulario.png'});
 chk('colores por defecto neutros (#111111 y #276EF1), no el rosa de Tarjetería',f.c1==='#111111'&&f.c2.toLowerCase()==='#276ef1',f.c1+' '+f.c2);
 chk('campos de contacto vacíos con ejemplos neutros',f.telv===''&&f.emv===''&&f.nom===''&&/0000/.test(f.tel)&&/suempresa/.test(f.em),f.tel+' · '+f.em);
 chk('el formulario habla de VEN CRM y de datos propios de la empresa',/Nueva empresa en VEN CRM/.test(f.t)&&/Cada empresa tiene su propio panel/.test(f.t));
 chk('ningún texto de Tarjetería en el formulario',!/Tarjeter|jhon/i.test(f.t),(f.t.match(/.{20}(Tarjeter|jhon).{20}/i)||[''])[0]);
 chk('sin errores JS',errs.length===0,errs.join(' ; '));
 await c.close();await br.close();
 console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
