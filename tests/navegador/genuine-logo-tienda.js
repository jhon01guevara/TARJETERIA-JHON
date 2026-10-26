/* Logo de la tienda web desde Configuración, en Chrome real contra la copia de PRUEBA (empresa genuine-prueba, sembrada con genuine-siembra.js; inicia sesión como admin.prueba@example.com).
   Sube un PNG transparente de ~400 KB (2400×900): comprueba que se guarda al instante, ≤250 000 caracteres, ≤800 px, con transparencia y sin cortarse; que la cabecera de la tienda pública lo usa;
   que «Quitar» deja la inicial de la empresa (nunca el logo de Tarjetería); y un PNG pequeño. Escribe SOLO en PRUEBA (vuelva a correr genuine-siembra.js para restaurar el logo de ejemplo).
   Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/genuine-logo-tienda.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP='genuine-prueba',SH=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
const out=[];const chk=(n,ok,d)=>{out.push(ok);console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined?'  ['+d+']':''))};
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'logo-')),GRANDE=path.join(tmp,'grande.png'),CHICO=path.join(tmp,'chico.png');
 {const g=await br.newPage();const mk=async(w,h,ruido)=>g.evaluate(([w,h,ruido])=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;
   x.lineWidth=30;x.strokeStyle='#141414';x.strokeRect(100,100,w-200,h-200);for(let i=0;i<ruido;i++){x.fillStyle='rgb('+(r()*255|0)+','+(r()*255|0)+','+(r()*255|0)+')';x.beginPath();x.arc(r()*w,r()*h,15,0,7);x.fill()}
   return c.toDataURL('image/png').split(',')[1]},[w,h,ruido]);
  fs.writeFileSync(GRANDE,Buffer.from(await mk(2400,900,4000),'base64'));fs.writeFileSync(CHICO,Buffer.from(await mk(300,100,0),'base64'));await g.close()}
 const ctx=await br.newContext({viewport:{width:1366,height:1000},serviceWorkers:'block'});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message.slice(0,200)));
 page.on('dialog',d=>d.accept());
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))});
 await page.goto(BASE+'?emp='+EMP,{waitUntil:'load'});
 await page.waitForSelector('#au_e',{timeout:25000});await page.waitForTimeout(1200);
 await page.fill('#au_e','admin.prueba@example.com');await page.fill('#au_p',process.env.PRUEBA_PASSWORD);await page.click('text=Entrar');
 await page.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await page.waitForTimeout(3500);
 await page.evaluate(()=>ir('config'));await page.waitForTimeout(1500);
 if(!(await page.locator('text=Subir logo de la tienda web').isVisible())){await page.evaluate(()=>toggleCard('lbgCard'));await page.waitForTimeout(800)}
 chk('opción «Subir logo de la tienda web» visible en Configuración',await page.locator('text=Subir logo de la tienda web').isVisible());
 await page.locator('text=Subir logo de la tienda web').scrollIntoViewIfNeeded();
 if(SH)await page.screenshot({path:SH+'/config-logo.png'});
 const leerCfg=()=>page.evaluate(async()=>{const d=await fbCol('tienda_items').doc('__cfg').get();const u=d.data().logoUrl||'';return {len:u.length,mime:(/^data:([^;,]+)/.exec(u)||[])[1]||(u?'url':''),u}});
 // 1) logo grande (406 KB, transparente)
 await page.locator('label:has-text("Subir logo de la tienda web") input').setInputFiles(GRANDE);
 await page.waitForTimeout(4000);
 let c=await leerCfg();
 chk('guardado al instante en la plantilla (__cfg.logoUrl), ≤250 000 caracteres y comprimido',c.len>0&&c.len<=250000,c.mime+' '+c.len);
 const dim=await page.evaluate(async u=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=document.createElement('canvas');k.width=i.naturalWidth;k.height=i.naturalHeight;const x=k.getContext('2d');x.drawImage(i,0,0);r({w:i.naturalWidth,h:i.naturalHeight,alfa:(()=>{const d=x.getImageData(0,0,i.naturalWidth,i.naturalHeight).data;let m=255;for(let k=3;k<d.length;k+=4)if(d[k]<m)m=d[k];return m})()})};i.onerror=()=>r(null);i.src=u}),c.u);
 chk('la imagen guardada es válida (no cortada), ≤800 px y conserva la transparencia',dim&&dim.w<=800&&dim.w>0&&dim.alfa===0,JSON.stringify(dim));
 const vistaCfg=await page.evaluate(()=>{const i=document.querySelector('#v img[alt="logo de la tienda"]');return i&&i.src.slice(0,22)});
 chk('Configuración muestra la vista previa del logo nuevo',/^data:image\/(png|webp)/.test(vistaCfg||''),vistaCfg);
 // 2) la tienda pública (visitante) lo muestra en la cabecera
 const c2=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const p2=await c2.newPage();
 await p2.goto(BASE+'?tienda=1&emp='+EMP,{waitUntil:'load'});await p2.waitForTimeout(5000);
 const hd=await p2.evaluate(()=>{const i=document.querySelector('#shop .kbrand img');return i&&{src:i.src,ok:i.naturalWidth>0}});
 chk('la cabecera de la tienda usa ese logo y carga',hd&&hd.src===c.u&&hd.ok);
 if(SH)await p2.screenshot({path:SH+'/tienda-logo-nuevo.png',clip:{x:0,y:0,width:1024,height:300}});
 // 3) quitar
 await page.evaluate(()=>shopLogoQuitar());await page.waitForTimeout(2500);
 c=await leerCfg();chk('quitar: logoUrl vacío',c.len===0);
 await p2.reload({waitUntil:'load'});await p2.waitForTimeout(4000);
 const ini=await p2.evaluate(()=>({mono:(document.querySelector('#shop .klogo-mono')||{}).textContent,img:!!document.querySelector('#shop .kbrand img')}));
 chk('tienda sin logo: inicial de la empresa, nunca el logo de Tarjetería',ini.mono==='G'&&!ini.img,JSON.stringify(ini));
 // 4) logo pequeño PNG transparente (sin tocar tamaño) y se deja la prueba como estaba
 await page.evaluate(()=>ir('config'));await page.waitForTimeout(1200);
 await page.locator('label:has-text("Subir logo de la tienda web") input').setInputFiles(CHICO);await page.waitForTimeout(3000);
 c=await leerCfg();chk('logo pequeño PNG guardado',c.mime==='image/png'&&c.len>0,c.mime+' '+c.len);
 chk('sin errores JS ni CSP',errs.length===0&&(await page.evaluate(()=>window.__csp)).length===0,errs.join('|'));
 await br.close();process.exit(out.every(Boolean)?0:1);
})();
