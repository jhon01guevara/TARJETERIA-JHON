/* Fase 19 — equivalencia FUNCIONAL de lo movido a js/gif.js, promo.js, transportistas.js y etiquetas.js, en Chrome real.
   Entra como administrador de prueba y ejecuta, dentro de la página, las funciones movidas con entradas fijas; imprime una huella de cada salida.
   Se corre contra «main» y contra la rama y las huellas deben ser idénticas (también contra el panel desplegado de prueba).
   Uso: BASE=http://localhost:8901/ [ROL=admin.prueba@example.com] node funcional-fase19.js   (requiere PRUEBA_PASSWORD; NUNCA producción) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=process.env.BASE,PASS=process.env.PRUEBA_PASSWORD,ROL=process.env.ROL||'admin.prueba@example.com';
if(/\/\/(www\.)?tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE||''))throw new Error('No se prueba contra producción');
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
 await page.fill('#au_e',ROL);await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('.ni',{state:'attached',timeout:30000});await page.waitForTimeout(3500);
 await page.waitForFunction(()=>window.jspdf&&window.jspdf.jsPDF,null,{timeout:20000}).catch(()=>{});
 const out=await page.evaluate(async()=>{
  const R={};
  const h=async s=>{const b=new TextEncoder().encode(typeof s==='string'?s:JSON.stringify(s));const d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('')};
  // promo
  R.promo={n:PROMO.length,datos:await h(PROMO),img:await h(PROMO_IMG),slides:await h(PROMO.map(p=>promoSlide(p))),custom:await h(promoSlide({id:'ban0',custom:true,src:'data:image/png;base64,AAAA',name:'Banner 1'}))};
  // transportistas
  const C={extra:[{id:'xabc1',n:'Mi transporte',t:'n',tel:['111-2222'],web:'https://mi.com/x'}],img:{}};
  R.fle={n:FLE_DEF.length,datos:await h(FLE_DEF),
   san:await h([fleSanCfg({on:['fedex','zzz','fedex'],extra:[{id:'xabc1',n:'<b>Mi</b>',web:'https://mi.com/',tel:'1'},{id:'bad',n:'x'}],img:{ups:'data:image/png;base64,AAAA',dhl:'x'}}),fleSanCfg(null),fleSanCfg({on:7})]),
   buscar:await h(['fedex','FedEx Panamá','dhl','Mi transporte','','zz'].map(q=>{const r=fleBuscar(q,C);return r&&r.id})),
   norm:await h([fleNorm('Ancón Express!'),fleTelTxt(FLE_DEF[1]),fleWaNum('6330-3495'),fleWaNum('50761234567'),fleIni(FLE_DEF[0]),fleIni({n:'la gran ñ empresa'}),fleAll(C).length]),
   logo:await h(FLE_DEF.map(c=>fleLogo(c,{img:{}}))),mono:await h(fleMono('AB','#123456'))};
  // etiquetas
  R.etq={tam:await h(ETQ_TAM),c128:await h(['A1','Hello-World 123','~ñ'].map(code128B)),txt:await h(etqTxt('  a\u2603b   ñ  '))};
  // Datos de etiqueta construidos con etqDatos (de app.js) a partir de pedidos de ejemplo, con la fecha fija para que la huella sea estable
  const ped=(n,nota)=>({id:'ped'+n,num:n,lead:{name:'Cliente Prueba Muy Largo Nombre Completo',empresa:'Empresa SA',tel:'6111-1111',email:'a@b.com',dir:'Avenida Central, casa 12, frente al parque grande'},nota,items:[{q:2,n:'Tarjeta de boda'},{q:1,n:'Sobres'}]});
  const e=(n,nota)=>Object.assign(etqDatos(ped(n,nota),{}),{fecha:'01/01/2026'});
  R.etq.datos=await h([e(1,'🚚 Envío por: FedEx Panamá'),e(2,'🚚 Envío por: Transportes Ferguson'),e(3,'')].map(x=>Object.assign({},x,{logo:x.logo?x.logo.length:0})));
  const L=[Object.assign(e(1,'🚚 Envío por: FedEx Panamá'),{nb:2,guia:'G-1',peso:2.5,obs:'Frágil'}),Object.assign(e(2,'🚚 Envío por: Transportes Ferguson'),{nb:3})];
  const pdfs={};
  for(const [k,t] of Object.entries(ETQ_TAM)){
   const blob=etqPDF(etqExpandir(L),t);
   const txt=new TextDecoder('latin1').decode(await blob.arrayBuffer()).replace(/\/CreationDate \([^)]*\)/g,'').replace(/\/ID \[[^\]]*\]/g,'');
   pdfs[k]={bytes:blob.size,hash:await h(txt)};
  }
  R.etq.pdf=pdfs;
  // gif: codificador con cuadros sintéticos y compresión de un GIF real vía ImageDecoder
  const fr=[0,1,2].map(i=>{const d=new Uint8ClampedArray(32*32*4);for(let p=0;p<1024;p++){d[p*4]=(p*3+i*60)&255;d[p*4+1]=(p+i*20)&255;d[p*4+2]=(i*90+p/4)&255;d[p*4+3]=255}return{d:100,data:d}});
  const g=_gifEncode(fr,32,5);R.gif={bytes:g.length,enc:await h(Array.from(g)),b64:await h(_u8b64(g))};
  try{const f=new File([g],'a.gif',{type:'image/gif'});const r=await gifComprimir(f,200000);R.gif.comprimir=r?{len:r.length,hash:await h(r)}:null}catch(x){R.gif.comprimir='ERR '+x.message}
  return R;
 });
 console.log(JSON.stringify({base:BASE,pageerrors:errs,out},null,1));
 await br.close();
})();
