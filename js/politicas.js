/* Textos legales y registro de consentimientos (Fase 11, extracción 3 de js/app.js).
   Estas líneas se movieron TAL CUAL desde js/app.js, sin cambiar lógica.
   Script clásico (sin ES modules) cargado justo ANTES de js/app.js. Todo son declaraciones: la const
   TJ_POLITICAS (con getters que se evalúan al usarse: nombre del negocio, correo y teléfono de la
   empresa activa) y las function shopPoliticas, poliVerEvidencia, poliImprimirEvidencia,
   poliCopiarEvidencia, poliVerRegistroAuditoria, poliExportarCSV, poliCopiar y poliAdmCard, que
   siguen siendo propiedades de window (los botones las llaman con data-h-click="call" → window[nombre]).
   Dependen de código que sigue en app.js (DB, SES, nombreNegocio, shopM, esc...) pero SOLO al
   ejecutarse, nunca al cargar este archivo, así que el orden de carga no cambia nada. */
/* ===== POLÍTICAS DE PRIVACIDAD, USO Y PROTECCIÓN LEGAL (LEY 81 DE PANAMÁ) ===== */
const TJ_POLITICAS = {
 /* Getters: se evalúan al usarse — reflejan la empresa activa (panel) o los
    datos publicados de la tienda (__cfg.empresaNombre / contacto) en la web. */
 get nombre(){return nombreNegocio()},
 get web(){return location.origin+location.pathname+'?tienda=1'+(typeof tdEmpQ==='function'?tdEmpQ():'')},
 get correo(){
  try{if(typeof SHOP!=='undefined'&&SHOP&&typeof SH!=='undefined'&&SH.contacto&&SH.contacto.email)return SH.contacto.email}catch(e){}
  return (typeof DB!=='undefined'&&DB.cfg&&DB.cfg.email)||'tarjeteriajhon@gmail.com';
 },
 get tel(){
  try{if(typeof SHOP!=='undefined'&&SHOP&&typeof SH!=='undefined'&&SH.contacto&&SH.contacto.tel)return SH.contacto.tel}catch(e){}
  return (typeof DB!=='undefined'&&DB.cfg&&DB.cfg.tel)||'6074-1150';
 },
 estado: "Etapa preparatoria. La tienda todavía no recibe pedidos ni pagos comerciales.",
};

