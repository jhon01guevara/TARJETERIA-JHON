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
      if (f.hasAttribute('aria-label') || f.hasAttribute('aria-labelledby') || f.hasAttribute('title')) return;
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
    imgv: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Vista previa' }
  };
  function contenedores() {
    Object.keys(CONT).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var a = CONT[id];
      Object.keys(a).forEach(function (k) { if (!el.hasAttribute(k)) el.setAttribute(k, a[k]); });
    });
  }

  function procesar(root) {
    try { clicables(root); } catch (e) { warn(e); }
    try { campos(root); } catch (e) { warn(e); }
    try { tablasYSvg(root); } catch (e) { warn(e); }
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
    if (l.length > 300) { procesar(document.body); return; }
    l.forEach(function (n) { if (n.isConnected) procesar(n); });
  }
  function inicio() {
    try {
      contenedores();
      procesar(document.body);
      if (window.MutationObserver) {
        new MutationObserver(function (ms) {
          for (var i = 0; i < ms.length; i++) {
            var a = ms[i].addedNodes;
            for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1) pend.push(a[j]);
          }
          if (pend.length && !timer) timer = setTimeout(vaciar, 150);
        }).observe(document.body, { childList: true, subtree: true });
      }
    } catch (e) { warn(e); }
  }
  if (document.body) inicio(); else document.addEventListener('DOMContentLoaded', inicio);
})();
