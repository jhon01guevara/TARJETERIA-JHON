/* Saneo de documentos públicos (Fase 11, extracción 1 de js/app.js).
   Estas líneas se movieron TAL CUAL desde js/app.js, sin cambiar lógica.
   Script clásico (sin ES modules) cargado justo ANTES de js/app.js: las function (sanLead, sanPed,
   sanGal, sanEnv) siguen siendo propiedades de window y las const (SAFE_ID, sTxt, sNum) son globales
   de script, visibles para app.js igual que antes. Solo se usan al ejecutarse funciones, nunca al cargar.
   Contiene: SAFE_ID, sTxt, sNum, sanLead, sanPed, sanGal y sanEnv (esta última estaba junto a las etiquetas de envío). */
// --- Saneo de documentos públicos (tienda_leads, tienda_pedidos, galería) ---
// Cualquiera puede crear un registro o un pedido sin iniciar sesión (y cualquier vendedor puede
// subir a la galería). Antes de dibujar esos datos en el panel se limpian aquí: el id solo puede
// tener el formato que genera nuestro propio código (uid()); los documentos con un id "raro" se
// descartan en vez de mostrarse (ese id se inserta directo en atributos onclick="...('ID')", y un
// id fabricado con comillas podría ejecutar código en la sesión de quien lo vea). Los textos se
// recortan a un largo razonable y los números se fuerzan a ser números de verdad.
const SAFE_ID=/^[A-Za-z0-9_-]{1,60}$/;
const sTxt=(v,n)=>String(v??'').slice(0,n||200);
const sNum=v=>{const n=+v;return Number.isFinite(n)?n:0};
function sanLead(d){if(!d||typeof d!=='object')return null;const id=String(d.id||'');if(!SAFE_ID.test(id))return null;
 return{id,name:sTxt(d.name,120),tel:sTxt(d.tel,40),email:sTxt(d.email,120),empresa:sTxt(d.empresa,120),dir:sTxt(d.dir,200),ref:sTxt(d.ref||'admin',60),ts:sNum(d.ts),imp:!!d.imp}}
function sanPed(d){if(!d||typeof d!=='object')return null;const id=String(d.id||'');if(!SAFE_ID.test(id))return null;const l=d.lead||{};
 const items=Array.isArray(d.items)?d.items.slice(0,200).map(i=>({id:sTxt(i&&i.id,80),n:sTxt(i&&i.n,200),p:sNum(i&&i.p),q:Math.max(0,Math.round(sNum(i&&i.q)))})):[];
 return{id,cid:sTxt(d.cid,80),lead:{name:sTxt(l.name,120),tel:sTxt(l.tel,40),email:sTxt(l.email,120),empresa:sTxt(l.empresa,120),dir:sTxt(l.dir,200)},items,total:sNum(d.total),nota:sTxt(d.nota,500),ref:sTxt(d.ref||'admin',60),ts:sNum(d.ts),estado:d.estado==='atendido'?'atendido':'nuevo',envio:sanEnv(d.envio)}}
function sanGal(d){if(!d||typeof d!=='object')return null;const id=String(d.id||'');if(!SAFE_ID.test(id))return null;
 const img=String(d.img||'');if(!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(img))return null;
 return Object.assign({},d,{id,img,t:sTxt(d.t,160),by:sTxt(d.by,80)})}
function sanEnv(v){if(!v||typeof v!=='object')return null;const o={};
 if(v.tipo)o.tipo=v.tipo==='internacional'?'internacional':'nacional';
 [['agencia',80],['fid',30],['rec',120],['rtel',40],['rced',30],['suc',100],['ref',200],['pais',60],['prov',80],['ciudad',80],['dir',200],['guia',60],['cont',300],['obs',200]].forEach(([k,n])=>{if(v[k]!=null&&String(v[k])!=='')o[k]=sTxt(v[k],n)});
 if(v.bultos!=null)o.bultos=Math.min(99,Math.max(1,Math.round(sNum(v.bultos))||1));
 if(sNum(v.peso)>0)o.peso=sNum(v.peso);
 if(sNum(v.etq)>0)o.etq=sNum(v.etq);
 return o}
