/* js/exportar-datos.js · «Exportar los datos de mi empresa» (Etapa 5: confianza y operación).
   Descarga clientes, productos, facturas (y sus líneas) y pedidos de la tienda de la EMPRESA ACTIVA en CSV (se abre en Excel), todo junto en un ZIP, o todo en un JSON.
   · SOLO LECTURA: no escribe en Firestore, no borra ni cambia nada. Los datos salen de lo que el panel ya tiene cargado; los pedidos de la tienda se vuelven a leer (get) de la empresa activa.
   · Solo el administrador de la empresa (esAdmin()): la tarjeta solo se dibuja para él y cada botón vuelve a comprobarlo.
   · No exporta la configuración (accesos de vendedores, claves, etc.): solo los cuatro grupos de datos del negocio.
   · Los CSV llevan BOM UTF-8 (tildes bien en Excel) y neutralizan celdas que parezcan fórmulas (=, +, -, @) para que abrirlos en Excel no ejecute nada.
   Script clásico que se carga DESPUÉS de js/app.js y usa sus globales (DB, TD, TJEmpresa, esAdmin, fbCol…) solo al ejecutarse. Sin <style> ni onclick en línea (CSP).
   Revertir: quitar el <script src="js/exportar-datos.js"> de index.html y su entrada en sw.js. Guía: docs/EXPORTAR-DATOS.md */
