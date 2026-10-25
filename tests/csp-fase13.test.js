/* Fase 13: la CSP de index.html ya no permite estilos <style> en línea (style-src-elem sin 'unsafe-inline'),
   y los scripts de CDN se permiten por ruta exacta, no por dominio entero. Estos tests vigilan que nadie
   reintroduzca un <style>, un <script src> de otra ruta o un createElement('style') sin actualizar la CSP. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=leer('index.html');
const meta=/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html);
const dir={};
for(const p of meta[1].split(';').map(s=>s.trim()).filter(Boolean)){const [n,...v]=p.split(/\s+/);dir[n]=v}
const sha=s=>"'sha256-"+crypto.createHash('sha256').update(s).digest('base64')+"'";
// Coincidencia de una URL con una fuente de la CSP (host + ruta; la ruta que termina en / vale por prefijo).
function permitida(url,fuentes){
 const u=new URL(url);
 return fuentes.some(f=>{
  if(f.startsWith("'"))return false;
  const m=new URL(f);
  if(m.origin!==u.origin)return false;
  return f.endsWith('/')?u.pathname.startsWith(m.pathname):u.pathname===m.pathname;
 });
}

test('script-src: sin unsafe-inline/eval y cada CDN limitado a su ruta (no dominios enteros)',()=>{
 const s=dir['script-src'];
 assert.ok(!s.includes("'unsafe-inline'")&&!s.includes("'unsafe-eval'"));
 for(const dominio of ['https://cdnjs.cloudflare.com','https://cdn.jsdelivr.net','https://www.gstatic.com','https://www.google.com','https://www.recaptcha.net'])
  assert.ok(!s.includes(dominio),dominio+' no debe estar permitido entero en script-src');
 for(const ruta of ['https://www.gstatic.com/firebasejs/10.12.2/','https://cdn.jsdelivr.net/npm/jspdf@4.2.1/','https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/','https://www.google.com/recaptcha/','https://www.gstatic.com/recaptcha/'])
  assert.ok(s.includes(ruta),ruta);
});

test('cada <script src> y <link stylesheet> externo de index.html y apps/ está permitido por la CSP',()=>{
 const archivos=['index.html','apps/modelos.html','apps/investigacion.html'];
 let n=0;
 for(const f of archivos){
  const h=leer(f);
  for(const m of h.matchAll(/<script[^>]*\ssrc="(https:\/\/[^"]+)"/g)){n++;assert.ok(permitida(m[1],dir['script-src']),f+': script no permitido '+m[1])}
  for(const m of h.matchAll(/<link[^>]*href="(https:\/\/[^"]+)"[^>]*>/g)){if(/stylesheet/.test(m[0])){n++;assert.ok(permitida(m[1],dir['style-src-elem']),f+': css no permitido '+m[1])}}
 }
 assert.ok(n>=10,'se revisaron '+n+' recursos externos');
});

test('estilos: style-src-elem sin unsafe-inline; style-src-attr con unsafe-inline; style-src queda como respaldo',()=>{
 assert.ok(!dir['style-src-elem'].includes("'unsafe-inline'"));
 assert.deepEqual(dir['style-src-attr'],["'unsafe-inline'"]);
 assert.ok(dir['style-src'].includes("'unsafe-inline'"),'respaldo para navegadores sin style-src-elem');
});

test('index.html: el único <style> en línea es #_akOff y su hash está en style-src-elem',()=>{
 const bloques=[...html.replace(/<!--[\s\S]*?-->/g,"").matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)];
 assert.equal(bloques.length,1);
 assert.match(bloques[0][1],/id="_akOff"/);
 assert.ok(dir['style-src-elem'].includes(sha(bloques[0][2])),'hash de #_akOff');
});

test('apps/*.html no tienen <style> en línea y enlazan su css',()=>{
 for(const n of ['modelos','investigacion']){
  const h=leer('apps/'+n+'.html');
  assert.ok(!/<style/i.test(h),n+' sin <style>');
  assert.ok(h.includes('href="apps/'+n+'.css'),n+' enlaza apps/'+n+'.css');
  assert.ok(fs.existsSync(path.join(__dirname,'..','apps',n+'.css')));
 }
});

test('ningún script crea elementos <style> ni escribe <style> en línea sin hash en la CSP',()=>{
 for(const f of ['js/app.js','js/marketing.js','js/empresas.js','js/mkt-editor.js','js/empresa-contexto.js','js/facturacion.js','js/utils.js','js/sanear.js','js/redes.js','js/a11y.js','js/uber-nav.js','js/tema.js','js/inicio.js','apps/modelos.js','apps/investigacion.js','migraciones/migracion-multiempresa.js']){
  const t=leer(f);
  assert.ok(!/createElement\(\s*['"]style['"]\s*\)/.test(t),f+': createElement(\'style\')');
  if(f!=='js/politicas.js')assert.ok(!/<style[\s>]/.test(t.replace(/\/\*[\s\S]*?\*\//g,'')),f+': <style> en texto');
 }
 const pol=leer('js/politicas.js');
 const bloques=[...pol.matchAll(/<style>([^<]*)<\/style>/g)];
 assert.equal(bloques.length,1,'constancia legal: un solo <style>');
 assert.ok(dir['style-src-elem'].includes(sha(bloques[0][1])),'hash del <style> de la constancia legal (ventana about:blank hereda la CSP)');
});

test('html2canvas 1.4.1: el <style> que inyecta en su iframe tiene hash en la CSP',()=>{
 const xn='{\n    content: "" !important;\n    display: none !important;\n}';
 const s='.___html2canvas___pseudoelement_before:before'+xn+'\n         .___html2canvas___pseudoelement_after:after'+xn;
 assert.ok(dir['style-src-elem'].includes(sha(s)));
 assert.ok(html.includes('html2canvas/1.4.1/'),'si cambia la versión de html2canvas hay que recalcular este hash');
});

test('los estilos movidos existen y se cargan en el mismo orden de cascada',()=>{
 const o=['css/panel.css','css/uber-skin.css','css/accesibilidad.css','css/inyectados.css'].map(f=>{assert.ok(fs.existsSync(path.join(__dirname,'..',f)),f);return html.indexOf('href="'+f)});
 assert.ok(o.every(i=>i>0)&&o.every((v,i)=>!i||v>o[i-1]),'orden panel < uber-skin < accesibilidad < inyectados');
 assert.ok(html.indexOf('css/panel.css')<html.indexOf('</head>'));
 assert.ok(leer('js/app.js').includes('css/chkskin.css'));
 for(const id of ['redCss','destCss','mcCss'])assert.ok(leer('css/inyectados.css').includes('#'+id),id);
});

test('sw.js: caché tj-net-first-9 y precache de los css nuevos',()=>{
 const sw=leer('sw.js');
 assert.match(sw,/const V='tj-net-first-9'/);
 for(const f of ['css/panel.css','css/inyectados.css','css/chkskin.css','apps/modelos.css','apps/investigacion.css'])assert.ok(sw.includes("'"+f+"'"),f);
});
