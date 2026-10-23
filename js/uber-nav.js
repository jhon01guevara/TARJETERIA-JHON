/* js/uber-nav.js · agrupa el menú lateral estilo Uber sin tocar app.js
   Guía: guia-rediseno-uber.json (Fase 2) · claves reales verificadas contra V.
   Se desactiva solo mientras se edita el orden («Ordenar botones» → body.navEd). */
(function () {
  'use strict';
  var GRUPOS = [
    { t: 'Principal',      k: ['home'] },
    { t: 'Ventas',         k: ['nueva', 'fac', 'cli', 'vend'] },
    { t: 'Catálogo',       k: ['prod', 'cat', 'gal', 'marketing'] },
    { t: 'Tienda online',  k: ['tienda', 'chat', 'tiktoklive'] },
    { t: 'Operación',      k: ['mapa', 'ubi', 'agenda', 'check'] },
    { t: 'Administración', k: ['empresas', 'config'] }
  ];
  var nav = document.getElementById('nav');
  if (!nav) return;
  var obs = null;

  function agrupar() {
    if (document.body.classList.contains('navEd')) return;
    if (obs) obs.disconnect();
    try {
      Array.prototype.forEach.call(nav.querySelectorAll('.ug'), function (e) { e.remove(); });
      var usados = {};
      GRUPOS.forEach(function (g) {
        var miembros = [];
        g.k.forEach(function (k) {
          var el = nav.querySelector('.ni[data-k="' + k + '"]');
          if (el) { miembros.push(el); usados[k] = 1; }
        });
        if (!miembros.length) return;
        var h = document.createElement('div');
        h.className = 'ug';
        h.textContent = g.t;
        nav.appendChild(h);
        miembros.forEach(function (el) { nav.appendChild(el); });
      });
      var sueltos = Array.prototype.filter.call(nav.querySelectorAll('.ni'), function (el) { return !usados[el.dataset.k]; });
      if (sueltos.length) {
        var h2 = document.createElement('div');
        h2.className = 'ug';
        h2.textContent = 'Más';
        nav.appendChild(h2);
        sueltos.forEach(function (el) { nav.appendChild(el); });
      }
    } catch (e) { if (window.console) console.warn('uber-nav:', e); }
    if (obs) obs.observe(nav, { childList: true });
  }

  obs = new MutationObserver(function () { agrupar(); });
  agrupar();
  obs.observe(nav, { childList: true });
})();
