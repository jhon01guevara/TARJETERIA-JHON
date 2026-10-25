const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const app=require('./helpers/app-fuentes').appTodo();
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('TikTok LIVE añade un panel sin sustituir los módulos existentes',()=>{
  assert.match(app,/V\.push\(\['tiktoklive','📡','TikTok LIVE'\]\)/);
  assert.match(app,/R\.tiktoklive=function\(\)/);
  for(const panel of ["['home'","['nueva'","['fac'","['prod'","['cat'","['cli'","['config'"])
    assert.ok(app.includes(panel),`Debe conservar ${panel}`);
  // Solo exige que app.js se cargue con versión de caché (subir el número en
  // index.html NO debe romper esta prueba; es un cambio esperado en cada entrega).
  assert.match(html,/js\/app\.js\?v=(tiktok-live-20\d{6}[a-z]|modulos-fase-\d+[a-z]|csp-fase-\d+)/);
});

test('La preparación LIVE no finge conexión de métricas oficiales',()=>{
  assert.match(app,/No conectado/);
  assert.match(app,/Sin conexión autorizada/);
  assert.match(app,/Sin fuente de datos/);
  assert.match(app,/TJ LIVE: centro de preparación para TikTok LIVE/);
});

test('El borrador LIVE se guarda localmente sin secretos ni llamadas de API',()=>{
  assert.match(app,/tj_tiktok_live_draft_v1/);
  assert.match(app,/localStorage\.setItem\(lsk\(TJLIVE_KEY\)/);
  assert.doesNotMatch(app,/client_secret|access_token\s*=/i);
});

test('La integración ofrece producto, promoción, guion y acceso a facturación',()=>{
  for(const id of ['tjl_title','tjl_topic','tjl_product','tjl_promo','tjl_discount','tjl_script'])
    assert.match(app,new RegExp('id="'+id+'"'));
  assert.match(app,/__H\.h355=function\(\)\{ir\('nueva'\)\}/);
});
