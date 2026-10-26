/* Manifest propio de la tienda de OTRA empresa (Etapa 3): la tienda se puede instalar como app con SU nombre y SU logo, no con los de Tarjetería.
   Hosting es estático (no hay servidor que genere un manifest por empresa), así que la propia página lo construye con los datos que la empresa ya publicó
   (nombre y logo de su plantilla) y lo enlaza como URL data: (los íconos, PNG generados con canvas, van dentro como data:image/png).
   La CSP solo necesitaba una directiva nueva, mínima: manifest-src 'self' data: (antes caía en default-src 'self'). El manifest es metadato inerte:
   no ejecuta nada y no abre conexiones nuevas. Solo se usa fuera de la empresa inicial (esa conserva manifest.json). Sin service worker: la tienda pública sigue sin SW.
   Si algo falla (sin canvas, logo ilegible) se usa la inicial de la empresa como ícono; si todo falla no se pone manifest y la tienda funciona igual.
   Script clásico, sin dependencias; expone window.TJManifestTienda. Guía: docs/MANIFEST-TIENDA.md */
(function(){
 'use strict';
 var ULT='',SLUG=/^[a-z0-9][a-z0-9-]{2,39}$/;
 function limpia(s,n){return String(s==null?'':s).replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,n)}
 function inicial(nombre){var c=limpia(nombre,80).charAt(0);return c?c.toUpperCase():'T'}
 /* Objeto manifest. start_url y scope absolutos: un manifest data: no tiene carpeta desde la que resolver rutas relativas. icons = [{src,sizes,type,purpose}] ya con su data:image/png. */
 function construir(o,base,icons){
  var emp=String(o&&o.emp||''),nombre=limpia(o&&o.nombre,45)||'Tienda';
  return {id:'tienda-'+emp,name:nombre,short_name:limpia(nombre,12),description:'Tienda en línea de '+nombre,lang:'es',
   start_url:new URL('index.html?tienda=1&emp='+encodeURIComponent(emp),base).href,scope:new URL('./',base).href,display:'standalone',orientation:'portrait-primary',
   background_color:'#ffffff',theme_color:'#18181b',categories:['shopping'],icons:icons||[]};
 }
 function firma(o){var l=String(o.logo||'');return [o.emp,limpia(o.nombre,45),l.length,l.slice(0,40),l.slice(-40)].join('|')}
 /* Dibuja el ícono: logo centrado sobre blanco si se pudo leer; si no, la inicial de la empresa en blanco sobre negro. margen = fracción libre alrededor (mayor en «maskable»). */
 function dibujar(tam,margen,img,nombre){
  var c=document.createElement('canvas');c.width=c.height=tam;var x=c.getContext('2d');
  if(img){x.fillStyle='#ffffff';x.fillRect(0,0,tam,tam);
   var iw=img.naturalWidth||tam,ih=img.naturalHeight||tam,a=tam*(1-2*margen),k=Math.min(a/iw,a/ih),w=iw*k,h=ih*k;
   x.drawImage(img,(tam-w)/2,(tam-h)/2,w,h)}
  else{var f=Math.round(tam*(0.58-margen));x.fillStyle='#18181b';x.fillRect(0,0,tam,tam);x.fillStyle='#ffffff';x.textAlign='center';x.textBaseline='alphabetic';
   x.font='700 '+f+'px Arial,Helvetica,sans-serif';x.fillText(inicial(nombre),tam/2,tam/2+f*0.36)}
  return c.toDataURL('image/png');
 }
 /* Lee el logo (data: o https:). Si su servidor no da permiso (CORS) el canvas quedaría «manchado»: se comprueba y se usa la inicial. */
 function cargarLogo(url){
  return new Promise(function(ok){
   if(!/^(data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,]|https:\/\/)/i.test(url||''))return ok(null);
   var i=new Image();i.crossOrigin='anonymous';
   i.onload=function(){try{var t=document.createElement('canvas');t.width=t.height=2;t.getContext('2d').drawImage(i,0,0,2,2);t.toDataURL();ok(i)}catch(e){ok(null)}};
   i.onerror=function(){ok(null)};i.src=url;
  });
 }
 function ponerLink(href){
  var l=document.querySelector('link[rel=manifest]');
  if(!l){l=document.createElement('link');l.rel='manifest';document.head.appendChild(l)}
  l.setAttribute('href',href);
 }
 /* o = {emp, nombre, logo}. Idempotente: no repite el trabajo si nada cambió. Devuelve una promesa (true si dejó el manifest puesto). */
 function aplicar(o){
  try{
   if(typeof document==='undefined')return Promise.resolve(false);
   o=o||{};if(!SLUG.test(String(o.emp||''))||/--/.test(o.emp))return Promise.resolve(false);
   var f=firma(o);if(f===ULT)return Promise.resolve(true);ULT=f;
   return cargarLogo(o.logo).then(function(img){
    var I=[{src:dibujar(192,0.08,img,o.nombre),sizes:'192x192',type:'image/png',purpose:'any'},{src:dibujar(512,0.08,img,o.nombre),sizes:'512x512',type:'image/png',purpose:'any'},{src:dibujar(512,0.2,img,o.nombre),sizes:'512x512',type:'image/png',purpose:'maskable'}];
    if(I.some(function(i){return !/^data:image\/png;base64,/.test(i.src)}))throw new Error('sin canvas');
    ponerLink('data:application/manifest+json;charset=utf-8,'+encodeURIComponent(JSON.stringify(construir(o,location.href,I))));
    return true;
   }).catch(function(e){ULT='';try{window._tjw&&window._tjw(e)}catch(x){}return false});
  }catch(e){return Promise.resolve(false)}
 }
 window.TJManifestTienda={aplicar:aplicar,construir:construir,firma:firma,inicial:inicial};
})();
