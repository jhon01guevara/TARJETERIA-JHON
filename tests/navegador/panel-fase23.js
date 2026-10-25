/* Fase 23 — batería del PANEL en Chrome real contra la COPIA DE PRUEBA (proyecto `tarjeteria-jhon-prueba`; NUNCA producción).
   Para cada rol (administrador, vendedor, sin permisos): inicio de sesión, menú esperado, recorrido por TODAS las pantallas de su menú sin errores de JavaScript,
   sin violaciones de la CSP y sin «permission-denied» en consola; el vendedor no tiene los permisos de administración; «sin permisos» no entra; y las validaciones del formulario de acceso.
   SOLO NAVEGA: no pulsa ningún botón que guarde ni crea datos. (Lo único que se escribe es lo que la propia app declara sola al abrir ciertas pantallas, p. ej. Marketing declara miembros, y solo en el proyecto de PRUEBA; el intento con contraseña incorrecta es contra Authentication de PRUEBA.)
   Uso: BASE=http://127.0.0.1:8951/ node tests/navegador/panel-fase23.js          (la copia se prepara con `node tests/navegador/copia-prueba.js /tmp/copia` y se sirve con python3 -m http.server)
        o  BASE=https://tarjeteria-jhon-prueba.web.app/ node tests/navegador/panel-fase23.js
   Variables: PRUEBA_PASSWORD (obligatoria), PW (ruta de playwright-core), VP (1366x900 por defecto; 390x844 para móvil), ROLES (admin,vendedor,sinpermisos).
   Código de salida: 0 todo bien · 1 alguna comprobación falló · 2 no se pudo preparar. */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=(process.env.BASE||'').replace(/\/?$/,'/'),PASS=process.env.PRUEBA_PASSWORD;
if(!process.env.BASE||/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Esta prueba solo corre contra la copia de PRUEBA (BASE=…)');
if(!PASS){console.error('Falta PRUEBA_PASSWORD');process.exit(2)}
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number);
const ROLES=(process.env.ROLES||'admin,vendedor,sinpermisos').split(',');
const ESPERADO={
 admin:{claves:['home','nueva','fac','cli','vend','prod','cat','gal','marketing','tienda','chat','tiktoklive','mapa','ubi','agenda','check','empresas','config'],nombre:/Administrador/i},
 vendedor:{claves:['home','nueva','fac','cli','prod','marketing','chat'],nombre:/Vendedor Prueba/i,sinPermiso:['vend','config','empresas','mapa']}
};
/* ruido conocido de la copia de prueba (no son errores del panel): archivo catalogo_default.zip no incluido (404), service worker bloqueado a propósito, cuota del plan gratuito de Firestore (429 / resource-exhausted) y los cortes del canal de escritura que provoca (400 / «Write stream transport errored») */
const RUIDO=/Failed to load resource: the server responded with a status of (404|429)|Service Worker registration blocked|resource-exhausted|Quota exceeded|RPC 'Write' stream .* transport errored|Failed to load resource: the server responded with a status of 400|ERR_INTERNET_DISCONNECTED|favicon|chrome-extension/i;
let fallos=0,total=0;
const chk=(rol,n,ok,det)=>{total++;if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(det?'  ['+det+']':''))};
const hablar=r=>console.log('\n== '+r+' ('+W+'x'+H+') ==');

async function abrir(br){
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600});
 const page=await ctx.newPage(),S={err:[],cons:[],noise:0};
 page.on('pageerror',e=>S.err.push(e.message.slice(0,200)));
 page.on('console',m=>{const t=m.text();if(['error','warning'].includes(m.type())||/Content Security Policy/i.test(t)){if(RUIDO.test(t))S.noise++;else S.cons.push(m.type()+': '+t.slice(0,200))}});
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,80)))});
 await page.goto(BASE,{waitUntil:'load'});
 await page.waitForSelector('#au_e',{timeout:20000});await page.waitForTimeout(1500);
 return {ctx,page,S};
}
async function entrar(page,correo,clave){await page.fill('#au_e',correo);await page.fill('#au_p',clave);await page.click('text=Entrar')}
const mensajeAcceso=page=>page.evaluate(()=>{const e=document.querySelector('#au_m,#au_msg,.aerr');return e?e.textContent.trim():''});

