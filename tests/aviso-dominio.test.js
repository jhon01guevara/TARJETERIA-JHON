/* Aviso «VEN CRM tiene dirección nueva» (js/aviso-dominio.js): comprobaciones sin navegador. La prueba en Chrome real: tests/navegador/aviso-dominio.js */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const js=leer('js/aviso-dominio.js'),css=leer('css/aviso-dominio.css'),html=leer('index.html'),sw=leer('sw.js');
const A=require('../js/aviso-dominio.js');
const sinCom=s=>s.replace(/\/\*[\s\S]*?\*\//g,'');

test('aviso-dominio.js: sintaxis válida, sin eval, sin <style>, sin red ni manejadores en línea (CSP)',()=>{
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'aviso-dominio.js'}));
 const c=sinCom(js);
 assert.ok(!/\beval\s*\(|new Function\(|createElement\(\s*['"]style['"]\s*\)|<style[\s>]|innerHTML|\sonclick=|javascript:/.test(c));
 assert.ok(!/fetch\(|XMLHttpRequest|importScripts|serviceWorker|firebase|fbDb|Firestore/i.test(c),'no usa red, service worker ni Firebase');
});

test('debeMostrar: solo en *.github.io; nunca en vencrm.com, localhost, pruebas ni tienda pública',()=>{
 const d=A.debeMostrar;
 assert.equal(d('jhon01guevara.github.io','',null,1),true);
 assert.equal(d('jhon01guevara.github.io','?emp=genuine',null,1),true);
 assert.equal(d('JHON01GUEVARA.GITHUB.IO','',null,1),true);
 for(const h of ['vencrm.com','www.vencrm.com','localhost','127.0.0.1','tarjeteria-jhon-prueba.web.app','tarjeteria-jhon.web.app','github.io.evil.com','xgithub.io',''])assert.equal(d(h,'',null,1),false,h);
 assert.equal(d('jhon01guevara.github.io','?tienda=1',null,1),false);
 assert.equal(d('jhon01guevara.github.io','?emp=x&tienda=1&v=admin',null,1),false);
 assert.equal(d('jhon01guevara.github.io','?tienda',null,1),false);
});

test('debeMostrar: «Ahora no» oculta 14 días y vuelve; «No mostrar más» es para siempre',()=>{
 const h='jhon01guevara.github.io',t=1700000000000;
 assert.equal(A.DIAS_POSPONER,14);
 assert.equal(A.debeMostrar(h,'',{hasta:t+14*86400000},t),false);
 assert.equal(A.debeMostrar(h,'',{hasta:t+14*86400000},t+13*86400000),false);
 assert.equal(A.debeMostrar(h,'',{hasta:t+14*86400000},t+15*86400000),true);
 assert.equal(A.debeMostrar(h,'',{nunca:1},t+999*86400000),false);
 assert.equal(A.debeMostrar(h,'',{},t),true);
});

test('plataforma y pasos: Android, iPhone y computadora, 4 pasos cada uno, todos apuntan a vencrm.com',()=>{
 assert.equal(A.plataforma('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120'),'android');
 assert.equal(A.plataforma('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari'),'ios');
 assert.equal(A.plataforma('Mozilla/5.0 (X11; Linux x86_64) Chrome/120'),'pc');
 for(const k of ['android','ios','pc']){assert.equal(A.PASOS[k].length,4,k);assert.ok(A.PASOS[k].some(s=>/vencrm\.com/.test(s)),k)}
 assert.equal(A.DESTINO,'https://vencrm.com/');
});

test('el aviso no inventa datos: el texto cita vencrm.com y no promete lo que no hay (sin correo ni teléfono)',()=>{
 assert.match(js,/VEN CRM tiene dirección nueva: vencrm\.com/);
 assert.match(js,/Sus datos están a salvo/);
 assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}|wa\.me|tel:|\+507/i.test(sinCom(js)));
});

test('index.html y sw.js: el script y el CSS están enlazados una sola vez, el script al final y en la precarga; caché subida',()=>{
 assert.equal(html.split('js/aviso-dominio.js?v=').length-1,1);
 assert.match(html,/<script src="js\/aviso-dominio\.js\?v=aviso-dominio-\d+"><\/script><\/body>/);
 assert.ok(html.indexOf('js/aviso-dominio.js')>html.indexOf('js/app.js?v='),'se carga después de app.js');
 assert.match(html,/<link rel="stylesheet" href="css\/aviso-dominio\.css\?v=\d+">/);
 assert.match(sw,/'js\/aviso-dominio\.js'/);assert.match(sw,/'css\/aviso-dominio\.css'/);
 assert.ok(+/tj-net-first-(\d+)/.exec(sw)[1]>=40);
 assert.ok(!/<script>[^<]*aviso/i.test(html),'sin script en línea');
});

test('css: usa variables del tema, queda por encima del panel y debajo de la tienda; móvil sin desbordes',()=>{
 assert.match(css,/var\(--az/);assert.match(css,/var\(--card/);
 const z=+/z-index:(\d+)/.exec(css)[1];assert.ok(z>200&&z<3000,'sobre el login (200) y bajo la tienda (3000)');
 assert.match(css,/@media \(max-width:760px\)/);
});
