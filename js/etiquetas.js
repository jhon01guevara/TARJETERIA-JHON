/* Fase 19 (extracción 12a): motor de etiquetas de envío — medidas (ETQ_TAM), código de barras Code 128 y dibujo en PDF (etqFlow, etqDibujar, etqPDF).
   Movido TAL CUAL desde js/app.js (las marcas de inicio y fin del bloque viajan con él; los tests las buscan). Script clásico cargado ANTES de js/app.js; al cargarse solo declara
   const/function. Recibe todo por parámetros (sin DB ni SES) y usa window.jspdf solo al EJECUTARSE. La interfaz de etiquetas se queda en app.js. */
/*ETQ-INI*/
/* ===== Etiquetas de envío =====
   Etiquetas para agencias de carga (nacional e internacional) de los pedidos de la tienda virtual.
   Se generan como PDF con el tamaño exacto del rollo (o 4 por hoja A4), con código de barras Code 128. */
const ETQ_TAM={
 e100x150:{n:'100 × 150 mm (4×6 pulgadas, envíos)',w:100,h:150},
 e100x100:{n:'100 × 100 mm',w:100,h:100},
 e80x120:{n:'80 × 120 mm',w:80,h:120},
 e62x100:{n:'62 × 100 mm (Brother QL de 62 mm)',w:62,h:100},
 a6:{n:'A6 (105 × 148 mm)',w:105,h:148},
 a4x4:{n:'Hoja A4 con 4 etiquetas (impresora común)',hoja:1,w:105,h:148.5}
};
const C128='212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232'.split(' ');
function code128B(txt){const s=String(txt).replace(/[^\x20-\x7E]/g,'?'),v=[104];for(const ch of s)v.push(ch.charCodeAt(0)-32);let k=104;for(let i=1;i<v.length;i++)k+=v[i]*i;v.push(k%103);return v.map(x=>C128[x]).join('')+'2331112'}
const etqTxt=t=>String(t==null?'':t).replace(/[^\u0000-ÿ]/g,'').replace(/\s+/g,' ').trim();
function etqBarras(d,code,x,y,w,h){
 const p=code128B(code),mod=p.split('').reduce((a,b)=>a+(+b),0),u=w/mod;let cx=x;d.setFillColor(0);
 for(let i=0;i<p.length;i++){const a=+p[i]*u;if(i%2===0)d.rect(cx,y,a,h,'F');cx+=a}
}
/* Dibuja (o solo mide, si dib es falso) una etiqueta de ancho W y alto H con su esquina en (ox,oy). Devuelve la altura usada. */
function etqFlow(d,W,H,e,s,ox,oy,dib){
 const m=4*s,iw=W-2*m,X=ox+m,pt=.3528,LH=1.16,zonaBar=23*s;let y=m;
 const font=(fs,b,col)=>{d.setFont('helvetica',b?'bold':'normal');d.setFontSize(fs*s);d.setTextColor(col==null?15:col)};
 const cortar=(t,fs,b,max,ancho)=>{font(fs,b);let L=d.splitTextToSize(etqTxt(t),ancho||iw);if(L.length>max){L=L.slice(0,max);let u=L[max-1];while(u.length>3&&d.getTextWidth(u+'...')>(ancho||iw))u=u.slice(0,-1);L[max-1]=u+'...'}return L};
 const bloque=(t,fs,b,max,gap,col,al)=>{if(!etqTxt(t))return;const L=cortar(t,fs,b,max),lh=fs*s*pt*LH;
  if(dib)L.forEach((ln,i)=>d.text(ln,al==='c'?X+iw/2:al==='r'?X+iw:X,oy+y+lh*i+fs*s*pt*.86,al?{align:al==='c'?'center':'right'}:undefined));
  y+=lh*L.length+(gap||0)*s};
 // Encabezado: remitente a la izquierda y tipo de envío a la derecha
 const tipo=e.tipo==='internacional'?'INTERNACIONAL':'NACIONAL';font(8.5,1,255);const tw=d.getTextWidth(tipo)+4*s,bh=6.4*s;
 if(dib){d.setFillColor(0);d.rect(X+iw-tw,oy+y,tw,bh,'F');font(8.5,1,255);d.text(tipo,X+iw-tw/2,oy+y+bh*.72,{align:'center'})}
 font(11,1);if(dib){const nm=cortar(e.rem.nombre||'',11,1,1,iw-tw-3*s)[0]||'';d.text(nm,X,oy+y+bh*.72)}
 y+=bh+2.2*s;if(dib){d.setDrawColor(0);d.setLineWidth(.5*s);d.line(X,oy+y,X+iw,oy+y)}y+=2.4*s;
 // Destinatario
 bloque('DESTINATARIO',6.5,1,1,.6,110);
 bloque(e.dest.name||'-',17,1,2,.8);
 bloque(e.dest.empresa,10,0,1,.8);
 bloque(e.dest.tel?('Tel.: '+e.dest.tel):'',14,1,1,.8);
 bloque(e.dest.ced?('Cédula / ID: '+e.dest.ced):'',9,0,1,.8);
 bloque(e.dest.email,8.5,0,1,1.2);
 bloque(e.dest.suc?('RETIRA EN: '+e.dest.suc):'',11,1,2,.8);
 bloque(e.dest.dir,11.5,0,4,.8);
 bloque(e.dest.ref?('Ref.: '+e.dest.ref):'',8.5,0,2,.8);
 bloque([e.dest.ciudad,e.dest.prov].filter(Boolean).join(', '),11.5,1,2,.4);
 bloque((e.dest.pais||'').toUpperCase(),15,1,1,1.6);
 // Datos del envío en cuadros: agencia, guía, bulto y peso
 const cw=(iw-2*s)/2,ch=9.6*s,celdas=[['AGENCIA',e.agencia||'-'],['GUÍA',e.guia||'-'],['BULTO',e.bulto[0]+' de '+e.bulto[1]],['PESO',e.peso>0?e.peso+' kg':'-']];
 celdas.forEach((c,i)=>{const cx=X+(i%2)*(cw+2*s),cy=oy+y+Math.floor(i/2)*(ch+1.6*s);
  if(dib){d.setDrawColor(0);d.setLineWidth(.35*s);d.rect(cx,cy,cw,ch);font(5.8,0,100);d.text(c[0],cx+1.4*s,cy+2.6*s);font(10,1);const v=cortar(c[1],10,1,1,cw-2.8*s)[0]||'';d.text(v,cx+1.4*s,cy+7.4*s)}});
 y+=2*ch+1.6*s+2.2*s;
 // Datos de la agencia elegida (teléfono, WhatsApp, dirección) y su logo
 if(e.ag){const y0=y,tl=!!(e.logo&&typeof d.addImage==='function'),aw=iw-(tl?11*s:0);
  const lin=(t,fs,b,max,col)=>{if(!etqTxt(t))return;const L=cortar(t,fs,b,max,aw),lh=fs*s*pt*LH;if(dib){font(fs,b,col);L.forEach((ln,i)=>d.text(ln,X,oy+y+lh*i+fs*s*pt*.86))}y+=lh*L.length+.5*s};
  lin('AGENCIA: '+[e.ag.tel&&('Tel. '+e.ag.tel),e.ag.wa&&('WhatsApp '+e.ag.wa)].filter(Boolean).join('  ·  '),8,1,2);
  lin(e.ag.dir,7.5,0,2,70);
  if(tl){if(dib){try{d.addImage(e.logo,/^data:image\/jpeg/.test(e.logo)?'JPEG':'PNG',X+iw-9.6*s,oy+y0,9.6*s,9.6*s)}catch(x){}}y=Math.max(y,y0+10*s)}
  y+=1.4*s}
 // Remitente, contenido y observaciones
 bloque('REMITE: '+[e.rem.nombre,e.rem.tel,e.rem.dir].filter(Boolean).join(' · '),7.5,0,2,1.4,70);
 if(e.obs)bloque('⚠ '.replace(/[^\u0000-ÿ]/g,'')+'OBS.: '+e.obs,8.5,1,2,1.4);
 const libre=H-m-zonaBar-y;
 if(e.cont){font(8.5,0);const lh=8.5*s*pt*LH,maxL=Math.max(1,Math.min(5,Math.floor((libre-4*s)/lh)));bloque('CONTENIDO: '+e.cont,8.5,0,maxL,0)}
 // Código de barras al pie
 const necesario=y+zonaBar+m;
 if(dib){const by=oy+H-m-zonaBar+1*s;etqBarras(d,e.codigo,X+2*s,by,iw-4*s,12.5*s);font(9,1);d.text(e.codigo,X+iw/2,by+12.5*s+3.6*s,{align:'center'});font(7,0,90);d.text(e.fecha,X+iw,oy+H-m+.4*s,{align:'right'});d.text((typeof nombreNegocio==='function'?nombreNegocio():'')||'',X,oy+H-m+.4*s)}
 return necesario
}
function etqDibujar(d,x,y,w,h,e){
 let s=Math.min(1.25,w/100);while(s>.5&&etqFlow(d,w,h,e,s,x,y,false)>h)s-=.04;
 etqFlow(d,w,h,e,s,x,y,true)
}
function etqPDF(lista,tam){
 const J=window.jspdf&&window.jspdf.jsPDF;if(!J)return null;
 if(tam.hoja){const d=new J({unit:'mm',format:'a4'});
  lista.forEach((e,i)=>{if(i>0&&i%4===0)d.addPage();const c=i%4,x=(c%2)*105,y=Math.floor(c/2)*148.5;etqDibujar(d,x,y,105,148.5,e);d.setDrawColor(170);d.setLineWidth(.2);d.rect(x+.5,y+.5,104,147.5)});
  return d.output('blob')}
 const d=new J({unit:'mm',format:[tam.w,tam.h],orientation:tam.w>tam.h?'l':'p'});
 lista.forEach((e,i)=>{if(i>0)d.addPage();etqDibujar(d,0,0,tam.w,tam.h,e)});
 return d.output('blob')
}
/*ETQ-FIN*/
