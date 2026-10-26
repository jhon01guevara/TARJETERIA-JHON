/* Pantalla «Ayuda y soporte» (js/ayuda.js + js/soporte-config.js): lógica y comprobaciones estáticas sin navegador. Chrome real: tests/navegador/ayuda-soporte.js */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const js=leer('js/ayuda.js'),cfg=leer('js/soporte-config.js'),html=leer('index.html'),sw=leer('sw.js'),css=leer('css/guia.css'),guia=leer('js/guia.js'),app=leer('js/app.js');
const A=require('../js/ayuda.js');
const sinCom=s=>s.replace(/\/\*[\s\S]*?\*\//g,'');

test('ayuda.js: sintaxis válida; solo lee (sin Firestore, sin localStorage, sin red, sin eval, sin <style>, sin onclick en línea)',()=>{
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'ayuda.js'}));
 const c=sinCom(js);
 assert.ok(!/\.(set|add|update|delete|commit)\(|fbDb|fbCol|firestore/i.test(c),'no escribe ni lee Firestore');
 assert.ok(!/localStorage|sessionStorage|indexedDB/.test(c));
 assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(c),'no envía nada a ningún sitio');
 assert.ok(!/\beval\s*\(|new Function\(|createElement\(\s*['"]style['"]\s*\)|<style[\s>]|\sonclick=|javascript:/.test(c));
 assert.match(c,/if \(EN_TIENDA\) return;/,'la tienda pública nunca muestra la ayuda');
});

test('soporte-config.js: configurable y VACÍO por defecto (no se inventa ningún correo ni teléfono)',()=>{
 const w={};vm.runInNewContext(cfg,{window:w});
 assert.equal(JSON.stringify(w.VEN_SOPORTE),JSON.stringify({whatsapp:'',correo:'',horario:''}));
 assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}\s*['"]/.test(sinCom(cfg).replace(/^\s*window/m,'window')),'sin correo escrito');
 assert.match(cfg,/docs\/AYUDA-SOPORTE\.md/);
});

test('canalesSoporte: solo canales válidos; vacío o inválido = no se muestra',()=>{
 let c=A.canalesSoporte({},'X');assert.deepEqual([c.whatsapp,c.correo,c.horario],['','','']);
 c=A.canalesSoporte(undefined);assert.equal(c.whatsapp+c.correo,'');
 c=A.canalesSoporte({whatsapp:'abc',correo:'sin-arroba',horario:' '});assert.equal(c.whatsapp+c.correo,'');
 c=A.canalesSoporte({whatsapp:'+507 6000-0000',correo:'soporte@ejemplo.com',horario:'L-V 8 a 5'},'Mi Empresa');
 assert.match(c.whatsapp,/^https:\/\/wa\.me\/50760000000\?text=Hola%2C%20necesito%20ayuda%20con%20VEN%20CRM%20\(empresa%3A%20Mi%20Empresa\)/);
 assert.match(c.correo,/^mailto:soporte@ejemplo\.com\?subject=/);assert.equal(c.correoTxt,'soporte@ejemplo.com');assert.equal(c.horario,'L-V 8 a 5');
 for(const mal of ['a@b','a b@c.com','<x>@c.com','x@c.com"onmouseover=1'])assert.equal(A.canalesSoporte({correo:mal}).correo,'',mal);
 assert.equal(A.canalesSoporte({whatsapp:'123'}).whatsapp,'','muy corto');
});

test('FAQ: preguntas cortas con ids únicos; el texto menciona botones que existen en la app',()=>{
 const ids=A.FAQ.map(f=>f.id);assert.equal(new Set(ids).size,ids.length);assert.ok(A.FAQ.length>=10&&A.FAQ.length<=14);
 for(const f of A.FAQ){assert.ok(f.q.length<80,f.id+' pregunta larga');assert.ok(f.a.length<=330,f.id+' respuesta larga ('+f.a.length+')')}
 const todo=app+leer('js/guia.js')+leer('js/exportar-datos.js');
 for(const b of ['Emitir factura','Agregar','Anular','Copiar enlace','Enviar por WhatsApp','Guardar datos','Crear vendedor','Copia de seguridad','Exportar los datos de mi empresa','Olvidó su contraseña','Consumidor final','Pedidos de la tienda','Datos de la empresa'])assert.ok(todo.includes(b),'la app no tiene «'+b+'»');
 assert.ok(!/aislad|separad[oa]s? por empresa|100 ?% seguro|garantiz/i.test(A.FAQ.map(f=>f.a).join(' ')),'no promete lo que no está garantizado');
});

test('faqPara: el vendedor no ve preguntas de administrador ni de pantallas sin permiso; el administrador ve todas',()=>{
 const adm=A.faqPara(true,()=>true).map(f=>f.id);assert.equal(adm.length,A.FAQ.length);
 const vend=A.faqPara(false,k=>['cli','nueva'].includes(k)).map(f=>f.id);
 assert.deepEqual(vend,['factura','cliente','instalar','clave','vieja','seguro']);
 for(const id of ['anular','datos','vendedor','copia','tienda','producto'])assert.ok(!vend.includes(id),id);
 assert.deepEqual(A.faqPara(false,()=>false).map(f=>f.id),['instalar','clave','vieja','seguro']);
});

test('datosSoporte: texto para copiar sin contraseñas ni datos de clientes',()=>{
 const t=A.datosSoporte({empresa:'genuine',nombre:'Genuine',rol:'Administrador',pantalla:'Facturas',instalada:true,cache:'tj-net-first-42',navegador:'UA',fecha:'hoy'});
 assert.match(t,/^VEN CRM · datos para soporte\nEmpresa: genuine \(Genuine\)\nUsuario: Administrador\nPantalla: Facturas\nApp: instalada · versión tj-net-first-42\nNavegador: UA\nFecha y hora: hoy$/);
 assert.doesNotThrow(()=>A.datosSoporte());
});

test('app.js: «ayuda» abierta a todo usuario con sesión; el resto de permisos de puede() intacto',()=>{
 const m=app.match(/const puede=k=>[^\n]*/)[0];
 assert.match(m,/esAdmin\(\)\|\|\(k==='ayuda'&&!!SES\)\|\|\(!!usr\(\)&&/);
 for(const k of ['config','vend','mapa','empresas'])assert.ok(m.includes("k!=='"+k+"'"));
 assert.match(m,/\(usr\(\)\.panels\|\|\[\]\)\.includes\(k\)/);
});

test('index.html y sw.js: scripts enlazados una vez y en orden, precarga y caché subida; guía con botón «Ayuda y soporte»',()=>{
 for(const f of ['js/soporte-config.js','js/ayuda.js'])assert.equal(html.split(f+'?v=').length-1,1,f);
 const a=html.indexOf('js/app.js?v='),g=html.indexOf('js/guia.js?v=guia-'),c=html.indexOf('js/soporte-config.js'),y=html.indexOf('js/ayuda.js');
 assert.ok(a<g&&g<y&&c<y,'orden: app, guía, config de soporte, ayuda');
 assert.match(html,/js\/ayuda\.js\?v=ayuda-\d+/);assert.match(html,/js\/app\.js\?v=[a-z0-9-]+/);
 assert.match(sw,/'js\/ayuda\.js'/);assert.match(sw,/'js\/soporte-config\.js'/);assert.ok(+/tj-net-first-(\d+)/.exec(sw)[1]>=42);
 assert.match(guia,/guiaAyuda/);assert.match(guia,/Ayuda y soporte/);
 assert.match(css,/\.ay-q\{/);assert.match(css,/\.guia-ay\{/);
 assert.ok(!/<script>[^<]*ayuda/i.test(html));
});
