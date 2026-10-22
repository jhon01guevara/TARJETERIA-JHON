/* ===== Marketing Studio · motor de edición (Fase v1 del plan maestro) =====
   Puro y autónomo: se carga ANTES que app.js y no depende de él. Todo el
   documento de diseño es JSON editable (capas por formato), como pide el plan
   maestro §4. La vista (js/marketing.js) usa este motor y persiste en
   empresas/{eid}/marketing_projects|assets|exports|colecciones vía fbCol.

   Núcleo testeable en Node: formatos, validación, adaptación entre formatos,
   hit-testing y plantillas. Render/exportación usan canvas del navegador. */
'use strict';

/* Perfiles de formato (plan maestro §3). Los tamaños son de diseño; el lienzo
   se dibuja a escala para previsualizar y a resolución completa para exportar. */
var MKT_FORMATOS={
 cuadrado:{w:1080,h:1080,nombre:'Cuadrado · feed'},
 vertical:{w:1080,h:1350,nombre:'Vertical · feed'},
 story:{w:1080,h:1920,nombre:'Story / Reel / TikTok',segura:{top:250,bottom:320}},
 banner:{w:1200,h:628,nombre:'Banner horizontal'}
};
var MKT_FUENTES={
 moderna:"'Segoe UI',system-ui,-apple-system,sans-serif",
 impacto:"'Arial Black','Segoe UI',sans-serif",
 clasica:"Georgia,'Times New Roman',serif",
 manual:"'Segoe Script','Comic Sans MS',cursive"
};

