/* ===== Migración multiempresa · EJECUTOR de la Fase 6 =====
   Copia la estructura actual a la ruta destino empresas/{eid}/… dentro de un
   proyecto Firebase de PRUEBAS que el administrador conecta desde
   migraciones/migrar-pruebas.html.

   GARANTÍA DE AISLAMIENTO: este archivo NO referencia la base de datos de
   producción ni una sola vez — ni para leer ni para escribir. Todo se hace
   sobre dstDb, la conexión al proyecto de pruebas que se le inyecta por
   parámetro. La lectura de producción la hace MIGRACION_MULTI.snapshot()
   (solo .get()). Verificado estáticamente por tests/fase6.test.js. */
'use strict';

/* ---------- Plan de copia (PURO, testeable en Node sin Firebase) ----------
   Recibe la instantánea (migSnapshot) y produce la lista de escrituras
   {p:ruta, d:datos} en empresas/{eid}/… según MIG_MAPA. Idempotente. */
function migEjSinAuxiliares(o){/* quita SOLO las llaves _msgs/_ice que añade el snapshot */
 var r={};for(var k in o)if(k!=='_msgs'&&k!=='_ice')r[k]=o[k];return r;
}
function migEjMaxN(s){
 var mx=0;
 [].concat((s.panelData&&s.panelData.fac)||[],Object.keys(s.vendedores||{}).reduce(function(a,id){return a.concat((s.vendedores[id]&&s.vendedores[id].fac)||[])},[]))
  .forEach(function(f){if(f&&+f.n>mx)mx=+f.n});
 return mx;
}
function migPlan(s,eid){
 s=s||{};eid=eid||'tarjeteria-jhon';
 var base='empresas/'+eid,ops=[],avisos=[];
 var ahora=new Date().toISOString();
 /* Documento de metadatos de la empresa en el destino (como empInicialRegistrar). */
 ops.push({p:'empresas/'+eid,d:{id:eid,slug:eid,nombre:'Tarjetería Jhon',logo:'',color:'#E0457B',
  color2:'#0F6CBD',contacto:{tel:'',email:''},estado:'activa',inicial:true,ts:ahora}});
 if(s.panelData&&Object.keys(s.panelData).length)ops.push({p:base+'/panel/data',d:s.panelData});
 if(s.loginBg)ops.push({p:base+'/panel/loginbg',d:s.loginBg});
 if(s.publicGeneral)ops.push({p:base+'/panel_public/general',d:s.publicGeneral});
 /* Contador por empresa: inicia en max(numeración real)+1 (regla de la simulación). */
 var maxN=migEjMaxN(s),sig=(s.contador&&s.contador.sig)||0,sigDest=Math.max(sig,maxN+1);
 ops.push({p:base+'/panel_public/contador',d:{sig:sigDest}});
 if(sigDest!==sig)avisos.push('Contador destino ajustado: '+sig+' → '+sigDest+' (mayor número de factura +1).');
 ops.push({p:base+'/panel_public/clientes',d:{cli:Array.isArray(s.clientesCli)?s.clientesCli:[],_ts:ahora,mig:1}});
 /* Vendedores: documento raíz (si existe) + privado/data. */
 var nVend=0;
 Object.keys(s.vendedores||{}).forEach(function(id){
  var root=(s.vendedoresRoot||{})[id];
  if(root&&Object.keys(root).length)ops.push({p:base+'/vendedores/'+id,d:root});
  ops.push({p:base+'/vendedores/'+id+'/privado/data',d:s.vendedores[id]});
  nVend++;
 });
 /* Colecciones simples: {id,…} → empresas/{eid}/{col}/{id}. */
 function col(nombre,arr){
  if(!Array.isArray(arr))return;
  arr.forEach(function(x){if(x&&x.id)ops.push({p:base+'/'+nombre+'/'+x.id,d:migEjSinAuxiliares(x)})});
 }
 col('catalogo',s.catalogo);col('tienda_items',s.tiendaItems);col('tienda_leads',s.tiendaLeads);
 col('tienda_pedidos',s.tiendaPedidos);col('galeria',s.galeria);col('wa_conversaciones',s.waConversaciones);
 col('investigacion_items',s.investigacion);
 /* Chats con su subcolección msgs y llamadas con ice. */
 var nMsgs=0,nIce=0;
 (Array.isArray(s.chats)?s.chats:[]).forEach(function(c){
  if(!c||!c.id)return;
  ops.push({p:base+'/chats/'+c.id,d:migEjSinAuxiliares(c)});
  (c._msgs||[]).forEach(function(m){if(m&&m.id){ops.push({p:base+'/chats/'+c.id+'/msgs/'+m.id,d:migEjSinAuxiliares(m)});nMsgs++}});
 });
 (Array.isArray(s.llamadas)?s.llamadas:[]).forEach(function(l){
  if(!l||!l.id)return;
  ops.push({p:base+'/llamadas/'+l.id,d:migEjSinAuxiliares(l)});
  (l._ice||[]).forEach(function(m){if(m&&m.id){ops.push({p:base+'/llamadas/'+l.id+'/ice/'+m.id,d:migEjSinAuxiliares(m)});nIce++}});
 });
 var conteos={};
 ops.forEach(function(o){
  if(o.p.indexOf(base+'/')!==0){conteos['(metadatos)']=(conteos['(metadatos)']||0)+1;return}
  var rel=o.p.slice(base.length+1).split('/'),k;
  if(rel[0]==='panel'||rel[0]==='panel_public')k=rel.join('/');
  else if(rel[0]==='vendedores')k='vendedores/'+rel[1];
  else if(rel[2]==='msgs')k='chats';
  else if(rel[2]==='ice')k='llamadas';
  else k=rel[0];
  conteos[k]=(conteos[k]||0)+1});
 return {eid:eid,base:base,ops:ops,avisos:avisos,conteos:conteos,
  resumen:{escrituras:ops.length,vendedores:nVend,msgs:nMsgs,ice:nIce,contadorDestino:sigDest}};
}

