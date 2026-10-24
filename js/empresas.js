/* ===== Módulo Empresas (Fase 3 del plan multiempresa) =====
   Registro de empresas propias y sus dominios, con Tarjetería Jhon como empresa
   inicial ya registrada (sin duplicar sus datos: solo metadatos).

   GARANTÍA DE AISLAMIENTO: este archivo solo escribe en las colecciones NUEVAS
   `empresas` y `dominios` (lo verifica estáticamente tests/multiempresa.test.js).
   No toca ninguna colección existente del panel ni de la tienda.

   Se carga antes que app.js; usa sus globals ($, esc, _ha, esAdmin, fbDb) solo
   al momento de renderizar, nunca al cargarse. */
'use strict';
var EM={list:[],tab:'lista',edit:null,domEmp:'',msg:null};
var _emOn=false;

/* ---------- Validadores (puros, testeables en Node) ---------- */
function empNormSlug(txt){
 var s=String(txt==null?'':txt).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
 return typeof TJEmpresa!=='undefined'&&TJEmpresa.empSlugOk(s)?s:(s?'x'+s:'');
}
function empColorOk(c){return /^#[0-9a-fA-F]{6}$/.test(String(c||''))}
function empHostOk(h){
 h=String(h||'').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0].replace(/\.$/,'');
 return /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})*\.[a-z]{2,}$/.test(h)?h:'';
}
/* Sanitiza el formulario de empresa → objeto seguro o {err:'mensaje'} */
function empSan(data,existente){
 var d=data&&typeof data==='object'?data:{};
 var nombre=String(d.nombre==null?'':d.nombre).replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,60);
 if(nombre.length<2)return {err:'Escriba el nombre de la empresa (mínimo 2 letras).'};
 var slug=d.slug===undefined||d.slug===null||d.slug===''?empNormSlug(nombre):String(d.slug).trim();
 if(!TJEmpresa.empSlugOk(slug))return {err:'El identificador (slug) debe tener 3-40 caracteres: minúsculas, números y guiones.'};
 var color=empColorOk(d.color)?d.color:'#E0457B';
 var color2=empColorOk(d.color2)?d.color2:'#0F6CBD';
 var tel=String(d.tel==null?'':d.tel).replace(/[\u0000-\u001f<>]/g,' ').trim().slice(0,25);
 var email=String(d.email==null?'':d.email).trim().slice(0,120);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {err:'El correo de contacto no es válido.'};
 var estado=d.estado==='pausa'?'pausa':'activa';
 return {id:slug,slug:slug,nombre:nombre,logo:String(d.logo||'').slice(0,300),color:color,color2:color2,
  contacto:{tel:tel,email:email},estado:estado,ts:Date.now()};
}

/* ---------- Datos en la nube (solo colecciones empresas / dominios) ---------- */
function empresasListen(){
 if(_emOn||typeof fbDb==='undefined'||!fbDb)return;
 if(typeof esAdmin==='function'&&!esAdmin())return;
 _emOn=true;
 try{
  fbDb.collection('empresas').onSnapshot(function(sn){
   EM.list=sn.docs.map(function(x){return x.data()}).filter(Boolean)
    .sort(function(a,b){return (a.ts||0)-(b.ts||0)});
   if(typeof vista!=='undefined'&&vista==='empresas'&&typeof R!=='undefined'&&R.empresas)R.empresas();
  },function(err){
   window._tjw&&window._tjw(err);
   EM.msg={ok:false,t:'No se pudo leer la colección "empresas". ¿Desplegó las reglas actualizadas? (ver docs/ESQUEMA-MULTIEMPRESA.md)'};
   if(typeof vista!=='undefined'&&vista==='empresas'&&typeof R!=='undefined'&&R.empresas)R.empresas();
  })
 }catch(e){window._tjw&&window._tjw(e)}
}

