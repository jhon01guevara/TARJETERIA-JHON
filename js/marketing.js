/* ===== Marketing Studio · vista del panel (plan maestro v1) =====
   Depende de: js/mkt-editor.js (motor MKT) y del runtime de app.js (fbCol, $,
   esc, uid, lsk, esAdmin, SES, DB, tx) — se carga antes que app.js pero solo
   se ejecuta al renderizar, igual que js/empresas.js.

   Aislamiento: SOLO toca las colecciones por empresa marketing_projects,
   marketing_assets, marketing_exports y marketing_colecciones (vía fbCol) y
   los metadatos empresas/{eid} (marca) + miembros/{uid}. Ver tests. */
'use strict';

var MK={tab:'proyectos',edit:null,doc:null,guardado:null,fmt:'vertical',sel:null,
 hist:[],fut:[],assets:{},imgs:{},proys:[],cols:[],marca:null,msg:null,nuevo:null,exp:false};
var _mkOn=false,_mkColsOn=false,_mkMiembrosW=false;

function mktEid(){return (typeof TJEmpresa!=='undefined'&&TJEmpresa.empActiva)?TJEmpresa.empActiva():'tarjeteria-jhon'}
function mktYo(){return (typeof SES!=='undefined'&&SES)?SES.id:'admin'}

/* ---------- Nube: listeners + miembros + marca ---------- */
function mktListen(){
 if(_mkOn||typeof fbDb==='undefined'||!fbDb||typeof fbCol!=='function')return;
 _mkOn=true;
 fbCol('marketing_projects').onSnapshot(function(sn){
  MK.proys=sn.docs.map(function(d){return d.data()}).filter(Boolean)
   .sort(function(a,b){return (b.ts||0)-(a.ts||0)});
  mktPintar();
 },function(e){console.warn('Marketing proyectos:',e)});
 if(!_mkColsOn){_mkColsOn=true;
  fbCol('marketing_colecciones').onSnapshot(function(sn){
   MK.cols=sn.docs.map(function(d){return d.data()}).filter(Boolean)
    .sort(function(a,b){return (a.nombre||'').localeCompare(b.nombre||'')});
   mktPintar();
  },function(e){console.warn('Marketing colecciones:',e)});
 }
}
/* Declara empresas/{eid}/miembros/{uid} (idempotente). Lo usan mktMiembros y el alta de
   vendedor (vendSave en js/app.js): un único formato {uid,ts}. */
async function mktMiembroSet(uid){
 var ref=fbDb.collection('empresas').doc(mktEid()).collection('miembros').doc(uid);
 var ex=await ref.get();
 if(!ex.exists)await ref.set({uid:uid,ts:Date.now()});
}
/* La administración declara miembros/{uid} por empresa (idempotente): base del
   aislamiento de las reglas (un vendedor solo ve el marketing de SU empresa). */
async function mktMiembros(){
 if(typeof esAdmin==='function'&&!esAdmin())return;
 if(_mkMiembrosW)return;_mkMiembrosW=1;
 try{
  var users=((typeof DB!=='undefined'&&DB.cfg&&DB.cfg.users)||[]);
  for(var i=0;i<users.length;i++){
   var u=users[i];if(!u||!u.id)continue;
   await mktMiembroSet(u.id);
  }
 }catch(e){window._tjw&&window._tjw(e)}
}
async function mktCargarMarca(){
 if(MK.marca)return MK.marca;
 try{
  var d=await fbDb.collection('empresas').doc(mktEid()).get();
  MK.marca=(d.exists&&d.data().marca)||{logo:'',c1:'#E0457B',c2:'#0F6CBD',fuente:'moderna'};
 }catch(e){MK.marca={logo:'',c1:'#E0457B',c2:'#0F6CBD',fuente:'moderna'}}
 return MK.marca;
}

/* ---------- Pintado de la vista ---------- */
function mktPintar(){if(typeof R!=='undefined'&&R.marketing)R.marketing()}
function marketingRender(){
 if(typeof fbCol==='undefined'&&!fbDb)return;
 mktMiembros();mktListen();
 if(MK.edit)return mktEditor();
 mktCargarMarca();
 var tab=function(k,l){return '<button class="btn s'+(MK.tab===k?' p':'')+'" data-h-click="call" data-a-click="'+(typeof _ha==='function'?_ha('mktTab',k):'')+'">'+l+'</button>'};
 var cab='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">'
  +'<div><h3 style="margin:0 0 2px">🎨 Marketing Studio</h3><small style="color:var(--gris)">Diseños y anuncios de <b>'+mktEid()+'</b> · los datos son de esta empresa</small></div>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+tab('proyectos','🖼 Diseños')+tab('colecciones','📁 Colecciones')
  +((typeof esAdmin!=='function'||esAdmin())?tab('marca','🎨 Marca'):'')+'</div></div>'
  +(MK.msg?'<div class="nota" style="margin-top:10px;color:'+(MK.msg.ok?'#1e7a43':'#b3261e')+'">'+MK.msg.t+'</div>':'');
 var body='';
 if(MK.nuevo)body=mktNuevoHTML();
 else if(MK.tab==='proyectos')body=mktProysHTML();
 else if(MK.tab==='colecciones')body=mktColsHTML();
 else if(MK.tab==='marca')body=mktMarcaHTML();
 $('v').innerHTML=cab+body+'</div>';
 mktWire();
}
 /* marketingRender es function declaration: ya queda global para data-h-click="call" */


