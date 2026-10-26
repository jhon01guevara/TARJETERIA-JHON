/* Comprobaciones estáticas (sin navegador, sin red, sin secretos) para CI y para correr a mano: `npm run comprobar`.
   Detecta lo que más rompe una publicación sin que `npm test` lo note:
   1. Sintaxis: todos los .js (js/, apps/, migraciones/, sw.js, tests/) compilan.
   2. Todo archivo local que cargan index.html y apps/*.html (script, link, img, iconos, manifest) EXISTE.
   3. Todo archivo que lista el service worker (PRE y MODELOS) EXISTE y los iconos de los manifest también.
   4. Los JSON (manifest*.json, firebase.json, apps/*.json) son válidos.
   5. Nada de lo que la app necesita queda excluido de Firebase Hosting por `firebase.json › hosting.ignore` (así vencrm.com no pierde archivos).
   6. (solo con --base=origen/main) AVISO si cambiaron archivos que guarda el service worker y no subió su versión (const V).
   Uso: node tests/herramientas/comprobar-estatico.js [--base=origin/main]   (0 bien · 1 hay errores; los avisos no fallan) */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
function comprobar(raiz,opc){
 opc=opc||{};const errores=[],avisos=[];
 const leer=f=>fs.readFileSync(path.join(raiz,f),'utf8');
 const existe=f=>fs.existsSync(path.join(raiz,f))&&fs.statSync(path.join(raiz,f)).isFile();
 const listar=(d,re,prof)=>{const o=[],a=path.join(raiz,d);if(!fs.existsSync(a))return o;for(const e of fs.readdirSync(a,{withFileTypes:true})){if(e.name==='node_modules'||e.name.startsWith('.'))continue;const r=path.posix.join(d,e.name);
   if(e.isDirectory()){if(prof>0)o.push(...listar(r,re,prof-1))}else if(re.test(e.name))o.push(r)}return o};
 const limpia=u=>u.replace(/[?#].*$/,'');
 const local=u=>u&&!/^(https?:|\/\/|data:|mailto:|tel:|javascript:|#|blob:)/i.test(u);
 /* 1. sintaxis */
 const js=[...listar('js',/\.js$/,2),...listar('apps',/\.js$/,2),...listar('migraciones',/\.js$/,1),...listar('tests',/\.js$/,3)];if(existe('sw.js'))js.push('sw.js');
 for(const f of js){try{new vm.Script(leer(f),{filename:f})}catch(e){errores.push('Error de sintaxis en '+f+': '+e.message)}}
 /* 2. archivos referenciados por las páginas */
 const paginas=['index.html',...listar('apps',/\.html$/,1)].filter(existe);const referenciados=new Set();
 for(const pg of paginas){const h=leer(pg),base='';/* apps/*.html se cargan con srcdoc dentro de index.html: sus rutas relativas parten de la raíz */
  const refs=[...h.matchAll(/<(?:script|img|source|video|audio)\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1])
   .concat([...h.matchAll(/<link\b[^>]*?\bhref\s*=\s*["']([^"']+)["']/gi)].map(m=>m[0].match(/\brel\s*=\s*["']([^"']+)["']/i)&&/canonical|alternate|dns-prefetch|preconnect/i.test(m[0].match(/\brel\s*=\s*["']([^"']+)["']/i)[1])?'':m[1]));
  for(const r of refs){if(!local(r))continue;const f=path.posix.normalize(path.posix.join(base,limpia(r)));referenciados.add(f);
   if(!existe(f))errores.push(pg+' carga «'+r+'» pero el archivo '+f+' no existe')}}
 /* 3. service worker */
 let swLista=[];
 if(existe('sw.js')){const sw=leer('sw.js');const pre=sw.match(/const PRE=\[([\s\S]*?)\];/),mod=sw.match(/const MODELOS='([^']+)'/);
  if(!pre)errores.push('sw.js: no se encontró la lista const PRE=[…]');
  else{swLista=[...pre[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);if(!swLista.length)errores.push('sw.js: la lista PRE está vacía')}
  if(mod)swLista.push(mod[1]);else errores.push('sw.js: no se encontró const MODELOS');
  if(!/const V='[^']+'/.test(sw))errores.push('sw.js: no se encontró const V (versión de la caché)');
  for(const u of swLista){if(!local(u))continue;const f=limpia(u);referenciados.add(f);if(!existe(f))errores.push('sw.js guarda «'+u+'» pero el archivo no existe')}
  const dup=swLista.filter((u,i)=>swLista.indexOf(u)!==i);if(dup.length)avisos.push('sw.js tiene entradas repetidas: '+[...new Set(dup)].join(', '))}
 /* 4. JSON y manifests */
 const jsons=[...listar('.',/\.json$/,0),...listar('apps',/\.json$/,1)].filter(f=>!/package-lock/.test(f));
 for(const f of jsons){try{const o=JSON.parse(leer(f));
   if(/^manifest.*\.json$/.test(f)){for(const i of (o.icons||[])){if(local(i.src)){referenciados.add(limpia(i.src));if(!existe(limpia(i.src)))errores.push(f+': el icono «'+i.src+'» no existe')}}
    for(const s of (o.shortcuts||[]))for(const i of (s.icons||[]))if(local(i.src)&&!existe(limpia(i.src)))errores.push(f+': el icono de atajo «'+i.src+'» no existe')}}
  catch(e){errores.push('JSON inválido en '+f+': '+e.message)}}
 for(const m of ['manifest.json','manifest-ven-crm.json'])if(existe(m))referenciados.add(m);
 /* 5. firebase.json › hosting.ignore no debe excluir nada que la app necesita */
 if(existe('firebase.json')){let fj={};try{fj=JSON.parse(leer('firebase.json'))}catch(e){}
  const ig=((fj.hosting||{}).ignore||[]);
  const aRe=g=>new RegExp('^'+g.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\*\//g,'§').replace(/\*\*/g,'¶').replace(/\*/g,'[^/]*').replace(/§/g,'(?:.*/)?').replace(/¶/g,'.*')+'$');
  const res=ig.map(g=>[g,aRe(g)]);
  for(const f of referenciados){if(!existe(f))continue;const x=res.find(([g,r])=>r.test(f));if(x)errores.push('Firebase Hosting NO publicaría «'+f+'» (lo excluye hosting.ignore «'+x[0]+'») y la app lo necesita: vencrm.com quedaría roto')}}
 /* 6. versión del service worker (solo con base git) */
 if(opc.base&&existe('sw.js')){
  const git=a=>spawnSync('git',a,{cwd:raiz,encoding:'utf8'});
  const d=git(['diff','--name-only',opc.base+'...HEAD']);
  if(d.status!==0)avisos.push('No se pudo comparar con '+opc.base+' (¿falta `git fetch`?): se omite el aviso de versión del service worker');
  else{const cambiados=d.stdout.split('\n').filter(Boolean),guardados=new Set(swLista.map(limpia));
   const tocados=cambiados.filter(f=>guardados.has(f));
   const v=t=>(t.match(/const V='([^']+)'/)||[])[1];const antes=git(['show',opc.base+':sw.js']).stdout;
   if(tocados.length&&antes&&v(antes)===v(leer('sw.js')))avisos.push('Cambiaron archivos que guarda el service worker ('+tocados.slice(0,4).join(', ')+(tocados.length>4?'…':'')+') y sw.js sigue en la versión «'+v(leer('sw.js'))+'»: suba el número de const V en sw.js para que los usuarios reciban la copia nueva')}}
 return {errores,avisos,archivos:{js:js.length,paginas:paginas.length,referenciados:referenciados.size,sw:swLista.length}};
}
module.exports={comprobar};
if(require.main===module){
 const base=(process.argv.find(a=>a.startsWith('--base='))||'').slice(7);
 const r=comprobar(path.resolve(__dirname,'..','..'),{base});
 console.log('Comprobaciones estáticas: '+r.archivos.js+' archivos JS, '+r.archivos.paginas+' páginas, '+r.archivos.referenciados+' archivos referenciados, '+r.archivos.sw+' en el service worker');
 r.avisos.forEach(a=>{console.log('AVISO: '+a);if(process.env.GITHUB_ACTIONS)console.log('::warning::'+a)});
 r.errores.forEach(e=>{console.log('ERROR: '+e);if(process.env.GITHUB_ACTIONS)console.log('::error::'+e)});
 console.log(r.errores.length?'\nFALLAN '+r.errores.length+' comprobaciones.':'\nTodo bien.');process.exit(r.errores.length?1:0);
}
