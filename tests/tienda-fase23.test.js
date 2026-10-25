/* Fase 23: protección ESTÁTICA del diseño de la tienda pública.
   Error que evita (Fase 20, PR 25): la clase `kwrap` —contenedor principal de la tienda, `#shop .kwrap`— se reutilizó para la envoltura
   del botón de WhatsApp con `.kwrap{…;height:0}` en accesibilidad.css; la tienda quedó con 48 px de alto y redes, pie, «Políticas» y «Contacto» subieron arriba.
   La comprobación en Chrome real está en tests/navegador/tienda-fase23.js (ver docs/GUIA-PRUEBAS-TIENDA.md). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {EXTRAIDOS,appTodo,leer}=require('./helpers/app-fuentes');

const RAIZ=path.join(__dirname,'..');
const cssArchivos=fs.readdirSync(path.join(RAIZ,'css')).filter(f=>f.endsWith('.css'));
const jsArchivos=[...new Set([...EXTRAIDOS,'js/app.js',...fs.readdirSync(path.join(RAIZ,'js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f)])];

/* Atributos class="…" que contienen la clase kwrap como palabra completa (kwa-wrap, kwrapper, etc. NO cuentan). */
const clasesKwrap=src=>src.match(/class\s*=\s*(["'])(?:(?!\1)[^])*?(?<![\w-])kwrap(?![\w-])(?:(?!\1)[^])*?\1/g)||[];
/* Reglas CSS cuyo selector menciona .kwrap, con su cuerpo. */
const reglasKwrap=css=>[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>/\.kwrap(?![\w-])/.test(m[1])).map(m=>({sel:m[1].trim(),cuerpo:m[2].replace(/\s+/g,'')}));
const PELIGROSO=/(^|;)(height|max-height):0(px|%|em|rem)?(!important)?(;|$)|(^|;)display:none(;|$)|(^|;)position:(absolute|fixed)(;|$)/;

test('la plantilla de la tienda tiene UN solo class="kwrap" en todo el código JS (nadie más reutiliza el nombre)',()=>{
 const todo=appTodo();
 const usos=clasesKwrap(todo);
 assert.equal(usos.length,1,'atributos class con kwrap: '+usos.join(' | '));
 assert.equal(usos[0],'class="kwrap"');
 assert.equal(todo.split('class="kwrap"').length-1,1);
 for(const f of jsArchivos){
  const n=clasesKwrap(leer(f)).length;
  assert.equal(n,f==='js/app.js'?1:0,f+' usa la clase kwrap '+n+' veces');
 }
});
test('el único class="kwrap" está en la plantilla de la tienda (la que tiene #k_rail, #sh_g, #k_redes y #k_footer), antes de redes y pie',()=>{
 const app=leer('js/app.js');
 const i=app.indexOf('class="kwrap"'),rail=app.lastIndexOf('id="k_rail"',i),pie=app.indexOf('id="k_footer"',i),redes=app.indexOf('id="k_redes"',i),grid=app.indexOf('id="sh_g"',i);
 assert.ok(i>0&&rail>0&&i-rail<2000,'kwrap va dentro de la misma plantilla que #k_rail');
 assert.ok(grid>i&&redes>grid&&pie>redes,'orden en la plantilla: kwrap → #sh_g → #k_redes → #k_footer');
 assert.ok(i<app.indexOf('`;',i)&&pie<app.indexOf('`;',i),'todo en el mismo template literal');
});
test('el código no marca ni busca la clase kwrap por classList / className / querySelector fuera de la plantilla',()=>{
 for(const f of jsArchivos){
  const t=leer(f);
  assert.doesNotMatch(t,/classList\.(add|remove|toggle|contains|replace)\(\s*['"]kwrap['"]/,f);
  assert.doesNotMatch(t,/className\s*[+]?=\s*['"][^'"]*\bkwrap\b/,f);
  assert.doesNotMatch(t,/setAttribute\(\s*['"]class['"]\s*,\s*['"][^'"]*\bkwrap\b/,f);
 }
});
test('el CSS de .kwrap vive solo en panel.css como «#shop .kwrap» y ninguna regla lo colapsa, lo oculta ni lo saca del flujo',()=>{
 let total=0;
 for(const f of cssArchivos){
  const reglas=reglasKwrap(leer('css/'+f));
  total+=reglas.length;
  if(f!=='panel.css')assert.deepEqual(reglas,[],f+' no debe definir reglas .kwrap (solo css/panel.css): '+JSON.stringify(reglas));
  for(const r of reglas){
   assert.match(r.sel,/^#shop \.kwrap$/,f+': el selector debe ser «#shop .kwrap» y no «.kwrap» a secas: '+r.sel);
   assert.doesNotMatch(r.cuerpo,PELIGROSO,f+': «'+r.sel+'» tiene una regla que colapsa/oculta/saca del flujo: '+r.cuerpo);
  }
 }
 assert.ok(total>=4,'se esperaban las reglas de #shop .kwrap en panel.css, hay '+total);
});
test('accesibilidad.css (y cualquier CSS fuera de panel.css) NO define .kwrap con height:0',()=>{
 for(const f of cssArchivos.filter(f=>f!=='panel.css')){
  const css=leer('css/'+f).replace(/\/\*[\s\S]*?\*\//g,'');
  assert.doesNotMatch(css,/\.kwrap(?![\w-])[^{}]*\{[^{}]*height\s*:\s*0/,f);
 }
});
test('la envoltura del botón de WhatsApp usa kwa-wrap (landmark complementary con nombre, alto 0) y NO la clase kwrap',()=>{
 const app=leer('js/app.js'),css=leer('css/accesibilidad.css');
 assert.match(app,/<div class="kwa-wrap" role="complementary" aria-label="Contacto por WhatsApp"[^>]*><a class="kwa" id="k_wa"/);
 assert.match(css,/\.kwa-wrap\{[^}]*height:0[^}]*\}/);
 assert.equal(reglasKwrap(css).length,0);
 assert.match(app,/classList\.contains\('kwa-wrap'\)/);
});
test('el detector SÍ habría saltado con el error original (copia del código de la Fase 20)',()=>{
 const appMalo=leer('js/app.js').replace('<div class="kwa-wrap" role="complementary"','<div class="kwrap" role="complementary"');
 assert.equal(clasesKwrap(appMalo).length,2,'dos class="kwrap" en la plantilla = error');
 const cssMalo='/* x */\n.kwrap{margin:0;padding:0;border:0;height:0}\n.kwrap[hidden]{display:none}';
 const r=reglasKwrap(cssMalo);
 assert.equal(r.length,2);
 assert.ok(r.every(x=>!/^#shop \.kwrap$/.test(x.sel)),'selector sin #shop');
 assert.match(r[0].cuerpo,PELIGROSO);assert.match(r[1].cuerpo,PELIGROSO);
 const cssBueno=leer('css/panel.css');
 assert.ok(reglasKwrap(cssBueno).every(x=>!PELIGROSO.test(x.cuerpo)));
});
test('el script de Chrome y su guía existen y la guía explica variables y puertos',()=>{
 const s=leer('tests/navegador/tienda-fase23.js'),g=leer('docs/GUIA-PRUEBAS-TIENDA.md');
 assert.match(s,/#shop \.kwrap/);assert.match(s,/390,844|390x844/);assert.match(s,/1366x900/);
 for(const v of ['BASE','DIR','PUERTO','PW','VPS'])assert.match(g,new RegExp('`'+v+'`'),'la guía documenta '+v);
 assert.match(g,/ss -ltn/);
});
