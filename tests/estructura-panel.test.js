const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

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

test('Chat integra el ajuste de móvil sin encadenar renderizadores',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.chat=function\(/g)||[]).length,1);
  assert.match(app,/function chatFitSoon\(\)/);
  assert.match(app,/chatConv\(\);chatFitSoon\(\)/);
});

test('Catálogo y Check integran permisos y ajuste móvil sin capas extras',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.cat\s*=/g)||[]).length,1);
  assert.equal((app.match(/R\.check=function\(/g)||[]).length,0);
  assert.doesNotMatch(app,/const _rcat=|const _rck=/);
  assert.match(app,/if\(esVend\(\)\)\{const d=\$\('dz'\)/);
  assert.match(app,/checkFitSoon\(\)/);
});

test('Chat consulta solo conversaciones propias y las reglas separan participantes',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/\.where\('members','array-contains',chatMe\(\)\)\.onSnapshot/);
  assert.match(rules,/function chatMember\(data\)/);
  assert.match(rules,/allow read: if chatMember\(resource\.data\);/);
  assert.match(rules,/request\.resource\.data\.members == resource\.data\.members/);
  assert.match(rules,/match \/panel\/loginbg \{\s*allow read, write: if isAdmin\(\);/);
  assert.match(rules,/match \/panel\/data \{/);
});

test('Los datos del panel se separan entre catálogo común y espacio privado por vendedor',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/const publicRef=.*panel_public.*general/);
  assert.match(app,/const privateRef=.*vendedores/);
  assert.match(app,/function migrarPanelPorRoles\(\)/);
  assert.match(app,/clientes_y_agenda_heredados_admin/);
  assert.match(rules,/match \/panel_public\/general \{/);
  assert.match(rules,/match \/vendedores\/\{uid\}\/privado\/\{doc\} \{/);
  assert.match(rules,/match \/panel\/data \{\s*allow read, write: if isAdmin\(\);/);
});

test('La conexión reutiliza Firebase ya inicializado tras una actualización',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/if\(!\(firebase\.apps&&firebase\.apps\.length\)\)firebase\.initializeApp\(firebaseConfig\)/);
  assert.match(app,/function iniciarFirebase\(\)/);
  assert.match(app,/if\(!fbDb\)try\{iniciarFirebase\(\)\}/);
  assert.match(app,/No se pudo verificar su acceso \['\+c\+'\]/);
});

test('Las consultas autenticadas no repiten la búsqueda de rol por cada documento',()=>{
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(rules,/function logged\(\) \{\s*return request\.auth != null;/);
  assert.match(rules,/function isAdmin\(\)/);
  assert.match(rules,/request\.auth\.uid == 'o7bHndKtswSHreFnVwORqBSUKL43'/);
  assert.match(rules,/allow get: if request\.auth != null && request\.auth\.uid == uid;/);
  assert.match(rules,/allow list: if isAdmin\(\);/);
});

test('El inicio de sesión no queda verificando indefinidamente si Firestore no responde',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/get\(\{source:'server'\}\)/);
  assert.match(app,/firestore\/timeout/);
  assert.match(app,/12000/);
});

test('Un error al cargar el panel no invalida una sesión cuyo rol ya fue verificado',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/let d;/);
  assert.match(app,/try\{entrar\(\)\}catch\(e\)/);
  assert.match(app,/Acceso aceptado/);
});

test('El administrador entra por su UID autenticado sin depender de una lectura de rol',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/const ADMIN_UID='o7bHndKtswSHreFnVwORqBSUKL43';/);
  assert.match(app,/if\(u\.uid===ADMIN_UID\)/);
});

test('Administración recibe las facturas de todos los vendedores sin copiarlas a panel/data',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/function escucharVendedores\(\)/);
  assert.match(app,/collection\('vendedores'\)\.doc\(id\)\.collection\('privado'\)\.doc\('data'\)\.onSnapshot/);
  assert.match(app,/fac:\(DB\.fac\|\|\[\]\)\.filter\(f=>!f\._v\)/);
  assert.match(app,/function devolverFacVend\(\)/);
  assert.match(app,/<th>Vendedor<\/th>/);
});