/* ---------- Ejecución sobre el proyecto de PRUEBAS (dstDb) ---------- */
function migEjBytes(o){try{return (JSON.stringify(o)||'').length}catch(e){return 0}}
async function migCopiar(dstDb,plan,onProg){
 if(!dstDb||!plan||!plan.ops)throw new Error('Falta la conexión al proyecto de pruebas o el plan.');
 /* Lotes limitados por CANTIDAD (≤400 ops) y por PESO (≤6 MB): Firestore
    rechaza lotes >10 MB ("transaction or write too big") con imágenes base64. */
 var hechos=0,errores=[],MAXOPS=400,MAXBYTES=6000000,i=0;
 while(i<plan.ops.length){
  var lote=[],bytes=0;
  while(i<plan.ops.length&&lote.length<MAXOPS&&bytes+migEjBytes(plan.ops[i].d)<=MAXBYTES){
   bytes+=migEjBytes(plan.ops[i].d);lote.push(plan.ops[i]);i++;
  }
  if(!lote.length){lote.push(plan.ops[i]);i++} /* documento grande: lote propio */
  var b=dstDb.batch();
  lote.forEach(function(o){b.set(dstDb.doc(o.p),o.d)});
  try{await b.commit();hechos+=lote.length}catch(e){errores.push(((e&&e.code)||'')+': '+((e&&e.message)||e))}
  if(onProg)onProg(hechos,plan.ops.length);
 }
 return {hechos:hechos,total:plan.ops.length,errores:errores};
}

