const ST={investigando:["Investigando","#5d7075"],contactado:["Contactado","#2a6fdb"],muestra:["Muestra pedida","#8a4fd6"],comparacion:["En comparación","#c27b00"],seleccionado:["Seleccionado","#0e8a8a"],aprobado:["Aprobado para pedido","#1d7a44"],descartado:["Descartado","#b3261e"]};
const ROUTE=["investigando","contactado","muestra","comparacion","seleccionado","aprobado"];
const CERTS=["CE","FCC","RoHS","ISO 9001","FDA","UL","CPC","REACH","BSCI","SGS","Gold Supplier","Trade Assurance"];
const KEY="alibaba-research-v1";
let items=[],view="c",editId=null,certSel=new Set(),photos=[],cphotos=[],catSel=new Set(),selIds=new Set(),repSel=new Set();
const CATS=["Hogar y uso familiar","Carro, camioneta o camión","Empresa, oficina o taller","Industria, construcción o minería","Kit que cumpla requisitos de la CSS","Embarcación o trabajo marítimo"];
const $=id=>document.getElementById(id);
const SEED=[{"id":"p-aosi-hak7078","created":1760380000000,"name":"Botiquín primeros auxilios 110 pzs, bolsa Oxford poliéster negra (HAK7078-110-R)","url":"https://www.alibaba.com/product-detail/Custom-Portable-Travel-Camping-Black-Polyester_1600954359834.html","sup":"Hangzhou Aosi Healthcare Co., Ltd.","loc":"Hangzhou, Zhejiang, China","desc":"Bolsa de primeros auxilios personalizada, portátil, para viaje y camping, tela Oxford de poliéster negra con asa. Dispositivo médico Clase I, esterilización EO. Marca AOSI.","moq":1500,"unit":3.35,"cur":"PAB","ship":"","tiers":"1,500–4,999: B/. 3.35 · 5,000–9,999: B/. 2.85 · 10,000–29,999: B/. 2.75 · 30,000+: B/. 2.65","lead":"Envío promedio del proveedor: 38 días","sample":"B/. 10","rate":0,"st":"investigando","notes":"Empaque: 50 pzs/cartón, 35x34x39 cm, 13 kg bruto (aprox. 30 cartones y 1.4 m³ para el MOQ). Logo, empaque y gráficos personalizables desde 1,500 uds. Envío por definir con el proveedor. Reseña de ene 2025 reporta retraso en entrega: dejar plazos por escrito en la orden. Verificar registro sanitario para importar en Panamá. Tasa de despacho a tiempo 100%, tasa de disputas 0%.","certs":["CE","ISO 13485","MDR (UE)","Verificado Intertek"]},{"id":"p-gauke-nylon20x14","created":1760381000000,"name":"Gauke - Botiquín primeros auxilios manual, bolsa pequeña de nailon 20x14 cm con clip","url":"","sup":"GAUKE INTERNATIONAL TRADING CO.,LTD","loc":"Wuhan, Hubei, China","desc":"Botiquín de primeros auxilios manual con logotipo personalizable, bolsa pequeña de nailon de 20x14 cm con clip, para viajes y emergencias en el hogar. Clase I, marca GUAKE. Colores: rojo, azul, verde, blanco, negro o personalizado.","moq":1000,"unit":1.22,"cur":"PAB","ship":"","tiers":"1,000–4,999: B/. 1.22 · 5,000–199,999: B/. 1.11 · 200,000+: B/. 0.55","lead":"Envío promedio del proveedor: 61 días","sample":"No indicado en la página","rate":0,"st":"investigando","notes":"Fabricante con 9 años en Alibaba, 292 empleados, 81 líneas de producción, 9 inspectores QA/QC, capacidad de más de 20 millones de kits al año. Verificado por Intertek. Respuesta ≤4h, despacho a tiempo 100%, disputas 0%, calificación de tienda 5/5 (169). 500 vendidos.\nPersonalización: logo desde 2,000 conjuntos (mayor que el MOQ de 1,000, confirmar si con 1,000 se puede poner logo), empaque desde 1,000, gráficos desde 500.\nPaquete: 16x12x5 cm, 0.3 kg bruto, bolsa de polietileno. Vida útil 3 años, garantía 5 años.\nPor confirmar: la página no dice qué piezas trae el kit ni cuántas; el salto de precio a B/. 0.55 desde 200,000 uds es muy grande; el tipo de certificado ISO y el número de certificado CE; envío por definir.\nSolo 1 reseña del producto (distribuidor de EE. UU., 5.0, jul 2026).","certs":["CE","ISO","BSCI","MDR (UE)","Verificado Intertek"],"cats":["Hogar y uso familiar","Carro, camioneta o camión"]}];
function pDb(){try{const P=window.parent;if(!P||P===window)return null;if(typeof P.__panelBridge==="function")return P.__panelBridge().db||null;return null}catch(e){return null}}
function pAdmin(){try{const P=window.parent;if(!P||P===window)return false;if(typeof P.__panelBridge==="function")return !!P.__panelBridge().admin;return false}catch(e){return false}}
function fsReady(){return !!(pDb()&&pAdmin())}
function fsBadge(on){const e=document.getElementById("fsBadge");if(e)e.textContent=on?"☁️ Sincronizado con la nube (se comparte entre dispositivos)":"💾 Guardado solo en este dispositivo (sin conexión a la nube)"}
let _fsDocs=[],_fsFotos=new Map(),_fsPh=new Map(),_fsFirst=true,_cfgT=null;
function hashStr(s){s=String(s||"");let x=5381;for(let i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))|0;return s.length+":"+x}
function fsErr(e,what){window._fsFail=(window._fsFail||0)+1;window._fsCode=(e&&e.code)||(e&&e.message)||"error";window._fsDet=window._fsDet||[];if(window._fsDet.length<4)window._fsDet.push((what||"")+" → "+((e&&e.message)||e));console.warn("Investigación: no se pudo sincronizar"+(what?" "+what:"")+" con la nube.",e);const b=document.getElementById("fsBadge");if(b)b.textContent="⚠️ No se pudo sincronizar con la nube ("+window._fsCode+"). Se guardó en este dispositivo."}
/* Cada producto se guarda en la nube como un documento de TEXTO (precios, CBM, comisión, notas...) y cada foto en
   su propio documento (f__<id>__p0, f__<id>__c0...). Así el límite de 1 MB de Firestore ya no deja fuera del
   sincronizado a los productos con muchas fotos. Los ajustes (contenedores, tarifa, % de tarjeta) van en cfg__ajustes. */
function fsCompose(){
  const local=new Map(items.map(p=>[p.id,p])),out=[];
  _fsDocs.forEach(d=>{
    const o={...d},fp=_fsFotos.get(d.id)||{p:[],c:[]},lo=local.get(d.id)||{};let inc=false;
    [["p","photos","nP"],["c","certPhotos","nC"]].forEach(([k,f,nk])=>{
      const legacy=Array.isArray(d[f])?d[f]:[],n=typeof d[nk]==="number"?d[nk]:legacy.length,loc=Array.isArray(lo[f])?lo[f]:[],arr=[];
      for(let i=0;i<n;i++){const s=fp[k][i]||legacy[i]||loc[i];if(s)arr.push(s);else inc=true}
      o[f]=arr});
    if(inc)o._inc=true;
    out.push(o)});
  return out}
function canon(v){if(Array.isArray(v))return"["+v.map(canon).join(",")+"]";if(v&&typeof v==="object")return"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canon(v[k])).join(",")+"}";return JSON.stringify(v===undefined?null:v)}
let _fsTxtH=new Map();
const txtHash=o=>{const r={...o};["photos","certPhotos","_inc","upd","nP","nC"].forEach(k=>delete r[k]);return hashStr(canon(r))};
/* Lee una foto instantánea de la nube. merge=true: lo que solo existe en este dispositivo (o es más nuevo aquí) se conserva y se sube. */
function fsIngest(sn,merge){
  _fsDocs=[];_fsFotos=new Map();_fsPh=new Map();_fsTxtH=new Map();window._fsIds=new Set();let cfg=null,nPh=0;
  sn.docs.forEach(d=>{const x=d.data()||{};
   if(x._foto){const e=_fsFotos.get(x.pid)||{p:[],c:[]};if(e[x.k])e[x.k][x.i]=x.d;_fsFotos.set(x.pid,e);_fsPh.set(d.id,hashStr(x.d));nPh++}
   else if(x._cfg){cfg=x}
   else{x.id=x.id||d.id;_fsDocs.push(x);window._fsIds.add(d.id);_fsTxtH.set(x.id,txtHash(x))}});
  const localMap=new Map(items.map(p=>[p.id,p])),cloudIds=new Set(_fsDocs.map(d=>d.id));let comp=fsCompose(),push=false;
  if(merge){
   comp=comp.map(o=>{const lo=localMap.get(o.id);if(lo&&(+lo.upd||0)>(+o.upd||0)){push=true;return lo}return o});
   const extra=items.filter(p=>!cloudIds.has(p.id));if(extra.length)push=true;comp=comp.concat(extra)}
  items=comp;
  try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){}
  fsBadge(true);if(cfg)fsCfgApply(cfg);else fsCfgSave();render();
  if(push)fsSync();
  return{prod:_fsDocs.length,fotos:nPh}}
function fsListen(){if(!fsReady()||window._fsOn)return;window._fsOn=true;
 try{pDb().collection("investigacion_items").onSnapshot(sn=>{const m=_fsFirst;_fsFirst=false;fsIngest(sn,m)},
  err=>{console.warn("Investigación: error de la nube, usando copia local.",err);window._fsOn=false;const b=document.getElementById("fsBadge");if(b)b.textContent="⚠️ No se pudo leer la nube ("+((err&&err.code)||"error")+"). Se usa la copia de este dispositivo; reintentando…";setTimeout(fsListen,8000)})}catch(e){fsBadge(false)}
}
/* Limpia un documento antes de enviarlo: Firestore rechaza (invalid-argument) valores undefined, arreglos dentro de arreglos, nombres de campo vacíos o reservados. */
/* IMPORTANTE: esta página corre dentro de un iframe. Firestore (que vive en la ventana principal) rechaza como
   «custom Object» los objetos creados aquí. pObj() los vuelve a crear con el JSON de la ventana principal. */
