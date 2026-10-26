/* Marca de la barra lateral del panel por empresa: el nombre y el eslogan que van debajo del logo son editables y
   ninguna empresa distinta de la inicial hereda «Tarjetería Jhon / Tarjetas para toda ocasión» (fijos en index.html). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const app=leer('js/app.js');

/* Carga solo panelMarcaTextos/panelMarcaApply de app.js en una VM con DOM mínimo. */
function cargar(cfg,inicial,el){
 const m=/const PANEL_NOMBRE_INI=[\s\S]*?function panelMarcaGuardar/.exec(app);
 assert.ok(m,'panelMarca* existe en app.js');
 const src=m[0].replace(/function panelMarcaGuardar$/,'');
 const nodos=el||{};
 const doc={querySelector:s=>nodos[s]||null};
 const ctx={DB:{cfg},TJEmpresa:{empEsInicial:()=>inicial},nombreNegocio:()=>cfg.nombre||'Mi empresa',document:doc,window:{}};
 vm.createContext(ctx);vm.runInContext(src,ctx);return ctx;
}

test('la empresa inicial conserva su nombre y lema de siempre',()=>{
 const c=cargar({},true);
 assert.deepEqual({n:c.panelMarcaTextos().nombre,l:c.panelMarcaTextos().lema},{n:'Tarjetería Jhon',l:'Tarjetas para toda ocasión'});
});
test('otra empresa usa SU nombre y ningún lema por defecto (nunca el de Tarjetería)',()=>{
 const t=cargar({nombre:'Genuine Global Parts'},false).panelMarcaTextos();
 assert.equal(t.nombre,'Genuine Global Parts');assert.equal(t.lema,'');
 const t2=cargar({nombre:'Tarjetería Jhon'},false).panelMarcaTextos();
 assert.doesNotMatch(t2.lema,/toda ocasión/);
});
test('nombre y eslogan propios (panelNombre / panelLema) mandan sobre los de por defecto; lema vacío = sin lema',()=>{
 let t=cargar({nombre:'X Corp',panelNombre:'GENUINE',panelLema:'Partes para tu auto'},false).panelMarcaTextos();
 assert.deepEqual([t.nombre,t.lema],['GENUINE','Partes para tu auto']);
 t=cargar({panelNombre:'Mi Tarjetería',panelLema:''},true).panelMarcaTextos();
 assert.deepEqual([t.nombre,t.lema],['Mi Tarjetería',''],'la inicial también puede quitar su lema');
});
test('panelMarcaApply escribe nombre, lema (oculto si está vacío), alt y rótulos de cabecera sin repetir',()=>{
 const mk=t=>({textContent:t,hidden:false,alt:'',dataset:{}});
 const els={'.brand small':mk('Tarjetería Jhon'),'.brand p':mk('Tarjetas para toda ocasión'),'.brand .logo img':mk(''),'.top .rt':mk('Tarjetería Jhon · VEN CRM'),'h1.h1m':mk('VEN CRM · Tarjetería Jhon')};
 const c=cargar({nombre:'Genuine',panelLema:''},false,els);
 c.panelMarcaApply();
 assert.equal(els['.brand small'].textContent,'Genuine');assert.equal(els['.brand p'].hidden,true);assert.equal(els['.brand p'].textContent,'');
 assert.equal(els['.brand .logo img'].alt,'Genuine');
 assert.equal(els['.top .rt'].textContent,'Genuine · VEN CRM');assert.equal(els['h1.h1m'].textContent,'VEN CRM · Genuine');
 c.DB.cfg.panelNombre='Otro';c.DB.cfg.panelLema='Lema';c.panelMarcaApply();
 assert.equal(els['.top .rt'].textContent,'Otro · VEN CRM','se rehace desde la plantilla original, no se acumula');
 assert.equal(els['.brand p'].hidden,false);
});
test('panelLogoApply (se llama al entrar y al sincronizar) también aplica la marca; hay arranque temprano y campos en Configuración',()=>{
 assert.match(app,/function panelLogoApply\(\)\{[^\n]*panelMarcaApply\(\)/);
 assert.match(app,/try\{if\(!SHOP\)panelMarcaApply\(\)\}/);
 for(const id of ['pm_nombre','pm_lema','panelMarcaGuardar','panelMarcaRestaurar'])assert.ok(app.includes(id),id);
});
test('subió el ?v= de app.js y la caché del service worker',()=>{
 assert.match(leer('index.html'),/js\/app\.js\?v=modulos-fase-24[f-z]/);
 assert.ok(+/tj-net-first-(\d+)/.exec(leer('sw.js'))[1]>=26);
});
