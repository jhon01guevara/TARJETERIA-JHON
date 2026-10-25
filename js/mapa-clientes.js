/* Fase 21 (extracción 1): mapa de clientes: MC, MC_VACIO, mcTieneLoc (const) y las funciones mc* (selector del formulario, mapa general y tarjeta del Inicio).
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico, cargado justo ANTES de js/app.js; no usa ningún símbolo de app.js al cargarse
   (lo que usa de app.js lo usa dentro de funciones que se ejecutan después de cargar todo). Las const siguen siendo globales de script y las function, propiedades de window. */
/* ===== Mapa de clientes: selector en el formulario, mapa general (admin) y tarjeta del Inicio ===== */
const MC={s:{},q:'',f:'todos'};
const MC_VACIO=()=>({t:0,n:0,ult:'',pend:0,venc:0,vend:{}});
const mcTieneLoc=c=>!!c&&typeof c.lat==='number'&&typeof c.lng==='number';

// Cartografía tipo Uber: Dark Matter (nocturno/alto contraste), Positron (día) y Satélite HD
function mcCapas(m,def){
 const uberDark=L.layerGroup([
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,attribution:'Tiles &copy; Esri &mdash; Esri, NAVTEQ'}),
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{maxZoom:18})
 ]);
 const uberLight=L.layerGroup([
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,attribution:'Tiles &copy; Esri &mdash; Esri, NAVTEQ'}),
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{maxZoom:18})
 ]);
 const sat=L.layerGroup([
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:18,attribution:'Tiles &copy; Esri'}),
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:18})
 ]);
 const calle=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'});
 const isDark=document.documentElement.getAttribute('data-kt')==='dark'||(DB.cfg&&DB.cfg.tema==='nocturno')||document.documentElement.classList.contains('galaxia');
 const lyr=(def==='sat'?sat:def==='calle'?calle:def==='light'?uberLight:def==='dark'?uberDark:(isDark?uberDark:uberLight));
 lyr.addTo(m);
 L.control.layers({'🌙 Uber Noche':uberDark,'☀️ Uber Día':uberLight,'🗺️ Calles':calle,'🛰️ Satélite':sat}).addTo(m)
}

