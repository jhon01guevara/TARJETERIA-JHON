/* SUITE DE HUMO de VEN CRM en Chrome real (npm run humo).
   Recorre, como un usuario, lo que NO puede romperse: login, panel, crear cliente, crear producto, emitir una factura, Catálogo, tienda pública (vacía y con
   productos), pedido desde la tienda, ver ese pedido en el panel, cambiar nombre y logo, y recargar sin fugas de la marca de Tarjetería Jhon en otra empresa.
   SOLO usa el proyecto de PRUEBA (tarjeteria-jhon-prueba) y una empresa propia de prueba («humo-prueba»), que se vacía al empezar y al terminar.
   PRODUCCIÓN ESTÁ BLOQUEADA: cualquier petición al proyecto `tarjeteria-jhon`, a sus sitios (*.web.app / *.firebaseapp.com), a vencrm.com o a github.io se aborta
   en la red del navegador y hace fallar la suite.
   Si algo falla: imprime «FALLA en el paso N», el motivo y la ruta de una captura (carpeta humo-capturas/, o la de HUMO_OUT). Salida: 0 todo bien · 1 algo falló · 2 no se pudo preparar.
   Requisitos (fuera del repo): Google Chrome, `npm i playwright-core` (o PW=/ruta/a/playwright-core) y PRUEBA_PASSWORD (contraseña de admin.prueba@example.com).
   Uso: PRUEBA_PASSWORD=… npm run humo             (arma solo una copia de PRUEBA del repo actual y la sirve en local)
        PRUEBA_PASSWORD=… BASE=http://127.0.0.1:8960/ node tests/navegador/humo.js   (usa una copia ya servida, hecha con copia-prueba.js)
   Opciones: HUMO_OUT=/ruta (capturas) · HUMO_VER=1 (ventana visible) · SOLO=3,4 (solo esos pasos, p. ej. para depurar). */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),{spawnSync}=require('node:child_process');
const RAIZ=path.resolve(__dirname,'..','..');
function cargarPW(){
 for(const r of [process.env.PW,'playwright-core','playwright'].filter(Boolean)){try{return require(r)}catch(e){}}
 console.error('No encuentro playwright-core. Instálelo FUERA del repo (npm i playwright-core) o indique PW=/ruta/a/playwright-core');process.exit(2)}
const {chromium}=cargarPW();
const EMP='humo-prueba',PRUEBA='tarjeteria-jhon-prueba',ADMIN='admin.prueba@example.com';
const OUT=path.resolve(process.env.HUMO_OUT||path.join(process.cwd(),'humo-capturas'));
const SOLO=(process.env.SOLO||'').split(',').filter(Boolean).map(Number);
/* ---------- PRODUCCIÓN BLOQUEADA ---------- */
const PROD=/(projects(\/|%2F)tarjeteria-jhon(\/|%2F|$)|tarjeteria-jhon\.(web\.app|firebaseapp\.com|firebasestorage\.app)|\/b\/tarjeteria-jhon\.|AIzaSyBle5zbvVjXIVXvOz8tgxBBbu8-Ty1Msrs|vencrm\.com|jhon01guevara\.github\.io)/i;
const URL_PROD=/^https?:\/\/([^/]*\.)?(tarjeteria-jhon\.(web\.app|firebaseapp\.com)|vencrm\.com|jhon01guevara\.github\.io)/i;
if(!process.env.PRUEBA_PASSWORD){console.error('Falta PRUEBA_PASSWORD (contraseña de '+ADMIN+', proyecto de PRUEBA).');process.exit(2)}
if(process.env.BASE&&URL_PROD.test(process.env.BASE)){console.error('BASE apunta a producción: esta suite solo corre contra el proyecto de PRUEBA.');process.exit(2)}
const tocoProd=[];
/* ---------- servidor local de la copia de PRUEBA ---------- */
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.zip':'application/zip','.woff2':'font/woff2','.woff':'font/woff','.txt':'text/plain','.xml':'application/xml','.mp3':'audio/mpeg','.mp4':'video/mp4'};
function servir(dir){return new Promise(res=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(dir,p);
  if(!f.startsWith(dir)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);return rs.end('no existe')}
  rs.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(f).pipe(rs)});
 s.listen(0,'127.0.0.1',()=>res({s,base:'http://127.0.0.1:'+s.address().port+'/'}))})}
