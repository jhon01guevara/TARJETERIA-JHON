/* Redes sociales y contacto de la tienda (Fase 11, extracción 2 de js/app.js).
   Estas líneas se movieron TAL CUAL desde js/app.js, sin cambiar lógica.
   Script clásico (sin ES modules) cargado justo ANTES de js/app.js: las function (redUrl, contLimpio)
   siguen siendo propiedades de window y las const (RED_DEF, RED_HOST, RED_SVG, CONT_DEF, redesLista)
   son globales de script, visibles para app.js igual que antes. Se queda en app.js el estado de la
   pantalla (RS_DRAFT, RS_MSG), el dibujo (redLink, shopRedes, shopContacto, redesCard...) y el CSS.
   Contiene: RED_DEF, RED_HOST, RED_SVG, CONT_DEF, redUrl, contLimpio y redesLista. */
const RED_DEF=[['tiktok','TikTok'],['instagram','Instagram'],['facebook','Facebook']];
const RED_HOST={tiktok:/^(?:[a-z0-9-]+\.)*tiktok\.com$/i,instagram:/^(?:[a-z0-9-]+\.)*instagram\.com$/i,facebook:/^(?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com)$/i};
const RED_SVG={
 tiktok:'<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.1 4.2 5 4.5"/>',
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
 facebook:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'};
const CONT_DEF=[['tel','Teléfono','+507 6074-1150'],['wa','WhatsApp (botón flotante)','60741150'],['email','Correo','ventas@ejemplo.com'],['dir','Dirección','Calle principal, Panamá Oeste'],['horario','Horario','Lunes a sábado, 9:00 a.m. a 6:00 p.m.']];
// Acepta @usuario, usuario o un link de la red; devuelve un link https seguro o '' si no es válido.
function redUrl(red,txt){
 let t=String(txt==null?'':txt).trim();if(!t||t.length>300||!RED_HOST[red])return'';
 if(/^[a-z][a-z0-9+.-]*:/i.test(t)){if(!/^https?:\/\//i.test(t))return''}
 else if(/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[\/?#]|$)/i.test(t))t='https://'+t;
 if(/^https?:\/\//i.test(t)){
  let u;try{u=new URL(t)}catch(e){return''}
  if(u.username||u.password||!RED_HOST[red].test(u.hostname))return'';
  u.protocol='https:';u.hash='';
  const id=u.searchParams.get('id');
  u.search=(/\/profile\.php$/i.test(u.pathname)&&/^\d{5,25}$/.test(id||''))?'?id='+id:'';
  return u.href
 }
 t=t.replace(/^@/,'');if(!/^[A-Za-z0-9._-]{1,60}$/.test(t))return'';
 return red==='tiktok'?'https://www.tiktok.com/@'+t:red==='instagram'?'https://www.instagram.com/'+t+'/':'https://www.facebook.com/'+t
}
// Datos de contacto: lo que no sea válido queda vacío (se vuelve a limpiar al leerlo en la tienda pública).
function contLimpio(c){
 c=c&&typeof c==='object'?c:{};
 const tx=(v,m)=>String(v==null?'':v).replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,m),o={};
 const tel=tx(c.tel,25);o.tel=/^[+\d][\d\s().-]{5,24}$/.test(tel)?tel:'';
 let w=String(c.wa==null?'':c.wa).replace(/\D/g,'');if(w.length===8)w='507'+w;o.wa=/^\d{10,15}$/.test(w)?w:'';
 const em=tx(c.email,120);o.email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)?em:'';
 o.dir=tx(c.dir,200);o.horario=tx(c.horario,150);
 return o
}
const redesLista=r=>{r=r&&typeof r==='object'?r:{};return RED_DEF.map(([k,n])=>[k,n,redUrl(k,r[k])]).filter(x=>x[2])};
