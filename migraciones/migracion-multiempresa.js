/* ===== Migración multiempresa · MODO SIMULACIÓN (Fase 5 del plan) =====
   Lee la estructura actual, valida relaciones y tamaños, y produce un informe
   del mapeo a empresas/{id}/… SIN ESCRIBIR NADA en Firestore.

   GARANTÍA DE SOLO LECTURA: este archivo no contiene ninguna llamada de
   escritura de Firestore (set / update / remove / add) — verificado estáticamente
   por tests/multiempresa.test.js. Puede ejecutarse cuantas veces sea (idempotente).

   El núcleo (mapa + analizar) es puro y testeable en Node; solo simular() toca
   Firebase y el DOM, siempre con .get(). */
'use strict';

/* Mapeo origen → destino para la empresa inicial (ver docs/ESQUEMA-MULTIEMPRESA.md).
   tipo: 'doc' (documento único), 'col' (colección), 'sub' (subcolección por usuario). */
var MIG_MAPA=[
 ['panel/data','panel/data','doc','DB del administrador (cli, fac, ubi, agenda, cfg)'],
 ['panel/loginbg','panel/loginbg','doc','Fondo de la pantalla de login'],
 ['panel_public/general','panel_public/general','doc','Productos y configuración compartida'],
 ['panel_public/contador','panel_public/contador','doc','Contador de numeración de facturas'],
 ['panel_public/clientes','panel_public/clientes','doc','Lista compartida de clientes'],
 ['vendedores/{uid}/privado/data','vendedores/{uid}/privado/data','sub','Datos privados de cada vendedor'],
 ['catalogo','catalogo','col','Archivos del catálogo (imágenes base64)'],
 ['tienda_items','tienda_items','col','Productos publicados en la tienda'],
 ['tienda_items/__cfg','tienda_items/__cfg','doc','Configuración de apariencia de la tienda'],
 ['tienda_leads','tienda_leads','col','Registros de clientes de la tienda'],
 ['tienda_pedidos','tienda_pedidos','col','Pedidos de la tienda'],
 ['galeria','galeria','col','Fotos de la galería'],
 ['chats (+msgs)','chats (+msgs)','col','Chat entre administración y vendedores'],
 ['llamadas (+ice)','llamadas (+ice)','col','Señalización de llamadas de voz'],
 ['wa_conversaciones','wa_conversaciones','col','Conversaciones del agente de WhatsApp'],
 ['investigacion_items','investigacion_items','col','Investigación de productos'],
 ['perfiles / presencia / roles','(global, sin cambio)','doc','Identidad de personas: quedan globales']
];

function migBytes(o){try{return (JSON.stringify(o)||'').length}catch(e){return 0}}
function migKB(b){return Math.round(b/102.4)/10}

