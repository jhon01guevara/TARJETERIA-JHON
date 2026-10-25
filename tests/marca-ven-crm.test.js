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

test('sw.js: caché tj-net-first-24 o más, precachea lo nuevo y todo lo precacheado existe',()=>{
 const sw=leer('sw.js');assert.ok(+/const V='tj-net-first-(\d+)'/.exec(sw)[1]>=24);
 const pre=eval(/const PRE=(\[[^\]]*\])/.exec(sw)[1]);
 for(const f of ['manifest-ven-crm.json','assets/ven-crm/icon-192.png','assets/ven-crm/ven-crm-horizontal-oscuro.svg','js/marca-crm.js','css/marca-ven-crm.css'])assert.ok(pre.includes(f),f);
 for(const f of pre)assert.ok(fs.existsSync(path.join(raiz,f)),'no existe: '+f);
});
test('la CSP no cambió y sigue permitiendo el manifest/íconos propios (default-src y img-src de este sitio)',()=>{
 const h=leer('index.html'),csp=/Content-Security-Policy" content="([^"]*)"/.exec(h)[1];
 assert.match(csp,/default-src 'self'/);assert.match(csp,/img-src 'self'/);assert.doesNotMatch(csp,/script-src[^;]*unsafe-inline/);
});
