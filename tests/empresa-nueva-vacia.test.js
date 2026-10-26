/* Etapa 3 — alta de «Nueva empresa»: nace vacía (sin productos de ejemplo) salvo que se marque la casilla; todo se escribe en la empresa NUEVA y no en la activa;
   «Quitar ejemplos» (js/limpieza-empresa.js) solo quita lo marcado demo:1 y solo en la empresa activa que no es la inicial. Con un Firestore simulado. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const J=x=>JSON.parse(JSON.stringify(x));
function fsFalso(activa,inicial){
 const docs={},esc=[];
 const ref=p=>({path:p,set(d,o){esc.push({op:'set',p,d,o});docs[p]=Object.assign(o&&o.merge?docs[p]||{}:{},d);return Promise.resolve()},get:()=>Promise.resolve({id:p.split('/').pop(),data:()=>docs[p]})});
 const col=n=>({doc:id=>ref(n+'/'+id),get:()=>{const k=Object.keys(docs).filter(x=>x.startsWith(n+'/')&&x.split('/').length===n.split('/').length+1);return Promise.resolve({docs:k.map(x=>({id:x.split('/').pop(),data:()=>docs[x],ref:ref(x)}))})}});
 const lote=[];
 const fb={collection:col,batch:()=>({delete(r){lote.push({op:'del',p:r.path})},update(r,u){lote.push({op:'upd',p:r.path,u})},commit(){lote.forEach(o=>{if(o.op==='del')delete docs[o.p];else docs[o.p]=Object.assign(docs[o.p]||{},o.u)});esc.push(...lote.map(x=>({batch:x})));return Promise.resolve()}})};
 const ctx={window:{},console,alert(){},confirm:()=>true,_ha:(...a)=>JSON.stringify(a),esAdmin:()=>true,esc:s=>String(s),fbDb:fb,
  firebase:{firestore:{FieldValue:{delete:()=>'<<delete>>'}}},TJEmpresa:{empActiva:()=>activa,empEsInicial:()=>!!inicial,empSlugOk:s=>/^[a-z0-9][a-z0-9-]{2,39}$/.test(s)&&!/--/.test(s),EMPRESA_DEF:{id:'tarjeteria-jhon',nombre:'T'},MULTIEMP:true},
  empNombreActiva:()=>'Empresa Activa',document:{getElementById:()=>null},EM:null,Date,JSON,Object,Array,String};
 ctx.window=ctx;vm.createContext(ctx);
 for(const f of ['js/limpieza-empresa.js','js/empresas.js'])vm.runInContext(R(f),ctx,{filename:f});
 return{ctx,docs,esc,fb};
}
test('alta SIN ejemplos: solo el nombre en la tienda y el panel de la empresa NUEVA; nada en la activa; sin productos',()=>{
 const {ctx,docs,esc}=fsFalso('genuine');
 ctx.empCrearDemo({id:'dulceria-central',nombre:'Dulcería Central'},{ejemplos:false});
 const ks=Object.keys(docs).sort();
 assert.deepEqual(ks,['empresas/dulceria-central/panel/data','empresas/dulceria-central/tienda_items/__cfg']);
 assert.ok(esc.every(e=>/^empresas\/dulceria-central\//.test(e.p)),'ninguna escritura fuera de la empresa nueva: '+esc.map(e=>e.p));
 const c=docs['empresas/dulceria-central/tienda_items/__cfg'];
 assert.equal(c.empresaNombre,'Dulcería Central');assert.equal(c.heroTitle,'Dulcería Central');assert.equal(c.banners,undefined);assert.equal(c.heroPhotoUrl,undefined);assert.equal(c.demo,undefined);assert.equal(c.heroSub,undefined);
 const p=docs['empresas/dulceria-central/panel/data'];assert.deepEqual(J(Object.keys(p.cfg).sort()),['loginTitulo','nombre']);assert.equal(p.demo,undefined);
 assert.doesNotMatch(JSON.stringify(docs),/Producto de ejemplo|demo_|Tarjeter/i);
});
test('alta CON ejemplos: 3 productos, banner y textos marcados demo:1, todos en la empresa nueva',()=>{
 const {ctx,docs,esc}=fsFalso('tarjeteria-jhon',true);
 ctx.empCrearDemo({id:'dulceria-central',nombre:'Dulcería Central'},{ejemplos:true});
 assert.ok(esc.every(e=>/^empresas\/dulceria-central\//.test(e.p)));
 for(const i of [1,2,3]){const d=docs['empresas/dulceria-central/tienda_items/demo_'+i];assert.equal(d.demo,1);assert.match(d.name,/^Producto de ejemplo \d$/)}
 const c=docs['empresas/dulceria-central/tienda_items/__cfg'];assert.equal(c.demo,1);assert.equal(c.banners[0].id,'demo_b1');assert.match(c.heroSub,/^Bienvenido a Dulcería Central/);
 assert.equal(docs['empresas/dulceria-central/panel/data'].demo,1);
});
test('alta: id inválido o sin Firestore no escribe nada ni lanza',()=>{
 const {ctx,esc}=fsFalso('genuine');ctx.empCrearDemo({id:'../x',nombre:'X'},{ejemplos:true});ctx.empCrearDemo(null);assert.equal(esc.length,0);
 const a=fsFalso('genuine');a.ctx.fbDb=undefined;vm.runInContext('fbDb=undefined',a.ctx);a.ctx.empCrearDemo({id:'abc-def',nombre:'X'});assert.equal(a.esc.length,0);
});
test('Quitar ejemplos: escanea solo demo:1, pide confirmación y deja intactos los productos reales y la configuración propia',async()=>{
 const {ctx,docs,esc}=fsFalso('genuine');
 ctx.empCrearDemo({id:'genuine',nombre:'Genuine'},{ejemplos:true});
 docs['empresas/genuine/tienda_items/real1']={id:'real1',name:'Filtro de aceite',price:12,demo:undefined};
 docs['empresas/genuine/tienda_items/demo_9']={id:'demo_9',name:'No es de ejemplo',price:1};
 docs['empresas/genuine/tienda_items/__cfg'].banners.push({id:'propio',src:'https://x/y.png'});docs['empresas/genuine/tienda_items/__cfg'].empresaNombre='Genuine';
 const r=await ctx.empEjemplosEscanear();assert.deepEqual(J(r.items.map(i=>i.id).sort()),['demo_1','demo_2','demo_3']);assert.equal(r.banner,true);assert.equal(r.portada,true);
 let preg='';ctx.confirm=m=>{preg=m;return true};
 await ctx.empEjemplosQuitar();
 assert.match(preg,/3 productos de ejemplo.*banner de ejemplo.*portada de muestra/s);assert.match(preg,/No se borra nada más/);
 assert.ok(docs['empresas/genuine/tienda_items/real1']&&docs['empresas/genuine/tienda_items/demo_9'],'productos reales intactos');
 assert.equal(docs['empresas/genuine/tienda_items/demo_1'],undefined);
 const c=docs['empresas/genuine/tienda_items/__cfg'];assert.deepEqual(J(c.banners),[{id:'propio',src:'https://x/y.png'}],'solo se quita el banner de ejemplo');
 assert.equal(c.heroSub,'');assert.equal(c.heroBgType,'none');assert.equal(c.demo,'<<delete>>');assert.equal(c.empresaNombre,'Genuine');assert.equal(c.heroTitle,'Genuine');
 const r2=await ctx.empEjemplosEscanear();assert.equal(r2.items.length+(r2.banner?1:0)+(r2.portada?1:0),0);
});
test('Quitar ejemplos: si el usuario cancela no se borra nada; en la empresa inicial o sin ser admin no hace nada',async()=>{
 let t=fsFalso('genuine');t.ctx.empCrearDemo({id:'genuine',nombre:'Genuine'},{ejemplos:true});t.ctx.confirm=()=>false;
 const antes=JSON.stringify(t.docs);await t.ctx.empEjemplosQuitar();assert.equal(JSON.stringify(t.docs),antes);
 t=fsFalso('tarjeteria-jhon',true);t.ctx.empCrearDemo({id:'tarjeteria-jhon',nombre:'T'},{ejemplos:true});let avisos=0;t.ctx.alert=()=>avisos++;
 const a2=JSON.stringify(t.docs);await t.ctx.empEjemplosQuitar();assert.equal(JSON.stringify(t.docs),a2);assert.equal(avisos,1);
 t=fsFalso('genuine');t.ctx.esAdmin=()=>false;assert.equal(t.ctx.limpiezaPuede(),false);assert.equal(t.ctx.limpiezaHTML(),'');
});
test('formulario: la casilla de ejemplos solo aparece al crear (no al editar) y empieza sin marcar; empGuardar la lee antes de guardar',()=>{
 const e=R('js/empresas.js');
 assert.match(e,/\(EM\.edit\?'':'<label[^']*<input type="checkbox" id="em_ejemplos" style="margin-top:3px">/);assert.doesNotMatch(e,/id="em_ejemplos"[^>]*checked/);
 assert.ok(e.indexOf("$('em_ejemplos').checked")<e.indexOf("fbDb.collection('empresas').doc(d.id).set(d"));
 assert.doesNotMatch(e.slice(e.indexOf('function empCrearDemo'),e.indexOf('/* Dominios:')),/fbCol\(/,'empCrearDemo ya no usa fbCol (empresa activa)');
});
test('index.html: limpieza-empresa.js se carga una vez antes de empresas.js; el SW la precachea',()=>{
 const h=R('index.html');assert.equal(h.split('js/limpieza-empresa.js?v=').length-1,1);assert.ok(h.indexOf('js/limpieza-empresa.js')<h.indexOf('js/empresas.js'));assert.ok(h.indexOf('js/empresas.js')<h.indexOf('js/app.js?v='));
 assert.match(R('sw.js'),/'js\/limpieza-empresa\.js'/);
});