/* Núcleo puro: recibe las lecturas y devuelve el informe. Sin Firebase, sin DOM. */
function migAnalizar(s,empresaInicial){
 s=s||{};empresaInicial=empresaInicial||'tarjeteria-jhon';
 var alertas=[],valid=[],conteos={},eid='empresas/'+empresaInicial;
 var pd=s.panelData&&typeof s.panelData==='object'?s.panelData:{};

 /* --- conteos por colección --- */
 conteos['panel/data']=migBytes(pd)?1:0;
 conteos['panel/loginbg']=migBytes(s.loginBg)?1:0;
 conteos['panel_public/general']=migBytes(s.publicGeneral)?1:0;
 conteos['panel_public/contador']=migBytes(s.contador)?1:0;
 conteos['panel_public/clientes']=Array.isArray(s.clientesCli)?s.clientesCli.length:0;
 conteos['vendedores/privado/data']=Object.keys(s.vendedores||{}).length;
 conteos['catalogo']=Array.isArray(s.catalogo)?s.catalogo.length:0;
 conteos['tienda_items']=Array.isArray(s.tiendaItems)?s.tiendaItems.filter(function(x){return x&&x.id!=='__cfg'}).length:0;
 conteos['tienda_leads']=Array.isArray(s.tiendaLeads)?s.tiendaLeads.length:0;
 conteos['tienda_pedidos']=Array.isArray(s.tiendaPedidos)?s.tiendaPedidos.length:0;
 conteos['galeria']=Array.isArray(s.galeria)?s.galeria.length:0;
 conteos['chats']=Array.isArray(s.chats)?s.chats.length:0;
 conteos['llamadas']=Array.isArray(s.llamadas)?s.llamadas.length:0;
 conteos['wa_conversaciones']=Array.isArray(s.waConversaciones)?s.waConversaciones.length:0;
 conteos['investigacion_items']=Array.isArray(s.investigacion)?s.investigacion.length:0;

 /* --- tamaño del documento destino panel/data (límite Firestore: 1 MB) --- */
 var tam=migBytes(pd);
 valid.push('Tamaño estimado de '+eid+'/panel/data: '+migKB(tam)+' KB (límite 1 MB por documento).');
 if(tam>950000)alertas.push('El documento panel/data pesa '+migKB(tam)+' KB y se acerca al límite de 1 MB. Antes de migrar conviene dividirlo (por ejemplo, facturas antiguas a una subcolección).');

 /* --- facturas ↔ vendedores conocidos --- */
 var users=((pd.cfg&&pd.cfg.users)||[]).map(function(u){return u&&u.id}).filter(Boolean);
 var conocidos={};['admin'].concat(users).forEach(function(id){conocidos[id]=1});
 var fac=Array.isArray(pd.fac)?pd.fac:[];
 var sinVend=fac.filter(function(f){return f&&f.vend&&!conocidos[f.vend]});
 valid.push('Facturas del admin: '+fac.length+' · vendedores declarados en cfg.users: '+users.length+'.');
 if(sinVend.length)alertas.push(sinVend.length+' factura(s) del panel tienen un vendedor desconocido ('+[].concat(sinVend.map(function(f){return f.vend}).slice(0,3)).join(', ')+'…). Revisar antes de migrar para no perder la relación.');

 /* --- vendedores: docs privados y solapamiento de facturas --- */
 var facVend=0,facVendDuplicadas=0;
 Object.keys(s.vendedores||{}).forEach(function(id){
  var v=s.vendedores[id]||{};facVend+=(Array.isArray(v.fac)?v.fac.length:0);
  if(!conocidos[id])alertas.push('Existe documento privado del vendedor "'+id+'" que NO está en cfg.users del admin.');
  if(!Array.isArray(v.fac))return;
  var ids={};v.fac.forEach(function(f){if(f&&f.id){if(ids[f.id])facVendDuplicadas++;ids[f.id]=1}});
  if((v.cfg&&v.cfg.sig)&&Array.isArray(v.fac)&&v.fac.length){/* ok: numeración se conserva del contador global */}
 });
 valid.push('Facturas en documentos de vendedores: '+facVend+'.');
 if(facVendDuplicadas)alertas.push(facVendDuplicadas+' factura(s) con id repetido dentro de un mismo vendedor.');

 /* --- clientes: ids y duplicados evidentes --- */
 var cli=Array.isArray(pd.cli)?pd.cli:(Array.isArray(s.clientesCli)?s.clientesCli:[]);
 var idsCli={},dupIds=0;cli.forEach(function(c){if(c&&c.id){if(idsCli[c.id])dupIds++;idsCli[c.id]=1}});
 valid.push('Clientes en el panel: '+cli.length+' (lista compartida: '+conteos['panel_public/clientes']+').');
 if(dupIds)alertas.push(dupIds+' id(s) de cliente repetido(s) en la lista. La migración debe mantener un id único por cliente.');
 if(cli.length&&conteos['panel_public/clientes']&&cli.length!==conteos['panel_public/clientes'])
  alertas.push('El panel tiene '+cli.length+' clientes y la lista compartida '+conteos['panel_public/clientes']+'. La migración usa la lista compartida como fuente; revisar la diferencia.');

 /* --- contador vs numeración real --- */
 var sig=(s.contador&&s.contador.sig)||((pd.cfg&&pd.cfg.sig)||0);
 var maxN=0;[].concat(fac,Object.keys(s.vendedores||{}).reduce(function(a,id){return a.concat((s.vendedores[id]&&s.vendedores[id].fac)||[])},[]))
  .forEach(function(f){if(f&&+f.n>maxN)maxN=+f.n});
 valid.push('Contador actual: '+sig+' · factura de mayor número: '+maxN+'.');
 if(maxN>=sig)alertas.push('Hay facturas con número ≥ al contador ('+maxN+' ≥ '+sig+'). Tras migrar, el contador por empresa debe iniciar en '+(maxN+1)+'.');

 /* --- pedidos y leads: referencias válidas --- */
 [['pedidos',s.tiendaPedidos],['leads',s.tiendaLeads]].forEach(function(par){
  var nom=par[0],l=(par[1]||[]).filter(function(x){return x&&x.ref&&!conocidos[x.ref]});
  valid.push('Tienda '+nom+': '+((par[1]||[]).length)+' registros.');
  if(l.length)alertas.push(l.length+' '+nom+' de tienda con ref desconocida ('+[].concat(l.map(function(x){return x.ref}).slice(0,3)).join(', ')+'…).');
 });

 /* --- catálogo: documentos pesados --- */
 if(s.catalogo&&s.catalogo.length){
  var pesados=s.catalogo.filter(function(x){return x&&((x.data&&x.data.length)||0)>950000});
  valid.push('Catálogo: '+s.catalogo.length+' archivos, '+migKB(s.catalogo.reduce(function(a,x){return a+((x&&x.data&&x.data.length)||0)},0))+' KB en total.');
  if(pesados.length)alertas.push(pesados.length+' archivo(s) del catálogo cerca del límite de 1 MB por documento.');
 }

 return {fecha:new Date().toISOString(),empresaInicial:empresaInicial,destino:eid,mapa:MIG_MAPA,
  conteos:conteos,tamanoPanelDataKB:migKB(tam),validaciones:valid,alertas:alertas,
  ok:alertas.length===0};
}

