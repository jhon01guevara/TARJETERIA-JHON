const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

/* Carga empresa-contexto.js + empresas.js + migración en un contexto de VM
   (sin DOM ni Firebase: solo se prueban las partes puras). */
function cargar(){
 const ctx={};vm.createContext(ctx);
 vm.runInContext(leer('js/empresa-contexto.js'),ctx);
 vm.runInContext(leer('js/empresas.js'),ctx);
 vm.runInContext(leer('migraciones/migracion-multiempresa.js'),ctx);
 return ctx;
}

test('El contexto de empresa arranca con la separación ACTIVADA (activación 2026-10-22)',()=>{
 const ctx=cargar();
 assert.equal(ctx.MULTIEMP,true,'MULTIEMP=true desde la activación: negocio bajo empresas/{eid}');
 assert.equal(ctx.TJEmpresa.EMPRESA_DEF.id,'tarjeteria-jhon');
 assert.equal(ctx.TJEmpresa.empActiva(),'tarjeteria-jhon','sin URL ni preferencia: empresa inicial');
 assert.equal(ctx.TJEmpresa.empEsInicial(),true);
 assert.equal(ctx.TJEmpresa.empPath(),'empresas/tarjeteria-jhon');
});

test('Los slugs de empresa se validan y la preferencia se guarda',()=>{
 const ctx=cargar();
 const ok=ctx.TJEmpresa.empSlugOk;
 assert.equal(ok('tarjeteria-jhon'),true);
 assert.equal(ok('dulceria-la-central'),true);
 assert.equal(ok('ab'),false,'muy corto');
 assert.equal(ok('-mal'),false);
 assert.equal(ok('doble--guion'),false);
 assert.equal(ok('Mayusculas'),false);
 assert.equal(ok(null),false,'null NO es un slug válido (no debe leerse como el texto "null")');
 assert.equal(ok(undefined),false);
 /* Sin preferencia guardada (getItem devuelve null): empresa inicial, nunca null. */
 ctx.localStorage={getItem:()=>null,setItem(){}};
 assert.equal(ctx.TJEmpresa.empActiva(),'tarjeteria-jhon');
 ctx.localStorage={_v:'',getItem(){return this._v},setItem(k,v){this._v=v}};
 assert.equal(ctx.TJEmpresa.empSet('dulceria-la-central'),true);
 assert.equal(ctx.TJEmpresa.empSet('NO VALIDO'),false);
 assert.equal(ctx.TJEmpresa.empActiva(),'dulceria-la-central');
});

test('Las claves locales se particionan por empresa conservando las actuales de la inicial',()=>{
 const ctx=cargar();
 assert.equal(ctx.TJEmpresa.empLSKey('tj_db'),'tj_db','la empresa inicial conserva tj_db tal cual (retro-compatible)');
 ctx.localStorage={getItem:()=>'dulceria-la-central',setItem(){}};
 assert.equal(ctx.TJEmpresa.empLSKey('tj_db'),'tj_db_dulceria-la-central');
 assert.equal(ctx.TJEmpresa.empLSKey('tj_shop_cart'),'tj_shop_cart_dulceria-la-central');
});

test('El registro de empresas valida nombre, slug, colores y contacto',()=>{
 const ctx=cargar();
 const san=ctx.empSan;
 assert.equal(san({nombre:'A'}).err!==undefined,true,'nombre demasiado corto');
 assert.equal(san({nombre:'Dulcería La Central',slug:'XX'}).err!==undefined,true,'slug inválido');
 assert.equal(san({nombre:'Dulcería',email:'roto'}).err!==undefined,true,'correo inválido');
 const d=san({nombre:'Dulcería La Central',color:'#123456',tel:'+507 6000-0000'});
 assert.deepEqual({id:d.id,slug:d.slug,color:d.color,estado:d.estado},
  {id:'dulceria-la-central',slug:'dulceria-la-central',color:'#123456',estado:'activa'});
 assert.equal(san({nombre:'Dulcería',slug:'dulceria-la-central',estado:'pausa'}).estado,'pausa');
 const auto=ctx.empNormSlug('  Distribuidora  Jhon & Amigos ');
 assert.equal(auto,'distribuidora-jhon-amigos');
});

test('Los dominios de empresa se normalizan y validan',()=>{
 const ctx=cargar();
 const h=ctx.empHostOk;
 assert.equal(h('https://Tienda.MiEmpresa.com/Path'),'tienda.miempresa.com');
 assert.equal(h('miempresa.com'),'miempresa.com');
 assert.equal(h('tienda.miempresa.com'),'tienda.miempresa.com');
 assert.equal(h('no es dominio'),'');
 assert.equal(h(''),'');
});