async function panel(br,rol){
 hablar('rol '+rol);const E=ESPERADO[rol],{ctx,page,S}=await abrir(br);
 await entrar(page,rol+'.prueba@example.com',PASS);
 try{await page.waitForSelector('.ni',{state:'attached',timeout:40000})}catch(e){chk(rol,'el menú aparece tras iniciar sesión',false,'sin menú en 40 s');await ctx.close();return}
 await page.waitForTimeout(3500);
 chk(rol,'el menú aparece tras iniciar sesión',true);
 const info=await page.evaluate(()=>({claves:[...new Set([...document.querySelectorAll('#nav .ni')].map(e=>e.dataset.k))],nombre:document.body.innerText.slice(0,4000),pantallaLogin:getComputedStyle(document.getElementById('auth')||document.body).display,adm:typeof esAdmin==='function'&&esAdmin(),
  perm:Object.fromEntries(['config','vend','mapa','empresas','nueva','fac','cli','prod'].map(k=>[k,typeof puede==='function'?puede(k):null]))}));
 chk(rol,'se oculta la pantalla de acceso',info.pantallaLogin==='none',info.pantallaLogin);
 chk(rol,'menú esperado: '+E.claves.join(', '),JSON.stringify(info.claves.slice().sort())===JSON.stringify(E.claves.slice().sort()),'tiene: '+info.claves.join(', '));
 chk(rol,'rol administrador = '+(rol==='admin'),info.adm===(rol==='admin'));
 if(E.sinPermiso)chk(rol,'sin permisos de administración ('+E.sinPermiso.join(', ')+') según puede()',E.sinPermiso.every(k=>info.perm[k]===false),JSON.stringify(info.perm));
 else chk(rol,'con todos los permisos según puede()',Object.values(info.perm).every(v=>v===true),JSON.stringify(info.perm));
 /* recorre todas las pantallas del menú (solo navegar) */
 const sel=W<821?'#nav2':'#nav';let vistas=0;
 for(const k of info.claves){
  try{
   await page.click(sel+' .ni[data-k="'+k+'"]',{timeout:6000});await page.waitForTimeout(1800);
   const r=await page.evaluate(k=>{const m=document.querySelector('main')||document.getElementById('app')||document.body;const t=(m.innerText||'').trim();return {vista:typeof vista!=='undefined'?vista:null,chars:t.length,sel:!!document.querySelector('#nav .ni.on[data-k="'+k+'"],#nav .ni.act[data-k="'+k+'"],#nav .ni.a[data-k="'+k+'"]'),perm:/permission-denied|Missing or insufficient permissions/i.test(t),titulo:(document.getElementById('tt')||{}).textContent}},k);
   const ok=r.vista===k&&r.chars>40&&!r.perm;if(ok)vistas++;
   if(!ok)chk(rol,'pantalla «'+k+'» se abre con contenido y sin error de permisos',false,JSON.stringify(r));
  }catch(e){chk(rol,'pantalla «'+k+'» se puede abrir',false,e.message.slice(0,90))}
 }
 chk(rol,'las '+info.claves.length+' pantallas del menú se abren con contenido y sin «permission-denied»',vistas===info.claves.length,vistas+' de '+info.claves.length);
 /* un rol sin permiso no ve las pantallas de administración aunque se pida por código: puede() las niega y el menú no las ofrece */
 if(E.sinPermiso){
  const prot=await page.evaluate(()=>['config','vend','empresas','mapa'].map(k=>!![...document.querySelectorAll('#nav .ni,#nav2 .ni')].find(e=>e.dataset.k===k)));
  chk(rol,'el menú del vendedor no ofrece Configuración, Vendedores, Empresas ni Mapa',prot.every(x=>!x),JSON.stringify(prot));
 }
 const csp=await page.evaluate(()=>window.__csp);
 chk(rol,'sin violaciones de la CSP',csp.length===0,csp.slice(0,3).join(' | '));
 chk(rol,'sin errores de JavaScript no capturados',S.err.length===0,S.err.slice(0,2).join(' | '));
 chk(rol,'sin errores ni avisos de consola (salvo el ruido conocido de la copia: '+S.noise+' líneas)',S.cons.length===0,S.cons.slice(0,3).join(' | '));
 chk(rol,'ningún mensaje «permission-denied» en consola',!S.cons.some(c=>/permission-denied|insufficient permissions/i.test(c)));
 /* cerrar sesión: vuelve a la pantalla de acceso */
 const sal=page.locator('button:has-text("Salir"):visible, #btnSalir:visible, [data-k="salir"]:visible').first();
 if(await sal.count()){try{await sal.click({timeout:4000});await page.waitForTimeout(2500);chk(rol,'«Salir» devuelve a la pantalla de acceso',await page.evaluate(()=>{const a=document.getElementById('auth');return !!a&&getComputedStyle(a).display!=='none'}))}catch(e){chk(rol,'«Salir» devuelve a la pantalla de acceso',false,e.message.slice(0,80))}}
 await ctx.close();
}

