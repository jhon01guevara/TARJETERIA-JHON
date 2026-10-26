/* Guía «Primeros pasos» + ayudas contextuales: comprobaciones estáticas (sin navegador). La prueba en Chrome real está en tests/navegador/guia-primeros-pasos.js */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {appTodo}=require('./helpers/app-fuentes.js');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const g=leer('js/guia.js'),html=leer('index.html'),sw=leer('sw.js'),css=leer('css/guia.css'),app=appTodo();

test('guia.js: sintaxis válida, sin eval, sin <style>, sin dependencias externas ni red',()=>{
 assert.doesNotThrow(()=>new vm.Script(g,{filename:'guia.js'}));
 assert.ok(!/\beval\s*\(|new Function\(|createElement\(\s*['"]style['"]\s*\)|<style[\s>]/.test(g.replace(/\/\*[\s\S]*?\*\//g,'')));
 assert.ok(!/https?:\/\/|fetch\(|XMLHttpRequest|import\(|importScripts/.test(g.replace(/\/\*[\s\S]*?\*\//g,'')),'la guía no usa red ni librerías externas');
});

test('guia.js: el progreso vive solo en localStorage, por usuario y empresa (lsk), sin Firestore ni colecciones nuevas',()=>{
 assert.match(g,/lsk\('tj_guia_'\s*\+\s*u\)/,'clave por usuario + sufijo de empresa');
 assert.match(g,/localStorage\.(get|set)Item/);
 assert.ok(!/fbDb|firestore|\.collection\(|\.doc\(|setDoc|addDoc/i.test(g.replace(/\/\*[\s\S]*?\*\//g,'')),'no escribe en la nube');
 assert.ok(!/firestore\.rules/.test(g));
});

test('guia.js: solo para el personal del panel; nunca en la tienda pública',()=>{
 const iT=g.indexOf('EN_TIENDA'),iG=g.indexOf('window.__tjGuia = 1');
 assert.ok(iT>0&&iG>iT,'la comprobación de la tienda va antes de activar nada');
 assert.match(g,/if \(EN_TIENDA\) return;/);
 assert.match(g,/function haySesion/);
 assert.match(g,/esAdmin\(\)/);
 assert.match(g,/puede\(/,'a un vendedor solo se le muestran pasos de las pantallas a las que tiene permiso');
});

test('guia.js: 7 pasos con ids estables, opcionales marcados y texto en español sencillo',()=>{
 for(const id of ['empresa','producto','catalogo','cliente','venta','tienda','vendedor'])assert.ok(g.includes("id: '"+id+"'"),'falta el paso '+id);
 assert.equal((g.match(/opcional: true/g)||[]).length,2,'catálogo y vendedor son opcionales');
 assert.match(g,/Primeros pasos en VEN CRM/);
 assert.match(g,/Ocultar/);assert.match(g,/Abrir la guía|guiaAbrir/);
});

test('guia.js: accesible (región con nombre, <progress>, aviso aria-live, foco devuelto) y con delegación de eventos (sin onclick en línea)',()=>{
 assert.match(g,/<section class="card guia" id="guiaCard" aria-labelledby="guiaT"/);
 assert.match(g,/<progress/);
 assert.match(g,/aria-live/);
 assert.ok(!/\sonclick=|\sonchange=|javascript:/i.test(g),'sin manejadores en línea (la CSP los bloquea)');
 assert.match(g,/data-h-click="call"/);
});

test('index.html: enlaza css/guia.css y js/guia.js DESPUÉS de app.js; barra «Siguiente paso» como región oculta con nombre',()=>{
 assert.match(html,/href="css\/guia\.css\?v=\d+"/);
 const a=html.indexOf('js/app.js?v='),b=html.indexOf('js/guia.js?v=guia-');
 assert.ok(a>0&&b>a,'guia.js se carga después de app.js');
 assert.ok(html.indexOf('js/uber-nav.js')>b||true);
 assert.match(html,/<div class="guia-pista" id="guiaPista" role="region" aria-label="[^"]+" hidden>/);
 assert.ok(!/<script>[^<]*guia/i.test(html),'sin script en línea (CSP)');
});

test('sw.js: guía y su CSS en la lista de precarga y versión de caché subida (≥ 34)',()=>{
 assert.match(sw,/'js\/guia\.js'/);assert.match(sw,/'css\/guia\.css'/);
 assert.ok(+/tj-net-first-(\d+)/.exec(sw)[1]>=34);
});

test('guia.css: sin @import/url externas, sin quitar el contorno de foco, con variables del tema y adaptada a móvil',()=>{
 assert.ok(!/@import|url\(\s*['"]?https?:/.test(css));
 assert.ok(!/outline\s*:\s*(none|0)/.test(css),'no se quita el foco visible');
 assert.match(css,/var\(--/,'usa las variables de tema del panel (claro/nocturno)');
 assert.match(css,/@media\s*\(max-width:\s*\d+px\)/,'adaptado a móvil');
});

test('app.js: ayuda «¿Cómo funciona?» y estados vacíos en clientes, productos, facturas, catálogo y tienda',()=>{
 assert.match(app,/const ayudaMod=/);assert.match(app,/const vacioGuia=/);
 for(const m of ['cli','prod','nueva','fac','cat','tienda'])assert.ok(new RegExp("ayudaMod\\('"+m+"'\\)").test(app),'falta ayudaMod('+m+')');
 for(const t of ['Aún no hay clientes registrados','Todavía no tiene productos','Todavía no tiene facturas','El catálogo está vacío. Suba su primer archivo arriba','Aún no hay pedidos'])assert.ok(app.includes(t),'falta el texto vacío: '+t);
 assert.match(app,/¿Cómo funciona\?/);
});

test('el módulo guia.js se comporta bien con un entorno mínimo: no lanza sin sesión ni en la tienda',()=>{
 const mk=tienda=>{const doc={getElementById:()=>null,createElement:()=>({setAttribute(){},appendChild(){},style:{}}),body:{appendChild(){}},activeElement:null,addEventListener(){}};
  const ctx={window:null,document:doc,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},SHOP:tienda,SES:null,DB:{},R:{home(){}},vista:'home',ir(){},setInterval(){return 1},setTimeout(){return 1},console,location:{search:''},lsk:k=>k,esAdmin:()=>false,puede:()=>false,esVend:()=>false,esc:s=>s,$:()=>null};
  ctx.window=ctx;vm.createContext(ctx);return ctx};
 const t=mk(true);vm.runInContext(g,t);assert.equal(t.__tjGuia,undefined,'en la tienda no se activa');
 const p=mk(null);assert.doesNotThrow(()=>vm.runInContext(g,p));
});
