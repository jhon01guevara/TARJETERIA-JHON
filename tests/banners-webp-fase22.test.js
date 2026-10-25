/* Fase 22: banners en WebP con respaldo JPG (<picture>). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {leer}=require('./helpers/app-fuentes');
const R=p=>path.join(__dirname,'..',p);
const IDS=['quince','quince2','baby','baby2','grad','grad2','boda','boda2','cumple','cumple2','amor','amor2','felic','felic2'];

test('cada banner conserva su JPG original y tiene su WebP (escritorio y celular), y el WebP pesa al menos 15 % menos',()=>{
 let tj=0,tw=0;
 for(const id of IDS)for(const suf of ['','-m']){
  const j=R(`banners/${id}${suf}.jpg`),w=R(`banners/${id}${suf}.webp`);
  assert.ok(fs.existsSync(j),j+' (el original no se borra)');assert.ok(fs.existsSync(w),w);
  const a=fs.statSync(j).size,b=fs.statSync(w).size;tj+=a;tw+=b;
  assert.ok(b<=a*0.85,`${id}${suf}: webp ${b} vs jpg ${a}`);
  const buf=fs.readFileSync(w);assert.equal(buf.slice(0,4).toString(),'RIFF');assert.equal(buf.slice(8,12).toString(),'WEBP');
  assert.ok(!buf.includes('EXIF')&&!buf.includes('XMP '),w+' sin metadatos');
 }
 assert.ok(tw<=tj*0.8,`total webp ${tw} vs jpg ${tj}`);
});
test('PROMO_IMG apunta a .jpg (0,1) y .webp (2,3) que existen',()=>{
 const ctx=vm.createContext({});vm.runInContext(leer('js/promo.js'),ctx);
 const P=vm.runInContext('PROMO_IMG',ctx);assert.deepEqual(Object.keys(P).sort(),[...IDS].sort());
 for(const id of IDS){const [d,m,dw,mw]=P[id];
  assert.equal(d,`banners/${id}.jpg`);assert.equal(m,`banners/${id}-m.jpg`);assert.equal(dw,`banners/${id}.webp`);assert.equal(mw,`banners/${id}-m.webp`);
  for(const f of [d,m,dw,mw])assert.ok(fs.existsSync(R(f)),f)}
});
test('promoSlide: <picture> con WebP primero (móvil y escritorio) y JPG de respaldo en <img>',()=>{
 const ctx=vm.createContext({esc:s=>String(s),_ha:s=>s});vm.runInContext(leer('js/promo.js'),ctx);
 const h=vm.runInContext("promoSlide({key:'cumple',tema:'cumple',name:'N'})",ctx);
 const orden=['<source media="(max-width:700px)" srcset="banners/cumple-m.webp" type="image/webp">','<source media="(max-width:700px)" srcset="banners/cumple-m.jpg">','<source srcset="banners/cumple.webp" type="image/webp">','<img src="banners/cumple.jpg"'];
 let pos=-1;for(const t of orden){const i=h.indexOf(t);assert.ok(i>pos,t);pos=i}
 // un banner sin .webp se sirve solo en JPG (el respaldo no depende del WebP)
 const ctx2=vm.createContext({esc:s=>String(s),_ha:s=>s});vm.runInContext(leer('js/promo.js')+";PROMO_IMG.cumple.length=2",ctx2);
 const h2=vm.runInContext("promoSlide({key:'cumple',tema:'cumple',name:'N'})",ctx2);
 assert.ok(!h2.includes('webp'));assert.ok(h2.includes('banners/cumple-m.jpg')&&h2.includes('banners/cumple.jpg'));
 // banner propio (subido por el dueño) no cambia
 assert.match(vm.runInContext("promoSlide({custom:true,src:'data:image/png;base64,AA',name:'x'})",ctx),/<img src="data:image\/png;base64,AA"/);
});
test('el script de generación existe, los JPG no se tocan y la caché del SW sube a tj-net-first-16 o más',()=>{
 assert.ok(fs.existsSync(R('docs/generar-banners-webp.py')));
 assert.ok(+/tj-net-first-(\d+)/.exec(leer('sw.js'))[1]>=16);
 assert.match(leer('index.html'),/js\/promo\.js\?v=banners-fase-22/);
});
test('la CSP permite imágenes propias (img-src \'self\'), así que /banners/*.webp no necesita cambios',()=>{
 const h=leer('index.html');const m=/Content-Security-Policy" content="([^"]*)"/.exec(h)[1];
 const img=/img-src ([^;]*)/.exec(m);assert.ok(img&&/'self'/.test(img[1]),'img-src con self');
});