function mktUid(p){return (p||'L')+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

/* ---------- Documento y validación ---------- */
function mktDocVacio(){
 var d={version:1,activo:'vertical',formatos:{}};
 for(var k in MKT_FORMATOS)
  d.formatos[k]={w:MKT_FORMATOS[k].w,h:MKT_FORMATOS[k].h,layers:[{id:mktUid('F'),tipo:'fondo',color:'#ffffff',op:1}]};
 return d;
}
function mktCapaOk(c){
 if(!c||typeof c!=='object')return false;
 if(c.tipo==='fondo')return typeof c.color==='string';
 if(c.tipo==='img')return typeof c.assetId==='string'&&['contain','cover'].indexOf(c.fit||'contain')>=0;
 if(c.tipo==='txt')return typeof c.t==='string'&&+c.size>0;
 return false;
}
function mktDocOk(doc){
 if(!doc||doc.version!==1||!doc.formatos)return false;
 for(var k in MKT_FORMATOS){
  var f=doc.formatos[k];
  if(!f||f.w!==MKT_FORMATOS[k].w||f.h!==MKT_FORMATOS[k].h||!Array.isArray(f.layers))return false;
  for(var i=0;i<f.layers.length;i++)if(!mktCapaOk(f.layers[i]))return false;
 }
 return true;
}

/* ---------- Adaptación entre formatos (plan §3: no estirar, recomponer) ----------
   Escala proporcional al ÁREA ÚTIL del destino (la story reserva zona segura),
   re-centrado y sujeción a los límites. Puro: mismo origen → mismo resultado. */
function mktAreaUtil(fmt){
 var F=MKT_FORMATOS[fmt],y0=0,y1=F.h;
 if(F.segura){y0=F.segura.top;y1=F.h-F.segura.bottom}
 return {x:0,y:y0,w:F.w,h:y1-y0}
}
function mktAdaptarFormato(capasDe,de,hacia){
 var F=MKT_FORMATOS[de],T=mktAreaUtil(hacia);
 var k=Math.min(T.w/F.w,T.h/F.h);
 var dx=Math.round((MKT_FORMATOS[hacia].w-F.w*k)/2),dy=Math.round(T.y+(T.h-F.h*k)/2);
 function dentro(v,a,b){return Math.max(a,Math.min(b,v))}
 return capasDe.map(function(c){
  var n=JSON.parse(JSON.stringify(c));n.id=mktUid();
  if(n.tipo==='fondo')return n;
  n.x=Math.round(dentro(c.x*k+dx,0,MKT_FORMATOS[hacia].w-c.w*k));
  n.y=Math.round(dentro(c.y*k+dy,T.y,T.y+T.h-c.h*k));
  n.w=Math.round(c.w*k);n.h=Math.round(c.h*k);
  if(n.tipo==='txt'){
   n.size=Math.max(18,Math.round((c.size||48)*k));
   if(n.pad!=null)n.pad=Math.round(n.pad*k);
  }
  return n;
 });
}
function mktAdaptarDoc(doc,maestro){
 maestro=maestro||'vertical';
 var out=JSON.parse(JSON.stringify(doc));
 out.formatos[maestro].layers.forEach(function(c){if(!c.id)c.id=mktUid()});
 for(var k in MKT_FORMATOS){
  if(k===maestro)continue;
  out.formatos[k].layers=mktAdaptarFormato(out.formatos[maestro].layers,maestro,k);
 }
 out.activo=maestro;
 return out;
}

/* ---------- Hit-testing (geometría pura) ---------- */
function mktHit(px,py,capas){
 for(var i=capas.length-1;i>=0;i--){
  var c=capas[i];
  if(c.tipo==='fondo')continue;
  if(px>=c.x&&px<=c.x+c.w&&py>=c.y&&py<=c.y+c.h)return c;
 }
 return null;
}
function mktManejos(sel){
 if(!sel)return {};
 var m=10,r={};
 r.nw={x:sel.x,y:sel.y};r.ne={x:sel.x+sel.w,y:sel.y};
 r.sw={x:sel.x,y:sel.y+sel.h};r.se={x:sel.x+sel.w,y:sel.y+sel.h};
 r.n={x:sel.x+sel.w/2,y:sel.y};r.s={x:sel.x+sel.w/2,y:sel.y+sel.h};
 r.e={x:sel.x+sel.w,y:sel.y+sel.h/2};r.o={x:sel.x,y:sel.y+sel.h/2};
 for(var k in r)r[k].r=m;
 return r;
}
function mktHitManejo(sel,px,py){
 var ms=mktManejos(sel);
 for(var k in ms){var m=ms[k];if(px>=m.x-m.r&&px<=m.x+m.r&&py>=m.y-m.r&&py<=m.y+m.r)return k}
 return null;
}

/* ---------- Render (canvas del navegador) ---------- */
function mktRad(ctx,r,x,y,w,h){
 if(!r){ctx.beginPath();ctx.rect(x,y,w,h);return}
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
 ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function mktRender(ctx,fmt,capas,assets,esc){
 var F=MKT_FORMATOS[fmt];
 ctx.clearRect(0,0,F.w*esc,F.h*esc);
 capas.forEach(function(c){
  ctx.save();
  ctx.globalAlpha=c.op==null?1:Math.max(0,Math.min(1,+c.op));
  if(c.tipo==='fondo'){ctx.fillStyle=c.color||'#ffffff';ctx.fillRect(0,0,F.w*esc,F.h*esc);ctx.restore();return}
  var x=c.x*esc,y=c.y*esc,w=Math.max(2,c.w*esc),h=Math.max(2,c.h*esc);
  ctx.translate(x+w/2,y+h/2);if(c.rot)ctx.rotate(+c.rot*Math.PI/180);ctx.translate(-w/2,-h/2);
  if(c.tipo==='img'){
   var im=assets&&assets[c.assetId];
   ctx.fillStyle='rgba(120,124,135,.25)';mktRad(ctx,(c.rad||0)*esc,0,0,w,h);ctx.fill();
   if(im){
    var iw=im.naturalWidth||im.width||1,ih=im.naturalHeight||im.height||1;
    var k=((c.fit||'contain')==='cover')?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih);
    mktRad(ctx,(c.rad||0)*esc,0,0,w,h);ctx.save();ctx.clip();
    ctx.drawImage(im,(w-iw*k)/2,(h-ih*k)/2,iw*k,ih*k);ctx.restore();
   }
  }else if(c.tipo==='txt'){
   var fs=(c.size||48)*esc;
   ctx.font=(c.weight==null?700:c.weight)+' '+fs+'px '+(MKT_FUENTES[c.font]||MKT_FUENTES.moderna);
   ctx.textAlign=c.align||'center';ctx.textBaseline='middle';
   var lines=String(c.t||'').split('\n'),lh=fs*1.2,th=lh*lines.length,pad=(c.pad==null?18:c.pad)*esc;
   var ancho=0;lines.forEach(function(l){ancho=Math.max(ancho,ctx.measureText(l).width)});
   if(c.fondo){
    var bw=Math.min(w,ancho+pad*2),bh=Math.min(h,th+pad*2);
    var bx=c.align==='left'?0:(c.align==='right'?w-bw:(w-bw)/2),by=(h-bh)/2;
    ctx.fillStyle=c.fondo;mktRad(ctx,(c.rad||0)*esc,bx,by,bw,bh);ctx.fill();
   }
   ctx.fillStyle=c.color||'#20222a';
   lines.forEach(function(l,i){ctx.fillText(l,w/2,h/2-th/2+lh/2+lh*i)});
  }
  ctx.restore();
 });
}

/* ---------- Exportación (resolución completa + control de peso) ---------- */
function mktCanvas(formato,capas,assets){
 var F=MKT_FORMATOS[formato],c=document.createElement('canvas');
 c.width=F.w;c.height=F.h;
 mktRender(c.getContext('2d'),formato,capas,assets,1);
 return c;
}
function mktComprimir(canvas,tipo,maxKB){
 return new Promise(function(res){
  var mime=tipo==='png'?'image/png':(tipo==='webp'?'image/webp':'image/jpeg');
  if(tipo==='png')return canvas.toBlob(function(b){res(b)},mime);
  var min=.42,max=.97,mejor=null;
  (function intenta(q){
   canvas.toBlob(function(b){
    if(!b)return res(mejor||null);
    if(b.size<=maxKB*1024){mejor=b;if(max-min<.02)return res(mejor);min=q;return intenta((min+max)/2)}
    if(mejor)return res(mejor);
    if(max-min<.02)return res(b);
    max=q;intenta((min+max)/2);
   },mime,q);
  })(max);
 });
}
function mktDataUrl(blob){
 return new Promise(function(res){
  var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){res(null)};r.readAsDataURL(blob);
 });
}
function mktBlobDeDataUrl(du){
 try{
  var p=String(du||'').split(','),bin=atob(p[1]),n=bin.length,u=new Uint8Array(n);
  while(n--)u[n]=bin.charCodeAt(n);
  var t=(p[0].match(/data:([^;]+)/)||[])[1]||'image/jpeg';
  return new Blob([u],{type:t});
 }catch(e){return null}
}