// Generador de edificios estilo Monopoly en 3D (Verde, Naranja, Rojo, Gris)
function monoBuildingHTML(type, scale, name){
 const cfg={
  verde:{roof:'#10b981',roofDark:'#047857',wall:'#f0fdf4',awning:'#10b981',door:'#065f46',icon:'🛍️'},
  naranja:{roof:'#f59e0b',roofDark:'#b45309',wall:'#fffbeb',awning:'#f59e0b',door:'#78350f',icon:'⏳'},
  rojo:{roof:'#ef4444',roofDark:'#b91c1c',wall:'#fef2f2',awning:'#ef4444',door:'#7f1d1d',icon:'⚠️'},
  gris:{roof:'#94a3b8',roofDark:'#475569',wall:'#f8fafc',awning:'#94a3b8',door:'#334155',icon:'🏬'}
 }[type]||{roof:'#94a3b8',roofDark:'#475569',wall:'#f8fafc',awning:'#94a3b8',door:'#334155',icon:'🏬'};
 const sc=scale||1,w=Math.round(38*sc),h=Math.round(44*sc);
 return `<div class="mono-marker mono-${type}" style="width:${w}px;height:${h}px;position:relative;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35)) drop-shadow(0 0 1px rgba(255,255,255,.8))" title="${esc(name||'')}"><svg viewBox="0 0 44 48" width="100%" height="100%" style="display:block;overflow:visible"><ellipse cx="22" cy="45" rx="16" ry="3.2" fill="rgba(0,0,0,0.38)"/><rect x="29" y="6" width="4.5" height="9" fill="${cfg.roofDark}" rx="1"/><ellipse cx="31.2" cy="6" rx="2.2" ry="0.8" fill="rgba(255,255,255,0.4)"/><path d="M7 19 L37 19 L37 42 C37 43 35.8 44 34 44 L10 44 C8.2 44 7 43 7 42 Z" fill="${cfg.wall}" stroke="rgba(0,0,0,0.18)" stroke-width="0.8"/><rect x="10" y="27" width="7.5" height="8" rx="1.5" fill="#bae6fd" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/><path d="M10 31 L17.5 31 M13.7 27 L13.7 35" stroke="#7dd3fc" stroke-width="0.6"/><rect x="26.5" y="27" width="7.5" height="8" rx="1.5" fill="#bae6fd" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/><path d="M26.5 31 L34 31 M30.2 27 L30.2 35" stroke="#7dd3fc" stroke-width="0.6"/><path d="M18.5 31 L25.5 31 L25.5 44 L18.5 44 Z" fill="${cfg.door}"/><circle cx="23.8" cy="38" r="0.7" fill="#fbbf24"/><path d="M5.5 19 L38.5 19 L36.5 25.5 L7.5 25.5 Z" fill="${cfg.awning}"/><path d="M12 19 L15.5 19 L14.5 25.5 L11 25.5 Z" fill="#ffffff"/><path d="M20.5 19 L24 19 L23 25.5 L19.5 25.5 Z" fill="#ffffff"/><path d="M29 19 L32.5 19 L31.5 25.5 L28 25.5 Z" fill="#ffffff"/><path d="M5.5 25.5 Q8 27.5 11 25.5 Q14 27.5 17 25.5 Q20 27.5 23 25.5 Q26 27.5 29 25.5 Q32 27.5 35 25.5 Q37.5 27.5 38.5 25.5 L36.5 25.5 L7.5 25.5 Z" fill="${cfg.awning}"/><path d="M22 2 L39.5 19 L4.5 19 Z" fill="${cfg.roof}"/><path d="M22 2 L39.5 19 L22 19 Z" fill="rgba(0,0,0,0.2)"/><path d="M4.5 19 L22 2 L22 19 Z" fill="rgba(255,255,255,0.22)"/><circle cx="22" cy="4" r="5" fill="#ffffff" stroke="${cfg.roofDark}" stroke-width="1"/><text x="22" y="7" font-size="6" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">${cfg.icon}</text></svg></div>`;
}

