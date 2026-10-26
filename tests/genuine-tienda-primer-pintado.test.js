/* Tienda de otra empresa: ni logo ni textos de Tarjetería Jhon en ningún momento (primer pintado, recarga y cabecera obsoleta). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const app=leer('js/app.js');

function trozo(desde,hasta){const i=app.indexOf(desde),j=app.indexOf(hasta,i);assert.ok(i>=0&&j>i,'no se encontró '+desde);return app.slice(i,j)}
function ctxNombre(o){
 const src=trozo('function nombreNegocio(){','/* Logo del inicio de sesión');
 const ctx={TJEmpresa:{empEsInicial:()=>o.ini,empActiva:()=>o.slug||'tarjeteria-jhon'},DB:{cfg:o.cfg||{}},SHOP:!!o.shop,SH:o.SH||{},esc:s=>String(s),window:{}};
 vm.createContext(ctx);vm.runInContext(src,ctx);return ctx;
}

test('nombreNegocio: la empresa inicial conserva Tarjetería; otra empresa nunca la hereda',()=>{
 assert.equal(ctxNombre({ini:true,cfg:{}}).nombreNegocio(),'Tarjetería Jhon');
 assert.equal(ctxNombre({ini:true,cfg:{nombre:'Mi Tarjetería'}}).nombreNegocio(),'Mi Tarjetería');
 /* valor por defecto de DB.cfg en el navegador de un visitante de otra empresa */
 assert.equal(ctxNombre({ini:false,shop:true,cfg:{nombre:'Tarjetería Jhon'}}).nombreNegocio(),'Nuestra tienda');
 assert.equal(ctxNombre({ini:false,shop:false,cfg:{nombre:'Tarjetería Jhon'}}).nombreNegocio(),'Mi empresa');
 assert.equal(ctxNombre({ini:false,shop:false,cfg:{nombre:'Genuine'}}).nombreNegocio(),'Genuine');
});
test('nombreNegocio en la tienda de otra empresa: manda lo publicado (SH.empresaNombre) y NO los datos locales de quien administra (p. ej. «GN»)',()=>{
 assert.equal(ctxNombre({ini:false,shop:true,cfg:{nombre:'GN'},SH:{empresaNombre:'Genuine Global Parts'}}).nombreNegocio(),'Genuine Global Parts');
 assert.equal(ctxNombre({ini:false,shop:true,cfg:{nombre:'GN'},SH:{}}).nombreNegocio(),'Nuestra tienda','antes de cargar la plantilla no se usa DB.cfg.nombre');
});
test('heroSubDef y tdEmpQ: eslogan por defecto solo de la inicial; enlaces con ?emp= para las demás',()=>{
 let c=ctxNombre({ini:true});assert.match(c.heroSubDef(),/Tarjetas para toda ocasión/);assert.equal(c.tdEmpQ(),'');
 c=ctxNombre({ini:false,slug:'genuine'});assert.equal(c.heroSubDef(),'');assert.equal(c.tdEmpQ(),'&emp=genuine');
});
test('los enlaces de la tienda (compartir, probar, políticas) llevan la empresa; la inicial conserva el enlace de siempre',()=>{
 assert.match(app,/'\?tienda=1'\+tdEmpQ\(\)\+'&v='/);
 assert.match(app,/href="index\.html\?tienda=1\$\{tdEmpQ\(\)\}"/);
 const pol=leer('js/politicas.js');assert.match(pol,/'\?tienda=1'\+\(typeof tdEmpQ==='function'\?tdEmpQ\(\):''\)/);
});
test('el eslogan «Cada momento merece una tarjeta especial» solo existe en heroSubDef (ya no se cuela como valor por defecto)',()=>{
 assert.equal((app.match(/Cada momento merece una tarjeta especial/g)||[]).length,1);
});
test('shopLogo: otra empresa nunca usa .logo img (logo del panel); hueco mientras carga e inicial si no tiene logo',()=>{
 const f=trozo('const shopLogo=','function shopBrandRefresh');
 assert.match(f,/if\(!TJEmpresa\.empEsInicial\(\)\)\{if\(!SH\.cfgOk\)return '<span class="klogo-ph"/);
 assert.match(f,/klogo-mono/);
 assert.ok(f.indexOf('klogo-mono')<f.indexOf("document.querySelector('.logo img')"),'la rama de otra empresa va ANTES de leer .logo img');
});
test('el snapshot de la tienda actualiza la cabecera, guarda la copia y no se deja pisar por una lectura vacía sin red',()=>{
 assert.match(app,/SH\.cfgOk=true;try\{shopCacheCfg\(cd\);shopBrandRefresh\(\)\}/);
 assert.match(app,/if\(!cf&&sn\.metadata&&sn\.metadata\.fromCache\)break cfgBlk;/);
 assert.match(app,/cfgBlk:\{const cf=sn\.docs\.find/);
 assert.match(app,/SH\.empresaNombre=cd\.empresaNombre\|\|'';SH\.heroTitle=cd\.heroTitle\|\|nombreNegocio\(\)/,'el nombre se fija antes del título');
});
test('la portada muestra esqueleto (no textos por defecto) hasta tener la plantilla de otra empresa, y sin eslogan no pinta el <p>',()=>{
 assert.match(app,/!SH\.cfgOk&&!TJEmpresa\.empEsInicial\(\)\)\?'<h1 class="khero-title khero-sk"/);
 assert.match(app,/\(SH\.heroSub\|\|heroSubDef\(\)\)\?`<p class="khero-wordmark-sub">/);
 const css=leer('css/inyectados.css');for(const k of ['.klogo-ph','.klogo-mono','.khero-sk','prefers-reduced-motion'])assert.ok(css.includes(k),k);
});
test('shopCacheCfg: guarda por empresa (lsk) con presupuesto y se lee en el primer pintado',()=>{
 const src=trozo('function shopCacheCfg(cd){','/* Cuando llega (o cambia)');
 const mem={};const ctx={lsk:k=>k+'_x',localStorage:{setItem:(k,v)=>{mem[k]=v},removeItem:k=>{delete mem[k]},getItem:k=>mem[k]||null},window:{}};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 ctx.shopCacheCfg({logoUrl:'data:image/png;base64,AAAA',heroTitle:'Global',heroSub:'Eslogan',empresaNombre:'Genuine',contacto:{tel:'1'},redes:{},ruido:'no',banners:[{id:'a',src:'x'}]});
 const o=JSON.parse(mem.tj_cached_cfg_x);
 assert.deepEqual([o.logoUrl,o.heroTitle,o.heroSub,o.empresaNombre,o.contacto.tel,o.ruido],['data:image/png;base64,AAAA','Global','Eslogan','Genuine','1',undefined]);
 /* demasiado grande: quita primero el video/foto incrustados; si aún no cabe, los banners; si aun así no, borra la copia */
 ctx.shopCacheCfg({heroTitle:'T',heroPhotoUrl:'p'.repeat(450000)});
 assert.equal(JSON.parse(mem.tj_cached_cfg_x).heroPhotoUrl,undefined);assert.equal(JSON.parse(mem.tj_cached_cfg_x).heroTitle,'T');
 ctx.shopCacheCfg({heroTitle:'T',logoUrl:'l'.repeat(450000)});assert.equal(mem.tj_cached_cfg_x,undefined,'copia imposible: se quita, la nube manda');
 /* shopInit la restaura (incluye nombre, contacto y redes) */
 assert.match(app,/SH\.empresaNombre=cCfg\.empresaNombre\|\|'';SH\.contacto=cCfg\.contacto/);
});
test('sin banners propios solo la empresa inicial ve los de Tarjetería',()=>{
 assert.match(app,/const custom=Array\.isArray\(SH\.banners\)\?SH\.banners:\(TJEmpresa\.empEsInicial\(\)\?null:\[\]\)/);
});
test('subieron ?v= (app.js, politicas.js, inyectados.css) y la caché del service worker',()=>{
 const h=leer('index.html');
 assert.match(h,/js\/app\.js\?v=modulos-fase-24[g-z]/);assert.match(h,/js\/politicas\.js\?v=genuine-tienda-[a-z]/);assert.match(h,/css\/inyectados\.css\?v=([2-9]|\d\d)/);
 assert.ok(+/tj-net-first-(\d+)/.exec(leer('sw.js'))[1]>=27);
});
