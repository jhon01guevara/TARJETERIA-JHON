/* Textos, etiquetas (temas), iconos y manifest de Tarjetería Jhon: solo en la empresa inicial. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const app=leer('js/app.js'),temas=leer('js/tienda-temas.js'),vend=leer('js/dashboard-vendedor.js');
const fnSrc=n=>{const i=app.indexOf('function '+n+'(');assert.ok(i>=0,n);let d=0,k=app.indexOf('{',i);for(;k<app.length;k++){const c=app[k];if(c==='{')d++;else if(c==='}'){d--;if(!d)break}}return app.slice(i,k+1)};

function cargarTemas(inicial){
 const env={TJEmpresa:{empEsInicial:()=>inicial},shopN:s=>String(s).toLowerCase()};vm.createContext(env);
 vm.runInContext(temas+';this.__T={TEMAS,temaOf,temaMeta}',env);return env.__T;
}
test('empresa inicial: conserva sus 17 temas y la clasificación automática',()=>{
 const T=cargarTemas(true);assert.equal(T.TEMAS.length,17);
 assert.deepEqual([...T.temaOf({name:'Tarjeta de Boda'})],['boda']);assert.deepEqual([...T.temaOf({name:'xyz'})],['otros']);
});
test('otra empresa: sin temas de Tarjetería (Quinceañero, Boda…); se clasifica solo por sus categorías',()=>{
 const T=cargarTemas(false);assert.equal(T.TEMAS.length,0);
 assert.deepEqual([...T.temaOf({name:'Tarjeta de Boda',tags:['boda','otros']})],[]);assert.deepEqual([...T.temaOf({name:'Filtro',cat:'Motor'})],[]);
});
test('la tienda de otra empresa titula el filtro «Categorías» y el panel no muestra el selector de temas',()=>{
 assert.match(app,/<h3>\$\{TEMAS\.length\?'Por ocasión':'Categorías'\}<\/h3>/);
 assert.match(app,/const tm=!TEMAS\.length\?'<small>—<\/small>':`<details class="tdtm" id="tdd_/);
});
test('el texto de compartir del vendedor usa el nombre de la empresa, nunca «Tarjetería Jhon» fijo',()=>{
 assert.doesNotMatch(vend,/Tarjetería Jhon/);assert.match(vend,/catálogo virtual de '\+nombreNegocio\(\)/);
});
test('shopMetaEmpresa: otra empresa sin manifest, canonical, og:url ni iconos de Tarjetería; la inicial no cambia',()=>{
 const f=fnSrc('shopMetaEmpresa');
 assert.match(f,/^function shopMetaEmpresa\(\)\{\n if\(TJEmpresa\.empEsInicial\(\)\|\|typeof document==='undefined'\)return;/);
 assert.match(f,/link\[rel=manifest\]'\);if\(mf\)mf\.remove\(\)/);assert.match(f,/link\[rel=canonical\]/);assert.match(f,/og:url/);
 assert.match(f,/'link\[rel=icon\]','link\[rel=apple-touch-icon\]'/);
 assert.doesNotMatch(f,/icon-192|apple-touch-icon\.png|Tarjeter/);
 assert.match(app,/function shopInit\(\)\{try\{shopMetaEmpresa\(\)\}catch\(e\)\{window\._tjw&&_tjw\(e\)\}shopPurge\(\);/);
 assert.match(fnSrc('shopBrandRefresh'),/document\.title=nombreNegocio\(\);shopMetaEmpresa\(\)/);
});
test('nomArch: nombres de archivo de siempre en la empresa inicial; el de la empresa en las demás',()=>{
 const env={TJEmpresa:{empEsInicial:()=>false},nombreNegocio:()=>'Genuine Parts S.A.'};vm.createContext(env);
 vm.runInContext(fnSrc('nomArch')+';this.f=nomArch',env);
 assert.equal(env.f('agenda_tarjeteria_jhon','agenda_'),'agenda_genuine_parts_s_a');
 const e2={TJEmpresa:{empEsInicial:()=>true},nombreNegocio:()=>'x'};vm.createContext(e2);vm.runInContext(fnSrc('nomArch')+';this.f=nomArch',e2);
 assert.equal(e2.f('agenda_tarjeteria_jhon','agenda_'),'agenda_tarjeteria_jhon');
 for(const n of ['agenda_tarjeteria_jhon','ubicaciones_tarjeteria_jhon','respaldo_tarjeteria_john','catalogo_tarjeteria_jhon'])assert.match(app,new RegExp("nomArch\\('"+n));
});
test('logo del panel y de la factura: otra empresa nunca cae al logo de Tarjetería; placeholders de redes neutros',()=>{
 assert.match(fnSrc('panelLogoApply'),/TJEmpresa\.empEsInicial\(\)\?'assets\/logo\.png':\(typeof empDemoLogo/);
 assert.match(app,/function facLogoSrc\(c,def\)\{c=c\|\|\{\};if\(c\.logoFac\)return c\.logoFac;if\(TJEmpresa\.empEsInicial\(\)\)return def;/);
 assert.match(app,/\{tiktok:'@su_empresa',instagram:'@su_empresa',facebook:'su\.empresa'\}/);
 assert.match(app,/<div class="sb2">\$\{TJEmpresa\.empEsInicial\(\)\?'Tarjetas para toda ocasión':''\}<\/div>/);
});
test('versiones subidas',()=>{
 const h=leer('index.html');assert.match(h,/js\/app\.js\?v=modulos-fase-24[k-z]/);assert.match(h,/js\/tienda-temas\.js\?v=genuine-tienda-d/);
 assert.match(leer('sw.js'),/tj-net-first-(3[1-9]|[4-9]\d)/);
});
