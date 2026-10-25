/* Fase 24 — pedido de la tienda CON transportista (campo `envio` de tienda_pedidos) en Chrome real.
   Modos:
   · MODO=real      (por omisión si hay BASE y REAL=1) pedido de PRUEBA con escrituras REALES a `tarjeteria-jhon-prueba` (la copia debe apuntar a ese proyecto: se verifica; si no, se cancela).
                    Exige que la primera escritura de tienda_pedidos CON `envio` sea aceptada por las reglas (sin reintento), lee el pedido con el administrador de prueba (PRUEBA_PASSWORD) y
                    BORRA el pedido y el cliente de prueba al terminar.
   · MODO=doble     (por omisión) todo local, sin escribir nada: comprueba la forma exacta del `envio` que arma la app y el camino de respaldo cuando la escritura con `envio` es rechazada.
   Uso:  DIR=/ruta/copia PUERTO=8947 node tests/navegador/pedido-envio-fase24.js                          (doble)
         REAL=1 BASE=http://127.0.0.1:8948/ PRUEBA_PASSWORD=… node tests/navegador/pedido-envio-fase24.js   (real, copia hecha con copia-prueba.js)
   Salida: 0 bien · 1 alguna falló · 2 no se pudo preparar. */
const {chromium}=require(process.env.PW||'playwright-core');
const net=require('node:net'),path=require('node:path'),{spawn}=require('node:child_process');
const REAL=process.env.REAL==='1';
if(/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(process.env.BASE||''))throw new Error('Esta prueba no se corre contra producción');
if(REAL&&!process.env.BASE)throw new Error('REAL=1 necesita BASE (copia apuntando a tarjeteria-jhon-prueba)');
if(REAL&&!process.env.PRUEBA_PASSWORD)throw new Error('REAL=1 necesita PRUEBA_PASSWORD en el entorno');
const VPS=(process.env.VPS||'1366x900,390x844').split(',').map(s=>s.split('x').map(Number));
const ESPERA=+process.env.ESPERA||40000;
const libre=p=>new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))});
async function servidor(){
 if(process.env.BASE)return {base:process.env.BASE.replace(/\/?$/,'/'),parar(){}};
 const dir=path.resolve(process.env.DIR||path.join(__dirname,'..','..')),puerto=+process.env.PUERTO||8947;
 if(!await libre(puerto))throw new Error('El puerto '+puerto+' ya está en uso: elige otro con PUERTO=');
 const p=spawn('python3',['-m','http.server',String(puerto),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});
 for(let i=0;i<50&&await libre(puerto);i++)await new Promise(r=>setTimeout(r,100));
 return {base:'http://127.0.0.1:'+puerto+'/',parar(){p.kill()}};
}
let fallos=0,total=0;
const chk=(n,ok,det)=>{total++;if(!ok)fallos++;console.log((ok?'  ok     ':'  FALLA  ')+n+(det?'  ['+det+']':''))};
const CLAVES=['agencia','fid','tipo','rec','rtel','rced','pais','prov','ciudad','suc','dir','ref'];
const LIM={tipo:13,agencia:80,fid:30,rec:120,rtel:40,rced:30,pais:60,prov:80,ciudad:80,suc:100,dir:200,ref:200};

