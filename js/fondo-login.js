/* Fase 21 (extracción 2): fondo personalizado del inicio de sesión (imagen HD o video): LBG, LBG_PRE, LBG_DEF y sus funciones lbg*.
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico, cargado justo ANTES de js/app.js; no usa ningún símbolo de app.js al cargarse
   (lo que usa de app.js lo usa dentro de funciones que se ejecutan después de cargar todo). Las const siguen siendo globales de script y las function, propiedades de window. */
// ---------- Fondo personalizado del inicio de sesión (imagen HD o video) ----------
const LBG={k:'tj_lbg',db:null,url:null,sig:''};
const LBG_PRE=[['medianoche','Medianoche','radial-gradient(120% 90% at 20% 0%,#2b3a7a 0%,#0b0e1a 62%)'],['oceano','Océano','linear-gradient(135deg,#0f2027,#203a43,#2c5364,#0f2027)'],['atardecer','Atardecer','linear-gradient(135deg,#ff512f,#dd2476 50%,#4a1c6b,#ff512f)'],['grafito','Grafito','linear-gradient(160deg,#111,#3a3a3c 55%,#111)'],['esmeralda','Esmeralda','linear-gradient(135deg,#06201a,#0f5b4a 50%,#06201a)']];
const LBG_DEF={mode:'aurora',dim:35,blur:0,url:'',kind:'',name:'',size:0,cts:0,cloud:null};
const lbgMeta=()=>{try{return Object.assign({},LBG_DEF,JSON.parse(localStorage.getItem(lsk(LBG.k))||'{}'))}catch(e){return Object.assign({},LBG_DEF)}};
const lbgSave=m=>{try{localStorage.setItem(lsk(LBG.k),JSON.stringify(m))}catch(e){window._tjw&&_tjw(e)}};
function lbgDb(){return new Promise((res,rej)=>{if(LBG.db)return res(LBG.db);let r;try{r=indexedDB.open(TJEmpresa.empLSKey('tj_loginbg'),1)}catch(e){return rej(e)}r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>{LBG.db=r.result;res(r.result)};r.onerror=()=>rej(r.error)})}
async function lbgPut(file){const d=await lbgDb();return new Promise((res,rej)=>{const t=d.transaction('f','readwrite');t.objectStore('f').put({blob:file,type:file.type,name:file.name,size:file.size},'bg');t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})}
async function lbgGet(){try{const d=await lbgDb();return await new Promise(res=>{const q=d.transaction('f').objectStore('f').get('bg');q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})}catch(e){return null}}
async function lbgDel(){try{const d=await lbgDb();await new Promise(res=>{const t=d.transaction('f','readwrite');t.objectStore('f').delete('bg');t.oncomplete=res;t.onerror=res})}catch(e){window._tjw&&_tjw(e)}}
const lbgIsVid=(u,t)=>/^video\//.test(t||'')||/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(u||'');
// Rellena un contenedor con el fondo configurado
async function lbgFill(el,m){if(!el)return;el.innerHTML='';el.style.background='';el.classList.remove('pre');
 const dim='<i class="lbgd" style="background:rgba(0,0,0,'+(m.dim/100)+')"></i>',fl=m.blur>0?'filter:blur('+m.blur+'px);transform:scale(1.12);':'';
 if(m.mode==='aurora'){return}
 const pr=LBG_PRE.find(x=>x[0]===m.mode);if(pr){el.style.background=pr[2];el.style.backgroundSize='220% 220%';el.classList.add('pre');el.innerHTML=dim;return}
 let src='',vid=false;
 if(m.mode==='file'){const f=await lbgGet();if(!f)return;if(LBG.url&&el.id==='lbg')URL.revokeObjectURL(LBG.url);src=URL.createObjectURL(f.blob);if(el.id==='lbg')LBG.url=src;vid=lbgIsVid(f.name,f.type)}
 else if(m.mode==='url'&&m.url){src=m.url;vid=m.kind?m.kind==='video':lbgIsVid(m.url)}
 if(!src)return;
 if(vid){el.innerHTML='<video src="'+esc(src)+'" autoplay muted loop playsinline preload="auto" style="'+fl+'"></video>'+dim;const v=el.querySelector('video');v.muted=true;v.play&&v.play().catch(()=>{})}
 else el.innerHTML='<img src="'+esc(src)+'" alt="" decoding="async" style="'+fl+'">'+dim}
async function lbgApply(){const o=document.getElementById('auth');if(!o)return;const m=lbgMeta();let L=document.getElementById('lbg');
 if(m.mode==='aurora'){if(L)L.remove();o.classList.remove('hasbg');LBG.sig='';return}
 const sig=JSON.stringify(m)+(m.mode==='file'?(LBG.fts||''):'');if(L&&LBG.sig===sig)return;
 if(!L){L=document.createElement('div');L.id='lbg';L.className='lbgv';o.insertBefore(L,o.firstChild)}
 o.classList.add('hasbg');LBG.sig=sig;await lbgFill(L,m)}
