const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('La tarjeta de inicio de sesión agrupa logo, textos y fondo',()=>{
 const app=leer('js/app.js');
 assert.match(app,/🔐 Configuración de inicio de sesión/,'título nuevo');
 assert.match(app,/🖼 Logo y textos de la pantalla de acceso/);
 assert.match(app,/data-a-change="\$\{_ha\('loginLogoFile'\)\}"/,'subida de logo/GIF/video');
 assert.match(app,/function loginLogoHTML/,'render del logo con foto, GIF o video');
 assert.match(app,/loginLogoKind==='video'/,'video en el login');
 assert.match(app,/DB\.cfg\.loginTitulo/,'título editable');
 assert.match(app,/DB\.cfg\.loginDesc/,'descripción editable');
 /* el login ya no tiene el nombre fijado en el código */
 assert.doesNotMatch(app,/authUI\(`<h2>Tarjetería Jhon<\/h2>/);
 assert.match(app,/authUI\(`<h2>\$\{esc\(\(DB\.cfg&&DB\.cfg\.loginTitulo\)\|\|nombreNegocio\(\)\)\}<\/h2>/);
});

test('La factura usa el logo de la empresa con fallback al del panel',()=>{
 const app=leer('js/app.js');
 assert.match(app,/c\.logoFac\|\|'assets\/logo\.png'/,'factura clásica');
 assert.match(app,/c\.logoFac\|\|LOGO_T/,'plantilla Apple');
 assert.match(app,/Logo de la empresa \(aparece en la factura\)/,'campo en Datos de la empresa');
 assert.match(app,/function facLogoFile/);
});

test('La Plantilla de la web contiene banners editables y forma de botones',()=>{
 const app=leer('js/app.js');
 assert.match(app,/🖼 Plantilla de la web<\/h3>/,'título de la tarjeta');
 assert.match(app,/🎠 Banners promocionales de la portada/);
 assert.match(app,/function banGuardar/);
 assert.match(app,/\(banners\|\|\[\]\)\.slice\(0,6\)/,'máximo 6 banners');
 assert.match(app,/🔘 Forma de los botones de la tienda/);
 assert.match(app,/function btnRadioSet/);
 /* la tienda usa banners propios si existen; si no, los del panel */
 assert.match(app,/const custom=Array\.isArray\(SH\.banners\)\?SH\.banners:null/);
 assert.match(app,/TD\.banners=Array\.isArray\(cd\.banners\)\?cd\.banners:undefined/);
 /* forma aplicada como variable CSS */
 assert.match(app,/--kbtn-r/);
 const css=leer('estilo-tienda-shop.css');
 assert.match(css,/#shop \.sbtn[\s\S]*border-radius:var\(--kbtn-r/);
});

test('Las políticas usan el nombre real de la empresa (nada de nombres fijos)',()=>{
 const app=leer('js/app.js');
 assert.doesNotMatch(app,/DISTRIBUIDORA JHON/);
 assert.doesNotMatch(app,/Distribuidora Jhon \/ Tarjetería Jhon/);
 assert.match(app,/function poliCopiar\(\)\{\s*\n const NN=nombreNegocio\(\)/);
 /* la tarjeta de políticas vive en la pestaña web */
 assert.match(app,/const webCards=\[\s*\['xmasCard',xmasCard\],\['lbgCard',lbgCard\],\['poliCard',poliAdmCard\]/);
 assert.doesNotMatch(app,/genCards=\[\s*\n {3}\['poliCard'/,'ya no está en ajustes generales');
});

test('Las empresas nuevas nacen con demo completo y SIN contenido de Tarjetería Jhon',()=>{
 const emp=leer('js/empresas.js');
 assert.match(emp,/function empNombreActiva/);
 assert.match(emp,/function empCrearDemo/);
 assert.match(emp,/function empDemoImg/,'imágenes placeholder SVG');
 assert.match(emp,/Producto de ejemplo '\+\(i\+1\)/,'3 productos demo');
 assert.match(emp,/heroTitle:d\.nombre/,'la plantilla lleva SU nombre');
 assert.match(emp,/banners:\[\]/,'sin banners heredados');
 assert.match(emp,/cfg:\{nombre:d\.nombre\}/,'el panel arranca con su nombre');
 assert.match(emp,/if\(nueva\)empCrearDemo\(d\)/,'se crea solo para empresas nuevas');
});

test('Los textos de tienda y login usan nombreNegocio() en lugar de nombres fijos',()=>{
 const app=leer('js/app.js');
 assert.match(app,/function nombreNegocio\(\)/);
 assert.match(app,/SH\.heroTitle\|\|nombreNegocio\(\)/,'portada pública');
 assert.match(app,/TD\.heroTitle=cd\.heroTitle\|\|nombreNegocio\(\)/,'lado administración');
 assert.match(app,/esc\(SH\.heroTitle\|\|nombreNegocio\(\)\)/,'titular del banner');
 /* WhatsApp del panel y catálogo compartido */
 assert.match(app,/le escribimos de '\+nombreNegocio\(\)\+'/);
 assert.match(app,/catálogo virtual de '\+nombreNegocio\(\)\+'/);
});

test('Los módulos personalizados cargan limpios en VM',()=>{
 const ctx={console:{log(){},warn(){},error(){}},location:{origin:'https://x',pathname:'/'}};
 vm.createContext(ctx);
 for(const f of ['js/empresa-contexto.js','js/mkt-editor.js','js/marketing.js','js/empresas.js'])
  vm.runInContext(leer(f),ctx,{filename:f});
 assert.equal(typeof ctx.empNombreActiva,'function');
 assert.equal(typeof ctx.empCrearDemo,'function');
 assert.equal(typeof ctx.empDemoImg('GENUINE',0),'string');
 assert.ok(ctx.empDemoImg('GENUINE',0).startsWith('data:image/svg+xml'));
});