/* ---------- Ejecución en el panel (solo lectura) ---------- */
function migCol(nombre){return fbDb.collection(nombre).get().then(function(sn){return sn.docs.map(function(d){return d.data()})})}
async function migSimular(){
 if(typeof esAdmin==='function'&&!esAdmin())return alert('Solo el administrador puede ejecutar la simulación.');
 if(typeof fbDb==='undefined'||!fbDb)return alert('Sin conexión con Firebase.');
 var out=document.getElementById('emMigOut');
 if(out)out.innerHTML='<div class="nota">Leyendo colecciones (solo lectura)… puede tardar unos segundos.</div>';
 try{
  var pdDoc=await fbDb.doc('panel/data').get();
  var pd=pdDoc.exists?pdDoc.data():{};
  var users=(((pd||{}).cfg||{}).users||[]).map(function(u){return u&&u.id}).filter(Boolean);
  var vend={};
  for(var i=0;i<users.length;i++){
   var vd=await fbDb.doc('vendedores/'+users[i]+'/privado/data').get();
   if(vd.exists)vend[users[i]]=vd.data();
  }
  var lg=await fbDb.doc('panel/loginbg').get();
  var pg=await fbDb.doc('panel_public/general').get();
  var pc=await fbDb.doc('panel_public/contador').get();
  var pcl=await fbDb.doc('panel_public/clientes').get();
  var s={panelData:pd,loginBg:lg.exists?lg.data():null,publicGeneral:pg.exists?pg.data():null,
   contador:pc.exists?pc.data():null,clientesCli:(pcl.exists&&pcl.data().cli)||[],
   vendedores:vend,catalogo:await migCol('catalogo'),tiendaItems:await migCol('tienda_items'),
   tiendaLeads:await migCol('tienda_leads'),tiendaPedidos:await migCol('tienda_pedidos'),
   galeria:await migCol('galeria'),chats:await migCol('chats'),llamadas:await migCol('llamadas'),
   waConversaciones:await migCol('wa_conversaciones'),investigacion:await migCol('investigacion_items')};
  var informe=migAnalizar(s,(typeof TJEmpresa!=='undefined'&&TJEmpresa.EMPRESA_DEF)?TJEmpresa.EMPRESA_DEF.id:'tarjeteria-jhon');
  migPintar(informe);
 }catch(e){
  window._tjw&&window._tjw(e);
  if(out)out.innerHTML='<div class="nota" style="color:#b3261e">No se pudo completar la lectura: '+((e&&e.message)||e)+'. Revise conexión y permisos.</div>';
 }
}
function migPintar(inf){
 var out=document.getElementById('emMigOut');if(!out)return;
 var filas=Object.keys(inf.conteos).map(function(k){
  return '<div class="dl"><span><b>'+k+'</b></span><b>'+inf.conteos[k]+'</b></div>'
 }).join('');
 var al=inf.alertas.length?inf.alertas.map(function(a){return '<li>'+a+'</li>'}).join(''):'<li>✅ Sin riesgos detectados con los datos actuales.</li>';
 out.innerHTML='<div class="card" style="margin:0"><h3 style="margin:0 0 8px">Informe de simulación · '+inf.destino+'</h3>'
  +'<div class="g"><div><small style="color:var(--gris)">Tamaño panel/data destino</small><b>'+inf.tamanoPanelDataKB+' KB</b></div>'
  +'<div><small style="color:var(--gris)">Riesgos detectados</small><b style="color:'+(inf.alertas.length?'#b3261e':'#1e7a43')+'">'+inf.alertas.length+'</b></div></div>'
  +'<div class="tw" style="margin-top:12px">'+filas+'</div>'
  +'<h4 style="margin:14px 0 4px">Riesgos y pendientes</h4><ul style="margin:0 0 0 18px;font-size:12.5px;line-height:1.6">'+al+'</ul>'
  +'<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn p" id="emMigDl">⬇ Descargar informe (JSON)</button></div></div>';
 var b=document.getElementById('emMigDl');
 if(b)b.onclick=function(){
  var blob=new Blob([JSON.stringify(inf,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='informe-simulacion-multiempresa-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},4000);
 };
}
var MIGRACION_MULTI={mapa:MIG_MAPA,analizar:migAnalizar,simular:migSimular};
if(typeof window!=='undefined')window.MIGRACION_MULTI=MIGRACION_MULTI;
if(typeof module!=='undefined'&&module.exports)module.exports={MIG_MAPA:MIG_MAPA,migAnalizar:migAnalizar};
