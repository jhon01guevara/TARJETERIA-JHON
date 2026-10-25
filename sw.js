// Service worker de Tarjetería Jhon: siempre busca la versión más nueva en internet
// y usa la copia guardada solo si no hay conexión.
const V='tj-net-first-15';
// Fase 16: apps/modelos.js (1,6 MB; 1,17 MB comprimido) ya NO se descarga al instalar. Se guarda al primer uso (el handler de fetch lo cachea)
// o, sin esperar a que se use, cuando la página lo pide en un momento libre (mensaje 'precalentar-modelos'). Debe coincidir con el ?v= de apps/modelos.html.
const MODELOS='apps/modelos.js?v=rendimiento-fase-16';
// Archivos que se guardan al instalar para que el panel funcione sin conexión (si alguno falla, se ignora).
const PRE=['index.html','apps/modelos.html','apps/modelos-cintillo.json','apps/investigacion.html','assets/logo.png','assets/logo-t.png','js/inicio.js','js/tema.js','js/facturacion.js','js/utils.js','js/sanear.js','js/redes.js','js/politicas.js','js/gif.js','js/app.js','css/panel.css','css/inyectados.css','css/chkskin.css','apps/modelos.css','apps/investigacion.css','js/pdf.worker.min.js','apps/investigacion.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>Promise.all(PRE.map(u=>fetch(u,{cache:'reload'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))).catch(()=>{}))});
self.addEventListener('message',e=>{if(e.data!=='precalentar-modelos')return;e.waitUntil(caches.open(V).then(async c=>{if(await c.match(MODELOS))return;const r=await fetch(MODELOS);if(r&&r.ok)await c.put(MODELOS,r)}).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==V)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  const html=r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/');
  e.respondWith((async()=>{
    try{
      const res=await fetch(html?new Request(r.url,{cache:'no-store',credentials:'same-origin'}):r);
      if(res&&res.ok){const c=res.clone();caches.open(V).then(ch=>ch.put(r.url,c)).catch(()=>{})}
      return res;
    }catch(err){
      const m=await caches.match(r.url)||await caches.match(r)||await caches.match(r.url,{ignoreSearch:true})||(html&&(await caches.match('index.html')||await caches.match('./')));
      if(m)return m;throw err;
    }
  })());
});
