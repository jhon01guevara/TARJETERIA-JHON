/* Fase 11: extracciones 1-4 de js/app.js (scripts clásicos, sin ES modules, cargados antes de app.js).
   Tabla única: para cada archivo extraído se comprueba que existe, que compila, que declara lo movido,
   que NADA se redeclara en otro script (una segunda "const" con el mismo nombre rompe toda la página),
   el orden de carga en index.html, la precaché del service worker y el comportamiento. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {EXTRAIDOS}=require('./helpers/app-fuentes');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const esc=s=>s.replace(/[$.*+?^{}()|[\]\\]/g,'\\$&');

// file → símbolos declarados a nivel superior (const/function)
const EXTR={
 'js/sanear.js':{consts:['SAFE_ID','sTxt','sNum'],funcs:['sanLead','sanPed','sanGal','sanEnv']},
 'js/redes.js':{consts:['RED_DEF','RED_HOST','RED_SVG','CONT_DEF','redesLista'],funcs:['redUrl','contLimpio']},
 // Textos legales: las funciones de dibujo usan document/navigator/window al EJECUTARSE (no al cargar), por eso 'efectos:true'
 'js/politicas.js':{consts:['TJ_POLITICAS'],funcs:['shopPoliticas','poliVerEvidencia','poliImprimirEvidencia','poliCopiarEvidencia','poliVerRegistroAuditoria','poliExportarCSV','poliCopiar','poliAdmCard'],efectos:true},
};
const TODOS=Object.entries(EXTR).flatMap(([f,o])=>[...o.consts.map(n=>[f,n,'const']),...o.funcs.map(n=>[f,n,'function'])]);
const declRe=n=>new RegExp('(^|[;\\n{}])\\s*(const|let|var|function|async function|class)\\s+'+esc(n)+'\\b');
const html=leer('index.html');
const locales=[...html.matchAll(/<script src="((?:js|migraciones)\/[^"?]+)/g)].map(m=>m[1]).filter(f=>!/pdf\.worker/.test(f));

test('el helper de tests conoce todos los archivos extraídos',()=>{
 for(const f of Object.keys(EXTR))assert.ok(EXTRAIDOS.includes(f),f+' falta en tests/helpers/app-fuentes.js');
});

for(const f of Object.keys(EXTR)){
 test(f+': existe, no está vacío, compila y es solo declaraciones (sin estado propio ni efectos al cargar)',()=>{
  const s=leer(f);
  assert.ok(s.length>200);
  new vm.Script(s,{filename:f});
  assert.doesNotMatch(s,/^(let|var) /m,f+': no debe declarar estado mutable global');
  if(!EXTR[f].efectos)assert.doesNotMatch(s,/firebase|fetch\(|XMLHttpRequest|addEventListener|setInterval|setTimeout|document\.(?!getElementById\b)/,f+': no debe tener efectos al cargar');
  // A nivel superior (columna 0) solo puede haber comentarios, const, function o el cierre de un bloque: nada se ejecuta al cargar.
  let enComentario=false;
  for(const l of s.split('\n')){
   if(enComentario){if(/\*\//.test(l))enComentario=false;continue}
   if(/^\/\*/.test(l)){if(!/\*\//.test(l))enComentario=true;continue}
   if(l===''||/^\s/.test(l)||/^(\/\/|const |function |async function |\}|\))/.test(l))continue;
   assert.fail(f+': línea de nivel superior que no es una declaración: '+l.slice(0,80));
  }
 });
 test(f+': declara lo movido con el mismo tipo de declaración y ningún otro script lo redeclara',()=>{
  const s=leer(f);
  for(const [file,n,tipo] of TODOS.filter(x=>x[0]===f)){
   assert.ok(new RegExp('(^|[;\\n])'+(tipo==='const'?'const ':'function ')+esc(n)+(tipo==='const'?'\\s*=':'\\(')).test(s),f+' debe declarar '+tipo+' '+n);
   for(const otro of locales.filter(x=>x!==f)){
    assert.ok(!new RegExp('^(?:const|let|var|function)\\s+'+esc(n)+'\\b','m').test(leer(otro)),otro+' redeclara '+n+' (ya vive en '+f+')');
   }
   assert.ok(!declRe(n).test(leer('js/app.js')),'js/app.js ya no debe declarar '+n);
  }
 });
}