function shopPoliticas(tabSel){
 const t = tabSel || "1";
 const tabs = [
   ["1", "⚠️ 1. Aviso Preparatorio"],
   ["2", "📜 2. Términos de Uso"],
   ["3", "🔒 3. Privacidad (Ley 81)"],
   ["4", "🚚 4. Entregas y Retiros"],
   ["5", "💬 5. Reclamaciones"],
   ["6", "✅ 6. Lista de Verificación"]
 ];
 
 let body = "";
 if(t === "1"){
   body = `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;margin-bottom:14px;color:#92400e;font-size:12.5px;line-height:1.5">
     <b style="display:block;font-size:13.5px;margin-bottom:4px">⚠️ Estado: Etapa preparatoria informativa</b>
     Actualmente, <b>${esc(nombreNegocio())}</b> se encuentra preparando su tienda en línea para una posible apertura comercial futura.<br><br>
     <b>Durante esta etapa:</b>
     <ul style="margin:6px 0 6px 18px;padding:0">
       <li>No se reciben pedidos comerciales.</li>
       <li>No se solicitan ni aceptan pagos por medio de la tienda.</li>
       <li>Las publicaciones de productos y sus precios son informativas y pueden modificarse antes de la apertura.</li>
       <li>Los métodos de entrega y pago descritos son opciones previstas, sujetas a confirmación.</li>
       <li>El envío de un mensaje de consulta no equivale a una compra confirmada.</li>
     </ul>
     <b>🛡️ Importante para su seguridad:</b> No envíes dinero ni compartas información bancaria confidencial con motivo de una publicación o prueba de esta tienda. No se solicitarán contraseñas, códigos de verificación, PIN ni claves de banca en línea.
   </div>`;
 } else if(t === "2"){
   body = `<div style="font-size:13px;line-height:1.6;color:var(--txt)">
     <h3 style="margin:0 0 6px;font-size:14.5px">2. Términos y condiciones de uso</h3>
     <p><b>2.1. Objeto:</b> Estos términos establecen las reglas preliminares de acceso y uso del sitio web de ${esc(nombreNegocio())}, destinado a presentar productos de la categoría de accesorios y ofrecer información sobre una futura tienda en línea.</p>
     <p><b>2.2. Uso permitido:</b> El usuario se compromete a utilizar el sitio de forma lícita, respetar los derechos de terceros y no intentar alterar, interrumpir o acceder sin autorización a sus sistemas, cuentas, bases de datos o funciones administrativas. Queda prohibido enviar información falsa, realizar pruebas abusivas o suplantar a otras personas.</p>
     <p><b>2.3. Productos, fotografías y precios:</b> Las fotografías, descripciones, existencias y precios publicados durante la etapa preparatoria son informativos. Pueden existir diferencias de color, presentación o disponibilidad.</p>
     <p><b>2.4. Pedidos y contratación:</b> La tienda no está recibiendo pedidos comerciales durante esta etapa para evitar que una prueba técnica se interprete como una compra real.</p>
     <p><b>2.5. Precios y pagos futuros:</b> Los métodos previstos son transferencia bancaria y Yappy, sujetos a habilitación y verificación antes de la apertura. El usuario no debe transferir dinero actualmente.</p>
     <p><b>2.6. Entregas y retiros futuros:</b> Se prevé ofrecer entrega a domicilio y retiro en un punto acordado. Las zonas disponibles, costos y horarios se publicarán antes de iniciar ventas.</p>
     <p><b>2.7. Cambios, devoluciones y garantías:</b> Las condiciones definitivas se publicarán antes de iniciar ventas, respetando plenamente la legislación de protección al consumidor de la República de Panamá.</p>
   </div>`;
 } else if(t === "3"){
   body = `<div style="font-size:13px;line-height:1.6;color:var(--txt)">
     <h3 style="margin:0 0 6px;font-size:14.5px">3. Política preliminar de privacidad y protección de datos</h3>
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:12px;color:#166534;font-size:12px">
       ✔ <b>Marco Legal:</b> Esta política se rige bajo la legislación panameña aplicable, incluida la <b>Ley 81 de 2019</b> de Protección de Datos Personales y su reglamentación, el <b>Decreto Ejecutivo 285 de 2021</b>.
     </div>
     <p><b>3.1. Finalidad:</b> Esta política explica cómo se prevé tratar la información personal relacionada con el uso de la tienda.</p>
     <p><b>3.2. Qué información podría recopilarse:</b> Nombre y apellidos, teléfono, correo electrónico, dirección para coordinar entrega, datos de consultas y datos técnicos de navegación estrictamente necesarios. <b>Nunca se solicitarán contraseñas bancarias, PIN ni códigos de autenticación.</b></p>
     <p><b>3.3. Finalidades previstas:</b> Responder consultas, coordinar pedidos/entregas futuras, confirmar operaciones legítimas, gestionar incidencias y cumplir con obligaciones legales aplicables.</p>
     <p><b>3.4. Destinatarios:</b> La información personal no se comparte con terceros para fines incompatibles ni se comercializa.</p>
     <p><b>3.5. Seguridad:</b> Se aplican medidas de restricción de acceso, reglas de seguridad en bases de datos y cifrado SSL/HTTPS en tránsito.</p>
     <p><b>3.6. Derechos ARCO:</b> Las personas pueden ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición enviando una solicitud formal a <b><a href="mailto:tarjeteriajhon@gmail.com">tarjeteriajhon@gmail.com</a></b>.</p>
   </div>`;
 } else if(t === "4"){
   body = `<div style="font-size:13px;line-height:1.6;color:var(--txt)">
     <h3 style="margin:0 0 6px;font-size:14.5px">4. Política preliminar de entregas y retiros</h3>
     <p><b>4.1. Modalidades previstas:</b> Entrega a domicilio (sujeta a cobertura) y retiro en punto acordado previamente con el cliente.</p>
     <p><b>4.2. Cobertura y costos:</b> Las tarifas, zonas y horarios definitivos se anunciarán formalmente antes del inicio comercial.</p>
     <p><b>4.3. Datos para entrega:</b> Se solicitarán únicamente los datos estrictamente necesarios (dirección y teléfono) para asegurar la llegada del paquete.</p>
     <p><b>4.4. Incidencias:</b> Se dispondrá de un canal directo para resolver retrasos, entregas fallidas o daños en tránsito.</p>
   </div>`;
 } else if(t === "5"){
   body = `<div style="font-size:13px;line-height:1.6;color:var(--txt)">
     <h3 style="margin:0 0 6px;font-size:14.5px">5. Atención al cliente y reclamaciones</h3>
     <div style="background:var(--sf);border:1px solid var(--linea);border-radius:10px;padding:12px;margin-bottom:12px">
       <b>Canales Oficiales:</b><br>
       ✉️ Correo: <a href="mailto:tarjeteriajhon@gmail.com">tarjeteriajhon@gmail.com</a><br>
       📞 Teléfono: <a href="tel:60741150">6074-1150</a>
     </div>
     <p><b>5.1. Revisión y respuesta:</b> Las consultas y reclamaciones se atienden de forma individual y oportuna.</p>
     <p><b>5.2. Derechos del consumidor:</b> Estas políticas no pretenden excluir ni reducir los derechos que reconoce la legislación panameña (ACODECO).</p>
   </div>`;
 } else if(t === "6"){
   body = `<div style="font-size:13px;line-height:1.6;color:var(--txt)">
     <h3 style="margin:0 0 6px;font-size:14.5px">6. Lista de verificación antes de la apertura comercial</h3>
     <p style="color:var(--gris);font-size:12px">Tareas indispensables antes de activar pedidos y pagos reales:</p>
     <ul style="margin:6px 0 6px 18px;padding:0">
       <li>Completar y verificar la identidad legal del titular, RUC, Aviso de Operación y dirección física aplicable.</li>
       <li>Confirmar la disponibilidad y registro del nombre comercial.</li>
       <li>Definir productos, existencias, precios y condiciones de venta finales.</li>
       <li>Validar transferencias bancarias y Yappy con procedimiento seguro de verificación.</li>
       <li>Definir cobertura, tarifas, horarios y condiciones de entrega y retiro.</li>
       <li>Publicar la política definitiva de cambios, devoluciones y garantías.</li>
       <li>Auditar formularios, bases de datos y permisos de acceso técnico.</li>
       <li>Verificar el procedimiento de atención a solicitudes de privacidad.</li>
     </ul>
   </div>`;
 }
 
 const html = `<div style="max-width:620px;margin-inline:auto">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:10px">
     <div>
       <h2 style="margin:0 0 2px;font-size:18px">🛡️ Políticas y Privacidad</h2>
       <small style="color:var(--gris)">${esc(nombreNegocio())} (Ley 81 de Panamá)</small>
     </div>
   </div>
   <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;border-bottom:1px solid var(--linea)">
     ${tabs.map(([k, l]) => `<button class="btn s ${k === t ? "p" : ""}" style="font-size:11.5px;padding:5px 10px;white-space:nowrap" data-h-click="call" data-a-click="${_ha('shopPoliticas', k)}">${l}</button>`).join("")}
   </div>
   <div style="max-height:55vh;overflow-y:auto;padding-right:6px">
     ${body}
   </div>
   <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--linea);flex-wrap:wrap;gap:8px">
     <button class="btn s" data-h-click="call" data-a-click="${_ha('poliCopiar')}" style="font-size:12px">📋 Copiar documento</button>
     <button class="btn p" data-h-click="h31">Cerrar</button>
   </div>
 </div>`;
 
 if(document.getElementById("shopm"))shopM(html, "politicas"); else if(document.getElementById("md")){ document.getElementById("mb").innerHTML=html; document.getElementById("md").classList.add("on"); }
}


