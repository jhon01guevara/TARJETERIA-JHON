/* Fase 23 — equivalencia FUNCIONAL de lo movido a js/agenda-alertas.js, js/tienda-config-medios.js, js/tienda-copia-local.js, js/tienda-temas.js y js/comprobante-pedido.js, en Chrome real.
   Entra con un usuario de la COPIA DE PRUEBA y ejecuta, DENTRO de la página, las funciones movidas con entradas fijas (datos solo en memoria, Notification/AudioContext/window.open sustituidos
   por dobles que registran las llamadas; no se llama a save(), nada se sube a la nube) e imprime una huella de cada salida.
   Se corre contra «main» y contra la rama servidas desde el MISMO origen (mismo puerto) y las huellas deben ser IDÉNTICAS.
   Uso: BASE=http://127.0.0.1:8953/ [ROL=admin.prueba@example.com] [VP=1366x900] node funcional-fase23.js > /tmp/huella-X.json   (requiere PRUEBA_PASSWORD; NUNCA producción) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,ROL=process.env.ROL||'admin.prueba@example.com';
if(!BASE||/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number);
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600,permissions:[]});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,60)))});
 await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
 await page.fill('#au_e',ROL);await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('.ni',{state:'attached',timeout:30000});await page.waitForTimeout(4500);
 const out=await page.evaluate(async()=>{
  const R={};
  const h=async s=>{const b=new TextEncoder().encode(typeof s==='string'?s:JSON.stringify(s));const d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('')};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const t=hoy();
  const sec=async(n,f)=>{try{R[n]=await f()}catch(e){R[n]={error:String(e&&e.message||e).slice(0,160)}}};
  const lsPrev={};['tj_cached_items'].forEach(k=>{try{lsPrev[k]=localStorage.getItem(lsk(k))}catch(e){}});
  // ===== E3: temas e iconos =====
  await sec('temas',async()=>{
   const it=[{name:'Boda elegante',cat:'',desc:''},{name:'Baby shower niño',cat:'Infantil',desc:''},{name:'Felicidades graduación',cat:'',desc:''},{name:'Viva Panamá 3 de noviembre',cat:'',desc:''},{name:'Nada',cat:'x',desc:'y'},{tags:['amor','boda']},{tags:[]},{name:'Pésame QEPD'},{name:'Navidad y año nuevo'},{name:'Quinceañera XV'}];
   return {n:TEMAS.length,datos:await h(TEMAS.map(x=>[x.id,x.n,x.e,x.re.source])),of:await h(it.map(temaOf)),ofTxt:it.map(temaOf).map(a=>a.join('+')),meta:await h(TEMAS.map(x=>temaMeta(x.id)).concat([temaMeta('zz')])),
    ki:{n:Object.keys(KI).length,datos:await h(KI)},kico:await h([kico('M0 0'),kico('M1 1',18),kico(KI.cart,22),kico(KI.menu)]),tipos:[typeof temaOf,typeof temaMeta,typeof kico,typeof KI,typeof TEMAS].join()}});
  // ===== E4: copia local =====
  await sec('copia',async()=>{
   const K=lsk('tj_cached_items'),o={};const art=(i,n)=>({id:'a'+i,name:'T'+i,price:1,img:'data:image/jpeg;base64,'+'A'.repeat(n)});
   localStorage.removeItem(K);shopCacheItems([]);o.vacia=localStorage.getItem(K);
   shopCacheItems(Array.from({length:5},(_,i)=>art(i,100)));o.pocos=await h(localStorage.getItem(K));
   shopCacheItems(Array.from({length:63},(_,i)=>art(i,120000)));const g=JSON.parse(localStorage.getItem(K)||'[]');o.grandes={n:g.length,ids:g.map(x=>x.id).join(','),len:localStorage.getItem(K).length};
   shopCacheItems(null);o.nulo=localStorage.getItem(K)&&localStorage.getItem(K).length;
   shopCacheItems([]);o.vaciaDespues=localStorage.getItem(K)&&localStorage.getItem(K).length;
   o.win=typeof window.shopCacheItems;
   if(lsPrev.tj_cached_items===null)localStorage.removeItem(K);else localStorage.setItem(K,lsPrev.tj_cached_items);
   return o});
  // ===== E1: avisos de la Agenda =====
  const bk={agenda:DB.agenda,cfg:{snd:DB.cfg.snd,vol:DB.cfg.vol,tono:DB.cfg.tono,nsys:DB.cfg.nsys}};
  const saveBk=window.save,ls0=Object.keys(localStorage).sort().join('|');
  const tonos=[];const mkAc=()=>({currentTime:10,destination:{},createOscillator(){const o={frequency:{value:0},connect(){},start(a){tonos.push(['osc',o.type,o.frequency.value,+a.toFixed(3)])},stop(a){tonos.push(['stop',+a.toFixed(3)])}};return o},createGain(){return {gain:{setValueAtTime(a,b){tonos.push(['g0',a,+b.toFixed(3)])},linearRampToValueAtTime(a,b){tonos.push(['gl',+a.toFixed(4),+b.toFixed(3)])},exponentialRampToValueAtTime(a,b){tonos.push(['ge',+a.toFixed(4),+b.toFixed(3)])}},connect(){}}}});
  const acFake=mkAc(),agAcOrig=window.agAc;window.agAc=()=>acFake;
  const nots=[];const NotOrig=window.Notification;
  await sec('agenda',async()=>{
   const o={};o.agsnd=await h(AGSND);o.agsndTonos=Object.keys(AGSND);
   DB.cfg.snd=1;DB.cfg.vol=60;DB.cfg.tono='campana';
   agSound(false);o.campana=await h(tonos.splice(0));
   for(const k of Object.keys(AGSND)){agSound(true,k);o['tono_'+k]=await h(tonos.splice(0))}
   DB.cfg.snd=0;agSound(false);o.mudo=tonos.splice(0).length;agSound(true,'zz');o.zz=await h(tonos.splice(0));
   // cfgSnd cambia DB.cfg (no guarda: save sustituida)
   window.save=()=>{o.saves=(o.saves||0)+1};
   cfgSnd('snd',1);o.cfgSnd1=[DB.cfg.snd,tonos.splice(0).length>0];cfgSnd('vol',30);o.cfgSnd2=[DB.cfg.vol,tonos.splice(0).length];cfgSnd('tono','alerta');o.cfgSnd3=[DB.cfg.tono,tonos.splice(0).length>0];
   // agToast: aviso en pantalla
   const oc={e:{id:'ev1',ti:'Cobrar <b>factura</b>',t:'cobro',h:'09:30',cn:'Cliente Uno'},d:t},oc2={e:{id:'ev2',ti:'Otra',t:'zzz',h:'',cn:''},d:addD(t,3)};
   const c0=document.getElementById('agToast');if(c0)c0.remove();
   agToast(oc,'k1');agToast(oc2,'k2');
   const cont=document.getElementById('agToast');o.toast={n:cont.children.length,html:await h(cont.innerHTML.replace(/style="[^"]*"/g,'')),clases:[...cont.children].map(x=>x.className)};
   cont.firstElementChild.querySelector('button[data-a="s"]')&&(AGN['k1']=1);cont.firstElementChild.click();o.toastClick=cont.children.length;
   cont.innerHTML='';
   // agAlert: sonido + aviso + vibración + notificación del sistema (doble)
   window.Notification=function(t,o2){nots.push([t,o2])};window.Notification.permission='granted';
   DB.cfg.nsys=1;const vib=[];try{navigator.vibrate=p=>{vib.push(p);return true}}catch(e){}
   agAlert(oc,'k3');o.alert={tonos:await h(tonos.splice(0)),nots:nots.splice(0),vib,toast:cont.children.length};cont.innerHTML='';
   DB.cfg.nsys=0;agAlert(oc2,'k4');o.alert2={nots:nots.length,toast:cont.children.length};cont.innerHTML='';
   agTest();o.test={toast:cont.children.length,txt:cont.textContent.replace(/\d{1,2}[:\/.]\d{2}/g,'#').slice(0,80)};cont.innerHTML='';
   // agCheck con una agenda de ejemplo (cada aviso se registra en AGN; se restaura al final)
   const ahora=new Date(),hh=n=>{const d=new Date(ahora.getTime()+n*60000);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
   const AGNbk=JSON.stringify(AGN),AGSNbk=JSON.stringify(AGSN);Object.keys(AGN).forEach(k=>delete AGN[k]);Object.keys(AGSN).forEach(k=>delete AGSN[k]);
   DB.agenda=[{id:'p1',ti:'Aviso ya vencido',t:'cita',f:t,h:hh(-1),av:0,cn:'A'},{id:'p2',ti:'Sin aviso',t:'cita',f:t,h:hh(-1),cn:'B'},{id:'p3',ti:'Futuro',t:'cita',f:t,h:hh(600),av:5,cn:'C'}];
   agCheck();o.check={n:Object.keys(AGN).length,claves:Object.keys(AGN).map(k=>k.replace(/\d{4}-\d{2}-\d{2}/,'F').replace(/\|[^|]*\|/,'|H|')),toast:cont.children.length};
   agCheck();o.check2={n:Object.keys(AGN).length,toast:cont.children.length};
   cont.innerHTML='';DB.agenda=[];agCheck();o.checkVacio=Object.keys(AGN).length;
   Object.keys(AGN).forEach(k=>delete AGN[k]);Object.assign(AGN,JSON.parse(AGNbk));Object.keys(AGSN).forEach(k=>delete AGSN[k]);Object.assign(AGSN,JSON.parse(AGSNbk));
   o.tipos=['agSound','cfgSnd','agPerm','agToast','agAlert','agTest','agCheck'].map(n=>typeof window[n]).join();
   return o});
  window.agAc=agAcOrig;window.Notification=NotOrig;window.save=saveBk;DB.agenda=bk.agenda;Object.assign(DB.cfg,bk.cfg);
  // ===== E2: controles de configuración de la tienda (con un DOM de ejemplo) =====
  await sec('config',async()=>{
   const o={},al=[],alOrig=window.alert;window.alert=m=>al.push(m);
   const caja=document.createElement('div');caja.id='f23_fix';caja.innerHTML=`<div id="sh_cfg_bgtype_btns"><button data-bgtype="none"></button><button data-bgtype="photo"></button><button data-bgtype="video"></button><button data-bgtype="colors"></button><button data-bgtype="solid"></button></div>
    <div id="sh_cfg_sec_photo"></div><div id="sh_cfg_sec_video"></div><div id="sh_cfg_sec_colors"></div><div id="sh_cfg_sec_solid"></div>
    <div id="sh_cfg_color_btns"><button data-color="a"></button><button data-color="b"></button></div>
    <div id="sh_cfg_motion_btns"><button data-motion="float"></button><button data-motion="none"></button></div><div id="sh_cfg_wm_btns"><button data-wm="wm_violeta"></button><button data-wm="none"></button></div>
    <input id="sh_cfg_hero_photo"><div id="sh_cfg_photo_prev" style="display:none"><img></div><input type="file" id="sh_cfg_photo_file">
    <input id="sh_cfg_hero_video"><input type="file" id="sh_cfg_video_file"><input id="sh_cfg_logo"><div id="sh_cfg_logo_prev" style="display:none"><img></div><input type="file" id="sh_cfg_logo_file">`;
   document.body.appendChild(caja);
   const snap=()=>h(caja.innerHTML.replace(/data:[^"']{0,40}[^"']*/g,m=>'data:'+m.length)+JSON.stringify([TD._curBgType,TD._curHeroBgColor,TD._curMotion,TD._curWm,TD._curWatermark]));
   const tdBk=Object.assign({},TD);
   o.s0=await snap();
   for(const tp of ['photo','video','colors','solid','none']){shopCfgBgTypeSet(tp);o['bg_'+tp]=await snap()}
   shopCfgColorSet('b');o.color=await snap();
   try{shopCfgMotionSet('none');o.motion=await snap()}catch(e){o.motion='err '+e.message}
   try{shopCfgWmSet('none');o.wm=await snap()}catch(e){o.wm='err '+e.message}
   o.tipos=['shopCfgBgTypeSet','shopCfgColorSet','shopCfgMotionSet','shopCfgWmSet','shopPhotoUpload','shopPhotoClear','shopVideoUpload','shopVideoClear','shopPresetVideo','shopLogoUpload','shopLogoClear'].map(n=>typeof window[n]).join();
   o.exp=['shopCfgBgTypeSet','shopCfgColorSet','shopCfgMotionSet','shopCfgWmSet','shopPhotoUpload','shopPhotoClear','shopVideoUpload','shopVideoClear','shopPresetVideo','shopLogoUpload','shopLogoClear'].map(n=>window[n]===eval(n)).join();
   // subidas: archivos de verdad por DataTransfer
   const gif=new Uint8Array([71,73,70,56,57,97,1,0,1,0,0,0,0,59]);
   const poner=(id,nombre,tipo,bytes)=>{const f=new File([bytes],nombre,{type:tipo});const dt=new DataTransfer();dt.items.add(f);const i=document.getElementById(id);i.files=dt.files;return i};
   const ev=i=>({target:i});
   let i=poner('sh_cfg_photo_file','x.gif','image/gif',gif);shopPhotoUpload(ev(i));await sleep(300);
   o.foto={val:await h(document.getElementById('sh_cfg_hero_photo').value),prev:document.getElementById('sh_cfg_photo_prev').style.display,src:await h(document.querySelector('#sh_cfg_photo_prev img').src),al:al.splice(0)};
   i=poner('sh_cfg_photo_file','x.txt','text/plain',new Uint8Array([65]));document.getElementById('sh_cfg_hero_photo').value='';shopPhotoUpload(ev(i));await sleep(200);o.fotoMala={val:document.getElementById('sh_cfg_hero_photo').value,al:al.splice(0)};
   i=poner('sh_cfg_photo_file','g.png','image/png',new Uint8Array(3.6*1024*1024));shopPhotoUpload(ev(i));await sleep(200);o.fotoGrande={val:document.getElementById('sh_cfg_hero_photo').value,al:al.splice(0)};
   i=poner('sh_cfg_photo_file','x.gif','image/gif',gif);shopPhotoUpload({target:{files:[]}});o.fotoVacia=al.splice(0);
   i=poner('sh_cfg_photo_file','x.gif','image/gif',gif);shopPhotoUpload();await sleep(300);o.fotoSinEvento=await h(document.getElementById('sh_cfg_hero_photo').value);   // lee el input por id
   shopPhotoClear();o.fotoClear=await snap();
   i=poner('sh_cfg_video_file','v.mp4','video/mp4',gif);shopVideoUpload(ev(i));await sleep(300);o.video={val:await h(document.getElementById('sh_cfg_hero_video').value),al:al.splice(0)};
   i=poner('sh_cfg_video_file','v.mp4','video/mp4',new Uint8Array(8.5*1024*1024));shopVideoUpload(ev(i));await sleep(500);o.videoGrande={al:al.splice(0)};
   shopVideoClear();o.videoClear=await snap();
   try{shopPresetVideo('https://ejemplo.invalid/v.mp4');o.preset=await snap()}catch(e){o.preset='err '+e.message}
   i=poner('sh_cfg_logo_file','l.gif','image/gif',gif);shopLogoUpload(ev(i));await sleep(300);o.logo={val:await h(document.getElementById('sh_cfg_logo').value),prev:document.getElementById('sh_cfg_logo_prev').style.display,al:al.splice(0)};
   i=poner('sh_cfg_logo_file','l.png','image/png',new Uint8Array(2.6*1024*1024));shopLogoUpload(ev(i));await sleep(200);o.logoGrande=al.splice(0);
   i=poner('sh_cfg_logo_file','l.txt','text/plain',new Uint8Array([1]));shopLogoUpload(ev(i));o.logoMalo=al.splice(0);
   shopLogoClear();o.logoClear=await snap();
   caja.remove();window.alert=alOrig;Object.keys(TD).forEach(k=>{if(!(k in tdBk))delete TD[k]});Object.assign(TD,tdBk);
   return o});
  // ===== E5: comprobante del pedido =====
  await sec('comprobante',async()=>{
   const o={},p={id:'ped123456abcdef',ts:Date.UTC(2026,9,25,15,0,0),total:32.5,nota:'Nota <i>de</i> prueba',lead:{name:'Cliente <b>Prueba</b>',tel:'6123-4567',email:'prueba@example.com',empresa:'Empresa SA',dir:'Calle 1'},items:[{n:'Tarjeta A',q:12,p:1.25},{n:'Globo "B" <u>x</u>',q:7,p:2.5},{n:'Sin precio',q:3,p:0}],estado:'nuevo'};
   // shopPdfPrint: window.open → un iframe como «ventana»
   const f=document.createElement('iframe');document.body.appendChild(f);const w=f.contentWindow;let pr=0;w.print=()=>{pr++};
   const openOrig=window.open;window.open=()=>w;
   shopPdfPrint(p);await sleep(500);
   o.print={titulo:w.document.title,body:await h(w.document.body.innerHTML),estilo:w.document.body.style.cssText,imprimio:pr,opener:w.opener===null,tags:[...w.document.body.querySelectorAll('*')].map(e=>e.tagName).join()};
   window.open=()=>null;const al=[],alOrig=window.alert;window.alert=m=>al.push(m);shopPdfPrint(p);o.bloqueado=al.splice(0);window.alert=alOrig;
   window.open=openOrig;f.remove();
   // shopPdf 'ver' → visor con el PDF en un blob
   const v0=document.getElementById('pdfv');if(v0)v0.remove();
   shopPdf(p,'ver');await sleep(1200);
   const v=document.getElementById('pdfv');o.pdf={visor:!!v,barra:v?await h(v.querySelector('.pdfvb b').textContent):null,nombre:v?v.querySelector('.pdfvb b').textContent:null,iframe:v?v.querySelector('iframe').src.slice(0,5):null,descarga:v?v.querySelector('a[download]').getAttribute('download'):null};
   if(v){const r=await fetch(v.querySelector('iframe').src);const b=new Uint8Array(await r.arrayBuffer());o.pdf.bytes=b.length>3000;o.pdf.cabecera=String.fromCharCode(...b.slice(0,5));
    const txt=new TextDecoder('latin1').decode(b);o.pdf.paginas=(txt.match(/\/Type\s*\/Page[^s]/g)||[]).length;
    document.getElementById('pdfvx').click();o.pdf.cierra=!document.getElementById('pdfv')}
   shopPdf(null,'ver');o.pdfNulo=!document.getElementById('pdfv');
   // comprobante como imagen
   const cv=await new Promise(res=>{let hecho=false;shopRecCanvas(p,c=>{hecho=true;res(c)});setTimeout(()=>{if(!hecho)res(null)},5000)});
   o.canvas=cv?{w:cv.width,h:cv.height,datos:await h(cv.toDataURL('image/png'))}:null;
   const old=document.getElementById('imgv');if(old)old.remove();
   shopImgVer(p);await sleep(1500);const iv=document.getElementById('imgv');
   o.imgv={visor:!!iv,html:iv?await h(iv.innerHTML.replace(/src="data:[^"]*"/g,'src="data"').replace(/href="data:[^"]*"/g,'href="data"').replace(/href="blob:[^"]*"/g,'href="blob"').replace(/\d{1,2}[:\/.]\d{2}/g,'#')):null,botones:iv?[...iv.querySelectorAll('button,a')].map(x=>x.textContent.trim()).join('|'):null};
   if(iv)iv.remove();
   o.tipos=['shopPdfPrint','shopPdf','shopPdfVer','shopRecCanvas','shopImgVer'].map(n=>typeof window[n]).join();
   return o});
  R.estado={vista:typeof vista!=='undefined'?vista:null};
  return R;
 });
 const cspv=await page.evaluate(()=>window.__csp||[]);
 console.log(JSON.stringify({base:BASE,rol:ROL,vp:W+'x'+H,pageerrors:errs,csp:cspv,out},null,1));
 await br.close();
})();