function mktProysHTML(){
 var filas=MK.proys.map(function(p){
  return '<div class="dl"><span><b>'+((typeof esc==='function')?esc(p.nombre||'Sin nombre'):p.nombre)+'</b>'
   +' <small style="color:'+(p.estado==='listo'?'#1e7a43':'var(--gris)')+'">· '+(p.estado==='listo'?'✅ Listo':'✏️ Borrador')+'</small>'
   +'<small style="display:block;color:var(--gris)">'+new Date(p.ts||Date.now()).toLocaleString()+'</small></span>'
   +'<span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">'
   +'<button class="btn s p" data-h-click="call" data-a-click="'+_ha('mktAbrir',p.id)+'">Abrir</button>'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktBorrar',p.id)+'" aria-label="Eliminar">🗑</button></span></div>';
 }).join('');
 return (MK.proys.length?filas:'<div class="vacio" style="margin-top:12px">Aún no hay diseños. Cree el primero con «+ Nuevo diseño».</div>')
  +'<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn p" data-h-click="call" data-a-click="'+_ha('mktNuevo',1)+'">+ Nuevo diseño</button></div>';
}
function mktNuevoHTML(){
 var m=MK.marca||{};
 var tarjetas=MKT.PLANTILLAS.map(function(p){
  return '<div class="g" style="min-width:200px;cursor:pointer" data-h-click="call" data-a-click="'+_ha('mktDePlantilla',p.id)+'">'
   +'<div style="background:var(--soft);border-radius:12px;padding:10px;text-align:center"><b>'+p.nombre+'</b></div></div>';
 }).join('');
 return '<h4 style="margin:12px 0 6px">1 · Elija una plantilla</h4>'
  +'<div class="g">'+tarjetas
  +'<div class="g" style="min-width:200px;cursor:pointer" data-h-click="call" data-a-click="'+_ha('mktDePlantilla','blanco')+'"><div style="background:var(--soft);border-radius:12px;padding:10px;text-align:center"><b>En blanco</b></div></div></div>'
  +'<h4 style="margin:14px 0 6px">2 · Imagen del producto (opcional)</h4>'
  +'<div class="nota" style="margin-bottom:8px">Puede saltarlo y agregar la imagen después dentro del editor.</div>'
  +'<div class="g" id="mkt_pick"></div>'
  +'<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'
  +'<button class="btn s" id="mkt_subir">⬆ Subir imagen…</button>'
  +'<button class="btn" data-h-click="call" data-a-click="'+_ha('mktCancelar','')+'">Cancelar</button></div>'
  +'<input type="file" id="mkt_file" accept="image/*" style="display:none">';
}
function mktColsHTML(){
 var pros=MK.proys;
 var filas=MK.cols.map(function(c){
  var items=Array.isArray(c.items)?c.items:[];
  var sel='<select class="mktAddCol" data-col="'+c.id+'"><option value="">+ agregar diseño…</option>'
   +pros.filter(function(p){return items.indexOf(p.id)<0})
    .map(function(p){return '<option value="'+p.id+'">'+esc(p.nombre||p.id)+'</option>'}).join('')+'</select>';
  return '<div class="dl"><span><b>'+esc(c.nombre||'?')+'</b> <small style="color:var(--gris)">· '+items.length+' diseño(s)'+(c.estado==='archivada'?' · ⏸ archivada':'')+'</small>'
   +'<small style="display:block;color:var(--gris)">'+items.map(function(id){var p=pros.find(function(x){return x.id===id});return p?(p.nombre||''):''}).filter(Boolean).join(' · ')+'</small></span>'
   +'<span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">'+sel
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktColRen',c.id)+'" aria-label="Editar">✏️</button>'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktColArc',c.id)+'">'+(c.estado==='archivada'?'▶':'⏸')+'</button>'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktColBor',c.id)+'" aria-label="Eliminar">🗑</button></span></div>';
 }).join('');
 return (MK.cols.length?filas:'<div class="vacio" style="margin-top:12px">Aún no hay colecciones.</div>')
  +'<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn p" data-h-click="call" data-a-click="'+_ha('mktColNueva','')+'">+ Nueva colección</button></div>';
}
function mktMarcaHTML(){
 var m=MK.marca||{};
 var fOpt=function(k,l){return '<option value="'+k+'"'+(m.fuente===k?' selected':'')+'>'+l+'</option>'};
 return '<div class="nota" style="margin:12px 0 10px">La identidad se aplica a las plantillas nuevas de <b>'+mktEid()+'</b> (colores, logo y tipografía).</div>'
  +'<div class="g"><div><small>Color primario</small><br><input type="color" id="mkt_c1" value="'+(m.c1||'#E0457B')+'" style="width:70px;height:38px;border:0;background:none;cursor:pointer"></div>'
  +'<div><small>Color secundario</small><br><input type="color" id="mkt_c2" value="'+(m.c2||'#0F6CBD')+'" style="width:70px;height:38px;border:0;background:none;cursor:pointer"></div>'
  +'<div><small>Tipografía</small><br><select id="mkt_fuente">'+fOpt('moderna','Moderna')+fOpt('impacto','Impacto')+fOpt('clasica','Clásica')+fOpt('manual','Manual')+'</select></div>'
  +'<div><small>Logo</small><br><button class="btn s" id="mkt_logo">'+(m.logo?'🔁 Cambiar logo':'⬆ Subir logo')+'</button>'
  +(m.logo?'<br><img src="'+m.logo+'" alt="logo" style="height:44px;margin-top:6px;border-radius:8px;background:var(--soft);padding:4px">':'')+'</div></div>'
  +'<div style="margin-top:12px"><button class="btn p" data-h-click="call" data-a-click="'+_ha('mktMarcaGuardar','')+'">💾 Guardar marca</button></div>'
  +'<input type="file" id="mkt_logof" accept="image/*" style="display:none">';
}

