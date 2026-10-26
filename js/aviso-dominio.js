/* js/aviso-dominio.js · Aviso amable para quien usa VEN CRM desde la dirección antigua (jhon01guevara.github.io).
   Invita a abrir https://vencrm.com e instalar la app de nuevo (el texto sigue docs/ETAPA-4-COBRO.md, sección «(d) Borrador de aviso»).
   · Solo se muestra en un host «*.github.io». Nunca en vencrm.com, en localhost, en copias de prueba ni en la tienda pública (?tienda=…).
   · Se puede descartar: «Ahora no» lo oculta 14 días; «No mostrar más» lo oculta para siempre. Se guarda solo en localStorage (clave tj_aviso_dominio).
   · No toca datos, ni sesión, ni el service worker; no usa red ni estilos en línea (los estilos están en css/aviso-dominio.css; sin onclick en línea: CSP).
   Revertir: quitar el <script src="js/aviso-dominio.js">, el <link css/aviso-dominio.css> de index.html y su entrada en sw.js. */
(function () {
  'use strict';
  var DESTINO = 'https://vencrm.com/';
  var CLAVE = 'tj_aviso_dominio';
  var DIAS_POSPONER = 14;

  /* Lógica pura (se prueba sin navegador): ¿se debe mostrar el aviso? */
  function debeMostrar(host, search, estado, ahora) {
    host = String(host || '').toLowerCase();
    if (!/\.github\.io$/.test(host)) return false;                 // solo la dirección antigua
    if (/[?&]tienda(=|&|$)/.test(String(search || ''))) return false; // nunca en las tiendas públicas
    if (estado && estado.nunca) return false;                        // «No mostrar más»
    if (estado && estado.hasta && +estado.hasta > (ahora || Date.now())) return false; // «Ahora no» (14 días)
    return true;
  }
  function plataforma(ua) {
    ua = String(ua || '');
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'pc';
  }
  var PASOS = {
    android: ['Mantenga pulsado el ícono viejo de la app y elija «Desinstalar» (o «Quitar»).', 'Abra vencrm.com en Chrome.', 'Menú ⋮ → «Instalar aplicación» (o «Añadir a pantalla de inicio»).', 'Abra la app e inicie sesión con su correo y contraseña de siempre.'],
    ios: ['Mantenga pulsado el ícono viejo y elija «Eliminar app».', 'Abra vencrm.com en Safari.', 'Botón Compartir → «Añadir a pantalla de inicio».', 'Abra la app e inicie sesión.'],
    pc: ['En la app instalada: menú ⋮ → «Desinstalar». (Si solo usa el navegador, salte este paso.)', 'Abra vencrm.com en Chrome o Edge.', 'Pulse el ícono de «Instalar» de la barra de direcciones.', 'Abra la app e inicie sesión con su correo y contraseña de siempre.']
  };
  var api = { debeMostrar: debeMostrar, plataforma: plataforma, PASOS: PASOS, DESTINO: DESTINO, CLAVE: CLAVE, DIAS_POSPONER: DIAS_POSPONER };
  if (typeof module === 'object' && module && module.exports) { module.exports = api; return; }
  window.TJAvisoDominio = api;

  function leer() { try { var o = JSON.parse(localStorage.getItem(CLAVE) || 'null'); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
  function guardar(o) { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) { try { if (window._tjw) window._tjw(e); } catch (_) {} } }
  var ls = leer();
  if (!debeMostrar(location.hostname, location.search, ls, Date.now())) return;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function boton(cls, txt) { var b = el('button', cls, txt); b.type = 'button'; return b; }
  function cerrar(o) {
    var n = document.getElementById('avisoDominio'); if (n) n.remove();
    if (o) guardar(o);
  }
  function montar() {
    if (document.getElementById('avisoDominio') || !document.body) return;
    var instalada = false;
    try { instalada = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}
    var plat = plataforma(navigator.userAgent);
    var caja = el('section', 'avd'); caja.id = 'avisoDominio';
    caja.setAttribute('role', 'region'); caja.setAttribute('aria-labelledby', 'avdT');
    var t = el('b', 'avd-t', 'VEN CRM tiene dirección nueva: vencrm.com'); t.id = 'avdT';
    var p = el('p', 'avd-p', (instalada ? 'Está usando la app instalada desde la dirección antigua. ' : '') +
      'Sus datos están a salvo: viven en la nube y no cambian. Para usar la dirección nueva, ábrala e instale la app de nuevo (2 minutos). Esta dirección sigue funcionando, no hay prisa.');
    var acc = el('div', 'avd-a');
    var a = el('a', 'btn p avd-go', 'Abrir vencrm.com'); a.href = DESTINO + (location.search || ''); a.rel = 'noopener';
    var como = boton('btn s avd-como', 'Cómo reinstalarla'); como.setAttribute('aria-expanded', 'false'); como.setAttribute('aria-controls', 'avdPasos');
    var ahora = boton('btn s avd-no', 'Ahora no');
    var nunca = boton('btn s avd-nunca', 'No mostrar más');
    acc.appendChild(a); acc.appendChild(como); acc.appendChild(ahora); acc.appendChild(nunca);
    var pasos = el('div', 'avd-pasos'); pasos.id = 'avdPasos'; pasos.hidden = true;
    var nombres = { android: 'Android (Chrome)', ios: 'iPhone (Safari)', pc: 'Computadora (Chrome o Edge)' };
    [plat].concat(['android', 'ios', 'pc'].filter(function (k) { return k !== plat; })).forEach(function (k, i) {
      var d = el('details', 'avd-so'); if (i === 0) d.open = true;
      d.appendChild(el('summary', null, nombres[k]));
      var ol = el('ol'); PASOS[k].forEach(function (s) { ol.appendChild(el('li', null, s)); }); d.appendChild(ol);
      pasos.appendChild(d);
    });
    pasos.appendChild(el('p', 'avd-nota', 'Antes de desinstalar, termine y guarde lo que tenga pendiente: lo que no se guardó en la nube no pasa a la app nueva.'));
    como.addEventListener('click', function () { var ab = pasos.hidden; pasos.hidden = !ab; como.setAttribute('aria-expanded', ab ? 'true' : 'false'); como.textContent = ab ? 'Ocultar los pasos' : 'Cómo reinstalarla'; });
    ahora.addEventListener('click', function () { cerrar({ hasta: Date.now() + DIAS_POSPONER * 86400000 }); });
    nunca.addEventListener('click', function () { cerrar({ nunca: 1 }); });
    caja.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar({ hasta: Date.now() + DIAS_POSPONER * 86400000 }); });
    caja.appendChild(t); caja.appendChild(p); caja.appendChild(acc); caja.appendChild(pasos);
    document.body.appendChild(caja);
    ubicar(); vigilar();
  }
  /* El inicio de sesión (#auth) atrapa el foco del teclado dentro de sí mismo (js/a11y.js). Para que quien usa el teclado también llegue a este aviso,
     mientras #auth está abierto el aviso vive dentro de él; al entrar al panel vuelve al <body>. */
  function ubicar() {
    var caja = document.getElementById('avisoDominio'); if (!caja) return;
    var au = document.getElementById('auth');
    var destino = (au && au.isConnected && au.style.display !== 'none') ? au : document.body;
    if (caja.parentNode !== destino) destino.appendChild(caja);
  }
  var observando = null;
  function vigilar() {
    try {
      new MutationObserver(function () {
        ubicar();
        var au = document.getElementById('auth');
        if (au && au !== observando) { observando = au; new MutationObserver(ubicar).observe(au, { attributes: true, attributeFilter: ['style'] }); }
      }).observe(document.body, { childList: true });
      var au0 = document.getElementById('auth');
      if (au0) { observando = au0; new MutationObserver(ubicar).observe(au0, { attributes: true, attributeFilter: ['style'] }); }
    } catch (e) { try { if (window._tjw) window._tjw(e); } catch (_) {} }
  }
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