/* ---------- registro de pasos ---------- */
const res=[];let n=0,foco=null,abortar=false,consola=[];
const LIMPIO=t=>String(t).replace(/\s+/g,' ').trim();
async function captura(nombre){try{if((!foco||foco.isClosed())&&ap0()&&!ap0().isClosed())foco=ap0();if(!foco||foco.isClosed())return'(sin página abierta)';fs.mkdirSync(OUT,{recursive:true});const f=path.join(OUT,String(n).padStart(2,'0')+'-'+nombre.replace(/[^a-z0-9]+/gi,'-').slice(0,50)+'.png');await foco.screenshot({path:f,fullPage:false});return f}catch(e){return'(no se pudo capturar: '+e.message+')'}}
async function paso(nombre,fn,opc){
 n++;if(SOLO.length&&!SOLO.includes(n))return;
 if(abortar){res.push({n,nombre,estado:'omitido'});console.log('  --  Paso '+n+' · '+nombre+'  (omitido: un paso anterior imprescindible falló)');return}
 const t0=Date.now(),antes=consola.length;permitidas=(opc&&opc.avisos)||null;
 try{if(ap0()&&!(opc&&opc.sinFoco))foco=ap0();await fn();
  const nuevos=consola.slice(antes);if(nuevos.length)throw new Error('Errores en el navegador durante este paso: '+nuevos.slice(0,3).join(' | '));
  if(tocoProd.length)throw new Error('SE INTENTÓ TOCAR PRODUCCIÓN (bloqueado): '+tocoProd[0]);
  res.push({n,nombre,estado:'ok'});console.log('  ok  Paso '+n+' · '+nombre+'  ('+((Date.now()-t0)/1000).toFixed(1)+' s)')}
 catch(e){const f=await captura(nombre);res.push({n,nombre,estado:'falla',motivo:e.message,captura:f});
  console.log('\n  FALLA en el paso '+n+' · '+nombre+'\n     motivo:  '+LIMPIO(e.message).slice(0,500)+'\n     captura: '+f+'\n');if(opc&&opc.vital)abortar=true}
}
const exige=(ok,msg,det)=>{if(!ok)throw new Error(msg+(det!==undefined&&det!==''?'  ['+det+']':''))};
/* ---------- contextos de navegador ---------- */
let TOTAL=10,br,BASE,permitidas=null,ap0=()=>null;
async function contexto(o){
 const c=await br.newContext(Object.assign({viewport:{width:1366,height:900},serviceWorkers:'block'},o||{}));
 await c.route(PROD,r=>{tocoProd.push(r.request().url().slice(0,120));r.abort()});
 await c.route(/api\.emailjs\.com/,r=>r.abort());
 await c.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+(e.blockedURI||'')));window.print=()=>{window.__imprimio=(window.__imprimio||0)+1}});
 return c}
async function pagina(c,url,esperar){
 const p=await c.newPage();foco=p;
 p.on('pageerror',e=>consola.push('JS: '+e.message.slice(0,160)));
 p.on('dialog',d=>{const m=d.message().replace(/\s+/g,' ').slice(0,140);if(!(permitidas&&permitidas.test(m)))consola.push('Aviso inesperado en pantalla: «'+m+'»');d.accept()});
 p.on('response',r=>{const u=r.url();if(r.status()>=400&&u.startsWith(BASE))consola.push('HTTP '+r.status()+' '+u.replace(BASE,'/').slice(0,80))});
 await p.goto(BASE+url,{waitUntil:'load'});if(esperar)await p.waitForSelector(esperar,{timeout:30000});return p}
async function csp(p){const v=await p.evaluate(()=>window.__csp);exige(v.length===0,'Violaciones de la política de seguridad (CSP)',v.slice(0,3).join(' | '))}
async function esPrueba(p){const id=await p.evaluate(()=>{try{return firebase.app().options.projectId}catch(e){return''}});exige(id===PRUEBA,'La copia NO apunta al proyecto de prueba',id)}
async function entrar(p){
 await p.waitForSelector('#au_e',{timeout:30000});await p.waitForTimeout(900);await esPrueba(p);
 await p.fill('#au_e',ADMIN);await p.fill('#au_p',process.env.PRUEBA_PASSWORD);await p.click('text=Entrar');
 await p.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await p.waitForTimeout(3500)}
