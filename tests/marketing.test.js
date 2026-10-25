const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const MKT=require('../js/mkt-editor.js');

function ctxModulo(){ /* marketing.js en VM (sin DOM) */
 const ctx={console:{log(){},warn(){},error(){}}};vm.createContext(ctx);
 vm.runInContext(leer('js/mkt-editor.js'),ctx);
 vm.runInContext(leer('js/marketing.js'),ctx);
 return ctx;
}

test('Las 6 plantillas cubren los 4 formatos con las dimensiones del plan maestro',()=>{
 assert.equal(MKT.PLANTILLAS.length,6);
 for(const p of MKT.PLANTILLAS){
  const d=MKT.plantillaDoc(p.id,{c1:'#111111',c2:'#222222'});
  assert.equal(MKT.docOk(d),true,'plantilla inválida: '+p.id);
  for(const k in MKT.FORMATOS){
   assert.equal(d.formatos[k].w,MKT.FORMATOS[k].w,p.id+' '+k);
   assert.equal(d.formatos[k].h,MKT.FORMATOS[k].h,p.id+' '+k);
  }
  assert.ok(d.formatos.vertical.layers.length>=3,p.id+' muy vacía');
 }
});

test('La adaptación a story respeta la zona segura y no toca el formato maestro',()=>{
 const d=MKT.plantillaDoc('promo');
 const antes=JSON.stringify(d.formatos.vertical.layers);
 const out=MKT.adaptarDoc(d,'vertical');
 assert.equal(JSON.stringify(out.formatos.vertical.layers),antes,'el maestro no cambia');
 const seg=MKT.FORMATOS.story.segura;
 out.formatos.story.layers.forEach(function(c){
  if(c.tipo==='fondo')return;
  assert.ok(c.y>=seg.top-1,'story: capa sobre la zona segura ('+c.y+')');
  assert.ok(c.y+c.h<=MKT.FORMATOS.story.h-seg.bottom+1,'story: capa bajo la zona segura ('+(c.y+c.h)+')');
 });
});

test('La adaptación al banner mantiene todas las capas dentro del lienzo',()=>{
 const out=MKT.adaptarDoc(MKT.plantillaDoc('descuento'),'vertical');
 const B=MKT.FORMATOS.banner;
 out.formatos.banner.layers.forEach(function(c){
  if(c.tipo==='fondo')return;
  assert.ok(c.x>=0&&c.y>=0&&c.x+c.w<=B.w+1&&c.y+c.h<=B.h+1,'fuera del banner: '+JSON.stringify({x:c.x,y:c.y,w:c.w,h:c.h}));
 });
});

test('Editar un formato no altera los demás (requisito del plan §3)',()=>{
 const d=MKT.plantillaDoc('nuevo');
 d.formatos.story.layers[1].t='EDITADO SOLO AQUÍ';
 assert.ok(!JSON.stringify(d.formatos.vertical).includes('EDITADO SOLO AQUÍ'));
 assert.ok(!JSON.stringify(d.formatos.cuadrado).includes('EDITADO SOLO AQUÍ'));
 assert.ok(!JSON.stringify(d.formatos.banner).includes('EDITADO SOLO AQUÍ'));
});

test('Hit-testing elige la capa superior y los manejos de tamaño se detectan',()=>{
 const capas=[
  {id:'a',tipo:'img',assetId:'x',x:0,y:0,w:500,h:500},
  {id:'b',tipo:'img',assetId:'x',x:100,y:100,w:500,h:500}
 ];
 assert.equal(MKT.hit(150,150,capas).id,'b','la superior gana');
 assert.equal(MKT.hit(10,10,capas).id,'a');
 assert.equal(MKT.hit(900,900,capas),null,'fuera de todo');
 const sel=capas[1];
 assert.equal(MKT.hitManejo(sel,600,600),'se','esquina sureste');
 assert.equal(MKT.hitManejo(sel,100,100),'nw','esquina noroeste');
 assert.equal(MKT.hitManejo(sel,350,350),null,'el centro no es un manejo');
});

test('La marca de la empresa sustituye los colores de plantilla',()=>{
 const d=MKT.plantillaDoc('promo',{c1:'#123456',c2:'#654321'});
 const plano=JSON.stringify(d);
 assert.ok(!plano.includes('#MARCA1')&&!plano.includes('#MARCA2'),'quedan tokens de marca');
 assert.ok(plano.includes('#123456')&&plano.includes('#654321'));
});