async function sinPermisos(br){
 hablar('rol sinpermisos');const {ctx,page,S}=await abrir(br);
 await entrar(page,'sinpermisos.prueba@example.com',PASS);
 await page.waitForFunction(()=>/no tiene acceso/i.test(document.body.innerText),null,{timeout:40000}).catch(()=>{});
 await page.waitForTimeout(1500);
 const r=await page.evaluate(()=>({msg:/Su cuenta no tiene acceso\. Pídale al administrador que la active\./.test(document.body.innerText),claves:document.querySelectorAll('#nav .ni').length,auth:getComputedStyle(document.getElementById('auth')).display,ses:typeof SES!=='undefined'?SES:'n/d',fb:!!(window.firebase&&firebase.auth&&firebase.auth().currentUser)}));
 chk('sinpermisos','muestra «Su cuenta no tiene acceso. Pídale al administrador que la active.»',r.msg);
 chk('sinpermisos','no aparece ninguna pantalla del menú',r.claves===0,r.claves+' elementos de menú');
 chk('sinpermisos','se queda en la pantalla de acceso',r.auth!=='none',r.auth);
 chk('sinpermisos','la sesión de Firebase se cierra sola (signOut)',r.fb===false);
 chk('sinpermisos','sin sesión de panel (SES vacía)',!r.ses);
 const csp=await page.evaluate(()=>window.__csp);
 chk('sinpermisos','sin violaciones de la CSP',csp.length===0,csp.slice(0,3).join(' | '));
 chk('sinpermisos','sin errores de JavaScript no capturados',S.err.length===0,S.err.slice(0,2).join(' | '));
 await ctx.close();
}

async function formulario(br){
 hablar('formulario de acceso');const {ctx,page,S}=await abrir(br);
 const txt=()=>page.evaluate(()=>(document.querySelector('#auth')||document.body).innerText);
 await page.fill('#au_e','');await page.fill('#au_p','');await page.click('text=Entrar');await page.waitForTimeout(1200);
 const t1=await txt();
 chk('form','con los campos vacíos no entra y avisa',/(correo|contraseña|escriba|ingrese|complete)/i.test(t1)&&!await page.$('.ni'),t1.replace(/\s+/g,' ').slice(-120));
 await entrar(page,'admin.prueba@example.com','clave-incorrecta-'+Date.now());
 await page.waitForFunction(()=>/(incorrect|inválid|invalid|no es correct|error|no se pudo|contraseña)/i.test((document.getElementById('auth')||document.body).innerText.split('Entrar').pop()||''),null,{timeout:15000}).catch(()=>{});
 await page.waitForTimeout(800);
 const t2=await txt();
 chk('form','con una contraseña incorrecta no entra y muestra un aviso',!await page.$('.ni')&&/(incorrect|inválid|invalid|contraseña|no se pudo)/i.test(t2),t2.replace(/\s+/g,' ').slice(-140));
 chk('form','sin errores de JavaScript no capturados',S.err.length===0,S.err.slice(0,2).join(' | '));
 await ctx.close();
}

(async()=>{
 let br;
 try{
  br=await chromium.launch({channel:'chrome',headless:true});
  for(const r of ROLES){if(r==='sinpermisos')await sinPermisos(br);else if(ESPERADO[r])await panel(br,r);else if(r==='formulario')await formulario(br)}
  if(!ROLES.includes('formulario')&&!process.env.ROLES)await formulario(br);
 }catch(e){console.log('ERROR: '+e.message);process.exit(2)}finally{if(br)await br.close()}
 console.log('\n'+(total-fallos)+' comprobaciones correctas, '+fallos+' fallidas');
 process.exit(fallos?1:0);
})();