function poliVerEvidencia(id){
 const p=(typeof TD!=='undefined'&&TD.peds?TD.peds:[]).find(x=>x.id===id);
 if(!p)return alert('Pedido no encontrado');
 const l=p.lead||{};
 const t=l.terminos||{};
 const hasOk=t.ok||(p.nota&&p.nota.includes('Aceptó Términos'));
 const fechaAcep=t.fmt||(t.fecha?new Date(t.fecha).toLocaleString('es-PA'):new Date(p.ts).toLocaleString('es-PA'));
 const fechaIso=t.fecha||new Date(p.ts).toISOString();
 const ua=t.ua||(navigator.userAgent||'No registrado');
 const ver=t.ver||'1.0 - Etapa Preparatoria (Ley 81 de 2019 de Panamá)';
 
 const html=`<div style="max-width:580px;margin-inline:auto;text-align:left">
   <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;border-bottom:1px solid var(--linea);padding-bottom:10px">
     <div style="font-size:32px">🛡️</div>
     <div style="flex:1">
       <h3 style="margin:0;font-size:17px">Evidencia de Consentimiento y Términos</h3>
       <small style="color:var(--gris)">Auditoría legal según Ley 81 de 2019 (Protección de Datos - Panamá)</small>
     </div>
     <span style="padding:4px 9px;border-radius:12px;background:#dcfce7;color:#15803d;font-weight:700;font-size:12px">✔ Aceptado</span>
   </div>
   
   <div style="background:var(--sf);border:1px solid var(--linea);border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:12.5px;line-height:1.5">
     <div style="display:grid;grid-template-columns:140px 1fr;gap:6px 10px;margin-bottom:6px">
       <b style="color:var(--gris)">Cliente:</b> <span><b>${esc(l.name||'Sin nombre')}</b></span>
       <b style="color:var(--gris)">Teléfono / WhatsApp:</b> <span>${esc(l.tel||'—')}</span>
       <b style="color:var(--gris)">Correo electrónico:</b> <span>${esc(l.email||'—')}</span>
       ${l.empresa?`<b style="color:var(--gris)">Empresa:</b> <span>${esc(l.empresa)}</span>`:''}
       ${l.dir?`<b style="color:var(--gris)">Dirección:</b> <span>${esc(l.dir)}</span>`:''}
       <b style="color:var(--gris)">ID Pedido / Transacción:</b> <span style="font-family:monospace;font-size:11px">${esc(p.id)}</span>
       <b style="color:var(--gris)">Fecha de aceptación:</b> <span><b>${esc(fechaAcep)}</b></span>
       <b style="color:var(--gris)">Marca de tiempo UTC:</b> <span style="font-family:monospace;font-size:11px">${esc(fechaIso)}</span>
       <b style="color:var(--gris)">Versión de políticas:</b> <span>${esc(ver)}</span>
     </div>
     <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--linea)">
       <b style="color:var(--gris);display:block;margin-bottom:2px">Dispositivo / Agente técnico:</b>
       <div style="font-family:monospace;font-size:10.5px;color:var(--txt);word-break:break-all;background:rgba(0,0,0,0.03);padding:6px 8px;border-radius:6px">${esc(ua)}</div>
     </div>
     ${p.nota?`<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--linea)"><b style="color:var(--gris);display:block;margin-bottom:2px">Constancia en nota:</b><span style="font-size:11.5px;color:var(--txt)">${esc(p.nota)}</span></div>`:''}
   </div>
   
   <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 12px;margin-bottom:14px;color:#166534;font-size:11.5px;line-height:1.45">
     <b>⚖️ Declaración de Consentimiento Expreso:</b><br>
     El cliente marcó formalmente la casilla de verificación obligatoria en la tienda web antes de enviar su pedido, declarando haber leído y aceptado los Términos de Uso y la Política de Privacidad de <b>${esc(nombreNegocio())}</b>, reconociendo la etapa preparatoria informativa conforme a la <b>Ley 81 de 2019</b>.
   </div>
   
   <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
     <div style="display:flex;gap:6px;flex-wrap:wrap">
       <button class="btn s" data-h-click="call" data-a-click="${_ha('poliImprimirEvidencia',p.id)}">🖨️ Imprimir constancia</button>
       <button class="btn s" data-h-click="call" data-a-click="${_ha('poliCopiarEvidencia',p.id)}">📋 Copiar datos</button>
     </div>
     <button class="btn p" data-h-click="${document.getElementById('shopm')?'h31':'hs4'}">Cerrar</button>
   </div>
 </div>`;
 
 if(document.getElementById('shopm'))shopM(html, "evidencia");
 else if(document.getElementById('md')){ document.getElementById('mb').innerHTML=html; document.getElementById('md').classList.add('on'); }
}

function poliImprimirEvidencia(id){
 const p=(typeof TD!=='undefined'&&TD.peds?TD.peds:[]).find(x=>x.id===id);if(!p)return;
 const l=p.lead||{},t=l.terminos||{};
 const fechaAcep=t.fmt||(t.fecha?new Date(t.fecha).toLocaleString('es-PA'):new Date(p.ts).toLocaleString('es-PA'));
 const w=window.open('','_blank');if(!w)return alert('Permita ventanas emergentes para imprimir.');
 w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Constancia Legal - ${esc(l.name||'Cliente')}</title><style>body{font-family:system-ui,sans-serif;padding:32px;color:#1e293b;max-width:700px;margin:auto;font-size:14px;line-height:1.6}h1{font-size:20px;margin-bottom:4px;color:#0f172a}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{padding:8px 12px;border:1px solid #cbd5e1;text-align:left}.box{background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:8px;margin:16px 0}@media print{button{display:none}}</style></head><body><h1>🛡️ CONSTANCIA DE CONSENTIMIENTO Y AUDITORÍA LEGAL</h1><p style="color:#64748b;margin:0 0 16px">${esc(nombreNegocio())} · Marco legal: Ley 81 de 2019 de la República de Panamá</p><div class="box"><b>Estado:</b> Consentimiento libre, previo, expreso e informado registrado en sistema.</div><table><tr><th>Identificador del Pedido</th><td>${esc(p.id)}</td></tr><tr><th>Nombre del Cliente</th><td>${esc(l.name||'—')}</td></tr><tr><th>Teléfono</th><td>${esc(l.tel||'—')}</td></tr><tr><th>Correo electrónico</th><td>${esc(l.email||'—')}</td></tr><tr><th>Empresa</th><td>${esc(l.empresa||'—')}</td></tr><tr><th>Dirección</th><td>${esc(l.dir||'—')}</td></tr><tr><th>Fecha y Hora de Aceptación</th><td><b>${esc(fechaAcep)}</b></td></tr><tr><th>Versión de Políticas</th><td>${esc(t.ver||'1.0 - Etapa preparatoria (Ley 81 Panamá)')}</td></tr><tr><th>Firma Técnica / Dispositivo</th><td style="font-family:monospace;font-size:11px">${esc(t.ua||'—')}</td></tr><tr><th>Registro en pedido</th><td>${esc(p.nota||'—')}</td></tr></table><div class="box" style="background:#f0fdf4;border-color:#bbf7d0;color:#166534"><b>Certificación:</b> El cliente aceptó formalmente mediante casilla de verificación los Términos de Uso y la Política de Privacidad vigentes al momento de la orden.</div><br><button type="button" id="btnImprimir" style="padding:8px 16px;cursor:pointer">🖨️ Imprimir</button></body></html>`);
 w.document.close();
 /* La ventana nueva hereda la CSP de la página, que bloquea onclick= en línea (el botón no hacía nada).
    Se enlaza con addEventListener, que la CSP no restringe. El <style> sí está permitido (hash en la CSP). */
 const bi=w.document.getElementById('btnImprimir');if(bi)bi.addEventListener('click',()=>{try{w.focus();w.print()}catch(e){window._tjw&&_tjw(e)}});
}

