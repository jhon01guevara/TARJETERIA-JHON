// Uso: [KBPS=200] node servidor-medicion.js <carpeta> <puerto>
// Servidor estático de medición: gzip como GitHub Pages, cuenta bytes por ruta, límite de ancho de banda opcional (KBPS global).
const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const ROOT=path.resolve(process.argv[2]),PORT=+process.argv[3],KBPS=+(process.env.KBPS||0);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.zip':'application/zip','.svg':'image/svg+xml','.txt':'text/plain'};
const log=[];let t0=Date.now();let nextFree=0;
function throttle(n){if(!KBPS)return 0;const now=Date.now();const start=Math.max(now,nextFree);nextFree=start+n/(KBPS*1024)*1000;return nextFree-now}
http.createServer((q,r)=>{
 const u=new URL(q.url,'http://x');
 if(u.pathname==='/__log'){r.setHeader('content-type','application/json');r.end(JSON.stringify(log));return}
 if(u.pathname==='/__reset'){log.length=0;t0=Date.now();r.end('ok');return}
 let p=path.join(ROOT,decodeURIComponent(u.pathname));if(u.pathname.endsWith('/'))p=path.join(p,'index.html');
 if(!p.startsWith(ROOT)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){log.push({p:u.pathname,b:0,s:404,t:Date.now()-t0});r.statusCode=404;r.end('no');return}
 const ext=path.extname(p);let buf=fs.readFileSync(p);let h={'content-type':mime[ext]||'application/octet-stream','cache-control':'max-age=600'};
 if(['.html','.js','.css','.json','.svg','.txt'].includes(ext)&&/gzip/.test(q.headers['accept-encoding']||'')){buf=zlib.gzipSync(buf,{level:6});h['content-encoding']='gzip'}
 const d=throttle(buf.length);
 setTimeout(()=>{log.push({p:u.pathname,b:buf.length,s:200,t:Date.now()-t0});r.writeHead(200,h);r.end(buf)},d);
}).listen(PORT,'127.0.0.1');
