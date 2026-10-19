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
  assert.match(app,/No se pudo verificar su acceso \['\+c\+'\]/);
});
