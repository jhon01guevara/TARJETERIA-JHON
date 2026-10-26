/* La suite de humo (tests/navegador/humo.js) NUNCA debe poder tocar producción: se comprueban sus bloqueos sin abrir el navegador. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'navegador','humo.js'),'utf8');
const rx=n=>{const m=new RegExp('const '+n+'=(\\/.*\\/i);').exec(src);assert.ok(m,'no se encontró '+n);return eval(m[1])};
test('la regla PROD bloquea producción y deja pasar el proyecto de prueba',()=>{
 const PROD=rx('PROD');
 for(const u of [
  'https://firestore.googleapis.com/v1/projects/tarjeteria-jhon/databases/(default)/documents/empresas/x',
  'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=projects%2Ftarjeteria-jhon%2Fdatabases%2F(default)',
  'https://tarjeteria-jhon.web.app/','https://tarjeteria-jhon.firebaseapp.com/__/auth/handler','https://vencrm.com/','https://www.vencrm.com/x','https://jhon01guevara.github.io/TARJETERIA-JHON/',
  'https://firebasestorage.googleapis.com/v0/b/tarjeteria-jhon.firebasestorage.app/o/x',
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBle5zbvVjXIVXvOz8tgxBBbu8-Ty1Msrs'])assert.match(u,PROD,u);
 for(const u of [
  'https://firestore.googleapis.com/v1/projects/tarjeteria-jhon-prueba/databases/(default)/documents/empresas/x',
  'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=projects%2Ftarjeteria-jhon-prueba%2Fdatabases%2F(default)',
  'https://tarjeteria-jhon-prueba.web.app/','http://127.0.0.1:8960/js/app.js'])assert.doesNotMatch(u,PROD,u);
});
test('BASE que apunta a producción se rechaza antes de abrir nada',()=>{
 const URL_PROD=rx('URL_PROD');
 for(const u of ['https://vencrm.com/','https://tarjeteria-jhon.web.app/','https://jhon01guevara.github.io/TARJETERIA-JHON/'])assert.match(u,URL_PROD);
 assert.doesNotMatch('https://tarjeteria-jhon-prueba.web.app/',URL_PROD);assert.doesNotMatch('http://127.0.0.1:8960/',URL_PROD);
 assert.match(src,/BASE apunta a producción/);
});
test('la suite exige proyecto de prueba, falla si intenta tocar producción y no usa secretos en el repo',()=>{
 assert.match(src,/La copia NO apunta al proyecto de prueba/);assert.match(src,/SE INTENTÓ TOCAR PRODUCCIÓN/);assert.match(src,/process\.env\.PRUEBA_PASSWORD/);
 assert.doesNotMatch(src,/PRUEBA_PASSWORD\s*=\s*['"][^'"]+['"]/);
});
test('package.json expone npm run humo y npm run comprobar',()=>{const p=require('../package.json');assert.match(p.scripts.humo,/humo\.js/);assert.match(p.scripts.comprobar,/comprobar-estatico\.js/)});
