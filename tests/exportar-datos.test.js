/* Exportar los datos de la empresa (js/exportar-datos.js): lógica y comprobaciones estáticas sin navegador. La prueba en Chrome real contra PRUEBA: tests/navegador/exportar-datos.js */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const js=leer('js/exportar-datos.js'),html=leer('index.html'),sw=leer('sw.js');
const E=require('../js/exportar-datos.js');
const sinCom=s=>s.replace(/\/\*[\s\S]*?\*\//g,'');

test('exportar-datos.js: sintaxis válida; SOLO LECTURA (ninguna escritura ni borrado), sin eval, sin <style>, sin red externa',()=>{
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'exportar-datos.js'}));
 const c=sinCom(js);
 assert.ok(!/\.(set|add|update|delete|commit|batch|runTransaction)\(/.test(c),'no escribe ni borra en Firestore');
 assert.ok(!/localStorage|sessionStorage|indexedDB/.test(c),'no guarda nada');
 assert.ok(!/\beval\s*\(|new Function\(|createElement\(\s*['"]style['"]\s*\)|<style[\s>]|\sonclick=|javascript:|https?:\/\//.test(c));
 assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(c),'no envía datos a ningún sitio: la descarga es local');
 assert.match(c,/\.get\(\)/,'los pedidos se leen con get()');
});

test('solo el administrador: la tarjeta se dibuja solo con esAdmin() y la descarga lo vuelve a comprobar',()=>{
 const c=sinCom(js);
 assert.match(c,/function montar\(\)\s*\{\s*if \(!esAdm\(\)\) return;/);
 assert.match(c,/async function descargar\(que\)\s*\{\s*if \(!esAdm\(\)\)/);
 assert.match(c,/esAdmin\(\)/);
});

test('celda: comillas, comas, saltos de línea, nulos y números',()=>{
 const c=E.celda;
 assert.equal(c(null),'');assert.equal(c(undefined),'');assert.equal(c(12.5),'12.5');assert.equal(c(NaN),'');
 assert.equal(c(true),'Sí');assert.equal(c(false),'No');
 assert.equal(c('hola'),'hola');
 assert.equal(c('a,b'),'"a,b"');assert.equal(c('di "hola"'),'"di ""hola"""');assert.equal(c('l1\nl2'),'"l1\nl2"');assert.equal(c('a;b'),'"a;b"');
 assert.equal(c('María Pérez — Ñandú'),'María Pérez — Ñandú');
});

test('celda: neutraliza fórmulas (CSV-injection) pero respeta teléfonos y números',()=>{
 const c=E.celda;
 for(const mal of ['=HYPERLINK("http://x","y")','+cmd|\' /C calc\'!A0','-2+3+cmd|x','@SUM(A1)','=1+1','\tabc'])assert.ok(c(mal).replace(/^"/,'').startsWith("'"),'debe neutralizarse: '+mal+' → '+c(mal));
 assert.equal(c('+507 6123-4567'),'+507 6123-4567');
 assert.equal(c('-5'),'-5');assert.equal(c(-5),'-5');
 assert.equal(c('6123-4567'),'6123-4567');
});

const datos={
 clientes:[{id:'c1',n:'Ana, "La Jefa"',r:'8-123-456',t:'+507 6123-4567',d:'Calle 1\nCasa 2',m:'ana@example.com',o:'tienda',lat:8.98,lng:-79.5},{id:'c2',n:'=cmd()',r:'',t:'',d:''}],
 productos:[{id:'p1',n:'Tarjeta',p:1.3},{id:'p2',n:'Sobre',p:0.5}],
 facturas:[{id:'f2',n:2,fecha:'2026-10-02',cli:'Consumidor final',ruc:'',dir:'',pago:'Yappy',items:[{d:'Sobre',q:2,p:0.5}],sub:1,ds:0,itbms:0.07,itbmsp:7,total:1.07,anulada:true},
  {id:'f1',n:1,fecha:'2026-10-01',cli:'Ana',ruc:'8-123-456',dir:'X',pago:'Efectivo',items:[{d:'Tarjeta',q:3,p:1.3},{d:'Sobre',q:1,p:0.5}],sub:4.4,ds:0.4,itbms:0.28,itbmsp:7,total:4.28,nota:'Entregar, viernes',vend:'v1',_v:1}],
 pedidos:[{id:'q1',ts:Date.UTC(2026,9,5,15,30),estado:'atendido',lead:{name:'Luis',tel:'6000-0000',email:'l@x.com',empresa:'LL',dir:'Av 5'},items:[{id:'p1',n:'Tarjeta',p:1.3,q:2}],total:2.6,nota:'',ref:'admin',envio:{agencia:'Agencia X',guia:'G-1'}}],
 usuarios:[{id:'v1',n:'Vera Vendedora'}]
};
const filas=csv=>csv.trim().split('\r\n');

test('construir: cinco CSV con encabezados claros y una fila por registro',()=>{
 const o=E.construir(datos);
 assert.deepEqual(Object.keys(o),['clientes','productos','facturas','lineas','pedidos']);
 for(const k of Object.keys(o)){assert.ok(o[k].endsWith('\r\n'),k);assert.equal(filas(o[k])[0],E.COLS[k].join(','),k)}
 assert.equal(filas(o.clientes).length,1+2);assert.equal(filas(o.productos).length,1+2);assert.equal(filas(o.facturas).length,1+2);assert.equal(filas(o.lineas).length,1+3);assert.equal(filas(o.pedidos).length,1+1);
});

test('construir: contenido correcto (clientes con comillas y saltos, facturas ordenadas por número, vendedor por nombre, líneas e importes)',()=>{
 const o=E.construir(datos);
 assert.match(o.clientes,/c1,"Ana, ""La Jefa""",8-123-456,\+507 6123-4567,"Calle 1\nCasa 2",ana@example\.com,tienda,8\.98,-79\.5/);
 assert.match(o.clientes,/c2,'=cmd\(\)/,'una celda con fórmula queda neutralizada');
 assert.match(o.productos,/p1,Tarjeta,1\.3/);
 const f=filas(o.facturas);
 assert.ok(f[1].startsWith('1,2026-10-01,Ana,') && f[2].startsWith('2,2026-10-02,'),'orden por número de factura');
 assert.match(f[1],/Efectivo,4\.4,0\.4,7,0\.28,4\.28,No,Vera Vendedora,"Entregar, viernes",Tarjeta x3 a 1\.30 \| Sobre x1 a 0\.50/);
 assert.match(f[2],/Yappy,1,0,7,0\.07,1\.07,Sí,,/,'anulada = Sí');
 assert.match(o.lineas,/1,2026-10-01,Ana,Tarjeta,3,1\.3,3\.9/);assert.match(o.lineas,/2,2026-10-02,Consumidor final,Sobre,2,0\.5,1/);
 const p=filas(o.pedidos)[1];
 assert.match(p,/^q1,2026-10-0[45] \d\d:\d\d,Atendido,Luis,6000-0000,l@x\.com,LL,Av 5,Tarjeta x2 a 1\.30,2\.6,,admin,Agencia X,G-1$/);
});

test('construir: datos vacíos o raros no rompen (solo encabezados)',()=>{
 for(const x of [undefined,{},{clientes:null,facturas:'x',pedidos:[null,5]},{facturas:[{n:1,items:'mal'}]}])assert.doesNotThrow(()=>E.construir(x));
 const o=E.construir({});for(const k of Object.keys(o))assert.equal(filas(o[k]).length,1,k);
});

test('aJSON: formato identificado, resumen y sin configuración ni accesos',()=>{
 const j=JSON.parse(E.aJSON(datos,{id:'genuine',nombre:'Genuine'},Date.UTC(2026,9,26,17,0)));
 assert.equal(j.formato,'ven-crm-exportacion');assert.equal(j.version,1);assert.equal(j.generado,'2026-10-26T17:00:00.000Z');
 assert.deepEqual(j.empresa,{id:'genuine',nombre:'Genuine'});assert.deepEqual(j.resumen,{clientes:2,productos:2,facturas:2,pedidos:1});
 assert.equal(j.clientes.length,2);assert.equal(j.facturas.length,2);assert.equal(j.pedidos.length,1);
 assert.ok(!('usuarios' in j)&&!('cfg' in j),'no incluye usuarios ni configuración');
});

test('nombreArchivo: ven-crm_<empresa>_<fecha>_<qué>.<ext> con caracteres seguros',()=>{
 assert.equal(E.nombreArchivo('genuine','2026-10-26','clientes','csv'),'ven-crm_genuine_2026-10-26_clientes.csv');
 assert.equal(E.nombreArchivo('Mi Empresa/../x','2026-10-26','todo','json'),'ven-crm_mi-empresa-x_2026-10-26_todo.json');
 assert.equal(E.nombreArchivo('','2026-10-26','todo','zip'),'ven-crm_empresa_2026-10-26_todo.zip');
});

test('index.html y sw.js: script enlazado una vez, después de app.js y guia.js; en la precarga; caché subida',()=>{
 assert.equal(html.split('js/exportar-datos.js?v=').length-1,1);
 assert.match(html,/<script src="js\/exportar-datos\.js\?v=exportar-\d+"><\/script>/);
 assert.ok(html.indexOf('js/exportar-datos.js')>html.indexOf('js/app.js?v='));
 assert.match(sw,/'js\/exportar-datos\.js'/);assert.ok(+/tj-net-first-(\d+)/.exec(sw)[1]>=41);
 assert.ok(!/<script>[^<]*export/i.test(html));
});
