/* (Fase 11 amplía js/utils.js con ext, tam, shopN y fmtKB.)
   Fase 10: primera extracción de js/app.js → js/utils.js (scripts clásicos, sin ES modules).
   Estos tests protegen que lo movido siga siendo global y que nada quede declarado dos veces
   (una segunda "const" con el mismo nombre en otro script clásico rompería la página entera). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

const CONSTS=['$','$$','uid','esc','fdate','ymd','hoy','ext','tam','shopN'];
const FUNCS=['b64ToUtf8','fmtKB'];

test('js/utils.js declara las utilidades movidas y app.js ya no las declara (sin duplicados)',()=>{
 const u=leer('js/utils.js'),a=leer('js/app.js');
 for(const n of CONSTS){
  assert.ok(new RegExp('(^|[;\\n])const '+n.replace(/\$/g,'\\$')+'=').test(u),'utils.js debe declarar const '+n);
  // a nivel superior (columna 0): un `const tam` local dentro de una función (p. ej. etqGenerar) es otra variable y no choca
  assert.ok(!new RegExp('^(const|let|var) '+n.replace(/\$/g,'\\$')+'\\s*=','m').test(a),'app.js no debe redeclarar '+n);
 }
 for(const n of FUNCS){
  assert.match(u,new RegExp('(^|\\n)function '+n+'\\('),'utils.js debe declarar function '+n);
  assert.ok(!new RegExp('(^|[;\\n])function '+n+'\\(').test(a),'app.js no debe redeclarar '+n);
 }
});

test('ningún otro script de index.html declara a nivel superior los símbolos movidos',()=>{
 const html=leer('index.html');
 const locales=[...html.matchAll(/<script src="((?:js|migraciones)\/[^"?]+)/g)].map(m=>m[1]).filter(f=>!/utils\.js|app\.js|pdf\.worker/.test(f));
 assert.ok(locales.length>=6);
 for(const f of locales){
  const s=leer(f);
  for(const n of [...CONSTS,...FUNCS])
   assert.ok(!new RegExp('^(const|let|var|function)\\s+'+n.replace(/\$/g,'\\$')+'\\b','m').test(s),f+' declara '+n+' en el nivel superior (choca con js/utils.js)');
 }
});

test('index.html carga js/utils.js con versión, antes de app.js y después de los módulos previos',()=>{
 const h=leer('index.html');
 const pu=h.indexOf('js/utils.js?v='),pa=h.indexOf('js/app.js?v='),pm=h.indexOf('migraciones/migracion-multiempresa.js?v=');
 assert.ok(pu>0,'utils.js debe cargarse con ?v=');
 assert.ok(pu>pm&&pu<pa,'orden: migración → utils.js → app.js');
 assert.equal((h.match(/js\/utils\.js/g)||[]).length,1);
 assert.ok(!/<script[^>]*js\/utils\.js[^>]*(defer|async|type="module")/.test(h),'sin defer/async/module: debe ejecutarse en orden');
});

test('sw.js precachea js/utils.js y la caché está en tj-net-first-9 (Fase 11)',()=>{
 const sw=leer('sw.js');
 assert.match(sw,/const V='tj-net-first-9'/);
 const pre=/const PRE=\[(.*?)\];/s.exec(sw)[1];
 assert.ok(pre.includes("'js/utils.js'")&&pre.includes("'js/app.js'"));
 assert.ok(pre.indexOf("'js/utils.js'")<pre.indexOf("'js/app.js'"));
});

function ctxUtils(){
 const ctx={document:{getElementById:id=>({id})},atob,btoa,Uint8Array,TextDecoder,TextEncoder,Math,Date,String,Number};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(leer('js/utils.js'),ctx,{filename:'js/utils.js'});return ctx;
}

test('las utilidades siguen siendo accesibles desde otro script clásico (mismo ámbito global)',()=>{
 const ctx=ctxUtils();
 // Un segundo script (como app.js o marketing.js) las usa por nombre, sin window.
 assert.equal(vm.runInContext("typeof esc+typeof $$+typeof uid+typeof fdate+typeof ymd+typeof hoy+typeof $+typeof b64ToUtf8+typeof ext+typeof tam+typeof shopN+typeof fmtKB",ctx),'function'.repeat(12));
 assert.equal(typeof ctx.b64ToUtf8,'function','las function declaradas siguen siendo propiedades de window');
 assert.equal(typeof ctx.fmtKB,'function');
 for(const n of ['ext','tam','shopN'])assert.equal(Object.prototype.hasOwnProperty.call(ctx,n),false,n+' sigue siendo const de script, no propiedad de window');
});

test('comportamiento idéntico al original: esc, $$, fdate, ymd, hoy, uid, b64ToUtf8, $',()=>{
 const ctx=ctxUtils(),ev=c=>vm.runInContext(c,ctx);
 assert.equal(ev(`esc('<a href="x">&\\'')`),'&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
 assert.equal(ev('esc(null)+esc(undefined)+esc(5)'),'5');
 assert.equal(ev('$$(1.005)'),'$'+(+1.005).toFixed(2));
 assert.equal(ev('$$("2")'),'$2.00');
 assert.equal(ev("fdate('2026-10-25')"),'25/10/2026');
 assert.equal(ev('ymd(new Date(2026,0,5))'),'2026-01-05');
 assert.match(ev('hoy()'),/^\d{4}-\d\d-\d\d$/);
 assert.equal(ev('hoy()'),ev('ymd(new Date())'));
 assert.match(ev('uid()'),/^[a-z0-9]{4,}$/);
 assert.notEqual(ev('uid()'),ev('uid()'));
 assert.equal(ev("b64ToUtf8('SG9sYSDDsQ==')"),'Hola ñ');
 assert.equal(ev("$('x').id"),'x');
});

test('el uid() generado cumple el formato SAFE_ID que app.js exige a los documentos públicos',()=>{
 const ctx=ctxUtils();
 const safe=/^[A-Za-z0-9_-]{1,60}$/;
 assert.ok(/const SAFE_ID=\/\^\[A-Za-z0-9_-\]\{1,60\}\$\//.test(leer('js/sanear.js')));
 for(let i=0;i<50;i++)assert.ok(safe.test(vm.runInContext('uid()',ctx)));
});

test('js/utils.js es solo utilidades puras: sin Firebase, sin red y sin estado global propio',()=>{
 const u=leer('js/utils.js');
 assert.doesNotMatch(u,/firebase|fetch\(|localStorage|XMLHttpRequest|innerHTML|addEventListener|setInterval|setTimeout/);
 assert.doesNotMatch(u,/^(let|var) /m,'sin estado mutable');
});

test('docs/PLAN-MODULARIZACION.md existe y documenta el enfoque y las siguientes extracciones',()=>{
 const d=leer('docs/PLAN-MODULARIZACION.md');
 assert.match(d,/js\/utils\.js/);
 assert.match(d,/tj-net-first-\d+/);
 assert.match(d,/Siguientes extracciones/i);
});

test('Fase 11.4: ext, tam, fmtKB y shopN (movidos a js/utils.js) se comportan igual que antes',()=>{
 const ctx=ctxUtils(),ev=c=>vm.runInContext(c,ctx);
 assert.equal(ev("ext({ext:'pdf'})+'|'+ext({})+'|'+ext({ext:''})"),'PDF|ARCHIVO|ARCHIVO');
 assert.equal(ev('tam(500)+"|"+tam(1)+"|"+tam(2048)+"|"+tam(1048576)+"|"+tam(1048577)+"|"+tam(5*1048576)'),'1 KB|1 KB|2 KB|1024 KB|1.0 MB|5.0 MB');
 assert.equal(ev('fmtKB(500)+"|"+fmtKB(0)+"|"+fmtKB(1048576)+"|"+fmtKB(1572864)'),'0 KB|0 KB|1.0 MB|1.5 MB');
 assert.equal(ev("shopN('Cumpleaños ÁÉÍ Pésame')"),'cumpleanos aei pesame');
 assert.equal(ev('shopN(null)+shopN(undefined)+shopN(5)'),'5');
 // fmtKB y tam difieren a propósito (redondeo y mínimo de 1 KB): se conservan tal cual
 assert.notEqual(ev('fmtKB(100)'),ev('tam(100)'));
});
