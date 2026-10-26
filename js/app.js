/* SEG-04 etapa 2: manejadores en línea convertidos a delegación de eventos (sin onclick= en el HTML). */
var __H={};
function _ha(){return JSON.stringify([].slice.call(arguments)).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function _hcall(c){var m=/^(\w+)\((?:'([^']*)')?\)$/.exec(c);return m?(m[2]===undefined?[m[1]]:[m[1],m[2]]):[c]}
(function(){
 var T=['click','change','input','focus','keydown','toggle','dragover','dragleave','drop'],NB={focus:1,toggle:1};
 function run(t,ev,el){
  var id=el.getAttribute('data-h-'+t);if(!id)return;
  var f=__H[id];if(!f)return;
  var a=[],raw=el.getAttribute('data-a-'+t);
  if(raw){try{a=JSON.parse(raw)}catch(e){a=[]}}
  try{if(f.call(el,ev,a)===false)ev.preventDefault()}catch(e){setTimeout(function(){throw e})}
 }
 T.forEach(function(t){
  document.addEventListener(t,function(ev){
   var el=ev.target;if(el&&el.nodeType!==1)el=el.parentElement;
   if(NB[t]){if(el)run(t,ev,el);return}
   for(;el&&el!==document;el=el.parentElement){run(t,ev,el);if(ev.cancelBubble)break}
  },!!NB[t]);
 });
})();

if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc='js/pdf.worker.min.js';
const _appC={};function appHtml(n){if(!_appC[n])_appC[n]=fetch('apps/'+n+'.html',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('apps/'+n+' '+r.status);return r.text()}).catch(e=>{delete _appC[n];throw e});return _appC[n]}

/* Multiempresa: particiona las claves locales por empresa (la inicial conserva las suyas).
   Debe definirse ANTES de su primer uso (cardState y tj_db, justo debajo): un const se queda en
   'zona muerta' hasta su línea y usarlo antes lanza 'Cannot access lsk before initialization'.
   Es seguro aquí: empLSKey solo lee ?emp= de la URL o localStorage 'tj_emp' (síncrono, ya cargado
   por js/empresa-contexto.js, antes de app.js) y fbCol usa esa misma empresa, así que clave local y
   ruta de Firestore siempre coinciden; cambiar de empresa recarga la página (empActivar). */
const lsk=k=>TJEmpresa.empLSKey(k);
/* Valores por defecto de los datos de la empresa: solo la empresa inicial arranca con los de Tarjetería Jhon; cualquier otra empresa, vacíos
   (si no, su factura, su formulario y su tienda mostrarían el teléfono, el correo, la dirección y el banco de Tarjetería). */
let DB={prod:[],cli:[],fac:[],ubi:[],agenda:[],cfg:{sig:1058,itbms:0,nombre:TJEmpresa.empEsInicial()?'Tarjetería Jhon':'',ruc:'',tel:TJEmpresa.empEsInicial()?'(507) 6074-1150':'',email:TJEmpresa.empEsInicial()?'Tarjeteriajhon@gmail.com':'',dir:TJEmpresa.empEsInicial()?'Panama Oeste':'',banco:TJEmpresa.empEsInicial()?'Banco General':'',tcuenta:'Ahorro',cuenta:'',yappy:'',dests:[],tema:'claro',snd:1,tono:'campana',vol:70,nsys:0}};
let cardState={cfg:false,email:false};
try{cardState=Object.assign(cardState,JSON.parse(localStorage.getItem(lsk('tj_cards'))||'{}'))}catch(e){window._tjw&&_tjw(e)}
const wmClean=v=>{v=String(v||'').trim();return v.toLowerCase()==='shop'?'':v};
const TIKTOK_SVG='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.27 0 .53.04.77.12V9.68a5.7 5.7 0 0 0-.77-.05 5.69 5.69 0 0 0-5.69 5.68 5.69 5.69 0 0 0 5.69 5.69 5.69 5.69 0 0 0 5.69-5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>';
const ALL_CFG_CARDS = ['poliCard','cfg_apariencia','cfg_empresa','cfg_emails','cfg_notif','cfg_nav','cfg_respaldo','waCard','investCard','lbgCard','xmasCard','redesCard','fleCard','bkCard','sesCard','tplCard','recCard','vozCard','cintCard','llamCard'];
function toggleCard(key){
 cardState[key]=!cardState[key];
 try{localStorage.setItem(lsk('tj_cards'),JSON.stringify(cardState))}catch(e){window._tjw&&_tjw(e)}
 const body=$('body_'+key)||$(key==='cfg'?'bodyCfg':key==='email'?'bodyEmail':null);
 const caret=$('caret_'+key)||$(key==='cfg'?'caretCfg':key==='email'?'caretEmail':null);
 const btn=$('btnToggle_'+key)||$(key==='cfg'?'btnToggleCfg':key==='email'?'btnToggleEmail':null);
 if(body)body.style.display=cardState[key]?'':'none';
 if(caret)caret.textContent=cardState[key]?'▾':'▸';
 if(btn)btn.textContent=cardState[key]?'Minimizar':'Maximizar';
 if(key==='lbgCard'&&cardState[key]){setTimeout(()=>{lbgFill($('lbgPrev'),lbgMeta())},40)}
}
function wrapCardInner(key, title, body){
 const open=!!cardState[key];
 return `<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;gap:10px" data-h-click="call" data-a-click="${_ha('toggleCard',key)}">
   <div style="display:flex;align-items:center;gap:8px">
     <span id="caret_${key}" style="font-size:15px;color:var(--gris);display:inline-block;width:14px">${open?'▾':'▸'}</span>
     <h3 style="margin:0">${title}</h3>
   </div>
   <button type="button" class="btn s" id="btnToggle_${key}" data-h-click="call" data-a-click="${_ha('toggleCard',key)}">${open?'Minimizar':'Maximizar'}</button>
 </div>
 <div id="body_${key}" style="display:${open?'':'none'};margin-top:14px">
   ${body}
 </div>`;
}
function cfgExpandAll(){for(const k of ALL_CFG_CARDS)cardState[k]=true;try{localStorage.setItem(lsk('tj_cards'),JSON.stringify(cardState))}catch(e){window._tjw&&_tjw(e)}if(vista==='config')R.config()}
function cfgCollapseAll(){for(const k of ALL_CFG_CARDS)cardState[k]=false;try{localStorage.setItem(lsk('tj_cards'),JSON.stringify(cardState))}catch(e){window._tjw&&_tjw(e)}if(vista==='config')R.config()}
/* ===== Personalización y configuración web =====
   La pantalla Configuración se divide en dos pestañas: "Personalización y configuración
   web" (todo lo que cambia el aspecto de la web: temas, fondos, imágenes, videos, textos
   de la tienda pública, redes y transportistas) y "Ajustes generales del panel" (datos,
   correos, avisos, respaldos, seguridad y herramientas). La pestaña elegida se recuerda
   en este navegador. */
const CFG_TAB_KEY='tj_cfg_tab';
function cfgTabActual(){try{return localStorage.getItem(CFG_TAB_KEY)==='gen'?'gen':'web'}catch(e){return 'web'}}
function cfgTab(t){
 try{localStorage.setItem(CFG_TAB_KEY,t)}catch(e){window._tjw&&_tjw(e)}
 const w=$('cfgWeb'),g=$('cfgGen'),bw=$('cfgTabWeb'),bg=$('cfgTabGen');
 if(w)w.style.display=t==='web'?'':'none';
 if(g)g.style.display=t==='gen'?'':'none';
 if(bw)bw.classList.toggle('p',t==='web');
 if(bg)bg.classList.toggle('p',t==='gen');
}
window.cfgTab=cfgTab;
function catExpandAll(){document.querySelectorAll('.cg2').forEach(d=>{d.open=true;catCl.add(d.dataset.k)})}
function catCollapseAll(){document.querySelectorAll('.cg2').forEach(d=>{d.open=false;catCl.delete(d.dataset.k)})}
try{const s=localStorage.getItem(lsk('tj_db'));if(s){const o=JSON.parse(s),c=DB.cfg;DB=Object.assign(DB,o);DB.cfg=Object.assign(c,o.cfg||{})}}catch(e){window._tjw&&_tjw(e)}
/* Productos de arranque: SOLO de la empresa inicial (Tarjetería Jhon). Una empresa nueva empieza sin productos. */
if(!DB.prod.length&&TJEmpresa.empEsInicial())DB.prod=[['TARJETAS DE TODA OCACION',1.30],['TARJETAS DE TODA OCACION',1.25],['TARJETAS DE TODA OCACION',1.20],['TARJETAS DE TODA OCACION',1.15],['TARJETAS DE TODA OCACION',1.00],['TARJETAS DE TODA OCACION DISTRUBUCION',0.95]].map((p,i)=>({id:'p'+i,n:p[0],p:p[1]}));
// Si la copia local (localStorage) falla (p.ej. el navegador llenó su cuota), antes esto quedaba
// en silencio total: nadie se enteraba, ni en consola. Ahora avisa una vez cada 5 minutos como
// máximo (para no llenar la pantalla de avisos si falla seguido) — la nube sigue intentando guardar
// aparte, pero es la única señal visible de que algo no se está guardando donde debería.
let _slWarnT=0;
const saveLocal=()=>{try{localStorage.setItem(lsk('tj_db'),JSON.stringify(DB))}catch(e){console.warn('[saveLocal] no se pudo guardar localmente:',e);const n=Date.now();if(n-_slWarnT>300000){_slWarnT=n;try{cloudEstado('⚠ No se pudo guardar una copia local (memoria llena). Revise espacio del navegador.',false)}catch(_){window._tjw&&_tjw(_)}}}};
const save=()=>{saveLocal();syncToCloud()};

// ===== Sincronización en la nube (Firebase) =====
const firebaseConfig={apiKey:"AIzaSyBle5zbvVjXIVXvOz8tgxBBbu8-Ty1Msrs",authDomain:"tarjeteria-jhon.firebaseapp.com",projectId:"tarjeteria-jhon",storageBucket:"tarjeteria-jhon.firebasestorage.app",messagingSenderId:"386602273549",appId:"1:386602273549:web:8d97182d91d33a79e17e44"};
let fbDb=null,fbDocRef=null,_cloudWriting=false,_syncTimer=null,_lastTs=0,_cloudOn=false,_cloudUnsub=null;
let _fbInitError='';
// App Check: certifica ante Firebase que las peticiones salen de esta página real
// (no de un bot ni de un script copiando la API). Reemplace RECAPTCHA_V3_SITE_KEY por
// la clave de sitio reCAPTCHA v3 creada en la consola de Firebase (App Check > Apps >
// registrar app web). Mientras la clave sea el texto de ejemplo, esto no hace nada —
// no bloquea ni rompe el panel.
const RECAPTCHA_V3_SITE_KEY='6Ld9hOktAAAAALfcLgikIHsm0rvaJCaWQ_lIXf-y';
// Verificación de correo en el registro de la tienda pública (EmailJS, gratis hasta 200
// correos/mes, sin servidor propio). Reemplace los tres valores por los de su cuenta de
// emailjs.com (Email Services > Service ID; Email Templates > Template ID; Account > Public
// Key). Mientras queden con el texto de ejemplo, el registro funciona SIN pedir código (no se
// rompe nada), para no dejar la tienda sin poder registrar clientes mientras se configura esto.
const EMAILJS_PUBLIC_KEY='7uMfxbPHkkks7YCGu',EMAILJS_SERVICE_ID='service_uy10xlg',EMAILJS_TEMPLATE_ID='template_wybv8ea';
// Cuenta administradora de Firebase Authentication. Esta comprobación solo mejora el
// arranque; los permisos reales continúan protegidos por las reglas de Firestore.
const ADMIN_UID='o7bHndKtswSHreFnVwORqBSUKL43';
const emailjsListo=()=>EMAILJS_PUBLIC_KEY!=='EMAILJS_PUBLIC_KEY'&&EMAILJS_SERVICE_ID!=='EMAILJS_SERVICE_ID'&&EMAILJS_TEMPLATE_ID!=='EMAILJS_TEMPLATE_ID'&&window.emailjs;
try{if(window.emailjs&&emailjsListo())emailjs.init({publicKey:EMAILJS_PUBLIC_KEY})}catch(e){window._tjw&&_tjw(e)}
function iniciarFirebase(){
 if(!window.firebase)throw new Error('Firebase no se cargó');
 // Tras una actualización o una restauración desde caché, Firebase puede ya estar
 // inicializado. Reutilizarlo evita abortar antes de poder leer el rol del usuario.
 if(!(firebase.apps&&firebase.apps.length))firebase.initializeApp(firebaseConfig);
 if(!firebase.firestore)throw new Error('Firestore no se cargó');
 fbDb=firebase.firestore();
 if(firebase.appCheck && RECAPTCHA_V3_SITE_KEY!=='RECAPTCHA_V3_SITE_KEY'){
  try{firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(RECAPTCHA_V3_SITE_KEY),true)}catch(e){window._tjw&&_tjw(e)}
 }
 return fbDb;
}
try{iniciarFirebase()}catch(e){_fbInitError=(e&&e.message)||'error';window._tjw&&_tjw(e)}
function cloudEstado(txt,ok){_cloudOn=!!ok;const els=document.querySelectorAll('.cloudSt');els.forEach(e=>{e.textContent=txt;e.style.color=ok?'var(--okt,#15803d)':(ok===false?'var(--errt,#c0392b)':'')})}
// Datos compartidos mínimos para emitir facturas. No contienen usuarios, credenciales,
// historial de clientes ni la agenda. Cada vendedor guarda su trabajo en su propio documento.
const PUBLIC_CFG=['sig','itbms','nombre','ruc','tel','email','dir','banco','tcuenta','cuenta','yappy','dests','tema','snd','tono','vol','nsys'];
const pickCfg=(cfg,keys=PUBLIC_CFG)=>keys.reduce((o,k)=>(Object.prototype.hasOwnProperty.call(cfg||{},k)&&(o[k]=cfg[k]),o),{});
/* Multiempresa (Fase 7 preparada): fbCol enruta las colecciones de negocio a la empresa
   activa SOLO cuando MULTIEMP=true (hoy devuelve las rutas actuales tal cual); las de
   identidad (roles/perfiles/presencia) siguen globales. lsk particiona las claves
   locales por empresa — la inicial conserva las suyas (retro-compatible). */
const fbCol=n=>fbDb&&fbDb.collection(TJEmpresa.empColPath(n));
/* lsk: definido arriba, junto a cardState (Fase 14: se usaba antes de existir). */
const publicRef=()=>fbDb&&fbCol('panel_public').doc('general');
const privateRef=()=>fbDb&&(esAdmin()?fbCol('panel').doc('data'):fbCol('vendedores').doc(SES.id).collection('privado').doc('data'));
const publicPayload=ts=>({prod:Array.isArray(DB.prod)?DB.prod:[],cfg:pickCfg(DB.cfg),_ts:ts});
const privatePayload=ts=>({cli:Array.isArray(DB.cli)?DB.cli:[],fac:Array.isArray(DB.fac)?DB.fac:[],ubi:Array.isArray(DB.ubi)?DB.ubi:[],agenda:Array.isArray(DB.agenda)?DB.agenda:[],cfg:pickCfg(DB.cfg),_ts:ts});
function limpiarMemoriaVendedor(){
 DB.prod=[];DB.cli=[];DB.fac=[];DB.ubi=[];DB.agenda=[];DB.cfg=Object.assign({},pickCfg(DB.cfg));saveLocal();
}
function mergeRemote(remote){const c=DB.cfg,prevCli=DB.cli;const ts=remote._ts||0;DB=Object.assign(DB,remote);DB.cfg=Object.assign(c,remote.cfg||{});_lastTs=ts;restaurarClientes(prevCli);if(esAdmin())aplicarFacVend();saveLocal();if(vista&&R[vista])R[vista]();if(vista==='home')setTimeout(dibujarGraficos,0)}
function mergeVendedor(pub,priv){
 const b=privatePayload(0),p=pub||{},v=priv||{},prevCli=DB.cli;
 DB={prod:Array.isArray(p.prod)?p.prod:[],cli:Array.isArray(v.cli)?v.cli:[],fac:Array.isArray(v.fac)?v.fac:[],ubi:Array.isArray(v.ubi)?v.ubi:[],agenda:Array.isArray(v.agenda)?v.agenda:[],cfg:Object.assign({},b.cfg,p.cfg||{},v.cfg||{})};
 _lastTs=Math.max(p._ts||0,v._ts||0);restaurarClientes(prevCli);saveLocal();if(vista&&R[vista])R[vista]();if(vista==='home')setTimeout(dibujarGraficos,0);
}

/* Administración recibe en tiempo real las facturas de todos los vendedores.
   Cada vendedor las guarda en vendedores/{id}/privado/data. En memoria llevan _v:1,
   no se copian a panel/data y los cambios del administrador (anular, cobrar, eliminar)
   se devuelven al documento del vendedor dentro de una transacción. */
const _vendSnap={},_vendUnsub={};
const _limpiaFac=f=>{const o=Object.assign({},f);delete o._v;return o};
function aplicarFacVend(){
 const ids=new Set();Object.keys(_vendSnap).forEach(k=>(_vendSnap[k]||[]).forEach(f=>f&&f.id&&ids.add(f.id)));
 const propias=(Array.isArray(DB.fac)?DB.fac:[]).filter(f=>f&&!f._v&&!ids.has(f.id));
 const ajenas=[];Object.keys(_vendSnap).forEach(k=>(_vendSnap[k]||[]).forEach(f=>{if(f&&f.id)ajenas.push(Object.assign({},f,{_v:1,vend:f.vend||k}))}));
 DB.fac=propias.concat(ajenas).sort((a,b)=>(a.fecha<b.fecha?-1:a.fecha>b.fecha?1:(a.n||0)-(b.n||0)));
 try{asegurarContador()}catch(e){window._tjw&&_tjw(e)}
}
function escucharVendedores(){
 if(!esAdmin()||!fbDb)return;
 const ids=new Set(((DB.cfg||{}).users||[]).filter(u=>u&&typeof u.id==='string').map(u=>u.id));
 Object.keys(_vendUnsub).forEach(id=>{if(!ids.has(id)){try{_vendUnsub[id]()}catch(e){}delete _vendUnsub[id];delete _vendSnap[id];aplicarFacVend()}});
 ids.forEach(id=>{
  if(_vendUnsub[id])return;
  _vendUnsub[id]=fbCol('vendedores').doc(id).collection('privado').doc('data').onSnapshot(doc=>{
   const fac=doc.exists&&Array.isArray(doc.data().fac)?doc.data().fac:[];
   _vendSnap[id]=fac.map(f=>Object.assign({},f,{vend:f.vend||id}));
   aplicarFacVend();saveLocal();
   if(vista&&R[vista])R[vista]();if(vista==='home')setTimeout(dibujarGraficos,0);
  },er=>{window._tjw&&_tjw(er);console.warn('No se pudieron leer las facturas del vendedor',id,er)});
 });
}
function devolverFacVend(){
 if(!esAdmin()||!fbDb)return [];
 const por={};DB.fac.filter(f=>f&&f._v&&f.vend).forEach(f=>{(por[f.vend]=por[f.vend]||[]).push(_limpiaFac(f))});
 return Object.keys(_vendSnap).map(id=>{
  const antes=new Map((_vendSnap[id]||[]).map(f=>[f.id,JSON.stringify(f)])),ahora=new Map((por[id]||[]).map(f=>[f.id,f]));
  const cambiadas=[...ahora.values()].filter(f=>antes.get(f.id)!==JSON.stringify(f)),borradas=new Set([...antes.keys()].filter(k=>!ahora.has(k)));
  if(!cambiadas.length&&!borradas.size)return null;
  const ref=fbCol('vendedores').doc(id).collection('privado').doc('data');
  return fbDb.runTransaction(async tx=>{
   const d=await tx.get(ref),dat=d.exists?d.data():{};
   let fac=(Array.isArray(dat.fac)?dat.fac:[]).filter(f=>!borradas.has(f.id));
   cambiadas.forEach(c=>{const i=fac.findIndex(f=>f.id===c.id);if(i>=0)fac[i]=c;else fac.push(c)});
   tx.set(ref,{fac,_ts:Date.now()},{merge:true});
  });
 }).filter(Boolean);
}

/* Contador único de facturas para administración y vendedores: panel_public/contador.
   Guarda el próximo número libre y se reserva con una transacción, así dos cuentas
   nunca reciben el mismo número. Administración lo mantiene por encima de todas las
   facturas conocidas; los vendedores solo pueden avanzarlo de uno en uno. */
let _ctrT=0,_ctrVal=0;
const contadorRef=()=>fbDb&&fbCol('panel_public').doc('contador');
function asegurarContador(){
 if(!esAdmin()||!fbDb)return;
 const mx=(DB.fac||[]).reduce((m,f)=>Math.max(m,+f.n||0),0),piso=Math.max(mx+1,+(DB.cfg||{}).sig||0);
 if(piso<=_ctrVal)return;
 clearTimeout(_ctrT);
 _ctrT=setTimeout(()=>{
  const ref=contadorRef();if(!ref)return;
  fbDb.runTransaction(async tx=>{
   const d=await tx.get(ref),a=d.exists&&Number.isInteger(d.data().sig)?d.data().sig:0;
   if(a<piso)tx.set(ref,{sig:piso});return Math.max(a,piso)
  }).then(v=>{_ctrVal=v}).catch(e=>{window._tjw&&_tjw(e)});
 },1500);
}
async function reservarNumeroFactura(){
 const ref=contadorRef();if(!ref)return 0;
 const piso=esAdmin()?Math.max(+(DB.cfg||{}).sig||1,...(DB.fac||[]).map(f=>(+f.n||0)+1)):0;
 return fbDb.runTransaction(async tx=>{
  const d=await tx.get(ref),a=d.exists&&Number.isInteger(d.data().sig)?d.data().sig:0;
  if(!d.exists&&!esAdmin())throw new Error('contador-no-iniciado');
  const n=Math.max(a,piso);tx.set(ref,{sig:n+1});return n
 });
}

/* Clientes compartidos: administración y vendedores trabajan sobre una sola lista
   (panel_public/clientes). Los cambios se fusionan por id dentro de una transacción para no
   pisar lo que otra cuenta agregó al mismo tiempo. Solo administración puede eliminar. */
let _cliBase=null,_cliUnsub=null;
const clientesRef=()=>fbDb&&fbCol('panel_public').doc('clientes');
const _cliNorm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const _cliId=t=>String(t||'').replace(/[^A-Za-z0-9]/g,'').toLowerCase();
const _cliDig=t=>String(t||'').replace(/\D/g,'');
function mismoCliente(a,b){
 if(!a||!b)return false;
 const na=_cliNorm(a.n),nb=_cliNorm(b.n),ra=_cliId(a.r),rb=_cliId(b.r),ta=_cliDig(a.t),tb=_cliDig(b.t);
 return (!!na&&na===nb)||(ra.length>=4&&ra===rb)||(ta.length>=7&&ta===tb)
}
const clienteDuplicado=(n,r,t)=>(DB.cli||[]).find(c=>mismoCliente(c,{n,r,t}));
function fusionarClientes(remote,base,local,puedeBorrar){
 const bm=new Map((base||[]).map(c=>[c.id,JSON.stringify(c)])),lm=new Map((local||[]).map(c=>[c.id,c]));
 const cambios=(local||[]).filter(c=>c&&c.id&&bm.get(c.id)!==JSON.stringify(c));
 const borradas=puedeBorrar?new Set([...bm.keys()].filter(k=>!lm.has(k))):new Set();
 const res=(remote||[]).filter(c=>!borradas.has(c.id));
 cambios.forEach(c=>{const i=res.findIndex(x=>x.id===c.id);if(i>=0)res[i]=c;else if(!res.some(x=>mismoCliente(x,c)))res.push(c)});
 return res
}
function aplicarClientes(remote,inicial){
 const rem=Array.isArray(remote)?remote.map(c=>Object.assign({},c)):[];
 DB.cli=(_cliBase===null||inicial)?rem.map(c=>Object.assign({},c)):fusionarClientes(rem,_cliBase,Array.isArray(DB.cli)?DB.cli:[],esAdmin());
 _cliBase=rem;saveLocal();
 if(vista==='cli'&&R.cli&&!(($('cn')&&$('cn').value)||($('cu_link')&&$('cu_link').value)))R.cli();
 if(vista==='mapa'&&typeof mcCapa==='function'&&MC.s.mcMap)mcCapa('mcMap',false)
}
function restaurarClientes(prev){
 if(_cliBase===null)return;
 DB.cli=fusionarClientes(_cliBase.map(c=>Object.assign({},c)),_cliBase,Array.isArray(prev)?prev:[],esAdmin())
}
function guardarClientes(){
 const ref=clientesRef();if(!ref||_cliBase===null||JSON.stringify(DB.cli)===JSON.stringify(_cliBase))return null;
 const base=_cliBase,local=(DB.cli||[]).map(c=>Object.assign({},c)),enviado=JSON.stringify(DB.cli);
 return fbDb.runTransaction(async tx=>{
  const d=await tx.get(ref),remoto=d.exists&&Array.isArray(d.data().cli)?d.data().cli:[];
  const res=fusionarClientes(remoto,base,local,esAdmin());
  tx.set(ref,{cli:res,_ts:Date.now()},{merge:true});return res
 }).then(res=>{_cliBase=res.map(c=>Object.assign({},c));if(JSON.stringify(DB.cli)===enviado){DB.cli=res.map(c=>Object.assign({},c));saveLocal();if(vista==='cli'&&R.cli&&!(($('cn')&&$('cn').value)||($('cu_link')&&$('cu_link').value)))R.cli()}})
}
async function migrarClientes(ref){
 const us=((DB.cfg||{}).users||[]).filter(u=>u&&typeof u.id==='string');
 const docs=await Promise.all(us.map(u=>fbCol('vendedores').doc(u.id).collection('privado').doc('data').get().catch(()=>null)));
 const union=[],ids=new Set();
 const add=c=>{if(!c||!c.id||!c.n||ids.has(c.id))return;
  if(union.some(x=>_cliNorm(x.n)===_cliNorm(c.n)&&_cliId(x.r)===_cliId(c.r)&&_cliDig(x.t)===_cliDig(c.t)))return;
  ids.add(c.id);union.push(c)};
 (DB.cli||[]).forEach(add);docs.forEach(d=>{if(d&&d.exists)(Array.isArray(d.data().cli)?d.data().cli:[]).forEach(add)});
 await fbDb.runTransaction(async tx=>{const d=await tx.get(ref);if(!d.exists)tx.set(ref,{cli:union,_ts:Date.now(),mig:1})});
 return ref.get()
}
async function iniciarClientesCompartidos(){
 const ref=clientesRef();if(!ref)return;
 _cliBase=null;
 try{
  let doc=await ref.get();
  if(!doc.exists&&esAdmin())doc=await migrarClientes(ref);
  if(doc&&doc.exists)aplicarClientes(doc.data().cli||[],true)
 }catch(e){window._tjw&&_tjw(e);console.warn('No se pudieron cargar los clientes compartidos',e)}
 if(_cliUnsub){try{_cliUnsub()}catch(e){}_cliUnsub=null}
 _cliUnsub=ref.onSnapshot(doc=>{if(doc.exists)aplicarClientes(doc.data().cli||[],false)},()=>{})
}
function syncToCloud(){
 if(!fbDocRef)return;
 clearTimeout(_syncTimer);
 _syncTimer=setTimeout(()=>{
  const ts=Date.now();_lastTs=ts;_cloudWriting=true;
  const own=esAdmin()?Object.assign({},DB,{fac:(DB.fac||[]).filter(f=>!f._v),_ts:ts}):privatePayload(ts);
  const jobs=[fbDocRef.set(own)];
  if(esAdmin()){jobs.push(publicRef().set(publicPayload(ts)));devolverFacVend().forEach(j=>jobs.push(j));escucharVendedores()}
  {const jc=guardarClientes();if(jc)jobs.push(jc)}
  Promise.all(jobs).then(()=>cloudEstado('☁ Sincronizado',true)).catch(er=>{window._tjw&&_tjw(er);window._tjFails=(window._tjFails||0)+1;const grande=er&&(er.code==='invalid-argument'||er.code==='resource-exhausted');cloudEstado(grande?'☁ NO se pudo guardar: el panel superó el tamaño permitido. Descarga una copia JSON':'☁ Sin conexión, guardado localmente',false)}).finally(()=>{setTimeout(()=>_cloudWriting=false,600)})
 },700)
}
async function migrarPanelPorRoles(){
 if(!esAdmin()||!fbDb)return;
 const marca=fbCol('panel').doc('migracion_roles_v1');
 const ya=await marca.get();if(ya.exists)return;
 const antiguo=await fbCol('panel').doc('data').get();
 const d=antiguo.exists?antiguo.data():DB,us=((d.cfg||{}).users||[]).filter(u=>u&&typeof u.id==='string');
 const ts=Date.now(),lotes=[];
 // Clientes, ubicaciones y agenda heredados no tienen dueño: se conservan solo en panel/data.
 // Las facturas que sí guardan vend pasan a su propietario.
 for(let i=0;i<us.length;i+=400){const b=fbDb.batch();us.slice(i,i+400).forEach(u=>{
   const fac=(d.fac||[]).filter(f=>f&&f.vend===u.id);
   b.set(fbCol('vendedores').doc(u.id).collection('privado').doc('data'),{cli:[],fac,ubi:[],agenda:[],cfg:pickCfg(d.cfg),_ts:ts,migrado:true},{merge:true});
  });lotes.push(b.commit())}
 await Promise.all([publicRef().set({prod:d.prod||[],cfg:pickCfg(d.cfg),_ts:ts},{merge:true}),...lotes]);
 await marca.set({version:1,ts,criterio:'clientes_y_agenda_heredados_admin; facturas_con_vend_al_vendedor'});
}
function iniciarSincronizacionNube(){
 if(!fbDb)return cloudEstado('Este navegador guarda solo localmente.',null);
 fbDocRef=privateRef();if(!fbDocRef)return cloudEstado('Este navegador guarda solo localmente.',null);
 if(_cloudUnsub){try{_cloudUnsub()}catch(e){window._tjw&&_tjw(e)}_cloudUnsub=null}
 cloudEstado('☁ Conectando…',null);
 const cargar=async()=>{
  if(esAdmin())await migrarPanelPorRoles();
  if(esAdmin()){
   const doc=await fbDocRef.get();if(doc.exists)mergeRemote(doc.data());
   await iniciarClientesCompartidos();
   escucharVendedores();
   cloudEstado('☁ Sincronizado',true);
   _cloudUnsub=fbDocRef.onSnapshot(doc=>{if(!doc.exists||_cloudWriting)return;const remote=doc.data();if((remote._ts||0)>_lastTs){mergeRemote(remote);cloudEstado('☁ Actualizado desde otro dispositivo',true)}},()=>cloudEstado('☁ Sin conexión, guardado localmente',false));
  }else{
   limpiarMemoriaVendedor();
   const [pub,priv]=await Promise.all([publicRef().get(),fbDocRef.get()]);
   mergeVendedor(pub.exists?pub.data():{},priv.exists?priv.data():{});
   if(!priv.exists)await fbDocRef.set(privatePayload(Date.now()),{merge:true});
   await iniciarClientesCompartidos();
   cloudEstado('☁ Sincronizado',true);
   _cloudUnsub=fbDocRef.onSnapshot(doc=>{if(!doc.exists||_cloudWriting)return;mergeVendedor((window._pubData||{}),doc.data());},()=>cloudEstado('☁ Sin conexión, guardado localmente',false));
   publicRef().onSnapshot(doc=>{window._pubData=doc.exists?doc.data():{};if(doc.exists)mergeVendedor(window._pubData,DB);},()=>{});
  }
 };
 cargar().catch(e=>{window._tjw&&_tjw(e);cloudEstado('☁ Sin conexión, guardado localmente',false)})
}

// ===== Sincronización de fotos/archivos del catálogo (subidos manualmente) =====
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob)})}
function base64ToBlob(b64,type){const bin=atob(b64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:type||'application/octet-stream'})}
async function _blobParaNube(o){
 const lim=imgKBClamp(o.imgKB||IMG_KB_MAX)*1024;
 if(o.blob.size<=lim)return {blob:o.blob,type:o.type};
 if(!(o.type||'').startsWith('image/'))throw {code:'archivo-grande'};
 const bl=await comprimirImagenCatalogo(o.blob,lim/1024);
 if(!bl||bl.size>lim)throw {code:'archivo-grande'};
 return {blob:bl,type:bl.type||'image/jpeg'}
}
function _catFalla(o,e){console.warn('Catálogo no sincronizado',o&&o.name,e);if(window._catAv)return;window._catAv=1;setTimeout(()=>{window._catAv=0},8000);
 alert('No se pudo sincronizar "'+((o&&o.name)||'archivo')+'" con los demás dispositivos'+(e&&e.code==='archivo-grande'?' porque es demasiado grande (máximo aprox. 700 KB; los PDF no se pueden reducir)':' ('+((e&&e.code)||'error')+')')+'. En este dispositivo sí quedó guardado.')}
async function subirArchivoNube(o){
 if(!fbDb)return false;
 try{
  const p=await _blobParaNube(o),data=await blobToBase64(p.blob);
  await fbCol('catalogo').doc(o.id).set({id:o.id,name:o.name,ext:p.blob===o.blob?o.ext:'jpg',cat:o.cat,price:o.price,desc:o.desc,type:p.type,size:p.blob.size,imgKB:o.imgKB||null,date:o.date,data,ts:Date.now()});
  await syncTiendaCat(o);return true
 }catch(e){_catFalla(o,e);return false}
}
async function eliminarArchivoNube(id){if(!fbDb)return;try{await fbCol('catalogo').doc(id).delete()}catch(e){window._tjw&&_tjw(e)}}
async function _aplicarDocCatalogo(r){
 try{
  const blob=base64ToBlob(r.data,r.type);
  const o={id:r.id,name:r.name,ext:r.ext,cat:r.cat,price:r.price,desc:r.desc,type:r.type,size:r.size,imgKB:r.imgKB||null,date:r.date,blob};
  o.thumb=await mkThumb(o,1200);
  await guardar(o);
  CL=CL.filter(f=>f.id!==o.id);CL.push(o);
  await syncTiendaCat(o);
  if(vista==='cat')dib()
 }catch(e){window._tjw&&_tjw(e)}
}
async function sincronizarCatalogoNube(){
 if(!fbDb)return;
 try{
  const snap=await fbCol('catalogo').get();
  const localIds=new Set(CL.map(f=>f.id));
  for(const doc of snap.docs){const r=doc.data();if(!localIds.has(r.id))await _aplicarDocCatalogo(r)}
  if(esAdmin()){const enNube=new Set(snap.docs.map(d=>d.id));let k=0;for(const o of CL){if(k>=40)break;if(o.blob&&!enNube.has(o.id)){k++;if(!await subirArchivoNube(o))break}}}
  fbCol('catalogo').onSnapshot(snap=>{
   snap.docChanges().forEach(ch=>{
    const r=ch.doc.data();
    if(ch.type==='removed'){
     CL=CL.filter(f=>f.id!=r.id);
     tx('readwrite',s=>s.delete(r.id)).catch(()=>{});
     if(vista==='cat')dib();
     return
    }
    if(ch.doc.metadata&&ch.doc.metadata.hasPendingWrites)return;
    _aplicarDocCatalogo(r)
   })
  },e=>console.warn('Catálogo en vivo:',e))
 }catch(e){console.warn('Sincronizar catálogo:',e)}
}

/* ===== Redes sociales y contacto de la tienda virtual ===== */
let RS_DRAFT={},RS_MSG=null;
const redLink=(k,n,u,mini)=>`<a class="kred kred-${k}" href="${esc(u)}" target="_blank" rel="noopener noreferrer" aria-label="${n}" title="${n}"><svg viewBox="0 0 24 24" aria-hidden="true">${RED_SVG[k]}</svg>${mini?'':`<span>${n}</span>`}</a>`;
// Tienda pública: iconos junto al menú y botones al final de la página.
function shopFooterRender(){
 const f=$('k_footer');if(!f)return;
 f.innerHTML=`<div style="margin-top:36px;padding:26px 16px 80px;border-top:1px solid var(--linea);text-align:center;font-size:12.5px;color:var(--gris);background:var(--sf);border-radius:14px;margin-bottom:14px">
   <div style="font-weight:700;font-size:14.5px;color:var(--txt);margin-bottom:4px">${esc(nombreNegocio())}</div>
   <p style="margin:4px 0 10px;font-size:12px;color:var(--gris)">Tienda en línea en etapa preparatoria informativa · Panamá</p>
   <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px">
     <button type="button" class="btn s" data-h-click="call" data-a-click="${_ha('shopPoliticas')}" style="font-size:12px;display:inline-flex;align-items:center;gap:5px"><span>🛡️</span><span>Políticas y Privacidad (Ley 81)</span></button>
     <button type="button" class="btn s" data-h-click="call" data-a-click="${_ha('shopContacto')}" style="font-size:12px;display:inline-flex;align-items:center;gap:5px"><span>📞</span><span>Contacto oficial</span></button>
   </div>
   <small style="display:block;color:var(--gris);font-size:11px">Protección de datos personales conforme a la Ley 81 de 2019 de la República de Panamá.</small>
 </div>`;
}
function shopRedes(){
try{shopFooterRender()}catch(e){}

 const L=redesLista(typeof SH!=='undefined'?SH.redes:null),w=$('k_wa'),num=contLimpio(typeof SH!=='undefined'?SH.contacto:null).wa;
 if(w){if(num){w.href='https://wa.me/'+num+'?text='+encodeURIComponent('Hola, vi su catálogo virtual de '+nombreNegocio()+' y quisiera más información.');w.hidden=false}else{w.hidden=true;w.removeAttribute('href')}{const g=w.parentNode;if(g&&g.classList.contains('kwa-wrap'))g.hidden=w.hidden}}
 document.querySelectorAll('.kredh').forEach(e=>{e.innerHTML=L.map(([k,n,u])=>redLink(k,n,u,1)).join('')});
 const e=$('k_redes');if(!e)return;
 if(!L.length){e.hidden=true;e.innerHTML='';return}
 e.hidden=false;e.innerHTML=`<h3>Síganos en redes</h3><div class="kred-row">${L.map(([k,n,u])=>redLink(k,n,u)).join('')}</div>`
}
// Botón "Contacto" de la tienda: muestra los datos que configuró el administrador.
function shopContacto(){
 const c=contLimpio(typeof SH!=='undefined'?SH.contacto:null),L=redesLista(typeof SH!=='undefined'?SH.redes:null),f=[];
 if(c.wa)f.push(['💬','WhatsApp',`<a href="https://wa.me/${c.wa}" target="_blank" rel="noopener noreferrer">+${c.wa}</a>`]);
 if(c.tel)f.push(['📞','Teléfono',`<a href="tel:${esc(c.tel.replace(/[^\d+]/g,''))}">${esc(c.tel)}</a>`]);
 if(c.email)f.push(['✉️','Correo',`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`]);
 if(c.dir)f.push(['📍','Dirección',`<a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(c.dir)}" target="_blank" rel="noopener noreferrer">${esc(c.dir)}</a>`]);
 if(c.horario)f.push(['🕒','Horario',esc(c.horario)]);
 if(!f.length){if(TJEmpresa.empEsInicial())f.push(['✉️','Correo','<a href="mailto:tarjeteriajhon@gmail.com">tarjeteriajhon@gmail.com</a>']);else f.push(['ℹ️','Contacto','Esta empresa aún no ha publicado sus datos de contacto.'])}
 shopM(`<h2 style="margin:6px 0">Contacto</h2><div class="kcont">${f.map(([i,l,h])=>`<div class="kcr"><span>${i}</span><div><small>${l}</small><br>${h}</div></div>`).join('')}</div>${L.length?`<h3 style="margin:6px 0 10px">Síganos en redes</h3><div class="kred-row">${L.map(([k,n,u])=>redLink(k,n,u)).join('')}</div>`:''}<div class="kact2" style="margin-top:14px"><button class="sbtn g" data-h-click="h31">Cerrar</button></div>`,'contact')
}
// Configuración (administrador). Lo escrito sin guardar y el aviso sobreviven a los redibujados de la pantalla.

function redesCard(){

 const r=(typeof TD!=='undefined'&&TD.redes)||{},ct=contLimpio(typeof TD!=='undefined'?TD.contacto:null),ph={tiktok:'@tarjeteriajhon',instagram:'@tarjeteriajhon',facebook:'tarjeteriajhon'};
 const val=(id,saved)=>id in RS_DRAFT?RS_DRAFT[id]:saved;
 return `<h3 style="margin:0">📣 Redes sociales y contacto de la tienda</h3><p style="font-size:12.5px;color:var(--gris)">Las redes aparecen junto al menú y al final de la tienda virtual. Los datos de contacto se muestran cuando el cliente toca <b>Contacto</b>. El número de WhatsApp además aparece como botón verde flotante en la tienda (8 dígitos o con código de país). Deje vacío lo que no use.</p>
 <div class="g">${RED_DEF.map(([k,n])=>`<div><label>${n}</label><input id="rs_${k}" value="${esc(val('rs_'+k,redUrl(k,r[k])))}" placeholder="${ph[k]}" data-h-input="h336" autocomplete="off"></div>`).join('')}</div>
 <div class="g" style="margin-top:10px">${CONT_DEF.map(([k,n,p])=>`<div><label>${n}</label><input id="ct_${k}" value="${esc(val('ct_'+k,ct[k]))}" placeholder="${esc(p)}" data-h-input="h336" autocomplete="off"></div>`).join('')}</div>
 <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px"><button class="btn p" data-h-click="h335">Guardar redes y contacto</button><span id="rs_est" style="font-size:13px;color:${RS_MSG?RS_MSG.ok?'#1e7a43':'#b3261e':'inherit'}">${RS_MSG?esc(RS_MSG.t):''}</span></div>`
}
function redesFill(){
 if(typeof TD==='undefined')return;const r=TD.redes||{},ct=contLimpio(TD.contacto);
 RED_DEF.forEach(([k])=>{const i=$('rs_'+k);if(i&&!(i.id in RS_DRAFT)&&document.activeElement!==i)i.value=redUrl(k,r[k])});
 CONT_DEF.forEach(([k])=>{const i=$('ct_'+k);if(i&&!(i.id in RS_DRAFT)&&document.activeElement!==i)i.value=ct[k]})
}
async function redesGuardar(){
 if(!esAdmin())return alert('Solo el administrador puede cambiar las redes sociales y el contacto.');
 if(!fbDb)return alert('Sin conexión con Firebase. Intente de nuevo en un momento.');
 const est=$('rs_est'),msg=(ok,t)=>{RS_MSG={ok,t};if(est){est.style.color=ok?'#1e7a43':'#b3261e';est.textContent=t}},redes={},raw={};
 for(const [k,n] of RED_DEF){
  const i=$('rs_'+k),t=i?i.value.trim():'',u=redUrl(k,t);
  if(t&&!u){msg(false,'✖ '+n+': no es válido. Escriba el @usuario o el link de su perfil de '+n+'.');if(i)i.focus();return}
  redes[k]=u
 }
 CONT_DEF.forEach(([k])=>{const i=$('ct_'+k);raw[k]=i?i.value:''});
 const ct=contLimpio(raw);
 for(const [k,n] of CONT_DEF){
  if(String(raw[k]).trim()&&!ct[k]){msg(false,'✖ '+n.replace(/ \(.*\)/,'')+': el dato no es válido.');const i=$('ct_'+k);if(i)i.focus();return}
 }
 msg(true,'Guardando…');
 try{
  await fbCol('tienda_items').doc('__cfg').set({__cfg:true,redes,contacto:ct,ts:Date.now()},{merge:true});
  TD.redes=redes;TD.contacto=ct;RS_DRAFT={};
  RED_DEF.forEach(([k])=>{const i=$('rs_'+k);if(i)i.value=redes[k]});CONT_DEF.forEach(([k])=>{const i=$('ct_'+k);if(i)i.value=ct[k]});
  msg(true,'✔ Guardado. Ya se ve en la tienda virtual.')
 }catch(e){window._tjw&&_tjw(e);msg(false,'✖ No se pudo guardar. Revise su conexión o permisos.')}
}
/* ===== Destacados de la semana: carrusel automático (cada 5 s) y ajuste para móvil ===== */
function shopDestTick(){
 const r=document.querySelector('#k_dest .kdr');
 if(!r||document.hidden||r.scrollWidth<=r.clientWidth+8)return;
 if(Date.now()<(typeof SH!=='undefined'&&SH._dh||0)||(r.matches&&r.matches(':hover')))return;
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const rb=r.getBoundingClientRect();if(rb.bottom<0||rb.top>(window.innerHeight||document.documentElement.clientHeight))return;
 const cs=[].slice.call(r.children);if(cs.length<2)return;
 const off=c=>c.getBoundingClientRect().left-rb.left+r.scrollLeft,fin=r.scrollLeft+r.clientWidth>=r.scrollWidth-4;
 const nx=fin?null:cs.find(c=>off(c)>r.scrollLeft+4);
 r.scrollTo({left:nx?off(nx):0,behavior:'smooth'})
}
// Un solo temporizador para toda la página: si el usuario toca o desliza, el avance se pausa unos segundos.
function shopDestAuto(){
 if(SH._dt)return;SH._dt=setInterval(shopDestTick,5000);
 const hold=ev=>{if(ev.target&&ev.target.closest&&ev.target.closest('#k_dest'))SH._dh=Date.now()+8000};
 ['pointerdown','touchstart','wheel','keydown'].forEach(t=>document.addEventListener(t,hold,{passive:true}))
}
const V=[['home','🏠','Inicio'],['nueva','🧾','Nueva factura'],['fac','📚','Facturas'],['prod','🎴','Productos'],['cat','📖','Catálogo'],['cli','👥','Clientes'],['ubi','📍','Ubicación'],['check','✅','Check'],['agenda','📅','Agenda'],['config','⚙️','Configuración']];
let vista='home',items=[],perVentasSel='dia';
function perVentas(p){perVentasSel=p;R.home()}
let navEd=false;
function navOrd(){const o=DB.cfg.navOrder||[];return V.map((v,i)=>[v,i]).sort((a,b)=>{const x=o.indexOf(a[0][0]),y=o.indexOf(b[0][0]);return(x<0?900+a[1]:x)-(y<0?900+b[1]:y)}).map(a=>a[0])}
function nav(){const mk=(u,d)=>navOrd().map(v=>`<div class="ni ${v[0]==vista?'on':''}" data-k="${v[0]}" data-h-click="h328" data-a-click="${_ha(v[0])}"><span class="ic">${v[0]==='tiktoklive'?TIKTOK_SVG:v[1]}</span><span class="lb">${v[2]}</span>${navEd?`<span class="mv"><i data-h-click="h327" data-a-click="${_ha(v[0])}">${u}</i><i data-h-click="h326" data-a-click="${_ha(v[0])}">${d}</i></span>`:''}</div>`).join('');
 $('nav').innerHTML=mk('▲','▼');const n2=$('nav2');if(n2)n2.innerHTML=mk('◀','▶');document.body.classList.toggle('navEd',navEd);['navEdBtn','navEdBtn2'].forEach(id=>{const x=$(id);if(x)x.textContent=navEd?'✔ Listo':'↕ Ordenar botones'})}
const navClick=k=>{if(!navEd)ir(k)};
function navEdit(){navEd=!navEd;nav()}
function navMv(e,k,d){e.stopPropagation();const o=navOrd().map(v=>v[0]),i=o.indexOf(k),j=i+d;if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];DB.cfg.navOrder=o;save();nav()}
function navReset(){DB.cfg.navOrder=[];save();nav()}
(()=>{let dr=null;const dn=e=>{if(!navEd||e.target.closest('.mv'))return;const it=e.target.closest('.ni');if(!it)return;dr={it,c:it.parentNode,h:it.parentNode.id==='nav2',m:0,x:e.clientX,y:e.clientY};try{it.setPointerCapture(e.pointerId)}catch(x){window._tjw&&_tjw(x)}};
 const mv=e=>{if(!dr)return;if(!dr.m&&Math.abs(e.clientX-dr.x)+Math.abs(e.clientY-dr.y)<6)return;dr.m=1;dr.it.classList.add('drg');const t=document.elementFromPoint(e.clientX,e.clientY),tg=t&&t.closest('.ni');if(!tg||tg===dr.it||tg.parentNode!==dr.c)return;const r=tg.getBoundingClientRect(),af=dr.h?e.clientX>r.left+r.width/2:e.clientY>r.top+r.height/2;dr.c.insertBefore(dr.it,af?tg.nextSibling:tg)};
 const up=()=>{if(!dr)return;const d=dr;dr=null;d.it.classList.remove('drg');if(d.m){DB.cfg.navOrder=[...d.c.children].map(c=>c.dataset.k);save();nav()}};
 ['nav','nav2'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('pointerdown',dn);el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)})})();
function getTemaUser(){const uid=SES?SES.id:'admin';return localStorage.getItem('tj_tema_'+uid)||DB.cfg.tema||'claro'}
function aplicarTema(t,guardar){document.documentElement.dataset.t=t==='claro'?'':t;const th=$('th');if(th)th.value=t;if(guardar&&SES){localStorage.setItem('tj_tema_'+SES.id,t)}if(guardar&&!SES){localStorage.setItem('tj_tema_admin',t)}if(vista==='home')setTimeout(dibujarGraficos,0)}
function tema(t){aplicarTema(t,true);if(vista==='config')R.config()}
function reloj(){const d=new Date();$('ct').textContent=d.toLocaleTimeString('es-PA');$('cd').textContent=d.toLocaleDateString('es-PA',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
setInterval(reloj,1000);reloj();
function ir(v){if(v!=='home')0;vista=v;if(v==='nueva'&&!items.length)items=[{}];nav();$('tt').textContent=V.find(x=>x[0]==v)[2];R[v]();if(v==='home')renderE();scrollTo(0,0);cintillo()}
const act=()=>DB.fac.filter(f=>!f.anulada);
const R={
home(){editEmails=false;const h=hoy(),m=h.slice(0,7),a=act(),sum=l=>l.reduce((s,f)=>s+f.total,0);
 const ventasHoy=sum(a.filter(f=>f.fecha==h)),ventasMes=sum(a.filter(f=>f.fecha.startsWith(m)));
 const cantHoy=a.filter(f=>f.fecha==h).length,cantMes=a.filter(f=>f.fecha.startsWith(m)).length;
 const totalFac=a.length,ticketProm=totalFac?(sum(a)/totalFac):0;
 const cnt={};a.forEach(f=>(f.items||[]).forEach(i=>cnt[i.d]=(cnt[i.d]||0)+i.q));
 const top=Object.entries(cnt).sort((x,y)=>y[1]-x[1])[0];
 const peds=(typeof TD!=='undefined'&&TD.peds)||[],pedNuevos=peds.filter(p=>p.estado==='nuevo'||p.estado==='pendiente'||!p.estado).length;
 
 const hero=`<div class="dash-hero" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;background:var(--sf);border:1px solid var(--linea);border-radius:14px;padding:16px 20px;margin-bottom:18px">
   <div>
     <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
       <span style="font-size:20px">⚡</span>
       <h2 style="margin:0;font-size:19px;font-weight:700;letter-spacing:-.02em">Panel de Control Ejecutivo</h2>
       <span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;padding:3px 8px;border-radius:12px;background:rgba(16,185,129,.12);color:color-mix(in srgb,var(--okt,#15803d) 78%,#000);font-weight:600">● En línea</span>
     </div>
     <p style="margin:0;font-size:12.5px;color:var(--gris)">Resumen financiero y operativo en tiempo real · <b>${h}</b></p>
   </div>
   <div style="display:flex;gap:8px;flex-wrap:wrap">
     <button class="btn p" data-h-click="h324" style="display:inline-flex;align-items:center;gap:6px"><span>🧾</span><span>Nueva factura</span></button>
     <button class="btn" data-h-click="h323" style="display:inline-flex;align-items:center;gap:6px"><span>🎴</span><span>Catálogo</span></button>
   </div>
 </div>`;
 
 const kpis=`<div class="kp" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:18px">
   <div class="card kpi-card" style="margin:0;border-left:4px solid #10b981;position:relative">
     <div style="display:flex;justify-content:space-between;align-items:center">
       <small style="color:var(--gris);font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Ventas del mes</small>
       <span style="width:28px;height:28px;border-radius:6px;background:rgba(16,185,129,.15);color:#10b981;display:flex;align-items:center;justify-content:center;font-size:14px">📈</span>
     </div>
     <b style="display:block;font-size:26px;margin:8px 0 2px;letter-spacing:-.02em;color:var(--txt)">${$$(ventasMes)}</b>
     <small style="color:var(--gris);font-size:11.5px"><span style="color:var(--okt,#15803d);font-weight:600">${cantMes} facturas</span> este mes</small>
   </div>
   <div class="card kpi-card" style="margin:0;border-left:4px solid var(--az);position:relative">
     <div style="display:flex;justify-content:space-between;align-items:center">
       <small style="color:var(--gris);font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Ventas de hoy</small>
       <span style="width:28px;height:28px;border-radius:6px;background:rgba(224,69,123,.15);color:var(--az);display:flex;align-items:center;justify-content:center;font-size:14px">📅</span>
     </div>
     <b style="display:block;font-size:26px;margin:8px 0 2px;letter-spacing:-.02em;color:var(--txt)">${$$(ventasHoy)}</b>
     <small style="color:var(--gris);font-size:11.5px"><span style="color:var(--az);font-weight:600">${cantHoy} ventas</span> registradas hoy</small>
   </div>
   <div class="card kpi-card" style="margin:0;border-left:4px solid #6366f1;position:relative">
     <div style="display:flex;justify-content:space-between;align-items:center">
       <small style="color:var(--gris);font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Facturas emitidas</small>
       <span style="width:28px;height:28px;border-radius:6px;background:rgba(99,102,241,.15);color:#6366f1;display:flex;align-items:center;justify-content:center;font-size:14px">🧾</span>
     </div>
     <b style="display:block;font-size:26px;margin:8px 0 2px;letter-spacing:-.02em;color:var(--txt)">${totalFac}</b>
     <small style="color:var(--gris);font-size:11.5px">Promedio: <b style="color:#6366f1">${$$(ticketProm)}</b> / fac.</small>
   </div>
   <div class="card kpi-card" style="margin:0;border-left:4px solid #8b5cf6;position:relative">
     <div style="display:flex;justify-content:space-between;align-items:center">
       <small style="color:var(--gris);font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Tienda Online</small>
       <span style="width:28px;height:28px;border-radius:6px;background:rgba(139,92,246,.15);color:#8b5cf6;display:flex;align-items:center;justify-content:center;font-size:14px">🛍️</span>
     </div>
     <b style="display:block;font-size:26px;margin:8px 0 2px;letter-spacing:-.02em;color:var(--txt)">${peds.length}</b>
     <small style="color:var(--gris);font-size:11.5px"><span style="color:var(--viot,#6d28d9);font-weight:600">${pedNuevos} pedidos</span> por atender</small>
   </div>
   <div class="card kpi-card" style="margin:0;border-left:4px solid #f59e0b;position:relative">
     <div style="display:flex;justify-content:space-between;align-items:center">
       <small style="color:var(--gris);font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Producto estrella</small>
       <span style="width:28px;height:28px;border-radius:6px;background:rgba(245,158,11,.15);color:#f59e0b;display:flex;align-items:center;justify-content:center;font-size:14px">⭐</span>
     </div>
     <b style="display:block;font-size:17px;margin:12px 0 2px;letter-spacing:-.01em;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${top?esc(top[0]):''}">${top?esc(top[0]):'—'}</b>
     <small style="color:var(--gris);font-size:11.5px"><span style="color:var(--warnt,#b45309);font-weight:600">${top?top[1]+' unid.':'0 unid.'}</span> vendidas</small>
   </div>
 </div>`;
 
 const chartMain=`<div class="cgv"><div class="card" style="margin:0"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px"><div><h3 style="margin:0;font-size:16px;font-weight:700">📊 Evolución de Ventas</h3><small style="color:var(--gris);font-size:12px">Histórico de facturación acumulada por periodo</small></div><div class="pt" id="ptVentas">${[['dia','Día'],['semana','Semana'],['mes','Mes'],['anio','Año']].map(([p,l])=>`<button class="${p==perVentasSel?'on':''}" data-h-click="h325" data-a-click="${_ha(p)}">${l}</button>`).join('')}</div></div><div style="position:relative;height:280px"><canvas id="chVentas"></canvas></div><div class="nota" id="chWarn" style="display:none;margin-top:10px">No se pudieron cargar los gráficos. Verifique su conexión para cargar Chart.js.</div></div></div>`;
 
 const chartSub=`<div class="cg" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:18px"><div class="card" style="margin:0;display:flex;flex-direction:column;height:300px"><h3 style="margin:0 0 2px;font-size:15px">🔥 Top 5 Productos Más Vendidos</h3><small style="color:var(--gris);font-size:12px;margin-bottom:8px">Unidades despachadas</small><div style="flex:1;min-height:0;position:relative"><canvas id="chProd"></canvas></div></div><div class="card" style="margin:0;display:flex;flex-direction:column;height:300px"><h3 style="margin:0 0 2px;font-size:15px">⭐ Mejores Clientes</h3><small style="color:var(--gris);font-size:12px;margin-bottom:8px">Total acumulado facturado</small><div style="flex:1;min-height:0;position:relative"><canvas id="chCli"></canvas></div></div></div>`;
 
 const chartDonut=`<div class="card" style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div><h3 style="margin:0;font-size:15px">🥧 Distribución de Ventas por Ocasión / Categoría</h3><small style="color:var(--gris);font-size:12px">Participación por tipo de tarjeta en el catálogo</small></div></div><div style="height:220px;position:relative"><canvas id="chCat"></canvas></div></div>`;
 
 const quick=`<div class="card" style="margin-bottom:18px"><h3 style="margin:0 0 10px;font-size:15px">⚡ Acciones Rápidas</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn p" data-h-click="h324">🧾 Nueva factura</button> <button class="btn" data-h-click="h323">🎴 Productos</button> <button class="btn" data-h-click="h322">👥 Clientes</button> <button class="btn" data-h-click="h321">✉ Enviar reporte</button> <button class="btn s" data-h-click="h320">${DB.fac.some(f=>f.demo)?'🗑 Quitar datos de ejemplo':'🧪 Cargar datos de ejemplo'}</button></div></div>`;
 
 const facs=`<div class="card" style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="margin:0;font-size:15px">🧾 Últimas facturas emitidas</h3><button class="btn s" data-h-click="h324">+ Emitir nueva</button></div>${tabFac(DB.fac.slice(-6).reverse())}</div>`;
 
 const legacyCards=`<div class="card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;font-size:14px;cursor:pointer" data-h-click="h319">✉️ Correos predeterminados <span id="caretEmail">${cardState.email?'▾':'▸'}</span></h3><button class="btn s" id="btnToggleEmail" data-h-click="h319">${cardState.email?'Minimizar':'Maximizar'}</button></div><div id="bodyEmail" style="display:${cardState.email?'':'none'};margin-top:10px"><div style="display:flex;justify-content:flex-end;margin-bottom:6px"><button class="btn s" id="btnEditE" data-h-click="h286">✏️ Editar</button><button class="btn s" id="btnDoneE" style="display:none" data-h-click="h285">✔ Listo</button></div><p style="font-size:12.5px;color:var(--gris);margin-top:-6px">Se sugieren al enviar reportes o facturas por correo.</p><div class="g" style="margin-bottom:10px"><div><label>Nombre</label><input id="e_n" placeholder="Ej. Contabilidad" disabled></div><div><label>Correo</label><input id="e_m" type="email" placeholder="correo@ejemplo.com" disabled></div></div><button class="btn s" id="btnAddE" data-h-click="h284" disabled>+ Agregar correo</button><div id="elist" style="margin-top:12px"></div></div></div><div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;font-size:14px;cursor:pointer" data-h-click="h318">🏢 Datos de la empresa <span id="caretCfg">${cardState.cfg?'▾':'▸'}</span></h3><button class="btn s" id="btnToggleCfg" data-h-click="h318">${cardState.cfg?'Minimizar':'Maximizar'}</button></div><div id="bodyCfg" style="display:${cardState.cfg?'':'none'};margin-top:10px"><div style="display:flex;justify-content:flex-end;margin-bottom:6px"><button class="btn s" id="btnEditCfg" data-h-click="h289">✏️ Editar</button></div><div class="g"><div><label>Nombre</label><input id="c1" value="${esc(DB.cfg.nombre)}" disabled></div><div><label>Teléfono</label><input id="c3" value="${esc(DB.cfg.tel)}" disabled></div><div><label>Correo</label><input id="c6" value="${esc(DB.cfg.email)}" disabled></div><div><label>Ubicación</label><input id="c4" value="${esc(DB.cfg.dir)}" disabled></div><div><label>Banco</label><input id="c7" value="${esc(DB.cfg.banco)}" disabled></div><div><label>Tipo de cuenta</label><input id="c8" value="${esc(DB.cfg.tcuenta)}" disabled></div><div><label>N.º de cuenta</label><input id="c9" value="${esc(DB.cfg.cuenta)}" disabled></div><div><label>Yappy</label><input id="c10" value="${esc(DB.cfg.yappy)}" disabled></div><div><label>ITBMS %</label><input id="c5" type="number" value="${DB.cfg.itbms}" disabled></div><div><label>Próximo n.º de factura</label><input id="c11" type="number" value="${DB.cfg.sig}" disabled></div></div><br><button class="btn p" id="btnSaveCfg" style="display:none" data-h-click="h288">💾 Guardar datos</button> <button class="btn s" id="btnCancelCfg" style="display:none" data-h-click="h317">Cancelar</button></div></div>`;
 
 $('v').innerHTML = `<div id="homeWaSlot"></div>` + hero + kpis + chartMain + chartSub + chartDonut + `<div id="homeMapSlot"></div><div id="homeOps"></div>` + quick + facs + legacyCards;
 dibujarGraficos()},
nueva(){const opts=DB.prod.map(p=>`<option value="${p.id}">${esc(p.n)} — ${$$(p.p)}</option>`).join('');
 $('v').innerHTML=`<div class="card"><h3>Factura n.º ${DB.cfg.sig}</h3><div class="g"><div><label>Fecha</label><input id="f_fecha" type="date" value="${hoy()}" data-h-change="h316"></div>
 <div><label>Cliente registrado</label><select id="f_cs" data-h-change="h315"><option value="">— Consumidor final —</option>${DB.cli.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></div>
 <div><label>Nombre del cliente</label><input id="f_cn" placeholder="Consumidor final"></div><div><label>RUC / Cédula</label><input id="f_cr"></div><div><label>Dirección / Ubicación</label><input id="f_cd"></div>
 <div><label>Pago</label><select id="f_pg" data-h-change="h314"><option>Efectivo</option><option>Yappy</option><option>Tarjeta</option><option>Transferencia</option><option>Crédito</option><option>Pago mixto</option></select></div><div style="grid-column:1/-1"><label>Notas de la factura (opcional)</label><textarea id="f_nt" rows="2" placeholder="Ej: entregar el viernes, abono pendiente…"></textarea></div></div></div>
 <div class="card"><h3>Artículos</h3><div class="tw"><table><thead><tr><th style="width:38%">Producto</th><th>Descripción</th><th>Cant.</th><th>Precio</th><th class="r">Subtotal</th><th></th></tr></thead><tbody id="fi"></tbody></table></div>
 <p><button class="btn s" data-h-click="h313">+ Agregar línea</button></p>
 <div class="tot"><div><span>Subtotal</span><b id="t1"></b></div><div><span>Descuento ($)</span><input id="f_ds" aria-label="Descuento en dólares" type="number" min="0" value="0" style="width:90px" data-h-input="h312"></div><div><span><label style="display:inline"><input type="checkbox" id="f_it" checked style="width:auto" data-h-change="h312"> ITBMS ${DB.cfg.itbms}%</label></span><b id="t2"></b></div><div class="gt"><span>Total</span><span id="t3"></span></div></div>
 <div id="pgBox"></div>
 <p style="text-align:right"><button class="btn" data-h-click="h311">Limpiar</button> <button class="btn p" data-h-click="h310">Emitir factura</button></p></div>`;window._opts=opts;filas();mix=[{m:'Efectivo',v:''},{m:'Crédito',v:''}];crN=30;crU='dias';pgUI()},
fac(){$('v').innerHTML=`<div class="card"><h3>Historial de facturas</h3>${tabFac(DB.fac.slice().reverse(),1)}</div>`},
prod(){$('v').innerHTML=`<div class="card"><h3>Agregar producto</h3><div class="g"><div><label>Nombre</label><input id="pn"></div><div><label>Precio ($)</label><input id="pp" type="number" step="0.01"></div></div><br><button class="btn p" data-h-click="h309">Agregar</button></div>
 <div class="card"><h3>Catálogo</h3><div class="tw"><table><tr><th>Producto</th><th class="r">Precio</th><th></th></tr>${DB.prod.map(p=>`<tr><td>${esc(p.n)}</td><td class="r">${$$(p.p)}</td><td class="r"><button class="btn s" data-h-click="h308" data-a-click="${_ha(p.id)}">Editar</button> <button class="btn s d" data-h-click="h307" data-a-click="${_ha(p.id)}">Eliminar</button></td></tr>`).join('')}</table></div></div>`},
cli(){$('v').innerHTML=`<div class="card"><h3>Agregar cliente</h3><div class="g"><div><label>Nombre</label><input id="cn"></div><div><label>RUC / Cédula</label><input id="cr"></div><div><label>Teléfono</label><input id="ct2"></div><div><label>Dirección / Ubicación</label><input id="cd2"></div></div>
 <div class="g" style="margin-top:10px"><div style="grid-column:1/-1"><label>📍 Ubicación del negocio (opcional)</label><input id="cu_link" placeholder="Pegue el link de Google Maps o las coordenadas, o use su ubicación actual" data-h-input="h330"></div></div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn s" id="cu_gps" data-h-click="h329">🎯 Usar mi ubicación actual</button><button class="btn s" data-h-click="h331">↗ Abrir en Google Maps</button></div>
 <div id="cu_est" style="margin-top:8px;font-size:13px;color:var(--gris)"></div>
 <div id="cuMap" class="mcmap mcmap-pick"></div><small style="color:var(--gris)">Toque el mapa para marcar el negocio. Puede arrastrar el marcador para afinar el punto.</small><br><br><button class="btn p" data-h-click="h306">Agregar</button></div>
 <div class="card"><h3>Clientes</h3>${DB.cli.length?`<div class="tw"><table><tr><th>Nombre</th><th>RUC/Cédula</th><th>Teléfono</th><th>Ubicación</th><th></th></tr>${DB.cli.map(c=>`<tr><td>${esc(c.n)}</td><td>${esc(c.r)}</td><td>${esc(c.t)}</td><td>${cliLocBtn(c)}</td><td class="r">${waBtn(c)}${esAdmin()?`<button class="btn s" data-h-click="h305" data-a-click="${_ha(c.id)}">Editar</button> <button class="btn s d" data-h-click="h304" data-a-click="${_ha(c.id)}">Eliminar</button>`:''}</td></tr>`).join('')}</table></div>`:'<div class="vacio">Aún no hay clientes registrados.</div>'}</div>`;cliMapaIniciar()},
ubi(){const cliOpts=DB.cli.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('');
 $('v').innerHTML=`<div class="card"><h3>Registrar ubicación</h3>
 <div class="g">
  <div><label>Cliente</label><select id="ubiCliSel" data-h-change="h303"><option value="">— Lugar nuevo / otro —</option>${cliOpts}</select></div>
  <div id="ubiOtroWrap"><label>Nombre del lugar</label><input id="ubiN" placeholder="Ej: Residencial Costa del Este, casa 12"></div>
 </div>
 <div class="g"><div style="grid-column:1/-1"><label>Nota (opcional)</label><input id="ubiNota" placeholder="Ej: entrega de pedido, visita de cobro…"></div></div>
 <div class="g"><div style="grid-column:1/-1"><label>🔗 Link de Google Maps (opcional)</label><input id="ubiLink" placeholder="Pegue aquí el link de Google Maps o las coordenadas"></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn s" data-h-click="h302">🎯 Ir al sitio en el mapa</button><button class="btn s" data-h-click="h301">↗ Abrir en Google Maps</button><button class="btn s" data-h-click="h300">💾 Guardar este sitio</button></div>
 <br><button class="btn p" id="btnUbi" data-h-click="h299">📍 Capturar ubicación actual</button>
 <div id="ubiEstado" style="margin-top:8px;font-size:13px;color:var(--gris)"></div></div>
 <div class="card"><div class="r" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h3 style="margin:0">Mapa de ubicaciones</h3><div style="display:flex;gap:8px"><button class="btn s" data-h-click="h298">🎯 Mi ubicación</button><button class="btn s" data-h-click="h293">⛶ Pantalla completa</button><span id="miPrecision" style="font-size:12px;color:var(--gris);align-self:center"></span>${DB.ubi.length?`<button class="btn s" data-h-click="h297">⬇ Exportar CSV (X,Y para ArcGIS)</button>`:''}</div></div>
 <div style="font-size:13px;color:var(--gris);margin-top:6px">Toque el mapa para colocar un punto a mano (usa el cliente o nombre de arriba), o use "Capturar ubicación actual" para el punto GPS exacto donde está parado.</div>
 <div id="ubiWrap"><div class="ubifbar"><input id="ubiLink2" placeholder="Pegue el link de Google Maps…" data-h-keydown="h296"><button class="btn p" data-h-click="h295">Ir</button><button class="btn" data-h-click="h294">✕ Salir</button></div><button class="ubifb" data-h-click="h293" title="Pantalla completa" aria-label="Pantalla completa">⛶</button><div id="ubiMap" style="height:380px;border-radius:14px;overflow:hidden"></div></div>
 ${DB.ubi.length?`<div class="tw" style="margin-top:14px"><table><tr><th>Nombre</th><th>Coordenadas</th><th>Precisión</th><th>Fecha</th><th></th></tr>${DB.ubi.slice().reverse().map(u=>`<tr><td>${esc(u.n)}${u.nota?`<br><small style="color:var(--gris)">${esc(u.nota)}</small>`:''}</td><td>${u.lat.toFixed(6)}, ${u.lng.toFixed(6)}</td><td>${u.acc!=null?'±'+Math.round(u.acc)+' m':'Manual (mapa)'}</td><td>${fdate(u.fecha)} ${u.hora||''}</td><td class="r"><a class="btn s" href="https://www.google.com/maps?q=${u.lat},${u.lng}" target="_blank" rel="noopener">🗺 Google Maps</a> <button class="btn s" data-h-click="h292" data-a-click="${_ha(u.id)}">🎯 Centrar</button> <button class="btn s d" data-h-click="h291" data-a-click="${_ha(u.id)}" aria-label="Eliminar">🗑</button></td></tr>`).join('')}</table></div>`:'<div class="vacio">Aún no hay ubicaciones registradas.</div>'}</div>`;
 pintarMapaUbi()},
config(){editEmails=false;
 const temas=[['claro','Claro'],['oceano','Océano'],['violeta','Violeta'],['nocturno','Nocturno']],ta=DB.cfg.tema||'claro';
 const c1=wrapCardInner('cfg_apariencia','🎨 Apariencia',`<p style="font-size:12.5px;color:var(--gris);margin-top:-6px">Elija el tema de color del panel.</p><div class="pt" id="ptTema">${temas.map(([k,l])=>`<button class="${k==ta?'on':''}" data-h-click="h290" data-a-click="${_ha(k)}">${l}</button>`).join('')}</div>`);
 const c2=wrapCardInner('cfg_empresa','🏢 Datos de la empresa (aparecen en la factura)',`<div style="display:flex;justify-content:flex-end;margin-bottom:6px"><button class="btn s" id="btnEditCfg" data-h-click="h289">✏️ Editar</button></div><div class="g" style="margin-top:12px"><div><label>Nombre</label><input id="c1" value="${esc(DB.cfg.nombre)}" disabled></div><div><label>Teléfono</label><input id="c3" value="${esc(DB.cfg.tel)}" disabled></div><div><label>Correo</label><input id="c6" value="${esc(DB.cfg.email)}" disabled></div><div><label>Ubicación</label><input id="c4" value="${esc(DB.cfg.dir)}" disabled></div><div><label>Banco</label><input id="c7" value="${esc(DB.cfg.banco)}" disabled></div><div><label>Tipo de cuenta</label><input id="c8" value="${esc(DB.cfg.tcuenta)}" disabled></div><div><label>N.º de cuenta</label><input id="c9" value="${esc(DB.cfg.cuenta)}" disabled></div><div><label>Yappy</label><input id="c10" value="${esc(DB.cfg.yappy)}" disabled></div><div><label>ITBMS %</label><input id="c5" type="number" value="${DB.cfg.itbms}" disabled></div><div><label>Próximo n.º de factura</label><input id="c11" type="number" value="${DB.cfg.sig}" disabled></div></div>
 <div style="margin-top:14px"><label>Logo de la empresa (aparece en la factura)</label>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
   ${DB.cfg.logoFac?`<img src="${DB.cfg.logoFac}" alt="logo" style="height:54px;border-radius:10px;background:#fff;padding:4px 10px;border:1px solid var(--linea)">`:'<small style="color:var(--gris)">Sin logo propio: la factura usa el logo del panel.</small>'}
   <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">📁 Subir logo<input type="file" accept="image/*" hidden data-h-change="call" data-a-change="${_ha('facLogoFile')}"></label>
   ${DB.cfg.logoFac?`<button class="btn s d" data-h-click="call" data-a-click="${_ha('facLogoQuitar')}">Quitar</button>`:''}
  </div>
  <small style="display:block;color:var(--gris);font-size:11.5px;margin-top:4px">Dimensiones: horizontal, recomendado <b>600×200 px</b> (mínimo 200 de ancho) · PNG con fondo transparente ideal.</small>
  </div></div>
 <br><button class="btn p" id="btnSaveCfg" style="display:none" data-h-click="h288">💾 Guardar datos</button> <button class="btn s" id="btnCancelCfg" style="display:none" data-h-click="h287">Cancelar</button>`);
 const c3=wrapCardInner('cfg_emails','✉️ Correos predeterminados',`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><p style="font-size:12.5px;color:var(--gris);margin:0">Se sugieren al enviar reportes o facturas por correo.</p><span><button class="btn s" id="btnEditE" data-h-click="h286">✏️ Editar</button><button class="btn s" id="btnDoneE" style="display:none" data-h-click="h285">✔ Listo</button></span></div><div class="g" style="margin-bottom:10px"><div><label>Nombre</label><input id="e_n" placeholder="Ej. Contabilidad" disabled></div><div><label>Correo</label><input id="e_m" type="email" placeholder="correo@ejemplo.com" disabled></div></div><button class="btn s" id="btnAddE" data-h-click="h284" disabled>+ Agregar correo</button><div id="elist" style="margin-top:12px"></div>`);
 const c4=wrapCardInner('cfg_notif','🔔 Notificaciones de la agenda',`<p style="font-size:12.5px;color:var(--gris);margin-top:-6px">Aviso con sonido para los eventos que tengan "Avisar". Funciona mientras el panel esté abierto en el navegador.</p><div class="g"><div><label>Sonido</label><select data-h-change="h283"><option value="1" ${DB.cfg.snd?'selected':''}>Activado</option><option value="0" ${DB.cfg.snd?'':'selected'}>Silenciado</option></select></div><div><label>Tono</label><select data-h-change="h282">${[['campana','🔔 Campana'],['suave','🎵 Suave'],['alerta','🚨 Alerta'],['digital','📟 Digital']].map(([k,l])=>`<option value="${k}" ${DB.cfg.tono==k?'selected':''}>${l}</option>`).join('')}</select></div><div><label>Volumen: <span id="volv">${DB.cfg.vol}%</span></label><input type="range" min="10" max="100" value="${DB.cfg.vol}" data-h-input="h281" data-h-change="h280"></div></div><br><button class="btn p" data-h-click="h279">▶ Probar sonido</button> <button class="btn" data-h-click="h278">🔔 Probar notificación</button> <button class="btn" data-h-click="h277">🖥 Avisos del sistema</button> <small id="permSt" style="color:var(--gris)">${window.Notification&&Notification.permission==='granted'&&DB.cfg.nsys?'✔ Activados':''}</small>`);
 const c5=wrapCardInner('cfg_nav','🧭 Orden de los botones del menú',`<p style="font-size:12.5px;color:var(--gris);margin-top:-6px">Toque "Ordenar botones" y mueva cada botón con sus flechas, o arrástrelo con el dedo o el mouse. Al terminar toque "Listo".</p><button class="btn p" id="navEdBtn2" data-h-click="h276">${navEd?'✔ Listo':'↕ Ordenar botones'}</button> <button class="btn" data-h-click="h275">↺ Restablecer orden</button>`);
 const c6=wrapCardInner('cfg_respaldo','💾 Respaldo y descarga',`<p style="font-size:12.5px;color:var(--gris);margin-top:-6px"><span class="cloudSt">☁ Conectando…</span><br>Sus datos se sincronizan automáticamente. Puede además descargar un respaldo como copia adicional.</p><button class="btn p" data-h-click="h274">⬇ Descargar respaldo</button> <button class="btn s" data-h-click="h273">⬆ Restaurar respaldo</button>`);
 const adm=typeof esAdmin==='function'&&esAdmin();
 const tabs=adm?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
   <button id="cfgTabWeb" class="btn ${cfgTabActual()==='web'?'p':''}" style="flex:1;min-width:230px" data-h-click="call" data-a-click="${_ha('cfgTab','web')}">🌐 Personalización y configuración web</button>
   <button id="cfgTabGen" class="btn ${cfgTabActual()==='gen'?'p':''}" style="flex:1;min-width:230px" data-h-click="call" data-a-click="${_ha('cfgTab','gen')}">⚙️ Ajustes generales del panel</button>
 </div>`:'';
 const tb=`<div id="cfgTb">${tabs}<div style="display:flex;gap:8px;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap"><small style="color:var(--gris);font-size:12px">${adm?'Dos secciones: todo lo que ve el cliente en la web va en «Personalización y configuración web». ':''}Todas las tarjetas aparecen minimizadas por defecto; toque una para ver sus opciones.</small><div style="display:flex;gap:6px"><button class="btn s" data-h-click="call" data-a-click="${_ha('cfgExpandAll')}">▾ Expandir todo</button><button class="btn s" data-h-click="call" data-a-click="${_ha('cfgCollapseAll')}">▸ Minimizar todo</button></div></div></div>`;
 const hdrWeb=`<div style="margin:2px 2px 14px"><h2 style="margin:0;font-size:17px;font-weight:700;letter-spacing:-.02em">🌐 Personalización y configuración web</h2><small style="color:var(--gris);font-size:12.5px">Todo el diseño de su web en un solo lugar: temas y colores, fondos, imágenes y videos, textos de la portada, temáticas de temporada, redes sociales y transportistas de la tienda pública.</small></div>`;
 const hdrGen=`<div style="margin:2px 2px 14px"><h2 style="margin:0;font-size:17px;font-weight:700;letter-spacing:-.02em">⚙️ Ajustes generales del panel</h2><small style="color:var(--gris);font-size:12.5px">Datos de la empresa, correos, notificaciones, respaldos, seguridad y herramientas del negocio.</small></div>`;
 $('v').innerHTML=tb
  +`<div id="cfgWeb"${adm?' style="display:none"':''}>${hdrWeb}<div class="card">${c1}</div><div id="cfgWebExtra"></div></div>`
  +`<div id="cfgGen">${hdrGen}<div class="card">${c2}</div><div class="card">${c3}</div><div class="card">${c4}</div><div class="card">${c5}</div><div class="card">${c6}</div><div id="cfgGenExtra"></div></div>`;
 if(adm)cfgTab(cfgTabActual());
 renderE()},
agenda(){const t=hoy(),pend=l=>l.filter(o=>!agDn(o)).length,q0=AG.q,c0=AG.c;AG.q='';AG.c='';const hoyN=pend(agOcc(t,t)),sem=pend(agOcc(t,addD(t,6))),late=pend(agOcc(addD(t,-60),addD(t,-1))),tot=DB.agenda.length;AG.q=q0;AG.c=c0;
 const b=new Date(AG.d+'T12:00'),st=agMonday(AG.d),ttl=AG.v==='mes'?agCap(b.toLocaleDateString('es-PA',{month:'long',year:'numeric'})):AG.v==='sem'?fdate(st).slice(0,5)+' – '+fdate(addD(st,6)).slice(0,5):'Lista de eventos';
 $('v').innerHTML=`<div class="agk"><div><small>Hoy (pendientes)</small><b>${hoyN}</b></div><div><small>Próx. 7 días</small><b>${sem}</b></div><div><small>Vencidas</small><b style="color:${late?'#d92d20':'inherit'}">${late}</b></div><div><small>Total eventos</small><b>${tot}</b></div></div>
 <div class="agbar"><div class="pt">${[['mes','Mes'],['sem','Semana'],['lista','Lista']].map(([k,l])=>`<button class="${k==AG.v?'on':''}" data-h-click="h272" data-a-click="${_ha(k)}">${l}</button>`).join('')}</div>${AG.v!=='lista'?`<button class="btn s" data-h-click="h271" aria-label="Mes anterior">‹</button><b style="min-width:130px;text-align:center">${ttl}</b><button class="btn s" data-h-click="h270" aria-label="Mes siguiente">›</button>`:`<b>${ttl}</b>`}<button class="btn s" data-h-click="h269">Hoy</button><button class="btn p s" data-h-click="h259">➕ Nuevo evento</button></div>
 <div class="agbar"><input id="ag_q" placeholder="🔍 Buscar evento, cliente o nota…" value="${esc(AG.q)}" data-h-input="h268"><select data-h-change="h267" aria-label="Filtrar por tipo de evento"><option value="">Todos los tipos</option>${Object.entries(AGT).map(([k,x])=>`<option value="${k}" ${AG.c==k?'selected':''}>${x[0]} ${x[1]}</option>`).join('')}</select><button class="btn s" data-h-click="h266">${DB.cfg.snd?'🔊 Sonido activado':'🔇 Sonido silenciado'}</button><button class="btn s" data-h-click="h265">📆 Exportar a calendario (.ics)</button></div><div id="agBody"></div>`;agBody()},
check(){if(!TJEmpresa.empEsInicial()){$('v').innerHTML='<div class="card"><h3 style="margin:0 0 6px">✅ Check</h3><div class="vacio">Esta empresa aún no tiene modelos. Cuando suba los suyos en Catálogo, aparecerán aquí.</div></div>';return}
 $('v').innerHTML=`<div class="card" style="padding:0;overflow:hidden;max-width:none;width:100%;margin:0"><iframe id="checkFrame" title="Check: modelos de tarjetas" style="width:100%;height:calc(100vh - 150px);min-height:560px;border:0;display:block;background:transparent"></iframe></div>`;
 const _cf=$('checkFrame');_cf.onload=()=>{try{_cf.contentDocument.documentElement.setAttribute('data-theme',document.documentElement.getAttribute('data-t')==='nocturno'?'dark':'light')}catch(e){window._tjw&&_tjw(e)}try{if(esVend())chkLock(_cf.contentDocument,_cf.contentWindow)}catch(e){window._tjw&&_tjw(e)}};
 appHtml('modelos').then(h=>{_cf.srcdoc=chkSkin(h)}).catch(e=>{window._tjw&&_tjw(e);_cf.srcdoc='<p style="font:15px sans-serif;padding:24px">No se pudo cargar el módulo. Recargue la página (Ctrl+F5).</p>'});checkFitSoon()}};

const AGT={ent:['📦','Entrega','#E0457B'],cita:['🤝','Cita','#0F6CBD'],cobro:['💰','Cobro','#2fa84f'],ped:['🧾','Pedido','#FF9F0A'],rec:['🔔','Recordatorio','#7B4FE0'],otro:['📌','Otro','#6E6E73']};
let AG={v:'mes',d:hoy(),sel:hoy(),q:'',c:''};
const addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ymd(d)};
function agOcc(a,b){const out=[],q=AG.q.toLowerCase();DB.agenda.forEach(e=>{if(AG.c&&e.t!==AG.c)return;if(q&&!((e.ti||'')+' '+(e.cn||'')+' '+(e.nt||'')).toLowerCase().includes(q))return;
 if(!e.r){if(e.f>=a&&e.f<=b)out.push({e,d:e.f});return}
 const st=new Date(e.f+'T12:00');for(let i=0;i<900;i++){let x;if(e.r==='dia')x=addD(e.f,i);else if(e.r==='sem')x=addD(e.f,7*i);else{const m=new Date(st);m.setMonth(st.getMonth()+i);if(m.getDate()!==st.getDate())m.setDate(0);x=ymd(m)}if(x>b)break;if(x>=a)out.push({e,d:x})}});
 return out.sort((p,q)=>(p.d+(p.e.h||'99'))>(q.d+(q.e.h||'99'))?1:-1)}
const agDn=o=>!!(o.e.dn&&o.e.dn[o.d]);
function agItem(o){const e=o.e,t=AGT[e.t]||AGT.otro,dn=agDn(o),late=!dn&&o.d<hoy();
 return `<div class="agi ${dn?'dn':''}" style="border-left:4px solid ${t[2]}"><div class="agh"><b>${t[0]} ${esc(e.ti)}</b>${late?'<span class="bd x">Vencida</span>':''}</div><div class="ags">${fdate(o.d)}${e.h?' · '+esc(e.h)+(e.h2?'–'+esc(e.h2):''):''} · ${t[1]}${e.cn?' · 👤 '+esc(e.cn):''}${e.r?' · 🔁':''}${e.av!==undefined&&e.av!==''?' · 🔔':''}</div>${e.nt?`<div class="ags">${esc(e.nt)}</div>`:''}<div class="aga"><button class="btn s" data-h-click="h264" data-a-click="${_ha(e.id, o.d)}">${dn?'↩ Reabrir':'✔ Hecho'}</button><button class="btn s" data-h-click="h263" data-a-click="${_ha(e.id)}">✏️ Editar</button>${e.tel?`<button class="btn s" data-h-click="h262" data-a-click="${_ha(e.id, o.d)}">📱 WhatsApp</button>`:''}<button class="btn s d" data-h-click="h261" data-a-click="${_ha(e.id)}" aria-label="Eliminar">🗑</button></div></div>`}
const agList=l=>l.length?l.map(agItem).join(''):'<div class="vacio">Sin eventos.</div>';
const agCap=x=>x.charAt(0).toUpperCase()+x.slice(1);const agLbl=d=>agCap(new Date(d+'T12:00').toLocaleDateString('es-PA',{weekday:'long',day:'numeric',month:'long'}).replace(/ de /g,' de '));
function agMonday(d){return addD(d,-((new Date(d+'T12:00').getDay()+6)%7))}
function agBody(){const el=$('agBody');if(!el)return;let h='';
 if(AG.v==='mes'){const b=new Date(AG.d+'T12:00'),f=new Date(b.getFullYear(),b.getMonth(),1,12),st=addD(ymd(f),-((f.getDay()+6)%7)),oc=agOcc(st,addD(st,41)),by={};oc.forEach(o=>(by[o.d]=by[o.d]||[]).push(o));
  h='<div class="card"><div class="agw">'+['L','M','M','J','V','S','D'].map(x=>`<div class="agdw">${x}</div>`).join('');
  for(let i=0;i<42;i++){const d=addD(st,i),l=by[d]||[];h+=`<div class="agc${d.slice(0,7)!==AG.d.slice(0,7)?' o':''}${d==hoy()?' t':''}${d==AG.sel?' s':''}" data-h-click="h260" data-a-click="${_ha(d)}"><span>${+d.slice(8)}</span><div class="agd">${l.slice(0,4).map(o=>`<i style="background:${(AGT[o.e.t]||AGT.otro)[2]}"></i>`).join('')}${l.length>4?'<small>+'+(l.length-4)+'</small>':''}</div></div>`}
  h+=`</div></div><div class="card"><div class="agh"><h3 style="margin:0">${agLbl(AG.sel)}</h3><button class="btn p s" data-h-click="h259">➕ Agregar</button></div>${agList(agOcc(AG.sel,AG.sel))}</div>`}
 else if(AG.v==='sem'){const st=agMonday(AG.d),oc=agOcc(st,addD(st,6));h='<div class="agwk">'+Array.from({length:7},(_,i)=>{const d=addD(st,i);return `<div class="card" style="${d==hoy()?'outline:2px solid var(--az)':''}"><div class="agh"><b>${agLbl(d)}</b><button class="btn s" data-h-click="h258" data-a-click="${_ha(d)}" aria-label="Agregar evento">➕</button></div>${agList(oc.filter(o=>o.d==d))}</div>`}).join('')+'</div>'}
 else{const t=hoy(),late=agOcc(addD(t,-60),addD(t,-1)).filter(o=>!agDn(o)),up=agOcc(t,addD(t,90));let last='';const grp=l=>l.map(o=>{let g='';if(o.d!=last){last=o.d;g=`<div class="agg">${agLbl(o.d)}</div>`}return g+agItem(o)}).join('');
  h=`<div class="card">${late.length?`<h3 style="color:#d92d20;margin:0 0 4px">⚠️ Vencidas (${late.length})</h3>${grp(late)}<hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">`:''}<h3 style="margin:0 0 4px">Próximos 90 días</h3>${up.length?grp((last='',up)):'<div class="vacio">No hay eventos próximos.</div>'}</div>`}
 el.innerHTML=h}
function agSel(d){AG.sel=d;agBody()}
function agView(v){AG.v=v;R.agenda()}
function agMove(n){if(AG.v==='mes'){const b=new Date(AG.d+'T12:00');b.setDate(1);b.setMonth(b.getMonth()+n);AG.d=ymd(b)}else AG.d=addD(AG.d,7*n);R.agenda()}
function agHoy(){AG.d=AG.sel=hoy();R.agenda()}
function agQ(v){AG.q=v;agBody()}function agC(v){AG.c=v;agBody()}
function agDone(id,d){const e=DB.agenda.find(x=>x.id==id);if(!e)return;e.dn=e.dn||{};if(e.dn[d])delete e.dn[d];else e.dn[d]=1;save();if(vista==='agenda')R.agenda();cintillo()}
function agDel(id){const e=DB.agenda.find(x=>x.id==id);if(!e||!confirm('¿Eliminar "'+e.ti+'"'+(e.r?' y todas sus repeticiones':'')+'?'))return;DB.agenda=DB.agenda.filter(x=>x.id!=id);save();R.agenda();cintillo()}
function agWA(id,d){const e=DB.agenda.find(x=>x.id==id);if(!e||!e.tel)return;let t=e.tel.replace(/\D/g,'');if(t.length==8)t='507'+t;window.open('https://wa.me/'+t+'?text='+encodeURIComponent(`Hola${e.cn?' '+e.cn:''}, le recordamos: ${e.ti} el ${fdate(d)}${e.h?' a las '+e.h:''}. — ${DB.cfg.nombre}`),'_blank','noopener,noreferrer')}
function agCli(){const c=DB.cli.find(x=>x.id==$('ag_cs').value);if(c){$('ag_cn').value=c.n;$('ag_tel').value=c.t||''}}
function agForm(id,date){const e=id?DB.agenda.find(x=>x.id==id):{},v=(k,d='')=>esc(e[k]||d);
 $('mb').innerHTML=`<h3 style="margin-top:0">${id?'Editar evento':'Nuevo evento'}</h3><div class="g"><div style="grid-column:1/-1"><label>Título</label><input id="ag_ti" value="${v('ti')}" placeholder="Ej. Entregar 50 tarjetas de boda"></div><div><label>Fecha</label><input id="ag_f" type="date" value="${v('f',date||AG.sel)}"></div><div><label>Hora inicio</label><input id="ag_h" type="time" value="${v('h')}"></div><div><label>Hora fin</label><input id="ag_h2" type="time" value="${v('h2')}"></div><div><label>Tipo</label><select id="ag_t">${Object.entries(AGT).map(([k,t])=>`<option value="${k}" ${(e.t||'ent')==k?'selected':''}>${t[0]} ${t[1]}</option>`).join('')}</select></div><div><label>Repetir</label><select id="ag_r">${[['','No se repite'],['dia','Cada día'],['sem','Cada semana'],['mes','Cada mes']].map(([k,l])=>`<option value="${k}" ${(e.r||'')==k?'selected':''}>${l}</option>`).join('')}</select></div><div><label>🔔 Avisar</label><select id="ag_av">${[['','Sin aviso'],['0','A la hora'],['5','5 min antes'],['10','10 min antes'],['30','30 min antes'],['60','1 hora antes'],['1440','1 día antes']].map(([k,l])=>`<option value="${k}" ${String(e.av===undefined?'10':e.av)==k?'selected':''}>${l}</option>`).join('')}</select></div><div><label>Cliente registrado</label><select id="ag_cs" data-h-change="h257"><option value="">— Ninguno —</option>${DB.cli.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></div><div><label>Nombre del cliente</label><input id="ag_cn" value="${v('cn')}"></div><div><label>Teléfono (WhatsApp)</label><input id="ag_tel" type="tel" value="${v('tel')}"></div><div style="grid-column:1/-1"><label>Notas</label><input id="ag_nt" value="${v('nt')}"></div></div><div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button class="btn p" data-h-click="h256" data-a-click="${_ha(id||'')}">💾 Guardar</button><button class="btn" data-h-click="h12">Cancelar</button></div>`;$('md').classList.add('on');setTimeout(()=>{const x=$('ag_ti');if(x)x.focus()},50)}
function agSave(id){const ti=$('ag_ti').value.trim(),f=$('ag_f').value;if(!ti||!f)return alert('Escriba un título y elija la fecha.');const o={ti,f,h:$('ag_h').value,h2:$('ag_h2').value,t:$('ag_t').value,r:$('ag_r').value,av:$('ag_av').value,cn:$('ag_cn').value.trim(),tel:$('ag_tel').value.trim(),nt:$('ag_nt').value.trim()};
 if(id){Object.assign(DB.agenda.find(x=>x.id==id),o)}else DB.agenda.push(Object.assign({id:uid(),dn:{}},o));AG.sel=f;AG.d=f;save();cerrar();R.agenda();cintillo()}
function agIcs(){if(!DB.agenda.length)return alert('La agenda está vacía.');const z=n=>String(n).padStart(2,'0'),dd=d=>d.replace(/-/g,''),tt=h=>h.replace(':','')+'00';
 const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Tarjeteria Jhon//Agenda//ES'];DB.agenda.forEach(e=>{L.push('BEGIN:VEVENT','UID:'+e.id+'@tarjeteriajhon','DTSTAMP:'+dd(hoy())+'T000000Z');
 if(e.h){L.push('DTSTART:'+dd(e.f)+'T'+tt(e.h));const f=e.h2||(z((+e.h.slice(0,2)+1)%24)+':'+e.h.slice(3));L.push('DTEND:'+dd(e.f)+'T'+tt(f))}else L.push('DTSTART;VALUE=DATE:'+dd(e.f));
 L.push('SUMMARY:'+(AGT[e.t]||AGT.otro)[1]+': '+e.ti.replace(/[,;\n]/g,' '));if(e.nt||e.cn)L.push('DESCRIPTION:'+((e.cn?'Cliente: '+e.cn+'. ':'')+(e.nt||'')).replace(/[,;\n]/g,' '));
 if(e.r)L.push('RRULE:FREQ='+{dia:'DAILY',sem:'WEEKLY',mes:'MONTHLY'}[e.r]);L.push('END:VEVENT')});L.push('END:VCALENDAR');
 const a=document.createElement('a');a.href='data:text/calendar;charset=utf-8,'+encodeURIComponent(L.join('\r\n'));a.download='agenda_tarjeteria_jhon.ics';a.click()}

let _cintSig='',_chk=null;
function cintGo(k,a,b){if(k=='ag'){AG.sel=b;AG.d=b;ir('agenda')}else ir(k)}
/* Fase 17: antes leía IMGS/DATA de apps/modelos.html; desde SEG-04 etapa 3B viven en apps/modelos.js (1,6 MB) y esa lectura fallaba en silencio
   (aviso «Unexpected token 'm'»). Ahora usa apps/modelos-cintillo.json (95 KB: los 30 primeros modelos con miniatura de 88 px, generado por
   tests/herramientas/generar-cintillo.py) y solo se pide si la barra de Inicio no tiene agenda ni catálogo propio que mostrar. */
async function cintChk(){if(_chk)return _chk;let a;try{const r=await fetch('apps/modelos-cintillo.json',{cache:'no-cache'});if(!r.ok)throw new Error('apps/modelos-cintillo '+r.status);a=await r.json()}catch(e){window._tjw&&_tjw(e);return []}
 if(_chk)return _chk;_chk=Array.isArray(a)?a.filter(f=>f&&f.n&&/^data:image\/jpeg;base64,/.test(f.i)).map(f=>({n:String(f.n),s:String(f.s||''),i:f.i})):[];return _chk}
const cintCfg=()=>({on:DB.cfg.cintOn!==0,seg:Math.min(20,Math.max(2,+DB.cfg.cintSeg||5)),cr:DB.cfg.cintCr!==0,ot:DB.cfg.cintOt!==0,ve:DB.cfg.cintVe!==0,ho:DB.cfg.cintHo!==0,pr:DB.cfg.cintPr!==0,dias:+DB.cfg.cintDias||14,mod:DB.cfg.cintMod!==0});
let _cintPause=0,_cintHover=0,_cintTm=null;
const _cintRM=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
function cintItem(o,t){const e=o.e,x=AGT[e.t]||AGT.otro,late=o.d<t,fd=x=>fdate(x).replace(/[\/\-.]\d{4}$/,''),w=late?'Vencida · '+fd(o.d):o.d==t?'Hoy':o.d==addD(t,1)?'Mañana':fd(o.d),ti=(e.t==='cobro'&&String(e.ti).includes(' — '))?String(e.ti).split(' — ')[0]:e.ti;
 return `<div class="ci ${late?'late':o.d==t?'hoy':''}" style="--c:${x[2]}" data-h-click="h255" data-a-click="${_ha(e.id, o.d)}"><i class="ico">${x[0]}</i><span class="tt"><strong>${esc(ti)}</strong><small><em class="chip">${w}${e.h?' · '+esc(e.h):''}</em>${e.cn?esc(e.cn):''}</small></span><u>›</u></div>`}
async function cintillo(){const bar=$('cint');if(!bar)return;const k=cintCfg();
 if(!k.on){bar.hidden=true;_cintSig='';return}
 const t=hoy(),q0=AG.q,c0=AG.c;AG.q='';AG.c='';
 let ag=agOcc(addD(t,-30),addD(t,k.dias)).filter(o=>!agDn(o));AG.q=q0;AG.c=c0;
 ag=ag.filter(o=>{if(o.e.t==='cobro'?!k.cr:!k.ot)return false;return o.d<t?k.ve:o.d==t?k.ho:k.pr});
 ag.sort((a,b)=>(a.d+(a.e.h||'')).localeCompare(b.d+(b.e.h||'')));
 let tag,items,sig;
 if(ag.length){tag='📅 Agenda';items=ag.map(o=>cintItem(o,t));sig='A'+ag.map(o=>o.e.id+o.d+o.e.ti+(o.e.h||'')+(o.e.cn||'')).join()}
 else if(k.mod){let cat=[];try{cat=(await tx('readonly',s=>s.getAll())).filter(f=>f.thumb)}catch(e){cat=(typeof CL!=='undefined'?CL:[]).filter(f=>f.thumb)}
  cat.sort((a,b)=>(b.date||'').localeCompare(a.date||''));tag='🎴 Modelos';
  if(cat.length){cat=cat.slice(0,30);items=cat.map(f=>`<div class="ci" data-h-click="h254"><img src="${f.thumb}" alt=""><span class="tt"><strong>${esc(f.name||'Modelo')}</strong><small>${esc(f.cat||'Catálogo')}</small></span><u>›</u></div>`);sig='C'+cat.map(f=>f.id).join()}
  else{const m=TJEmpresa.empEsInicial()?(await cintChk()).slice(0,30):[];if(m.length){items=m.map(f=>`<div class="ci" data-h-click="h253"><img src="${f.i}" alt=""><span class="tt"><strong>${esc(f.n)}</strong><small>${esc(f.s)}</small></span><u>›</u></div>`);sig='M'+m.length}
  else{{const pm=panelMarcaTextos();items=['<div class="ci" style="--c:#FF9F0A"><i class="ico">🎴</i><span class="tt"><strong>'+esc(pm.nombre)+'</strong>'+(pm.lema?'<small>'+esc(pm.lema)+'</small>':'')+'</span></div>'];sig='X'+pm.nombre+pm.lema}}}}
 else{bar.hidden=true;_cintSig='';return}
 sig+='|'+k.seg;if(sig===_cintSig&&!bar.hidden)return;_cintSig=sig;
 $('cintTr').innerHTML=items.join('');$('cintTag').textContent=tag;$('cintVw').scrollLeft=0;bar.hidden=false;cintDots(items.length);cintArranca()}
const cintStep=()=>{const a=document.querySelector('#cintTr .ci');return a?a.offsetWidth+10:0};
const cintFin=()=>{const v=$('cintVw');return v.scrollWidth>v.clientWidth+4&&v.scrollLeft+v.clientWidth>=v.scrollWidth-4};
function cintIdx(){const v=$('cintVw'),n=$('cintTr').children.length,s=cintStep();return !s?0:cintFin()?n-1:Math.min(n-1,Math.round(v.scrollLeft/s))}
function cintGoTo(i){const v=$('cintVw'),s=cintStep(),n=$('cintTr').children.length;if(!s||!n)return;i=((i%n)+n)%n;v.scrollTo({left:i*s,behavior:_cintRM()?'auto':'smooth'})}
function cintDots(n){$('cintDots').innerHTML=n>1&&n<=8?Array.from({length:n},(_,i)=>`<i data-h-click="h252" data-a-click="${_ha(i)}"></i>`).join(''):'';cintDot()}
function cintDot(){const n=$('cintTr').children.length;if(!n)return;const i=cintIdx();[...$('cintDots').children].forEach((x,j)=>x.classList.toggle('on',j===i));$('cintCnt').textContent=n>1?(i+1)+' / '+n:''}
function cintTick(){clearTimeout(_cintTm);_cintTm=setTimeout(cintTick,cintCfg().seg*1000);
 const bar=$('cint');if(!bar||bar.hidden||document.hidden||_cintHover||Date.now()<_cintPause||_cintRM())return;
 if($('cintTr').children.length<2)return;cintGoTo(cintFin()?0:cintIdx()+1)}
function cintArranca(){if(!window._cintL){window._cintL=1;const v=$('cintVw'),b=$('cint');v.addEventListener('scroll',cintDot,{passive:true});['pointerdown','wheel','touchstart'].forEach(ev=>v.addEventListener(ev,()=>{_cintPause=Date.now()+10000},{passive:true}));b.addEventListener('mouseenter',()=>{_cintHover=1});b.addEventListener('mouseleave',()=>{_cintHover=0})}
 clearTimeout(_cintTm);_cintTm=setTimeout(cintTick,cintCfg().seg*1000)}
function cintSet(k,v){DB.cfg[k]=v;save();_cintSig='';cintillo()}
function cintCard(){const k=cintCfg(),ck=(key,lab,on)=>`<label class="pchk"><input type="checkbox" ${on?'checked':''} data-h-change="h251" data-a-change="${_ha(key)}"> ${lab}</label>`;
 return `<h3 style="margin:0 0 4px">🎠 Cinta de avisos</h3><p style="font-size:12.5px;color:var(--gris)">Las tarjetas de arriba muestran sus cobros a crédito, vencimientos y eventos. Aquí elige cada cuánto cambia de aviso y qué muestra.</p><div class="g"><div><label>Cinta de avisos</label><select data-h-change="h250"><option value="1" ${k.on?'selected':''}>Activada</option><option value="0" ${k.on?'':'selected'}>Desactivada</option></select></div><div><label>Cambiar de aviso cada <b id="cs_v">${k.seg}</b> seg</label><input type="range" min="2" max="20" step="1" value="${k.seg}" data-h-input="h249" data-h-change="h248"></div><div><label>Mostrar próximos</label><select data-h-change="h247">${[7,14,30].map(d=>`<option value="${d}" ${k.dias===d?'selected':''}>${d} días</option>`).join('')}</select></div></div><label style="display:block;margin-top:12px">Qué mostrar</label><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:6px">${ck('cintCr','💰 Cobros a crédito',k.cr)}${ck('cintOt','📅 Otros eventos',k.ot)}${ck('cintVe','🔴 Vencidas',k.ve)}${ck('cintHo','🟢 Hoy',k.ho)}${ck('cintPr','🔜 Próximos días',k.pr)}${ck('cintMod','🎴 Modelos si no hay avisos',k.mod)}</div><p style="font-size:12px;color:var(--gris);margin:10px 0 0">Se detiene mientras la toca o pasa el mouse por encima. Deslice con el dedo para ver el siguiente aviso.</p>`}
setInterval(()=>{cintillo()},30000);

let _ac=null,AGN={},AGSN={};try{AGN=JSON.parse(localStorage.getItem(lsk('tj_ag_n'))||'{}');Object.keys(AGN).forEach(k=>{if(Date.now()-AGN[k]>2.5*864e5)delete AGN[k]})}catch(e){window._tjw&&_tjw(e)}
const agNSave=()=>{try{localStorage.setItem(lsk('tj_ag_n'),JSON.stringify(AGN))}catch(e){window._tjw&&_tjw(e)}};
function agAc(){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();if(_ac.state==='suspended')_ac.resume()}catch(e){window._tjw&&_tjw(e)}return _ac}
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,agAc,{passive:true}));
setInterval(agCheck,15000);setTimeout(agCheck,2500);

const REPP=[['hoy','Hoy'],['sem','Esta semana'],['mes','Este mes'],['anio','Este año'],['todo','Todo el historial']];
function repData(per){const t=hoy(),w=agMonday(t),ini={hoy:t,sem:w,mes:t.slice(0,7)+'-01',anio:t.slice(0,4)+'-01-01',todo:'0000-00-00'}[per]||t.slice(0,7)+'-01',inR=f=>f.fecha>=ini&&f.fecha<=t,a=act(),l=a.filter(inR).sort((x,y)=>(y.fecha+y.n)>(x.fecha+x.n)?1:-1),sum=q=>q.reduce((s,f)=>s+f.total,0),P={},C={},M={};
 l.forEach(f=>{(f.items||[]).forEach(i=>{const o=P[i.d]=P[i.d]||{n:i.d,q:0,v:0};o.q+=i.q;o.v+=i.q*i.p});const c=C[f.cli]=C[f.cli]||{n:f.cli,k:0,v:0};c.k++;c.v+=f.total;(f.pagos&&f.pagos.length>1?f.pagos:[{m:f.pago||'—',v:f.total}]).forEach(x=>{const m=M[x.m]=M[x.m]||{n:x.m,k:0,v:0};m.k++;m.v+=x.v})});
 const top=o=>Object.values(o).sort((x,y)=>y.v-x.v).slice(0,5),mensual=per==='anio'||per==='todo';let ser;
 if(mensual)ser=[...Array(12)].map((_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(11-i));const k=ymd(d).slice(0,7);return{e:k.slice(5)+'/'+k.slice(2,4),v:sum(a.filter(f=>f.fecha.startsWith(k)))}});
 else ser=[...Array(14)].map((_,i)=>{const d=addD(t,-(13-i));return{e:d.slice(8)+'/'+d.slice(5,7),v:sum(a.filter(f=>f.fecha==d))}});
 return{ini,t,l,tot:sum(l),n:l.length,avg:l.length?sum(l)/l.length:0,prod:top(P),cli:top(C),pago:top(M),ser,mensual,anul:DB.fac.filter(f=>f.anulada&&inR(f)).length,hoyV:sum(a.filter(f=>f.fecha==t)),mesV:sum(a.filter(f=>f.fecha.startsWith(t.slice(0,7))))}}
function repHTML(per){const d=repData(per),c=DB.cfg,logo=(document.querySelector('.logo img')||{}).src||'',lb=(REPP.find(x=>x[0]==per)||REPP[2])[1],AC='#E0457B';
 const pg=(n,b)=>`<div class="rp" style="width:816px;height:1056px;box-sizing:border-box;padding:46px 48px;background:#fff;color:#1D1D1F;font-family:-apple-system,'Segoe UI',Arial,sans-serif;position:relative;overflow:hidden"><div style="height:8px;background:linear-gradient(90deg,${AC},#FF9F0A);position:absolute;left:0;right:0;top:0"></div>${b}<div style="position:absolute;left:48px;right:48px;bottom:30px;display:flex;justify-content:space-between;font-size:11px;color:#6E6E73;border-top:1px solid #E4E4E9;padding-top:10px"><span>${esc(c.nombre)} · ${esc(c.tel)} · ${esc(c.email)}</span><span>Documento interno, sin validez fiscal · Pág. ${n}/2</span></div></div>`;
 const kp=(l,v,b)=>`<div style="flex:1;background:#F5F5F7;border-radius:14px;padding:14px 16px;${b?'border-left:5px solid '+AC:''}"><div style="font-size:11px;color:#6E6E73;font-weight:600">${l}</div><div style="font-size:${String(v).length>12?'15':'24'}px;font-weight:800;margin-top:4px">${v}</div></div>`;
 const mx=Math.max(1,...d.ser.map(x=>x.v)),chart=`<div style="display:flex;align-items:flex-end;gap:6px;height:150px;border-bottom:1px solid #E4E4E9;padding:0 4px">${d.ser.map(x=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%"><div style="font-size:8px;color:#6E6E73;margin-bottom:2px">${x.v?Math.round(x.v):''}</div><div style="width:100%;height:${Math.max(x.v?3:1,x.v/mx*112)}px;background:${x.v?AC:'#E4E4E9'};border-radius:4px 4px 0 0"></div></div>`).join('')}</div><div style="display:flex;gap:6px;padding:4px 4px 0">${d.ser.map(x=>`<div style="flex:1;text-align:center;font-size:8.5px;color:#6E6E73">${x.e}</div>`).join('')}</div>`;
 const rank=(t,arr,k,cl)=>{const m=Math.max(1,...arr.map(x=>x.v));return `<div style="flex:1"><div style="font-weight:800;font-size:13px;margin-bottom:8px">${t}</div>${arr.length?arr.map(x=>`<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:11.5px;gap:8px"><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:200px">${esc(x.n)}</span><b>${$$(x.v)}</b></div><div style="height:7px;background:#F0F0F3;border-radius:6px;margin-top:3px"><div style="height:7px;width:${x.v/m*100}%;background:${cl};border-radius:6px"></div></div><div style="font-size:10px;color:#6E6E73">${k(x)}</div></div>`).join(''):'<div style="font-size:12px;color:#6E6E73">Sin datos en el período.</div>'}</div>`};
 const p1=pg(1,`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px"><div style="display:flex;align-items:center;gap:14px">${logo?`<img alt="" src="${logo}" style="height:64px;max-width:120px;object-fit:contain">`:''}<div><div style="font-size:22px;font-weight:800">${esc(c.nombre)}</div><div style="font-size:12px;color:#6E6E73">Reporte de ventas</div></div></div><div style="text-align:right"><div style="background:${AC};color:#fff;border-radius:980px;padding:5px 14px;font-weight:700;font-size:12px;display:inline-block">${lb}</div><div style="font-size:11px;color:#6E6E73;margin-top:6px">${d.ini==='0000-00-00'?'Desde el inicio':fdate(d.ini)} al ${fdate(d.t)}<br>Generado: ${fdate(d.t)} ${new Date().toLocaleTimeString('es-PA',{hour:'2-digit',minute:'2-digit'})}</div></div></div>
  <div style="display:flex;gap:12px;margin-bottom:12px">${kp('Ventas del período',$$(d.tot),1)}${kp('Facturas emitidas',d.n)}${kp('Ticket promedio',$$(d.avg))}${kp('Más vendido',d.prod.length?esc(d.prod.slice().sort((a,b)=>b.q-a.q)[0].n):'—')}</div>
  <div style="display:flex;gap:12px;margin-bottom:22px">${kp('Ventas de hoy',$$(d.hoyV))}${kp('Ventas del mes',$$(d.mesV))}${kp('Facturas anuladas',d.anul)}</div>
  <div style="font-weight:800;font-size:13px;margin-bottom:8px">${d.mensual?'Ventas por mes (últimos 12 meses)':'Ventas por día (últimos 14 días)'} · $</div>${chart}
  <div style="display:flex;gap:30px;margin-top:26px">${rank('🎴 Productos más vendidos',d.prod,x=>x.q+' unid.',AC)}${rank('👥 Mejores clientes',d.cli,x=>x.k+' factura(s)','#FF9F0A')}</div>`);
 const rows=d.l.slice(0,17),p2=pg(2,`<div style="font-size:18px;font-weight:800;margin-bottom:4px">Detalle de facturas</div><div style="font-size:12px;color:#6E6E73;margin-bottom:14px">${lb} · ${d.n} factura(s)${d.l.length>17?' · se muestran las 17 más recientes':''}</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px"><tr style="background:#F5F5F7;text-align:left"><th style="padding:8px">N.º</th><th style="padding:8px">Fecha</th><th style="padding:8px">Cliente</th><th style="padding:8px">Pago</th><th style="padding:8px;text-align:right">Total</th></tr>${rows.length?rows.map(f=>`<tr style="border-bottom:1px solid #E4E4E9"><td style="padding:7px 8px">F-${esc(f.n)}</td><td style="padding:7px 8px">${fdate(f.fecha)}</td><td style="padding:7px 8px">${esc(f.cli)}</td><td style="padding:7px 8px">${esc(f.pago||'—')}</td><td style="padding:7px 8px;text-align:right;font-weight:700">${$$(f.total)}</td></tr>`).join(''):'<tr><td colspan="5" style="padding:20px;text-align:center;color:#6E6E73">Sin facturas en el período.</td></tr>'}<tr style="background:${AC}12"><td colspan="4" style="padding:9px 8px;font-weight:800;text-align:right">TOTAL DEL PERÍODO</td><td style="padding:9px 8px;text-align:right;font-weight:800;color:${AC}">${$$(d.tot)}</td></tr></table>
  <div style="margin-top:24px;font-weight:800;font-size:13px;margin-bottom:8px">💳 Ventas por método de pago</div><div style="display:flex;gap:12px;flex-wrap:wrap">${d.pago.length?d.pago.map(m=>`<div style="background:#F5F5F7;border-radius:12px;padding:10px 16px;min-width:130px"><div style="font-size:11px;color:#6E6E73">${esc(m.n)} · ${m.k} fact.</div><div style="font-weight:800;font-size:16px">${$$(m.v)}</div></div>`).join(''):'<span style="font-size:12px;color:#6E6E73">Sin datos.</span>'}</div>`);
 return p1+p2}
async function buildRepBlob(per){const x=document.createElement('div');x.style.cssText='position:fixed;left:-10000px;top:0;background:#fff';x.innerHTML=repHTML(per);document.body.appendChild(x);
 try{await Promise.all([...x.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));const doc=new jspdf.jsPDF({unit:'in',format:'letter',orientation:'portrait'}),pgs=x.querySelectorAll('.rp');
 for(let i=0;i<pgs.length;i++){const cv=await html2canvas(pgs[i],{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false});if(i)doc.addPage();doc.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,8.5,11)}
 return{blob:doc.output('blob'),name:'Reporte_ventas_'+hoy()+'.pdf'}}finally{x.remove()}}
const repPer=()=>($('r_per')||{}).value||'mes',repLibs=()=>window.html2canvas&&window.jspdf;
async function repPDF(btn){if(!repLibs())return alert('Para generar el PDF se necesita conexión a internet la primera vez (usa las librerías html2canvas y jsPDF). Conéctese e intente de nuevo.');const t=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='Generando PDF…'}
 try{const r=await buildRepBlob(repPer());dlBlob(r.blob,r.name)}catch(e){alert('No se pudo generar el PDF: '+((e&&e.message)||e))}if(btn){btn.disabled=false;btn.textContent=t}}
function repWA(btn){shareWA(()=>buildRepBlob(repPer()),$('m_body').value,'Reporte de ventas',btn)}
async function repMail(btn){const cks=[...document.querySelectorAll('.mchk:checked')].map(c=>c.value),extra=$('m_extra').value.split(',').map(x=>x.trim()).filter(x=>/^\S+@\S+\.\S+$/.test(x)),to=[...new Set([...cks,...extra])],sub=$('m_sub').value,body=$('m_body').value;
 if(!to.length)return alert('Seleccione o escriba al menos un correo válido.');if(!repLibs())return alert('Para adjuntar el PDF se necesita conexión a internet la primera vez. Conéctese e intente de nuevo, o use "Solo texto".');
 const t=btn.textContent;btn.disabled=true;btn.textContent='Preparando PDF…';
 try{const r=await buildRepBlob(repPer()),file=new File([r.blob],r.name,{type:'application/pdf'}),mt=`mailto:${to.join(',')}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
  if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:sub,text:body+'\n\nPara: '+to.join(', ')})}
  else{dlBlob(r.blob,r.name);alert('Se descargó el PDF ('+r.name+'). Se abrirá su correo con los destinatarios: adjunte ese PDF y presione Enviar.');location.href=mt}}
 catch(e){if(e&&e.name!=='AbortError')alert('No se pudo preparar el correo: '+((e&&e.message)||e))}btn.disabled=false;btn.textContent=t}
function repModal(asunto,cuerpo){const chks=DB.cfg.dests.map(d=>`<label class="chk"><input type="checkbox" class="mchk" value="${esc(d.m)}" checked><span><b>${esc(d.n)}</b> — ${esc(d.m)}</span></label>`).join('')||'<div class="vacio">No hay correos predeterminados. Agréguelos en Configuración, o escriba uno abajo.</div>';
 $('mb').innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:12px"><b>📊 Enviar reporte de ventas</b><button class="btn s" data-h-click="h12" aria-label="Cerrar">✕</button></div>
 <div class="g" style="margin-bottom:12px"><div><label>📄 Período del reporte en PDF</label><select id="r_per">${REPP.map(([k,l])=>`<option value="${k}" ${k=='mes'?'selected':''}>${l}</option>`).join('')}</select></div></div>
 <div class="card" style="box-shadow:none;padding:0;margin:0 0 14px"><label>Destinatarios predeterminados</label>${chks}</div>
 <div class="g" style="margin-bottom:10px"><div><label>Correos adicionales (separados por coma)</label><input id="m_extra" placeholder="otro@correo.com, otro2@correo.com"></div></div>
 <div style="margin-bottom:10px"><label>Asunto</label><input id="m_sub" value="${esc(asunto)}"></div>
 <div style="margin-bottom:6px"><label>Mensaje</label><textarea id="m_body" rows="8">${esc(cuerpo)}</textarea></div>
 <div class="nota">El PDF trae el reporte completo (resumen, gráfico, productos, clientes y detalle de facturas). En el celular, "Correo con PDF" y "WhatsApp" abren el menú de compartir con el PDF ya adjunto; en computadora se descarga el PDF y se abre su correo o WhatsApp para que lo adjunte.</div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button class="btn s" data-h-click="h246">⬇ Descargar PDF</button><button class="btn" data-h-click="h245">📱 WhatsApp con PDF</button><button class="btn s" data-h-click="h222">✉ Solo texto</button><button class="btn p" data-h-click="h244">📎 Correo con PDF</button></div>`;$('md').classList.add('on')}
function tabFac(l,acc){if(!l.length)return'<div class="vacio">Todav\u00EDa no hay facturas.</div>';
  const admin = esAdmin();
  return`<div class="tw"><table><tr><th>N.\u00BA</th><th>Fecha</th><th>Cliente</th>${admin?'<th>Vendedor</th>':''}<th>Pago</th><th class="r">Total</th><th></th></tr>${l.map(f=>`<tr><td>${esc(f.n)}</td><td>${esc(fdate(f.fecha))}</td><td>${esc(f.cli)}</td>${admin?`<td>${esc(f.vn||vdName(f.vend||'admin'))}</td>`:''}<td>${esc(f.pago)}${f.credito?`<br><small style="color:var(--gris)">Vence ${esc(fdate(f.credito.vence))}</small>`:''}</td><td class="r">${$$(f.total)} ${f.anulada?'<span class="bd x">Anulada</span>':''}</td><td class="r">
    <button class="btn s" data-h-click="h243" data-a-click="${_ha(f.id)}" title="Ver y cambiar plantilla">\uD83D\uDC41\uFE0F Ver</button>
    <button class="btn s" data-h-click="h130" data-a-click="${_ha(f.id)}" title="Imprimir">\uD83D\uDDA8\uFE0F</button>
    <button class="btn s" data-h-click="h242" data-a-click="${_ha(f.id)}" title="Descargar PDF">\uD83D\uDCC4 PDF</button>
    <button class="btn s" data-h-click="h241" data-a-click="${_ha(f.id)}" title="Enviar por WhatsApp">\uD83D\uDCAC WA</button>
    <button class="btn s" data-h-click="h240" data-a-click="${_ha(f.id)}" title="Compartir al Chat Interno">\uD83D\uDCE8 Chat</button>
    ${admin ? `<button class="btn s" data-h-click="h239" data-a-click="${_ha(f.id)}" title="Enviar por Correo">\u2709\uFE0F</button>` : ''}
    ${admin && !f.anulada ? ` <button class="btn s d" data-h-click="h238" data-a-click="${_ha(f.id)}" title="Anular Factura">Anular</button>` : ''}
    ${admin && f.anulada ? ` <button class="btn s d" data-h-click="h237" data-a-click="${_ha(f.id)}" title="Eliminar">\uD83D\uDDD1\uFE0F</button>` : ''}
  </td></tr>`).join('')}</table></div>`}
function filas(){$('fi').innerHTML=items.map((it,i)=>`<tr><td><select aria-label="Producto, línea ${i+1}" data-h-change="h236" data-a-change="${_ha(i)}"><option value="">— Libre —</option>${window._opts}</select></td><td><input aria-label="Descripción, línea ${i+1}" value="${esc(it.d||'')}" data-h-input="h235" data-a-input="${_ha(i)}"></td><td><input type="number" aria-label="Cantidad, línea ${i+1}" min="1" value="${it.q||1}" style="width:70px" data-h-input="h234" data-a-input="${_ha(i)}"></td><td><input type="number" aria-label="Precio unitario, línea ${i+1}" step="0.01" min="0" value="${it.p||0}" style="width:90px" data-h-input="h233" data-a-input="${_ha(i)}"></td><td class="r" id="s${i}"></td><td><button class="btn s d" data-h-click="h232" data-a-click="${_ha(i)}" aria-label="Quitar">✕</button></td></tr>`).join('');
 items.forEach((it,i)=>{const sel=$('fi').rows[i].querySelector('select');sel.value=it.pid||''});calc()}
function selP(i,id){const p=DB.prod.find(x=>x.id==id);items[i].pid=id;if(p){items[i].d=p.n;items[i].p=p.p}filas()}
function selCli(){const c=DB.cli.find(x=>x.id==$('f_cs').value);$('f_cn').value=c?c.n:'';$('f_cr').value=c?c.r:'';$('f_cd').value=c?(c.d||''):''}
function totales(){return TJFacturacion.calcularTotales(items,$('f_ds')?.value,DB.cfg.itbms,$('f_it')?.checked)}
function calc(){items.forEach((it,i)=>{const e=$('s'+i);if(e)e.textContent=$$((it.q||1)*(it.p||0))});const t=totales();$('t1').textContent=$$(t.sub);$('t2').textContent=$$(t.it);$('t3').textContent=$$(t.tot);pgSum()}
function emitir(){const l=items.filter(i=>i.d&&(i.p>0)).map(i=>({d:i.d,q:i.q||1,p:i.p}));if(!l.length)return alert('Agregue al menos un artículo con descripción y precio.');
 const t=totales(),pg=pgDatos(t.tot);if(!pg)return;const f={id:uid(),n:DB.cfg.sig++,fecha:$('f_fecha').value||hoy(),cli:$('f_cn').value||'Consumidor final',ruc:$('f_cr').value,dir:$('f_cd').value,pago:pg.pago,pagos:pg.pagos,credito:pg.credito,nota:($('f_nt').value||'').trim(),items:l,sub:t.sub,ds:t.ds,itbms:t.it,itbmsp:DB.cfg.itbms,total:t.tot};
 DB.fac.push(f);save();items=[];imprimir(f.id);ir('fac')}
const PGM=['Efectivo','Yappy','Tarjeta','Transferencia','Crédito'];
let mix=[],crN=30,crU='dias';
function addDias(f,n,u){return TJFacturacion.sumarPlazo(f,n,u)||f}
function crPlazo(c){return c.n+' '+({dias:'día(s)',semanas:'semana(s)',meses:'mes(es)'}[c.u]||c.u)}
function credMonto(){const p=$('f_pg')?.value;return p==='Crédito'?totales().tot:p==='Pago mixto'?mix.filter(r=>r.m==='Crédito').reduce((a,r)=>a+(+r.v||0),0):0}
function pgUI(){const b=$('pgBox');if(!b)return;const p=$('f_pg').value;let h='';
 if(p==='Pago mixto')h+=`<h3 style="margin-top:16px">Pago mixto</h3>${mix.map((r,i)=>`<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin-bottom:8px"><div><label>Método</label><select data-h-change="h231" data-a-change="${_ha(i)}">${PGM.map(x=>`<option${x==r.m?' selected':''}>${x}</option>`).join('')}</select></div><div><label>Monto ($)</label><input type="number" step="0.01" min="0" value="${r.v}" data-h-input="h230" data-a-input="${_ha(i)}"></div><button class="btn s d" data-h-click="h229" data-a-click="${_ha(i)}" aria-label="Quitar">✕</button></div>`).join('')}<button class="btn s" data-h-click="h228">+ Agregar método</button> <button class="btn s" data-h-click="h227">Asignar lo que falta</button><div id="pgSum" style="margin-top:10px;font-size:13px"></div>`;
 if(p==='Crédito'||(p==='Pago mixto'&&mix.some(r=>r.m==='Crédito')))h+=`<h3 style="margin-top:16px">Plazo del crédito</h3><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px"><div><label>Plazo</label><input id="cr_n" type="number" min="1" step="1" value="${crN}" data-h-input="h226"></div><div><label>Unidad</label><select data-h-change="h225">${[['dias','Días'],['semanas','Semanas'],['meses','Meses']].map(([k,l])=>`<option value="${k}"${k==crU?' selected':''}>${l}</option>`).join('')}</select></div><div><label>Vence</label><div id="cr_v" style="padding:10px 0;font-weight:700"></div></div></div><div id="cr_m" style="margin-top:6px;font-size:13px;color:var(--gris)"></div>`;
 b.innerHTML=h;pgSum()}
function pgSum(){const e=$('pgSum');if(e){const t=totales().tot,s=mix.reduce((a,r)=>a+(+r.v||0),0),d=Math.round((t-s)*100)/100;e.innerHTML=d===0?'<b style="color:#2fa84f">✔ Pagos completos</b>':`Asignado ${$$(s)} de ${$$(t)} · <b style="color:${d>0?'#d92d20':'#FF9F0A'}">${d>0?'Falta '+$$(d):'Se pasa por '+$$(-d)}</b>`}pgVence()}
function pgVence(){const v=$('cr_v'),m=$('cr_m');if(v)v.textContent=crN>0?fdate(addDias($('f_fecha')?.value||hoy(),crN,crU)):'—';if(m)m.textContent='Monto a crédito: '+$$(credMonto())}
function pgResto(){if(!mix.length)return;const i=mix.findIndex(r=>!(+r.v)),k=i<0?mix.length-1:i,o=mix.reduce((a,r,j)=>a+(j==k?0:(+r.v||0)),0);mix[k].v=Math.max(0,Math.round((totales().tot-o)*100)/100);pgUI()}
function pgDatos(tot){const r=TJFacturacion.prepararPago({pago:$('f_pg').value,total:tot,pagosMixtos:mix,fecha:$('f_fecha').value||hoy(),plazo:crN,unidad:crU});if(!r.ok){alert(r.error);return 0}return r}
function facL(f){const L=[],m=f.pagos&&f.pagos.length>1;if(m||f.credito)L.push(['Forma de pago:',m?f.pagos.map(p=>esc(p.m)+' '+$$(p.v)).join(' + '):esc(f.pago)]);if(f.credito)L.push(['Crédito:',esc($$(f.credito.monto)+' a '+crPlazo(f.credito)+' · vence '+fdate(f.credito.vence))]);if(f.nota)L.push(['Notas:',esc(f.nota)]);return L}
function facTxt(f){return facL(f).map(([a,b])=>a+' '+b.replace(/\s*\n\s*/g,' ')).join('\n')}
function facExtra(f){const L=facL(f);return L.length?'<div class="fx">'+L.map(([a,b])=>'<div><b>'+a+'</b> '+b.replace(/\n/g,'<br>')+'</div>').join('')+'</div>':''}
const LOGO_T="assets/logo-t.png";
function facApple(f){
 const c=DB.cfg,cr=f.credito,pc=(f.itbmsp??c.itbms),L=facL(f);
 const venc=cr&&cr.vence?fdate(cr.vence):fdate(f.fecha);
 const notas=L.length?L.map(([a,b])=>`<li><b>${a}</b> ${b.replace(/\n/g,'<br>')}</li>`).join(''):'<li>Gracias por su compra.</li>';
 const row=(a,b)=>b?`<div class="ar"><span>${a}</span><b>${b}</b></div>`:'';
 return `<div class="fa tpl-apple">${facSello(f)}
 <div class="ap-top"><div class="ap-brand"><img src="${c.logoFac||LOGO_T}" alt=""><i></i><div><h2>${esc(c.nombre)}</h2><small>${esc((c.loginDesc||'TARJETAS PARA TODA OCASIÓN')).toUpperCase()}</small></div></div>
  <div class="ap-contact">${c.dir?`<div><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#6b7280" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${esc(c.dir)}</span></div>`:''}${c.tel?`<div><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#6b7280" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><span>${esc(c.tel)}</span></div>`:''}${c.email?`<div><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#6b7280" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><span>${esc(c.email)}</span></div>`:''}</div></div>
 <div class="ap-mid"><div><h1>Factura</h1><p>Gracias por tu confianza</p>${f.anulada?'<div class="ap-anu">ANULADA</div>':''}</div>
  <div class="ap-meta"><div><span>N.º de Factura</span><b>${esc(f.n)}</b></div><div><span>Fecha de Emisión</span><b>${esc(fdate(f.fecha))}</b></div><div><span>Fecha de Vencimiento</span><b>${esc(venc)}</b></div><div><span>Moneda</span><b>USD</b></div></div></div>
 <div class="ap-cli"><small>Cliente</small><h3>${esc(f.cli)}</h3>${f.ruc?`<div>RUC / Cédula: ${esc(f.ruc)}</div>`:''}${f.dir?`<div>Dirección: ${esc(f.dir)}</div>`:''}</div>
 <table class="ap-t"><tr><th class="n">#</th><th>Descripción</th><th class="r">Cantidad</th><th class="r">Precio Unitario</th><th class="r">Total</th></tr>${f.items.map((i,k)=>`<tr><td class="n">${k+1}</td><td>${esc(i.d)}</td><td class="r">${esc(i.q)}</td><td class="r">${$$(i.p)}</td><td class="r">${$$(i.q*i.p)}</td></tr>`).join('')}</table>
 <div class="ap-tot"><div><span>Subtotal</span><b>${$$(f.sub)}</b></div>${f.ds?`<div><span>Descuento</span><b>-${$$(f.ds)}</b></div>`:''}<div><span>ITBMS (${esc(pc)}%)</span><b>${$$(f.itbms)}</b></div><div class="g"><span>Total</span><b>${$$(f.total)}</b></div></div>
 <div class="ap-two"><div class="ap-box"><h4><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0a84ff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/></svg>Información de Pago</h4>${row('Banco:',esc(c.banco))}${row('Tipo:',esc(c.tcuenta))}${row('Cuenta:',esc(c.cuenta))}${row('Beneficiario:',esc(c.nombre))}${c.yappy?row('Yappy:',esc(c.yappy)):''}</div>
  <div class="ap-box"><h4><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#6b7280" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>Notas</h4><ol>${notas}</ol></div></div>
 <div class="ap-ft"><div class="ap-tag">GRACIAS POR SER PARTE DE NUESTRO CRECIMIENTO<i></i></div><div class="ap-bd"><div><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg><span>Calidad</span></div><div><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l4-4 4 2 4-2 6 5-5 5-3-1-3 2-4-3z"/></svg><span>Confianza</span></div><div><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-14 15z"/><path d="M5 19l8-8"/></svg><span>Innovación</span></div></div></div></div>`}
function facHTML(id){const f=DB.fac.find(x=>x.id==id),c=DB.cfg;if(facTpl(f)==='apple')return facApple(f);return `<div class="fa tpl-${facTpl(f)}">${facSello(f)}<div class="h"><div><h1>FACTURA</h1><div class="m"><div><span>Factura n.°</span><b>${esc(f.n)}</b></div><div><span>Fecha</span><b>${esc(fdate(f.fecha))}</b></div>${f.anulada?'<div><b style="color:#d92d20">ANULADA</b></div>':''}</div></div><div class="lg"><img src="${c.logoFac||'assets/logo.png'}" alt=""></div></div>
 <div class="cl"><b>${esc(f.cli).toUpperCase()}</b>${f.ruc?'RUC/Céd.: '+esc(f.ruc)+'<br>':''}${esc(f.dir||'')}</div>
 <table><tr><th>Articulo</th><th>Cantidad</th><th>Precio Unitario</th><th>Total</th></tr>${f.items.map(i=>`<tr><td>${esc(i.d).toUpperCase()}</td><td>${esc(i.q)}</td><td>${$$(i.p)}</td><td>${(i.q*i.p).toFixed(2)}</td></tr>`).join('')}</table><div class="fill"></div>
 <div class="tt"><div><span>Subtotal:</span><span>${$$(f.sub)}</span></div>${f.ds?`<div><span>Descuento:</span><span>-${$$(f.ds)}</span></div>`:''}<div><span>I.T.B.M.S(${esc(f.itbmsp??c.itbms)}%):</span><span>${$$(f.itbms)}</span></div><div class="gt"><span>Total:</span><span>${$$(f.total)}</span></div></div>
 ${facExtra(f)}<div class="gr">¡Gracias por su compra!</div>
 <div class="ft"><div><b>Información de pago</b>${esc(c.banco)}<br>${esc(c.tcuenta)}<br>Cuenta: ${esc(c.cuenta)}<br><br>YAPPY: ${esc(c.yappy)}</div><div><b>Contacto</b>${esc(c.tel)}<br>${esc(c.email)}<br>${esc(c.dir)}</div></div></div>`}
function imprimir(id,noPrint){$('prt').innerHTML=facHTML(id); if(!noPrint)setTimeout(()=>print(),150)}
function anular(id){if(confirm('¿Anular esta factura?')){DB.fac.find(f=>f.id==id).anulada=1;save();R.fac()}}
function delFac(id){if(!confirm('¿Eliminar definitivamente esta factura anulada? Esta acción no se puede deshacer.'))return;DB.fac=DB.fac.filter(f=>f.id!=id);save();R.fac()}
function demoData(){
 if(DB.fac.some(f=>f.demo)){if(!confirm('¿Quitar las facturas de ejemplo?'))return;DB.fac=DB.fac.filter(f=>!f.demo);save();ir('home');return}
 if(!confirm('Esto agregará 10 facturas de ejemplo para que pueda ver los gráficos con datos. Puede quitarlas después con el mismo botón. ¿Continuar?'))return;
 const mk=(off,cli,items,pago)=>{const d=new Date();d.setDate(d.getDate()-off);const fecha=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),tot=items.reduce((s,i)=>s+i.q*i.p,0);return{id:uid(),n:DB.cfg.sig++,fecha,cli,pago:pago||'Efectivo',items,sub:tot,ds:0,itbms:0,total:tot,demo:1}};
 DB.fac.push(
  mk(0,'Vendela S.A',[{d:'PW-100 Cumpleaños',q:5,p:2.5}]),
  mk(1,'Maria Lopez',[{d:'PW-101 Aniversario',q:3,p:3}],'Yappy'),
  mk(3,'Vendela S.A',[{d:'PW-100 Cumpleaños',q:10,p:2.5}]),
  mk(8,'Carlos Ruiz',[{d:'PW-102 Boda',q:2,p:4}],'Tarjeta'),
  mk(15,'Ana Diaz',[{d:'PW-100 Cumpleaños',q:6,p:2.5}]),
  mk(20,'Maria Lopez',[{d:'PW-101 Aniversario',q:6,p:3}]),
  mk(45,'Vendela S.A',[{d:'PW-103 Graduación',q:4,p:3.5}],'Transferencia'),
  mk(70,'Carlos Ruiz',[{d:'PW-104 Condolencias',q:3,p:2.5}]),
  mk(200,'Ana Diaz',[{d:'PW-100 Cumpleaños',q:8,p:2.5}]),
  mk(400,'Vendela S.A',[{d:'PW-101 Aniversario',q:5,p:3}])
 );
 save();ir('home')
}

let editEmails=false;
function toggleEditE(on){
 editEmails=on;
 ['e_n','e_m','btnAddE'].forEach(id=>{const el=$(id);if(el)el.disabled=!on});
 const ed=$('btnEditE'),dn=$('btnDoneE');
 if(ed)ed.style.display=on?'none':'';
 if(dn)dn.style.display=on?'':'none';
 renderE()
}
function addE(){const n=$('e_n').value.trim(),m=$('e_m').value.trim();if(!m||!/^\S+@\S+\.\S+$/.test(m))return alert('Ingrese un correo válido.');DB.cfg.dests.push({id:uid(),n:n||m,m});save();$('e_n').value='';$('e_m').value='';renderE()}
function delE(id){if(!confirm('¿Eliminar este correo predeterminado?'))return;DB.cfg.dests=DB.cfg.dests.filter(d=>d.id!=id);save();renderE()}
function renderE(){const e=$('elist');if(!e)return;e.innerHTML=DB.cfg.dests.length?DB.cfg.dests.map(d=>`<div class="dl"><span><b>${esc(d.n)}</b><small>${esc(d.m)}</small></span><span>${recBadge(d)}</span>${editEmails?`<button class="btn s d" data-h-click="h224" data-a-click="${_ha(d.id)}">Eliminar</button>`:''}</div>`).join(''):'<div class="vacio">Aún no hay correos predeterminados.</div>'}
function mailBody(){return document.getElementById('m_body')}
function envPdf(){const a=window._envPdfA;if(a)window[a[0]](...a.slice(1))}
function envModal(asunto,cuerpo,pdfFn){window._envPdfA=pdfFn;
 const chks=DB.cfg.dests.map(d=>`<label class="chk"><input type="checkbox" class="mchk" value="${esc(d.m)}" checked><span><b>${esc(d.n)}</b> — ${esc(d.m)}</span></label>`).join('')||'<div class="vacio">No hay correos predeterminados. Agréguelos en Inicio, o escriba uno abajo.</div>';
 $('mb').innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:12px"><b>Enviar por correo</b><button class="btn s" data-h-click="h12" aria-label="Cerrar">✕</button></div>
 <div class="card" style="box-shadow:none;padding:0;margin:0 0 14px"><label>Destinatarios predeterminados</label>${chks}</div>
 <div class="g" style="margin-bottom:10px"><div><label>Correos adicionales (separados por coma)</label><input id="m_extra" placeholder="otro@correo.com, otro2@correo.com"></div></div>
 <div style="margin-bottom:10px"><label>Asunto</label><input id="m_sub" value="${esc(asunto)}"></div>
 <div style="margin-bottom:6px"><label>Mensaje</label><textarea id="m_body" rows="9">${esc(cuerpo)}</textarea></div>
 <div class="nota">Este panel no envía correos por sí mismo: al presionar "Abrir en mi correo" se abrirá su aplicación de correo (Gmail, Outlook, etc.) con el mensaje y destinatarios ya listos — solo falta presionar Enviar. ${pdfFn?'Si quiere adjuntar el PDF, descárguelo primero y adjúntelo manualmente; el correo no lo adjunta solo.':''}</div>
 <div style="text-align:right">${pdfFn?'<button class="btn s" data-h-click="h223">⬇ Descargar PDF primero</button> ':''}<button class="btn p" data-h-click="h222">✉ Abrir en mi correo</button></div>`;
 $('md').classList.add('on')}
function mandar(){const cks=[...document.querySelectorAll('.mchk:checked')].map(c=>c.value);
 const extra=$('m_extra').value.split(',').map(x=>x.trim()).filter(x=>/^\S+@\S+\.\S+$/.test(x));
 const to=[...new Set([...cks,...extra])];if(!to.length)return alert('Seleccione o escriba al menos un correo válido.');
 const sub=$('m_sub').value,body=$('m_body').value;
 location.href=`mailto:${to.join(',')}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`}
function envReporte(){const h=hoy(),m=h.slice(0,7),a=act(),sum=l=>l.reduce((s,f)=>s+f.total,0);
 const cnt={};a.forEach(f=>(f.items||[]).forEach(i=>cnt[i.d]=(cnt[i.d]||0)+i.q));const top=Object.entries(cnt).sort((x,y)=>y[1]-x[1])[0];
 const c=DB.cfg,cuerpo=`Reporte de ventas — ${esc(c.nombre)}\nFecha: ${fdate(h)}\n\nVentas de hoy: ${$$(sum(a.filter(f=>f.fecha==h)))}\nVentas del mes: ${$$(sum(a.filter(f=>f.fecha.startsWith(m))))}\nFacturas emitidas (total): ${a.length}\nModelo más vendido: ${top?top[0]+' ('+top[1]+' unid.)':'—'}\n\nDocumento interno, sin validez fiscal.\n\n— ${esc(c.nombre)}\n${esc(c.tel)} · ${esc(c.email)}`;
 repModal('Reporte de ventas — '+fdate(h),cuerpo)}
function envFactura(id){const f=DB.fac.find(x=>x.id==id),c=DB.cfg;
 const cuerpo=`Estimado/a ${esc(f.cli)},\n\nAdjuntamos la factura F-${f.n} por un total de ${$$(f.total)}, de fecha ${fdate(f.fecha)}.\n\nArtículos:\n${f.items.map(i=>`- ${esc(i.d)} x${i.q}: ${$$(i.q*i.p)}`).join('\n')}\n\nSubtotal: ${$$(f.sub)}\nITBMS: ${$$(f.itbms)}\nTotal: ${$$(f.total)}\n\n${facTxt(f)?facTxt(f)+"\n\n":""}Nota: documento no fiscal, sin validez tributaria.\n\nGracias por su compra.\n${esc(c.nombre)}\n${esc(c.tel)} · ${esc(c.email)}`;
 envModal('Factura F-'+f.n+' — '+esc(c.nombre),cuerpo,['facPDF',id])}
async function buildFacBlob(id){const x=document.createElement('div');x.style.cssText='position:fixed;left:-10000px;top:0;width:8.5in;background:#fff';x.innerHTML=facHTML(id);document.body.appendChild(x);
 await Promise.all([...x.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));
 const c=await html2canvas(x.querySelector('.fa'),{scale:2.5,useCORS:true,backgroundColor:'#ffffff',logging:false}),doc=new jspdf.jsPDF({unit:'in',format:'letter',orientation:'portrait'});
 doc.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,8.5,11);x.remove();const f=DB.fac.find(x2=>x2.id==id);
 return {blob:doc.output('blob'),name:'Factura_F'+f.n+'.pdf'}}
function dlBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function toggleUbiOtro(){const sel=$('ubiCliSel'),w=$('ubiOtroWrap');if(!sel||!w)return;w.style.display=sel.value?'none':''}
function capturarUbicacion(){
 if(!navigator.geolocation)return alert('Este navegador no soporta geolocalización.');
 const sel=$('ubiCliSel'),cliId=sel.value||null,cli=cliId?DB.cli.find(c=>c.id===cliId):null;
 const n=cli?cli.n:$('ubiN').value.trim();
 if(!n)return alert('Elija un cliente o escriba el nombre del lugar antes de capturar la ubicación.');
 const btn=$('btnUbi'),est=$('ubiEstado');btn.disabled=true;btn.textContent='📍 Obteniendo ubicación…';
 est.textContent='Esperando señal del GPS… puede tardar unos segundos, mejor al aire libre.';
 navigator.geolocation.getCurrentPosition(pos=>{
  const c=pos.coords;
  DB.ubi.push({id:uid(),n,cliId,nota:$('ubiNota').value.trim(),lat:c.latitude,lng:c.longitude,acc:c.accuracy,alt:c.altitude??null,fecha:hoy(),hora:new Date().toLocaleTimeString('es-PA')});
  save();btn.disabled=false;btn.textContent='📍 Capturar ubicación actual';est.textContent='';$('ubiN').value='';$('ubiNota').value='';if(sel)sel.value='';R.ubi()
 },err=>{
  btn.disabled=false;btn.textContent='📍 Capturar ubicación actual';est.textContent='';
  const msgs={1:'Permiso de ubicación denegado. Actívelo en los ajustes del navegador o del teléfono.',2:'No se pudo determinar la ubicación. Intente al aire libre o con el GPS activado.',3:'Se agotó el tiempo esperando el GPS. Intente de nuevo.'};
  alert(msgs[err.code]||'No se pudo obtener la ubicación.')
 },{enableHighAccuracy:true,timeout:20000,maximumAge:0})
}
function delUbi(id){if(!confirm('¿Eliminar esta ubicación?'))return;DB.ubi=DB.ubi.filter(u=>u.id!==id);save();R.ubi()}
/* Fase 14: invalidateSize() de Leaflet lanza 'Cannot read properties of undefined (reading _leaflet_pos)'
   si el mapa ya se quitó (map.remove()) o su contenedor salió del DOM antes de que corra el setTimeout
   (cambio rápido de pantalla). Solo refresca si el mapa sigue vivo; si no, no hace nada. */
function mapaRefrescar(m){try{if(m&&m._loaded&&m._mapPane&&m.getContainer&&m.getContainer().isConnected)m.invalidateSize()}catch(e){}}
let mapaUbi=null,marcadoresUbi=[],miMarcador=null,miCirculo=null;
function pintarMapaUbi(){
 const el=$('ubiMap');if(!el||!window.L)return;
 if(mapaUbi){mapaUbi.remove();mapaUbi=null}
 mapaUbi=L.map('ubiMap',{zoomControl:true});ubiTmp=null;
 const capas={calle:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri — Esri, HERE, Garmin, FAO, NOAA, USGS'}),satelite:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:18,attribution:'Tiles © Esri — Esri, Maxar, Earthstar Geographics'}),etiq:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:18})};
 const sat=L.layerGroup([capas.satelite,capas.etiq]);sat.addTo(mapaUbi);
 L.control.layers({'Satélite':sat,'Calle':capas.calle}).addTo(mapaUbi);
 mapaUbi.on('click',e=>{
  const sel=$('ubiCliSel'),cliId=sel?sel.value||null:null,cli=cliId?DB.cli.find(c=>c.id===cliId):null;
  const n=cli?cli.n:($('ubiN')?$('ubiN').value.trim():'');
  if(!n)return alert('Elija un cliente o escriba el nombre del lugar (arriba) antes de tocar el mapa.');
  if(!confirm(`¿Colocar un punto para "${n}" en este lugar del mapa?`))return;
  DB.ubi.push({id:uid(),n,cliId,nota:$('ubiNota')?$('ubiNota').value.trim():'',lat:e.latlng.lat,lng:e.latlng.lng,acc:null,alt:null,fecha:hoy(),hora:new Date().toLocaleTimeString('es-PA'),manual:true});
  save();if($('ubiN'))$('ubiN').value='';if($('ubiNota'))$('ubiNota').value='';if(sel)sel.value='';R.ubi()
 });
 marcadoresUbi=[];
 if(DB.ubi.length){
  const grupo=L.featureGroup();
  DB.ubi.forEach(u=>{
   const m=L.marker([u.lat,u.lng]).bindPopup(`<b>${esc(u.n)}</b>${u.nota?`<br>${esc(u.nota)}`:''}<br><small>${u.acc!=null?'±'+Math.round(u.acc)+' m':'Colocado a mano'} · ${fdate(u.fecha)} ${u.hora||''}</small><br><a href="https://www.google.com/maps?q=${u.lat},${u.lng}" target="_blank" rel="noopener">Abrir en Google Maps</a>`);
   m._ubiId=u.id;m.addTo(grupo);marcadoresUbi.push(m)
  });
  grupo.addTo(mapaUbi);
  mapaUbi.fitBounds(grupo.getBounds().pad(0.25),{maxZoom:16})
 }else{
  mapaUbi.setView([8.9824,-79.5199],11) // Panamá Oeste / Arraiján por defecto
 }
 setTimeout(()=>mapaRefrescar(mapaUbi),150);
 mapaUbi.on('locationfound',ev=>{
  if(miCirculo)mapaUbi.removeLayer(miCirculo);if(miMarcador)mapaUbi.removeLayer(miMarcador);
  miCirculo=L.circle(ev.latlng,{radius:ev.accuracy,color:'#2A7DE1',fillColor:'#2A7DE1',fillOpacity:.15,weight:1}).addTo(mapaUbi);
  miMarcador=L.circleMarker(ev.latlng,{radius:7,color:'#fff',weight:2,fillColor:'#2A7DE1',fillOpacity:1}).addTo(mapaUbi).bindPopup('Usted está aquí')
  const p=$('miPrecision');if(p)p.textContent='Precisión: ±'+Math.round(ev.accuracy)+' m'+(ev.accuracy>300?' (parece ubicación por red, no GPS real)':'')
 });
 mapaUbi.on('locationerror',()=>{});
 mapaUbi.locate({setView:true,maxZoom:16,enableHighAccuracy:true})
}
let ubiTmp=null;
function ubiFull(on){const w=$('ubiWrap');if(!w)return;on=on===undefined?!w.classList.contains('ubifs'):!!on;if(on){if(!w._home){w._home=w.parentNode;w._homeNext=w.nextSibling}document.body.appendChild(w)}else if(w._home){if(w._homeNext&&w._homeNext.parentNode===w._home)w._home.insertBefore(w,w._homeNext);else w._home.appendChild(w)}w.classList.toggle('ubifs',on);document.body.style.overflow=on?'hidden':'';[50,150,400].forEach(ms=>setTimeout(()=>mapaRefrescar(mapaUbi),ms))}
addEventListener('keydown',e=>{if(e.key==='Escape'){const w=$('ubiWrap');if(w&&w.classList.contains('ubifs'))ubiFull(0)}});
function ubiParse(t){t=String(t||'').trim();if(!t)return null;try{t=decodeURIComponent(t)}catch(e){window._tjw&&_tjw(e)}
 const rx=[/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,/[?&](?:q|ll|query|center|destination|daddr)=\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i,/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/];
 for(const r of rx){const m=t.match(r);if(m){const a=+m[1],b=+m[2];if(Math.abs(a)<=90&&Math.abs(b)<=180)return{lat:a,lng:b}}}return null}
function ubiLinkGo(modo,id){const t=(($(id||'ubiLink')||{}).value||'').trim(),c=ubiParse(t);
 if(!t)return alert('Pegue primero el link de Google Maps.');
 if(modo==='abrir'){if(/^https?:\/\//i.test(t))window.open(t,'_blank','noopener,noreferrer');else if(c)window.open('https://www.google.com/maps?q='+c.lat+','+c.lng,'_blank','noopener,noreferrer');else alert('Pegue un link válido de Google Maps.');return}
 if(!c)return alert(/goo\.gl|maps\.app/i.test(t)?'Ese es un link corto y el navegador no puede leerlo. Ábralo en Google Maps, copie el link completo de la barra de direcciones (o las coordenadas) y péguelo aquí.':'No encontré coordenadas en ese link. Pegue el link completo de Google Maps o las coordenadas, por ejemplo: 8.9824, -79.5199');
 if(!mapaUbi)return alert('El mapa todavía no ha cargado. Espere unos segundos e intente de nuevo.');
 if(modo==='guardar'){const sel=$('ubiCliSel'),cliId=sel?sel.value||null:null,cli=cliId?DB.cli.find(x=>x.id===cliId):null,n=cli?cli.n:($('ubiN')?$('ubiN').value.trim():'');
  if(!n)return alert('Elija un cliente o escriba el nombre del lugar (arriba) para guardar este sitio.');
  DB.ubi.push({id:uid(),n,cliId,nota:$('ubiNota')?$('ubiNota').value.trim():'',lat:c.lat,lng:c.lng,acc:null,alt:null,fecha:hoy(),hora:new Date().toLocaleTimeString('es-PA'),manual:true,link:/^https?:\/\//i.test(t)?t:''});
  save();R.ubi();setTimeout(()=>{if(mapaUbi)mapaUbi.flyTo([c.lat,c.lng],18,{duration:1})},400);return}
 if(ubiTmp){mapaUbi.removeLayer(ubiTmp);ubiTmp=null}
 ubiTmp=L.marker([c.lat,c.lng]).addTo(mapaUbi).bindPopup('<b>Sitio del link</b><br><small>'+c.lat.toFixed(6)+', '+c.lng.toFixed(6)+'</small><br><a href="https://www.google.com/maps?q='+c.lat+','+c.lng+'" target="_blank" rel="noopener">Abrir en Google Maps</a>').openPopup();
 mapaUbi.flyTo([c.lat,c.lng],18,{duration:1.2});const m=$('ubiWrap');if(m&&!m.classList.contains('ubifs'))m.scrollIntoView({behavior:'smooth',block:'center'})}
function centrarEnMi(){
 if(!mapaUbi)return alert('El mapa todavía no ha cargado. Espere unos segundos e intente de nuevo.');
 if(!window.isSecureContext){alert('El GPS del teléfono no funciona abriendo el archivo directamente.\n\nAbra la página desde el link de internet (https://...) en vez del archivo guardado, y el "Mi ubicación" funcionará normal.');return}
 if(!navigator.geolocation)return alert('Este navegador no soporta geolocalización.');
 const btn=event&&event.target;if(btn){btn.disabled=true;btn.dataset.txt=btn.textContent;btn.textContent='📍 Buscando…'}
 const restaurar=()=>{if(btn){btn.disabled=false;btn.textContent=btn.dataset.txt}};
 mapaUbi.once('locationerror',err=>{restaurar();const msgs={1:'Permiso de ubicación denegado. Actívelo en los ajustes del navegador o del teléfono y vuelva a intentar.',2:'No se pudo determinar la ubicación. Intente al aire libre o con el GPS activado.',3:'Se agotó el tiempo esperando el GPS. Intente de nuevo.'};alert(msgs[err.code]||'No se pudo obtener la ubicación.')});
 mapaUbi.once('locationfound',restaurar);
 mapaUbi.locate({setView:true,maxZoom:17,enableHighAccuracy:true,timeout:20000})
}
function centrarUbi(id){const m=marcadoresUbi.find(x=>x._ubiId===id);if(!m||!mapaUbi)return;mapaUbi.setView(m.getLatLng(),17);m.openPopup();$('ubiMap').scrollIntoView({behavior:'smooth',block:'center'})}
function exportUbiCSV(){
 const rows=[['Nombre','Nota','X_Longitud','Y_Latitud','Precision_m','Altitud_m','Fecha','Hora']];
 DB.ubi.forEach(u=>rows.push([u.n,u.nota||'',u.lng,u.lat,u.acc!=null?Math.round(u.acc):'',u.alt??'',u.fecha,u.hora||'']));
 const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 dlBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),'ubicaciones_tarjeteria_jhon.csv')
}

async function facPDF(id){if(!window.html2canvas||!window.jspdf)return alert('Para descargar el PDF se necesita conexión a internet. Use "Ver/Imprimir" y elija "Guardar como PDF".');
 try{const {blob,name}=await buildFacBlob(id);dlBlob(blob,name)}catch(e){alert('No se pudo generar el PDF: '+((e&&e.message)||e))}}
async function shareWA(getBlob,text,fname,btn){const t=btn?btn.textContent:null;if(btn){btn.disabled=true;btn.textContent='Preparando…'}
 try{let file=null;
  if(window.html2canvas&&window.jspdf){const {blob,name}=await getBlob();file=new File([blob],name,{type:'application/pdf'})}
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:fname,text})}
  else if(navigator.share&&!file){await navigator.share({title:fname,text})}
  else{if(file)dlBlob(file,fname+'.pdf');window.open('https://wa.me/?text='+encodeURIComponent(text+(file?'\n\n(Se descargó el PDF — adjúntelo manualmente en WhatsApp)':'')),'_blank','noopener,noreferrer')}
 }catch(e){if(e&&e.name!=='AbortError')alert('No se pudo compartir: '+((e&&e.message)||e))}
 if(btn){btn.disabled=false;btn.textContent=t}}
function shareFac(id,btn){const f=DB.fac.find(x=>x.id==id),c=DB.cfg;
 const text=`Factura F-${f.n} — ${esc(c.nombre)}\nCliente: ${esc(f.cli)}\nTotal: ${$$(f.total)}\nFecha: ${fdate(f.fecha)}\n${facTxt(f)?facTxt(f)+"\n":""}\nDocumento no fiscal, sin validez tributaria.\n${esc(c.tel)}`;
 shareWA(()=>buildFacBlob(id),text,'Factura F-'+f.n,btn)}
function addP(){const n=$('pn').value.trim(),p=+$('pp').value;if(!n||!(p>=0))return;DB.prod.push({id:uid(),n,p});save();R.prod()}
function delP(id){DB.prod=DB.prod.filter(p=>p.id!=id);save();R.prod()}
function editP(id){const p=DB.prod.find(x=>x.id==id);if(!p)return;const n=prompt('Nombre:',p.n);if(n===null)return;const pr=prompt('Precio ($):',p.p);if(pr===null)return;const v=+pr;if(!n.trim()||!(v>=0))return alert('Nombre o precio no válido.');p.n=n.trim();p.p=v;save();R.prod()}

/* Ubicación del negocio dentro del formulario de cliente. El campo guarda las coordenadas
   (o el link pegado); la ubicación se guarda en el propio cliente, por lo que la ven todos,
   y también se registra en el mapa de Ubicación de quien crea el cliente. */
const cliLocBtn=c=>(c&&typeof c.lat==='number'&&typeof c.lng==='number')?`<a class="btn s" href="https://www.google.com/maps?q=${c.lat},${c.lng}" target="_blank" rel="noopener">📍 Mapa</a>`:'<small style="color:var(--gris)">—</small>';
function cliLocLeer(){const i=$('cu_link');if(!i)return{vacio:true};const t=i.value.trim();if(!t)return{vacio:true};const c=ubiParse(t);if(!c)return{error:true,texto:t};const a=+i.dataset.acc;return{lat:c.lat,lng:c.lng,acc:a>0?a:null,link:/^https?:\/\//i.test(t)?t:''}}
function cliLocEstado(){
 const e=$('cu_est');if(!e)return;const l=cliLocLeer();cliMapSync(false);
 if(l.vacio){e.textContent='';return}
 if(l.error){e.style.color='#b3261e';e.textContent=/goo\.gl|maps\.app/i.test(l.texto)?'Ese es un link corto y no se puede leer. Ábralo en Google Maps, copie el link completo de la barra de direcciones (o las coordenadas) y péguelo aquí.':'No encontré coordenadas en ese texto. Pegue el link completo de Google Maps o las coordenadas, por ejemplo: 8.9824, -79.5199';return}
 e.style.color='#1e7a43';e.textContent='✔ Ubicación lista: '+l.lat.toFixed(6)+', '+l.lng.toFixed(6)+(l.acc?' (±'+Math.round(l.acc)+' m)':'')
}
function cliLocInput(){const i=$('cu_link');if(i)delete i.dataset.acc;cliLocEstado();cliMapSync(true)}
function cliLocGPS(){
 if(!navigator.geolocation)return alert('Este navegador no soporta geolocalización.');
 if(!window.isSecureContext)return alert('El GPS no funciona abriendo el archivo directamente. Abra la página desde el link de internet (https://...).');
 const b=$('cu_gps'),e=$('cu_est');if(b){b.disabled=true;b.textContent='🎯 Obteniendo ubicación…'}
 if(e){e.style.color='';e.textContent='Esperando señal del GPS… puede tardar unos segundos; mejor al aire libre o dentro del negocio del cliente.'}
 navigator.geolocation.getCurrentPosition(pos=>{
  const c=pos.coords,i=$('cu_link');if(b){b.disabled=false;b.textContent='🎯 Usar mi ubicación actual'}
  if(i){i.value=c.latitude.toFixed(6)+', '+c.longitude.toFixed(6);i.dataset.acc=String(c.accuracy||'')}
  cliLocEstado();cliMapSync(true)
 },err=>{
  if(b){b.disabled=false;b.textContent='🎯 Usar mi ubicación actual'}if(e)e.textContent='';
  const msgs={1:'Permiso de ubicación denegado. Actívelo en los ajustes del navegador o del teléfono.',2:'No se pudo determinar la ubicación. Intente al aire libre o con el GPS activado.',3:'Se agotó el tiempo esperando el GPS. Intente de nuevo.'};
  alert(msgs[err.code]||'No se pudo obtener la ubicación.')
 },{enableHighAccuracy:true,timeout:20000,maximumAge:0})
}
function cliLocAbrir(){const l=cliLocLeer(),i=$('cu_link'),t=i?i.value.trim():'';
 if(l.lat!==undefined)return void window.open('https://www.google.com/maps?q='+l.lat+','+l.lng,'_blank','noopener,noreferrer');
 if(/^https?:\/\//i.test(t))return void window.open(t,'_blank','noopener,noreferrer');
 window.open('https://www.google.com/maps','_blank','noopener,noreferrer')}
function addC(){const n=$('cn').value.trim();if(!n)return;
 if(fbDb&&_cliBase===null)return alert('Los clientes compartidos todavía no están activos. Pida al administrador que abra el panel una vez e intente de nuevo.');
 const dup=clienteDuplicado(n,$('cr').value,$('ct2').value);
 if(dup)return alert('Este cliente ya existe y no se agregó para evitar duplicados:\n\n'+dup.n+(dup.r?'\nRUC/Cédula: '+dup.r:'')+(dup.t?'\nTeléfono: '+dup.t:''));
 const loc=cliLocLeer();if(loc.error)return alert('La ubicación del negocio no es válida. Corríjala o déjela vacía para guardar el cliente sin ubicación.');
 const cid=uid(),nuevo={id:cid,n,r:$('cr').value,t:$('ct2').value,d:$('cd2').value};
 if(loc.lat!==undefined){nuevo.lat=loc.lat;nuevo.lng=loc.lng;if(loc.acc)nuevo.acc=loc.acc;
  DB.ubi.push({id:uid(),n,cliId:cid,nota:'Ubicación del negocio',lat:loc.lat,lng:loc.lng,acc:loc.acc,alt:null,fecha:hoy(),hora:new Date().toLocaleTimeString('es-PA'),manual:!loc.acc,link:loc.link||''})}
 DB.cli.push(nuevo);save();R.cli()}
function delC(id){DB.cli=DB.cli.filter(c=>c.id!=id);save();R.cli()}
function editC(id){const c=DB.cli.find(x=>x.id==id);if(!c)return;const n=prompt('Nombre:',c.n);if(n===null)return;const r=prompt('RUC / Cédula:',c.r||'');if(r===null)return;const t=prompt('Teléfono:',c.t||'');if(t===null)return;const d=prompt('Dirección / Ubicación:',c.d||'');if(d===null)return;
 const lt=prompt('Ubicación del negocio (link de Google Maps o coordenadas; vacío = sin ubicación):',typeof c.lat==='number'?c.lat.toFixed(6)+', '+c.lng.toFixed(6):'');if(lt===null)return;
 let g=null;if(lt.trim()){g=ubiParse(lt);if(!g)return alert('La ubicación no es válida. No se guardaron cambios.')}
 if(!n.trim())return alert('El nombre no puede quedar vacío.');c.n=n.trim();c.r=r;c.t=t;c.d=d;
 if(g){if(c.lat!==g.lat||c.lng!==g.lng)delete c.acc;c.lat=g.lat;c.lng=g.lng}else{delete c.lat;delete c.lng;delete c.acc}
 save();R.cli()}
function toggleEditCfg(on){
 ['c1','c3','c4','c5','c6','c7','c8','c9','c10','c11'].forEach(id=>{const el=$(id);if(el)el.disabled=!on});
 const ed=$('btnEditCfg'),sv=$('btnSaveCfg'),cn=$('btnCancelCfg');
 if(ed)ed.style.display=on?'none':'';
 if(sv)sv.style.display=on?'':'none';
 if(cn)cn.style.display=on?'':'none';
}
/* «Datos de la empresa» manda sobre lo que muestra la web. cfg() ya replica nombre/correo/teléfono/dirección al guardar; esta función cubre lo que se
   guardó ANTES de existir esa copia: una sola vez por empresa (marca __cfg.contactoSync) rellena SOLO los datos de la web que estén vacíos con los de
   «Datos de la empresa». Nunca pisa algo que ya tenga la web. Solo el administrador, con la plantilla ya leída de la nube. */
let _cwSync=0;
function contactoWebSync(cd){
 if(_cwSync||!cd||cd.contactoSync||!esAdmin()||!fbDb)return;
 const c=DB.cfg||{};if(!(c.nombre||c.tel||c.email||c.dir))return; /* DB aún sin datos propios: no se da por hecho nada */
 _cwSync=1;
 const ct=Object.assign({},cd.contacto&&typeof cd.contacto==='object'?cd.contacto:{}),dat={__cfg:true,contactoSync:true,ts:Date.now()};
 const quiere={tel:c.tel,email:c.email,dir:c.dir};
 let cambia=false;
 Object.keys(quiere).forEach(k=>{const v=String(quiere[k]==null?'':quiere[k]).trim();if(!String(ct[k]||'').trim()&&v){ct[k]=v;cambia=true}});
 if(cambia)dat.contacto=ct;
 if(!String(cd.empresaNombre||'').trim()&&String(c.nombre||'').trim())dat.empresaNombre=String(c.nombre).trim();
 fbCol('tienda_items').doc('__cfg').set(dat,{merge:true}).catch(e=>{window._tjw&&_tjw(e)}); /* si falla (sin permiso/red) no se reintenta en esta sesión */
}
function cfg(){Object.assign(DB.cfg,{nombre:$('c1').value||(TJEmpresa.empEsInicial()?'Tarjetería Jhon':''),tel:$('c3').value,dir:$('c4').value,itbms:+$('c5').value||0,email:$('c6').value,banco:$('c7').value,tcuenta:$('c8').value,cuenta:$('c9').value,yappy:$('c10').value,sig:+$('c11').value||DB.cfg.sig});save();toggleEditCfg(false);
 /* La web lee el nombre/correo/teléfono de la empresa desde su plantilla: se
    replican aquí para que la tienda y las políticas cambien en automático. */
 try{
  if(typeof fbCol==='function'&&fbCol){
   var contacto={};try{if(typeof TD!=='undefined'&&TD.contacto)Object.assign(contacto,TD.contacto)}catch(e){}
  contacto.email=DB.cfg.email;contacto.tel=DB.cfg.tel;contacto.dir=DB.cfg.dir;
   fbCol('tienda_items').doc('__cfg').set({__cfg:true,empresaNombre:DB.cfg.nombre,contacto:contacto,ts:Date.now()},{merge:true}).then(function(){try{TD.empresaNombre=DB.cfg.nombre;TD.contacto=contacto}catch(e){}}).catch(function(){});
  }
 }catch(e){window._tjw&&window._tjw(e)}
 alert('Datos guardados. Los campos se bloquearon de nuevo.\nNombre, correo, teléfono y dirección también se actualizaron en la web (tienda, contacto y políticas).')}
function respaldo(){const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(DB,null,1));a.download='respaldo_tarjeteria_john.json';a.click()}

function dibujarGraficos(){
 const w=$('chWarn');
 if(!window.Chart){if(w)w.style.display='block';return}
 if(w)w.style.display='none';
 const c1=$('chVentas'),c2=$('chProd'),c3=$('chCli');if(!c1||!c2||!c3)return;
 try{
 const a=act(),sum=l=>l.reduce((s,f)=>s+f.total,0);
 let etq=[],datos=[];
 if(perVentasSel=='dia'){
  const dias=[...Array(14)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));return ymd(d)});
  etq=dias.map(d=>{const p=d.split('-');return p[2]+'/'+p[1]});
  datos=dias.map(d=>sum(a.filter(f=>f.fecha==d)));
 }else if(perVentasSel=='semana'){
  const lunes=d=>{const x=new Date(d);const dow=(x.getDay()+6)%7;x.setDate(x.getDate()-dow);return x};
  const sems=[...Array(8)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-7*(7-i));return lunes(d)});
  etq=sems.map(d=>d.getDate()+'/'+(d.getMonth()+1));
  datos=sems.map(ini=>{const fin=new Date(ini);fin.setDate(fin.getDate()+7);return sum(a.filter(f=>{const fd=new Date(f.fecha+'T00:00:00');return fd>=ini&&fd<fin}))});
 }else if(perVentasSel=='mes'){
  const meses=[...Array(12)].map((_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(11-i));return d});
  const NM=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  etq=meses.map(d=>NM[d.getMonth()]);
  datos=meses.map(d=>{const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');return sum(a.filter(f=>f.fecha.startsWith(k)))});
 }else{
  const anioAct=new Date().getFullYear();
  const anios=a.length?[...new Set(a.map(f=>+f.fecha.slice(0,4)))].sort():[anioAct];
  const min=Math.min(anios[0],anioAct-4),max=anioAct;
  const lista=[];for(let y=min;y<=max;y++)lista.push(y);
  etq=lista.map(y=>''+y);
  datos=lista.map(y=>sum(a.filter(f=>f.fecha.startsWith(''+y))));
 }
 const cnt={};a.forEach(f=>(f.items||[]).forEach(i=>cnt[i.d]=(cnt[i.d]||0)+i.q));
 const top5=Object.entries(cnt).sort((x,y)=>y[1]-x[1]).slice(0,5);
 const cliCnt={};a.forEach(f=>{const n=f.cli||'Consumidor final';cliCnt[n]=(cliCnt[n]||0)+f.total});
 const topCli=Object.entries(cliCnt).sort((x,y)=>y[1]-x[1]).slice(0,5);
 const cs=getComputedStyle(document.documentElement);
 const az=(cs.getPropertyValue('--az')||'#E0457B').trim(),txt=(cs.getPropertyValue('--txt')||'#1B1B1B').trim(),gris=(cs.getPropertyValue('--gris')||'#5C5C5C').trim(),linea=(cs.getPropertyValue('--linea')||'#E1E1E1').trim(),amb=(cs.getPropertyValue('--amb')||'#FF9F0A').trim();
 if(window._chV)window._chV.destroy();
 if(window._chP)window._chP.destroy();
 if(window._chC)window._chC.destroy();
 if(window._chCat)window._chCat.destroy();
 
 let grad=az+'26';
 try{const ctx1=c1.getContext('2d');const g=ctx1.createLinearGradient(0,0,0,260);g.addColorStop(0,az+'40');g.addColorStop(0.8,az+'08');g.addColorStop(1,az+'00');grad=g}catch(e){}
 window._chV=new Chart(c1,{type:'line',data:{labels:etq,datasets:[{label:'Ventas ($)',data:datos,borderColor:az,backgroundColor:grad,fill:true,tension:.38,borderWidth:2.8,pointRadius:datos.length>18?0:3.5,pointHoverRadius:6,pointBackgroundColor:'#fff',pointBorderColor:az,pointBorderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#1e293b',padding:10,cornerRadius:8,callbacks:{label:function(c){return ' Facturado: $'+(+c.parsed.y).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}}}},scales:{x:{ticks:{color:gris,font:{size:11}},grid:{display:false}},y:{ticks:{color:gris,font:{size:11},callback:function(v){return '$'+v}},grid:{color:linea+'55'},beginAtZero:true}}}});
 window._chP=new Chart(c2,{type:'bar',data:{labels:top5.length?top5.map(x=>x[0].length>22?x[0].slice(0,22)+'…':x[0]):['Sin datos'],datasets:[{label:'Unidades',data:top5.length?top5.map(x=>x[1]):[0],backgroundColor:az,borderRadius:6,maxBarThickness:22}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1e293b',padding:10,cornerRadius:8,callbacks:{label:function(c){return ' '+c.parsed.x+' unid. vendidas'}}}},scales:{x:{ticks:{color:gris,font:{size:11}},grid:{color:linea+'55'},beginAtZero:true,precision:0},y:{ticks:{color:txt,font:{size:11.5,weight:'600'}},grid:{display:false}}}}});
 window._chC=new Chart(c3,{type:'bar',data:{labels:topCli.length?topCli.map(x=>x[0].length>22?x[0].slice(0,22)+'…':x[0]):['Sin datos'],datasets:[{label:'Total ($)',data:topCli.length?topCli.map(x=>x[1]):[0],backgroundColor:amb,borderRadius:6,maxBarThickness:22}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1e293b',padding:10,cornerRadius:8,callbacks:{label:function(c){return ' Total: $'+(+c.parsed.x).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}}}},scales:{x:{ticks:{color:gris,font:{size:11},callback:function(v){return '$'+v}},grid:{color:linea+'55'},beginAtZero:true},y:{ticks:{color:txt,font:{size:11.5,weight:'600'}},grid:{display:false}}}}});
 
 const c4=$('chCat');
 if(c4){
  const catM={};
  a.forEach(f=>{(f.items||[]).forEach(it=>{const c=it.c||it.cat||(DB.prod.find(p=>p.id===it.id)||{}).cat||'Tarjetas';catM[c]=(catM[c]||0)+(it.total||(it.p*it.q)||0)})});
  const cEnt=Object.entries(catM).sort((x,y)=>y[1]-x[1]).slice(0,6);
  const cLab=cEnt.length?cEnt.map(x=>x[0]):['General'],cVal=cEnt.length?cEnt.map(x=>+x[1].toFixed(2)):[1];
  const cPal=(window.TJMarca&&TJMarca.panel&&TJMarca.paleta)||['#E0457B','#6366f1','#10b981','#f59e0b','#8b5cf6','#06b6d4'];
  window._chCat=new Chart(c4,{type:'doughnut',data:{labels:cLab,datasets:[{data:cVal,backgroundColor:cPal.slice(0,cLab.length),borderWidth:2,borderColor:'#fff',hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'right',labels:{color:txt,font:{size:11.5},boxWidth:12,padding:12}},tooltip:{backgroundColor:'#1e293b',padding:10,cornerRadius:8,callbacks:{label:function(c){return ' $'+(+c.parsed).toFixed(2)}}}}}});
 }
 }catch(e){console.error('Error al dibujar gráficos:',e);if(w){w.style.display='block';w.textContent='No se pudieron generar los gráficos: '+((e&&e.message)||e)}}
}
const idb=()=>new Promise((a,b)=>{const r=indexedDB.open(TJEmpresa.empLSKey('tj_cat'),1);r.onupgradeneeded=()=>r.result.createObjectStore('f',{keyPath:'id'});r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error)});
const tx=(m,fn)=>idb().then(db=>new Promise((a,b)=>{const t=db.transaction('f',m),rq=fn(t.objectStore('f'));t.oncomplete=()=>a(rq&&rq.result);t.onerror=()=>b(t.error)}));
const CATS=['Cumpleaños','Quinceaños','Graduación','Boda','Amor','Baby shower','Revelación de sexo','Pésame','Agradecimiento','Aniversario','Felicidades','Día de la Madre','Día del Padre','Navidad','Otros'];
let CL=[],CU={},cq='',cc='',catCl=new Set();function catTg(d){d.open?catCl.add(d.dataset.k):catCl.delete(d.dataset.k)}
const cu=f=>CU[f.id]||(CU[f.id]=URL.createObjectURL(f.blob));
const IMG_KB_MIN=500,IMG_KB_MAX=700,IMG_KB_DEF=500;
function imgKBClamp(v){const n=Math.round(+v||IMG_KB_DEF);return Math.max(IMG_KB_MIN,Math.min(IMG_KB_MAX,n))}
function imgKBPreference(){try{return imgKBClamp(localStorage.getItem(lsk('tj_img_kb'))||IMG_KB_DEF)}catch(e){return IMG_KB_DEF}}
function imgTargetKB(){const e=$('u_imgkb'),n=imgKBClamp(e?e.value:imgKBPreference());try{localStorage.setItem(lsk('tj_img_kb'),n)}catch(x){window._tjw&&_tjw(x)}return n}
function imgQualityOpts(){const now=imgKBPreference();return [500,550,600,650,700].map(n=>`<option value="${n}" ${n===now?'selected':''}>${n} KB${n===500?' — alta (recomendado)':n===700?' — máxima permitida':''}</option>`).join('')}
function imgPicker(){const price=$('u_pr');if(!price||$('u_imgkb'))return;const box=document.createElement('div');box.innerHTML=`<label>Calidad de imágenes nuevas</label><select id="u_imgkb" data-h-change="h221">${imgQualityOpts()}</select><small style="display:block;color:var(--gris);margin-top:5px">Tope por imagen: 500–700 KB. Si el original pesa menos, se conserva sin reducir.</small>`;price.parentElement.insertAdjacentElement('afterend',box)}
R.cat=async()=>{try{CL=await tx('readonly',s=>s.getAll())}catch(e){memW=1}
 const upBody=`<div class="g" style="margin-bottom:14px"><div><label>Categoría / ocasión</label><input id="u_cat" list="cl" placeholder="Ej. Cumpleaños"><datalist id="cl">${CATS.map(c=>`<option>${c}</option>`).join('')}</datalist><div class="catq">${CATS.map(c=>`<button type="button" class="catqb" data-h-click="h220" data-a-click="${_ha(c)}">${c}</button>`).join('')}</div></div><div><label>Precio (opcional)</label><input id="u_pr" type="number" step="0.01" min="0"></div></div>
 <div class="up" id="dz" data-h-click="h219" data-h-dragover="h218" data-h-dragleave="h217" data-h-drop="h216"><div style="font-size:30px">📂</div><b>Arrastre archivos aquí o haga clic para seleccionarlos</b><br><small>PDF, JPG, PNG, WEBP, GIF, Word, Excel, video y más · varios a la vez</small></div><input id="fi2" type="file" multiple style="display:none" data-h-change="h215">`;
 const toolsBody=`<div class="g" style="margin-bottom:14px"><div><button class="btn s" data-h-click="h211">🏷 Organizar por categoría (auto)</button></div><div><button class="btn s" id="btnCompCat" data-h-click="h210">🗜 Comprimir catálogo</button></div><div><button class="btn s" id="btnExpCat" data-h-click="h209">⬇ Respaldo del catálogo</button></div><div><button class="btn s" id="btnImgJ" data-h-click="h208">🖼 Descargar todo en JPG</button></div><div><button class="btn s" id="btnImgP" data-h-click="h207">🖼 Descargar todo en PNG</button></div><div><button class="btn s" data-h-click="h206">⬆ Importar catálogo</button><input id="impCatInput" type="file" accept=".zip,application/zip" multiple hidden data-h-change="h205"></div></div><p style="font-size:12px;color:var(--gris);margin:0">Use "Respaldo del catálogo" para guardar sus archivos fuera de este navegador.</p>`;
 const catTb=`<div style="display:flex;gap:8px;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap"><small style="color:var(--gris);font-size:12.5px">Todas las secciones y categorías aparecen minimizadas por defecto.</small><div style="display:flex;gap:6px"><button class="btn s" data-h-click="call" data-a-click="${_ha('catExpandAll')}">▾ Abrir todas las categorías</button><button class="btn s" data-h-click="call" data-a-click="${_ha('catCollapseAll')}">▸ Minimizar todas</button></div></div>`;
 $('v').innerHTML=catTb+`<div id="av" class="card" style="display:none;background:#fff4e5;color:#7a4a00;font-size:13px">⚠ Esta vista no permite guardar archivos de forma permanente.</div>
 <div class="card">${wrapCardInner('catUpload','📂 Subir al catálogo',upBody)}</div>
 <div class="card">${wrapCardInner('catTools','⚙️ Herramientas de exportación y respaldo',toolsBody)}</div>
 <div class="card"><div class="g" style="margin-bottom:16px;align-items:end"><div><label>Buscar</label><input id="q" placeholder="Nombre o descripción" data-h-input="h214"></div><div><label>Categoría</label><select id="qc" data-h-change="h213"></select></div><div><button class="btn p" data-h-click="h212">📖 Vista previa / Imprimir catálogo</button></div></div>
  <div id="gc"></div></div>`;
 imgPicker();cc='';cq='';dib();R.aviso();fixT();if(esVend()){const d=$('dz');if(d&&d.closest('.card'))d.closest('.card').remove();const i=$('impCatInput');if(i&&i.parentNode)i.parentNode.remove();['#btnCompCat','#btnExpCat','[data-h-click="h211"]'].forEach(q=>{const b=document.querySelector(q);if(b&&b.parentNode)b.parentNode.remove()})}};
function dib(){const cats=[...new Set([...CATS,...CL.map(f=>f.cat)])].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));$('qc').innerHTML='<option value="">Todas las categorías</option>'+cats.map(c=>`<option ${c==cc?'selected':''}>${esc(c)}</option>`).join('');
 const q=cq.toLowerCase(),l=CL.filter(f=>(!cc||f.cat==cc)&&(f.name+' '+f.desc).toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));
 const itH=f=>`<div class="it${f.sac?' sacadoIt':''}"><div class="th" data-h-click="h201" data-a-click="${_ha(f.id)}">${f.thumb?`<img src="${f.thumb}" alt="">`:`<div class="ft2">${f.type=='application/pdf'?'📄':f.type.startsWith('image/')?'🖼':'📎'}<small>${ext(f)}</small></div>`}</div>${esVend()?'':`<div class="ckrow"><label class="ckitem"><input type="checkbox" class="cbA" ${f.acot?'checked':''} data-h-click="h204" data-a-click="${_ha(f.id)}"><span>Acotejado</span></label><label class="ckitem"><input type="checkbox" class="cbS" ${f.sac?'checked':''} data-h-click="h203" data-a-click="${_ha(f.id)}"><span>Sacado</span></label></div>`}<div class="ib"><span class="itcat" title="Categoría">${esc(f.cat||'Sin categoría')}</span><b>${esc(f.name)}</b>${esVend()?'':`<select class="catsel" data-h-change="h202" data-a-change="${_ha(f.id)}" title="Categoría">${catOpts(f.cat)}</select>`}${f.price?`<small><b style="display:inline;font-size:13px">${$$(f.price)}</b></small>`:''}${f.desc?`<small>${esc(f.desc)}</small>`:''}<small>${ext(f)} · ${tam(f.size)}</small></div><div class="ia"><button class="btn s" data-h-click="h201" data-a-click="${_ha(f.id)}">👁 Ver</button><button class="btn s" data-h-click="h195" data-a-click="${_ha(f.id)}" aria-label="Descargar">⬇</button>${esVend()?'':`<button class="btn s" data-h-click="h200" data-a-click="${_ha(f.id)}" aria-label="Editar">✏️</button>${f.price?`<button class="btn s" data-h-click="h199" data-a-click="${_ha(f.id)}" aria-label="Crear factura">🧾</button>`:''}<button class="btn s d" data-h-click="h198" data-a-click="${_ha(f.id)}" aria-label="Eliminar">🗑</button>`}</div></div>`;const G={};l.forEach(f=>{const k=f.cat||'Sin categoría';(G[k]=G[k]||[]).push(f)});$('gc').innerHTML=l.length?Object.keys(G).sort().map(k=>`<details class="cg2" data-k="${esc(k)}" ${cq||catCl.has(k)?'open':''} data-h-toggle="h197"><summary><b>${esc(k)}</b><span>${G[k].length}</span></summary><div class="gc">${G[k].map(itH).join('')}</div></details>`).join(''):'<div class="vacio">'+(CL.length?'Sin resultados.':'El catálogo está vacío. Suba su primer archivo arriba.')+'</div>'}
const CAT_RX=[['Quinceaños',/quince|\bxv\b|15 ?anos/],['Revelación de sexo',/revelacion|gender|sexo|nino o nina|team ?(boy|girl)/],['Baby shower',/baby|bebe|nacimiento|shower|recien nacid/],['Boda',/boda|matrimonio|novios|wedding|save the date|nupcial/],['Graduación',/gradua|egres/],['Aniversario',/aniversario|anniversary/],['Pésame',/pesame|condolenc|descanse|luto|q\.?e\.?p\.?d|funeb|duelo/],['Agradecimiento',/gracias|agradec|thank/],['Felicidades',/felicid|enhorabuena|congrat|logro/],['Amor',/\bamor\b|enamor|valentin|te quiero|te amo|love|amistad/],['Cumpleaños',/cumple|birthday|bday/],['Día de la Madre',/dia de la madre|\bmama\b|madre/],['Día del Padre',/dia del padre|\bpapa\b|padre/],['Navidad',/navid|christmas|ano nuevo/]];
const catDetect=f=>{const t=shopN((f.name||'')+' '+(f.desc||'')+' '+(f.cat||''));const r=CAT_RX.find(x=>x[1].test(t));return r?r[0]:null};
const catOpts=c=>{const L=[...CATS];if(c&&!L.includes(c))L.push(c);return '<option value="">Sin categoría</option>'+L.map(k=>`<option value="${esc(k)}" ${k===c?'selected':''}>${esc(k)}</option>`).join('')};
async function syncTiendaCat(f){
 if(!fbDb||!f||!f.id||!esAdmin())return false;
 const ref=fbCol('tienda_items').doc(f.id),cat=String(f.cat||'').trim();
 try{
  const cur=await ref.get();
  if(!cur.exists)return false;
  await ref.set({cat},{merge:true});
  const item=TD.items.find(x=>x.id===f.id);if(item)item.cat=cat;
  return true
 }catch(e){console.warn('Categoría de tienda:',e);return false}
}
async function catSet(id,v){const f=gf(id);if(!f)return;f.cat=v||'General';try{await tx('readwrite',s=>s.put(f))}catch(e){window._tjw&&_tjw(e)}dib();subirArchivoNube(f);await syncTiendaCat(f)}
function catAutoPrev(){const L=CL.filter(f=>!CATS.includes(f.cat));if(!L.length)return alert('Todas las tarjetas ya tienen una de las categorías de la lista.');
 const m=L.map(f=>[f,catDetect(f)]),ok=m.filter(x=>x[1]),no=m.length-ok.length,cnt={};ok.forEach(x=>cnt[x[1]]=(cnt[x[1]]||0)+1);window._catAuto=ok.map(x=>[x[0].id,x[1]]);
 $('mb').innerHTML=`<h3 style="margin-top:0">🏷 Organizar por categoría</h3><p style="font-size:13px;color:var(--gris)">Se revisó el nombre y la descripción de ${L.length} tarjeta(s) que no tienen una categoría de la lista.</p>${ok.length?`<ul style="font-size:14px;line-height:1.7">${Object.keys(cnt).map(k=>`<li><b>${esc(k)}</b>: ${cnt[k]}</li>`).join('')}</ul>`:'<div class="vacio">No se reconoció ninguna por su nombre.</div>'}${no?`<p style="font-size:13px">⚠ ${no} tarjeta(s) no se pudieron reconocer por su nombre y quedarán como están. Asígneles la categoría con el selector de cada tarjeta.</p>`:''}<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn" data-h-click="h12">Cancelar</button>${ok.length?`<button class="btn p" data-h-click="h196">✔ Aplicar a ${ok.length}</button>`:''}</div>`;$('md').classList.add('on')}
async function catAutoDo(){const a=window._catAuto||[];cerrar();const fs=[];for(const [id,c] of a){const f=gf(id);if(!f)continue;f.cat=c;try{await tx('readwrite',s=>s.put(f))}catch(e){window._tjw&&_tjw(e)}fs.push(f)}dib();alert('✔ Categoría asignada a '+fs.length+' tarjeta(s).');(async()=>{for(const f of fs){await subirArchivoNube(f);await syncTiendaCat(f)}})()}
async function ckToggle(e,id,field,label){
  const cb=e.target,f=gf(id);
  if(!cb.checked){ if(!confirm(`¿Quitar "${label}" a ${f.name}?`)){ e.preventDefault(); return false; } }
  f[field]=cb.checked; await guardar(f);
  const it=cb.closest('.it'); if(it) it.classList.toggle('sacadoIt', field==='sac'?cb.checked:f.sac);
  return true;
}
const MT={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',bmp:'image/bmp',pdf:'application/pdf'};
const rd=f=>new Promise((a,b)=>{const r=new FileReader();r.onload=()=>a(r.result);r.onerror=b;r.readAsDataURL(f)});
const jpegBlob=(c,q)=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('No se pudo crear la imagen')),'image/jpeg',q));
async function abrirImagenCatalogo(blob){try{return await createImageBitmap(blob)}catch(e){const u=URL.createObjectURL(blob);try{return await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('No se pudo leer la imagen'));i.src=u})}finally{URL.revokeObjectURL(u)}}}
async function comprimirImagenCatalogo(blob,kb=IMG_KB_DEF){const target=imgKBClamp(kb)*1024;if(!blob||blob.size<=target)return blob;const im=await abrirImagenCatalogo(blob),w=im.width||im.naturalWidth,h=im.height||im.naturalHeight;let scale=Math.min(1,2400/Math.max(w,h));try{for(let pass=0;pass<11;pass++){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);const low=await jpegBlob(c,.42);if(low.size>target){scale*=.78;continue}let min=.42,max=.97,best=low;for(let n=0;n<7;n++){const q=(min+max)/2,out=await jpegBlob(c,q);if(out.size<=target){best=out;min=q}else max=q}return best}}finally{if(im.close)im.close()}throw new Error('No se pudo ajustar la imagen al tamaño elegido')}
async function mkThumb(f,mx=720){try{if(f.type.startsWith('image/')){try{const bm=await createImageBitmap(f.blob),k=Math.min(1,mx/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);bm.close&&bm.close();return c.toDataURL('image/jpeg',.85)}catch(e){window._tjw&&_tjw(e)}const u=await rd(f.blob);return await new Promise(res=>{const i=new Image();i.onload=()=>{const k=Math.min(1,mx/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82))};i.onerror=()=>res('');i.src=u})}
 if(f.type=='application/pdf'&&window.pdfjsLib){const d=await pdfjsLib.getDocument({data:new Uint8Array(await f.blob.arrayBuffer()),isEvalSupported:false}).promise,pg=await d.getPage(1),k=mx*.78/pg.getViewport({scale:1}).width,v=pg.getViewport({scale:k}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;await pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise;return c.toDataURL('image/jpeg',.8)}}catch(e){window._tjw&&_tjw(e)}return''}
let memW=0;
const guardar=async o=>{try{await tx('readwrite',s=>s.put(o))}catch(e){memW=1}};
async function subir(fs){fs=[...fs];if(!fs.length)return;const c=$('u_cat').value.trim()||'General',pr=+$('u_pr').value||0,kb=imgTargetKB();
 for(const f of fs){let e=(f.name.match(/\.([^.]+)$/)||[])[1]||'',tipo=f.type||MT[e.toLowerCase()]||'application/octet-stream',blob=f,imgKB=null;if(/^image\//.test(tipo)){imgKB=kb;try{blob=await comprimirImagenCatalogo(f,kb);if(blob!==f){tipo='image/jpeg';e='jpg'}}catch(err){console.warn('Imagen sin comprimir:',err)}}const o={id:uid(),name:f.name.replace(/\.[^.]+$/,''),ext:e,cat:c,price:pr,desc:'',type:tipo,size:blob.size,date:new Date().toISOString(),blob,imgKB};
  o.thumb=await mkThumb(o,1200);o.tf=1;o.hq=1;await guardar(o);CL.push(o);dib();await subirArchivoNube(o)}
 if(memW)R.aviso()}
R.aviso=()=>{const a=$('av');if(a)a.style.display=memW?'block':'none'};
async function fixT(){let ch=0;for(const f of CL)if(!f.thumb&&!f.tf){f.tf=1;f.thumb=await mkThumb(f);if(f.thumb){ch=1;await guardar(f)}}if(ch)dib()}
const gf=id=>CL.find(f=>f.id==id);
async function ver(id){const f=gf(id),u=cu(f),pu=()=>CU['p_'+f.id]||(CU['p_'+f.id]=URL.createObjectURL(new Blob([f.blob],{type:'application/pdf'})));
 const hd=b=>{$('mb').innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px"><b>${esc(f.name)}</b><span><button class="btn s" data-h-click="h195" data-a-click="${_ha(id)}">⬇ Descargar</button> <button class="btn s" data-h-click="h12" aria-label="Cerrar">✕</button></span></div><div id="vb">${b}</div>`};
 hd('<div class="vacio">Cargando…</div>');$('md').classList.add('on');
 if(f.type.startsWith('image/')){let d=f.thumb;try{d=await rd(f.blob)}catch(e){window._tjw&&_tjw(e)}hd(`<img src="${d}" alt="">`)}
 else if(f.type=='application/pdf'){if(window.pdfjsLib){try{const d=await pdfjsLib.getDocument({data:new Uint8Array(await f.blob.arrayBuffer()),isEvalSupported:false}).promise;hd('');for(let n=1;n<=d.numPages;n++){const pg=await d.getPage(n),v=pg.getViewport({scale:900/pg.getViewport({scale:1}).width}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;c.style.cssText='max-width:100%;display:block;margin:0 auto 10px;border:1px solid var(--linea)';$('vb')&&$('vb').appendChild(c);await pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise}}catch(e){hd(`<iframe title="Vista previa del documento" src="${pu()}" style="width:100%;height:78vh;border:0"></iframe>`)}}else hd(`<iframe title="Vista previa del documento" src="${pu()}" style="width:100%;height:78vh;border:0"></iframe>`)}
 else if(f.type.startsWith('video/'))hd(`<video src="${u}" controls style="width:100%;max-height:78vh"></video>`);
 else if(f.type.startsWith('audio/'))hd(`<audio src="${u}" controls style="width:100%"></audio>`);
 else hd(`<div class="vacio">Este formato (${ext(f)}) no se puede previsualizar. Descárguelo para abrirlo.</div>`)}
function cerrar(){$('md').classList.remove('on');$('mb').innerHTML=''}
function desc(id){const f=gf(id),a=document.createElement('a');a.href=cu(f);a.download=f.name+(f.ext?'.'+f.ext:'');a.click()}
async function edC(id){const f=gf(id),n=prompt('Nombre:',f.name);if(n===null)return;const c=prompt('Categoría:',f.cat);if(c===null)return;const p=prompt('Precio (0 = sin precio):',f.price);if(p===null)return;const d=prompt('Descripción:',f.desc);if(d===null)return;
 Object.assign(f,{name:n.trim()||f.name,cat:c.trim()||f.cat,price:+p||0,desc:d});await tx('readwrite',s=>s.put(f));dib();subirArchivoNube(f);await syncTiendaCat(f)}
async function delF(id){if(!confirm('¿Eliminar este archivo del catálogo?'))return;await tx('readwrite',s=>s.delete(id));CL=CL.filter(f=>f.id!=id);dib();eliminarArchivoNube(id)}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function pdfToCompressedBlob(blob,maxEdge,quality){
 const data=new Uint8Array(await blob.arrayBuffer());
 const doc=await pdfjsLib.getDocument({data,isEvalSupported:false}).promise;
 const {jsPDF}=window.jspdf;let outDoc=null;
 for(let n=1;n<=doc.numPages;n++){
  const pg=await doc.getPage(n),base=pg.getViewport({scale:1}),k=Math.min(1,maxEdge/Math.max(base.width,base.height))||1,v=pg.getViewport({scale:k});
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(v.width));c.height=Math.max(1,Math.round(v.height));
  const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
  await pg.render({canvasContext:ctx,viewport:v}).promise;
  const jpeg=c.toDataURL('image/jpeg',quality),ori=c.width>=c.height?'l':'p';
  if(!outDoc)outDoc=new jsPDF({unit:'px',format:[c.width,c.height],orientation:ori});
  else outDoc.addPage([c.width,c.height],ori);
  outDoc.addImage(jpeg,'JPEG',0,0,c.width,c.height)
 }
 return outDoc.output('blob')
}
async function imgToCompressedBlob(blob,maxEdge,quality){
 let bm;try{bm=await createImageBitmap(blob)}catch(e){const u=await rd(blob);bm=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u})}
 const w=bm.width,h=bm.height,k=Math.min(1,maxEdge/Math.max(w,h))||1;
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));
 const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bm,0,0,c.width,c.height);
 if(bm.close)bm.close();
 return await new Promise(res=>c.toBlob(b=>res(b),'image/jpeg',quality))
}
async function comprimirCatalogo(){
 if(!window.pdfjsLib||!window.jspdf){alert('Para comprimir se necesita conexión a internet (usa pdf.js y jsPDF). Conéctese e intente de nuevo.');return}
 if(!confirm('Esto va a reducir el peso de los archivos grandes de su catálogo (PDF e imágenes). Se verán casi igual en pantalla, pero pierden algo de resolución si se imprimen muy grandes. Guarde sus diseños originales aparte si los necesita en máxima calidad.\n\n¿Continuar?'))return;
 const b=$('btnCompCat');if(b)b.disabled=true;
 try{
  const all=await tx('readonly',s=>s.getAll());
  const UMBRAL=1.2*1024*1024,MAXEDGE=1600,CAL=.82;
  let antes=0,despues=0,tocados=0,saltados=0,fallidos=0,i=0;
  for(const f of all){
   i++;const sz=(f.blob&&f.blob.size)||f.size||0;
   if(b)b.textContent=`Comprimiendo ${i} de ${all.length}…`;
   if(sz<UMBRAL||!f.blob){saltados++;continue}
   try{
    let nuevo=null;
    if(f.type==='application/pdf')nuevo=await pdfToCompressedBlob(f.blob,MAXEDGE,CAL);
    else if(f.type.startsWith('image/'))nuevo=await imgToCompressedBlob(f.blob,MAXEDGE,CAL);
    else{saltados++;continue}
    if(nuevo&&nuevo.size<sz*0.85){
     antes+=sz;despues+=nuevo.size;tocados++;
     f.blob=nuevo;f.size=nuevo.size;
     try{f.thumb=await mkThumb(f)}catch(e){window._tjw&&_tjw(e)}
     await guardar(f);subirArchivoNube(f)
    }else saltados++
   }catch(e){fallidos++}
  }
  CL=await tx('readonly',s=>s.getAll());dib();
  const mb=n=>(n/1024/1024).toFixed(1);
  alert('Compresión terminada.\nArchivos comprimidos: '+tocados+'\nSin cambios: '+saltados+(fallidos?'\nCon error: '+fallidos:'')+(tocados?'\nPeso: '+mb(antes)+' MB → '+mb(despues)+' MB (ahorro '+(100-despues/antes*100).toFixed(0)+'%)':''))
 }catch(e){alert('No se pudo comprimir el catálogo: '+((e&&e.message)||e))}
 if(b){b.disabled=false;b.textContent='🗜 Comprimir catálogo'}
}
async function expCatBackup(){
 const b=$('btnExpCat');if(!window.JSZip){alert('No se pudo cargar el generador de ZIP. Verifique su conexión a internet e intente de nuevo.');return}
 if(b){b.disabled=true;b.textContent='Preparando…'}
 try{
  const all=await tx('readonly',s=>s.getAll());
  if(!all.length){alert('El catálogo está vacío, no hay nada que respaldar.');if(b){b.disabled=false;b.textContent='⬇ Respaldo del catálogo'}return}
  const CAP=35*1024*1024,lotes=[];let actual=[],peso=0;
  for(const f of all){
   const sz=(f.blob&&f.blob.size)||f.size||0;
   if(actual.length&&peso+sz>CAP){lotes.push(actual);actual=[];peso=0}
   actual.push(f);peso+=sz
  }
  if(actual.length)lotes.push(actual);
  for(let li=0;li<lotes.length;li++){
   if(b)b.textContent=`Parte ${li+1} de ${lotes.length}…`;
   const zip=new JSZip(),meta=[];
   for(const f of lotes[li]){
    const m=Object.assign({},f);delete m.blob;
    if(f.blob){const fn='files/'+f.id+'.bin';zip.file(fn,f.blob);m.blobFile=fn;m.blobType=f.blob.type||f.type}
    meta.push(m)
   }
   zip.file('manifest.json',JSON.stringify({app:'tj_cat_backup',v:2,parte:li+1,partes:lotes.length,exportedAt:new Date().toISOString(),items:meta}));
   const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
   const suf=lotes.length>1?`_parte${li+1}de${lotes.length}`:'';
   dlBlob(blob,`catalogo_tarjeteria_jhon${suf}.zip`);
   if(li<lotes.length-1)await sleep(600)
  }
  if(lotes.length>1)alert(`Se generaron ${lotes.length} archivos .zip (el catálogo es muy grande para uno solo). Si su navegador bloqueó alguna descarga después de la primera, permita "descargas múltiples" para este sitio y toque el botón de nuevo. Guarde los ${lotes.length} archivos juntos; se necesitan todos para restaurar el catálogo completo.`);
 }catch(e){alert('No se pudo generar el respaldo del catálogo: '+((e&&e.message)||e))}
 if(b){b.disabled=false;b.textContent='⬇ Respaldo del catálogo'}
}

/* ===== Descargar todos los modelos del catálogo como imágenes (JPG o PNG) =====
   Respeta la categoría y la búsqueda que estén activas. Las imágenes se convierten al formato elegido
   (las que ya están en ese formato se guardan tal cual, sin perder calidad); los PDF se convierten
   página por página; videos y otros archivos se omiten. Todo sale en un .zip ordenado por categoría. */
async function _imgConv(blob,fmt){
 const want=fmt==='png'?'image/png':'image/jpeg';
 if(blob.type===want)return blob;
 const url=URL.createObjectURL(blob);
 try{
  const im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('imagen no válida'));i.src=url});
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');
  if(fmt!=='png'){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}
  g.drawImage(im,0,0);
  return await new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('no se pudo convertir')),want,.93))
 }finally{URL.revokeObjectURL(url)}
}
async function _pdfImgs(blob,fmt){
 const want=fmt==='png'?'image/png':'image/jpeg',out=[];
 const d=await pdfjsLib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false}).promise;
 for(let n=1;n<=d.numPages;n++){
  const pg=await d.getPage(n),w0=pg.getViewport({scale:1}).width,v=pg.getViewport({scale:Math.min(3,Math.max(1,1800/w0))}),c=document.createElement('canvas');
  c.width=Math.round(v.width);c.height=Math.round(v.height);const g=c.getContext('2d');
  if(fmt!=='png'){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}
  await pg.render({canvasContext:g,viewport:v}).promise;
  out.push(await new Promise(ok=>c.toBlob(ok,want,.93)))
 }
 return out
}
async function descTodoImg(fmt){
 const bid=fmt==='png'?'btnImgP':'btnImgJ',b=$(bid),lbl=b?b.textContent:'';
 if(!window.JSZip){alert('No se pudo cargar el generador de ZIP. Verifique su conexión a internet e intente de nuevo.');return}
 const q=(cq||'').toLowerCase(),L=CL.filter(f=>(!cc||f.cat==cc)&&(f.name+' '+f.desc).toLowerCase().includes(q)&&f.blob);
 if(!L.length){alert('No hay modelos para descargar con el filtro actual.');return}
 const nImg=L.filter(f=>(f.type||'').startsWith('image/')||f.type==='application/pdf').length;
 if(!nImg){alert('Ninguno de los archivos del filtro actual es imagen ni PDF.');return}
 if(!confirm('Se descargarán '+nImg+' modelo(s) en formato '+fmt.toUpperCase()+(cc?' de la categoría «'+cc+'»':'')+', en un archivo .zip ordenado por categoría.'+(L.length>nImg?'\n('+(L.length-nImg)+' archivo(s) que no son imagen ni PDF se omiten.)':'')+'\n\n¿Continuar?'))return;
 document.querySelectorAll('#btnImgJ,#btnImgP').forEach(x=>x.disabled=true);
 const used=new Set(),clean=t=>String(t||'').normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'sin nombre';
 const CAP=40*1024*1024,lotes=[];let cur=[],peso=0,hechos=0,fallos=[];
 try{
  for(const f of L){
   const isPdf=f.type==='application/pdf',isImg=(f.type||'').startsWith('image/');if(!isPdf&&!isImg)continue;
   if(b)b.textContent='Procesando '+(++hechos)+' de '+nImg+'…';
   let blobs;
   try{blobs=isPdf?(window.pdfjsLib?await _pdfImgs(f.blob,fmt):null):[await _imgConv(f.blob,fmt)];if(!blobs)throw new Error('lector de PDF no disponible')}
   catch(e){fallos.push(f.name);continue}
   const dir=clean(f.cat||'Sin categoría'),base=clean(f.name);
   blobs.forEach((bl,i)=>{
    let nm=dir+'/'+base+(blobs.length>1?' - pág '+(i+1):''),k=nm,n=2;while(used.has(k.toLowerCase()))k=nm+' ('+n++ +')';used.add(k.toLowerCase());
    if(cur.length&&peso+bl.size>CAP){lotes.push(cur);cur=[];peso=0}
    cur.push([k+'.'+fmt,bl]);peso+=bl.size})
   if(hechos%5===0)await sleep(0)
  }
  if(cur.length)lotes.push(cur);
  if(!lotes.length){alert('No se pudo convertir ningún archivo.');return}
  for(let li=0;li<lotes.length;li++){
   if(b)b.textContent='Empaquetando '+(li+1)+' de '+lotes.length+'…';
   const zip=new JSZip();lotes[li].forEach(([n,bl])=>zip.file(n,bl));
   const out=await zip.generateAsync({type:'blob',compression:'STORE'}),suf=lotes.length>1?'_parte'+(li+1)+'de'+lotes.length:'';
   dlBlob(out,'modelos_'+fmt+(cc?'_'+clean(cc).replace(/ /g,'-'):'')+suf+'.zip');
   if(li<lotes.length-1)await sleep(700)
  }
  alert('✔ Listo: '+(hechos-fallos.length)+' modelo(s) en '+fmt.toUpperCase()+(lotes.length>1?' en '+lotes.length+' archivos .zip (si el navegador bloqueó alguno, permita «descargas múltiples» y repita).':'.')+(fallos.length?'\n\nNo se pudieron convertir '+fallos.length+': '+fallos.slice(0,8).join(', ')+(fallos.length>8?'…':''):''))
 }catch(e){alert('No se pudo generar la descarga: '+((e&&e.message)||e))}
 finally{document.querySelectorAll('#btnImgJ,#btnImgP').forEach(x=>x.disabled=false);if(b)b.textContent=lbl}
}
async function impCatFile(input){
 const files=[...input.files];if(!files.length)return;
 if(!window.JSZip){alert('No se pudo cargar el lector de ZIP. Verifique su conexión a internet e intente de nuevo.');input.value='';return}
 let n=0,errores=[];
 for(const file of files){
  try{
   const zip=await JSZip.loadAsync(file);
   const mf=zip.file('manifest.json');
   if(!mf)throw new Error('falta manifest.json');
   const payload=JSON.parse(await mf.async('string'));
   if(payload.app!=='tj_cat_backup'||!Array.isArray(payload.items))throw new Error('formato no reconocido');
   for(const it of payload.items){
    const o=Object.assign({},it);
    if(o.blobFile){const zf=zip.file(o.blobFile);if(zf){o.blob=await zf.async('blob');if(o.blobType)o.blob=new Blob([o.blob],{type:o.blobType})}delete o.blobFile;delete o.blobType}
    await guardar(o);n++;subirArchivoNube(o)
   }
  }catch(e){errores.push(file.name+': '+((e&&e.message)||e))}
 }
 CL=await tx('readonly',s=>s.getAll());dib();R.aviso();
 let msg='Catálogo importado: '+n+' archivo(s).';
 if(errores.length)msg+='\n\nNo se pudieron leer:\n'+errores.join('\n');
 alert(msg);
 input.value=''
}
function facC(id){const f=gf(id);items=items.filter(i=>i.d);items.push({d:f.name,q:1,p:f.price});ir('nueva')}
async function impCat(){try{await impCat0()}catch(e){cerrar();alert('No se pudo generar el catálogo: '+((e&&e.message)||e))}}
async function impCat0(){const q=cq.toLowerCase(),l=CL.filter(f=>f.thumb&&(!cc||f.cat==cc)&&(f.name+' '+f.desc).toLowerCase().includes(q)).sort((a,b)=>a.date.localeCompare(b.date));if(!l.length)return alert('No hay imágenes o PDF con vista previa para el catálogo con el filtro actual.');
 $('mb').innerHTML='<div class="vacio">Preparando el catálogo… <b id="pgs"></b></div>';$('md').classList.add('on');const pend=l.filter(f=>!f.hq);for(let i=0;i<pend.length;i+=4)await Promise.all(pend.slice(i,i+4).map(async f=>{const t=await mkThumb(f,1200);if(t)f.thumb=t;f.hq=1;await guardar(f);const g=$('pgs');if(g)g.textContent=Math.min(i+4,pend.length)+' de '+pend.length}));
 const c=DB.cfg,yr=new Date().getFullYear(),LG=document.querySelector('.logo img').src,G={};for(const f of l)(G[f.cat]=G[f.cat]||[]).push(f);
 const cats=Object.keys(G).sort(),ct=`${esc(c.tel)} · ${esc(c.email)} · ${esc(c.dir)}`;let pg=3,idx='',pp='';
 cats.forEach(k=>{const a=G[k],n=Math.ceil(a.length/2);idx+=`<div class="ir"><b>${esc(k)}</b><span>${a.length} MODELO${a.length>1?'S':''}</span><i></i><em>${pg}</em></div>`;
  for(let x=0;x<n;x++){pp+=`<div class="pg"><div class="bar"></div><div class="hdr"><span>Catálogo ${yr}</span><img alt="" src="${LG}"><span>${esc(k)}</span></div><div class="body"><div class="ct2"><span>${esc(k)}</span><small>${a.length} MODELO${a.length>1?'S':''}${n>1?' · '+(x+1)+'/'+n:''}</small></div>${(()=>{const m=Math.min(2,a.length-x*2);return `<div class="gd2" style="${m==1?'grid-template-rows:minmax(0,105mm)':''}">`})()}${a.slice(x*2,x*2+2).map(f=>`<div class="cd"><div class="im"><img alt="" src="${f.thumb}"></div><div class="tx"><i class="ml">MODELO</i><div class="row"><span class="cdg mod">${esc(f.name).toUpperCase()}</span>${f.price?`<div class="pr">${$$(f.price)}</div>`:''}</div>${f.desc?`<p>${esc(f.desc)}</p>`:''}</div></div>`).join('')}</div></div><div class="ftr"><span>${esc(c.nombre)}</span><span>${ct}</span><span>${pg}</span></div></div>`;pg++}});
 const h=`<div class="cv"><div class="pg cover"><div class="bar"></div><div class="cov-top"><span>${esc(c.nombre).toUpperCase()}</span><span>COLECCIÓN ${yr}</span></div><div class="cov-mid"><img class="big" alt="" src="${LG}"><h1>Catálogo<br>de Productos</h1><div class="sb2">Tarjetas para toda ocasión</div><div class="rl"></div></div><div class="cov-band"><div><small>TELÉFONO</small><span>${esc(c.tel)}</span></div><div><small>CORREO</small><span>${esc(c.email)}</span></div><div><small>UBICACIÓN</small><span>${esc(c.dir)}</span></div></div><div class="bar"></div></div>
 <div class="pg"><div class="bar"></div><div class="hdr"><span>Catálogo ${yr}</span><img alt="" src="${LG}"><span>Contenido</span></div><div class="ix"><h2>Contenido</h2>${idx}</div></div>${pp}
 <div class="pg back"><div class="bar"></div><div class="cvb"><div class="lgo"><img alt="" src="${LG}"></div><h1>Gracias por<br>confiar en nosotros</h1><div class="rl" style="background:#fff"></div><div class="ci" style="margin-top:10mm">${esc(c.tel)}<br>${esc(c.email)}<br>${esc(c.dir)}${c.yappy?'<br>Yappy: '+esc(c.yappy):''}</div></div></div></div>`;
 window._cath=h;$('prt').innerHTML=h;$('mb').innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap;position:sticky;top:-14px;z-index:2;background:var(--card);padding:6px 0"><b>Vista previa del catálogo · ${l.length} modelo${l.length>1?'s':''}</b><span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn p s" id="bpdf" data-h-click="h194">⬇ Descargar PDF</button> <button class="btn s" data-h-click="h193">📱 WhatsApp</button> <button class="btn s" data-h-click="h192">🖨 Imprimir</button> <button class="btn s" data-h-click="h12" aria-label="Cerrar">✕</button></span></div><div class="pv">${h}</div>`;$('md').classList.add('on');fitPv()}

async function buildCatBlob(onprog){const x=document.createElement('div');x.style.cssText='position:fixed;left:-10000px;top:0;width:8.5in';x.innerHTML=window._cath;document.body.appendChild(x);
 await (document.fonts&&document.fonts.ready);await Promise.all([...x.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));
 const pgs=[...x.querySelectorAll('.pg')],doc=new jspdf.jsPDF({unit:'in',format:'letter',orientation:'portrait'});
 for(let i=0;i<pgs.length;i++){if(onprog)onprog(i+1,pgs.length);await new Promise(r=>setTimeout(r,30));
  const c=await html2canvas(pgs[i],{scale:2.5,useCORS:true,backgroundColor:'#ffffff',logging:false});
  if(i)doc.addPage('letter','portrait');doc.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,8.5,11)}
 x.remove();return {blob:doc.output('blob'),name:'Catalogo_'+(DB.cfg.nombre||'Tarjeteria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'_')+'_'+new Date().getFullYear()+'.pdf'}}
async function pdfCat(){const b=$('bpdf');if(!window.html2canvas||!window.jspdf){alert('Para generar el PDF directo se necesita conexión a internet. Se abrirá la impresión: elija "Guardar como PDF".');return pcat()}
 const t=b.textContent;b.disabled=true;
 try{const {blob,name}=await buildCatBlob((i,n)=>b.textContent='Generando '+i+' de '+n+'…');dlBlob(blob,name)}
 catch(e){alert('No se pudo generar el PDF: '+((e&&e.message)||e))}
 b.disabled=false;b.textContent=t}
async function shareCat(btn){if(!window.html2canvas||!window.jspdf)return alert('Para compartir el catálogo se necesita conexión a internet.');
 const t=btn.textContent;btn.disabled=true;
 try{const {blob,name}=await buildCatBlob((i,n)=>btn.textContent='Preparando '+i+' de '+n+'…');
  const c=DB.cfg,text=`Catálogo de tarjetas — ${esc(c.nombre)}\n${esc(c.tel)} · ${esc(c.email)}`,file=new File([blob],name,{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],title:name,text});
  else{dlBlob(file,name);window.open('https://wa.me/?text='+encodeURIComponent(text+'\n\n(Se descargó el PDF — adjúntelo manualmente en WhatsApp)'),'_blank','noopener,noreferrer')}
 }catch(e){if(e&&e.name!=='AbortError')alert('No se pudo compartir: '+((e&&e.message)||e))}
 btn.disabled=false;btn.textContent=t}
function fitPv(){const p=document.querySelector('.pv');if(!p)return;p.style.zoom=1;p.style.zoom=Math.min(1,(p.clientWidth-16)/816)}
window.addEventListener('resize',fitPv);
async function pcat(){await Promise.all([...$('prt').querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));print()}
async function precargarCatalogoDeFabrica(){
 try{
  const existentes=await tx('readonly',s=>s.getAll());
  if(existentes.length)return;
  if(!window.JSZip)return;
  const res=await fetch('catalogo_default.zip');
  if(!res.ok)return;
  const buf=await res.arrayBuffer();
  const zip=await JSZip.loadAsync(buf);
  const mf=zip.file('manifest.json');if(!mf)return;
  const payload=JSON.parse(await mf.async('string'));
  if(payload.app!=='tj_cat_backup'||!Array.isArray(payload.items))return;
  for(const it of payload.items){
   const o=Object.assign({},it);
   if(o.blobFile){const zf=zip.file(o.blobFile);if(zf){o.blob=await zf.async('blob');if(o.blobType)o.blob=new Blob([o.blob],{type:o.blobType})}delete o.blobFile;delete o.blobType}
   await guardar(o)
  }
  if(vista==='cat'){CL=await tx('readonly',s=>s.getAll());dib()}
 }catch(e){window._tjw&&_tjw(e)}
}
/* El catálogo de fábrica (catalogo_default.zip) son los modelos de Tarjetería Jhon: solo se precarga en la empresa inicial; una empresa nueva empieza con el catálogo vacío. */
if(TJEmpresa.empEsInicial()&&!/[?&]tienda(=|&|$)/.test(location.search))precargarCatalogoDeFabrica();

/* ===== TJ LIVE: centro de preparación para TikTok LIVE =====
   Esta capa NO afirma emitir ni leer eventos de TikTok. Hasta verificar acceso oficial,
   los datos LIVE reales permanecen desconectados y no se muestran métricas inventadas. */
const TJLIVE_KEY='tj_tiktok_live_draft_v1';
function tjLiveLoad(){
 try{return Object.assign({title:'',topic:'',promo:'',discount:'',productId:'',script:'',platform:'TikTok LIVE',updatedAt:0},JSON.parse(localStorage.getItem(lsk(TJLIVE_KEY))||'{}'))}
 catch(e){return {title:'',topic:'',promo:'',discount:'',productId:'',script:'',platform:'TikTok LIVE',updatedAt:0}}
}
function tjLiveSaveDraft(){
 const d={title:($('tjl_title')||{}).value||'',topic:($('tjl_topic')||{}).value||'',
  promo:($('tjl_promo')||{}).value||'',discount:($('tjl_discount')||{}).value||'',
  productId:($('tjl_product')||{}).value||'',script:($('tjl_script')||{}).value||'',
  platform:'TikTok LIVE',updatedAt:Date.now()};
 try{localStorage.setItem(lsk(TJLIVE_KEY),JSON.stringify(d));const e=$('tjl_status');if(e)e.textContent='Borrador guardado en este dispositivo · '+new Date(d.updatedAt).toLocaleString('es-PA');return true}
 catch(e){const x=$('tjl_status');if(x)x.textContent='No se pudo guardar en este navegador. Copia el guion antes de salir.';return false}
}
function tjLiveProductOptions(selected){
 const ps=Array.isArray(DB.prod)?DB.prod:[];
 return '<option value="">Sin producto seleccionado</option>'+ps.map((p,i)=>{
  const id=String(p.id||('p'+i)),name=String(p.n||p.nombre||'Producto'),price=Number(p.p||p.precio||0);
  return '<option value="'+esc(id)+'" '+(id===selected?'selected':'')+'>'+esc(name)+' · '+esc($$(price))+'</option>'
 }).join('');
}
function tjLiveScript(){
 const d={title:($('tjl_title')||{}).value||'',topic:($('tjl_topic')||{}).value||'',
  promo:($('tjl_promo')||{}).value||'',discount:($('tjl_discount')||{}).value||'',
  productId:($('tjl_product')||{}).value||''};
 const p=(DB.prod||[]).find((x,i)=>String(x.id||('p'+i))===d.productId);
 const product=p?String(p.n||p.nombre||'Producto'):'nuestros productos';
 const price=p?$$(Number(p.p||p.precio||0)):'precio disponible en el catálogo';
 const script=[
  '¡Hola! Bienvenidos al LIVE de '+nombreNegocio()+'.',
  d.topic?'Hoy vamos a mostrar: '+d.topic+'.':'Hoy les mostraremos nuestros productos y cómo hacer sus pedidos.',
  'Producto destacado: '+product+'. Precio de referencia: '+price+'.',
  d.promo?'Promoción: '+d.promo+(d.discount?' · '+d.discount:'')+'.':'Pregunten en el chat por las promociones vigentes.',
  'Para comprar, comenta o escríbenos por los canales oficiales del negocio. Confirmaremos disponibilidad, precio final y factura antes de cerrar el pedido.',
  '¡Gracias por acompañarnos y compartir la transmisión!'
 ].join('\n\n');
 const e=$('tjl_script');if(e)e.value=script;
 tjLiveSaveDraft();
}
function tjLiveOpen(url){window.open(url,'_blank','noopener,noreferrer')}
R.tiktoklive=function(){
 const d=tjLiveLoad(),v=$('v');if(!v)return;
 v.innerHTML=`
 <div class="card">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
   <div><div class="bd">CENTRO DE TRANSMISIONES</div><h3 style="font-size:22px;margin:12px 0 6px">TikTok LIVE · ${esc(nombreNegocio())}</h3>
   <p style="color:var(--gris);margin:0;max-width:680px">Prepara tus ventas, promociones y guion desde el panel. La emisión y los datos en tiempo real se activarán únicamente cuando se confirme el acceso compatible de tu cuenta.</p></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn p" data-h-click="h363" style="display:inline-flex;align-items:center;gap:8px;background:#000;color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.35)"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .61.05.9.15V9.35a6.34 6.34 0 0 0-.9-.07 6.34 6.34 0 0 0-6.34 6.34 6.35 6.35 0 0 0 6.34 6.35 6.34 6.34 0 0 0 6.35-6.35V7.95a8.21 8.21 0 0 0 4.76 1.5v-3.45a4.76 4.76 0 0 1-1-.69z"/></svg> Abrir TikTok</button>
    <button class="btn" data-h-click="h364">Abrir LIVE Studio</button>
   </div>
  </div>
 </div>
 <div class="kp">
  <div class="card"><small>Estado de emisión</small><b style="font-size:20px">No conectado</b><p style="font-size:12px;color:var(--gris)">Requiere verificar acceso a LIVE</p></div>
  <div class="card"><small>Chat en tiempo real</small><b style="font-size:20px">Pendiente</b><p style="font-size:12px;color:var(--gris)">Sin conexión autorizada</p></div>
  <div class="card"><small>Regalos y seguidores</small><b style="font-size:20px">Pendiente</b><p style="font-size:12px;color:var(--gris)">No se inventan métricas</p></div>
  <div class="card"><small>Ventas atribuidas al LIVE</small><b style="font-size:20px">Por configurar</b><p style="font-size:12px;color:var(--gris)">Se vincularán con facturas reales</p></div>
 </div>
 <div class="card">
  <h3>Preparar una transmisión</h3>
  <div class="g">
   <div><label for="tjl_title">Título del LIVE</label><input id="tjl_title" maxlength="90" value="${esc(d.title)}" placeholder="Ej. Ofertas de tarjetas y detalles"></div>
   <div><label for="tjl_topic">Contenido preparado</label><input id="tjl_topic" maxlength="180" value="${esc(d.topic)}" placeholder="Qué vas a mostrar o explicar"></div>
   <div><label for="tjl_product">Producto destacado del catálogo</label><select id="tjl_product">${tjLiveProductOptions(d.productId)}</select></div>
   <div><label for="tjl_promo">Nombre/código de promoción</label><input id="tjl_promo" maxlength="80" value="${esc(d.promo)}" placeholder="Ej. LIVEJHON"></div>
   <div><label for="tjl_discount">Condiciones de la promoción</label><input id="tjl_discount" maxlength="120" value="${esc(d.discount)}" placeholder="Descuento, vigencia o condiciones"></div>
  </div>
  <div style="margin-top:14px"><label for="tjl_script">Guion de la transmisión</label><textarea id="tjl_script" rows="9" maxlength="6000" placeholder="Prepara aquí tu presentación, demostración, oferta y llamada a la acción">${esc(d.script)}</textarea></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
   <button class="btn p" data-h-click="h360">Guardar borrador</button>
   <button class="btn" data-h-click="h361">Generar guion inicial</button>
   <button class="btn" data-h-click="h362">Copiar guion</button>
   <button class="btn" data-h-click="h355">Ir a facturación</button>
  </div>
  <p id="tjl_status" role="status" style="font-size:12px;color:var(--gris);margin-bottom:0">${d.updatedAt?'Borrador local · '+new Date(d.updatedAt).toLocaleString('es-PA'):'El borrador se guarda en este navegador, no se sincroniza todavía con otros dispositivos.'}</p>
 </div>
 <div class="card">
  <h3>Panel de datos en tiempo real</h3>
  <p style="color:var(--gris)">Esta sección queda preparada para integrar comentarios, nuevos seguidores, regalos y estadísticas reales cuando se confirme una API, integración o herramienta autorizada por TikTok. No introduzcas contraseñas, cookies ni claves de sesión en este panel.</p>
  <div class="g">
   <div><label>Comentarios</label><div class="bd">Sin fuente de datos</div></div>
   <div><label>Nuevos seguidores</label><div class="bd">Sin fuente de datos</div></div>
   <div><label>Regalos recibidos</label><div class="bd">Sin fuente de datos</div></div>
   <div><label>Visualizaciones / likes</label><div class="bd">Sin fuente de datos</div></div>
  </div>
 </div>
 <div class="card">
  <h3>Antes de habilitar la emisión</h3>
  <ol style="line-height:1.8;color:var(--gris)">
   <li>Confirmar que la cuenta puede iniciar LIVE y usar LIVE Studio en computadora.</li>
   <li>Comprobar qué integraciones y permisos oficiales están disponibles para esa cuenta y región.</li>
   <li>Si se necesita backend, guardar tokens solo en servidor y validar autorización en Firebase; nunca incluir secretos en el JavaScript del navegador.</li>
   <li>Probar en entorno controlado antes de vincular eventos con clientes, pedidos y facturas.</li>
  </ol>
 </div>`;
};

// ===== Usuarios, PIN y permisos por panel =====
V.push(['vend','🧑‍💼','Vendedores']);V.push(['mapa','🗺️','Mapa de clientes']);V.push(['gal','📷','Galería']);V.push(['chat','💬','Chat']);V.push(['tienda','🛍','Tienda virtual']);V.push(['tiktoklive','📡','TikTok LIVE']);V.push(['empresas','🏢','Empresas']);V.push(['marketing','🎨','Marketing']);
/* Multiempresa (Fases 3-5): la vista la renderiza js/empresas.js; solo administración,
   igual que config/vend/mapa. El flujo de datos del panel no cambia (MULTIEMP=false). */
R.empresas=empresasRender;
/* Marketing Studio (plan maestro v1): la vista la renderiza js/marketing.js con el
   motor js/mkt-editor.js. Visible para administración y para vendedores con el
   panel «Marketing» activado; los datos van por empresa (fbCol) y las reglas
   aíslan por empresas/{eid}/miembros. */
R.marketing=marketingRender;
const PANELES=V.filter(v=>v[0]!=='config'&&v[0]!=='vend'&&v[0]!=='mapa'&&v[0]!=='empresas'),SK='tj_sess';
let SES=null,_authMode='',_fail=0,_lock=0;
const usuarios=()=>DB.cfg.users||(DB.cfg.users=[]);
const esAdmin=()=>!!SES&&SES.id==='admin';
window.__panelBridge=()=>({db:fbDb?new Proxy(fbDb,{get(t,p){if(p==='collection')return n=>fbCol(n);const v=t[p];return typeof v==='function'?v.bind(t):v}}):fbDb,admin:esAdmin(),col:fbCol});
const usr=()=>SES&&!esAdmin()?SES.u:null;
const puede=k=>esAdmin()||(!!usr()&&k!=='config'&&k!=='vend'&&k!=='mapa'&&k!=='empresas'&&(usr().panels||[]).includes(k));
const _no=navOrd;navOrd=()=>_no().filter(v=>puede(v[0]));
const _ir=ir;ir=function(v){if(!SES)return;if(!puede(v)){const f=navOrd().find(x=>puede(x[0]));if(!f)return;v=f[0]}return _ir(v)};
const esVend=()=>!!SES&&!esAdmin();
['delFac','anular','delE','addP','delP','editP','delC','editC','edC','delF','delUbi','agDel','comprimirCatalogo','expCatBackup','repPDF','facPDF','exportUbiCSV','agIcs','respaldo'].forEach(n=>{const o=window[n];if(typeof o!=='function')return;window[n]=function(){if(esVend()){alert('Su usuario no tiene permiso para esta acción.');return}return o.apply(this,arguments)}});
/* Catálogo: un vendedor puede ver, descargar y compartir; subir, editar, categorizar,
   comprimir, respaldar, importar y eliminar quedan solo para administración. dlBlob solo
   se permite mientras corre una de las acciones de descarga/compartir del catálogo. */
{const o=window.dlBlob;window.dlBlob=function(){if(esVend()&&!window._catDl){alert('Su usuario no tiene permiso para esta acción.');return}return o.apply(this,arguments)}}
['pdfCat','shareCat','descTodoImg'].forEach(n=>{const o=window[n];if(typeof o!=='function')return;window[n]=function(){window._catDl=(window._catDl||0)+1;let r;try{r=o.apply(this,arguments)}catch(e){window._catDl--;throw e}return Promise.resolve(r).finally(()=>{window._catDl--})}});
['catSet','ckToggle','catAutoPrev','catAutoDo'].forEach(n=>{const o=window[n];if(typeof o!=='function')return;window[n]=function(){if(esVend()){alert('Su usuario no tiene permiso para modificar el catálogo.');return}return o.apply(this,arguments)}});
const _af=agForm;agForm=function(id){if(id&&esVend()){alert('Su usuario no tiene permiso para editar.');return}return _af.apply(this,arguments)};
function waNum(t){for(const p of String(t||'').split(/[\/,;|]| y /)){let d=p.replace(/\D/g,'');if(!d)continue;if(d.startsWith('00'))d=d.slice(2);if(d.length===7||d.length===8)d='507'+d;if(d.length>=10&&d.length<=15)return d}return ''}
const waBtn=c=>waNum(c.t)?`<button class="btn s wa" data-h-click="h191" data-a-click="${_ha(c.id)}">💬 WhatsApp</button> `:'';
function waCli(id){const c=DB.cli.find(x=>x.id==id),n=c&&waNum(c.t);if(!n)return alert('No se detectó un número de teléfono válido para este cliente.');window.open('https://wa.me/'+n+'?text='+encodeURIComponent('Hola '+c.n+', le escribimos de '+nombreNegocio()+'. '),'_blank','noopener,noreferrer')}
// --- Recuperación de cuenta del administrador por correo ---
const recDest=()=>{const d=DB.cfg.dests||[];return d.find(x=>x.id===DB.cfg.recId)||d[0]||null};
const maskMail=m=>{const p=String(m).split('@');return p[0].slice(0,1)+'***@'+p[1]};
const recBadge=d=>'';const _recBadgeOld=d=>{const r=recDest();return r&&r.id===d.id?'<small style="color:var(--az);font-weight:700">🔑 Correo de recuperación</small>':`<button class="btn s" data-h-click="h190" data-a-click="${_ha(d.id)}">🔑 Usar para recuperar cuenta</button>`};
function setRec(id){DB.cfg.recId=id;save();renderE()}
const recList=()=>{const r=DB.cfg.recMails||[];if(r.length)return r;const d=recDest();return d?[d.m]:[]};
// --- Tarjeta "Recuperación de cuenta" en Configuración (solo admin) ---
function recCard(){const L=DB.cfg.recMails||[];return `<h3 style="margin:0">🔑 Recuperación de cuenta</h3><p style="font-size:12.5px;color:var(--gris)">Si olvida su PIN de administrador, el enlace de recuperación se envía a estos correos. Puede agregar uno o varios.</p><div class="g" style="margin:8px 0 10px"><div><label>Correo de recuperación</label><input id="rc_m" type="email" placeholder="correo@ejemplo.com"></div></div><button class="btn p s" data-h-click="h189">+ Agregar correo</button><div style="margin-top:12px">${L.length?L.map((m,i)=>`<div class="dl"><span><b>${esc(m)}</b></span><button class="btn s d" data-h-click="h188" data-a-click="${_ha(i)}">Eliminar</button></div>`).join(''):'<div class="vacio">Aún no hay correos de recuperación.</div>'}</div>`}
function recAdd(){const m=$('rc_m').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(m))return alert('Ingrese un correo válido.');const L=DB.cfg.recMails||(DB.cfg.recMails=[]);if(!L.includes(m))L.push(m);save();R.config()}
function recDel(i){if(!confirm('¿Quitar este correo de recuperación?'))return;(DB.cfg.recMails||[]).splice(i,1);save();R.config()}
const _configBase=R.config;
// --- Cierre de sesión por inactividad (configurable por el administrador) ---
function sesCard(){const m=+(DB.cfg.sesionMin||0);const op=[0,5,10,15,30,60,120];return `<h3 style="margin:0">⏱ Cierre de sesión por inactividad</h3><p style="font-size:12.5px;color:var(--gris)">Si deja el panel abierto sin tocarlo (como administrador o como vendedor), la sesión se cerrará sola pasado este tiempo. Use 0 para desactivarlo.</p><div class="g" style="margin:8px 0 6px"><div><label>Minutos de inactividad</label><select id="ses_m" data-h-change="h187">${op.map(n=>`<option value="${n}" ${n===m?'selected':''}>${n===0?'Nunca (desactivado)':n+' minutos'}</option>`).join('')}</select></div></div><p style="font-size:11.5px;color:var(--gris)">${m>0?'✅ Activo: la sesión se cerrará tras '+m+' min. sin actividad.':'⛔ Desactivado: la sesión no se cierra sola.'}</p>`}
function sesSet(v){DB.cfg.sesionMin=Math.max(0,Math.round(+v||0));save();idleArm();R.config()}

// --- Copia de seguridad completa (clientes, facturas, productos, catálogo, agenda, config) ---
// Guarda TODO lo que hay en DB (lo mismo que se sincroniza a Firebase) en un archivo .json que
// el dueño del negocio puede guardar donde quiera. Si algo falla en Firebase o se borra algo por
// accidente, este archivo permite volver a cargar los datos.
function bkCard(){return `<h3 style="margin:0">💾 Copia de seguridad</h3><p style="font-size:12.5px;color:var(--gris)">Descargue un respaldo de todos sus datos (clientes, facturas, productos, catálogo, agenda y configuración) para guardarlo aparte. Hágalo de vez en cuando, sobre todo antes de cambios grandes.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn p" data-h-click="h186">⬇ Descargar copia de seguridad</button><button class="btn" data-h-click="h185">⬆ Restaurar desde una copia</button></div><input id="bk_f" type="file" accept="application/json" hidden data-h-change="h184"><p id="bk_m" style="font-size:11.5px;color:var(--gris);margin-top:6px"></p>`}
function bkExport(){try{const payload={app:'tarjeteria-jhon',tipo:'backup',fecha:new Date().toISOString(),data:DB};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='respaldo-'+(DB.cfg.nombre||'tarjeteria').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}catch(e){alert('No se pudo generar la copia de seguridad.')}}
async function bkImport(file){const m=t=>{const e=$('bk_m');if(e)e.textContent=t};if(!file)return;
 if(!confirm('Esto va a REEMPLAZAR todos los datos actuales del panel (clientes, facturas, productos, etc.) por los del archivo de respaldo. Esta acción no se puede deshacer.\n\n¿Está seguro de que quiere continuar?')){$('bk_f').value='';return}
 try{
  const txt=await file.text();const json=JSON.parse(txt);const data=(json&&json.data)?json.data:json;
  if(!data||typeof data!=='object'||!Array.isArray(data.cli)||!Array.isArray(data.fac))throw new Error('formato');
  DB=data;save();m('✅ Copia restaurada. Recargando…');setTimeout(()=>location.reload(),900)
 }catch(e){m('⚠ No se pudo leer ese archivo. Asegúrese de que sea una copia de seguridad generada por este mismo panel.')}
 $('bk_f').value=''}
let _idleTimer=null,_idleLast=Date.now(),_idleArmed=0,_idleW=0,_idleSrv=null,_idleSrvT=0;
const _ACT='tj_act',_SMN='tj_sesmin';
/* Marca de actividad: se guarda también en el navegador, para que cerrar/reabrir la pestaña o
   bloquear el celular NO reinicie el reloj de inactividad. */
function idleStamp(){_idleLast=Date.now();if(_idleLast-_idleW>2000){_idleW=_idleLast;try{localStorage.setItem(_ACT,String(_idleLast))}catch(e){window._tjw&&_tjw(e)}}}
function idleBump(){idleStamp()}
/* Minutos de inactividad: administrador = su configuración local; vendedor = lo que diga la nube
   (consultado directo al servidor), con copia local de respaldo por si la lectura falla. */
function idleMin(){let m=+(DB.cfg.sesionMin||0);
 if(!esAdmin()){if(_idleSrv!==null)m=_idleSrv;else if(!m){try{m=+(localStorage.getItem(_SMN)||0)}catch(e){window._tjw&&_tjw(e)}}}
 try{if(m>0)localStorage.setItem(_SMN,String(m));else localStorage.removeItem(_SMN)}catch(e){window._tjw&&_tjw(e)}return m}
function idleFetch(force){try{if(!fbDocRef||!SES||esAdmin())return;const n=Date.now();if(!force&&n-_idleSrvT<120000)return;_idleSrvT=n;
 fbDocRef.get({source:'server'}).then(d=>{if(d.exists){const c=(d.data()||{}).cfg||{};_idleSrv=Math.max(0,Math.round(+c.sesionMin||0));idleCheck()}}).catch(()=>{})}catch(e){window._tjw&&_tjw(e)}}
function idleOut(){if(window._idleOut)return;window._idleOut=1;try{localStorage.setItem('tj_sesion_note','Sesión cerrada por inactividad.')}catch(e){window._tjw&&_tjw(e)}try{localStorage.removeItem(_ACT)}catch(e){window._tjw&&_tjw(e)}
 try{salir()}catch(e){window._tjw&&_tjw(e)}
 /* Plan B: si salir() falla o se queda colgado, se cierra la sesión directamente. */
 setTimeout(()=>{try{firebase.auth().signOut()}catch(e){window._tjw&&_tjw(e)}setTimeout(()=>location.reload(),600)},2500)}
function idleCheck(){if(!SES)return;const min=idleMin();if(!min)return;try{if(LL&&(LL.id||LL.incoming))return}catch(e){window._tjw&&_tjw(e)}
 let last=_idleLast;try{const st=+localStorage.getItem(_ACT)||0;if(st>last)last=st}catch(e){window._tjw&&_tjw(e)}
 if(Date.now()-last>=min*60000)idleOut()}
function idleArm(){if(!_idleArmed){_idleArmed=1;
  ['mousedown','mousemove','keydown','touchstart','wheel','scroll','click','pointerdown'].forEach(ev=>document.addEventListener(ev,idleBump,{passive:true,capture:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){idleCheck();idleFetch(1)}});addEventListener('pageshow',()=>{idleCheck();idleFetch(1)});addEventListener('focus',()=>idleCheck());
  /* Al reabrir la página con la sesión ya iniciada se respeta la última actividad real. */
  let st=0;try{st=+localStorage.getItem(_ACT)||0}catch(e){window._tjw&&_tjw(e)}if(st&&st<=Date.now())_idleLast=st;else idleStamp()}
 else idleStamp();
 if(_idleTimer)clearInterval(_idleTimer);_idleTimer=setInterval(()=>{idleCheck();idleFetch()},10000);idleFetch(1);idleCheck()}
const _entrarSes=entrar;entrar=function(){_entrarSes.apply(this,arguments);idleArm()};
const _salirSes=salir;salir=function(){if(_idleTimer){clearInterval(_idleTimer);_idleTimer=null}return _salirSes.apply(this,arguments)};

// --- Facturas a crédito → evento de cobro en la agenda ---
function credAg(f){if(!f||!f.credito||!f.credito.vence||f.anulada)return;if(DB.agenda.some(e=>e.fid===f.id))return;
 const c=DB.cli.find(x=>x.n===f.cli);
 DB.agenda.push({id:uid(),dn:{},fid:f.id,ti:'Cobro factura F-'+f.n+' — '+f.cli,f:f.credito.vence,h:'',h2:'',t:'cobro',r:'',av:'0',cn:f.cli,tel:c&&c.t||'',nt:'Crédito de '+$$(f.credito.monto)+' a '+crPlazo(f.credito)+'. Factura F-'+f.n+' del '+fdate(f.fecha)+'.'});
 save();if(vista==='agenda')R.agenda();try{cintillo()}catch(e){window._tjw&&_tjw(e)}}
const _em=emitir;emitir=function(){const n=DB.fac.length,r=_em.apply(this,arguments);if(DB.fac.length>n){const f=DB.fac[DB.fac.length-1];if(SES&&!f.vend){f.vend=SES.id;f.vn=SES.id==='admin'?'Administrador':((usr()&&usr().n)||chatName(SES.id));save()}credAg(f)}return r};
/* El número se reserva antes de emitir, solo cuando la factura es válida, para no dejar huecos. */
const _emBase=emitir;let _emBusy=false;
emitir=function(){
 if(_emBusy)return;
 if(!fbDb||!SES)return _emBase.apply(this,arguments);
 const self=this,args=arguments,t=totales();
 if(!items.filter(i=>i.d&&(i.p>0)).length)return _emBase.apply(self,args);
 const pr=TJFacturacion.prepararPago({pago:$('f_pg').value,total:t.tot,pagosMixtos:mix,fecha:$('f_fecha').value||hoy(),plazo:crN,unidad:crU});
 if(!pr.ok)return _emBase.apply(self,args);
 _emBusy=true;
 reservarNumeroFactura().then(n=>{if(n>0)DB.cfg.sig=n}).catch(e=>{window._tjw&&_tjw(e);console.warn('No se pudo reservar el número de factura; se usa el número local',e)}).finally(()=>{_emBusy=false;_emBase.apply(self,args)});
};
const _an=anular;anular=function(id){const a=DB.fac.find(f=>f.id==id),was=a&&a.anulada,r=_an.apply(this,arguments),b=DB.fac.find(f=>f.id==id);if(b&&b.anulada&&!was){DB.agenda=DB.agenda.filter(e=>e.fid!==id);save()}return r};
// --- Galería de fotos ---
let GAL=[],_galOn=false;
function galListen(){if(_galOn||!fbDb)return;_galOn=true;try{fbCol('galeria').onSnapshot(sn=>{GAL=sn.docs.map(d=>sanGal(d.data())).filter(Boolean).sort((a,b)=>b.ts-a.ts);if(vista==='gal'&&SES)R.gal()},()=>{})}catch(e){window._tjw&&_tjw(e)}}
function galComp(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{let w=im.width,h=im.height;const k=Math.min(1,1280/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);URL.revokeObjectURL(u);let q=.72,d=c.toDataURL('image/jpeg',q);while(d.length>900000&&q>.3){q-=.1;d=c.toDataURL('image/jpeg',q)}res(d)};im.onerror=()=>rej(new Error('img'));im.src=u})}
async function galAdd(inp,cam){if(!fbDb)return alert('La galería necesita conexión a internet.');const fs=[...inp.files];inp.value='';if(!fs.length)return;const b=$('galSt');if(b)b.textContent='Guardando…';let ok=0;
 for(const f of fs){if(!/^image\//.test(f.type))continue;try{const img=await galComp(f),id=uid(),u=usr();await fbCol('galeria').doc(id).set({id,t:cam?'Foto '+new Date().toLocaleString('es-PA'):f.name.replace(/\.[^.]+$/,'').slice(0,60),n:'',by:esAdmin()?'Administrador':(u?u.n:''),o:SES.id,ts:Date.now(),img});ok++}catch(e){alert('No se pudo guardar una imagen.')}}
 const b2=$('galSt');if(b2)b2.textContent=ok?'✔ '+ok+' foto(s) guardada(s)':''}
R.gal=function(){const adm=esAdmin();
 $('v').innerHTML=`<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn p" data-h-click="h183">📸 Tomar foto</button>${adm?`<button class="btn" data-h-click="h182">⬆ Subir imágenes</button>`:''}<span id="galSt" style="font-size:12.5px;color:var(--gris)"></span></div><input id="gal_c" type="file" accept="image/*" capture="environment" hidden data-h-change="h181">${adm?'<input id="gal_u" type="file" accept="image/*" multiple hidden data-h-change="h180">':''}</div>${GAL.length?`<div class="galg">${GAL.map(g=>`<div class="galt"><div class="galim" data-h-click="h179" data-a-click="${_ha(g.id)}"><img loading="lazy" src="${g.img}" alt=""></div><div class="galc"><b>${esc(g.t||'Foto')}</b><small>${esc(g.by||'')} · ${new Date(g.ts).toLocaleDateString('es-PA')}</small><div class="galb">${adm?`<button class="btn s" data-h-click="h178" data-a-click="${_ha(g.id)}">✏️ Editar</button>`:''}${galCan(g)?`<button class="btn s d" data-h-click="h177" data-a-click="${_ha(g.id)}" aria-label="Eliminar">🗑</button>`:''}</div></div></div>`).join('')}</div>`:'<div class="card"><div class="vacio">Aún no hay fotos.</div></div>'}`};
function galVer(id){const g=GAL.find(x=>x.id===id);if(!g)return;$('mb').innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px"><b>${esc(g.t||'Foto')}</b><button class="btn s" data-h-click="h12" aria-label="Cerrar">✕</button></div><img src="${g.img}" style="max-width:100%;max-height:70vh;border-radius:14px;display:block;margin:auto" alt=""><div style="font-size:12.5px;color:var(--gris);margin-top:10px">${esc(g.by||'')} · ${new Date(g.ts).toLocaleString('es-PA')}</div>${g.n?`<div style="margin-top:6px">${esc(g.n)}</div>`:''}`;$('md').classList.add('on')}
function galEdit(id){if(!esAdmin()||!fbDb)return;const g=GAL.find(x=>x.id===id);if(!g)return;const t=prompt('Título de la foto:',g.t||'');if(t===null)return;const n=prompt('Nota / descripción (opcional):',g.n||'');if(n===null)return;fbCol('galeria').doc(id).update({t:t.trim(),n:n.trim()}).catch(()=>alert('No se pudo guardar el cambio.'))}
const galCan=g=>esAdmin()||(!!SES&&(g.o?g.o===SES.id:(!!usr()&&g.by===usr().n)));
function galDel(id){const g=GAL.find(x=>x.id===id);if(!fbDb||!g||!galCan(g))return alert('Solo puede eliminar las fotos que usted tomó.');if(!confirm('¿Eliminar esta foto?'))return;fbCol('galeria').doc(id).delete().catch(()=>alert('No se pudo eliminar.'))}
// --- Voz femenina para cobros pendientes (facturas a crédito en la agenda) ---
function vozEs(){const L=(window.speechSynthesis?speechSynthesis.getVoices():[]).filter(v=>/^es/i.test(v.lang));if(!L.length)return null;
 const mal=/jorge|diego|juan|carlos|pablo|raul|raúl|andres|andrés|alvaro|álvaro|enrique|miguel|male|hombre/i,fem=/paulina|monica|mónica|helena|laura|sabina|sofia|sofía|elena|lucia|lucía|marisol|dalia|elvira|camila|female|mujer|google español|google es|paloma|salome|salomé|valentina|catalina|ximena|marta|maria|maría|samantha/i,reg=['es-MX','es-US','es-PA','es-419','es-CO','es-AR','es-ES'];
 const f=L.filter(v=>!mal.test(v.name)),pf=f.filter(v=>fem.test(v.name)),pool=pf.length?pf:(f.length?f:L);
 return pool.slice().sort((a,b)=>{const ia=reg.indexOf(a.lang.replace('_','-')),ib=reg.indexOf(b.lang.replace('_','-'));return(ia<0?99:ia)-(ib<0?99:ib)})[0]}
function vozDama(txt,ok,err){const ss=window.speechSynthesis;if(!ss)return;
 const go=()=>{try{const u=new SpeechSynthesisUtterance(vozTxt(txt));vozPerf(u);u.volume=Math.min(1,(DB.cfg.vol||70)/100+.25);u.onstart=()=>{ok&&ok()};u.onerror=()=>{err&&err()};ss.speak(u)}catch(e){err&&err()}};
 if(ss.getVoices().length)go();else{let d=0;const h=()=>{if(d++)return;go()};ss.onvoiceschanged=h;setTimeout(h,900)}}
const _vozQ=new Set();
function cobroK(){let K={};const t=hoy();try{K=JSON.parse(localStorage.getItem(lsk('tj_voz'))||'{}')}catch(e){window._tjw&&_tjw(e)}Object.keys(K).forEach(k=>{if(K[k]!==t)delete K[k]});return K}
function cobroTxt(e,d){const f=DB.fac.find(x=>x.id===e.fid),m=f&&f.credito?+f.credito.monto:0,h=new Date().getHours(),sal=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches',t=hoy(),
 fv=x=>new Date(x+'T12:00').toLocaleDateString('es-PA',{day:'numeric',month:'long'}),cu=d<t?'venció el '+fv(d):d===t?'vence hoy':'vence el '+fv(d),
 en=Math.floor(m),ct=Math.round((m-en)*100);
 return sal+'. Le recuerdo amablemente que tiene una factura pendiente por cobrar a nombre de '+(e.cn||'un cliente')+(m?', por un monto de '+en+' dólares'+(ct?' con '+ct+' centavos':''):'')+'. Esta factura '+cu+'.'}
function cobroDecir(o){const t=hoy(),id=o.e.id+'|'+t;if(_vozQ.has(id)||cobroK()[o.e.id]===t)return false;_vozQ.add(id);
 vozDama(cobroTxt(o.e,o.d),()=>{const k=cobroK();k[o.e.id]=t;try{localStorage.setItem(lsk('tj_voz'),JSON.stringify(k))}catch(x){window._tjw&&_tjw(x)}},()=>_vozQ.delete(id));return true}
function cobroVoz(){if(!esAdmin()||DB.cfg.vozCobro===0)return;const t=hoy(),q0=AG.q,c0=AG.c;AG.q='';AG.c='';let l=[];try{l=agOcc(addD(t,-30),t)}catch(e){window._tjw&&_tjw(e)}AG.q=q0;AG.c=c0;
 l=l.filter(o=>o.e.fid&&!agDn(o));if(!l.length)return;let n=0,r=0;
 l.forEach(o=>{if(n<3){if(cobroDecir(o))n++}else if(cobroK()[o.e.id]!==t&&!_vozQ.has(o.e.id+'|'+t))r++});
 if(n&&r)vozDama('Y tiene '+r+' cobro'+(r>1?'s':'')+' pendiente'+(r>1?'s':'')+' más en la agenda.')}
const _aa=agAlert;agAlert=function(o){_aa.apply(this,arguments);try{if(o&&o.e&&o.e.fid&&esAdmin()&&DB.cfg.vozCobro!==0)cobroDecir(o)}catch(e){window._tjw&&_tjw(e)}};
setInterval(cobroVoz,600000);document.addEventListener('pointerdown',()=>setTimeout(cobroVoz,400),{once:true});
function vozCard(){const on=DB.cfg.vozCobro!==0;return `<h3 style="margin:0 0 4px">🗣 Voz de cobros pendientes</h3><p style="font-size:12.5px;color:var(--gris)">Una voz le recuerda en voz alta las facturas a crédito por cobrar, al abrir el panel y a la hora del aviso de la agenda.</p><div class="g"><div><label>Voz</label><select data-h-change="h176"><option value="1" ${on?'selected':''}>Activada</option><option value="0" ${on?'':'selected'}>Desactivada</option></select></div><div><label>Voz al llegar un mensaje del chat</label><select data-h-change="h175"><option value="1" ${DB.cfg.vozChat!==0?'selected':''}>Activada</option><option value="0" ${DB.cfg.vozChat!==0?'':'selected'}>Desactivada</option></select></div></div>${vozSel()}<br><button class="btn p" data-h-click="h174">▶ Probar voz de cobros</button> <button class="btn" data-h-click="h173">▶ Probar aviso de chat</button>`}
function vozProbar(){try{speechSynthesis.cancel()}catch(e){window._tjw&&_tjw(e)}vozDama('Buenos días. Le recuerdo amablemente que tiene una factura pendiente por cobrar a nombre de la empresa Ejemplo, por un monto de 250 dólares. Esta factura vence hoy.')}
// --- Restaurar respaldo (solo administrador) ---
function restaurarResp(){
 if(!esAdmin())return alert('Solo el administrador puede restaurar un respaldo.');
 const i=document.createElement('input');i.type='file';i.accept='.json,application/json';
 i.onchange=()=>{const f=i.files&&i.files[0];if(!f)return;const r=new FileReader();
  r.onerror=()=>alert('No se pudo leer el archivo.');
  r.onload=()=>{let o;try{o=JSON.parse(r.result)}catch(e){return alert('El archivo no es un respaldo válido (no se pudo leer).')}
   const arr=['prod','cli','fac','ubi','agenda'];
   if(!o||typeof o!=='object'||Array.isArray(o)||!o.cfg||typeof o.cfg!=='object'||!arr.every(k=>o[k]===undefined||Array.isArray(o[k]))||!(Array.isArray(o.fac)&&Array.isArray(o.cli)&&Array.isArray(o.prod)))
    return alert('Este archivo no parece un respaldo de Tarjetería Jhon. No se cambió nada.');
   const n=(x,k)=>(x[k]||[]).length,perd=n(DB,'fac')-n(o,'fac');
   let m='Este respaldo trae:\n• '+n(o,'fac')+' facturas\n• '+n(o,'cli')+' clientes\n• '+n(o,'prod')+' productos\n• '+n(o,'agenda')+' eventos de agenda\n\nAhora tiene '+n(DB,'fac')+' facturas, '+n(DB,'cli')+' clientes y '+n(DB,'prod')+' productos. Se REEMPLAZARÁN por los del respaldo en todos los dispositivos.';
   if(perd>0)m+='\n\n⚠ El respaldo tiene '+perd+' factura(s) MENOS que las actuales: esas se perderían.';
   m+='\n\nSe descargará antes una copia de sus datos actuales. ¿Continuar?';
   if(!confirm(m))return;
   try{const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(DB));a.download='antes_de_restaurar_'+new Date().toISOString().slice(0,10)+'.json';a.click()}catch(e){window._tjw&&_tjw(e)}
   const users=DB.cfg.users;
   Object.keys(o).forEach(k=>{if(['__proto__','constructor','prototype','_ts','cfg'].includes(k))return;const v=o[k];if(Array.isArray(v)||(v&&typeof v==='object'))DB[k]=v});
   const cfg=Object.assign({},o.cfg);delete cfg.admin;delete cfg.users;delete cfg.__proto__;
   DB.cfg=Object.assign(DB.cfg,cfg);delete DB.cfg.admin;if(users)DB.cfg.users=users;
   save();if(vista&&R[vista])R[vista]();alert('Respaldo restaurado. Se está sincronizando con los demás dispositivos.')}
  r.readAsText(f)};
 i.click()}
// --- Llamadas de voz entre administrador y vendedores (WebRTC; la conexión se coordina con Firestore) ---
const LL={pc:null,id:null,stream:null,unsub:[],t0:0,tm:null,peer:null,ringTm:null,ring:null,incoming:null,ready:false,q:[],pend:[],muted:false,priv:false};
const llamOn=()=>DB.cfg.llamOn!==0&&!!fbDb&&!!window.RTCPeerConnection&&!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
function llamIce(){const s=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}],u=(DB.cfg.turnUrl||'').trim();if(u)s.push({urls:u.split(/[\s,]+/).filter(Boolean),username:DB.cfg.turnUser||'',credential:DB.cfg.turnCred||''});return s}
const BT_IN='<button class="no" data-h-click="h172" title="Rechazar">✖</button><button class="ok" data-h-click="h171" title="Contestar">📞</button>';
const BT_ON='<button class="mu" id="llmu" data-h-click="h170" title="Silenciar micrófono">🎙</button><button class="mu" id="llvo" data-h-click="h169" title="Volumen bajo (más privado)">🔊</button><button class="no" data-h-click="h168" title="Colgar">✖</button>';
function llamUI(o){clearTimeout(LL.hTm);let d=$('llam');if(!d){d=document.createElement('div');d.id='llam';document.body.appendChild(d)}
 if(!o){d.style.display='none';d.innerHTML='';return}
 d.style.display='flex';d.innerHTML=`<div class="llc ${o.ring?'ring':''}"><div class="lla">${o.p?avHTML(o.p,84):esc((o.n||'?').trim().charAt(0).toUpperCase())}</div><h3>${esc(o.n)}</h3><p id="llst">${esc(o.s)}</p><div class="llb">${o.b||''}</div><div id="llx" class="llx">${o.x||''}</div></div>`}
const llamSt=s=>{const e=$('llst');if(e)e.textContent=s};
const llamAud=()=>{let a=$('llau');if(!a){a=document.createElement('audio');a.id='llau';a.autoplay=true;a.setAttribute('playsinline','');document.body.appendChild(a)}return a};
function llamTono(on,soft){clearInterval(LL.ring);LL.ring=null;if(!on)return;
 const play=()=>{try{const C=window._llCtx||(window._llCtx=new (window.AudioContext||window.webkitAudioContext)());if(C.state==='suspended')C.resume();
  [[0,659],[.28,523]].forEach(([d,f])=>{const o=C.createOscillator(),g=C.createGain(),t=C.currentTime+d;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(soft?.08:.25,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.24);o.connect(g);g.connect(C.destination);o.start(t);o.stop(t+.26)});
  if(!soft&&navigator.vibrate)navigator.vibrate([300,150,300])}catch(e){window._tjw&&_tjw(e)}};play();LL.ring=setInterval(play,2200)}
const llamMic=()=>navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
function llamPC(id,me){const pc=new RTCPeerConnection({iceServers:llamIce()});LL.pc=pc;LL.ready=false;LL.q=[];LL.pend=[];
 LL.stream.getTracks().forEach(k=>pc.addTrack(k,LL.stream));
 pc.ontrack=e=>{const a=llamAud();a.srcObject=e.streams[0];a.play().catch(()=>{})};
 pc.onicecandidate=e=>{if(!e.candidate)return;const c=e.candidate.toJSON();if(LL.ready)llamIceSend(id,me,c);else LL.q.push(c)};
 pc.onconnectionstatechange=()=>{if(LL.pc!==pc)return;const s=pc.connectionState;if(s==='connected')llamActiva();else if(s==='failed')llamFin('No se pudo conectar. Puede que la red bloquee las llamadas.');else if(s==='disconnected')setTimeout(()=>{if(LL.pc===pc&&pc.connectionState==='disconnected')llamFin('Se perdió la conexión')},6000)};
 return pc}
const llamIceSend=(id,me,c)=>fbCol('llamadas').doc(id).collection('ice').add({by:me,c,ts:Date.now()}).catch(()=>{});
function llamIceListen(id,me,pc){LL.ready=true;LL.q.forEach(c=>llamIceSend(id,me,c));LL.q=[];
 LL.unsub.push(fbCol('llamadas').doc(id).collection('ice').onSnapshot(sn=>sn.docChanges().forEach(ch=>{if(ch.type!=='added')return;const d=ch.doc.data();if(d.by===me)return;if(pc.remoteDescription)pc.addIceCandidate(d.c).catch(()=>{});else LL.pend.push(d.c)}),()=>{}))}
const llamFlush=pc=>{LL.pend.forEach(c=>pc.addIceCandidate(c).catch(()=>{}));LL.pend=[]};
function llamActiva(){if(LL.t0||!LL.id)return;LL.t0=Date.now();clearTimeout(LL.ringTm);llamTono(0);llamUI({p:LL.peer,n:chatName(LL.peer),s:'00:00',b:BT_ON,x:llamHint()});llamSalidas();
 LL.tm=setInterval(()=>{const s=Math.floor((Date.now()-LL.t0)/1000);llamSt(String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'))},1000)}
async function llamar(chatId){
 if(!llamOn())return alert('Las llamadas no están disponibles: revise su conexión o que el navegador permita el micrófono.');
 if(LL.id||LL.incoming)return alert('Ya hay una llamada en curso.');
 const me=chatMe(),peer=me==='admin'?String(chatId).slice(3):'admin',nom=chatName(peer);
 try{LL.stream=await llamMic()}catch(e){return alert('No se pudo usar el micrófono. Permita el acceso al micrófono en el navegador y vuelva a intentar.')}
 const id='c'+uid();LL.id=id;LL.peer=peer;LL.t0=0;LL.muted=false;llamUI({p:peer,n:nom,s:'Llamando…',b:'<button class="no" data-h-click="h168" title="Cancelar">✖</button>',ring:1});llamTono(1,1);
 try{const pc=llamPC(id,me),off=await pc.createOffer();await pc.setLocalDescription(off);
  const ref=fbCol('llamadas').doc(id);
  await ref.set({id,chat:chatId,from:me,to:peer,fn:chatName(me),state:'ringing',offer:{type:off.type,sdp:off.sdp},ts:Date.now()});
  llamIceListen(id,me,pc);
  LL.unsub.push(ref.onSnapshot(async s=>{const d=s.data();if(!d||LL.id!==id)return;
   if(d.answer&&pc.signalingState==='have-local-offer'){try{await pc.setRemoteDescription(d.answer);llamFlush(pc);llamSt('Conectando…')}catch(e){window._tjw&&_tjw(e)}}
   if(['declined','ended','missed'].includes(d.state))llamFin(d.state==='declined'?'Llamada rechazada':d.state==='missed'?'Sin respuesta':'Llamada finalizada')},()=>{}));
  LL.ringTm=setTimeout(()=>{if(LL.id===id&&!LL.t0){ref.update({state:'missed'}).catch(()=>{});llamFin('Sin respuesta')}},45000)
 }catch(e){console.warn('Llamada:',e);llamFin('No se pudo iniciar la llamada')}}
function llamEntrante(d){LL.incoming=d;llamUI({p:d.from,n:d.fn||chatName(d.from),s:'Llamada entrante…',b:BT_IN,ring:1});llamTono(1);try{if(DB.cfg.vozChat!==0)vozDama('Atención. Llamada entrante de '+(d.from==='admin'?'la administración':chatName(d.from))+'.')}catch(e){window._tjw&&_tjw(e)}
 clearTimeout(LL.ringTm);LL.ringTm=setTimeout(()=>{if(LL.incoming&&LL.incoming.id===d.id){LL.incoming=null;llamFin('Llamada perdida')}},45000)}
async function llamAcepta(){const d=LL.incoming;if(!d||LL.id)return;llamTono(0);clearTimeout(LL.ringTm);
 try{LL.stream=await llamMic()}catch(e){llamRechazar();return alert('No se pudo usar el micrófono. Permita el acceso al micrófono en el navegador.')}
 const me=chatMe();LL.id=d.id;LL.peer=d.from;LL.t0=0;LL.muted=false;LL.incoming=null;llamUI({p:d.from,n:d.fn||chatName(d.from),s:'Conectando…',b:BT_ON});
 try{const pc=llamPC(d.id,me);await pc.setRemoteDescription(d.offer);const an=await pc.createAnswer();await pc.setLocalDescription(an);
  const ref=fbCol('llamadas').doc(d.id);await ref.update({answer:{type:an.type,sdp:an.sdp},state:'active'});
  llamIceListen(d.id,me,pc);llamFlush(pc);
  LL.unsub.push(ref.onSnapshot(s=>{const x=s.data();if(x&&LL.id===d.id&&['ended','missed','declined'].includes(x.state))llamFin('Llamada finalizada')},()=>{}))
 }catch(e){console.warn('Contestar:',e);llamFin('No se pudo conectar')}}
function llamRechazar(){const d=LL.incoming;if(!d)return;LL.incoming=null;fbCol('llamadas').doc(d.id).update({state:'declined'}).catch(()=>{});llamFin('')}
function llamCuelga(){const id=LL.id;if(id)fbCol('llamadas').doc(id).update({state:LL.t0?'ended':'missed'}).catch(()=>{});llamFin('Llamada finalizada')}
function llamMute(){LL.muted=!LL.muted;(LL.stream?LL.stream.getAudioTracks():[]).forEach(k=>{k.enabled=!LL.muted});const b=$('llmu');if(b)b.classList.toggle('on',LL.muted)}
function llamFin(msg){if(!LL.id&&!LL.incoming&&!$('llam'))return;
 llamTono(0);clearTimeout(LL.ringTm);clearInterval(LL.tm);LL.unsub.forEach(u=>{try{u()}catch(e){window._tjw&&_tjw(e)}});LL.unsub=[];
 try{LL.pc&&LL.pc.close()}catch(e){window._tjw&&_tjw(e)}try{LL.stream&&LL.stream.getTracks().forEach(k=>k.stop())}catch(e){window._tjw&&_tjw(e)}
 const a=$('llau');if(a){a.srcObject=null;a.volume=1}const nom=LL.peer?chatName(LL.peer):'',pid=LL.peer;
 Object.assign(LL,{pc:null,id:null,stream:null,t0:0,tm:null,peer:null,ringTm:null,incoming:null,ready:false,q:[],pend:[],muted:false,priv:false});
 if(msg){llamUI({p:pid,n:nom||'Llamada',s:msg,b:''});LL.hTm=setTimeout(()=>{if(!LL.id&&!LL.incoming)llamUI(null)},1800)}else if(!LL.id&&!LL.incoming)llamUI(null)}
function llamListen(){if(window._llOn||!fbDb||!llamOn())return;window._llOn=true;const me=chatMe();
 fbCol('llamadas').where('to','==',me).where('state','==','ringing').onSnapshot(sn=>sn.docChanges().forEach(ch=>{const d=ch.doc.data();
  if(ch.type==='added'){if(Date.now()-(d.ts||0)>40000)return;if(LL.id||LL.incoming){fbCol('llamadas').doc(d.id).update({state:'declined'}).catch(()=>{});return}llamEntrante(d)}
  else if(ch.type==='removed'&&LL.incoming&&LL.incoming.id===d.id&&!LL.id){LL.incoming=null;llamFin('Llamada perdida')}}),e=>console.warn('Llamadas:',e))}
const llamHint=()=>(window.matchMedia&&matchMedia('(pointer:coarse)').matches)?'<small class="llh">En el celular el sonido sale por el altavoz. Para más privacidad toque 🔊 para bajar el volumen y acérquelo al oído, o use auriculares.</small>':'';
function llamVol(){LL.priv=!LL.priv;const a=llamAud();a.volume=LL.priv?.3:1;const b=$('llvo');if(b){b.classList.toggle('on',LL.priv);b.textContent=LL.priv?'🔉':'🔊'}}
async function llamSalidas(){const a=llamAud();if(!a.setSinkId||!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return;
 try{const d=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==='audiooutput');if(d.length<2)return;const x=$('llx');if(x)x.innerHTML=`<label style="font-size:11.5px;color:var(--gris)">Salida de audio</label><select data-h-change="h167">${d.map(v=>`<option value="${esc(v.deviceId)}" ${a.sinkId===v.deviceId?'selected':''}>${esc(v.label||'Salida de audio')}</option>`).join('')}</select>`}catch(e){window._tjw&&_tjw(e)}}
async function llamSalida(id){try{await llamAud().setSinkId(id)}catch(e){alert('No se pudo cambiar la salida de audio.')}}
async function llamProbarMic(){try{const s=await llamMic();s.getTracks().forEach(k=>k.stop());alert('Micrófono listo ✅')}catch(e){alert('No se pudo usar el micrófono. Permita el acceso en el navegador.')}}
function llamCard(){const on=DB.cfg.llamOn!==0,v=k=>esc(DB.cfg[k]||'');
 return `<h3 style="margin:0 0 4px">📞 Llamadas de voz</h3><p style="font-size:12.5px;color:var(--gris)">Desde el chat directo, el administrador y cada vendedor pueden llamarse. Las dos personas deben tener el panel abierto. No cuesta nada: la voz va directo entre los dos dispositivos.</p><div class="g"><div><label>Llamadas</label><select data-h-change="h166"><option value="1" ${on?'selected':''}>Activadas</option><option value="0" ${on?'':'selected'}>Desactivadas</option></select></div></div><details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px">Opcional: servidor TURN (si alguna llamada no conecta)</summary><p style="font-size:12px;color:var(--gris)">Algunas redes de datos móviles bloquean la conexión directa. Un servidor TURN lo resuelve; lo ofrecen servicios externos. Déjelo vacío si no lo necesita.</p><div class="g"><div><label>Dirección (turn:… o turns:…)</label><input value="${v('turnUrl')}" data-h-change="h165"></div><div><label>Usuario</label><input value="${v('turnUser')}" data-h-change="h164"></div><div><label>Contraseña</label><input type="password" value="${v('turnCred')}" data-h-change="h163"></div></div></details><p><button class="btn" data-h-click="h162">🎙 Probar micrófono</button></p>`}
// --- Perfiles (avatar) y emojis del chat ---
let PERF={},PF={e:'',a:'bounce',img:''},EMO={open:false,tab:0};
const _okImg=s=>typeof s==='string'&&s.length<700000&&/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+\/=]+$/.test(s);
const _ANS=['bounce','pulse','spin','wiggle','float','shake','flip','none'],_okAn=a=>_ANS.includes(a)?a:'bounce';
function avFrom(p,s,id){p=p||{};s=s||40;
 if(_okImg(p.img))return `<span class="av" data-uid="${id||''}" style="--s:${s}px"><img src="${p.img}" alt=""></span>`;
 if(typeof p.e==='string'&&p.e&&p.e.length<=16)return `<span class="av" data-uid="${id||''}" style="--s:${s}px"><span class="em anim-${_okAn(p.a)}">${esc(p.e)}</span></span>`;
 return `<span class="av dflt" data-uid="${id||''}" style="--s:${s}px">${id==='admin'?'👑':esc(String(chatName(id)||'?').charAt(0).toUpperCase())}</span>`}
const avHTML=(id,s)=>avFrom(PERF[id],s,id);
function avBig(id){const p=PERF[id]||{},nm=chatName(id),rol=id==='admin'?'Administrador':'Vendedor',old=document.getElementById('avzoom');if(old)old.remove();
 const z=document.createElement('div');z.id='avzoom';z.onclick=()=>z.remove();let body;
 if(_okImg(p.img))body=`<img src="${p.img}" alt="">`;else if(typeof p.e==='string'&&p.e&&p.e.length<=16)body=`<span class="avze"><span class="em anim-${_okAn(p.a)}">${esc(p.e)}</span></span>`;else body=`<span class="avze dflt">${id==='admin'?'👑':esc(String(nm).charAt(0).toUpperCase())}</span>`;
 z.innerHTML=body+`<div class="avzc"><b>${esc(nm)}</b><small>${rol}</small></div><button aria-label="Cerrar">✕</button>`;document.body.appendChild(z)}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('.av[data-uid]');if(!a||a.closest('#uchip,#pf_pv,.lla'))return;const id=a.dataset.uid;if(!id)return;e.stopPropagation();e.preventDefault();avBig(id)},true);
addEventListener('keydown',e=>{if(e.key==='Escape'){const z=document.getElementById('avzoom');if(z)z.remove()}});
function avRefresh(){try{if(vista==='vend'&&$('vendCard')&&!$('md').classList.contains('on'))R.vend()}catch(e){window._tjw&&_tjw(e)}try{topUser()}catch(e){window._tjw&&_tjw(e)}try{if(vista==='chat'){chatList();chatConv()}}catch(e){window._tjw&&_tjw(e)}}
function perfListen(){if(window._pfOn||!fbDb)return;window._pfOn=true;
 fbDb.collection('perfiles').onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{const x=d.data(),k=d.id||(x&&x.id);if(k)o[k]=x});PERF=o;avRefresh()},e=>console.warn('Perfiles:',e))}
const PF_EM=['😀','😎','🤩','🥳','😇','🤓','😺','🦊','🐼','🦁','🐯','🐶','🦄','🐝','🦋','🌟','🔥','💎','🎴','👑','🚀','💼','🧁','🍀','🌈','⚡','🎨','🎯','🤝','💰'];
const PF_AN=[['bounce','Rebote'],['pulse','Latido'],['spin','Giro'],['wiggle','Meneo'],['float','Flotar'],['shake','Temblor'],['flip','Volteo'],['none','Sin movimiento']];
function perfPrev(){const e=$('pf_pv');if(e)e.innerHTML=avFrom(PF,96,chatMe());document.querySelectorAll('#pf_g button').forEach(b=>b.classList.toggle('on',b.dataset.e===PF.e&&!PF.img))}
function perfForm(){const id=chatMe();if(!id)return;const p=PERF[id]||{};PF={e:p.e||'',a:_okAn(p.a),img:_okImg(p.img)?p.img:''};
 $('mb').innerHTML=`<h3 style="margin-top:0">🙂 Mi perfil</h3><p style="font-size:12.5px;color:var(--gris);margin:0 0 10px">Elija un emoji con movimiento, o suba una foto o un GIF. Lo verán en el chat y en las llamadas.</p><div id="pf_pv" style="text-align:center;margin:6px 0 12px"></div><label>Emoji animado</label><div class="pfg" id="pf_g">${PF_EM.map(e=>`<button type="button" data-e="${e}" data-h-click="h161">${e}</button>`).join('')}</div><div class="g" style="margin-top:10px"><div><label>Movimiento</label><select data-h-change="h160">${PF_AN.map(([k,n])=>`<option value="${k}" ${PF.a===k?'selected':''}>${n}</option>`).join('')}</select></div></div><label style="display:block;margin-top:12px">Foto o GIF</label><div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn s" style="cursor:pointer">📷 Tomar foto<input type="file" accept="image/*" capture="user" hidden data-h-change="h159"></label><label class="btn s" style="cursor:pointer">🖼 Elegir imagen o GIF<input type="file" accept="image/*" hidden data-h-change="h159"></label></div><p style="font-size:11.5px;color:var(--gris);margin:6px 0 0">Las fotos y los GIF pesados se comprimen solos.</p><div style="display:flex;gap:8px;justify-content:space-between;margin-top:16px;flex-wrap:wrap"><button class="btn d" data-h-click="h158">Quitar mi avatar</button><span><button class="btn" data-h-click="h12">Cancelar</button> <button class="btn p" data-h-click="h157">Guardar</button></span></div>`;$('md').classList.add('on');perfPrev()}
const _perfLeer=f=>{const r=new FileReader();r.onload=()=>{PF.img=String(r.result);PF.e='';perfPrev()};r.readAsDataURL(f)};
function _perfFoto(f){createImageBitmap(f).then(bm=>{const m=192,k=Math.max(m/bm.width,m/bm.height),w=bm.width*k,h=bm.height*k,c=document.createElement('canvas');c.width=c.height=m;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,m,m);x.drawImage(bm,(m-w)/2,(m-h)/2,w,h);PF.img=c.toDataURL('image/jpeg',.82);PF.e='';perfPrev();bm.close&&bm.close()}).catch(()=>alert('No se pudo leer la imagen.'))}
async function perfFile(inp){const f=inp.files&&inp.files[0];inp.value='';if(!f)return;if(!/^image\//.test(f.type))return alert('Elija una imagen.');
 if(f.type!=='image/gif')return _perfFoto(f);
 if(f.size<=150000)return _perfLeer(f);
 const pv=$('pf_pv');if(pv)pv.innerHTML='<span style="font-size:13px;color:var(--gris)">⏳ Comprimiendo GIF…</span>';
 let r=null;try{r=await gifComprimir(f,220000)}catch(e){console.warn('GIF:',e)}
 if(r){PF.img=r;PF.e='';perfPrev();return}
 if(f.size<=450000){_perfLeer(f);return}
 alert('Este GIF es demasiado pesado y este navegador no puede comprimirlo. Se usará su primera imagen como foto.');_perfFoto(f)}
async function perfSave(){const id=chatMe();if(!id||!fbDb)return alert('Se necesita conexión a internet.');const o={id,ts:Date.now()};if(PF.img)o.img=PF.img;else if(PF.e){o.e=PF.e;o.a=_okAn(PF.a)}
 try{await fbDb.collection('perfiles').doc(id).set(o);PERF[id]=o;cerrar();avRefresh()}catch(e){alert('No se pudo guardar el perfil. Revise su conexión.')}}
const EMO_T=[['😊','Caras','😀😃😄😁😆😅😂🤣😊🙂😉😍🥰😘😋😎🤩🥳🤗🤔😏😴😮😢😭😡😱🥺😇🙄😬🤯😜🤪😌😔😤'],['👍','Gestos','👍👎👏🙌🙏💪👌✌️🤞👋🤙👈👉👆👇✋🖐️🤟🫡🫶✍️👀🤝💅'],['💼','Negocio','💼📄🧾💰💵💳🏦📦🚚📌📍📞📱💻✉️📅⏰🎴🎁🎉🎂🎈🛒🏷️✂️📎🖊️✅❌⚠️🔔📈📉🧮'],['🐶','Natur.','🐶🐱🐼🦁🐯🐻🦄🐝🦋🌸🌹🌻🌈☀️⭐🔥☕🍕🍔🌮🍰🧁🍩🍎🍇🍓🥑🍺🥂'],['❤️','Símbolos','❤️🧡💛💚💙💜🖤🤍💯✨⚡💥💫🎵🎶➕➖✔️❓❗💬💭🔝🆗🆕🔴🟢🔵']];
const EMO_S=[['❤️','pulse'],['😍','pulse'],['😂','wiggle'],['🥳','bounce'],['👍','bounce'],['👏','shake'],['🔥','pulse'],['🎉','bounce'],['😎','float'],['🤗','wiggle'],['😭','shake'],['😡','shake'],['🙏','float'],['💰','spin'],['⭐','spin'],['📞','wiggle'],['✅','pulse'],['🤝','bounce'],['😴','float'],['🚀','float']];
const _seg=s=>Array.from(typeof Intl!=='undefined'&&Intl.Segmenter?new Intl.Segmenter('es',{granularity:'grapheme'}).segment(s):s,x=>x.segment||x);
function emoHTML(){const tabs=EMO_T.map((x,i)=>`<button type="button" class="${EMO.tab===i?'on':''}" title="${x[1]}" data-h-click="h156" data-a-click="${_ha(i)}">${x[0]}</button>`).join('')+`<button type="button" class="${EMO.tab===9?'on':''}" title="Animados" data-h-click="h155">🎭</button>`;
 const g=EMO.tab===9?`<div class="emog stk">${EMO_S.map(([e,a])=>`<button type="button" data-h-click="h154" data-a-click="${_ha(e, a)}"><span class="em anim-${a}">${e}</span></button>`).join('')}</div>`:`<div class="emog">${_seg(EMO_T[EMO.tab][2]).map(e=>`<button type="button" data-h-click="h153">${e}</button>`).join('')}</div>`;
 return `<div class="emot">${tabs}</div>${g}`}
function emoToggle(){EMO.open=!EMO.open;emoDraw()}
function emoTab(i){EMO.tab=i;emoDraw()}
function emoDraw(){const e=$('emop');if(!e)return;e.classList.toggle('on',EMO.open);if(EMO.open)e.innerHTML=emoHTML()}
function emoPut(s){const t=$('chin');if(!t)return;const a=t.selectionStart==null?t.value.length:t.selectionStart,b=t.selectionEnd==null?t.value.length:t.selectionEnd;t.value=t.value.slice(0,a)+s+t.value.slice(b);t.selectionStart=t.selectionEnd=a+s.length;t.focus()}
function chatSticker(e,a){if(!_ANS.includes(a)||!CH.sel)return;const i=$('chin');if(!i)return;const d=i.value;i.value='{s:'+e+':'+a+'}';chatSend();i.value=d;EMO.open=false;emoDraw()}
const _STK=/^\{s:([^:{}]{1,16}):(bounce|pulse|spin|wiggle|float|shake|flip|none)\}$/,_BIG=/^(?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*\s*){1,3}$/u;
function chatCb(t){t=String(t==null?'':t);const m=_STK.exec(t);if(m)return `<div class="cb stk"><span class="em anim-${m[2]}">${esc(m[1])}</span></div>`;
 return `<div class="cb ${_BIG.test(t.trim())?'big':''}">${esc(t).replace(/\n/g,'<br>')}</div>`}
const chatPrev=t=>{const m=_STK.exec(String(t));return m?m[1]+' Sticker':t};
document.addEventListener('click',e=>{if(EMO.open&&!e.target.closest('.emop,.emob')){EMO.open=false;emoDraw()}});
// --- Semáforo de presencia: cada vendedor reporta su estado; solo el administrador lo ve ---
let PRES={},_presAct=Date.now(),_presN=0;
const _tsm=x=>x&&x.toMillis?x.toMillis():(+x||0);
const _presST=()=>(window.firebase&&firebase.firestore&&firebase.firestore.FieldValue)?firebase.firestore.FieldValue.serverTimestamp():Date.now();
function presBeat(off){if(!fbDb||!SES||esAdmin())return;const id=chatMe();
 fbDb.collection('presencia').doc(id).set({id,ts:_presST(),v:document.hidden?0:1,idle:Math.round((Date.now()-_presAct)/1000),off:off?1:0}).catch(()=>{})}
function presStart(){if(window._prOn||!SES||esAdmin())return;window._prOn=true;
 ['pointerdown','keydown','touchstart','wheel'].forEach(ev=>addEventListener(ev,()=>{_presAct=Date.now()},{passive:true}));
 document.addEventListener('visibilitychange',()=>presBeat());addEventListener('online',()=>presBeat());addEventListener('pagehide',e=>presBeat(!e.persisted));
 presBeat();setInterval(()=>{if(document.hidden&&(++_presN%3))return;presBeat()},45000)}
const _ago=ms=>{const s=Math.round(ms/1000);return s<60?'hace unos segundos':s<3600?'hace '+Math.round(s/60)+' min':s<86400?'hace '+Math.round(s/3600)+' h':'hace '+Math.round(s/86400)+' d'};
function semState(id){const x=PRES[id];if(!x)return ['r','Sin conexión','nunca ha entrado'];const age=Date.now()-_tsm(x.ts);
 if(!x.off){if(x.v){if(age<=110000)return x.idle>180?['y','Sin actividad','abierto, sin usar']:['g','Activo ahora','']}
  else if(age<=300000)return ['y','En segundo plano','']}
 return ['r','Desconectado','visto '+_ago(age)]}
const semInner=(s,big)=>`<span class="lt"><i class="r ${s[0]==='r'?'on':''}"></i><i class="y ${s[0]==='y'?'on':''}"></i><i class="g ${s[0]==='g'?'on':''}"></i></span>${big?`<span class="semt">${esc(s[1])}${s[2]?' · '+esc(s[2]):''}</span>`:''}`;
function semHTML(id,big){if(!esAdmin()||!id||id==='admin')return '';const s=semState(id);return `<span class="sem" data-sem="${esc(id)}" data-big="${big?1:0}" title="${esc(s[1]+(s[2]?' · '+s[2]:''))}">${semInner(s,big)}</span>`}
function presPaint(){document.querySelectorAll('[data-sem]').forEach(e=>{const s=semState(e.dataset.sem);e.title=s[1]+(s[2]?' · '+s[2]:'');e.innerHTML=semInner(s,e.dataset.big==='1')})}
function presListen(){if(window._prL||!fbDb||!esAdmin())return;window._prL=true;
 fbDb.collection('presencia').onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{const x=d.data(),k=d.id||(x&&x.id);if(k)o[k]=x});PRES=o;presPaint()},e=>console.warn('Presencia:',e));setInterval(presPaint,20000)}
// --- Estilos de voz (usan las voces en español que tenga cada dispositivo) ---
const VOZ_PERF={dama:'Dama (la de siempre)',natf:'Natural femenina',natm:'Natural masculina',jarvis:'Jarvis · asistente formal',manual:'Elegir una voz de este dispositivo'},VOZ_A={dama:[.95,1.1],natf:[1,1],natm:[1,1],jarvis:[.9,.7],manual:[1,1]};
const vozLista=()=>(window.speechSynthesis?speechSynthesis.getVoices():[]).filter(v=>/^es/i.test(v.lang));
const vozNat=v=>/natural|neural|online|premium|enhanced|siri/i.test(v.name);
function vozElige(p){const L=vozLista();if(!L.length)return null;
 const mal=/jorge|diego|juan|carlos|pablo|raul|raúl|andres|andrés|alvaro|álvaro|enrique|miguel|male|hombre|tomas|tomás|jaime|alberto|ricardo|luis|pedro|gonzalo|arnau|saul|saúl/i,reg=['es-ES','es-MX','es-US','es-PA','es-419','es-CO','es-AR'],rk=v=>{const i=reg.indexOf(v.lang.replace('_','-'));return i<0?99:i},
 ord=A=>A.slice().sort((a,b)=>(vozNat(b)-vozNat(a))||(rk(a)-rk(b))),M=L.filter(v=>mal.test(v.name)),F=L.filter(v=>!mal.test(v.name));
 if(p==='manual')return L.find(x=>x.name===DB.cfg.vozNom)||ord(F.length?F:L)[0];
 if(p==='natm'||p==='jarvis')return ord(M.length?M:L)[0];
 if(p==='natf')return ord(F.length?F:L)[0];return null}
function vozPerf(u){const p=DB.cfg.vozPerf||'dama',v=(p==='dama'?null:vozElige(p))||vozEs(),a=VOZ_A[p]||VOZ_A.dama;
 if(v){u.voice=v;u.lang=v.lang}else u.lang='es-MX';
 u.rate=DB.cfg.vozVel>0?+DB.cfg.vozVel:a[0];u.pitch=DB.cfg.vozTono>0?+DB.cfg.vozTono:a[1]}
function vozTxt(s){return (DB.cfg.vozPerf==='jarvis')?s.replace('Le recuerdo amablemente que','Le informo que').replace(/^Atención\. Ha recibido/,'Atención. Le informo que ha recibido'):s}
function vozSel(){const p=DB.cfg.vozPerf||'dama',a=VOZ_A[p]||VOZ_A.dama,L=vozLista();
 return `<div class="g" style="margin-top:12px"><div><label>Estilo de voz</label><select id="vz_p" data-h-change="h152">${Object.keys(VOZ_PERF).map(k=>`<option value="${k}" ${p===k?'selected':''}>${VOZ_PERF[k]}</option>`).join('')}</select></div><div><label>Voces de este dispositivo ⭐ = más naturales</label><select data-h-change="h151">${L.length?'<option value="">— elegir —</option>'+L.map(v=>`<option value="${esc(v.name)}" ${DB.cfg.vozNom===v.name&&p==='manual'?'selected':''}>${vozNat(v)?'⭐ ':''}${esc(v.name)} (${esc(v.lang)})</option>`).join(''):'<option value="">Sin voces en español en este dispositivo</option>'}</select></div></div><details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px">Ajuste fino (velocidad y tono)</summary><div class="g" style="margin-top:8px"><div><label>Velocidad</label><input id="vz_v" type="range" min="0.6" max="1.4" step="0.05" value="${DB.cfg.vozVel>0?DB.cfg.vozVel:a[0]}" data-h-change="h150"></div><div><label>Tono (grave a agudo)</label><input id="vz_t" type="range" min="0.5" max="1.5" step="0.05" value="${DB.cfg.vozTono>0?DB.cfg.vozTono:a[1]}" data-h-change="h149"></div></div><p><button class="btn s" data-h-click="h148">Restablecer ajuste del estilo</button></p></details>`}
function vozReset(sil){delete DB.cfg.vozVel;delete DB.cfg.vozTono;if(!sil)save();const a=VOZ_A[DB.cfg.vozPerf||'dama']||VOZ_A.dama;if($('vz_v'))$('vz_v').value=a[0];if($('vz_t'))$('vz_t').value=a[1];if(!sil)vozProbar()}
// --- Chat interno (directo y grupos) ---
let CHS=[],CH={sel:null,unsub:null,msgs:[]},_chOn=false;
const chatMe=()=>SES?SES.id:null;
const chatName=id=>id==='admin'?'Administrador':((usuarios().find(u=>u.id===id)||{}).n||'Usuario');
const chatMine=c=>esAdmin()||(c.members||[]).includes(chatMe());
const chatRK=()=>'tj_chr_'+chatMe();

const CHAT_EMOJIS = [
  '\uD83D\uDE0A','\uD83D\uDE02','\uD83D\uDE03','\uD83D\uDE0D','\uD83D\uDC4D','\uD83D\uDC4F','\uD83D\uDE4F','\u2764\uFE0F','\uD83D\uDD25','\uD83C\uDF89',
  '\uD83D\uDCBC','\uD83D\uDCC4','\uD83D\uDCB0','\uD83D\uDCB3','\uD83D\uDCE6','\uD83D\uDE9A','\u2705','\u2B50','\uD83E\uDD1D','\uD83D\uDCAF',
  '\uD83D\uDE0E','\uD83E\uDD73','\uD83E\uDD29','\uD83D\uDC4C','\u2728','\uD83D\uDE80','\uD83D\uDD14','\uD83D\uDCCC','\uD83D\uDCCD','\uD83D\uDCDE',
  '\u2615','\uD83C\uDF55','\uD83E\uDDC1','\uD83D\uDCAA','\uD83D\uDE4B\u200D\u2642\uFE0F','\uD83D\uDE4B\u200D\u2640\uFE0F','\uD83D\uDC40','\uD83D\uDCAC','\uD83D\uDD52','\uD83D\uDCC6'
];

function toggleChatEmoji(){
  const p = $('chatEmojiPicker');
  if(p) p.classList.toggle('on');
}

function insertChatEmoji(emoji){
  const t = $('chin');
  if(!t) return;
  const start = t.selectionStart || t.value.length;
  const end = t.selectionEnd || t.value.length;
  t.value = t.value.substring(0, start) + emoji + t.value.substring(end);
  t.focus();
  t.selectionStart = t.selectionEnd = start + emoji.length;
  const p = $('chatEmojiPicker');
  if(p) p.classList.remove('on');
}

function shareFacChat(facId){
  const f = DB.fac.find(x => x.id == facId);
  if(!f) return;
  const chats = chatVis();
  if(!chats.length){
    alert('No hay conversaciones activas en el chat.');
    return;
  }
  const summaryText = '\uD83D\uDCC4 *FACTURA #' + f.n + '*\n\uD83D\uDC64 Cliente: ' + f.cli + '\n\uD83D\uDCB5 Total: ' + $$(f.total) + '\n\uD83D\uDCB3 Estado: ' + (f.anulada ? 'ANULADA' : f.pago) + '\n\uD83D\uDCC5 Fecha: ' + fdate(f.fecha);
  
  let listHtml = '';
  for(let i=0; i<chats.length; i++){
    const c = chats[i];
    const icon = c.type === 'grp' ? '\uD83D\uDC65' : '\uD83D\uDC64';
    const sub = c.type === 'grp' ? 'Grupo' : 'Mensaje Directo';
    listHtml += '<button class="btn s" style="text-align:left;padding:10px;display:flex;align-items:center;gap:10px;width:100%" data-h-click="enviarFacChat" data-a-click="' + _ha(c.id, summaryText) + '">' +
      '<span style="font-size:18px">' + icon + '</span>' +
      '<div><b>' + esc(chatTitle(c)) + '</b><br><small style="color:var(--gris)">' + sub + '</small></div>' +
    '</button>';
  }

  $('mb').innerHTML = '<h3 style="margin-top:0">\uD83D\uDCE8 Compartir Factura #' + f.n + ' en el Chat</h3>' +
    '<p style="font-size:13px;color:var(--gris)">Seleccione la conversaci\u00F3n o grupo al que desea enviar el detalle de la factura:</p>' +
    '<div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;margin:12px 0">' +
      listHtml +
    '</div>' +
    '<div style="display:flex;justify-content:flex-end;margin-top:10px">' +
      '<button class="btn" data-h-click="h12">Cancelar</button>' +
    '</div>';
  $('md').classList.add('on');
}

async function enviarFacAChat(chatId, text){
  if(!fbDb) { alert('El chat requiere conexi\u00F3n a internet.'); return; }
  const me = chatMe();
  const ts = Date.now();
  const id = uid();
  const c = chatVis().find(x => x.id === chatId);
  if(!c) return;
  const base = {
    id: c.id,
    type: c.type,
    members: c.members || [],
    lastTs: ts,
    lastFrom: me,
    lastTxt: ((c.type === 'grp' ? chatName(me) + ': ' : '') + text.replace(/\\n/g, ' ')).slice(0, 60)
  };
  if(c.type === 'grp'){ base.name = c.name; base.by = c.by || ''; }
  try {
    const ref = fbCol('chats').doc(c.id);
    await ref.collection('msgs').doc(id).set({ id, from: me, fn: chatName(me), t: text, ts });
    await ref.set(base, { merge: true });
    cerrar();
    agToast('Factura compartida en el chat');
    ir('chat');
    chatOpen(c.id);
  } catch(e) {
    alert('No se pudo enviar la factura al chat.');
  }
}

function chatRead(){try{return JSON.parse(localStorage.getItem(chatRK())||'{}')}catch(e){return {}}}
function chatMark(id,ts){const r=chatRead();r[id]=Math.max(r[id]||0,ts||Date.now());try{localStorage.setItem(chatRK(),JSON.stringify(r))}catch(e){window._tjw&&_tjw(e)}chatBadge()}
const chatUn=c=>!!c.lastTs&&c.lastFrom!==chatMe()&&c.lastTs>(chatRead()[c.id]||0);
const chatTitle=c=>c.type==='grp'?c.name:(esAdmin()?chatName(c.id.slice(3)):'Administrador');
function chatVis(){const me=chatMe(),map={};CHS.forEach(c=>{map[c.id]=c});const out=[];
 if(esAdmin())usuarios().forEach(u=>out.push(map['dm_'+u.id]||{id:'dm_'+u.id,type:'dm',members:['admin',u.id],ph:1}));
 else if(me)out.push(map['dm_'+me]||{id:'dm_'+me,type:'dm',members:['admin',me],ph:1});
 CHS.filter(c=>c.type==='grp'&&chatMine(c)).forEach(c=>out.push(c));return out}
function chatBadge(){if(!SES)return;const n=chatVis().filter(c=>chatUn(c)).length;document.querySelectorAll('.ni[data-k="chat"] .lb').forEach(e=>{const b=e.querySelector('.cbd');if(b)b.remove();if(n){const x=document.createElement('b');x.className='cbd';x.textContent=n;e.appendChild(x)}})}
const _nv=nav;nav=function(){_nv.apply(this,arguments);try{chatBadge()}catch(e){window._tjw&&_tjw(e)}};
function chatListen(){if(_chOn||!fbDb)return;_chOn=true;let first=true;
 // La consulta coincide con la regla de Firestore: cada cuenta solo descarga los
 // chats cuyo arreglo members la incluye. Nunca se carga la lista global de chats.
 fbCol('chats').where('members','array-contains',chatMe()).onSnapshot(sn=>{
  if(!first)sn.docChanges().forEach(ch=>{const c=ch.doc.data();if(!c||!/^[\w-]{1,64}$/.test(ch.doc.id))return;if(ch.type!=='removed'&&SES&&c.lastFrom&&c.lastFrom!==chatMe()&&(c.type==='dm'?(esAdmin()||c.id==='dm_'+chatMe()):chatMine(c))){if(!(vista==='chat'&&CH.sel===c.id)){try{agSound()}catch(e){window._tjw&&_tjw(e)}}chatVoz(c)}});
  first=false;CHS=sn.docs.map(d=>{const o=d.data();return o&&/^[\w-]{1,64}$/.test(d.id)?Object.assign(o,{id:d.id}):null}).filter(Boolean);if(SES){chatBadge();if(vista==='chat')chatList()}},()=>{})}
R.chat=function(){if(!fbDb){$('v').innerHTML='<div class="card"><div class="vacio">El chat necesita conexión a internet.</div></div>';chatFitSoon();return}chatListen();
 $('v').innerHTML=`<div class="chw ${CH.sel?'sel':''}" id="chw"><div class="chl card" id="chl"></div><div class="chm card" id="chm"></div></div>`;chatList();chatConv();chatFitSoon()};
function chatList(){const el=$('chl');if(!el)return;const L=chatVis().sort((a,b)=>(b.lastTs||0)-(a.lastTs||0)),dms=L.filter(c=>c.type==='dm'),gs=L.filter(c=>c.type==='grp');
 const it=c=>`<div class="chi ${CH.sel===c.id?'on':''}" data-h-click="h147" data-a-click="${_ha(c.id)}"><div class="cha">${c.type==='grp'?'👥':avHTML(esAdmin()?c.id.slice(3):'admin',38)}</div><div class="chn"><b>${esc(chatTitle(c))}</b><small>${esc(c.lastTxt||(c.ph?'Sin mensajes':''))}</small></div>${c.type==='grp'?'':semHTML(esAdmin()?c.id.slice(3):'')}${chatUn(c)?'<i class="cbd">•</i>':''}</div>`;
 el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><h3 style="margin:0">💬 Chat</h3><button class="btn p s" data-h-click="h146">+ Grupo</button></div><div class="chs">Mensajes directos</div>${dms.map(it).join('')||'<div class="vacio">Sin contactos.</div>'}<div class="chs">Grupos</div>${gs.map(it).join('')||'<div class="vacio">Aún no hay grupos.</div>'}`}
async function chatOpen(id){CH.sel=id;CH.msgs=[];if(CH.unsub){CH.unsub();CH.unsub=null}const w=$('chw');if(w)w.classList.add('sel');
 // El chat directo aparece inicialmente como un contacto local. Créelo antes de
 // escuchar sus mensajes, pues las reglas comprueban la membresía del padre.
 const c=chatVis().find(x=>x.id===id);if(c&&c.ph)try{await fbCol('chats').doc(id).set({id,type:'dm',members:c.members||[],ts:Date.now(),lastTs:0,lastFrom:'',lastTxt:''},{merge:true})}catch(e){alert('No se pudo abrir el chat. Revise su conexión.');return}
 CH.unsub=fbCol('chats').doc(id).collection('msgs').orderBy('ts').limitToLast(300).onSnapshot(sn=>{CH.msgs=sn.docs.map(d=>d.data());if(CH.sel===id){chatConv();chatMark(id,(CH.msgs[CH.msgs.length-1]||{}).ts);chatList()}},()=>{});chatList();chatConv()}
function chatBack(){CH.sel=null;if(CH.unsub){CH.unsub();CH.unsub=null}const w=$('chw');if(w)w.classList.remove('sel');chatList();chatConv()}
function chatConv(){const el=$('chm');if(!el)return;const c=chatVis().find(x=>x.id===CH.sel);
 if(!c){el.innerHTML='<div class="vacio" style="margin:auto">Elija una conversación</div>';return}
 const i0=$('chin'),prev=i0?i0.value:'',had=!!i0&&document.activeElement===i0,me=chatMe(),grp=c.type==='grp';
 el.innerHTML=`<div class="chh"><button class="btn s chb" data-h-click="h145" aria-label="Volver a la lista de chats">‹</button>${grp?'':`<span class="avc" data-h-click="h16" data-a-click="${_ha(esAdmin()?c.id.slice(3):'admin')}" title="Ver foto">${avHTML(esAdmin()?c.id.slice(3):'admin',34)}</span>`}<span class="chtt"><b>${esc(chatTitle(c))}</b>${grp?'':semHTML(esAdmin()?c.id.slice(3):'',1)}</span>${!grp&&llamOn()?`<button class="btn s" style="margin-left:auto" data-h-click="h144" data-a-click="${_ha(c.id)}">📞 Llamar</button>`:''}${grp?`<small>${esc((c.members||[]).map(chatName).join(', '))}</small>`:''}${grp&&(esAdmin()||c.by===me)?`<button class="btn s d" style="margin-left:auto" data-h-click="h143" data-a-click="${_ha(c.id)}">🗑 Eliminar grupo</button>`:''}</div><div class="chms" id="chms">${CH.msgs.map(m=>`<div class="cm ${m.from===me?'me':''}">${grp&&m.from!==me?`<small>${esc(m.fn||'')}</small>`:''}${chatCb(m.t)}<small>${new Date(m.ts).toLocaleTimeString('es-PA',{hour:'2-digit',minute:'2-digit'})}</small></div>`).join('')||'<div class="vacio">Escriba el primer mensaje 👋</div>'}</div><div class="chin"><div class="emop ${EMO.open?'on':''}" id="emop">${EMO.open?emoHTML():''}</div><button type="button" class="btn s emob" data-h-click="h142" title="Emojis">😊</button><textarea id="chin" rows="1" placeholder="Escriba un mensaje…" data-h-keydown="h141" data-h-focus="h140">${esc(prev)}</textarea><button class="btn p" data-h-click="h139">Enviar</button></div>`;
 const b=$('chms');if(b)b.scrollTop=b.scrollHeight;if(had){const n=$('chin');if(n)n.focus()}}
async function chatSend(){const i=$('chin');if(!i||!CH.sel||!fbDb)return;const t=(i.value||'').trim().slice(0,2000);if(!t)return;const c=chatVis().find(x=>x.id===CH.sel);if(!c)return;i.value='';
 const me=chatMe(),ts=Date.now(),id=uid(),base={id:c.id,type:c.type,members:c.members||[],lastTs:ts,lastFrom:me,lastTxt:((c.type==='grp'?chatName(me)+': ':'')+chatPrev(t)).slice(0,60)};
 if(c.type==='grp'){base.name=c.name;base.by=c.by||''}
 // Primero existe/actualiza el chat y después se agrega el mensaje: las reglas de
 // Firestore verifican que el remitente sea integrante del documento padre.
 try{const ref=fbCol('chats').doc(c.id);await ref.set(base,{merge:true});await ref.collection('msgs').doc(id).set({id,from:me,fn:chatName(me),t,ts});chatMark(c.id,ts)}catch(e){alert('No se pudo enviar. Revise su conexión.')}}
function chatNewGrp(){const me=chatMe(),op=usuarios().filter(u=>u.id!==me);
 $('mb').innerHTML=`<h3 style="margin-top:0">Nuevo grupo</h3><label>Nombre del grupo</label><input id="cg_n" placeholder="Ej. Ventas Panamá Oeste"><label style="display:block;margin-top:12px">Integrantes</label><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:6px">${op.map(u=>`<label class="pchk"><input type="checkbox" value="${u.id}"> ${esc(u.n)}</label>`).join('')||'<div class="vacio">Aún no hay otros vendedores.</div>'}</div><div id="cg_m" style="color:#d92d20;font-size:13px;margin-top:8px"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn" data-h-click="h12">Cancelar</button><button class="btn p" data-h-click="h138">Crear grupo</button></div>`;$('md').classList.add('on')}
async function chatMkGrp(){const n=$('cg_n').value.trim(),sel=[...document.querySelectorAll('#mb .pchk input:checked')].map(x=>x.value),me=chatMe(),m=t=>{$('cg_m').textContent=t};
 if(!n)return m('Escriba el nombre del grupo.');if(!sel.length)return m('Elija al menos un integrante.');
 const id='g'+uid(),ts=Date.now();try{await fbCol('chats').doc(id).set({id,type:'grp',name:n,by:me,members:[me,...sel],ts,lastTs:ts,lastFrom:me,lastTxt:'Grupo creado'});cerrar();chatOpen(id)}catch(e){m('No se pudo crear. Revise su conexión.')}}
async function chatDelGrp(id){if(!confirm('¿Eliminar este grupo y todos sus mensajes?'))return;
 try{const ref=fbCol('chats').doc(id),sn=await ref.collection('msgs').get(),b=fbDb.batch();sn.docs.forEach(d=>b.delete(d.ref));b.delete(ref);await b.commit();if(CH.unsub){CH.unsub();CH.unsub=null}CH.sel=null;if(vista==='chat')R.chat()}catch(e){alert('No se pudo eliminar el grupo.')}}
let _chVz={};
function chatVoz(c){if(DB.cfg.vozChat===0)return;const now=Date.now();if(_chVz[c.id]&&now-_chVz[c.id]<4000)return;_chVz[c.id]=now;
 const de=c.lastFrom==='admin'?'la administración':chatName(c.lastFrom);let t;
 if(c.type==='grp')t=c.lastTxt==='Grupo creado'?'Atención. Ha sido agregado al grupo '+c.name+', por '+de+'.':'Atención. Nuevo mensaje de '+de+', en el grupo '+c.name+'.';
 else t='Atención. Ha recibido un nuevo mensaje de '+de+'.';
 setTimeout(()=>vozDama(t),700)}
function vozProbarChat(){vozDama('Atención. Ha recibido un nuevo mensaje de María Pérez.')}
// --- Vendedores: sin subir ni importar al catálogo ---
['subir','impCatFile'].forEach(n=>{const o=window[n];if(typeof o!=='function')return;window[n]=function(){if(esVend()){alert('Su usuario no tiene permiso para subir archivos al catálogo.');return}return o.apply(this,arguments)}});
// --- Check: sin exportar ni importar para vendedores ---
function chkLock(d,w){
 d.documentElement.setAttribute('data-v','1');{const i0=d.getElementById('imp');if(i0)i0.style.setProperty('display','none','important')}/* fase 13: antes inyectaba un <style>, que la CSP ya no permite; se usa CSSOM (equivalente) */
 d.querySelectorAll('button').forEach(b=>{const t=b.getAttribute('onclick')||'';if(/exportJSON|getElementById\(\s*['"]imp['"]\s*\)/.test(t))b.remove()});
 w.exportJSON=function(){w.alert('Su usuario no tiene permiso para exportar.')};
 const i=d.getElementById('imp');if(i){i.disabled=true;i.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation()},true)}}
// --- Check: aspecto cristal Apple + colores móviles + pantalla completa en celular ---
/* CHK_SKIN: movido a css/chkskin.css (fase 13) */
function chkSkin(h){const i=h.indexOf('</head>');return i<0?h:h.slice(0,i)+'<link rel="stylesheet" href="css/chkskin.css?v=1">'+h.slice(i)}
function fitCheck(){const f=$('checkFrame');if(!f)return;if(innerWidth>820){f.style.height='calc(100vh - 150px)';f.style.minHeight='560px';return}
 const vv=window.visualViewport,vh=vv?vv.height:innerHeight,tec=vv&&vv.height<innerHeight-120,bn=document.querySelector('.bn'),bh=tec?0:(bn?bn.offsetHeight:64),top=f.getBoundingClientRect().top+scrollY;
 const h=Math.max(300,Math.floor(vh-top-bh))+'px';if(f.style.height!==h)f.style.height=h;f.style.minHeight='0'}
function checkFitSoon(){fitCheck();[120,600,1500].forEach(ms=>setTimeout(fitCheck,ms))}
addEventListener('resize',fitCheck);addEventListener('orientationchange',()=>setTimeout(fitCheck,250));if(window.visualViewport)visualViewport.addEventListener('resize',fitCheck);
const _homeBase=R.home;
if(typeof dibujarGraficos==='function'){const _dg=dibujarGraficos;dibujarGraficos=function(){if(esVend())return;try{return _dg.apply(this,arguments)}catch(e){window._tjw&&_tjw(e)}}}
function tplMinOn(){try{return localStorage.getItem(lsk('tj_tpl_min'))==='1'}catch(e){return false}}
function tplMin(){try{localStorage.setItem(lsk('tj_tpl_min'),tplMinOn()?'0':'1')}catch(e){window._tjw&&_tjw(e)}tplRef()}
const _tc0=tplCard;tplCard=function(){const cur=TPLS.find(t=>t[0]===(DB.cfg.tpl||'clasica'))||TPLS[0];
 if(tplMinOn())return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">🧾 Plantillas de factura</h3><small style="color:var(--gris)">Actual: <b>${cur[1]}</b> · Sello ${DB.cfg.sello===0?'desactivado':'activado'}</small></div><button class="btn s" data-h-click="h121">⬆ Maximizar</button></div>`;
 return `<div style="position:relative"><button class="btn s" style="position:absolute;right:0;top:0;z-index:1" data-h-click="h121">⬇ Minimizar</button>`+_tc0()+`</div>`};
const _cer=cerrar;cerrar=function(){$('mb').classList.remove('vfmax');return _cer.apply(this,arguments)};
// --- Íconos estilo Material (Flutter): menú lateral y botones ---
const NAVI={"home": ["M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z", "#3b82f6", "#1d4ed8"], "nueva": ["M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-2h2v2h3v2zm-3-7V3.5L18.5 9H13z", "#ec4899", "#be185d"], "fac": ["M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM19 19c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14zM9 7h6v2H9zM16 7h2v2h-2zM9 10h6v2H9zM16 10h2v2h-2z", "#6366f1", "#4338ca"], "prod": ["M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z", "#f97316", "#ea580c"], "cat": ["M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z", "#14b8a6", "#0f766e"], "cli": ["M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z", "#a855f7", "#7e22ce"], "ubi": ["M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", "#ef4444", "#b91c1c"], "check": ["M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", "#22c55e", "#15803d"], "agenda": ["M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z", "#0ea5e9", "#0369a1"], "config": ["M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z", "#64748b", "#334155"], "vend": ["M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z", "#8b5cf6", "#6d28d9"], "gal": ["M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z", "#f59e0b", "#b45309"], "chat": ["M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z", "#10b981", "#047857"], "empresas": ["M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z", "#0891b2", "#155e75"]};
const MIC={"💾": "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z", "🖨": "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z", "✏": "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z", "🗑": "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z", "👁": "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z", "⬇": "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z", "⬆": "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z", "➕": "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z", "➖": "M19 13H5v-2h14v2z", "✔": "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z", "✓": "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z", "✅": "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z", "✕": "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z", "🔑": "M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z", "📸": "M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z", "📄": "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z", "✉": "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z", "💬": "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z", "📨": "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z", "📤": "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z", "▶": "M8 5v14l11-7z", "↩": "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z", "🧾": "M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM19 19c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14zM9 7h6v2H9zM16 7h2v2h-2zM9 10h6v2H9zM16 10h2v2h-2z", "⛶": "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z", "🗗": "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z", "↕": "M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z", "📷": "M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"};
const MIRX=new RegExp('^\\s*('+Object.keys(MIC).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\uFE0F?\\s*');
function navIcons(){document.querySelectorAll('.ni[data-k]').forEach(n=>{const d=NAVI[n.dataset.k],ic=n.querySelector('.ic');if(!d||!ic)return;ic.innerHTML='<svg viewBox="0 0 24 24"><path d="'+d[0]+'"/></svg>';ic.style.setProperty('--c1',d[1]);ic.style.setProperty('--c2',d[2])})}
function iconize(root){(root||document.body).querySelectorAll('.btn').forEach(b=>{const t=b.firstChild;if(!t||t.nodeType!==3)return;const m=MIRX.exec(t.nodeValue);if(!m)return;const sp=document.createElement('span');sp.className='mi';sp.innerHTML='<svg viewBox="0 0 24 24"><path d="'+MIC[m[1]]+'"/></svg>';t.nodeValue=t.nodeValue.slice(m[0].length);b.insertBefore(sp,t)})}
const _nvi=nav;nav=function(){_nvi.apply(this,arguments);try{navIcons()}catch(e){window._tjw&&_tjw(e)}};
(()=>{let q=0;const run=()=>{q=0;try{iconize(document.body)}catch(e){window._tjw&&_tjw(e)}};new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(run)}}).observe(document.body,{childList:true,subtree:true});run()})();
// ===================== TIENDA VIRTUAL =====================
const SHOP=/[?&]tienda(=|&|$)/.test(location.search);
const TD={items:[],leads:[],peds:[],cat:[]},SH={items:[],cart:{},cli:null,ref:'admin',cat:'',q:'',err:0};


const PALETAS=[['shop','🟣 Shop Mist (Original)','#5433eb','#f2f4f5'],['lino','🌾 Lino Cálido & Ámbar','#8a5a12','#f7f4ed'],['rosa','💌 Rosa Blush (Amor)','#c8183c','#faf1f4'],['esmeralda','💍 Eucalipto & Esmeralda','#0e3c30','#f0f5f2'],['violeta','🎈 Lavanda & Púrpura','#6b32b8','#f4f0fa'],['oceano','🌊 Hielo Nórdico & Océano','#0e6b78','#eef4f7'],['borgona','🎓 Marino & Oro Real','#121e42','#f0f2f7'],['clasico','⚫ Clásico Blanco Puro','#1D1D1F','#ffffff'],['carbon','🪨 Carbón & Piedra','#30363D','#f0f1f3'],['dark','🌙 Dark Obsidian Pro','#7c66ff','#0c0c0e']];
const tdBase=()=>location.href.split(/[?#]/)[0];
const BUILD=(Date.parse(document.lastModified)||0).toString(36);const tdLink=()=>((typeof esAdmin==='function'&&!esAdmin()&&TD.base)||tdBase())+'?tienda=1'+tdEmpQ()+'&v='+encodeURIComponent(chatMe()||'admin')+'&r='+(TD.rev||BUILD);
const tdMoney=n=>+n>0?$$(+n):'Consultar';
// ---------- Panel interno (admin y vendedores) ----------
let _tdOn=false;
function tdAviso(t){try{agSound()}catch(e){window._tjw&&_tjw(e)}if(DB.cfg.vozChat!==0)setTimeout(()=>vozDama('Atención. '+t),600)}

/*FLE-UI-INI*/
const fleCfgTD=()=>fleSanCfg(typeof TD!=='undefined'?TD.fletes:null);
const fleCfgSH=()=>fleSanCfg(typeof SH!=='undefined'?SH.fletes:null);
let FLE_MSG=null,FLE_FOTO=null;
function fleFicha(c,C){
 const l=[];
 if(c.d)l.push(esc(c.d));
 if(c.tel&&c.tel.length)l.push('📞 '+esc(fleTelTxt(c)));
 if(c.wa)l.push('💬 WhatsApp '+esc(c.wa));
 if(c.mail)l.push('✉️ '+esc(c.mail));
 if(c.dir)l.push('📍 '+esc(c.dir));
 if(c.hor)l.push('🕒 '+esc(c.hor));
 if(c.web)l.push('🌐 <a href="https://'+esc(c.web)+'" target="_blank" rel="noopener noreferrer">'+esc(c.web)+'</a>');
 if(c.ig)l.push('📷 Instagram '+esc(c.ig));
 if(c.suc&&c.suc.length)l.push('<details><summary>Sucursales reportadas ('+c.suc.length+')</summary>'+c.suc.map(s=>esc(s[0])+': '+esc(s[1])).join('<br>')+'</details>');
 if(c.nota)l.push('<i>'+esc(c.nota)+'</i>');
 return l.map(x=>'<div style="font-size:12.5px;line-height:1.5;margin-top:2px">'+x+'</div>').join('')
}
function fleFila(c,C,on){
 const lg=fleLogo(c,C);
 return `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid rgba(128,128,128,.25)"><img src="${lg}" alt="" width="48" height="48" style="width:48px;height:48px;border-radius:10px;object-fit:cover;flex:none;background:#ddd">
  <div style="flex:1;min-width:0"><b>${esc(c.n)}</b> <small style="color:var(--gris)">${c.t==='i'?'Internacional':'Nacional'}${c.extra?' · propia':''}</small>
  <details><summary style="font-size:12.5px;cursor:pointer;color:var(--gris)">Ver datos</summary>${fleFicha(c,C)}</details></div>
  <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex:none">
   <label style="display:inline-flex;gap:5px;align-items:center;font-size:13px"><input type="checkbox" ${on?'checked':''} data-h-change="h345" data-a-change="${_ha(c.id)}"> En la tienda</label>
   <span style="display:flex;gap:6px"><button class="btn s" data-h-click="h346" data-a-click="${_ha(c.id)}" title="Subir foto o logo">📷</button>${C.img[c.id]?`<button class="btn s" data-h-click="h347" data-a-click="${_ha(c.id)}" title="Quitar foto">↺</button>`:''}${c.extra?`<button class="btn s d" data-h-click="h349" data-a-click="${_ha(c.id)}" title="Eliminar" aria-label="Eliminar">🗑</button>`:''}</span>
  </div></div>`
}
function fleAdmCard(){
 const C=fleCfgTD(),all=fleAll(C),on=new Set(C.on),g=t=>all.filter(c=>c.t===t).map(c=>fleFila(c,C,on.has(c.id))).join('');
 return `<h3 style="margin:0">🚚 Transportistas de carga</h3><p style="font-size:12.5px;color:var(--gris)">Lista predeterminada de empresas de fletes y encomiendas. Marque <b>En la tienda</b> las que quiera ofrecer: el cliente elegirá una al hacer su pedido y, cuando el pedido llegue, la etiqueta de envío ya trae el nombre, teléfono, WhatsApp y dirección de esa empresa. Con 📷 puede poner la foto o logo real de cada una. Los datos vienen de directorios públicos: confirme con la empresa antes de enviar.</p>
 <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0"><button class="btn s" data-h-click="h348" data-a-click="${_ha('todos')}">☑ Todas en la tienda</button><button class="btn s" data-h-click="h348" data-a-click="${_ha('ninguno')}">☐ Ninguna</button><span style="font-size:13px"><b>${C.on.length}</b> de ${all.length} se ofrecen en la tienda</span></div>
 <h4 style="margin:12px 0 0">Nacionales</h4>${g('n')}<h4 style="margin:14px 0 0">Internacionales</h4>${g('i')}
 <input type="file" id="fle_file" accept="image/*" hidden data-h-change="h350">
 <h4 style="margin:16px 0 6px">➕ Añadir otra empresa</h4>
 <div class="g"><div><label>Nombre</label><input id="fl_n" maxlength="80" autocomplete="off"></div><div><label>Tipo</label><select id="fl_t"><option value="n">Nacional</option><option value="i">Internacional</option></select></div><div><label>Teléfono</label><input id="fl_tel" maxlength="30" autocomplete="off"></div><div><label>WhatsApp</label><input id="fl_wa" maxlength="30" autocomplete="off"></div><div style="grid-column:1/-1"><label>Dirección</label><input id="fl_dir" maxlength="200" autocomplete="off"></div><div><label>Página web</label><input id="fl_web" maxlength="100" placeholder="empresa.com" autocomplete="off"></div></div>
 <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px"><button class="btn p" data-h-click="h351">Añadir a la lista</button><span id="fle_est" style="font-size:13px;color:${FLE_MSG?FLE_MSG.ok?'#1e7a43':'#b3261e':'inherit'}">${FLE_MSG?esc(FLE_MSG.t):''}</span></div>`
}
function fleRefrescar(forzar){const c=$('fleCard');if(!c)return;if(!forzar&&document.activeElement&&c.contains(document.activeElement)&&document.activeElement.tagName!=='BODY')return;c.innerHTML=fleAdmCard()}
function fleMsg(ok,t){FLE_MSG={ok,t};const e=$('fle_est');if(e){e.style.color=ok?'#1e7a43':'#b3261e';e.textContent=t}}
async function fleGuardar(C){
 if(!esAdmin())return alert('Solo el administrador puede cambiar los transportistas.'),false;
 if(!fbDb)return alert('Sin conexión con Firebase. Intente de nuevo en un momento.'),false;
 C=fleSanCfg(C);const ref=fbCol('tienda_items').doc('__cfg');fleMsg(true,'Guardando…');
 try{try{await ref.update({fletes:C,ts:Date.now()})}catch(e){await ref.set({__cfg:true,fletes:C,ts:Date.now()},{merge:true})}
  TD.fletes=C;fleMsg(true,'✔ Guardado. Ya se ve en la tienda virtual.');fleRefrescar(true);return true
 }catch(e){window._tjw&&_tjw(e);fleMsg(false,'✖ No se pudo guardar. Revise su conexión o permisos.');return false}
}
function fleToggle(id,on){const C=fleCfgTD(),s=new Set(C.on);if(on)s.add(id);else s.delete(id);C.on=[...s];fleGuardar(C)}
function fleTodos(m){const C=fleCfgTD();C.on=m==='todos'?fleAll(C).map(c=>c.id):[];fleGuardar(C)}
function fleElegirFoto(id){FLE_FOTO=id;const f=$('fle_file');if(f){f.value='';f.click()}}
function fleQuitarFoto(id){const C=fleCfgTD();delete C.img[id];fleGuardar(C)}
function fleSubirFoto(inp){
 const f=inp&&inp.files&&inp.files[0],id=FLE_FOTO;if(!f||!id)return;
 if(!/^image\//.test(f.type))return alert('Elija un archivo de imagen.');
 const u=URL.createObjectURL(f),im=new Image();
 im.onload=()=>{try{const s=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=160;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,160,160);
   g.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,160,160);const url=c.toDataURL('image/jpeg',.78);
   if(url.length>38000)return alert('La imagen es demasiado pesada. Use una más sencilla.');
   const C=fleCfgTD();C.img[id]=url;fleGuardar(C)}catch(e){window._tjw&&_tjw(e);alert('No se pudo procesar la imagen.')}finally{URL.revokeObjectURL(u)}};
 im.onerror=()=>{URL.revokeObjectURL(u);alert('No se pudo leer la imagen.')};im.src=u
}
function fleEliminar(id){
 const C=fleCfgTD(),c=C.extra.find(x=>x.id===id);if(!c||!confirm('¿Eliminar "'+c.n+'" de la lista?'))return;
 C.extra=C.extra.filter(x=>x.id!==id);C.on=C.on.filter(x=>x!==id);delete C.img[id];fleGuardar(C)
}
function fleAgregar(){
 const v=id=>{const e=$(id);return e?e.value.trim():''},C=fleCfgTD();
 if(!v('fl_n'))return fleMsg(false,'✖ Escriba el nombre de la empresa.');
 if(C.extra.length>=30)return fleMsg(false,'✖ Ya llegó al máximo de 30 empresas propias.');
 const x=fleSanExtra({id:'x'+Date.now().toString(36).slice(-8)+Math.random().toString(36).slice(2,5),n:v('fl_n'),t:v('fl_t'),tel:[v('fl_tel')],wa:v('fl_wa'),dir:v('fl_dir'),web:v('fl_web')});
 if(!x)return fleMsg(false,'✖ Revise los datos de la empresa.');
 if(v('fl_web')&&!x.web)return fleMsg(false,'✖ La página web no es válida (ej. empresa.com).');
 if(fleBuscar(x.n,C)&&fleNorm(fleBuscar(x.n,C).n)===fleNorm(x.n))return fleMsg(false,'✖ Esa empresa ya está en la lista.');
 C.extra.push(x);C.on.push(x.id);fleGuardar(C)
}
/* ----- Tienda pública: selector en el carrito ----- */
function fleShopLista(){const C=fleCfgSH();return{C,L:fleAll(C).filter(c=>C.on.includes(c.id))}}
function shopFlePrev(id){
 const {C,L}=fleShopLista(),c=L.find(x=>x.id===id);if(!c)return'';
 return `<div style="display:flex;gap:10px;align-items:center;margin-top:8px;padding:8px;border-radius:12px;background:rgba(128,128,128,.1)"><img src="${fleLogo(c,C)}" alt="" width="44" height="44" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex:none"><div style="min-width:0;font-size:12.5px;line-height:1.45"><b style="font-size:13.5px">${esc(c.n)}</b><br>${esc(c.d||'')}${c.tel&&c.tel.length?'<br>📞 '+esc(fleTelTxt(c)):''}${c.wa?'<br>💬 '+esc(c.wa):''}${c.dir?'<br>📍 '+esc(c.dir):''}</div></div>`
}
const FLE_PROV=['Bocas del Toro','Chiriquí','Coclé','Colón','Darién','Herrera','Los Santos','Panamá','Panamá Oeste','Veraguas','Guna Yala','Emberá-Wounaan','Ngäbe-Buglé'];
SH.ev=SH.ev||{};
function shopEnvForm(c){
 if(!c)return'';const v=id=>esc(SH.ev[id]||''),i=c.t==='i',inp=(id,lb,ph,ex)=>`<div><label for="${id}" style="font-size:12.5px;font-weight:600;display:block;margin:0 0 3px">${lb}</label><input id="${id}" value="${v(id)}" placeholder="${ph||''}" maxlength="${ex||100}" autocomplete="off" data-h-input="h353"></div>`;
 const prov=i?inp('ev_prov','Estado / Provincia','',80):`<div><label for="ev_prov" style="font-size:12.5px;font-weight:600;display:block;margin:0 0 3px">Provincia</label><select id="ev_prov" data-h-change="h353" style="width:100%;padding:13px 10px;border-radius:12px;border:0;background:rgba(118,118,128,.12);color:inherit;font:inherit;font-size:16px"><option value="">Elegir…</option>${FLE_PROV.map(x=>`<option ${SH.ev.ev_prov===x?'selected':''}>${x}</option>`).join('')}</select></div>`;
 const suc=c.suc&&c.suc.length?`<div style="grid-column:1/-1"><label for="ev_suc" style="font-size:12.5px;font-weight:600;display:block;margin:0 0 3px">Sucursal de ${esc(c.n)} donde retira</label><select id="ev_suc" data-h-change="h353" style="width:100%;padding:13px 10px;border-radius:12px;border:0;background:rgba(118,118,128,.12);color:inherit;font:inherit;font-size:16px"><option value="">Que me indiquen / entrega a domicilio</option>${c.suc.map(x=>`<option ${SH.ev.ev_suc===x[0]?'selected':''}>${esc(x[0])}</option>`).join('')}</select></div>`:'';
 return `<div class="kf" style="margin-top:12px"><b style="font-size:14px">📦 Datos del envío</b><small style="display:block;color:var(--tx2);margin:2px 0 8px">Escriba los datos de la persona que recibirá el pedido. Con esto preparamos su etiqueta.</small>
  <label style="display:flex;gap:8px;align-items:center;font-size:13.5px;margin:0 0 8px"><input type="checkbox" id="ev_yo" data-h-change="h354" style="width:auto;margin:0"> Yo soy quien recibe</label>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${inp('ev_n','Nombre','',60)}${inp('ev_a','Apellido','',60)}${inp('ev_tel','Número de celular','6000-0000',30)}${inp('ev_ced','Cédula / ID (opcional)','',30)}
  ${i?inp('ev_pais','País de destino','',60):''}${prov}${inp('ev_ciu',i?'Ciudad':'Distrito / corregimiento','',80)}${suc}
  <div style="grid-column:1/-1">${inp('ev_dir','Dirección de entrega','Calle, casa o edificio, barrio',200)}</div><div style="grid-column:1/-1">${inp('ev_ref','Referencia (opcional)','Cerca de…, color de la casa…',200)}</div></div></div>`
}
function shopFleHTML(){
 const {C,L}=fleShopLista();if(!L.length)return'';
 const sel=(($('sh_fl')||{}).value)||SH.fle||'',op=t=>L.filter(c=>c.t===t).map(c=>`<option value="${esc(c.id)}" ${c.id===sel?'selected':''}>${esc(c.n)}</option>`).join(''),n=op('n'),i=op('i');
 return `<div id="k_fle"><label for="sh_fl" style="display:block;font-weight:700;font-size:14px;margin:14px 0 4px">🚚 Transportista para su envío</label><select id="sh_fl" data-h-change="h352" style="width:100%"><option value="">Que la tienda lo coordine</option>${n?'<optgroup label="Nacionales">'+n+'</optgroup>':''}${i?'<optgroup label="Internacionales">'+i+'</optgroup>':''}</select><div id="sh_fle_p">${shopFlePrev(sel)}</div><div id="sh_env">${shopEnvForm(L.find(c=>c.id===sel))}</div></div>`
}
function shopFleSel(){const {L}=fleShopLista(),id=(($('sh_fl')||{}).value)||SH.fle||'';return L.find(c=>c.id===id)||null}
function shopFleCambio(v){SH.fle=v;const p=$('sh_fle_p');if(p)p.innerHTML=shopFlePrev(v);const e=$('sh_env');if(e)e.innerHTML=shopEnvForm(shopFleSel())}
function shopEvSet(id,val){SH.ev[id]=val}
function shopEvYo(on){
 if(!on)return;const c=SH.cli||{},nm=String(c.name||'').trim().split(/\s+/),m={ev_n:nm[0]||'',ev_a:nm.slice(1).join(' '),ev_tel:c.tel||'',ev_dir:SH.ev.ev_dir||c.dir||''};
 Object.keys(m).forEach(k=>{SH.ev[k]=m[k];const e=$(k);if(e)e.value=m[k]})
}
function shopEnvDatos(c){
 const g=k=>String(SH.ev[k]||'').trim(),i=c.t==='i';
 return{agencia:c.n,fid:c.id,tipo:i?'internacional':'nacional',rec:(g('ev_n')+' '+g('ev_a')).trim(),rtel:g('ev_tel'),rced:g('ev_ced'),pais:i?g('ev_pais'):'Panamá',prov:g('ev_prov'),ciudad:g('ev_ciu'),suc:c.suc&&c.suc.length?g('ev_suc'):'',dir:g('ev_dir'),ref:g('ev_ref')}
}
function shopEnvErr(){
 const c=shopFleSel();if(!c)return'';const d=shopEnvDatos(c),g=k=>String(SH.ev[k]||'').trim();
 if(!g('ev_n')||!g('ev_a'))return'Escriba el nombre y apellido de quien recibe el pedido.';
 if(d.rtel.replace(/\D/g,'').length<7)return'Escriba un número de celular válido de quien recibe.';
 if(c.t==='i'&&!d.pais)return'Indique el país de destino.';
 if(!d.dir&&!d.suc)return'Escriba la dirección de entrega'+(c.suc&&c.suc.length?' o elija la sucursal donde retira.':'.');
 return''
}
/* Respaldo: si las reglas no admiten el campo envío, los datos viajan en la nota y el panel los lee de ahí. */
function fleNotaTxt(c,d){
 return ['🚚 Envío por: '+c.n,d.rec&&'Recibe: '+d.rec,d.rtel&&'Cel. recibe: '+d.rtel,d.rced&&'Cédula: '+d.rced,d.pais&&c.t==='i'&&'País: '+d.pais,d.prov&&'Provincia: '+d.prov,d.ciudad&&'Ciudad: '+d.ciudad,d.suc&&'Sucursal: '+d.suc,d.dir&&'Dirección: '+d.dir,d.ref&&'Ref.: '+d.ref].filter(Boolean).join('\n')
}
/* Fase 24: nota del respaldo (la escritura con `envio` fue rechazada y se reintenta sin él). Las reglas exigen nota ≤ 500 (antes se recortaba a 1200 y el reintento se rechazaba):
   primero el transportista, luego la nota del cliente y siempre al final la constancia de aceptación Ley 81. */
function fleNotaRespaldo(nota,txt){
 const n=String(nota||''),m=/\[🛡️ Aceptó[^\]]*\]$/.exec(n),ev=m?m[0]:'',cuerpo=ev?n.slice(0,n.length-ev.length).replace(/ · $/,''):n,
  ini=(txt+(cuerpo?'\n'+cuerpo:'')).slice(0,Math.max(0,500-(ev?ev.length+1:0)));
 return ev?ini+'\n'+ev:ini.slice(0,500)
}
function fleNotaEnv(nota){
 const t=String(nota||''),o={},m=(re,k)=>{const x=re.exec(t);if(x&&x[1].trim())o[k]=x[1].trim()};
 m(/^Recibe: (.+)$/m,'rec');m(/^Cel\. recibe: (.+)$/m,'rtel');m(/^Cédula: (.+)$/m,'rced');m(/^País: (.+)$/m,'pais');m(/^Provincia: (.+)$/m,'prov');m(/^Ciudad: (.+)$/m,'ciudad');m(/^Sucursal: (.+)$/m,'suc');m(/^Dirección: (.+)$/m,'dir');m(/^Ref\.: (.+)$/m,'ref');
 return o
}
/* ----- Panel: transportista elegido por el cliente en cada pedido ----- */
function fleLinea(p){
 const d=etqDatos(p,{});if(!d.agencia)return'';
 return `<small>🚚 Envío: <b>${esc(d.agencia)}</b>${d.ag&&d.ag.tel?' · '+esc(d.ag.tel):''}${d.ag&&d.ag.wa?' · WA '+esc(d.ag.wa):''}</small><br>`
}
/*FLE-UI-FIN*/


/*ETQ-UI-INI*/
let ETQ_SEL=new Set();
const etqCfg=()=>{try{return JSON.parse(localStorage.getItem(lsk('tj_etq_cfg'))||'{}')||{}}catch(e){return{}}};
const etqCfgSet=o=>{try{localStorage.setItem(lsk('tj_etq_cfg'),JSON.stringify(Object.assign(etqCfg(),o)))}catch(e){window._tjw&&_tjw(e)}};
const etqLocal=()=>{try{return JSON.parse(localStorage.getItem(lsk('tj_etq_env'))||'{}')||{}}catch(e){return{}}};
const etqNum=p=>String(p.id||'').slice(-6).toUpperCase();
const etqEnvio=p=>Object.assign({},etqLocal()[p.id]||{},p.envio||{});
const etqImpresa=p=>!!(etqEnvio(p).etq);
function etqGuardar(p,env,marcar){
 const ts=marcar?Date.now():0,add=Object.assign({},env||{},marcar?{etq:ts}:{});
 try{const L=etqLocal();L[p.id]=Object.assign({},L[p.id]||{},add);localStorage.setItem(lsk('tj_etq_env'),JSON.stringify(L))}catch(e){window._tjw&&_tjw(e)}
 p.envio=Object.assign({},p.envio||{},add);
 if(esAdmin()&&fbDb)fbCol('tienda_pedidos').doc(p.id).update(env?{envio:sanEnv(p.envio)}:{'envio.etq':ts}).catch(e=>console.warn('No se pudieron guardar los datos de envío en la nube',e))
}
/* Datos de una etiqueta: lo guardado del pedido, completado con los valores comunes (def) del lote. */
function etqDatos(p,def){
 const l=p.lead||{},env=Object.assign({},fleNotaEnv(p.nota),etqEnvio(p)),c=(typeof DB!=='undefined'&&DB.cfg)||{};def=def||{};
 // Agencia: lo escrito en el pedido > la que eligió el cliente en la tienda > la nota > la última usada
 const FC=fleSanCfg(typeof TD!=='undefined'?TD.fletes:null);let car=null,nm=env.agencia||'',porFid=false;
 if(!nm){car=fleAll(FC).find(x=>x.id===env.fid)||null;if(car){nm=car.n;porFid=true}else{const m=/🚚 Envío por: (.+)/.exec(p.nota||'');if(m)nm=m[1].trim().slice(0,80)}}
 if(!nm)nm=def.agencia||'';
 if(!car&&nm)car=fleBuscar(nm,FC);
 const tipo=env.tipo||(porFid?(car.t==='i'?'internacional':'nacional'):def.tipo)||'nacional',pais=env.pais||def.pais||(tipo==='nacional'?'Panamá':'');
 const cont=env.cont||(p.items||[]).map(i=>i.q+' x '+i.n).join(', ');
 return{tipo,agencia:nm,guia:env.guia||'',peso:+env.peso||0,obs:env.obs||'',cont,
  ag:car?{tel:(car.tel&&car.tel[0])||'',wa:car.wa||'',dir:car.dir||''}:null,logo:car?fleLogo(car,FC):'',
  codigo:'TJ-'+etqNum(p),fecha:new Date().toLocaleDateString('es-PA'),
  rem:{nombre:c.nombre||(typeof nombreNegocio==='function'?nombreNegocio():'Tarjetería Jhon'),tel:c.tel||'',dir:c.dir||''},
  dest:{name:env.rec||l.name||'',empresa:l.empresa||'',tel:env.rtel||l.tel||'',email:l.email||'',ced:env.rced||'',suc:env.suc||'',ref:env.ref||'',dir:env.dir||l.dir||'',ciudad:env.ciudad||'',prov:env.prov||'',pais},
  nb:Math.min(99,Math.max(1,+env.bultos||1))}
}
function etqExpandir(datos){const L=[];datos.forEach(e=>{for(let i=1;i<=e.nb;i++)L.push(Object.assign({},e,{bulto:[i,e.nb]}))});return L}
function etqGenerar(pedidos,def,tamId){
 const tam=ETQ_TAM[tamId]||ETQ_TAM.e100x150;
 if(!(window.jspdf&&window.jspdf.jsPDF))return alert('Para generar las etiquetas se necesita conexión a internet (librería de PDF no disponible).'),false;
 let blob;try{blob=etqPDF(etqExpandir(pedidos.map(p=>etqDatos(p,def))),tam)}catch(e){window._tjw&&_tjw(e);return alert('No se pudo generar la etiqueta: '+((e&&e.message)||e)),false}
 if(!blob)return alert('No se pudo generar la etiqueta.'),false;
 etqCfgSet({tam:tamId});
 shopPdfVer(blob,pedidos.length===1?'Etiqueta-'+etqNum(pedidos[0])+'.pdf':'Etiquetas-'+pedidos.length+'-pedidos.pdf');return true
}
const etqOpcTam=sel=>Object.keys(ETQ_TAM).map(k=>`<option value="${k}" ${k===sel?'selected':''}>${esc(ETQ_TAM[k].n)}</option>`).join('');
const etqAgencias=()=>{const a=etqCfg().agencias;return Array.isArray(a)?a:[]};
const etqAgOpts=()=>{const n=fleAll(fleSanCfg(typeof TD!=='undefined'?TD.fletes:null)).map(c=>c.n),L=n.concat(etqAgencias().filter(a=>!n.some(x=>x.toLowerCase()===a.toLowerCase())));return L.map(a=>`<option value="${esc(a)}">`).join('')};
function etqRecordarAgencia(a){a=String(a||'').trim().slice(0,80);if(!a)return;const L=etqAgencias().filter(x=>x.toLowerCase()!==a.toLowerCase());L.unshift(a);etqCfgSet({agencias:L.slice(0,12),agencia:a})}
const etqV=id=>{const e=$(id);return e?e.value.trim():''};
function etqAbrir(id){
 const p=TD.peds.find(x=>x.id===id);if(!p)return;const l=p.lead||{},d=etqDatos(p,{tipo:etqCfg().tipo,agencia:etqCfg().agencia}),env=etqEnvio(p);
 $('mb').innerHTML=`<h3 style="margin-top:0">🏷️ Etiqueta de envío · Pedido ${esc(etqNum(p))}</h3><p style="font-size:13px;color:var(--gris);margin:0 0 10px">${esc(l.name||'Cliente')}${l.tel?' · '+esc(l.tel):''}</p>
 <div class="g">
  <div><label>Tipo de envío</label><select id="et_tipo" data-h-change="h343"><option value="nacional" ${d.tipo==='nacional'?'selected':''}>Nacional</option><option value="internacional" ${d.tipo==='internacional'?'selected':''}>Internacional</option></select></div>
  <div><label>Agencia de carga</label><input id="et_ag" list="et_agl" value="${esc(d.agencia)}" placeholder="Ej. MRW, DHL, Aeroparcel"><datalist id="et_agl">${etqAgOpts()}</datalist></div>
  <div style="grid-column:1/-1"><label>Quien recibe (nombre y apellido)</label><input id="et_rec" value="${esc(d.dest.name)}" maxlength="120"></div>
  <div><label>Celular de quien recibe</label><input id="et_rtel" value="${esc(d.dest.tel)}" maxlength="40"></div>
  <div><label>Cédula / ID</label><input id="et_rced" value="${esc(d.dest.ced)}" maxlength="30"></div>
  <div style="grid-column:1/-1"><label>Sucursal donde retira (si aplica)</label><input id="et_suc" value="${esc(d.dest.suc)}" maxlength="100"></div>
  <div><label>País</label><input id="et_pais" value="${esc(d.dest.pais)}"></div>
  <div><label>Provincia / Estado</label><input id="et_prov" value="${esc(d.dest.prov)}"></div>
  <div><label>Ciudad</label><input id="et_ciu" value="${esc(d.dest.ciudad)}"></div>
  <div><label>N.º de guía / seguimiento</label><input id="et_guia" value="${esc(d.guia)}"></div>
  <div style="grid-column:1/-1"><label>Dirección de entrega</label><input id="et_dir" value="${esc(d.dest.dir)}" maxlength="200"></div>
  <div style="grid-column:1/-1"><label>Referencia</label><input id="et_ref" value="${esc(d.dest.ref)}" maxlength="200"></div>
  <div><label>Bultos (una etiqueta por bulto)</label><input id="et_bul" type="number" min="1" max="99" value="${d.nb}"></div>
  <div><label>Peso total (kg)</label><input id="et_peso" type="number" min="0" step="0.1" value="${d.peso||''}"></div>
  <div style="grid-column:1/-1"><label>Contenido</label><input id="et_cont" value="${esc(env.cont||'')}" placeholder="${esc(d.cont.slice(0,90))}" maxlength="300"></div>
  <div style="grid-column:1/-1"><label>Observaciones (frágil, no doblar…)</label><input id="et_obs" value="${esc(d.obs)}" maxlength="200"></div>
  <div style="grid-column:1/-1"><label>Tamaño de etiqueta</label><select id="et_tam">${etqOpcTam(etqCfg().tam||'e100x150')}</select></div>
 </div>
 <p style="font-size:12px;color:var(--gris);margin:10px 0 0">Si deja el contenido vacío se usa la lista del pedido. Los datos quedan guardados en este pedido.</p>
 <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap"><button class="btn s" data-h-click="h12">Cancelar</button><button class="btn p" data-h-click="h338" data-a-click="${_ha(id)}">🏷️ Ver / imprimir etiqueta</button></div>`;
 $('md').classList.add('on')
}
function etqTipoCambio(){const t=etqV('et_tipo'),p=$('et_pais');if(!p)return;if(t==='nacional'&&!p.value.trim())p.value='Panamá';if(t==='internacional'&&/^panam[aá]$/i.test(p.value.trim()))p.value=''}
function etqImprimirUno(id){
 const p=TD.peds.find(x=>x.id===id);if(!p)return;
 const tipo=etqV('et_tipo')==='internacional'?'internacional':'nacional',pais=etqV('et_pais');
 if(!etqV('et_dir')&&!etqV('et_ciu')&&!etqV('et_suc'))return alert('Escriba la dirección de entrega, la ciudad o la sucursal donde retira.');
 if(tipo==='internacional'&&!pais)return alert('En un envío internacional indique el país de destino.');
 const env={tipo,agencia:etqV('et_ag'),pais,prov:etqV('et_prov'),ciudad:etqV('et_ciu'),dir:etqV('et_dir'),rec:etqV('et_rec'),rtel:etqV('et_rtel'),rced:etqV('et_rced'),suc:etqV('et_suc'),ref:etqV('et_ref'),guia:etqV('et_guia'),bultos:Math.min(99,Math.max(1,Math.round(+etqV('et_bul'))||1)),peso:Math.max(0,+etqV('et_peso')||0),cont:etqV('et_cont'),obs:etqV('et_obs')},tam=etqV('et_tam');
 etqGuardar(p,env,false);etqRecordarAgencia(env.agencia);etqCfgSet({tipo});cerrar();
 if(etqGenerar([p],null,tam))etqGuardar(p,null,true);if(vista==='tienda')tdRender()
}
function etqSeleccion(){return TD.peds.filter(p=>ETQ_SEL.has(p.id))}
function etqContar(){const e=$('etqN');if(e)e.textContent=etqSeleccion().length}
function etqToggle(id,on){if(on)ETQ_SEL.add(id);else ETQ_SEL.delete(id);etqContar()}
function etqSelModo(m){ETQ_SEL=new Set(m==='todos'?TD.peds.map(p=>p.id):m==='pend'?TD.peds.filter(p=>p.estado==='nuevo'&&!etqImpresa(p)).map(p=>p.id):[]);if(vista==='tienda')tdRender()}
function etqBarra(){
 if(!TD.peds.length)return'';
 const nu=TD.peds.filter(p=>p.estado==='nuevo').length,sin=TD.peds.filter(p=>!etqImpresa(p)).length;
 return `<div class="etqbar" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px"><span style="font-size:13px"><b>${nu}</b> nuevo(s) · <b>${sin}</b> sin etiqueta</span><button class="btn s" data-h-click="h340" data-a-click="${_ha('todos')}">☑ Todos</button><button class="btn s" data-h-click="h340" data-a-click="${_ha('pend')}">☑ Nuevos sin etiqueta</button><button class="btn s" data-h-click="h340" data-a-click="${_ha('ninguno')}">☐ Ninguno</button><button class="btn p s" data-h-click="h341">🏷️ Etiquetas de los seleccionados (<span id="etqN">${etqSeleccion().length}</span>)</button></div>`
}
function etqAbrirLote(){
 const L=etqSeleccion();if(!L.length)return alert('Marque primero los pedidos a los que desea imprimir etiqueta.');
 const cfg=etqCfg(),aviso=L.map(p=>{const d=etqDatos(p,{tipo:cfg.tipo,agencia:cfg.agencia}),f=[];if(!d.dest.dir&&!d.dest.ciudad)f.push('sin dirección');if(!d.dest.tel)f.push('sin teléfono');return `<li><b>${esc(d.dest.name||'Cliente')}</b> · ${esc(etqNum(p))}${d.nb>1?' · '+d.nb+' bultos':''}${etqImpresa(p)?' · <small>ya tiene etiqueta</small>':''}${f.length?' · <span style="color:#d92d20">⚠ '+f.join(', ')+'</span>':''}</li>`}).join('');
 $('mb').innerHTML=`<h3 style="margin-top:0">🏷️ Imprimir ${L.length} etiqueta(s)</h3>
 <ul style="font-size:13px;line-height:1.6;max-height:160px;overflow:auto;padding-left:18px;margin:0 0 10px">${aviso}</ul>
 <p style="font-size:12.5px;color:var(--gris);margin:0 0 8px">Cada pedido usa sus datos de envío guardados. Lo que esté vacío se completa con estos valores. Para ajustar un pedido (guía, peso, bultos) ábralo con su botón 🏷️ Etiqueta.</p>
 <div class="g">
  <div><label>Tipo de envío</label><select id="et_tipo" data-h-change="h343"><option value="nacional" ${cfg.tipo!=='internacional'?'selected':''}>Nacional</option><option value="internacional" ${cfg.tipo==='internacional'?'selected':''}>Internacional</option></select></div>
  <div><label>Agencia de carga</label><input id="et_ag" list="et_agl" value="${esc(cfg.agencia||'')}" placeholder="Ej. MRW, DHL, Aeroparcel"><datalist id="et_agl">${etqAgOpts()}</datalist></div>
  <div><label>País (si el pedido no lo trae)</label><input id="et_pais" value="${cfg.tipo==='internacional'?'':'Panamá'}"></div>
  <div><label>Tamaño de etiqueta</label><select id="et_tam">${etqOpcTam(cfg.tam||'e100x150')}</select></div>
 </div>
 <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap"><button class="btn s" data-h-click="h12">Cancelar</button><button class="btn p" data-h-click="h342">🏷️ Ver / imprimir ${L.length} etiqueta(s)</button></div>`;
 $('md').classList.add('on')
}
function etqImprimirLote(){
 const L=etqSeleccion();if(!L.length)return;
 const def={tipo:etqV('et_tipo')==='internacional'?'internacional':'nacional',agencia:etqV('et_ag'),pais:etqV('et_pais')},tam=etqV('et_tam');
 const sinDestino=L.filter(p=>{const d=etqDatos(p,def);return !d.dest.dir&&!d.dest.ciudad&&!d.dest.suc});
 if(sinDestino.length&&!confirm(sinDestino.length+' pedido(s) no tienen dirección ni ciudad de entrega y saldrán sin destino. ¿Imprimir de todos modos?'))return;
 etqCfgSet({tipo:def.tipo});etqRecordarAgencia(def.agencia);cerrar();
 if(etqGenerar(L,def,tam))L.forEach(p=>etqGuardar(p,null,true));if(vista==='tienda')tdRender()
}
/*ETQ-UI-FIN*/

function tdBadge(){if(!SES)return;const n=TD.peds.filter(p=>p.estado==='nuevo').length;document.querySelectorAll('.ni[data-k="tienda"] .lb').forEach(e=>{const b=e.querySelector('.cbd');if(b)b.remove();if(n){const x=document.createElement('b');x.className='cbd';x.textContent=n;e.appendChild(x)}})}
const _nvt=nav;nav=function(){_nvt.apply(this,arguments);try{tdBadge()}catch(e){window._tjw&&_tjw(e)}};
function tiendaListen(){if(_tdOn||!fbDb||SHOP)return;_tdOn=true;const me=chatMe(),adm=esAdmin(),q=c=>adm?fbCol(c):fbCol(c).where('ref','==',me);let f1=true,f2=true;
 fbCol('tienda_items').onSnapshot(sn=>{{const cf=sn.docs.find(d=>d.id==='__cfg'),cd=cf?cf.data():{};TD.tema=cd.tema||(cd.navidad?'navidad':'');TD.xmas=TD.tema==='navidad';TD.base=cd.base||'';TD.rev=cd.rev||'';TD.heroMode=cd.heroMode||'mix';TD.paleta=cd.paleta||'shop';TD.wordmark=wmClean(cd.wordmark);TD.heroTitle=cd.heroTitle||nombreNegocio();TD.heroSub=cd.heroSub||heroSubDef();TD.logoUrl=cd.logoUrl||'';TD.motionStyle=cd.motionStyle||'float';TD.watermarkStyle=cd.watermarkStyle||'wm_violeta';TD.watermarkOpacity=cd.watermarkOpacity||'14';TD.heroBgType=cd.heroBgType||'none';TD.heroPhotoUrl=cd.heroPhotoUrl||'';TD.heroVideoUrl=cd.heroVideoUrl||'';TD.heroBgColor=cd.heroBgColor||'hero-bg-aurora';TD.heroBgSolid=cd.heroBgSolid||'#18181b';TD.banners=Array.isArray(cd.banners)?cd.banners:undefined;TD.btnRadio=cd.btnRadio||999;TD.empresaNombre=cd.empresaNombre||'';TD.redes=cd.redes&&typeof cd.redes==='object'?cd.redes:{};TD.contacto=cd.contacto&&typeof cd.contacto==='object'?cd.contacto:{};TD.fletes=fleSanCfg(cd.fletes);try{document.documentElement.style.setProperty('--kbtn-r',(TD.btnRadio)+'px')}catch(e){}try{fleRefrescar()}catch(e){window._tjw&&_tjw(e)}try{redesFill()}catch(e){window._tjw&&_tjw(e)}try{contactoWebSync(cf?cd:null)}catch(e){window._tjw&&_tjw(e)}try{if(esAdmin()&&fbDb&&!window._tdBW&&parseInt(BUILD,36)>parseInt(cd.build||'0',36)&&(window._tdBW=1))fbCol('tienda_items').doc('__cfg').set({__cfg:true,build:BUILD,rev:Date.now()},{merge:true}).catch(()=>{})}catch(e){window._tjw&&_tjw(e)}try{if(esAdmin()&&location.protocol==='https:'&&!/^(localhost|127\.)/.test(location.hostname)&&!window._tdBaseW&&cd.base!==tdBase()&&(window._tdBaseW=1))fbCol('tienda_items').doc('__cfg').set({__cfg:true,base:tdBase()},{merge:true}).catch(()=>{})}catch(e){window._tjw&&_tjw(e)}}TD.items=sn.docs.filter(d=>d.id!=='__cfg').map(d=>d.data());if(vista==='tienda')tdRender()},e=>console.warn('Tienda:',e));
 q('tienda_leads').onSnapshot(sn=>{TD.leads=sn.docs.map(d=>sanLead(d.data())).filter(Boolean).sort((a,b)=>b.ts-a.ts);
  if(!f1)sn.docChanges().forEach(ch=>{const d=ch.doc.data();if(ch.type==='added'&&!ch.doc.metadata.hasPendingWrites&&Date.now()-d.ts<120000)tdAviso('Nuevo cliente registrado en la tienda virtual: '+d.name+'.')});
  f1=false;if(adm)tdImport();if(vista==='tienda')tdRender();tdHomeRefresh()},e=>console.warn('Registros:',e));
 q('tienda_pedidos').onSnapshot(sn=>{TD.peds=sn.docs.map(d=>sanPed(d.data())).filter(Boolean).sort((a,b)=>b.ts-a.ts);
  if(!f2)sn.docChanges().forEach(ch=>{const d=ch.doc.data();if(ch.type==='added'&&!ch.doc.metadata.hasPendingWrites&&Date.now()-d.ts<120000)tdAviso('Nuevo pedido de la tienda virtual, de '+((d.lead&&d.lead.name)||'un cliente')+'.')});
  f2=false;tdBadge();if(vista==='tienda')tdRender();tdHomeRefresh()},e=>console.warn('Pedidos:',e))}
function tdImport(){let ch=0;TD.leads.filter(l=>!l.imp).forEach(l=>{const d=String(l.tel||'').replace(/\D/g,'');
 if(!DB.cli.some(c=>(d&&String(c.t||'').replace(/\D/g,'')===d)||c.n===l.name)){DB.cli.push({id:uid(),n:l.name+(l.empresa?' — '+l.empresa:''),r:'',t:l.tel||'',d:l.dir||'',m:l.email||'',o:'tienda'});ch=1}
 fbCol('tienda_leads').doc(l.id).update({imp:true}).catch(()=>{})});
 if(ch){save();if(vista==='cli')R.cli()}}
const tdWa=(tel,txt)=>{const n=waNum(tel);return n?'https://wa.me/'+n+'?text='+encodeURIComponent(txt):''};
R.tienda=function(){tdRender();if(esAdmin())tdLoadCat()};
async function tdLoadCat(){let a=[];try{a=await tx('readonly',s=>s.getAll())}catch(e){a=(typeof CL!=='undefined'?CL:[])}
 TD.cat=(a||[]).filter(o=>o&&((o.blob&&/^image\//.test(o.type||''))||o.thumb)).sort((x,y)=>(x.name||'').localeCompare(y.name||''));if(vista==='tienda')tdRender()}
function tdRender(){if(vista!=='tienda'||!SES)return;const adm=esAdmin(),me=chatMe(),link=tdLink(),pub=new Set(TD.items.map(x=>x.id));
 const file=location.protocol==='file:'?'<p style="color:#d92d20;font-size:12.5px">⚠ Está abriendo el panel desde un archivo. Para que los clientes puedan entrar, el panel debe estar publicado en internet (https).</p>':'';
 const cls=DB.cli.filter(c=>waNum(c.t));
 const pubCard=adm?`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0 0 4px">📦 Productos en la tienda <small style="color:var(--gris);font-weight:500">(${pub.size} publicados · ${TD.cat.length} en este catálogo)</small></h3><button class="btn s" id="tdMinB" data-h-click="h120">${tdMinV()?'▸ Maximizar':'▾ Minimizar'}</button></div><div id="tdBody" style="${tdMinV()?'display:none':''}"><p style="font-size:12.5px;color:var(--gris)">Marque los productos de su Catálogo (con foto) que quiere mostrar a los clientes. Nombre, categoría, precio y descripción salen del Catálogo. Para cambiar un precio, edítelo en el Catálogo y vuelva a publicar.</p>${tdTabla(pub)}<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px"><select id="tdTema" aria-label="Tema decorativo para los productos seleccionados" style="width:auto">${TEMAS.map(t=>`<option value="${t.id}">${t.e} ${t.n}</option>`).join("")}</select><button class="btn" data-h-click="h119">+ Asignar tema a marcados</button><button class="btn" data-h-click="h118">− Quitar tema</button></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px"><select id="tdBd" aria-label="Insignia para los productos seleccionados" style="width:auto">${Object.keys(TDBD).map(k=>`<option value="${k}">${TDBD[k]}</option>`).join("")}</select><button class="btn" data-h-click="h117">🏷 Poner etiqueta a marcados</button><button class="btn" data-h-click="h116">Quitar etiqueta</button></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><select id="tdStk" aria-label="Disponibilidad para los productos seleccionados" style="width:auto">${Object.keys(TDSTK).map(k=>`<option value="${k}">${TDSTK[k]}</option>`).join("")}</select><button class="btn" data-h-click="h115">📦 Aplicar existencia a marcados</button></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><button class="btn p" data-h-click="h114">⬆ Publicar / actualizar marcados</button><button class="btn d" data-h-click="h113">🗑 Quitar marcados de la tienda</button><span id="tdSt" style="font-size:12.5px;color:var(--gris)"></span></div></div></div>`:'';
 $('v').innerHTML=`<div class="card"><h3 style="margin:0 0 4px">🛍 Catálogo virtual</h3><p style="font-size:12.5px;color:var(--gris)">Comparta su enlace. El cliente se registra, ve productos, categorías y precios, arma su carrito y le envía el pedido. ${adm?'':'Los registros y pedidos quedan a su nombre.'}</p>${file}<label>Su enlace</label><input id="td_link" readonly value="${esc(link)}" data-h-focus="h56"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn p" data-h-click="h112">📋 Copiar enlace</button><button class="btn" data-h-click="h85">👁 Ver como cliente</button><button class="btn p" data-h-click="h100">📖 Ver catálogo directo</button><button class="btn" data-h-click="h111">💬 Enviar por WhatsApp</button></div><div style="margin-top:14px"><label>Enviar el enlace a un cliente registrado</label><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="td_cli" style="flex:1;min-width:200px">${cls.map(c=>`<option value="${c.id}">${esc(c.n)} — ${esc(c.t)}</option>`).join('')||'<option value="">(sin clientes con teléfono)</option>'}</select><button class="btn p" data-h-click="h110">💬 Enviar</button></div></div></div>
<div class="card"><h3 style="margin:0 0 6px">🛒 Pedidos de la tienda (${TD.peds.length})</h3>${etqBarra()}${TD.peds.length?TD.peds.map(p=>{const l=p.lead||{},w=tdWa(l.tel,'Hola '+l.name+', recibimos su pedido de la tienda virtual. ');return `<div class="tdp ${p.estado==='nuevo'?'nw':''}"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><label style="display:inline-flex;align-items:center;margin-right:6px"><input type="checkbox" class="etqcb" ${ETQ_SEL.has(p.id)?'checked':''} data-h-change="h339" data-a-change="${_ha(p.id)}" title="Seleccionar para imprimir etiqueta" aria-label="Seleccionar pedido para imprimir etiqueta"></label><b>${esc(l.name||'Cliente')}</b> · ${esc(l.tel||'')}${l.email?' · '+esc(l.email):''}${((l.terminos&&l.terminos.ok)||(p.nota&&p.nota.includes('Aceptó Términos')))?`<button type="button" class="btn s" data-h-click="call" data-a-click="${_ha('poliVerEvidencia',p.id)}" style="display:inline-flex;align-items:center;gap:3px;font-size:11px;padding:2px 8px;border-radius:10px;background:#dcfce7;color:#15803d;font-weight:700;border:1px solid #86efac;cursor:pointer;margin-left:6px" title="Ver constancia y evidencia legal Ley 81">🛡️ Términos y Privacidad (Ley 81) Aceptados ${(l.terminos&&l.terminos.fmt)?'· '+esc(l.terminos.fmt):''} 🔍</button>`:""}<br><small style="color:var(--gris)">${new Date(p.ts).toLocaleString('es-PA')} · Vendedor: ${esc(vdName(p.ref||'admin'))} · ${p.estado==='nuevo'?'<b style="color:var(--az)">NUEVO</b>':'Atendido'}${etqImpresa(p)?' · 🏷 etiqueta lista':''}</small></div><b style="font-size:17px">${$$(p.total)}</b></div><ul>${(p.items||[]).map(i=>`<li>${i.q} × ${esc(i.n)} — ${$$(i.p)}</li>`).join('')}</ul>${fleLinea(p)}${p.nota?`<small>📝 ${esc(p.nota)}</small><br>`:''}<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn p s" data-h-click="h87" data-a-click="${_ha(p.id)}">🧾 Crear factura</button>${w?`<a class="btn wa s" href="${w}" target="_blank" rel="noopener">💬 WhatsApp</a>`:''}<button class="btn s" data-h-click="h337" data-a-click="${_ha(p.id)}">🏷️ Etiqueta</button><button class="btn s" data-h-click="h109" data-a-click="${_ha(p.id)}">👁 Ver PDF</button><button class="btn s" data-h-click="h108" data-a-click="${_ha(p.id)}">⬇ Descargar</button><button class="btn s" data-h-click="h86" data-a-click="${_ha(p.id)}">${p.estado==='nuevo'?'✔ Marcar atendido':'↩ Reabrir'}</button><button class="btn s d" data-h-click="h107" data-a-click="${_ha(p.id)}">🗑 Eliminar</button></div></div>`}).join(''):'<div class="vacio">Aún no hay pedidos.</div>'}</div>
<div class="card"><h3 style="margin:0 0 6px">👥 Clientes registrados en la tienda (${TD.leads.length})</h3><p style="font-size:12.5px;color:var(--gris)">${adm?'Cada registro se agrega automáticamente a su lista de Clientes.':'Los clientes que se registraron con su enlace.'}</p>${TD.leads.length?`<div class="tw"><table><tr><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Correo</th><th>Vendedor</th><th></th></tr>${TD.leads.map(l=>{const w=tdWa(l.tel,'Hola '+l.name+', gracias por registrarse en nuestro catálogo virtual. ');return `<tr><td>${new Date(l.ts).toLocaleDateString('es-PA')}</td><td><b>${esc(l.name)}</b>${l.empresa?'<br><small>'+esc(l.empresa)+'</small>':''}</td><td>${esc(l.tel||'')}</td><td>${esc(l.email||'')}</td><td>${esc(vdName(l.ref||'admin'))}</td><td class="r">${w?`<a class="btn wa s" href="${w}" target="_blank" rel="noopener">💬 WhatsApp</a>`:''} ${adm?`<button class="btn s d" data-h-click="h106" data-a-click="${_ha(l.id)}">🗑 Eliminar</button>`:''}</td></tr>`}).join('')}</table></div>`:'<div class="vacio">Aún no hay registros.</div>'}</div>
${pubCard}`;try{tdAplicarFiltro()}catch(e){window._tjw&&_tjw(e)}}
let TDF='todos';const TDG_CLOSED=new Set();
const TDSTK={ok:'✅ Disponible',low:'⚠️ Pocas existencias',out:'⛔ Agotado',disc:'🚫 Descontinuado'};
const tdStkSel=(id,v)=>`<select class="tdstk" data-id="${id}" aria-label="Disponibilidad del producto" data-h-change="h105" data-a-change="${_ha(id)}">${Object.keys(TDSTK).map(k=>`<option value="${k}" ${k===v?'selected':''}>${TDSTK[k]}</option>`).join('')}</select>`;
function tdStockSet(id,v){const pi=TD.items.find(x=>x.id===id);if(!pi||!fbDb)return;pi.stock=v;fbCol('tienda_items').doc(id).update({stock:v}).catch(()=>alert('No se pudo guardar la existencia.'))}
function tdStockAplicar(){const v=$('tdStk').value,ids=[...document.querySelectorAll('.tdck:checked')].map(x=>x.value);if(!ids.length)return alert('Marque los productos a los que desea aplicar la existencia.');
 ids.forEach(id=>{const e=document.querySelector('.tdstk[data-id="'+id+'"]');if(e)e.value=v;tdStockSet(id,v)});const st=$('tdSt');if(st)st.textContent='✔ Existencia aplicada a '+ids.length+' producto(s)'+(ids.some(id=>!TD.items.some(x=>x.id===id))?' (los no publicados se guardan al publicarlos)':'')}
const TDBD={new:'🆕 Recién llegado',model:'✨ Modelo nuevo',best:'🔥 Más vendido',hero:'🎠 Carrusel principal'};
const tdBdSel=(id,b)=>`<details class="tdtm"><summary><span class="tdsum" id="tdbs_${id}">${b.length?b.map(k=>(TDBD[k]||'').split(' ').slice(1).join(' ')).join(' · '):'<em>Ninguna</em>'}</span><i>▾</i></summary><div class="tdpop">${Object.keys(TDBD).map(k=>`<label class="tdtg"><input type="checkbox" class="tdbdk" data-id="${id}" value="${k}" ${b.includes(k)?'checked':''} data-h-change="h104" data-a-change="${_ha(id)}"><span>${TDBD[k]}</span></label>`).join('')}</div></details>`;
const _bdT={};
function tdBadgeSet(id){const b=[...document.querySelectorAll('.tdbdk[data-id="'+id+'"]:checked')].map(x=>x.value),e=$('tdbs_'+id);if(e)e.innerHTML=b.length?b.map(k=>TDBD[k].split(' ').slice(1).join(' ')).join(' · '):'<em>Ninguna</em>';
 const pi=TD.items.find(x=>x.id===id);if(!pi||!fbDb)return;clearTimeout(_bdT[id]);_bdT[id]=setTimeout(()=>{pi.badges=b;fbCol('tienda_items').doc(id).update({badges:b}).catch(()=>alert('No se pudo guardar la etiqueta.'))},1200)}
function tdBadgeBulk(on){const k=$('tdBd').value,ids=[...document.querySelectorAll('.tdck:checked')].map(x=>x.value);if(!ids.length)return alert('Marque los productos primero.');
 ids.forEach(id=>{const c=document.querySelector('.tdbdk[data-id="'+id+'"][value="'+k+'"]');if(c){c.checked=!!on;tdBadgeSet(id)}})}
const PAFLAG="<svg viewBox='0 0 60 40' width='20' height='13' style='vertical-align:-2px;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.15)'><rect width='60' height='40' fill='#fff'/><rect x='30' width='30' height='20' fill='#D21034'/><rect y='20' width='30' height='20' fill='#005293'/><polygon points='15.00,3.00 16.65,7.73 21.66,7.84 17.66,10.87 19.11,15.66 15.00,12.80 10.89,15.66 12.34,10.87 8.34,7.84 13.35,7.73' fill='#005293'/><polygon points='45.00,23.00 46.65,27.73 51.66,27.84 47.66,30.87 49.11,35.66 45.00,32.80 40.89,35.66 42.34,30.87 38.34,27.84 43.35,27.73' fill='#D21034'/><rect x='.5' y='.5' width='59' height='39' fill='none' stroke='#cfd6df'/></svg>";
function shopBrandSave(){
 if(!esAdmin()||!fbDb)return alert("Se requieren permisos de administrador y conexión a internet.");
 const wm=wmClean($("sh_cfg_wm")&&$("sh_cfg_wm").value).slice(0,30);
 const title=(($("sh_cfg_title")&&$("sh_cfg_title").value.trim())||nombreNegocio()).slice(0,60);
 const sub=(($("sh_cfg_sub")&&$("sh_cfg_sub").value.trim())||heroSubDef()).slice(0,160);
 const logo=(($("sh_cfg_logo")&&$("sh_cfg_logo").value.trim())||"").slice(0,250000);
 const motion=TD._curMotion||TD.motionStyle||'float';
 const wmStyle=TD._curWmStyle||TD.watermarkStyle||'wm_violeta';
 const wmOp=(($("sh_cfg_wm_op")&&$("sh_cfg_wm_op").value)||'14');
 const bgType=TD._curBgType||TD.heroBgType||'none';
 const photo=(($("sh_cfg_hero_photo")&&$("sh_cfg_hero_photo").value.trim())||"").slice(0,250000);
 const video=(($("sh_cfg_hero_video")&&$("sh_cfg_hero_video").value.trim())||"").slice(0,250000);
 const bgColor=TD._curHeroBgColor||TD.heroBgColor||'hero-bg-aurora';
 const bgSolid=(($("sh_cfg_hero_solid")&&$("sh_cfg_hero_solid").value)||'#18181b');

 const dataToSave = {
   __cfg: true,
   wordmark: wm,
   heroTitle: title,
   heroSub: sub,
   logoUrl: logo,
   motionStyle: motion,
   watermarkStyle: wmStyle,
   watermarkOpacity: wmOp,
   heroBgType: bgType,
   heroPhotoUrl: photo,
   heroVideoUrl: video,
   heroBgColor: bgColor,
   heroBgSolid: bgSolid,
   ts: Date.now()
 };

 fbCol('tienda_items').doc("__cfg").set(dataToSave, {merge:true})
  .then(()=>{
    TD.wordmark = wm;
    TD.heroTitle = title;
    TD.heroSub = sub;
    TD.logoUrl = logo;
    TD.motionStyle = motion;
    TD.watermarkStyle = wmStyle;
    TD.watermarkOpacity = wmOp;
    TD.heroBgType = bgType;
    TD.heroPhotoUrl = photo;
    TD.heroVideoUrl = video;
    TD.heroBgColor = bgColor;
    TD.heroBgSolid = bgSolid;
    alert("✅ Configuración de portada y colores guardada y sincronizada correctamente. Ya se ve en la tienda virtual.");
    if(typeof R!=='undefined'&&R.config) R.config();
  })
  .catch(e=>alert("No se pudo guardar: "+((e&&e.message)||e)));
}
window.shopBrandSave=shopBrandSave;
function xmasCard(){
 const t=TD.tema||'',hm=TD.heroMode||'mix',pal=TD.paleta||'shop';
 const bt=(k,l)=>`<button class="btn ${t===k?'p':''}" data-h-click="h103" data-a-click="${_ha(k)}">${l}</button>`;
 const hb=(k,l)=>`<button class="btn ${hm===k?'p':''}" data-h-click="h102" data-a-click="${_ha(k)}">${l}</button>`;
 const pb=([k,l,acc,bg])=>`<button class="btn ${pal===k?'p':''}" style="display:inline-flex;align-items:center;gap:8px" data-h-click="h101" data-a-click="${_ha(k)}"><span style="display:inline-flex;align-items:center;border-radius:10px;padding:2px;background:${bg};box-shadow:0 0 0 1px rgba(0,0,0,.15)"><span style="width:12px;height:12px;border-radius:50%;background:${acc}"></span></span><span>${l}</span></button>`;
 const tNombres={madres:'🌸 Día de las Madres',padres:'👔 Día del Padre',trabajador:'🛠️ Día del Trabajador',galaxia:'🌌 Galaxia Cósmica',amor:'💖 Día del Amor',navidad:'🎄 Navidad',verano:'☀️ Verano',panama:PAFLAG+' Mes patrio'};
 const curBgType = TD._curBgType || TD.heroBgType || 'none';
 const curBgColor = TD._curHeroBgColor || TD.heroBgColor || 'hero-bg-aurora';
 const bR=TD.btnRadio||999;
 return `<h3 style="margin:0">🖼 Plantilla de la web</h3><p style="font-size:12.5px;color:var(--gris)">Todo lo que ve el cliente en su página, en un solo lugar: temáticas de temporada, paletas de color, logo y portada (foto o video), banners promocionales, forma de los botones y políticas. Cada cambio queda guardado para la empresa activa.</p>
 <hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">
 <h3 style="margin:0">🎨 Temática de temporada</h3><p style="font-size:12.5px;color:var(--gris)">Viste la tienda virtual con una temática especial (fondo inmersivo, decoraciones y ambiente). Se activa para todos los clientes al instante y tiene prioridad sobre la paleta.</p><p style="margin:8px 0">${t?'<b>'+(tNombres[t]||t)+'</b> activada.':'🔹 <b>Sin temática</b> (diseño Shop normal).'}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${bt('','Ninguna')}${bt('madres','🌸 Madres')}${bt('padres','👔 Padres')}${bt('trabajador','🛠️ Trabajador')}${bt('galaxia','🌌 Galaxia')}${bt('amor','💖 Amor')}${bt('navidad','🎄 Navidad')}${bt('verano','☀️ Verano')}${bt('panama',PAFLAG+' Mes patrio')}<button class="btn" data-h-click="h100">👁️ Ver cómo queda</button></div>
 <hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">
 <h3 style="margin:0">🎨 Paletas PRO: Fondo de página y colores coordinados</h3><p style="font-size:12.5px;color:var(--gris)">Elija una combinación profesional completa: cambia el color de fondo de la página, tarjetas, bordes y botones acento.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${PALETAS.map(pb).join('')}</div>
 <hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">
 <h3 style="margin:0">🔘 Forma de los botones de la tienda</h3><p style="font-size:12.5px;color:var(--gris)">Elija el estilo de los botones que ven los clientes (aplica al instante en la tienda pública).</p>
 <div style="display:flex;gap:8px;flex-wrap:wrap">
  ${[[999,'💊 Píldora'],[12,'▢ Redondeado'],[4,'⬛ Casi cuadrado']].map(([k,l])=>`<button class="btn s ${bR===k?'p':''}" data-h-click="call" data-a-click="${_ha('btnRadioSet',k)}">${l}</button>`).join('')}
 </div>
 <hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">
 
 <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
   <div>
     <h3 style="margin:0">🏷️ Logo, Portada, Foto/Video de Movimiento y Colores</h3>
     <p style="font-size:12.5px;color:var(--gris);margin:4px 0 0">Personalice el logo, foto de portada, video de movimiento en bucle, colores de fondo animados, palabra gigante (watermark), títulos y efectos de animación.</p>
   </div>
   <button type="button" class="btn p s" data-h-click="call" data-a-click="${_ha('shopBrandSave')}" style="box-shadow:0 3px 12px rgba(84,51,235,.35)">💾 Guardar cambios de portada</button>
 </div>

 <div class="g" style="margin-top:14px">
  <div style="grid-column:1/-1">
    <label>Logo del encabezado de la tienda — junto a «Catálogo virtual» (URL o subir imagen)</label>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input id="sh_cfg_logo" value="${esc(TD.logoUrl||'')}" placeholder="https://... o elija un archivo" style="flex:1;min-width:220px">
      <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">
        📁 Subir logo
        <input type="file" id="sh_cfg_logo_file" accept="image/*" style="display:none" data-h-change="call" data-a-change="${_ha('shopLogoUpload')}">
      </label>
      <button type="button" class="btn s d" data-h-click="call" data-a-click="${_ha('shopLogoClear')}" title="Quitar logo">Quitar</button>
    </div>
    <div id="sh_cfg_logo_prev" style="margin-top:8px;${TD.logoUrl?'':'display:none'}">
      <img src="${esc(TD.logoUrl||'')}" alt="Vista previa logo" style="max-height:48px;border-radius:10px;background:#fff;padding:4px 10px;border:1px solid var(--linea)">
    </div>
  </div>

  <div style="grid-column:1/-1">
    <label>Fondo de la portada: ¿Qué desea colocar?</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="sh_cfg_bgtype_btns">
      ${[['none','⚪ Normal (Limpio)'],['photo','📷 Foto / Banner de fondo'],['video','🎥 Video de movimiento (Bucle)'],['colors','🌈 Colores / Gradiente dinámico'],['solid','🎨 Color sólido']].map(([k,lbl])=>`<button type="button" class="btn s ${curBgType===k?'p':''}" data-bgtype="${k}" data-h-click="call" data-a-click="${_ha('shopCfgBgTypeSet',k)}">${lbl}</button>`).join('')}
    </div>
  </div>

  <div id="sh_cfg_sec_photo" style="grid-column:1/-1;${curBgType==='photo'?'':'display:none'}">
    <label>Foto de portada (URL o subir imagen de fondo)</label>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input id="sh_cfg_hero_photo" value="${esc(TD.heroPhotoUrl||'')}" placeholder="https://... o suba una foto panorámica" style="flex:1;min-width:220px">
      <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">
        📁 Subir foto
        <input type="file" id="sh_cfg_photo_file" accept="image/*" style="display:none" data-h-change="call" data-a-change="${_ha('shopPhotoUpload')}">
      </label>
      <button type="button" class="btn s d" data-h-click="call" data-a-click="${_ha('shopPhotoClear')}">Quitar foto</button>
    </div>
    <div id="sh_cfg_photo_prev" style="margin-top:8px;${TD.heroPhotoUrl?'':'display:none'}">
      <img src="${esc(TD.heroPhotoUrl||'')}" alt="Vista previa foto" style="max-height:90px;border-radius:12px;border:1px solid var(--linea)">
    </div>
  </div>

  <div id="sh_cfg_sec_video" style="grid-column:1/-1;${curBgType==='video'?'':'display:none'}">
    <label>Video de movimiento (URL de video MP4/WebM o subir archivo de video)</label>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input id="sh_cfg_hero_video" value="${esc(TD.heroVideoUrl||'')}" placeholder="https://.../video.mp4 o elija archivo" style="flex:1;min-width:220px">
      <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">
        📁 Subir video
        <input type="file" id="sh_cfg_video_file" accept="video/mp4,video/webm" style="display:none" data-h-change="call" data-a-change="${_ha('shopVideoUpload')}">
      </label>
      <button type="button" class="btn s d" data-h-click="call" data-a-click="${_ha('shopVideoClear')}">Quitar video</button>
    </div>
    <small style="display:block;color:var(--gris);margin-top:4px">💡 Presets de video en movimiento:</small>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
      <button type="button" class="btn s" data-h-click="call" data-a-click="${_ha('shopPresetVideo','https://assets.mixkit.co/videos/preview/mixkit-abstract-purple-lights-and-smoke-40228-large.mp4')}">💜 Humo & Luces Neón</button>
      <button type="button" class="btn s" data-h-click="call" data-a-click="${_ha('shopPresetVideo','https://assets.mixkit.co/videos/preview/mixkit-golden-dust-particles-in-slow-motion-41846-large.mp4')}">✨ Polvo Dorado Flotante</button>
      <button type="button" class="btn s" data-h-click="call" data-a-click="${_ha('shopPresetVideo','https://assets.mixkit.co/videos/preview/mixkit-abstract-flowing-curves-of-light-32085-large.mp4')}">🌊 Ondas de Luz Cyan</button>
    </div>
  </div>

  <div id="sh_cfg_sec_colors" style="grid-column:1/-1;${curBgType==='colors'?'':'display:none'}">
    <label>Gradiente de movimiento / Paleta de color de fondo</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="sh_cfg_color_btns">
      ${[['hero-bg-aurora','🌌 Aurora Boreal'],['hero-bg-sunset','🌅 Atardecer Dorado'],['hero-bg-cosmic','🪐 Nebulosa Cósmica'],['hero-bg-cyber','⚡ Cyber Neón'],['hero-bg-ocean','🌊 Océano Cyan'],['hero-bg-pastel','🌸 Pastel Glamour']].map(([k,lbl])=>`<button type="button" class="btn s ${curBgColor===k?'p':''}" data-color="${k}" data-h-click="call" data-a-click="${_ha('shopCfgColorSet',k)}">${lbl}</button>`).join('')}
    </div>
  </div>

  <div id="sh_cfg_sec_solid" style="grid-column:1/-1;${curBgType==='solid'?'':'display:none'}">
    <label>Color sólido personalizado para la portada</label>
    <div style="display:flex;gap:8px;align-items:center">
      <input type="color" id="sh_cfg_hero_solid" value="${TD.heroBgSolid||'#18181b'}" style="width:50px;height:40px;padding:2px;cursor:pointer;border-radius:10px">
      <span style="font-size:13px;color:var(--gris)">Haga clic para elegir el color con el selector.</span>
    </div>
  </div>

  <div><label>Texto de fondo gigante (Watermark)</label><input id="sh_cfg_wm" value="${esc(wmClean(TD.wordmark))}" placeholder="Vacío = sin marca de agua" maxlength="30"></div>
  <div><label>Título de la portada</label><input id="sh_cfg_title" value="${esc(TD.heroTitle||nombreNegocio())}" placeholder="${esc(nombreNegocio())}" maxlength="60"></div>
  <div style="grid-column:1/-1"><label>Subtítulo / eslogan</label><input id="sh_cfg_sub" value="${esc(TD.heroSub||heroSubDef())}" placeholder="Escriba el eslogan de su empresa" maxlength="160"></div>

  <div style="grid-column:1/-1">
    <label>Animación Graphic Motion de las tarjetas de portada</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="sh_cfg_motion_btns">
      ${[['float','✨ Constelación 3D (Flotante)'],['shimmer','💫 Brillo Cósmico (Shimmer)'],['waves','🌊 Ondas Cinéticas'],['neon','⚡ Pulso Neón Cyber'],['clean','💎 Minimal Suave']].map(([k,lbl])=>`<button type="button" class="btn s ${(TD._curMotion||TD.motionStyle||'float')===k?'p':''}" data-motion="${k}" data-h-click="call" data-a-click="${_ha('shopCfgMotionSet',k)}">${lbl}</button>`).join('')}
    </div>
  </div>

  <div style="grid-column:1/-1">
    <label>Color y Contraste del Watermark (Combinaciones de alto impacto)</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="sh_cfg_wm_btns">
      ${[['wm_violeta','Violeta Profundo','#6366f1'],['wm_dorado','Dorado Champagne','#f59e0b'],['wm_cian','Cian Neón / Océano','#06b6d4'],['wm_rosa','Rosa Magenta Glam','#ec4899'],['wm_esmeralda','Verde Esmeralda','#10b981'],['wm_plata','Plata Mercurio','#94a3b8'],['wm_coral','Atardecer Coral','#f97316'],['wm_neon','Degradado Aurora','#a855f7'],['wm_blanco','Blanco Escarchado','#ffffff']].map(([k,lbl,col])=>`<button type="button" class="btn s ${(TD._curWmStyle||TD.watermarkStyle||'wm_violeta')===k?'p':''}" data-wm="${k}" style="display:inline-flex;align-items:center;gap:6px" data-h-click="call" data-a-click="${_ha('shopCfgWmSet',k)}"><span style="width:11px;height:11px;border-radius:50%;background:${col};box-shadow:0 0 0 1px rgba(0,0,0,.2)"></span><span>${lbl}</span></button>`).join('')}
    </div>
  </div>

  <div>
    <label>Opacidad del Watermark</label>
    <select id="sh_cfg_wm_op">
      <option value="8" ${(TD.watermarkOpacity||'14')==='8'?'selected':''}>8% - Muy sutil</option>
      <option value="14" ${(TD.watermarkOpacity||'14')==='14'?'selected':''}>14% - Equilibrado PRO (Recomendado)</option>
      <option value="20" ${(TD.watermarkOpacity||'14')==='20'?'selected':''}>20% - Destacado</option>
      <option value="28" ${(TD.watermarkOpacity||'14')==='28'?'selected':''}>28% - Máximo Contraste</option>
    </select>
  </div>
 </div>

 <div style="margin-top:16px;padding-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
   <button type="button" class="btn p s" data-h-click="call" data-a-click="${_ha('shopBrandSave')}" style="box-shadow:0 3px 12px rgba(84,51,235,.35)">💾 Guardar cambios de portada (Sincronizar)</button>
   <a class="btn s" href="index.html?tienda=1${tdEmpQ()}" target="_blank" rel="noopener">👁️ Abrir tienda para probar</a>
 </div>
 <hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">
 <h3 style="margin:0">🎠 Banners promocionales de la portada</h3>
 <p style="font-size:12.5px;color:var(--gris)">Se numeran en orden: <b>Banner 1</b>, <b>banner 2</b>… hasta 6, y rotan en el inicio de la tienda. Puede subir imágenes (JPG/PNG ≤120 KB, se comprimen solas) o pegar enlaces; el primero de la lista es el Banner 1. Sin banners propios se usan los que trae el panel.</p>
 <small style="display:block;color:var(--gris);font-size:11.5px;margin-bottom:8px">Dimensiones por banner: panorámico, recomendado <b>1200×600 px</b> (mínimo 600 de ancho). Los 6 juntos no pueden pesar más de ~780 KB: para imágenes muy pesadas use el enlace (URL).</small>
 <div id="banList" style="margin:10px 0">
 ${(TD.banners||[]).length?(TD.banners||[]).map((b,i)=>`<div class="dl"><span style="display:flex;gap:10px;align-items:center"><img src="${esc(b.src)}" alt="" style="width:86px;height:44px;object-fit:cover;border-radius:8px;border:1px solid var(--linea)"><small style="color:var(--gris)">Banner ${i+1}</small></span><span style="display:flex;gap:6px"><button class="btn s" data-h-click="call" data-a-click="${_ha('banMover',i+'|-1')}" ${i===0?'disabled':''} aria-label="Subir">↑</button><button class="btn s" data-h-click="call" data-a-click="${_ha('banMover',i+'|1')}" ${i===(TD.banners||[]).length-1?'disabled':''} aria-label="Bajar">↓</button><button class="btn s d" data-h-click="call" data-a-click="${_ha('banQuitar',i)}" aria-label="Eliminar">🗑</button></span></div>`).join(''):'<div class="vacio" style="padding:14px">Usando los banners predeterminados del panel. Agregue los suyos para reemplazarlos.</div>'}
 </div>
 <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
  <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">📁 Subir banner<input type="file" accept="image/*,.gif" hidden data-h-change="call" data-a-change="${_ha('banSubir')}"></label>
  <input id="ban_url" placeholder="…o enlace (URL) de la imagen" style="flex:1;min-width:200px">
  <button class="btn s" data-h-click="call" data-a-click="${_ha('banUrl')}">➕ Agregar enlace</button>
 </div>
 <hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">
 <h3 style="margin:0">🎠 Carrusel de portada</h3><p style="font-size:12.5px;color:var(--gris)">Elija cómo se eligen los diseños para las tarjetas flotantes de la portada.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${hb('random','🎲 Aleatorio')}${hb('mix','✨ Mixto (seleccionados + aleatorios)')}${hb('manual','📌 Personalizado (solo seleccionados)')}</div>
 <hr style="border:0;border-top:1px solid var(--linea);margin:16px 0">
 <h3 style="margin:0">🔗 Enlaces de la tienda</h3><p style="font-size:12.5px;color:var(--gris)">Si los clientes ven una versión vieja al abrir el enlace de un vendedor, toque este botón para forzar la actualización.</p><button class="btn" data-h-click="h99">🔄 Actualizar enlaces de vendedores</button> <small style="color:var(--gris)">Versión: ${esc(String(TD.rev||BUILD))}</small>`
}

function linksRefresh(){if(!fbDb)return;fbCol('tienda_items').doc('__cfg').set({__cfg:true,rev:Date.now()},{merge:true}).then(()=>{alert('Listo. Los vendedores ya comparten enlaces nuevos. Si un vendedor ya tiene abierto el panel, que lo recargue una vez.');R.config()}).catch(()=>alert('No se pudo actualizar. Revise su conexión o permisos.'))}
function temaSet(t){if(!fbDb)return;fbCol('tienda_items').doc('__cfg').set({__cfg:true,tema:t,navidad:t==='navidad',ts:Date.now()},{merge:true}).then(()=>{TD.tema=t;TD.xmas=t==='navidad';R.config()}).catch(()=>alert('No se pudo guardar. Revise su conexión o permisos.'))}
function heroModeSet(m){if(!fbDb)return;fbCol('tienda_items').doc('__cfg').set({__cfg:true,heroMode:m,ts:Date.now()},{merge:true}).then(()=>{TD.heroMode=m;R.config()}).catch(()=>alert('No se pudo guardar la configuración del carrusel. Revise su conexión o permisos.'))}
function paletaSet(p){if(!fbDb)return;fbCol('tienda_items').doc('__cfg').set({__cfg:true,paleta:p,ts:Date.now()},{merge:true}).then(()=>{TD.paleta=p;R.config()}).catch(()=>alert('No se pudo guardar la paleta. Revise su conexión o permisos.'))}
function tdRowHTML(o,pub){const isp=pub.has(o.id),pi=TD.items.find(x=>x.id===o.id),sel=new Set(pi&&Array.isArray(pi.tags)?pi.tags:temaOf(o)),ch=TEMAS.filter(t=>sel.has(t.id));
 const tm=`<details class="tdtm" id="tdd_${o.id}"><summary><span class="tdsum">${ch.length?ch.map(t=>t.e).join(' '):'<em>Sin tema</em>'}</span><i>▾</i></summary><div class="tdpop">${TEMAS.map(t=>`<label class="tdtg"><input type="checkbox" class="tdtgk" data-id="${o.id}" value="${t.id}" ${sel.has(t.id)?'checked':''} data-h-change="h98" data-a-change="${_ha(o.id)}"><span>${t.e} ${t.n}</span></label>`).join('')}</div></details>`;
 return `<tr data-pub="${isp?1:0}"><td><input type="checkbox" class="tdck mck" value="${o.id}" aria-label="Seleccionar producto"></td><td><img class="tdth" src="${o.thumb||''}" alt="" data-h-click="h97" data-a-click="${_ha(o.id)}" title="Ampliar"></td><td>${esc(o.name||'')}</td><td>${tm}</td><td class="r">${+o.price>0?$$(+o.price):'<small>Sin precio</small>'}</td><td>${tdStkSel(o.id,(pi&&pi.stock)||'ok')}</td><td>${tdBdSel(o.id,(pi&&pi.badges)||[])}</td><td>${isp?'<b class="okt">✔ Publicado</b>':'<small>No publicado</small>'}</td><td><button class="btn s d" data-h-click="h96" data-a-click="${_ha(o.id)}" title="Eliminar" aria-label="Eliminar">🗑</button></td></tr>`}
function tdTabla(pub){const rows=tdRows();if(!rows.length)return TJEmpresa.empEsInicial()?'<div class="vacio">Cargando el catálogo… (solo se pueden publicar productos con foto).</div>':'<div class="vacio">Aún no hay productos. Suba sus modelos en Catálogo para poder publicarlos (solo se publican los que tienen foto).</div>';
 const np=rows.filter(o=>pub.has(o.id)).length,G=new Map();
 rows.forEach(o=>{const k=String(o.cat||'').trim()||'Sin categoría';if(!G.has(k))G.set(k,[]);G.get(k).push(o)});
 const keys=[...G.keys()].sort((a,b)=>a==='Sin categoría'?1:b==='Sin categoría'?-1:a.localeCompare(b,'es'));
 const bar=`<div class="tdfl"><button class="btn s" data-f="todos" data-h-click="h95">Todos (${rows.length})</button><button class="btn s" data-f="pub" data-h-click="h94">✔ Ya subidos (${np})</button><button class="btn s" data-f="falt" data-h-click="h93">⏳ Faltan por subir (${rows.length-np})</button><button class="btn s" data-h-click="h92">☑ Marcar / desmarcar visibles</button></div>`;
 const grp=keys.map(k=>`<details class="tdg" data-k="${esc(k)}" ${TDG_CLOSED.has(k)?'':'open'} data-h-toggle="h91"><summary class="tdgs"><span class="tdgn">📂 ${esc(k)}</span><small class="tdgc"></small><i>▾</i></summary><div class="tw"><table><tr><th><input type="checkbox" class="mck" title="Marcar esta categoría" data-h-change="h90"></th><th></th><th>Producto</th><th>Temas</th><th class="r">Precio</th><th>Existencia</th><th>Etiquetas</th><th>Estado</th><th></th></tr>${G.get(k).map(o=>tdRowHTML(o,pub)).join('')}</table></div></details>`).join('');
 return bar+grp+'<div id="tdVacio" class="vacio" style="display:none"></div>'}
function tdFiltro(f){TDF=f;tdAplicarFiltro()}
function tdAplicarFiltro(){const f=TDF;document.querySelectorAll('.tdfl [data-f]').forEach(b=>b.classList.toggle('p',b.dataset.f===f));let vis=0;
 document.querySelectorAll('.tdg').forEach(g=>{let v=0,p=0,t=0;g.querySelectorAll('tr[data-pub]').forEach(r=>{const isp=r.dataset.pub==='1',show=f==='todos'||(f==='pub'?isp:!isp);t++;if(isp)p++;r.style.display=show?'':'none';if(show)v++;else{const c=r.querySelector('.tdck');if(c)c.checked=false}});
  g.style.display=v?'':'none';vis+=v;const s=g.querySelector('.tdgc');if(s)s.textContent=p+' subidos · '+(t-p)+' faltan'});
 const e=$('tdVacio');if(e){e.style.display=vis?'none':'';e.textContent=f==='pub'?'Aún no hay productos subidos.':f==='falt'?'🎉 No falta ninguno: todo está subido a la tienda.':''}}
function tdGrpT(d){const k=d.dataset.k;if(d.open)TDG_CLOSED.delete(k);else TDG_CLOSED.add(k)}
function tdMarcar(el){const on=el.checked;el.closest('table').querySelectorAll('tr[data-pub]').forEach(r=>{if(r.style.display==='none')return;const c=r.querySelector('.tdck');if(c)c.checked=on})}
function tdMarcarVis(){const cs=[...document.querySelectorAll('.tdg tr[data-pub]')].filter(r=>r.style.display!=='none').map(r=>r.querySelector('.tdck')).filter(Boolean);const on=cs.some(c=>!c.checked);cs.forEach(c=>c.checked=on)}
function tdCopy(){const i=$('td_link');i.select();try{navigator.clipboard.writeText(i.value).then(()=>alert('Enlace copiado ✔'),()=>{document.execCommand('copy');alert('Enlace copiado ✔')})}catch(e){document.execCommand('copy');alert('Enlace copiado ✔')}}
function tdWaLink(){window.open('https://wa.me/?text='+encodeURIComponent('Le comparto el catálogo virtual de '+nombreNegocio()+': '+tdLink()),'_blank','noopener,noreferrer')}
function tdSendCli(){const c=DB.cli.find(x=>x.id==$('td_cli').value);if(!c)return alert('Elija un cliente con teléfono.');const u=tdWa(c.t,'Hola '+c.n+', le comparto el catálogo virtual de '+nombreNegocio()+'. Regístrese, vea los productos y precios y haga su pedido aquí: '+tdLink());if(!u)return alert('Ese cliente no tiene un teléfono válido.');window.open(u,'_blank','noopener,noreferrer')}
async function tdImg(o){if(o.blob&&/^image\//.test(o.type||'')){const b=await comprimirImagenCatalogo(o.blob,imgKBClamp(o.imgKB||IMG_KB_DEF));return await rd(b)}
 if(o.thumb)return o.thumb;throw new Error('sin imagen')}
const tdRows=()=>{const ids=new Set(TD.cat.map(x=>x.id));return [...TD.cat,...TD.items.filter(x=>x&&x.img&&!ids.has(x.id)).map(x=>({id:x.id,name:x.name,cat:x.cat,price:x.price,desc:x.desc,tags:x.tags,thumb:x.img,_pub:1}))].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es',{numeric:true}))};
const tdMinV=()=>{try{return localStorage.getItem(lsk('tj_td_min'))==='1'}catch(e){return false}};
function tdMin(){const m=!tdMinV();try{localStorage.setItem(lsk('tj_td_min'),m?'1':'0')}catch(e){window._tjw&&_tjw(e)}const b=$('tdBody'),t=$('tdMinB');if(b)b.style.display=m?'none':'';if(t)t.textContent=m?'▸ Maximizar':'▾ Minimizar'}
function tdZoom(id){try{const o=tdRows().find(x=>x.id===id)||{},p=TD.items.find(x=>x.id===id),L=[];
 if(o.blob&&o.blob.size>0&&/^image\//.test(o.blob.type||o.type||'')){try{L.push(URL.createObjectURL(o.blob))}catch(e){window._tjw&&_tjw(e)}}
 if(p&&p.img)L.push(p.img);if(o.thumb)L.push(o.thumb);
 if(!L.length)return alert('Este producto no tiene imagen.');
 const old=document.getElementById('tdzoom');if(old)old.remove();const z=document.createElement('div');z.id='tdzoom';z.onclick=()=>z.remove();
 const im=new Image();let k=0;im.alt='';im.onerror=()=>{k++;if(k<L.length)im.src=L[k];else{im.remove();z.insertAdjacentHTML('afterbegin','<span style="color:#fff">No se pudo cargar la imagen</span>')}};im.src=L[0];z.appendChild(im);
 z.insertAdjacentHTML('beforeend',`<div class="tdzc"><b>${esc(o.name||'')}</b><small>${esc(o.cat||'')}${+o.price>0?' · '+$$(+o.price):''}</small></div><button aria-label="Cerrar">✕</button>`);document.body.appendChild(z)}catch(e){alert('No se pudo ampliar la foto: '+(e&&e.message||e))}}
addEventListener('keydown',e=>{if(e.key==='Escape'){const z=document.getElementById('tdzoom');if(z)z.remove()}});
function tdDel(id){const o=tdRows().find(x=>x.id===id)||{},pub=TD.items.some(x=>x.id===id);$('mb').innerHTML=`<h3 style="margin-top:0">Eliminar “${esc(o.name||'producto')}”</h3><p style="font-size:13.5px;color:var(--gris)">Elija qué desea hacer:</p><div style="display:grid;gap:8px">${pub?`<button class="btn" data-h-click="h89" data-a-click="${_ha(id)}">🛍 Quitar solo de la tienda (se queda en el Catálogo)</button>`:''}<button class="btn d" data-h-click="h88" data-a-click="${_ha(id)}">🗑 Eliminar del Catálogo y de la tienda</button><button class="btn" data-h-click="h12">Cancelar</button></div>`;$('md').classList.add('on')}
async function tdDelDo(id,full){cerrar();try{if(TD.items.some(x=>x.id===id))await fbCol('tienda_items').doc(id).delete();if(full){await tx('readwrite',s=>s.delete(id));if(typeof CL!=='undefined')CL=CL.filter(f=>f.id!=id);TD.cat=TD.cat.filter(x=>x.id!==id);eliminarArchivoNube(id)}}catch(e){alert('No se pudo eliminar.')}tdRender()}
const tdAgo=t=>{const m=Math.max(1,Math.round((Date.now()-t)/60000));return m<60?m+' min':m<1440?Math.round(m/60)+' h':Math.round(m/1440)+' d'};
function tdHomeHTML(){if(!SES||!puede('tienda'))return'';const nu=TD.peds.filter(p=>p.estado==='nuevo'),sem=Date.now()-6048e5,ln=TD.leads.filter(l=>l.ts>sem),tot=nu.reduce((a,p)=>a+(+p.total||0),0);
 const pl=nu.slice(0,5).map(p=>{
  const l=p.lead||{},n=(p.items||[]).reduce((a,i)=>a+(+i.q||0),0),w=tdWa(l.tel,'Hola '+(l.name||'')+', recibimos su pedido de la tienda virtual. En breve le confirmamos.');
  const tOk=(l.terminos&&l.terminos.ok)||(p.nota&&p.nota.includes('Aceptó Términos'));
  const tBadge=tOk?`<button type="button" class="btn s" data-h-click="call" data-a-click="${_ha('poliVerEvidencia',p.id)}" style="display:inline-flex;align-items:center;gap:3px;font-size:10.5px;padding:1px 6px;border-radius:10px;background:#dcfce7;color:#15803d;font-weight:700;border:1px solid #86efac;cursor:pointer;margin-left:4px" title="Ver evidencia legal Ley 81">🛡️ Ley 81</button>`:'';
  return `<div class="tdr"><div><b>${esc(l.name||'Cliente')}</b>${tBadge}<small>${n} artículo(s) · hace ${tdAgo(p.ts)}</small></div><b>${+p.total>0?$$(+p.total):'Consultar'}</b>${w?`<a class="btn s" href="${w}" target="_blank" rel="noopener" title="WhatsApp">💬</a>`:''}<button class="btn s p" data-h-click="h87" data-a-click="${_ha(p.id)}" title="Crear factura" aria-label="Crear factura">🧾</button><button class="btn s" data-h-click="h86" data-a-click="${_ha(p.id)}" title="Marcar atendido">✔</button></div>`}).join('');
 const ll=TD.leads.slice(0,5).map(l=>`<div class="tdr"><div><b>${esc(l.name||'')}</b><small>${esc(l.tel||'')}${l.empresa?' · '+esc(l.empresa):''} · hace ${tdAgo(l.ts)}</small></div></div>`).join('');
 return `<div class="card" id="tdHome"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">🛍 Tienda virtual</h3><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn s p" data-h-click="h85">🛍 Abrir tienda virtual</button><button class="btn s" data-h-click="h84">Ver todo →</button></div></div><div class="tdk"><div class="${nu.length?'hot':''}"><b>${nu.length}</b><small>Pedidos nuevos</small></div><div><b>${tot>0?$$(tot):'—'}</b><small>Por atender</small></div><div><b>${ln.length}</b><small>Clientes nuevos (7 días)</small></div><div><b>${TD.leads.length}</b><small>Clientes registrados</small></div></div><div class="tdhg"><div><h4>Pedidos nuevos</h4>${pl||'<small style="color:var(--gris)">No hay pedidos pendientes 🎉</small>'}</div><div><h4>Últimos clientes registrados</h4>${ll||'<small style="color:var(--gris)">Aún no hay registros.</small>'}</div></div></div>`}
function tdHomeRefresh(){const e=$('tdHome');if(!e||vista!=='home')return;const w=document.createElement('div');w.innerHTML=tdHomeHTML();if(w.firstElementChild)e.replaceWith(w.firstElementChild)}
function tdTmSum(id){const d=$('tdd_'+id);if(!d)return;const ch=[...document.querySelectorAll('.tdtgk[data-id="'+id+'"]:checked')].map(x=>TEMAS.find(t=>t.id===x.value)).filter(Boolean);d.querySelector('.tdsum').innerHTML=ch.length?ch.map(t=>t.e).join(' '):'<em>Sin tema</em>'}
function tdTemaAplicar(on){const t=$('tdTema').value;[...document.querySelectorAll('.tdck:checked')].forEach(c=>{const k=document.querySelector('.tdtgk[data-id="'+c.value+'"][value="'+t+'"]');if(k){k.checked=!!on;tdTmSum(c.value)}})}
async function tdPub(){if(!esAdmin()||!fbDb)return;const ids=[...document.querySelectorAll('.tdck:checked')].map(x=>x.value);if(!ids.length)return alert('Marque los productos que desea publicar.');let ok=0;const st=()=>$('tdSt');
 for(const id of ids){const o=tdRows().find(x=>x.id===id);if(!o)continue;if(st())st().textContent='Publicando '+(ok+1)+' de '+ids.length+'…';try{const img=await tdImg(o),tags=[...document.querySelectorAll('.tdtgk:checked')].filter(x=>x.dataset.id===id).map(x=>x.value);await fbCol('tienda_items').doc(id).set({id,name:o.name||'Producto',cat:o.cat||'',price:+o.price||0,desc:o.desc||'',img,tags,stock:(document.querySelector('.tdstk[data-id="'+id+'"]')||{}).value||'ok',badges:[...document.querySelectorAll('.tdbdk[data-id="'+id+'"]:checked')].map(x=>x.value),ts:Date.now()});ok++}catch(e){console.warn('Publicar:',o.name,e)}}
 if(st())st().textContent=ok===ids.length?'✔ '+ok+' producto(s) publicado(s)':'Se publicaron '+ok+' de '+ids.length+'. Revise la conexión o los permisos de Firebase.'}
async function tdUnpub(){if(!esAdmin()||!fbDb)return;const ids=[...document.querySelectorAll('.tdck:checked')].map(x=>x.value).filter(id=>TD.items.some(i=>i.id===id));if(!ids.length)return alert('Marque productos que estén publicados.');if(!confirm('¿Quitar '+ids.length+' producto(s) de la tienda?'))return;for(const id of ids){try{await fbCol('tienda_items').doc(id).delete()}catch(e){alert('No se pudo quitar un producto.')}}}
function tdEstado(id){const p=TD.peds.find(x=>x.id===id);if(!p)return;fbCol('tienda_pedidos').doc(id).update({estado:p.estado==='nuevo'?'atendido':'nuevo'}).catch(()=>alert('No se pudo actualizar el pedido.'))}
function tdFactura(id){const p=TD.peds.find(x=>x.id===id);if(!p)return;const l=p.lead||{},d=String(l.tel||'').replace(/\D/g,''),c=DB.cli.find(x=>(d&&String(x.t||'').replace(/\D/g,'')===d)||x.n===l.name);
 items=(p.items||[]).map(i=>({d:i.n,q:i.q,p:i.p}));ir('nueva');
 setTimeout(()=>{try{if(c&&$('f_cs')){$('f_cs').value=c.id;selCli()}else{$('f_cn').value=l.name||'';$('f_cd').value=l.dir||''}$('f_nt').value='Pedido de tienda virtual'+(p.nota?' · '+p.nota:'');calc()}catch(e){window._tjw&&_tjw(e)}},80)}
// ---------- Página pública para el cliente ----------
async function shopPurge(){try{if(sessionStorage.getItem('tj_purged'))return;let need=false;
 if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations){const rs=await navigator.serviceWorker.getRegistrations();if(rs.length){need=true;await Promise.all(rs.map(r=>r.unregister()))}}
 if(window.caches){const ks=await caches.keys();if(ks.length){need=true;await Promise.all(ks.map(k=>caches.delete(k)))}}
 sessionStorage.setItem('tj_purged','1');if(need)location.replace(location.href.split('#')[0]+(location.search?'&':'?')+'_r='+Date.now())}catch(e){window._tjw&&_tjw(e)}}

function shopThemeGet(){try{return localStorage.getItem(lsk('tj_shop_theme'))||'auto'}catch(e){return 'auto'}}
function shopThemeIsDark(m){const cur=m||shopThemeGet();if(cur==='dark')return true;if(cur==='light')return false;const mq=typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const hr=new Date().getHours();return mq||(hr>=19||hr<6)}
function shopThemeApply(){const cur=shopThemeGet(),isDark=shopThemeIsDark(cur),H=typeof document!=='undefined'&&document.documentElement;if(H){if(isDark){H.setAttribute('data-kt','dark');H.setAttribute('data-paleta','dark')}else{H.removeAttribute('data-kt');H.setAttribute('data-paleta',(typeof SH!=='undefined'&&SH.paleta)||'shop')}}shopThemeSyncUI()}
function shopThemeSyncUI(){const cur=shopThemeGet(),icon=cur==='dark'?'🌙':cur==='light'?'☀️':'⚙️',lbl=cur==='dark'?'Oscuro':cur==='light'?'Día':'Auto';if(typeof document!=='undefined'&&document.querySelectorAll){document.querySelectorAll('.ktheme-btn').forEach(b=>{b.setAttribute('title','Tema: '+lbl+' (Clic para cambiar Día/Oscuro/Auto)');b.setAttribute('aria-label','Tema '+lbl+': cambiar tema visual');b.innerHTML='<span class="ktheme-ico">'+icon+'</span><span>'+lbl+'</span>'});document.querySelectorAll('.krail-theme').forEach(b=>{b.setAttribute('title','Tema: '+lbl+' (Clic para cambiar)');b.innerHTML=icon});document.querySelectorAll('.km-theme-seg button').forEach(b=>{b.classList.toggle('on',b.getAttribute('data-theme-val')===cur)})}}
function shopThemeCycle(){const cur=shopThemeGet(),next=cur==='auto'?'light':cur==='light'?'dark':'auto';shopThemeSet(next)}
function shopThemeSet(mode){try{localStorage.setItem(lsk('tj_shop_theme'),mode)}catch(e){}if(typeof shopThemeApply==="function")shopThemeApply();const msg=mode==='dark'?'🌙 Modo Oscuro activado':mode==='light'?'☀️ Modo Día activado':'⚙️ Modo Automático activado (se adapta a la hora y a tu dispositivo)';if(typeof shopSnack==='function')shopSnack(msg)}
window.shopThemeGet=shopThemeGet;window.shopThemeApply=shopThemeApply;window.shopThemeCycle=shopThemeCycle;window.shopThemeSet=shopThemeSet;

function shopInit(){shopPurge();SH.openTs=Date.now();shopThemeApply();document.documentElement.classList.add('shopmode');document.body.style.overflow='hidden';const p=new URLSearchParams(location.search);SH.ref=p.get('v')||'admin';
 try{
   const cCfg=JSON.parse(localStorage.getItem(lsk('tj_cached_cfg'))||'null');
   if(cCfg){
     SH.paleta=cCfg.paleta||'shop';SH.wordmark=wmClean(cCfg.wordmark);
     SH.empresaNombre=cCfg.empresaNombre||'';
     SH.heroTitle=cCfg.heroTitle||nombreNegocio();
     SH.heroSub=cCfg.heroSub||heroSubDef();
     SH.logoUrl=cCfg.logoUrl||'';SH.motionStyle=cCfg.motionStyle||'float';SH.watermarkStyle=cCfg.watermarkStyle||'wm_violeta';SH.watermarkOpacity=cCfg.watermarkOpacity||'14';SH.heroBgType=cCfg.heroBgType||'none';SH.heroPhotoUrl=cCfg.heroPhotoUrl||'';SH.heroVideoUrl=cCfg.heroVideoUrl||'';SH.heroBgColor=cCfg.heroBgColor||'hero-bg-aurora';SH.heroBgSolid=cCfg.heroBgSolid||'#18181b';
     SH.banners=Array.isArray(cCfg.banners)?cCfg.banners:undefined;SH.btnRadio=cCfg.btnRadio||999;
     SH.empresaNombre=cCfg.empresaNombre||'';SH.contacto=cCfg.contacto&&typeof cCfg.contacto==='object'?cCfg.contacto:{};SH.redes=cCfg.redes&&typeof cCfg.redes==='object'?cCfg.redes:{};SH.cfgOk=true;
     document.documentElement.setAttribute('data-paleta',SH.paleta);
     document.documentElement.style.setProperty('--kbtn-r',SH.btnRadio+'px');
   }else{
     SH.paleta='shop';document.documentElement.setAttribute('data-paleta','shop');
   }
   if(!TJEmpresa.empEsInicial())document.title=SH.empresaNombre||'Tienda';
   const cItems=JSON.parse(localStorage.getItem(lsk('tj_cached_items'))||'[]');
   if(Array.isArray(cItems)&&cItems.length>0){
     SH.items=cItems;SH.ok=1;
   }
 }catch(e){window._tjw&&_tjw(e)}
 try{SH.cli=JSON.parse(localStorage.getItem(lsk('tj_shop_cli'))||'null')}catch(e){window._tjw&&_tjw(e)}SH.deep=p.get('p')||null;if(p.get('dir')==='1'){SH.guest=1;SH.cli={id:'dir',name:'Vista previa',tel:'',email:''}}try{SH.cart=JSON.parse(localStorage.getItem(lsk('tj_shop_cart'))||'{}')}catch(e){window._tjw&&_tjw(e)}
 const o=document.createElement('div');o.id='shop';document.body.appendChild(o);const m=document.createElement('div');m.id='shopm';m.onclick=e=>{if(e.target===m)shopClose()};document.body.appendChild(m);const sn=document.createElement('div');sn.id='ksnack';document.body.appendChild(sn);Object.assign(SH,{sel:[],sort:'pop',n:24,fav:{},favOnly:false,minPrice:'',maxPrice:'',avail:'all',view:'tiles'});try{SH.fav=JSON.parse(localStorage.getItem(lsk('tj_shop_fav'))||'{}')||{}}catch(e){window._tjw&&_tjw(e)}
 if(!fbDb)SH.err=1;else fbCol('tienda_items').onSnapshot(sn=>{cfgBlk:{const cf=sn.docs.find(d=>d.id==='__cfg'),cd=cf?cf.data():{},tm=cd.tema||(cd.navidad?'navidad':''),H=document.documentElement;
 /* Sin red y sin copia de Firestore la primera lectura llega vacía: no debe pisar la copia local buena ni dar por cargada la plantilla. */
 if(!cf&&sn.metadata&&sn.metadata.fromCache)break cfgBlk;SH.tema=tm;SH.xmas=tm==='navidad';SH.heroMode=cd.heroMode||'mix';SH.paleta=cd.paleta||'shop';SH.wordmark=wmClean(cd.wordmark);SH.empresaNombre=cd.empresaNombre||'';SH.heroTitle=cd.heroTitle||nombreNegocio();SH.heroSub=cd.heroSub||heroSubDef();SH.logoUrl=cd.logoUrl||'';SH.motionStyle=cd.motionStyle||'float';SH.watermarkStyle=cd.watermarkStyle||'wm_violeta';SH.watermarkOpacity=cd.watermarkOpacity||'14';SH.heroBgType=cd.heroBgType||'none';SH.heroPhotoUrl=cd.heroPhotoUrl||'';SH.heroVideoUrl=cd.heroVideoUrl||'';SH.heroBgColor=cd.heroBgColor||'hero-bg-aurora';SH.heroBgSolid=cd.heroBgSolid||'#18181b';SH.banners=Array.isArray(cd.banners)?cd.banners:undefined;SH.btnRadio=cd.btnRadio||999;SH.empresaNombre=cd.empresaNombre||'';SH.logo=undefined;SH.redes=cd.redes&&typeof cd.redes==='object'?cd.redes:{};SH.contacto=cd.contacto&&typeof cd.contacto==='object'?cd.contacto:{};SH.fletes=fleSanCfg(cd.fletes);H.setAttribute('data-paleta',SH.paleta);H.style.setProperty('--kbtn-r',SH.btnRadio+'px');H.classList.toggle('xmas',tm==='navidad');H.classList.toggle('summer',tm==='verano');H.classList.toggle('panama',tm==='panama');H.classList.toggle('madres',tm==='madres');H.classList.toggle('padres',tm==='padres');H.classList.toggle('trabajador',tm==='trabajador');H.classList.toggle('galaxia',tm==='galaxia');H.classList.toggle('amor',tm==='amor');try{shopXmas();shopSummer();shopPanama();shopMadres();shopPadres();shopTrabajador();shopGalaxia();shopAmor()}catch(e){window._tjw&&_tjw(e)}try{shopRedes()}catch(e){window._tjw&&_tjw(e)}SH.cfgOk=true;try{shopCacheCfg(cd);shopBrandRefresh()}catch(e){window._tjw&&_tjw(e)}}SH.items=sn.docs.filter(d=>d.id!=='__cfg').map(d=>d.data()).sort((a,b)=>(b.ts||0)-(a.ts||0));SH.ok=1;shopCacheItems(SH.items);{$('sh_g')?shopFilters():shopCatalog()}},()=>{SH.err=1;shopRender()});
 shopRender()}
const shopLogo=()=>{const custom=(typeof SH!=='undefined'&&SH.logoUrl)||(typeof TD!=='undefined'&&TD.logoUrl);if(custom)return '<img src="'+esc(custom)+'" alt="Logo" class="klogo-custom">';
 /* Otra empresa: nunca el logo de Tarjetería (.logo img es el del panel). Mientras llega su plantilla, un hueco neutro; si no tiene logo, su inicial. */
 if(!TJEmpresa.empEsInicial()){if(!SH.cfgOk)return '<span class="klogo-ph" aria-hidden="true"></span>';const n=String(nombreNegocio()||'?').trim();return '<span class="klogo-mono" role="img" aria-label="'+esc(n)+'">'+esc(n.charAt(0).toUpperCase())+'</span>'}
 if(SH.logo!==undefined)return SH.logo;const g=document.querySelector('.logo img');return SH.logo=g?'<img src="'+g.src+'" alt="">':''};
/* Copia local de la PLANTILLA de la tienda (tj_cached_cfg, una por empresa porque lsk() añade el sufijo): logo, textos, colores, contacto y redes.
  shopInit la lee en el primer pintado, así que al recargar se ve ya el logo y el nombre correctos de la empresa (y no un valor por defecto).
  Presupuesto: como máximo ~400 000 caracteres; si se pasa se quitan primero el video/foto de portada incrustados y luego los banners. Es opcional: la nube manda. */
function shopCacheCfg(cd){
 let K;try{K=lsk('tj_cached_cfg')}catch(e){return}
 try{
   cd=cd&&typeof cd==='object'?cd:{};
   const o={};
   ['paleta','wordmark','heroTitle','heroSub','logoUrl','motionStyle','watermarkStyle','watermarkOpacity','heroBgType','heroPhotoUrl','heroVideoUrl','heroBgColor','heroBgSolid','btnRadio','empresaNombre'].forEach(k=>{if(cd[k]!==undefined)o[k]=cd[k]});
   if(Array.isArray(cd.banners))o.banners=cd.banners;
   if(cd.contacto&&typeof cd.contacto==='object')o.contacto=cd.contacto;
   if(cd.redes&&typeof cd.redes==='object')o.redes=cd.redes;
   const MAX=400000;let s=JSON.stringify(o);
   if(s.length>MAX){['heroVideoUrl','heroPhotoUrl'].forEach(k=>{if(typeof o[k]==='string'&&o[k].length>20000)delete o[k]});s=JSON.stringify(o)}
   if(s.length>MAX){delete o.banners;s=JSON.stringify(o)}
   if(s.length>MAX){localStorage.removeItem(K);return}
   localStorage.setItem(K,s);
 }catch(e){try{localStorage.removeItem(K)}catch(x){}}
}
/* Cuando llega (o cambia) la plantilla de la tienda, la cabecera se actualiza en su sitio: antes solo se rehacía la portada y el logo del primer pintado se quedaba. */
function shopBrandRefresh(){
 const kb=document.querySelector('#shop .kbrand');
 if(kb){const t=document.createElement('div');t.innerHTML=shopLogo();const n=t.firstElementChild,old=kb.firstElementChild;
  if(n){if(old&&(old.tagName==='IMG'||old.classList.contains('klogo-ph')||old.classList.contains('klogo-mono')))old.replaceWith(n);else kb.insertBefore(n,kb.firstChild)}else if(old&&old.tagName==='IMG')old.remove()}
 if(!TJEmpresa.empEsInicial()){const nm=nombreNegocio();document.title=nm;const a=document.querySelector('meta[name=apple-mobile-web-app-title]');if(a)a.setAttribute('content',nm)}
}
const shopSaveCart=()=>{try{localStorage.setItem(lsk('tj_shop_cart'),JSON.stringify(SH.cart))}catch(e){window._tjw&&_tjw(e)}};
function shopRender(){const o=$('shop');if(!o)return;
 if(SH.err)return o.innerHTML=`<div class="kreg-w"><div class="kreg">${shopLogo()}<h2>Catálogo no disponible</h2><p>No se pudo conectar. Intente de nuevo en unos minutos.</p><button class="sbtn" data-h-click="h24">Reintentar</button></div></div>`;
 shopCatalog()}
// --- Protección anti-bot para la tienda pública (gratis, sin depender de Firebase App Check) ---
// 1) Campo trampa invisible ("honeypot"): un humano nunca lo ve ni lo llena; un bot que rellena
//    formularios automáticamente sí suele llenarlo. 2) Tiempo mínimo: si el pedido/registro llega
//    en menos de 2.5s desde que se abrió la tienda, es casi seguro un script, no una persona.
function shopHP(){return '<div style="position:absolute;left:-9999px;top:-9999px;height:0;overflow:hidden" aria-hidden="true"><label>Sitio web<input type="text" id="sh_hp" name="sh_web" tabindex="-1" autocomplete="off"></label></div>'}
// 3) Tope por navegador: como máximo 6 envíos (registros + pedidos juntos) cada 10 minutos desde
// el mismo navegador. No detiene a alguien que ataque directo contra Firestore sin pasar por esta
// página (eso solo lo frena Firebase App Check, pendiente de que Google lo vuelva a habilitar
// gratis), pero sí frena a un script simple o a un clic repetido que reutiliza este navegador.
const RL_KEY='tj_shop_rl',RL_MAX=6,RL_WIN=600000;
function shopRateOk(){let a=[];try{a=JSON.parse(localStorage.getItem(lsk(RL_KEY))||'[]')}catch(e){window._tjw&&_tjw(e)}
 const now=Date.now();a=a.filter(t=>now-t<RL_WIN);if(a.length>=RL_MAX)return false;
 a.push(now);try{localStorage.setItem(lsk(RL_KEY),JSON.stringify(a))}catch(e){window._tjw&&_tjw(e)}return true}
function shopAntiBot(){const hp=$('sh_hp');if(hp&&hp.value.trim())return'no';if(!SH.openTs||Date.now()-SH.openTs<2500)return'no';if(!shopRateOk())return'rl';return'ok'}
const shopAntiBotMsg=r=>r==='rl'?'Demasiados envíos seguidos desde este dispositivo. Espere unos minutos e intente de nuevo.':'No se pudo registrar. Intente de nuevo.';
async function shopReg(){const g=id=>($(id).value||'').trim(),n=g('sh_n'),t=g('sh_t'),e=g('sh_e'),m=s=>{$('sh_m').textContent=s};
 if(n.length<2)return m('Escriba su nombre.');if(t.replace(/\D/g,'').length<7)return m('Escriba un teléfono válido.');if(!/^\S+@\S+\.\S+$/.test(e))return m('Escriba un correo válido.');{const r=shopAntiBot();if(r!=='ok')return m(shopAntiBotMsg(r))}
 const l={id:uid(),name:n,tel:t,email:e,empresa:g('sh_c'),dir:g('sh_d'),ref:SH.ref,ts:Date.now(),imp:false};$('sh_b').disabled=true;m('Registrando…');
 try{await fbCol('tienda_leads').doc(l.id).set(l)}catch(x){$('sh_b').disabled=false;return m('No se pudo registrar. Intente de nuevo.')}
 SH.cli=l;try{localStorage.setItem(lsk('tj_shop_cli'),JSON.stringify(l))}catch(x){window._tjw&&_tjw(x)}shopRender()}
function shopCatalog(){const o=$("shop");if(!o)return;
 const rCount=shopLines().reduce((s,l)=>s+l.q,0);
 o.innerHTML=`<nav class="krail" id="k_rail" aria-label="Navegación principal"><div class="krail-top"><div class="krail-logo" data-h-click="call" data-a-click="${_ha('shopDNavGo','home')}" title="Inicio"><span class="krail-dot"></span></div><button class="krail-item ${!SH.favOnly?'on':''}" data-h-click="call" data-a-click="${_ha('shopDNavGo','home')}" title="Inicio" aria-label="Inicio">${kico(KI.home,24)}</button><button class="krail-item" data-h-click="call" data-a-click="${_ha('shopDNavGo','cats')}" title="Categorías" aria-label="Categorías">${kico(KI.grid,24)}</button><button class="krail-item" data-h-click="call" data-a-click="${_ha('shopDNavGo','dest')}" title="Destacados" aria-label="Destacados">${kico(KI.star,24)}</button><button class="krail-item ${SH.favOnly?'on':''}" data-h-click="call" data-a-click="${_ha('shopTab','fav')}" title="Favoritos" aria-label="Favoritos">${kico(SH.favOnly?KI.heart:KI.heartO,24)}</button><button class="krail-item krail-cart" data-h-click="call" data-a-click="${_ha('shopCart')}" title="Carrito" aria-label="Carrito">${kico(KI.cart,24)}${rCount?`<i class="kbdg">${rCount}</i>`:""}</button></div><div class="krail-bottom"><button class="krail-theme" data-h-click="call" data-a-click="${_ha('shopThemeCycle')}" title="Cambiar tema visual" aria-label="Cambiar tema visual">${shopThemeGet()==='dark'?'🌙':shopThemeGet()==='light'?'☀️':'⚙️'}</button><button class="krail-avatar" data-h-click="call" data-a-click="${_ha('shopAcc')}" title="Mi cuenta" aria-label="Mi cuenta">${SH.cli?esc((SH.cli.name||'?').trim().charAt(0).toUpperCase()):kico(KI.user,18)}</button></div></nav><div class="kwrap"><header class="khd"><div class="kh-top"><div class="kbrand">${shopLogo()}<div class="kht"><b>Catálogo virtual</b><small>${SH.guest?'Vista previa 👁':SH.cli?'Hola, '+esc((SH.cli.name||'').split(' ')[0])+' 👋':'Bienvenido 👋'}</small></div></div><div class="khact" id="k_ha"></div><button class="kmenu-btn" id="k_menu_b" data-h-click="h83" aria-label="Abrir menú" aria-expanded="false">${kico(KI.menu,22)}</button></div><div class="kh-search"><label class="ksr">${kico(KI.search,20)}<input id="sh_q" type="search" placeholder="¿Qué estás buscando hoy?" value="${esc(SH.q)}" data-h-input="h82" enterkeyhint="search" autocomplete="off"><button type="button" id="k_x" data-h-click="h81" ${SH.q?'':'hidden'} aria-label="Borrar">✕</button><button type="button" class="ksr-btn-go" data-h-click="call" data-a-click="${_ha('shopSearchSubmit')}" aria-label="Buscar"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button></label><button class="kfilter-btn" data-h-click="h80" aria-label="Abrir filtros">${kico(KI.filter,21)}</button><nav class="kh-links">${shopDNavHtml()}</nav></div><nav class="kmobile-menu" id="k_mmenu" hidden>${shopMobileNavHtml()}</nav></header><nav class="kdnav" id="k_dnav">${shopDNavHtml()}</nav><section class="khero" id="khero" aria-label="Diseños destacados"></section><section class="kpromo-carousel" id="k_promo" aria-label="Banners promocionales" hidden></section><section class="kcats" id="k_cats" hidden></section><section class="kdest" id="k_dest" hidden></section>
<div class="kmain"><aside class="kside" id="k_side"></aside><div class="kcol"><div class="kstk"><div class="kchips" id="sh_ch"></div></div>
<div class="kmeta" id="k_meta"></div><div class="kgrid" id="sh_g" aria-label="Resultados"></div><div id="k_more"></div></div></div></div><section class="kredes" id="k_redes" hidden></section><footer class="kshop-footer" id="k_footer"></footer><nav class="knav" id="k_nav"></nav><div id="k_fab"></div><div class="kwa-wrap" role="complementary" aria-label="Contacto por WhatsApp" hidden><a class="kwa" id="k_wa" target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp" title="Escribir por WhatsApp" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M9.2 8.6c.3 2.4 2.7 5 5.5 5.6l1.1-1.2-1.7-.9-.8.6c-.9-.4-1.8-1.3-2.2-2.2l.6-.8-.9-1.7z"/></svg></a></div>`;
 shopFilters();shopNav();shopHdrScroll();shopRedes()}
function shopHdrScroll(){const o=$('shop');if(!o||SH._hs)return;SH._hs=1;let last=0,tk=false;
 o.addEventListener('scroll',()=>{if(tk)return;tk=true;requestAnimationFrame(()=>{tk=false;if(innerWidth>820)return;const y=o.scrollTop,d=y-last,h=o.querySelector('.khd'),f=$('k_fab'),q=$('sh_q');
  if(Math.abs(d)>8){const hide=d>0&&y>140&&!(q&&document.activeElement===q);if(h)h.classList.toggle('kh-hide',hide);if(f)f.classList.toggle('kh-hide',hide);last=y}
  if(y<80){if(h)h.classList.remove('kh-hide');if(f)f.classList.remove('kh-hide')}})},{passive:true});
 o.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.kbrand'))o.scrollTo({top:0,behavior:'smooth'})})}

function shopDNavHtml(){return [['Inicio',"shopDNavGo('home')"],['Categorías',"shopDNavGo('cats')"],['Novedades',"shopDNavGo('novedades')"],['Más vendidos',"shopDNavGo('populares')"],['Contacto',"shopDNavGo('contact')"],['Políticas',"shopDNavGo('politicas')"]].map(([l,fn])=>`<button data-h-click="call" data-a-click="${_ha(..._hcall(fn))}">${l}</button>`).join('')+'<span class="kredh"></span>'}
function shopMobileNavHtml(){const cur=shopThemeGet();return [[KI.home,'Inicio',"shopMobileGo('home')"],[KI.grid,'Categorías',"shopMobileGo('cats')"],[KI.star,'Novedades',"shopMobileGo('novedades')"],[KI.star,'Más vendidos',"shopMobileGo('populares')"],[KI.heartO,'Favoritos',"shopMobileGo('fav')"],[KI.user,'Mi cuenta',"shopMobileGo('acc')"],[KI.cart,'Carrito',"shopMobileGo('cart')"],[KI.filter,'Filtros',"shopMobileGo('filters')"],[KI.search,'Contacto',"shopMobileGo('contact')"],[KI.star,'Políticas',"shopMobileGo('politicas')"]].map(([i,l,fn])=>`<button data-h-click="call" data-a-click="${_ha(..._hcall(fn))}">${kico(i,18)}<span>${l}</span></button>`).join('')+`<div class="km-theme-box"><div class="km-theme-title">Modo de pantalla</div><div class="km-theme-seg"><button type="button" class="${cur==='light'?'on':''}" data-theme-val="light" data-h-click="call" data-a-click="${_ha('shopThemeSet','light')}">☀️ Día</button><button type="button" class="${cur==='dark'?'on':''}" data-theme-val="dark" data-h-click="call" data-a-click="${_ha('shopThemeSet','dark')}">🌙 Oscuro</button><button type="button" class="${cur==='auto'?'on':''}" data-theme-val="auto" data-h-click="call" data-a-click="${_ha('shopThemeSet','auto')}">⚙️ Auto</button></div></div><div class="kredh"></div>`}
function shopMenu(force){const m=$('k_mmenu'),b=$('k_menu_b');if(!m)return;const open=force===undefined?m.hidden:!!force;m.hidden=!open;if(b){b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')}}
function shopMobileGo(k){shopMenu(false);if(k==='fav'||k==='acc'||k==='cart')return shopTab(k);if(k==='filters')return shopFilterSheet();shopDNavGo(k)}
function shopDNavGo(k){
 if(k==='home'){if(typeof shopClear==='function')shopClear();if(SH.favOnly){SH.favOnly=false;shopNav();shopGrid(1)}const s=$('shop');if(s)s.scrollTo({top:0,behavior:'smooth'});window.scrollTo({top:0,behavior:'smooth'});return}
 if(k==='contact'){shopContacto();return}
 if(k==='politicas'){shopPoliticas();return}
 if(k==='cats'){const c=$('k_cats'),p=$('k_promo');if(c){c.hidden=false;c.scrollIntoView({behavior:'smooth',block:'start'})}else if(p){p.hidden=false;p.scrollIntoView({behavior:'smooth',block:'start'})}return}
 if(k==='novedades'){SH.favOnly=false;SH.sort='new';shopGrid(1);shopNav();const g=$('sh_g');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});if(typeof shopSnack==='function')shopSnack('✨ Mostrando los diseños más nuevos');return}
 if(k==='populares'||k==='dest'){SH.favOnly=false;SH.sort='pop';shopGrid(1);shopNav();const g=$('sh_g')||$('k_dest')||$('khero');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});if(typeof shopSnack==='function')shopSnack('🔥 Mostrando los más vendidos y populares');return}
}
function shopBanner(){const e=$('k_banner');if(!e)return;const L=SH.items.filter(i=>i&&i.img&&!noDisp(i));if(!L.length){e.hidden=true;e.innerHTML='';return}
 if(e._k===L.length)return;e._k=L.length;e.hidden=false;const bg=L[Math.floor(Math.random()*L.length)].img;
 e.innerHTML=`<div class="kban-bg"><img src="${bg}" alt="" loading="lazy"></div><div class="kban-copy"><h1>${esc(SH.heroTitle||nombreNegocio())}</h1><p>${esc((SH.heroSub||'').split('·')[0].trim())}</p><button class="sbtn" data-h-click="h79">Descubre nuestra colección</button></div>`}
function shopPromo(){
 const e=$("k_promo");if(!e)return;
 const custom=Array.isArray(SH.banners)?SH.banners:(TJEmpresa.empEsInicial()?null:[]);
 const L=custom?custom.map((b,i)=>({id:b.id||('ban'+i),custom:true,src:b.src,name:'Banner '+(i+1)})):[...PROMO];
 if(!L.length){e.hidden=true;e.innerHTML="";return}
 e.hidden=false;
 if(SH.promoT){clearInterval(SH.promoT);SH.promoT=0}
 SH.promoL=L;SH.promoI=SH.promoI||0;
 e.innerHTML=`<div class="kpromo-track">${L.map(i=>promoSlide(i)).join("")}</div>${L.length>1?`<button class="khero-control prev" data-h-click="call" data-a-click="${_ha("shopPromoGo",-1)}" aria-label="Banner anterior">‹</button><button class="khero-control next" data-h-click="call" data-a-click="${_ha("shopPromoGo",1)}" aria-label="Siguiente banner">›</button><div class="khero-dots">${L.map((i,n)=>`<button class="${n===SH.promoI?'on':''}" data-h-click="call" data-a-click="${_ha("shopPromoSet",n)}" aria-label="Banner ${n+1}"></button>`).join("")}</div>`:""}`;
 shopPromoUpdate();
 if(L.length>1)SH.promoT=setInterval(()=>shopPromoGo(1),5200);
}
function shopPromoGo(dir){const L=SH.promoL||[];if(!L.length)return;SH.promoI=(SH.promoI+dir+L.length)%L.length;shopPromoUpdate()}
function shopPromoSet(idx){const L=SH.promoL||[];if(!L.length)return;SH.promoI=idx;shopPromoUpdate()}
function shopPromoUpdate(){const e=$("k_promo");if(!e)return;const tr=e.querySelector(".kpromo-track");if(tr)tr.style.transform=`translateX(${-100*SH.promoI}%)`;e.querySelectorAll(".khero-dots button").forEach((b,i)=>b.classList.toggle("on",i===SH.promoI))}
function shopCats(){const e=$('k_cats');if(!e)return;const L=(SH.opts||[]).filter(o=>TEMAS.some(t=>t.id===o.id)&&o.id!=='otros').slice(0,10);
 if(!L.length){e.hidden=true;e.innerHTML='';return}e.hidden=false;
 e.innerHTML=`<h3 role="heading" aria-level="2">Explora por ocasión</h3><div class="kcat-row">${L.map(o=>{const on=SH.sel.length===1&&SH.sel[0]===o.id;return `<button class="kcat-pill ${on?'on':''}" data-h-click="h78" data-a-click="${_ha(o.id)}"><span class="kcat-ic">${o.e}</span><small>${esc(o.n)}</small></button>`}).join('')}</div>`}
function shopHeroShuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
// Arma la lista del carrusel según lo configurado por el admin en Configuración → Carrusel de portada:
// 'manual' = solo los productos marcados con la etiqueta 🎠 Carrusel principal (si no hay ninguno marcado,
// se usa igual una selección aleatoria para que la portada nunca quede vacía). 'mix' (por defecto) = primero
// los marcados y luego se completa, hasta 6, con otros productos elegidos al azar. El orden aleatorio se
// calcula una sola vez por sesión/listado (no en cada filtro) para que el carrusel no "salte" al buscar.
function shopHeroList(){const mode=SH.heroMode||'mix',all=SH.items.filter(i=>i&&i.img&&!noDisp(i)),curated=all.filter(i=>Array.isArray(i.badges)&&i.badges.includes('hero')),key=mode+'|'+all.map(i=>i.id).join(',');
 if(SH._heroKey===key)return SH._heroList;
 let L;
 if(mode==='manual'&&curated.length)L=curated.slice(0,12);
 else if(mode==='random')L=shopHeroShuffle(all).slice(0,6);
 else{const rest=shopHeroShuffle(all.filter(i=>!curated.includes(i)));L=[...curated,...rest].slice(0,6)}
 SH._heroKey=key;SH._heroList=L;return L}
function shopHero(){
 const e=$("khero");if(!e)return;if(SH.heroT){clearInterval(SH.heroT);SH.heroT=0}
 const all=(typeof shopHeroList==="function"?shopHeroList():SH.items).filter(i=>i&&i.img&&!noDisp(i));
 const pool=all.length>=4?all:all.concat(SH.items.filter(i=>i&&i.img&&!noDisp(i)));
 const fl=pool.slice(0,4);
 const flHtml=fl.map((i,idx)=>`
   <article class="kfloat-card kfloat-${idx}" data-h-click="h29" data-a-click="${_ha(i.id)}" title="${esc(i.name)}">
     <div class="kfloat-img"><img src="${i.img}" alt="${esc(i.name)}" loading="lazy"></div>
     <div class="kfloat-body"><b class="kfloat-title">${esc(i.name)}</b>
       <div class="kfloat-meta"><span class="kfloat-stars">★★★★★</span><span class="kfloat-price">${+i.price>0?tdMoney(i.price):"Consultar"}</span></div>
     </div>
   </article>`).join("");
 const mStyle=SH.motionStyle||'float';
 const wStyle=SH.watermarkStyle||'wm_violeta';
 const wOp=(+SH.watermarkOpacity||14)/100;
 const bgType=SH.heroBgType||'none';
 const bgClass=bgType==='colors'?(SH.heroBgColor||'hero-bg-aurora'):'';
 e.className=`khero motion-${mStyle} ${wStyle} ${bgClass}`;
 e.style.setProperty('--wm-op',String(wOp));
 if(bgType==='solid'&&SH.heroBgSolid){e.style.background=SH.heroBgSolid}
 else if(bgType!=='solid'){e.style.background=''}
 e.hidden=false;

 let bgMediaHtml='';
 if(bgType==='video'&&SH.heroVideoUrl){
   bgMediaHtml=`<div class="khero-bg-video-wrap"><video class="khero-bg-video" autoplay muted loop playsinline src="${esc(SH.heroVideoUrl)}"></video><div class="khero-bg-overlay"></div></div>`;
 } else if(bgType==='photo'&&SH.heroPhotoUrl){
   bgMediaHtml=`<div class="khero-bg-photo-wrap"><img class="khero-bg-photo" src="${esc(SH.heroPhotoUrl)}" alt=""><div class="khero-bg-overlay"></div></div>`;
 }

 const logoCoverHtml=SH.logoUrl?`<div class="khero-brand-logo"><img src="${esc(SH.logoUrl)}" alt="Logo" loading="lazy"></div>`:'';
 e.innerHTML=`${bgMediaHtml}${SH.wordmark?`<div class="khero-bg-wordmark" aria-hidden="true">${esc(SH.wordmark)}<span class="khero-dot">.</span></div>`:''}
<div class="khero-wordmark-wrap">
  ${logoCoverHtml}
  ${(!SH.cfgOk&&!TJEmpresa.empEsInicial())?'<h1 class="khero-title khero-sk" aria-hidden="true">&nbsp;</h1><p class="khero-wordmark-sub khero-sk" aria-hidden="true">&nbsp;</p>':`<h1 class="khero-title">${esc(SH.heroTitle||nombreNegocio())}</h1>${(SH.heroSub||heroSubDef())?`<p class="khero-wordmark-sub">${esc(SH.heroSub||heroSubDef())}</p>`:''}`}
</div>
<div class="khero-constellation">${flHtml}</div>
<div class="khero-search-wrap">
  <div class="ksr ksr-hero">
    ${kico(KI.search,20)}
    <input id="sh_q_hero" type="search" placeholder="¿Qué estás buscando hoy?" value="${esc(SH.q)}" data-h-input="h82" enterkeyhint="search" autocomplete="off">
    <button type="button" class="k_x" data-h-click="h81" ${SH.q?"":"hidden"} aria-label="Borrar">✕</button>
    <button type="button" class="ksr-btn-go" data-h-click="call" data-a-click="${_ha('shopSearchSubmit')}" aria-label="Buscar">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
  </div>
</div>`;
}
function shopHeroGo(n){const e=$('khero'),L=SH.heroL||[];if(!e||!L.length)return;SH.heroI=(n+L.length)%L.length;SH.heroId=L[SH.heroI].id;const tr=e.querySelector('.khero-track');if(tr)tr.style.transform=`translateX(${-100*SH.heroI}%)`;e.querySelectorAll('.khero-dots button').forEach((b,i)=>{const on=i===SH.heroI;b.classList.toggle('on',on);b.setAttribute('aria-current',on?'true':'false')})}
const catKey=c=>{const n=shopN(c),t=TEMAS.find(x=>x.re.test(n));return t?t.id:'c:'+n};
const ik=i=>i._k||(i._k=new Set([...temaOf(i),...(i.cat?[catKey(i.cat)]:[])]));
function shopOpts(){const c=new Map(),nm={};SH.items.forEach(i=>ik(i).forEach(k=>{c.set(k,(c.get(k)||0)+1);if(k.startsWith('c:')&&!nm[k])nm[k]=i.cat}));
 const meta=k=>k.startsWith('c:')?{id:k,n:nm[k],e:'🏷️'}:temaMeta(k),ids=[...c.keys()],t=TEMAS.map(x=>x.id).filter(k=>c.has(k)),o=ids.filter(k=>!TEMAS.some(x=>x.id===k)).sort((a,b)=>String(meta(a).n).localeCompare(String(meta(b).n)));
 SH.opts=[...t,...o].map(k=>({...meta(k),c:c.get(k)}));SH.sel=SH.sel.filter(k=>c.has(k))}
function shopFilters(){shopOpts();shopChips();shopSide();shopGrid(1);shopHero();shopPromo();shopCats()}
function shopChips(){const e=$('sh_ch');if(!e)return;
 e.innerHTML=SH.opts.length?`<button class="kchip ${SH.sel.length?'':'on'}" data-h-click="h71">Todos</button>`+SH.opts.map((o,k)=>{const on=SH.sel.includes(o.id);return `<button class="kchip ${on?'on':''}" data-h-click="h70" data-a-click="${_ha(k)}" aria-pressed="${on}">${on?'✓':o.e} ${esc(o.n)}</button>`}).join(''):''}
function shopSide(){const e=$('k_side');if(!e)return;const av=[['all','Todos',SH.items.length],['in','Disponibles',SH.items.filter(i=>!noDisp(i)).length],['low','Pocas existencias',SH.items.filter(i=>i.stock==='low').length],['out','No disponibles',SH.items.filter(noDisp).length]];
 e.innerHTML=`<div class="kfilter-section"><h3>Filtros <button class="kfilter-clear" data-h-click="h62">Limpiar</button></h3><div class="kprice-fields"><label>Precio desde<input type="number" min="0" inputmode="decimal" placeholder="$ 0" value="${esc(SH.minPrice)}" data-h-input="h74"></label><label>Precio hasta<input type="number" min="0" inputmode="decimal" placeholder="Sin límite" value="${esc(SH.maxPrice)}" data-h-input="h73"></label></div><div class="kavail">${av.map(([v,l,n])=>`<button class="${SH.avail===v?'on':''}" data-h-click="h72" data-a-click="${_ha(v)}"><span>${l}</span><span>${n}</span></button>`).join('')}</div></div><div class="kfilter-section"><h3>Por ocasión</h3>${SH.opts.length?`<label class="ksd ${SH.sel.length?'':'on'}"><input type="checkbox" ${SH.sel.length?'':'checked'} data-h-change="h71"><span>✨ Todos</span><i>${SH.items.length}</i></label>`+SH.opts.map((o,k)=>{const on=SH.sel.includes(o.id);return `<label class="ksd ${on?'on':''}"><input type="checkbox" ${on?'checked':''} data-h-change="h70" data-a-change="${_ha(k)}"><span>${o.e} ${esc(o.n)}</span><i>${o.c}</i></label>`}).join(''):''}</div>`}
function shopSel(k){if(k<0)SH.sel=[];else{const id=SH.opts[k].id,p=SH.sel.indexOf(id);if(p<0)SH.sel.push(id);else SH.sel.splice(p,1)}shopChips();shopSide();shopGrid(1)}
function shopTemaId(t){SH.sel=[t];SH.favOnly=false;SH.q='';if($('sh_q'))$('sh_q').value='';shopFilters();shopNav();const s=$('shop');if(s)s.scrollTo({top:0,behavior:'smooth'})}
function shopSearchSubmit(){const q=(($("sh_q_hero")&&$("sh_q_hero").value)||($("sh_q")&&$("sh_q").value)||"").trim();shopQ(q);const g=$("sh_g");if(g)g.scrollIntoView({behavior:"smooth",block:"start"})}
/* shopDNavGo handled globally */
function shopQ(v){SH.q=v;const x=$("k_x");if(x)x.hidden=!v;const q1=$("sh_q"),q2=$("sh_q_hero");if(q1&&q1.value!==v)q1.value=v;if(q2&&q2.value!==v)q2.value=v;clearTimeout(SH.qt);SH.qt=setTimeout(()=>shopGrid(1),130)}
function shopPrice(k,v){SH[k]=String(v||'').replace(',','.');shopGrid(1)}
function shopAvail(v){SH.avail=v;shopSide();shopGrid(1)}
function shopClear(){SH.q="";SH.sel=[];SH.minPrice="";SH.maxPrice="";SH.avail="all";const q=$("sh_q");if(q)q.value="";const q2=$("sh_q_hero");if(q2)q2.value="";const x=$("k_x");if(x)x.hidden=true;shopFilters()}
function shopPriceMatch(i){const lo=+SH.minPrice||0,hi=+SH.maxPrice||0,p=+i.price||0;if(!(lo||hi))return true;if(!p)return false;return(!lo||p>=lo)&&(!hi||p<=hi)}
function shopAvailMatch(i){return SH.avail==='all'||(SH.avail==='in'&&!noDisp(i))||(SH.avail==='low'&&i.stock==='low')||(SH.avail==='out'&&noDisp(i))}
const shopPop=i=>{const b=bdgList(i);return(b.includes('best')?100:0)+(b.includes('model')?25:0)+(b.includes('new')?10:0)+(SH.fav[i.id]?2:0)};
function shopList(){const q=shopN(SH.q).trim();let L=SH.items.filter(i=>(!SH.sel.length||SH.sel.some(k=>ik(i).has(k)))&&(!SH.favOnly||SH.fav[i.id])&&shopPriceMatch(i)&&shopAvailMatch(i)&&(!q||shopN((i.name||'')+' '+(i.cat||'')+' '+(i.desc||'')+' '+[...ik(i)].map(k=>k.startsWith('c:')?'':temaMeta(k).n).join(' ')).includes(q)));
 if(SH.sort==='pop')L=[...L].sort((a,b)=>shopPop(b)-shopPop(a)||(+b.ts||0)-(+a.ts||0));else if(SH.sort==='pl')L=[...L].sort((a,b)=>(+a.price||1e9)-(+b.price||1e9));else if(SH.sort==='ph')L=[...L].sort((a,b)=>(+b.price||0)-(+a.price||0));else if(SH.sort==='az')L=[...L].sort((a,b)=>String(a.name).localeCompare(String(b.name),'es',{numeric:true}));return [...L.filter(i=>!noDisp(i)),...L.filter(noDisp)]}
function shopFilterSheet(){const av=[['all','Todos'],['in','Disponibles'],['low','Pocas existencias'],['out','No disponibles']];shopM(`<div class="kfilter-sheet"><h2>Filtros</h2><p>Ajuste el catálogo a lo que desea encontrar.</p><div class="kprice-fields"><label>Precio desde<input id="kfm_lo" type="number" min="0" inputmode="decimal" placeholder="$ 0" value="${esc(SH.minPrice)}"></label><label>Precio hasta<input id="kfm_hi" type="number" min="0" inputmode="decimal" placeholder="Sin límite" value="${esc(SH.maxPrice)}"></label></div><h3 class="kpt">Disponibilidad</h3><div class="kavail">${av.map(([v,l])=>`<button class="${SH.avail===v?'on':''}" data-h-click="h69" data-a-click="${_ha(v)}"><span>${l}</span>${SH.avail===v?'✓':''}</button>`).join('')}</div><h3 class="kpt">Ocasiones</h3><div class="kfilter-cats"><button class="${SH.sel.length?'':'on'}" data-h-click="h68">✨ Todos</button>${SH.opts.map(o=>`<button class="${SH.sel.includes(o.id)?'on':''}" data-h-click="h67" data-a-click="${_ha(o.id)}">${o.e} ${esc(o.n)}</button>`).join('')}</div><div class="kact2"><button class="sbtn" data-h-click="h66">Ver resultados</button><button class="sbtn g" data-h-click="h65">Limpiar filtros</button></div></div>`,'filters')}
function shopFilterSheetDraft(){const lo=$('kfm_lo'),hi=$('kfm_hi');if(lo)SH.minPrice=String(lo.value||'').replace(',','.');if(hi)SH.maxPrice=String(hi.value||'').replace(',','.')}
function shopFilterSheetSel(id){shopFilterSheetDraft();const p=SH.sel.indexOf(id);if(p<0)SH.sel.push(id);else SH.sel.splice(p,1);shopFilterSheet()}
function shopFilterSheetAll(){shopFilterSheetDraft();SH.sel=[];shopFilterSheet()}
function shopFilterSheetAvail(v){shopFilterSheetDraft();SH.avail=v;shopFilterSheet()}
function shopFilterSheetReset(){SH.sel=[];SH.minPrice='';SH.maxPrice='';SH.avail='all';shopFilterSheet()}
function shopFilterSheetApply(){SH.minPrice=String(($('kfm_lo')||{}).value||'').replace(',','.');SH.maxPrice=String(($('kfm_hi')||{}).value||'').replace(',','.');shopClose();shopFilters()}
const noDisp=i=>i&&(i.stock==='out'||i.stock==='disc');
const stkLbl={low:'Pocas existencias',out:'Agotado',disc:'Descontinuado'};
const stkTag=(i,inl)=>stkLbl[i.stock]?`<span class="${inl?'kbi':'kbg'} kb-${i.stock}">${stkLbl[i.stock]}</span>`:'';
const stkMsg=i=>i.stock==='out'?'Este producto está agotado por el momento. Consulte por disponibilidad.':'Este producto fue descontinuado y ya no está disponible.';

const shopCard=i=>`<article class="kc${noDisp(i)?' off':''}"><div class="kimg" data-h-click="h29" data-a-click="${_ha(i.id)}">${bdgTags(i)}${stkTag(i)}<img loading="lazy" decoding="async" src="${i.img}" alt="${esc(i.name)}"><button class="kfav ${SH.fav[i.id]?'on':''}" data-f="${i.id}" data-h-click="h28" data-a-click="${_ha(i.id)}" aria-label="Favorito">${kico(SH.fav[i.id]?KI.heart:KI.heartO,20)}</button></div><div class="kbd">${i.cat?`<span class="kcat">${esc(i.cat)}</span>`:''}<b>${esc(i.name)}</b><div class="kfoot"><span class="kp ${+i.price>0?'':'q'}">${+i.price>0?tdMoney(i.price):'Consultar precio'}</span><span class="kact" data-a="${i.id}">${shopBtn(i.id)}</span></div></div></article>`;
function shopGrid(reset){const g=$('sh_g');if(!g)return;if(reset)SH.n=24;if(SH.io){SH.io.disconnect();SH.io=null}const mo=$('k_more'),mt=$('k_meta');mo.innerHTML='';g.className='kgrid'+(SH.view==='mini'?' mini':'');
 if(!SH.ok){g.innerHTML=Array(8).fill('<div class="kc ksk"><div class="kimg"></div><div class="kbd"><i></i><i style="width:60%"></i></div></div>').join('');mt.innerHTML='';return}
 const L=shopList(),f=SH.q||SH.sel.length||SH.minPrice||SH.maxPrice||SH.avail!=='all',nm=SH.sel.map(k=>(SH.opts.find(o=>o.id===k)||{}).n).filter(Boolean).join(', '),priceTag=(SH.minPrice||SH.maxPrice)?` · $${SH.minPrice||'0'}–${SH.maxPrice||'∞'}`:'';
 mt.innerHTML=`<span class="kcnt">${L.length} diseño${L.length==1?'':'s'}${SH.favOnly?' favoritos':''}${nm?' · '+esc(nm):''}${priceTag}${SH.avail!=='all'?' · '+(SH.avail==='in'?'Disponibles':SH.avail==='low'?'Pocas existencias':'No disponibles'):''}</span><span class="kmr">${f?'<button data-h-click="h62">Limpiar</button>':''}${SH.sort==='pop'?`<span class="kfilter-tag">${kico(KI.star,13)} Popularidad</span>`:''}<select class="ksort" data-h-change="h64" aria-label="Ordenar"><option value="pop" ${SH.sort==='pop'?'selected':''}>Popularidad</option><option value="new" ${SH.sort==='new'?'selected':''}>Más recientes</option><option value="az" ${SH.sort==='az'?'selected':''}>Nombre A-Z</option><option value="pl" ${SH.sort==='pl'?'selected':''}>Precio: menor</option><option value="ph" ${SH.sort==='ph'?'selected':''}>Precio: mayor</option></select><button class="kview" data-h-click="h63" aria-label="${SH.view==='mini'?'Ver cuadrícula amplia':'Ver miniaturas'}">${kico(SH.view==='mini'?KI.grid:KI.list,18)}</button></span>`;
 g.innerHTML=L.length?L.slice(0,SH.n).map(shopCard).join(''):`<div class="kempty"><span class="e">${SH.favOnly&&!f?'♡':'🔍'}</span>${!SH.items.length?'Esta tienda aún no tiene productos.':SH.favOnly&&!f?'Aún no tienes favoritos.<br>Toca el corazón en los diseños que te gusten.':'No encontramos diseños con esos filtros.'}${f?'<br><button class="sbtn" style="width:auto" data-h-click="h62">Ver todos</button>':''}</div>`;
 if(L.length>SH.n){mo.innerHTML='<div class="kspin"></div>';SH.io=new IntersectionObserver(es=>{if(!es[0].isIntersecting)return;const l=shopList(),a=SH.n;SH.n+=24;g.insertAdjacentHTML('beforeend',l.slice(a,SH.n).map(shopCard).join(''));if(l.length>SH.n){SH.io.unobserve(mo);SH.io.observe(mo)}else{SH.io.disconnect();mo.innerHTML=''}},{root:$('shop'),rootMargin:'900px'});SH.io.observe(mo)}}
function shopView(){SH.view=SH.view==='mini'?'tiles':'mini';shopGrid(1)}
const shopBtn=id=>{const it=SH.items.find(x=>x.id===id);if(noDisp(it))return '<span class="kno">'+stkLbl[it.stock]+'</span>';return shopBtn0(id)};
const shopBtn0=id=>SH.cart[id]?`<div class="kst"><button data-h-click="h45" data-a-click="${_ha(id)}" aria-label="Quitar uno">−</button><button class="kqn" data-h-click="h47" data-a-click="${_ha(id)}" aria-label="Cambiar cantidad">${SH.cart[id]}</button><button data-h-click="h43" data-a-click="${_ha(id)}" aria-label="Agregar uno">+</button></div>`:`<button class="kadd" data-h-click="h47" data-a-click="${_ha(id)}" aria-label="Agregar al carrito">${kico(KI.plus)}</button>`;
function shopAct(id){document.querySelectorAll('[data-a="'+id+'"]').forEach(e=>e.innerHTML=shopBtn(id))}
function shopFav(id){if(SH.fav[id])delete SH.fav[id];else SH.fav[id]=1;try{localStorage.setItem(lsk('tj_shop_fav'),JSON.stringify(SH.fav))}catch(e){window._tjw&&_tjw(e)}
 try{navigator.vibrate&&navigator.vibrate(8)}catch(e){window._tjw&&_tjw(e)}
 document.querySelectorAll('[data-f="'+id+'"]').forEach(b=>{b.classList.toggle('on',!!SH.fav[id]);b.innerHTML=kico(SH.fav[id]?KI.heart:KI.heartO,20)});
 if(SH.favOnly&&!SH.fav[id]&&$('shopm').style.display!=='flex')shopGrid(1);if($('shopm').dataset.k==='det'&&$('shopm').dataset.id===id)shopDet(id)}
function shopTab(k){const s=$('shop');if(k==='cart')return shopCart();if(k==='acc')return shopAcc();SH.favOnly=k==='fav';shopNav();shopGrid(1);if(s)s.scrollTo({top:0,behavior:'smooth'})}
const shopLines=()=>Object.keys(SH.cart).map(id=>{const i=SH.items.find(x=>x.id===id);return i&&!noDisp(i)?{id,n:i.name,p:+i.price||0,q:SH.cart[id],img:i.img}:null}).filter(Boolean);
function shopNav(){const n=shopLines().reduce((s,l)=>s+l.q,0),e=$("k_nav"),h=$("k_ha"),r=$("k_rail");
 if(e)e.innerHTML=[["home","Inicio",KI.home,0,!SH.favOnly],["fav","Favoritos",SH.favOnly?KI.heart:KI.heartO,0,SH.favOnly],["cart","Carrito",KI.cart,n,0],["acc","Mi cuenta",KI.user,0,0]].map(([k,l,d,b,on])=>`<button class="${on?'on':''}" data-h-click="h61" data-a-click="${_ha(k)}"><span class="kpill">${kico(d)}${b?`<i class="kbdg">${b}</i>`:""}</span><small>${l}</small></button>`).join("");
 const curThm=shopThemeGet(),thmIco=curThm==='dark'?'🌙':curThm==='light'?'☀️':'⚙️',thmLbl=curThm==='dark'?'Oscuro':curThm==='light'?'Día':'Auto';
 if(h)h.innerHTML=`<button class="kha ktheme-btn" data-h-click="call" data-a-click="${_ha('shopThemeCycle')}" title="Tema: ${thmLbl} (Clic para cambiar Día/Oscuro/Auto)" aria-label="Tema ${thmLbl}: cambiar tema visual"><span class="ktheme-ico">${thmIco}</span><span>${thmLbl}</span></button><button class="kha ${SH.favOnly?'on':''}" data-h-click="h61" data-a-click="${_ha(SH.favOnly?'home':'fav')}">${kico(SH.favOnly?KI.heart:KI.heartO,20)}<span>Favoritos</span></button><button class="kha" data-h-click="h60">${kico(KI.user,20)}<span>Mi cuenta</span></button><button class="kha pri" data-h-click="h30">${kico(KI.cart,20)}<span>Carrito</span>${n?`<i class="kbdg">${n}</i>`:""}</button>`;
 if(r){
   const rc=r.querySelector(".krail-cart");
   if(rc){
     const b=rc.querySelector(".kbdg");if(b)b.remove();
     if(n){const x=document.createElement("i");x.className="kbdg";x.textContent=n;rc.appendChild(x)}
   }
   r.querySelectorAll(".krail-item").forEach(b=>{
     if(b.title==="Favoritos")b.classList.toggle("on",!!SH.favOnly);
     if(b.title==="Inicio")b.classList.toggle("on",!SH.favOnly);
   });
 }
}
const shopCb=shopNav;
const shopQtys=[6,12,24,36],docL=n=>n===6?'½ docena':n%12===0?(n/12)+(n===12?' docena':' docenas'):'';
function shopPick(id,from){const i=SH.items.find(x=>x.id===id);if(!i)return;if(noDisp(i)){shopToast('Producto '+(i.stock==='out'?'agotado':'descontinuado'));return}SH.pq=SH.cart[id]||12;SH.pf=from||'';SH.pi=id;
 shopM(`<div class="kpk"><img src="${i.img}" alt=""><div><b>${esc(i.name)}</b><small>${+i.price>0?tdMoney(i.price)+' c/u':'Precio a consultar'}</small></div></div><h3 class="kpt">¿Cuántas unidades?</h3><div class="kqc">${shopQtys.map(n=>`<button class="kqb" data-n="${n}" data-h-click="h59" data-a-click="${_ha(n)}"><b>${n}</b><small>${docL(n)}</small></button>`).join('')}</div><div class="kqm"><span>Otra cantidad</span><div class="kst lg"><button data-h-click="h58" aria-label="Menos">−</button><input id="k_pq" type="number" inputmode="numeric" min="1" max="9999" data-h-input="h57" data-h-focus="h56"><button data-h-click="h55" aria-label="Más">+</button></div></div><div class="kpsum"><span>Subtotal</span><b id="k_ps"></b></div><div class="kact2"><button class="sbtn" id="k_pb" data-h-click="h54"></button>${SH.cart[id]?`<button class="sbtn kdelb" data-h-click="h53" data-a-click="${_ha(id)}">${kico(KTRASH,18)} Quitar del carrito</button>`:''}<button class="sbtn g" data-h-click="call" data-a-click="${_ha(from==='cart'?'shopCart':'shopClose')}">Cancelar</button></div>`,'pick',id);shopPickUpd()}
function shopPickSet(v,typing){let n=Math.round(+v);if(!(n>=1))n=typing?SH.pq:1;SH.pq=Math.min(9999,n);shopPickUpd(typing)}
function shopPickUpd(typing){const q=SH.pq,i=SH.items.find(x=>x.id===SH.pi)||{},m=$('shopm');if(!m||m.dataset.k!=='pick')return;
 m.querySelectorAll('.kqb').forEach(b=>b.classList.toggle('on',+b.dataset.n===q));const inp=$('k_pq');if(inp&&!typing)inp.value=q;
 $('k_ps').textContent=+i.price>0?$$(q*i.price):'Consultar';$('k_pb').textContent=(SH.cart[SH.pi]?'Actualizar carrito':'Agregar al carrito')+' · '+q+(docL(q)?' ('+docL(q)+')':'')}
function shopPickOk(){const id=SH.pi,was=SH.cart[id]||0;SH.cart[id]=SH.pq;shopSaveCart();shopAct(id);shopNav();try{navigator.vibrate&&navigator.vibrate(8)}catch(e){window._tjw&&_tjw(e)}
 if(SH.pf==='cart')shopCart();else{shopClose();shopToast((was?'Cantidad actualizada: ':'Agregado: ')+SH.pq+' unidades','Ver',shopCart)}}
const KTRASH='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z';
function shopDel(id,from){const q=SH.cart[id];if(!q)return;SH.undo={id,q};delete SH.cart[id];shopSaveCart();shopAct(id);shopNav();try{navigator.vibrate&&navigator.vibrate(8)}catch(e){window._tjw&&_tjw(e)}
 const m=$('shopm');if(m&&m.style.display==='flex'){if(from==='pick'&&SH.pf!=='cart')shopClose();else shopCart()}
 shopToast('Producto quitado del carrito','Deshacer',shopUndo);clearTimeout(SH.tt);SH.tt=setTimeout(()=>{const e=$('ksnack');if(e)e.innerHTML=''},5500)}
function shopUndo(){const u=SH.undo;if(!u)return;SH.undo=null;SH.cart[u.id]=u.q;shopSaveCart();shopAct(u.id);shopNav();const m=$('shopm');if(m&&m.style.display==='flex'&&m.dataset.k==='cart')shopCart()}
function shopQty(id,d){{const it=SH.items.find(x=>x.id===id);if(d>0&&noDisp(it)){shopToast('Producto no disponible');return}}const was=SH.cart[id]||0,n=Math.max(0,was+d);if(n)SH.cart[id]=n;else delete SH.cart[id];shopSaveCart();shopAct(id);shopNav();
 if(d>0){try{navigator.vibrate&&navigator.vibrate(8)}catch(e){window._tjw&&_tjw(e)}if(!was)shopToast('Agregado al carrito','Ver',shopCart)}
 const m=$('shopm');if(m.style.display==='flex'){if(m.dataset.k==='cart')shopCart();else if(m.dataset.k==='det')shopDet(m.dataset.id)}}
function shopToast(t,lbl,fn){const s=$('ksnack');if(!s)return;clearTimeout(SH.tt);SH.tf=fn||null;s.innerHTML='<div class="ksn"><span>'+t+'</span>'+(lbl?'<button data-h-click="h52">'+lbl+'</button>':'')+'</div>';SH.tt=setTimeout(()=>{s.innerHTML=''},2400)}
function shopToastGo(){const f=SH.tf;$('ksnack').innerHTML='';f&&f()}
function shopM(h,k,id,w){const m=$('shopm'),re=m.style.display==='flex',old=re&&m.firstChild?m.firstChild.scrollTop:0;m.innerHTML='<div class="ksheet'+(re?' re':'')+(w?' wide':'')+'"><div class="kgrab"></div>'+h+'</div>';m.dataset.k=k||'';m.dataset.id=id||'';m.style.display='flex';if(old)m.firstChild.scrollTop=old;
 if(!SH.hp){SH.hp=1;try{history.pushState({shop:1},'')}catch(e){window._tjw&&_tjw(e)}}}
function shopClose(pop){SH.poliOk=false;const m=$('shopm');m.style.display='none';m.innerHTML='';m.dataset.k='';if(SH.hp){SH.hp=0;if(!pop)try{history.back()}catch(e){window._tjw&&_tjw(e)}}}
addEventListener('popstate',()=>{if(SH.hp)shopClose(1)});
function shopZoom(id){const i=SH.items.find(x=>x.id===id);if(!i)return;let z=$('kzoom');if(z)z.remove();z=document.createElement('div');z.id='kzoom';z.onclick=()=>z.remove();z.innerHTML='<img src="'+i.img+'" alt=""><button aria-label="Cerrar">✕</button>';document.body.appendChild(z)}
addEventListener('keydown',e=>{if(e.key!=='Escape')return;const z=$('kzoom');if(z)z.remove();else if(SH.hp)shopClose()});
function shopDet(id){const i=SH.items.find(x=>x.id===id);if(!i)return;const tg=[...ik(i)].map(k=>SH.opts.find(o=>o.id===k)).filter(Boolean).map(o=>`<button data-k="${esc(o.id)}" data-h-click="h51">${o.e} ${esc(o.n)}</button>`).join('');
 shopM(`<div class="kdet"><div class="kdi"><img src="${i.img}" alt="${esc(i.name)}" data-h-click="h50" data-a-click="${_ha(id)}"><button class="kfav ${SH.fav[id]?'on':''}" data-f="${id}" data-h-click="h49" data-a-click="${_ha(id)}" aria-label="Favorito">${kico(SH.fav[id]?KI.heart:KI.heartO,22)}</button><span class="kzh">Toca para ampliar</span></div><div class="kdx">${i.cat?`<div class="kcat">${esc(i.cat)}</div>`:''}<h2>${esc(i.name)}</h2><div class="kdp">${tdMoney(i.price)}</div>${bdgTags(i,1)}${stkTag(i,1)}<button class="kshare" data-h-click="h48" data-a-click="${_ha(i.id)}">↗ Compartir</button>${tg?`<div class="ktg">${tg}</div>`:''}${i.desc?`<p class="kds">${esc(i.desc).replace(/\n/g,'<br>')}</p>`:''}<div class="kact2">${noDisp(i)?`<div class="kstn">${stkMsg(i)}</div>`:SH.cart[id]?`<div class="kst lg"><button data-h-click="h45" data-a-click="${_ha(id)}" aria-label="Quitar uno">−</button><button class="kqn" data-h-click="h47" data-a-click="${_ha(id)}">${SH.cart[id]} en el carrito · cambiar</button><button data-h-click="h43" data-a-click="${_ha(id)}" aria-label="Agregar uno">+</button></div><button class="sbtn" data-h-click="h40">Ver carrito</button>`:`<button class="sbtn" data-h-click="h47" data-a-click="${_ha(id)}">Elegir cantidad y agregar</button>`}<button class="sbtn g" data-h-click="h31">Seguir viendo</button></div></div></div>`,'det',id,1)}
function shopCart(){const L=shopLines(),poliPrev=$('sh_chk_poli')?$('sh_chk_poli').checked:!!SH.poliOk;/* Fase 24: la casilla conserva lo que el cliente ya marcó (al cambiar cantidades o al volver del registro) */
 if(!L.length)return shopM('<h2 style="margin:6px 0 12px">Su carrito está vacío</h2><button class="sbtn g" data-h-click="h31">Seguir viendo</button>','cart');
 const poliConsent=`<div id="sh_poli_box" style="background:var(--sf);border:1px solid var(--linea);border-radius:10px;padding:12px;margin:12px 0;font-size:12px;line-height:1.45;transition:border-color .2s,background .2s">
  <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:var(--txt);margin-bottom:6px">
    <span style="font-size:14px">🛡️</span><span>Protección y Políticas de la Tienda (Ley 81 de Panamá)</span>
  </div>
  <p style="margin:0 0 8px;font-size:11.5px;color:var(--gris)">${esc(nombreNegocio())} prepara su tienda en línea. No se solicitan pagos ni claves bancarias por este medio.</p>
  <label class="pchk" style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin:0">
    <input type="checkbox" id="sh_chk_poli"${poliPrev?' checked':''} style="width:18px;height:18px;margin-top:1px;accent-color:var(--p);cursor:pointer;flex-shrink:0" data-h-change="call" data-a-change="${_ha('poliChkLimpiar')}">
    <span style="color:var(--txt)">He leído y acepto los <a href="#" data-h-click="call" data-a-click="${_ha('shopPoliticas','2')}" style="color:var(--p);font-weight:700;text-decoration:underline">Términos de Uso</a> y la <a href="#" data-h-click="call" data-a-click="${_ha('shopPoliticas','3')}" style="color:var(--p);font-weight:700;text-decoration:underline">Política de Privacidad</a>. Entiendo y acepto que la tienda está en <b>etapa preparatoria informativa</b>.</span>
  </label>
</div>`;
 const t=L.reduce((s,l)=>s+l.q*l.p,0),nt=$('sh_nt')?$('sh_nt').value:(SH.pendNote||'');/* Fase 24: al volver del registro («Volver al pedido») la nota se recupera de SH.pendNote */
 shopM(`<h2 style="margin:6px 0">🛒 Su pedido</h2>${L.map(l=>`<div class="kln"><img src="${l.img}" alt=""><div><b>${esc(l.n)}</b><small>${tdMoney(l.p)} c/u</small><button class="kdel" data-h-click="h46" data-a-click="${_ha(l.id)}">${kico(KTRASH,15)} Quitar</button></div><div class="kst"><button data-h-click="h45" data-a-click="${_ha(l.id)}" aria-label="Quitar uno">−</button><button class="kqn" data-h-click="h44" data-a-click="${_ha(l.id)}" aria-label="Cambiar cantidad">${l.q}</button><button data-h-click="h43" data-a-click="${_ha(l.id)}" aria-label="Agregar uno">+</button></div></div>`).join('')}<div style="display:flex;justify-content:space-between;font-size:19px;font-weight:800;margin:14px 0 4px"><span>Total</span><span>${t>0?$$(t):'Consultar'}</span></div><small style="color:var(--tx2)">Precios sin ITBMS. Le confirmaremos disponibilidad y forma de pago.</small>${shopFleHTML()}<textarea id="sh_nt" rows="2" placeholder="Notas para el pedido (opcional)">${esc(nt)}</textarea>${shopHP()}${poliConsent}<div class="serr" id="sh_m2" style="margin:6px 0"></div><div class="kact2"><button class="sbtn" id="sh_sb" data-h-click="h42">Enviar pedido</button><button class="sbtn g" data-h-click="h31">Seguir viendo</button></div>`,'cart')}
function shopVoz(txt){const ss=window.speechSynthesis;if(!ss)return;const go=()=>{try{ss.cancel();const u=new SpeechSynthesisUtterance(txt),v=typeof vozEs==='function'?vozEs():null;if(v){u.voice=v;u.lang=v.lang}else u.lang='es-MX';u.rate=.96;u.pitch=1.05;u.volume=1;ss.speak(u)}catch(e){window._tjw&&_tjw(e)}};
 if(ss.getVoices().length)go();else{let d=0;const h=()=>{if(d++)return;go()};ss.onvoiceschanged=h;setTimeout(h,900)}}
function tdPedDel(id){const p=TD.peds.find(x=>x.id===id);if(!p||!fbDb)return;const l=p.lead||{};if(!confirm('¿Eliminar el pedido de '+(l.name||'este cliente')+(p.total>0?' por '+$$(p.total):'')+'?\nEsta acción no se puede deshacer.'))return;
 fbCol('tienda_pedidos').doc(id).delete().catch(()=>alert('No se pudo eliminar el pedido. Revise su conexión o sus permisos.'))}
// Solo el administrador puede borrar registros de la tienda (así lo exigen las reglas de Firestore).
function tdLeadDel(id){if(!esAdmin()||!fbDb)return;const l=TD.leads.find(x=>x.id===id);if(!l)return;
 if(!confirm('¿Eliminar el registro de '+(l.name||'este cliente')+'?\nEsto no borra al cliente de su lista de Clientes si ya se importó, solo el registro de la tienda.\nEsta acción no se puede deshacer.'))return;
 fbCol('tienda_leads').doc(id).delete().catch(()=>alert('No se pudo eliminar el registro. Revise su conexión o sus permisos.'))}

function shopAskReg(){shopM(`<div style="text-align:center;padding:6px 0 2px"><h2 style="margin:6px 0 4px">Último paso</h2><p style="color:var(--tx2);margin:0 0 16px;font-size:14.5px;line-height:1.45">Complete sus datos para enviar su pedido. Solo se lo pediremos esta vez.</p></div><label class="kf"><span>Nombre completo *</span><input id="sh_n" autocomplete="name"></label><label class="kf"><span>Teléfono / WhatsApp *</span><input id="sh_t" type="tel" autocomplete="tel" inputmode="tel"></label><label class="kf"><span>Correo electrónico *</span><input id="sh_e" type="email" autocomplete="email" inputmode="email"></label><label class="kf"><span>Empresa (opcional)</span><input id="sh_c" autocomplete="organization" maxlength="120"></label><label class="kf"><span>Dirección o ciudad (opcional)</span><input id="sh_d" autocomplete="street-address" maxlength="200"></label>${shopHP()}<div id="sh_reg_poli_box" style="background:var(--sf);border:1px solid var(--linea);border-radius:10px;padding:10px 12px;margin:10px 0;font-size:11.5px;line-height:1.4;text-align:left">  <label class="pchk" style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin:0">    <input type="checkbox" id="sh_chk_poli_reg" style="width:17px;height:17px;margin-top:1px;accent-color:var(--p);cursor:pointer;flex-shrink:0" data-h-change="call" data-a-change="${_ha('poliChkLimpiar')}">    <span style="color:var(--txt)">Acepto los <a href="#" data-h-click="call" data-a-click="${_ha('shopPoliticas','2')}" style="color:var(--p);font-weight:700;text-decoration:underline">Términos</a> y la <a href="#" data-h-click="call" data-a-click="${_ha('shopPoliticas','3')}" style="color:var(--p);font-weight:700;text-decoration:underline">Política de Privacidad (Ley 81)</a> en etapa preparatoria.</span>  </label></div><div class="serr" id="sh_m"></div><div class="kact2"><button class="sbtn" id="sh_b" data-h-click="h41">Registrarme y enviar pedido</button><button class="sbtn g" data-h-click="h40">Volver al pedido</button></div><p style="font-size:11.5px;margin:6px 0 0;text-align:center;color:var(--tx2)">Sus datos se usan solo para atender su pedido.</p>`,'reg');setTimeout(()=>{const i=$('sh_n');if(i)i.focus()},350)}
async function shopRegSend(){const g=id=>($(id).value||'').trim(),n=g('sh_n'),t=g('sh_t'),e=g('sh_e'),m=s=>{$('sh_m').textContent=s};
 const chkReg=$('sh_chk_poli_reg')||$('sh_chk_poli');
 if(chkReg&&!chkReg.checked){
   m('Debe aceptar los Términos y la Política de Privacidad para registrarse.');
   const box=$('sh_reg_poli_box')||$('sh_poli_box');if(box){box.style.borderColor='#ef4444';box.style.background='#fef2f2'}
   chkReg.focus();return
 }
 if(n.length<2)return m('Escriba su nombre.');if(t.replace(/\D/g,'').length<7)return m('Escriba un teléfono válido.');if(!/^\S+@\S+\.\S+$/.test(e))return m('Escriba un correo válido.');{const r=shopAntiBot();if(r!=='ok')return m(shopAntiBotMsg(r))}
 SH.poliOk=true;/* Fase 24: la casilla de políticas del registro es obligatoria y ya está marcada: se conserva la aceptación al volver al pedido */
 const l={id:uid(),name:n,tel:t,email:e,empresa:g('sh_c'),dir:g('sh_d'),ref:SH.ref,ts:Date.now(),imp:false};
 if(!emailjsListo())return shopRegFinish(l);
 $('sh_b').disabled=true;m('Enviando código a su correo…');
 const ok=await shopCodeSend(l);
 if(!ok){$('sh_b').disabled=false;return m('No se pudo enviar el código de verificación. Intente de nuevo.'+(SH.mailErr?' ['+SH.mailErr.trim().slice(0,160)+']':''))}
 shopAskCode()}
// --- Verificación de correo con código de 6 dígitos (EmailJS) ---
// El código se genera y se revisa en el propio navegador (no hay servidor propio detrás de
// este panel), así que alguien con conocimientos técnicos podría leerlo en la memoria del
// navegador y saltarse el paso. Igual sirve muy bien contra lo más común: correos inventados o
// mal escritos por error, y bots simples que no llegan a revisar su bandeja de entrada.
function shopCodeGen(){return String(Math.floor(100000+Math.random()*900000))}
async function shopCodeSend(l){const code=shopCodeGen();
 SH.pendReg={l,code,exp:Date.now()+600000,lastSent:Date.now()};
 try{await emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{to_email:l.email,to_name:l.name,code});return true}
 catch(e){console.error('EmailJS falló:',e);SH.mailErr=String((e&&e.status)||'')+' '+String((e&&(e.text||e.message))||e);SH.pendReg=null;return false}}
function shopAskCode(){const l=(SH.pendReg||{}).l||{};
 shopM(`<div style="text-align:center;padding:6px 0 2px"><h2 style="margin:6px 0 4px">Confirme su correo</h2><p style="color:var(--tx2);margin:0 0 16px;font-size:14.5px;line-height:1.45">Le enviamos un código de 6 dígitos a <b>${esc(l.email||'')}</b>. Escríbalo aquí para enviar su pedido (revise también Spam/Promociones).</p></div><label class="kf"><span>Código de 6 dígitos</span><input id="sh_cod" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" style="letter-spacing:4px;font-size:20px;text-align:center"></label><div class="serr" id="sh_cm"></div><div class="kact2"><button class="sbtn" id="sh_cb" data-h-click="h39">Confirmar y enviar pedido</button><button class="sbtn g" data-h-click="h38" id="sh_crs">Reenviar código</button></div><button class="sbtn g" style="margin-top:8px" data-h-click="h37">← Cambiar datos</button>`,'cod');
 setTimeout(()=>{const i=$('sh_cod');if(i)i.focus()},350)}
async function shopCodeVerify(){const m=s=>{const e=$('sh_cm');if(e)e.textContent=s};const pr=SH.pendReg;
 if(!pr)return m('Esto expiró, vuelva a intentar.');
 if(Date.now()>pr.exp){SH.pendReg=null;return m('El código expiró. Pida uno nuevo con "Reenviar código".')}
 const v=($('sh_cod').value||'').trim();
 if(v!==pr.code)return m('Código incorrecto. Revíselo e intente de nuevo.');
 const b=$('sh_cb');if(b)b.disabled=true;m('Verificando…');
 const l=pr.l;SH.pendReg=null;await shopRegFinish(l)}
async function shopCodeResend(){const pr=SH.pendReg;if(!pr)return;const btn=$('sh_crs');
 if(Date.now()-pr.lastSent<45000){const m=$('sh_cm');if(m)m.textContent='Espere unos segundos antes de pedir otro código.';return}
 if(btn)btn.disabled=true;
 const ok=await shopCodeSend(pr.l);
 const m=$('sh_cm');if(m)m.textContent=ok?'Le enviamos un nuevo código.':'No se pudo reenviar. Intente de nuevo en un momento.';
 if(btn)btn.disabled=false}
async function shopRegFinish(l){const m=s=>{const e=$('sh_m')||$('sh_cm');if(e)e.textContent=s};const b=$('sh_b')||$('sh_cb');if(b)b.disabled=true;m('Registrando…');
 try{await fbCol('tienda_leads').doc(l.id).set(l)}catch(x){if(b)b.disabled=false;return m('No se pudo registrar. Intente de nuevo.')}
 SH.cli=l;try{localStorage.setItem(lsk('tj_shop_cli'),JSON.stringify(l))}catch(x){window._tjw&&_tjw(x)}
 const h=document.querySelector('#shop .khd .kht small');if(h)h.textContent='Hola, '+(l.name.split(' ')[0])+' 👋';
 shopCart();const nt=$('sh_nt');if(nt)nt.value=SH.pendNote||'';
 {const ck=$('sh_chk_poli');if(ck&&SH.poliOk)ck.checked=true;SH.poliOk=false}/* Fase 24: la aceptación dada en el registro no se vuelve a pedir; shopSend sigue exigiendo la casilla marcada */
 shopSend()}

// ---------- Mi cuenta: pedidos del cliente ----------
const OKEY='tj_shop_orders';
function shopOrdLoad(){try{const a=JSON.parse(localStorage.getItem(lsk(OKEY))||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function shopOrdSave(p){const a=shopOrdLoad().filter(x=>x.id!==p.id);a.push(p);try{localStorage.setItem(lsk(OKEY),JSON.stringify(a.slice(-150)))}catch(e){window._tjw&&_tjw(e)}}
function shopOrdMine(){const c=SH.cli;if(!c)return[];const tel=String(c.tel||'').replace(/\D/g,'');return shopOrdLoad().filter(p=>p.cid===c.id||(tel&&String((p.lead||{}).tel||'').replace(/\D/g,'')===tel)).sort((a,b)=>b.ts-a.ts)}
async function shopOrdSync(){const c=SH.cli;if(!c||SH.guest||!fbDb)return;let ch=false;const tel=c.tel||'';
 for(const q of [['cid',c.id],['lead.tel',tel]]){if(!q[1])continue;try{const r=await fbCol('tienda_pedidos').where(q[0],'==',q[1]).get();r.docs.forEach(d=>{const p=sanPed(d.data());if(p&&p.id){const o=shopOrdLoad().find(x=>x.id===p.id);if(!o||o.estado!==p.estado||o.total!==p.total){shopOrdSave(p);ch=true}}})}catch(e){window._tjw&&_tjw(e)}}
 const m=$('shopm');if(ch&&m&&m.dataset.k==='acc')shopAcc(1)}
const shopEst=e=>e==='atendido'?['Atendido','#2bb673']:['Recibido','#E8870A'];
function shopOrdAct(id,modo){const p=shopOrdLoad().find(x=>x.id===id);if(!p)return;if(modo==='img')shopImgVer(p);else shopPdf(p,modo)}

function shopAcc(quiet){const c=SH.cli,L=shopOrdMine(),n=L.length,tot=L.reduce((s,p)=>s+(+p.total||0),0),fd=t=>new Date(t).toLocaleDateString('es-PA',{day:'numeric',month:'short',year:'numeric'}),last=L[0];
 const head=c?`<div class="kacH"><div class="kacA">${esc((c.name||'?').trim().charAt(0).toUpperCase())}</div><div><b>${esc(c.name||'')}</b><small>${esc(c.tel||'')}${c.email?' · '+esc(c.email):''}</small></div></div>`:'';
 if(!c||SH.guest)return shopM(`<h2 style="margin:6px 0 8px">Mi cuenta</h2><p class="kds">${SH.guest?'En la vista previa no hay cuenta de cliente.':'Aún no tiene pedidos. Cuando haga su primer pedido se registrará y aquí verá su historial, cuántas compras ha hecho y sus montos.'}</p><button class="sbtn g" data-h-click="h31">Seguir viendo</button>`,'acc');
 shopM(`<h2 style="margin:6px 0 12px">Mi cuenta</h2>${head}
 <div class="kacS"><div><small>Pedidos realizados</small><b>${n}</b></div><div><small>Total comprado</small><b>${$$(tot)}</b></div><div><small>Promedio por pedido</small><b>${n?$$(tot/n):$$(0)}</b></div><div><small>Último pedido</small><b style="font-size:16px">${last?fd(last.ts):'—'}</b></div></div>
 <h3 class="kpt" style="margin-top:18px">Mis pedidos</h3>
 ${n?L.map(p=>{const e=shopEst(p.estado),num=String(p.id||'').slice(-6).toUpperCase(),q=(p.items||[]).reduce((s,i)=>s+(+i.q||0),0);return `<details class="kord"><summary><div><b>Pedido N° ${num}</b><small>${fd(p.ts)} · ${q} diseño(s)</small></div><div style="text-align:right"><b>${p.total>0?$$(p.total):'Consultar'}</b><span class="kst2" style="background:${e[1]}22;color:${e[1]}">${e[0]}</span></div></summary><div class="kordb">${(p.items||[]).map(i=>`<div class="kodl"><span>${i.q} × ${esc(i.n)}</span><span>${i.p>0?$$(i.q*i.p):'—'}</span></div>`).join('')}${p.nota?`<small style="display:block;margin:6px 0;color:var(--tx2)">Nota: ${esc(p.nota)}</small>`:''}<div class="kodb"><button class="sbtn" data-h-click="h36" data-a-click="${_ha(p.id)}">👁 Ver</button><button class="sbtn g" data-h-click="h35" data-a-click="${_ha(p.id)}">📄 Descargar</button></div></div></details>`}).join(''):'<div class="kempty" style="padding:26px 10px"><span class="e">🧾</span>Todavía no ha hecho pedidos.</div>'}
 <div class="kact2"><button class="sbtn g" data-h-click="h31">Cerrar</button></div>`,'acc');
 if(!quiet)shopOrdSync()}
async function poliChkLimpiar(){
 const b=$('sh_poli_box'),br=$('sh_reg_poli_box'),m1=$('sh_m'),m2=$('sh_m2');
 if(b){b.style.borderColor='var(--linea)';b.style.background='var(--sf)'}
 if(br){br.style.borderColor='var(--linea)';br.style.background='var(--sf)'}
 if(m1&&m1.textContent.includes('Términos'))m1.textContent='';
 if(m2&&m2.textContent.includes('Términos'))m2.textContent='';
}
/* Fase 24: botón OPCIONAL «Enviar también por WhatsApp» tras «¡Pedido enviado!». El pedido ya está guardado en Firestore; esto solo abre un chat de WhatsApp con el resumen
   (número de pedido, artículos con cantidad, total o «a consultar», nombre). Usa el mismo número que #k_wa; sin número configurado no hay botón. Sin teléfono, correo, dirección ni nota. */
function shopPedidoWAurl(p,c){
 const num=contLimpio(typeof SH!=='undefined'?SH.contacto:null).wa;if(!num||!p)return'';
 const lim=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,n),its=(p.items||[]).filter(i=>+i.q>0),sin=its.some(i=>!(+i.p>0)),
  tot=+p.total>0?(sin?'Total parcial: '+$$(+p.total)+' (hay artículos a consultar)':'Total: '+$$(+p.total)):'Total: a consultar',
  ln=its.slice(0,15).map(i=>'• '+(+i.q)+' × '+lim(i.n,80)).concat(its.length>15?['… y '+(its.length-15)+' más']:[]);
 const tx=['Hola, acabo de hacer un pedido en '+lim(nombreNegocio(),60)+'.','Pedido N° '+String(p.id||'').slice(-6).toUpperCase(),...ln,tot,'Nombre: '+lim((c&&c.name)||(p.lead&&p.lead.name),60)].join('\n');
 return'https://wa.me/'+num+'?text='+encodeURIComponent(tx)
}
function shopPedidoWABoton(p,c){
 const u=shopPedidoWAurl(p,c);if(!u)return'';
 return'<a class="sbtn g" id="k_pwa" href="'+u+'" target="_blank" rel="noopener noreferrer" style="margin-bottom:4px;text-decoration:none">💬 Enviar también por WhatsApp</a><small style="display:block;margin:0 0 10px;color:var(--tx2)">Opcional: su pedido ya quedó guardado.</small>'
}
async function shopSend(){const L=shopLines();if(!L.length)return;if(SH.guest){shopToast('Vista previa: los pedidos están desactivados');return}
 const chk=$('sh_chk_poli');
 if(chk&&!chk.checked){
   const em=$('sh_m2');if(em)em.textContent='Debe marcar la casilla aceptando los Términos y la Política de Privacidad para continuar.';
   const box=$('sh_poli_box');if(box){box.style.borderColor='#ef4444';box.style.background='#fef2f2'}
   chk.focus();return
 }
 {const er=shopEnvErr();if(er){const em=$('sh_m2');if(em)em.textContent=er;return}}if(!SH.cli){SH.pendNote=(($('sh_nt')||{}).value||'');SH.poliOk=!!(chk&&chk.checked);return shopAskReg()}{const r=shopAntiBot();if(r!=='ok'){const em=$('sh_m2');if(em)em.textContent=shopAntiBotMsg(r);return}}const b=$('sh_sb');b.disabled=true;b.textContent='Enviando…';try{window.speechSynthesis&&speechSynthesis.speak(new SpeechSynthesisUtterance(''))}catch(e){window._tjw&&_tjw(e)}try{shopMusPrime()}catch(e){window._tjw&&_tjw(e)}const c=SH.cli,id=uid();
const dNow=new Date(),dFmt=fdate(hoy())+' '+dNow.toLocaleTimeString('es-PA',{hour:'2-digit',minute:'2-digit'});
const auditTerminos={ok:true,fecha:dNow.toISOString(),fmt:dFmt,ver:'1.0 - Ley 81 Panamá',ua:(navigator.userAgent||'').slice(0,120)};
const notaBase=($('sh_nt')?$('sh_nt').value:(SH.pendNote||'')).trim();
const notaConEvidencia=(notaBase?notaBase+' · ':'')+'[🛡️ Aceptó Términos y Privacidad Ley 81: '+dFmt+']';
const p={id,cid:c.id,lead:{name:c.name,tel:c.tel,email:c.email,empresa:c.empresa||'',dir:c.dir||'',terminos:auditTerminos},items:L.map(l=>({id:l.id,n:l.n,p:l.p,q:l.q})),total:L.reduce((s,l)=>s+l.q*l.p,0),nota:notaConEvidencia.slice(0,500),ref:SH.ref,ts:Date.now(),estado:'nuevo'};
if(c){c.terminos=auditTerminos;try{localStorage.setItem(lsk('tj_cli_term_'+c.id),JSON.stringify(auditTerminos))}catch(e){}}
 {const fl=shopFleSel();let ed=null;if(fl){ed=shopEnvDatos(fl);p.envio=sanEnv(ed)}
  try{await fbCol('tienda_pedidos').doc(id).set(p)}catch(e){let ok=false;
   if(fl){/* respaldo: si las reglas no admiten el campo envío, el transportista viaja en la nota */delete p.envio;p.nota=fleNotaRespaldo(p.nota,fleNotaTxt(fl,ed));try{await fbCol('tienda_pedidos').doc(id).set(p);ok=true}catch(e2){window._tjw&&_tjw(e2)}}
   if(!ok){b.disabled=false;b.textContent='Enviar pedido';$('sh_m2').textContent='No se pudo enviar. Intente de nuevo.';return}}}
 SH.last=p;SH.pendNote='';SH.poliOk=false;shopOrdSave(p);try{shopConfetti()}catch(e){window._tjw&&_tjw(e)}{const h=new Date().getHours(),sal=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches',nm=(c.name||'').split(' ')[0];shopVoz(sal+', '+nm+'. Su pedido ha sido recibido con éxito. Agradecemos sinceramente su confianza en '+nombreNegocio()+'. Un asesor se comunicará con usted muy pronto para confirmar los detalles y la forma de pago. Que tenga un excelente día.'+(document.documentElement.classList.contains('xmas')?' Le deseamos una feliz Navidad y un próspero Año Nuevo.':(document.documentElement.classList.contains('summer')?' Le deseamos un verano increíble.':'')));if(document.documentElement.classList.contains('xmas'))shopMusica();if(document.documentElement.classList.contains('panama'))shopPatrio(1)}SH.cart={};try{localStorage.removeItem(lsk('tj_shop_cart'))}catch(e){window._tjw&&_tjw(e)}document.querySelectorAll('.kact').forEach(e=>e.innerHTML=shopBtn(e.dataset.a));shopNav();
 shopM('<div style="text-align:center;padding:10px 0"><div style="font-size:54px">✅</div><h2 style="margin:6px 0">¡Pedido enviado!</h2><p style="color:var(--tx2);margin:0 0 16px">Gracias, '+esc((c.name||'').split(' ')[0])+'. Nos pondremos en contacto con usted muy pronto para confirmar su pedido.</p>'+(document.documentElement.classList.contains('xmas')?'<div class="kxg">🎄 ¡Le deseamos una <b>feliz Navidad</b> y un <b>próspero Año Nuevo</b>! 🎁</div>':(document.documentElement.classList.contains('summer')?'<div class="kxg ksm">☀️ ¡Que disfrute un <b>verano increíble</b>! 🌴</div>':(document.documentElement.classList.contains('panama')?'<div class="kxg kpa2"><span class="kfl"></span> ¡<b>Viva Panamá</b>! Que disfrute un <b>feliz mes patrio</b></div>':'')))+'<button class="sbtn" data-h-click="h34" style="margin-bottom:8px">👁 Ver comprobante</button><button class="sbtn g" data-h-click="h33" style="margin-bottom:8px">📄 Descargar PDF</button><button class="sbtn g" data-h-click="h32" style="margin-bottom:8px">🧾 Mis pedidos</button>'+shopPedidoWABoton(p,c)+'<button class="sbtn g" data-h-click="h31">Seguir viendo el catálogo</button></div>','ok');}
function shopFab(){const e=$('k_fab');if(!e)return;const L=shopLines(),n=L.reduce((a,l)=>a+l.q,0),t=L.reduce((a,l)=>a+l.q*l.p,0);e.innerHTML=n?`<button class="kfab" data-h-click="h30">${kico(KI.cart,22)}<span>Ver pedido · ${n}${t>0?' · '+$$(t):''}</span></button>`:''}
const _kn=shopNav;shopNav=function(){_kn.apply(this,arguments);try{shopFab()}catch(e){window._tjw&&_tjw(e)}};
function shopShare(id){const i=SH.items.find(x=>x.id===id);if(!i)return;const u=tdLink()+'&p='+encodeURIComponent(id),t=(i.name||'Producto')+' — '+nombreNegocio();
 if(navigator.share)navigator.share({title:t,text:t,url:u}).catch(()=>{});else{try{navigator.clipboard.writeText(u);shopToast('Enlace copiado ✔')}catch(e){prompt('Copie el enlace:',u)}}}
function shopConfetti(){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const c=document.createElement('canvas');c.id='k_conf';c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999';c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);
 const g=c.getContext('2d'),K=['#E0457B','#FF9F0A','#2fa84f','#0A84FF','#AF52DE','#FFD60A'],P=Array.from({length:110},()=>({x:innerWidth/2,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*13-3,w:6+Math.random()*6,h:4+Math.random()*5,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:K[Math.random()*6|0]}));let n=0;
 (function f(){g.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.c;g.fillRect(-p.w/2,-p.h/2,p.w,p.h);g.restore()});if(++n<150)requestAnimationFrame(f);else c.remove()})()}
const BDL={best:'Más vendido',model:'Modelo nuevo',new:'Recién llegado'},BDO=['best','model','new'];
const bdgList=i=>BDO.filter(k=>Array.isArray(i.badges)&&i.badges.includes(k));
const bdgTags=(i,inl)=>{const L=bdgList(i);return L.length?`<div class="${inl?'krbi':'krbs'}">${L.map(k=>`<span class="krb">${BDL[k]}</span>`).join('')}</div>`:''};
function shopDest(){const e=$('k_dest');if(!e)return;const L=SH.items.filter(i=>i&&i.img&&!noDisp(i)&&bdgList(i).length).sort((a,b)=>BDO.indexOf(bdgList(a)[0])-BDO.indexOf(bdgList(b)[0])).slice(0,12),key=L.map(i=>i.id+(i.badges||[]).join('')+i.price).join('|');
 if(!L.length){e.hidden=true;e.innerHTML='';e._k='';return}if(e._k===key)return;e._k=key;e.hidden=false;
 e.innerHTML=`<h3>Destacados de la semana</h3><div class="kdr">${L.map(i=>`<article class="kdc" data-h-click="h29" data-a-click="${_ha(i.id)}">${bdgTags(i)}<div class="ki"><img src="${i.img}" alt="${esc(i.name)}" loading="lazy"><button class="kfav ${SH.fav[i.id]?'on':''}" data-f="${i.id}" data-h-click="h28" data-a-click="${_ha(i.id)}" aria-label="Favorito">${kico(SH.fav[i.id]?KI.heart:KI.heartO,18)}</button></div><div class="kb"><b>${esc(i.name)}</b><div class="kdc-foot"><span class="kpr">${+i.price>0?tdMoney(i.price):'Consultar'}</span>${noDisp(i)?`<span class="kno">${stkLbl[i.stock]}</span>`:`<button class="kdc-buy" data-h-click="h27" data-a-click="${_ha(i.id)}">${kico(KI.plus,15)}<span>Comprar</span></button>`}</div></div></article>`).join('')}</div>`;shopDestAuto()}
function shopMusPrime(){const _c=document.documentElement.classList;if(!_c.contains('xmas')&&!_c.contains('panama'))return;try{SH.ac=SH.ac||new (window.AudioContext||window.webkitAudioContext)();SH.ac.resume()}catch(e){window._tjw&&_tjw(e)}}
function shopMusica(){const ac=SH.ac;if(!ac)return;try{ac.resume();const N={C:261.63,D:293.66,E:329.63,F:349.23,G:392},S=[['E',1],['E',1],['E',2],['E',1],['E',1],['E',2],['E',1],['G',1],['C',1.5],['D',.5],['E',4],['F',1],['F',1],['F',1.5],['F',.5],['F',1],['E',1],['E',1],['E',.5],['E',.5],['E',1],['D',1],['D',1],['E',1],['D',2],['G',2]],b=.27;let t=ac.currentTime+.05;
 S.forEach(([n,d])=>{const f=N[n],g=ac.createGain(),g2=ac.createGain(),o=ac.createOscillator(),o2=ac.createOscillator(),L=d*b;o.type='sine';o2.type='triangle';o.frequency.value=f*2;o2.frequency.value=f*4;g2.gain.value=.25;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(ac.destination);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.11,t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+L+.35);o.start(t);o2.start(t);o.stop(t+L+.4);o2.stop(t+L+.4);t+=L})}catch(e){window._tjw&&_tjw(e)}}

const PATRIO_TXT='Gracias por celebrar con nosotros el mes de la patria. En {NEGOCIO} honramos a Panamá: a su gente, a su bandera y a su historia. Recordamos el tres de noviembre, la separación de Panamá de Colombia; el cuatro, día de la bandera; y el veintiocho, la independencia de España. Que este mes patrio nos una el amor por nuestra tierra. ¡Viva Panamá! ¡Viva la patria!';
function shopPatrioSnd(){let ac=SH.ac;try{ac=SH.ac=ac||new (window.AudioContext||window.webkitAudioContext)();ac.resume()}catch(e){return}
 const M=ac.createGain();M.gain.value=.4;M.connect(ac.destination);const T=ac.currentTime+.08,nb=ac.createBuffer(1,ac.sampleRate>>1,ac.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 const tone=(f,t,d,ty,v,lp)=>{const g=ac.createGain(),F=ac.createBiquadFilter();F.type='lowpass';F.frequency.value=lp;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.03);g.gain.setValueAtTime(v,t+d*.75);g.gain.linearRampToValueAtTime(0,t+d);F.connect(g);g.connect(M);[-6,6].forEach(c=>{const o=ac.createOscillator();o.type=ty;o.frequency.value=f;o.detune.value=c;o.connect(F);o.start(t);o.stop(t+d+.05)})};
 const drum=(t,f,v)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(f*1.9,t);o.frequency.exponentialRampToValueAtTime(f,t+.08);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(g);g.connect(M);o.start(t);o.stop(t+.27);hit(t,3200,v*.5,.04)};
 const hit=(t,fq,v,d)=>{const s=ac.createBufferSource(),F=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;F.type='bandpass';F.frequency.value=fq;F.Q.value=.9;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(F);F.connect(g);g.connect(M);s.start(t);s.stop(t+d+.02)};
 /* Diana de trompetas */
 const b=.27;[[392,0,.5],[392,.5,.5],[523.25,1,.5],[659.25,1.5,.5],[783.99,2,2.5],[659.25,4.75,.5],[783.99,5.25,3]].forEach(([f,s,l])=>{tone(f,T+s*b,l*b,'sawtooth',.1,1700);tone(f/2,T+s*b,l*b,'sawtooth',.05,900)});
 hit(T,5000,.12,.35);
 /* Tamborito: caja, repique y palmas en compás de 6/8 */
 const e=.19,T1=T+2.3;
 for(let bar=0;bar<4;bar++){const t0=T1+bar*6*e;drum(t0,95,.55);drum(t0+3*e,95,.5);drum(t0+2*e,210,.28);drum(t0+5*e,210,.28);hit(t0+e,2200,.3,.06);hit(t0+4*e,2200,.3,.06);if(bar===3){drum(t0+5.5*e,210,.25)}}
 /* Melodía típica (acordeón) */
 const P=[[659.25,1],[659.25,1],[783.99,1],[659.25,1],[587.33,1],[523.25,1],[587.33,1],[587.33,1],[698.46,1],[587.33,1],[523.25,1],[493.88,1],[523.25,1],[659.25,1],[783.99,1],[1046.5,2],[783.99,1],[783.99,2],[659.25,2],[523.25,2]];
 let s=0;P.forEach(([f,l])=>{tone(f,T1+s*e,l*e*.95,'sawtooth',.06,2600);s+=l});
 const tf=T1+24*e;[523.25,659.25,783.99].forEach(f=>tone(f,tf,.9,'sawtooth',.07,2200));drum(tf,95,.6);hit(tf,2200,.35,.1);
}
function shopPatrioVoz(q){const ss=window.speechSynthesis;if(!ss)return;const go=()=>{try{if(!q)ss.cancel();const u=new SpeechSynthesisUtterance(PATRIO_TXT.replace('{NEGOCIO}',nombreNegocio())),v=typeof vozEs==='function'?vozEs():null;if(v){u.voice=v;u.lang=v.lang}else u.lang='es-PA';u.rate=.95;u.pitch=1.05;u.volume=1;ss.speak(u)}catch(e){window._tjw&&_tjw(e)}};
 if(ss.getVoices().length)go();else{let d=0;const h=()=>{if(d++)return;go()};ss.onvoiceschanged=h;setTimeout(h,600)}}
function shopPatrio(q){try{shopPatrioSnd()}catch(e){window._tjw&&_tjw(e)}shopPatrioVoz(q)}
function shopSummer(){const H=document.documentElement,on=H.classList.contains('summer'),ids=['k_sw','k_sun','k_bub','k_sb','k_gs'];
 if(!on||!$('shop')){ids.forEach(i=>{const e=$(i);if(e)e.remove()});return}
 if(!$('k_sw')){const w=document.createElement('div');w.id='k_sw';document.body.appendChild(w)}
 if(!$('k_sun')){const w=document.createElement('div');w.id='k_sun';w.textContent='☀️';document.body.appendChild(w)}
 if(!$('k_sb')&&$('khero')){const b=document.createElement('div');b.id='k_sb';b.className='kxb ksm';b.innerHTML='☀️ <b>¡Súper verano!</b> Tarjetas frescas para celebrar 🌴';$('khero').after(b)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!$('k_gs')){const g=document.createElement('div');g.id='k_gs';g.className='kgd ksm';g.innerHTML='<div class="kcane"></div><div class="kgdr">🌴 🍉 🕶️ 🍹 🐚 🏖️ 🌊 ☀️ 🍍 🩴 🌴 🍉 🕶️ 🍹 🌊</div>';mt.before(g)}
 if(!$('k_bub')&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const c=document.createElement('canvas');c.id='k_bub';document.body.appendChild(c);const g=c.getContext('2d');let W=0,Hh=0;const rs=()=>{W=c.width=innerWidth;Hh=c.height=innerHeight};rs();addEventListener('resize',rs);
  const F=Array.from({length:26},()=>({x:Math.random(),y:Math.random(),r:4+Math.random()*10,v:.5+Math.random()*1,a:Math.random()*6}));
  (function f(){if(!$('k_bub'))return;g.clearRect(0,0,W,Hh);F.forEach(p=>{p.y-=p.v/Hh*2.4;p.a+=.02;p.x+=Math.sin(p.a)*.0007;if(p.y<-.03){p.y=1.03;p.x=Math.random()}const x=p.x*W,y=p.y*Hh;g.beginPath();g.arc(x,y,p.r,0,6.3);g.fillStyle='rgba(25,195,230,.10)';g.fill();g.lineWidth=1.5;g.strokeStyle='rgba(25,195,230,.55)';g.stroke();g.beginPath();g.arc(x-p.r*.3,y-p.r*.3,p.r*.25,0,6.3);g.fillStyle='rgba(255,255,255,.8)';g.fill()});requestAnimationFrame(f)})()}}
function shopXmas(){const on=document.documentElement.classList.contains('xmas');let l=$('k_xl'),c=$('k_snow'),b=$('k_xb');
 if(!on||!$('shop')){[l,c,b,$('k_gd'),$('k_rd')].forEach(x=>x&&x.remove());return}
 if(!l){l=document.createElement('div');l.id='k_xl';document.body.appendChild(l)}
 if(l._w!==innerWidth){l._w=innerWidth;l.innerHTML='';const C=['#ff3b30','#34c759','#ffd60a','#0a84ff','#ff9f0a','#bf5af2'],n=Math.ceil(innerWidth/26);for(let i=0;i<n;i++){const u=document.createElement('i');u.style.cssText='left:'+(i*26+6)+'px;top:'+Math.round(6+Math.abs(Math.sin(i/2.2))*7)+'px;--c:'+C[i%C.length]+';animation-delay:'+((i%7)*.22)+'s';l.appendChild(u)}}
 if(!$('k_rd')){const r=document.createElement('div');r.id='k_rd';r.innerHTML='<span>🦌🦌🛷</span>';document.body.appendChild(r)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!$('k_gd')){const g=document.createElement('div');g.id='k_gd';g.className='kgd';g.innerHTML='<div class="kcane"></div><div class="kgdr">🎄 🦌 ❄️ 🎁 ⭐ 🔔 🦌 🎄 ❄️ 🎅 ⛄ 🎁 🦌 ⭐ 🎄</div>';mt.before(g)}
 if(!b&&$('khero')){b=document.createElement('div');b.id='k_xb';b.className='kxb';b.innerHTML='🎄 <b>¡Feliz Navidad!</b> Regala una tarjeta hecha con amor 🎁';$('khero').after(b)}
 if(!c&&!matchMedia('(prefers-reduced-motion:reduce)').matches){c=document.createElement('canvas');c.id='k_snow';document.body.appendChild(c);const g=c.getContext('2d');let W=0,H=0;const F=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),r:1.5+Math.random()*3,v:.4+Math.random()*1.1,a:Math.random()*6}));
  const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();addEventListener('resize',rs);
  (function f(){if(!document.getElementById('k_snow'))return;g.clearRect(0,0,W,H);g.fillStyle='rgba(150,185,225,.85)';F.forEach(p=>{p.y+=p.v/H*3.2;p.a+=.02;p.x+=Math.sin(p.a)*.0006;if(p.y>1.02){p.y=-.02;p.x=Math.random()}g.beginPath();g.arc(p.x*W,p.y*H,p.r,0,6.3);g.fill()});requestAnimationFrame(f)})()}}
function shopPanama(){const on=document.documentElement.classList.contains('panama'),ids=['k_pg','k_pab','k_pgs','k_pcf'];
 if(!on||!$('shop')){ids.forEach(i=>{const e=$(i);if(e)e.remove()});return}
 if(!$('k_pg')){const w=document.createElement('div');w.id='k_pg';document.body.appendChild(w)}
 if(!$('k_pab')&&$('khero')){const b=document.createElement('div');b.id='k_pab';b.className='kxb kpa';b.innerHTML='<span class="kfl"></span><b>¡Viva Panamá!</b> Noviembre, mes patrio: tarjetas y detalles para celebrar a la patria <button type="button" data-h-click="h26" aria-label="Escuchar saludo patrio" style="margin-left:8px;padding:4px 12px;border-radius:99px;border:1px solid rgba(255,255,255,.7);background:rgba(255,255,255,.18);color:#fff;font:inherit;font-weight:700;font-size:12.5px;cursor:pointer">🔊 Escuchar</button>';$('khero').after(b)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!$('k_pgs')){const g=document.createElement('div');g.id='k_pgs';g.className='kgd kpa';g.innerHTML='<div class="kcane"></div><div class="kgdr">'+'<i>★</i>'.repeat(15)+'</div>';mt.before(g)}
 if(!$('k_pcf')&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const c=document.createElement('canvas');c.id='k_pcf';document.body.appendChild(c);const g=c.getContext('2d');let W=0,Hh=0;const rs=()=>{W=c.width=innerWidth;Hh=c.height=innerHeight};rs();addEventListener('resize',rs);
  const col=['#D21034','#005293','#ffffff'],F=Array.from({length:46},()=>({x:Math.random(),y:Math.random(),s:4+Math.random()*6,v:.35+Math.random()*.9,a:Math.random()*6,w:Math.random()*.05+.01,k:Math.random()<.4?1:0,c:col[(Math.random()*3)|0]}));
  const star=(x,y,R)=>{g.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?R*.42:R;g.lineTo(x+r*Math.cos(a),y+r*Math.sin(a))}g.closePath()};
  (function f(){if(!$('k_pcf'))return;g.clearRect(0,0,W,Hh);F.forEach(p=>{p.y+=p.v/Hh*3;p.a+=p.w;p.x+=Math.sin(p.a)*.0008;if(p.y>1.03){p.y=-.03;p.x=Math.random()}const x=p.x*W,y=p.y*Hh;g.save();g.translate(x,y);g.rotate(p.a);g.translate(-x,-y);g.fillStyle=p.c;g.strokeStyle='rgba(120,135,160,.55)';g.lineWidth=p.c==='#ffffff'?1:0;if(p.k){star(x,y,p.s);g.fill();if(p.c==='#ffffff')g.stroke()}else{g.fillRect(x-p.s/2,y-p.s/3,p.s,p.s*.66);if(p.c==='#ffffff')g.strokeRect(x-p.s/2,y-p.s/3,p.s,p.s*.66)}g.restore()});requestAnimationFrame(f)})()}}
function shopMadres(){const on=document.documentElement.classList.contains('madres');let b=$('k_mb'),g=$('k_mg'),c=$('k_petals');
 if(!on||!$('shop')){[b,g,c].forEach(x=>x&&x.remove());return}
 if(!b&&$('khero')){b=document.createElement('div');b.id='k_mb';b.className='kxb kmad';b.innerHTML='🌸 <b>¡Feliz Día de la Madre!</b> Celebra a mamá con una tarjeta que atesorará siempre 💖';$('khero').after(b)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!g){g=document.createElement('div');g.id='k_mg';g.className='kgd kmad';g.innerHTML='<div class="kcane"></div><div class="kgdr">🌸 🌺 💐 🌷 🌹 🌸 🌺 💐 🌷 🌹 🌸 🌺 💐</div>';mt.before(g)}
 if(!c&&!matchMedia('(prefers-reduced-motion:reduce)').matches){c=document.createElement('canvas');c.id='k_petals';document.body.appendChild(c);const ctx=c.getContext('2d');let W=0,H=0;const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();addEventListener('resize',rs);
  const P=Array.from({length:36},()=>({x:Math.random(),y:Math.random(),r:3+Math.random()*6,v:.4+Math.random()*.8,a:Math.random()*6,c:Math.random()<.5?'#f472b6':'#fb7185'}));
  (function f(){if(!$('k_petals'))return;ctx.clearRect(0,0,W,H);P.forEach(p=>{p.y+=p.v/H*2.6;p.a+=.02;p.x+=Math.sin(p.a)*.0007;if(p.y>1.02){p.y=-.02;p.x=Math.random()}ctx.save();ctx.translate(p.x*W,p.y*H);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.globalAlpha=.45;ctx.beginPath();ctx.ellipse(0,0,p.r*1.5,p.r,0,0,6.28);ctx.fill();ctx.restore()});requestAnimationFrame(f)})()}}
function shopPadres(){const on=document.documentElement.classList.contains('padres');let b=$('k_pb'),g=$('k_pg2');
 if(!on||!$('shop')){[b,g].forEach(x=>x&&x.remove());return}
 if(!b&&$('khero')){b=document.createElement('div');b.id='k_pb';b.className='kxb kpad';b.innerHTML='👔 <b>¡Feliz Día del Padre!</b> El mejor homenaje y detalle para el rey del hogar 🏆';$('khero').after(b)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!g){g=document.createElement('div');g.id='k_pg2';g.className='kgd kpad';g.innerHTML='<div class="kcane"></div><div class="kgdr">👔 🎩 ⌚ 👞 🌟 🏆 👔 🎩 ⌚ 👞 🌟 🏆</div>';mt.before(g)}}
function shopTrabajador(){const on=document.documentElement.classList.contains('trabajador');let b=$('k_tb'),g=$('k_tg');
 if(!on||!$('shop')){[b,g].forEach(x=>x&&x.remove());return}
 if(!b&&$('khero')){b=document.createElement('div');b.id='k_tb';b.className='kxb ktra';b.innerHTML='👷 <b>¡Feliz Día del Trabajador!</b> Homenajeando el esfuerzo y dedicación de todos 💼';$('khero').after(b)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!g){g=document.createElement('div');g.id='k_tg';g.className='kgd ktra';g.innerHTML='<div class="kcane"></div><div class="kgdr">⚙️ 🛠️ 🏗️ 💼 🎖️ 🌾 ⚙️ 🛠️ 🏗️ 💼 🎖️</div>';mt.before(g)}}
function shopGalaxia(){const on=document.documentElement.classList.contains('galaxia');let b=$('k_gb'),g=$('k_gg'),c=$('k_stars');
 if(!on||!$('shop')){[b,g,c].forEach(x=>x&&x.remove());return}
 if(!b&&$('khero')){b=document.createElement('div');b.id='k_gb';b.className='kxb kgal';b.innerHTML='🌌 <b>¡Colección Galaxia Cósmica!</b> Diseños de otro mundo que brillan con luz propia 🚀';$('khero').after(b)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!g){g=document.createElement('div');g.id='k_gg';g.className='kgd kgal';g.innerHTML='<div class="kcane"></div><div class="kgdr">✨ 🌌 🪐 🚀 🛸 🌠 ⭐ 🌙 ✨ 🌌 🪐 🚀</div>';mt.before(g)}
 if(!c&&!matchMedia('(prefers-reduced-motion:reduce)').matches){c=document.createElement('canvas');c.id='k_stars';document.body.appendChild(c);const ctx=c.getContext('2d');let W=0,H=0;const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();addEventListener('resize',rs);
  const S=Array.from({length:55},()=>({x:Math.random(),y:Math.random(),r:.8+Math.random()*1.8,p:Math.random()*6,c:Math.random()<.4?'#c084fc':'#ffffff'}));
  (function f(){if(!$('k_stars'))return;ctx.clearRect(0,0,W,H);S.forEach(s=>{s.p+=.03;const a=.25+Math.abs(Math.sin(s.p))*.75;ctx.fillStyle=s.c;ctx.globalAlpha=a;ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,6.28);ctx.fill()});requestAnimationFrame(f)})()}}
function shopAmor(){const on=document.documentElement.classList.contains('amor');let b=$('k_ab'),g=$('k_ag'),c=$('k_hearts');
 if(!on||!$('shop')){[b,g,c].forEach(x=>x&&x.remove());return}
 if(!b&&$('khero')){b=document.createElement('div');b.id='k_ab';b.className='kxb kamo';b.innerHTML='💖 <b>¡Día del Amor y la Amistad!</b> Expresa lo que sientes con una tarjeta inolvidable 💌';$('khero').after(b)}
 const mt=document.querySelector('#shop .kmeta');if(mt&&!g){g=document.createElement('div');g.id='k_ag';g.className='kgd kamo';g.innerHTML='<div class="kcane"></div><div class="kgdr">❤️ 💖 💕 💘 💝 🌹 🍫 💌 ❤️ 💖 💕 💘</div>';mt.before(g)}
 if(!c&&!matchMedia('(prefers-reduced-motion:reduce)').matches){c=document.createElement('canvas');c.id='k_hearts';document.body.appendChild(c);const ctx=c.getContext('2d');let W=0,H=0;const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();addEventListener('resize',rs);
  const Ht=Array.from({length:32},()=>({x:Math.random(),y:Math.random(),r:3+Math.random()*6,v:.3+Math.random()*.8,a:Math.random()*6,c:Math.random()<.5?'#e11d48':'#fb7185'}));
  (function f(){if(!$('k_hearts'))return;ctx.clearRect(0,0,W,H);Ht.forEach(p=>{p.y-=p.v/H*2.2;p.a+=.02;p.x+=Math.sin(p.a)*.0006;if(p.y<-.02){p.y=1.02;p.x=Math.random()}ctx.save();ctx.translate(p.x*W,p.y*H);ctx.rotate(Math.sin(p.a)*.2);ctx.fillStyle=p.c;ctx.globalAlpha=.5;ctx.font=(p.r*2.2)+'px sans-serif';ctx.fillText('❤️',0,0);ctx.restore()});requestAnimationFrame(f)})()}}
function shopEnh(){
const sh=$('shop');if(!sh)return;try{shopDest();shopXmas();shopSummer();shopPanama();shopMadres();shopPadres();shopTrabajador();shopGalaxia();shopAmor()}catch(e){window._tjw&&_tjw(e)}
 if(!$('k_top')){const b=document.createElement('button');b.id='k_top';b.setAttribute('aria-label','Subir al inicio');b.textContent='↑';b.onclick=()=>[sh,document.scrollingElement].forEach(el=>el&&el.scrollTo&&el.scrollTo({top:0,behavior:'smooth'}));sh.appendChild(b)}
 if(SH.deep&&SH.items&&SH.items.find(x=>x.id===SH.deep)){const d=SH.deep;SH.deep=null;setTimeout(()=>{try{shopDet(d)}catch(e){window._tjw&&_tjw(e)}},300)}}
const _sf0=shopFab;shopFab=function(){_sf0();const e=$('k_fab'),n=shopLines().reduce((a,l)=>a+l.q,0);if(n!==SH._fn){const had=SH._fn!==undefined;SH._fn=n;const b=e&&e.firstElementChild;if(b&&had){b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}}};
const _kn2=shopNav;shopNav=function(){_kn2.apply(this,arguments);try{shopEnh()}catch(e){window._tjw&&_tjw(e)}};
if(document.documentElement.classList.contains('shopmode')){
 addEventListener('scroll',e=>{const t=$('k_top');if(!t)return;const el=e.target===document?document.scrollingElement:e.target;if(el&&el.scrollTop!==undefined)t.classList.toggle('on',el.scrollTop>500)},true);
 addEventListener('offline',()=>shopToast('Sin conexión: algunos datos pueden no actualizarse'));addEventListener('online',()=>shopToast('Conexión restablecida ✔'));
 document.addEventListener('pointerdown',e=>{const t=e.target.closest&&e.target.closest('#shop .kadd,#shop .kchip,#shop .kfab,#shopm .sbtn,#shopm .kshare');if(!t)return;
  if(t.matches('.kadd,.sbtn,.kfab')&&navigator.vibrate)try{navigator.vibrate(10)}catch(x){window._tjw&&_tjw(x)}
  if(getComputedStyle(t).position==='static')t.style.position='relative';t.style.overflow='hidden';
  const r=t.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('span');s.className='krip';s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';t.appendChild(s);setTimeout(()=>s.remove(),650)},{passive:true});
 (()=>{let y0=null,sh=null,dy=0;
  document.addEventListener('touchstart',e=>{const s=e.target.closest&&e.target.closest('#shopm .ksheet');y0=null;if(!s||s.scrollTop>0)return;let el=e.target;while(el&&el!==s){if(el.scrollTop>0)return;el=el.parentElement}sh=s;y0=e.touches[0].clientY;dy=0},{passive:true});
  document.addEventListener('touchmove',e=>{if(y0===null)return;dy=e.touches[0].clientY-y0;if(dy>0){sh.style.transition='none';sh.style.transform='translateY('+dy+'px)'}},{passive:true});
  document.addEventListener('touchend',()=>{if(y0===null)return;const s=sh;s.style.transition='transform .22s';if(dy>120){s.style.transform='translateY(100%)';setTimeout(()=>{try{shopClose()}catch(e){window._tjw&&_tjw(e)}s.style.transform='';s.style.transition=''},200)}else{s.style.transform='';setTimeout(()=>{s.style.transition=''},250)}y0=null})})()}
NAVI.tienda=['M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 4c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2zm2-6c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm4 6c0 .55-.45 1-1 1s-1-.45-1-1V8h2v2z','#06b6d4','#0e7490'];
NAVI.mapa=['M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z','#10b981','#047857'];
const _mr=mergeRemote;mergeRemote=function(r){_mr(r);authRefresh()};
/* Nombre comercial real de la empresa activa (empresas.js lo resuelve; aquí cae
   a cfg.nombre y por último al histórico). Usar en login, tienda, políticas... */
function nombreNegocio(){
 /* En la tienda pública (sin sesión) manda el nombre de la empresa guardado en
	    su plantilla (__cfg.empresaNombre, que escriben Datos de la empresa y el
	    demo de empresas nuevas). */
 try{if(typeof SHOP!=='undefined'&&SHOP&&typeof SH!=='undefined'&&(SH.empresaNombre||SH.heroTitle))return SH.empresaNombre||SH.heroTitle}catch(e){}
 try{if(typeof empNombreActiva==='function'){var n=empNombreActiva();if(n)return n}}catch(e){}
 /* Empresa inicial: sus textos de siempre. Cualquier otra NO hereda «Tarjetería Jhon» (valor por defecto de DB.cfg):
    en la tienda pública solo vale lo publicado por la empresa (los datos locales de DB son de quien administra, no del visitante). */
 var ini=true;try{ini=TJEmpresa.empEsInicial()}catch(e){}
 var c=(typeof DB!=='undefined'&&DB.cfg)||{},shop=typeof SHOP!=='undefined'&&SHOP;
 if(ini)return c.nombre||'Tarjetería Jhon';
 if(!shop&&c.nombre&&c.nombre!=='Tarjetería Jhon')return c.nombre;
 return shop?'Nuestra tienda':'Mi empresa';
}
/* Eslogan por defecto de la portada: solo la empresa inicial conserva el de Tarjetería; las demás, ninguno. */
function heroSubDef(){try{return TJEmpresa.empEsInicial()?'Cada momento merece una tarjeta especial · Tarjetas para toda ocasión':''}catch(e){return ''}}
/* Parámetro de empresa para los enlaces de la tienda: sin él, un cliente abriría la tienda de la empresa inicial. */
function tdEmpQ(){try{return TJEmpresa.empEsInicial()?'':'&emp='+encodeURIComponent(TJEmpresa.empActiva())}catch(e){return ''}}
/* Logo del inicio de sesión: foto, GIF animado o video corto por empresa.
   Se guarda en cfg (sincroniza) Y en este navegador (tj_lg): la pantalla de
   entrada aparece ANTES de cargar la configuración de la nube, así que sin la
   copia local el logo "desaparecería" al recargar. */
function loginIdentLocal(){try{return JSON.parse(localStorage.getItem(lsk('tj_lg'))||'null')||{}}catch(e){return{}}}
function loginIdentGuardarLocal(o){
 var n=Object.assign(loginIdentLocal(),o,{ts:Date.now()});
 try{localStorage.setItem(lsk('tj_lg'),JSON.stringify(n))}catch(e){window._tjw&&window._tjw(e)}
 return n;
}
/* Tras sincronizar con la nube: si la cfg trae algo más nuevo, se copia al local. */
function loginIdentPull(){
 try{
  var c=DB.cfg||{},loc=loginIdentLocal();
  if(c.loginTs&&+c.loginTs>+(loc.ts||0)){
   loginIdentGuardarLocal({src:c.loginLogoSrc||'',kind:c.loginLogoKind||'',titulo:c.loginTitulo||'',desc:c.loginDesc||'',ts:c.loginTs});
   if(!SES)authLogin();
  }
 }catch(e){}
}
function loginLogoHTML(){
 const L=loginIdentLocal(),c=(typeof DB!=='undefined'&&DB.cfg)||{};
 const src=L.src||c.loginLogoSrc||c.logoFac||'';
 const esVid=(L.kind||c.loginLogoKind)==='video';
 if(!src)return '';
 if(esVid)return '<div class="alogo"><video src="'+esc(src)+'" autoplay muted loop playsinline style="max-height:120px;border-radius:16px"></video></div>';
 return '<div class="alogo"><img src="'+esc(src)+'" alt="'+esc(nombreNegocio())+'"></div>';
}
function authUI(h){let o=$('auth');if(!o){o=document.createElement('div');o.id='auth';o.dataset.r='a';o.innerHTML='<div class="abg"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div><div id="authc"></div>';document.body.appendChild(o)}const lg=document.querySelector('.logo img');const lgo0=loginLogoHTML()||(lg?'<div class="alogo"><img src="'+lg.src+'" alt="'+esc(nombreNegocio())+'"></div>':'');const vc=window.TJMarca&&TJMarca.panel;const lgo=vc?TJMarca.loginHTML(loginLogoHTML()):lgo0;$('authc').innerHTML='<div class="authb">'+lgo+h+'<div class="afoot">'+(vc?TJMarca.pie():'🔒 Acceso restringido · Panel de Facturación')+'</div></div>';o.style.display='flex'}
function authOff(){const o=$('auth');if(o)o.style.display='none'}
const authMsg=t=>{const e=$('au_m');if(e)e.textContent=t};
function topUser(){let c=$('uchip');if(!c){c=document.createElement('div');c.id='uchip';c.style.cssText='display:flex;align-items:center;gap:8px;font-size:12.5px';document.querySelector('.top').appendChild(c)}
 const u=usr();c.innerHTML=`<button class="uav" data-h-click="h25" title="Mi perfil">${avHTML(chatMe(),44)}<span>${esc(esAdmin()?'Administrador':u?u.n:'')}</span></button><button class="btn s" data-h-click="h19">Salir</button>`;
 document.body.classList.toggle('vnd',esVend());const sf=document.querySelector('.sf');if(sf)sf.style.display=esAdmin()?'':'none'}
let _note=(function(){try{const n=localStorage.getItem('tj_sesion_note');if(n)localStorage.removeItem('tj_sesion_note');return n||''}catch(e){return ''}})();
function authInit(){
 authUI('<p style="margin:0;text-align:center">☁ Conectando…</p>');
 if(!window.firebase||!firebase.auth)return authUI('<h2>Sin conexión</h2><p>Se necesita internet para iniciar sesión.</p><button class="btn p" data-h-click="h24">Reintentar</button>');
 if(!fbDb)try{iniciarFirebase()}catch(e){_fbInitError=(e&&e.message)||'error'}
 if(!fbDb)return authUI('<h2>Sin conexión</h2><p>No se pudo iniciar Firestore ['+esc(_fbInitError||'error')+']. Actualice la página e intente nuevamente.</p><button class="btn p" data-h-click="h24">Reintentar</button>');
 firebase.auth().onAuthStateChanged(async u=>{
  if(!u){SES=null;authLogin();return}
  // El administrador no debe quedar bloqueado esperando una lectura de rol que ya
  // está respaldada por las reglas mediante su UID autenticado.
  if(u.uid===ADMIN_UID){SES={id:'admin',u:{rol:'admin',n:'John Guevara'}};try{entrar()}catch(e){window._tjw&&_tjw(e);authUI('<h2>Acceso aceptado</h2><p>Su sesión está activa, pero una sección del panel no pudo cargarse. Actualice la página.</p><button class="btn p" data-h-click="h24">Actualizar</button>')}return}
  let d;
  try{
   // Una lectura que queda esperando por la conexión no debe dejar el formulario
   // bloqueado para siempre. Se pide al servidor y se corta tras 12 segundos.
   const espera=new Promise((_,no)=>setTimeout(()=>no(Object.assign(new Error('Tiempo de espera al verificar el acceso'),{code:'firestore/timeout'})),12000));
   d=await Promise.race([fbDb.collection('roles').doc(u.uid).get({source:'server'}),espera]);
  }catch(e){const c=(e&&e.code)||'error';_note='No se pudo verificar su acceso ['+c+']. Revise su conexión.';firebase.auth().signOut();return}
  if(!d.exists){_note='Su cuenta no tiene acceso. Pídale al administrador que la active.';firebase.auth().signOut();return}
  // La autenticación y el rol ya fueron validados. Un fallo posterior al cargar
  // una sección del panel nunca debe cerrar esta sesión por error.
  const r=d.data();SES={id:r.rol==='admin'?'admin':u.uid,u:r};
  try{entrar()}catch(e){window._tjw&&_tjw(e);authUI('<h2>Acceso aceptado</h2><p>Su sesión está activa, pero una sección del panel no pudo cargarse. Actualice la página.</p><button class="btn p" data-h-click="h24">Actualizar</button>')}
 })}
function authLogin(){const L=loginIdentLocal();authUI(`<h2>${esc(L.titulo||(DB.cfg&&DB.cfg.loginTitulo)||nombreNegocio())}</h2><p>${esc(L.desc||(DB.cfg&&DB.cfg.loginDesc)||'Inicie sesión para continuar.')}</p><label for="au_e">Correo</label><input id="au_e" type="email" autocomplete="username"><label for="au_p">Contraseña</label><input id="au_p" type="password" autocomplete="current-password" data-h-keydown="h23"><label style="display:flex;gap:8px;align-items:center;font-size:12.5px;margin:8px 0"><input type="checkbox" style="width:auto" data-h-change="h22"> Mostrar contraseña</label><div id="au_m"></div><button class="btn p" data-h-click="h21">Entrar</button><a href="#" data-h-click="h20" style="display:block;text-align:center;margin-top:14px;font-size:12.5px;color:rgba(255,255,255,.85);text-decoration:underline">¿Olvidó su contraseña?</a>`);if(_note){authMsg(_note);_note=''}}
async function authGo(){const e=$('au_e').value.trim(),p=$('au_p').value;if(!e||!p)return authMsg('Escriba correo y contraseña.');authMsg('Verificando…');
 try{idleStamp();await firebase.auth().signInWithEmailAndPassword(e,p)}catch(x){const c=x.code||String(x.message||x);const m={'auth/invalid-credential':'Correo o contraseña incorrectos','auth/wrong-password':'Contraseña incorrecta','auth/user-not-found':'No existe ese usuario','auth/invalid-email':'Correo no válido','auth/too-many-requests':'Demasiados intentos, espere unos minutos','auth/network-request-failed':'Sin conexión o bloqueado por la red','auth/operation-not-allowed':'Correo/contraseña no está habilitado en Firebase'};authMsg((m[c]||'No se pudo entrar')+' ['+c+']')}}
async function authReset(){const e=($('au_e')&&$('au_e').value||'').trim();if(!e)return authMsg('Escriba su correo arriba y toque el enlace otra vez.');
 try{await firebase.auth().sendPasswordResetEmail(e)}catch(x){window._tjw&&_tjw(x)}authMsg('Si el correo existe, le enviamos un enlace para crear una nueva contraseña.')}
function authLimpia(){if(!esAdmin())return;if(DB.cfg.admin||usuarios().some(u=>u.h||u.s)){delete DB.cfg.admin;usuarios().forEach(u=>{delete u.h;delete u.s});save()}}
function entrar(){const f=navOrd().find(x=>puede(x[0]));topUser();if(!f){authUI('<h2>Sin accesos</h2><p>Su usuario aún no tiene paneles asignados. Pídale al administrador que se los active.</p><button class="btn" data-h-click="h19">Salir</button>');return}
 if(!window._syncOn){window._syncOn=1;iniciarSincronizacionNube()}
 if(!window._catSync){window._catSync=1;sincronizarCatalogoNube()}
 setTimeout(authLimpia,4000);panelLogoApply();authOff();nav();galListen();chatListen();llamListen();perfListen();presListen();presStart();tiendaListen();setTimeout(cobroVoz,3500);ir(f[0])}
function authRefresh(){if(!SES)return;topUser();nav();if(!puede(vista))ir(vista)}
function salir(){try{presBeat(true)}catch(e){window._tjw&&_tjw(e)}try{if(LL.id)llamCuelga();else if(LL.incoming)llamRechazar()}catch(e){window._tjw&&_tjw(e)}if(CH.unsub){CH.unsub();CH.unsub=null}firebase.auth().signOut().finally(()=>location.reload())}
// --- Administración de vendedores (solo admin, en Configuración) ---
R.vend=function(){if(!esAdmin())return;$('v').innerHTML='<div class="card" id="vendCard">'+vendHTML()+'</div>'};
function vendHTML(){const us=usuarios();return `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h3 style="margin:0">🧑‍💼 Vendedores y accesos</h3><button class="btn p s" data-h-click="h18">+ Crear vendedor</button></div><p style="font-size:12.5px;color:var(--gris)">Cada vendedor entra con su correo y contraseña y solo ve los paneles que usted marque.</p>${1?`<div class="tw"><table><tr><th>Usuario</th><th>Paneles</th><th></th></tr><tr><td><span class="avn"><span class="avc" data-h-click="h17" title="Ver foto">${avHTML('admin',44)}</span><b>Administrador</b></span></td><td><small>Todos</small></td><td></td></tr>${us.map(u=>`<tr><td><span class="avn"><span class="avc" data-h-click="h16" data-a-click="${_ha(u.id)}" title="Ver foto">${avHTML(u.id,44)}</span>${esc(u.n)}</span></td><td>${(u.panels||[]).map(k=>{const p=V.find(x=>x[0]===k);return p?p[1]+' '+p[2]:''}).join(', ')||'<small>Ninguno</small>'}</td><td class="r"><button class="btn s" data-h-click="h15" data-a-click="${_ha(u.id)}" aria-label="Editar">✏️</button> <button class="btn s d" data-h-click="h14" data-a-click="${_ha(u.id)}" aria-label="Eliminar">🗑</button></td></tr>`).join('')}${us.length?'':'<tr><td colspan="3"><small>Aún no hay vendedores.</small></td></tr>'}</table></div>`:''}<div style="margin-top:12px"><button class="btn s" data-h-click="h13">🔑 Cambiar mi contraseña</button></div>`}
function vendForm(id){const u=id?usuarios().find(x=>x.id===id):null,sel=u?(u.panels||[]):['home','nueva','cli','prod'];
 $('mb').innerHTML=`<h3 style="margin-top:0">${u?'Editar vendedor':'Nuevo vendedor'}</h3><div class="g"><div><label>Nombre</label><input id="vf_n" value="${esc(u?u.n:'')}" placeholder="Ej. María Pérez"></div><div><label>Correo</label><input id="vf_e" type="email" value="${esc(u?u.email||'':'')}" ${u?'disabled':''}></div>${u?'':'<div><label>Contraseña (mínimo 6)</label><input id="vf_p" type="password" autocomplete="new-password"></div>'}</div><label style="margin-top:12px;display:block">Paneles a los que puede entrar</label><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:6px">${PANELES.map(p=>`<label class="pchk"><input type="checkbox" value="${p[0]}" ${sel.includes(p[0])?'checked':''}> ${p[1]} ${p[2]}</label>`).join('')}</div><div id="vf_m" style="color:#d92d20;font-size:13px;margin-top:8px"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn" data-h-click="h12">Cancelar</button><button class="btn p" data-h-click="h11" data-a-click="${_ha(id||'')}">💾 Guardar</button></div>`;$('md').classList.add('on')}
async function vendSave(id){const n=$('vf_n').value.trim(),panels=[...document.querySelectorAll('#mb .pchk input:checked')].map(x=>x.value),m=t=>$('vf_m').textContent=t;
 if(!n)return m('Escriba el nombre.');
 try{
  if(!id){const e=$('vf_e').value.trim(),p=$('vf_p').value;if(!e)return m('Escriba el correo.');if(p.length<6)return m('La contraseña debe tener al menos 6 caracteres.');
   const sec=firebase.apps.find(a=>a.name==='sec')||firebase.initializeApp(firebaseConfig,'sec');
   const c=await sec.auth().createUserWithEmailAndPassword(e,p);await sec.auth().signOut();
   await fbDb.collection('roles').doc(c.user.uid).set({rol:'vend',n,email:e,panels});
   try{if(typeof MULTIEMP!=='undefined'&&MULTIEMP&&typeof TJEmpresa!=='undefined'&&TJEmpresa.empActiva&&typeof mktMiembroSet==='function')await mktMiembroSet(c.user.uid)}catch(e){window._tjw&&_tjw(e)}
   usuarios().push({id:c.user.uid,n,email:e,panels})}
  else{const u=usuarios().find(x=>x.id===id);if(!u.email)return m('Vendedor antiguo sin cuenta: elimínelo y créelo de nuevo con correo.');
   u.n=n;u.panels=panels;await fbDb.collection('roles').doc(id).set({rol:'vend',n,email:u.email,panels})}
  save();cerrar();R.vend()
 }catch(x){m(x.code==='auth/email-already-in-use'?'Ese correo ya tiene cuenta.':'No se pudo guardar ('+(x.code||'error')+').')}}
async function vendDel(id){const u=usuarios().find(x=>x.id===id);if(!u||!confirm('¿Eliminar al vendedor '+u.n+'? Perderá el acceso de inmediato.'))return;try{await fbDb.collection('roles').doc(id).delete()}catch(e){window._tjw&&_tjw(e)}try{if(typeof MULTIEMP!=='undefined'&&MULTIEMP&&typeof TJEmpresa!=='undefined'&&TJEmpresa.empActiva)await fbDb.collection('empresas').doc(TJEmpresa.empActiva()).collection('miembros').doc(id).delete()}catch(e){window._tjw&&_tjw(e)}DB.cfg.users=usuarios().filter(x=>x.id!==id);save();R.vend()}
async function adminPin(){const e=firebase.auth().currentUser&&firebase.auth().currentUser.email;if(!e)return;if(!confirm('Le enviaremos un correo a '+e+' para cambiar su contraseña. ¿Continuar?'))return;try{await firebase.auth().sendPasswordResetEmail(e);alert('Correo enviado.')}catch(x){alert('No se pudo enviar.')}}
// --- Chat: ajustar la altura al espacio real (celular) para que el cuadro de texto no quede bajo la barra de iconos ---
function fitChat(){const w=$('chw');if(!w)return;
 if(innerWidth>820){w.style.height='';w.style.minHeight='';return}
 const vv=window.visualViewport,vh=vv?vv.height:innerHeight,tec=vv&&vv.height<innerHeight-120,bn=document.querySelector('.bn'),bh=tec?0:(bn?bn.offsetHeight:64),top=w.getBoundingClientRect().top+scrollY;
 const h=Math.max(260,Math.floor(vh-top-bh-12))+'px';if(w.style.height!==h)w.style.height=h;w.style.minHeight='0'}
function chatFitSoon(){fitChat();[120,600,1500].forEach(ms=>setTimeout(fitChat,ms))}
addEventListener('resize',fitChat);addEventListener('orientationchange',()=>setTimeout(fitChat,250));
if(window.visualViewport){visualViewport.addEventListener('resize',fitChat)}
const _au0=authUI;authUI=function(){const r=_au0.apply(this,arguments);try{lbgApply()}catch(e){window._tjw&&_tjw(e)}return r};
// ---- Personalización: logos, inicio de sesión, banners y forma de botones ----
/* La delegación de eventos (data-h-change="call") llama al manejador con this=INPUT
   y sin evento: los archivos se leen de this.files (con respaldo por ev.target). */
function archivoDe(ev){var el=(this&&this.files)?this:(ev&&ev.target&&ev.target.files?ev.target:null);return el&&el.files&&el.files[0]||null}
/* Mide una imagen para informar resolución al subir (4 s de margen). */
function medirImagen(file){return new Promise(function(res){var im=new Image(),ok=0;im.onload=function(){ok=1;res({w:im.naturalWidth,h:im.naturalHeight})};im.onerror=function(){ok=1;res(null)};im.src=URL.createObjectURL(file);setTimeout(function(){if(!ok)res(null)},4000)})}
/* Comprime una imagen a dataURL (los GIF se conservan intactos para no perder la
   animación; si son muy grandes se pide usar enlace). */
async function logoCompress(file,maxKB,maxW){
 if(file.type==='image/gif'){
  if(file.size>maxKB*1024*3)throw new Error('gif-grande');
  return await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
 }
 const bmp=await createImageBitmap(file);
 let W=Math.min(maxW,bmp.width);
 for(let t=0;t<6;t++){
  const H=Math.round(bmp.height*W/bmp.width),c=document.createElement('canvas');
  c.width=W;c.height=H;c.getContext('2d').drawImage(bmp,0,0,W,H);
  for(const q of [.9,.82,.72,.62,.5]){
   const b=await new Promise(r=>c.toBlob(r,'image/jpeg',q));
   if(b&&b.size<=maxKB*1024)return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)});
  }
  W=Math.round(W*.8);
 }
 throw new Error('grande');
}
/* Logo de la factura (Datos de la empresa). Recomendado 600×200 horizontal. */
async function facLogoFile(ev){
 const file=archivoDe.call(this,ev);if(!file)return;
 if(!/^image\//.test(file.type||''))return alert('❌ Ese archivo no es una imagen (use PNG o JPG).');
 try{
  const dim=await medirImagen(file);
  if(dim&&dim.w<200)return alert('❌ La imagen es muy pequeña: '+dim.w+'×'+dim.h+' px.\nMínimo 200 px de ancho · Recomendado: 600×200 px horizontal (PNG con fondo transparente ideal).');
  DB.cfg.logoFac=await logoCompress(file,150,600);save();R.config();
  alert('✔ Logo de la factura subido con éxito'+(dim?(' ('+dim.w+'×'+dim.h+' px · '+fmtKB(file.size)+')'):'')+'.');
 }catch(e){alert(e.message==='gif-grande'?'❌ El GIF pesa más de ~450 KB: use una imagen estática o un enlace.':'❌ No se pudo procesar la imagen ('+((e&&e.message)||e)+').')}
}
function facLogoQuitar(){if(!confirm('¿Quitar el logo de la factura? Volverá el logo del panel.'))return;delete DB.cfg.logoFac;save();R.config();alert('✔ Logo de la factura eliminado.')}
/* Logo/textos del inicio de sesión. Recomendado cuadrado 400×400. Videos → Storage. */
async function loginLogoCloud(f){
 try{
  if(!(window.firebase&&firebase.storage))throw 0;
  const ref=firebase.storage().ref('loginlogo/'+Date.now()+'_'+f.name.replace(/[^\w.\-]+/g,'_'));
  await ref.put(f,f.type?{contentType:f.type}:undefined);
  return await ref.getDownloadURL();
 }catch(e){window._tjw&&window._tjw(e);return ''}
}
async function loginLogoFile(ev){
 const file=archivoDe.call(this,ev);if(!file)return;
 const esVid=/^video\//.test(file.type||'')||/\.(mp4|webm|mov|m4v)$/i.test(file.name||'');
 try{
  if(esVid){
   const url=await loginLogoCloud(file);
   if(!url)return alert('❌ El video no pudo subirse a la nube. Use la opción de enlace o un archivo más liviano (MP4/WebM corto).');
   DB.cfg.loginLogoSrc=url;DB.cfg.loginLogoKind='video';DB.cfg.loginTs=Date.now();
   loginIdentGuardarLocal({src:url,kind:'video'});save();R.config();if(!SES)authLogin();
   return alert('✔ Video del inicio de sesión subido con éxito ('+fmtKB(file.size)+').');
  }
  if(!/^image\//.test(file.type||''))return alert('❌ Archivo no válido: use imagen, GIF o video MP4/WebM.');
  const dim=await medirImagen(file);
  if(dim&&dim.w<160)return alert('❌ La imagen es muy pequeña: '+dim.w+'×'+dim.h+' px.\nMínimo 160 px · Recomendado: 400×400 px cuadrado (se ve arriba del formulario).');
  DB.cfg.loginLogoSrc=await logoCompress(file,300,800);DB.cfg.loginLogoKind='image';DB.cfg.loginTs=Date.now();
  loginIdentGuardarLocal({src:DB.cfg.loginLogoSrc,kind:'image'});save();R.config();if(!SES)authLogin();
  alert('✔ Logo del inicio de sesión subido con éxito'+(dim?(' ('+dim.w+'×'+dim.h+' px · '+fmtKB(file.size)+')'):'')+'.');
 }catch(e){alert(e.message==='gif-grande'?'❌ El GIF pesa más de ~900 KB: suba uno más liviano o use un enlace.':'❌ No se pudo procesar el archivo ('+((e&&e.message)||e)+').')}
}
/* Logo del menú lateral del panel (la marca de la barra izquierda). */
function panelLogoApply(){try{const im=document.querySelector('.brand .logo img');if(im)im.src=(DB.cfg&&DB.cfg.panelLogoSrc)||'assets/logo.png'}catch(e){}try{panelMarcaApply()}catch(e){window._tjw&&_tjw(e)}}
/* Nombre visible y lema de la barra lateral (debajo del logo): editables por empresa (cfg.panelNombre / cfg.panelLema).
   Sin valor propio: la empresa inicial conserva sus textos de siempre; cualquier otra usa el nombre de SU empresa y sin lema
   (nunca los de Tarjetería Jhon, que están escritos fijos en index.html). */
const PANEL_NOMBRE_INI='Tarjetería Jhon',PANEL_LEMA_INI='Tarjetas para toda ocasión';
function panelMarcaTextos(){
 const c=(typeof DB!=='undefined'&&DB.cfg)||{},ini=TJEmpresa.empEsInicial();
 const nom=String(c.panelNombre==null?'':c.panelNombre).trim();
 const nombre=nom||(ini?PANEL_NOMBRE_INI:(String(c.nombre||'').trim()&&c.nombre!==PANEL_NOMBRE_INI?String(c.nombre).trim():nombreNegocio()));
 const lema=c.panelLema!=null?String(c.panelLema).trim():(ini?PANEL_LEMA_INI:'');
 return {nombre:nombre,lema:lema,propioNombre:!!nom,propioLema:c.panelLema!=null};
}
function panelMarcaApply(){
 const T=panelMarcaTextos(),d=document;
 const sm=d.querySelector('.brand small'),p=d.querySelector('.brand p'),im=d.querySelector('.brand .logo img');
 if(sm)sm.textContent=T.nombre;
 if(p){p.textContent=T.lema;p.hidden=!T.lema}
 if(im)im.alt=T.nombre;
 /* Rótulos fijos de la cabecera y del h1 oculto: se rehacen siempre desde su texto original para poder cambiarlos de nuevo. */
 [d.querySelector('.top .rt'),d.querySelector('h1.h1m')].forEach(e=>{if(!e)return;
  if(e.dataset.tpl===undefined)e.dataset.tpl=e.textContent;
  e.textContent=e.dataset.tpl.split(PANEL_NOMBRE_INI).join(T.nombre).replace('Panel de Facturación',(window.TJMarca&&TJMarca.panel)?'VEN CRM':'Panel de Facturación')})
}
function panelMarcaGuardar(){
 const n=(($('pm_nombre')||{}).value||'').trim().slice(0,40),l=(($('pm_lema')||{}).value||'').trim().slice(0,60);
 if(n)DB.cfg.panelNombre=n;else delete DB.cfg.panelNombre;
 DB.cfg.panelLema=l;
 save();panelMarcaApply();R.config();alert('✔ Nombre y lema del menú lateral guardados.')}
function panelMarcaRestaurar(){
 if(!confirm('¿Volver al nombre y lema por defecto del menú lateral?'))return;
 delete DB.cfg.panelNombre;delete DB.cfg.panelLema;save();panelMarcaApply();R.config();alert('✔ Se restauró el nombre y el lema por defecto.')}
async function panelLogoFile(ev){
 const file=archivoDe.call(this,ev);if(!file)return;
 if(!/^image\//.test(file.type||''))return alert('❌ Ese archivo no es una imagen (use PNG o JPG).');
 try{
  const dim=await medirImagen(file);
  if(dim&&dim.w<100)return alert('❌ La imagen es muy pequeña: '+dim.w+'×'+dim.h+' px.\nMínimo 100 px · Recomendado: 200×200 px cuadrado.');
  DB.cfg.panelLogoSrc=await logoCompress(file,150,500);save();panelLogoApply();R.config();
  alert('✔ Logo del panel subido con éxito'+(dim&&dim.w?' ('+dim.w+'×'+dim.h+' px · '+fmtKB(file.size)+')':'')+'.');
 }catch(e){alert(e.message==='gif-grande'?'❌ El GIF pesa más de ~450 KB.':'❌ No se pudo procesar la imagen.')}
}
function panelLogoQuitar(){if(!confirm('¿Quitar el logo del panel? Volverá el logo original.'))return;delete DB.cfg.panelLogoSrc;save();panelLogoApply();R.config();alert('✔ Logo del panel eliminado.')}
function loginLogoUrl(){
 const u=($('lg_url')||{value:''}).value.trim();if(!u)return;
 DB.cfg.loginLogoSrc=u;DB.cfg.loginLogoKind=(/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u)?'video':'image');DB.cfg.loginTs=Date.now();
 loginIdentGuardarLocal({src:u,kind:DB.cfg.loginLogoKind});save();R.config();if(!SES)authLogin();alert('✔ Logo por enlace guardado.');
}
function loginLogoQuitar(){if(!confirm('¿Quitar el logo del inicio de sesión?'))return;DB.cfg.loginLogoSrc='';DB.cfg.loginLogoKind='';DB.cfg.loginTs=Date.now();loginIdentGuardarLocal({src:'',kind:''});save();R.config();if(!SES)authLogin();alert('✔ Logo del inicio de sesión eliminado.')}
function loginIdentGuardar(){
 const t=($('lg_t')||{value:''}).value.trim(),d=($('lg_d')||{value:''}).value.trim();
 DB.cfg.loginTitulo=t;DB.cfg.loginDesc=d;DB.cfg.loginTs=Date.now();
 loginIdentGuardarLocal({titulo:t,desc:d});save();R.config();if(!SES)authLogin();
 alert('✔ Textos del inicio de sesión guardados.');
}
/* Banners promocionales de la tienda (por empresa, en tienda_items/__cfg.banners).
   Recomendado 1200×600 px. Viven dentro del documento __cfg de Firestore, que
   tiene límite de 1 MB: por eso se comprimen a ≤120 KB y se vigila el total. */
function banPeso(B){return (B||[]).reduce(function(a,b){return a+(b&&b.src?b.src.length*0.75:0)},0)}
function banGuardar(banners){
 banners=(banners||[]).slice(0,6);
 var kb=Math.round(banPeso(banners)/1024);
 if(kb>780)return alert('❌ Los banners juntos pesarían ~'+kb+' KB y el documento de la tienda no admite más de ~780 KB.\nUse enlaces (URL) para las imágenes pesadas o quite alguno.');
 fbCol('tienda_items').doc('__cfg').set({__cfg:true,banners,ts:Date.now()},{merge:true})
  .then(()=>{TD.banners=banners;R.config();alert('✔ Banners guardados ('+banners.length+' de 6 · ~'+kb+' KB). Ya se ven en la tienda.')})
  .catch(e=>{const m=String((e&&e.message)||e);alert((/exceeds the maximum|resource-exhausted/i.test(m)?'❌ Los banners juntos pesan demasiado para el documento de la tienda (límite 1 MB).\nUse enlaces (URL) para banners pesados o quite alguno.':'❌ No se pudo guardar los banners: '+m))});
}
async function banSubir(ev){
 const file=archivoDe.call(this,ev);if(!file)return;
 if(!/^image\//.test(file.type||''))return alert('❌ Ese archivo no es una imagen.');
 const B=[...(TD.banners||[])];if(B.length>=6)return alert('Máximo 6 banners.');
 try{
  const dim=await medirImagen(file);
  if(dim&&dim.w<600)return alert('❌ El banner es muy pequeño: '+dim.w+'×'+dim.h+' px.\nMínimo 600 px de ancho · Recomendado: 1200×600 px panorámico.');
  const du=await logoCompress(file,120,1200);
  B.push({id:uid(),src:du});
  if(Math.round(banPeso(B)/1024)>780)return alert('❌ Con este banner se pasarían del espacio (~'+Math.round(banPeso(B)/1024)+' KB de ~780).\nUse un enlace (URL) para esa imagen o quite otro banner.');
  banGuardar(B);
 }catch(e){alert(e.message==='gif-grande'?'❌ El GIF pesa más de ~360 KB: use un enlace (URL).':'❌ No se pudo procesar la imagen.')}
}
function banUrl(){
 const u=($('ban_url')||{value:''}).value.trim();if(!u)return;
 if(!/^https?:\/\//i.test(u))return alert('Pegue un enlace que empiece por http…');
 const B=[...(TD.banners||[])];if(B.length>=6)return alert('Máximo 6 banners.');
 B.push({id:uid(),src:u});$('ban_url').value='';banGuardar(B);
}
function banQuitar(i){const B=[...(TD.banners||[])];B.splice(i,1);banGuardar(B)}
function banMover(s){const p=String(s||'').split('|');const i=+p[0],d=+p[1];const B=[...(TD.banners||[])],j=i+d;if(!(i>=0)||!(j>=0)||j>=B.length)return;[B[i],B[j]]=[B[j],B[i]];banGuardar(B)}
/* Forma de los botones de la tienda (píldora/redondeado/cuadrado). */
function btnRadioSet(v){
 v=+v||999;
 fbCol('tienda_items').doc('__cfg').set({__cfg:true,btnRadio:v,ts:Date.now()},{merge:true})
  .then(()=>{TD.btnRadio=v;document.documentElement.style.setProperty('--kbtn-r',v+'px');R.config();alert('✔ Forma guardada: '+(v===999?'💊 Píldora':v===12?'▢ Redondeado':'⬛ Casi cuadrado')+'. Abra la tienda para verla (recargue si la tenía abierta).')})
  .catch(e=>alert('❌ No se pudo guardar: '+((e&&e.message)||e)));
}
// ---- Tarjeta en Configuración ----
function lbgCard(){const m=lbgMeta(),on=k=>m.mode===k?'p':'';
 const ll=(DB.cfg||{}),tieneLogo=!!ll.loginLogoSrc;
 return `<h3 style="margin:0 0 4px">🔐 Configuración de inicio de sesión</h3><p style="font-size:12.5px;color:var(--gris);margin:0 0 12px">Todo lo que se ve antes de entrar: logo, textos y fondo de la pantalla de acceso. Acepta imagen, GIF animado o video corto.</p>
 <div class="card" style="margin:0 0 14px;padding:14px;background:var(--soft)">
  <b style="font-size:13.5px">🖼 Logo y textos de la pantalla de acceso</b>
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:10px 0">
   ${tieneLogo?(ll.loginLogoKind==='video'?`<video src="${esc(ll.loginLogoSrc)}" autoplay muted loop playsinline style="height:64px;border-radius:12px;background:#000"></video>`:`<img src="${esc(ll.loginLogoSrc)}" alt="logo" style="height:64px;border-radius:12px;background:#fff;padding:4px 8px;border:1px solid var(--linea)">`):'<small style="color:var(--gris)">Sin logo propio: se usa el del menú.</small>'}
   <div style="display:flex;gap:8px;flex-wrap:wrap">
    <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">📁 Subir imagen/GIF/video<input type="file" accept="image/*,video/mp4,video/webm,.gif" hidden data-h-change="call" data-a-change="${_ha('loginLogoFile')}"></label>
    ${tieneLogo?`<button class="btn s d" data-h-click="call" data-a-click="${_ha('loginLogoQuitar')}">Quitar</button>`:''}
   </div>
  </div>
  <small style="display:block;color:var(--gris);font-size:11.5px;margin:-4px 0 8px">Dimensiones: imagen/GIF cuadrado, recomendado <b>400×400 px</b> (mínimo 160) · video corto MP4/WebM.</small>
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:4px 0 6px;padding-top:10px;border-top:1px dashed var(--linea)">
   ${DB.cfg.panelLogoSrc?`<img src="${DB.cfg.panelLogoSrc}" alt="logo panel" style="height:44px;border-radius:10px;background:#fff;padding:3px 6px;border:1px solid var(--linea)">`:'<small style="color:var(--gris)">Logo del menú lateral (el de la barra izquierda): usa el original del panel.</small>'}
   <div style="display:flex;gap:8px;flex-wrap:wrap">
    <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">📁 Subir logo del panel<input type="file" accept="image/*,.gif" hidden data-h-change="call" data-a-change="${_ha('panelLogoFile')}"></label>
    ${DB.cfg.panelLogoSrc?`<button class="btn s d" data-h-click="call" data-a-click="${_ha('panelLogoQuitar')}">Quitar</button>`:''}
   </div>
  </div>
  <small style="display:block;color:var(--gris);font-size:11.5px;margin:0 0 8px">Recomendado <b>200×200 px</b> cuadrado (mínimo 100) · aparece en el menú de todos sus dispositivos.</small>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
   <input id="lg_url" placeholder="…o enlace (URL) de imagen/GIF/video" style="flex:1;min-width:200px"><button class="btn s" data-h-click="call" data-a-click="${_ha('loginLogoUrl')}">Usar enlace</button>
  </div>
  <div style="padding-top:10px;border-top:1px dashed var(--linea)"><b style="font-size:13.5px">🏷 Nombre y eslogan bajo el logo del menú</b></div>
  <div class="g" style="margin:0 0 8px"><div><label for="pm_nombre">Nombre bajo el logo del menú</label><input id="pm_nombre" maxlength="40" value="${esc(DB.cfg.panelNombre||'')}" placeholder="${esc(panelMarcaTextos().nombre)}"></div>
  <div><label for="pm_lema">Eslogan bajo el nombre</label><input id="pm_lema" maxlength="60" value="${esc(DB.cfg.panelLema!=null?DB.cfg.panelLema:'')}" placeholder="${esc(panelMarcaTextos().lema||'Opcional')}"></div></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn p s" data-h-click="call" data-a-click="${_ha('panelMarcaGuardar')}">💾 Guardar nombre y eslogan</button><button class="btn s" data-h-click="call" data-a-click="${_ha('panelMarcaRestaurar')}">↺ Restaurar</button></div>
  <div style="padding-top:10px;border-top:1px dashed var(--linea)"><b style="font-size:13.5px">🛍 Logo de la tienda web</b></div>
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:8px 0 6px">
   ${TD.logoUrl?`<img src="${esc(TD.logoUrl)}" alt="logo de la tienda" style="height:44px;max-width:180px;object-fit:contain;border-radius:10px;background:#fff;padding:3px 6px;border:1px solid var(--linea)">`:`<small style="color:var(--gris)">${TJEmpresa.empEsInicial()?'Logo de la tienda web: usa el original.':'Logo de la tienda web: sin logo propio (la tienda muestra la inicial de su empresa).'}</small>`}
   <div style="display:flex;gap:8px;flex-wrap:wrap">
    <label class="btn s" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">📁 Subir logo de la tienda web<input type="file" accept="image/*" hidden data-h-change="call" data-a-change="${_ha('shopLogoFile')}"></label>
    ${TD.logoUrl?`<button class="btn s d" data-h-click="call" data-a-click="${_ha('shopLogoQuitar')}">Quitar</button>`:''}
   </div>
  </div>
  <small style="display:block;color:var(--gris);font-size:11.5px;margin:0 0 10px">Es el logo que ven sus clientes arriba a la izquierda de la tienda (junto a «Catálogo virtual») y en la portada. PNG con fondo transparente o JPG, recomendado ancho de 400–800 px; se reduce solo a ≤180 KB. Se guarda al instante, solo para esta empresa.</small>
  <div style="padding-top:10px;border-top:1px dashed var(--linea)"><b style="font-size:13.5px">🔐 Textos de la pantalla de acceso</b></div>
  <div class="g"><div><label>Título (nombre que va arriba)</label><input id="lg_t" value="${esc(ll.loginTitulo||'')}" placeholder="${esc(nombreNegocio())}" maxlength="60"></div>
  <div><label>Descripción (línea de abajo)</label><input id="lg_d" value="${esc(ll.loginDesc||'')}" placeholder="Inicie sesión para continuar." maxlength="120"></div></div>
  <div style="margin-top:10px"><button class="btn p s" data-h-click="call" data-a-click="${_ha('loginIdentGuardar')}">💾 Guardar textos</button></div>
 </div>
 <b style="font-size:13.5px">🎬 Fondo de la pantalla de acceso</b>
 <div class="lbgPrevW"><div class="lbgv" id="lbgPrev"></div><div class="lbgMock"><b>${esc(nombreNegocio())}</b><span></span><span></span><em>Entrar</em></div></div>
 <div class="lbgRow"><button class="btn s ${on('aurora')}" data-h-click="h10">✨ Aurora (original)</button>${LBG_PRE.map(p=>`<button class="btn s ${on(p[0])}" data-h-click="h9" data-a-click="${_ha(p[0])}">${p[1]}</button>`).join('')}</div>
 <div class="lbgRow"><button class="btn p" data-h-click="h8">📁 Subir imagen o video</button><input id="lbgFile" type="file" accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.jpg,.jpeg,.png,.webp,.avif,.gif" hidden data-h-change="h7"><button class="btn s" data-h-click="h6">↺ Restablecer</button><span id="lbgInfo" style="font-size:12.5px;color:var(--gris)">${m.mode==='file'?esc(m.name||'')+' · '+lbgSz(m.size):m.mode==='url'?'Enlace: '+esc(m.url.slice(0,48)):''}</span></div>
 <div class="lbgRow" style="align-items:center"><input id="lbgUrl" placeholder="…o pegue el enlace (URL) de una imagen o video" value="${m.mode==='url'?esc(m.url):''}" style="flex:1;min-width:200px"><button class="btn s" data-h-click="h5">Usar enlace</button></div>
 <div id="lbgSync" style="font-size:12.5px;margin-top:10px;color:${m.cts?'var(--okt,#15803d)':'var(--gris)'}">${m.cts?'☁ Sincronizado con todos sus dispositivos.':''}</div>
 <div class="g" style="margin-top:10px"><div><label>Oscurecer fondo: <b id="lbgDv">${m.dim}%</b></label><input type="range" min="0" max="80" value="${m.dim}" data-h-input="h4"></div><div><label>Desenfoque: <b id="lbgBv">${m.blur}px</b></label><input type="range" min="0" max="24" value="${m.blur}" data-h-input="h3"></div></div>
 <p style="font-size:12px;color:var(--gris);margin:12px 0 0;line-height:1.5">☁ Se sincroniza solo con sus otros dispositivos: aparece en el inicio de sesión de todos los equipos. Las imágenes y videos se suben a Firebase Storage sin comprimir; si Storage no está disponible, la imagen se envía optimizada (1920 px) y el video queda solo en este equipo (use un enlace para sincronizarlo). Los videos se reproducen en bucle y sin sonido; use MP4 (H.264) o WebM.</p>`}

// ---- Sincronización con la nube (Firebase) ----
const LBG_DOC=()=>fbDb&&fbCol('panel').doc('loginbg');
function lbgStatus(t,ok){const e=$('lbgSync');if(!e)return;e.textContent=t;e.style.color=ok===false?'var(--errt,#c4251a)':ok?'var(--okt,#15803d)':'var(--gris)'}
let _lbgPT=0;function lbgPushSoon(){clearTimeout(_lbgPT);_lbgPT=setTimeout(()=>lbgPush(),700)}
async function lbgPush(extra){const d=LBG_DOC();if(!d||typeof esAdmin!=='function'||!esAdmin())return;const m=lbgMeta(),ts=Date.now(),DEL=firebase.firestore.FieldValue.delete();
 const f={dim:m.dim,blur:m.blur,ts};
 if(m.mode==='file'){if(!m.cloud)return;Object.assign(f,{mode:m.cloud.mode,kind:m.cloud.kind||m.kind,name:m.name,size:m.size});if(m.cloud.mode==='url'){f.url=m.cloud.url;f.img=DEL}else f.url=DEL}
 else{f.mode=m.mode;f.kind=m.kind||'';f.img=DEL;if(m.mode==='url')f.url=m.url;else f.url=DEL}
 if(extra)Object.assign(f,extra);
 try{await d.set(f,{merge:true});const m2=lbgMeta();m2.cts=ts;lbgSave(m2);lbgStatus('☁ Sincronizado con todos sus dispositivos.',true)}catch(e){lbgStatus('No se pudo sincronizar con la nube (permisos de Firebase). Queda solo en este dispositivo.',false)}}
async function lbgCompress(f){const bmp=await createImageBitmap(f);let W=Math.min(1920,bmp.width);
 for(let t=0;t<6;t++){const H=Math.round(bmp.height*W/bmp.width),c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(bmp,0,0,W,H);
  for(const q of [.85,.75,.65,.55,.45]){const b=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(b&&b.size<=620*1024)return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)})}
  W=Math.round(W*.8)}throw new Error('grande')}
async function lbgCloudUpload(f){const kind=lbgIsVid(f.name,f.type)?'video':'image';
 try{if(!(window.firebase&&firebase.storage))throw 0;const ref=firebase.storage().ref('loginbg/'+Date.now()+'_'+f.name.replace(/[^\w.\-]+/g,'_'));
  await new Promise((res,rej)=>{const t=ref.put(f,f.type?{contentType:f.type}:undefined);let last=-1,idle=0,fin=0;
   const wd=setInterval(()=>{if(fin)return;idle++;if(idle>=(last>0?30:12)){fin=1;clearInterval(wd);try{t.cancel()}catch(e){window._tjw&&_tjw(e)}rej(new Error('stall'))}},1000);
   t.on('state_changed',s=>{if(s.bytesTransferred!==last){last=s.bytesTransferred;idle=0}lbgStatus('☁ Subiendo a la nube… '+Math.round(s.bytesTransferred/(s.totalBytes||1)*100)+'%')},e=>{fin=1;clearInterval(wd);rej(e)},()=>{fin=1;clearInterval(wd);res()})});
  const url=await ref.getDownloadURL();return{mode:'url',url,kind,spath:ref.fullPath}}catch(e){window._tjw&&_tjw(e)}
 if(kind==='image'){try{lbgStatus('☁ La subida directa no respondió. Subiendo versión optimizada…');return{mode:'img',kind,img:await lbgCompress(f)}}catch(e){window._tjw&&_tjw(e)}}
 return null}
function lbgDelStorage(c){try{if(c&&c.spath&&window.firebase&&firebase.storage)firebase.storage().ref(c.spath).delete().catch(()=>{})}catch(e){window._tjw&&_tjw(e)}}
async function lbgPull(force){if(LBG.pulling||typeof fbDb==='undefined'||!fbDb)return;LBG.pulling=1;
 try{const s=await LBG_DOC().get();LBG.pulled=1;if(!s.exists)return;const c=s.data(),m=lbgMeta();if(!force&&m.cts===c.ts)return;
  const n=Object.assign({},LBG_DEF,{dim:c.dim==null?35:c.dim,blur:c.blur||0,kind:c.kind||'',name:c.name||'',size:c.size||0,cts:c.ts});
  if(c.mode==='img'&&c.img){const b=await (await fetch(c.img)).blob();await lbgPut(new File([b],c.name||'fondo.jpg',{type:b.type||'image/jpeg'}));n.mode='file';n.size=b.size;n.cloud={mode:'img',kind:'image'};LBG.fts=Date.now()}
  else if(c.mode==='url'){n.mode='url';n.url=c.url||'';n.kind=c.kind||''}
  else n.mode=c.mode||'aurora';
  lbgSave(n);LBG.sig='';lbgApply();lbgRef()}catch(e){LBG.pulled=0}finally{LBG.pulling=0}}
let _lbgPl=0;function lbgPullSoon(){if(Date.now()-_lbgPl<30000)return;_lbgPl=Date.now();lbgPull()}
const _au1=authUI;authUI=function(){const r=_au1.apply(this,arguments);try{if(!LBG.pulled)lbgPull()}catch(e){window._tjw&&_tjw(e)}return r};
const _mrl=mergeRemote;mergeRemote=function(){const r=_mrl.apply(this,arguments);try{lbgPullSoon();loginIdentPull();panelLogoApply()}catch(e){window._tjw&&_tjw(e)}return r};

const lbgSz=b=>b>=1048576?(b/1048576).toFixed(1)+' MB':Math.round(b/1024)+' KB';
function lbgRef(){const c=$('lbgCard');if(!c)return;c.innerHTML=lbgCard();lbgFill($('lbgPrev'),lbgMeta())}
function lbgPick(k){const m=lbgMeta();m.mode=k;lbgSave(m);lbgRef();lbgApply();lbgPush()}
let _lbgT=0;function lbgSet(k,v){const m=lbgMeta();m[k]=v;lbgSave(m);const e=$(k==='dim'?'lbgDv':'lbgBv');if(e)e.textContent=v+(k==='dim'?'%':'px');clearTimeout(_lbgT);_lbgT=setTimeout(()=>{lbgFill($('lbgPrev'),lbgMeta());lbgApply();lbgPushSoon()},60)}
async function lbgFile(inp){const f=inp.files&&inp.files[0];inp.value='';if(!f)return;if(!/^(image|video)\//.test(f.type)&&!/\.(mp4|webm|mov|m4v|jpe?g|png|webp|avif|gif)$/i.test(f.name))return alert('Elija una imagen o un video.');
 const i=$('lbgInfo');if(i)i.textContent='Guardando…';
 try{await lbgPut(f)}catch(e){if(i)i.textContent='';return alert('El navegador no pudo guardar este archivo (espacio insuficiente o modo privado). Pruebe con un archivo más liviano o use un enlace (URL).')}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){window._tjw&&_tjw(e)}
 const old=lbgMeta().cloud;const m=lbgMeta();m.mode='file';m.name=f.name;m.size=f.size;m.kind=lbgIsVid(f.name,f.type)?'video':'image';m.url='';m.cloud=null;lbgSave(m);LBG.fts=Date.now();lbgRef();lbgApply();
 lbgStatus('☁ Preparando sincronización…');const cl=await lbgCloudUpload(f);
 if(cl){const m2=lbgMeta();m2.cloud={mode:cl.mode,url:cl.url||'',kind:cl.kind,spath:cl.spath||''};lbgSave(m2);lbgDelStorage(old);await lbgPush(cl.mode==='img'?{img:cl.img}:{})}
 else lbgStatus('Guardado solo en este dispositivo: no se pudo subir a la nube (Firebase Storage no habilitado o sin permiso). Para sincronizar un video use un enlace (URL).',false)}
function lbgUrl(){const u=($('lbgUrl').value||'').trim();if(!/^https?:\/\//i.test(u))return alert('Pegue un enlace que empiece con https://');const m=lbgMeta();m.mode='url';m.url=u;m.kind=lbgIsVid(u)?'video':'image';lbgSave(m);lbgRef();lbgApply();lbgPush()}
async function lbgReset(){const m=lbgMeta();lbgDelStorage(m.cloud);await lbgDel();lbgSave(Object.assign({},LBG_DEF,{cts:m.cts}));lbgRef();lbgApply();lbgPush()}

aplicarTema(getTemaUser(),false);ir('home');
if(SHOP)shopInit();else authInit();
if('serviceWorker' in navigator){
document.addEventListener('click', function(e){
  const picker = $('chatEmojiPicker');
  if(picker && picker.classList.contains('on') && !e.target.closest('.chat-emoji-wrap')){
    picker.classList.remove('on');
  }
});

/* Fase 16: apps/modelos.js (módulo Check, 1,17 MB comprimido) ya no se precachea al instalar el service worker, para no competir con la primera carga.
   Para que el módulo siga funcionando sin conexión aunque aún no se haya abierto, se le pide al service worker que lo guarde en un momento libre, ya pintada la pantalla
   (nunca en la tienda pública, con "ahorro de datos" ni con conexión 2G). Si no llega a guardarse, se guarda igual la primera vez que se abre Check. */
function precalentarModelos(){
 const c=navigator.connection||{};
 if(SHOP||!TJEmpresa.empEsInicial()||navigator.onLine===false||c.saveData||/(^|-)2g$/.test(c.effectiveType||''))return;
 const pedir=()=>navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage('precalentar-modelos')}).catch(()=>{});
 const idle=()=>{(window.requestIdleCallback||(f=>setTimeout(f,3000)))(pedir,{timeout:10000})};
 setTimeout(idle,5000);
 navigator.serviceWorker.addEventListener('controllerchange',()=>setTimeout(pedir,8000),{once:true});
}
window.addEventListener('load',()=>{(SHOP?Promise.resolve():navigator.serviceWorker.register('sw.js').then(precalentarModelos)).catch(()=>{})})}

function investigacionAbrir(){const old=document.getElementById('investOv');if(old)old.remove();const v=document.createElement('div');v.id='investOv';
 v.innerHTML=`<div class="pdfvb"><b>📦 Investigación de productos</b><span><button class="btn s d" id="investX">✕ Cerrar</button></span></div><iframe id="investFrame" title="Investigación de productos"></iframe>`;
 document.body.appendChild(v);document.getElementById('investX').onclick=()=>v.remove();
 const _if=document.getElementById('investFrame');appHtml('investigacion').then(h=>{_if.srcdoc=h}).catch(e=>{window._tjw&&_tjw(e);_if.srcdoc='<p style="font:15px sans-serif;padding:24px">No se pudo cargar el panel. Recargue la página (Ctrl+F5).</p>'})}
function investCard(){return `<h3 style="margin:0">📦 Investigación de productos</h3><p style="font-size:12.5px;color:var(--gris)">Guarde y compare proveedores de Alibaba: precios, MOQ, fletes, certificaciones y fotos de cada producto, con una ruta de seguimiento por etapas (investigando → contactado → muestra → comparación → seleccionado → aprobado). Los datos se sincronizan con la nube (Firestore) y se comparten entre sus dispositivos; si no hay conexión, se usa una copia guardada en el navegador.</p><button class="btn p" data-h-click="h2">📦 Abrir panel de investigación</button>`}
function investHomeHTML(){return `<div class="card" id="investHome"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">📦 Investigación de productos</h3><button class="btn s" data-h-click="h2">Abrir →</button></div><p style="font-size:13px;color:var(--gris);margin:6px 0 0">Compare proveedores de Alibaba: precios, MOQ, fletes y certificaciones, con una ruta de seguimiento por etapas. Sincronizado con la nube.</p></div>`}

/* ===== Agente de ventas por WhatsApp (IA) =====
   El bot en sí corre en una Cloud Function aparte (no en esta página, porque necesita
   claves secretas que nunca deben quedar expuestas en el código del navegador). Esta
   parte solo MUESTRA, aquí en el panel, las conversaciones que el agente marcó como
   "necesita un asesor humano", para que usted pueda continuarlas. Los pedidos que el
   agente cierra por su cuenta ya aparecen solos en "Pedidos nuevos" de la tienda,
   porque los escribe con el mismo formato que usa la tienda virtual. */
let WA={list:[],on:false};
function waListen(){if(WA.on||!fbDb)return;WA.on=true;
 try{fbCol('wa_conversaciones').where('estado','==','humano').onSnapshot(sn=>{
  WA.list=sn.docs.map(d=>d.data()).sort((a,b)=>(b.ts||0)-(a.ts||0));
  waRefreshCard();waRefreshHome()
 },e=>console.warn('Agente WhatsApp: no se pudo escuchar conversaciones.',e))}catch(e){window._tjw&&_tjw(e)}
}
function waUltimo(c){const h=c.historial||[];for(let i=h.length-1;i>=0;i--)if(h[i].role==='user')return h[i].content||'';return''}
function waBack(phone){if(!fbDb)return;fbCol('wa_conversaciones').doc(phone).set({estado:'bot'},{merge:true}).catch(()=>alert('No se pudo devolver la conversación al agente. Revise su conexión o permisos.'))}
function waRow(c){return `<div class="tdr"><div><b>${esc(c.phone||'')}</b><small>${esc((waUltimo(c)||'').slice(0,70))}</small></div><a class="btn s" href="https://wa.me/${esc((c.phone||'').replace(/\D/g,''))}" target="_blank" rel="noopener" title="Abrir WhatsApp">💬</a><button class="btn s p" data-h-click="h1" data-a-click="${_ha(c.phone||'')}" title="Devolver al agente">🤖 Volver al bot</button></div>`}
function waCard(){return `<h3 style="margin:0">🤖 Agente de ventas (WhatsApp)</h3><p style="font-size:12.5px;color:var(--gris)">Responde preguntas de catálogo, precios y disponibilidad, y crea pedidos automáticamente por WhatsApp usando IA, con los datos reales de su tienda. Cuando el agente no puede resolver algo (o el cliente pide hablar con una persona), la conversación aparece abajo para que usted la continúe manualmente; mientras tanto el agente deja de responder ahí para no cruzarse con usted.</p><div id="waList">${WA.list.length?WA.list.map(waRow).join(''):'<small style="color:var(--gris)">No hay conversaciones esperando un asesor ahora mismo.</small>'}</div>`}
function waRefreshCard(){const e=$('waCard');if(!e||vista!=='config')return;e.innerHTML=waCard()}
function waHomeHTML(){return `<div class="card" id="waHome"><h3 style="margin:0">🤖 ${WA.list.length} conversación${WA.list.length==1?'':'es'} de WhatsApp esperando un asesor</h3><div>${WA.list.slice(0,5).map(waRow).join('')}</div></div>`}
function waRefreshHome(){if(vista!=='home')return;const e=$('waHome');if(!WA.list.length){if(e)e.remove();return}const w=document.createElement('div');w.innerHTML=waHomeHTML();if(!w.firstElementChild)return;if(e)e.replaceWith(w.firstElementChild);else{const v=$('v');if(v)v.insertBefore(w.firstElementChild,v.firstChild)}}
/* Las tarjetas adicionales de Configuración se renderizan en un solo lugar.
   Antes cada mejora envolvía R.config otra vez; eso hacía que el orden dependiera
   de la fecha de cada parche y volvía frágil cualquier cambio futuro. */
R.config=function(){
 const r=_configBase.apply(this,arguments);if(!esAdmin())return r;const v=$('v');if(!v)return r;
 const mkCard=(id,raw)=>{
  const c=document.createElement('div');
  c.className='card';
  c.id=id;
  const i1=raw.indexOf('<h3'),i2=raw.indexOf('</h3>');
  if(i1>=0&&i2>i1){
    const afterH3=raw.indexOf('>',i1);
    if(afterH3>=0&&afterH3<i2){
      const title=raw.slice(afterH3+1,i2);
      const body=(raw.slice(0,i1)+raw.slice(i2+5)).trim();
      c.innerHTML=wrapCardInner(id,title,body);
    }else{
      c.innerHTML=raw;
    }
  }else{
    c.innerHTML=raw;
  }
  return c;
 };
 /* Personalización y configuración web: todo lo que cambia cómo se ve la web
    (panel de entrada, tienda pública, redes y transporte) junto en la pestaña web. */
 const webCards=[
  ['xmasCard',xmasCard],['lbgCard',lbgCard],['poliCard',poliAdmCard],['redesCard',redesCard],['fleCard',fleAdmCard]
 ];
 /* El resto son ajustes internos del negocio: van a la pestaña general. */
 const genCards=[
  ['waCard',waCard],['investCard',investCard],['bkCard',bkCard],['sesCard',sesCard],['tplCard',tplCard],['recCard',recCard],
  ['vozCard',vozCard],['cintCard',cintCard],['llamCard',llamCard]
 ];
 const wEx=$('cfgWebExtra'),gEx=$('cfgGenExtra');
 webCards.forEach(([id,fn])=>{if(wEx)wEx.appendChild(mkCard(id,fn()))});
 genCards.forEach(([id,fn])=>{if(gEx)gEx.appendChild(mkCard(id,fn()))});
 lbgFill($('lbgPrev'),lbgMeta());waListen();return r
};
/* Inicio también tenía capas sucesivas. Todas sus tarjetas se agrupan aquí para
   que vendedores, administradores y la vista general sigan la misma ruta clara. */


R.mapa=function(){
 if(!esAdmin()){ir('home');return}
 $('v').innerHTML=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px"><div><h2 style="margin:0;font-size:18px;font-weight:700">🗺️ Mapa de Clientes y Comercios (Estilo Uber)</h2><small style="color:var(--gris)">Visualización tipo tablero Monopoly con cartografía de alto contraste</small></div><button class="btn" data-h-click="call" data-a-click="${_ha('ir','home')}">← Volver al Inicio</button></div><div class="mcsum" id="mcSum"></div><div class="mcbar"><input id="mcQ" placeholder="🔍 Buscar comercio o cliente por nombre, RUC o teléfono…" value="${esc(MC.q)}" data-h-input="h332"><select id="mcF" aria-label="Filtrar comercios" data-h-change="h332">${[['todos','Todos los comercios'],['compra','🟢 Con compras'],['sin','🔘 Sin compras'],['deuda','🟠 Saldo por cobrar'],['venc','🔴 Saldo vencido']].map(o=>`<option value="${o[0]}" ${MC.f===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div><div id="mcMap" class="mcmap"></div>${mcLeyenda()}</div><div class="card"><h3 style="margin:0 0 10px;font-size:15px">📋 Directorio y Estado Comercial por Cliente</h3><div class="tw" id="mcList"></div></div>`;
 mcPintar('mcMap')
};
// Selector de ubicación dentro del formulario de cliente
let _cuMap=null,_cuMk=null;
function cliMapaIniciar(){
 const el=$('cuMap');if(!el||!window.L)return;
 if(_cuMap){try{_cuMap.remove()}catch(e){window._tjw&&_tjw(e)}_cuMap=null;_cuMk=null}
 _cuMap=L.map('cuMap',{zoomControl:true});mcCapas(_cuMap,'calle');_cuMap.setView([8.9824,-79.5199],12);
 _cuMap.on('click',e=>{const i=$('cu_link');if(!i)return;i.value=e.latlng.lat.toFixed(6)+', '+e.latlng.lng.toFixed(6);delete i.dataset.acc;cliLocEstado()});
 setTimeout(()=>mapaRefrescar(_cuMap),150)
}
function cliMapSync(centrar){
 if(!_cuMap||!$('cuMap'))return;
 const l=cliLocLeer();
 if(l.lat===undefined){if(_cuMk){_cuMap.removeLayer(_cuMk);_cuMk=null}return}
 if(!_cuMk){_cuMk=L.marker([l.lat,l.lng],{draggable:true}).addTo(_cuMap);
  _cuMk.on('dragend',()=>{const p=_cuMk.getLatLng(),i=$('cu_link');if(!i)return;i.value=p.lat.toFixed(6)+', '+p.lng.toFixed(6);delete i.dataset.acc;cliLocEstado()})
 }else _cuMk.setLatLng([l.lat,l.lng]);
 if(centrar)_cuMap.setView([l.lat,l.lng],Math.max(_cuMap.getZoom(),17))
}

function homeCard(html){const w=document.createElement('div');w.innerHTML=(typeof html==='function'?html():html)||'';return w.firstElementChild}
R.home=function(){
 const v=$('v'),tienda=()=>homeCard(tdHomeHTML());
 if(esVend()){
  v.innerHTML=vdHTML(chatMe());const t=tienda();if(t)v.insertBefore(t,v.firstChild);return;
 }
 const r=_homeBase.apply(this,arguments);if(!v)return r;
 if(esAdmin()){
  const vd=homeCard(vdAdmHTML());if(vd){const op=$('homeOps')||v;op.appendChild(vd)}
 }
 const t=tienda();if(t){const op=$('homeOps')||v;op.insertBefore(t,op.firstChild)}
 if(!esAdmin())return r;
 try{
  const mc=homeCard(mcHomeHTML());
  if(mc){
    const slot=$('homeMapSlot');
    if(slot)slot.appendChild(mc);
    else{const kp=v.querySelector('.kp');if(kp)kp.insertAdjacentElement('afterend',mc);else v.appendChild(mc)}
    mcPintar('mcHomeMap');
  }
 }catch(e){window._tjw&&_tjw(e)}
 const inv=homeCard(investHomeHTML());if(inv){const op=$('homeOps')||v;op.appendChild(inv)}
 waListen();if(WA.list.length){const wa=homeCard(waHomeHTML());if(wa){const wb=$('homeWaSlot')||v;wb.insertBefore(wa,wb.firstChild)}}
 return r
};

__H.h1=function(event,a){waBack(a[0])};
__H.h2=function(event,a){investigacionAbrir()};
__H.h3=function(event,a){lbgSet('blur',+this.value)};
__H.h4=function(event,a){lbgSet('dim',+this.value)};
__H.h5=function(event,a){lbgUrl()};
__H.h6=function(event,a){lbgReset()};
__H.h7=function(event,a){lbgFile(this)};
__H.h8=function(event,a){$('lbgFile').click()};
__H.h9=function(event,a){lbgPick(a[0])};
__H.h10=function(event,a){lbgPick('aurora')};
__H.h11=function(event,a){vendSave(a[0])};
__H.h12=function(event,a){cerrar()};
__H.h13=function(event,a){adminPin()};
__H.h14=function(event,a){vendDel(a[0])};
__H.h15=function(event,a){vendForm(a[0])};
__H.h16=function(event,a){avBig(a[0])};
__H.h17=function(event,a){avBig('admin')};
__H.h18=function(event,a){vendForm()};
__H.h19=function(event,a){salir()};
__H.h20=function(event,a){authReset();return false};
__H.h21=function(event,a){authGo()};
__H.h22=function(event,a){$('au_p').type=this.checked?'text':'password'};
__H.h23=function(event,a){if(event.key==='Enter')authGo()};
__H.h24=function(event,a){location.reload()};
__H.h25=function(event,a){perfForm()};
__H.h26=function(event,a){shopPatrio()};
__H.h27=function(event,a){event.stopPropagation();shopPick(a[0])};
__H.h28=function(event,a){event.stopPropagation();shopFav(a[0])};
__H.h29=function(event,a){shopDet(a[0])};
__H.h30=function(event,a){shopTab('cart')};
__H.h31=function(event,a){shopClose()};
__H.h32=function(event,a){shopAcc()};
__H.h33=function(event,a){shopPdf(SH.last)};
__H.h34=function(event,a){shopImgVer(SH.last)};
__H.h35=function(event,a){shopOrdAct(a[0])};
__H.h36=function(event,a){shopOrdAct(a[0],'img')};
__H.h37=function(event,a){shopAskReg()};
__H.h38=function(event,a){shopCodeResend()};
__H.h39=function(event,a){shopCodeVerify()};
__H.h40=function(event,a){shopCart()};
__H.h41=function(event,a){shopRegSend()};
__H.h42=function(event,a){shopSend()};
__H.h43=function(event,a){shopQty(a[0],1)};
__H.h44=function(event,a){shopPick(a[0],'cart')};
__H.h45=function(event,a){shopQty(a[0],-1)};
__H.h46=function(event,a){shopDel(a[0])};
__H.h47=function(event,a){shopPick(a[0])};
__H.h48=function(event,a){shopShare(a[0])};
__H.h49=function(event,a){shopFav(a[0])};
__H.h50=function(event,a){shopZoom(a[0])};
__H.h51=function(event,a){shopClose();shopTemaId(this.dataset.k)};
__H.h52=function(event,a){shopToastGo()};
__H.h53=function(event,a){shopDel(a[0],'pick')};
__H.h54=function(event,a){shopPickOk()};
__H.h55=function(event,a){shopPickSet(SH.pq+1)};
__H.h56=function(event,a){this.select()};
__H.h57=function(event,a){shopPickSet(this.value,1)};
__H.h58=function(event,a){shopPickSet(SH.pq-1)};
__H.h59=function(event,a){shopPickSet(a[0])};
__H.h60=function(event,a){shopTab('acc')};
__H.h61=function(event,a){shopTab(a[0])};
__H.h62=function(event,a){shopClear()};
__H.h63=function(event,a){shopView()};
__H.h64=function(event,a){SH.sort=this.value;shopGrid(1)};
__H.h65=function(event,a){shopFilterSheetReset()};
__H.h66=function(event,a){shopFilterSheetApply()};
__H.h67=function(event,a){shopFilterSheetSel(a[0])};
__H.h68=function(event,a){shopFilterSheetAll()};
__H.h69=function(event,a){shopFilterSheetAvail(a[0])};
__H.h70=function(event,a){shopSel(a[0])};
__H.h71=function(event,a){shopSel(-1)};
__H.h72=function(event,a){shopAvail(a[0])};
__H.h73=function(event,a){shopPrice('maxPrice',this.value)};
__H.h74=function(event,a){shopPrice('minPrice',this.value)};
__H.h75=function(event,a){event.stopPropagation();shopHeroGo(a[0])};
__H.h76=function(event,a){event.stopPropagation();shopHeroGo(SH.heroI+1)};
__H.h77=function(event,a){event.stopPropagation();shopHeroGo(SH.heroI-1)};
__H.h78=function(event,a){shopTemaId(a[0])};
__H.h79=function(event,a){shopDNavGo('home');document.getElementById('sh_g').scrollIntoView({behavior:'smooth',block:'start'})};
__H.h80=function(event,a){shopFilterSheet()};
__H.h81=function(event,a){shopQ('');$('sh_q').value='';$('sh_q').focus()};
__H.h82=function(event,a){shopQ(this.value)};
__H.h83=function(event,a){shopMenu()};
__H.h84=function(event,a){ir('tienda')};
__H.h85=function(event,a){window.open(tdLink(),'_blank')};
__H.h86=function(event,a){tdEstado(a[0])};
__H.h87=function(event,a){tdFactura(a[0])};
__H.h88=function(event,a){tdDelDo(a[0],1)};
__H.h89=function(event,a){tdDelDo(a[0],0)};
__H.h90=function(event,a){tdMarcar(this)};
__H.h91=function(event,a){tdGrpT(this)};
__H.h92=function(event,a){tdMarcarVis()};
__H.h93=function(event,a){tdFiltro('falt')};
__H.h94=function(event,a){tdFiltro('pub')};
__H.h95=function(event,a){tdFiltro('todos')};
__H.h96=function(event,a){tdDel(a[0])};
__H.h97=function(event,a){tdZoom(a[0])};
__H.h98=function(event,a){tdTmSum(a[0])};
__H.h99=function(event,a){linksRefresh()};
__H.h100=function(event,a){window.open(tdLink()+'&dir=1','_blank')};
__H.h101=function(event,a){paletaSet(a[0])};
__H.h102=function(event,a){heroModeSet(a[0])};
__H.h103=function(event,a){temaSet(a[0])};
__H.h104=function(event,a){tdBadgeSet(a[0])};
__H.h105=function(event,a){tdStockSet(a[0],this.value)};
__H.h106=function(event,a){tdLeadDel(a[0])};
__H.h107=function(event,a){tdPedDel(a[0])};
__H.h108=function(event,a){shopPdf(TD.peds.find(x=>x.id===a[0]))};
__H.h109=function(event,a){shopPdf(TD.peds.find(x=>x.id===a[0]),'ver')};
__H.h337=function(event,a){etqAbrir(a[0])};
__H.h338=function(event,a){etqImprimirUno(a[0])};
__H.h339=function(event,a){etqToggle(a[0],this.checked)};
__H.h340=function(event,a){etqSelModo(a[0])};
__H.h341=function(event,a){etqAbrirLote()};
__H.h342=function(event,a){etqImprimirLote()};
__H.h343=function(event,a){etqTipoCambio()};
__H.h345=function(event,a){fleToggle(a[0],this.checked)};
__H.h346=function(event,a){fleElegirFoto(a[0])};
__H.h347=function(event,a){fleQuitarFoto(a[0])};
__H.h348=function(event,a){fleTodos(a[0])};
__H.h349=function(event,a){fleEliminar(a[0])};
__H.h350=function(event,a){fleSubirFoto(this)};
__H.h351=function(event,a){fleAgregar()};
__H.h352=function(event,a){shopFleCambio(this.value)};
__H.h353=function(event,a){shopEvSet(this.id,this.value)};
__H.h354=function(event,a){shopEvYo(this.checked)};
__H.h110=function(event,a){tdSendCli()};
__H.h111=function(event,a){tdWaLink()};
__H.h112=function(event,a){tdCopy()};
__H.h113=function(event,a){tdUnpub()};
__H.h114=function(event,a){tdPub()};
__H.h115=function(event,a){tdStockAplicar()};
__H.h116=function(event,a){tdBadgeBulk(0)};
__H.h117=function(event,a){tdBadgeBulk(1)};
__H.h118=function(event,a){tdTemaAplicar(0)};
__H.h119=function(event,a){tdTemaAplicar(1)};
__H.h120=function(event,a){tdMin()};
__H.h121=function(event,a){tplMin()};
__H.h122=function(event,a){vdDetail(a[0])};
__H.h123=function(event,a){vdShareCopy()};
__H.h124=function(event,a){vdShareMail()};
__H.h125=function(event,a){vdShareWa()};
__H.h126=function(event,a){window.open(a[0],'_blank','noopener,noreferrer')};
__H.h127=function(event,a){vdSet(a[0])};
__H.h128=function(event,a){facCobrar(a[0],1)};
__H.h129=function(event,a){facCobrar(a[0],0)};
__H.h130=function(event,a){imprimir(a[0])};
__H.h131=function(event,a){verTpl(a[0],this.value)};
__H.h132=function(event,a){vfMax()};
__H.h133=function(event,a){vfZoom(1)};
__H.h134=function(event,a){vfZoom(-1)};
__H.h135=function(event,a){tplPrev()};
__H.h136=function(event,a){DB.cfg.sello=+this.value;save();tplRef()};
__H.h137=function(event,a){tplSet(a[0])};
__H.h138=function(event,a){chatMkGrp()};
__H.h139=function(event,a){chatSend()};
__H.h140=function(event,a){setTimeout(()=>{this.scrollIntoView({block:'end',behavior:'smooth'});const b=$('chms');if(b)b.scrollTop=b.scrollHeight},300)};
__H.h141=function(event,a){if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();chatSend()}};
__H.h142=function(event,a){emoToggle()};
__H.h143=function(event,a){chatDelGrp(a[0])};
__H.h144=function(event,a){llamar(a[0])};
__H.h145=function(event,a){chatBack()};
__H.h146=function(event,a){chatNewGrp()};
__H.h147=function(event,a){chatOpen(a[0])};
__H.h148=function(event,a){vozReset()};
__H.h149=function(event,a){DB.cfg.vozTono=+this.value;save();vozProbar()};
__H.h150=function(event,a){DB.cfg.vozVel=+this.value;save();vozProbar()};
__H.h151=function(event,a){DB.cfg.vozNom=this.value;DB.cfg.vozPerf='manual';$('vz_p').value='manual';save();vozProbar()};
__H.h152=function(event,a){DB.cfg.vozPerf=this.value;delete DB.cfg.vozVel;delete DB.cfg.vozTono;save();vozReset(1);vozProbar()};
__H.h153=function(event,a){emoPut(this.textContent)};
__H.h154=function(event,a){chatSticker(a[0],a[1])};
__H.h155=function(event,a){emoTab(9)};
__H.h156=function(event,a){emoTab(a[0])};
__H.h157=function(event,a){perfSave()};
__H.h158=function(event,a){PF={e:'',a:'bounce',img:''};perfSave()};
__H.h159=function(event,a){perfFile(this)};
__H.h160=function(event,a){PF.a=this.value;perfPrev()};
__H.h161=function(event,a){PF.e=this.dataset.e;PF.img='';perfPrev()};
__H.h162=function(event,a){llamProbarMic()};
__H.h163=function(event,a){DB.cfg.turnCred=this.value.trim();save()};
__H.h164=function(event,a){DB.cfg.turnUser=this.value.trim();save()};
__H.h165=function(event,a){DB.cfg.turnUrl=this.value.trim();save()};
__H.h166=function(event,a){DB.cfg.llamOn=+this.value;save()};
__H.h167=function(event,a){llamSalida(this.value)};
__H.h168=function(event,a){llamCuelga()};
__H.h169=function(event,a){llamVol()};
__H.h170=function(event,a){llamMute()};
__H.h171=function(event,a){llamAcepta()};
__H.h172=function(event,a){llamRechazar()};
__H.h173=function(event,a){vozProbarChat()};
__H.h174=function(event,a){vozProbar()};
__H.h175=function(event,a){DB.cfg.vozChat=+this.value;save()};
__H.h176=function(event,a){DB.cfg.vozCobro=+this.value;save()};
__H.h177=function(event,a){galDel(a[0])};
__H.h178=function(event,a){galEdit(a[0])};
__H.h179=function(event,a){galVer(a[0])};
__H.h180=function(event,a){galAdd(this,0)};
__H.h181=function(event,a){galAdd(this,1)};
__H.h182=function(event,a){$('gal_u').click()};
__H.h183=function(event,a){$('gal_c').click()};
__H.h184=function(event,a){bkImport(this.files[0])};
__H.h185=function(event,a){$('bk_f').click()};
__H.h186=function(event,a){bkExport()};
__H.h187=function(event,a){sesSet(this.value)};
__H.h188=function(event,a){recDel(a[0])};
__H.h189=function(event,a){recAdd()};
__H.h190=function(event,a){setRec(a[0])};
__H.h191=function(event,a){waCli(a[0])};
__H.h192=function(event,a){pcat()};
__H.h193=function(event,a){shareCat(this)};
__H.h194=function(event,a){pdfCat()};
__H.h195=function(event,a){desc(a[0])};
__H.h196=function(event,a){catAutoDo()};
__H.h197=function(event,a){catTg(this)};
__H.h198=function(event,a){delF(a[0])};
__H.h199=function(event,a){facC(a[0])};
__H.h200=function(event,a){edC(a[0])};
__H.h201=function(event,a){ver(a[0])};
__H.h202=function(event,a){catSet(a[0],this.value)};
__H.h203=function(event,a){return ckToggle(event,a[0],'sac','Sacado')};
__H.h204=function(event,a){return ckToggle(event,a[0],'acot','Acotejado')};
__H.h205=function(event,a){impCatFile(this)};
__H.h206=function(event,a){document.getElementById('impCatInput').click()};
__H.h207=function(event,a){descTodoImg('png')};
__H.h208=function(event,a){descTodoImg('jpg')};
__H.h209=function(event,a){expCatBackup()};
__H.h210=function(event,a){comprimirCatalogo()};
__H.h211=function(event,a){catAutoPrev()};
__H.h212=function(event,a){impCat()};
__H.h213=function(event,a){cc=this.value;dib()};
__H.h214=function(event,a){cq=this.value;dib()};
__H.h215=function(event,a){subir(this.files)};
__H.h216=function(event,a){event.preventDefault();this.classList.remove('ov');subir(event.dataTransfer.files)};
__H.h217=function(event,a){this.classList.remove('ov')};
__H.h218=function(event,a){event.preventDefault();this.classList.add('ov')};
__H.h219=function(event,a){$('fi2').click()};
__H.h220=function(event,a){$('u_cat').value=a[0]};
__H.h221=function(event,a){imgTargetKB()};
__H.h222=function(event,a){mandar()};
__H.h223=function(event,a){envPdf()};
__H.h224=function(event,a){delE(a[0])};
__H.h225=function(event,a){crU=this.value;pgVence()};
__H.h226=function(event,a){crN=Math.floor(+this.value)||0;pgVence()};
__H.h227=function(event,a){pgResto()};
__H.h228=function(event,a){mix.push({m:'Efectivo',v:''});pgUI()};
__H.h229=function(event,a){mix.splice(a[0],1);pgUI()};
__H.h230=function(event,a){mix[a[0]].v=this.value;pgSum()};
__H.h231=function(event,a){mix[a[0]].m=this.value;pgUI()};
__H.h232=function(event,a){items.splice(a[0],1);if(!items.length)items=[{}];filas()};
__H.h233=function(event,a){items[a[0]].p=+this.value;calc()};
__H.h234=function(event,a){items[a[0]].q=+this.value;calc()};
__H.h235=function(event,a){items[a[0]].d=this.value};
__H.h236=function(event,a){selP(a[0],this.value)};
__H.h237=function(event,a){delFac(a[0])};
__H.h238=function(event,a){anular(a[0])};
__H.h239=function(event,a){envFactura(a[0])};
__H.h240=function(event,a){shareFacChat(a[0])};
__H.h241=function(event,a){shareFac(a[0],this)};
__H.h242=function(event,a){facPDF(a[0],this)};
__H.h243=function(event,a){verFactura(a[0])};
__H.h244=function(event,a){repMail(this)};
__H.h245=function(event,a){repWA(this)};
__H.h246=function(event,a){repPDF(this)};
__H.h247=function(event,a){cintSet('cintDias',+this.value)};
__H.h248=function(event,a){cintSet('cintSeg',+this.value)};
__H.h249=function(event,a){$('cs_v').textContent=this.value};
__H.h250=function(event,a){cintSet('cintOn',+this.value)};
__H.h251=function(event,a){cintSet(a[0],this.checked?1:0)};
__H.h252=function(event,a){_cintPause=Date.now()+10000;cintGoTo(a[0])};
__H.h253=function(event,a){cintGo('check')};
__H.h254=function(event,a){cintGo('cat')};
__H.h255=function(event,a){cintGo('ag',a[0],a[1])};
__H.h256=function(event,a){agSave(a[0])};
__H.h257=function(event,a){agCli()};
__H.h258=function(event,a){agForm(null,a[0])};
__H.h259=function(event,a){agForm()};
__H.h260=function(event,a){agSel(a[0])};
__H.h261=function(event,a){agDel(a[0])};
__H.h262=function(event,a){agWA(a[0],a[1])};
__H.h263=function(event,a){agForm(a[0])};
__H.h264=function(event,a){agDone(a[0],a[1])};
__H.h265=function(event,a){agIcs()};
__H.h266=function(event,a){cfgSnd('snd',DB.cfg.snd?0:1);R.agenda()};
__H.h267=function(event,a){agC(this.value)};
__H.h268=function(event,a){agQ(this.value)};
__H.h269=function(event,a){agHoy()};
__H.h270=function(event,a){agMove(1)};
__H.h271=function(event,a){agMove(-1)};
__H.h272=function(event,a){agView(a[0])};
__H.h273=function(event,a){restaurarResp()};
__H.h274=function(event,a){respaldo()};
__H.h275=function(event,a){navReset()};
__H.h276=function(event,a){navEdit()};
__H.h277=function(event,a){agPerm()};
__H.h278=function(event,a){agTest()};
__H.h279=function(event,a){agSound(true)};
__H.h280=function(event,a){save();agSound(true)};
__H.h281=function(event,a){DB.cfg.vol=+this.value;$('volv').textContent=this.value+'%'};
__H.h282=function(event,a){cfgSnd('tono',this.value)};
__H.h283=function(event,a){cfgSnd('snd',+this.value)};
__H.h284=function(event,a){addE()};
__H.h285=function(event,a){toggleEditE(false)};
__H.h286=function(event,a){toggleEditE(true)};
__H.h287=function(event,a){ir('config')};
__H.h288=function(event,a){cfg()};
__H.h289=function(event,a){toggleEditCfg(true)};
__H.h290=function(event,a){tema(a[0]);R.config()};
__H.h291=function(event,a){delUbi(a[0])};
__H.h292=function(event,a){centrarUbi(a[0])};
__H.h293=function(event,a){ubiFull(1)};
__H.h294=function(event,a){ubiFull(0)};
__H.h295=function(event,a){ubiLinkGo('ver','ubiLink2')};
__H.h296=function(event,a){if(event.key==='Enter')ubiLinkGo('ver','ubiLink2')};
__H.h297=function(event,a){exportUbiCSV()};
__H.h298=function(event,a){centrarEnMi()};
__H.h299=function(event,a){capturarUbicacion()};
__H.h300=function(event,a){ubiLinkGo('guardar')};
__H.h301=function(event,a){ubiLinkGo('abrir')};
__H.h302=function(event,a){ubiLinkGo('ver')};
__H.h303=function(event,a){toggleUbiOtro()};
__H.h304=function(event,a){delC(a[0])};
__H.h305=function(event,a){editC(a[0])};
__H.h306=function(event,a){addC()};
__H.h329=function(event,a){cliLocGPS()};
__H.h330=function(event,a){cliLocInput()};
__H.h331=function(event,a){cliLocAbrir()};
__H.h332=function(event,a){MC.q=($('mcQ')||{}).value||'';MC.f=($('mcF')||{}).value||'todos';mcCapa('mcMap',true)};
__H.h333=function(event,a){mcIr(a[0])};
__H.h334=function(event,a){ir('mapa')};
__H.h335=function(event,a){redesGuardar()};
__H.h336=function(event,a){RS_DRAFT[this.id]=this.value;RS_MSG=null;const e=$('rs_est');if(e)e.textContent=''};
__H.h307=function(event,a){delP(a[0])};
__H.h308=function(event,a){editP(a[0])};
__H.h309=function(event,a){addP()};
__H.h310=function(event,a){emitir()};
__H.h311=function(event,a){items=[{}];R.nueva()};
__H.h312=function(event,a){calc()};
__H.h313=function(event,a){items.push({});filas()};
__H.h314=function(event,a){pgUI()};
__H.h315=function(event,a){selCli()};
__H.h316=function(event,a){pgVence()};
__H.h317=function(event,a){ir('home')};
__H.h318=function(event,a){toggleCard('cfg')};
__H.h319=function(event,a){toggleCard('email')};
__H.h320=function(event,a){demoData()};
__H.h321=function(event,a){envReporte()};
__H.h322=function(event,a){ir('cli')};
__H.h323=function(event,a){ir('prod')};
__H.h324=function(event,a){ir('nueva')};
__H.h325=function(event,a){perVentas(a[0])};
__H.h326=function(event,a){navMv(event,a[0],1)};
__H.h327=function(event,a){navMv(event,a[0],-1)};
__H.h328=function(event,a){navClick(a[0])};
__H.call=function(event,a){var fn=window[a[0]];if(typeof fn==="function"){return fn.apply(this,a.slice(1))}};
__H.enviarFacChat=function(event,a){enviarFacAChat(a[0],a[1])};
__H.hs1=function(event,a){respaldo()};
__H.hs2=function(event,a){navEdit()};
__H.hs3=function(event,a){tema(this.value)};
__H.hs4=function(event,a){if(event.target===this)cerrar()};


/* Handlers del módulo TJ LIVE */
__H.h360=function(){tjLiveSaveDraft()};
__H.h361=function(){tjLiveScript()};
__H.h362=function(){
 const t=($('tjl_script')||{}).value||'';
 if(!t){const e=$('tjl_status');if(e)e.textContent='Genera o escribe un guion antes de copiarlo.';return}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>{const e=$('tjl_status');if(e)e.textContent='Guion copiado.'}).catch(()=>{const e=$('tjl_status');if(e)e.textContent='No se pudo copiar automáticamente; selecciona el texto y cópialo manualmente.'});
 else {const e=$('tjl_script');if(e){e.focus();e.select()}const x=$('tjl_status');if(x)x.textContent='Selecciona el guion y cópialo manualmente.'}
};
__H.h363=function(){tjLiveOpen('https://www.tiktok.com/')};
__H.h364=function(){tjLiveOpen('https://www.tiktok.com/studio/download')};
__H.h355=function(){ir('nueva')};


/* Barra lateral del panel: nombre y eslogan de la empresa activa desde el primer pintado (la copia local de DB ya está cargada). */
try{if(!SHOP)panelMarcaApply()}catch(e){window._tjw&&_tjw(e)}
