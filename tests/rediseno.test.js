const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('index.html carga la capa Uber: CSS en <head> y el nav después de app.js',()=>{
 const html=leer('index.html');
 assert.match(html,/css\/uber-skin\.css\?v=\d/,'falta el <link> del skin');
 assert.ok(html.indexOf('css/uber-skin.css')<html.indexOf('</head>'),'el CSS va en el head, tras el estilo base');
 assert.match(html,/js\/uber-nav\.js\?v=1/,'falta el script del menú agrupado');
 const posApp=html.indexOf('js/app.js?v='),posNav=html.indexOf('js/uber-nav.js?v=1');
 assert.ok(posApp>0&&posNav>posApp,'uber-nav se carga después de app.js');
 /* la CSP sigue permitiendo assets propios */
 assert.match(html, /style-src 'self'/);
});

test('La capa Uber redefine los 4 temas con la paleta de la guía',()=>{
 const css=leer('css/uber-skin.css');
 assert.match(css,/--az:#000000/,'tema claro: acento negro');
 assert.match(css,/\[data-t="oceano"\]\{--az:#276EF1/);
 assert.match(css,/\[data-t="violeta"\]\{--az:#7B4FE0/);
 assert.match(css,/\[data-t="nocturno"\][\s\S]{0,200}--fondo:#000000/,'nocturno: fondo negro');
 assert.match(css,/\[data-t="nocturno"\][\s\S]{0,260}--card:#141414/);
 assert.match(css,/\.aurora\{display:none!important\}/,'sin fondo animado');
 assert.match(css,/\.wrap\{[^}]*max-width:1440px/,'ancho de contenido 1440');
 assert.match(css,/\.ug\{/,'títulos de grupo del menú');
 assert.match(css,/body\.navEd \.ug\{display:none\}/,'los títulos se ocultan al editar el orden');
 assert.match(css,/font-family:'Inter'/,'tipografía Inter');
});

test('uber-nav agrupa TODAS las secciones del menú y respeta la edición',()=>{
 const nav=leer('js/uber-nav.js');
 const claves=['home','nueva','fac','prod','cat','cli','ubi','check','agenda','config',
  'vend','mapa','gal','chat','tienda','tiktoklive','empresas','marketing'];
 for(const k of claves)
  assert.ok(nav.includes("'"+k+"'"),'falta la clave de menú en los grupos: '+k);
 assert.match(nav,/classList\.contains\('navEd'\)/,'se desactiva al editar el orden');
 assert.match(nav,/MutationObserver/,'reagrupa cuando app.js redibuja el menú');
 assert.match(nav,/'Más'/,'los ítems sin grupo caen en «Más»');
 assert.doesNotMatch(nav,/innerHTML\s*=/,'no reescribe el menú de app.js, solo reordena');
 assert.match(nav,/\{ t: 'Catálogo',[^\n]*'marketing'/);
});

test('La opción de tema ya no dice «rosa» (el acento claro ahora es negro)',()=>{
 const app=leer('js/app.js'),html=leer('index.html');
 assert.match(app,/\['claro','Claro'\]/);
 assert.match(html,/>Tema claro</);
 assert.doesNotMatch(html,/>Tema rosa</);
});
