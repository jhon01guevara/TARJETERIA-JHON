/* Fase 15 · bloque 2: contrastes, ventanas modales e iframes. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {appTodo}=require('./helpers/app-fuentes.js');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const jsFiles=fs.readdirSync(path.join(__dirname,'..','js')).filter(f=>f.endsWith('.js')&&f!=='pdf.worker.min.js').map(f=>'js/'+f);

/* ───────── BLOQUE 2a · contrastes ───────── */
function lum(h){h=h.replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(c=>c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4));return .2126*r+.7152*g+.0722*b}
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('Fase 15: los colores nuevos de css/accesibilidad.css cumplen AA (4.5:1) sobre los fondos donde se usan',()=>{
 const css=leer('css/accesibilidad.css');
 const claro=/:root\{--okt:(#\w+);--warnt:(#\w+);--errt:(#\w+);--mutet:(#\w+)\}/.exec(css);
 const noct=/:root\[data-t="nocturno"\]\{--okt:(#\w+);--warnt:(#\w+);--errt:(#\w+);--mutet:(#\w+)\}/.exec(css);
 assert.ok(claro&&noct,'variables --okt/--warnt/--errt/--mutet en tema claro y nocturno');
 for(const c of claro.slice(1))for(const bg of ['#ffffff','#f5f5f7'])assert.ok(ratio(c,bg)>=4.5,c+' sobre '+bg+' = '+ratio(c,bg).toFixed(2));
 for(const c of noct.slice(1))for(const bg of ['#141414','#1f1f1f','#2c2c2e'])assert.ok(ratio(c,bg)>=4.5,c+' sobre '+bg+' = '+ratio(c,bg).toFixed(2));
 assert.ok(ratio('#5c5c5c','#e5e5e5')>=4.5,'etiqueta del carrusel');
 const gris=/:root\[data-t="nocturno"\]\{[^}]*--gris:(#\w+)/.exec(leer('css/uber-skin.css'));
 assert.ok(gris&&ratio(gris[1],'#353535')>=4.5,'--gris nocturno sobre #353535: '+(gris&&ratio(gris[1],'#353535').toFixed(2)));
 assert.ok(ratio('#ffffff','#6a54f0')>=4.5,'texto blanco del botón Carrito (tienda oscura)');
 assert.match(css,/\.agc\.o\{opacity:1;/,'agenda: ya no se atenúa todo el día con opacity');
 assert.doesNotMatch(css,/--(az|fondo|card|txt|gris|linea|soft)\s*:/,'no redefine las variables de color del tema');
});
test('Fase 15: los textos de estado usan variables con color de respaldo (si el CSS no cargara, siguen siendo legibles)',()=>{
 const s=appTodo();
 assert.match(s,/var\(--okt,#15803d\)/);assert.match(s,/var\(--errt,#c0392b\)/);
 assert.match(s,/class="okt">✔ Publicado/);
 assert.match(s,/<span class="warnt">🟠/);
 assert.doesNotMatch(s,/style="color:#10b981"|style="color:#f59e0b"|style="color:#ef4444"|style="color:#2fa84f">✔ Publicado/);
});

/* ───────── BLOQUE 2b · ventanas modales ───────── */
test('Fase 15: a11y.js gestiona las ventanas existentes de forma central (Esc, Tab atrapado, devolver foco, nombre)',()=>{
 const a=leer('js/a11y.js');
 new vm.Script(a);
 for(const id of ['md','shopm','kzoom','avzoom','tdzoom','pdfv','investOv','imgv','auth'])assert.match(a,new RegExp("id: '"+id+"'"),'modal '+id);
 assert.match(a,/e\.key === 'Escape'/);
 assert.match(a,/e\.key !== 'Tab'/);
 assert.match(a,/opener/,'recuerda quién abrió la ventana');
 assert.match(a,/aria-labelledby/);
 assert.match(a,/addEventListener\('focusin'/);
 // Esc cierra con el mismo mecanismo que el ratón: click() sobre el fondo o el botón «Cerrar»
 assert.match(a,/id: 'md'[^\n]*cerrar: function \(el\) \{ el\.click\(\); \}/);
 assert.match(a,/#pdfvx/);assert.match(a,/#investX/);
 // imgv ya cierra con Esc por su cuenta: no se duplica
 assert.match(a,/id: 'imgv', abierto: vivo, cerrar: null/);
 // el login no se cierra con Esc
 assert.match(a,/id: 'auth'[^\n]*cerrar: null/);
 // no reescribe los modales: no toca innerHTML
 assert.doesNotMatch(a,/\.innerHTML\s*=/);
});
test('Fase 15: los contenedores de las ventanas existen en el panel/tienda (ids que observa a11y.js)',()=>{
 const html=leer('index.html'),s=appTodo();
 assert.match(html,/id="md"/);assert.match(html,/id="mb"/);
 for(const id of ['shopm','kzoom','avzoom','tdzoom','pdfv','investOv','imgv','auth'])assert.ok(s.includes("'"+id+"'")||s.includes('id="'+id+'"')||s.includes('id=\''+id+'\''),id+' existe en app.js');
 assert.match(s,/function cerrar\(\)\{\$\('md'\)\.classList\.remove\('on'\)/,'cerrar() sigue quitando la clase on de #md');
 assert.match(s,/__H\.hs4=function\(event,a\)\{if\(event\.target===this\)cerrar\(\)\}/,'el click sobre el fondo de #md sigue cerrando');
});

/* ───────── BLOQUE 2c · iframes ───────── */
test('Fase 15: todos los iframes del panel tienen title y las apps declaran idioma y nombres en sus selectores',()=>{
 for(const f of jsFiles){
  const s=leer(f);
  for(const m of s.matchAll(/<iframe\b[^>]*>/g))assert.match(m[0],/\btitle="[^"]{4,}"/,f+': iframe sin title: '+m[0].slice(0,80));
 }
 assert.match(leer('js/app.js'),/<iframe id="checkFrame" title="Check: modelos de tarjetas"/);
 for(const f of ['apps/modelos.html','apps/investigacion.html'])assert.match(leer(f),/<html lang="es">/,f+' lang');
 for(const f of ['apps/modelos.html','apps/investigacion.html']){
  const h=leer(f);
  for(const m of h.matchAll(/<select\b[^>]*>/g)){
   const id=(/\bid="([^"]+)"/.exec(m[0])||[])[1];
   assert.ok(/aria-label="[^"]+"/.test(m[0])||(id&&new RegExp('<label[^>]*for="'+id+'"').test(h))||(id&&new RegExp('<label[^>]*>[^<]*'+m[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(h)),f+': select sin nombre '+m[0]);
  }
 }
 assert.match(leer('apps/investigacion.html'),/id="q" aria-label="Buscar productos"/);
});