/* ---------- Selector de imagen (catálogo + tienda + subida) ---------- */
function mktOpcionesImagen(){
 var out=[];
 try{if(typeof tx==='function')tx('readonly',function(s){return s.getAll()}).then(function(fs){
  (fs||[]).forEach(function(f){if(f&&f.thumb)out.push({id:'cat:'+f.id,nombre:f.name,src:f.thumb})});
  mktPintarPicker(out);
 })}catch(e){}
 try{
  fbCol('tienda_items').get().then(function(sn){
   sn.docs.forEach(function(d){var x=d.data();if(x&&x.img&&d.id!=='__cfg')out.push({id:'td:'+d.id,nombre:x.name||d.id,src:x.img})});
   mktPintarPicker(out);
  });
 }catch(e){}
 MK._picker=out;mktPintarPicker(out);
}
function mktPintarPicker(out){
 var el=$('mkt_pick');if(!el)return;
 el.innerHTML=(out&&out.length?out.slice(0,24):[]).map(function(o){
  return '<div style="cursor:pointer;text-align:center" data-h-click="call" data-a-click="'+_ha('mktElegirImg',o.id)+'">'
   +'<img src="'+o.src+'" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:10px;border:2px solid var(--borde)">'
   +'<small style="color:var(--gris);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(o.nombre||'')+'</small></div>';
 }).join('')||'<div class="nota">Sin imágenes aún: suba una o agréguela después en el editor.</div>';
 MK._picker=out;
}
async function mktResolverImagen(id){
 try{
  if(String(id).indexOf('cat:')===0){
   var cid=id.slice(4);
   var f=await tx('readonly',function(s){return s.get(cid)});
   if(f&&f.blob&&typeof rd==='function')return await rd(f.blob);
   if(f&&f.thumb)return f.thumb;
  }
  if(String(id).indexOf('td:')===0){
   var d=await fbCol('tienda_items').doc(id.slice(3)).get();
   if(d.exists)return d.data().img;
  }
 }catch(e){}
 return null;
}

/* ---------- Assets (imágenes por proyecto, ≤500 KB por documento) ---------- */
function mktComprimirArchivo(file,maxKB){
 return new Promise(function(res){
  var img=new Image();
  img.onload=function(){
   var k=Math.min(1,1600/Math.max(img.width,img.height));
   var c=document.createElement('canvas');
   c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
   var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
   var min=.42,max=.97;
   (function q(intent){
    c.toBlob(function(b){
     if(!b)return res(null);
     if(b.size<=maxKB*1024||max-min<.02)return res(b);
     max=intent; q((min+max)/2);
    },'image/jpeg',intent);
   })(max);
  };
  img.onerror=function(){res(null)};
  img.src=URL.createObjectURL(file);
 });
}
async function mktAddAsset(dataUrl){
 try{
  var id=uid();
  await fbCol('marketing_assets').doc(id).set({id:id,data:dataUrl,mime:'image/jpeg',ts:Date.now(),by:mktYo()});
  MK.assets[id]=dataUrl;
  await mktCargarImg(id);
  return id;
 }catch(e){alert('No se pudo guardar la imagen: '+((e&&e.message)||e));return null}
}
function mktCargarImg(id){
 if(MK.imgs[id]&&MK.imgs[id]._ok)return Promise.resolve(MK.imgs[id]);
 var du=MK.assets[id];
 if(!du)return Promise.resolve(null);
 return new Promise(function(res){
  var im=new Image();
  im.onload=function(){im._ok=1;MK.imgs[id]=im;res(im)};
  im.onerror=function(){res(null)};
  im.src=du;
 });
}
async function mktCargarAssetsDoc(doc){
 var ids={};
 JSON.stringify(doc).replace(/"assetId":"([^"]+)"/g,function(_,a){ids[a]=1});
 var faltan=Object.keys(ids).filter(function(a){return !MK.assets[a]});
 if(faltan.length){
  try{
   var sn=await fbCol('marketing_assets').get();
   sn.docs.forEach(function(d){var x=d.data();if(x&&x.data&&faltan.indexOf(x.id)>=0)MK.assets[x.id]=x.data});
  }catch(e){}
 }
 await Promise.all(Object.keys(ids).map(mktCargarImg));
}

