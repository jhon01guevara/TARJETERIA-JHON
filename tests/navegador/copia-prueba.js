/* Fase 23 — prepara una COPIA del repo apuntando al proyecto Firebase de PRUEBA (`tarjeteria-jhon-prueba`) para correr los scripts del panel en local.
   No toca producción: cambia `firebaseConfig` (la toma de https://tarjeteria-jhon-prueba.web.app/js/app.js, que es público), desactiva App Check y EmailJS (como la copia desplegada)
   y cambia la caché del service worker. No sube nada a ningún sitio: solo escribe en la carpeta destino.
   Uso: node tests/navegador/copia-prueba.js /tmp/copia-prueba            (CONFIG_URL=… para otra fuente del firebaseConfig)
   Después: python3 -m http.server 89xx --bind 127.0.0.1 (en esa carpeta) y BASE=http://127.0.0.1:89xx/ node tests/navegador/panel-fase23.js */
const fs=require('node:fs'),path=require('node:path');
const RAIZ=path.resolve(__dirname,'..','..');
const dest=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw new Error('Falta la carpeta destino');
if(dest===RAIZ||dest.startsWith(RAIZ+path.sep))throw new Error('El destino no puede estar dentro del repo');
const EXCLUIR=new Set(['.git','.github','node_modules','docs','tests','README.md','package.json','package-lock.json','catalogo_default.zip','migraciones']);
/* CON_ZIP=1 conserva catalogo_default.zip: así la copia se comporta como GitHub Pages / vencrm.com (donde el zip sí existe). */
if(process.env.CON_ZIP)EXCLUIR.delete('catalogo_default.zip');
function copiar(a,b){fs.mkdirSync(b,{recursive:true});for(const e of fs.readdirSync(a,{withFileTypes:true})){if(a===RAIZ&&(EXCLUIR.has(e.name)||/^firestore\.rules/.test(e.name)||/\.md$/.test(e.name)))continue;
 const x=path.join(a,e.name),y=path.join(b,e.name);if(e.isDirectory())copiar(x,y);else fs.copyFileSync(x,y)}}
(async()=>{
 const url=process.env.CONFIG_URL||'https://tarjeteria-jhon-prueba.web.app/js/app.js';
 const r=await fetch(url);if(!r.ok)throw new Error('No se pudo leer '+url+': '+r.status);
 const cfg=(await r.text()).match(/^const firebaseConfig=\{[^\n]*\};/m);
 if(!cfg||!/projectId:"tarjeteria-jhon-prueba"/.test(cfg[0]))throw new Error('La configuración leída no es la del proyecto de PRUEBA: se cancela');
 fs.rmSync(dest,{recursive:true,force:true});copiar(RAIZ,dest);
 /* index.html carga migraciones/migracion-multiempresa.js (Hosting sí lo publica): sin él habría un 404 que en producción no existe */
 fs.mkdirSync(path.join(dest,'migraciones'),{recursive:true});fs.copyFileSync(path.join(RAIZ,'migraciones','migracion-multiempresa.js'),path.join(dest,'migraciones','migracion-multiempresa.js'));
 const f=path.join(dest,'js','app.js');let s=fs.readFileSync(f,'utf8');
 const n0=s.length;
 s=s.replace(/^const firebaseConfig=\{[^\n]*\};/m,()=>cfg[0]);
 s=s.replace(/^const RECAPTCHA_V3_SITE_KEY='[^']*';/m,"const RECAPTCHA_V3_SITE_KEY='RECAPTCHA_V3_SITE_KEY';");
 s=s.replace(/^const EMAILJS_PUBLIC_KEY='[^']*',EMAILJS_SERVICE_ID='[^']*',EMAILJS_TEMPLATE_ID='[^']*';/m,"const EMAILJS_PUBLIC_KEY='EMAILJS_PUBLIC_KEY',EMAILJS_SERVICE_ID='EMAILJS_SERVICE_ID',EMAILJS_TEMPLATE_ID='EMAILJS_TEMPLATE_ID';");
 if(/projectId:"tarjeteria-jhon"/.test(s)||!/projectId:"tarjeteria-jhon-prueba"/.test(s))throw new Error('La copia aún apunta a producción: se cancela');
 fs.writeFileSync(f,s);
 const sw=path.join(dest,'sw.js');fs.writeFileSync(sw,fs.readFileSync(sw,'utf8').replace(/tj-net-first-(\d+)/g,'tj-prueba-net-first-$1'));
 console.log('Copia de PRUEBA lista en '+dest+' (proyecto tarjeteria-jhon-prueba, App Check y EmailJS desactivados)');
})().catch(e=>{console.error('ERROR: '+e.message);process.exit(1)});
