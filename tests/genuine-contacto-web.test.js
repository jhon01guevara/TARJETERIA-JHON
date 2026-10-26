/* Contacto, nombre y políticas de la web = «Datos de la empresa» de cada empresa; sin textos fijos de otra empresa y con un respaldo neutro. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const app=leer('js/app.js'),pol=leer('js/politicas.js'),redes=leer('js/redes.js'),comp=leer('js/comprobante-pedido.js');
const fnSrc=n=>{const i=app.indexOf('function '+n+'(');assert.ok(i>=0,n);let d=0,k=app.indexOf('{',i);const ini=k;for(;k<app.length;k++){const c=app[k];if(c==='{')d++;else if(c==='}'){d--;if(!d)break}}return app.slice(i,k+1)};

test('«Datos de la empresa» replica también la dirección a la web y lo dice en el aviso',()=>{
 const f=fnSrc('cfg');
 assert.match(f,/contacto\.dir=DB\.cfg\.dir/);assert.match(f,/contacto\.email=DB\.cfg\.email;contacto\.tel=DB\.cfg\.tel/);
 assert.match(f,/dirección también se actualizaron en la web/);
 assert.match(f,/nombre:\$\('c1'\)\.value\|\|\(TJEmpresa\.empEsInicial\(\)\?'Tarjetería Jhon':''\)/,'otra empresa sin nombre no se llama «Tarjetería Jhon»');
});
test('los valores por defecto de DB.cfg son de Tarjetería SOLO en la empresa inicial',()=>{
 const l=app.split('\n').find(x=>x.startsWith('let DB={prod:[]'));
 for(const k of ['nombre','tel','email','dir','banco'])assert.match(l,new RegExp(k+':TJEmpresa\\.empEsInicial\\(\\)\\?'),k);
});
test('el teléfono con paréntesis («(507) 6074-1150») se acepta como contacto publicado',()=>{
 const ctx={window:{}};vm.createContext(ctx);vm.runInContext(redes,ctx);
 const r=JSON.parse(vm.runInContext('JSON.stringify(contLimpio({tel:"(507) 6074-1150",email:"a@b.co",dir:"Calle 1"}))',ctx));
 assert.equal(r.tel,'(507) 6074-1150');assert.equal(r.email,'a@b.co');assert.equal(r.dir,'Calle 1');
 assert.equal(JSON.parse(vm.runInContext('JSON.stringify(contLimpio({tel:"abc"}))',ctx)).tel,'');
});
test('políticas: ningún correo ni teléfono fijo salvo el último recurso de la empresa inicial; el resto sale de TJ_POLITICAS',()=>{
 const sin=pol.replace(/\(ini\?'[^']*':''\)/g,'');
 assert.doesNotMatch(sin,/tarjeteriajhon@gmail\.com|6074-1150|60741150/);
 assert.match(pol,/TJ_POLITICAS\.correo\?/);assert.match(pol,/TJ_POLITICAS\.tel\?/);assert.match(pol,/TJ_POLITICAS\.dir\?/);
 assert.match(pol,/aún no ha publicado sus datos de contacto/);
});
function polCtx(extra){
 const ctx=Object.assign({window:{},esc:s=>String(s??''),nombreNegocio:()=>'Genuine'},extra||{});
 vm.createContext(ctx);vm.runInContext(pol,ctx);return ctx;
}
test('políticas: otra empresa en la tienda usa SOLO sus datos publicados y, sin ellos, queda vacío (no hereda Tarjetería)',()=>{
 const ini=false;
 const ctx=polCtx({TJEmpresa:{empEsInicial:()=>ini}});
 vm.runInContext('var SHOP=true,SH={contacto:{email:"hola@genuine.com",tel:"(507) 111-2222",dir:"Zona Libre"}}',ctx);
 assert.equal(vm.runInContext('TJ_POLITICAS.correo+"|"+TJ_POLITICAS.tel+"|"+TJ_POLITICAS.dir',ctx),'hola@genuine.com|(507) 111-2222|Zona Libre');
 vm.runInContext('SH={contacto:{}};var DB={cfg:{email:"admin@tarjeteria.com",tel:"6074-1150"}}',ctx);
 assert.equal(vm.runInContext('TJ_POLITICAS.correo+"|"+TJ_POLITICAS.tel+"|"+TJ_POLITICAS.dir',ctx),'||','el visitante no ve los datos locales de quien administra');
});
test('políticas: la empresa inicial conserva su correo y teléfono de siempre como último recurso',()=>{
 const ctx=polCtx({TJEmpresa:{empEsInicial:()=>true}});
 vm.runInContext('var SHOP=true,SH={contacto:{}}',ctx);
 assert.equal(vm.runInContext('TJ_POLITICAS.correo+"|"+TJ_POLITICAS.tel',ctx),'tarjeteriajhon@gmail.com|6074-1150');
});
test('políticas: en el panel de otra empresa se leen sus «Datos de la empresa»',()=>{
 const ctx=polCtx({TJEmpresa:{empEsInicial:()=>false}});
 vm.runInContext('var DB={cfg:{email:"x@y.co",tel:"123",dir:"Av. 1"}}',ctx);
 assert.equal(vm.runInContext('TJ_POLITICAS.correo+"|"+TJ_POLITICAS.tel+"|"+TJ_POLITICAS.dir',ctx),'x@y.co|123|Av. 1');
});
test('el respaldo de la sección Contacto de la tienda es neutro para otras empresas',()=>{
 assert.match(app,/if\(!f\.length\)\{if\(TJEmpresa\.empEsInicial\(\)\)f\.push\(\['✉️','Correo'[^\n]*else f\.push\(\['ℹ️','Contacto','Esta empresa aún no ha publicado sus datos de contacto\.'\]\)\}/);
});
test('textos de cintillo, TikTok LIVE, remitente, voz y compartir usan el nombre de la empresa, no uno fijo',()=>{
 assert.doesNotMatch(app,/LIVE de Tarjetería Jhon|LIVE · Tarjetería Jhon|confianza en Tarjetería Jhon|\+' — Tarjetería Jhon'|<strong>Tarjetería Jhon<\/strong>/);
 assert.match(app,/honramos a Panamá/);assert.match(app,/PATRIO_TXT\.replace\('\{NEGOCIO\}',nombreNegocio\(\)\)/);
 assert.doesNotMatch(app.slice(app.indexOf('const PATRIO_TXT'),app.indexOf('const PATRIO_TXT')+400),/Tarjetería/);
 assert.equal((comp.match(/typeof nombreNegocio==='function'\?nombreNegocio\(\)/g)||[]).length,3,'el comprobante usa el nombre de la empresa en sus 3 formatos');
});
test('contactoWebSync: una sola vez, solo admin, SOLO rellena datos vacíos de la web y nunca pisa lo que ya hay',()=>{
 const src=fnSrc('contactoWebSync');
 const mk=o=>{const escrito=[];const ctx=Object.assign({window:{},DB:{cfg:{nombre:'Genuine',tel:'(507) 1',email:'a@g.co',dir:'Calle 5'}},esAdmin:()=>true,fbDb:{},
  fbCol:()=>({doc:()=>({set:(d,op)=>{escrito.push({d,op});return Promise.resolve()}})})},o||{});
  vm.createContext(ctx);vm.runInContext('let _cwSync=0;'+src,ctx);return {ctx,escrito};};
 let t=mk();t.ctx.contactoWebSync({contacto:{tel:'999',email:''},empresaNombre:''});
 assert.equal(t.escrito.length,1);let d=t.escrito[0].d;assert.equal(JSON.stringify(t.escrito[0].op),'{"merge":true}');
 assert.equal(d.contacto.tel,'999','no pisa el teléfono ya publicado');assert.equal(d.contacto.email,'a@g.co');assert.equal(d.contacto.dir,'Calle 5');
 assert.equal(d.empresaNombre,'Genuine');assert.equal(d.contactoSync,true);assert.equal(Object.keys(d).sort().join(),'__cfg,contacto,contactoSync,empresaNombre,ts');
 t.ctx.contactoWebSync({contacto:{}});assert.equal(t.escrito.length,1,'una sola vez por sesión');
 t=mk();t.ctx.contactoWebSync({contactoSync:true,contacto:{}});assert.equal(t.escrito.length,0,'ya sincronizado antes');
 t=mk({esAdmin:()=>false});t.ctx.contactoWebSync({contacto:{}});assert.equal(t.escrito.length,0,'solo administrador');
 t=mk();t.ctx.contactoWebSync(null);assert.equal(t.escrito.length,0,'sin plantilla leída de la nube no escribe');
 t=mk({DB:{cfg:{}}});t.ctx.contactoWebSync({contacto:{}});assert.equal(t.escrito.length,0,'sin datos propios no escribe');
 t=mk();t.ctx.contactoWebSync({contacto:{tel:'1',email:'e@e.co',dir:'d'},empresaNombre:'Ya'});
 assert.equal(t.escrito[0].d.contacto,undefined,'nada que rellenar: no toca contacto');assert.equal(t.escrito[0].d.empresaNombre,undefined);
});
test('el snapshot de la plantilla invoca la sincronización solo con documento real (no con la primera lectura vacía)',()=>{
 assert.match(app,/try\{redesFill\(\)\}catch\(e\)\{window\._tjw&&_tjw\(e\)\}try\{contactoWebSync\(cf\?cd:null\)\}/);
});
test('?v= y caché subidos por los archivos cambiados',()=>{
 const h=leer('index.html');
 assert.match(h,/js\/app\.js\?v=modulos-fase-24[i-z]/);assert.match(h,/js\/politicas\.js\?v=genuine-tienda-[c-z]/);
 assert.match(h,/js\/redes\.js\?v=genuine-tienda-[c-z]/);assert.match(h,/js\/comprobante-pedido\.js\?v=genuine-tienda-[c-z]/);
 assert.match(leer('sw.js'),/const V='tj-net-first-(29|[3-9]\d)'/);
});