async function correr(br,base,[W,H],fid){
 const vp=W+'x'+H,intl=fid==='dhlexpress';console.log('\n== '+vp+(W<600?' (móvil)':' (escritorio)')+' · '+(intl?'transportista internacional':'transportista nacional')+' · '+(REAL?'REAL en prueba':'doble local')+' ==');
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600});
 const page=await ctx.newPage(),errs=[],bloqueadas=[];page.on('pageerror',e=>errs.push(e.message));
 if(!REAL)await ctx.route(/firestore\.googleapis\.com\/.*\/Write\/channel/,r=>{bloqueadas.push('Firestore Write');r.abort()});
 await ctx.route(/api\.emailjs\.com/,r=>{bloqueadas.push('EmailJS');r.abort()});
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))});
 await page.goto(base+'?tienda=1',{waitUntil:'load'});
 try{await page.waitForFunction(()=>document.querySelectorAll('#sh_g .kc .kadd').length>1&&document.querySelector('#k_footer'),null,{timeout:ESPERA})}
 catch(e){console.log('  NO SE PUDO PREPARAR: la grilla no mostró productos en '+ESPERA+' ms');await ctx.close();return 2}
 await page.waitForTimeout(3000);
 const proyecto=await page.evaluate(()=>{try{return firebase.app().options.projectId}catch(e){return ''}});
 if(REAL&&proyecto!=='tarjeteria-jhon-prueba'){console.log('  CANCELADO: la copia apunta a «'+proyecto+'», no al proyecto de prueba');await ctx.close();return 2}
 console.log('  proyecto '+proyecto);
 /* transportista ofrecido en memoria + precios en memoria (no se guarda nada) + doble/registro de escrituras */
 await page.evaluate(({fid,real})=>{
  SH.fletes={on:['ferguson','dhlexpress']};SH.items.forEach((i,k)=>{i.price=((k%5)+1)*1.5});
  window.emailjs=null;window.__esc=[];
  const realDb=fbDb;
  const envolver=(p,col)=>({doc(id){const d=col.doc(id);return {set:async dat=>{
    const rec={col:p.split('/').pop(),id,d:JSON.parse(JSON.stringify(dat)),envio:'envio' in dat};
    if(!real){if(rec.col==='tienda_pedidos'&&rec.envio&&window.__rechazarEnvio){rec.res='rechazada';window.__esc.push(rec);throw Object.assign(new Error('permission-denied'),{code:'permission-denied'})}rec.res='doble';window.__esc.push(rec);return}
    try{await d.set(dat);rec.res='ok'}catch(e){rec.res='error:'+(e.code||e.message);window.__esc.push(rec);throw e}window.__esc.push(rec)},
   get:d.get.bind(d),update:d.update.bind(d),delete:d.delete.bind(d)}},where:col.where.bind(col),get:col.get.bind(col),onSnapshot:col.onSnapshot.bind(col)});
  fbDb=new Proxy(realDb,{get(t,k){if(k==='collection')return p=>/tienda_(pedidos|leads)$/.test(p)?envolver(p,realDb.collection(p)):realDb.collection(p);const v=t[k];return typeof v==='function'?v.bind(t):v}});
 },{fid,real:REAL});
 /* ---- carrito con un producto, hoja «Su pedido», transportista ---- */
 const a0=page.locator('#sh_g .kc .kadd').first();await a0.scrollIntoViewIfNeeded();await a0.click();await page.waitForSelector('#shopm .kpk',{timeout:5000});
 await page.click('#k_pb');await page.waitForTimeout(500);await page.waitForTimeout(2600);
 await page.click('.kfab');await page.waitForSelector('#sh_sb',{timeout:5000});
 const opciones=await page.$$eval('#sh_fl option',o=>o.map(x=>x.value));
 chk('«Su pedido» ofrece el selector de transportista con los activados',opciones.includes('ferguson')&&opciones.includes('dhlexpress'),opciones.join(','));
 await page.selectOption('#sh_fl',fid);await page.waitForSelector('#sh_env input',{timeout:3000});
 await page.fill('#ev_n','Prueba');await page.fill('#ev_a','Automatica');await page.fill('#ev_tel','6000-0000');
 if(intl){await page.fill('#ev_pais','Estados Unidos');await page.fill('#ev_ced','E-8-0000')}
 await page.fill('#ev_dir','Dirección de prueba 123');
 if(!intl){const ref=await page.$('#ev_ref');if(ref)await page.fill('#ev_ref','Referencia de prueba')}
 await page.fill('#sh_nt','Pedido de PRUEBA automática (se borra al terminar)');
 await page.check('#sh_chk_poli');await page.click('#sh_sb');await page.waitForSelector('#sh_n',{timeout:5000});
 await page.fill('#sh_n','Cliente Prueba Envio');await page.fill('#sh_t','6123-4567');await page.fill('#sh_e','prueba-envio@example.com');await page.fill('#sh_c','Prueba');await page.fill('#sh_d','Panamá');
 await page.check('#sh_chk_poli_reg');
 await page.click('#sh_b');
 await page.waitForFunction(()=>document.querySelector('#shopm').dataset.k==='ok',null,{timeout:25000}).catch(()=>{});
 await page.waitForTimeout(800);
 const fin=await page.evaluate(()=>({k:document.querySelector('#shopm').dataset.k,txt:document.querySelector('#shopm').innerText,m2:(document.querySelector('#sh_m2')||{}).textContent,ev:JSON.stringify(SH.ev),poli:(document.querySelector('#sh_chk_poli')||{}).checked,esc:window.__esc,last:SH.last&&JSON.parse(JSON.stringify(SH.last))}));
 if(fin.k!=='ok'&&process.env.DEPURAR)console.log('  DEPURAR',fin.k,JSON.stringify(fin.m2),fin.ev,fin.poli,JSON.stringify(fin.esc.map(e=>e.col+':'+e.res)));
 const peds=fin.esc.filter(e=>e.col==='tienda_pedidos'),leads=fin.esc.filter(e=>e.col==='tienda_leads');
 chk('termina en «¡Pedido enviado!»',fin.k==='ok'&&/¡Pedido enviado!/.test(fin.txt));
 chk('se escribió 1 cliente y 1 pedido, el pedido CON envio en la primera (y única) escritura (sin reintento)',leads.length===1&&peds.length===1&&peds[0].envio===true&&(REAL?peds[0].res==='ok':true),peds.map(e=>e.res+(e.envio?'+envio':'')).join(' | '));
 const d=peds[0]&&peds[0].d,e=d&&d.envio;
 chk('envio: solo claves admitidas, texto y dentro de los límites de las reglas',!!e&&Object.keys(e).every(k=>CLAVES.includes(k))&&Object.entries(e).every(([k,v])=>typeof v==='string'&&v.length<=LIM[k]),e&&Object.keys(e).join(','));
 chk('envio: agencia y tipo correctos ('+(intl?'internacional':'nacional')+')',!!e&&e.tipo===(intl?'internacional':'nacional')&&e.fid===fid&&e.agencia.length>0,e&&e.agencia+' / '+e.tipo);
 chk('envio: datos de quien recibe tal como se escribieron',!!e&&e.rec==='Prueba Automatica'&&e.rtel==='6000-0000'&&e.dir==='Dirección de prueba 123'&&(!intl||(e.pais==='Estados Unidos'&&e.rced==='E-8-0000')));
 chk('el pedido no lleva el transportista duplicado en la nota (va en envio)',!!d&&!/Envío por:/.test(d.nota)&&d.nota.length<=500,d&&String(d.nota.length));
 chk('pedido: sin claves fuera de las que admiten las reglas',!!d&&Object.keys(d).every(k=>['id','cid','lead','items','total','nota','ref','ts','estado','envio'].includes(k)));
 if(REAL&&d){
  /* lectura y limpieza con el administrador de la copia de prueba */
  const r=await page.evaluate(async({pw,pid,lid})=>{
   try{await firebase.auth().signInWithEmailAndPassword('admin.prueba@example.com',pw)}catch(e){return {err:'login '+(e.code||e.message)}}
   const o={};try{const s=await fbCol('tienda_pedidos').doc(pid).get();o.existe=s.exists;o.envio=s.exists?s.data().envio:null}catch(e){o.errLeer=e.code||e.message}
   try{await fbCol('tienda_pedidos').doc(pid).delete();o.borradoPedido=true}catch(e){o.errBorrar=e.code||e.message}
   try{await fbCol('tienda_leads').doc(lid).delete();o.borradoLead=true}catch(e){o.errBorrarLead=e.code||e.message}
   try{const s=await fbCol('tienda_pedidos').doc(pid).get();o.sigue=s.exists}catch(e){o.errVerif=e.code||e.message}
   try{await firebase.auth().signOut()}catch(e){}return o},{pw:process.env.PRUEBA_PASSWORD,pid:d.id,lid:leads[0].id});
  chk('el administrador de prueba lee el pedido guardado y su envio coincide',!r.err&&r.existe===true&&r.envio&&r.envio.fid===fid&&r.envio.rec==='Prueba Automatica',JSON.stringify(r.err||{existe:r.existe,fid:r.envio&&r.envio.fid}));
  chk('limpieza: pedido y cliente de prueba borrados de la copia de prueba',r.borradoPedido===true&&r.borradoLead===true&&r.sigue===false,JSON.stringify(r));
 }
 if(!REAL)chk('nada salió a Firestore ni a EmailJS (bloqueado en red: '+bloqueadas.length+' intentos)',bloqueadas.length===0,bloqueadas.join(','));
 chk('sin errores de JavaScript no capturados',errs.length===0,errs.slice(0,2).join(' | '));
 chk('sin violaciones de la CSP',(await page.evaluate(()=>window.__csp.length))===0);
 await ctx.close();return 0;
}

(async()=>{
 const sv=await servidor();let br,prep=0;
 try{br=await chromium.launch({channel:'chrome',headless:true});
  const vps=REAL?[VPS[0]]:VPS;       // en real basta un tamaño por transportista: se evita escribir de más en la copia de prueba
  for(const v of vps){for(const f of (REAL&&v===vps[0]?['ferguson','dhlexpress']:['ferguson']))prep=Math.max(prep,await correr(br,sv.base,v,f))}}
 catch(e){console.log('ERROR: '+e.message);prep=2}
 finally{if(br)await br.close();sv.parar()}
 console.log('\n'+(total-fallos)+' comprobaciones correctas, '+fallos+' fallidas');
 process.exit(prep===2?2:fallos?1:0);
})();
