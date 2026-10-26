/* js/ayuda.js · Pantalla «Ayuda y soporte» de VEN CRM (menú «Ayuda y soporte», visible para todo usuario con sesión).
   Contenido: acceso a la guía «Primeros pasos», preguntas frecuentes cortas (según el rol) y contacto:
     · contacto de la EMPRESA (teléfono/correo de «Datos de la empresa», si existen),
     · soporte de VEN CRM desde js/soporte-config.js (vacío = no se muestra ni se inventa nada),
     · «datos para soporte» (empresa, rol, pantalla, navegador) listos para copiar y pegar en un mensaje.
   Solo LEE datos del panel (DB, SES…); no escribe en Firestore ni en localStorage, no usa red, no envía nada a nadie.
   Script clásico que se carga DESPUÉS de js/app.js y js/guia.js. Sin <style> ni onclick en línea (CSP); estilos en css/guia.css.
   Revertir: quitar el <script> de index.html (y js/soporte-config.js), la entrada de sw.js y, en js/app.js, `(k==='ayuda'&&!!SES)||` de puede(). */
(function () {
  'use strict';

  /* ---------- lógica pura (se prueba sin navegador) ---------- */
  // Preguntas cortas, verificadas contra los textos reales de la app. solo:'admin' = solo el administrador; pantalla = permiso necesario para el botón «Ir».
  var FAQ = [
    { id: 'factura', q: '¿Cómo hago una factura?', a: 'Entre a «Nueva factura», elija el cliente (o deje «Consumidor final»), elija el producto en cada línea y pulse «Emitir factura». Queda guardada en «Facturas», donde puede imprimirla, bajarla en PDF o enviarla por WhatsApp.', ir: { pantalla: 'nueva', texto: 'Ir a Nueva factura' } },
    { id: 'cliente', q: '¿Cómo agrego un cliente?', a: 'Entre a «Clientes», escriba el nombre y el teléfono y pulse «Agregar». Con eso basta; lo demás es opcional. Después lo elige rápido en cada factura.', ir: { pantalla: 'cli', texto: 'Ir a Clientes' } },
    { id: 'producto', q: '¿Cómo agrego un producto?', a: 'Entre a «Productos», escriba el nombre y el precio y pulse «Agregar». Al hacer una factura lo elige y el precio se llena solo.', ir: { pantalla: 'prod', texto: 'Ir a Productos' } },
    { id: 'anular', q: '¿Cómo anulo una factura?', solo: 'admin', a: 'Entre a «Facturas» y pulse «Anular» en esa factura. Queda marcada como anulada y deja de sumar en los totales. Solo el administrador puede anularla.', ir: { pantalla: 'fac', texto: 'Ir a Facturas' } },
    { id: 'tienda', q: '¿Cómo comparto mi tienda en línea?', a: 'Entre a «Tienda virtual» y pulse «Copiar enlace» o «Enviar por WhatsApp». Sus clientes ven los productos que usted publicó y sus pedidos llegan a «Pedidos de la tienda».', ir: { pantalla: 'tienda', texto: 'Ir a Tienda virtual' } },
    { id: 'datos', q: '¿Cómo cambio el nombre, el teléfono o el logo de mi empresa?', solo: 'admin', a: 'Entre a «Configuración», pestaña «Ajustes generales del panel», abra «Datos de la empresa», pulse «Editar» y luego «Guardar datos». Esos datos salen en sus facturas y en su tienda.', paso: 'empresa', ir: { pantalla: 'config', texto: 'Ir a Datos de la empresa' } },
    { id: 'vendedor', q: '¿Cómo invito a un vendedor?', solo: 'admin', a: 'Entre a «Vendedores», pulse «+ Crear vendedor», escriba su nombre, correo y una contraseña de 6 o más caracteres, y marque los paneles a los que puede entrar. Solo verá esos paneles.', ir: { pantalla: 'vend', texto: 'Ir a Vendedores' } },
    { id: 'copia', q: '¿Cómo guardo una copia de mis datos?', solo: 'admin', a: 'En «Configuración», «Ajustes generales del panel»: «Exportar los datos de mi empresa» baja sus clientes, productos, facturas y pedidos para abrirlos en Excel, y «Copia de seguridad» baja un respaldo completo que luego puede restaurar. No se borra nada.', exportar: true },
    { id: 'instalar', q: '¿Cómo instalo la app en mi teléfono o computadora?', a: 'Android (Chrome): menú ⋮ → «Instalar aplicación». iPhone (Safari): botón Compartir → «Añadir a pantalla de inicio». Computadora (Chrome o Edge): el ícono de instalar en la barra de direcciones. Abra siempre https://vencrm.com.' },
    { id: 'clave', q: 'Olvidé mi contraseña', a: 'En la pantalla de entrada pulse «¿Olvidó su contraseña?» y siga el mensaje que le llega al correo. Si es vendedor, pida ayuda al administrador de su empresa.' },
    { id: 'vieja', q: 'La app se ve vieja o no carga bien', a: 'Cierre la app y vuelva a abrirla. En una computadora pruebe Ctrl+Shift+R; en el teléfono cierre la pestaña y ábrala otra vez. Sus datos están en la nube y no se pierden.' },
    { id: 'seguro', q: '¿Dónde se guardan mis datos?', a: 'En la nube, no solo en su aparato, y se entra con correo y contraseña. De todos modos, baje una copia de vez en cuando con «Exportar los datos de mi empresa» o «Copia de seguridad».' }
  ];
  function faqPara(esAdmin, puede) {
    return FAQ.filter(function (f) {
      if (f.solo === 'admin' && !esAdmin) return false;
      if (f.ir && !esAdmin && !(puede && puede(f.ir.pantalla))) return false;
      return true;
    });
  }
  var RE_WA = /^\d{8,15}$/, RE_MAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
  /* cfg = window.VEN_SOPORTE → solo canales válidos; nada se inventa. */
  function canalesSoporte(cfg, nombre) {
    cfg = cfg || {};
    var wa = String(cfg.whatsapp || '').replace(/[\s+().-]/g, ''), mail = String(cfg.correo || '').trim(), hor = String(cfg.horario || '').trim().slice(0, 120);
    var txt = 'Hola, necesito ayuda con VEN CRM' + (nombre ? ' (empresa: ' + nombre + ')' : '') + '.';
    return {
      whatsapp: RE_WA.test(wa) ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(txt) : '',
      correo: RE_MAIL.test(mail) ? 'mailto:' + mail + '?subject=' + encodeURIComponent('Ayuda con VEN CRM') + '&body=' + encodeURIComponent(txt) : '',
      correoTxt: RE_MAIL.test(mail) ? mail : '',
      horario: hor
    };
  }
  function datosSoporte(o) {
    o = o || {};
    return ['VEN CRM · datos para soporte',
      'Empresa: ' + (o.empresa || '-') + (o.nombre ? ' (' + o.nombre + ')' : ''),
      'Usuario: ' + (o.rol || '-'),
      'Pantalla: ' + (o.pantalla || '-'),
      'App: ' + (o.instalada ? 'instalada' : 'en el navegador') + (o.cache ? ' · versión ' + o.cache : ''),
      'Navegador: ' + (o.navegador || '-'),
      'Fecha y hora: ' + (o.fecha || '-')].join('\n');
  }
  var api = { FAQ: FAQ, faqPara: faqPara, canalesSoporte: canalesSoporte, datosSoporte: datosSoporte, RE_WA: RE_WA, RE_MAIL: RE_MAIL };
  if (typeof module === 'object' && module && module.exports) { module.exports = api; return; }
  window.TJAyuda = api;

  /* ---------- pantalla ---------- */
  var EN_TIENDA = false;
  try { EN_TIENDA = !!SHOP; } catch (e) { EN_TIENDA = /[?&]tienda(=|&|$)/.test(location.search); }
  if (EN_TIENDA) return; // la tienda pública nunca muestra la ayuda del panel
  function aviso(e) { try { if (window._tjw) window._tjw(e); } catch (_) {} }
  function g(id) { return document.getElementById(id); }
  function html(s) { try { return esc(s); } catch (e) { return String(s).replace(/[&<>"']/g, ''); } }
  function ha() { try { return _ha.apply(null, arguments); } catch (e) { return ''; } }
  function esAdm() { try { return esAdmin(); } catch (e) { return false; } }
  function pu(k) { try { return puede(k); } catch (e) { return false; } }
  function nombreEmp() { try { return nombreNegocio(); } catch (e) { return ''; } }
  function empId() { try { return TJEmpresa.empActiva(); } catch (e) { return ''; } }
  function boton(cls, fn, args, texto, label) {
    return '<button type="button" class="btn ' + cls + '"' + (label ? ' aria-label="' + html(label) + '"' : '') + ' data-h-click="call" data-a-click="' + ha.apply(null, [fn].concat(args)) + '">' + texto + '</button>';
  }
  function enlace(cls, href, texto, label) {
    return '<a class="btn ' + cls + '" href="' + html(href) + '" target="_blank" rel="noopener noreferrer"' + (label ? ' aria-label="' + html(label) + '"' : '') + '>' + texto + '</a>';
  }

  function tarjetaGuia() {
    var ev = null; try { ev = typeof guiaEstado === 'function' ? guiaEstado() : null; } catch (e) { aviso(e); }
    if (!ev || !ev.total) return '';
    var estado = ev.completo ? '¡Completó los ' + ev.total + ' pasos!' : 'Lleva ' + ev.hechos + ' de ' + ev.total + ' pasos.';
    return '<div class="card" id="ayGuia"><h3 style="margin:0 0 4px">🚀 Primeros pasos</h3><p class="ay-p">Una guía corta para dejar su empresa lista, paso a paso. <b>' + html(estado) + '</b></p>' +
      '<div class="ay-bt">' + boton('p', 'guiaAbrir', [], ev.completo ? 'Repasar la guía' : 'Continuar la guía', ev.completo ? 'Repasar la guía de primeros pasos' : 'Continuar la guía de primeros pasos') + '</div></div>';
  }
  function tarjetaFaq() {
    var adm = esAdm(), lista = faqPara(adm, pu);
    var li = lista.map(function (f) {
      var acc = '';
      if (f.exportar && adm && typeof expIr === 'function') acc = boton('s', 'expIr', [], '📤 Ir a Exportar mis datos', 'Ir a Exportar los datos de mi empresa');
      else if (f.paso && typeof guiaIr === 'function') acc = boton('s', 'guiaIr', [f.paso], html(f.ir.texto) + ' →', f.ir.texto);
      else if (f.ir) acc = boton('s', 'ir', [f.ir.pantalla], html(f.ir.texto) + ' →', f.ir.texto);
      return '<details class="ay-q" data-faq="' + f.id + '"><summary>' + html(f.q) + '</summary><p>' + html(f.a) + '</p>' + (acc ? '<div class="ay-bt">' + acc + '</div>' : '') + '</details>';
    }).join('');
    return '<div class="card" id="ayFaq"><h3 style="margin:0 0 4px">❓ Preguntas frecuentes</h3><p class="ay-p">Toque una pregunta para ver la respuesta.</p>' + li + '</div>';
  }
  function tarjetaContacto() {
    var emp = '', cfg = {}; try { cfg = DB.cfg || {}; } catch (e) {}
    var tel = String(cfg.tel || '').trim(), mail = String(cfg.email || '').trim(), nombre = nombreEmp();
    var wa = ''; try { wa = tel && typeof tdWa === 'function' ? tdWa(tel, 'Hola, necesito ayuda con VEN CRM.') : ''; } catch (e) {}
    var mailOk = RE_MAIL.test(mail);
    if (tel || mailOk) {
      emp = '<div class="ay-ct" id="ayEmpresa"><b>Su empresa' + (nombre ? ': ' + html(nombre) : '') + '</b><p class="ay-p">Si es vendedor o tiene una duda del día a día, escríbale a su empresa.</p><div class="ay-bt">' +
        (wa ? enlace('s', wa, '💬 WhatsApp', 'Escribir por WhatsApp a su empresa') : '') +
        (tel ? '<a class="btn s" href="tel:' + html(tel.replace(/[^\d+]/g, '')) + '">📞 Llamar: ' + html(tel) + '</a>' : '') +
        (mailOk ? enlace('s', 'mailto:' + mail, '✉️ ' + html(mail), 'Escribir por correo a su empresa') : '') + '</div></div>';
    }
    var c = canalesSoporte(window.VEN_SOPORTE, nombre), hay = !!(c.whatsapp || c.correo);
    var vc = '<div class="ay-ct" id="aySoporte"><b>Soporte de VEN CRM</b>' + (hay
      ? '<p class="ay-p">¿Algo no funciona o tiene una duda que no está arriba? Escríbanos y le ayudamos.' + (c.horario ? ' <span class="ay-h">' + html(c.horario) + '</span>' : '') + '</p><div class="ay-bt">' +
        (c.whatsapp ? enlace('p', c.whatsapp, '💬 Escribir por WhatsApp', 'Escribir al soporte de VEN CRM por WhatsApp') : '') +
        (c.correo ? enlace(c.whatsapp ? 's' : 'p', c.correo, '✉️ Escribir por correo', 'Escribir al soporte de VEN CRM por correo: ' + c.correoTxt) : '') + '</div>'
      : '<p class="ay-p">Todavía no hay un canal de soporte público activo. Por ahora, escríbale a la persona que le dio acceso a VEN CRM y cuéntele qué pasó; los «datos para soporte» de abajo le ayudan a explicarlo.</p>') + '</div>';
    return '<div class="card" id="ayContacto"><h3 style="margin:0 0 6px">💬 Contacto y soporte</h3>' + emp + vc +
      '<details class="ay-q" id="ayDatos"><summary>Datos para soporte (copiar y pegar en su mensaje)</summary><p>Contienen solo la empresa, su tipo de usuario, la pantalla y el navegador. No incluyen contraseñas ni datos de clientes.</p>' +
      '<textarea id="ay_datos" readonly rows="7" aria-label="Datos para soporte" class="ay-ta"></textarea><div class="ay-bt">' + boton('s', 'ayudaCopiar', [], '📋 Copiar datos', 'Copiar los datos para soporte') + '</div><p id="ay_msg" role="status" aria-live="polite" class="ay-p"></p></details></div>';
  }
  function llenarDatos() {
    var ta = g('ay_datos'); if (!ta) return;
    var rol = esAdm() ? 'Administrador' : 'Vendedor', cache = '', inst = false;
    try { inst = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}
    var o = { empresa: empId(), nombre: nombreEmp(), rol: rol, pantalla: (function () { try { return V.find(function (x) { return x[0] === (window.__ayudaDesde || 'home'); })[2]; } catch (e) { return ''; } })(), instalada: inst, navegador: navigator.userAgent, fecha: new Date().toLocaleString('es-PA') + ' (hora local)' };
    ta.value = datosSoporte(o);
    try { if (window.caches && caches.keys) caches.keys().then(function (ks) { var k = ks.filter(function (x) { return /net-first/.test(x); })[0]; if (k && g('ay_datos')) { o.cache = k; g('ay_datos').value = datosSoporte(o); } }).catch(function () {}); } catch (e) {}
  }
  function copiar() {
    var ta = g('ay_datos'), m = g('ay_msg'); if (!ta) return;
    function ok() { if (m) m.textContent = '✔ Copiado. Péguelo en su mensaje de soporte.'; }
    function manual() { try { ta.focus(); ta.select(); var r = document.execCommand && document.execCommand('copy'); if (m) m.textContent = r ? '✔ Copiado. Péguelo en su mensaje de soporte.' : 'Seleccionamos el texto: use Ctrl+C (o «Copiar» en el teléfono) y péguelo en su mensaje.'; } catch (e) { aviso(e); if (m) m.textContent = 'Seleccione el texto y cópielo a mano.'; } }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value).then(ok, manual); return; } } catch (e) { aviso(e); }
    manual();
  }
  function render() {
    var v = g('v'); if (!v) return;
    v.innerHTML = '<div class="card ay-cab"><h3 style="margin:0 0 4px">❓ Ayuda y soporte</h3><p class="ay-p">Respuestas cortas, la guía de primeros pasos y cómo pedir ayuda. Si algo no queda claro, aquí está todo en un solo lugar.</p></div>' +
      tarjetaGuia() + tarjetaFaq() + tarjetaContacto();
    llenarDatos();
  }
  /* ---------- enganche con la app ---------- */
  var vista0 = '';
  // Ícono de menú (signo de interrogación, Material «help») con el mismo estilo que los demás botones del menú.
  try { if (typeof NAVI !== 'undefined' && !NAVI.ayuda) NAVI.ayuda = ['M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z', '#0ea5e9', '#0369a1']; } catch (e) { aviso(e); }
  try { if (typeof V !== 'undefined' && !V.some(function (x) { return x[0] === 'ayuda'; })) V.push(['ayuda', '❓', 'Ayuda y soporte']); } catch (e) { aviso(e); }
  try {
    if (typeof R !== 'undefined') R.ayuda = function () { render(); };
    if (typeof ir === 'function') {
      var ir0 = window.ir;
      window.ir = function (k) { if (k !== 'ayuda') window.__ayudaDesde = k; return ir0.apply(this, arguments); };
    }
    if (typeof SES !== 'undefined' && SES && typeof nav === 'function') nav();
  } catch (e) { aviso(e); }
  window.ayudaCopiar = copiar;
  window.ayudaRender = render;
})();
