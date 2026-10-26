/* Logo de la tienda web editable por empresa desde Configuración (cabecera «Catálogo virtual» y portada). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const app=leer('js/app.js'),med=leer('js/tienda-config-medios.js');

test('Configuración ofrece subir y quitar el logo de la tienda web, junto al resto de logos',()=>{
 assert.match(app,/Subir logo de la tienda web/);
 assert.match(app,/_ha\('shopLogoFile'\)/);assert.match(app,/_ha\('shopLogoQuitar'\)/);
 assert.ok(app.indexOf('Logo de la tienda web</b>')>app.indexOf('Logo y textos de la pantalla de acceso'),'dentro de la tarjeta de logos');
 assert.match(app,/TD\.logoUrl/);
});
test('el archivo medios define y exporta shopLogoComprimir / shopLogoGuardar / shopLogoFile / shopLogoQuitar y carga solo en una VM',()=>{
 const w={};const ctx={window:w};vm.createContext(ctx);vm.runInContext(med,ctx);
 for(const f of ['shopLogoComprimir','shopLogoGuardar','shopLogoFile','shopLogoQuitar','shopLogoUpload','shopLogoClear'])assert.equal(typeof w[f],'function',f);
});
test('shopLogoGuardar escribe SOLO logoUrl en la plantilla de la empresa activa (merge) y exige administrador y conexión',async()=>{
 const w={};let escrito=null,alertas=[];
 const ctx={window:w,alert:m=>alertas.push(m),esAdmin:()=>true,fbDb:{},TD:{},fbCol:c=>({doc:d=>({set:async(o,op)=>{escrito={c,d,o,op}}})})};
 vm.createContext(ctx);vm.runInContext(med,ctx);
 assert.equal(await ctx.shopLogoGuardar('data:image/png;base64,AAAA'),true);
 assert.equal(escrito.c,'tienda_items');assert.equal(escrito.d,'__cfg');assert.equal(JSON.stringify(escrito.op),'{"merge":true}');
 assert.equal(Object.keys(escrito.o).sort().join(),'__cfg,logoUrl,ts');assert.equal(escrito.o.logoUrl,'data:image/png;base64,AAAA');
 assert.equal(ctx.TD.logoUrl,'data:image/png;base64,AAAA');
 const sin=vm.createContext({window:{},alert:m=>alertas.push(m),esAdmin:()=>false,fbDb:{},TD:{},fbCol:()=>{throw new Error('no debe escribir')}});vm.runInContext(med,sin);
 assert.equal(await sin.shopLogoGuardar('x'),false);
});
test('la compresión conserva la transparencia (PNG/WebP antes que JPG), limita a 800 px y a 180 KB, y el límite cabe en los 250 000 caracteres de shopBrandSave',()=>{
 const f=/async function shopLogoComprimir[\s\S]*?\n}\n/.exec(med)[0];
 assert.match(f,/const MAX=180\*1024/);assert.match(f,/Math\.min\(800,bmp\.width\)/);
 assert.ok(f.indexOf("'image/png'")<f.indexOf("'image/webp'"));assert.doesNotMatch(f,/image\/jpeg/);
 assert.ok(Math.ceil(180*1024*4/3)+30<250000,'180 KB en base64 < 250 000 caracteres (corte de shopBrandSave)');
 assert.match(app,/const logo=\(\(\$\("sh_cfg_logo"\)&&\$\("sh_cfg_logo"\)\.value\.trim\(\)\)\|\|""\)\.slice\(0,250000\)/);
});
test('la subida de la plantilla ya no lee el archivo entero (2,5 MB) sin comprimir',()=>{
 const f=/async function shopLogoUpload[\s\S]*?\n}\n/.exec(med)[0];
 assert.match(f,/shopLogoComprimir\(file\)/);assert.doesNotMatch(f,/readAsDataURL/);
});
test('?v= subidos: tienda-config-medios.js (genuine-tienda-b), app.js y caché del service worker',()=>{
 const h=leer('index.html');
 assert.match(h,/js\/tienda-config-medios\.js\?v=genuine-tienda-b/);assert.match(h,/js\/app\.js\?v=modulos-fase-24[h-z]/);
 assert.ok(+/tj-net-first-(\d+)/.exec(leer('sw.js'))[1]>=28);
});
