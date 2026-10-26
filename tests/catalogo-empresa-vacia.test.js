/* Una empresa distinta de la inicial NO hereda el catálogo, los productos ni los modelos de Tarjetería Jhon; la inicial conserva todo. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const app=leer('js/app.js');
const fnSrc=n=>{const i=app.indexOf(n);assert.ok(i>=0,n);return app.slice(i,i+1400)};

test('el catálogo de fábrica (catalogo_default.zip) solo se precarga en la empresa inicial',()=>{
 const l=app.split('\n').find(x=>/precargarCatalogoDeFabrica\(\);\s*$/.test(x)&&/^if\(/.test(x));
 assert.ok(l,'llamada a precargarCatalogoDeFabrica');
 assert.match(l,/^if\(TJEmpresa\.empEsInicial\(\)&&!\/\[\?&\]tienda/);
});
test('los productos de arranque de facturación («TARJETAS DE TODA OCACION») solo se siembran en la empresa inicial',()=>{
 const l=app.split('\n').find(x=>x.includes("'TARJETAS DE TODA OCACION',1.30"));
 assert.match(l,/^if\(!DB\.prod\.length&&TJEmpresa\.empEsInicial\(\)\)/);
});
test('la barra «Modelos» de Inicio no usa apps/modelos-cintillo.json (modelos de Tarjetería) en otras empresas',()=>{
 assert.match(app,/const m=TJEmpresa\.empEsInicial\(\)\?\(await cintChk\(\)\)\.slice\(0,30\):\[\]/);
});
test('Check (módulo con los modelos de Tarjetería) muestra un estado vacío neutro en otras empresas',()=>{
 const c=app.slice(app.indexOf('check(){'),app.indexOf('check(){')+700);
 assert.match(c,/^check\(\)\{if\(!TJEmpresa\.empEsInicial\(\)\)\{\$\('v'\)\.innerHTML='.*aún no tiene modelos/s);
 assert.match(c,/return\}\n \$\('v'\)\.innerHTML=`<div class="card" style="padding:0;overflow:hidden/);
});
test('el service worker no precalienta apps/modelos.js (1,6 MB) en otras empresas',()=>{
 assert.match(app,/function precalentarModelos\(\)\{\n const c=navigator\.connection\|\|\{\};\n if\(SHOP\|\|!TJEmpresa\.empEsInicial\(\)\|\|/);
});
test('la tienda sin productos dice un texto neutro (no «Pronto tendremos…» ni nada de Tarjetería)',()=>{
 assert.match(app,/!SH\.items\.length\?'Esta tienda aún no tiene productos\.'/);
 assert.doesNotMatch(app,/Pronto tendremos productos/);
});
test('el panel de la tienda de otra empresa sin productos explica cómo empezar',()=>{
 assert.match(fnSrc('function tdTabla('),/TJEmpresa\.empEsInicial\(\)\?'<div class="vacio">Cargando el catálogo[^']*':'<div class="vacio">Aún no hay productos/);
});
test('versiones: app.js y caché del service worker subidas',()=>{
 assert.match(leer('index.html'),/js\/app\.js\?v=modulos-fase-24[j-z]/);
 assert.match(leer('sw.js'),/tj-net-first-(3\d|[4-9]\d)/);
});
