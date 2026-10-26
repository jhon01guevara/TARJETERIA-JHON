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

/* ---- Hallazgo 2: botón opcional «Enviar también por WhatsApp» tras «¡Pedido enviado!» ---- */
const vm=require('node:vm');
const extraer=(nombre)=>{const i=app.indexOf('function '+nombre+'(');assert.ok(i>=0,nombre);const f=app.indexOf('\nfunction ',i+10),g=app.indexOf('\nasync function ',i+10);return app.slice(i,Math.min(...[f,g].filter(x=>x>0)))};
const redesSrc=leer('js/redes.js'),contSrc=redesSrc.slice(redesSrc.indexOf('function contLimpio('),redesSrc.indexOf('const redesLista'));
const mundo=(contacto)=>{const ctx={SH:{contacto},$$:n=>'$'+Number(n).toFixed(2),nombreNegocio:()=>'Tarjetería Jhon'};vm.createContext(ctx);vm.runInContext(contSrc+'\n'+extraer('shopPedidoWAurl')+'\n'+extraer('shopPedidoWABoton'),ctx);return ctx};
const ped=(o={})=>Object.assign({id:'abc123def456',lead:{name:'Ana Pérez',tel:'6123-4567',email:'ana@example.com',dir:'Calle 50',empresa:'ACME'},items:[{id:'a',n:'Tarjeta "Graduación" & más',p:2.5,q:12},{id:'b',n:'Sobre',p:1,q:3}],total:33,nota:'Nota secreta [🛡️ Aceptó ...]',envio:{rec:'Juan',dir:'Calle X'}},o);
const texto=u=>decodeURIComponent(new URL(u).searchParams.get('text'));
test('Fase 24 · WhatsApp del pedido: wa.me con el mismo número que #k_wa y el resumen en español (número de pedido, artículos con cantidad, total, nombre)',()=>{
 const w=mundo({wa:'6330-3495'}),u=w.shopPedidoWAurl(ped(),{name:'Ana Pérez'});
 assert.match(u,/^https:\/\/wa\.me\/50763303495\?text=/,'mismo número y normalización que #k_wa (contLimpio)');
 assert.equal(texto(u),['Hola, acabo de hacer un pedido en Tarjetería Jhon.','Pedido N° DEF456','• 12 × Tarjeta "Graduación" & más','• 3 × Sobre','Total: $33.00','Nombre: Ana Pérez'].join('\n'));
 assert.doesNotMatch(u,/[\s"<>]/,'URL totalmente codificada (encodeURIComponent)');
});
test('Fase 24 · WhatsApp del pedido: sin datos sensibles extra (teléfono, correo, dirección, nota, envío, empresa)',()=>{
 const t=texto(mundo({wa:'50763303495'}).shopPedidoWAurl(ped(),{name:'Ana Pérez',tel:'6123-4567',email:'ana@example.com'}));
 for(const x of ['6123','ana@example','Calle','Nota secreta','ACME','Juan','Aceptó'])assert.ok(!t.includes(x),'no debe incluir '+x);
});
test('Fase 24 · WhatsApp del pedido: total «a consultar» (precio 0), total parcial (mezcla) y límite de líneas',()=>{
 const w=mundo({wa:'50763303495'});
 assert.match(texto(w.shopPedidoWAurl(ped({total:0,items:[{id:'a',n:'X',p:0,q:2}]}),{name:'Ana'})),/\nTotal: a consultar\n/);
 assert.match(texto(w.shopPedidoWAurl(ped({total:5,items:[{id:'a',n:'X',p:0,q:2},{id:'b',n:'Y',p:5,q:1}]}),{name:'Ana'})),/\nTotal parcial: \$5\.00 \(hay artículos a consultar\)\n/);
 const muchos=Array.from({length:40},(_,k)=>({id:'i'+k,n:'Producto '+k,p:1,q:1})),t=texto(w.shopPedidoWAurl(ped({items:muchos,total:40}),{name:'Ana'}));
 assert.equal(t.split('\n').filter(l=>l.startsWith('• ')).length,15);assert.match(t,/… y 25 más/);
});
test('Fase 24 · WhatsApp del pedido: sin número configurado (o inválido) no hay botón; con número, enlace seguro en pestaña nueva',()=>{
 for(const c of [null,{},{wa:''},{wa:'abc'},{wa:'123'}])assert.equal(mundo(c).shopPedidoWABoton(ped(),{name:'Ana'}),'','sin botón con '+JSON.stringify(c));
 const b=mundo({wa:'6330-3495'}).shopPedidoWABoton(ped(),{name:'Ana'});
 assert.match(b,/^<a class="sbtn g" id="k_pwa" href="https:\/\/wa\.me\/50763303495\?text=[^"]+" target="_blank" rel="noopener noreferrer"/);
 assert.match(b,/Enviar también por WhatsApp/);assert.match(b,/Opcional: su pedido ya quedó guardado/);
});
test('Fase 24 · WhatsApp del pedido: es un añadido a «¡Pedido enviado!»; el guardado en Firestore y el flujo no cambian y shopSend sigue sin usar wa.me ni window.open',()=>{
 const s=fn('shopSend','function shopFab(');
 assert.doesNotMatch(s,/wa\.me|window\.open/);
 assert.match(s,/<button class="sbtn g" data-h-click="h32" style="margin-bottom:8px">🧾 Mis pedidos<\/button>'\+shopPedidoWABoton\(p,c\)\+'<button class="sbtn g" data-h-click="h31">Seguir viendo el catálogo<\/button>/);
 assert.ok(s.indexOf("fbCol('tienda_pedidos').doc(id).set(p)")<s.indexOf('shopPedidoWABoton(p,c)'),'el botón sale después de guardar el pedido');
 assert.match(s,/data-h-click="h34"[^]*Ver comprobante[^]*data-h-click="h33"[^]*Descargar PDF[^]*data-h-click="h32"/);
 assert.match(app,/id="k_wa"/);assert.match(app,/shopRedes[^]*w\.href='https:\/\/wa\.me\/'\+num\+'\?text='\+encodeURIComponent\('Hola, vi su catálogo virtual de '\+nombreNegocio\(\)\+' y quisiera más información\.'\)/,'#k_wa no cambió');
});
test('Fase 24 · caché del service worker tj-net-first-22 o posterior y ?v= de app.js subido (WhatsApp)',()=>{
 assert.match(leer('sw.js'),/const V='tj-net-first-(2[2-9]|[3-9]\d)'/);
 assert.match(leer('index.html'),/js\/app\.js\?v=modulos-fase-24[b-z]/);
});

/* ---- Respaldo del transportista (la escritura con `envio` es rechazada y se reintenta sin él) ---- */
test('Fase 24 · respaldo del transportista: la nota nunca supera 500 (límite de las reglas), el transportista va primero y la constancia Ley 81 al final',()=>{
 const ctx={};vm.createContext(ctx);vm.runInContext(extraer('fleNotaRespaldo'),ctx);
 const ev='[🛡️ Aceptó Términos y Privacidad Ley 81: 25/10/2026 3:14 p. m.]',txt='🚚 Envío por: Transportes Ferguson\nRecibe: Ana Pérez\nCel. recibe: 6000-0000\nDirección: Calle 50';
 for(const nota of ['',ev,'Entregar por la tarde · '+ev,'x'.repeat(400)+' · '+ev,'x'.repeat(480)+' · '+ev]){
  const r=ctx.fleNotaRespaldo(nota,txt);
  assert.ok(r.length<=500,'≤ 500: '+r.length);assert.ok(r.startsWith('🚚 Envío por: Transportes Ferguson'));
  if(nota.includes(ev))assert.ok(r.endsWith(ev),'la constancia queda al final');
 }
 assert.equal(ctx.fleNotaRespaldo('Entregar por la tarde · '+ev,txt),txt+'\nEntregar por la tarde\n'+ev);
 assert.equal(ctx.fleNotaRespaldo('',txt),txt);
 assert.ok(ctx.fleNotaRespaldo('y',txt.repeat(10)+'\n').length<=500,'un texto de transportista enorme también se recorta');
 assert.match(fn('shopSend','function shopFab('),/p\.nota=fleNotaRespaldo\(p\.nota,fleNotaTxt\(fl,ed\)\);/);
 assert.doesNotMatch(app,/\.slice\(0,1200\)/,'ya no se recorta a 1200 (más que las reglas)');
});
test('Fase 24 · caché del service worker tj-net-first-23 o posterior y ?v= de app.js subido (respaldo)',()=>{
 assert.match(leer('sw.js'),/const V='tj-net-first-(2[3-9]|[3-9]\d)'/);
 assert.match(leer('index.html'),/js\/app\.js\?v=modulos-fase-24[c-z]/);
});
