/* Fase 21 (extracción 4): plantillas de factura y sello automático de estado: TPLS, VF (const) y facTpl, facEstado, facSello, tpl*, vf*, verFactura, verTpl, facCobrar.
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico, cargado justo ANTES de js/app.js; no usa ningún símbolo de app.js al cargarse
   (lo que usa de app.js lo usa dentro de funciones que se ejecutan después de cargar todo). Las const siguen siendo globales de script y las function, propiedades de window. */
// --- Plantillas de factura + sello automático de estado ---
const TPLS=[['clasica','Clásica','#1a1a1a','#ffffff'],['dorado','Dorado Elegante','#c59b27','#fffcf5'],['marino','Azul Marino Corporativo','#0f3460','#fbfdff'],['esmeralda','Esmeralda Ejecutivo','#0d5c3a','#f6fbf8'],['minimalista','Minimalista','#222222','#ffffff'],['violeta','Violeta Moderno','#7928ca','#fcfaff'],['burdeos','Burdeos Luxury','#800020','#fffafb'],['kraft','Kraft Vintage','#4a3728','#fcf6e8'],['sunset','Sunset Degradé','#ff4e50','#fffdfb'],['dark','Dark Pro','#4e9af1','#18191a'],['silver','Plata Metálica','#8a94a6','#f4f6f8'],['pos','Ticket POS 80 mm','#000000','#ffffff'],['nitida','Nítida Pro','#111111','#ffffff'],['apple','Apple Minimal','#0a84ff','#f5f7fa']];
function facTpl(f){const t=(f&&f.tpl)||DB.cfg.tpl||'clasica';return TPLS.some(x=>x[0]===t)?t:'clasica'}
function facEstado(f){
 if(f.anulada)return{k:'anulada',t:'ANULADA',s:''};
 const cr=f.credito;
 if(!cr)return{k:'pagado',t:'PAGADO',s:fdate(f.fecha)};
 if(f.cobrada)return{k:'pagado',t:'PAGADO',s:fdate(f.cobrada)};
 const par=cr.monto<f.total-0.01,sal=par?' · Saldo '+$$(cr.monto):'';
 if(cr.vence<hoy())return{k:'venc',t:'VENCIDA',s:'Venció '+fdate(cr.vence)+sal};
 return{k:'pend',t:par?'PAGO PARCIAL':'PAGO PENDIENTE',s:'A crédito · Vence '+fdate(cr.vence)+sal}}
function facSello(f){if(DB.cfg.sello===0)return '';const e=facEstado(f),c={pagado:'stamp-pagado',pend:'stamp-credito',venc:'stamp-cancelado',anulada:'stamp-anulada'}[e.k];
 return `<div class="stamp-wrap"><div class="stamp-box ${c}">${e.t}${e.s?`<span class="stamp-date">${e.s}</span>`:''}</div></div>`}
function tplCard(){const cur=DB.cfg.tpl||'clasica',on=DB.cfg.sello!==0;
 return `<h3 style="margin:0 0 4px">🧾 Plantillas de factura</h3><p style="font-size:12.5px;color:var(--gris)">Elija el diseño con el que se imprimen, descargan y envían todas sus facturas. También puede cambiarlo por factura desde “Ver”.</p><div class="tpg">${TPLS.map(t=>`<div class="tpt ${cur===t[0]?'on':''}" data-h-click="h137" data-a-click="${_ha(t[0])}"><div class="tpm" style="background:${t[3]};border-top-color:${t[2]}"><span style="display:block;height:7px;width:46%;background:${t[2]};border-radius:3px;margin-bottom:6px"></span><i style="background:${t[2]}"></i><i style="background:${t[2]}"></i><i style="background:${t[2]};width:70%"></i><span style="display:block;height:9px;width:40%;margin:9px 0 0 auto;background:${t[2]};border-radius:3px"></span></div><b>${cur===t[0]?'✓ ':''}${t[1]}</b></div>`).join('')}</div><div class="g"><div><label>Sello automático (Pagado / Pago pendiente / Vencida / Anulada)</label><select data-h-change="h136"><option value="1" ${on?'selected':''}>Activado</option><option value="0" ${on?'':'selected'}>Desactivado</option></select></div></div><br><button class="btn p" data-h-click="h135">👁 Vista previa con mi última factura</button>`}
