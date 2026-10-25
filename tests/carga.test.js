const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Ejecuta js/app.js en un entorno simulado (sin navegador) y devuelve el error que lance al cargar.
// Un error aquí detiene todo el script: la página se ve, pero ningún botón responde.
function cargar(search){
  const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
  const src=leer('js/app.js');
  const mk=()=>{const f=function(){};const p=new Proxy(f,{
    get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>'';if(k==='then')return undefined;if(k==='length')return 0;if(k===Symbol.iterator)return function*(){};return p},
    apply:()=>p,construct:()=>p,set:()=>true,has:()=>true});return p};
  const U=mk(),store={};
  const ls={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:()=>null,length:0};
  const ctx={console:{log(){},warn(){},error(){},info(){}},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,
    localStorage:ls,sessionStorage:ls,navigator:U,
    location:{href:'https://x.github.io/app/'+search,search,protocol:'https:',hostname:'x.github.io',host:'x.github.io',pathname:'/app/',hash:'',origin:'https://x.github.io',replace(){}},
    document:U,firebase:U,history:U,Notification:U,URL,URLSearchParams,JSON,Math,Date,Promise,Intl,TextDecoder,TextEncoder,
    addEventListener(){},removeEventListener(){},matchMedia:()=>U,innerWidth:1200,screen:U,performance:{now:()=>0},crypto:U,indexedDB:U,caches:U,
    fetch:()=>Promise.resolve(U),Blob,speechSynthesis:U,AudioContext:U,IntersectionObserver:U,MutationObserver:U,ResizeObserver:U,Image:U,FileReader:U,
    atob,btoa,Uint8Array,ArrayBuffer};
  ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  /* El orden replica index.html: contexto + motor/vista de marketing + empresas
     + migración + utilidades (js/utils.js, Fase 10) + archivos extraídos en Fase 11, todos antes que app.js (que referencia sus funciones). */
  const previos=['js/empresa-contexto.js','js/mkt-editor.js','js/marketing.js','js/empresas.js','migraciones/migracion-multiempresa.js','js/utils.js','js/sanear.js'];
  try{
    for(const f of previos)vm.runInContext(leer(f),ctx,{filename:f});
    vm.runInContext(src,ctx,{filename:'js/app.js'});return null
  }catch(e){return e}
}

test('El panel carga sin errores al iniciar',()=>{
  const e=cargar('');
  assert.equal(e,null,e&&(e.name+': '+e.message));
});

test('La tienda pública (?tienda=1) carga sin errores al iniciar',()=>{
  const e=cargar('?tienda=1&v=admin');
  assert.equal(e,null,e&&(e.name+': '+e.message));
});
