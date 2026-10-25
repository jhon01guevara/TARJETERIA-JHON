/* Fase 17: cintChk (barra «Modelos» de Inicio) lee apps/modelos-cintillo.json en vez de apps/modelos.html (que ya no trae los datos),
   sin descargar los 1,6 MB de apps/modelos.js; catalogo_default.zip está íntegro en el repo (el 404 solo ocurre en la copia de prueba). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {appTodo}=require('./helpers/app-fuentes.js');
const raiz=path.join(__dirname,'..');
const leer=f=>fs.readFileSync(path.join(raiz,f),'utf8');
const cint=JSON.parse(leer('apps/modelos-cintillo.json'));
function datosModelos(){
 const s=leer('apps/modelos.js');
 const i=s.indexOf('const IMGS = ')+13,j=s.indexOf('\n',i);const IMGS=JSON.parse(s.slice(i,j).replace(/;\s*$/,''));
 const k=s.indexOf('const DATA = `')+14;const DATA=s.slice(k,s.indexOf('`',k)).split('\n');
 return {IMGS,DATA};
}
test('Fase 17: apps/modelos-cintillo.json es pequeño y tiene los 30 primeros modelos con imagen, en el orden de apps/modelos.js',()=>{
 assert.ok(fs.statSync(path.join(raiz,'apps/modelos-cintillo.json')).size<200*1024,'pesa menos de 200 KB');
 const {IMGS,DATA}=datosModelos();
 const esperado=[];
 for(const l of DATA){const [c,cat,d]=l.split('|');if(c&&IMGS[c.trim()])esperado.push({n:c.trim(),s:(d||cat||'').trim()});if(esperado.length===30)break}
 assert.equal(cint.length,30);
 assert.deepEqual(cint.map(f=>({n:f.n,s:f.s})),esperado,'si cambia DATA o IMGS en apps/modelos.js, ejecuta python3 tests/herramientas/generar-cintillo.py');
 for(const f of cint)assert.match(f.i,/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/,f.n);
});
test('Fase 17: cintChk usa apps/modelos-cintillo.json (no modelos.html ni modelos.js)',()=>{
 const app=appTodo();
 const f=/async function cintChk\(\)\{[\s\S]*?\n\}?const cintCfg/.exec(app)[0];
 assert.match(f,/fetch\('apps\/modelos-cintillo\.json'/);
 assert.doesNotMatch(f,/appHtml|modelos\.html|modelos\.js|JSON\.parse\(h/);
});
test('Fase 17: cintChk devuelve los modelos válidos, cachea el resultado y no lanza si el JSON falla',async()=>{
 const app=appTodo();
 const src=/async function cintChk\(\)\{[\s\S]*?\n(?=const cintCfg)/.exec(app)[0];
 const mk=fetchImpl=>{const avisos=[];const ctx={_tjw:e=>avisos.push(e),fetch:fetchImpl,_chk:null,Array,String,Error};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src+';this.cintChk=cintChk',ctx);return {ctx,avisos}};
 let n=0;const a=mk(async u=>{n++;assert.equal(u,'apps/modelos-cintillo.json');return {ok:true,json:async()=>cint.concat([{n:'MALO',s:'x',i:'javascript:alert(1)'},null])}});
 const r=await a.ctx.cintChk();assert.equal(r.length,30);assert.equal(Object.keys(r[0]).sort().join(),'i,n,s');
 await a.ctx.cintChk();assert.equal(n,1,'segunda llamada sale de la memoria');assert.equal(a.avisos.length,0);
 const b=mk(async()=>({ok:false,status:404}));assert.equal((await b.ctx.cintChk()).length,0);assert.equal(b.avisos.length,1);
 const c=mk(async()=>{throw new Error('sin red')});assert.equal((await c.ctx.cintChk()).length,0);assert.equal(c.avisos.length,1);
});
test('Fase 17: sw.js precachea apps/modelos-cintillo.json (pequeño) y sigue sin precachear modelos.js',()=>{
 const sw=leer('sw.js');const pre=eval(/const PRE=(\[[^\]]*\])/.exec(sw)[1]);
 assert.ok(pre.includes('apps/modelos-cintillo.json'));assert.ok(!pre.some(u=>/modelos\.js/.test(u)));
 assert.match(sw,/const V='tj-net-first-(1[3-9]|[2-9]\d)'/);
});
test('Fase 17: la página sigue sin cargar modelos.js al inicio (index.html)',()=>{
 assert.doesNotMatch(leer('index.html'),/modelos\.js/);
 assert.match(leer('index.html'),/js\/app\.js\?v=[a-z0-9-]+/);
});
test('Fase 17: catalogo_default.zip existe en el repo, se pide desde la raíz y solo si la base local está vacía',()=>{
 assert.ok(fs.statSync(path.join(raiz,'catalogo_default.zip')).size>10e6);
 const app=appTodo();
 assert.match(app,/fetch\('catalogo_default\.zip'\)/);
 assert.match(app,/if\(existentes\.length\)return;/);
 assert.match(app,/if\(!\/\[\?&\]tienda\(=\|&\|\$\)\/\.test\(location\.search\)\)precargarCatalogoDeFabrica\(\)/);
});