function pObj(o){try{const P=window.parent;if(P&&P!==window&&P.JSON)return P.JSON.parse(JSON.stringify(o))}catch(e){}return o}
function fsClean(v,d){d=d||0;if(v===undefined||typeof v==="function")return undefined;if(v===null||typeof v!=="object")return(typeof v==="number"&&!isFinite(v))?null:v;
 if(Array.isArray(v)){if(v.some(Array.isArray))return JSON.stringify(v);return v.map(x=>{const c=fsClean(x,d+1);return c===undefined?null:c})}
 if(d>15)return JSON.stringify(v);const o={};Object.keys(v).forEach(k=>{if(k===""||/^__.*__$/.test(k))return;const c=fsClean(v[k],d+1);if(c!==undefined)o[k]=c});return o}
function fsSize(o){try{return new Blob([JSON.stringify(o)]).size+200}catch(e){return JSON.stringify(o).length}}
function fsSync(){if(!fsReady())return Promise.resolve();window._fsFail=0;window._fsDet=[];const W=[];
 try{const col=pDb().collection("investigacion_items"),curIds=new Set(items.map(p=>p.id)),want=new Set();
  items.forEach(p=>{
   const P=p.photos||[],C=p.certPhotos||[],inc=!!p._inc,rest=JSON.parse(JSON.stringify(p));delete rest.photos;delete rest.certPhotos;delete rest._inc;
   if(!inc){rest.nP=P.length;rest.nC=C.length;
    [["p",P],["c",C]].forEach(([k,a])=>a.forEach((src,i)=>{const id="f__"+p.id+"__"+k+i;want.add(id);const hs=hashStr(src);
     if(_fsPh.get(id)===hs)return;
     if(String(src).length>950000){console.warn("Investigación: una foto es demasiado grande para la nube (más de ~950 KB); usa «Comprimir fotos guardadas».");return}
     _fsPh.set(id,hs);
     W.push(col.doc(id).set(pObj({_foto:true,pid:p.id,k,i,d:src})).catch(e=>{_fsPh.delete(id);fsErr(e,"una foto")}))}))}
   const th=txtHash(rest);if(_fsTxtH.get(p.id)!==th||!p.upd){p.upd=Date.now();_fsTxtH.set(p.id,th)}rest.upd=p.upd;
   const nm='"'+(p.name||p.id)+'"';
   if(typeof p.id!=="string"||!p.id||/\//.test(p.id)||/^__.*__$/.test(p.id)||p.id==="."||p.id===".."){fsErr({code:"id-invalido",message:"el id del producto no es válido: "+p.id},nm);return}
   const rs=fsClean(rest),sz=fsSize(rs);
   if(sz>1000000){fsErr({code:"doc-grande",message:"el producto ocupa ~"+Math.round(sz/1024)+" KB (máximo 1024 KB)"},nm);return}
   W.push(col.doc(p.id).set(pObj(rs)).catch(e=>fsErr(e,nm)))});
  _fsPh.forEach((hs,id)=>{const m=/^f__(.+)__([pc])(\d+)$/.exec(id);if(!m)return;const it=items.find(x=>x.id===m[1]);
   if(!it||(!want.has(id)&&!it._inc)){W.push(col.doc(id).delete().catch(()=>{}));_fsPh.delete(id)}});
  (window._fsIds||new Set()).forEach(id=>{if(!curIds.has(id))W.push(col.doc(id).delete().catch(()=>{}))})
 }catch(e){fsErr(e)}
 return Promise.all(W)}
/* Botón «Sincronizar»: trae lo que haya en la nube, conserva lo propio de este dispositivo, lo sube y muestra el conteo. */
async function fsForce(){const b=document.getElementById("fsBadge");
 if(!fsReady()){alert("No hay conexión con la nube. Entra como administrador y recarga la página.");return}
 try{if(b)b.textContent="⏳ Sincronizando…";
  const sn=await pDb().collection("investigacion_items").get({source:"server"});
  const r=fsIngest(sn,true);await fsSync();
  const sn2=await pDb().collection("investigacion_items").get({source:"server"});let np=0,nf=0;sn2.docs.forEach(d=>{const x=d.data()||{};if(x._foto)nf++;else if(!x._cfg)np++});
  if(window._fsFail>0||np<items.length){const c=window._fsCode||"error",bd=document.getElementById("fsBadge");if(bd)bd.textContent="⚠️ No se pudo subir a la nube ("+c+"). Se guardó en este dispositivo.";
   alert("NO se pudo subir todo a la nube.\n\nEn la nube: "+np+" producto(s) y "+nf+" foto(s).\nEn este dispositivo: "+items.length+" producto(s).\nError de Firebase: "+c+(c==="permission-denied"?"\n\nCausa: las reglas de Firestore no dejan escribir en la colección «investigacion_items». Agrega esa regla en Firebase Console > Firestore Database > Reglas y publícala.":"\n\nDetalle: "+((window._fsDet||[]).join(" | ")||"(sin detalle)")));return}
  fsBadge(true);alert("Sincronizado.\n\nEn la nube: "+np+" producto(s) y "+nf+" foto(s).\nEn este dispositivo: "+items.length+" producto(s).")}
 catch(e){fsErr(e,"(sincronización manual)");alert("No se pudo sincronizar: "+((e&&e.code)||(e&&e.message)||"error")+". Revisa tu conexión o los permisos de Firestore.")}}
/* Botón «Refrescar página»: sube lo pendiente, borra la copia en caché de la app y recarga para traer la versión más nueva. */
async function hardReload(){const b=document.getElementById("fsBadge");if(b)b.textContent="⏳ Subiendo cambios y actualizando la página…";
 try{if(fsReady())await Promise.race([fsSync(),new Promise(r=>setTimeout(r,8000))])}catch(e){}
 try{const P=window.parent;if(P.navigator.serviceWorker){const rs=await P.navigator.serviceWorker.getRegistrations();for(const r of rs)await r.unregister()}if(P.caches){const ks=await P.caches.keys();for(const k of ks)await P.caches.delete(k)}}catch(e){}
 try{window.parent.location.reload()}catch(e){location.reload()}}
function fsCfgSave(){if(!fsReady())return;clearTimeout(_cfgT);_cfgT=setTimeout(()=>{try{const g=k=>{try{return localStorage.getItem(k)||""}catch(e){return""}};
  pDb().collection("investigacion_items").doc("cfg__ajustes").set(pObj({_cfg:true,vset:{c20:VSET.c20,c40:VSET.c40,c40hc:VSET.c40hc,div:VSET.div},tarifa:g("alibaba-flete-tarifa"),unidad:g("alibaba-flete-unidad"),tcPct:g("alibaba-tc-pct"),ts:Date.now()})).catch(e=>fsErr(e,"los ajustes"))}catch(e){}},700)}
function fsCfgApply(c){try{const v=c.vset||{};["c20","c40","c40hc"].forEach(k=>{if(Array.isArray(v[k])&&v[k].length===3&&v[k].every(x=>+x>0))VSET[k]=v[k].map(Number)});if(+v.div>0)VSET.div=+v.div;
  try{localStorage.setItem("alibaba-cbm-settings",JSON.stringify(VSET));if(typeof c.tarifa==="string")localStorage.setItem("alibaba-flete-tarifa",c.tarifa);if(c.unidad)localStorage.setItem("alibaba-flete-unidad",c.unidad);if(c.tcPct)localStorage.setItem("alibaba-tc-pct",String(c.tcPct))}catch(e){}
  if(!$("ovForm").classList.contains("open")&&$("vSet"))drawVSet()}catch(e){}}
function load(){try{const r=localStorage.getItem(KEY);if(r){items=JSON.parse(r)||[]}else if(!fsReady()){items=JSON.parse(JSON.stringify(SEED));save()}}catch(e){items=fsReady()?[]:JSON.parse(JSON.stringify(SEED))}
 fsBadge(fsReady());if(fsReady())fsListen();else if(!window._fsPoll)window._fsPoll=setInterval(()=>{if(fsReady()){clearInterval(window._fsPoll);window._fsPoll=null;fsBadge(true);fsListen()}},1500)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){alert("No se pudo guardar: el navegador se quedó sin espacio. Usa menos fotos o más pequeñas, y exporta una copia de seguridad.")}fsSync()}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=u=>/^https?:\/\//i.test(u||"")?u:"";
const calc=p=>{const moq=+p.moq||0,u=+p.unit||0,fr=(+p.inland||0)+(+p.intl||0),ex=fr+(+p.ship||0),t=moq*u;
  const pct=+p.tcPct||0,feeBase=p.tcBase==="prod"?t:t+ex,fee=(p.tcOn===true&&pct>0&&feeBase>0)?feeBase*pct/100:0;
  return{total:t,freight:fr,extra:ex+fee,fee,feeBase,pct,withShip:t+ex+fee,landed:moq?(t+ex+fee)/moq:0}};