(function () {
  'use strict';

  /* ---------- lógica pura (se prueba sin navegador) ---------- */
  var SEGURO = /^[+-]?\d[\d\s().,-]*$/; // números y teléfonos: sin letras no pueden ser una fórmula peligrosa
  function celda(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    var s = String(v).replace(/\u0000/g, '');
    if (/^[=+\-@\t\r]/.test(s) && !SEGURO.test(s)) s = "'" + s; // CSV-injection (OWASP)
    return /[",\r\n;]/.test(s) || /^\s|\s$/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function aCSV(cols, filas) {
    var l = [cols.map(celda).join(',')];
    filas.forEach(function (f) { l.push(f.map(celda).join(',')); });
    return l.join('\r\n') + '\r\n';
  }
  function num(v) { var n = +v; return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; }
  function t(v) { return v === null || v === undefined ? '' : String(v); }
  function fechaHora(ts) {
    ts = +ts; if (!ts) return '';
    var d = new Date(ts), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function arr(a) { return Array.isArray(a) ? a.filter(function (x) { return x && typeof x === 'object'; }) : []; }
  function resumenItems(items, esPed) {
    return arr(items).map(function (i) { var d = esPed ? i.n : i.d; return t(d) + ' x' + (i.q == null ? 1 : i.q) + ' a ' + num(i.p).toFixed(2); }).join(' | ');
  }
  function nombreVend(usuarios, id) {
    var u = arr(usuarios).filter(function (x) { return x.id === id; })[0];
    return u ? t(u.n) : t(id);
  }

  var COLS = {
    clientes: ['ID', 'Nombre', 'RUC/Cédula', 'Teléfono', 'Dirección', 'Correo', 'Origen', 'Latitud', 'Longitud'],
    productos: ['ID', 'Nombre', 'Precio'],
    facturas: ['Nº', 'Fecha', 'Cliente', 'RUC/Cédula', 'Dirección', 'Forma de pago', 'Subtotal', 'Descuento', 'ITBMS %', 'ITBMS', 'Total', 'Anulada', 'Vendedor', 'Nota', 'Artículos'],
    lineas: ['Nº factura', 'Fecha', 'Cliente', 'Descripción', 'Cantidad', 'Precio', 'Importe'],
    pedidos: ['ID', 'Fecha y hora', 'Estado', 'Cliente', 'Teléfono', 'Correo', 'Empresa del cliente', 'Dirección', 'Artículos', 'Total', 'Nota', 'Vendedor/enlace', 'Transportista', 'Guía de envío']
  };
  /* datos = { clientes, productos, facturas, pedidos, usuarios } → { clientes, productos, facturas, lineas, pedidos } (cada uno es un texto CSV) */
  function construir(datos) {
    datos = datos || {};
    var cli = arr(datos.clientes), prod = arr(datos.productos), fac = arr(datos.facturas), ped = arr(datos.pedidos), us = datos.usuarios;
    var facOrd = fac.slice().sort(function (a, b) { return (+a.n || 0) - (+b.n || 0); });
    var lineas = [];
    facOrd.forEach(function (f) { arr(f.items).forEach(function (i) { lineas.push([f.n, f.fecha, f.cli, i.d, i.q == null ? 1 : num(i.q), num(i.p), num((i.q == null ? 1 : +i.q) * (+i.p || 0))]); }); });
    return {
      clientes: aCSV(COLS.clientes, cli.map(function (c) { return [c.id, c.n, c.r, c.t, c.d, c.m, c.o, c.lat, c.lng]; })),
      productos: aCSV(COLS.productos, prod.map(function (p) { return [p.id, p.n, num(p.p)]; })),
      facturas: aCSV(COLS.facturas, facOrd.map(function (f) {
        return [f.n, f.fecha, f.cli, f.ruc, f.dir, f.pago, num(f.sub), num(f.ds), f.itbmsp == null ? '' : num(f.itbmsp), num(f.itbms), num(f.total), !!f.anulada, f.vend ? nombreVend(us, f.vend) : '', f.nota, resumenItems(f.items, false)];
      })),
      lineas: aCSV(COLS.lineas, lineas),
      pedidos: aCSV(COLS.pedidos, ped.slice().sort(function (a, b) { return (+a.ts || 0) - (+b.ts || 0); }).map(function (p) {
        var l = p.lead || {}, e = p.envio || {};
        return [p.id, fechaHora(p.ts), p.estado === 'atendido' ? 'Atendido' : 'Nuevo', l.name, l.tel, l.email, l.empresa, l.dir, resumenItems(p.items, true), num(p.total), p.nota, p.ref, e.agencia, e.guia];
      }))
    };
  }
  function aJSON(datos, empresa, ahora) {
    datos = datos || {};
    return JSON.stringify({
      formato: 'ven-crm-exportacion', version: 1, generado: new Date(ahora || Date.now()).toISOString(),
      empresa: { id: t(empresa && empresa.id), nombre: t(empresa && empresa.nombre) },
      resumen: { clientes: arr(datos.clientes).length, productos: arr(datos.productos).length, facturas: arr(datos.facturas).length, pedidos: arr(datos.pedidos).length },
      clientes: arr(datos.clientes), productos: arr(datos.productos), facturas: arr(datos.facturas), pedidos: arr(datos.pedidos)
    }, null, 1);
  }
  function nombreArchivo(slug, fecha, que, ext) {
    var s = String(slug || 'empresa').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'empresa';
    return 'ven-crm_' + s + '_' + fecha + '_' + que + '.' + ext;
  }
  var api = { celda: celda, aCSV: aCSV, construir: construir, aJSON: aJSON, nombreArchivo: nombreArchivo, COLS: COLS };
  if (typeof module === 'object' && module && module.exports) { module.exports = api; return; }
  window.TJExportar = api;

  /* ---------- pantalla (solo administrador) ---------- */
  function g(id) { return document.getElementById(id); }
  function aviso(e) { try { if (window._tjw) window._tjw(e); } catch (_) {} }
  function html(s) { try { return esc(s); } catch (e) { return String(s).replace(/[&<>"']/g, ''); } }
  function ha() { try { return _ha.apply(null, arguments); } catch (e) { return ''; } }
  function esAdm() { try { return esAdmin(); } catch (e) { return false; } }
  function slug() { try { return TJEmpresa.empActiva(); } catch (e) { return 'empresa'; } }
  function nombreEmp() { try { return nombreNegocio(); } catch (e) { return slug(); } }
  function hoyTxt() { try { return hoy(); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  var busy = false;

  function conteos() {
    var p = 0; try { p = (TD.peds || []).length; } catch (e) {}
    var c = 0, pr = 0, f = 0;
    try { c = (DB.cli || []).length; pr = (DB.prod || []).length; f = (DB.fac || []).length; } catch (e) {}
    return { c: c, pr: pr, f: f, p: p };
  }
  function pl(n, uno, varios) { return n === 1 ? uno : varios; }
  function boton(cls, fn, args, texto, label, id) {
    return '<button type="button" class="btn ' + cls + '"' + (id ? ' id="' + id + '"' : '') + (label ? ' aria-label="' + html(label) + '"' : '') + ' data-h-click="call" data-a-click="' + ha.apply(null, [fn].concat(args)) + '">' + texto + '</button>';
  }
  function tarjeta() {
    var n = conteos(), zip = typeof JSZip !== 'undefined';
    return '<p style="font-size:12.5px;color:var(--gris);margin:0 0 4px">Descargue una copia de sus <b>clientes, productos, facturas y pedidos de la tienda</b> de <b>' + html(nombreEmp()) + '</b> para abrirla en Excel o guardarla aparte. ' +
      'Solo se lee: <b>no se borra ni se cambia nada</b>. Sirve para llevar sus datos a otro lugar o como respaldo adicional.</p>' +
      '<p style="font-size:12.5px;margin:4px 0 8px" id="exp_cnt">Ahora tiene: <b>' + n.c + '</b> ' + pl(n.c, 'cliente', 'clientes') + ' · <b>' + n.pr + '</b> ' + pl(n.pr, 'producto', 'productos') + ' · <b>' + n.f + '</b> ' + pl(n.f, 'factura', 'facturas') + ' · <b>' + n.p + '</b> ' + pl(n.p, 'pedido', 'pedidos') + ' de la tienda.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      boton('s', 'expDescargar', ['clientes'], '👥 Clientes (CSV)', 'Descargar clientes en CSV') +
      boton('s', 'expDescargar', ['productos'], '🎴 Productos (CSV)', 'Descargar productos en CSV') +
      boton('s', 'expDescargar', ['facturas'], '📚 Facturas (CSV)', 'Descargar facturas en CSV') +
      boton('s', 'expDescargar', ['lineas'], '🧾 Líneas de facturas (CSV)', 'Descargar las líneas de las facturas en CSV') +
      boton('s', 'expDescargar', ['pedidos'], '🛍 Pedidos de la tienda (CSV)', 'Descargar pedidos de la tienda en CSV') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      (zip ? boton('p', 'expDescargar', ['zip'], '⬇ Todo en un ZIP (CSV)', 'Descargar todo en un archivo ZIP de CSV', 'exp_zip') : '') +
      boton(zip ? '' : 'p', 'expDescargar', ['json'], '⬇ Todo en un archivo JSON', 'Descargar todo en un archivo JSON') + '</div>' +
      '<p id="exp_msg" role="status" aria-live="polite" style="font-size:12.5px;margin:8px 0 0;color:var(--gris)"></p>' +
      '<p style="font-size:11.5px;color:var(--gris);margin:6px 0 0">Los CSV se abren con Excel o Google Sheets (separados por comas, con tildes correctas). No incluyen contraseñas ni accesos de vendedores.</p>';
  }
  var TITULO = '📤 Exportar los datos de mi empresa';
  function montar() {
    if (!esAdm()) return;
    var cont = g('cfgGenExtra'); if (!cont) return;
    var c = g('exportCard');
    if (!c) {
      c = document.createElement('div'); c.className = 'card'; c.id = 'exportCard';
      var ref = g('bkCard'); // junto a «Copia de seguridad»
      if (ref && ref.parentNode === cont) cont.insertBefore(c, ref); else cont.appendChild(c);
    }
    // Plegable como las demás tarjetas de Configuración (minimizada por defecto); si wrapCardInner no existe, queda abierta.
    c.innerHTML = typeof wrapCardInner === 'function' ? wrapCardInner('exportCard', TITULO, tarjeta()) : '<h3 style="margin:0">' + TITULO + '</h3>' + tarjeta();
  }
  /* Lleva a Configuración → General y abre la tarjeta (lo usa la pantalla de Ayuda). */
  function ir_() {
    if (!esAdm()) return;
    try { ir('config'); } catch (e) { aviso(e); return; }
    setTimeout(function () {
      try {
        if (typeof cfgTab === 'function') cfgTab('gen');
        montar();
        if (typeof cardState !== 'undefined' && !cardState.exportCard && typeof toggleCard === 'function') toggleCard('exportCard');
        var c = g('exportCard'); if (c) { c.scrollIntoView({ block: 'start' }); var b = c.querySelector('button[aria-label^="Descargar"]'); if (b) b.focus({ preventScroll: true }); }
      } catch (e) { aviso(e); }
    }, 250);
  }
  function msg(txt, ok) {
    var m = g('exp_msg'); if (!m) return;
    m.textContent = txt; m.style.color = ok === false ? '#b3261e' : (ok ? '#1e7a43' : 'var(--gris)');
  }
  function bajar(blob, nombre) {
    try { if (typeof dlBlob === 'function') return dlBlob(blob, nombre); } catch (e) { aviso(e); }
    var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  /* Pedidos de la empresa activa: lectura fresca (get); si falla, lo que el panel ya tiene cargado. */
  async function leerPedidos() {
    try {
      if (typeof fbCol === 'function' && typeof fbDb !== 'undefined' && fbDb) {
        var sn = await fbCol('tienda_pedidos').get();
        var l = sn.docs.map(function (d) { var x = d.data(); try { return typeof sanPed === 'function' ? sanPed(x) : x; } catch (e) { return null; } }).filter(Boolean);
        return l;
      }
    } catch (e) { aviso(e); }
    try { return (TD.peds || []).slice(); } catch (e) { return []; }
  }
  async function recolectar() {
    var us = []; try { us = (DB.cfg || {}).users || []; } catch (e) {}
    return { clientes: (DB.cli || []).slice(), productos: (DB.prod || []).slice(), facturas: (DB.fac || []).slice(), pedidos: await leerPedidos(), usuarios: us };
  }
  async function descargar(que) {
    if (!esAdm()) { msg('Solo el administrador de la empresa puede exportar los datos.', false); return; }
    if (busy) return; busy = true;
    var b = g('exportCard'); if (b) b.setAttribute('aria-busy', 'true');
    msg('Preparando la descarga…');
    try {
      var d = await recolectar(), s = slug(), f = hoyTxt(), nom = nombreEmp();
      if (que === 'json') {
        bajar(new Blob([aJSON(d, { id: s, nombre: nom })], { type: 'application/json;charset=utf-8' }), nombreArchivo(s, f, 'todo', 'json'));
        msg('✔ Se descargó el archivo JSON con ' + d.clientes.length + ' clientes, ' + d.productos.length + ' productos, ' + d.facturas.length + ' facturas y ' + d.pedidos.length + ' pedidos. No se cambió nada.', true);
      } else if (que === 'zip') {
        if (typeof JSZip === 'undefined') throw new Error('sin-zip');
        var c = construir(d), z = new JSZip();
        ['clientes', 'productos', 'facturas', 'lineas', 'pedidos'].forEach(function (k) { z.file(nombreArchivo(s, f, k === 'lineas' ? 'lineas-de-facturas' : k, 'csv'), '\ufeff' + c[k]); });
        z.file('LEEME.txt', 'Exportación de VEN CRM · ' + nom + ' · ' + f + '\r\nClientes: ' + d.clientes.length + ' · Productos: ' + d.productos.length + ' · Facturas: ' + d.facturas.length + ' · Pedidos de la tienda: ' + d.pedidos.length + '\r\nLos CSV se abren con Excel o Google Sheets. Esta copia es solo de lectura: no cambia nada en VEN CRM.\r\n');
        bajar(await z.generateAsync({ type: 'blob' }), nombreArchivo(s, f, 'todo-csv', 'zip'));
        msg('✔ Se descargó el ZIP con 5 archivos CSV. No se cambió nada.', true);
      } else if (COLS[que]) {
        var cs = construir(d), filas = { clientes: d.clientes.length, productos: d.productos.length, facturas: d.facturas.length, pedidos: d.pedidos.length };
        var nl = que === 'lineas' ? d.facturas.reduce(function (a, x) { return a + arr(x.items).length; }, 0) : filas[que];
        bajar(new Blob(['\ufeff' + cs[que]], { type: 'text/csv;charset=utf-8' }), nombreArchivo(s, f, que === 'lineas' ? 'lineas-de-facturas' : que, 'csv'));
        msg('✔ Se descargó el archivo (' + nl + (nl === 1 ? ' fila' : ' filas') + '). No se cambió nada.', true);
      }
    } catch (e) {
      aviso(e); msg('No se pudo preparar la descarga. Revise su conexión e intente de nuevo. No se cambió nada.', false);
    } finally { busy = false; var bb = g('exportCard'); if (bb) bb.removeAttribute('aria-busy'); }
  }

  var cfg0 = null;
  try { cfg0 = R.config; } catch (e) {}
  if (typeof cfg0 === 'function') {
    R.config = function () { var r = cfg0.apply(this, arguments); try { montar(); } catch (e) { aviso(e); } return r; };
  }
  window.expDescargar = descargar;
  window.expMontar = montar;
  window.expIr = ir_;
})();