const COLS=['catalogo','panel_public','panel','tienda_items','tienda_leads','tienda_pedidos','chats','vendedores','galeria','llamadas','wa_conversaciones','marketing_assets','marketing_colecciones','marketing_exports','marketing_projects'];
async function vaciarEmpresa(sembrar){
 const c=await contexto(),p=await pagina(c,'?emp='+EMP);
 try{await entrar(p);
  return await p.evaluate(async([emp,sembrar,cols])=>{if(!/tarjeteria-jhon-prueba/.test(JSON.stringify(firebase.app().options)))throw new Error('NO ES PRUEBA');
   let k=0;for(const col of cols){const s=await fbDb.collection('empresas/'+emp+'/'+col).get();for(const d of s.docs){if(col==='panel'&&d.id==='migracion_roles_v1')continue;await d.ref.delete();k++}}
   if(sembrar)await fbDb.collection('empresas').doc(emp).set({id:emp,slug:emp,nombre:'Humo Prueba',logo:'',estado:'activa',ts:Date.now()},{merge:true});
   return k},[EMP,sembrar,COLS])}
 finally{await c.close()}}
const SVG='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="240" height="80" fill="#0F6CBD"/><text x="120" y="52" font-family="Arial" font-weight="700" font-size="30" text-anchor="middle" fill="#fff">HUMO</text></svg>');
/* sonda de «fugas»: cada 15 ms mira si la tienda de otra empresa muestra algo de Tarjetería Jhon */
const sondaFuga=()=>{window.__fuga=[];const f=()=>{const sh=document.querySelector('#shop');if(!sh)return;const im=sh.querySelector('.kbrand img'),txt=sh.innerText||'',p=[];
 if(im&&/assets\/logo(-t)?\.png/.test(im.getAttribute('src')||''))p.push('logo-tarjeteria');if(/Tarjeter[ií]a/i.test(txt))p.push('texto-tarjeteria');if(/Cada momento merece/i.test(txt))p.push('eslogan-tarjeteria');
 if(p.length)window.__fuga.push(p.join('+')+' @'+Math.round(performance.now()))};setInterval(f,15)};
const esperarFn=(p,fn,arg,ms)=>p.waitForFunction(fn,arg,{timeout:ms||20000});

