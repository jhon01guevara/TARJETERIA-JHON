/* WhatsApp de la tienda: por defecto el teléfono de la empresa; el campo propio lo sobrescribe; casilla para desactivarlo. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const redes=leer('js/redes.js'),app=leer('js/app.js');
const ctx={};vm.createContext(ctx);vm.runInContext(redes+';this.contWa=contWa;this.contLimpio=contLimpio',ctx);
const w=c=>ctx.contWa(c);
test('sin campo propio: sale del teléfono de la empresa (con o sin formato, con o sin código de país)',()=>{
 assert.equal(w({tel:'(507) 6074-1150'}),'50760741150');assert.equal(w({tel:'+507 6999-0000'}),'50769990000');assert.equal(w({tel:'6074-1150'}),'50760741150');
});
test('el campo WhatsApp propio manda sobre el teléfono',()=>{assert.equal(w({tel:'(507) 6074-1150',wa:'6123-4567'}),'50761234567')});
test('«No mostrar» (waOff) lo desactiva aunque haya teléfono o WhatsApp propio',()=>{
 assert.equal(w({tel:'(507) 6074-1150',waOff:true}),'');assert.equal(w({wa:'6123-4567',waOff:true}),'');assert.equal(w({tel:'(507) 6074-1150',waOff:'si'}),'50760741150','solo true cuenta');
});
test('teléfono inválido o demasiado corto y sin WhatsApp: no inventa número',()=>{
 for(const c of [null,{},{tel:''},{tel:'abc'},{tel:'555-0101'},{tel:'12345'}])assert.equal(w(c),'',JSON.stringify(c));
});
test('contLimpio sigue devolviendo lo mismo salvo waOff (solo aparece cuando es true)',()=>{
 assert.equal(JSON.stringify(ctx.contLimpio({tel:'+507 6074-1150',wa:'6074-1150',email:'a@b.co'})),'{"tel":"+507 6074-1150","wa":"50760741150","email":"a@b.co","dir":"","horario":""}');
 assert.equal(ctx.contLimpio({waOff:true}).waOff,true);assert.equal('waOff' in ctx.contLimpio({waOff:false}),false);
});
test('la tienda, el Contacto oficial y el pedido por WhatsApp usan contWa (no el campo wa a secas)',()=>{
 assert.match(app,/w=\$\('k_wa'\),num=contWa\(typeof SH!=='undefined'\?SH\.contacto:null\)/);
 assert.match(app,/wn=contWa\(typeof SH!=='undefined'\?SH\.contacto:null\);\n if\(wn\)f\.push\(\['💬','WhatsApp'/);
 assert.match(app,/const num=contWa\(typeof SH!=='undefined'\?SH\.contacto:null\);if\(!num\|\|!p\)return''/);
 assert.doesNotMatch(app,/contLimpio\(typeof SH!=='undefined'\?SH\.contacto:null\)\.wa/);
});
test('el panel explica el valor por defecto y ofrece «No mostrar el botón de WhatsApp» (con borrador y guardado)',()=>{
 assert.match(app,/usa por defecto el <b>teléfono de la empresa<\/b>/);
 assert.match(app,/id="ct_waOff"[^>]*data-h-change="h365"/);
 assert.match(app,/__H\.h365=function\(event,a\)\{RS_DRAFT\[this\.id\]=this\.checked/);
 assert.match(app,/raw\.waOff=!!\(o&&o\.checked\)/);assert.match(app,/o\.checked=!!ct\.waOff/);
 assert.match(redes,/\['wa','WhatsApp \(opcional: si lo deja vacío se usa el teléfono\)'/);
});
test('versiones subidas',()=>{
 const h=leer('index.html');assert.match(h,/js\/app\.js\?v=modulos-fase-24[l-z]/);assert.match(h,/js\/redes\.js\?v=genuine-tienda-d/);assert.match(leer('sw.js'),/tj-net-first-(3[2-9]|[4-9]\d)/);
});