function poliCopiarEvidencia(id){
 const p=(typeof TD!=='undefined'&&TD.peds?TD.peds:[]).find(x=>x.id===id);if(!p)return;
 const l=p.lead||{},t=l.terminos||{};
 const fechaAcep=t.fmt||(t.fecha?new Date(t.fecha).toLocaleString('es-PA'):new Date(p.ts).toLocaleString('es-PA'));
 const str=`EVIDENCIA DE ACEPTACIÓN DE TÉRMINOS Y PRIVACIDAD (LEY 81 PANAMÁ)\nCliente: ${l.name||''}\nTeléfono: ${l.tel||''}\nCorreo: ${l.email||''}\nPedido ID: ${p.id}\nFecha y hora: ${fechaAcep}\nVersión: ${t.ver||'1.0'}\nAgente técnico: ${t.ua||''}\nNota: ${p.nota||''}`;
 try{navigator.clipboard.writeText(str);alert('Copiado al portapapeles ✔')}catch(e){prompt('Copie la evidencia:',str)}
}

function poliVerRegistroAuditoria(){
 const peds=(typeof TD!=='undefined'&&TD.peds?TD.peds:[]);
 const conEvidencia=peds.filter(p=>(p.lead&&p.lead.terminos&&p.lead.terminos.ok)||(p.nota&&p.nota.includes('Aceptó Términos')));
 
 const rows=conEvidencia.map(p=>{
   const l=p.lead||{},t=l.terminos||{};
   const fechaAcep=t.fmt||(t.fecha?new Date(t.fecha).toLocaleString('es-PA'):new Date(p.ts).toLocaleString('es-PA'));
   return `<tr style="border-bottom:1px solid var(--linea)">
     <td style="padding:8px"><b>${esc(l.name||'Cliente')}</b><br><small style="color:var(--gris)">${esc(l.tel||'')}${l.email?' · '+esc(l.email):''}</small></td>
     <td style="padding:8px;font-size:12px;white-space:nowrap">${esc(fechaAcep)}</td>
     <td style="padding:8px;font-size:11px;color:var(--gris)">${esc(t.ver||'1.0 Ley 81')}</td>
     <td style="padding:8px;text-align:right">
       <button class="btn s p" data-h-click="call" data-a-click="${_ha('poliVerEvidencia',p.id)}" style="font-size:11px;padding:3px 8px">👁️ Ver evidencia</button>
     </td>
   </tr>`;
 }).join('');
 
 const html=`<div style="max-width:680px;margin-inline:auto;text-align:left">
   <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid var(--linea);padding-bottom:10px;flex-wrap:wrap;gap:8px">
     <div>
       <h3 style="margin:0;font-size:17px">📋 Registro General de Aceptaciones (Ley 81)</h3>
       <small style="color:var(--gris)">Total: <b>${conEvidencia.length}</b> aceptaciones registradas con evidencia legal</small>
     </div>
     <button class="btn s" data-h-click="call" data-a-click="${_ha('poliExportarCSV')}" style="font-size:11.5px">📥 Exportar CSV</button>
   </div>
   
   <div style="max-height:55vh;overflow-y:auto">
     <table style="width:100%;border-collapse:collapse;font-size:12.5px">
       <thead>
         <tr style="border-bottom:2px solid var(--linea);color:var(--gris);font-size:11.5px">
           <th style="padding:6px 8px;text-align:left">Cliente</th>
           <th style="padding:6px 8px;text-align:left">Fecha de aceptación</th>
           <th style="padding:6px 8px;text-align:left">Versión</th>
           <th style="padding:6px 8px;text-align:right">Acción</th>
         </tr>
       </thead>
       <tbody>
         ${rows || '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--gris)">No hay pedidos registrados con consentimiento aún.</td></tr>'}
       </tbody>
     </table>
   </div>
   
   <div style="display:flex;justify-content:flex-end;margin-top:14px;padding-top:10px;border-top:1px solid var(--linea)">
     <button class="btn p" data-h-click="${document.getElementById('shopm')?'h31':'hs4'}">Cerrar</button>
   </div>
 </div>`;
 
 if(document.getElementById('shopm'))shopM(html, "auditoria");
 else if(document.getElementById('md')){ document.getElementById('mb').innerHTML=html; document.getElementById('md').classList.add('on'); }
}