const tcInputs=()=>({tcOn:$("f_tcOn").checked,tcPct:$("f_tcPct").value,tcBase:$("f_tcBase").value});
const hasCosts=p=>!!(+p.inland||+p.intl||+p.ship);
const INCO_H={EXW:"Precio en la fábrica o almacén del proveedor. Tú pagas todo lo demás: flete interno hasta el agente de carga, despacho de exportación, flete internacional y gastos en destino.",FCA:"El proveedor entrega la mercancía lista para exportar al transportista que tú designas, en un lugar acordado. Falta el flete internacional.",FOB:"El proveedor entrega la mercancía a bordo del buque en el puerto de origen, ya despachada para exportación. Normalmente falta el flete internacional y el seguro.",CFR:"El precio incluye el flete hasta el puerto de destino, pero no el seguro. Revisa gastos de descarga y entrega local.",CIF:"El precio incluye flete y un seguro mínimo hasta el puerto de destino. Revisa gastos de descarga y entrega local.",CPT:"Como CFR pero para cualquier medio de transporte: incluye el flete hasta el destino acordado, sin seguro.",CIP:"Como CPT, pero incluye seguro.",DAP:"El proveedor entrega en el lugar acordado en destino. Tú pagas el despacho de importación, aranceles e impuestos.",DDP:"El proveedor entrega con todo pagado, incluidos aranceles e impuestos de importación. Confirma qué cubre exactamente."};
const SYM={USD:"$",EUR:"€",CNY:"¥",PAB:"B/. "};
const money=(v,c)=>v?(SYM[c||"USD"]??"")+Number(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):"—";
const stars=n=>n?"★".repeat(n)+"☆".repeat(5-n):"";

function render(){
  const q=$("q").value.trim().toLowerCase(),fs=$("fs").value,fc=$("fc").value,so=$("so").value;
  let list=items.filter(p=>(!fs||p.st===fs)&&(!fc||(p.cats||[]).includes(fc))&&(!q||[p.name,p.sup,p.notes,p.desc,p.loc,(p.certs||[]).join(" "),(p.cats||[]).join(" ")].join(" ").toLowerCase().includes(q)));
  const key={unit:p=>+p.unit||1e12,moq:p=>+p.moq||1e12,total:p=>calc(p).total||1e12,landed:p=>calc(p).landed||1e12};
  if(so==="new")list.sort((a,b)=>b.created-a.created);
  else if(so==="stage")list.sort((a,b)=>ROUTE.indexOf(b.st)-ROUTE.indexOf(a.st));
  else if(so==="rate")list.sort((a,b)=>(+b.rate||0)-(+a.rate||0));
  else list.sort((a,b)=>key[so](a)-key[so](b));
  items.forEach(p=>{if(p.st==="elegido")p.st="seleccionado"});drawRoute();const sel=items.filter(p=>p.st==="aprobado").length,act=items.filter(p=>p.st!=="descartado").length;
  $("stats").innerHTML=`<div class="stat"><b>${items.length}</b><span>productos guardados</span></div><div class="stat"><b>${act}</b><span>siguen en evaluación</span></div><div class="stat"><b>${sel}</b><span>aprobados para pedido</span></div>`;
  if(!list.length){$("out").innerHTML=`<div class="empty">${items.length?"Ningún producto coincide con el filtro.":"Aún no tienes productos. Pulsa “Agregar producto” y pega el link de Alibaba."}</div>`;return}
  $("out").innerHTML=view==="c"?`<div class="grid">${list.map(card).join("")}</div>`:table(list);
}
const fmt=(v,d)=>Number(v).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const cbmCalc=p=>volData(p);
function fsDelete(ids){if(!fsReady())return;try{const col=pDb().collection("investigacion_items");ids.forEach(id=>col.doc(id).delete().catch(e=>{console.warn("Investigación: no se pudo eliminar de la nube",e);alert("El producto se quitó de este dispositivo, pero no se pudo eliminar de la nube (revisa los permisos de Firestore). Puede reaparecer al recargar.")}))}catch(e){}}
function delItems(ids){const L=items.filter(p=>ids.includes(p.id));if(!L.length)return false;
  const msg=L.length===1?'¿Eliminar "'+(L[0].name||"este producto")+'"? Esta acción no se puede deshacer.':"¿Eliminar "+L.length+" productos? Esta acción no se puede deshacer.";
  if(!confirm(msg))return false;
  items=items.filter(p=>!ids.includes(p.id));ids.forEach(id=>selIds.delete(id));save();fsDelete(ids);render();return true}
function drawSel(){selIds=new Set([...selIds].filter(id=>items.some(p=>p.id===id)));const n=selIds.size,b=$("selbar");b.hidden=!n;
  b.innerHTML=n?`<b>${n} seleccionado${n>1?"s":""}</b><button type="button" class="btn sm" id="sbRep">Informe de los seleccionados</button><button type="button" class="btn sm del" id="sbDel">Eliminar seleccionados</button><button type="button" class="btn sm" id="sbClr">Quitar selección</button>`:"";
  const vis=[...document.querySelectorAll("#out [data-sel]")],sa=$("selAll");if(sa)sa.checked=vis.length>0&&vis.every(c=>selIds.has(c.dataset.sel))}
