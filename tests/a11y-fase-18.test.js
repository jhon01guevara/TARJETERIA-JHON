/* Fase 18: accesibilidad restante — landmarks, tablas con nombre, cabeceras vacías, zonas táctiles (WCAG 2.2 · 2.5.8), etiquetas de campos y contraste móvil.
   Las comprobaciones de comportamiento real están en tests/navegador/axe-completo.js, tamano-zonas.js y recorrido.js (Chrome real). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {appTodo}=require('./helpers/app-fuentes.js');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=leer('index.html'),css=leer('css/accesibilidad.css'),a11y=leer('js/a11y.js'),app=appTodo();

test('Fase 18: panel con landmarks nombrados (barra lateral, menús, región de avisos, main) y un h1 solo para lector en móvil',()=>{
 assert.match(html,/<aside class="sb" aria-label="Barra lateral">/);
 assert.match(html,/<nav id="nav" aria-label="Menú principal">/);assert.match(html,/<nav id="nav2" class="bn" aria-label="Menú inferior">/);
 assert.match(html,/<div class="cint" id="cint" role="region" aria-label="[^"]+" hidden>/);
 assert.match(html,/<main id="contenido">\s*<h1 class="sr-only h1m">[^<]+<\/h1>/);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.match(css,/@media\(min-width:821px\)\{\.h1m\{display:none!important\}\}/,'en escritorio el h1 de la barra lateral basta (solo hay uno visible)');
 assert.match(html,/css\/accesibilidad\.css\?v=\d+/);
 assert.match(html,/js\/a11y\.js\?v=a11y-restante-fase-18/);
});
test('Fase 18: .sr-only existe y las cabeceras de tabla usan una variante SIN position:absolute (un absoluto escapa del scroll de .tw y ensancha la página en móvil)',()=>{
 assert.match(css,/\.sr-only\{position:absolute!important;[^}]*clip:rect\(0,0,0,0\)/);
 const th=/\.sr-only-th\{([^}]*)\}/.exec(css);assert.ok(th);assert.doesNotMatch(th[1],/position\s*:\s*absolute/);
 assert.match(a11y,/sp\.className = 'sr-only-th'/);
 assert.doesNotMatch(a11y,/sp\.className = 'sr-only'[^-]/);
});
test('Fase 18: a11y.js nombra tablas (aria-label, sin caption nuevo que cambie filas), cabeceras vacías, imágenes con alt y landmarks de la tienda',()=>{
 for(const f of ['tablasNombre','thsVacios','nombreTabla','function tienda()'])assert.ok(a11y.includes(f),f);
 assert.match(a11y,/t\.setAttribute\('aria-label', nombreTabla\(t\)\)/);
 assert.match(a11y,/closest\('#prt,\.pv,\.cv,\[data-no-a11y\]'\)/,'no toca la vista previa de facturas ni las tarjetas impresas');
 assert.match(a11y,/closest\('#v,#mb'\)/,'las cabeceras vacías solo se rellenan en pantallas del panel');
 assert.match(a11y,/el\.tagName === 'IMG' && el\.getAttribute\('alt'\) === ''/);
 assert.match(a11y,/setAttribute\('role', 'main'\)/);assert.match(a11y,/panelVisible/);
 assert.match(a11y,/label-title-only/);
 // no se llama a tienda() por cada nodo observado (solo en el lote y al inicio)
 const proc=/function procesar\(root\) \{[\s\S]*?\n  \}/.exec(a11y)[0];assert.doesNotMatch(proc,/tienda\(\)/);
});
test('Fase 18: zonas táctiles de 24 px en móvil (solo dentro de @media max-width:820px) y barra inferior con nombre accesible a ≤480 px',()=>{
 const f18=css.slice(css.indexOf('FASE 18'),css.indexOf('FASE 20'));
 const mq=/@media\(max-width:820px\)\{([\s\S]*?)\n\}/.exec(f18)[1];
 assert.match(mq,/summary,h3\[data-h-click\],#auth a\{min-height:24px/);
 assert.match(mq,/label:has\(>input\[type="checkbox"\]\)\{padding-block:5px\}/);
 assert.match(mq,/input\.etqcb\{min-width:24px;min-height:24px\}/);
 const m480=/@media\(max-width:480px\)\{\s*\.bn \.ni \.lb\{([^}]*)\}/.exec(f18)[1];
 assert.match(m480,/display:block!important/);assert.match(m480,/clip:rect\(0,0,0,0\)/);
 // no se tocaron las reglas de escritorio fuera de las variables/clases de ayuda
 assert.doesNotMatch(f18.replace(/@media[\s\S]*?\n\}/g,''),/min-height|min-width/);
});
test('Fase 18: campos y botones con nombre accesible en las plantillas (factura, mapa, etiquetas, enlace de tienda)',()=>{
 for(const s of ['aria-label="Producto, línea ${i+1}"','aria-label="Descripción, línea ${i+1}"','aria-label="Cantidad, línea ${i+1}"','aria-label="Precio unitario, línea ${i+1}"',
  'id="f_ds" aria-label="Descuento en dólares"','id="mcF" aria-label="Filtrar comercios"','id="vd_link" aria-label="Enlace de tu tienda virtual"','aria-label="Seleccionar pedido para imprimir etiqueta"'])assert.ok(app.includes(s),s);
 assert.match(app,/<div class="vdc" tabindex="0" role="group" aria-label=/);
 // el menú no lleva aria-label propio: axe exige que el nombre contenga el texto visible (p. ej. «Chat 3»)
 assert.doesNotMatch(app,/data-a-click="\$\{_ha\(v\[0\]\)\}" aria-label=/);
});
test('Fase 18: colores de texto de Inicio con contraste AA (variables de tema, no #10b981/#8b5cf6/#f59e0b como color de texto)',()=>{
 assert.doesNotMatch(app,/<span style="color:#10b981;font-weight:600">/);
 assert.doesNotMatch(app,/<span style="color:#8b5cf6;font-weight:600">/);
 assert.doesNotMatch(app,/<span style="color:#f59e0b;font-weight:600">/);
 assert.match(css,/:root\{--viot:#6d28d9\}/);assert.match(css,/:root\[data-t="nocturno"\]\{--viot:#a78bfa\}/);
});
test('Fase 18: sw.js caché tj-net-first-14 o posterior y la CSP sigue sin unsafe-inline en script-src/style-src-elem',()=>{
 assert.match(leer('sw.js'),/const V='tj-net-first-(1[4-9]|[2-9]\d)'/);
 const csp=/Content-Security-Policy" content="([^"]*)"/.exec(html)[1];
 const d=n=>new RegExp('(?:^|; )'+n+' ([^;]*)').exec(csp)[1];
 assert.doesNotMatch(d('script-src'),/unsafe-inline|unsafe-eval/);assert.doesNotMatch(d('style-src-elem'),/unsafe-inline/);
});
