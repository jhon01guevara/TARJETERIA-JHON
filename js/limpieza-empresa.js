/* Limpieza de la EMPRESA ACTIVA (administrador, pantalla Empresas). Script clásico, sin dependencias propias: usa fbDb/fbCol/esAdmin/esc de app.js al ejecutarse (no al cargar).
   - «Contenido de ejemplo»: los 3 productos «Producto de ejemplo» (demo:1), su banner y el texto de portada de muestra que crea la casilla «Incluir contenido de ejemplo» al dar de alta una empresa.
   Solo actúa sobre la empresa en uso (nunca sobre otra), nunca sobre la empresa inicial, y siempre con vista previa y confirmación. Guía: docs/LIMPIEZA-EMPRESA.md */
var LIMP={ej:null,msg:null,busy:false};
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
/* Tarjeta de la pantalla Empresas (solo administrador, empresa activa no inicial). Se rellena sola al abrir la pantalla. */
function limpiezaHTML(){
 if(!limpiezaPuede())return '';
 var nom=(typeof empNombreActiva==='function'&&empNombreActiva())||TJEmpresa.empActiva();
 return '<div class="card" id="emLimp" style="margin-top:14px"><h3 style="margin:0 0 4px">🧹 Limpieza de «'+(typeof esc==='function'?esc(nom):nom)+'»</h3><div id="emLimpCuerpo"><div class="vacio">Revisando…</div></div></div>';
}
async function limpiezaPintar(){
 var el=typeof document!=='undefined'&&document.getElementById('emLimpCuerpo');if(!el||!limpiezaPuede())return;
 var h='';
 if(LIMP.msg)h+='<div class="nota" style="color:'+(LIMP.msg.ok?'#1e7a43':'#b3261e')+'">'+(typeof esc==='function'?esc(LIMP.msg.t):LIMP.msg.t)+'</div>';
 try{
  var r=await empEjemplosEscanear();LIMP.ej=r;
  if(limpiezaHayEjemplos(r))h+='<p style="font-size:13px;margin:6px 0">Esta empresa tiene contenido de ejemplo: <b>'+limpiezaResumenEj(r)+'</b>.</p><button class="btn s d" data-h-click="call" data-a-click="'+_ha('empEjemplosQuitar')+'">🗑 Quitar ejemplos</button><small style="display:block;color:var(--gris);margin-top:6px">Solo quita lo marcado como ejemplo. Tus productos, catálogo, clientes y facturas no se tocan.</small>';
  else h+='<p style="font-size:13px;color:var(--gris);margin:6px 0">Esta empresa no tiene contenido de ejemplo.</p>';
 }catch(e){window._tjw&&window._tjw(e);h+='<div class="vacio">No se pudo revisar (sin conexión o sin permisos).</div>'}
 el=document.getElementById('emLimpCuerpo');if(el)el.innerHTML=h;
}