/* Registra la empresa inicial (idempotente) si aún no existe en la colección. */
function empInicialRegistrar(){
 if(typeof fbDb==='undefined'||!fbDb||typeof esAdmin!=='function'||!esAdmin())return;
 try{
  var ref=fbDb.collection('empresas').doc(TJEmpresa.EMPRESA_DEF.id);
  ref.get().then(function(d){
   if(d.exists)return;
   return ref.set({id:TJEmpresa.EMPRESA_DEF.id,slug:TJEmpresa.EMPRESA_DEF.id,nombre:TJEmpresa.EMPRESA_DEF.nombre,
    logo:'',color:'#E0457B',color2:'#0F6CBD',contacto:{tel:'',email:''},estado:'activa',inicial:true,ts:Date.now()});
  }).catch(function(){/* reglas sin desplegar: el módulo muestra su aviso */});
 }catch(e){window._tjw&&window._tjw(e)}
}

function empGuardar(){
 if(typeof esAdmin==='function'&&!esAdmin())return alert('Solo el administrador puede gestionar empresas.');
 if(typeof fbDb==='undefined'||!fbDb)return alert('Sin conexión con Firebase. Intente de nuevo en un momento.');
 var v=function(id){var e=typeof $==='function'?$(id):null;return e?e.value:''};
 var raw={nombre:v('em_nombre'),slug:EM.edit?EM.edit.id:v('em_slug'),logo:v('em_logo'),
  color:v('em_color'),color2:v('em_color2'),tel:v('em_tel'),email:v('em_email'),
  estado:EM.edit&&EM.edit.estado==='pausa'?'pausa':'activa'};
 var d=empSan(raw);
 if(d.err)return alert(d.err);
 if(EM.list.length>=20&&!EM.list.some(function(x){return x.id===d.id}))
  return alert('Ya llegó al máximo de 20 empresas previsto por ahora.');
 var nueva=!EM.list.some(function(x){return x.id===d.id});
 fbDb.collection('empresas').doc(d.id).set(d,{merge:true}).then(function(){
  if(nueva)empCrearDemo(d);
  EM.edit=null;EM.msg={ok:true,t:'✔ Empresa guardada.'+(nueva?' Se creó su tienda de muestra con 3 productos de ejemplo (todo editable en Configuración → Plantilla de la web).':'')};R.empresas();
 }).catch(function(e){window._tjw&&window._tjw(e);alert('No se pudo guardar. Revise su conexión o las reglas de Firestore.')});
}
function empEditar(id){
 var e=EM.list.find(function(x){return x&&x.id===id});if(!e)return;
 EM.edit=e;EM.tab='form';if(typeof R!=='undefined'&&R.empresas)R.empresas();
}
function empNueva(){EM.edit=null;EM.tab='form';if(typeof R!=='undefined'&&R.empresas)R.empresas()}
function empEstado(id,estado){
 if(typeof fbDb==='undefined'||!fbDb)return;
 fbDb.collection('empresas').doc(id).set({estado:estado,ts:Date.now()},{merge:true}).catch(function(){alert('No se pudo cambiar el estado.')});
}
function empActivar(id){
 if(!TJEmpresa.empSet(id))return alert('Identificador de empresa no válido.');
 if(TJEmpresa.MULTIEMP){
  /* Con la separación activa, cambiar de empresa exige recarga limpia:
     purga la DB en memoria y las claves quedan particionadas (lsk/empLSKey). */
  try{sessionStorage.setItem('tj_emp_swap','1')}catch(e){}
  location.href=location.pathname+'?emp='+encodeURIComponent(id);
  return;
 }
 var aviso='Preferencia guardada. La separación real de datos por empresa se activa tras aprobar la migración (Fase 6-7 del plan); mientras tanto el panel sigue mostrando los datos de Tarjetería Jhon.';
 EM.msg={ok:true,t:aviso};
 if(typeof R!=='undefined'&&R.empresas)R.empresas();
}
function empCancelar(){EM.edit=null;EM.tab='lista';if(typeof R!=='undefined'&&R.empresas)R.empresas()}

