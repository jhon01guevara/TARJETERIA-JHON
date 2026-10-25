/* Fase 20: hallazgos menores — copia local de la tienda con presupuesto, zonas táctiles de escritorio, puntos del carrusel y landmark de WhatsApp. */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {leer}=require('./helpers/app-fuentes');
const app=leer('js/app.js'),css=leer('css/accesibilidad.css'),html=leer('index.html'),sw=leer('sw.js');

/* localStorage falso con la misma cuota que Chrome (≈5,24 M caracteres, claves incluidas) */
function mundo(LIM=5242880){
 const m=new Map();const tam=()=>[...m].reduce((a,[k,v])=>a+k.length+v.length,0);
 const ls={get length(){return m.size},key:i=>[...m.keys()][i]??null,getItem:k=>m.has(k)?m.get(k):null,removeItem:k=>{m.delete(k)},
  setItem(k,v){v=String(v);const nuevo=tam()-(m.has(k)?k.length+m.get(k).length:0)+k.length+v.length;if(nuevo>LIM)throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});m.set(k,v)}};
 const src=/function shopCacheItems\(items\)\{[\s\S]*?\n\}\nwindow\.shopCacheItems=/.exec(app)[0].replace(/\nwindow\.shopCacheItems=$/,'');
 const ctx=vm.createContext({localStorage:ls,lsk:k=>k});vm.runInContext(src+';this.f=shopCacheItems',ctx);
 return {ls,m,tam,f:ctx.f};
}
const articulo=(i,n=120000)=>({id:'a'+i,name:'Tarjeta '+i,price:1,cat:'x',ts:1e6-i,img:'data:image/jpeg;base64,'+'A'.repeat(n)});
const nube=(n,t=120000)=>Array.from({length:n},(_,i)=>articulo(i,t));