/* ---------- Plantillas (maestro vertical; los demás formatos se adaptan) ----------
   Los colores '#MARCA1'/'#MARCA2' se sustituyen por la marca de la empresa. */
function mktTxt(t,o){return Object.assign({id:mktUid('T'),tipo:'txt',t:t,x:0,y:0,w:600,h:100,size:48,color:'#20222a',weight:700,align:'center',pad:18},o||{})}
function mktImg(o){return Object.assign({id:mktUid('I'),tipo:'img',assetId:'',x:90,y:120,w:900,h:760,fit:'contain',op:1},o||{})}
var MKT_PLANTILLAS=[
 {id:'promo',nombre:'Promo clásica',capas:function(){return[
  {id:mktUid('F'),tipo:'fondo',color:'#ffffff'},
  mktImg({assetId:'PRODUCTO'}),
  mktTxt('Escribe el título',{x:60,y:920,w:960,h:120,size:64}),
  mktTxt('$0.00',{x:290,y:1050,w:500,h:130,size:84,color:'#ffffff',fondo:'#MARCA1',rad:24}),
  mktTxt('PIDE HOY · WhatsApp',{x:60,y:1215,w:960,h:90,size:40,color:'#MARCA2',weight:800})
 ]}},
 {id:'descuento',nombre:'Descuento',capas:function(){return[
  {id:mktUid('F'),tipo:'fondo',color:'#MARCA1'},
  mktTxt('-25%',{x:70,y:70,w:360,h:160,size:92,fondo:'#ffffff',color:'#MARCA1',rad:80}),
  mktImg({assetId:'PRODUCTO',y:290,h:640}),
  mktTxt('Nombre del producto',{x:60,y:960,w:960,h:100,size:52,color:'#ffffff'}),
  mktTxt('$0.00',{x:290,y:1080,w:500,h:130,size:80,fondo:'#ffffff',color:'#MARCA2'})
 ]}},
 {id:'nuevo',nombre:'Nuevo producto',capas:function(){return[
  {id:mktUid('F'),tipo:'fondo',color:'#ffffff'},
  mktTxt('✨ NUEVO',{x:0,y:0,w:1080,h:150,size:64,fondo:'#MARCA2',color:'#ffffff',pad:0,rad:0}),
  mktImg({assetId:'PRODUCTO',x:140,y:210,w:800,h:690}),
  mktTxt('Nombre del producto',{x:60,y:940,w:960,h:110,size:56}),
  mktTxt('Ordénalo ahora',{x:140,y:1080,w:800,h:120,size:44,fondo:'#MARCA1',color:'#ffffff',rad:20})
 ]}},
 {id:'temporada',nombre:'Temporada',capas:function(){return[
  {id:mktUid('F'),tipo:'fondo',color:'#8a1e2d'},
  mktTxt('🎁 Ofertas de temporada',{x:60,y:60,w:960,h:140,size:62,color:'#ffd95e'}),
  mktImg({assetId:'PRODUCTO',y:250,h:640,rad:20}),
  mktTxt('$0.00',{x:290,y:940,w:500,h:140,size:88,fondo:'#ffd95e',color:'#8a1e2d',rad:70}),
  mktTxt('Solo por esta semana',{x:60,y:1120,w:960,h:100,size:42,color:'#ffffff'})
 ]}},
 {id:'minimal',nombre:'Minimal elegante',capas:function(){return[
  {id:mktUid('F'),tipo:'fondo',color:'#fafafa'},
  mktImg({assetId:'PRODUCTO',x:240,y:230,w:600,h:770}),
  mktTxt('Colección',{x:80,y:100,w:920,h:90,size:44,align:'left',font:'clasica',weight:400}),
  mktTxt('$0.00',{x:680,y:1140,w:320,h:80,size:40,align:'right',font:'clasica',weight:400})
 ]}},
 {id:'oferta',nombre:'Oferta story',capas:function(){return[
  {id:mktUid('F'),tipo:'fondo',color:'#14161c'},
  mktTxt('🔥 OFERTA',{x:60,y:50,w:960,h:170,size:78,color:'#ffffff',font:'impacto'}),
  mktImg({assetId:'PRODUCTO',y:270,h:560,rad:24}),
  mktTxt('$0.00',{x:190,y:880,w:700,h:170,size:100,fondo:'#MARCA1',color:'#ffffff',rad:30}),
  mktTxt('Desliza y pide el tuyo',{x:60,y:1080,w:960,h:110,size:42,color:'#9aa0ae'})
 ]}}
];
function mktAplicarMarca(doc,marca){
 marca=marca||{};
 var c1=marca.c1||'#E0457B',c2=marca.c2||'#0F6CBD';
 (function rec(o){
  if(Array.isArray(o))return o.forEach(rec);
  if(o&&typeof o==='object'){
   for(var k in o){
    if(o[k]==='#MARCA1')o[k]=c1;else if(o[k]==='#MARCA2')o[k]=c2;else rec(o[k]);
   }
  }
 })(doc);
 return doc;
}
function mktPlantillaDoc(id,marca){
 var p=null;
 for(var i=0;i<MKT_PLANTILLAS.length;i++)if(MKT_PLANTILLAS[i].id===id)p=MKT_PLANTILLAS[i];
 if(!p)return mktDocVacio();
 var d=mktDocVacio();
 d.formatos.vertical.layers=p.capas();
 return mktAplicarMarca(mktAdaptarDoc(d,'vertical'),marca);
}

/* Export para el navegador y para tests de Node (solo el núcleo puro). */
var MKT={FORMATOS:MKT_FORMATOS,FUENTES:MKT_FUENTES,PLANTILLAS:MKT_PLANTILLAS,
 docVacio:mktDocVacio,docOk:mktDocOk,capaOk:mktCapaOk,uid:mktUid,
 adaptarFormato:mktAdaptarFormato,adaptarDoc:mktAdaptarDoc,aplicarMarca:mktAplicarMarca,
 plantillaDoc:mktPlantillaDoc,hit:mktHit,manejos:mktManejos,hitManejo:mktHitManejo,
 render:mktRender,canvas:mktCanvas,comprimir:mktComprimir,dataUrl:mktDataUrl,blobDeDataUrl:mktBlobDeDataUrl};
if(typeof window!=='undefined')window.MKT=MKT;
if(typeof module!=='undefined'&&module.exports)module.exports=MKT;