/* Verificación: releer el destino y comparar conteos por colección. */
async function migVerificar(dstDb,plan){
 if(!dstDb||!plan)throw new Error('Falta la conexión al proyecto de pruebas o el plan.');
 var base=plan.base,det=[];
 async function chk(nombre,esperado,cuentaFn){
  var hallado=0;try{hallado=await cuentaFn()}catch(e){}
  det.push({coleccion:nombre,esperado:esperado,hallado:hallado,ok:hallado===esperado});
 }
 async function nCol(p){var sn=await dstDb.collection(p).get();return sn.size}
 await chk('panel/data',plan.conteos['panel/data']||0,async function(){return (await dstDb.doc(base+'/panel/data').get()).exists?1:0});
 await chk('panel/loginbg',plan.conteos['panel/loginbg']||0,async function(){return (await dstDb.doc(base+'/panel/loginbg').get()).exists?1:0});
 await chk('panel_public/general',plan.conteos['panel_public/general']||0,async function(){return (await dstDb.doc(base+'/panel_public/general').get()).exists?1:0});
 await chk('panel_public/contador',plan.conteos['panel_public/contador']||0,async function(){return (await dstDb.doc(base+'/panel_public/contador').get()).exists?1:0});
 await chk('panel_public/clientes',plan.conteos['panel_public/clientes']||0,async function(){return (await dstDb.doc(base+'/panel_public/clientes').get()).exists?1:0});
 var vIds=Object.keys(plan.conteos).filter(function(k){return k.indexOf('vendedores/')===0});
 await chk('vendedores/privado/data',vIds.length,async function(){
  var ok=0;
  for(var i=0;i<vIds.length;i++){
   var id=vIds[i].slice('vendedores/'.length);
   if((await dstDb.doc(base+'/vendedores/'+id+'/privado/data').get()).exists)ok++;
  }
  return ok;
 });
 var simples=['catalogo','tienda_items','tienda_leads','tienda_pedidos','galeria','wa_conversaciones','investigacion_items'];
 for(var c=0;c<simples.length;c++)
  await chk(simples[c],plan.conteos[simples[c]]||0,function(p){return function(){return nCol(base+'/'+p)}}(simples[c]));
 await chk('chats',plan.conteos['chats']||0,function(p){return function(){return nCol(base+'/'+p)}}('chats'));
 await chk('chats/msgs',plan.resumen.msgs,async function(){
  var sn=await dstDb.collection(base+'/chats').get(),n=0;
  for(var i=0;i<sn.docs.length;i++)n+=(await sn.docs[i].ref.collection('msgs').get()).size;
  return n;
 });
 await chk('llamadas',plan.conteos['llamadas']||0,function(p){return function(){return nCol(base+'/'+p)}}('llamadas'));
 await chk('llamadas/ice',plan.resumen.ice,async function(){
  var sn=await dstDb.collection(base+'/llamadas').get(),n=0;
  for(var i=0;i<sn.docs.length;i++)n+=(await sn.docs[i].ref.collection('ice').get()).size;
  return n;
 });
 return {ok:det.every(function(x){return x.ok}),detalle:det};
}

/* Borrado de ensayo en el proyecto de PRUEBAS (requisito c: repetir/restaurar). */
async function migBorrar(dstDb,eid){
 if(!dstDb)throw new Error('Falta la conexión al proyecto de pruebas.');
 var base='empresas/'+(eid||'tarjeteria-jhon'),ops=[];
 async function borrarCol(p){var sn=await dstDb.collection(p).get();sn.docs.forEach(function(d){ops.push(d.ref.delete())})}
 var snC=await dstDb.collection(base+'/chats').get();
 for(var i=0;i<snC.docs.length;i++){var ms=await snC.docs[i].ref.collection('msgs').get();ms.docs.forEach(function(m){ops.push(m.ref.delete())});ops.push(snC.docs[i].ref.delete())}
 var snL=await dstDb.collection(base+'/llamadas').get();
 for(var j=0;j<snL.docs.length;j++){var ic=await snL.docs[j].ref.collection('ice').get();ic.docs.forEach(function(m){ops.push(m.ref.delete())});ops.push(snL.docs[j].ref.delete())}
 var snV=await dstDb.collection(base+'/vendedores').get();
 snV.docs.forEach(function(d){ops.push(d.ref.collection('privado').doc('data').delete());ops.push(d.ref.delete())});
 var simples=['catalogo','tienda_items','tienda_leads','tienda_pedidos','galeria','wa_conversaciones','investigacion_items'];
 for(var c=0;c<simples.length;c++)await borrarCol(base+'/'+simples[c]);
 ops.push(dstDb.doc(base+'/panel/data').delete());
 ops.push(dstDb.doc(base+'/panel/loginbg').delete());
 ops.push(dstDb.doc(base+'/panel_public/general').delete());
 ops.push(dstDb.doc(base+'/panel_public/contador').delete());
 ops.push(dstDb.doc(base+'/panel_public/clientes').delete());
 ops.push(dstDb.doc(base).delete());
 var hechos=0;
 for(var k=0;k<ops.length;k+=400){
  var lote=ops.slice(k,k+400),b=dstDb.batch();
  lote.forEach(function(dl){b.delete(dl)});
  await b.commit();hechos+=lote.length;
 }
 return {borrados:hechos};
}

var MIG_EJECUTOR={plan:migPlan,copiar:migCopiar,verificar:migVerificar,borrar:migBorrar};
if(typeof window!=='undefined')window.MIG_EJECUTOR=MIG_EJECUTOR;
/* Export para tests de Node: el núcleo puro y el runner (con bd simulada). */
if(typeof module!=='undefined'&&module.exports)module.exports={migPlan:migPlan,migCopiar:migCopiar};