/* ---------- Editor ---------- */
function mktCapas(){return MK.doc.formatos[MK.fmt].layers}
function mktHistorial(){
 MK.hist.push(JSON.stringify(MK.doc));if(MK.hist.length>30)MK.hist.shift();
 MK.fut=[];
 try{localStorage.setItem(lsk('tj_mkt_draft'),JSON.stringify({proy:MK.edit&&MK.edit.id,doc:MK.doc}))}catch(e){}
}
function mktDeshacer(){
 if(!MK.hist.length)return;
 MK.fut.push(JSON.stringify(MK.doc));
 MK.doc=JSON.parse(MK.hist.pop());MK.sel=null;mktEditor();
}
function mktRehacer(){
 if(!MK.fut.length)return;
 MK.hist.push(JSON.stringify(MK.doc));
 MK.doc=JSON.parse(MK.fut.pop());MK.sel=null;mktEditor();
}
function mktEditor(){
 /* Pinta el editor de inmediato (sin esperar a Firestore); cuando lleguen las
    imágenes pendientes se vuelve a dibujar el lienzo. */
 mktPintarEditor();
 mktCargarAssetsDoc(MK.doc).then(function(){if(MK.edit)mktDibujar()});
}
function mktPintarEditor(){
  var ft=function(k){return '<button class="btn s'+(MK.fmt===k?' p':'')+'" data-h-click="call" data-a-click="'+_ha('mktFmt',k)+'">'+MKT.FORMATOS[k].nombre.split('·')[0]+'</button>'};
  var capas=mktCapas();
  var filasCapas=capas.slice().reverse().map(function(c){
   var nom=c.tipo==='fondo'?'🎨 Fondo':c.tipo==='img'?'🖼 Imagen':'🔤 '+(String(c.t||'').split('\n')[0]||'Texto').slice(0,22);
   return '<div class="dl" style="padding:5px 8px;cursor:pointer;'+(MK.sel===c.id?'border-left:3px solid var(--az)':'')+'" data-h-click="call" data-a-click="'+_ha('mktSel',c.id)+'">'
    +'<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(nom)+'</span>'
    +(c.tipo!=='fondo'?'<span><button class="btn s" data-h-click="call" data-a-click="'+_ha('mktSub',c.id)+'" aria-label="Subir">↑</button> '
     +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktBajar',c.id)+'" aria-label="Bajar">↓</button> '
     +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktDup',c.id)+'" aria-label="Duplicar">⧉</button> '
     +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktDel',c.id)+'" aria-label="Eliminar">🗑</button></span>':'')
    +'</div>';
  }).join('');
  var props=mktPropsHTML();
  $('v').innerHTML='<div class="card" style="padding:10px">'
   +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktVolver','')+'">← Volver</button>'
   +'<input id="mkt_nom" value="'+esc(MK.edit.nombre||'')+'" placeholder="Nombre del diseño" style="flex:1;min-width:160px;background:var(--soft);border:1px solid var(--borde);color:var(--txt);border-radius:8px;padding:8px 10px">'
   +ft('cuadrado')+ft('vertical')+ft('story')+ft('banner')
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktUndo','')+'" aria-label="Deshacer">↶</button>'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktRedo','')+'" aria-label="Rehacer">↷</button>'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktAdaptar','')+'">🔄 Adaptar todos</button>'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktEstado','')+'">'+(MK.edit.estado==='listo'?'✅ Listo':'✏️ Borrador')+'</button>'
   +'<button class="btn p" data-h-click="call" data-a-click="'+_ha('mktGuardar','')+'">💾 Guardar</button>'
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktExportar','')+'">⬇ Exportar</button></div>'
   +'<div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">'
   +'<div style="width:230px;max-height:66vh;overflow:auto;flex:none">'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'
    +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktAddTxt','')+'">+ Texto</button>'
    +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktAddLogo','')+'">+ Logo</button>'
    +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktAddImg','')+'">+ Imagen</button></div>'
    +'<div class="tw">'+filasCapas+'</div></div>'
   +'<div style="flex:1;min-width:280px;text-align:center"><canvas id="mkt_cv" style="max-width:100%;background:var(--soft);border-radius:12px;touch-action:none;cursor:default"></canvas>'
    +'<div class="nota" style="margin-top:6px">'+MKT.FORMATOS[MK.fmt].nombre+' · '+MKT.FORMATOS[MK.fmt].w+'×'+MKT.FORMATOS[MK.fmt].h+'</div></div>'
   +'<div id="mkt_props" style="width:250px;max-height:66vh;overflow:auto;flex:none"><div class="tw">'+props+'</div>'
    +(MK.exp?'<div id="mkt_expo">'+mktExportHTML()+'</div>':'')+'</div></div></div>';
  mktDibujar();mktWireEditor();
}
function mktRefrescarProps(){
 var el=$('mkt_props');if(!el)return;
 el.innerHTML='<div class="tw">'+mktPropsHTML()+'</div>'+(MK.exp?'<div id="mkt_expo">'+mktExportHTML()+'</div>':'');
 mktWireEditor();
}
function mktPropsHTML(){
 var c=mktCapas().find(function(x){return x.id===MK.sel});
 if(!c)return '<div class="nota">Seleccione una capa para editar sus propiedades.</div>';
 var num=function(k,l,paso){return '<div style="margin:6px 0"><small>'+l+'</small><br><input type="number" step="'+(paso||1)+'" data-mkt="'+k+'" value="'+(c[k]==null?'':c[k])+'" style="width:100%;background:var(--soft);border:1px solid var(--borde);color:var(--txt);border-radius:6px;padding:5px 6px"></div>'};
 var h='<h4 style="margin:4px 0">'+(c.tipo==='img'?'Imagen':c.tipo==='txt'?'Texto':'Fondo')+'</h4>';
 if(c.tipo==='fondo')h+='<div style="margin:6px 0"><small>Color de fondo</small><br><input type="color" data-mkt="color" value="'+c.color+'"></div>';
 if(c.tipo==='txt'){
  h+='<div style="margin:6px 0"><small>Texto</small><br><textarea data-mkt="t" rows="2" style="width:100%;background:var(--soft);border:1px solid var(--borde);color:var(--txt);border-radius:6px;padding:5px 6px">'+esc(c.t||'')+'</textarea></div>';
  h+=num('size','Tamaño de letra');
  h+='<div style="margin:6px 0"><small>Color del texto</small><br><input type="color" data-mkt="color" value="'+(c.color||'#20222a')+'"></div>';
  h+='<div style="margin:6px 0"><small>Fondo del texto</small><br><input type="color" data-mkt="fondo" value="'+(c.fondo||'#ffffff')+'"> <label style="font-size:11px"><input type="checkbox" data-mkt="_nofondo" '+(c.fondo?'':'checked')+'> sin fondo</label></div>';
  h+='<div style="margin:6px 0"><small>Alineación</small><br><select data-mkt="align"><option value="center"'+(c.align==='center'?' selected':'')+'>Centro</option><option value="left"'+(c.align==='left'?' selected':'')+'>Izquierda</option><option value="right"'+(c.align==='right'?' selected':'')+'>Derecha</option></select></div>';
  h+='<div style="margin:6px 0"><small>Tipografía</small><br><select data-mkt="font">'+Object.keys(MKT.FUENTES).map(function(f){return '<option value="'+f+'"'+(c.font===f?' selected':'')+'>'+f+'</option>'}).join('')+'</select></div>';
 }
 if(c.tipo==='img'){
  h+='<div style="margin:6px 0"><small>Ajuste</small><br><select data-mkt="_fit"><option value="contain"'+((c.fit||'contain')==='contain'?' selected':'')+'>Completa (contain)</option><option value="cover"'+(c.fit==='cover'?' selected':'')+'>Llena (cover)</option></select></div>';
  h+=num('rad','Esquinas redondeadas');
 }
 if(c.tipo!=='fondo'){
  h+=num('op','Opacidad (0-1)',0.1)+num('rot','Rotación (°)',5);
  h+='<div class="nota" style="margin-top:8px">Arrastre en el lienzo para mover; los puntos de las esquinas cambian el tamaño.</div>';
 }
 return h;
}
function mktExportHTML(){
 var filas=Object.keys(MKT.FORMATOS).map(function(k){
  var F=MKT.FORMATOS[k];
  return '<tr><td>'+F.nombre.split('·')[0]+'</td><td>'+F.w+'×'+F.h+'</td>'
   +'<td><button class="btn s" data-h-click="call" data-a-click="'+_ha('mktExp',k+'|jpg')+'">JPG</button> '
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktExp',k+'|png')+'">PNG</button> '
   +'<button class="btn s" data-h-click="call" data-a-click="'+_ha('mktExp',k+'|webp')+'">WebP</button></td></tr>';
 }).join('');
 return '<h4 style="margin:12px 0 6px">⬇ Exportaciones</h4><div class="nota" style="margin-bottom:6px">Se guardan en esta empresa y se descargan. Máx. 700 KB por imagen.</div>'
  +'<table><tr><th>Formato</th><th>px</th><th></th></tr>'+filas+'</table>';
}
function mktDibujar(){
 var cv=$('mkt_cv');if(!cv)return;
 var F=MKT.FORMATOS[MK.fmt];
 var maxW=Math.min(620,(window.innerWidth||1200)-560);
 var esc=Math.max(.15,Math.min(1,(maxW>200?maxW:620)/F.w));
 cv.width=Math.round(F.w*esc);cv.height=Math.round(F.h*esc);
 cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';
 var x=cv.getContext('2d');
 MKT.render(x,MK.fmt,mktCapas(),MK.imgs,esc);
 var c=mktCapas().find(function(l){return l.id===MK.sel});
 if(c&&c.tipo!=='fondo'){
  x.strokeStyle='#4f8ef7';x.lineWidth=2;x.strokeRect(c.x*esc,c.y*esc,c.w*esc,c.h*esc);
  var ms=MKT.manejos(c);
  x.fillStyle='#fff';
  for(var k in ms){x.beginPath();x.arc(ms[k].x*esc,ms[k].y*esc,6,0,7);x.fill();x.stroke()}
 }
 cv._esc=esc;
}
/* Interacción del lienzo: mover / redimensionar capas. */
function mktWireEditor(){
 var cv=$('mkt_cv');if(!cv)return;
 var arrastre=null;
 cv.onpointerdown=function(ev){
  var esc=cv._esc||1,px=ev.offsetX/esc,py=ev.offsetY/esc;
  var capas=mktCapas();
  var sel=capas.find(function(l){return l.id===MK.sel});
  var man=sel?MKT.hitManejo(sel,px,py):null;
  if(man){arrastre={modo:'resize',man:man,capa:sel,x0:px,y0:py,o:{x:sel.x,y:sel.y,w:sel.w,h:sel.h}};mktHistorial();}
  else{
   var c=MKT.hit(px,py,capas);
   MK.sel=c?c.id:null;
   if(c){mktHistorial();arrastre={modo:'mover',capa:c,x0:px,y0:py,o:{x:c.x,y:c.y}}}
   mktRefrescarProps();
  }
  cv.setPointerCapture&&cv.setPointerCapture(ev.pointerId);
 };
 cv.onpointermove=function(ev){
  if(!arrastre)return;
  var esc=cv._esc||1,px=ev.offsetX/esc,py=ev.offsetY/esc,dx=px-arrastre.x0,dy=py-arrastre.y0;
  var c=arrastre.capa,o=arrastre.o,F=MKT.FORMATOS[MK.fmt];
  if(arrastre.modo==='mover'){
   c.x=Math.round(Math.max(-c.w/2,Math.min(F.w-c.w/2,o.x+dx)));
   c.y=Math.round(Math.max(-c.h/2,Math.min(F.h-c.h/2,o.y+dy)));
  }else{
   var m=arrastre.man;
   if(m.indexOf('e')>=0)c.w=Math.max(24,Math.round(o.w+dx));
   if(m.indexOf('s')>=0)c.h=Math.max(24,Math.round(o.h+dy));
   if(m.indexOf('o')>=0){c.w=Math.max(24,Math.round(o.w-dx));c.x=o.x+(o.w-c.w);}
   if(m.indexOf('n')>=0){c.h=Math.max(24,Math.round(o.h-dy));c.y=o.y+(o.h-c.h);}
   if(c.tipo==='txt'&&o.w)c.size=Math.max(14,Math.round((c.size||48)*c.w/o.w));
  }
  mktDibujar();
 };
 var fin=function(){if(arrastre){arrastre=null;mktRefrescarProps()}};
 cv.onpointerup=fin;cv.onpointercancel=fin;
 /* propiedades: actualizan la capa y el lienzo SIN re-render (no pierden foco) */
 document.querySelectorAll('[data-mkt]').forEach(function(inp){
  var oninput=function(){
   var c=mktCapas().find(function(l){return l.id===MK.sel});if(!c)return;
   var k=inp.getAttribute('data-mkt'),v=inp.value;
   if(k.charAt(0)==='_'){
    if(k==='_nofondo'){if(inp.checked)c.fondo='';else if(!c.fondo)c.fondo='#ffffff';}
    if(k==='_fit')c.fit=v;
   }else if(k==='t')c.t=v;
   else if(k==='op'||k==='rot'||k==='size'||k==='rad'){c[k]=v===''?0:+v;}
   else if(k==='align'||k==='font')c[k]=v;
   else c[k]=v;
   if(k!=='t'&&!inp._hist){inp._hist=1;mktHistorial()}
   mktDibujar();
  };
  inp.oninput=oninput;inp.onchange=oninput;
 });
}

