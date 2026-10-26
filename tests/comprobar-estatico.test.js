/* La herramienta de comprobaciones estáticas (tests/herramientas/comprobar-estatico.js) debe: pasar con el repo real y DETECTAR cada tipo de rotura. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {comprobar}=require('./herramientas/comprobar-estatico.js');
const RAIZ=path.resolve(__dirname,'..');
function mini(){
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'estatico-')),w=(f,t)=>{fs.mkdirSync(path.dirname(path.join(d,f)),{recursive:true});fs.writeFileSync(path.join(d,f),t)};
 w('index.html','<html><link rel="manifest" href="manifest.json"><link rel="canonical" href="x/y"><script src="js/a.js?v=1"></script><img src="logo.png"></html>');
 w('js/a.js','const a=1;');w('logo.png','x');w('manifest.json',JSON.stringify({icons:[{src:'logo.png'}]}));
 w('sw.js',"const V='v1';const MODELOS='js/a.js?v=2';const PRE=['index.html','js/a.js','logo.png'];");
 w('firebase.json',JSON.stringify({hosting:{ignore:['docs/**','**/*.md','tests/**']}}));
 return {d,w};
}
test('el repo real pasa las comprobaciones estáticas',()=>{const r=comprobar(RAIZ);assert.deepEqual(r.errores,[]);assert.ok(r.archivos.js>50&&r.archivos.sw>20)});
test('una copia mínima correcta pasa',()=>{const {d}=mini();assert.deepEqual(comprobar(d).errores,[])});
test('detecta un error de sintaxis en un .js',()=>{const {d,w}=mini();w('js/a.js','const a=;');assert.match(comprobar(d).errores.join('\n'),/sintaxis en js\/a\.js/)});
test('detecta un archivo cargado por index.html que no existe (con ?v=)',()=>{const {d,w}=mini();w('index.html','<script src="js/falta.js?v=3"></script>');assert.match(comprobar(d).errores.join('\n'),/js\/falta\.js no existe/)});
test('detecta un archivo del service worker que no existe',()=>{const {d,w}=mini();w('sw.js',"const V='v1';const MODELOS='js/a.js';const PRE=['index.html','js/borrado.js'];");assert.match(comprobar(d).errores.join('\n'),/sw\.js guarda «js\/borrado\.js»/)});
test('detecta un icono de manifest que no existe y un JSON inválido',()=>{const {d,w}=mini();w('manifest.json',JSON.stringify({icons:[{src:'icono-roto.png'}]}));assert.match(comprobar(d).errores.join('\n'),/icono-roto\.png/);w('otro.json','{malo');assert.match(comprobar(d).errores.join('\n'),/JSON inválido en otro\.json/)});
test('detecta lo que Firebase Hosting dejaría fuera (hosting.ignore)',()=>{const {d,w}=mini();w('firebase.json',JSON.stringify({hosting:{ignore:['js/**']}}));assert.match(comprobar(d).errores.join('\n'),/NO publicaría «js\/a\.js»/);
 w('firebase.json',JSON.stringify({hosting:{ignore:['**/*.png']}}));assert.match(comprobar(d).errores.join('\n'),/NO publicaría «logo\.png»/)});
test('no confunde enlaces externos, canonical ni data: con archivos locales',()=>{const {d,w}=mini();w('index.html','<link rel="canonical" href="https://vencrm.com/"><script src="https://cdn.x/y.js"></script><img src="data:image/png;base64,AAA">');assert.deepEqual(comprobar(d).errores,[])});
