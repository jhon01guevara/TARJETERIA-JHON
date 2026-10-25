/* Fase 23: pruebas ESTÁTICAS del flujo de pedido de la tienda y de los permisos del panel.
   Las comprobaciones en Chrome real están en tests/navegador/tienda-pedido-fase23.js y tests/navegador/panel-fase23.js (ver docs/GUIA-PRUEBAS-FASE-23.md). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {appTodo,leer}=require('./helpers/app-fuentes');
const RAIZ=path.join(__dirname,'..');
const app=appTodo();
const fn=(nombre,hasta)=>{const i=app.search(new RegExp('(async )?function '+nombre+'\\('));assert.ok(i>=0,'no existe '+nombre);const r=hasta?app.indexOf(hasta,i+10):-1;if(hasta)assert.ok(r>0,'no se halló el final de '+nombre);const sig=hasta?0:app.slice(i+10).search(/\n(async )?function |\nconst [A-Za-z_$]+=|\n\/\/ -{3}/);return app.slice(i,hasta?r:(sig<0?undefined:i+10+sig))};

test('shopSend: sale sin escribir si el carrito está vacío, en vista previa o sin aceptar las políticas (en ese orden, antes de escribir)',()=>{
 const s=fn('shopSend','function shopFab(');
 const iVacio=s.indexOf('if(!L.length)return'),iGuest=s.indexOf('if(SH.guest)'),iPoli=s.indexOf('!chk.checked'),iReg=s.indexOf('shopAskReg()'),iWrite=s.indexOf("fbCol('tienda_pedidos')");
 assert.ok(iVacio>=0&&iGuest>iVacio&&iPoli>iGuest&&iReg>iPoli&&iWrite>iReg,'orden de validaciones: '+[iVacio,iGuest,iPoli,iReg,iWrite]);
 assert.match(s,/Debe marcar la casilla aceptando los Términos y la Política de Privacidad para continuar\./);
 assert.match(s,/shopAntiBot\(\)/,'revisa el antibots antes de escribir');
 assert.ok(s.indexOf('shopAntiBot()')<iWrite);
});
test('shopSend: el pedido se guarda en tienda_pedidos con solo los campos que admiten las reglas de Firestore',()=>{
 const s=fn('shopSend','function shopFab(');
 const p=s.match(/const p=\{id,cid:c\.id,lead:\{[^}]*\},items:[^;]*;/);assert.ok(p,'no se halló la construcción del pedido');
 const claves=[...p[0].matchAll(/(?<=^|[,{])\s*(id|cid|lead|items|total|nota|ref|ts|estado)\s*[:,]/g)].map(m=>m[1]);
 const reglas=fs.readFileSync(path.join(RAIZ,'firestore.rules'),'utf8');
 const m=reglas.match(/match \/tienda_pedidos\/\{id\} \{\s*allow create: if request\.resource\.data\.keys\(\)\.hasOnly\(\[([^\]]*)\]\)/);assert.ok(m,'regla de tienda_pedidos');
 const permitidas=[...m[1].matchAll(/'(\w+)'/g)].map(x=>x[1]);
 for(const k of ['id','cid','lead','items','total','nota','ref','ts','estado'])assert.ok(claves.includes(k),'el pedido no incluye '+k);
 for(const k of claves)assert.ok(permitidas.includes(k),k+' no está permitido por las reglas');
 assert.match(p[0],/estado:'nuevo'/);
 assert.match(p[0],/total:L\.reduce\(\(s,l\)=>s\+l\.q\*l\.p,0\)/,'el total es la suma de cantidad × precio');
 assert.match(p[0],/nota:notaConEvidencia\.slice\(0,500\)/,'la nota se recorta a 500 (límite de las reglas)');
 assert.match(s,/\[🛡️ Aceptó Términos y Privacidad Ley 81: /,'constancia de aceptación en la nota');
 assert.match(s,/ver:'1\.0 - Ley 81 Panamá'/);
});
test('el pedido NO se envía por WhatsApp: shopSend no usa wa.me ni window.open',()=>{
 const s=fn('shopSend','function shopFab(');assert.doesNotMatch(s,/wa\.me|window\.open/);
});
test('shopRegSend: validaciones del registro (políticas, nombre, teléfono, correo, antibots) antes de escribir',()=>{
 const s=fn('shopRegSend');
 const orden=['Debe aceptar los Términos y la Política de Privacidad para registrarse.',"m('Escriba su nombre.')","m('Escriba un teléfono válido.')","m('Escriba un correo válido.')",'shopAntiBot()','shopRegFinish(l)'].map(t=>s.indexOf(t));
 assert.ok(orden.every(i=>i>=0),'faltan validaciones: '+orden);
 assert.deepEqual(orden,[...orden].sort((a,b)=>a-b),'las validaciones van antes de guardar y en este orden');
 assert.match(s,/n\.length<2/);assert.match(s,/t\.replace\(\/\\D\/g,''\)\.length<7/);assert.match(s,/\^\\S\+@\\S\+\\\.\\S\+\$/);
});
test('el carrito: límites de cantidad (1 a 9999) y precios «a consultar»',()=>{
 const s=fn('shopPickSet');assert.match(s,/Math\.min\(9999,n\)/);assert.match(s,/!\(n>=1\)/);
 assert.match(fn('shopPickUpd'),/\+i\.price>0\?\$\$\(q\*i\.price\):'Consultar'/);
 assert.match(fn('shopCart'),/\$\{t>0\?\$\$\(t\):'Consultar'\}/);
 assert.match(fn('shopCart'),/id="sh_chk_poli"/);assert.match(fn('shopCart'),/id="sh_sb"/);
});
test('puede(): solo el administrador entra a config, vend, mapa y empresas; el resto depende de los permisos del usuario',()=>{
 const m=app.match(/const puede=k=>[^\n]*/);assert.ok(m);
 assert.match(m[0],/esAdmin\(\)\|\|/);
 for(const k of ['config','vend','mapa','empresas'])assert.ok(m[0].includes("k!=='"+k+"'"),'puede() deja pasar '+k+' a no administradores');
 assert.match(m[0],/\(usr\(\)\.panels\|\|\[\]\)\.includes\(k\)/);
 assert.match(app,/const esAdmin=\(\)=>!!SES&&SES\.id==='admin'/);
});
test('una cuenta sin documento de acceso se desconecta con el mensaje «Su cuenta no tiene acceso»',()=>{
 assert.match(app,/if\(!d\.exists\)\{_note='Su cuenta no tiene acceso\. Pídale al administrador que la active\.';firebase\.auth\(\)\.signOut\(\);return\}/);
});
test('los scripts de Chrome real de la Fase 23 se niegan a correr contra producción y no guardan contraseñas ni usan kwrap',()=>{
 for(const f of ['tests/navegador/tienda-pedido-fase23.js','tests/navegador/panel-fase23.js','tests/navegador/copia-prueba.js']){
  const s=leer(f);
  assert.ok(fs.existsSync(path.join(RAIZ,f)),f);
  if(!/copia-prueba/.test(f))assert.match(s,/tarjeteria-jhon\\\.\(web\|firebaseapp\)/,f+' debe rechazar producción');
  assert.doesNotMatch(s,/PRUEBA_PASSWORD\s*=\s*['"]/,f);
  assert.doesNotMatch(s.replace(/«[^»]*»|\/\*[\s\S]*?\*\//g,''),/\bkwrap\b/,f+' no debe usar la clase kwrap');
 }
 assert.match(leer('tests/navegador/panel-fase23.js'),/process\.env\.PRUEBA_PASSWORD/);
 const sp=leer('tests/navegador/tienda-pedido-fase23.js');
 assert.match(sp,/\/Write\\\/channel\//,'bloquea las escrituras de Firestore a nivel de red');
 assert.match(sp,/api\\\.emailjs\\\.com/,'bloquea EmailJS');
 assert.match(sp,/fbDb=proxy/,'las escrituras van a un doble');
});
test('copia-prueba.js: se niega a dejar la copia apuntando a producción y no escribe dentro del repo',()=>{
 const s=leer('tests/navegador/copia-prueba.js');
 assert.match(s,/projectId:"tarjeteria-jhon-prueba"/);assert.match(s,/aún apunta a producción/);assert.match(s,/El destino no puede estar dentro del repo/);
});
