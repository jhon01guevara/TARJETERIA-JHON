/* Fase 14: dos errores de consola que ya existían (antes silenciosos):
   A) 'Cannot access lsk before initialization': app.js usaba lsk() en sus primeras líneas (tj_cards, tj_db)
      antes de la línea donde se definía el const. Estos tests vigilan el orden.
   B) Leaflet 'Cannot read properties of undefined (reading _leaflet_pos)': invalidateSize() sobre un mapa ya quitado. */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {leer,EXTRAIDOS}=require('./helpers/app-fuentes');
const app=leer('js/app.js');const appTodoJs=[...EXTRAIDOS,'js/app.js'].map(leer).join('\n'); /* Fase 21: el mapa de clientes vive en js/mapa-clientes.js */

test('A: const lsk se define una sola vez y ANTES de su primer uso en app.js',()=>{
 const defs=[...app.matchAll(/^const lsk\s*=/gm)];
 assert.equal(defs.length,1,'una sola definición de lsk');
 const def=defs[0].index;
 const uso=app.search(/[^\w.]lsk\(/);
 assert.ok(uso>=0,'app.js usa lsk');
 assert.ok(def<uso,'lsk debe definirse antes de su primer uso (zona muerta TDZ)');
});
test('A: ningún script cargado antes de app.js usa lsk antes de que exista',()=>{
 /* Fase 21: js/fondo-login.js usa lsk() SOLO dentro de funciones flecha (lbgMeta, lbgSave), que se ejecutan después de cargar app.js.
    Se permite porque carga en un contexto vacío sin ReferenceError (si usara lsk al cargarse, fallaría aquí). */
 /* Fase 23: js/tienda-copia-local.js usa lsk() solo dentro de shopCacheItems (se llama después de cargar todo); también carga en un contexto vacío (con window). */
 const DIFERIDO=['js/fondo-login.js','js/tienda-copia-local.js'];
 for(const f of EXTRAIDOS){
  const s=leer(f);
  if(DIFERIDO.includes(f)){assert.doesNotThrow(()=>vm.runInContext(s,vm.createContext({window:{}})),f+' usa lsk() al cargarse');continue}
  assert.ok(!/[^\w.]lsk\(/.test(s),f+' usa lsk(), que solo existe desde app.js')}
});
test('A: la lectura local de tj_cards y tj_db está dentro de try/catch y usa lsk (clave por empresa)',()=>{
 assert.match(app,/try\{cardState=Object\.assign\(cardState,JSON\.parse\(localStorage\.getItem\(lsk\('tj_cards'\)\)/);
 assert.match(app,/try\{const s=localStorage\.getItem\(lsk\('tj_db'\)\)/);
});
test('A: evaluar app.js hasta tj_db no lanza TDZ (simulación con localStorage por empresa)',()=>{
 // Toma desde 'const lsk' hasta la carga de tj_db y la ejecuta con un TJEmpresa real y un localStorage falso.
 const i=app.indexOf('const lsk='),j=app.indexOf("try{const s=localStorage.getItem(lsk('tj_db'))");
 const fin=app.indexOf('\n',j);
 const tramo=app.slice(app.indexOf('let DB={prod:[]'),fin);
 const fuente=app.slice(i,app.indexOf('\n',i))+'\n'+tramo+'\nthis.__r={DB,cardState};';
 const corre=(emp,almacen)=>{
  const ctx={window:{},
   localStorage:{getItem:k=>(k in almacen?almacen[k]:null),setItem(){},removeItem(){}},
   location:{href:'https://x.test/?emp='+emp},URL,console,$:()=>null};
  const errores=[];ctx.window._tjw=e=>errores.push(e);
  vm.createContext(ctx);vm.runInContext(leer('js/empresa-contexto.js'),ctx); // mismo orden que index.html: antes de app.js
  vm.runInContext(fuente,ctx);
  return {r:ctx.__r,errores};
 };
 const alm={tj_cards:JSON.stringify({cfg:true}),tj_db:JSON.stringify({cli:[{id:'A',n:'Cliente de la inicial'}]}),
  tj_cards_otraempresa:JSON.stringify({email:true}),tj_db_otraempresa:JSON.stringify({cli:[{id:'B',n:'Cliente de otra'}]})};
 const ini=corre('tarjeteria-jhon',alm);
 assert.equal(ini.errores.length,0,'sin errores (TDZ) para la empresa inicial');
 assert.equal(ini.r.cardState.cfg,true);assert.equal(ini.r.DB.cli[0].id,'A');
 const otra=corre('otraempresa',alm);
 assert.equal(otra.errores.length,0);
 assert.equal(otra.r.cardState.email,true);assert.notEqual(otra.r.cardState.cfg,true,'no mezcla el estado de tarjetas');
 assert.equal(otra.r.DB.cli[0].id,'B','otra empresa lee SOLO su copia local (tj_db_otraempresa)');
 const sin=corre('empresanueva',alm);
 assert.equal(sin.r.DB.cli.length,0,'una empresa sin copia local arranca vacía, no con datos de otra');
});
test('B: todos los invalidateSize diferidos pasan por mapaRefrescar',()=>{
 const sueltos=(appTodoJs.replace(/function mapaRefrescar[^\n]*/,'').match(/[\w&]*\.invalidateSize\(\)/g)||[]);
 assert.deepEqual(sueltos,[],'setTimeout con invalidateSize sin protección');
 assert.equal((appTodoJs.match(/setTimeout\(\(\)=>mapaRefrescar\(/g)||[]).length,4,'4 llamadas diferidas (mapa de ubicaciones x2, Mapa Central, mapa de clientes)');
});
test('B: mapaRefrescar no lanza con mapa nulo, quitado o fuera del DOM, y refresca si está vivo',()=>{
 const m=/function mapaRefrescar\(m\)\{[^\n]*\}/.exec(app);assert.ok(m);
 const ctx={};vm.createContext(ctx);vm.runInContext(m[0]+';this.f=mapaRefrescar',ctx);
 let n=0;const vivo={_loaded:true,_mapPane:{},getContainer:()=>({isConnected:true}),invalidateSize(){n++}};
 ctx.f(vivo);assert.equal(n,1);
 ctx.f(null);ctx.f(undefined);
 ctx.f({...vivo,_loaded:false});ctx.f({...vivo,_mapPane:undefined});ctx.f({...vivo,getContainer:()=>({isConnected:false})});
 assert.equal(n,1,'no refresca mapas quitados u ocultos');
 assert.doesNotThrow(()=>ctx.f({_loaded:true,_mapPane:{},getContainer:()=>{throw new Error('x')},invalidateSize(){throw new TypeError("reading '_leaflet_pos'")}}));
 assert.doesNotThrow(()=>ctx.f({...vivo,invalidateSize(){throw new TypeError("reading '_leaflet_pos'")}}));
});
test('Fase 14: caché del service worker y ?v= de app.js subidos',()=>{
 assert.match(leer('sw.js'),/const V='tj-net-first-\d+'/);
 assert.match(leer('index.html'),/js\/app\.js\?v=[a-z0-9-]+/);
});