test('Las facturas toman su número de un contador único compartido',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/panel_public'\)\.doc\('contador'\)/);
  assert.match(app,/async function reservarNumeroFactura\(\)/);
  assert.match(app,/function asegurarContador\(\)/);
  assert.match(app,/reservarNumeroFactura\(\)\.then/);
  assert.match(rules,/match \/panel_public\/contador \{/);
  assert.match(rules,/request\.resource\.data\.sig == resource\.data\.sig \+ 1/);
  assert.match(rules,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

test('Vendedores solo ven, descargan y comparten el catálogo',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/\$\{esVend\(\)\?'':`<div class="ckrow">/);
  assert.match(app,/\$\{esVend\(\)\?'':`<select class="catsel"/);
  assert.match(app,/\$\{esVend\(\)\?'':`<button class="btn s" data-h-click="h200"/);
  assert.match(app,/\['pdfCat','shareCat','descTodoImg'\]/);
  assert.doesNotMatch(app,/'expCatBackup','desc','pdfCat'/);
  assert.match(app,/'expCatBackup','repPDF'/);
});

test('Los clientes son una lista compartida, sin duplicados y solo administración elimina',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  assert.match(app,/panel_public'\)\.doc\('clientes'\)/);
  assert.match(app,/function fusionarClientes\(/);
  assert.match(app,/const dup=clienteDuplicado\(/);
  assert.match(app,/\$\{esAdmin\(\)\?`<button class="btn s" data-h-click="h305"/);
  assert.match(app,/'delC','editC'/);
  assert.match(rules,/match \/panel_public\/clientes \{/);
  assert.match(rules,/allow create, delete: if isAdmin\(\);/);
  assert.match(rules,/request\.resource\.data\.cli\.size\(\) >= resource\.data\.cli\.size\(\)/);
});

test('El formulario de cliente permite registrar la ubicación del negocio',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/id="cu_link"/);
  assert.match(app,/function cliLocGPS\(\)/);
  assert.match(app,/nuevo\.lat=loc\.lat;nuevo\.lng=loc\.lng/);
  assert.match(app,/<th>Ubicación<\/th>/);
  assert.match(app,/__H\.h329=/);
});

test('El formulario de cliente incluye un mapa para marcar el negocio',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/id="cuMap"/);
  assert.match(app,/function cliMapaIniciar\(\)/);
  assert.match(app,/function cliMapSync\(centrar\)/);
  assert.match(app,/;cliMapaIniciar\(\)\},\s*ubi\(\)\{/);
  assert.match(app,/cliLocEstado\(\);cliMapSync\(true\)/);
});

test('El mapa general de clientes es solo para administración y se ve en Inicio',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.equal((app.match(/R\.mapa=function\(/g)||[]).length,1);
  assert.match(app,/V\.push\(\['mapa','🗺️','Mapa de clientes'\]\)/);
  assert.match(app,/const PANELES=V\.filter\(v=>v\[0\]!=='config'&&v\[0\]!=='vend'&&v\[0\]!=='mapa'\)/);
  assert.match(app,/k!=='vend'&&k!=='mapa'&&/);
  assert.match(app,/mcPintar\('mcHomeMap'\)/);
  assert.match(app,/function mcStats\(\)/);
  for(const h of ['h332','h333','h334'])assert.match(app,new RegExp('__H\\.'+h+'='));
});

test('Las redes sociales se configuran en Configuración y se muestran en la tienda pública',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/\['redesCard',redesCard\]/);
  assert.match(app,/function redUrl\(red,txt\)/);
  assert.match(app,/function redesGuardar\(\)/);
  assert.match(app,/collection\('tienda_items'\)\.doc\('__cfg'\)\.set\(\{__cfg:true,redes,contacto:ct/);
  assert.match(app,/SH\.redes=cd\.redes/);
  assert.match(app,/id="k_redes"/);
  assert.match(app,/shopHdrScroll\(\);shopRedes\(\)/);
  assert.match(app,/__H\.h335=/);
});

test('Los enlaces de redes solo aceptan https en TikTok, Instagram o Facebook',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/tiktok:\/\^\(\?:\[a-z0-9-\]\+\\\.\)\*tiktok\\\.com\$\/i/);
  assert.match(app,/u\.username\|\|u\.password\|\|!RED_HOST\[red\]\.test\(u\.hostname\)/);
  assert.match(app,/u\.protocol='https:'/);
  assert.match(app,/rel="noopener noreferrer"/);
});

