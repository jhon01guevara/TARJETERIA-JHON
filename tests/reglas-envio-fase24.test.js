/* Fase 24: la regla de creación de tienda_pedidos admite `envio` (transportista) con validación estricta.
   Estáticas (aquí) + emulador de Firestore (tests/herramientas/reglas-emulador, ver README.md). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const reglas=leer('firestore.rules'),sanear=leer('js/sanear.js');

test('las dos reglas de creación de tienda_pedidos (raíz y empresas/{eid}) admiten envio y lo validan con envioValido',()=>{
 const bloques=[...reglas.matchAll(/match \/(?:empresas\/\{eid\}\/)?tienda_pedidos\/\{id\} \{[\s\S]*?allow read:/g)].map(m=>m[0]);
 assert.equal(bloques.length,2);
 for(const b of bloques){
  assert.match(b,/keys\(\)\.hasOnly\(\['id','cid','lead','items','total','nota','ref','ts','estado','envio'\]\)/);
  assert.match(b,/&& \(!\('envio' in request\.resource\.data\) \|\| envioValido\(request\.resource\.data\.envio\)\);/);
  /* lo demás no se relajó */
  assert.match(b,/request\.resource\.data\.estado == 'nuevo'/);assert.match(b,/nota\.size\(\) <= 500/);assert.match(b,/items\.size\(\) > 0 && request\.resource\.data\.items\.size\(\) <= 100/);
  assert.match(b,/lead\.keys\(\)\.hasOnly\(\['name','tel','email','empresa','dir','terminos'\]\)/);assert.match(b,/validRef\(request\.resource\.data\.ref\)/);
 }
});
test('envioValido: solo las claves que escribe la tienda al crear, tipos y tamaños iguales a sanEnv',()=>{
 const f=reglas.match(/function envioValido\(e\) \{[\s\S]*?\n    \}/);assert.ok(f,'función envioValido');
 const claves=[...f[0].match(/hasOnly\(\[([^\]]*)\]\)/)[1].matchAll(/'(\w+)'/g)].map(m=>m[1]);
 assert.deepEqual(claves.sort(),['agencia','ciudad','dir','fid','pais','prov','rced','rec','ref','rtel','suc','tipo']);
 for(const k of ['guia','cont','obs','bultos','peso','etq'])assert.ok(!claves.includes(k),k+' solo lo escribe el panel después');
 /* tamaños = los de sanEnv (js/sanear.js) */
 const san=Object.fromEntries([...sanear.match(/\[\['agencia',80\][^\n]*?\]\]\.forEach/)[0].matchAll(/\['(\w+)',(\d+)\]/g)].map(m=>[m[1],+m[2]]));
 for(const k of claves.filter(x=>x!=='tipo')){
  const m=new RegExp("e\\."+k+"\\.size\\(\\) <= (\\d+)").exec(f[0]);assert.ok(m,'límite de '+k);
  assert.equal(+m[1],san[k],'el límite de '+k+' en las reglas debe ser el de sanEnv');
 }
 assert.match(f[0],/e\.tipo == 'nacional' \|\| e\.tipo == 'internacional'/);
 assert.match(f[0],/'agencia' in e && e\.agencia is string && e\.agencia\.size\(\) > 0/);
});
test('lo que construye la tienda (shopEnvDatos → sanEnv) está dentro de lo que admiten las reglas',()=>{
 const app=require('./helpers/app-fuentes').appTodo();
 const d=app.match(/function shopEnvDatos\(c\)\{[\s\S]*?\n\}/)[0];
 const claves=[...d.match(/return\{([^\n]*)\}/)[1].matchAll(/(?:^|,)(\w+):/g)].map(m=>m[1]);
 const f=reglas.match(/function envioValido\(e\) \{[\s\S]*?\n    \}/)[0];
 for(const k of claves)assert.ok(new RegExp("'"+k+"'").test(f),k+' no está en envioValido');
});
test('respaldo de las reglas anteriores (producción al 2026-10-25) disponible y sin envio',()=>{
 const ant=leer('docs/respaldo-reglas-anteriores-2026-10-25.rules');
 assert.doesNotMatch(ant,/envioValido|'envio'/);
 const publicadas=leer('docs/respaldo-reglas-anteriores-2026-10-26.rules'); /* lo publicado el 2026-10-25/26 (con envio), antes del aislamiento entre empresas */
 assert.notEqual(ant,publicadas);
 /* la única diferencia con las reglas nuevas es envio: quitando envioValido y las referencias a envio son iguales */
 const sin=publicadas.replace(/    \/\/ Datos de envío que la tienda pública[\s\S]*?\n    \}\n\n(?=    function chatMember)/,'').replace(/,'estado','envio'\]/g,",'estado']").replace(/\n        && \(!\('envio' in request\.resource\.data\) \|\| envioValido\(request\.resource\.data\.envio\)\);/g,';').replace(/request\.resource\.data\.ts is number\n? *;/g,'request.resource.data.ts is number;');
 assert.equal(sin.replace(/\s+/g,' '),ant.replace(/\s+/g,' '),'las reglas nuevas solo añaden envio');
});
test('el emulador: pruebas y README presentes',()=>{
 const d=path.join(__dirname,'herramientas','reglas-emulador');
 for(const f of ['reglas-pedido-envio.test.js','reglas-generales.test.js','run.sh','README.md'])assert.ok(fs.existsSync(path.join(d,f)),f);
});
