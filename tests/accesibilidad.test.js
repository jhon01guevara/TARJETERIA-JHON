const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('index.html: idioma, skip-link, landmarks con nombre y diálogo modal',()=>{
 const h=leer('index.html');
 assert.match(h,/<html lang="es">/);
 assert.match(h,/<body>\s*<a class="skip-link" href="#contenido">/,'el skip-link es lo primero del body');
 assert.match(h,/<main id="contenido">/,'destino del skip-link');
 assert.match(h,/<nav id="nav" aria-label="Menú principal">/);
 assert.match(h,/<nav id="nav2" class="bn" aria-label="Menú inferior">/);
 assert.match(h,/id="mb" role="dialog" aria-modal="true" aria-label="[^"]+"/);
 assert.match(h,/css\/accesibilidad\.css\?v=\d/);
 assert.ok(h.indexOf('css/accesibilidad.css')>h.indexOf('css/uber-skin.css'),'va después del skin');
 const pa=h.indexOf('js/app.js?v='),pb=h.indexOf('js/a11y.js?v=');
 assert.ok(pa>0&&pb>pa,'a11y.js se carga después de app.js');
 assert.match(h,/tiktok-live-\d+/, 'se conserva el esquema de versión de scripts');
});

test('CSS de accesibilidad: foco visible, skip-link oculto y reduced-motion; sin tocar colores del diseño',()=>{
 const c=leer('css/accesibilidad.css');
 assert.match(c,/:focus-visible/);
 assert.match(c,/\.skip-link\{[^}]*top:-\d+px/,'oculto fuera de pantalla hasta recibir el foco');
 assert.match(c,/\.skip-link:focus/);
 assert.match(c,/@media \(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(c,/--(az|fondo|card|txt|gris|linea|soft)\s*:/,'no redefine las variables de color del tema');
 /* el foco de uber-skin sigue ahí */
 assert.match(leer('css/uber-skin.css'),/button:focus-visible/);
});

test('Botones de solo icono llevan aria-label (panel y marketing)',()=>{
 for(const f of ['js/app.js','js/marketing.js']){
  const s=f==='js/app.js'?require('./helpers/app-fuentes').appTodo():leer(f);
  const solo=[...s.matchAll(/<button((?:\s[^<>]*?)?)>(🗑|✕|✏️|⬇|↑|↓|⧉|↶|↷|‹|›|🧾|➕)<\/button>/g)].filter(m=>!/aria-label=/.test(m[1]));
  assert.equal(solo.length,0,f+': quedan botones de solo icono sin aria-label: '+solo.slice(0,3).map(m=>m[0]).join(' '));
 }
 const a=require('./helpers/app-fuentes').appTodo();
 assert.match(a,/aria-label="Eliminar">🗑<\/button>/);
 assert.match(a,/aria-label="Mes anterior">‹<\/button>/);
 assert.match(a,/aria-label="Volver a la lista de chats">‹<\/button>/);
 assert.match(a,/aria-label="Tema \$\{thmLbl\}: cambiar tema visual"/,'el nombre accesible incluye el texto visible (Auto/Día/Oscuro)');
});

test('Login: etiquetas asociadas a sus campos; imágenes e iframes con alt/title',()=>{
 const a=require('./helpers/app-fuentes').appTodo();
 assert.match(a,/<label for="au_e">Correo<\/label><input id="au_e"/);
 assert.match(a,/<label for="au_p">Contraseña<\/label><input id="au_p"/);
 for(const m of a.matchAll(/<iframe\b[^>]*>/g))assert.match(m[0],/\btitle=/,'iframe sin title: '+m[0]);
 assert.doesNotMatch(a,/<img src="\$\{LG\}">/,'logos decorativos del catálogo con alt vacío');
});

test('a11y.js: sintaxis y reglas clave (sin doble disparo, solo sobre lo que marca él)',()=>{
 const s=leer('js/a11y.js');
 new vm.Script(s);
 assert.match(s,/data-a11y-kb/);
 assert.doesNotMatch(s,/\.innerHTML\s*=/,'no inserta HTML: solo atributos');
 assert.doesNotMatch(s,/\.style\./,'no toca estilos');
});

/* Simulación mínima del navegador para probar el delegador de teclado. */
function cargarA11y(){
 const manejadores={};
 const document={
  body:{querySelectorAll:()=>[],matches:()=>false},
  addEventListener:(t,f)=>{(manejadores[t]=manejadores[t]||[]).push(f)},
  getElementById:()=>null,getElementsByTagName:()=>[]
 };
 const window={document};
 vm.runInNewContext(leer('js/a11y.js'),{window,document,setTimeout,Object});
 return manejadores;
}
function tecla(h,el,key,extra){
 let prevenido=false;
 const e=Object.assign({key,target:el,defaultPrevented:false,preventDefault(){prevenido=true}},extra||{});
 h.keydown.forEach(f=>f(e));
 return prevenido;
}
const el=(tag,attrs)=>({nodeType:1,tagName:tag,clicks:0,click(){this.clicks++},getAttribute(k){return k in attrs?attrs[k]:null}});

test('Delegador de teclado: Enter y Espacio activan solo lo marcado; nativos y otros no disparan doble',()=>{
 const h=cargarA11y();
 const marcado=el('DIV',{role:'button','data-a11y-kb':'1'});
 assert.equal(tecla(h,marcado,'Enter'),true);assert.equal(marcado.clicks,1);
 assert.equal(tecla(h,marcado,' '),true);assert.equal(marcado.clicks,2);
 tecla(h,marcado,'Enter',{repeat:true});assert.equal(marcado.clicks,2,'no repite al mantener pulsada');
 const nativo=el('BUTTON',{'data-a11y-kb':'1'});
 tecla(h,nativo,'Enter');assert.equal(nativo.clicks,0,'un botón nativo ya activa solo con Enter/Espacio');
 const ajeno=el('DIV',{role:'button'});
 tecla(h,ajeno,'Enter');assert.equal(ajeno.clicks,0,'no actúa sobre elementos que no marcó');
 tecla(h,marcado,'a');tecla(h,marcado,'Tab');assert.equal(marcado.clicks,2,'otras teclas se ignoran');
 tecla(h,marcado,'Enter',{ctrlKey:true});tecla(h,marcado,'Enter',{defaultPrevented:true});
 assert.equal(marcado.clicks,2,'con Ctrl o si otro manejador ya actuó, no hace nada');
});