test('El botón Contacto de la tienda muestra los datos configurados y las redes salen junto al menú',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/function contLimpio\(c\)/);
  assert.match(app,/function shopContacto\(\)/);
  assert.match(app,/if\(k==='contact'\)\{shopContacto\(\);return\}/);
  assert.doesNotMatch(app,/if\(k==='contact'\)\{location\.href=/);
  assert.match(app,/SH\.contacto=cd\.contacto/);
  assert.match(app,/TD\.contacto=cd\.contacto/);
  assert.match(app,/set\(\{__cfg:true,redes,contacto:ct/);
  assert.match(app,/class=\\?"kredh\\?"/);
});

test('Lo escrito y el aviso de Redes y contacto sobreviven a los redibujados de la pantalla',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/let RS_DRAFT=\{\},RS_MSG=null;/);
  assert.match(app,/__H\.h336=function\(event,a\)\{RS_DRAFT\[this\.id\]=this\.value/);
  assert.match(app,/id in RS_DRAFT\?RS_DRAFT\[id\]:saved/);
});

test('La tienda muestra un botón flotante de WhatsApp con el número configurado',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/id="k_wa"/);
  assert.match(app,/\.kwa\{position:fixed/);
  assert.match(app,/w\.href='https:\/\/wa\.me\/'\+num\+'\?text='/);
  assert.match(app,/num=contLimpio\(typeof SH!=='undefined'\?SH\.contacto:null\)\.wa/);
});

