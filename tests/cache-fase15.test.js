/* Fase 15: caché del service worker, ?v= y CSP intacta. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {appTodo}=require('./helpers/app-fuentes.js');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

/* ───────── Caché ───────── */
test('Fase 15: caché del service worker tj-net-first-11 y ?v= subidos',()=>{
 assert.match(leer('sw.js'),/const V='tj-net-first-\d+'/);
 const h=leer('index.html');
 for(const f of ['js/a11y.js','js/politicas.js'])assert.match(h,new RegExp(f.replace(/[./]/g,'\\$&')+'\\?v=(a11y-fase-15|a11y-restante-fase-18|genuine-tienda-[a-z])'),f);
 assert.match(h,/js\/app\.js\?v=[a-z0-9-]+/);
 assert.match(h,/css\/accesibilidad\.css\?v=\d+/);assert.match(h,/css\/uber-skin\.css\?v=4/);
});
test('Fase 15: la CSP no se tocó (script-src sin unsafe-inline, style-src-elem sin unsafe-inline)',()=>{
 const csp=/Content-Security-Policy" content="([^"]*)"/.exec(leer('index.html'))[1];
 const d=n=>new RegExp('(?:^|; )'+n+' ([^;]*)').exec(csp)[1];
 assert.doesNotMatch(d('script-src'),/unsafe-inline|unsafe-eval/);
 assert.doesNotMatch(d('style-src-elem'),/unsafe-inline/);
});
