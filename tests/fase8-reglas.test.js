const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('Las reglas Fase 8 habilitan el árbol por empresa (publicadas el 2026-10-24: comodín solo para administración)',()=>{
 const r=leer('firestore.rules');
 assert.match(r,/function esMiembroEmpresa\(eid\)/);
 assert.match(r,/exists\(\/databases\/\$\(database\)\/documents\/empresas\/\$\(eid\)\/miembros\/\$\(request\.auth\.uid\)\)/);
 assert.match(r,/match \/empresas\/\{eid\}\/\{document=\*\*\} \{\s*allow read, write: if isAdmin\(\);/);
 /* Espejo de las reglas de hoy bajo empresas/{eid}/… */
 assert.match(r,/match \/empresas\/\{eid\}\/panel_public\/contador \{[\s\S]{0,500}request\.resource\.data\.sig == resource\.data\.sig \+ 1/);
 assert.match(r,/match \/empresas\/\{eid\}\/panel_public\/clientes \{[\s\S]{0,420}cli\.size\(\) >= resource\.data\.cli\.size\(\)/);
 assert.match(r,/match \/empresas\/\{eid\}\/vendedores\/\{uid\}\/privado\/\{doc\} \{[\s\S]{0,220}request\.auth\.uid == uid/);
 assert.match(r,/match \/empresas\/\{eid\}\/tienda_items\/\{document=\*\*\} \{\s*allow read: if true;/,'tienda pública por empresa');
 /* Esquema estricto de leads/pedidos presente en AMBAS rutas (raíz y empresa). */
 const nLeads=(r.match(/keys\(\)\.hasOnly\(\['id','name','tel','email','empresa','dir','ref','ts','imp'\]\)/g)||[]).length;
 assert.equal(nLeads,2,'esquema de leads en raíz y empresa');
 const nPeds=(r.match(/keys\(\)\.hasOnly\(\['id','cid','lead','items','total','nota','ref','ts','estado','envio'\]\)/g)||[]).length;
 assert.equal(nPeds,2,'esquema de pedidos en raíz y empresa');
 assert.match(r,/match \/empresas\/\{eid\}\/chats\/\{chat\} \{[\s\S]{0,700}allow read: if isAdmin\(\) \|\|/);
 assert.match(r,/match \/empresas\/\{eid\}\/llamadas\/\{id\} \{[\s\S]{0,420}allow read, update: if isAdmin\(\)/);
 /* El catch-all final sigue denegando lo no listado. */
 assert.match(r,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

test('La herramienta tiene el modo REAL protegido para la activación (Fase 7)',()=>{
 const h=leer('migraciones/migrar-pruebas.html');
 assert.match(h,/get\('modo'\)==='real'/,'solo se activa con ?modo=real');
 assert.match(h,/id="realCard" style="display:none/,'la sección real queda oculta por defecto');
 assert.match(h,/value\.trim\(\)==='COPIAR'/,'exige escribir COPIAR para habilitar');
 assert.match(h,/okSes&&conf/,'habilitación conjunta: sesión admin + snapshot + confirmación');
 assert.match(h,/MIG_EJECUTOR\.copiar\(fbDb,MP\.plan/,'la copia real usa el ejecutor sobre producción');
 assert.match(h,/MIG_EJECUTOR\.borrar\(fbDb,'tarjeteria-jhon'\)/,'borrado de la copia real (reversibilidad)');
 /* El ejecutor en sí sigue sin referenciar la base de producción. */
 const e=leer('migraciones/migracion-ejecutor.js');
 assert.ok(!e.includes('fbDb'),'el ejecutor recibe la bd por parámetro; nunca la de producción');
 /* Reconexión al proyecto de pruebas debe esperar el borrado de la app anterior. */
 assert.match(h,/await prev\.delete\(\)/,'la reconexión espera el borrado (evita "client has already been terminated")');
});