(async()=>{
 let srv=null;
 try{
  if(process.env.BASE)BASE=process.env.BASE.replace(/\/?$/,'/');
  else{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'humo-copia-'));
   const r=spawnSync(process.execPath,[path.join(__dirname,'copia-prueba.js'),tmp],{env:Object.assign({},process.env,{CON_ZIP:'1'}),encoding:'utf8'});
   if(r.status!==0){console.error('No se pudo armar la copia de PRUEBA:\n'+(r.stdout||'')+(r.stderr||''));process.exit(2)}
   srv=await servir(tmp);BASE=srv.base}
  br=await chromium.launch({channel:'chrome',headless:!process.env.HUMO_VER});
  console.log('\nSUITE DE HUMO · VEN CRM · copia: '+BASE+' · proyecto de PRUEBA · empresa «'+EMP+'»\n');
  if(!SOLO.length){const k=await vaciarEmpresa(true);console.log('  (preparación) empresa de prueba lista; documentos viejos borrados: '+k+'\n')}
  let admin,ap;ap0=()=>ap;const tienda=BASE+'?tienda=1&emp='+EMP;
  /* ============ 1. Acceso ============ */
  await paso('Abre la pantalla de acceso (login) sin errores',async()=>{
   const c=await contexto();const p=await pagina(c,'?emp='+EMP,'#au_e');await p.waitForTimeout(1500);
   const t=await p.evaluate(()=>({t:document.title,logo:!!document.querySelector('#au_e')&&document.body.innerText.length>20,btn:/Entrar/.test(document.body.innerText)}));
   exige(/VEN CRM/.test(t.t),'El título de la pestaña no es VEN CRM',t.t);exige(t.btn,'No aparece el botón «Entrar»');await esPrueba(p);await csp(p);await c.close()},{vital:true});
  await paso('Inicia sesión como administrador y abre el panel (Inicio)',async()=>{
   admin=await contexto();ap=await pagina(admin,'?emp='+EMP);await entrar(ap);
   const o=await ap.evaluate(()=>({emp:TJEmpresa.empActiva(),nav:[...document.querySelectorAll('#nav .ni')].map(x=>x.dataset.k),adm:esAdmin(),t:document.title}));
   exige(o.emp===EMP,'La empresa activa no es la de prueba',o.emp);exige(o.adm,'No entró como administrador');
   for(const k of ['home','nueva','fac','cli','prod','cat','tienda','config'])exige(o.nav.includes(k),'Falta «'+k+'» en el menú',o.nav.join(','));
   await esperarFn(ap,()=>typeof _cliBase!=='undefined'&&_cliBase!==null,null,30000).catch(()=>{});
   exige(/Inicio/.test(await ap.innerText('#tt')),'El título de la pantalla no es «Inicio»');await csp(ap)},{vital:true});
  /* ============ 2. Clientes y productos ============ */
  await paso('Crea un cliente (Clientes) y lo ve en la lista',async()=>{
   await ap.evaluate(()=>ir('cli'));await ap.waitForSelector('#cn');await ap.fill('#cn','Cliente Humo');await ap.fill('#cr','8-123-456');await ap.fill('#ct2','6123-4567');await ap.fill('#cd2','Calle de prueba 1');
   await ap.click('#v .card:first-child button.btn.p:has-text("Agregar")');await ap.waitForTimeout(1200);
   const t=await ap.evaluate(()=>({n:DB.cli.length,txt:document.getElementById('v').innerText}));
   exige(t.n===1&&/Cliente Humo/.test(t.txt),'El cliente no aparece en la lista',JSON.stringify({n:t.n}))});
  await paso('Crea un producto (Productos) y lo ve en la lista',async()=>{
   await ap.evaluate(()=>ir('prod'));await ap.waitForSelector('#pn');await ap.fill('#pn','Producto Humo');await ap.fill('#pp','10');
   await ap.click('#v .card:first-child button.btn.p:has-text("Agregar")');await ap.waitForTimeout(1000);
   const t=await ap.evaluate(()=>({n:DB.prod.length,txt:document.getElementById('v').innerText}));
   exige(t.n===1&&/Producto Humo/.test(t.txt)&&/10\.00/.test(t.txt),'El producto no aparece con su precio',JSON.stringify({n:t.n}))});
  /* ============ 3. Factura ============ */
  await paso('Emite una factura (cliente, producto, total con ITBMS) y la ve en Facturas',async()=>{
   await ap.evaluate(()=>ir('nueva'));await ap.waitForSelector('#f_cs');
   const cid=await ap.evaluate(()=>DB.cli[0].id);await ap.selectOption('#f_cs',cid);
   exige(await ap.inputValue('#f_cn')==='Cliente Humo','Al elegir el cliente no se llenó su nombre');
   const pid=await ap.evaluate(()=>DB.prod[0].id);await ap.selectOption('#fi tr:first-child select',pid);await ap.waitForTimeout(300);
   exige(await ap.inputValue('#fi tr:first-child input[aria-label^="Precio"]')==='10','Al elegir el producto no se puso su precio');
   const itb=await ap.evaluate(()=>+DB.cfg.itbms||0);TOTAL=Math.round(10*(1+itb/100)*100)/100;
   const tot=await ap.textContent('#t3');exige(tot.replace(/[^0-9.]/g,'')===TOTAL.toFixed(2),'El total (10 + ITBMS '+itb+' %) no es $'+TOTAL.toFixed(2),tot);
   await ap.click('button:has-text("Emitir factura")');await ap.waitForTimeout(1500);
   const f=await ap.evaluate(()=>({n:DB.fac.length,v:vista,t:document.getElementById('v').innerText,imp:window.__imprimio||0,tot:DB.fac[0]&&DB.fac[0].total,cli:DB.fac[0]&&DB.fac[0].cli}));
   exige(f.n===1&&f.v==='fac','No se guardó la factura o no fue a «Facturas»',JSON.stringify({n:f.n,v:f.v}));
   exige(/Cliente Humo/.test(f.t)&&f.t.includes(TOTAL.toFixed(2)),'La factura no aparece en el historial con cliente y total',f.t.slice(0,120));
   exige(f.imp>=1,'No se abrió la impresión de la factura')});
  await paso('Guía «Primeros pasos»: detecta sola el cliente, el producto y la factura y no estorba',async()=>{
   await esperarFn(ap,()=>window.guiaEstado&&guiaEstado()&&guiaEstado().hechos>=3,null,12000).catch(()=>{});
   const g=await ap.evaluate(()=>{const e=window.guiaEstado&&guiaEstado();return e&&{t:e.total,ids:e.items.filter(i=>i.hecho).map(i=>i.p.id)}});
   exige(!!g,'No cargó la guía de primeros pasos (js/guia.js)');
   for(const id of ['cliente','producto','venta'])exige(g.ids.includes(id),'La guía no marcó sola el paso «'+id+'»',JSON.stringify(g.ids));
   await ap.evaluate(()=>ir('home'));await ap.waitForTimeout(800);
   exige(await ap.evaluate(()=>!!document.getElementById('guiaCard')||!!document.getElementById('guiaAbrir')),'Inicio no muestra la guía (ni su botón «Primeros pasos»)');
   await csp(ap)});
  await paso('Los datos quedaron guardados en la nube (cliente, producto y factura)',async()=>{
   await esperarFn(ap,async()=>{try{const d=await fbDocRef.get(),c=d.exists?d.data():{};const s=JSON.stringify(c);return /Producto Humo/.test(s)&&/Cliente Humo/.test(s)}catch(e){return false}},null,25000).catch(()=>{});
   const r=await ap.evaluate(async TOTAL=>{try{const d=await fbDocRef.get(),s=JSON.stringify(d.exists?d.data():{});return{prod:/Producto Humo/.test(s),fac:s.includes('"total":'+TOTAL),cli:/Cliente Humo/.test(s)||/Cliente Humo/.test(JSON.stringify(((await clientesRef().get()).data()||{})))}}catch(e){return{err:e.message}}},TOTAL);
   exige(!r.err&&r.prod&&r.fac&&r.cli,'La nube no tiene todo lo creado',JSON.stringify(r))});
  /* ============ 4. Catálogo y Tienda (panel) ============ */
  await paso('Catálogo: abre y una empresa nueva no hereda modelos de Tarjetería',async()=>{
   await ap.evaluate(()=>ir('cat'));await ap.waitForTimeout(2000);
   const t=await ap.evaluate(()=>({n:(typeof CL!=='undefined'?CL.length:-1),t:document.getElementById('v').innerText}));
   exige(t.n===0&&!/PW0\d\d/.test(t.t),'El catálogo de una empresa nueva debe estar vacío',t.n+' · '+t.t.slice(0,80))});
  await paso('Tienda (panel): abre y muestra el enlace de la tienda de la empresa',async()=>{
   await ap.evaluate(()=>ir('tienda'));await ap.waitForSelector('#td_link');
   const l=await ap.inputValue('#td_link');exige(/[?&]tienda=1/.test(l)&&l.includes('emp='+EMP),'El enlace de la tienda no apunta a la empresa',l)});
  /* ============ 5. Tienda pública ============ */
  await paso('Tienda pública SIN productos: estado vacío neutro, sin Tarjetería',async()=>{
   const c=await contexto();await c.addInitScript(sondaFuga);const p=await pagina(c,'?tienda=1&emp='+EMP,'#k_footer');await p.waitForTimeout(5000);
   const t=await p.evaluate(()=>({t:document.getElementById('shop').innerText,cards:document.querySelectorAll('#sh_g .kc:not(.ksk)').length,fuga:window.__fuga,pw:/PW0\d\d/.test(document.body.innerText)}));
   exige(/Esta tienda aún no tiene productos/.test(t.t),'No muestra «Esta tienda aún no tiene productos»',t.t.slice(0,80));exige(t.cards===0&&!t.pw,'La tienda vacía muestra productos',t.cards);
   exige(t.fuga.length===0,'Se coló la marca de Tarjetería en la tienda de otra empresa',t.fuga.join(' ; '));await csp(p);await c.close()});
  await paso('Publica un producto en la tienda y el panel lo cuenta como publicado',async()=>{
   await ap.evaluate(async([svg])=>{await fbCol('tienda_items').doc('__cfg').set({__cfg:true,empresaNombre:'Humo Prueba',heroTitle:'Tienda de Humo',heroSub:'Prueba automática',contacto:{tel:'+507 6999-0000',email:'humo@example.com'},ts:Date.now()},{merge:true});
    await fbCol('tienda_items').doc('prod_humo').set({id:'prod_humo',name:'Producto de humo',cat:'General',price:12.5,desc:'Producto de la prueba automática',img:svg,tags:[],stock:'ok',badges:[],ts:Date.now()})},[SVG]);
   await ap.evaluate(()=>ir('tienda'));await ap.waitForTimeout(2500);
   const t=await ap.evaluate(()=>document.getElementById('v').innerText);exige(/1 publicados/.test(t),'El panel no cuenta el producto como publicado',(t.match(/\(\d+ publicados[^)]*\)/)||[''])[0])});
  await paso('Tienda pública CON productos: tarjeta con nombre y precio, sin errores',async()=>{
   const c=await contexto();await c.addInitScript(sondaFuga);const p=await pagina(c,'?tienda=1&emp='+EMP,'#sh_g .kc .kadd');await p.waitForTimeout(3500);
   const t=await p.evaluate(()=>({t:document.getElementById('sh_g').innerText,fuga:window.__fuga,h:document.title,tit:(document.querySelector('.khero-title')||{}).textContent}));
   exige(/Producto de humo/.test(t.t)&&/12\.50/.test(t.t),'La tarjeta no muestra nombre y precio',t.t.slice(0,100));exige(t.fuga.length===0,'Marca de Tarjetería en la tienda',t.fuga.join(' ; '));
   exige(/Humo/.test(t.h),'El título de la pestaña no es el de la empresa',t.h);await csp(p);await c.close()});
  /* ============ 6. Pedido desde la tienda ============ */
  await paso('Hace un pedido desde la tienda (carrito → registro → «¡Pedido enviado!»)',async()=>{
   const c=await contexto();const p=await pagina(c,'?tienda=1&emp='+EMP,'#sh_g .kc .kadd');await p.waitForTimeout(3000);await esPrueba(p);
   await p.locator('#sh_g .kc .kadd').first().click();await p.waitForSelector('#shopm .kpk',{timeout:8000});await p.click('#k_pb');await p.waitForTimeout(3200);
   await p.click('.kfab');await p.waitForSelector('#sh_sb',{timeout:8000});
   const resumen=await p.evaluate(()=>document.getElementById('shopm').innerText);exige(/Producto de humo/.test(resumen)&&/12\.50/.test(resumen),'«Su pedido» no muestra el producto y el total',resumen.slice(0,120));
   await p.fill('#sh_nt','Pedido de la prueba de humo');await p.check('#sh_chk_poli');await p.click('#sh_sb');await p.waitForSelector('#sh_n',{timeout:8000});
   await p.fill('#sh_n','Comprador Humo');await p.fill('#sh_t','6123-4567');await p.fill('#sh_e','humo-comprador@example.com');await p.fill('#sh_c','Empresa Humo');await p.fill('#sh_d','Panamá');
   await p.check('#sh_chk_poli_reg');await p.click('#sh_b');
   await p.waitForFunction(()=>document.querySelector('#shopm').dataset.k==='ok',null,{timeout:30000}).catch(()=>{});
   const f=await p.evaluate(()=>({k:document.querySelector('#shopm').dataset.k,t:document.querySelector('#shopm').innerText,m:(document.getElementById('sh_m')||{}).textContent}));
   exige(f.k==='ok'&&/¡Pedido enviado!/.test(f.t),'El pedido no terminó en «¡Pedido enviado!»',f.k+' '+(f.m||f.t.slice(0,80)));await csp(p);await c.close()});
  await paso('El pedido llega al panel (Tienda → «Pedidos de la tienda»)',async()=>{
   await ap.evaluate(()=>ir('tienda'));
   await esperarFn(ap,()=>typeof TD!=='undefined'&&TD.peds&&TD.peds.length>=1,null,30000).catch(()=>{});
   await ap.evaluate(()=>{tdRender()});await ap.waitForTimeout(800);
   const t=await ap.evaluate(()=>({n:TD.peds.length,txt:document.getElementById('v').innerText}));
   exige(t.n>=1&&/Comprador Humo/.test(t.txt),'El pedido no aparece en el panel',JSON.stringify({n:t.n}))});
  /* ============ 7. Nombre y logo ============ */
  await paso('Cambia el nombre de la empresa (Configuración) y el panel lo usa',async()=>{
   await ap.evaluate(()=>{ir('config');cfgTab('gen')});await ap.waitForSelector('#btnEditCfg',{state:'attached'});
   await ap.evaluate(()=>{const b=document.getElementById('body_cfg_empresa');if(b&&b.style.display==='none')toggleCard('cfg_empresa')}).catch(()=>{});
   await ap.waitForTimeout(500);
   await ap.evaluate(()=>{toggleEditCfg(true);const e=document.getElementById('c1');e.value='Humo Renombrada';e.dispatchEvent(new Event('input',{bubbles:true}))});
   await ap.evaluate(()=>cfg());await ap.waitForTimeout(2500);
   const t=await ap.evaluate(async()=>({n:DB.cfg.nombre,web:(await fbCol('tienda_items').doc('__cfg').get()).data().empresaNombre,cfgIn:document.getElementById('c1')&&document.getElementById('c1').disabled}));
   exige(t.n==='Humo Renombrada','El nombre no se guardó en los datos de la empresa',t.n);exige(t.web==='Humo Renombrada','El nombre nuevo no llegó a la tienda (plantilla web)',t.web);exige(t.cfgIn===true,'Los campos no se bloquearon tras guardar');
   const c=await contexto();const p=await pagina(c,'?tienda=1&emp='+EMP,'#shop .kbrand');await p.waitForTimeout(3000);
   const h=await p.evaluate(()=>document.title+' | '+document.getElementById('k_footer').innerText);exige(/Humo Renombrada/.test(h)&&!/Tarjeter/i.test(h),'La tienda no muestra el nombre nuevo',h.slice(0,120));await c.close();foco=ap},{avisos:/Datos guardados/});
  await paso('Cambia el logo de la tienda web (Configuración) y la tienda lo usa; «Quitar» deja la inicial',async()=>{
   const png=path.join(os.tmpdir(),'humo-logo.png');
   {const g=await br.newPage();const b64=await g.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=100;const x=c.getContext('2d');x.fillStyle='#0F6CBD';x.fillRect(0,0,300,100);x.fillStyle='#fff';x.font='bold 40px Arial';x.fillText('HUMO',70,65);return c.toDataURL('image/png').split(',')[1]});fs.writeFileSync(png,Buffer.from(b64,'base64'));await g.close();foco=ap}
   await ap.evaluate(()=>{ir('config');cfgTab('web')});await ap.waitForTimeout(1500);
   if(!(await ap.locator('text=Subir logo de la tienda web').isVisible())){await ap.evaluate(()=>toggleCard('lbgCard'));await ap.waitForTimeout(800)}
   await ap.locator('label:has-text("Subir logo de la tienda web") input').setInputFiles(png);await ap.waitForTimeout(4000);
   const u=await ap.evaluate(async()=>(await fbCol('tienda_items').doc('__cfg').get()).data().logoUrl||'');exige(/^data:image\//.test(u)&&u.length<=250000,'El logo no se guardó en la plantilla de la tienda',u.length);
   const c=await contexto();const p=await pagina(c,'?tienda=1&emp='+EMP,'#shop .kbrand');await p.waitForTimeout(3500);
   const h=await p.evaluate(()=>{const i=document.querySelector('#shop .kbrand img');return i&&{src:i.src.slice(0,22),ok:i.naturalWidth>0}});exige(h&&/^data:image\/(png|webp)/.test(h.src)&&h.ok,'La tienda no usa el logo nuevo',JSON.stringify(h));
   await ap.evaluate(()=>shopLogoQuitar());await ap.waitForTimeout(2500);foco=p;await p.reload({waitUntil:'load'});await p.waitForSelector('#shop .kbrand',{timeout:20000});await p.waitForTimeout(3500);
   const q=await p.evaluate(()=>({mono:(document.querySelector('#shop .klogo-mono')||{}).textContent,img:!!document.querySelector('#shop .kbrand img')}));
   exige(q.mono==='H'&&!q.img,'Sin logo debe verse la inicial de la empresa (H), nunca el de Tarjetería',JSON.stringify(q));await csp(p);await c.close()},{avisos:/Logo de la tienda|Quitar el logo/});
  /* ============ 8. Recargas sin fugas ============ */
  await paso('Recarga la tienda de la empresa (también sin Firestore): nunca aparece Tarjetería',async()=>{
   const c=await contexto();await c.addInitScript(sondaFuga);let p=await pagina(c,'?tienda=1&emp='+EMP,'#shop .kbrand');await p.waitForTimeout(4500);
   let f=await p.evaluate(()=>window.__fuga);exige(f.length===0,'Fuga de marca en la carga',f.join(' ; '));
   await p.close();await c.route(/firestore\.googleapis\.com/,r=>r.abort());
   p=await pagina(c,'?tienda=1&emp='+EMP);await p.waitForTimeout(2500);
   const o=await p.evaluate(()=>({f:window.__fuga,img:(document.querySelector('#shop .kbrand img')||{}).src||'',h:document.title,t:document.getElementById('shop').innerText}));
   exige(o.f.length===0&&!/assets\/logo/.test(o.img),'Fuga de marca al recargar sin red',o.f.join(' ; ')+o.img.slice(0,40));exige(!/Tarjeter/i.test(o.h+o.t),'Texto de Tarjetería al recargar sin red');await c.close()});
  await paso('Recarga el panel de la empresa: nombre y logo propios, sin Tarjetería ni «GN»',async()=>{
   await ap.reload({waitUntil:'load'});await ap.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await ap.waitForTimeout(3500);
   const o=await ap.evaluate(()=>({marca:document.querySelector('.brand').innerText,img:(document.querySelector('.brand .logo img')||{}).src||'',t:document.title,body:document.body.innerText}));
   exige(/Humo Renombrada/i.test(o.marca),'Tras recargar el menú no muestra el nombre de la empresa',o.marca);
   exige(!/assets\/logo(-t)?\.png/.test(o.img),'Tras recargar sale el logo de Tarjetería en el panel',o.img.slice(0,60));
   exige(!/Tarjeter[ií]a Jhon/i.test(o.marca+o.t),'Aparece «Tarjetería Jhon» en la marca del panel',o.marca+' / '+o.t);await csp(ap)});
  await paso('La empresa inicial (Tarjetería Jhon) sigue igual: su tienda y su catálogo de fábrica (88 modelos)',async()=>{
   const c=await contexto();await c.addInitScript(sondaFuga);const p=await pagina(c,'?tienda=1','#shop .kbrand');await p.waitForTimeout(5000);
   const t=await p.evaluate(()=>({img:(document.querySelector('#shop .kbrand img')||{}).src||'',t:document.querySelector('.khero-title')?.textContent||''}));
   exige(/assets\/logo/.test(t.img)&&/Tarjeter/i.test(t.t),'La tienda de Tarjetería Jhon cambió',JSON.stringify(t));
   await p.close();const q=await pagina(c,'','#au_e');await q.waitForTimeout(12000);
   const k=await q.evaluate(()=>new Promise(r=>{const o=indexedDB.open('tj_cat',1);o.onupgradeneeded=()=>o.result.createObjectStore('f',{keyPath:'id'});o.onsuccess=()=>{const g=o.result.transaction('f').objectStore('f').count();g.onsuccess=()=>r(g.result);g.onerror=()=>r(-1)};o.onerror=()=>r(-1)}));
   exige(k===88,'El catálogo de fábrica de la empresa inicial no tiene 88 modelos',k);await c.close()});
  /* ============ 9. Móvil ============ */
  await paso('Móvil (390×844): el panel y la tienda abren sin errores ni desbordes',async()=>{
   const c=await contexto({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let p=await pagina(c,'?emp='+EMP);await entrar(p);
   const d=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));exige(d.sw<=d.cw+2,'El panel se desborda en móvil',JSON.stringify(d));await csp(p);await p.close();
   p=await pagina(c,'?tienda=1&emp='+EMP,'#sh_g .kc .kadd');await p.waitForTimeout(2500);
   const e=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));exige(e.sw<=e.cw+2,'La tienda se desborda en móvil',JSON.stringify(e));await csp(p);await c.close()});
 }catch(e){console.error('\nNo se pudo ejecutar la suite: '+e.message);if(foco)console.error('captura: '+await captura('error-general'));process.exitCode=2}
 finally{
  try{if(br&&!SOLO.length){const k=await vaciarEmpresa(false);try{const c=await contexto(),p=await pagina(c,'?emp='+EMP);await entrar(p);await p.evaluate(async e=>{await fbDb.collection('empresas').doc(e).delete()},EMP);await c.close()}catch(e){}console.log('\n  (limpieza) datos de prueba borrados: '+k)}}catch(e){console.log('  AVISO: no se pudo limpiar la empresa de prueba: '+e.message)}
  try{if(br)await br.close()}catch(e){}if(srv)srv.s.close();
  const mal=res.filter(r=>r.estado==='falla'),om=res.filter(r=>r.estado==='omitido'),ok=res.filter(r=>r.estado==='ok');
  console.log('\n'+'='.repeat(60)+'\nRESULTADO: '+ok.length+' pasos bien · '+mal.length+' con fallas · '+om.length+' omitidos'+(tocoProd.length?' · ¡INTENTOS DE TOCAR PRODUCCIÓN BLOQUEADOS: '+tocoProd.length+'!':''));
  if(mal.length){console.log('\nQUÉ SE ROMPIÓ:');mal.forEach(r=>console.log(' · Paso '+r.n+' «'+r.nombre+'»\n     '+LIMPIO(r.motivo).slice(0,300)+'\n     captura: '+r.captura))}
  try{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'resultado.json'),JSON.stringify({fecha:new Date().toISOString(),base:BASE,pasos:res,produccionTocada:tocoProd},null,1))}catch(e){}
  if(!process.exitCode)process.exitCode=(mal.length||tocoProd.length||!ok.length)?1:0;
  console.log(process.exitCode===0?'\nTODO BIEN: se puede unir/desplegar.\n':'\nNO UNIR NI DESPLEGAR hasta arreglar lo anterior.\n')}
})();