/* Nombre comercial de la empresa activa (para textos de login, tienda, políticas
   y factura — ninguna empresa nueva debe heredar el nombre de Tarjetería Jhon). */
function empNombreActiva(){
 try{
  var a=TJEmpresa.empActiva();
  var e=(EM.list||[]).find(function(x){return x&&x.id===a});
  return (e&&e.nombre)||'';
 }catch(x){return ''}
}
/* Imagen de demostración (SVG embebido, sin archivos externos). */
function empDemoImg(nombre,n){
 var inicial=(nombre||'?').charAt(0).toUpperCase();
 var svg='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">'+
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>'+
  '<rect width="800" height="800" fill="url(#g)"/>'+
  '<text x="400" y="380" font-family="Segoe UI,sans-serif" font-size="210" font-weight="700" fill="#ffffff" text-anchor="middle">'+inicial+'</text>'+
  '<text x="400" y="480" font-family="Segoe UI,sans-serif" font-size="42" fill="rgba(255,255,255,.9)" text-anchor="middle">Producto de ejemplo '+(n+1)+'</text>'+
  '<text x="400" y="536" font-family="Segoe UI,sans-serif" font-size="28" fill="rgba(255,255,255,.7)" text-anchor="middle">Cambie esta imagen desde su catálogo</text></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
/* Logo cuadrado de demostración con la inicial de la empresa. */
function empDemoLogo(nombre){
 var inicial=(nombre||'?').charAt(0).toUpperCase();
 var svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">'+
  '<rect width="400" height="400" rx="80" fill="#14161c"/>'+
  '<text x="200" y="255" font-family="Segoe UI,sans-serif" font-size="190" font-weight="700" fill="#ffffff" text-anchor="middle">'+inicial+'</text></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
/* Banner panorámico de demostración (1200×600). */
function empDemoBanner(nombre){
 var svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">'+
  '<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>'+
  '<rect width="1200" height="600" fill="url(#b)"/>'+
  '<text x="600" y="300" font-family="Segoe UI,sans-serif" font-size="64" font-weight="700" fill="#ffffff" text-anchor="middle">'+(nombre||'Su empresa')+'</text>'+
  '<text x="600" y="370" font-family="Segoe UI,sans-serif" font-size="34" fill="rgba(255,255,255,.85)" text-anchor="middle">Banner de ejemplo · cámbielo en Configuración → Plantilla de la web</text></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
/* Contenido de muestra de una empresa NUEVA: plantilla con SU nombre, banner y
   logo demo, 3 productos de ejemplo y SIN nada de Tarjetería Jhon. Todo
   editable/borrable después. Solo usa colecciones por empresa ya permitidas. */
function empCrearDemo(d){
 try{
  if(typeof fbCol!=='function'||!fbCol)return;
  var ts=Date.now();
  fbCol('tienda_items').doc('__cfg').set({__cfg:true,empresaNombre:d.nombre,
   heroTitle:d.nombre,
   heroSub:'Bienvenido a '+d.nombre+' · Coloque aquí su eslogan en Configuración → Plantilla de la web',
   heroBgType:'photo',heroPhotoUrl:empDemoBanner(d.nombre),
   wordmark:d.nombre.slice(0,14),
   banners:[{id:'demo_b1',src:empDemoBanner(d.nombre)}],
   btnRadio:999,demo:1,ts:ts},{merge:true}).catch(function(){});
  for(var i=0;i<3;i++){
   fbCol('tienda_items').doc('demo_'+(i+1)).set({id:'demo_'+(i+1),
    name:'Producto de ejemplo '+(i+1),cat:'Demo',price:0,
    desc:'Producto de demostración de '+d.nombre+'. Edítelo o publíquelo cuando tenga el suyo.',
    img:empDemoImg(d.nombre,i),tags:[],stock:'ok',badges:[],ts:ts+i,demo:1}).catch(function(){});
  }
  fbCol('panel').doc('data').set({cfg:{nombre:d.nombre,
   loginTitulo:d.nombre,loginDesc:'Coloque la descripción de su empresa (Configuración → Inicio de sesión)',
   loginLogoSrc:empDemoLogo(d.nombre),loginLogoKind:'image'},demo:1},{merge:true}).catch(function(){});
 }catch(e){window._tjw&&window._tjw(e)}
}

/* Dominios: solo metadatos. La verificación DNS/HTTPS llega en la Fase 9. */
function empDomGuardar(){
 if(typeof esAdmin==='function'&&!esAdmin())return alert('Solo el administrador puede gestionar dominios.');
 if(typeof fbDb==='undefined'||!fbDb)return alert('Sin conexión con Firebase.');
 var eid=EM.domEmp||(EM.list[0]&&EM.list[0].id);
 if(!eid)return alert('Primero registre al menos una empresa.');
 var host=empHostOk((typeof $==='function'?$('em_host')||{value:''}:{value:''}).value);
 if(!host)return alert('Escriba un dominio válido, por ejemplo tienda.suempresa.com');
 var tipo=(typeof $==='function'&&$('em_tipo'))?$('em_tipo').value:'sub';
 if(tipo!=='sub'&&tipo!=='propio')tipo='sub';
 var listado=EM.list.filter(function(x){return x&&x.id===eid})[0];
 var previos=(listado&&listado.dominios)||[];
 if(previos.length>=10)return alert('Máximo 10 dominios por empresa.');
 fbDb.collection('dominios').doc(host).set({host:host,empresaId:eid,tipo:tipo,verificado:false,estado:'pendiente',ts:Date.now()})
  .then(function(){EM.msg={ok:true,t:'✔ Dominio registrado (verificación DNS: Fase 9 del plan).'};R.empresas()})
  .catch(function(){alert('No se pudo guardar el dominio. Revise conexión o reglas.')});
}
function empDomQuitar(host){
 if(typeof fbDb==='undefined'||!fbDb||!confirm('¿Quitar el dominio '+host+'?'))return;
 fbDb.collection('dominios').doc(host).delete().catch(function(){alert('No se pudo quitar el dominio.')});
}

/* ---------- Vista (asignada a R.empresas desde app.js) ---------- */
function empresasRender(){
 if(typeof esAdmin==='function'&&!esAdmin())return;
 if(typeof esAdmin==='function'&&esAdmin()){empresasListen();
  /* La empresa inicial se registra sola la primera vez que un administrador
     abre esta vista (es idempotente: solo crea el documento si no existe). */
  if(!window._emIniW){window._emIniW=1;empInicialRegistrar()}
 }
 var $id=function(x){return typeof $==='function'?$(x):null};
 var tab=function(k,l){return '<button class="btn s'+(EM.tab===k?' p':'')+'" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empTab',k):'')+'">'+l+'</button>'};
 var activa=TJEmpresa.empActiva();
 var banner=EM.msg?'<div class="nota" style="color:'+(EM.msg.ok?'#1e7a43':'#b3261e')+'">'+EM.msg.t+'</div>':'';
 var cab='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">'
  +'<div><h3 style="margin:0 0 2px">🏢 Empresas</h3><small style="color:var(--gris)">Administre sus negocios propios y sus dominios web. Empresa activa: <b>'+ (typeof esc==='function'?esc(activa):activa) +'</b>'
  +(TJEmpresa.MULTIEMP?'':' · modo preparación (los datos siguen unidos hasta la migración aprobada)')+'</small></div>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+tab('lista','🏢 Empresas')+tab('dominios','🌐 Dominios')+tab('migracion','🧪 Migración (simulación)')+'</div></div>'+banner;

 var body='';
 if(EM.tab==='form'){
  var e=EM.edit||{};
  var v=function(k,dflt){return typeof esc==='function'?esc(e[k]!=null&&k!=='contacto'?e[k]:(dflt||'')):(dflt||'')};
  body='<div class="g" style="margin-top:12px">'
   +'<div><label>Nombre comercial *</label><input id="em_nombre" value="'+v('nombre')+'" maxlength="60" placeholder="Ej. Dulcería La Central"></div>'
   +'<div><label>Identificador (slug)'+(EM.edit?' — no se puede cambiar':'')+'</label><input id="em_slug" value="'+v('slug')+'" maxlength="40" placeholder="se genera del nombre"'+(EM.edit?' disabled':'')+'></div>'
   +'<div><label>Logo (URL de imagen)</label><input id="em_logo" value="'+v('logo')+'" maxlength="300" placeholder="https://... (opcional)"></div>'
   +'<div><label>Color principal</label><input id="em_color" type="color" value="'+(e.color||'#E0457B')+'" style="height:42px;padding:2px"></div>'
   +'<div><label>Color secundario</label><input id="em_color2" type="color" value="'+(e.color2||'#0F6CBD')+'" style="height:42px;padding:2px"></div>'
   +'<div><label>Teléfono</label><input id="em_tel" value="'+(e.contacto?e.contacto.tel:'')+'" maxlength="25"></div>'
   +'<div><label>Correo</label><input id="em_email" value="'+(e.contacto?e.contacto.email:'')+'" maxlength="120"></div>'
   +'</div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn p" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empGuardar'):'')+'">💾 Guardar empresa</button>'
   +'<button class="btn" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empCancelar'):'')+'">Cancelar</button></div>';
 }else if(EM.tab==='dominios'){
  var opts=EM.list.map(function(x){return '<option value="'+(typeof esc==='function'?esc(x.id):x.id)+'"'+(EM.domEmp===x.id?' selected':'')+'>'+ (typeof esc==='function'?esc(x.nombre||x.id):x.id)+'</option>'}).join('');
  body='<p style="font-size:12.5px;color:var(--gris);margin-top:12px">Asocie subdominios o dominios propios a cada empresa. Por ahora es solo registro: la verificación DNS, HTTPS y resolución por dominio llegan en la Fase 9 del plan.</p>'
   +'<div class="g"><div><label>Empresa</label><select id="em_domemp">'+opts+'</select></div>'
   +'<div><label>Dominio o subdominio</label><input id="em_host" placeholder="tienda.suempresa.com" maxlength="100"></div>'
   +'<div><label>Tipo</label><select id="em_tipo"><option value="sub">Subdominio</option><option value="propio">Dominio propio</option></select></div></div>'
   +'<div style="margin-top:10px"><button class="btn p" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empDomGuardar'):'')+'">+ Registrar dominio</button></div>'
   +'<div id="emDoms" style="margin-top:14px">Cargando dominios…</div>';
 }else if(EM.tab==='migracion'){
  body='<p style="font-size:12.5px;color:var(--gris);margin-top:12px">La simulación lee las colecciones actuales (sin escribir nada), valida relaciones y tamaños, y produce el informe de la migración a <b>empresas/{id}/…</b>. Es el paso previo obligatorio antes de cualquier migración real (Fase 6).</p>'
   +'<button class="btn p" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empMigrarSim'):'')+'">▶ Ejecutar simulación (no escribe nada)</button>'
   +'<div id="emMigOut" style="margin-top:14px"></div>';
 }else{
  var filas=EM.list.map(function(x){
   var esAct=x.id===activa;
   return '<div class="dl" style="border-left:5px solid '+(x.color||'#E0457B')+'"><div style="display:flex;align-items:center;gap:10px;min-width:0">'
    +(x.logo?'<img src="'+(typeof esc==='function'?esc(x.logo):x.logo)+'" alt="" style="width:38px;height:38px;border-radius:10px;object-fit:cover">':'<span style="width:38px;height:38px;border-radius:12px;background:'+(x.color||'#E0457B')+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800">'+(x.nombre||'?').charAt(0).toUpperCase()+'</span>')
    +'<div style="min-width:0"><b>'+(typeof esc==='function'?esc(x.nombre||x.id):x.id)+'</b> <small style="color:var(--gris)">· '+ (typeof esc==='function'?esc(x.id):x.id) +'</small>'
    +'<small style="display:block;color:var(--gris)">'+(x.estado==='pausa'?'⏸ Pausada':'✅ Activa')+(x.inicial?' · empresa inicial':'')+(esAct?' · <b>en uso ahora</b>':'')+'</small></div></div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">'
    +(esAct?'':'<button class="btn s p" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empActivar',x.id):'')+'">Usar</button>')
    +'<button class="btn s" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empEditar',x.id):'')+'">✏️ Editar</button>'
    +(x.estado==='pausa'?'<button class="btn s" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empEstadoAct',x.id):'')+'">▶ Activar</button>':'<button class="btn s" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empEstadoPausa',x.id):'')+'">⏸ Pausar</button>')
    +'</div></div>';
  }).join('');
  body='<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn p" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empNueva'):'')+'">+ Nueva empresa</button></div>'
   +(filas||'<div class="vacio">Aún no hay empresas en la nube. La empresa inicial (Tarjetería Jhon) se registra sola al abrir esta pantalla; también puede crear otras con «Nueva empresa».</div>');
 }

 var html=cab+body+'</div>';
 var cont=typeof $==='function'?$('v'):null;
 if(cont)cont.innerHTML=html;

 /* select de dominios: sincroniza la empresa elegida */
 var de=$id('em_domemp');
 if(de){
  if(!EM.domEmp&&EM.list[0])EM.domEmp=EM.list[0].id;
  if(EM.domEmp)de.value=EM.domEmp;
  de.onchange=function(){EM.domEmp=de.value;empDomPintar()};
  empDomPintar();
 }
}
function empTab(k){EM.tab=k;EM.msg=null;if(typeof R!=='undefined'&&R.empresas)R.empresas()}
function empEstadoAct(id){empEstado(id,'activa')}
function empEstadoPausa(id){empEstado(id,'pausa')}

