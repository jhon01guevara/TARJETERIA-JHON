// Service worker de Tarjetería Jhon: siempre busca la versión más nueva en internet
// y usa la copia guardada solo si no hay conexión.
const V='tj-net-first-1';
self.addEventListener('install',()=>self.skipWaiting());
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
      const m=await caches.match(r.url)||await caches.match(r)||(html&&(await caches.match('index.html')||await caches.match('./')));
      if(m)return m;throw err;
    }
  })());
});