test('Destacados de la semana avanza solo cada 5 segundos y se adapta al móvil',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/SH\._dt=setInterval\(shopDestTick,5000\)/);
  assert.match(app,/\.join\(''\)\}<\/div>`;shopDestAuto\(\)\}/);
  assert.match(app,/prefers-reduced-motion:reduce\)'\)\.matches\)return/);
  assert.match(app,/SH\._dh=Date\.now\(\)\+8000/);
  assert.match(app,/scroll-snap-type:x mandatory/);
  assert.match(app,/flex:0 0 min\(44vw,200px\)/);
});


test('Las etiquetas de envío de los pedidos de la tienda están integradas',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  for(const h of ['h337','h338','h339','h340','h341','h342','h343'])assert.match(app,new RegExp('__H\\.'+h+'='));
  assert.match(app,/\$\{etqBarra\(\)\}\$\{TD\.peds\.length\?TD\.peds\.map/);
  assert.match(app,/envio:sanEnv\(d\.envio\)/);
  assert.match(app,/if\(esAdmin\(\)&&fbDb\)fbDb\.collection\('tienda_pedidos'\)\.doc\(p\.id\)\.update\(/);
  assert.match(app,/<option value="internacional"/);
});

test('Las etiquetas generan el código de barras Code 128 correcto y el número de páginas esperado',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const a=app.indexOf('/*ETQ-INI*/'),b=app.indexOf('/*ETQ-FIN*/');
  assert.ok(a>0&&b>a);
  class Doc{constructor(){this.paginas=1;this.fs=10}
    setFont(){}setFontSize(p){this.fs=p}setTextColor(){}setDrawColor(){}setFillColor(){}setLineWidth(){}
    getTextWidth(t){return String(t).length*this.fs*.18}
    splitTextToSize(t,w){const o=[];let c='';for(const x of String(t).split(' ')){const n=c?c+' '+x:x;if(this.getTextWidth(n)<=w||!c)c=n;else{o.push(c);c=x}}if(c)o.push(c);return o}
    text(){}rect(){}line(){}addPage(){this.paginas++}output(){return {paginas:this.paginas}}}
  const ctx={window:{jspdf:{jsPDF:Doc}}};vm.createContext(ctx);
  vm.runInContext(app.slice(a,b)+';this.api={ETQ_TAM,etqPDF,code128B}',ctx);
  const {ETQ_TAM,etqPDF,code128B}=ctx.api;
  assert.equal(code128B('A'),'211214'+'111323'+'131123'+'2331112');
  const e=(n)=>({tipo:'nacional',agencia:'X',guia:'',bulto:[1,1],peso:0,codigo:'TJ-'+n,fecha:'20/10/2026',rem:{nombre:'Tarjetería Jhon',tel:'1',dir:'d'},dest:{name:'Ana',empresa:'',tel:'1',email:'',dir:'Calle 1',ciudad:'Panamá',prov:'Panamá',pais:'Panamá'},obs:'',cont:'1 x Tarjeta'});
  assert.equal(etqPDF([e(1),e(2),e(3)],ETQ_TAM.e100x150).paginas,3);
  assert.equal(etqPDF([e(1),e(2),e(3),e(4),e(5)],ETQ_TAM.a4x4).paginas,2);
});

test('El directorio de transportistas trae las 13 empresas y se ofrece desde Configuración',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  const a=app.indexOf('/*FLE-INI*/'),b=app.indexOf('/*FLE-FIN*/');
  assert.ok(a>0&&b>a);
  const ctx={};vm.createContext(ctx);
  vm.runInContext(app.slice(a,b)+';this.api={FLE_DEF,fleSanCfg,fleBuscar,fleAll}',ctx);
  const {FLE_DEF,fleSanCfg,fleBuscar,fleAll}=ctx.api;
  assert.equal(FLE_DEF.length,13);
  assert.equal(new Set(FLE_DEF.map(c=>c.id)).size,13);
  assert.equal(FLE_DEF.filter(c=>c.t==='n').length,6);
  assert.equal(FLE_DEF.filter(c=>c.t==='i').length,7);
  assert.equal(FLE_DEF.find(c=>c.id==='uno').suc.length,19);
  assert.equal(FLE_DEF.find(c=>c.id==='ferguson').wa,'6330-3495');
  const C=fleSanCfg({on:['uno','nope','uno'],extra:[{id:'xabc123',n:'Mi flete',t:'i',web:'javascript:alert(1)'},{id:'../x',n:'mala'}],img:{uno:'data:image/jpeg;base64,AAAA',ups:'data:text/html;base64,AAAA'}});
  assert.deepEqual(C.on,['uno']);assert.equal(C.extra.length,1);assert.equal(C.extra[0].web,'');
  assert.deepEqual(Object.keys(C.img),['uno']);
  assert.equal(fleBuscar('dhl express',C).id,'dhlexpress');
  assert.equal(fleBuscar('Mi Flete',C).id,'xabc123');
  assert.equal(fleBuscar('desconocida',C),null);
  assert.match(app,/\['fleCard',fleAdmCard\]/);
  for(const h of ['h345','h346','h347','h348','h349','h350','h351','h352'])assert.match(app,new RegExp('__H\\.'+h+'='));
  assert.match(app,/TD\.fletes=fleSanCfg\(cd\.fletes\)/);
  assert.match(app,/SH\.fletes=fleSanCfg\(cd\.fletes\)/);
});

test('El cliente elige transportista al pedir y la etiqueta lo recibe con sus datos',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(app,/\$\{shopFleHTML\(\)\}<textarea id="sh_nt"/);
  assert.match(app,/p\.envio=\{agencia:fl\.n,fid:fl\.id\}/);
  assert.match(app,/Envío por: /);
  assert.match(app,/\['agencia',80\],\['fid',30\]/);
  assert.match(app,/\$\{fleLinea\(p\)\}\$\{p\.nota\?/);
  const a=app.indexOf('/*ETQ-INI*/'),b=app.indexOf('/*ETQ-FIN*/');
  const mk=(imgOk)=>{const calls=[];class Doc{constructor(){this.paginas=1;this.fs=10}
    setFont(){}setFontSize(p){this.fs=p}setTextColor(){}setDrawColor(){}setFillColor(){}setLineWidth(){}
    getTextWidth(t){return String(t).length*this.fs*.18}
    splitTextToSize(t,w){return [String(t)]}
    text(t){calls.push(String(t))}rect(){}line(){}addPage(){this.paginas++}output(){return {paginas:this.paginas}}}
    if(imgOk)Doc.prototype.addImage=function(){calls.push('IMG')};
    const ctx={window:{jspdf:{jsPDF:Doc}}};vm.createContext(ctx);vm.runInContext(app.slice(a,b)+';this.api={ETQ_TAM,etqPDF}',ctx);return{api:ctx.api,calls}};
  const e={tipo:'nacional',agencia:'Uno Express Panamá',guia:'',bulto:[1,1],peso:0,codigo:'TJ-1',fecha:'20/10/2026',rem:{nombre:'Tarjetería Jhon',tel:'1',dir:'d'},dest:{name:'Ana',empresa:'',tel:'1',email:'',dir:'Calle 1',ciudad:'Panamá',prov:'Panamá',pais:'Panamá'},obs:'',cont:'1 x Tarjeta',ag:{tel:'6781-4532',wa:'6676-3445',dir:'Premier Plaza'},logo:'data:image/png;base64,AAAA'};
  let m=mk(true);m.api.etqPDF([e],m.api.ETQ_TAM.e100x150);
  assert.ok(m.calls.some(t=>/AGENCIA: Tel\. 6781-4532/.test(t)&&/WhatsApp 6676-3445/.test(t)));
  assert.ok(m.calls.includes('Premier Plaza'));assert.ok(m.calls.includes('IMG'));
  m=mk(false);assert.equal(m.api.etqPDF([e],m.api.ETQ_TAM.e100x150).paginas,1);
  assert.ok(m.calls.some(t=>/AGENCIA: Tel\./.test(t)));
});