test('El módulo de empresas solo usa las colecciones nuevas empresas y dominios',()=>{
 const src=leer('js/empresas.js');
 const cols=[...src.matchAll(/\.collection\('([^']+)'\)/g)].map(m=>m[1]);
 assert.ok(cols.length>=6,'debe referenciar las colecciones');
 for(const c of cols)assert.ok(c==='empresas'||c==='dominios','colección inesperada: '+c);
});

test('La herramienta de migración no contiene ninguna escritura de Firestore',()=>{
 const src=leer('migraciones/migracion-multiempresa.js');
 assert.doesNotMatch(src,/\.set\(/);
 assert.doesNotMatch(src,/\.update\(/);
 assert.doesNotMatch(src,/\.delete\(/);
 assert.doesNotMatch(src,/\.add\(/);
 assert.match(src,/\.get\(\)/,'debe leer con get');
});

test('El mapa de migración cubre todas las colecciones actuales del panel',()=>{
 const ctx=cargar();
 assert.equal(ctx.MIG_MAPA.length,17);
 const plano=ctx.MIG_MAPA.map(r=>r.join(' ')).join('\n');
 for(const c of ['panel/data','panel/loginbg','panel_public/general','panel_public/contador','panel_public/clientes',
  'vendedores','catalogo','tienda_items','tienda_leads','tienda_pedidos','galeria','chats','llamadas',
  'wa_conversaciones','investigacion_items','perfiles / presencia / roles'])
  assert.ok(plano.includes(c),'falta en el mapa: '+c);
});

test('La simulación detecta riesgos sobre datos de prueba',()=>{
 const ctx=cargar();
 const s={panelData:{cfg:{users:[{id:'v1'}],sig:10},cli:[{id:'c1',n:'Ana'},{id:'c1',n:'Ana 2'}],fac:[
   {id:'f1',n:9,vend:'admin'},{id:'f2',n:12,vend:'fantasma'}]},
  contador:{sig:12},clientesCli:[{id:'c1',n:'Ana'}],
  vendedores:{v1:{fac:[{id:'f3',n:5},{id:'f3',n:5}]},desconocido:{fac:[]}},
  tiendaPedidos:[{id:'p1',ref:'admin'},{id:'p2',ref:'nadie'}],tiendaLeads:[{id:'l1',ref:'admin'}]};
 const inf=ctx.migAnalizar(s,'tarjeteria-jhon');
 assert.equal(inf.destino,'empresas/tarjeteria-jhon');
 assert.equal(inf.conteos['tienda_pedidos'],2);
 assert.equal(inf.ok,false,'hay riesgos: debe marcarlos');
 const texto=inf.alertas.join(' | ');
 assert.match(texto,/fantasma/,'vendedor desconocido en factura');
 assert.match(texto,/vendedor desconocido|No está en cfg.users/,'doc privado de vendedor no declarado');
 assert.match(texto,/repetido/,'id de cliente o factura repetido');
 assert.match(texto,/contador/,'contador vs numeración real');
 assert.match(texto,/ref desconocida/,'pedido con ref inválida');
});

test('La simulación queda en verde con datos limpios y conserva conteos',()=>{
 const ctx=cargar();
 const s={panelData:{cfg:{users:[{id:'v1'}],sig:20},cli:[{id:'c1',n:'Ana'}],fac:[{id:'f1',n:19,vend:'admin'}]},
  contador:{sig:20},clientesCli:[{id:'c1',n:'Ana'}],
  vendedores:{v1:{fac:[{id:'f3',n:7}]}},catalogo:[{id:'a',data:'x'.repeat(1000)}],
  tiendaPedidos:[{id:'p1',ref:'admin'}],tiendaLeads:[]};
 const inf=ctx.migAnalizar(s);
 assert.equal(inf.ok,true,'sin riesgos: '+inf.alertas.join(' | '));
 assert.equal(inf.conteos['catalogo'],1);
 assert.equal(inf.conteos['tienda_leads'],0);
 assert.ok(inf.validaciones.some(v=>/Tamaño estimado/.test(v)));
});

test('index.html carga los módulos multiempresa antes que app.js',()=>{
 const html=leer('index.html');
 const pos=[html.indexOf('js/empresa-contexto.js?v='),html.indexOf('js/empresas.js?v='),
  html.indexOf('migraciones/migracion-multiempresa.js?v='),html.indexOf('js/app.js?v=')];
 assert.ok(pos.every(p=>p>0),'faltan script tags: '+pos.join(','));
 assert.ok(pos[3]>Math.max(pos[0],pos[1],pos[2]),'app.js debe cargarse después');
 assert.match(html,/js\/app\.js\?v=(tiktok-live-20\d{6}[a-z]|modulos-fase-\d+[a-z]|csp-fase-\d+|arreglos-fase-\d+|a11y-fase-\d+)/);
});

test('El panel integra la vista Empresas solo para administración',()=>{
 const app=require('./helpers/app-fuentes').appTodo();
 assert.match(app,/V\.push\(\['empresas','🏢','Empresas'\]\)/);
 assert.match(app,/R\.empresas=empresasRender/);
 assert.match(app,/k!=='config'&&k!=='vend'&&k!=='mapa'&&k!=='empresas'/);
 assert.match(app,/v\[0\]!=='config'&&v\[0\]!=='vend'&&v\[0\]!=='mapa'&&v\[0\]!=='empresas'/);
 const reglas=leer('firestore.rules');
 assert.match(reglas,/match \/empresas\/\{id\} \{\s*allow read: if esMiembroEmpresa\(id\);\s*allow write: if isAdmin\(\);/);
 assert.match(reglas,/match \/dominios\/\{host\} \{\s*allow read: if true;\s*allow write: if isAdmin\(\);/);
});
