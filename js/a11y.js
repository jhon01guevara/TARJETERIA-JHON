/* js/a11y.js · Accesibilidad (Fase 9). Solo añade atributos ARIA y soporte de teclado.
   No cambia estilos, textos, estructura ni los manejadores existentes de app.js.
   Qué hace:
   1) Teclado: los elementos no nativos que ya reaccionan al clic (data-h-click) reciben
      role="button" + tabindex="0", y Enter/Espacio los activa con un click() normal,
      que pasa por el mismo delegador de eventos de app.js que el clic del ratón.
      Solo actúa sobre los elementos que él mismo marcó (data-a11y-kb), así que no hay
      doble disparo con botones/enlaces nativos ni con elementos que ya manejan teclado.
   2) Campos sin etiqueta: enlaza con aria-labelledby la <label> que está justo antes.
   3) Tablas: th sin scope reciben scope="col"/"row". SVG decorativos: aria-hidden.
   4) Avisos y ventanas creados por JS (#ksnack, #agToast, #shopm, #auth, zooms):
      aria-live / role="dialog" aria-modal.
   5) Enlace «Saltar al contenido» (el estilo está en css/accesibilidad.css).
   7) Fase 18: nombre accesible (aria-label) para tablas de datos, texto solo-lector en cabeceras de tabla vacías, <img alt=""> clicables
      con alt, y puntos de referencia (landmarks) de la tienda pública. Todo sin cambiar el aspecto.
   6) Ventanas modales (Fase 15): Esc para cerrar, foco atrapado dentro con Tab/Mayús+Tab, el foco vuelve
      al elemento que abrió la ventana y cada ventana tiene nombre accesible. Todo se hace aquí, de forma
      central, observando las ventanas existentes (#md, #shopm, zooms, vistas previas); no se reescribe ninguna.
   Revertir: quitar <script src="js/a11y.js"> y <link css/accesibilidad.css> de index.html. */
