/* Fase 23 (extracción 5): comprobante del pedido de la tienda: ventana para imprimir, PDF, visor del PDF y comprobante como imagen. Contiene: shopPdfPrint, shopPdf, shopPdfVer y shopRecCanvas, shopImgVer (todas function).
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico cargado justo ANTES de js/app.js: no usa ningún símbolo de app.js al cargarse
   (lo que usa de app.js lo usa dentro de funciones que se ejecutan después de cargar todo). Las const siguen siendo globales de script y las function, propiedades de window. */
function shopPdfPrint(p){const l=p.lead||{},w=window.open('','_blank');if(!w)return alert('Permita las ventanas emergentes para descargar el comprobante.');
 try{w.opener=null}catch(e){window._tjw&&_tjw(e)}
 const emp=(typeof nombreNegocio==='function'?nombreNegocio():((typeof DB!=='undefined'&&DB.cfg&&DB.cfg.nombre)||'Tarjetería Jhon')),num=String(p.id||'').slice(-6).toUpperCase();
 const d=w.document;d.open();d.write('<!DOCTYPE html><meta charset="utf-8"><title></title>');d.close();
 if(!d.body)d.documentElement.appendChild(d.createElement('body'));
 d.title='Pedido '+num;d.body.style.cssText='font-family:Arial,sans-serif;max-width:720px;margin:24px auto;color:#222';
 /* Todo el contenido entra como texto (textContent): nada de lo que escriba un cliente se interpreta como HTML. */
 const E=(t,st,tx,at)=>{const e=d.createElement(t);if(st)e.style.cssText=st;if(tx!=null)e.textContent=tx;if(at)for(const k in at)e.setAttribute(k,at[k]);return e};
 const B=d.body,hd=E('p');hd.append(new Date(p.ts).toLocaleString('es-PA'),E('br'),E('b',null,l.name||''),' · '+(l.tel||'')+' · '+(l.email||''));
 const tb=E('table','width:100%;border-collapse:collapse'),h=E('tr','background:#f3f3f3');
 [['Cant.','left'],['Descripción','left'],['P. unit.','right'],['Subtotal','right']].forEach(c=>h.appendChild(E('th',null,c[0],{align:c[1]})));tb.appendChild(h);
 (p.items||[]).forEach(i=>{const r=E('tr');r.appendChild(E('td',null,String(i.q)));r.appendChild(E('td',null,i.n));r.appendChild(E('td',null,i.p>0?$$(i.p):'Consultar',{align:'right'}));r.appendChild(E('td',null,i.p>0?$$(i.q*i.p):'—',{align:'right'}));tb.appendChild(r)});
 B.append(E('h2','color:#E0457B;margin:0',emp),E('h3','margin:4px 0 14px','Comprobante de pedido N° '+num),hd,tb,E('h3',null,'Total: '+(p.total>0?$$(p.total):'Consultar'),{align:'right'}));
 if(p.nota)B.appendChild(E('p',null,'Nota: '+p.nota));
 B.appendChild(E('p','font-size:12px;color:#666','Precios sin ITBMS. Pedido sujeto a confirmación de disponibilidad.'));
 setTimeout(()=>{try{w.focus();w.print()}catch(e){window._tjw&&_tjw(e)}},250)}
