const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Configuración usa un solo renderizador de tarjetas adicionales',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.config=function\(/g)||[]).length,1);
  for(const id of ['waCard','investCard','lbgCard','xmasCard','bkCard','sesCard','tplCard','recCard','vozCard','cintCard','llamCard']){
    assert.match(app,new RegExp("\\['"+id+"',"));
  }
});

test('Inicio usa un solo renderizador para sus tarjetas adicionales',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.home=function\(/g)||[]).length,1);
  for(const name of ['vdAdmHTML','tdHomeHTML','investHomeHTML','waHomeHTML'])assert.match(app,new RegExp(name+'\\('));
});

test('Chat integra el ajuste de móvil sin encadenar renderizadores',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.chat=function\(/g)||[]).length,1);
  assert.match(app,/function chatFitSoon\(\)/);
  assert.match(app,/chatConv\(\);chatFitSoon\(\)/);
});

test('Catálogo y Check integran permisos y ajuste móvil sin capas extras',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.cat\s*=/g)||[]).length,1);
  assert.equal((app.match(/R\.check=function\(/g)||[]).length,0);
  assert.doesNotMatch(app,/const _rcat=|const _rck=/);
  assert.match(app,/if\(esVend\(\)\)\{const d=\$\('dz'\)/);
  assert.match(app,/checkFitSoon\(\)/);
});

test('Chat consulta solo conversaciones propias y las reglas separan participantes',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/\.where\('members','array-contains',chatMe\(\)\)\.onSnapshot/);
  assert.match(rules,/function chatMember\(data\)/);
  assert.match(rules,/allow read: if chatMember\(resource\.data\);/);
  assert.match(rules,/request\.resource\.data\.members == resource\.data\.members/);
  assert.match(rules,/match \/panel\/loginbg \{\s*allow read, write: if isAdmin\(\);/);
  assert.match(rules,/match \/panel\/data \{/);
});

test('Los datos del panel se separan entre catálogo común y espacio privado por vendedor',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/const publicRef=.*panel_public.*general/);
  assert.match(app,/const privateRef=.*vendedores/);
  assert.match(app,/function migrarPanelPorRoles\(\)/);
  assert.match(app,/clientes_y_agenda_heredados_admin/);
  assert.match(rules,/match \/panel_public\/general \{/);
  assert.match(rules,/match \/vendedores\/\{uid\}\/privado\/\{doc\} \{/);
  assert.match(rules,/match \/panel\/data \{\s*allow read, write: if isAdmin\(\);/);
});

test('La conexión reutiliza Firebase ya inicializado tras una actualización',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/if\(!\(firebase\.apps&&firebase\.apps\.length\)\)firebase\.initializeApp\(firebaseConfig\)/);
  assert.match(app,/function iniciarFirebase\(\)/);
  assert.match(app,/if\(!fbDb\)try\{iniciarFirebase\(\)\}/);
  assert.match(app,/No se pudo verificar su acceso \['\+c\+'\]/);
});

test('Las consultas autenticadas no repiten la búsqueda de rol por cada documento',()=>{
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(rules,/function logged\(\) \{\s*return request\.auth != null;/);
  assert.match(rules,/function isAdmin\(\)/);
  assert.match(rules,/request\.auth\.uid == 'o7bHndKtswSHreFnVwORqBSUKL43'/);
  assert.match(rules,/allow get: if request\.auth != null && request\.auth\.uid == uid;/);
  assert.match(rules,/allow list: if isAdmin\(\);/);
});

test('El inicio de sesión no queda verificando indefinidamente si Firestore no responde',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/get\(\{source:'server'\}\)/);
  assert.match(app,/firestore\/timeout/);
  assert.match(app,/12000/);
});

test('Un error al cargar el panel no invalida una sesión cuyo rol ya fue verificado',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/let d;/);
  assert.match(app,/try\{entrar\(\)\}catch\(e\)/);
  assert.match(app,/Acceso aceptado/);
});

