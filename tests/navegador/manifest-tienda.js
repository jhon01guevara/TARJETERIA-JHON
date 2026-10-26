/* Manifest propio de la tienda de OTRA empresa (genuine-prueba y vacia-prueba, SOLO proyecto de PRUEBA) en Chrome real, con la CSP real de index.html.
   Comprueba: la tienda enlaza un manifest data: con el nombre y los íconos de la empresa (PNG 192/512/maskable reales), Chrome lo lee sin errores y lo da por instalable
   (Page.getInstallabilityErrors; «in-incognito» del entorno de prueba no cuenta), 0 violaciones de CSP, que sin la directiva manifest-src la CSP lo bloquearía (la prueba negativa),
   que la empresa sin logo usa su inicial y que la empresa INICIAL conserva manifest.json. No necesita contraseña (tienda pública).
   Uso: BASE=http://127.0.0.1:PUERTO/ [SHOTS=/ruta] PW=/ruta/playwright-core node tests/navegador/manifest-tienda.js   (0 bien · 1 falla) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),EMP=process.env.EMP||'genuine-prueba',SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const esDataManifest=()=>/^data:application\/manifest\+json/.test((document.querySelector('link[rel=manifest]')||{href:''}).href);
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const abrir=async(emp,extra)=>{const c=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'allow'});const p=await c.newPage();p.__v=[];p.__e=[];
  p.on('console',m=>{if(/Content Security Policy|violates the following/i.test(m.text()))p.__v.push(m.text().slice(0,220))});p.on('pageerror',e=>p.__e.push(e.message.slice(0,200)));
  await p.addInitScript(()=>{document.addEventListener('securitypolicyviolation',e=>{(window.__sv=window.__sv||[]).push(e.violatedDirective+' '+e.blockedURI.slice(0,40))})});
  await p.goto(BASE+'?tienda=1'+(emp?'&emp='+emp:'')+(extra||''),{waitUntil:'load'});await p.waitForSelector('#k_footer',{timeout:25000});return{c,p}};
 console.log('\n== 1) tienda de OTRA empresa con logo ('+EMP+') ==');
 let {c,p}=await abrir(EMP);
 await p.waitForFunction(esDataManifest,null,{timeout:30000}).then(()=>chk('la tienda enlaza su propio manifest (data:)',true),()=>chk('la tienda enlaza su propio manifest (data:)',false));
 await p.waitForTimeout(1500);
 const cdp=await c.newCDPSession(p);
 const m=await cdp.send('Page.getAppManifest');const mj=m.data?JSON.parse(m.data):{};
 chk('Chrome leyó el manifest sin errores',(m.errors||[]).length===0,JSON.stringify(m.errors||[]).slice(0,200));
 chk('nombre de la empresa, sin Tarjetería',/Genuine/i.test(mj.name||'')&&!/Tarjeter/i.test(m.data||''),mj.name+' / '+mj.short_name);
 chk('id propio y start_url ?tienda=1&emp='+EMP,mj.id==='tienda-'+EMP&&/\?tienda=1&emp=genuine-prueba$/.test(mj.start_url||''),mj.id+' '+(mj.start_url||''));
 chk('scope del mismo origen que contiene el start_url',(mj.start_url||'').startsWith(mj.scope||'x')&&new URL(mj.scope).origin===new URL(BASE).origin,mj.scope);
 const ic=await p.evaluate(async(icons)=>Promise.all(icons.map(async i=>{const im=await createImageBitmap(await (await fetch(i.src)).blob());return{w:im.width,h:im.height,purpose:i.purpose,t:i.type}})).catch(e=>[String(e)]),mj.icons||[]);
 chk('íconos PNG reales 192, 512 y 512 maskable',ic.length===3&&ic[0].w===192&&ic[1].w===512&&ic[2].w===512&&ic[2].purpose==='maskable',JSON.stringify(ic));
 const ie=(await cdp.send('Page.getInstallabilityErrors')).installabilityErrors.filter(e=>e.errorId!=='in-incognito');
 chk('Chrome la da por instalable (solo «in-incognito» del entorno)',ie.length===0,JSON.stringify(ie));
 const sv=await p.evaluate(()=>window.__sv||[]);
 chk('0 violaciones de CSP y 0 errores JS',sv.length+p.__v.length+p.__e.length===0,sv.concat(p.__v,p.__e).join(' ; '));
 chk('un solo <link rel=manifest>',(await p.evaluate(()=>document.querySelectorAll('link[rel=manifest]').length))===1);
 chk('la tienda sigue sin service worker (como antes)',(await p.evaluate(()=>navigator.serviceWorker.getRegistrations().then(r=>r.length)))===0);
 if(SHOTS){await p.screenshot({path:SHOTS+'/manifest-tienda-genuine.png'});const pi=await c.newPage();await pi.setContent('<body style="margin:0;background:#ccc"><img src="'+(mj.icons||[])[1].src+'" width=256><img src="'+(mj.icons||[])[2].src+'" width=256></body>',{waitUntil:'load'}).catch(()=>{});await pi.screenshot({path:SHOTS+'/manifest-tienda-iconos-genuine.png',clip:{x:0,y:0,width:512,height:256}});await pi.close()}
 await c.close();
 console.log('\n== 2) prueba negativa: sin «manifest-src … data:» la CSP bloquea el manifest data: (demuestra que la directiva hace falta y es la que lo habilita) ==');
 {const br2=await chromium.launch({channel:'chrome',headless:true}),c2=await br2.newContext({serviceWorkers:'allow'});const p2=await c2.newPage();
  const cons=[];p2.on('console',m=>cons.push(m.text().slice(0,120)));
  await p2.route(/127\.0\.0\.1:\d+\/(\?.*)?$/,async r=>{const rs=await r.fetch();let b=await rs.text();b=b.replace("manifest-src 'self' data:; ","");await r.fulfill({response:rs,body:b})});
  await p2.goto(BASE+'?tienda=1&emp='+EMP,{waitUntil:'load'});await p2.waitForSelector('#k_footer',{timeout:25000});await p2.waitForTimeout(3000);const mn=await (await c2.newCDPSession(p2)).send('Page.getAppManifest');await p2.waitForTimeout(1000);
  chk('sin la directiva, Chrome bloquea el manifest data: por la CSP (aviso «Loading a manifest … violates»)',cons.some(x=>/Loading a manifest from 'data:/.test(x))&&!mn.data,cons.join(' | ').slice(0,160));await br2.close()}
 console.log('\n== 3) empresa SIN logo (vacia-prueba): ícono con la inicial ==');
 ({c,p}=await abrir('vacia-prueba'));
 await p.waitForFunction(esDataManifest,null,{timeout:30000}).then(()=>chk('manifest propio también sin logo',true),()=>chk('manifest propio también sin logo',false));
 await p.waitForTimeout(1000);
 const m3=await (await c.newCDPSession(p)).send('Page.getAppManifest');const j3=m3.data?JSON.parse(m3.data):{};
 chk('nombre de la empresa (no Tarjetería)',!!j3.name&&!/Tarjeter/i.test(m3.data||''),j3.name);
 if(SHOTS&&(j3.icons||[])[1]){const pi=await c.newPage();await pi.setContent('<body style="margin:0"><img src="'+j3.icons[1].src+'" width=256></body>');await pi.screenshot({path:SHOTS+'/manifest-tienda-icono-inicial.png',clip:{x:0,y:0,width:256,height:256}});await pi.close()}
 await c.close();
 console.log('\n== 4) empresa INICIAL: manifest.json de siempre ==');
 ({c,p}=await abrir(''));await p.waitForTimeout(4000);
 const h=await p.evaluate(()=>(document.querySelector('link[rel=manifest]')||{getAttribute:()=>null}).getAttribute('href'));
 chk('la tienda de Tarjetería conserva manifest.json',h==='manifest.json',h);await c.close();
 await br.close();console.log(fallos?'\nFALLAS: '+fallos:'\nTODO BIEN');process.exit(fallos?1:0);
})();
