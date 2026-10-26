/* Limpieza de la EMPRESA ACTIVA (administrador, pantalla Empresas). Script clásico, sin dependencias propias: usa fbDb/fbCol/esAdmin/esc de app.js al ejecutarse (no al cargar).
   - «Datos heredados de Tarjetería» (vista previa + confirmación): los modelos del catálogo de fábrica (catalogo_default.zip, 88 modelos PW0xx) subidos al catálogo o publicados en la tienda,
     los 6 productos de arranque «TARJETAS DE TODA OCACION» y los datos de contacto de Tarjetería (nombre, teléfono, correo) que una empresa nueva pudo guardar antes del arreglo.
   - «Contenido de ejemplo»: los 3 productos «Producto de ejemplo» (demo:1), su banner y el texto de portada de muestra que crea la casilla «Incluir contenido de ejemplo» al dar de alta una empresa.
   Solo actúa sobre la empresa en uso (nunca sobre otra), nunca sobre la empresa inicial, y siempre con vista previa y confirmación. Guía: docs/LIMPIEZA-EMPRESA.md */
var LIMP={ej:null,her:null,zip:null,msg:null,busy:false};
function limpiezaPuede(){
 try{return typeof esAdmin==='function'&&esAdmin()&&typeof fbDb!=='undefined'&&!!fbDb&&!TJEmpresa.empEsInicial()}catch(e){return false}
}
function limpiezaCol(n){return fbDb.collection('empresas/'+TJEmpresa.empActiva()+'/'+n)}
/* Qué hay de ejemplo en la empresa activa (solo lectura). */
async function empEjemplosEscanear(){
 var sn=await limpiezaCol('tienda_items').get(),r={items:[],banner:false,portada:false,cfg:null};
 sn.docs.forEach(function(d){
  var x=d.data()||{};
  if(d.id==='__cfg'){r.cfg=x;r.banner=Array.isArray(x.banners)&&x.banners.some(function(b){return b&&b.id==='demo_b1'});
   r.portada=x.demo===1&&((typeof x.heroSub==='string'&&/^Bienvenido a .*Coloque aquí su eslogan/.test(x.heroSub))||(x.heroBgType==='photo'&&String(x.heroPhotoUrl||'').indexOf('data:image/svg+xml')===0))}
  else if(x.demo===1&&/^demo_\d{1,2}$/.test(d.id))r.items.push({id:d.id,name:String(x.name||d.id)});
 });
 return r;
}
function limpiezaHayEjemplos(r){return !!(r&&(r.items.length||r.banner||r.portada))}
function limpiezaResumenEj(r){
 var a=[];if(r.items.length)a.push(r.items.length+' producto'+(r.items.length>1?'s':'')+' de ejemplo');
 if(r.banner)a.push('el banner de ejemplo');if(r.portada)a.push('la portada de muestra');
 return a.join(', ');
}
/* Quita solo lo marcado como ejemplo. No toca productos reales, catálogo, facturas ni datos del panel. */
async function empEjemplosQuitar(){
 if(!limpiezaPuede())return alert('Solo el administrador, dentro de una empresa que no sea la inicial.');
 if(LIMP.busy)return;
 try{
  LIMP.busy=true;var r=await empEjemplosEscanear();
  if(!limpiezaHayEjemplos(r)){LIMP.msg={ok:true,t:'No hay contenido de ejemplo que quitar.'};LIMP.busy=false;return limpiezaPintar()}
  var nom=(typeof empNombreActiva==='function'&&empNombreActiva())||TJEmpresa.empActiva();
  if(!confirm('Se quitará de «'+nom+'»: '+limpiezaResumenEj(r)+'.\n\nNo se borra nada más (productos reales, catálogo, clientes y facturas quedan igual).\n\n¿Quitar el contenido de ejemplo?')){LIMP.busy=false;return}
  var FV=firebase.firestore.FieldValue,b=fbDb.batch(),n=0;
  r.items.forEach(function(i){b.delete(limpiezaCol('tienda_items').doc(i.id));n++});
  if(r.cfg&&(r.banner||r.portada||r.cfg.demo===1)){
   var u={demo:FV.delete(),ts:Date.now()};
   if(r.banner)u.banners=(r.cfg.banners||[]).filter(function(x){return !(x&&x.id==='demo_b1')});
   if(r.portada){
    if(typeof r.cfg.heroSub==='string'&&/^Bienvenido a .*Coloque aquí su eslogan/.test(r.cfg.heroSub))u.heroSub='';
    if(r.cfg.heroBgType==='photo'&&String(r.cfg.heroPhotoUrl||'').indexOf('data:image/svg+xml')===0){u.heroBgType='none';u.heroPhotoUrl=''}
   }
   b.update(limpiezaCol('tienda_items').doc('__cfg'),u);n++;
  }
  await b.commit();
  LIMP.msg={ok:true,t:'✔ Se quitó el contenido de ejemplo ('+limpiezaResumenEj(r)+').'};
 }catch(e){window._tjw&&window._tjw(e);LIMP.msg={ok:false,t:'No se pudo quitar. Revise su conexión o sus permisos de administrador.'}}
 LIMP.busy=false;limpiezaPintar();
}
/* ---------- Datos heredados de Tarjetería Jhon ---------- */
/* Lista de fábrica (id → nombre) leída de catalogo_default.zip: solo se considera heredado lo que coincide en id Y nombre. */
async function limpiezaZipFabrica(){
 if(LIMP.zip)return LIMP.zip;
 if(typeof JSZip==='undefined')throw new Error('sin JSZip');
 var r=await fetch('catalogo_default.zip');if(!r.ok)throw new Error('zip '+r.status);
 var z=await JSZip.loadAsync(await r.arrayBuffer()),mf=z.file('manifest.json');if(!mf)throw new Error('zip sin manifest');
 var p=JSON.parse(await mf.async('string'));if(!p||p.app!=='tj_cat_backup'||!Array.isArray(p.items))throw new Error('zip no válido');
 var m={};p.items.forEach(function(i){if(i&&i.id)m[i.id]=String(i.name||'')});
 if(!Object.keys(m).length)throw new Error('zip vacío');
 return (LIMP.zip=m);
}
/* Productos de arranque que la app cargaba en CUALQUIER empresa vacía (id p0…p5, nombre y precio exactos). */
var LIMP_ARRANQUE=[1.30,1.25,1.20,1.15,1.00,0.95];
function limpiezaEsArranque(p,i){return !!p&&typeof p==='object'&&/^p[0-5]$/.test(String(p.id))&&LIMP_ARRANQUE[+String(p.id).slice(1)]===+p.p&&/^TARJETAS DE TODA OCACION( DISTRUBUCION)?$/.test(String(p.n||''))}
/* Datos de contacto de Tarjetería guardados en la configuración de otra empresa (solo si coinciden EXACTAMENTE; «Banco General» o «Panama Oeste» pueden ser legítimos y no se tocan). */
var LIMP_CFG_TJ={nombre:'Tarjetería Jhon',tel:'(507) 6074-1150',email:'Tarjeteriajhon@gmail.com'};
function limpiezaCfgTJ(cfg){return Object.keys(LIMP_CFG_TJ).filter(function(k){return cfg&&typeof cfg[k]==='string'&&cfg[k].trim().toLowerCase()===LIMP_CFG_TJ[k].toLowerCase()})}
/* Vista previa: solo lectura. */
async function empHeredadoEscanear(){
 var zip=await limpiezaZipFabrica(),r={cat:[],tienda:[],local:[],prod:[],cfg:[]};
 var igual=function(id,x){return zip[id]!==undefined&&String((x&&x.name)||'')===zip[id]};
 (await limpiezaCol('catalogo').get()).docs.forEach(function(d){if(igual(d.id,d.data()))r.cat.push({id:d.id,name:zip[d.id]})});
 (await limpiezaCol('tienda_items').get()).docs.forEach(function(d){if(d.id!=='__cfg'&&igual(d.id,d.data()))r.tienda.push({id:d.id,name:zip[d.id]})});
 try{(typeof CL!=='undefined'&&Array.isArray(CL)?CL:[]).forEach(function(f){if(f&&igual(f.id,f))r.local.push({id:f.id,name:zip[f.id]})})}catch(e){}
 try{r.prod=(DB.prod||[]).filter(limpiezaEsArranque).map(function(p){return {id:p.id,name:p.n+' ($'+Number(p.p).toFixed(2)+')'}})}catch(e){}
 try{r.cfg=limpiezaCfgTJ(DB.cfg)}catch(e){}
 return r;
}
function limpiezaHayHeredado(r){return !!(r&&(r.cat.length||r.tienda.length||r.local.length||r.prod.length||r.cfg.length))}
function limpiezaResumenHer(r){
 var a=[];
 if(r.cat.length)a.push(r.cat.length+' modelo'+(r.cat.length>1?'s':'')+' del catálogo en la nube');
 if(r.tienda.length)a.push(r.tienda.length+' modelo'+(r.tienda.length>1?'s':'')+' publicado'+(r.tienda.length>1?'s':'')+' en la tienda');
 if(r.local.length)a.push(r.local.length+' modelo'+(r.local.length>1?'s':'')+' guardado'+(r.local.length>1?'s':'')+' en este dispositivo');
 if(r.prod.length)a.push(r.prod.length+' producto'+(r.prod.length>1?'s':'')+' de arranque');
 if(r.cfg.length)a.push('datos de contacto de Tarjetería ('+r.cfg.map(function(k){return {nombre:'nombre',tel:'teléfono',email:'correo'}[k]}).join(', ')+')');
 return a.join('; ');
}
/* Botón «Ver vista previa». */
async function empHeredadoPrevia(){
 if(!limpiezaPuede())return;
 try{LIMP.her=await empHeredadoEscanear();LIMP.msg=null}catch(e){window._tjw&&window._tjw(e);LIMP.her=null;LIMP.msg={ok:false,t:'No se pudo revisar lo heredado (no se leyó la lista de fábrica o no hay conexión). No se cambió nada.'}}
 limpiezaPintar(true);
}
async function limpiezaLotes(ops){
 for(var i=0;i<ops.length;i+=400){var b=fbDb.batch();ops.slice(i,i+400).forEach(function(o){if(o.del)b.delete(o.del);else b.update(o.ref,o.u)});await b.commit()}
}
/* Quita lo heredado de la empresa ACTIVA. Vuelve a escanear justo antes (no usa una vista previa vieja). */
async function empHeredadoQuitar(){
 if(!limpiezaPuede())return alert('Solo el administrador, dentro de una empresa que no sea la inicial.');
 if(LIMP.busy)return;LIMP.busy=true;
 try{
  var r=await empHeredadoEscanear();
  if(!limpiezaHayHeredado(r)){LIMP.her=r;LIMP.msg={ok:true,t:'No hay datos heredados de Tarjetería que quitar.'};LIMP.busy=false;return limpiezaPintar(true)}
  var nom=(typeof empNombreActiva==='function'&&empNombreActiva())||TJEmpresa.empActiva();
  if(!confirm('Se quitará de «'+nom+'» (y SOLO de esta empresa):\n\n• '+limpiezaResumenHer(r).split('; ').join('\n• ')+'\n\nNo se toca nada de Tarjetería Jhon ni lo que esta empresa haya creado por su cuenta (modelos, productos, clientes y facturas propios).\nEsta acción no se puede deshacer.\n\n¿Quitar lo heredado?')){LIMP.busy=false;return}
  var ops=[],ids={};
  r.cat.forEach(function(i){ops.push({del:limpiezaCol('catalogo').doc(i.id)});ids[i.id]=1});
  r.tienda.forEach(function(i){ops.push({del:limpiezaCol('tienda_items').doc(i.id)});ids[i.id]=1});
  await limpiezaLotes(ops);
  /* Este dispositivo: base local del catálogo (en los demás dispositivos lo hace solo la sincronización al ver los borrados en la nube). */
  if(typeof CL!=='undefined'&&typeof tx==='function'){
   for(var i=0;i<r.local.length;i++){try{await tx('readwrite',function(s){return s.delete(r.local[i].id)})}catch(e){window._tjw&&window._tjw(e)}ids[r.local[i].id]=1}
   try{CL=CL.filter(function(f){return !ids[f.id]})}catch(e){}
  }
  /* Productos de arranque y contacto: se cambian en la memoria del panel y se guardan por el camino normal (save), para que no se vuelvan a subir. */
  if(r.prod.length||r.cfg.length){
   if(r.prod.length)DB.prod=(DB.prod||[]).filter(function(p){return !limpiezaEsArranque(p)});
   r.cfg.forEach(function(k){delete DB.cfg[k]});
   if(typeof save==='function')save();
  }
  try{if(typeof vista!=='undefined'&&vista==='cat'&&typeof dib==='function')dib()}catch(e){}
  LIMP.her=null;LIMP.msg={ok:true,t:'✔ Se quitó lo heredado de Tarjetería: '+limpiezaResumenHer(r)+'.'};
 }catch(e){window._tjw&&window._tjw(e);LIMP.msg={ok:false,t:'No se pudo completar (revise conexión o permisos). Puede que se haya quitado una parte: vuelva a ver la vista previa.'}}
 LIMP.busy=false;limpiezaPintar();
}