/* ---------- Acciones ---------- */
function mktTab(k){MK.tab=k;MK.nuevo=null;MK.msg=null;marketingRender()}
function mktNuevo(){MK.nuevo=true;MK.msg=null;marketingRender();mktOpcionesImagen()}
function mktCancelar(){MK.nuevo=null;MK._pickImg=null;marketingRender()}
async function mktDePlantilla(id){
 await mktCargarMarca();
 var doc=id==='blanco'?MKT.docVacio():MKT.plantillaDoc(id,MK.marca);
 var aid=MK._pickAssetDirect||null;
 if(!aid&&MK._pickImg){
  var src=await mktResolverImagen(MK._pickImg);
  if(src)aid=await mktAddAsset(src);
 }
 if(aid)doc.formatos.vertical.layers.forEach(function(c){if(c.tipo==='img'&&c.assetId==='PRODUCTO')c.assetId=aid});
 MK.edit={id:uid(),nombre:(id==='blanco'?'Diseño nuevo':(MKT.PLANTILLAS.find(function(p){return p.id===id})||{}).nombre||'Diseño'),estado:'borrador',ts:Date.now()};
 MK.doc=doc;MK.guardado=null;MK._versiones=[];MK.fmt=doc.activo||'vertical';MK.sel=null;MK.hist=[];MK.fut=[];MK.exp=false;MK.nuevo=null;MK._pickImg=null;MK._pickAssetDirect=null;
 mktEditor();
}
function mktElegirImg(id){MK._pickImg=id;
 var el=$('mkt_pick');if(el){el.querySelectorAll('[data-h-click]').forEach(function(d){d.style.outline=''})}
 var o=(MK._picker||[]).find(function(x){return x.id===id});
 if(o&&el){/* marcar visualmente */var i=el.querySelector('img[src="'+o.src+'"]');if(i)i.style.border='2px solid var(--az)'}
 MK.msg={ok:true,t:'Imagen elegida: '+((o&&o.nombre)||'').slice(0,40)};mktPintarMarcaMsg();
}
function mktPintarMarcaMsg(){/* mensaje rápido sin re-render completo */}
function mktAbrir(id){
 var p=MK.proys.find(function(x){return x.id===id});if(!p)return;
 MK.edit={id:p.id,nombre:p.nombre,estado:p.estado,ts:p.ts};
 MK.doc=JSON.parse(JSON.stringify(p.doc||MKT.docVacio()));
 MK.guardado=JSON.parse(JSON.stringify(MK.doc));
 MK._versiones=(p.versiones||[]).slice(0,8);
 MK.fmt=MK.doc.activo||'vertical';MK.sel=null;MK.hist=[];MK.fut=[];MK.exp=false;
 mktEditor();
}
function mktVolver(){
 var sucio=MK.guardado&&JSON.stringify(MK.doc)!==JSON.stringify(MK.guardado);
 if(sucio&&!confirm('Hay cambios sin guardar. ¿Salir del editor?'))return;
 MK.edit=null;MK.doc=null;MK.exp=false;marketingRender();
}
async function mktGuardar(){
 if(!MK.edit)return;
 var nom=($('mkt_nom')&&$('mkt_nom').value||MK.edit.nombre||'').trim()||'Sin nombre';
 MK.edit.nombre=nom;MK.edit.ts=Date.now();
 var versiones=(MK._versiones||[]);
 if(MK.guardado)versiones.unshift({ts:Date.now(),doc:MK.guardado});
 versiones=versiones.slice(0,8);MK._versiones=versiones;
 try{
  await fbCol('marketing_projects').doc(MK.edit.id).set({id:MK.edit.id,nombre:nom,estado:MK.edit.estado,ts:MK.edit.ts,by:mktYo(),doc:MK.doc,versiones:versiones});
  MK.guardado=JSON.parse(JSON.stringify(MK.doc));
  try{localStorage.removeItem(lsk('tj_mkt_draft'))}catch(e){}
  MK.msg={ok:true,t:'✔ Diseño guardado.'};mktPintar();
 }catch(e){alert('No se pudo guardar: '+((e&&e.message)||e)+'\n¿Tiene permiso para esta empresa?')}
}
function mktEstado(){MK.edit.estado=MK.edit.estado==='listo'?'borrador':'listo';mktEditor()}
async function mktBorrar(id){
 if(!confirm('¿Eliminar este diseño y sus exportaciones? (las imágenes del catálogo NO se tocan)'))return;
 try{
  await fbCol('marketing_projects').doc(id).delete();
  var ex=await fbCol('marketing_exports').where('proy','==',id).get();
  for(var i=0;i<ex.docs.length;i++)await ex.docs[i].ref.delete();
  MK.msg={ok:true,t:'Diseño eliminado.'};mktPintar();
 }catch(e){alert('No se pudo eliminar: '+((e&&e.message)||e))}
}
function mktFmt(k){MK.fmt=k;MK.sel=null;MK.doc.activo=k;mktEditor()}
function mktSel(id){MK.sel=id;mktEditor()}
function mktSub(id){var c=mktCapas();var i=c.findIndex(function(x){return x.id===id});if(i>=0&&i<c.length-1){mktHistorial();var t=c[i];c[i]=c[i+1];c[i+1]=t;mktEditor()}}
function mktBajar(id){var c=mktCapas();var i=c.findIndex(function(x){return x.id===id});if(i>0){mktHistorial();var t=c[i];c[i]=c[i-1];c[i-1]=t;mktEditor()}}
function mktDup(id){var c=mktCapas();var i=c.findIndex(function(x){return x.id===id});if(i<0)return;mktHistorial();var n=JSON.parse(JSON.stringify(c[i]));n.id=MKT.uid();n.x+=30;n.y+=30;c.splice(i+1,0,n);MK.sel=n.id;mktEditor()}
function mktDel(id){var c=mktCapas();var i=c.findIndex(function(x){return x.id===id});if(i<0)return;if(c[i].tipo==='fondo')return;mktHistorial();c.splice(i,1);MK.sel=null;mktEditor()}
function mktUndo(){mktDeshacer()}
function mktRedo(){mktRehacer()}
function mktAdaptar(){
 if(!confirm('Se regeneran los OTROS formatos a partir de «Vertical». Los cambios hechos en ellos se pierden. ¿Continuar?'))return;
 mktHistorial();
 var maestro=MK.fmt!=='vertical'?MK.fmt:'vertical';
 MK.doc=MKT.adaptarDoc(MK.doc,maestro);
 mktEditor();
}
function mktAddTxt(){
 mktHistorial();
 var F=MKT.FORMATOS[MK.fmt];
 var c={id:MKT.uid('T'),tipo:'txt',t:'Nuevo texto',x:Math.round(F.w*.1),y:Math.round(F.h*.42),w:Math.round(F.w*.8),h:110,size:52,color:'#20222a',weight:700,align:'center',pad:18,op:1};
 mktCapas().push(c);MK.sel=c.id;mktEditor();
}
async function mktAddLogo(){
 await mktCargarMarca();
 var m=MK.marca||{};
 if(!m.logo)return alert('Suba primero el logo en la pestaña 🎨 Marca.');
 var aid=MK.assets['logo_'+mktEid()];
 if(!aid){
  var a=await mktAddAsset(m.logo);
  if(!a)return;
  MK.assets['logo_'+mktEid()]=a;aid=a;
 }
 mktHistorial();
 var F=MKT.FORMATOS[MK.fmt];
 var c={id:MKT.uid('I'),tipo:'img',assetId:aid,x:40,y:40,w:180,h:180,fit:'contain',op:1,rad:12};
 mktCapas().push(c);MK.sel=c.id;mktEditor();
}
function mktAddImg(){
 mktOpcionesImagen();
 var html='<div class="card" style="margin-top:10px"><h4 style="margin:0 0 8px">Agregar imagen</h4><div class="g" id="mkt_pick2"></div>'
  +'<div style="margin-top:8px"><button class="btn s" id="mkt_subir2">⬆ Subir…</button> <button class="btn s" data-h-click="call" data-a-click="'+_ha('mktCerrarPicker','')+'">Cerrar</button></div>'
  +'<input type="file" id="mkt_file2" accept="image/*" style="display:none"></div>';
 var host=document.querySelector('#v .card');
 if(host)host.insertAdjacentHTML('beforeend',html);
 mktPintarPicker2();
}
function mktCerrarPicker(){mktEditor()}
function mktPintarPicker2(){
 var el=$('mkt_pick2');if(!el)return;
 el.innerHTML=(MK._picker||[]).slice(0,24).map(function(o){
  return '<div style="cursor:pointer;text-align:center" data-h-click="call" data-a-click="'+_ha('mktUsarImg',o.id)+'">'
   +'<img src="'+o.src+'" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:10px;border:2px solid var(--borde)">'
   +'<small style="color:var(--gris)">'+esc(o.nombre||'')+'</small></div>';
 }).join('')||'<div class="nota">Sin imágenes: use «Subir…».</div>';
}
async function mktUsarImg(id){
 var src=await mktResolverImagen(id);if(!src)return alert('No se pudo cargar la imagen.');
 var aid=await mktAddAsset(src);if(!aid)return;
 mktHistorial();
 var F=MKT.FORMATOS[MK.fmt];
 var c={id:MKT.uid('I'),tipo:'img',assetId:aid,x:Math.round(F.w*.08),y:Math.round(F.h*.12),w:Math.round(F.w*.84),h:Math.round(F.h*.5),fit:'contain',op:1};
 mktCapas().push(c);MK.sel=c.id;mktEditor();
}
function mktExportar(){MK.exp=!MK.exp;mktEditor()}
async function mktExp(args){
 var p=String(args||'').split('|'),fmt=p[0],tipo=p[1]||'jpg';
 await mktCargarAssetsDoc(MK.doc);
 var capas=MK.doc.formatos[fmt].layers;
 var cv=MKT.canvas(fmt,capas,MK.imgs);
 var blob=await MKT.comprimir(cv,tipo,700);
 if(!blob)return alert('El navegador no pudo generar la imagen.');
 var du=await MKT.dataUrl(blob);
 try{
  var xid=uid();
  await fbCol('marketing_exports').doc(xid).set({id:xid,proy:MK.edit.id,fmt:fmt,tipo:tipo,img:du,ts:Date.now(),by:mktYo()});
 }catch(e){/* si falla el guardado, igual se descarga */}
 var a=document.createElement('a');
 a.href=URL.createObjectURL(blob);
 a.download=(MK.edit.nombre||'diseno')+'-'+fmt+'.'+(tipo==='jpg'?'jpg':tipo);
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
 MK.msg={ok:true,t:'✔ Exportación generada ('+fmt+' '+tipo+').'};
 mktPintarMsgEnEditor();
}
function mktPintarMsgEnEditor(){var el=document.querySelector('#v .nota');if(el&&MK.msg)el.textContent=MK.msg.t}