test('ningún símbolo está declarado en dos archivos extraídos',()=>{
 const vistos=new Map();
 for(const [f,n] of TODOS){assert.ok(!vistos.has(n),n+' en '+f+' y en '+vistos.get(n));vistos.set(n,f)}
 for(const n of ['$','$$','uid','esc','fdate','ymd','hoy','b64ToUtf8'])assert.ok(!vistos.has(n),n+' pertenece a js/utils.js');
});

test('index.html: cada archivo extraído se carga una vez, con ?v=, sin defer/async/module, después de utils.js y antes de app.js',()=>{
 const pu=html.indexOf('js/utils.js?v='),pa=html.indexOf('js/app.js?v='),pm=html.indexOf('migraciones/migracion-multiempresa.js?v=');
 for(const f of Object.keys(EXTR)){
  assert.equal(html.split(f+'?v=').length-1,1,f+' debe aparecer una sola vez con ?v=');
  const p=html.indexOf(f+'?v=');
  assert.ok(p>pm&&p>pu&&p<pa,f+': orden migración → utils.js → '+f+' → app.js');
  assert.ok(!new RegExp('<script[^>]*'+esc(f)+'[^>]*(defer|async|type="module")').test(html),f+': sin defer/async/module');
 }
 assert.match(html,/js\/app\.js\?v=[a-z0-9-]+/,"app.js subió su ?v= (Fase 11 o 13)");
});

test('sw.js: la caché es tj-net-first-11 y precachea cada archivo extraído antes de js/app.js',()=>{
 const sw=leer('sw.js');
 assert.match(sw,/const V='tj-net-first-\d+'/);
 const pre=/const PRE=\[(.*?)\];/s.exec(sw)[1];
 for(const f of Object.keys(EXTR)){
  assert.ok(pre.includes("'"+f+"'"),f+' debe estar en PRE');
  assert.ok(pre.indexOf("'"+f+"'")<pre.indexOf("'js/app.js'"));
 }
});

function ctxBase(){
 const ctx={document:{getElementById:id=>({id})},atob,btoa,Uint8Array,TextDecoder,TextEncoder,Math,Date,String,Number,Array,Object,Set,JSON,Promise,Intl,URL,URLSearchParams,
  location:{origin:'https://x.github.io',pathname:'/app/'},console};
 ctx.window=ctx;vm.createContext(ctx);
 // mismo orden que index.html
 for(const f of ['js/utils.js',...Object.keys(EXTR)])vm.runInContext(leer(f),ctx,{filename:f});
 return ctx;
}

test('todo lo movido resuelve por nombre desde otro script clásico (const = global de script, function = window)',()=>{
 const ctx=ctxBase();
 for(const [f,n,tipo] of TODOS){
  assert.notEqual(vm.runInContext('typeof '+n,ctx),'undefined',n+' no resuelve desde otro script');
  if(tipo==='const')assert.equal(Object.prototype.hasOwnProperty.call(ctx,n),false,n+' no debe ser propiedad de window (igual que antes)');
  else assert.equal(typeof ctx[n],'function',n+' debe seguir siendo propiedad de window');
 }
});

test('cada símbolo movido que se usa en otros archivos sigue resolviendo (app.js, marketing.js, empresas.js, apps/, sw.js)',()=>{
 const otros=['js/app.js','js/marketing.js','js/empresas.js','js/mkt-editor.js','js/empresa-contexto.js','js/facturacion.js','js/uber-nav.js','js/a11y.js','apps/investigacion.js','apps/modelos.js','sw.js'];
 const ctx=ctxBase();
 const definidos=new Set(TODOS.map(x=>x[1]));
 for(const f of otros){
  const s=leer(f);
  for(const n of definidos){
   if(new RegExp('(^|[^\\w$.\'"])'+esc(n)+'\\b').test(s)&&!/^(js\/app\.js|js\/marketing\.js|js\/empresas\.js)$/.test(f)){
    // usado fuera de app.js: debe ser global en ese contexto (si el archivo lo declara él mismo, es otro símbolo local)
    assert.notEqual(vm.runInContext('typeof '+n,ctx),'undefined',f+' usa '+n);
   }
  }
 }
});