// Lo comprado por cada cliente: se suman las facturas no anuladas (de todos los vendedores) que llevan su nombre.
function mcStats(){
 const por=new Map(),h=hoy();
 act().forEach(f=>{const k=_cliNorm(f.cli);if(!k)return;let o=por.get(k);if(!o){o=MC_VACIO();por.set(k,o)}
  const t=+f.total||0;o.t+=t;o.n++;if(f.fecha>o.ult)o.ult=f.fecha;
  if(f.credito&&!f.cobrada){const m=+f.credito.monto||0;o.pend+=m;if(f.credito.vence&&f.credito.vence<h)o.venc+=m}
  const vn=f.vn||vdName(f.vend||'admin');o.vend[vn]=(o.vend[vn]||0)+t});
 return por
}
function mcVisibles(filtro,q){
 const por=mcStats(),nq=_cliNorm(q);
 return (DB.cli||[]).filter(c=>c&&c.n).map(c=>({c,s:por.get(_cliNorm(c.n))||MC_VACIO(),loc:mcTieneLoc(c)})).filter(x=>{
  if(nq&&!_cliNorm([x.c.n,x.c.r,x.c.t].join(' ')).includes(nq))return false;
  return filtro==='compra'?x.s.n>0:filtro==='sin'?x.s.n===0:filtro==='deuda'?x.s.pend>0:filtro==='venc'?x.s.venc>0:true})
}
function mcPop(x){
 const c=x.c,s=x.s,vs=Object.entries(s.vend).sort((a,b)=>b[1]-a[1]).map(e=>esc(e[0])).join(', ');
 const type=s.venc>0?'rojo':s.pend>0?'naranja':s.n>0?'verde':'gris';
 const bCol=type==='rojo'?'#ef4444':type==='naranja'?'#f59e0b':type==='verde'?'#10b981':'#64748b';
 const bTxt=type==='rojo'?'⚠️ Saldo Vencido':type==='naranja'?'⏳ Saldo por Cobrar':type==='verde'?'🛍️ Cliente con Compras':'🏬 Prospecto sin Compras';
 const telLim=(c.t||'').replace(/\D/g,'');
 return `<div class="mcp" style="padding:0;min-width:240px;max-width:310px;font-family:sans-serif">
  <div style="background:${bCol};color:#fff;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0">
    <span style="font-weight:700;font-size:12px;letter-spacing:.02em">${bTxt}</span>
    <span style="font-size:15px">🏠 Monopoly</span>
  </div>
  <div style="padding:12px">
    <b style="font-size:15px;display:block;margin-bottom:2px;color:#0f172a">${esc(c.n)}</b>
    ${c.r?`<div style="font-size:11.5px;color:#64748b;margin-bottom:2px">RUC/Céd.: <b>${esc(c.r)}</b></div>`:""}
    ${c.t?`<div style="font-size:11.5px;color:#64748b;margin-bottom:2px">Tel.: <a href="tel:${esc(c.t)}" style="color:#0284c7;font-weight:600">${esc(c.t)}</a></div>`:""}
    ${c.d?`<div style="font-size:11px;color:#64748b;margin-top:2px;line-height:1.3">📍 ${esc(c.d)}</div>`:""}
    <div style="margin:10px 0;border-top:1px dashed #e2e8f0;padding-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:#f8fafc;padding:6px 8px;border-radius:6px;border:1px solid #e2e8f0">
        <small style="color:#64748b;font-size:10px;display:block;text-transform:uppercase;font-weight:600">Total Comprado</small>
        <b style="color:#0f172a;font-size:14px">${$$(s.t)}</b>
        <small style="color:#64748b;font-size:10.5px;display:block">${s.n} factura${s.n===1?"":"s"}</small>
      </div>
      <div style="background:${s.pend>0?(s.venc>0?"#fef2f2":"#fffbeb"):"#f8fafc"};padding:6px 8px;border-radius:6px;border:1px solid ${s.pend>0?(s.venc>0?"#fecaca":"#fde68a"):"#e2e8f0"}">
        <small style="color:${s.pend>0?(s.venc>0?"#b91c1c":"#b45309"):"#64748b"};font-size:10px;display:block;text-transform:uppercase;font-weight:600">Por Cobrar</small>
        <b style="color:${s.pend>0?(s.venc>0?"#ef4444":"#f59e0b"):"#0f172a"};font-size:14px">${$$(s.pend)}</b>
        <small style="color:${s.venc>0?"#ef4444":"#64748b"};font-size:10.5px;display:block">${s.venc>0?`Vencido: ${$$(s.venc)}`:"Al día"}</small>
      </div>
    </div>
    ${s.n>0?`<div style="font-size:11px;color:#64748b;margin-bottom:8px">📅 Última compra: <b>${fdate(s.ult)}</b></div>`:""}
    ${vs?`<div style="font-size:11px;color:#64748b;margin-bottom:8px">🧑‍💼 ${vs}</div>`:""}
    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
      <a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" target="_blank" rel="noopener" style="flex:1;min-width:110px;text-align:center;padding:6px 10px;border-radius:8px;background:#0f172a;color:#fff;text-decoration:none;font-size:11.5px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:4px">🚗 Cómo llegar</a>
      ${telLim?`<a href="https://wa.me/507${telLim}" target="_blank" rel="noopener" style="padding:6px 10px;border-radius:8px;background:#10b981;color:#fff;text-decoration:none;font-size:11.5px;font-weight:600;display:inline-flex;align-items:center;gap:4px">💬 WhatsApp</a>`:""}
    </div>
  </div>
 </div>`;
}
const mcLeyenda=()=>`<div class="mcleg" style="display:flex;gap:12px;flex-wrap:wrap;font-size:12.5px;margin-top:10px;align-items:center;padding:10px 14px;background:var(--sf);border:1px solid var(--linea);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.04)">
  <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:#10b981;border:1px solid #059669;box-shadow:0 1px 3px rgba(0,0,0,.25);display:inline-block"></span> <b>Verde:</b> Con compras</span>
  <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:#f59e0b;border:1px solid #d97706;box-shadow:0 1px 3px rgba(0,0,0,.25);display:inline-block"></span> <b>Naranja:</b> Saldo por cobrar</span>
  <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:#ef4444;border:1px solid #dc2626;box-shadow:0 1px 3px rgba(0,0,0,.25);display:inline-block"></span> <b>Rojo:</b> Saldo vencido</span>
  <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:#94a3b8;border:1px solid #64748b;box-shadow:0 1px 3px rgba(0,0,0,.25);display:inline-block"></span> <b>Gris:</b> Sin compras</span>
  <span style="color:var(--gris);margin-left:auto;font-size:12px">🏠 Edificios Monopoly (tamaño según compras)</span>
</div>`;