/* Colecciones */
function mktColNueva(){
 var n=prompt('Nombre de la colección:');if(!n)return;
 var cid=uid();
 fbCol('marketing_colecciones').doc(cid).set({id:cid,nombre:n,items:[],estado:'activa',ts:Date.now()}).catch(function(e){alert('No se pudo crear: '+e.message)});
}
function mktColRen(id){var c=MK.cols.find(function(x){return x.id===id});if(!c)return;var n=prompt('Nuevo nombre:',c.nombre);if(!n)return;fbCol('marketing_colecciones').doc(id).set({nombre:n},{merge:true})}
function mktColArc(id){var c=MK.cols.find(function(x){return x.id===id});if(!c)return;fbCol('marketing_colecciones').doc(id).set({estado:c.estado==='archivada'?'activa':'archivada'},{merge:true})}
function mktColBor(id){if(!confirm('¿Eliminar la colección? (los diseños NO se borran)'))return;fbCol('marketing_colecciones').doc(id).delete()}
async function mktMarcaGuardar(){
 var c1=($('mkt_c1')||{}).value,c2=($('mkt_c2')||{}).value,f=($('mkt_fuente')||{}).value;
 var marca={c1:c1,c2:c2,fuente:f,logo:(MK.marca&&MK.marca.logo)||''};
 try{
  await fbDb.collection('empresas').doc(mktEid()).set({marca:marca},{merge:true});
  MK.marca=marca;MK.msg={ok:true,t:'✔ Marca guardada.'};marketingRender();
 }catch(e){alert('No se pudo guardar la marca: '+((e&&e.message)||e))}
}
function mktWire(){
 var f=$('mkt_file');
 if(f)f.onchange=async function(){
  var b=this.files&&this.files[0];if(!b)return;
  var cb=await mktComprimirArchivo(b,500);
  if(!cb)return alert('Imagen no válida.');
  var du=await MKT.dataUrl(cb);
  var aid=await mktAddAsset(du);
  if(aid)MK._pickAsset=aid;
  MK._pickImg=null;MK._pickAssetDirect=aid;
  /* al crear desde plantilla se usa _pickAssetDirect como PRODUCTO */
  MK.msg={ok:true,t:'Imagen lista para el diseño.'};
 };
 var s=$('mkt_subir');if(s)s.onclick=function(){$('mkt_file').click()};
 var s2=$('mkt_subir2');if(s2)s2.onclick=function(){$('mkt_file2').click()};
 var f2=$('mkt_file2');
 if(f2)f2.onchange=async function(){
  var b=this.files&&this.files[0];if(!b)return;
  var cb=await mktComprimirArchivo(b,500);
  if(!cb)return alert('Imagen no válida.');
  var du=await MKT.dataUrl(cb);
  mktUsarDataUrl(du);
 };
 var lg=$('mkt_logo'),lgf=$('mkt_logof');
 if(lg&&lgf){lg.onclick=function(){lgf.click()};
  lgf.onchange=async function(){
   var b=this.files&&this.files[0];if(!b)return;
   var cb=await mktComprimirArchivo(b,300);
   if(!cb)return alert('Logo no válido.');
   var du=await MKT.dataUrl(cb);
   MK.marca=Object.assign({},MK.marca||{},{logo:du});
   try{await fbDb.collection('empresas').doc(mktEid()).set({marca:MK.marca},{merge:true});MK.msg={ok:true,t:'✔ Logo guardado.'}}
   catch(e){alert('No se pudo guardar el logo: '+e.message)}
   marketingRender();
  };}
 document.querySelectorAll('.mktAddCol').forEach(function(sel){
  sel.onchange=async function(){
   var pid=this.value,col=this.getAttribute('data-col');if(!pid||!col)return;
   var c=MK.cols.find(function(x){return x.id===col});if(!c)return;
   var items=(c.items||[]).slice();
   if(items.indexOf(pid)<0){items.push(pid);await fbCol('marketing_colecciones').doc(col).set({items:items},{merge:true})}
   this.value='';
  };
 });
}
async function mktUsarDataUrl(du){
 var aid=await mktAddAsset(du);if(!aid)return;
 mktHistorial();
 var F=MKT.FORMATOS[MK.fmt];
 var c={id:MKT.uid('I'),tipo:'img',assetId:aid,x:Math.round(F.w*.08),y:Math.round(F.h*.12),w:Math.round(F.w*.84),h:Math.round(F.h*.5),fit:'contain',op:1};
 mktCapas().push(c);MK.sel=c.id;mktEditor();
}

var TJ_MARKETING={render:marketingRender};
if(typeof window!=='undefined')window.TJ_MARKETING=TJ_MARKETING;
if(typeof module!=='undefined'&&module.exports)module.exports={MK:MK};
