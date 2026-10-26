/* Marca VEN CRM (solo el panel): manifest propio, íconos con sus medidas reales, el script que cambia el <head> solo fuera de la tienda,
   la pantalla de acceso, el service worker y la CSP. Sin dependencias ni red. Prueba en Chrome real: tests/navegador/marca-ven-crm.js. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const raiz=path.join(__dirname,'..');
const leer=f=>fs.readFileSync(path.join(raiz,f),'utf8');
const png=f=>{const b=fs.readFileSync(path.join(raiz,f));assert.equal(b.toString('latin1',1,4),'PNG',f);return{w:b.readUInt32BE(16),h:b.readUInt32BE(20)}};

test('manifest-ven-crm.json: nombre VEN CRM, id propio, fondo negro y 3 íconos que existen con su tamaño real',()=>{
 const m=JSON.parse(leer('manifest-ven-crm.json'));
 assert.equal(m.name,'VEN CRM');assert.equal(m.short_name,'VEN CRM');assert.ok(m.id);
 assert.equal(m.display,'standalone');assert.equal(m.theme_color,'#000000');assert.equal(m.background_color,'#000000');
 assert.equal(m.scope,'./');assert.equal(m.start_url,'./index.html');
 assert.equal(m.icons.length,3);
 assert.ok(m.icons.some(i=>i.purpose==='maskable'),'hay ícono maskable');
 for(const i of m.icons){const d=png(i.src);assert.equal(`${d.w}x${d.h}`,i.sizes,i.src);}
});

test('manifest.json (tienda y copia anterior) NO cambia de marca',()=>{
 const m=JSON.parse(leer('manifest.json'));
 assert.match(m.name,/Tarjetería Jhon/);assert.doesNotMatch(JSON.stringify(m),/VEN CRM/);
 assert.deepEqual(m.icons.map(i=>i.src),['icon-192.png','icon-512.png','icon-512-maskable.png']);
});

test('kit de marca en assets/ven-crm: PNG con medida correcta y SVG solo con formas (sin texto ni imágenes ni scripts)',()=>{
 const d='assets/ven-crm/';
 assert.deepEqual(png(d+'icon-192.png'),{w:192,h:192});assert.deepEqual(png(d+'icon-512.png'),{w:512,h:512});
 assert.deepEqual(png(d+'icon-maskable-512.png'),{w:512,h:512});assert.deepEqual(png(d+'apple-touch-icon-180.png'),{w:180,h:180});
 assert.deepEqual(png(d+'favicon-32.png'),{w:32,h:32});assert.deepEqual(png(d+'og-image.png'),{w:1200,h:630});
 for(const f of ['favicon.svg','icono-app.svg','ven-crm-horizontal-claro.svg','ven-crm-horizontal-oscuro.svg']){
  const s=leer(d+f);assert.match(s,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,f);
  assert.doesNotMatch(s,/<text|<image|<script|<foreignObject|font-family|onload=/i,f+' debe ser solo vectores');
 }
});

function cabeza(search){
 const el=(attrs)=>({attrs:Object.assign({},attrs),setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]}});
 const e={manifest:el({href:'manifest.json'}),tema:el({content:'#E0457B'}),icon:el({href:'icon-192.png'}),apple:el({href:'apple-touch-icon.png'}),at:el({content:'Tarjetería Jhon'}),
  site:el({content:'Tarjetería Jhon'}),ogt:el({content:'Tarjetería Jhon · Panel de Facturación'}),twt:el({content:'Tarjetería Jhon · Panel de Facturación'})};
 const mapa={'link[rel=manifest]':e.manifest,'meta[name=theme-color]':e.tema,'link[rel=icon]':e.icon,'link[rel=apple-touch-icon]':e.apple,'meta[name=apple-mobile-web-app-title]':e.at,
  'meta[property="og:site_name"]':e.site,'meta[property="og:title"]':e.ogt,'meta[name="twitter:title"]':e.twt};
 const clases=new Set();
 const document={title:'Tarjetería Jhon · Panel de Facturación',documentElement:{classList:{add:c=>clases.add(c)}},querySelector:s=>mapa[s]||null};
 const win={};const ctx={window:win,document,location:{search}};ctx.self=win;vm.createContext(ctx);
 vm.runInContext(leer('js/marca-crm.js'),ctx);
 return{e,clases,document,M:win.TJMarca};
}
test('js/marca-crm.js: en el panel (sin ?tienda) cambia manifest, íconos, título y color; expone TJMarca.panel',()=>{
 for(const q of ['','?v=admin','?r=1','?otra=tienda']){
  const {e,clases,document,M}=cabeza(q);
  assert.equal(M.panel,true,q);assert.ok(clases.has('ven-crm'),q);
  assert.equal(e.manifest.attrs.href,'manifest-ven-crm.json');assert.equal(e.tema.attrs.content,'#000000');
  assert.equal(e.icon.attrs.href,'assets/ven-crm/favicon.svg');assert.equal(e.icon.attrs.type,'image/svg+xml');
  assert.equal(e.apple.attrs.href,'assets/ven-crm/apple-touch-icon-180.png');assert.equal(e.at.attrs.content,'VEN CRM');
  assert.equal(document.title,'VEN CRM · Panel');assert.match(M.loginHTML('<b>x</b>'),/class="vlogo"><img src="assets\/ven-crm\/ven-crm-horizontal-oscuro\.svg" alt="VEN CRM".*<\/div><b>x<\/b>$/);
  assert.match(M.pie(),/VEN CRM/);
 }
});
test('js/marca-crm.js: en la tienda (?tienda=…) NO toca nada',()=>{
 for(const q of ['?tienda=1','?tienda=1&v=admin&r=1','?v=x&tienda','?v=x&tienda&p=3']){
  const {e,clases,document,M}=cabeza(q);
  assert.equal(M.panel,false,q);assert.equal(clases.size,0,q);
  assert.equal(e.manifest.attrs.href,'manifest.json');assert.equal(e.tema.attrs.content,'#E0457B');assert.equal(e.icon.attrs.href,'icon-192.png');
  assert.equal(e.apple.attrs.href,'apple-touch-icon.png');assert.equal(e.at.attrs.content,'Tarjetería Jhon');assert.equal(e.site.attrs.content,'Tarjetería Jhon');
  assert.equal(document.title,'Tarjetería Jhon · Panel de Facturación');
 }
});
test('js/marca-crm.js: sin manejadores en línea ni eval (compatible con la CSP) y misma detección de tienda que tema.js',()=>{
 const s=leer('js/marca-crm.js');assert.doesNotMatch(s.replace(/\/\*[\s\S]*?\*\//g,''),/eval\(|new Function|innerHTML\s*=|\bon[a-z]+\s*=/);
 assert.ok(s.includes('/[?&]tienda(=|&|$)/'));assert.ok(leer('js/tema.js').includes('/[?&]tienda(=|&|$)/'));
});

test('index.html: marca-crm.js (con ?v=marca-ven-crm-N) y su CSS van en <head> tras el <title> y antes de panel.css; ningún script nuevo en línea',()=>{
 const h=leer('index.html'),cab=h.slice(0,h.indexOf('</head>'));
 const s=cab.indexOf('js/marca-crm.js?v=marca-ven-crm-'),t=cab.indexOf('<title>'),p=cab.indexOf('css/panel.css'),c=cab.indexOf('css/marca-ven-crm.css?v=marca-ven-crm-');
 assert.ok(t>0&&s>t&&s<p&&c>p,'orden: title < marca-crm.js < panel.css < marca-ven-crm.css');
 assert.match(h,/<script src="js\/marca-crm\.js\?v=marca-ven-crm-\d+"><\/script>/);
 assert.match(h,/<link rel="manifest" href="manifest\.json">/,'el HTML estático (y la vista previa de la tienda) conserva el manifest de siempre');
 assert.match(h,/<title>Tarjetería Jhon · Panel de Facturación<\/title>/);
 assert.equal((h.match(/<script>/g)||[]).length,0,'sin <script> en línea');
 assert.ok(h.indexOf('js/marca-crm.js')<h.indexOf('js/app.js?v='),'TJMarca existe antes de app.js');
});
test('css/marca-ven-crm.css: todo va acotado a html.ven-crm, #auth o .vlogo (no puede afectar a la tienda)',()=>{
 const c=leer('css/marca-ven-crm.css').replace(/\/\*[\s\S]*?\*\//g,'');
 for(const r of c.split('}').map(x=>x.split('{')[0].trim()).filter(Boolean))for(const sel of r.split(','))assert.match(sel.trim(),/^(html\.ven-crm\b|\.vlogo\b)/,'selector sin acotar: '+sel);
});

test('js/app.js: authUI usa TJMarca solo si es el panel y conserva el acceso anterior como respaldo',()=>{
 const a=leer('js/app.js'),i=a.indexOf('function authUI(h)'),f=a.slice(i,a.indexOf('\n',i));
 assert.match(f,/const vc=window\.TJMarca&&TJMarca\.panel;const lgo=vc\?TJMarca\.loginHTML\(loginLogoHTML\(\)\):lgo0;/);
 assert.match(f,/const lgo0=loginLogoHTML\(\)\|\|\(lg\?/);
 assert.match(f,/\(vc\?TJMarca\.pie\(\):'🔒 Acceso restringido · Panel de Facturación'\)/);
});

test('sw.js: caché tj-net-first-25 o más, precachea lo nuevo y todo lo precacheado existe',()=>{
 const sw=leer('sw.js');assert.ok(+/const V='tj-net-first-(\d+)'/.exec(sw)[1]>=25);
 const pre=eval(/const PRE=(\[[^\]]*\])/.exec(sw)[1]);
 for(const f of ['manifest-ven-crm.json','assets/ven-crm/icon-192.png','assets/ven-crm/ven-crm-horizontal-oscuro.svg','js/marca-crm.js','css/marca-ven-crm.css','assets/ven-crm/ven-crm-horizontal-claro.svg','assets/ven-crm/icono-app.svg'])assert.ok(pre.includes(f),f);
 for(const f of pre)assert.ok(fs.existsSync(path.join(raiz,f)),'no existe: '+f);
});
test('la CSP no cambió y sigue permitiendo el manifest/íconos propios (default-src y img-src de este sitio)',()=>{
 const h=leer('index.html'),csp=/Content-Security-Policy" content="([^"]*)"/.exec(h)[1];
 assert.match(csp,/default-src 'self'/);assert.match(csp,/img-src 'self'/);assert.doesNotMatch(csp,/script-src[^;]*unsafe-inline/);
});

/* ===== Interior del panel (PR «marca-ven-crm-panel») ===== */
function dom(search){
 /* DOM mínimo: lo justo para ejecutar TJMarca.interior() y ver qué toca. */
 const mk=(tag,txt)=>{const e={tag,children:[],attrs:{},cls:new Set(),textContent:txt||'',
  setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},classList:{add:c=>e.cls.add(c)},
  appendChild(c){c.padre=e;e.children.push(c);return c},insertBefore(c,r){c.padre=e;e.children.splice(Math.max(0,e.children.indexOf(r)),0,c);return c},
  querySelector(s){const q=s.replace('.','');const rec=n=>{for(const c of n.children){if(c.cls.has(q)||c.tag===s)return c;const r=rec(c);if(r)return r}return null};return rec(e)}};
  Object.defineProperty(e,'className',{get(){return[...e.cls].join(' ')},set(v){e.cls=new Set(String(v).split(' ').filter(Boolean))}});return e};
 const h1=mk('h1','Panel de Facturación'),rt=mk('div','Tarjetería Jhon · Panel de Facturación'),h1m=mk('h1','Panel de Facturación · Tarjetería Jhon'),sf=mk('div','Respaldo'),div1=mk('div'),logoImg=mk('img');
 const mapa={'.brand h1':h1,'.top .rt':rt,'h1.h1m':h1m,'.top > div':div1,'.sf':sf};
 const el=a=>({attrs:Object.assign({},a),setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]}});
 ['link[rel=manifest]','meta[name=theme-color]','link[rel=icon]','link[rel=apple-touch-icon]','meta[name=apple-mobile-web-app-title]','meta[property="og:site_name"]','meta[property="og:title"]','meta[name="twitter:title"]'].forEach(s=>mapa[s]=el({}));
 h1.classList={add:c=>h1.cls.add(c)};
 const document={title:'Tarjetería Jhon · Panel de Facturación',createElement:t=>mk(t),documentElement:{classList:{add(){}}},querySelector:s=>mapa[s]||null};
 const win={};const ctx={window:win,document,location:{search}};ctx.self=win;vm.createContext(ctx);
 vm.runInContext(leer('js/marca-crm.js'),ctx);
 return{h1,rt,h1m,sf,div1,logoImg,document,M:win.TJMarca};
}
test('js/marca-crm.js interior: en el panel pone el logo VEN CRM, el símbolo, el pie y cambia «Panel de Facturación» por «VEN CRM» sin tocar el nombre de la empresa',()=>{
 const x=dom('?v=admin');
 assert.equal(x.h1.children.length,1);assert.equal(x.h1.children[0].alt,'VEN CRM');assert.equal(x.h1.children[0].src,'assets/ven-crm/ven-crm-horizontal-claro.svg');assert.ok(x.h1.cls.has('vwm'));
 assert.equal(x.rt.textContent,'Tarjetería Jhon · VEN CRM');assert.equal(x.h1m.textContent,'VEN CRM · Tarjetería Jhon');
 assert.equal(x.div1.children[0].className,'vsym');assert.equal(x.div1.children[0].alt,'');assert.equal(x.div1.children[0].src,'assets/ven-crm/icono-app.svg');
 assert.equal(x.sf.children.at(-1).className,'vpie');assert.equal(x.sf.children.at(-1).textContent,'VEN CRM');
});
test('js/marca-crm.js interior: es idempotente (llamarlo otra vez no duplica nada)',()=>{
 const x=dom('');x.M.interior();x.M.interior();
 assert.equal(x.h1.children.length,1);assert.equal(x.div1.children.length,1);assert.equal(x.sf.children.length,1);assert.equal(x.rt.textContent,'Tarjetería Jhon · VEN CRM');
});
test('js/marca-crm.js interior: en la tienda (?tienda=…) no toca ningún rótulo, ni crea elementos',()=>{
 const x=dom('?tienda=1&v=admin');
 assert.equal(x.h1.children.length,0);assert.equal(x.h1.textContent,'Panel de Facturación');assert.equal(x.rt.textContent,'Tarjetería Jhon · Panel de Facturación');
 assert.equal(x.div1.children.length,0);assert.equal(x.sf.children.length,0);assert.equal(typeof x.M.interior,'undefined');
});
test('js/marca-crm.js interior: no crea elementos con la clase «logo» (facturas, informes y PDF leen el primer «.logo img» = el logo de la empresa)',()=>{
 const s=leer('js/marca-crm.js').replace(/\/\*[\s\S]*?\*\//g,'');
 assert.doesNotMatch(s,/className\s*=\s*'logo|classList\.add\('logo/);
 assert.deepEqual(dom('').M.paleta.length>=6,true);
 for(const c of dom('').M.paleta){const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);assert.ok(!(r>g+40&&r>b),'sin rosado/rojo: '+c)}
});
test('index.html: el HTML estático sigue siendo el de la tienda (nombre, h1 y rótulos) y .logo sigue siendo el primer «.logo img»',()=>{
 const h=leer('index.html');
 assert.match(h,/<div class="brand"><div class="logo"><img src="assets\/logo\.png" alt="Tarjetería Jhon"><\/div><small>Tarjetería Jhon<\/small><h1>Panel de Facturación<\/h1><p>Tarjetas para toda ocasión<\/p><\/div>/);
 assert.match(h,/<div class="rt">Tarjetería Jhon · Panel de Facturación<\/div>/);
 assert.match(h,/js\/marca-crm\.js\?v=marca-ven-crm-[2-9]/);assert.match(h,/css\/marca-ven-crm\.css\?v=marca-ven-crm-[2-9]/);
 assert.match(h,/js\/app\.js\?v=modulos-fase-24[e-z]/);
});
test('css/marca-ven-crm.css interior: todo bajo html.ven-crm; no toca #shop, #prt (facturas/impresión), .fa, .logo ni .brand small/p (datos de la empresa)',()=>{
 const c=leer('css/marca-ven-crm.css').replace(/\/\*[\s\S]*?\*\//g,'');
 const sels=c.split('}').map(x=>x.split('{')[0].trim()).filter(Boolean).flatMap(r=>r.split(',').map(x=>x.trim()));
 for(const sel of sels){
  assert.match(sel,/^(html\.ven-crm\b|\.vlogo\b|@media)/,'sin acotar: '+sel);
  assert.doesNotMatch(sel,/#shop|#prt|\.fa\b|\.klogo|\.logo\b|\.brand small|\.brand p\b|\.cv\b|@page/,'toca algo que debe quedar igual: '+sel);
 }
 assert.doesNotMatch(c,/E0457B|224,\s*69,\s*123/i,'el rosado no puede volver');
});
test('css/marca-ven-crm.css interior: contraste accesible (blanco sobre #1f1f1f, negro sobre blanco, grises ≥ 4,5:1, acento ≥ 4,5:1)',()=>{
 const L=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]};
 const R=(a,b)=>{const x=L(a),y=L(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 assert.ok(R('#ffffff','#1f1f1f')>=7);assert.ok(R('#000000','#ffffff')>=7);assert.ok(R('#ffffff','#2e2e2e')>=7);
 assert.ok(R('#1A56DB','#ffffff')>=4.5,'acento claro sobre blanco');assert.ok(R('#7FA8FF','#000000')>=4.5,'acento nocturno sobre negro');
 assert.ok(R('#6B6B6B','#ffffff')>=4.5,'gris del tema (--gris) sobre blanco');
 const c=leer('css/marca-ven-crm.css');assert.match(c,/--ven-acento:#1A56DB/);assert.match(c,/--ven-acento:#7FA8FF/);
});
test('js/app.js: los gráficos usan la paleta de VEN CRM solo en el panel y conservan la anterior como respaldo',()=>{
 const a=leer('js/app.js');
 assert.ok(a.includes("const cPal=(window.TJMarca&&TJMarca.panel&&TJMarca.paleta)||['#E0457B','#6366f1','#10b981','#f59e0b','#8b5cf6','#06b6d4'];"));
});