function empDomPintar(){
 var el=typeof $==='function'?$('emDoms'):null;if(!el)return;
 if(typeof fbDb==='undefined'||!fbDb){el.innerHTML='<div class="vacio">Sin conexión.</div>';return}
 fbDb.collection('dominios').get().then(function(sn){
  var rows=sn.docs.map(function(d){return d.data()}).filter(function(d){return d&&d.empresaId===EM.domEmp});
  var nom=function(id){var e=EM.list.find(function(x){return x.id===id});return e?(e.nombre||e.id):id};
  el.innerHTML=rows.length?rows.map(function(d){
   return '<div class="dl"><div><b>'+(typeof esc==='function'?esc(d.host):d.host)+'</b><small>'+(d.tipo==='propio'?'Dominio propio':'Subdominio')+' · '+(d.verificado?'✔ verificado':'⏳ sin verificar (Fase 9)')+'</small></div>'
    +'<button class="btn s d" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('empDomQuitar',d.host):'')+'">Quitar</button></div>';
  }).join(''):'<div class="vacio">Esta empresa aún no tiene dominios registrados.</div>';
 }).catch(function(){el.innerHTML='<div class="vacio">No se pudieron leer los dominios (¿reglas desplegadas?).</div>'});
}

/* Puente a la simulación (migraciones/migracion-multiempresa.js). */
function empMigrarSim(){
 if(typeof esAdmin==='function'&&!esAdmin())return alert('Solo el administrador.');
 if(typeof MIGRACION_MULTI==='undefined'||!MIGRACION_MULTI.simular)
  return alert('No está cargada la herramienta de migración (migraciones/migracion-multiempresa.js).');
 MIGRACION_MULTI.simular();
}
if(typeof window!=='undefined')window.TJEmpresas={empSan:empSan,empNormSlug:empNormSlug,empHostOk:empHostOk};
if(typeof module!=='undefined'&&module.exports)module.exports={empSan:empSan,empNormSlug:empNormSlug,empHostOk:empHostOk};