test('El administrador entra por su UID autenticado sin depender de una lectura de rol',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/const ADMIN_UID='o7bHndKtswSHreFnVwORqBSUKL43';/);
  assert.match(app,/if\(u\.uid===ADMIN_UID\)/);
});

test('Administración recibe las facturas de todos los vendedores sin copiarlas a panel/data',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/function escucharVendedores\(\)/);
  assert.match(app,/collection\('vendedores'\)\.doc\(id\)\.collection\('privado'\)\.doc\('data'\)\.onSnapshot/);
  assert.match(app,/fac:\(DB\.fac\|\|\[\]\)\.filter\(f=>!f\._v\)/);
  assert.match(app,/function devolverFacVend\(\)/);
  assert.match(app,/<th>Vendedor<\/th>/);
});

test('Las facturas toman su número de un contador único compartido',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/panel_public'\)\.doc\('contador'\)/);
  assert.match(app,/async function reservarNumeroFactura\(\)/);
  assert.match(app,/function asegurarContador\(\)/);
  assert.match(app,/reservarNumeroFactura\(\)\.then/);
  assert.match(rules,/match \/panel_public\/contador \{/);
  assert.match(rules,/request\.resource\.data\.sig == resource\.data\.sig \+ 1/);
  assert.match(rules,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

test('Vendedores solo ven, descargan y comparten el catálogo',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/\$\{esVend\(\)\?'':`<div class="ckrow">/);
  assert.match(app,/\$\{esVend\(\)\?'':`<select class="catsel"/);
  assert.match(app,/\$\{esVend\(\)\?'':`<button class="btn s" data-h-click="h200"/);
  assert.match(app,/\['pdfCat','shareCat','descTodoImg'\]/);
  assert.doesNotMatch(app,/'expCatBackup','desc','pdfCat'/);
  assert.match(app,/'expCatBackup','repPDF'/);
});

test('Los clientes son una lista compartida, sin duplicados y solo administración elimina',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/panel_public'\)\.doc\('clientes'\)/);
  assert.match(app,/function fusionarClientes\(/);
  assert.match(app,/const dup=clienteDuplicado\(/);
  assert.match(app,/\$\{esAdmin\(\)\?`<button class="btn s" data-h-click="h305"/);
  assert.match(app,/'delC','editC'/);
  assert.match(rules,/match \/panel_public\/clientes \{/);
  assert.match(rules,/allow create, delete: if isAdmin\(\);/);
  assert.match(rules,/request\.resource\.data\.cli\.size\(\) >= resource\.data\.cli\.size\(\)/);
});

test('El formulario de cliente permite registrar la ubicación del negocio',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/id="cu_link"/);
  assert.match(app,/function cliLocGPS\(\)/);
  assert.match(app,/nuevo\.lat=loc\.lat;nuevo\.lng=loc\.lng/);
  assert.match(app,/<th>Ubicación<\/th>/);
  assert.match(app,/__H\.h329=/);
});

test('El formulario de cliente incluye un mapa para marcar el negocio',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/id="cuMap"/);
  assert.match(app,/function cliMapaIniciar\(\)/);
  assert.match(app,/function cliMapSync\(centrar\)/);
  assert.match(app,/;cliMapaIniciar\(\)\},\s*ubi\(\)\{/);
  assert.match(app,/cliLocEstado\(\);cliMapSync\(true\)/);
});

test('El mapa general de clientes es solo para administración y se ve en Inicio',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.mapa=function\(/g)||[]).length,1);
  assert.match(app,/V\.push\(\['mapa','🗺️','Mapa de clientes'\]\)/);
  assert.match(app,/const PANELES=V\.filter\(v=>v\[0\]!=='config'&&v\[0\]!=='vend'&&v\[0\]!=='mapa'\)/);
  assert.match(app,/k!=='vend'&&k!=='mapa'&&/);
  assert.match(app,/mcPintar\('mcHomeMap'\)/);
  assert.match(app,/function mcStats\(\)/);
  for(const h of ['h332','h333','h334'])assert.match(app,new RegExp('__H\\.'+h+'='));
});