/* Tarjeta de la pantalla Empresas (solo administrador, empresa activa no inicial). Se rellena sola al abrir la pantalla. */
function limpiezaHTML(){
 if(!limpiezaPuede())return '';
 var nom=(typeof empNombreActiva==='function'&&empNombreActiva())||TJEmpresa.empActiva();
 return '<div class="card" id="emLimp" style="margin-top:14px"><h3 style="margin:0 0 4px">🧹 Limpieza de «'+(typeof esc==='function'?esc(nom):nom)+'»</h3><div id="emLimpCuerpo"><div class="vacio">Revisando…</div></div></div>';
}
async function limpiezaPintar(conPrevia){
 var el=typeof document!=='undefined'&&document.getElementById('emLimpCuerpo');if(!el||!limpiezaPuede())return;
 var h='';
 if(LIMP.msg)h+='<div class="nota" style="color:'+(LIMP.msg.ok?'#1e7a43':'#b3261e')+'">'+(typeof esc==='function'?esc(LIMP.msg.t):LIMP.msg.t)+'</div>';
 try{
  var r=await empEjemplosEscanear();LIMP.ej=r;
  if(limpiezaHayEjemplos(r))h+='<p style="font-size:13px;margin:6px 0">Esta empresa tiene contenido de ejemplo: <b>'+limpiezaResumenEj(r)+'</b>.</p><button class="btn s d" data-h-click="call" data-a-click="'+_ha('empEjemplosQuitar')+'">🗑 Quitar ejemplos</button><small style="display:block;color:var(--gris);margin-top:6px">Solo quita lo marcado como ejemplo. Tus productos, catálogo, clientes y facturas no se tocan.</small>';
  else h+='<p style="font-size:13px;color:var(--gris);margin:6px 0">Esta empresa no tiene contenido de ejemplo.</p>';
 }catch(e){window._tjw&&window._tjw(e);h+='<div class="vacio">No se pudo revisar (sin conexión o sin permisos).</div>'}
 /* Datos heredados de Tarjetería: primero vista previa, luego quitar (con confirmación). */
 h+='<hr style="border:0;border-top:1px solid var(--linea);margin:12px 0"><h4 style="margin:0 0 4px;font-size:14px">Datos heredados de Tarjetería Jhon</h4>';
 var w=LIMP.her;
 if(!w)h+='<p style="font-size:12.5px;color:var(--gris);margin:4px 0">Antes de un arreglo reciente, una empresa nueva podía guardar los 88 modelos de Tarjetería, 6 productos de arranque y sus datos de contacto. Revise si esta empresa los tiene (no cambia nada).</p><button class="btn s" data-h-click="call" data-a-click="'+_ha('empHeredadoPrevia')+'">👁 Ver vista previa</button>';
 else if(!limpiezaHayHeredado(w))h+='<p style="font-size:13px;color:#1e7a43;margin:4px 0">✔ Esta empresa no tiene datos heredados de Tarjetería.</p><button class="btn s" data-h-click="call" data-a-click="'+_ha('empHeredadoPrevia')+'">Volver a revisar</button>';
 else{var L=function(t,a){return a.length?'<li><b>'+t+':</b> '+a.length+' <small style="color:var(--gris)">('+a.slice(0,6).map(function(x){return esc(x.name)}).join(', ')+(a.length>6?'… y '+(a.length-6)+' más':'')+')</small></li>':''};
  h+='<p style="font-size:13px;margin:4px 0">Esto se quitaría de <b>esta empresa</b> (nada de Tarjetería Jhon, ni lo que usted creó):</p><ul style="font-size:13px;line-height:1.6;margin:4px 0 8px 18px">'+L('Modelos en el catálogo (nube)',w.cat)+L('Modelos publicados en la tienda',w.tienda)+L('Modelos guardados en este dispositivo',w.local)+L('Productos de arranque',w.prod)+(w.cfg.length?'<li><b>Datos de contacto de Tarjetería guardados aquí:</b> '+w.cfg.map(function(k){return {nombre:'nombre',tel:'teléfono',email:'correo'}[k]}).join(', ')+'</li>':'')+'</ul><button class="btn s d" data-h-click="call" data-a-click="'+_ha('empHeredadoQuitar')+'">🗑 Quitar lo heredado…</button> <button class="btn s" data-h-click="call" data-a-click="'+_ha('empHeredadoPrevia')+'">Volver a revisar</button><small style="display:block;color:var(--gris);margin-top:6px">Pedirá confirmación y vuelve a revisar justo antes de borrar.</small>'}
 el=document.getElementById('emLimpCuerpo');if(el)el.innerHTML=h;
}
