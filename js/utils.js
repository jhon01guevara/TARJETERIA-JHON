/* Utilidades puras compartidas (Fase 10, primera extracción de js/app.js).
   Estas líneas se movieron TAL CUAL desde js/app.js, sin cambiar lógica.
   Se carga como script clásico (sin ES modules) justo ANTES de js/app.js, así que los
   símbolos siguen siendo globales: las funciones (function b64ToUtf8) son propiedades de
   window y las const ($, $$, uid, esc, fdate, ymd, hoy) son globales de script, visibles
   para app.js y para los scripts que se cargan después, igual que antes.
   Contiene: $ (getElementById), b64ToUtf8, $$ (moneda), uid, esc (escape HTML), fdate, ymd, hoy. */
const $=id=>document.getElementById(id);
function b64ToUtf8(b64){const bin=atob(b64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new TextDecoder('utf-8').decode(bytes)}
const $$=n=>'$'+(+n).toFixed(2);const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fdate=d=>d.split('-').reverse().join('/');const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const hoy=()=>ymd(new Date());
/* Fase 11 (extracción 4): formato de tamaños y normalización de texto, movidos TAL CUAL desde js/app.js.
   ext (extensión visible de un archivo del catálogo), tam y fmtKB (tamaño en KB/MB), shopN (texto sin tildes y en minúsculas).
   ext, tam y shopN son const (globales de script); fmtKB es function (propiedad de window), como antes. */
const ext=f=>(f.ext||'').toUpperCase()||'ARCHIVO';
const tam=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
const shopN=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function fmtKB(b){return b>=1048576?(b/1048576).toFixed(1)+' MB':Math.round(b/1024)+' KB'}
