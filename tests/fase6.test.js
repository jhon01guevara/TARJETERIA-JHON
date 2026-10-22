const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {migPlan}=require('../migraciones/migracion-ejecutor.js');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

/* Instantánea de prueba (misma forma que MIGRACION_MULTI.snapshot()). */
const FIX={panelData:{cfg:{users:[{id:'v1'}],sig:10},cli:[{id:'c1'}],fac:[{id:'f1',n:9,vend:'admin'},{id:'f2',n:12,vend:'admin'}]},
 contador:{sig:12},clientesCli:[{id:'c1'}],vendedores:{v1:{fac:[{id:'f3',n:5}]}},vendedoresRoot:{v1:null},
 catalogo:[{id:'a',data:'x'}],tiendaItems:[{id:'i1'},{id:'__cfg',__cfg:true,redes:{ig:'x'}}],
 tiendaLeads:[{id:'l1',ref:'admin'}],tiendaPedidos:[{id:'p1',ref:'admin'}],galeria:[{id:'g1'}],
 chats:[{id:'ch1',members:[],_msgs:[{id:'m1',t:'hola'}]}],llamadas:[{id:'ll1',state:'ended',_ice:[{id:'c1'},{id:'c2'}]}],
 waConversaciones:[{id:'+50760000000',estado:'humano'}],investigacion:[{id:'inv1'}]};

test('El plan de copia produce las escrituras destino correctas',()=>{
 const p=migPlan(FIX,'tarjeteria-jhon');
 assert.equal(p.base,'empresas/tarjeteria-jhon');
 assert.equal(p.resumen.escrituras,18);
 assert.ok(p.ops.some(o=>o.p==='empresas/tarjeteria-jhon/panel/data'));
 assert.ok(p.ops.some(o=>o.p==='empresas/tarjeteria-jhon/vendedores/v1/privado/data'));
 assert.ok(p.ops.some(o=>o.p==='empresas/tarjeteria-jhon/chats/ch1/msgs/m1'));
 assert.ok(p.ops.some(o=>o.p==='empresas/tarjeteria-jhon/llamadas/ll1/ice/c2'));
 assert.ok(p.ops.some(o=>o.p==='empresas/tarjeteria-jhon'&&o.d.inicial===true),'incluye metadatos de la empresa');
 assert.equal(p.conteos['chats'],2,'chat + su msg');
 assert.equal(p.conteos['llamadas'],3,'llamada + 2 ice');
 assert.equal(p.conteos['tienda_items'],2,'producto + __cfg');
});

test('El contador destino arranca en mayor número de factura +1 (o se conserva si ya es mayor)',()=>{
 const p=migPlan(FIX,'tarjeteria-jhon');
 assert.equal(p.resumen.contadorDestino,13,'max n=12 → 13');
 assert.deepEqual(p.ops.find(o=>o.p.endsWith('panel_public/contador')).d,{sig:13});
 assert.match(p.avisos.join(' '),/12 → 13/);
 const p2=migPlan({panelData:{fac:[{id:'f1',n:3}]},contador:{sig:50},clientesCli:[],vendedores:{}},'tarjeteria-jhon');
 assert.equal(p2.resumen.contadorDestino,50,'el contador ya mayor se conserva');
});

test('Las llaves _msgs/_ice no se copian pero __cfg y sus redes sí se conservan',()=>{
 const p=migPlan(FIX,'tarjeteria-jhon');
 assert.equal(p.ops.find(o=>o.p==='empresas/tarjeteria-jhon/chats/ch1').d._msgs,undefined);
 const cfg=p.ops.find(o=>o.p==='empresas/tarjeteria-jhon/tienda_items/__cfg');
 assert.equal(cfg.d.__cfg,true);
 assert.deepEqual(cfg.d.redes,{ig:'x'});
});

test('El plan es determinista e idempotente (set completos, nunca incrementos)',()=>{
 const a=migPlan(FIX,'tarjeteria-jhon'),b=migPlan(FIX,'tarjeteria-jhon');
 assert.deepEqual(a.ops.map(o=>o.p),b.ops.map(o=>o.p));
 assert.ok(a.ops.every(o=>o.d&&typeof o.d==='object'));
});

test('El ejecutor JAMÁS referencia la base de datos de producción',()=>{
 const src=leer('migraciones/migracion-ejecutor.js');
 assert.ok(!src.includes('fbDb'),'el ejecutor no debe contener fbDb ni en comentarios');
 assert.ok(src.includes('dstDb'),'escribe sobre dstDb (proyecto de pruebas) inyectado por parámetro');
 src.split('\n').forEach((l,i)=>{
  if(/\.(?:set|delete)\(/.test(l))
   assert.match(l,/dstDb|\bb\.|d\.ref|m\.ref|ops\.push|dl/,'escritura fuera de dstDb en línea '+(i+1)+': '+l.trim());
 });
});

test('La herramienta de la Fase 6 es una página aparte y el panel NO la carga',()=>{
 const html=leer('migraciones/migrar-pruebas.html');
 const pos=[html.indexOf('empresa-contexto.js'),html.indexOf('migracion-multiempresa.js'),html.indexOf('migracion-ejecutor.js')];
 assert.ok(pos.every(x=>x>0),'carga los tres módulos');
 assert.ok(pos[2]>Math.max(pos[0],pos[1]),'el ejecutor se carga después del núcleo');
 assert.ok(html.includes('firebase-firestore-compat.js'),'usa el mismo Firebase que el panel');
 assert.ok(html.includes('ADMIN_UID'),'verifica sesión de administrador');
 const idx=leer('index.html');
 assert.ok(!idx.includes('migrar-pruebas'),'la herramienta no se carga desde el panel');
 assert.ok(!idx.includes('migracion-ejecutor'),'el ejecutor no se carga en el panel');
});

test('El snapshot de la Fase 6 enumera vendedores también vía roles y subcolecciones',()=>{
 const src=leer('migraciones/migracion-multiempresa.js');
 assert.match(src,/snapshot:migSnapshot/);
 assert.match(src,/collection\('roles'\)/,'enumera vendedores vía identidad global');
 assert.match(src,/chats','msgs'/,'captura msgs de chats');
 assert.match(src,/llamadas','ice'/,'captura ice de llamadas');
});

test('Las reglas permiten a administración LEER todo lo que la simulación enumera',()=>{
 const r=leer('firestore.rules');
 assert.match(r,/match \/vendedores\/\{uid\} \{\s*allow read: if isAdmin\(\);/,'documento padre de vendedores enumerable');
 assert.match(r,/match \/chats\/\{chat\} \{\s*allow read: if isAdmin\(\) \|\| chatMember/,'chats completos para administración');
 assert.match(r,/match \/msgs\/\{msg\} \{\s*allow read: if isAdmin\(\)/,'msgs de cualquier chat para administración');
 assert.match(r,/allow read, update: if isAdmin\(\)\s*\|\| \(logged\(\)/,'llamadas completas para administración');
});