function tplRef(){const c=$('tplCard');if(c)c.innerHTML=tplCard()}
function tplSet(k){DB.cfg.tpl=k;save();tplRef()}
function tplPrev(){const f=DB.fac[DB.fac.length-1];if(!f)return alert('Aún no hay facturas para mostrar la vista previa.');verFactura(f.id)}
const VF={z:1,mx:false};
function vfFit(){const w=$('vfw'),i=$('vfi'),sc=$('vfs'),fa=sc&&sc.firstElementChild;if(!fa)return;
 const W=fa.offsetWidth,H=fa.offsetHeight,k0=(w.clientWidth-16)/W,k=Math.max(.2,Math.min(VF.mx?1.4:1,k0)*VF.z);
 sc.style.transform='scale('+k+')';i.style.width=Math.round(W*k)+'px';i.style.height=Math.round(H*k)+'px';i.style.margin='0 auto';
 w.style.maxHeight=VF.mx?'calc(100vh - 150px)':'68vh';w.style.overflow='auto';w.style.height=''}
function vfZoom(d){VF.z=Math.max(.5,Math.min(2.5,+(VF.z+d*.15).toFixed(2)));vfFit()}
function vfMax(){VF.mx=!VF.mx;$('mb').classList.toggle('vfmax',VF.mx);const b=$('vfmx');if(b)b.textContent=VF.mx?'🗗 Restaurar':'⛶ Maximizar';VF.z=1;vfFit()}
function verFactura(id){const f=DB.fac.find(x=>x.id==id);if(!f)return;const adm=esAdmin();VF.z=1;VF.mx=false;$('mb').classList.remove('vfmax');
 $('mb').innerHTML=`<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:12px"><b>Factura #${esc(f.n)} — ${esc(f.cli)}</b><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn s" data-h-click="h134" title="Reducir">➖</button><button class="btn s" data-h-click="h133" title="Ampliar" aria-label="Agregar evento">➕</button><button class="btn s" id="vfmx" data-h-click="h132">⛶ Maximizar</button><button class="btn s" data-h-click="h12" aria-label="Cerrar">✕</button></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-bottom:12px">${adm?`<div style="min-width:220px"><label>Plantilla</label><select data-h-change="h131" data-a-change="${_ha(id)}"><option value="" ${f.tpl?'':'selected'}>Predeterminada (Configuración)</option>${TPLS.map(t=>`<option value="${t[0]}" ${f.tpl===t[0]?'selected':''}>${t[1]}</option>`).join('')}</select></div>`:''}<button class="btn p s" data-h-click="h130" data-a-click="${_ha(id)}">🖨 Imprimir</button>${adm&&f.credito&&!f.anulada?(f.cobrada?`<button class="btn s" data-h-click="h129" data-a-click="${_ha(id)}">↩ Quitar “Pagado”</button>`:`<button class="btn s" data-h-click="h128" data-a-click="${_ha(id)}">✔ Marcar como cobrada</button>`):''}</div><div id="vfw" style="overflow:hidden;border-radius:12px;background:var(--soft);padding:8px"><div id="vfi"><div id="vfs" style="transform-origin:top left">${facHTML(id)}</div></div></div>`;
 $('md').classList.add('on');vfFit()}
function verTpl(id,k){const f=DB.fac.find(x=>x.id==id);if(!f||!esAdmin())return;if(k)f.tpl=k;else delete f.tpl;save();$('vfs').innerHTML=facHTML(id);vfFit()}
function facCobrar(id,on){const f=DB.fac.find(x=>x.id==id);if(!f||!esAdmin())return;
 if(on){f.cobrada=hoy();DB.agenda=DB.agenda.filter(e=>e.fid!==id)}else{delete f.cobrada;try{credAg(f)}catch(e){window._tjw&&_tjw(e)}}
 save();verFactura(id);if(vista==='fac')R.fac()}