// ---------- comportamiento (idéntico al original) ----------
test('sanear.js: sanLead/sanPed/sanGal/sanEnv limpian igual que antes',()=>{
 const ctx=ctxBase(),ev=c=>vm.runInContext(c,ctx);
 assert.equal(ev('SAFE_ID.test("ab_C-9")&&!SAFE_ID.test("a\'b")&&!SAFE_ID.test("")&&!SAFE_ID.test("x".repeat(61))'),true);
 assert.equal(ev('sTxt(null)+"|"+sTxt("abcdef",3)+"|"+sTxt("x".repeat(300)).length'),'|abc|200');
 assert.equal(ev('sNum("5")+","+sNum("abc")+","+sNum(Infinity)+","+sNum(null)'),'5,0,0,0');
 assert.equal(ev('sanLead(null)+","+sanLead({id:"a\'b"})+","+sanLead("x")'),'null,null,null');
 assert.equal(ev('JSON.stringify(sanLead({id:"L1",name:"Ana",tel:"1",ts:"7",imp:1,extra:"x"}))'),'{"id":"L1","name":"Ana","tel":"1","email":"","empresa":"","dir":"","ref":"admin","ts":7,"imp":true}');
 const p=JSON.parse(ev('JSON.stringify(sanPed({id:"P1",total:"12.5",estado:"otro",items:[{id:"i",n:"N",p:"2",q:"-3"}],lead:{name:"A"},envio:{tipo:"internacional",bultos:"500",peso:"2",rec:"R",x:"no"}}))'));
 assert.equal(p.id,'P1');assert.equal(p.total,12.5);assert.equal(p.estado,'nuevo');assert.equal(p.items[0].q,0);assert.equal(p.items[0].p,2);
 assert.deepEqual(p.envio,{tipo:'internacional',rec:'R',bultos:99,peso:2});
 assert.equal(ev('sanPed({id:"<x>"})'),null);
 assert.equal(ev('sanPed({id:"P2",estado:"atendido"}).estado'),'atendido');
 assert.equal(ev('sanEnv(null)'),null);
 assert.equal(ev('JSON.stringify(sanEnv({tipo:"x",bultos:0}))'),'{"tipo":"nacional","bultos":1}');
 assert.equal(ev('sanGal({id:"G1",img:"javascript:alert(1)"})'),null);
 assert.equal(ev('sanGal({id:"G1",img:"data:image/png;base64,AAAA",t:"T",by:"B",otro:1}).otro'),1);
 assert.equal(ev('sanGal({id:"G 1",img:"data:image/png;base64,AAAA"})'),null);
});

