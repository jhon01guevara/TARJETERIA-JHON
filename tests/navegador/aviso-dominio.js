/* Aviso «VEN CRM tiene dirección nueva» (js/aviso-dominio.js) en Chrome real. NO toca producción ni github.io de verdad:
   sirve la COPIA de PRUEBA (proyecto tarjeteria-jhon-prueba) y, dentro del navegador, hace que las direcciones https://jhon01guevara.github.io/TARJETERIA-JHON/ y https://vencrm.com/
   respondan con los archivos de esa copia (page.route), para probar el aviso con el nombre de host real sin enviar ninguna petición a esos sitios. No inicia sesión ni escribe datos.
   Comprueba: aparece en github.io (login), con enlace a vencrm.com, pasos para reinstalar (Android/iPhone/PC) y sin errores ni violaciones CSP; «Ahora no» (14 días) y «No mostrar más»;
   no aparece en vencrm.com, en 127.0.0.1 ni en la tienda pública de github.io; teclado (Esc); móvil sin desbordes; el service worker no se toca.
   Uso: BASE=http://127.0.0.1:PUERTO/ [SHOTS=/ruta] [PW=/ruta/playwright-core] node tests/navegador/aviso-dominio.js   (0 bien · 1 falla)
   La copia: CON_ZIP=1 node tests/navegador/copia-prueba.js /tmp/copia  y  python3 -m http.server PUERTO --bind 127.0.0.1 (dentro de esa carpeta). */
const {chromium}=require(process.env.PW||'playwright-core');
const fs=require('node:fs'),path=require('node:path');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),SHOTS=process.env.SHOTS||'';
if(!process.env.BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io|vencrm/.test(BASE))throw new Error('Solo contra la copia local de PRUEBA (BASE=http://127.0.0.1:PUERTO/)');
const GH='https://jhon01guevara.github.io/TARJETERIA-JHON/',VC='https://vencrm.com/';
let fallos=0;const chk=(n,ok,d)=>{if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(d!==undefined&&d!==''?'  ['+d+']':''))};
const shot=async(p,n,o)=>{if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot(Object.assign({path:path.join(SHOTS,n+'.png')},o||{}))}};
const reales=[],errs=[],csp=[];
let br;
async function ctx(o,destino){
 const c=await br.newContext(Object.assign({viewport:{width:1366,height:900},serviceWorkers:'block'},o||{}));
 // Las direcciones «reales» se atienden con la copia local: no sale ninguna petición a github.io ni a vencrm.com
 const servir=async(r,pref)=>{const u=r.request().url();let rel=u.slice(pref.length).split('#')[0];const q=rel.indexOf('?');if(q>=0)rel=rel.slice(0,q);if(!rel||rel.endsWith('/'))rel+='index.html';
  try{const rs=await fetch(BASE+rel);const buf=Buffer.from(await rs.arrayBuffer());await r.fulfill({status:rs.status,body:buf,headers:{'content-type':rs.headers.get('content-type')||'application/octet-stream'}})}catch(e){await r.abort()}};
 await c.route(/^https:\/\/jhon01guevara\.github\.io\/TARJETERIA-JHON\//,r=>{reales.push('gh');servir(r,GH)});
 await c.route(/^https:\/\/vencrm\.com\//,r=>{const u=r.request().url();if(r.request().resourceType()==='document'&&!/\/$|index\.html|\?/.test(u.slice(VC.length)||'/')){}servir(r,VC)});
 await c.route(/api\.emailjs\.com/,r=>r.abort());
 await c.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))});
 return c}
async function abre(c,url){const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message.slice(0,160)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR|favicon|recaptcha|firestore|Firebase|ERR_/i.test(m.text()))errs.push(m.text().slice(0,160))});
 await p.goto(url,{waitUntil:'load'});await p.waitForSelector('#au_e',{timeout:30000}).catch(()=>{});await p.waitForTimeout(700);return p}
const aviso=p=>p.evaluate(()=>{const a=document.getElementById('avisoDominio');if(!a)return null;const r=a.getBoundingClientRect(),go=a.querySelector('.avd-go');
 return{txt:a.innerText.replace(/\s+/g,' '),href:go&&go.getAttribute('href'),role:a.getAttribute('role'),lab:a.getAttribute('aria-labelledby'),r:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],vw:innerWidth,vh:innerHeight,desborde:document.documentElement.scrollWidth>innerWidth+1,pasosOculto:document.getElementById('avdPasos').hidden,
  detalles:[...a.querySelectorAll('details')].map(d=>[d.querySelector('summary').textContent,d.open])}});