(function () {
  'use strict';
  if (window.__tjA11y) return;
  window.__tjA11y = 1;

  var NATIVOS = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION|AREA)$/;
  var INTERACTIVO = 'a[href],button,input,select,textarea,summary,[tabindex],[role="button"],[role="link"]';
  // Etiquetas donde axe/ARIA no permite role="button": se hace accesible su imagen en vez del contenedor.
  var RESTRINGIDOS = /^(ARTICLE|H[1-6]|SECTION|ASIDE|NAV|MAIN|HEADER|FOOTER|FORM|TABLE|TR|TD|TH|UL|OL)$/;
  var seq = 0;

  function warn(e) { try { if (window._tjw) window._tjw(e); } catch (_) {} }

  function nombre(el) {
    var n = el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (n) return n;
    var im = el.tagName === 'IMG' ? el : el.querySelector('img[alt]');
    return im ? (im.getAttribute('alt') || '').trim() : '';
  }

  function marcar(el) {
    // Fase 18: una <img alt=""> es decorativa (role presentation); con role="button" axe avisa «presentation-role-conflict». Se le da su título como alt.
    if (el.tagName === 'IMG' && el.getAttribute('alt') === '') { var n0 = nombre(el); if (n0) el.setAttribute('alt', n0); }
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('data-a11y-kb', '1');
  }

  /* 1 · Elementos clicables no nativos → accesibles con teclado */
  function clicables(root) {
    var l = root.querySelectorAll('[data-h-click]');
    var arr = [].slice.call(l);
    if (root.matches && root.matches('[data-h-click]')) arr.unshift(root);
    arr.forEach(function (el) {
      if (NATIVOS.test(el.tagName)) return;
      if (el.hasAttribute('role') || el.hasAttribute('tabindex') || el.hasAttribute('data-h-keydown')) return;
      if (el.id === 'md' || el.classList.contains('md')) return; // fondo oscuro del modal: se cierra con su botón
      if (el.parentElement && el.parentElement.closest('[role="button"],button,a[href]')) return; // evitar anidados
      if (RESTRINGIDOS.test(el.tagName) || el.querySelector(INTERACTIVO)) {
        // Tarjeta que ya contiene un botón propio (p. ej. favorito) o etiqueta sin rol button: se hace accesible su imagen.
        var im = el.querySelector('img[alt]');
        if (im && (im.getAttribute('alt') || '').trim() && !im.closest(INTERACTIVO) &&
            !im.hasAttribute('role') && !im.hasAttribute('tabindex') && !im.hasAttribute('data-h-click')) marcar(im);
        return;
      }
      if (!nombre(el)) return; // sin nombre no se expone (se documenta como pendiente)
      marcar(el);
    });
  }

  /* 2 · Campos sin etiqueta → aria-labelledby con la <label> contigua */
  function etiquetaPrevia(f) {
    var p = f.previousElementSibling;
    while (p && p.tagName === 'BR') p = p.previousElementSibling;
    if (p && p.tagName === 'LABEL') return p;
    var par = f.parentElement;
    if (par && !f.previousElementSibling && par.querySelectorAll('input,select,textarea').length === 1) {
      var q = par.previousElementSibling;
      if (q && q.tagName === 'LABEL') return q;
    }
    return null;
  }
  function campos(root) {
    var arr = [].slice.call(root.querySelectorAll('input,select,textarea'));
    if (root.matches && root.matches('input,select,textarea')) arr.unshift(root);
    arr.forEach(function (f) {
      var t = (f.getAttribute('type') || '').toLowerCase();
      if (/^(hidden|submit|button|reset|image)$/.test(t)) return;
      if (f.hasAttribute('aria-label') || f.hasAttribute('aria-labelledby')) return;
      // Fase 18: con solo «title» axe avisa (label-title-only): se copia el título como aria-label salvo que ya tenga una etiqueta con texto.
      if (f.hasAttribute('title')) {
        var tl = (f.getAttribute('title') || '').trim(), ls = f.labels ? [].slice.call(f.labels) : [];
        if (tl && !ls.some(function (l) { return (l.textContent || '').trim(); })) f.setAttribute('aria-label', tl);
        return;
      }
      if (f.closest('label')) return;
      if (f.id) {
        var lf = document.getElementsByTagName('label');
        for (var i = 0; i < lf.length; i++) if (lf[i].htmlFor === f.id) return;
      }
      var lb = etiquetaPrevia(f);
      if (!lb || !(lb.textContent || '').trim()) return;
      if (!lb.id) lb.id = 'a11y-lb-' + (++seq);
      f.setAttribute('aria-labelledby', lb.id);
    });
  }

  /* 3 · Tablas y SVG decorativos */
  function tablasYSvg(root) {
    [].forEach.call(root.querySelectorAll('th:not([scope])'), function (th) {
      var tr = th.parentElement;
      var cab = (th.closest && th.closest('thead')) || !tr || !tr.querySelector('td');
      th.setAttribute('scope', cab ? 'col' : 'row');
    });
    [].forEach.call(root.querySelectorAll('svg:not([aria-hidden]):not([role]):not([aria-label]):not([aria-labelledby])'), function (s) {
      if (!s.querySelector('title')) s.setAttribute('aria-hidden', 'true');
    });
  }

  /* 3b · Fase 18: tablas con nombre accesible y cabeceras vacías con texto solo para lectores */
  function textoLimpio(x) { return (x && x.textContent || '').replace(/\s+/g, ' ').trim(); }
  function nombreTabla(t) {
    var n = t;
    for (var d = 0; n && d < 5; d++, n = n.parentElement) {
      var p = n.previousElementSibling;
      for (var k = 0; p && k < 6; k++, p = p.previousElementSibling) {
        var h = /^(H[1-4]|SUMMARY)$/.test(p.tagName) ? p : (p.querySelector && p.querySelector('h1,h2,h3,h4,summary'));
        if (h && textoLimpio(h)) return textoLimpio(h).slice(0, 90);
      }
      if (n.tagName === 'DETAILS') { var sm = n.querySelector(':scope > summary'); if (sm && textoLimpio(sm)) return textoLimpio(sm).slice(0, 90); }
      if (n.id === 'v' || n.id === 'mb' || n.id === 'shop') break;
    }
    var tt = document.getElementById('tt');
    return (tt && textoLimpio(tt)) || 'Tabla de datos';
  }
  function tablasNombre(root) {
    var arr = [].slice.call(root.querySelectorAll('table'));
    if (root.matches && root.matches('table')) arr.unshift(root);
    arr.forEach(function (t) {
      if (t.hasAttribute('aria-label') || t.hasAttribute('aria-labelledby') || t.querySelector(':scope > caption')) return;
      var r = t.getAttribute('role'); if (r === 'presentation' || r === 'none') return;
      if (t.closest('#prt,.pv,.cv,[data-no-a11y]')) return;
      if (!t.querySelector('th') && t.rows.length < 2) return; // tabla de maquetación de una sola fila
      t.setAttribute('aria-label', nombreTabla(t));
    });
  }
  function thsVacios(root) {
    [].forEach.call(root.querySelectorAll('th'), function (th) {
      if (th.hasAttribute('data-a11y-th') || th.hasAttribute('aria-label') || textoLimpio(th) || th.querySelector('img,svg,input,button')) return;
      if (!th.closest('#v,#mb')) return; // solo pantallas del panel y sus ventanas (no la vista previa de facturas)
      var tb = th.closest('table'), idx = th.cellIndex, etq = 'Acciones';
      if (tb) {
        var fila = [].filter.call(tb.rows, function (r) { return r.querySelector('td'); })[0];
        var c = fila && fila.cells[idx];
        if (c) etq = c.querySelector('input[type="checkbox"]') ? 'Seleccionar' : (c.querySelector('img') && !c.querySelector('button,a[href]')) ? 'Imagen' : 'Acciones';
      }
      var sp = document.createElement('span'); sp.className = 'sr-only-th'; sp.textContent = etq;
      th.setAttribute('data-a11y-th', '1'); th.appendChild(sp);
    });
  }

  /* 3c · Fase 18: puntos de referencia (landmarks) de la tienda pública y decoraciones de temporada */
  var NOMBRES_TIENDA = { k_cats: 'Categorías', k_dest: 'Destacados', k_redes: 'Redes sociales', k_dnav: 'Secciones de la tienda', k_mmenu: 'Menú móvil', k_nav: 'Navegación inferior de la tienda' };
  function tienda() {
    var shop = document.getElementById('shop');
    if (!shop) return;
    Object.keys(NOMBRES_TIENDA).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.hasAttribute('aria-label')) { el.setAttribute('aria-label', NOMBRES_TIENDA[id]); if (el.tagName === 'SECTION') el.setAttribute('role', 'region'); }
    });
    var kl = shop.querySelector('.kh-links'); if (kl && !kl.hasAttribute('aria-label')) kl.setAttribute('aria-label', 'Enlaces rápidos');
    var side = document.getElementById('k_side');
    if (side && !side.hasAttribute('role')) { side.setAttribute('role', 'region'); side.setAttribute('aria-label', 'Filtros'); }
    // <main> de la tienda: el área de filtros y resultados. Solo si el <main> del panel no se está mostrando (la tienda pública lo oculta).
    var km = shop.querySelector('.kmain'), pm = document.getElementById('contenido');
    if (km) {
      var panelVisible = !!(pm && pm.getClientRects().length);
      if (!panelVisible && !km.hasAttribute('role')) { km.setAttribute('role', 'main'); km.setAttribute('aria-label', 'Catálogo'); }
      else if (panelVisible && km.getAttribute('role') === 'main') { km.removeAttribute('role'); km.removeAttribute('aria-label'); }
    }
    [].forEach.call(document.querySelectorAll('#shop .kxb:not([role])'), function (b) { b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Aviso de temporada'); });
    [].forEach.call(document.querySelectorAll('#shop .kgd:not([aria-hidden]),#k_pcf:not([aria-hidden])'), function (b) { b.setAttribute('aria-hidden', 'true'); });
  }

  /* 4 · Contenedores creados por JS */
  var CONT = {
    ksnack: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
    agToast: { 'aria-live': 'polite' },
    shopm: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Ventana emergente' },
    auth: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Inicio de sesión' },
    kzoom: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Imagen ampliada' },
    avzoom: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Imagen ampliada' },
    tdzoom: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Imagen ampliada' },
    pdfv: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Vista previa' },
    imgv: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Vista previa' },
    investOv: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Investigación de productos' }
  };
  function contenedores() {
    Object.keys(CONT).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var a = CONT[id];
      Object.keys(a).forEach(function (k) { if (!el.hasAttribute(k)) el.setAttribute(k, a[k]); });
    });
  }


  /* 6 · Ventanas modales: Esc, foco atrapado, devolución del foco y nombre accesible.
     Cada definición dice cómo saber si la ventana está abierta, cuál es su caja y cómo cerrarla
     con el MISMO mecanismo que usa el ratón (un click() sobre el fondo o el botón «Cerrar»),
     así no se duplica ni se salta ninguna lógica de app.js. */
  var FOCALIZABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),summary,iframe,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
  var MODALES = [
    { id: 'md', caja: 'mb', abierto: function (el) { return el.classList.contains('on'); }, cerrar: function (el) { el.click(); } },
    { id: 'shopm', abierto: function (el) { return el.style.display === 'flex'; }, cerrar: function (el) { el.click(); } },
    { id: 'kzoom', abierto: vivo, cerrar: function (el) { el.click(); } },
    { id: 'avzoom', abierto: vivo, cerrar: function (el) { el.click(); } },
    { id: 'tdzoom', abierto: vivo, cerrar: function (el) { el.click(); } },
    { id: 'pdfv', abierto: vivo, cerrar: function (el) { var b = el.querySelector('#pdfvx'); if (b) b.click(); } },
    { id: 'investOv', abierto: vivo, cerrar: function (el) { var b = el.querySelector('#investX'); if (b) b.click(); } },
    /* imgv ya se cierra con Esc por su cuenta (app.js): aquí solo foco y devolución del foco. */
    { id: 'imgv', abierto: vivo, cerrar: null },
    /* #auth es el inicio de sesión: no se cierra, pero sí atrapa el foco. */
    { id: 'auth', abierto: function (el) { return el.isConnected && el.style.display !== 'none'; }, cerrar: null }
  ];
  function vivo(el) { return el.isConnected; }
  var estado = {};           // id → { opener, sucio }
  var ultimo = null, anterior = null; // últimos elementos enfocados/clicados (candidatos a «quien abrió»)

  function visible(el) {
    if (!el.getClientRects().length) return false;
    var s = getComputedStyle(el);
    return s.visibility !== 'hidden';
  }
  function enfocables(caja) {
    return [].filter.call(caja.querySelectorAll(FOCALIZABLE), function (e) {
      return !e.closest('[hidden],[inert]') && visible(e);
    });
  }
  function cajaDe(def, el) { return (def.caja && document.getElementById(def.caja)) || el; }

  /* Nombre accesible: si la ventana trae un título (h1-h3 o la barra .pdfvb/.ivb), se usa; si no, queda el aria-label por defecto. */
  function nombrar(def, el) {
    var caja = cajaDe(def, el);
    if (!caja.hasAttribute('role')) { caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true'); }
    var t = caja.querySelector('h1,h2,h3,.pdfvb>b,.ivb>b');
    if (t && (t.textContent || '').trim()) {
      if (!t.id) t.id = 'a11y-dlg-' + (++seq);
      caja.setAttribute('aria-labelledby', t.id);
      caja.removeAttribute('aria-label');
    } else {
      caja.removeAttribute('aria-labelledby');
      if (!caja.hasAttribute('aria-label')) caja.setAttribute('aria-label', 'Ventana de diálogo');
    }
  }

  function dentroDeAlguna(n) {
    for (var i = 0; i < MODALES.length; i++) {
      var e = document.getElementById(MODALES[i].id);
      if (e && estado[MODALES[i].id] && e.contains(n)) return true;
    }
    return false;
  }

  function abrir(def, el) {
    var op = (ultimo && !el.contains(ultimo)) ? ultimo : (anterior && !el.contains(anterior) ? anterior : null);
    estado[def.id] = { opener: op, sucio: false, el: el };
    nombrar(def, el);
    var caja = cajaDe(def, el);
    if (caja.contains(document.activeElement) && document.activeElement !== caja) return; // la app ya puso el foco dentro
    var f = enfocables(caja);
    var meta = f.length ? f[0] : caja;
    if (meta === caja && !caja.hasAttribute('tabindex')) caja.setAttribute('tabindex', '-1');
    try { meta.focus({ preventScroll: true }); } catch (e) { warn(e); }
  }

  function cerrado(def) {
    var s = estado[def.id];
    delete estado[def.id];
    if (!s || !s.opener) return;
    var o = s.opener;
    if (!o.isConnected || !visible(o)) return;
    // Solo se devuelve si el foco quedó "en el aire" (en <body> o dentro de la ventana ya cerrada);
    // si la app lo puso a propósito en otro sitio, no se le quita.
    var a = document.activeElement;
    var enElAire = !a || a === document.body || a === document.documentElement || (s.el && s.el.contains(a)) || !a.isConnected;
    if (!enElAire) return;
    try { o.focus({ preventScroll: true }); } catch (e) { warn(e); }
  }

  function revisar() {
    MODALES.forEach(function (def) {
      var el = document.getElementById(def.id);
      var abierto = !!(el && def.abierto(el));
      var antes = estado[def.id];
      if (abierto && !antes) abrir(def, el);
      else if (abierto && antes && antes.el !== el) { delete estado[def.id]; abrir(def, el); }
      else if (!abierto && antes) cerrado(def);
      else if (abierto && antes) {
        nombrar(def, el); // el contenido cambió mientras seguía abierta
        // si el foco quedó en el contenedor (aún no tenía controles) y ya aparecieron, pasa al primero
        var caja = cajaDe(def, el);
        if (document.activeElement === caja) { var f = enfocables(caja); if (f.length) { try { f[0].focus({ preventScroll: true }); } catch (e) { warn(e); } } }
      }
    });
    // observar atributos de #md y #shopm (se abren cambiando class/style, no añadiendo nodos)
    ['md', 'shopm'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e && !e.__a11yObs && window.MutationObserver) {
        e.__a11yObs = 1;
        new MutationObserver(revisar).observe(e, { attributes: true, attributeFilter: ['class', 'style'], childList: true, subtree: id === 'md' });
      }
    });
  }

  /* Ventana abierta más alta: la de mayor z-index; si empatan, la última del documento. */
  function superior() {
    var mejor = null, z = -1, orden = -1;
    MODALES.forEach(function (def, i) {
      var el = document.getElementById(def.id);
      if (!el || !estado[def.id]) return;
      var zi = parseInt(getComputedStyle(el).zIndex, 10); if (isNaN(zi)) zi = 0;
      var pos = 0, n = el; while (n) { pos++; n = n.previousElementSibling; }
      if (zi > z || (zi === z && pos >= orden)) { mejor = def; z = zi; orden = pos; }
    });
    return mejor;
  }

  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (t && t !== document.body && t.nodeType === 1) { anterior = ultimo; ultimo = t; }
    var def = superior();
    if (!def) return;
    var el = document.getElementById(def.id), caja = cajaDe(def, el);
    // el foco se escapó fuera de la ventana abierta (p. ej. con un clic en el fondo o un script): se devuelve
    if (t && t.nodeType === 1 && !el.contains(t) && !caja.contains(t)) {
      var f = enfocables(caja);
      try { (f[0] || caja).focus({ preventScroll: true }); } catch (x) { warn(x); }
    }
  });
  /* Un visor (p. ej. el de PDF) puede quedarse con el foco al terminar de cargar y entonces Esc ya no llega a esta página
     (los teclados dentro de un iframe no suben al documento padre). Al cargar, el foco vuelve a la barra de la ventana. */
  function recuperarDeIframe(fr) {
    var def = superior();
    if (!def) return;
    var el = document.getElementById(def.id), caja = cajaDe(def, el);
    if (!caja.contains(fr) || document.activeElement !== fr) return;
    var f = enfocables(caja).filter(function (x) { return x.tagName !== 'IFRAME'; });
    if (f.length) { try { f[0].focus({ preventScroll: true }); } catch (x) { warn(x); } }
  }
  document.addEventListener('load', function (e) {
    var fr = e.target;
    if (!fr || fr.tagName !== 'IFRAME') return;
    // el visor puede tomar el foco justo después del evento load: se comprueba varias veces, de forma breve
    [0, 150, 600].forEach(function (ms) { setTimeout(function () { recuperarDeIframe(fr); }, ms); });
  }, true);
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest(FOCALIZABLE + ',[role="button"]') : null;
    if (t && !dentroDeAlguna(t)) { anterior = ultimo; ultimo = t; }
    else if (!t && !dentroDeAlguna(e.target)) { anterior = ultimo; ultimo = null; }
  }, true);
  document.addEventListener('input', function (e) {
    var def = superior(); if (def && estado[def.id] && e.target && document.getElementById(def.id).contains(e.target)) estado[def.id].sucio = true;
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== 'Tab' && e.key !== 'Escape') return;
    revisar();
    var def = superior();
    if (!def) return;
    var el = document.getElementById(def.id), caja = cajaDe(def, el);
    if (e.key === 'Escape') {
      if (!def.cerrar) return;
      if (e.target && e.target.tagName === 'SELECT') return;
      /* Si el usuario ya escribió algo en un campo de la ventana, Esc no la cierra (evita perder un formulario a medias):
         se cierra con su botón «Cancelar/Cerrar». */
      if (estado[def.id] && estado[def.id].sucio) return;
      e.preventDefault();
      def.cerrar(el);
      return;
    }
    var f = enfocables(caja);
    if (!f.length) { e.preventDefault(); try { caja.focus(); } catch (x) { warn(x); } return; }
    var a = document.activeElement, i = f.indexOf(a);
    if (!caja.contains(a) || i === -1 && a === caja) {
      e.preventDefault(); (e.shiftKey ? f[f.length - 1] : f[0]).focus(); return;
    }
    if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }, true);

  function procesar(root) {
    try { clicables(root); } catch (e) { warn(e); }
    try { campos(root); } catch (e) { warn(e); }
    try { tablasYSvg(root); } catch (e) { warn(e); }
    try { tablasNombre(root); } catch (e) { warn(e); }
    try { thsVacios(root); } catch (e) { warn(e); }
  }

  /* Teclado: Enter / Espacio sobre lo que marcó este script */
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var k = e.key;
    if (k !== 'Enter' && k !== ' ' && k !== 'Spacebar') return;
    var el = e.target;
    if (!el || el.nodeType !== 1 || !el.getAttribute || el.getAttribute('data-a11y-kb') !== '1') return;
    if (NATIVOS.test(el.tagName)) return;
    e.preventDefault();
    if (e.repeat) return;
    el.click();
  });

  /* Skip-link: mueve el foco sin cambiar la URL */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('.skip-link');
    if (!a) return;
    var t = document.getElementById('contenido');
    if (!t) return;
    e.preventDefault();
    t.setAttribute('tabindex', '-1');
    t.focus();
  });

  /* Observador ligero: procesa solo los nodos añadidos, agrupados cada 150 ms */
  var pend = [], timer = null;
  function vaciar() {
    timer = null;
    var l = pend; pend = [];
    contenedores();
    try { tienda(); } catch (e) { warn(e); }
    try { revisar(); } catch (e) { warn(e); }
    if (l.length > 300) { procesar(document.body); return; }
    l.forEach(function (n) { if (n.isConnected) procesar(n); });
  }
  function inicio() {
    try {
      contenedores();
      try { tienda(); } catch (e) { warn(e); }
      try { revisar(); } catch (e) { warn(e); }
      procesar(document.body);
      if (window.MutationObserver) {
        new MutationObserver(function (ms) {
          for (var i = 0; i < ms.length; i++) {
            var a = ms[i].addedNodes;
            for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1) pend.push(a[j]);
          }
          try { revisar(); } catch (e) { warn(e); }
          if (pend.length && !timer) timer = setTimeout(vaciar, 150);
        }).observe(document.body, { childList: true, subtree: true });
      }
    } catch (e) { warn(e); }
  }
  if (document.body) inicio(); else document.addEventListener('DOMContentLoaded', inicio);
})();
