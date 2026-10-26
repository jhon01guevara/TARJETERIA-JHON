/* Aislamiento entre empresas en firestore.rules (2026-10-26). Pruebas de TEXTO (rápidas, sin Java). Las pruebas de comportamiento
   están en tests/herramientas/reglas-emulador/reglas-aislamiento.test.js (emulador de Firestore). Plan: docs/AISLAMIENTO-EMPRESAS.md */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const r=leer('firestore.rules');

test('ya no existe isAdmin() global: hay maestro, rol admin y administrador DE la empresa',()=>{
 assert.ok(!/isAdmin\(\)/.test(r),'ninguna regla usa el antiguo isAdmin() global');
 assert.match(r,/function isMaster\(\) \{\s*return logged\(\) && request\.auth\.uid == 'o7bHndKtswSHreFnVwORqBSUKL43';/);
 assert.match(r,/function esRolAdmin\(\)/);
 assert.match(r,/function adminDe\(eid\) \{\s*return isMaster\(\)\s*\|\| \(esRolAdmin\(\)\s*&& exists\(\/databases\/\$\(database\)\/documents\/empresas\/\$\(eid\)\/miembros\/\$\(request\.auth\.uid\)\)\);/);
 assert.match(r,/function meEn\(eid\) \{\s*return adminDe\(eid\) \? 'admin' : request\.auth\.uid;/);
});
test('el árbol empresas/{eid}/… usa adminDe(eid)/meEn(eid) y nunca el maestro-solo ni me() de la raíz',()=>{
 const i=r.indexOf('match /empresas/{id} {');
 assert.ok(i>0);
 const arbol=r.slice(i);
 assert.ok(!/\bme\(\)/.test(arbol),'dentro de empresas/ se usa meEn(eid), no me()');
 assert.ok(!/isStaff\(\)/.test(arbol));
 assert.match(arbol,/match \/empresas\/\{eid\}\/\{document=\*\*\} \{\s*allow read, write: if adminDe\(eid\);/);
 assert.match(arbol,/match \/empresas\/\{eid\}\/miembros\/\{uid\} \{\s*allow read: if adminDe\(eid\) \|\| \(logged\(\) && request\.auth\.uid == uid\);\s*allow write: if adminDe\(eid\);/);
 assert.match(arbol,/match \/empresas\/\{id\} \{\s*allow read: if esMiembroEmpresa\(id\);\s*allow create, delete: if isMaster\(\);\s*allow update: if adminDe\(id\);/);
 /* el esquema estricto de la tienda pública sigue en ambas rutas */
 assert.equal((r.match(/keys\(\)\.hasOnly\(\['id','name','tel','email','empresa','dir','ref','ts','imp'\]\)/g)||[]).length,2);
 assert.equal((r.match(/keys\(\)\.hasOnly\(\['id','cid','lead','items','total','nota','ref','ts','estado','envio'\]\)/g)||[]).length,2);
 assert.match(arbol,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});
test('la raíz heredada es solo del maestro y roles/dominios no dejan a un admin de empresa dominar otra',()=>{
 for(const b of ['panel/data','panel_public/general','panel_public/clientes','catalogo/{doc}'])
  assert.match(r,new RegExp('match /'+b.replace(/[/{}]/g,'\\$&')+' \\{[\\s\\S]{0,160}isMaster\\(\\)'));
 assert.match(r,/match \/roles\/\{uid\} \{[\s\S]*?allow list: if isMaster\(\);/);
 assert.match(r,/allow create: if isMaster\(\)\s*\|\| \(esRolAdmin\(\) && request\.resource\.data\.rol == 'vend'\);/,'un admin de empresa solo crea vendedores');
 assert.match(r,/allow delete: if isMaster\(\) \|\| \(esRolAdmin\(\) && resource\.data\.rol == 'vend'\);/);
 assert.match(r,/match \/dominios\/\{host\} \{[\s\S]*?adminDe\(resource\.data\.empresaId\)/,'no se pueden secuestrar dominios de otra empresa');
});
test('respaldo de las reglas publicadas antes del aislamiento y pruebas del emulador presentes',()=>{
 const ant=leer('docs/respaldo-reglas-anteriores-2026-10-26.rules');
 assert.match(ant,/function isAdmin\(\)/,'el respaldo es el texto anterior (con isAdmin global)');
 assert.notEqual(ant,r);
 const d=path.join(__dirname,'herramientas','reglas-emulador');
 assert.ok(fs.existsSync(path.join(d,'reglas-aislamiento.test.js')));
 const t=fs.readFileSync(path.join(d,'reglas-aislamiento.test.js'),'utf8');
 assert.ok((t.match(/^test\(/gm)||[]).length>=19,'al menos 19 pruebas de aislamiento');
 assert.ok(fs.existsSync(path.join(__dirname,'..','docs','AISLAMIENTO-EMPRESAS.md')),'informe y plan de publicación');
});
