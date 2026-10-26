/* Marca VEN CRM (solo el PANEL). Script clásico, sin dependencias, se carga en <head> antes de las hojas de estilo.
   - En la tienda pública (URL con ?tienda=...) NO hace nada: la tienda conserva su marca Tarjetería Jhon (manifest.json, título, íconos, vista previa).
   - En el panel: cambia manifest, título, íconos y color del navegador a VEN CRM, marca <html class="ven-crm"> (css/marca-ven-crm.css)
     y ofrece window.TJMarca para la pantalla de inicio de sesión (js/app.js, authUI).
   La detección es la misma que usan js/tema.js y js/app.js: /[?&]tienda(=|&|$)/. Guía: docs/MARCA-VEN-CRM.md. */
(function(){
 var tienda=/[?&]tienda(=|&|$)/.test(location.search);
 var M=window.TJMarca={panel:!tienda,nombre:'VEN CRM',logo:'assets/ven-crm/ven-crm-horizontal-oscuro.svg',
  loginHTML:function(logoEmpresa){
   return '<div class="vlogo"><img src="'+M.logo+'" alt="VEN CRM" width="220" height="64"></div>'+(logoEmpresa||'');
  },
  pie:function(){return '🔒 Acceso restringido · VEN CRM'},
  simbolo:'assets/ven-crm/icono-app.svg',wordmark:'assets/ven-crm/ven-crm-horizontal-claro.svg',
  /* Paleta de los gráficos del panel (negro, azul sobrio y grises). */
  paleta:['#000000','#276EF1','#6B6B6B','#A8A8A8','#3E3E3E','#D4D4D4']};
 if(tienda)return;
 var d=document;
 function set(sel,attr,val){var e=d.querySelector(sel);if(e)e.setAttribute(attr,val)}
 d.documentElement.classList.add('ven-crm');
 set('link[rel=manifest]','href','manifest-ven-crm.json');
 set('meta[name=theme-color]','content','#000000');
 set('link[rel=icon]','href','assets/ven-crm/favicon.svg');set('link[rel=icon]','type','image/svg+xml');
 set('link[rel=apple-touch-icon]','href','assets/ven-crm/apple-touch-icon-180.png');
 set('meta[name=apple-mobile-web-app-title]','content','VEN CRM');
 set('meta[property="og:site_name"]','content','VEN CRM');
 set('meta[property="og:title"]','content','VEN CRM · Panel');
 set('meta[name="twitter:title"]','content','VEN CRM · Panel');
 d.title='VEN CRM · Panel';
 /* Interior del panel: se aplica cuando el DOM está listo (el script va en <head>). Idempotente: no repite nada si ya se aplicó. */
 function img(cls,src,alt,w,h){var i=d.createElement('img');i.className=cls;i.src=src;i.alt=alt;i.width=w;i.height=h;return i}
 function reemplazar(e){if(e&&e.textContent&&e.textContent.indexOf('Panel de Facturación')>-1)e.textContent=e.textContent.replace('Panel de Facturación','VEN CRM')}
 M.interior=function(){
  try{
   var b=d.querySelector('.brand h1');
   if(b&&!b.querySelector('img')){b.textContent='';b.classList.add('vwm');b.appendChild(img('',M.wordmark,'VEN CRM',132,41))}
   reemplazar(d.querySelector('.top .rt'));reemplazar(d.querySelector('h1.h1m'));
   var t=d.querySelector('.top > div');
   if(t&&!t.querySelector('.vsym'))t.insertBefore(img('vsym',M.simbolo,'',30,30),t.firstChild);
   var f=d.querySelector('.sf');
   if(f&&!f.querySelector('.vpie')){var p=d.createElement('div');p.className='vpie';p.textContent='VEN CRM';f.appendChild(p)}
  }catch(e){window._tjw&&window._tjw(e)}
 };
 if(d.readyState==='loading'&&d.addEventListener)d.addEventListener('DOMContentLoaded',M.interior);else M.interior();
})();