function shopPdf(p,modo){if(!p)return;const J=window.jspdf&&window.jspdf.jsPDF;if(!J)return shopPdfPrint(p);
 try{const d=new J({unit:'mm',format:'a4'}),W=210,M=16,l=p.lead||{},num=String(p.id||'').slice(-6).toUpperCase(),emp=(typeof nombreNegocio==='function'?nombreNegocio():((typeof DB!=='undefined'&&DB.cfg&&DB.cfg.nombre)||'Tarjetería Jhon')),cl=t=>String(t||'').replace(/[^\u0000-\u00FF]/g,'').trim();let y=20;
  try{const g=document.querySelector('.logo img');if(g&&/^data:image\/(png|jpe?g)/i.test(g.src))d.addImage(g.src,/png/i.test(g.src)?'PNG':'JPEG',M,8,0,18)}catch(e){window._tjw&&_tjw(e)}
  d.setFont('helvetica','bold');d.setFontSize(17);d.setTextColor(224,69,123);d.text('COMPROBANTE DE PEDIDO',W-M,16,{align:'right'});
  d.setFontSize(10);d.setTextColor(90);d.setFont('helvetica','normal');d.text(cl(emp),W-M,22,{align:'right'});
  d.setDrawColor(224,69,123);d.setLineWidth(.8);d.line(M,30,W-M,30);y=40;
  d.setTextColor(30);d.setFont('helvetica','bold');d.setFontSize(11);d.text('Pedido N° '+num,M,y);d.setFont('helvetica','normal');d.setFontSize(10);d.text(new Date(p.ts).toLocaleString('es-PA'),W-M,y,{align:'right'});y+=8;
  d.setFont('helvetica','bold');d.text('Cliente',M,y);d.setFont('helvetica','normal');y+=5.5;
  [cl(l.name),l.empresa&&cl(l.empresa),l.tel&&'Tel.: '+l.tel,l.email,l.dir&&cl(l.dir)].filter(Boolean).forEach(t=>{d.text(String(t),M,y);y+=5});y+=5;
  const head=()=>{d.setFillColor(245,235,239);d.rect(M,y-5,W-2*M,8,'F');d.setFont('helvetica','bold');d.setFontSize(9.5);d.text('Cant.',M+2,y);d.text('Descripción',M+20,y);d.text('P. unit.',W-M-34,y,{align:'right'});d.text('Subtotal',W-M-2,y,{align:'right'});d.setFont('helvetica','normal');y+=8};head();
  (p.items||[]).forEach(i=>{const ln=d.splitTextToSize(cl(i.n),100),h=Math.max(1,ln.length)*5+2;if(y+h>262){d.addPage();y=20;head()}
   d.text(String(i.q),M+2,y);d.text(ln,M+20,y);d.text(i.p>0?$$(i.p):'Consultar',W-M-34,y,{align:'right'});d.text(i.p>0?$$(i.q*i.p):'—',W-M-2,y,{align:'right'});y+=h;d.setDrawColor(228);d.setLineWidth(.2);d.line(M,y-3.5,W-M,y-3.5)});
  if(y>250){d.addPage();y=20}y+=4;d.setFont('helvetica','bold');d.setFontSize(13);d.setTextColor(224,69,123);d.text('TOTAL: '+(p.total>0?$$(p.total):'Consultar'),W-M,y,{align:'right'});y+=9;
  d.setTextColor(60);d.setFont('helvetica','normal');d.setFontSize(9.5);if(p.nota){d.text(d.splitTextToSize('Nota: '+cl(p.nota),W-2*M),M,y);y+=12}
  d.setTextColor(110);d.setFontSize(8.5);d.text('Precios sin ITBMS. Pedido sujeto a confirmación de disponibilidad y forma de pago.',M,285);d.text('Gracias por su confianza en '+cl(emp)+'.'+(document.documentElement.classList.contains('xmas')?' ¡Feliz Navidad y próspero Año Nuevo!':''),M,290);
  if(modo==='ver')shopPdfVer(d.output('blob'),'Pedido-'+num+'.pdf');else d.save('Pedido-'+num+'.pdf')}catch(e){shopPdfPrint(p)}}
function shopPdfVer(blob,name){const old=document.getElementById('pdfv');if(old)old.remove();const u=URL.createObjectURL(blob),v=document.createElement('div');v.id='pdfv';
 v.innerHTML=`<div class="pdfvb"><b>${esc(name)}</b><span><a class="btn s" href="${u}" download="${esc(name)}">⬇ Descargar</a> <a class="btn s" href="${u}" target="_blank" rel="noopener">↗ Pestaña nueva</a> <button class="btn s d" id="pdfvx">✕ Cerrar</button></span></div><iframe src="${u}" title="Comprobante"></iframe>`;
 document.body.appendChild(v);const cl=()=>{v.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)};document.getElementById('pdfvx').onclick=cl;
 const k=e=>{if(e.key==='Escape'){cl();removeEventListener('keydown',k)}};addEventListener('keydown',k)}
