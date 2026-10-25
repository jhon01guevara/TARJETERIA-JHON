/* Fase 24: pruebas ESTÁTICAS de los arreglos del flujo de pedido de la tienda (registro, nota, políticas).
   Las comprobaciones en Chrome real están en tests/navegador/tienda-pedido-fase23.js (ver docs/GUIA-PRUEBAS-FASE-24.md). */
const test=require('node:test');
const assert=require('node:assert/strict');
const {appTodo,leer}=require('./helpers/app-fuentes');
const app=appTodo();
const fn=(nombre,hasta)=>{const i=app.search(new RegExp('(async )?function '+nombre+'\\('));assert.ok(i>=0,'no existe '+nombre);const f=hasta?app.indexOf(hasta,i+10):app.indexOf('\nfunction ',i+10);assert.ok(f>0);return app.slice(i,f)};

test('Fase 24 · «Volver al pedido» conserva la nota: shopCart la recupera de SH.pendNote cuando no hay campo de nota en pantalla',()=>{
 const s=fn('shopCart');
 assert.match(s,/nt=\$\('sh_nt'\)\?\$\('sh_nt'\)\.value:\(SH\.pendNote\|\|''\)/);
 assert.match(fn('shopSend','function shopFab('),/SH\.pendNote=\(\(\$\('sh_nt'\)\|\|\{\}\)\.value\|\|''\);/,'shopSend guarda la nota antes de pasar al registro');
 assert.match(fn('shopSend','function shopFab('),/const notaBase=\(\$\('sh_nt'\)\?\$\('sh_nt'\)\.value:\(SH\.pendNote\|\|''\)\)\.trim\(\);/,'una nota borrada por el cliente no resucita');
});
test('Fase 24 · la aceptación de políticas se conserva tras el registro, sin saltarse la exigencia: shopSend sigue exigiendo la casilla marcada',()=>{
 const c=fn('shopCart'),send=fn('shopSend','function shopFab('),reg=fn('shopRegSend'),fin=fn('shopRegFinish');
 assert.match(c,/poliPrev=\$\('sh_chk_poli'\)\?\$\('sh_chk_poli'\)\.checked:!!SH\.poliOk/);
 assert.match(c,/id="sh_chk_poli"\$\{poliPrev\?' checked':''\}/);
 assert.match(send,/SH\.poliOk=!!\(chk&&chk\.checked\)/,'solo cuenta si la casilla del pedido estaba marcada');
 /* la casilla del registro es obligatoria y se revisa ANTES de marcar poliOk */
 assert.ok(reg.indexOf('Debe aceptar los Términos y la Política de Privacidad para registrarse.')<reg.indexOf('SH.poliOk=true'));
 assert.ok(reg.indexOf('SH.poliOk=true')<reg.indexOf('shopRegFinish(l)'));
 assert.match(fin,/SH\.poliOk=false/,'la aceptación se consume al volver al pedido');
 assert.match(app,/function shopClose\(pop\)\{SH\.poliOk=false;/,'cerrar la hoja descarta la aceptación pendiente');
 /* la exigencia legal sigue intacta: se revisa chk.checked antes de escribir el pedido */
 assert.ok(send.indexOf('!chk.checked')>=0&&send.indexOf('!chk.checked')<send.indexOf("fbCol('tienda_pedidos')"));
 assert.match(send,/\[🛡️ Aceptó Términos y Privacidad Ley 81: /,'la constancia se sigue registrando en el pedido');
});
test('Fase 24 · caché del service worker tj-net-first-21 o posterior y ?v= de app.js subido',()=>{
 assert.match(leer('sw.js'),/const V='tj-net-first-(2[1-9]|[3-9]\d)'/);
 assert.match(leer('index.html'),/js\/app\.js\?v=modulos-fase-2[4-9][a-z]/);
});