function mcPintar(slot){
 const el=$(slot);if(!el||!window.L)return;
 const ant=MC.s[slot];if(ant&&ant.map){try{ant.map.remove()}catch(e){window._tjw&&_tjw(e)}}
 const home=slot==='mcHomeMap',map=L.map(slot,{zoomControl:true,scrollWheelZoom:!home});
 mcCapas(map,'uber');
 if(home){map.on('focus',()=>map.scrollWheelZoom.enable());map.on('blur',()=>map.scrollWheelZoom.disable())}
 map.on('zoomend',()=>el.classList.toggle('mc-nolbl',map.getZoom()<13));
 map.setView([8.9824,-79.5199],11);
 MC.s[slot]={map,grupo:L.featureGroup().addTo(map),mk:{}};
 mcCapa(slot,true);
 setTimeout(()=>mapaRefrescar(map),150)
}

function mcCapa(slot,ajustar){
 const o=MC.s[slot];if(!o||!o.map||!$(slot))return;
 const full=slot==='mcMap',datos=mcVisibles(full?MC.f:'todos',full?MC.q:'');
 o.grupo.clearLayers();o.mk={};
 datos.filter(x=>x.loc).forEach(x=>{
  const type=x.s.venc>0?'rojo':x.s.pend>0?'naranja':x.s.n>0?'verde':'gris';
  const scale=x.s.t>1000?1.25:x.s.t>300?1.12:x.s.t>50?1.0:0.88;
  const w=Math.round(38*scale),h=Math.round(44*scale);
  const icon=L.divIcon({className:'mono-icon-wrap',html:monoBuildingHTML(type,scale,x.c.n),iconSize:[w,h],iconAnchor:[w/2,h-2],popupAnchor:[0,-h+2]});
  const m=L.marker([x.c.lat,x.c.lng],{icon}).bindPopup(mcPop(x),{maxWidth:320,className:'mc-uber-pop'}).bindTooltip(esc(x.c.n),{permanent:true,direction:'top',offset:[0,-h],className:'mc-tt'});
  m.addTo(o.grupo);o.mk[x.c.id]=m
 });
 if(ajustar&&datos.some(x=>x.loc))o.map.fitBounds(o.grupo.getBounds().pad(.2),{maxZoom:16});
 $(slot).classList.toggle('mc-nolbl',o.map.getZoom()<13);
 if(!full)return;
 const con=datos.filter(x=>x.loc),sin=datos.filter(x=>!x.loc),sum=a=>a.reduce((t,x)=>t+x.s.t,0),pen=datos.reduce((t,x)=>t+x.s.pend,0);
 const S=$('mcSum');
 if(S){
  const nVerde=con.filter(x=>x.s.venc<=0&&x.s.pend<=0&&x.s.n>0).length;
  const nNaranja=con.filter(x=>x.s.venc<=0&&x.s.pend>0).length;
  const nRojo=con.filter(x=>x.s.venc>0).length;
  const nGris=con.filter(x=>x.s.n===0&&x.s.pend<=0).length;
  S.innerHTML=`<span>📍 <b>${con.length}</b> con ubicación</span><span class="okt">🟢 <b>${nVerde}</b> con compras</span><span class="warnt">🟠 <b>${nNaranja}</b> por cobrar</span><span class="errt">🔴 <b>${nRojo}</b> vencidos</span><span class="mutet">🔘 <b>${nGris}</b> sin compras</span><span>💰 <b>${$$(sum(datos))}</b> comprado</span><span>⏳ <b>${$$(pen)}</b> por cobrar</span>`;
 }
 const Li=$('mcList');
 if(Li){
  Li.innerHTML=(con.length?`<table><tr><th>Comercio / Cliente</th><th class="r">Estado</th><th class="r">Total comprado</th><th class="r">Facturas</th><th>Última compra</th><th class="r">Por cobrar</th><th></th></tr>${con.slice().sort((a,b)=>b.s.t-a.s.t).map(x=>{
   const t=x.s.venc>0?'rojo':x.s.pend>0?'naranja':x.s.n>0?'verde':'gris';
   const stPill=t==='rojo'?'<span class="mono-badge mono-badge-rojo">🔴 Saldo vencido</span>':t==='naranja'?'<span class="mono-badge mono-badge-naranja">🟠 Por cobrar</span>':t==='verde'?'<span class="mono-badge mono-badge-verde">🟢 Con compras</span>':'<span class="mono-badge mono-badge-gris">🔘 Sin compras</span>';
   return `<tr><td><b>${esc(x.c.n)}</b>${x.c.r?`<br><small style="color:var(--gris)">RUC: ${esc(x.c.r)}</small>`:''}</td><td class="r">${stPill}</td><td class="r"><b>${$$(x.s.t)}</b></td><td class="r">${x.s.n}</td><td>${x.s.ult?fdate(x.s.ult):'—'}</td><td class="r">${x.s.pend>0?`<b style="color:${x.s.venc>0?'#ef4444':'#f59e0b'}">${$$(x.s.pend)}</b>`:'—'}</td><td class="r"><button class="btn s" data-h-click="h333" data-a-click="${_ha(x.c.id)}" style="display:inline-flex;align-items:center;gap:4px">🚗 Ver en el mapa</button></td></tr>`
  }).join('')}</table>`:'<div class="vacio">Ningún comercio con ubicación coincide con este filtro.</div>')+(sin.length?`<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--gris);font-size:13px">Clientes sin ubicación GPS (${sin.length})</summary><div style="font-size:12.5px;margin-top:8px;padding:8px 12px;background:var(--sf);border-radius:8px">${sin.map(x=>esc(x.c.n)).join(' · ')}</div></details>`:'')
 }
}

function mcIr(id){
 const o=MC.s.mcMap,m=o&&o.mk[id];if(!m)return;
 const e=$('mcMap');if(e)e.scrollIntoView({behavior:'smooth',block:'center'});
 o.map.flyTo(m.getLatLng(),17,{duration:.8});setTimeout(()=>{try{m.openPopup()}catch(x){window._tjw&&_tjw(x)}},900)
}

function mcHomeHTML(){
 const n=(DB.cli||[]).filter(mcTieneLoc).length;
 return `<div class="card" id="mcHomeCard"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><h3 style="margin:0;font-size:16px">🗺️ Mapa de Clientes y Comercios · Estilo Uber</h3><small style="color:var(--gris)">${n} comercio${n===1?'':'s'} geolocalizado${n===1?'':'s'} · Comercios visualizados como edificios Monopoly en 3D</small></div><button class="btn s" data-h-click="h334" style="display:inline-flex;align-items:center;gap:6px"><span>🔍</span><span>Ver mapa completo</span></button></div><div id="mcHomeMap" class="mcmap mcmap-s"></div>${mcLeyenda()}</div>`
}
