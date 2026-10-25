/* Fase 15 · bloque 1: onclick= sobrantes y botón «Imprimir» de la constancia legal. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {appTodo}=require('./helpers/app-fuentes.js');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const jsFiles=fs.readdirSync(path.join(__dirname,'..','js')).filter(f=>f.endsWith('.js')&&f!=='pdf.worker.min.js').map(f=>'js/'+f);

/* ───────── BLOQUE 1 · manejadores en línea ───────── */
/* Atributo on*="..." escrito dentro de una plantilla HTML (no cuenta `el.onclick=` ni comentarios). */
const ATTR_ON=/<[a-zA-Z][^<>]*?\son(click|change|input|keydown|keyup|submit|load|error|focus|blur|dblclick|mouse\w+|touch\w+|pointer\w+|drag\w*|drop)\s*=\s*["'\\]/;

test('Fase 15: ninguna plantilla de js/ ni index.html ni apps/ escribe atributos on*= en línea (la CSP los bloquea)',()=>{
 const malos=[];
 for(const f of [...jsFiles,'index.html','apps/investigacion.html','apps/modelos.html','apps/investigacion.js','apps/modelos.js']){
  leer(f).split('\n').forEach((l,i)=>{ if(/^\s*(\/\/|\/\*|\*)/.test(l))return; if(ATTR_ON.test(l))malos.push(f+':'+(i+1)+' '+l.trim().slice(0,100)); });
 }
 assert.deepEqual(malos,[],'quedan manejadores en línea:\n'+malos.join('\n'));
});

test('Fase 15: cada data-h-click/-change="call" apunta a una función global que existe (function X o window.X=)',()=>{
 const src=appTodo()+'\n'+jsFiles.map(leer).join('\n');
 const nombres=new Set();
 const re=/data-h-(?:click|change)="call"\s+data-a-(?:click|change)="\$\{_ha\('(\w+)'/g;let m;
 while((m=re.exec(src)))nombres.add(m[1]);
 assert.ok(nombres.size>=20,'se esperaban muchas llamadas «call»: '+nombres.size);
 const faltan=[...nombres].filter(n=>!new RegExp('(^|[\\n;{}])\\s*(async\\s+)?function\\s+'+n+'\\s*\\(|window\\.'+n+'\\s*=|(^|[^\\w.])window\\[[\'"]'+n+'[\'"]\\]\\s*=','m').test(src));
 assert.deepEqual(faltan,[],'«call» sin función global: '+faltan.join(', '));
});

test('Fase 15: los botones de la portada de la tienda conservan su delegador (data-h-click=call) tras quitar onclick=',()=>{
 const s=appTodo();   // Fase 23: parte de estas funciones vive ahora en js/tienda-config-medios.js
 for(const fn of ['shopBrandSave','shopLogoClear','shopCfgBgTypeSet','shopPhotoClear','shopVideoClear','shopPresetVideo','shopCfgColorSet','shopCfgMotionSet','shopCfgWmSet']){
  assert.match(s,new RegExp('data-h-click="call" data-a-click="\\$\\{_ha\\(\''+fn+'\''),fn+' sigue con su delegador');
  assert.match(s,new RegExp('window\\.'+fn+'='),fn+' sigue exportada a window (la usa el delegador «call»)');
 }
 for(const fn of ['shopLogoUpload','shopPhotoUpload','shopVideoUpload']){
  assert.match(s,new RegExp('data-h-change="call" data-a-change="\\$\\{_ha\\(\''+fn+'\''),fn+' sigue con su delegador de change');
  // sin el evento, la función lee el <input> por id: equivalente a onchange="fn(event)"
  const cuerpo=s.slice(s.indexOf('function '+fn+'('),s.indexOf('function '+fn+'(')+260);
  assert.match(cuerpo,/\(e&&e\.target&&e\.target\.files\)\?e\.target:\$\('sh_cfg_\w+_file'\)/,fn+' cae al input por id cuando no recibe evento');
 }
});

function cargarPoliticas(){
 const ventana={escrito:'',botones:{},cerrada:false,impreso:0,focus(){}, print(){this.impreso++},
  document:{write(h){ventana.escrito+=h},close(){ventana.cerrada=true},
   getElementById(id){return id==='btnImprimir'&&/id="btnImprimir"/.test(ventana.escrito)?{addEventListener(t,f){ventana.botones[t]=f}}:null}}};
 const ctx={window:{open:()=>ventana,_tjw(){}},esc:x=>String(x==null?'':x),nombreNegocio:()=>'Negocio',alert(){},TD:{peds:[{id:'P1',ts:1,lead:{name:'Ana',terminos:{ok:true}},nota:''}]},
  document:{getElementById:()=>null},console};
 ctx.window.window=ctx.window;
 vm.runInNewContext(leer('js/politicas.js')+'\nthis.__imp=poliImprimirEvidencia;',ctx);
 return {ventana,ctx};
}
test('Fase 15: «Imprimir» de la constancia legal no usa onclick= y su botón imprime con addEventListener',()=>{
 const {ventana,ctx}=cargarPoliticas();
 ctx.__imp('P1');
 assert.ok(ventana.cerrada,'la ventana se cierra de escribir');
 assert.doesNotMatch(ventana.escrito,/\sonclick\s*=/i,'el HTML de la constancia no lleva onclick=');
 assert.match(ventana.escrito,/<button type="button" id="btnImprimir"/);
 assert.equal(typeof ventana.botones.click,'function','el botón recibe un listener de clic');
 ventana.botones.click();
 assert.equal(ventana.impreso,1,'el clic llama a print() de la ventana nueva, una sola vez');
 assert.match(ventana.escrito,/@media print\{button\{display:none\}\}/,'el botón sigue sin imprimirse en papel');
 assert.match(ventana.escrito,/<style>/,'el <style> sigue igual (su hash está en la CSP: no se cambió la CSP)');
});

