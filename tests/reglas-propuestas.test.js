/* Pruebas de las reglas PROPUESTAS (firestore.rules.propuesta). No sustituyen a las
   que verifican firestore.rules (producción); comprueban el comportamiento nuevo.
   Las reglas propuestas se probaron además con el emulador de Firestore (26 pruebas)
   y en el proyecto tarjeteria-jhon-prueba; ver docs/DESPLIEGUE-REGLAS.md. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('Producción (firestore.rules) NO ha sido reemplazada por la propuesta',()=>{
 assert.notEqual(leer('firestore.rules'),leer('firestore.rules.propuesta'),
  'firestore.rules es producción: la propuesta vive en firestore.rules.propuesta');
 assert.match(leer('firestore.rules'),/match \/empresas\/\{eid\}\/\{document=\*\*\} \{\s*allow read, write: if esEmpresa\(eid\);/,
  'producción conserva el comodín actual hasta que el usuario decida desplegar');
});

test('Propuesta: chat (equivalente a «Chat consulta solo conversaciones propias»)',()=>{
 const app=leer('js/app.js'),r=leer('firestore.rules.propuesta');
 assert.match(app,/\.where\('members','array-contains',chatMe\(\)\)\.onSnapshot/);
 assert.match(r,/function chatMember\(data\)/);
 /* La lectura de chats exige ser admin o participante (hasAny sobre resource.data). */
 assert.match(r,/match \/chats\/\{chat\} \{[\s\S]{0,700}allow read: if isAdmin\(\) \|\| \(logged\(\) && resource\.data\.members\.hasAny\(\[me\(\)\]\)\);/);
 assert.match(r,/request\.resource\.data\.members == resource\.data\.members/,'los participantes no se pueden alterar');
 assert.match(r,/match \/panel\/loginbg \{\s*allow read, write: if isAdmin\(\);/);
 assert.match(r,/match \/panel\/data \{/);
});

test('Propuesta: administración LEE todo lo que la simulación enumera',()=>{
 const r=leer('firestore.rules.propuesta');
 assert.match(r,/match \/vendedores\/\{uid\} \{\s*allow read: if isAdmin\(\);/);
 assert.match(r,/match \/chats\/\{chat\} \{[\s\S]{0,700}allow read: if isAdmin\(\) \|\|/,'chats completos para administración');
 assert.match(r,/match \/msgs\/\{msg\} \{\s*allow read: if isAdmin\(\)/,'msgs de cualquier chat para administración');
 assert.match(r,/match \/llamadas\/\{id\} \{[\s\S]{0,420}allow read, update: if isAdmin\(\)/,'llamadas completas para administración');
});

test('Propuesta: el árbol empresas/{eid} es solo de administración, salvo reglas específicas',()=>{
 const r=leer('firestore.rules.propuesta');
 assert.match(r,/function esMiembroEmpresa\(eid\)/);
 assert.match(r,/exists\(\/databases\/\$\(database\)\/documents\/empresas\/\$\(eid\)\/miembros\/\$\(request\.auth\.uid\)\)/);
 /* El comodín ya NO admite a los miembros: solo isAdmin(). */
 assert.match(r,/match \/empresas\/\{eid\}\/\{document=\*\*\} \{\s*allow read, write: if isAdmin\(\);/);
 assert.ok(!/match \/empresas\/\{eid\}\/\{document=\*\*\} \{\s*allow read, write: if esEmpresa/.test(r),'sin comodín de miembros');
 /* miembros: solo admin escribe; cada uno lee el suyo. */
 assert.match(r,/match \/empresas\/\{eid\}\/miembros\/\{uid\} \{\s*allow read: if isAdmin\(\) \|\| \(logged\(\) && request\.auth\.uid == uid\);\s*allow write: if isAdmin\(\);/);
 assert.match(r,/match \/empresas\/\{eid\}\/panel_public\/contador \{[\s\S]{0,500}request\.resource\.data\.sig == resource\.data\.sig \+ 1/);
 assert.match(r,/match \/empresas\/\{eid\}\/panel_public\/clientes \{[\s\S]{0,420}cli\.size\(\) >= resource\.data\.cli\.size\(\)/);
 assert.match(r,/match \/empresas\/\{eid\}\/vendedores\/\{uid\}\/privado\/\{doc\} \{[\s\S]{0,220}request\.auth\.uid == uid/);
 assert.match(r,/match \/empresas\/\{eid\}\/tienda_items\/\{document=\*\*\} \{\s*allow read: if true;/,'tienda pública por empresa');
 assert.equal((r.match(/keys\(\)\.hasOnly\(\['id','name','tel','email','empresa','dir','ref','ts','imp'\]\)/g)||[]).length,2,'esquema de leads en raíz y empresa');
 assert.equal((r.match(/keys\(\)\.hasOnly\(\['id','cid','lead','items','total','nota','ref','ts','estado'\]\)/g)||[]).length,2,'esquema de pedidos en raíz y empresa');
 assert.match(r,/match \/empresas\/\{eid\}\/chats\/\{chat\} \{[\s\S]{0,700}allow read: if isAdmin\(\) \|\|/);
 assert.match(r,/match \/empresas\/\{eid\}\/llamadas\/\{id\} \{[\s\S]{0,420}allow read, update: if isAdmin\(\)/);
 assert.match(r,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

test('Propuesta: metadatos de empresa y dominios',()=>{
 const r=leer('firestore.rules.propuesta');
 /* Antes: leer/escribir solo admin. Ahora los miembros leen SU empresa; escribir sigue siendo del admin. */
 assert.match(r,/match \/empresas\/\{id\} \{\s*allow read: if esMiembroEmpresa\(id\);\s*allow write: if isAdmin\(\);/);
 assert.match(r,/match \/dominios\/\{host\} \{\s*allow read: if true;\s*allow write: if isAdmin\(\);/);
});

test('Propuesta: los límites de tamaño de la tienda cuadran con los inputs de la app',()=>{
 const r=leer('firestore.rules.propuesta'),app=leer('js/app.js');
 assert.match(r,/data\.empresa is string && request\.resource\.data\.empresa\.size\(\) <= 120/);
 assert.match(r,/data\.dir is string && request\.resource\.data\.dir\.size\(\) <= 200/);
 assert.match(app,/<input id="sh_c" autocomplete="organization" maxlength="120">/);
 assert.match(app,/<input id="sh_d" autocomplete="street-address" maxlength="200">/);
});

test('Fondo de login: lbgPull falla en silencio si no hay permiso (la propuesta lo deja solo para admin)',()=>{
 const app=leer('js/app.js');
 const i=app.indexOf('async function lbgPull(');
 const f=app.slice(i,i+1400);
 assert.match(f,/catch\(e\)\{LBG\.pulled=0\}finally\{LBG\.pulling=0\}/,'sin alert ni relanzar el error');
 assert.ok(!/alert\(/.test(f.slice(0,f.indexOf('lbgPullSoon'))));
});

test('vendDel borra roles/{uid} y también miembros/{uid} (MULTIEMP) sin romper si falla',()=>{
 const app=leer('js/app.js');
 const i=app.indexOf('async function vendDel(');
 const f=app.slice(i,app.indexOf('\n',i));
 assert.match(f,/collection\('roles'\)\.doc\(id\)\.delete\(\)\}catch\(e\)\{window\._tjw&&_tjw\(e\)\}/);
 assert.match(f,/try\{if\(typeof MULTIEMP!=='undefined'&&MULTIEMP&&typeof TJEmpresa!=='undefined'&&TJEmpresa\.empActiva\)await fbDb\.collection\('empresas'\)\.doc\(TJEmpresa\.empActiva\(\)\)\.collection\('miembros'\)\.doc\(id\)\.delete\(\)\}catch\(e\)\{window\._tjw&&_tjw\(e\)\}/);
 assert.match(f,/DB\.cfg\.users=usuarios\(\)\.filter\(x=>x\.id!==id\);save\(\);R\.vend\(\)\}$/,'el resto del flujo no cambia');
});