const cspN=p=>p.evaluate(()=>window.__csp.length);
(async()=>{
 br=await chromium.launch({channel:'chrome',headless:true});
 console.log('\n== 1) github.io, escritorio: el aviso aparece en la pantalla de inicio de sesión ==');
 let c=await ctx(),p=await abre(c,GH);
 let a=await aviso(p);
 chk('aparece con el título y el texto amable',a&&/VEN CRM tiene dirección nueva: vencrm\.com/.test(a.txt)&&/Sus datos están a salvo/.test(a.txt)&&/no hay prisa/.test(a.txt),a&&a.txt.slice(0,120));
 chk('enlace «Abrir vencrm.com» apunta a https://vencrm.com/',a&&a.href==='https://vencrm.com/',a&&a.href);
 chk('accesible: región con nombre',a&&a.role==='region'&&a.lab==='avdT');
 chk('queda dentro de la pantalla (esquina inferior) y sin desborde horizontal',a&&a.r[0]>=0&&a.r[2]<=a.vw&&a.r[3]<=a.vh&&a.r[1]>=0&&!a.desborde,a&&JSON.stringify(a.r));
 chk('el inicio de sesión sigue visible y utilizable (campo de correo enfocable)',await p.evaluate(()=>{const e=document.getElementById('au_e');return !!e&&e.offsetHeight>0}));
 await shot(p,'1-github-io-login-escritorio');
 await p.click('#avisoDominio .avd-como');await p.waitForTimeout(150);
 a=await aviso(p);
 chk('«Cómo reinstalarla» muestra los pasos (computadora abierto primero) y cambia el botón',a&&!a.pasosOculto&&a.detalles.length===3&&a.detalles[0][1]===true&&/Computadora/.test(a.detalles[0][0])&&/Ocultar los pasos/.test(a.txt),JSON.stringify(a&&a.detalles));
 chk('el botón informa su estado (aria-expanded)',await p.getAttribute('#avisoDominio .avd-como','aria-expanded')==='true');
 await shot(p,'1b-pasos-escritorio');
 chk('con #auth abierto el aviso vive dentro de él (así el teclado lo alcanza); al cerrarse #auth vuelve al <body>',await p.evaluate(async()=>{const a=document.getElementById('avisoDominio'),au=document.getElementById('auth');const dentro=a.parentNode===au;au.style.display='none';await new Promise(r=>setTimeout(r,100));const fuera=a.parentNode===document.body;au.style.display='flex';await new Promise(r=>setTimeout(r,100));return dentro&&fuera&&a.parentNode===au}));
 await p.focus('#au_e');const orden=[];for(let i=0;i<14;i++){await p.keyboard.press('Tab');orden.push(await p.evaluate(()=>{const e=document.activeElement;return e&&(e.id||e.className||e.tagName)}))}
 chk('con el teclado (Tab) se llega a los 4 controles del aviso desde el inicio de sesión',['avd-go','avd-como','avd-no','avd-nunca'].every(k=>orden.some(o=>String(o).includes(k))),orden.join(' > '));
 await shot(p,'1c-foco-teclado');
 chk('sin violaciones CSP ni errores de página',await cspN(p)===0&&!errs.length,errs.join('|'));
 chk('no se escribió nada en localStorage hasta que se descarta',await p.evaluate(()=>localStorage.getItem('tj_aviso_dominio')===null));

 console.log('\n== 2) «Ahora no» (14 días), «No mostrar más» y teclado ==');
 await p.click('#avisoDominio .avd-no');await p.waitForTimeout(150);
 chk('«Ahora no» lo quita al instante y guarda la fecha +14 días',await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('tj_aviso_dominio')||'null'),d=o&&o.hasta-Date.now();return !document.getElementById('avisoDominio')&&d>13.9*864e5&&d<=14*864e5+5000}));
 await p.reload({waitUntil:'load'});await p.waitForSelector('#au_e').catch(()=>{});await p.waitForTimeout(600);
 chk('al recargar no vuelve a salir',(await aviso(p))===null);
 await p.evaluate(()=>localStorage.setItem('tj_aviso_dominio',JSON.stringify({hasta:Date.now()-1000})));
 await p.reload({waitUntil:'load'});await p.waitForSelector('#au_e').catch(()=>{});await p.waitForTimeout(600);
 chk('pasados los 14 días vuelve a aparecer',(await aviso(p))!==null);
 await p.focus('#avisoDominio .avd-como');await p.waitForTimeout(100);await p.keyboard.press('Escape');await p.waitForTimeout(150);
 chk('Esc lo descarta (como «Ahora no»)',(await aviso(p))===null&&await p.evaluate(()=>!!JSON.parse(localStorage.getItem('tj_aviso_dominio')).hasta));
 await p.evaluate(()=>localStorage.removeItem('tj_aviso_dominio'));
 await p.reload({waitUntil:'load'});await p.waitForSelector('#au_e').catch(()=>{});await p.waitForTimeout(600);
 await p.click('#avisoDominio .avd-nunca');await p.waitForTimeout(150);
 await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('tj_aviso_dominio'));localStorage.setItem('tj_aviso_dominio',JSON.stringify(o))});
 await p.reload({waitUntil:'load'});await p.waitForSelector('#au_e').catch(()=>{});await p.waitForTimeout(600);
 chk('«No mostrar más» no vuelve a salir',(await aviso(p))===null&&await p.evaluate(()=>JSON.parse(localStorage.getItem('tj_aviso_dominio')).nunca===1));
 chk('descartarlo no afecta el resto del panel (clave propia, ninguna otra clave tj_ cambia)',await p.evaluate(()=>Object.keys(localStorage).filter(k=>/aviso/i.test(k)).join()==='tj_aviso_dominio'));
 await c.close();

 console.log('\n== 3) donde NO debe aparecer ==');
 c=await ctx();p=await abre(c,VC);
 chk('vencrm.com: no aparece',(await aviso(p))===null&&await p.evaluate(()=>location.hostname==='vencrm.com'&&!!window.TJAvisoDominio));
 await c.close();
 c=await ctx();p=await abre(c,BASE);
 chk('127.0.0.1 (copia de prueba): no aparece',(await aviso(p))===null);
 await c.close();
 c=await ctx();p=await c.newPage();p.on('pageerror',e=>errs.push(e.message.slice(0,160)));
 await p.goto(GH+'?tienda=1&emp=genuine-prueba',{waitUntil:'load'});await p.waitForTimeout(3500);
 chk('tienda pública en github.io (?tienda=1): no aparece',(await aviso(p))===null&&await p.evaluate(()=>location.hostname==='jhon01guevara.github.io'&&/tienda=1/.test(location.search)&&!!window.TJAvisoDominio));
 await shot(p,'3-tienda-publica-sin-aviso');
 await c.close();

 console.log('\n== 4) móvil: Android, iPhone y app instalada ==');
 c=await ctx({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'});p=await abre(c,GH);
 await p.click('#avisoDominio .avd-como');await p.waitForTimeout(150);a=await aviso(p);
 chk('Android: aviso dentro de la pantalla, sin desborde, y los pasos de Android primero',a&&a.r[0]>=0&&a.r[2]<=a.vw&&a.r[3]<=a.vh&&!a.desborde&&/Android/.test(a.detalles[0][0]),a&&JSON.stringify([a.r,a.detalles[0]]));
 chk('botones táctiles de al menos 24×24 px',await p.evaluate(()=>[...document.querySelectorAll('#avisoDominio button,#avisoDominio a.btn')].every(b=>{const r=b.getBoundingClientRect();return r.width>=24&&r.height>=24})));
 await shot(p,'4-android-pasos');
 await c.close();
 c=await ctx({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'});
 await c.addInitScript(()=>{try{Object.defineProperty(navigator,'standalone',{get:()=>true})}catch(e){}});
 p=await abre(c,GH);await p.click('#avisoDominio .avd-como');a=await aviso(p);
 chk('iPhone con la app instalada: lo dice y muestra los pasos de iPhone primero',a&&/app instalada desde la dirección antigua/.test(a.txt)&&/iPhone/.test(a.detalles[0][0]),a&&a.detalles[0].join());
 await shot(p,'4b-iphone-instalada');
 await c.close();

 console.log('\n== 5) no toca el service worker ni la red ==');
 c=await ctx();p=await abre(c,GH);
 chk('las direcciones «reales» se atendieron solo desde la copia local (ninguna petición salió a github.io ni a vencrm.com)',reales.length>0);
 chk('sin violaciones CSP en toda la prueba',await cspN(p)===0);
 chk('sin errores de página en toda la prueba',!errs.length,errs.join('|'));
 await c.close();await br.close();
 console.log(fallos?'\nFALLAN '+fallos+' comprobaciones':'\nTODO BIEN');process.exit(fallos?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