test('la tienda ya no guarda 180 artículos enteros de golpe (superaba la cuota) sino que llama a shopCacheItems',()=>{
 assert.doesNotMatch(app,/localStorage\.setItem\(lsk\('tj_cached_items'\),JSON\.stringify\(SH\.items\.slice\(0,180\)\)\)/);
 assert.match(app,/shopCacheItems\(SH\.items\);\{\$\('sh_g'\)\?shopFilters\(\):shopCatalog\(\)\}/);
 assert.equal(app.split("lsk('tj_cached_items')").length-1,2,'la función y la lectura del arranque');
});
test('con 63 fotos de ~120 mil caracteres (7,5 M en total) guarda un prefijo de los MÁS NUEVOS, completos, sin pasar de 2 M',()=>{
 const w=mundo();w.f(nube(63));
 const g=JSON.parse(w.ls.getItem('tj_cached_items'));
 assert.ok(g.length>=10&&g.length<=16,'artículos guardados: '+g.length);
 assert.deepEqual(g.map(x=>x.id),nube(63).slice(0,g.length).map(x=>x.id),'son los primeros (más nuevos) y en orden');
 assert.ok(g.every(x=>x.img.length>100000),'siguen con su foto');
 assert.ok(w.ls.getItem('tj_cached_items').length<=2000000);
});
test('catálogo pequeño (sin fotos pesadas): se guardan los 180 como antes',()=>{
 const w=mundo();w.f(nube(250,100));
 assert.equal(JSON.parse(w.ls.getItem('tj_cached_items')).length,180);
});
test('respeta la memoria de las demás claves (tj_db del panel): el total no pasa de ~3,8 M',()=>{
 const w=mundo();w.ls.setItem('tj_db','x'.repeat(2900000));w.f(nube(63));
 assert.ok(w.tam()<=3800000,'total '+w.tam());
 assert.ok(w.ls.getItem('tj_cached_items'),'cabe algo con la holgura que queda');
 assert.equal(w.ls.getItem('tj_db').length,2900000,'no toca las otras claves');
});
test('memoria casi llena: no lanza, no deja copia a medias y quita la anterior',()=>{
 const w=mundo();w.f(nube(63));assert.ok(w.ls.getItem('tj_cached_items'));
 w.ls.removeItem('tj_cached_items');w.ls.setItem('tj_db','x'.repeat(4700000));w.ls.setItem('tj_cached_items','["viejo"]');
 assert.doesNotThrow(()=>w.f(nube(63)));
 assert.equal(w.ls.getItem('tj_cached_items'),null);assert.equal(w.ls.getItem('tj_db').length,4700000);
});
test('fallo real de setItem: borra copias de OTRAS empresas, reintenta con la mitad y guarda; la de la empresa activa no se borra antes de tiempo',()=>{
 const w=mundo();w.ls.setItem('tj_cached_items_otra','y'.repeat(300000));w.ls.setItem('tj_cached_items_otra2','z');w.ls.setItem('tj_shop_cart','{"a":1}');
 const real=w.ls.setItem;let n=0;w.ls.setItem=function(k,v){if(k==='tj_cached_items'&&n++===0)throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});return real.call(this,k,v)};
 assert.doesNotThrow(()=>w.f(nube(63)));
 assert.equal(n,2);assert.equal(w.ls.getItem('tj_cached_items_otra'),null);assert.equal(w.ls.getItem('tj_cached_items_otra2'),null);
 assert.equal(w.ls.getItem('tj_shop_cart'),'{"a":1}','otras claves intactas');
 assert.ok(JSON.parse(w.ls.getItem('tj_cached_items')).length>0);
});
test('si setItem siempre falla: no lanza y queda sin copia',()=>{
 const w=mundo();w.ls.setItem=()=>{throw new Error('quota')};
 assert.doesNotThrow(()=>w.f(nube(5)));assert.equal(w.ls.getItem('tj_cached_items'),null);
});
test('una lista vacía (snapshot sin red) no pisa la última copia buena; los datos no válidos tampoco lanzan',()=>{
 const w=mundo();w.f(nube(5,1000));const antes=w.ls.getItem('tj_cached_items');
 w.f([]);w.f(undefined);w.f(null);assert.equal(w.ls.getItem('tj_cached_items'),antes);
});
test('la lectura del arranque sigue igual (JSON.parse + SH.items/SH.ok) y la copia de configuración no cambia (nunca se escribía: cf no existía fuera de su bloque)',()=>{
 assert.match(app,/const cItems=JSON\.parse\(localStorage\.getItem\(lsk\('tj_cached_items'\)\)\|\|'\[\]'\);\s*if\(Array\.isArray\(cItems\)&&cItems\.length>0\)\{\s*SH\.items=cItems;SH\.ok=1;/);
 assert.doesNotMatch(app,/if\(cf&&cf\.data\(\)\)localStorage\.setItem/);
});
test('CSS fase 20: zonas de 24 px en escritorio, puntos del carrusel de 24×24 con el punto de 8 px dentro, y el bloque de móvil de la fase 18 intacto',()=>{
 const f20=css.slice(css.indexOf('FASE 20'));
 const mq=/@media\(min-width:821px\)\{([\s\S]*?)\n\}/.exec(f20)[1];
 assert.match(mq,/summary,h3\[data-h-click\],#auth a\{min-height:24px/);assert.match(mq,/input\.etqcb\{min-width:24px;min-height:24px\}/);
 assert.match(mq,/label:has\(>input\[type="checkbox"\]\)\{min-height:24px/);
 assert.match(f20,/:where\(\.btn\.s\)\{min-height:24px\}/);
 assert.match(f20,/\.khero-dots button\{width:24px;height:24px;padding:8px;box-sizing:border-box\}/);
 assert.match(f20,/#shop \.khero-dots button\{background-clip:content-box\}/,'misma especificidad que el atajo background de panel.css, que reinicia background-clip');
 assert.match(f20,/\.khero-dots button\.on\{width:38px\}/);
 assert.match(f20,/\.khero-dots\{gap:0!important;right:8px!important;bottom:6px!important\}/);
 assert.match(css,/@media\(max-width:820px\)\{\n  summary,h3\[data-h-click\],#auth a\{min-height:24px/,'bloque móvil de la fase 18 sigue');
});
test('el botón de WhatsApp vive dentro de un landmark complementary con nombre, que se oculta junto con el botón',()=>{
 assert.match(app,/<div class="kwrap" role="complementary" aria-label="Contacto por WhatsApp" hidden><a class="kwa" id="k_wa"[^>]*hidden>[\s\S]*?<\/svg><\/a><\/div>`;/);
 assert.match(app,/const g=w\.parentNode;if\(g&&g\.classList\.contains\('kwrap'\)\)g\.hidden=w\.hidden/);
 assert.match(css,/\.kwrap\{margin:0;padding:0;border:0;height:0\}\s*\.kwrap\[hidden\]\{display:none\}/);
});
test('caché del service worker tj-net-first-17, ?v= de app.js y de accesibilidad.css subidos, y guía publicada',()=>{
 assert.match(sw,/const V='tj-net-first-(1[7-9]|[2-9]\d)'/);
 assert.match(html,/js\/app\.js\?v=(hallazgos-fase-20|modulos-fase-21[a-z])/);assert.match(html,/css\/accesibilidad\.css\?v=4/);
 assert.ok(leer('docs/GUIA-PRUEBAS-FASE-20.md').length>800);
});