/* ---- bloque 2 (estaba separado en app.js) ---- */
// ---------- Comprobante como imagen (vista inmediata) ----------
function shopRecCanvas(p,cb){const l=p.lead||{},num=String(p.id||'').slice(-6).toUpperCase(),emp=(typeof nombreNegocio==='function'?nombreNegocio():((typeof DB!=='undefined'&&DB.cfg&&DB.cfg.nombre)||'Tarjetería Jhon')),W=600,S=2,M=36,F="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Arial,sans-serif",PK='#E0457B';
 const c=document.createElement('canvas');c.width=W*S;c.height=40*S;const x=c.getContext('2d');
 const wrap=(t,w,font)=>{x.font=font;const out=[];String(t||'').split(/\n/).forEach(par=>{let ln='';par.split(/\s+/).filter(Boolean).forEach(wd=>{const tt=ln?ln+' '+wd:wd;if(x.measureText(tt).width>w&&ln){out.push(ln);ln=wd}else ln=tt});out.push(ln)});return out};
 const rows=(p.items||[]).map(i=>({q:i.q,ln:wrap(i.n,290,'500 14px '+F),pu:i.p>0?$$(i.p):'Consultar',st:i.p>0?$$(i.q*i.p):'—'}));
 const cli=[l.name,l.empresa,l.tel&&'Tel.: '+l.tel,l.email,l.dir].filter(Boolean),nota=p.nota?wrap('Nota: '+p.nota,W-2*M,'13px '+F):[],foot=wrap('Precios sin ITBMS. Pedido sujeto a confirmación de disponibilidad y forma de pago.',W-2*M,'11.5px '+F);
 const est=p.estado==='atendido'?['Atendido','#2bb673']:['Recibido','#E8870A'];
 let logo=null;
 const lay=d=>{let y=0;if(d){x.fillStyle='#fff';x.fillRect(0,0,W,c.height/S);x.fillStyle=PK;x.fillRect(0,0,W,8)}
  const T=(t,px,py,font,col,al)=>{if(!d)return;x.font=font;x.fillStyle=col;x.textAlign=al||'left';x.fillText(t,px,py)};
  y=30;if(d&&logo){const h=46,w=Math.min(150,logo.width*h/logo.height);x.drawImage(logo,M,y,w,h)}
  T('COMPROBANTE DE PEDIDO',W-M,y+20,'700 17px '+F,PK,'right');T(emp,W-M,y+40,'500 12.5px '+F,'#6E6E73','right');
  y+=68;if(d){x.fillStyle=PK;x.fillRect(M,y,W-2*M,2)}y+=30;
  T('Pedido N° '+num,M,y,'700 17px '+F,'#1D1D1F');T(new Date(p.ts).toLocaleString('es-PA'),W-M,y,'13px '+F,'#6E6E73','right');y+=14;
  if(d){x.font='600 12px '+F;const tw=x.measureText(est[0]).width+20;x.fillStyle=est[1]+'22';x.beginPath();x.roundRect(M,y+2,tw,22,11);x.fill();T(est[0],M+10,y+17,'600 12px '+F,est[1])}y+=42;
  T('CLIENTE',M,y,'700 11px '+F,'#8E8E93');y+=20;cli.forEach((t,k)=>{T(String(t),M,y,(k?'400':'600')+' 14px '+F,'#1D1D1F');y+=20});y+=12;
  if(d){x.fillStyle='#FBEAF0';x.beginPath();x.roundRect(M,y,W-2*M,30,8);x.fill()}
  T('CANT.',M+12,y+20,'700 11px '+F,'#6E6E73');T('DESCRIPCIÓN',M+64,y+20,'700 11px '+F,'#6E6E73');T('P. UNIT.',W-M-110,y+20,'700 11px '+F,'#6E6E73','right');T('SUBTOTAL',W-M-12,y+20,'700 11px '+F,'#6E6E73','right');y+=30;
  rows.forEach(r=>{const h=r.ln.length*19+16;T(String(r.q),M+12,y+22,'600 14px '+F,'#1D1D1F');r.ln.forEach((t,k)=>T(t,M+64,y+22+k*19,'500 14px '+F,'#1D1D1F'));T(r.pu,W-M-110,y+22,'14px '+F,'#3A3A3C','right');T(r.st,W-M-12,y+22,'600 14px '+F,'#1D1D1F','right');y+=h;if(d){x.fillStyle='#E5E5EA';x.fillRect(M,y-1,W-2*M,1)}});
  y+=26;T('Total',W-M-190,y,'500 15px '+F,'#6E6E73','right');T(p.total>0?$$(p.total):'Consultar',W-M-12,y+4,'800 30px '+F,'#1D1D1F','right');y+=34;
  nota.forEach(t=>{T(t,M,y,'13px '+F,'#6E6E73');y+=18});y+=14;
  foot.forEach(t=>{T(t,M,y,'11.5px '+F,'#8E8E93');y+=16});T('Gracias por su confianza en '+emp+'.',M,y+4,'500 11.5px '+F,'#8E8E93');y+=30;
  if(d){x.fillStyle=PK;x.fillRect(0,y-8,W,8)}return y};
 const go=()=>{const H=lay(false);c.width=W*S;c.height=H*S;x.setTransform(S,0,0,S,0,0);lay(true);cb(c)};
 const g=document.querySelector('.logo img');if(g&&g.src){const im=new Image();im.onload=()=>{logo=im;go()};im.onerror=go;im.src=g.src}else go()}
function shopImgVer(p){if(!p)return;const old=$('imgv');if(old)old.remove();
 shopRecCanvas(p,c=>{const num=String(p.id||'').slice(-6).toUpperCase(),u=c.toDataURL('image/png'),v=document.createElement('div');v.id='imgv';
  const cs=!!(navigator.canShare&&navigator.share);
  v.innerHTML=`<div class="ivb"><b>Pedido N° ${num}</b><span><a class="ivbt p" href="${u}" download="Pedido-${num}.png">⬇ Imagen</a><button class="ivbt" id="ivpdf">📄 PDF</button>${cs?'<button class="ivbt" id="ivsh">↗ Compartir</button>':''}<button class="ivbt" id="ivx" aria-label="Cerrar">✕</button></span></div><div class="ivs"><img src="${u}" alt="Comprobante del pedido ${num}"></div>`;
  document.body.appendChild(v);const cl=()=>{v.remove();document.removeEventListener('keydown',kd)},kd=e=>{if(e.key==='Escape')cl()};document.addEventListener('keydown',kd);
  $('ivx').onclick=cl;v.onclick=e=>{if(e.target===v||e.target.className==='ivs')cl()};$('ivpdf').onclick=()=>shopPdf(p);
  const sh=$('ivsh');if(sh)sh.onclick=()=>c.toBlob(b=>{const f=new File([b],'Pedido-'+num+'.png',{type:'image/png'});if(navigator.canShare({files:[f]}))navigator.share({files:[f],title:'Pedido '+num}).catch(()=>{});else navigator.share({title:'Pedido '+num,text:'Comprobante de pedido '+num}).catch(()=>{})})})}
