/* js/guia.js · «Primeros pasos» de VEN CRM: guía dentro del panel + ayudas «¿Cómo funciona?».
   Se carga DESPUÉS de js/app.js y usa sus datos (DB, CL, TD, SES…) solo para LEER. No crea colecciones ni toca reglas de Firestore.
   · Progreso por empresa y usuario en localStorage (clave tj_guia_<usuario>, con el sufijo de empresa de lsk()).
   · Solo en el panel con sesión iniciada: nunca en la tienda pública (?tienda=…).
   · Pasos que se completan solos al detectar datos existentes; el resto se marca con «Ya lo hice» (o «Omitir» si es opcional).
   Revertir: quitar el <script src="js/guia.js">, el <link css/guia.css> y el <div id="guiaPista"> de index.html. */
(function () {
  'use strict';
  if (window.__tjGuia) return;
  var EN_TIENDA = false;
  try { EN_TIENDA = !!SHOP; } catch (e) { EN_TIENDA = /[?&]tienda(=|&|$)/.test(location.search); }
  if (EN_TIENDA) return; // la tienda pública nunca muestra la guía
  window.__tjGuia = 1;

  function aviso(e) { try { if (window._tjw) window._tjw(e); } catch (_) {} }
  function g(id) { return document.getElementById(id); }
  function html(s) { try { return esc(s); } catch (e) { return String(s).replace(/[&<>"']/g, ''); } }
  function ha() { try { return _ha.apply(null, arguments); } catch (e) { return ''; } }
  function haySesion() { try { return !!SES; } catch (e) { return false; } }
  function admin() { try { return esAdmin(); } catch (e) { return false; } }
  function puedeVer(k) { try { return puede(k); } catch (e) { return false; } }

  /* ---------- los pasos ---------- */
  var cuentaCat = null, cuentaCatT = 0;
  function conLogo() {
    try { var c = DB.cfg || {}; return !!(c.panelLogoSrc || c.loginLogoSrc || (TD && TD.logoUrl) || TJEmpresa.empEsInicial()); } catch (e) { return false; }
  }
  var PASOS = [
    { id: 'empresa', pantalla: 'config', solo: 'admin', titulo: 'Complete los datos de su empresa',
      desc: 'Nombre, teléfono, correo y logo. Salen en sus facturas y en su tienda en línea.', boton: 'Completar datos',
      tip: 'Pulse «Editar», escriba sus datos y pulse «Guardar datos». El logo se sube más abajo.',
      hecho: function () { var c = DB.cfg || {}; return !!(String(c.nombre || '').trim() && (String(c.tel || '').trim() || String(c.email || '').trim() || String(c.dir || '').trim()) && conLogo()); } },
    { id: 'producto', pantalla: 'prod', titulo: 'Cree su primer producto',
      desc: 'Un producto es lo que usted vende: un nombre y un precio. Luego lo elige al hacer una factura.', boton: 'Crear producto',
      tip: 'Escriba el nombre y el precio, y pulse «Agregar».',
      hecho: function () { return (DB.prod || []).length > 0; } },
    { id: 'catalogo', pantalla: 'cat', opcional: true, titulo: 'Suba sus fotos al Catálogo',
      desc: 'Las fotos o archivos de lo que ofrece. De ahí salen los productos de su tienda en línea.', boton: 'Ir al Catálogo',
      tip: 'Arrastre sus fotos al recuadro «Subir al catálogo» o pulse en él para elegirlas.',
      hecho: function () { return (typeof CL !== 'undefined' && CL.length > 0) || (cuentaCat || 0) > 0; } },
    { id: 'cliente', pantalla: 'cli', titulo: 'Registre su primer cliente',
      desc: 'Con el nombre y el teléfono basta. Así lo elige rápido en cada factura.', boton: 'Agregar cliente',
      tip: 'Escriba el nombre y el teléfono, y pulse «Agregar».',
      hecho: function () { return (DB.cli || []).length > 0; } },
    { id: 'venta', pantalla: 'nueva', titulo: 'Haga su primera factura',
      desc: 'Elija el cliente y el producto, y pulse «Emitir factura». Queda guardada y se puede imprimir.', boton: 'Hacer factura',
      tip: 'Elija el cliente, elija el producto en la línea y pulse «Emitir factura».',
      hecho: function () { return (DB.fac || []).some(function (f) { return f && !f.anulada; }); } },
    { id: 'tienda', pantalla: 'tienda', titulo: 'Comparta su tienda en línea',
      desc: 'Copie el enlace y envíelo por WhatsApp para que sus clientes vean sus productos y hagan pedidos.', boton: 'Ver mi tienda',
      tip: 'Publique sus productos y pulse «Copiar» o el botón de WhatsApp para compartir el enlace.',
      hecho: function () { try { return (TD.peds || []).length > 0 || (TD.leads || []).length > 0; } catch (e) { return false; } } },
    { id: 'vendedor', pantalla: 'vend', solo: 'admin', opcional: true, titulo: 'Invite a un vendedor',
      desc: 'Cree un acceso para que venda desde su teléfono sin ver lo privado de su empresa.', boton: 'Invitar vendedor',
      tip: 'Escriba el nombre, el correo y una contraseña de 6 o más caracteres, y guarde.',
      hecho: function () { return ((DB.cfg || {}).users || []).length > 0; } }
  ];
  function pasosVisibles() {
    var adm = admin();
    return PASOS.filter(function (p) { return p.solo === 'admin' ? adm : (adm || puedeVer(p.pantalla)); });
  }

  /* ---------- progreso guardado (por empresa y usuario) ---------- */
  function clave() { var u = 'admin'; try { u = SES.id || 'admin'; } catch (e) {} try { return lsk('tj_guia_' + u); } catch (e) { return 'tj_guia_' + u; } }
  var cache = null, cacheK = '';
  function leer() {
    var k = clave();
    if (cache && cacheK === k) return cache;
    var o = null;
    try { o = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { aviso(e); }
    if (!o || typeof o !== 'object') o = null;
    if (o) { o.hechos = (o.hechos && typeof o.hechos === 'object') ? o.hechos : {}; }
    cache = o; cacheK = k; return o;
  }
  function guardar(o) {
    cache = o; cacheK = clave();
    try { localStorage.setItem(cacheK, JSON.stringify(o)); } catch (e) { aviso(e); }
  }

  /* ---------- listo para evaluar (la nube ya cargó los datos de la empresa) ---------- */
  function nubeLista() {
    var el = document.querySelector('.cloudSt');
    return !el || !/Conectando/.test(el.textContent || '');
  }
  function catalogoContado(pasos) {
    if (!pasos.some(function (p) { return p.id === 'catalogo'; })) return true;
    return cuentaCat !== null || (typeof CL !== 'undefined' && CL.length > 0);
  }
  function contarCatalogo() {
    var ahora = Date.now();
    if (cuentaCatT && ahora - cuentaCatT < 8000) return;
    cuentaCatT = ahora;
    try {
      if (typeof tx !== 'function') { if (cuentaCat === null) cuentaCat = 0; return; }
      tx('readonly', function (s) { return s.count(); }).then(function (n) { cuentaCat = +n || 0; refrescar(false); }, function () { if (cuentaCat === null) cuentaCat = 0; refrescar(false); });
    } catch (e) { if (cuentaCat === null) cuentaCat = 0; }
  }

  /* ---------- evaluación ---------- */
  function evaluar() {
    var pasos = pasosVisibles();
    if (!pasos.length) return null;
    contarCatalogo();
    var listo = nubeLista() && catalogoContado(pasos);
    var st = leer() || { oculta: false, hechos: {} }, nuevo = false;
    var items = pasos.map(function (p) {
      var manual = !!st.hechos[p.id], auto = false;
      try { auto = !!p.hecho(); } catch (e) { aviso(e); }
      if (listo && auto && !manual) { st.hechos[p.id] = 2; nuevo = true; manual = true; } // el progreso nunca retrocede
      return { p: p, hecho: manual || auto };
    });
    var hechos = items.filter(function (i) { return i.hecho; }).length;
    var sig = null;
    for (var i = 0; i < items.length; i++) { if (!items[i].hecho) { sig = items[i]; break; } }
    if (listo && !leer()) {
      // Primera vez que se ve la guía: si la empresa ya lo tiene todo (p. ej. una empresa con años de uso), arranca oculta (queda el botón «Primeros pasos»).
      if (!sig) { st.oculta = true; st.auto = true; }
      nuevo = true;
    }
    if (nuevo) guardar(st);
    return { items: items, hechos: hechos, total: items.length, sig: sig, oculta: !!st.oculta, listo: listo, completo: !sig };
  }

  /* ---------- pantallas de destino ---------- */
  var FOCO = { config: '#btnEditCfg', prod: '#pn', cat: '#u_cat', cli: '#cn', nueva: '#f_cs', tienda: '#td_link', vend: '#v input, #v button' };
  function irA(id) {
    var p = PASOS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    try { ir(p.pantalla); } catch (e) { aviso(e); return; }
    setTimeout(function () {
      try {
        if (p.pantalla === 'config') {
          if (typeof cfgTab === 'function') cfgTab('gen');
          if (typeof cardState !== 'undefined' && !cardState.cfg_empresa && typeof toggleCard === 'function') toggleCard('cfg_empresa');
        }
        var el = document.querySelector(FOCO[p.pantalla] || '#v');
        if (el) { el.scrollIntoView({ block: 'center' }); if (el.focus) el.focus({ preventScroll: true }); }
      } catch (e) { aviso(e); }
    }, 350);
  }
  function marcar(id, on) {
    var st = leer() || { oculta: false, hechos: {} };
    if (on === false) delete st.hechos[id]; else st.hechos[id] = 1;
    guardar(st); refrescar(true);
  }
  function ocultar() {
    var st = leer() || { oculta: false, hechos: {} };
    st.oculta = true; guardar(st); refrescar(true);
    var m = g('guiaAbrir'); if (m) { try { m.focus(); } catch (e) {} }
  }
  function abrir() {
    var st = leer() || { oculta: false, hechos: {} };
    st.oculta = false; st.auto = false; guardar(st);
    try { if (vista !== 'home') ir('home'); } catch (e) { aviso(e); }
    refrescar(true);
    setTimeout(function () { var t = g('guiaT'); if (t) { t.setAttribute('tabindex', '-1'); t.focus(); } }, 60);
  }

  /* ---------- dibujo ---------- */
  function boton(clase, fn, args, texto, extra, label) {
    return '<button type="button" class="btn ' + clase + '"' + (extra || '') + (label ? ' aria-label="' + html(label) + '"' : '') +
      ' data-h-click="call" data-a-click="' + ha.apply(null, [fn].concat(args)) + '">' + texto + '</button>';
  }
  function tarjetaHTML(ev) {
    var li = ev.items.map(function (it, n) {
      var p = it.p, esSig = ev.sig && ev.sig.p.id === p.id;
      var etiqueta = it.hecho ? '<span class="guia-tag ok">✔ Hecho</span>' : (esSig ? '<span class="guia-tag sig">Siguiente</span>' : '');
      var op = p.opcional ? '<span class="guia-tag op">Opcional</span>' : '';
      var acciones = it.hecho
        ? boton('s', 'guiaIr', [p.id], 'Abrir', ' data-gbtn="go"', 'Abrir: ' + p.titulo) + ((leer() || { hechos: {} }).hechos[p.id] === 1 ? boton('s', 'guiaMarcar', [p.id, false], 'Quitar la marca', ' data-gbtn="ok"', 'Quitar la marca: ' + p.titulo) : '')
        : boton(esSig ? 'p' : '', 'guiaIr', [p.id], html(p.boton) + ' →', ' data-gbtn="go"', p.boton + ': ' + p.titulo) +
          boton('s', 'guiaMarcar', [p.id, true], p.opcional ? 'Omitir' : 'Ya lo hice', ' data-gbtn="ok"', (p.opcional ? 'Omitir: ' : 'Ya lo hice: ') + p.titulo);
      return '<li class="guia-p' + (it.hecho ? ' hecho' : '') + (esSig ? ' sig' : '') + '" data-gid="' + p.id + '">' +
        '<span class="guia-n" aria-hidden="true">' + (it.hecho ? '✔' : (n + 1)) + '</span>' +
        '<div class="guia-t"><b>' + html(p.titulo) + '</b> ' + etiqueta + op + '<p>' + html(p.desc) + '</p></div>' +
        '<div class="guia-a">' + acciones + '</div></li>';
    }).join('');
    var fin = ev.completo
      ? '<div class="guia-fin" role="status"><b>🎉 ¡Listo! Ya completó los primeros pasos.</b><span>Puede cerrar esta guía. Si necesita repasar algo, la vuelve a abrir cuando quiera con «Primeros pasos».</span></div>' : '';
    return '<section class="card guia" id="guiaCard" aria-labelledby="guiaT">' +
      '<div class="guia-h"><div><h3 id="guiaT">🚀 Primeros pasos en VEN CRM</h3>' +
      '<p class="guia-sub">Siga estos pasos para dejar su empresa lista. Cada botón lo lleva a la pantalla correcta, y el paso se marca solo cuando lo completa.</p></div>' +
      boton('s', 'guiaOcultar', [], ev.completo ? 'Cerrar guía' : 'Ocultar', ' id="guiaOcultar"', ev.completo ? 'Cerrar guía de primeros pasos' : 'Ocultar guía de primeros pasos (se puede volver a abrir)') + '</div>' +
      '<div class="guia-prog"><progress class="guia-bar" max="' + ev.total + '" value="' + ev.hechos + '" aria-label="Progreso de los primeros pasos">' + ev.hechos + ' de ' + ev.total + '</progress>' +
      '<b class="guia-cnt">' + ev.hechos + ' de ' + ev.total + ' pasos</b></div>' + fin +
      '<ol class="guia-l">' + li + '</ol></section>';
  }
  function minHTML(ev) {
    var txt = ev.completo ? '🚀 Primeros pasos · completados ✔' : '🚀 Primeros pasos · ' + ev.hechos + ' de ' + ev.total + ' — Abrir la guía';
    return '<div class="guia-min" id="guiaMin">' + boton('s', 'guiaAbrir', [], txt, ' id="guiaAbrir"', '') + '</div>';
  }
  function quitarHome() { var a = g('guiaCard'), b = g('guiaMin'); if (a) a.remove(); if (b) b.remove(); }
  function montarHome(ev) {
    var v = g('v'); if (!v) return;
    quitarHome();
    if (!ev || !ev.listo) return;
    var w = document.createElement('div');
    w.innerHTML = ev.oculta ? minHTML(ev) : tarjetaHTML(ev);
    var nodo = w.firstElementChild; if (nodo) v.insertBefore(nodo, v.firstChild);
  }
  function pistaHTML(ev) {
    var vistaAhora = ''; try { vistaAhora = vista; } catch (e) {}
    // Si está en la pantalla de un paso pendiente, se le dice qué hacer ahí; si no, se le lleva al siguiente.
    var aqui = null, idx = 0, i;
    for (i = 0; i < ev.items.length; i++) { if (!ev.items[i].hecho && ev.items[i].p.pantalla === vistaAhora) { aqui = ev.items[i]; idx = i; break; } }
    var it = aqui || ev.sig, n = aqui ? idx + 1 : ev.hechos + 1;
    if (!aqui) { for (i = 0; i < ev.items.length; i++) { if (ev.items[i] === ev.sig) { n = i + 1; break; } } }
    return '<div class="guia-pi" id="guiaPistaIn"><span class="guia-pn" aria-hidden="true">🚀</span><div class="guia-pt"><span class="guia-pc">Primeros pasos · paso ' + n + ' de ' + ev.total + ' · ' + ev.hechos + ' completados</span>' +
      '<b>' + html(it.p.titulo) + '</b>' + (aqui ? '<span>Está en el lugar correcto. ' + html(it.p.tip) + ' El paso se marca solo al terminar.</span>' : '') + '</div><div class="guia-pa">' +
      (aqui ? '' : boton('p s', 'guiaIr', [it.p.id], 'Ir ahora →', ' data-gbtn="go"', 'Ir ahora: ' + it.p.titulo)) +
      boton('s', 'guiaOcultar', [], 'Ocultar guía', '', 'Ocultar guía de primeros pasos') + '</div></div>';
  }
  var ultimaFirma = '', ultimaVista = '', primera = true;
  function firma(ev) {
    if (!ev) return 'x';
    return [ev.listo ? 1 : 0, ev.oculta ? 1 : 0, ev.items.map(function (i) { return i.hecho ? 1 : 0; }).join(''), (ev.sig ? ev.sig.p.id : '-'), (leer() || { hechos: {} }).auto ? 1 : 0, JSON.stringify((leer() || { hechos: {} }).hechos)].join('|');
  }
  function voz(txt) {
    var v = g('guiaVoz');
    if (!v) { v = document.createElement('div'); v.id = 'guiaVoz'; v.className = 'sr-only'; v.setAttribute('role', 'status'); v.setAttribute('aria-live', 'polite'); document.body.appendChild(v); }
    v.textContent = txt;
  }
  var ultimoHechos = -1;
  function pintar(forzar) {
    if (!haySesion()) { var pp = g('guiaPista'); if (pp) { pp.hidden = true; pp.innerHTML = ''; } quitarHome(); ultimaFirma = ''; return; }
    var ev = null;
    try { ev = evaluar(); } catch (e) { aviso(e); return; }
    var vistaAhora = ''; try { vistaAhora = vista; } catch (e) {}
    var f = firma(ev) + '|' + vistaAhora;
    var enHome = vistaAhora === 'home';
    var faltaHome = enHome && !(g('guiaCard') || g('guiaMin')) && !!(ev && ev.listo);
    if (!forzar && f === ultimaFirma && !faltaHome) return;
    ultimaFirma = f;
    // aviso a lectores de pantalla cuando se completa un paso
    if (ev && ultimoHechos >= 0 && ev.hechos > ultimoHechos) voz('Paso completado. Lleva ' + ev.hechos + ' de ' + ev.total + ' pasos.');
    if (ev) ultimoHechos = ev.hechos;
    // recordar el foco dentro de la guía para no perderlo al redibujar
    var foco = null, ae = document.activeElement;
    if (ae && ae.closest) { var li = ae.closest('[data-gid]'); if (li && ae.getAttribute('data-gbtn')) foco = '[data-gid="' + li.getAttribute('data-gid') + '"] [data-gbtn="' + ae.getAttribute('data-gbtn') + '"]'; else if (ae.id === 'guiaOcultar') foco = '#guiaOcultar'; }
    if (enHome) montarHome(ev); else quitarHome();
    var pista = g('guiaPista');
    if (pista) {
      var mostrar = ev && ev.listo && !ev.oculta && ev.sig && !enHome;
      if (mostrar) { pista.innerHTML = pistaHTML(ev); pista.hidden = false; } else { pista.innerHTML = ''; pista.hidden = true; }
    }
    if (foco) { var el = document.querySelector(foco); if (el) { try { el.focus({ preventScroll: true }); } catch (e) {} } }
  }
  var timer = 0;
  function refrescar(ya) {
    if (ya) { clearTimeout(timer); pintar(false); return; }
    clearTimeout(timer); timer = setTimeout(function () { pintar(false); }, 200);
  }

  /* ---------- «¿Cómo funciona?» por módulo (2-3 líneas) ---------- */
  var AYUDA = {
    cli: 'Aquí guarda a las personas o negocios que le compran. Con el nombre y el teléfono basta. Después los elige al hacer una factura y les escribe por WhatsApp con un toque.',
    prod: 'Un producto es lo que usted vende: un nombre y un precio. Al hacer una factura lo elige y el precio se llena solo. Puede cambiarlo cuando quiera.',
    nueva: '1) Elija el cliente (o deje «Consumidor final»). 2) Elija el producto en cada línea. 3) Pulse «Emitir factura»: queda guardada en Facturas y puede imprimirla.',
    fac: 'Aquí están todas sus facturas. Puede verlas, imprimirlas, enviarlas o anularlas. Los totales de Inicio salen de estas facturas.',
    cat: 'Aquí sube las fotos o archivos de lo que ofrece. Desde aquí publica productos en su tienda en línea y los comparte por WhatsApp.',
    tienda: 'Es su tienda en línea. Marque los productos del Catálogo que quiere mostrar y pulse «Publicar». Copie el enlace y envíelo a sus clientes: sus pedidos llegan aquí.'
  };
  function ayuda(k) {
    var t = AYUDA[k]; if (!t) return '';
    return '<details class="ayuda"><summary>¿Cómo funciona?</summary><p>' + html(t) + '</p></details>';
  }

  /* ---------- «Compartir la tienda» se marca solo al copiar o enviar el enlace ---------- */
  ['tdCopy', 'tdWaLink', 'tdSendCli'].forEach(function (nombre) {
    var f0 = window[nombre];
    if (typeof f0 !== 'function') return;
    window[nombre] = function () {
      var r = f0.apply(this, arguments);
      try { var st = leer() || { oculta: false, hechos: {} }; if (!st.hechos.tienda) { st.hechos.tienda = 1; guardar(st); refrescar(false); } } catch (e) { aviso(e); }
      return r;
    };
  });

  /* ---------- enganches con la app ---------- */
  var ir0 = window.ir;
  if (typeof ir0 === 'function') {
    window.ir = function () { var r = ir0.apply(this, arguments); try { refrescar(false); } catch (e) { aviso(e); } return r; };
  }
  var home0 = null;
  try { home0 = R.home; } catch (e) {}
  if (typeof home0 === 'function') {
    R.home = function () { var r = home0.apply(this, arguments); try { pintar(true); } catch (e) { aviso(e); } return r; };
  }
  // Lo que cambia sin pasar por una pantalla (datos de la nube, pedidos de la tienda…) se nota en un par de segundos.
  setInterval(function () { if (!document.hidden) refrescar(false); }, 2000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refrescar(false); });

  window.guiaIr = irA;
  window.guiaMarcar = marcar;
  window.guiaOcultar = ocultar;
  window.guiaAbrir = abrir;
  window.guiaRefrescar = function () { refrescar(false); };
  window.guiaAyuda = ayuda;
  window.guiaEstado = function () { try { return evaluar(); } catch (e) { return null; } };
})();