const _rn0=render;render=function(){_rn0.apply(this,arguments);drawSel()};
function repList(){$("repPick").innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center"><b style="margin-right:6px">Productos a incluir (<span id="repCnt">${repSel.size}</span> de ${items.length})</b><button type="button" class="btn sm" data-rq="all">Todos</button><button type="button" class="btn sm" data-rq="none">Ninguno</button><button type="button" class="btn sm" data-rq="act">Sin descartados</button><button type="button" class="btn sm" data-rq="apr">Solo aprobados</button></div><div class="rp-pick">${items.map(p=>`<label><input type="checkbox" data-rp="${p.id}"${repSel.has(p.id)?" checked":""}><span>${esc(p.name||"Sin nombre")} <small>· ${(ST[p.st]||ST.investigando)[0]}</small></span></label>`).join("")}</div>`}
function repDraw(){repList();$("repBody").innerHTML=repHtml(repSel)}
function repTotals(L){const t={};let cbm=0,n=0;
  L.forEach(p=>{const m=p.cur||"USD",c=calc(p);t[m]=t[m]||{inv:0,pan:0,fl:0};t[m].inv+=c.total;t[m].pan+=c.withShip;t[m].fl+=c.freight;const z=cbmCalc(p);if(z){n++;cbm+=z.cbm}});
  const rows=Object.keys(t).map(m=>`<tr><td>${m}</td><td class="num">${money(t[m].inv,m)}</td><td class="num">${money(t[m].fl,m)}</td><td class="num"><b>${money(t[m].pan,m)}</b></td></tr>`).join("");
  return `<h3 style="margin-top:14px">Totales del informe</h3><table style="max-width:640px"><thead><tr><th>Moneda</th><th class="num">Inversión mínima</th><th class="num">Fletes cargados</th><th class="num">Total con fletes cargados</th></tr></thead><tbody>${rows}</tbody></table>${n?`<div class="rp-sm">Volumen estimado de los ${n} producto(s) con medidas y cantidad cargadas: <b>${fmt(cbm,3)} CBM</b>. Útil para pedir una cotización conjunta de flete.</div>`:""}`}
function cbmTable(p,m){const z=cbmCalc(p);
  if(!z)return `<div class="rp-sm" style="margin-top:6px">Cálculo de flete por volumen (CBM): faltan las medidas o la cantidad a cotizar.</div>`;
  const r=(a,b)=>b?`<tr><td>${a}</td><td class="num">${b}</td></tr>`:"",un=z.u==="cbm"?"CBM (m³)":"pie³",w=z.pc?"caja":"unidad";
  return `<table style="max-width:680px"><thead><tr><th>Cálculo del CBM y del flete por volumen</th><th class="num">Resultado</th></tr></thead><tbody>
${z.lines.map((l,i)=>r("Caja "+(i+1)+": "+fmt(l.L,1)+" × "+fmt(l.W,1)+" × "+fmt(l.H,1)+" cm"+(l.pc?" · "+fmt(l.pc,0)+" uds por caja":"")+" × "+fmt(l.n,0)+" cajas",fmt(l.cbm,3)+" CBM ("+fmt(l.unitCbm,4)+" por caja)")).join("")}
${z.cant?r("Cantidad cotizada",fmt(z.cant,0)+" unidades"):""}
${z.isBox?r("Cantidad total de cajas",fmt(z.boxes,0)):""}
${z.manual&&z.lines.length?r("CBM calculado por medidas",fmt(z.calcCbm,3)+" CBM (reemplazado manualmente)"):""}
<tr><th>Volumen total${z.manual?" (manual)":""}</th><th class="num">${fmt(z.cbm,3)} CBM (≈ ${fmt(z.pie3,2)} pie³)</th></tr>
${z.wt?r("Peso real total",fmt(z.wt,1)+" kg"):""}
${r("Peso volumétrico (largo × ancho × alto ÷ "+fmt(VSET.div,0)+")",fmt(z.volWt,1)+" kg")}
${z.wt?r("Peso cobrable (el mayor entre real y volumétrico)",fmt(z.chg,1)+" kg"):""}
${z.cont.map(c=>r("Ocupación de contenedor "+VNAME[c.k]+" ("+fmt(c.cap,1)+" CBM internos)",fmt(c.pct,1)+"%"+(c.n>1?" · "+c.n+" contenedores":""))).join("")}
${z.rate?r("Tarifa de tu agente de carga",money(z.rate,m)+" por "+un):""}
${z.perCbm?r("Costo por CBM",money(z.perCbm,m)+" por CBM"):""}
${z.cost?`<tr><th>Flete a Panamá estimado por volumen</th><th class="num">${money(z.cost,m)}</th></tr>`:`<tr><td colspan="2">Falta la tarifa del agente de carga para estimar el costo.</td></tr>`}
${z.cost?r("Flete por volumen, por caja",money(z.perBox,m)):""}
${z.cost&&z.cant?r("Flete por volumen, por unidad",money(z.perUnit,m)):""}
${+p.intl?r("Flete internacional usado en el desglose de costos",money(+p.intl,m)+(p.vAuto?" (sincronizado automáticamente con el CBM)":" (ingresado manualmente)")):""}
</tbody></table><div class="rp-sm">Estimado. En carga consolidada (LCL) los agentes suelen cobrar un mínimo y cargos locales; confirma con tu agente de carga. Las medidas de contenedor y el divisor de peso volumétrico son los de tus ajustes.</div>`}
function costLine(p){const a=[];if(p.inco)a.push(`<b>${esc(p.inco)}</b>${p.incoPlace?" "+esc(p.incoPlace):""}`);if(+p.inland)a.push("Flete interno "+money(+p.inland,p.cur));if(+p.intl)a.push("Flete a Panamá "+money(+p.intl,p.cur));if(+p.ship)a.push("Otros "+money(+p.ship,p.cur));{const cc=calc(p);if(cc.fee)a.push("Comisión tarjeta "+fmt(cc.pct,4)+"% "+money(cc.fee,p.cur))}const z=cbmCalc(p);if(z)a.push(fmt(z.cbm,3)+" CBM"+(z.cost?" · flete por volumen "+money(z.cost,p.cur):""));return a.length?`<div class="meta">${a.join(" · ")}</div>`:""}
function repHtml(ids){
  const L=items.filter(p=>ids.has(p.id));
  const fecha=new Date().toLocaleDateString("es",{day:"numeric",month:"long",year:"numeric"});
  const stn=p=>(ST[p.st]||ST.investigando)[0],cu=p=>p.cur||"USD",mq=v=>v?Number(v).toLocaleString("en-US"):"—",cnt=k=>L.filter(p=>p.st===k).length;
  let h=`<h2>Informe de investigación de productos</h2><div class="rp-sm">Generado el ${fecha} · ${L.length} producto(s) incluido(s)</div>`;
  if(!L.length)return h+"<p>Marca al menos un producto en la lista de arriba para generar el informe.</p>";
  h+=`<div class="rp-sm" style="margin-top:6px">Ruta: ${ROUTE.map(k=>ST[k][0]+" ("+cnt(k)+")").join(" → ")}${cnt("descartado")?" · Descartados ("+cnt("descartado")+")":""}</div>`;
  const S=L.slice().sort((a,b)=>(hasCosts(a)?calc(a).landed:1e12)-(hasCosts(b)?calc(b).landed:1e12));
  h+=`<h3 style="margin-top:16px">Comparación de costos</h3><div class="rp-wrap"><table><thead><tr><th>Producto</th><th>Proveedor</th><th>Incoterm</th><th>MOQ</th><th>P. unidad</th><th>Inversión mín.</th><th>Flete interno</th><th>Flete a Panamá</th><th>Otros</th><th>Total en Panamá</th><th>Puesto/ud</th><th>CBM</th><th>Flete por volumen</th><th>Etapa</th></tr></thead><tbody>${S.map(p=>{const c=calc(p),k=hasCosts(p),z=cbmCalc(p);return `<tr><td>${esc(p.name||"Sin nombre")}</td><td>${esc(p.sup)}</td><td>${esc(p.inco)||"—"}</td><td class="num">${mq(p.moq)}</td><td class="num">${money(+p.unit,cu(p))}</td><td class="num">${money(c.total,cu(p))}</td><td class="num">${money(+p.inland,cu(p))}</td><td class="num">${money(+p.intl,cu(p))}</td><td class="num">${money(+p.ship,cu(p))}</td><td class="num"><b>${k?money(c.withShip,cu(p)):"—"}</b></td><td class="num"><b>${k&&p.moq?money(c.landed,cu(p)):"—"}</b></td><td class="num">${z?fmt(z.cbm,3):"—"}</td><td class="num">${z&&z.cost?money(z.cost,cu(p)):"—"}</td><td>${stn(p)}</td></tr>`}).join("")}</tbody></table></div><div class="rp-sm">Ordenado de menor a mayor costo puesto por unidad; los productos sin fletes cargados quedan al final. Los montos están en la moneda de cada producto.</div>`;
  h+=repTotals(L);
  h+=L.map((p,i)=>{
    const c=calc(p),u=safeUrl(p.url),k=hasCosts(p),m=cu(p);
    const kv=(a,b)=>b?`<tr><th style="width:30%">${a}</th><td>${b}</td></tr>`:"";
    const ph=(a,t)=>(a&&a.length)?`<div class="rp-sm" style="margin-top:6px">${t}</div><div class="rp-ph">${a.map(x=>`<img src="${x}" alt="">`).join("")}</div>`:"";
    const ri=ROUTE.indexOf(p.st);
    return `<div class="rp-p"><h3>${i+1}. ${esc(p.name||"Sin nombre")}</h3>
<div class="rp-sm">Etapa: <b>${stn(p)}</b>${ri>=0?" ("+(ri+1)+" de 6)":""}</div>
<table>
${kv("Proveedor",esc(p.sup)+(p.loc?" · "+esc(p.loc):""))}
${kv("Link",u?`<a href="${esc(u)}">${esc(u)}</a>`:"")}
${kv("Descripción",esc(p.desc))}
${kv("Categorías de uso",esc((p.cats||[]).join("; ")))}
${kv("Certificaciones",esc((p.certs||[]).join(", ")))}
${kv("Incoterm",p.inco?`<b>${esc(p.inco)}</b>${p.incoPlace?" — "+esc(p.incoPlace):""}<div class="rp-sm">${esc(INCO_H[p.inco]||"")}</div>`:"No indicado")}
${kv("Cantidad mínima (MOQ)",p.moq?mq(p.moq)+" unidades":"")}
${kv("Precio por unidad",+p.unit?money(+p.unit,m)+" ("+m+")":"")}
${kv("Escalas de precio",esc(p.tiers))}
${kv("Tiempo de entrega",esc(p.lead))}
${kv("Muestra",esc(p.sample))}
${kv("Calificación del proveedor",+p.rate?stars(+p.rate):"")}
${kv("Notas",p.notes?`<span style="white-space:pre-wrap">${esc(p.notes)}</span>`:"")}
</table>
<table style="max-width:560px"><thead><tr><th>Desglose de costos del pedido mínimo</th><th class="num">Monto</th></tr></thead><tbody>
<tr><td>Producto (${mq(p.moq)} × ${money(+p.unit,m)})</td><td class="num">${money(c.total,m)}</td></tr>
<tr><td>Flete interno hasta bodega del agente de carga</td><td class="num">${money(+p.inland,m)}</td></tr>
<tr><td>Flete internacional puesto en Panamá</td><td class="num">${money(+p.intl,m)}</td></tr>
<tr><td>Otros costos (seguro, aranceles, impuestos, trámites)</td><td class="num">${money(+p.ship,m)}</td></tr>
<tr><th>Total puesto en Panamá</th><th class="num">${k?money(c.withShip,m):"—"}</th></tr>
<tr><th>Costo puesto por unidad</th><th class="num">${k&&p.moq?money(c.landed,m):"—"}</th></tr>
</tbody></table>
${cbmTable(p,m)}
${ph(p.photos,"Fotos del producto")}${ph(p.certPhotos,"Certificaciones")}</div>`}).join("");
  h+=`<p class="rp-sm" style="margin-top:18px">Los datos se ingresaron manualmente a partir de las páginas de Alibaba y de lo conversado con cada proveedor. Confirma precios, fletes, certificados y requisitos de importación antes de hacer el pedido.</p>`;
  return h;
}
function openRep(ids){repSel=new Set(Array.isArray(ids)&&ids.length?ids:items.filter(p=>p.st!=="descartado").map(p=>p.id));repDraw();$("ovRep").classList.add("open")}
const ICON={investigando:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',contactado:'<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z"/>',muestra:'<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>',comparacion:'<path d="M4 20V11M10 20V4M16 20v-8M22 20H2"/>',seleccionado:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',aprobado:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'};
const ic=(k,z)=>`<svg viewBox="0 0 24 24" width="${z||22}" height="${z||22}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]||""}</svg>`;
const avatar=p=>{const im=(p.photos||[])[0];return `<span class="av" draggable="true" data-pid="${p.id}" title="${esc(p.name||"Sin nombre")} (arrastra para cambiar de etapa)">${im?`<img src="${im}" alt="" draggable="false">`:esc((p.name||"?").trim().slice(0,2).toUpperCase())}</span>`};
function drawRoute(){
  const fs=$("fs").value,act=items.filter(p=>p.st!=="descartado"),by=k=>items.filter(p=>p.st===k);
  const pct=act.length?Math.round(act.reduce((a,p)=>a+Math.max(0,ROUTE.indexOf(p.st))/5,0)/act.length*100):0;
  $("route").innerHTML=`<div class="rt-h"><div><b>Ruta del proceso</b><span>Toca una etapa para filtrar · arrastra una foto para cambiar un producto de etapa</span></div><div class="prog" title="Avance promedio de los productos en evaluación"><em>Avance general ${pct}%</em><u><i style="width:${pct}%"></i></u></div></div>
<div class="jr">${ROUTE.map((k,i)=>{const L=by(k);return `<div class="stg${fs===k?" sel":""}" data-drop="${k}" style="--c:${ST[k][1]}"><button type="button" class="hd" data-r="${k}"><span class="ico">${ic(k)}</span><span class="nm"><small>Etapa ${i+1}</small>${ST[k][0]}</span><b class="ct">${L.length}</b></button><div class="dock">${L.length?L.slice(0,5).map(avatar).join("")+(L.length>5?`<span class="av more" data-r="${k}">+${L.length-5}</span>`:""):`<span class="emp">Suelta un producto aquí</span>`}</div></div>`}).join("")}</div>
<div class="rt-f"><button type="button" class="chip${fs==="descartado"?" on":""}" data-r="descartado" data-drop="descartado">Descartados (${by("descartado").length})</button>${fs?`<button type="button" class="chip" data-r="">Ver todos</button>`:""}</div>`}
function stepper(p){const cur=ROUTE.indexOf(p.st),off=p.st==="descartado";return `<div class="step${off?" off":""}" role="group" aria-label="Ruta del producto">${ROUTE.map((k,i)=>`<button type="button" class="${i<=cur?"done":""}${i===cur?" cur":""}" style="--c:${ST[k][1]}" data-id="${p.id}" data-stage="${k}" title="${ST[k][0]}" aria-label="${ST[k][0]}"><i>${i===cur?ic(k,13):""}</i></button>`).join("")}</div>`}
function stageBtns(p){if(p.st==="descartado")return `<button class="btn sm pri" data-id="${p.id}" data-stage="investigando">Reactivar</button>`;const n=ROUTE[Math.max(0,ROUTE.indexOf(p.st))+1];return (n?`<button class="btn sm pri" data-id="${p.id}" data-stage="${n}">Avanzar: ${ST[n][0]} ›</button>`:`<span class="tag ok">Listo para hacer el pedido</span>`)+`<button class="btn sm" data-id="${p.id}" data-stage="descartado">Descartar</button>`}
function card(p){
  const c=calc(p),s=ST[p.st]||ST.investigando,u=safeUrl(p.url);
  return `<article class="card${selIds.has(p.id)?" picked":""}" id="c-${p.id}" style="--st:${s[1]}">
  <div class="top"><label class="pk" title="Seleccionar para eliminar o para el informe"><input type="checkbox" data-sel="${p.id}"${selIds.has(p.id)?" checked":""}></label><h3 style="flex:1">${esc(p.name||"Sin nombre")}</h3><span class="badge">${ROUTE.indexOf(p.st)>=0?(ROUTE.indexOf(p.st)+1)+"/6 · ":""}${s[0]}</span></div>
  ${u?`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//,"").slice(0,60))}</a>`:""}
  <div class="meta">${esc(p.sup||"Proveedor sin nombre")}${p.loc?" · "+esc(p.loc):""} ${p.rate?`<span style="color:var(--hi)">${stars(+p.rate)}</span>`:""}</div>
  ${stepper(p)}
  ${thumbs(p,"p","")}
  ${p.desc?`<p class="desc">${esc(p.desc)}</p>`:""}
  <div class="nums">
    <div class="n"><span>MOQ</span><b>${p.moq?Number(p.moq).toLocaleString("en-US")+" uds":"—"}</b></div>
    <div class="n"><span>Precio por unidad</span><b>${money(+p.unit,p.cur)}</b></div>
    <div class="n hi"><span>Inversión mínima</span><b>${money(c.total,p.cur)}</b></div>
    <div class="n"><span>Total puesto en Panamá</span><b>${hasCosts(p)?money(c.withShip,p.cur):"—"}</b></div>
    <div class="n"><span>Puesto por unidad</span><b>${hasCosts(p)?money(c.landed,p.cur):"—"}</b></div>
  </div>
  ${costLine(p)}
  ${p.tiers?`<div class="meta">Escalas: ${esc(p.tiers)}</div>`:""}
  ${(p.cats||[]).length?`<div class="tags">${p.cats.map(x=>`<span class="tag cat">${esc(x)}</span>`).join("")}</div>`:""}
  <div class="tags">${(p.certs||[]).length?(p.certs).map(x=>`<span class="tag ok">${esc(x)}</span>`).join(""):`<span class="tag">Sin certificaciones</span>`}</div>
  ${thumbs(p,"c","Fotos de certificados")}
  <div class="meta">${p.lead?"Entrega: "+esc(p.lead):""}${p.lead&&p.sample?" · ":""}${p.sample?"Muestra: "+esc(p.sample):""}</div>
  ${p.notes?`<div class="meta" style="white-space:pre-wrap">${esc(p.notes)}</div>`:""}
  <div class="acts" style="flex-wrap:wrap">${stageBtns(p)}<button class="btn sm" data-e="${p.id}">Editar</button><button class="btn sm" data-d="${p.id}">Duplicar</button><button class="btn sm del" data-x="${p.id}">Eliminar</button></div>
  </article>`;
}
function table(list){
  return `<div class="tw"><table><thead><tr><th></th><th>Producto</th><th>Proveedor</th><th>MOQ</th><th>P. unidad</th><th>Incoterm</th><th>Inversión mín.</th><th>Fletes</th><th>Total en Panamá</th><th>Puesto/ud</th><th>Categorías</th><th>Certificaciones</th><th>Entrega</th><th>Estado</th><th></th></tr></thead><tbody>${list.map(p=>{const c=calc(p),u=safeUrl(p.url);return `<tr>
  <td><input type="checkbox" data-sel="${p.id}"${selIds.has(p.id)?" checked":""} aria-label="Seleccionar"></td>
  <td>${(p.photos||[])[0]?`<img class="tn" style="float:left;margin-right:8px;width:44px;height:44px" src="${p.photos[0]}" alt="Foto" data-pid="${p.id}" data-k="p" data-i="0">`:""}${u?`<a href="${esc(u)}" target="_blank" rel="noopener" style="color:var(--acc)">${esc(p.name||"Sin nombre")}</a>`:esc(p.name||"Sin nombre")}</td>
  <td>${esc(p.sup)} <span style="color:var(--hi)">${stars(+p.rate)}</span></td>
  <td class="num">${p.moq?Number(p.moq).toLocaleString("en-US"):"—"}</td>
  <td class="num">${money(+p.unit,p.cur)}</td>
  <td>${esc(p.inco)||"—"}</td>
  <td class="num"><b>${money(c.total,p.cur)}</b></td>
  <td class="num">${c.freight?money(c.freight,p.cur):"—"}</td>
  <td class="num">${hasCosts(p)?money(c.withShip,p.cur):"—"}</td>
  <td class="num">${hasCosts(p)?money(c.landed,p.cur):"—"}</td>
  <td>${esc((p.cats||[]).join("; "))||"—"}</td>
  <td>${esc((p.certs||[]).join(", "))||"—"}${thumbs(p,"c","")}</td>
  <td>${esc(p.lead)||"—"}</td>
  <td>${ROUTE.indexOf(p.st)>=0?(ROUTE.indexOf(p.st)+1)+"/6 · ":""}${(ST[p.st]||ST.investigando)[0]}</td>
  <td style="white-space:nowrap"><button class="btn sm" data-e="${p.id}">Editar</button> <button class="btn sm del" data-x="${p.id}">Eliminar</button></td></tr>`}).join("")}</tbody></table></div>`;
}
const MAXB=450*1024;
const dUrlBytes=s=>Math.floor((String(s).length-String(s).indexOf(",")-1)*3/4);
function encodeLimit(im,maxDim){let r=Math.min(1,maxDim/Math.max(im.width,im.height)),out=null;
  for(let t=0;t<9;t++){const c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.width*r));c.height=Math.max(1,Math.round(im.height*r));
    const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
    for(const q of [.85,.75,.65,.55,.45]){out=c.toDataURL("image/jpeg",q);if(dUrlBytes(out)<=MAXB)return out}
    r*=.85}
  return out}
function shrink(file,max){return new Promise(res=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);res(encodeLimit(im,max))};im.onerror=()=>{URL.revokeObjectURL(u);res(null)};im.src=u})}
function recompress(src){return new Promise(res=>{const im=new Image();im.onload=()=>res(encodeLimit(im,Math.max(im.width,im.height)));im.onerror=()=>res(null);im.src=src})}
async function shrinkAll(){const msg=$("bkMsg");let n=0,saved=0,tot=0;
  for(const p of items){for(const f of ["photos","certPhotos"]){const a=p[f]||[];for(let i=0;i<a.length;i++){const b0=dUrlBytes(a[i]);if(b0<=MAXB)continue;tot++;msg.textContent="Comprimiendo fotos… "+n+" de "+tot+" revisadas";const d=await recompress(a[i]);if(d&&dUrlBytes(d)<b0){saved+=b0-dUrlBytes(d);a[i]=d;n++}}}}
  if(n){save();render()}
  msg.textContent=n?"Listo: "+n+" foto(s) comprimidas a máx. 450 KB; ahorro de "+(saved/1048576).toFixed(1)+" MB. Se sincronizan con la nube.":"Todas las fotos ya pesan 450 KB o menos."}
async function addImgs(files,arr,max){for(const f of files){if(!f.type.startsWith("image/"))continue;const d=await shrink(f,max);if(d)arr.push(d)}drawPh()}
function drawPh(){[["phP",photos,"p"],["phC",cphotos,"c"]].forEach(([id,a,k])=>{$(id).innerHTML=a.map((src,i)=>`<div class="th"><img src="${src}" alt=""><button type="button" class="rm" data-k="${k}" data-i="${i}" aria-label="Quitar foto">×</button></div>`).join("")})}
const thumbs=(p,k,label)=>{const a=(k==="p"?p.photos:p.certPhotos)||[];return a.length?`<div>${label?`<div class="meta">${label}</div>`:""}<div class="ph">${a.map((src,i)=>`<img class="tn" src="${src}" alt="${label||"Foto del producto"}" data-pid="${p.id}" data-k="${k}" data-i="${i}">`).join("")}</div></div>`:""};
function drawCats(){$("cats").innerHTML=CATS.map(c=>`<button type="button" class="chip${catSel.has(c)?" on":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
function drawChips(){
  const all=[...new Set([...CERTS,...certSel])];
  $("certs").innerHTML=all.map(c=>`<button type="button" class="chip${certSel.has(c)?" on":""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
}
function liveCalc(){
  const o={moq:$("f_moq").value,unit:$("f_unit").value,ship:$("f_ship").value,inland:$("f_inland").value,intl:$("f_intl").value,...tcInputs()},c=calc(o),cur=$("f_cur").value;
  $("c1").textContent=money(c.total,cur);$("c2").textContent=hasCosts(o)?money(c.withShip,cur):"—";$("c3").textContent=hasCosts(o)&&o.moq?money(c.landed,cur):"—";
  $("incoHint").textContent=INCO_H[$("f_inco").value]||"";
  const tcTxt=(c.fee?`Comisión ${fmt(c.pct,4)}% sobre ${money(c.feeBase,cur)} = <b style="color:var(--ink)">${money(c.fee,cur)}</b> · Total con comisión: <b style="color:var(--ink)">${money(c.withShip,cur)}</b>${o.moq?" · Puesto por unidad: <b style=\"color:var(--ink)\">"+money(c.landed,cur)+"</b>":""}`:($("f_tcOn").checked?"Escribe el porcentaje de la comisión (y el precio, MOQ y fletes) para calcularla.":"Activa la casilla para sumar la comisión al total."));
  $("tcOut").innerHTML=tcTxt;$("tcOut2").innerHTML=tcTxt;
}
const FIELDS=["name","url","sup","loc","desc","moq","unit","cur","inco","incoPlace","inland","intl","ship","tiers","lead","sample","rate","st","notes","vLargo","vAncho","vAlto","vCant","vPorCaja","vPeso","vTarifa","vTarifaUnidad","vCajas","vCbmManual","tcPct","tcBase"];
const CBM_POR_PIE3=0.0283168466;
const VDEF={c20:[590,235,239],c40:[1203,235,239],c40hc:[1204,235,269],div:5000};
const VNAME={c20:"20 FT",c40:"40 FT",c40hc:"40 FT HC"};
let VSET=JSON.parse(JSON.stringify(VDEF));
try{const r=JSON.parse(localStorage.getItem("alibaba-cbm-settings")||"null");if(r){["c20","c40","c40hc"].forEach(k=>{if(Array.isArray(r[k])&&r[k].length===3&&r[k].every(x=>+x>0))VSET[k]=r[k].map(Number)});if(+r.div>0)VSET.div=+r.div}}catch(e){}
function vSave(){try{localStorage.setItem("alibaba-cbm-settings",JSON.stringify(VSET))}catch(e){}fsCfgSave()}
function volData(o){
  const L=+o.vLargo||0,W=+o.vAncho||0,H=+o.vAlto||0,cant=+o.vCant||+o.moq||0,pc=+o.vPorCaja||0,kg=+o.vPeso||0,rate=+o.vTarifa||0,u=o.vTarifaUnidad||"pie3",nBox=+o.vCajas||0,man=+o.vCbmManual||0;
  const ex=(Array.isArray(o.vExtra)?o.vExtra:[]).map(e=>({L:+e.L||0,W:+e.W||0,H:+e.H||0,n:+e.n||0,pc:+e.pc||0,kg:+e.kg||0})).filter(e=>e.L&&e.W&&e.H&&e.n);
  const mainOk=!!(L&&W&&H&&(nBox||cant));
  if(!mainOk&&!ex.length&&!man)return null;
  const lines=[];
  if(mainOk)lines.push({L,W,H,pc,kg,n:nBox||(pc?Math.ceil(cant/pc):cant),auto:!nBox});
  ex.forEach(e=>lines.push({...e,auto:false}));
  lines.forEach(l=>{l.unitCbm=l.L*l.W*l.H/1e6;l.cbm=l.unitCbm*l.n;l.volWt=l.L*l.W*l.H/(VSET.div||5000)*l.n;l.wt=l.kg?l.kg*l.n:0});
  const sum=k=>lines.reduce((s,l)=>s+l[k],0);
  const boxes=sum("n"),calcCbm=sum("cbm"),cbm=man||calcCbm,wt=sum("wt"),volWt=sum("volWt"),chg=Math.max(wt,volWt),pie3=cbm/CBM_POR_PIE3,unitCbm=lines.length?lines[0].unitCbm:0;
  const cost=rate?(u==="cbm"?cbm*rate:pie3*rate):0,perCbm=rate?(u==="cbm"?rate:rate/CBM_POR_PIE3):0;
  const cont=["c20","c40","c40hc"].map(k=>{const d=VSET[k],cap=d[0]*d[1]*d[2]/1e6;return{k,cap,pct:cbm/cap*100,n:Math.ceil(cbm/cap)}});
  return{L:lines.length?lines[0].L:0,W:lines.length?lines[0].W:0,H:lines.length?lines[0].H:0,cant,pc:lines.length?lines[0].pc:0,boxes,isBox:!!(pc||nBox||ex.length),lines,unitCbm,cbm,calcCbm,manual:!!man,pie3,wt,volWt,chg,rate,u,cost,perCbm,perBox:boxes?cost/boxes:0,perUnit:cant?cost/cant:0,cont}}
function linesHtml(z){if(!z.lines.length)return "";return `<div class="vscroll"><table class="vtb"><thead><tr><th>Caja</th><th>Medidas (cm)</th><th>Uds/caja</th><th>Cajas</th><th>CBM/caja</th><th>CBM total</th></tr></thead><tbody>${z.lines.map((l,i)=>`<tr><td>${i+1}</td><td>${fmt(l.L,1)}×${fmt(l.W,1)}×${fmt(l.H,1)}</td><td>${l.pc?fmt(l.pc,0):"—"}</td><td>${fmt(l.n,0)}${l.auto&&l.pc?" (auto)":""}</td><td>${fmt(l.unitCbm,4)}</td><td>${fmt(l.cbm,3)}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="3">Total calculado</td><td>${fmt(z.boxes,0)}</td><td></td><td>${fmt(z.calcCbm,3)}</td></tr>${z.manual?`<tr><td colspan="5">CBM total manual (se usa este)</td><td>${fmt(z.cbm,3)}</td></tr>`:""}</tfoot></table></div>`}
let vExtraArr=[];
function volInputs(){const g=i=>$(i).value;return{moq:g("f_moq"),vLargo:g("f_vLargo"),vAncho:g("f_vAncho"),vAlto:g("f_vAlto"),vCant:g("f_vCant"),vPorCaja:g("f_vPorCaja"),vPeso:g("f_vPeso"),vTarifa:g("f_vTarifa"),vTarifaUnidad:g("f_vTarifaUnidad"),vCajas:g("f_vCajas"),vCbmManual:g("f_vCbmManual"),vExtra:vExtraArr}}
function contHtml(z){return z.cont.map(c=>`<div>${VNAME[c.k]}: <b>${fmt(c.pct,1)}%</b>${c.n>1?" ("+c.n+" contenedores)":""}<div class="cbar"><i style="width:${Math.min(100,c.pct)}%"></i></div></div>`).join("")}
function volCalc(){
  const z=volData(volInputs()),out=$("volOut"),cur=$("f_cur").value;
  $("vCalcInfo").textContent=z&&z.lines.length?"Calculado por medidas: "+fmt(z.calcCbm,3)+" CBM"+(z.manual?" → usando manual: "+fmt(z.cbm,3)+" CBM":""):"Calculado por medidas: —";
  if(!z){out.textContent="Completa las medidas de la caja y la cantidad (o el MOQ / cantidad de cajas) para calcular el CBM y el flete.";return null}
  const c=calc({moq:$("f_moq").value,unit:$("f_unit").value,ship:$("f_ship").value,inland:$("f_inland").value,intl:$("f_intl").value,...tcInputs()}),hasUnit=+$("f_unit").value&&+$("f_moq").value;
  out.innerHTML=`${linesHtml(z)}<div style="color:var(--ink)"><b>${z.lines.length?fmt(z.boxes,0)+" "+(z.isBox?"cajas":"unidades")+" · ":""}${fmt(z.cbm,3)} CBM${z.manual?" (manual)":""}</b> (≈ ${fmt(z.pie3,2)} pie³)${z.cant?" para "+fmt(z.cant,0)+" uds":""}</div>
<div>Peso volumétrico: <b>${fmt(z.volWt,1)} kg</b> (largo × ancho × alto ÷ ${fmt(VSET.div,0)})${z.wt?` · Peso real: <b>${fmt(z.wt,1)} kg</b> · Cobrable: <b>${fmt(z.chg,1)} kg</b>`:""}</div>
<div style="margin-top:4px">Ocupación del contenedor:</div>${contHtml(z)}
<div>${z.cost?`Flete a Panamá por volumen: <b>${money(z.cost,cur)}</b> = ${fmt(z.cbm,3)} CBM × <b>${money(z.perCbm,cur)} por CBM</b> · ${money(z.perBox,cur)} por caja${z.cant?" · "+money(z.perUnit,cur)+" por unidad":""}`:"Falta la tarifa de tu agente de carga para estimar el flete."}</div>
${hasUnit?`<div class="vsum"><span>Producto <b>${money(c.total,cur)}</b></span>+<span>Flete interno <b>${+$("f_inland").value?money(+$("f_inland").value,cur):"—"}</b></span>+<span>Flete a Panamá <b>${+$("f_intl").value?money(+$("f_intl").value,cur):"—"}</b></span>${c.fee?`+<span>Comisión tarjeta <b>${money(c.fee,cur)}</b></span>`:""}=<span>Total <b>${money(c.withShip,cur)}</b></span><span>· Por unidad <b>${c.landed?money(c.landed,cur):"—"}</b></span></div>`:""}`;
  return z.cost||null}
function volApply(){const z=volData(volInputs());if(!z||!z.cost)return;$("f_intl").value=z.cost.toFixed(2);volCalc();liveCalc()}
function volAuto(){const z=volData(volInputs()),on=$("f_vAuto").checked&&z&&z.cost;$("f_intl").readOnly=!!on;if(on)$("f_intl").value=z.cost.toFixed(2);volCalc();liveCalc()}
function volGuardarTarifaDefault(){try{localStorage.setItem("alibaba-flete-tarifa",$("f_vTarifa").value||"")}catch(e){}try{localStorage.setItem("alibaba-flete-unidad",$("f_vTarifaUnidad").value)}catch(e){}fsCfgSave()}
function drawVSet(){const row=k=>`<div class="r"><b style="width:64px">${VNAME[k]}</b>${[0,1,2].map(i=>`<input type="number" min="1" data-vs="${k}" data-i="${i}" value="${VSET[k][i]}" aria-label="${VNAME[k]} ${["largo","ancho","alto"][i]}">`).join("")}<button type="button" class="btn sm" data-vr="${k}">Restablecer</button></div>`;
  $("vSet").innerHTML=`<details class="vset"><summary>Ajustes de contenedores y peso volumétrico</summary><div class="hint" style="margin:6px 0 0">Medidas internas del contenedor en cm (largo, ancho, alto).</div>${["c20","c40","c40hc"].map(row).join("")}<div class="r"><b>Peso volumétrico: largo × ancho × alto ÷</b><input type="number" min="1" data-vs="div" value="${VSET.div}" aria-label="Divisor de peso volumétrico"><button type="button" class="btn sm" data-vr="div">Restablecer</button></div></details>`}
$("vSet").addEventListener("input",e=>{const k=e.target.dataset.vs;if(!k)return;const v=+e.target.value;if(!(v>0))return;if(k==="div")VSET.div=v;else VSET[k][+e.target.dataset.i]=v;vSave();volAuto()});
$("vSet").addEventListener("click",e=>{const k=e.target.dataset.vr;if(!k)return;if(k==="div")VSET.div=VDEF.div;else VSET[k]=[...VDEF[k]];vSave();const open=e.target.closest("details").open;drawVSet();$("vSet").querySelector("details").open=open;volAuto()});
["f_vLargo","f_vAncho","f_vAlto","f_vCant","f_vPorCaja","f_vPeso","f_vCajas","f_vCbmManual","f_vTarifa","f_vTarifaUnidad","f_moq","f_unit","f_inland","f_ship","f_cur"].forEach(i=>$(i).addEventListener("input",()=>{if(i.startsWith("f_vT"))volGuardarTarifaDefault();volAuto()}));
$("f_intl").addEventListener("input",()=>volCalc());
const TCP=[["f_tcOn","f_tcOn2","checked"],["f_tcPct","f_tcPct2","value"],["f_tcBase","f_tcBase2","value"]];
function tcMirror(toSecond){TCP.forEach(([a,b,k])=>{if(toSecond)$(b)[k]=$(a)[k];else $(a)[k]=$(b)[k]})}
TCP.forEach(([a,b])=>[[a,false],[b,true]].forEach(([id,from2])=>["input","change"].forEach(ev=>$(id).addEventListener(ev,()=>{if(from2)tcMirror(false);else tcMirror(true);if($("f_tcPct").value!==undefined){try{localStorage.setItem("alibaba-tc-pct",$("f_tcPct").value||"")}catch(e){}fsCfgSave()}liveCalc();volCalc()}))));
$("f_vAuto").addEventListener("change",volAuto);
$("bVolUse").onclick=volApply;
$("bVCbmAuto").onclick=()=>{$("f_vCbmManual").value="";volAuto()};
function drawVExtra(){$("vExtraBox").innerHTML=vExtraArr.map((e,i)=>`<div class="vx" data-i="${i}"><b>Caja ${i+2}</b>${[["L","Largo"],["W","Ancho"],["H","Alto"],["n","Cant. cajas"],["pc","Uds/caja"],["kg","Kg/caja"]].map(([k,t])=>`<label>${t}<input type="number" min="0" step="any" data-k="${k}" value="${e[k]??""}"></label>`).join("")}<button type="button" class="btn sm" data-rm="${i}">Quitar</button></div>`).join("")}
$("vExtraBox").addEventListener("input",e=>{const r=e.target.closest(".vx");if(!r||!e.target.dataset.k)return;vExtraArr[+r.dataset.i][e.target.dataset.k]=e.target.value===""?"":+e.target.value;volAuto()});
$("vExtraBox").addEventListener("click",e=>{const i=e.target.dataset.rm;if(i===undefined)return;vExtraArr.splice(+i,1);drawVExtra();volAuto()});
$("bVExtra").onclick=()=>{vExtraArr.push({L:"",W:"",H:"",n:"",pc:"",kg:""});drawVExtra();volAuto()};
function openForm(id){
  editId=id||null;const p=items.find(x=>x.id===id)||{cur:"USD",st:"investigando",rate:0};
  $("mt").textContent=id?"Editar producto":"Nuevo producto";$("bDelP").style.display=id?"":"none";
  FIELDS.forEach(k=>$("f_"+k).value=p[k]??"");
  $("f_vAuto").checked=id?!!p.vAuto:true;
  $("f_tcOn").checked=id?p.tcOn===true:true;
  if(!$("f_tcBase").value)$("f_tcBase").value="all";
  if($("f_tcPct").value==="")$("f_tcPct").value=(()=>{try{return localStorage.getItem("alibaba-tc-pct")||"2.9033"}catch(e){return"2.9033"}})();
  tcMirror(true);
  if(!id){try{$("f_vTarifa").value=localStorage.getItem("alibaba-flete-tarifa")||""}catch(e){}try{$("f_vTarifaUnidad").value=localStorage.getItem("alibaba-flete-unidad")||"pie3"}catch(e){}}
  if(!$("f_vTarifaUnidad").value)$("f_vTarifaUnidad").value="pie3";
  vExtraArr=JSON.parse(JSON.stringify(p.vExtra||[]));drawVExtra();
  drawVSet();volAuto();
  certSel=new Set(p.certs||[]);$("f_cert").value="";photos=[...(p.photos||[])];cphotos=[...(p.certPhotos||[])];catSel=new Set(p.cats||[]);drawCats();drawPh();drawChips();liveCalc();
  $("ovForm").classList.add("open");$("f_name").focus();
}
function saveForm(){
  const o=editId?items.find(x=>x.id===editId):{id:"p"+Date.now()+Math.random().toString(36).slice(2,6),created:Date.now()};
  FIELDS.forEach(k=>{const v=$("f_"+k).value.trim();o[k]=["moq","unit","ship","inland","intl","rate","vLargo","vAncho","vAlto","vCant","vPorCaja","vPeso","vTarifa","vCajas","vCbmManual","tcPct"].includes(k)?(v===""?"":+v):v});
  o.vAuto=$("f_vAuto").checked;o.tcOn=$("f_tcOn").checked;
  o.vExtra=vExtraArr.filter(e=>+e.L&&+e.W&&+e.H&&+e.n).map(e=>({L:+e.L,W:+e.W,H:+e.H,n:+e.n,pc:+e.pc||0,kg:+e.kg||0}));
  $("f_cert").value.split(",").map(s=>s.trim()).filter(Boolean).forEach(c=>certSel.add(c));
  o.certs=[...certSel];o.cats=[...catSel];o.photos=photos;o.certPhotos=cphotos;
  if(!o.name&&!o.url){alert("Agrega al menos el nombre o el link del producto.");return}
  if(!editId)items.push(o);
  save();$("ovForm").classList.remove("open");render();
}
$("bNew").onclick=()=>openForm();
$("bCancel").onclick=()=>$("ovForm").classList.remove("open");
$("bSave").onclick=saveForm;
["f_moq","f_unit","f_ship","f_inland","f_intl","f_inco","f_cur"].forEach(i=>$(i).addEventListener("input",liveCalc));
$("certs").onclick=e=>{const c=e.target.dataset.c;if(!c)return;certSel.has(c)?certSel.delete(c):certSel.add(c);drawChips()};
$("out").onclick=e=>{
  const t=e.target,ed=t.dataset.e,dp=t.dataset.d,dl=t.dataset.x;
  const sg=t.closest("[data-stage]");if(sg){const pp=items.find(x=>x.id===sg.dataset.id);if(pp){pp.st=sg.dataset.stage;save();render()}return}
  if(t.classList.contains("tn")){const pp=items.find(x=>x.id===t.dataset.pid);const a=pp?(t.dataset.k==="p"?pp.photos:pp.certPhotos):null;if(a&&a[+t.dataset.i]){$("lbi").src=a[+t.dataset.i];$("lb").classList.add("open")}return}
  if(ed)openForm(ed);
  if(dp){const p=items.find(x=>x.id===dp);if(p){items.push({...p,id:"p"+Date.now(),created:Date.now(),name:p.name+" (copia)"});save();render()}}
  if(dl)delItems([dl]);
};
$("bP").onclick=()=>$("inP").click();$("bC").onclick=()=>$("inC").click();
$("inP").onchange=async e=>{await addImgs([...e.target.files],photos,900);e.target.value=""};
$("inC").onchange=async e=>{await addImgs([...e.target.files],cphotos,1300);e.target.value=""};
$("ovForm").addEventListener("click",e=>{const b=e.target.closest(".rm");if(!b)return;(b.dataset.k==="p"?photos:cphotos).splice(+b.dataset.i,1);drawPh()});
$("lb").onclick=()=>$("lb").classList.remove("open");
document.addEventListener("paste",async e=>{if(!$("ovForm").classList.contains("open"))return;const fs=[...((e.clipboardData&&e.clipboardData.files)||[])].filter(f=>f.type.startsWith("image/"));if(fs.length){e.preventDefault();await addImgs(fs,photos,900)}});
$("q").oninput=render;$("bRep").onclick=()=>openRep();
$("ovRep").addEventListener("change",e=>{const id=e.target.dataset&&e.target.dataset.rp;if(!id)return;e.target.checked?repSel.add(id):repSel.delete(id);$("repCnt").textContent=repSel.size;$("repBody").innerHTML=repHtml(repSel)});
$("ovRep").addEventListener("click",e=>{const q=e.target.dataset&&e.target.dataset.rq;if(!q)return;repSel=new Set(items.filter(p=>q==="all"||(q==="act"&&p.st!=="descartado")||(q==="apr"&&p.st==="aprobado")).map(p=>p.id));repDraw()});
$("out").addEventListener("change",e=>{const id=e.target.dataset&&e.target.dataset.sel;if(!id)return;e.target.checked?selIds.add(id):selIds.delete(id);const el=e.target.closest(".card,tr");if(el)el.classList.toggle("picked",e.target.checked);drawSel()});
$("selAll").onchange=e=>{document.querySelectorAll("#out [data-sel]").forEach(c=>{e.target.checked?selIds.add(c.dataset.sel):selIds.delete(c.dataset.sel);c.checked=e.target.checked;const el=c.closest(".card,tr");if(el)el.classList.toggle("picked",e.target.checked)});drawSel()};
$("selbar").onclick=e=>{const id=e.target.id;if(id==="sbDel")delItems([...selIds]);else if(id==="sbClr"){selIds.clear();render()}else if(id==="sbRep")openRep([...selIds])};
$("bDelP").onclick=()=>{if(editId&&delItems([editId]))$("ovForm").classList.remove("open")};$("bPrint").onclick=()=>window.print();$("bRepClose").onclick=()=>$("ovRep").classList.remove("open");
$("fs").onchange=render;$("fc").onchange=render;$("route").onclick=e=>{const a=e.target.closest(".av[data-pid]");if(a){$("fs").value="";$("fc").value="";$("q").value="";render();const c=document.getElementById("c-"+a.dataset.pid);if(c){c.scrollIntoView({behavior:"smooth",block:"center"});c.classList.add("flash");setTimeout(()=>c.classList.remove("flash"),1600)}return}const b=e.target.closest("[data-r]");if(!b)return;$("fs").value=b.dataset.r;render()};
let dragId=null;
$("route").addEventListener("dragstart",e=>{const a=e.target.closest&&e.target.closest(".av[data-pid]");if(!a)return;dragId=a.dataset.pid;e.dataTransfer.setData("text/plain",dragId);e.dataTransfer.effectAllowed="move"});
$("route").addEventListener("dragover",e=>{const d=e.target.closest("[data-drop]");if(!d||!dragId)return;e.preventDefault();d.classList.add("over")});
$("route").addEventListener("dragleave",e=>{const d=e.target.closest("[data-drop]");if(d&&!d.contains(e.relatedTarget))d.classList.remove("over")});
$("route").addEventListener("drop",e=>{const d=e.target.closest("[data-drop]");if(!d||!dragId)return;e.preventDefault();const p=items.find(x=>x.id===dragId);dragId=null;if(p){p.st=d.dataset.drop;save();render()}});
document.addEventListener("dragend",()=>{dragId=null;document.querySelectorAll(".over").forEach(x=>x.classList.remove("over"))});$("cats").onclick=e=>{const c=e.target.dataset.cat;if(!c)return;catSel.has(c)?catSel.delete(c):catSel.add(c);drawCats()};$("so").onchange=render;
$("vC").onclick=()=>{view="c";$("vC").classList.add("on");$("vT").classList.remove("on");render()};
$("vT").onclick=()=>{view="t";$("vT").classList.add("on");$("vC").classList.remove("on");render()};
$("bData").onclick=()=>{$("dataTa").value="";$("bkMsg").textContent="";$("ovData").classList.add("open")};
$("bClose").onclick=()=>$("ovData").classList.remove("open");
$("bCopy").onclick=async()=>{try{await navigator.clipboard.writeText($("dataTa").value)}catch(e){$("dataTa").select();document.execCommand("copy")}};
$("bCsv").onclick=()=>{
  const h=["Nombre","Link","Proveedor","Ubicación","Descripción","MOQ","Precio unidad","Moneda","Inversión mínima","Incoterm","Flete interno","Flete internacional","Otros costos","Total puesto en Panamá","Costo puesto/ud","Escalas","Certificaciones","Categorías","Entrega","Muestra","Calificación","Estado","Notas"];
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  $("dataTa").value=[h.map(q).join(",")].concat(items.map(p=>{const c=calc(p);return[p.name,p.url,p.sup,p.loc,p.desc,p.moq,p.unit,p.cur,c.total,p.inco,p.inland,p.intl,p.ship,c.withShip,c.landed.toFixed(2),p.tiers,(p.certs||[]).join("; "),(p.cats||[]).join("; "),p.lead,p.sample,p.rate,(ST[p.st]||[""])[0],p.notes].map(q).join(",")})).join("\n");
};

/* ===== Respaldo con fotos ===== */
const BK_APP="alibaba-research-panel";
const cleanImg=a=>(Array.isArray(a)?a:[]).filter(x=>typeof x==="string"&&/^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+$/i.test(x));
const nPhotos=arr=>arr.reduce((n,p)=>n+((p.photos||[]).length)+((p.certPhotos||[]).length),0);
function buildBackup(){return{app:BK_APP,version:2,exported:new Date().toISOString(),theme:document.documentElement.dataset.theme||"blanco",items:items}}
function downloadBackup(){
  const data=JSON.stringify(buildBackup());
  const blob=new Blob([data],{type:"application/json"});
  const d=new Date(),pad=n=>String(n).padStart(2,"0");
  const name="respaldo-panel-alibaba-"+d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"_"+pad(d.getHours())+pad(d.getMinutes())+".json";
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
  $("bkMsg").textContent="Respaldo descargado: "+name+" ("+items.length+" productos, "+nPhotos(items)+" fotos, "+(data.length/1048576).toFixed(1)+" MB).";
}
function parseBackup(txt){
  const d=JSON.parse(txt);
  const arr=Array.isArray(d)?d:(d&&Array.isArray(d.items)?d.items:null);
  if(!arr)throw new Error("formato");
  const out=arr.filter(x=>x&&typeof x==="object"&&x.id).map(x=>{const o={...x};o.id=String(o.id);o.vExtra=Array.isArray(o.vExtra)?o.vExtra.map(e=>({L:+(e&&e.L)||0,W:+(e&&e.W)||0,H:+(e&&e.H)||0,n:+(e&&e.n)||0,pc:+(e&&e.pc)||0,kg:+(e&&e.kg)||0})):[];o.photos=cleanImg(o.photos);o.certPhotos=cleanImg(o.certPhotos);return o});
  if(!out.length)throw new Error("vacío");
  return{items:out,theme:(!Array.isArray(d)&&d.theme)||null};
}
function applyBackup(r,replace){
  if(replace){items=r.items}
  else{const m=new Map(items.map(x=>[x.id,x]));r.items.forEach(x=>m.set(x.id,x));items=[...m.values()]}
  save();render();
}
function importFromText(txt,fromFile){
  let r;
  try{r=parseBackup(txt)}catch(e){alert("El archivo o texto no es un respaldo válido. Debe ser un respaldo .json exportado desde este panel.");return false}
  if(!confirm("El respaldo trae "+r.items.length+" productos y "+nPhotos(r.items)+" fotos.\n\n¿Importarlo?"))return false;
  let replace=false;
  if(items.length&&confirm("Ya tienes "+items.length+" productos en este dispositivo.\n\nAceptar = REEMPLAZAR todo por el respaldo (lo actual se pierde)\nCancelar = FUSIONAR (se conserva lo actual y se suma el respaldo)"))replace=true;
  applyBackup(r,replace);
  if(r.theme&&THEMES.some(t=>t[0]===r.theme)){try{setTheme(r.theme,true)}catch(e){}}
  $("bkMsg").textContent="Importado: "+r.items.length+" productos y "+nPhotos(r.items)+" fotos ("+(replace?"reemplazo":"fusión")+"). Ahora tienes "+items.length+" productos.";
  return true;
}
$("bBkExp").onclick=downloadBackup;
$("bSync").onclick=fsForce;$("bReload").onclick=hardReload;
$("bShrink").onclick=shrinkAll;
$("bBkImp").onclick=()=>$("inBk").click();
$("inBk").onchange=async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  try{importFromText(await f.text(),true)}catch(err){alert("No se pudo leer el archivo.")}
};
$("bShow").onclick=()=>{$("dataTa").value=JSON.stringify(buildBackup())};
$("bImp").onclick=()=>{const t=$("dataTa").value.trim();if(!t){alert("Pega primero el texto del respaldo.");return}if(importFromText(t,false))$("dataTa").value=""};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("ovForm").classList.remove("open");$("ovData").classList.remove("open");$("lb").classList.remove("open");$("ovRep").classList.remove("open")}});
$("fs").innerHTML='<option value="">Todos los estados</option>'+Object.entries(ST).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join("");
$("f_st").innerHTML=Object.entries(ST).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join("");
const THEMES=[["blanco","Blanco","#ffffff"],["oscuro","Oscuro","#14222a"],["turquesa","Turquesa","#0e6b6b"],["azul","Azul","#1d5fd1"],["verde","Verde","#1b7a47"],["naranja","Naranja","#d9650b"],["violeta","Violeta","#6b3fc9"],["rosa","Rosa","#cc2a6a"]];
function setTheme(t,keep){document.documentElement.dataset.theme=t;[...$("sw").children].forEach(b=>b.classList.toggle("on",b.dataset.t===t));if(keep){try{localStorage.setItem("alibaba-theme",t)}catch(e){}}}
$("sw").innerHTML=THEMES.map(([id,n,c])=>`<button type="button" data-t="${id}" title="${n}" aria-label="Tema ${n}" style="background:${c}"></button>`).join("");
$("sw").onclick=e=>{const t=e.target.dataset.t;if(t)setTheme(t,true)};
let th="blanco";try{th=localStorage.getItem("alibaba-theme")||"blanco"}catch(e){}
setTheme(THEMES.some(x=>x[0]===th)?th:"blanco",false);
$("fc").innerHTML='<option value="">Todas las categorías</option>'+CATS.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
load();render();
