/* Fase 21 — equivalencia FUNCIONAL de lo movido a js/mapa-clientes.js, js/plantillas-factura.js, js/dashboard-vendedor.js y js/fondo-login.js, en Chrome real.
   Entra con un usuario de prueba y ejecuta, DENTRO de la página, las funciones movidas con una base de datos de ejemplo fija (solo en memoria: no se llama a save(), nada se sube a la nube);
   imprime una huella de cada salida. Se corre contra «main» y contra la rama y las huellas deben ser IDÉNTICAS (también contra el panel desplegado de prueba).
   Uso: BASE=http://localhost:8921/ [ROL=admin.prueba@example.com] [VP=1366x900] node funcional-fase21.js   (requiere PRUEBA_PASSWORD; NUNCA producción) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,ROL=process.env.ROL||'admin.prueba@example.com';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
const [W,H]=(process.env.VP||'1366x900').split('x').map(Number);
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:W,height:H},serviceWorkers:'block',reducedMotion:'reduce',isMobile:W<600,hasTouch:W<600});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const csp=[];await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI.slice(0,60)))});
 await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
 await page.fill('#au_e',ROL);await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('.ni',{state:'attached',timeout:30000});await page.waitForTimeout(4500);
 const out=await page.evaluate(async()=>{
  const R={};
  const h=async s=>{const b=new TextEncoder().encode(typeof s==='string'?s:JSON.stringify(s));const d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('')};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const t=hoy();
  // ---- base de datos de ejemplo (solo en memoria; se restaura al final; NO se llama a save()) ----
  const bk={fac:DB.fac,cli:DB.cli,tpl:DB.cfg.tpl,sello:DB.cfg.sello,agenda:DB.agenda};
  const it=(d,q,p)=>({d,q,p});
  DB.fac=[
   {id:'fx1',n:9001,cli:'Cliente Uno',fecha:addD(t,-3),total:10,items:[it('Tarjeta de boda',2,5)],vend:'admin',vn:'Administrador'},
   {id:'fx2',n:9002,cli:'Cliente Dos',fecha:addD(t,-2),total:20,items:[it('Globo',4,5)],vend:'vx1',vn:'Vendedor Ejemplo',credito:{monto:5,vence:addD(t,5)}},
   {id:'fx3',n:9003,cli:'Cliente Uno',fecha:addD(t,-9),total:8,items:[it('Tarjeta de boda',1,8)],vend:'admin',vn:'Administrador',credito:{monto:8,vence:addD(t,-2)}},
   {id:'fx4',n:9004,cli:'Cliente Tres',fecha:addD(t,-1),total:15,items:[it('Sobres',3,5)],vend:'vx1',vn:'Vendedor Ejemplo',credito:{monto:15,vence:addD(t,-1)},cobrada:addD(t,-1)},
   {id:'fx5',n:9005,cli:'Cliente Dos',fecha:addD(t,-40),total:30,items:[it('Globo',6,5)],vend:'vx1',vn:'Vendedor Ejemplo',anulada:true},
   {id:'fx6',n:9006,cli:'Cliente Uno',fecha:t,total:12.5,items:[it('Tarjeta de boda',1,5),it('Sobres',1.5,5)],vend:'vx1',vn:'Vendedor Ejemplo'}
  ];
  DB.cli=[{id:'c1',n:'Cliente Uno',r:'RUC-1',t:'6111-1111',lat:8.98,lng:-79.52},{id:'c2',n:'Cliente Dos',t:'6222-2222',lat:8.99,lng:-79.5},{id:'c3',n:'Cliente Tres',t:'6333-3333'},{id:'c4',n:'Cliente Cuatro',r:'R4',lat:9.0,lng:-79.55}];
  try{
   // ---------- E2: plantillas de factura, sello y visor ----------
   R.tpl={n:TPLS.length,datos:await h(TPLS)};
   const cfgs=[[undefined,1],['dorado',1],['kraft',0],['zz',1]];R.tpl.facTpl=[];R.tpl.sello=[];
   for(const [c,s] of cfgs){DB.cfg.tpl=c;DB.cfg.sello=s;R.tpl.facTpl.push(await h(DB.fac.map(f=>facTpl(f)).concat([facTpl(null),facTpl({tpl:'violeta'}),facTpl({tpl:'nada'})])));R.tpl.sello.push(await h(DB.fac.map(f=>facSello(f))))}
   DB.cfg.tpl=undefined;DB.cfg.sello=1;
   R.tpl.estado=await h(DB.fac.map(f=>facEstado(f)));R.tpl.estadoTxt=DB.fac.map(f=>facEstado(f).t);
   R.tpl.card=await h(tplCard());DB.cfg.tpl='marino';R.tpl.cardMarino=await h(tplCard());DB.cfg.tpl=undefined;
   R.tpl.vf0=JSON.stringify(VF);
   verFactura('fx2');await sleep(300);
   R.tpl.ver={mb:await h($('mb').innerHTML.replace(/\s+/g,' ')),on:$('md').classList.contains('on'),vf:JSON.stringify(VF),tr:($('vfs')||{style:{}}).style.transform,mh:($('vfw')||{style:{}}).style.maxHeight};
   vfZoom(1);R.tpl.zoom=JSON.stringify(VF);vfZoom(-3);R.tpl.zoom2=JSON.stringify(VF);vfMax();R.tpl.max=JSON.stringify(VF)+$('mb').classList.contains('vfmax');vfMax();R.tpl.max2=JSON.stringify(VF)+$('mb').classList.contains('vfmax');
   verFactura('no-existe');R.tpl.verNo=$('mb').innerHTML.length>0;
   $('md').classList.remove('on');
   R.tpl.tipos=typeof TPLS+','+typeof VF+' '+['facTpl','facEstado','facSello','tplCard','tplRef','tplSet','tplPrev','vfFit','vfZoom','vfMax','verFactura','verTpl','facCobrar'].map(n=>typeof window[n]).join();
   // ---------- E3: ventas por vendedor ----------
   const vp0=VD.p;R.vd={n:VDP.length,datos:await h([VDP,MESC]),vd0:JSON.stringify(VD)};
   R.vd.ini={};R.vd.stats={};R.vd.bars={};R.vd.html={};R.vd.pend={};
   for(const p of ['hoy','sem','mes','anio','todo']){
    R.vd.ini[p]=vdIni(p);
    R.vd.stats[p]=await h(['admin','vx1','nadie'].map(id=>vdStats(id,p)));
    R.vd.bars[p]=await h(['admin','vx1'].map(id=>vdBars(id,p)));
    VD.p=p;R.vd.html[p]=await h(['admin','vx1'].map(id=>vdHTML(id).replace(/\s+/g,' ')));R.vd.chips=R.vd.chips||{};R.vd.chips[p]=await h(vdChips());
   }
   R.vd.pend=await h(['admin','vx1'].map(id=>[vdPend(id).map(f=>f.id),vdPm(id)]));
   R.vd.own=await h([vdOwn({vend:'x'},'admin'),vdOwn({},'admin'),vdOwn({vend:'admin'},'admin'),vdOwn({vend:'x'},'x')]);
   R.vd.name=[vdName('admin')];VD.p='mes';R.vd.adm=await h(vdAdmHTML().replace(/\s+/g,' '));R.vd.share=await h(vdShareHTML());
   VD.p=vp0;
   // ---------- E1: mapa de clientes ----------
   R.mc={ini:JSON.stringify({q:MC.q,f:MC.f}),vacio:await h(MC_VACIO()),loc:await h([{lat:1,lng:2},{lat:'1',lng:2},null,{}].map(mcTieneLoc))};
   const st=mcStats();R.mc.stats=await h([...st.entries()]);R.mc.statsKeys=[...st.keys()].sort();
   R.mc.vis={};for(const f of ['todos','compra','sin','deuda','venc'])for(const q of ['','uno','R4','6222']){R.mc.vis[f+'|'+q]=mcVisibles(f,q).map(x=>x.c.id).join(',')}
   R.mc.visHash=await h(R.mc.vis);
   const vis=mcVisibles('todos','');R.mc.pop=await h(vis.map(x=>mcPop(x)));R.mc.popLen=vis.map(x=>mcPop(x).length);
   R.mc.mono=await h(['verde','naranja','rojo','gris','otro'].map(k=>monoBuildingHTML(k,1,'N'+k)).concat([monoBuildingHTML('verde',1.4,'<b>x</b>')]));
   R.mc.leyenda=await h(mcLeyenda());R.mc.home=await h(mcHomeHTML());
   R.mc.capas=typeof mcCapas+' '+typeof mcPintar+' '+typeof mcCapa+' '+typeof mcIr;
  }catch(e){R.error=e.message+' '+(e.stack||'').split('\n')[1]}
  // ---------- mapa real (solo administrador): R.mapa pinta con los datos de ejemplo ----------
  try{
   if(puede('mapa')){ir('mapa');await sleep(2500);const o=MC.s.mcMap;
    R.mc.mapa={slot:!!o,marcadores:o?Object.keys(o.mk).length:-1,icons:document.querySelectorAll('#mcMap .leaflet-marker-icon').length,lista:($('mcMap')||{}).tagName||null,txt:await h(((document.getElementById('v')||document.body).innerText||'').replace(/\s+/g,' ').replace(/\d{1,2}[:\/.]\d{2}([:\/.]\d{2,4})?/g,'#').slice(0,1500))};
    ir('home');await sleep(1500);R.mc.homeMapa={slot:!!(MC.s.mcHomeMap&&MC.s.mcHomeMap.map)};
   }else R.mc.mapa='sin permiso (rol sin mapa)';
  }catch(e){R.error2=e.message}
  // ---------- E4: fondo del inicio de sesión ----------
  try{
   const LK=lsk(LBG.k),prev=localStorage.getItem(LK);
   R.lbg={k:LBG.k,pre:await h(LBG_PRE),def:await h(LBG_DEF),n:LBG_PRE.length,meta0:await h(lbgMeta())};
   lbgSave({mode:'oceano',dim:40,blur:2});R.lbg.meta1=await h(lbgMeta());
   R.lbg.vid=[lbgIsVid('a.mp4'),lbgIsVid('a.png'),lbgIsVid('x','video/webm'),lbgIsVid('a.MOV?x=1'),lbgIsVid('','image/png'),lbgIsVid(null,null)];
   const o=document.createElement('div');o.id='auth';document.body.appendChild(o);
   const snap=async()=>await h(o.className+'|'+o.innerHTML.replace(/blob:[^"']+/g,'blob:X'));
   R.lbg.apply={};
   for(const m of [{mode:'aurora'},{mode:'medianoche',dim:35,blur:0},{mode:'url',url:'https://ejemplo.invalid/a.jpg',dim:20,blur:3,kind:''},{mode:'url',url:'https://ejemplo.invalid/a.mp4',dim:20,blur:0,kind:''},{mode:'url',url:'',dim:1}]){
    lbgSave(m);await lbgApply();R.lbg.apply[JSON.stringify(m)]=await snap();
   }
   // modo archivo: se guarda un blob pequeño en la base local del navegador de prueba (IndexedDB «tj_loginbg») y se borra al final
   const blob=new Blob([new Uint8Array([71,73,70,56,57,97,1,0,1,0,0,0,0,59])],{type:'image/gif'});blob.name='x.gif';
   const f=new File([blob],'x.gif',{type:'image/gif'});
   await lbgPut(f);const g=await lbgGet();R.lbg.get={type:g&&g.type,name:g&&g.name,size:g&&g.size,blob:g&&g.blob&&g.blob.size};
   lbgSave({mode:'file',dim:30,blur:0});LBG.sig='';await lbgApply();R.lbg.apply.file=await snap();
   await lbgDel();R.lbg.get2=await lbgGet();
   o.remove();LBG.sig='';
   if(prev===null)localStorage.removeItem(LK);else localStorage.setItem(LK,prev);
  }catch(e){R.error3=e.message+' '+(e.stack||'').split('\n')[1]}
  // restaurar
  DB.fac=bk.fac;DB.cli=bk.cli;DB.cfg.tpl=bk.tpl;DB.cfg.sello=bk.sello;
  return R;
 });
 const cspv=await page.evaluate(()=>window.__csp||[]);
 console.log(JSON.stringify({base:BASE,rol:ROL,vp:W+'x'+H,pageerrors:errs,csp:cspv,out},null,1));
 await br.close();
})();