test('El módulo solo toca las colecciones marketing y los metadatos de empresa',()=>{
 const src=leer('js/marketing.js');
 const cols=[...src.matchAll(/(?:fbCol\(\s*|\.collection\(\s*)'([^']+)'/g)].map(m=>m[1]);
 const permitidas=['marketing_projects','marketing_assets','marketing_exports','marketing_colecciones','empresas','miembros','tienda_items'];
 /* miembros = subcolección de metadatos empresas/{eid}/miembros (declaración de acceso, no datos de negocio) */
 for(const c of cols)assert.ok(permitidas.includes(c),'colección inesperada en marketing.js: '+c);
 assert.ok(cols.includes('marketing_projects')&&cols.includes('empresas'),'debe usar sus colecciones');
});

test('EMP_NEGOCIO enruta las 4 colecciones de marketing a la empresa activa',()=>{
 const ctx={};vm.createContext(ctx);
 vm.runInContext(leer('js/empresa-contexto.js'),ctx);
 for(const c of ['marketing_projects','marketing_assets','marketing_exports','marketing_colecciones'])
  assert.ok(ctx.TJEmpresa.EMP_NEGOCIO[c],'falta en EMP_NEGOCIO: '+c);
 assert.equal(ctx.TJEmpresa.empColPath('marketing_projects'),'empresas/tarjeteria-jhon/marketing_projects');
 assert.equal(ctx.TJEmpresa.empColPath('roles'),'roles','identidad sigue global');
});

test('Las reglas aíslan el marketing por empresa (administración o miembros)',()=>{
 const r=leer('firestore.rules');
 assert.match(r,/function esMiembroEmpresa\(eid\)/);
 assert.match(r,/exists\(\/databases\/\$\(database\)\/documents\/empresas\/\$\(eid\)\/miembros\/\$\(request\.auth\.uid\)\)/);
 const bloques=(r.match(/match \/empresas\/\{eid\}\/marketing_\w+\/\{id\} \{\s*allow read, write: if esMiembroEmpresa\(eid\);/g)||[]).length;
 assert.equal(bloques,4,'los 4 bloques de marketing usan esMiembroEmpresa');
 /* ningún marketing con lectura pública */
 assert.doesNotMatch(r,/marketing_\w+\/\{id\} \{[\s\S]{0,120}allow read: if true/);
});

test('index.html carga el motor y la vista de marketing antes que app.js',()=>{
 const html=leer('index.html');
 const pos=[html.indexOf('js/mkt-editor.js?v='),html.indexOf('js/marketing.js?v='),html.indexOf('js/app.js?v=')];
 assert.ok(pos.every(p=>p>0),'faltan script tags');
 assert.ok(pos[1]>pos[0],'la vista va después del motor');
 assert.ok(pos[2]>pos[1],'app.js va último');
 assert.match(html,/js\/app\.js\?v=(tiktok-live-20\d{6}[a-z]|modulos-fase-\d+[a-z]|csp-fase-\d+|arreglos-fase-\d+|a11y-fase-\d+|rendimiento-fase-\d+|avisos-fase-\d+|a11y-restante-fase-\d+|hallazgos-fase-\d+|modulos-fase-\d+[a-z]?-?[a-z0-9]*)/);
});

test('El panel integra la vista Marketing visible para vendedores con permiso',()=>{
 const app=require('./helpers/app-fuentes').appTodo();
 assert.match(app,/V\.push\(\['marketing','🎨','Marketing'\]\)/);
 assert.match(app,/R\.marketing=marketingRender/);
 /* NO se excluye de PANELES ni de puede: el permiso por vendedor decide */
 assert.match(app,/const PANELES=V\.filter\(v=>v\[0\]!=='config'&&v\[0\]!=='vend'&&v\[0\]!=='mapa'&&v\[0\]!=='empresas'\)/);
 assert.match(app,/k!=='config'&&k!=='vend'&&k!=='mapa'&&k!=='empresas'&&/);
});

test('marketing.js carga limpio en VM y expone su render',()=>{
 const ctx=ctxModulo();
 assert.equal(typeof ctx.marketingRender,'function');
 assert.equal(typeof ctx.MKT.plantillaDoc,'function','el motor queda disponible');
 assert.equal(ctx.MK.tab,'proyectos','estado inicial');
});