function poliExportarCSV(){
 const peds=(typeof TD!=='undefined'&&TD.peds?TD.peds:[]);
 const conEvidencia=peds.filter(p=>(p.lead&&p.lead.terminos&&p.lead.terminos.ok)||(p.nota&&p.nota.includes('Aceptó Términos')));
 if(!conEvidencia.length)return alert('No hay registros de evidencias para exportar.');
 let csv='ID Pedido,Cliente,Telefono,Correo,Empresa,Direccion,Fecha Aceptacion,Version Ley,Dispositivo (User Agent),Nota\n';
 conEvidencia.forEach(p=>{
   const l=p.lead||{},t=l.terminos||{};
   const fechaAcep=t.fmt||(t.fecha?new Date(t.fecha).toLocaleString('es-PA'):new Date(p.ts).toLocaleString('es-PA'));
   const clean=s=>'"'+String(s||'').replace(/"/g,'""')+'"';
   csv+=[clean(p.id),clean(l.name),clean(l.tel),clean(l.email),clean(l.empresa),clean(l.dir),clean(fechaAcep),clean(t.ver||'1.0 Ley 81'),clean(t.ua),clean(p.nota)].join(',')+'\n';
 });
 const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='evidencias_terminos_ley81_'+hoy()+'.csv';a.click();URL.revokeObjectURL(url);
}

function poliCopiar(){
 const NN=nombreNegocio(),CORREO=(DB.cfg&&DB.cfg.email)||'tarjeteriajhon@gmail.com',TEL=(DB.cfg&&DB.cfg.tel)||'6074-1150',SITIO=location.origin+location.pathname+'?tienda=1'+(typeof tdEmpQ==='function'?tdEmpQ():'');
 const txt = `${NN}\nPolíticas preliminares de uso, privacidad y protección del cliente\nEstado: etapa preparatoria. La tienda todavía no recibe pedidos ni pagos.\nNombre comercial: ${NN}\nSitio web: ${SITIO}\nCorreo de contacto: ${CORREO}\nTeléfono: ${TEL}\n\n1. Aviso de etapa preparatoria\nNo se reciben pedidos comerciales ni pagos por la tienda. No envíes dinero ni compartas claves.\n\n2. Términos y condiciones de uso\nUso lícito, productos y precios informativos.\n\n3. Política preliminar de privacidad y protección de datos\nProtección conforme a la Ley 81 de 2019 de la República de Panamá y Decreto Ejecutivo 285 de 2021.\n\n4. Entregas y retiros\nModalidades a domicilio y retiro en punto acordado.\n\n5. Atención al cliente y reclamaciones\n${CORREO} · ${TEL}\n\n6. Lista de verificación antes de la apertura\nRUC, Aviso de Operación y formalización comercial.`;
 navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>alert("Copiado al portapapeles.")).catch(()=>alert(txt));
}

