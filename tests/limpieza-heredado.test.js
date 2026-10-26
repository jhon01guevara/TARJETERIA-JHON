/* Etapa 3 — «Quitar datos heredados de Tarjetería» de UNA empresa (js/limpieza-empresa.js), con Firestore simulado y la lista real de catalogo_default.zip.
   Solo se quita lo que coincide en id Y nombre con la lista de fábrica, los 6 productos de arranque exactos y los datos de contacto idénticos a los de Tarjetería;
   nunca en la empresa inicial; siempre con confirmación; no toca lo que la empresa creó. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),J=x=>JSON.parse(JSON.stringify(x));
function manifestZip(){
 const buf=fs.readFileSync(path.join(__dirname,'..','catalogo_default.zip'));let e=buf.length-22;while(buf.readUInt32LE(e)!==0x06054b50)e--;
 const n=buf.readUInt16LE(e+10);let p=buf.readUInt32LE(e+16);
 for(let i=0;i<n;i++){const met=buf.readUInt16LE(p+10),cs=buf.readUInt32LE(p+20),nl=buf.readUInt16LE(p+28),xl=buf.readUInt16LE(p+30),cl=buf.readUInt16LE(p+32),off=buf.readUInt32LE(p+42),name=buf.toString('utf8',p+46,p+46+nl);
  if(name==='manifest.json'){const ld=off+30+buf.readUInt16LE(off+26)+buf.readUInt16LE(off+28),raw=buf.subarray(ld,ld+cs);return JSON.parse((met===0?raw:zlib.inflateRawSync(raw)).toString('utf8'))}
  p+=46+nl+xl+cl}
 throw new Error('sin manifest');
}
const MF=manifestZip(),F1=MF.items[0],F2=MF.items[1],F3=MF.items[2];
function entorno(activa,inicial){
 const docs={},esc=[];
 const ref=p=>({path:p,set(d,o){docs[p]=Object.assign(o&&o.merge?docs[p]||{}:{},d);return Promise.resolve()}});
 const col=n=>({doc:id=>ref(n+'/'+id),get:()=>{const k=Object.keys(docs).filter(x=>x.startsWith(n+'/')&&x.split('/').length===n.split('/').length+1);return Promise.resolve({docs:k.map(x=>({id:x.split('/').pop(),data:()=>docs[x]}))})}});
 const fb={collection:col,batch:()=>{const l=[];return{delete(r){l.push(['d',r])},update(r,u){l.push(['u',r,u])},commit(){l.forEach(o=>{if(o[0]==='d')delete docs[o[1].path];else docs[o[1].path]=Object.assign(docs[o[1].path]||{},o[2])});esc.push(l.length);return Promise.resolve()}}}};
 const idb={},ctx={window:{},console,alert(){},confirm:()=>true,_ha:(...a)=>JSON.stringify(a),esAdmin:()=>true,esc:s=>String(s),fbDb:fb,
  firebase:{firestore:{FieldValue:{delete:()=>'<<delete>>'}}},TJEmpresa:{empActiva:()=>activa,empEsInicial:()=>!!inicial,empSlugOk:()=>true},empNombreActiva:()=>'Genuine',
  document:{getElementById:()=>null},Date,JSON,Object,Array,String,Number,Promise,
  fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}),
  JSZip:{loadAsync:async()=>({file:n=>n==='manifest.json'?{async:async()=>JSON.stringify(MF)}:null})},
  DB:{prod:[],cfg:{}},CL:[],tx:(m,fn)=>{fn({delete:id=>{delete idb[id]}});return Promise.resolve()},save(){ctx.__saves=(ctx.__saves||0)+1}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(R('js/limpieza-empresa.js'),ctx,{filename:'limpieza-empresa.js'});
 return{ctx,docs,esc,idb};
}
const arranque=()=>[['TARJETAS DE TODA OCACION',1.30],['TARJETAS DE TODA OCACION',1.25],['TARJETAS DE TODA OCACION',1.20],['TARJETAS DE TODA OCACION',1.15],['TARJETAS DE TODA OCACION',1.00],['TARJETAS DE TODA OCACION DISTRUBUCION',0.95]].map((p,i)=>({id:'p'+i,n:p[0],p:p[1]}));
function sembrar(e){
 const {ctx,docs}=e;
 docs['empresas/genuine/catalogo/'+F1.id]={id:F1.id,name:F1.name};docs['empresas/genuine/catalogo/'+F2.id]={id:F2.id,name:F2.name};
 docs['empresas/genuine/catalogo/propio1']={id:'propio1',name:'Filtro propio'};
 docs['empresas/genuine/catalogo/'+F3.id]={id:F3.id,name:'OTRO NOMBRE (no coincide)'};
 docs['empresas/genuine/tienda_items/'+F1.id]={id:F1.id,name:F1.name};docs['empresas/genuine/tienda_items/real1']={id:'real1',name:'Aceite'};docs['empresas/genuine/tienda_items/__cfg']={__cfg:true,heroTitle:'Genuine'};
 ctx.DB.prod=arranque().concat([{id:'xyz',n:'Mi producto',p:5}]);
 ctx.DB.cfg={nombre:'Tarjetería Jhon',tel:'(507) 6074-1150',email:'tarjeteriajhon@gmail.com',dir:'Panama Oeste',banco:'Banco General',ruc:'123'};
 ctx.CL=[{id:F1.id,name:F1.name},{id:'local-propio',name:'Mi modelo'}];e.idb[F1.id]=1;e.idb['local-propio']=1;
}
test('la lista de fábrica real tiene 88 modelos con id y nombre',()=>{assert.equal(MF.items.length,88);assert.ok(MF.items.every(i=>i.id&&i.name),'cada modelo con id y nombre');assert.equal(new Set(MF.items.map(i=>i.id)).size,88,'ids únicos')});
test('vista previa: encuentra solo lo heredado (id y nombre iguales), el arranque exacto y el contacto idéntico; no cambia nada',async()=>{
 const t=entorno('genuine');sembrar(t);const antes=JSON.stringify(t.docs);
 const r=await t.ctx.empHeredadoEscanear();
 assert.deepEqual(J(r.cat.map(x=>x.id).sort()),[F1.id,F2.id].sort());assert.deepEqual(J(r.tienda.map(x=>x.id)),[F1.id]);assert.deepEqual(J(r.local.map(x=>x.id)),[F1.id]);
 assert.equal(r.prod.length,6);assert.deepEqual(J(r.cfg.sort()),['email','nombre','tel']);
 assert.equal(JSON.stringify(t.docs),antes,'la vista previa no escribe nada');
});
test('quitar: borra catálogo y tienda heredados, arranque y contacto de Tarjetería; deja lo propio, dir/banco/ruc y el __cfg',async()=>{
 const t=entorno('genuine');sembrar(t);let preg='';t.ctx.confirm=m=>{preg=m;return true};
 await t.ctx.empHeredadoQuitar();
 assert.match(preg,/Se quitará de «Genuine»/);assert.match(preg,/SOLO de esta empresa/);assert.match(preg,/no se puede deshacer/);
 const ks=Object.keys(t.docs).sort();
 assert.deepEqual(ks,['empresas/genuine/catalogo/'+F3.id,'empresas/genuine/catalogo/propio1','empresas/genuine/tienda_items/__cfg','empresas/genuine/tienda_items/real1'].sort());
 assert.deepEqual(J(t.ctx.DB.prod),[{id:'xyz',n:'Mi producto',p:5}]);
 assert.deepEqual(J(t.ctx.DB.cfg),{dir:'Panama Oeste',banco:'Banco General',ruc:'123'});
 assert.equal(t.ctx.__saves,1,'se guarda por el camino normal (save), para que no se vuelva a subir');
 assert.deepEqual(J(t.ctx.CL.map(x=>x.id)),['local-propio']);assert.equal(t.idb[F1.id],undefined);assert.equal(t.idb['local-propio'],1);
 const r2=await t.ctx.empHeredadoEscanear();assert.equal(JSON.stringify(J(r2)),JSON.stringify({cat:[],tienda:[],local:[],prod:[],cfg:[]}));
});
test('quitar: cancelar en la confirmación no cambia nada; en la empresa inicial o sin ser admin no actúa',async()=>{
 let t=entorno('genuine');sembrar(t);t.ctx.confirm=()=>false;const a=JSON.stringify(t.docs),p=JSON.stringify(t.ctx.DB);
 await t.ctx.empHeredadoQuitar();assert.equal(JSON.stringify(t.docs),a);assert.equal(JSON.stringify(t.ctx.DB),p);assert.equal(t.ctx.__saves,undefined);
 t=entorno('tarjeteria-jhon',true);sembrar(t);let av=0;t.ctx.alert=()=>av++;const b=JSON.stringify(t.docs);await t.ctx.empHeredadoQuitar();assert.equal(JSON.stringify(t.docs),b);assert.equal(av,1);
 t=entorno('genuine');sembrar(t);t.ctx.esAdmin=()=>false;await t.ctx.empHeredadoQuitar();assert.equal(Object.keys(t.docs).length,7);
});
test('si no se puede leer la lista de fábrica NO se borra nada y se avisa',async()=>{
 const t=entorno('genuine');sembrar(t);t.ctx.fetch=async()=>({ok:false});const a=JSON.stringify(t.docs);
 await t.ctx.empHeredadoPrevia();assert.equal(t.ctx.LIMP.her,null);assert.equal(t.ctx.LIMP.msg.ok,false);
 await t.ctx.empHeredadoQuitar();assert.equal(JSON.stringify(t.docs),a);assert.equal(t.ctx.LIMP.msg.ok,false);assert.equal(t.ctx.__saves,undefined);
});
test('borra en lotes de 400 (límite de Firestore 500)',async()=>{
 const t=entorno('genuine');const n=MF.items.length;MF.items.forEach(i=>{t.docs['empresas/genuine/catalogo/'+i.id]={id:i.id,name:i.name};t.docs['empresas/genuine/tienda_items/'+i.id]={id:i.id,name:i.name}});
 await t.ctx.empHeredadoQuitar();assert.deepEqual(J(t.esc),[n*2]);assert.equal(Object.keys(t.docs).length,0);
 const ops=[];for(let i=0;i<450;i++)ops.push({del:{path:'x/'+i}});t.esc.length=0;await t.ctx.limpiezaLotes(ops);assert.deepEqual(J(t.esc),[400,50]);
});
test('arranque: solo los 6 exactos; un producto propio con nombre parecido o precio distinto no cuenta',()=>{
 const t=entorno('genuine'),f=t.ctx.limpiezaEsArranque;
 assert.ok(arranque().every(p=>f(p)));assert.equal(f({id:'p0',n:'TARJETAS DE TODA OCACION',p:2}),false);assert.equal(f({id:'p9',n:'TARJETAS DE TODA OCACION',p:1.3}),false);assert.equal(f({id:'p0',n:'Tarjetas propias',p:1.3}),false);assert.equal(f(null),false);
});
test('contacto: solo valores idénticos a los de Tarjetería; banco y dirección genéricos no se tocan',()=>{
 const f=entorno('genuine').ctx.limpiezaCfgTJ;
 assert.deepEqual(J(f({nombre:'Tarjetería Jhon',tel:'(507) 6074-1150',email:'Tarjeteriajhon@gmail.com'}).sort()),['email','nombre','tel']);
 assert.deepEqual(J(f({nombre:'Genuine',tel:'+507 111',email:'a@b.com',dir:'Panama Oeste',banco:'Banco General'})),[]);assert.deepEqual(J(f(null)),[]);
});
test('el módulo no escribe en otras empresas: todas las rutas salen de la empresa activa',()=>{
 const s=R('js/limpieza-empresa.js').replace(/\/\*[\s\S]*?\*\//g,'');
 assert.doesNotMatch(s,/fbCol\(/);assert.doesNotMatch(s,/collection\('empresas'\)/);assert.match(s,/function limpiezaCol\(n\)\{return fbDb\.collection\('empresas\/'\+TJEmpresa\.empActiva\(\)\+'\/'\+n\)\}/);
});
