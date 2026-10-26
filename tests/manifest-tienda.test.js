/* Etapa 3 — manifest propio de la tienda de otra empresa (js/manifest-tienda.js). Sin navegador: lógica con DOM simulado + comprobaciones estáticas.
   La prueba en Chrome real está en tests/navegador/manifest-tienda.js. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=R('index.html'),app=R('js/app.js'),mod=R('js/manifest-tienda.js');
const csp=(html.match(/Content-Security-Policy" content="([^"]*)"/)||[])[1]||'';
function cargar(extra){
 const link={attrs:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]}};
 const ctx=Object.assign({window:{},location:{href:'https://vencrm.com/index.html?tienda=1&emp=genuine'},Promise,JSON,Object,Array,Date,String,URL,encodeURIComponent,
  document:{head:{appendChild(e){e._puesto=1}},querySelector:s=>s==='link[rel=manifest]'?link:null,
   createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>({fillRect(){},drawImage(){},fillText(){}}),toDataURL:()=>'data:image/png;base64,AAAA'}:{setAttribute(){}}}},extra||{});
 ctx.window=ctx;ctx.Image=function(){setTimeout(()=>this.onerror&&this.onerror(),0);Object.defineProperty(this,'src',{set(){}})};
 vm.createContext(ctx);vm.runInContext(mod,ctx);return{ctx,link,M:ctx.TJManifestTienda};
}
test('CSP: solo se añadió manifest-src \'self\' data:; el resto (default-src, script-src, connect-src, object-src, frame-ancestors) igual',()=>{
 assert.match(csp,/manifest-src 'self' data:;/);
 assert.match(csp,/default-src 'self';/);assert.match(csp,/object-src 'none'/);assert.match(csp,/base-uri 'self'/);
 assert.doesNotMatch(csp,/manifest-src[^;]*(\*|https:|blob:|unsafe)/,'manifest-src no admite comodines ni otros orígenes');
 const sc=(csp.match(/script-src [^;]*/)||[''])[0];assert.doesNotMatch(sc,/data:|blob:|unsafe/);
});
test('index.html: manifest-tienda.js se carga una sola vez, clásico, con ?v= y antes de app.js; el manifest estático de siempre sigue',()=>{
 assert.equal(html.split('js/manifest-tienda.js?v=').length-1,1);
 assert.match(html,/<script src="js\/manifest-tienda\.js\?v=[a-z0-9-]+"><\/script>/);
 assert.ok(html.indexOf('js/manifest-tienda.js')<html.indexOf('js/app.js?v='));
 assert.match(html,/<link rel="manifest" href="manifest\.json">/);
 assert.match(R('sw.js'),/'js\/manifest-tienda\.js'/,'precacheado por el service worker');
});
test('app.js: solo otra empresa y solo con la plantilla cargada; la empresa inicial conserva su manifest',()=>{
 const f=app.slice(app.indexOf('function shopMetaEmpresa()'),app.indexOf('function shopBrandRefresh()'));
 assert.match(f,/if\(TJEmpresa\.empEsInicial\(\)\|\|typeof document==='undefined'\)return;/);
 assert.match(f,/if\(SH\.cfgOk&&typeof TJManifestTienda!=='undefined'\)TJManifestTienda\.aplicar\(\{emp:TJEmpresa\.empActiva\(\),nombre:nm,logo:ok\}\)/);
 assert.ok(f.indexOf("mf.remove()")<f.indexOf('TJManifestTienda.aplicar'),'primero se quita el manifest de Tarjetería, luego se pone el de la empresa');
});
test('construir: nombre, id, start_url y scope absolutos del mismo origen; íconos tal cual; nada de Tarjetería',()=>{
 const{M}=cargar();const ic=[{src:'data:image/png;base64,AA',sizes:'192x192',type:'image/png'}];
 const m=M.construir({emp:'genuine',nombre:'  Genuine <b>Parts</b> Panamá S.A. de C.V.  '},'https://vencrm.com/index.html?tienda=1&emp=genuine',ic);
 assert.equal(m.id,'tienda-genuine');assert.equal(m.start_url,'https://vencrm.com/index.html?tienda=1&emp=genuine');assert.equal(m.scope,'https://vencrm.com/');
 assert.ok(m.start_url.startsWith(m.scope));assert.equal(m.display,'standalone');assert.ok(m.name.length<=45&&!/[<>]/.test(m.name));assert.ok(m.short_name.length<=12);
 assert.deepEqual(m.icons,ic);assert.doesNotMatch(JSON.stringify(m),/Tarjeter|E0457B/i);
 const g=M.construir({emp:'genuine',nombre:''},'https://x.github.io/TARJETERIA-JHON/index.html?tienda=1&emp=genuine',[]);
 assert.equal(g.scope,'https://x.github.io/TARJETERIA-JHON/');assert.equal(g.name,'Tienda');
});
test('aplicar: crea el <link rel=manifest> data: con 3 íconos (192, 512, 512 maskable); sin logo usa la inicial; es idempotente',async()=>{
 const{M,link}=cargar();
 assert.equal(await M.aplicar({emp:'genuine',nombre:'Genuine',logo:''}),true);
 const h=link.attrs.href;assert.match(h,/^data:application\/manifest\+json;charset=utf-8,/);
 const j=JSON.parse(decodeURIComponent(h.split(',').slice(1).join(',')));
 assert.equal(j.name,'Genuine');assert.deepEqual(j.icons.map(i=>i.sizes+':'+i.purpose),['192x192:any','512x512:any','512x512:maskable']);
 assert.ok(j.icons.every(i=>/^data:image\/png;base64,/.test(i.src)));
 link.attrs.href='cambiado';assert.equal(await M.aplicar({emp:'genuine',nombre:'Genuine',logo:''}),true);assert.equal(link.attrs.href,'cambiado','misma firma: no repite el trabajo');
 await M.aplicar({emp:'genuine',nombre:'Genuine Parts',logo:''});assert.notEqual(link.attrs.href,'cambiado','cambió el nombre: se rehace');
});
test('aplicar: rechaza empresas inválidas o sin canvas, sin lanzar errores (la tienda sigue igual)',async()=>{
 let{M,link}=cargar();
 for(const emp of ['','ab','Mala Empresa','a--b','../x','x'.repeat(41)])assert.equal(await M.aplicar({emp,nombre:'X'}),false,emp);
 assert.equal(link.attrs.href,undefined);
 const c=cargar();c.ctx.document.createElement=()=>({getContext:()=>({fillRect(){},drawImage(){},fillText(){}}),toDataURL:()=>'data:,'});
 assert.equal(await c.M.aplicar({emp:'genuine',nombre:'G'}),false);assert.equal(c.link.attrs.href,undefined,'canvas sin PNG: no se pone manifest');
});
test('firma: cambia con el emp, el nombre o el logo',()=>{
 const{M}=cargar(),b={emp:'genuine',nombre:'G',logo:'data:image/png;base64,AAAA'};
 const f=M.firma(b);assert.notEqual(f,M.firma({...b,emp:'otra-emp'}));assert.notEqual(f,M.firma({...b,nombre:'H'}));assert.notEqual(f,M.firma({...b,logo:b.logo+'B'}));assert.equal(f,M.firma({...b}));
});
test('el módulo no usa red, almacenamiento ni service worker',()=>{
 const cod=mod.replace(/\/\*[\s\S]*?\*\//g,'');
 assert.doesNotMatch(cod,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|serviceWorker|caches\.|indexedDB|eval\(|innerHTML/);
});