function poliAdmCard(){
 return `<h3 style="margin:0">🛡️ Políticas de uso, privacidad y protección legal</h3>
 <p style="font-size:12.5px;color:var(--gris);margin-top:2px">Políticas preliminares y marco de protección del cliente y administración bajo la <b>Ley 81 de 2019</b> (Protección de Datos de Panamá).</p>
 <div style="background:var(--sf);border:1px solid var(--linea);border-radius:12px;padding:14px;margin-bottom:14px">
   <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
     <div>
       <b style="font-size:14px">${esc(nombreNegocio())}</b><br>
       <small style="color:var(--gris)">Estado: Etapa preparatoria informativa activa</small>
     </div>
     <span style="padding:4px 10px;border-radius:12px;background:#fef3c7;color:#b45309;font-weight:700;font-size:11.5px">⚠️ Etapa Preparatoria</span>
   </div>
   <div style="font-size:12.5px;color:var(--txt);line-height:1.5;margin-bottom:12px">
     Estas políticas protegen tanto a los clientes como al negocio al declarar formalmente que la tienda web está en fase informativa preliminar, evitando fraudes, suplantaciones o pedidos no autorizados mientras se completa el registro oficial (RUC y Aviso de Operación).
   </div>
   <div style="display:flex;gap:8px;flex-wrap:wrap">
     <button class="btn p" data-h-click="call" data-a-click="${_ha('shopPoliticas')}">👁️ Ver políticas completas</button>
     <button class="btn s" data-h-click="call" data-a-click="${_ha('poliCopiar')}">📋 Copiar texto legal</button>
   </div>
 </div>
 <div style="background:var(--sf);border:1px solid var(--linea);border-radius:12px;padding:14px;margin-bottom:14px">
   <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
     <div>
       <b style="font-size:13.5px">🛡️ Registro y Evidencias de Aceptación (Auditoría Ley 81)</b><br>
       <small style="color:var(--gris)">Cada pedido registra la marca de tiempo, versión legal aceptada y firma técnica del cliente.</small>
     </div>
     <span style="padding:3px 10px;border-radius:12px;background:#dcfce7;color:#15803d;font-weight:700;font-size:12px">✔ ${(typeof TD!=='undefined'&&TD.peds?TD.peds:[]).filter(p=>(p.lead&&p.lead.terminos&&p.lead.terminos.ok)||(p.nota&&p.nota.includes('Aceptó Términos'))).length} evidencias registradas</span>
   </div>
   <p style="font-size:12px;color:var(--gris);margin:0 0 10px">El cliente debe marcar obligatoriamente la casilla antes de enviar el pedido. La administración conserva constancia digital inalterable de cada consentimiento.</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap">
     <button class="btn s p" data-h-click="call" data-a-click="${_ha('poliVerRegistroAuditoria')}">📋 Ver tabla general de evidencias</button>
     <button class="btn s" data-h-click="call" data-a-click="${_ha('poliExportarCSV')}">📥 Exportar reporte CSV</button>
   </div>
 </div>
 <div style="border:1px solid var(--linea);border-radius:10px;padding:12px;font-size:12px">
   <b>✅ Lista de verificación previa a la apertura comercial:</b>
   <ul style="margin:6px 0 0 16px;padding:0;color:var(--gris)">
     <li>Completar y verificar identidad del titular, RUC y Aviso de Operación.</li>
     <li>Confirmar cuentas oficiales de Yappy y Banco.</li>
     <li>Auditar formularios y reglas de privacidad (Ley 81).</li>
   </ul>
 </div>`;
}