test('redes.js: redUrl, contLimpio y redesLista se comportan igual que antes',()=>{
 const ctx=ctxBase(),ev=c=>vm.runInContext(c,ctx);
 assert.equal(ev('JSON.stringify(RED_DEF)'),'[["tiktok","TikTok"],["instagram","Instagram"],["facebook","Facebook"]]');
 assert.equal(ev('CONT_DEF.map(x=>x[0]).join()'),'tel,wa,email,dir,horario');
 assert.deepEqual(ev('Object.keys(RED_SVG).join()').split(','),['tiktok','instagram','facebook']);
 assert.equal(ev('redUrl("tiktok","@tarjeteriajhon")'),'https://www.tiktok.com/@tarjeteriajhon');
 assert.equal(ev('redUrl("instagram","tarjeteriajhon")'),'https://www.instagram.com/tarjeteriajhon/');
 assert.equal(ev('redUrl("facebook","tarjeteriajhon")'),'https://www.facebook.com/tarjeteriajhon');
 assert.equal(ev('redUrl("facebook","fb.com/profile.php?id=1234567&x=1#h")'),'https://fb.com/profile.php?id=1234567');
 assert.equal(ev('redUrl("tiktok","http://www.tiktok.com/@a")'),'https://www.tiktok.com/@a');
 // rechazos (seguridad)
 assert.equal(ev('redUrl("tiktok","javascript:alert(1)")'),'');
 assert.equal(ev('redUrl("tiktok","https://evil.com/tiktok.com")'),'');
 assert.equal(ev('redUrl("tiktok","https://u:p@tiktok.com/@a")'),'');
 assert.equal(ev('redUrl("otra","x")+redUrl("tiktok","")+redUrl("tiktok",null)+redUrl("tiktok","a b")'),'');
 assert.equal(ev('redUrl("tiktok","x".repeat(301))'),'');
 assert.equal(ev('JSON.stringify(contLimpio({tel:"+507 6074-1150",wa:"6074-1150",email:"a@b.co",dir:"  Calle <b>1</b> ",horario:"L-S"}))'),
  '{"tel":"+507 6074-1150","wa":"50760741150","email":"a@b.co","dir":"Calle b 1 /b","horario":"L-S"}');
 assert.equal(ev('JSON.stringify(contLimpio(null))'),'{"tel":"","wa":"","email":"","dir":"","horario":""}');
 assert.equal(ev('JSON.stringify(contLimpio({tel:"abc",email:"no-es-correo",wa:"12"}))'),'{"tel":"","wa":"","email":"","dir":"","horario":""}');
 assert.equal(ev('JSON.stringify(redesLista({tiktok:"@a",instagram:"https://evil.com",facebook:"b"}))'),
  '[["tiktok","TikTok","https://www.tiktok.com/@a"],["facebook","Facebook","https://www.facebook.com/b"]]');
 assert.equal(ev('JSON.stringify(redesLista(null))'),'[]');
});

test('politicas.js: TJ_POLITICAS evalúa sus getters al usarse (empresa activa o datos publicados de la tienda)',()=>{
 const ctx=ctxBase(),ev=c=>vm.runInContext(c,ctx);
 ctx.nombreNegocio=()=>'Mi Negocio';
 assert.equal(ev('TJ_POLITICAS.nombre'),'Mi Negocio');
 assert.equal(ev('TJ_POLITICAS.web'),'https://x.github.io/app/?tienda=1');
 assert.equal(ev('TJ_POLITICAS.correo'),'tarjeteriajhon@gmail.com');
 assert.equal(ev('TJ_POLITICAS.tel'),'6074-1150');
 assert.match(ev('TJ_POLITICAS.estado'),/^Etapa preparatoria/);
 vm.runInContext('var DB={cfg:{email:"a@b.co",tel:"123"}}',ctx);
 assert.equal(ev('TJ_POLITICAS.correo+"|"+TJ_POLITICAS.tel'),'a@b.co|123');
 vm.runInContext('var SHOP=true,SH={contacto:{email:"t@t.co",tel:"999"}}',ctx);
 assert.equal(ev('TJ_POLITICAS.correo+"|"+TJ_POLITICAS.tel'),'t@t.co|999');
});

test('politicas.js: shopPoliticas dibuja las 6 pestañas con los datos del negocio (usa _ha, esc y shopM de app.js al ejecutarse)',()=>{
 const ctx=ctxBase(),ev=c=>vm.runInContext(c,ctx);
 let html='';
 ctx.nombreNegocio=()=>'Negocio <X>';ctx.shopM=h=>{html=h};
 vm.runInContext('var DB={cfg:{}};function _ha(){return JSON.stringify([].slice.call(arguments)).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}',ctx);
 ev('shopPoliticas("1")');
 for(const t of ['Aviso Preparatorio','Términos de Uso','Privacidad (Ley 81)','Entregas y Retiros','Reclamaciones','Lista de Verificación'])assert.ok(html.includes(t),t);
 assert.ok(html.includes('Negocio &lt;X&gt;')&&!html.includes('Negocio <X>'),'el nombre del negocio se escapa');
 for(let i=2;i<=6;i++){html='';ev('shopPoliticas("'+i+'")');assert.ok(html.length>500,'pestaña '+i)}
});
