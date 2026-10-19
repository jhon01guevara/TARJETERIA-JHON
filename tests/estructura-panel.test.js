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
