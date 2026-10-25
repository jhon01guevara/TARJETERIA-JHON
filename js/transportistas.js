/* Fase 19 (extracción 6a): directorio de transportistas de carga — datos (FLE_DEF) y utilidades puras de saneo, búsqueda y logo.
   Movido TAL CUAL desde js/app.js (las marcas de inicio y fin del bloque viajan con él; los tests las buscan). Script clásico cargado ANTES de js/app.js; al cargarse solo
   declara const/function sin tocar DB, SES ni el DOM (fleMono usa canvas al EJECUTARSE). La parte de interfaz se queda en app.js porque usa DB y el DOM. */
/*FLE-INI*/
/* ===== Directorio de transportistas de carga =====
   Lista predeterminada (tomada del directorio de fletes de Panamá). Los datos vienen de directorios públicos:
   confirmar con la empresa antes de enviar mercancía. El administrador elige en Configuración cuáles se ofrecen
   en la tienda; el cliente escoge uno al pedir y sus datos salen en la etiqueta de envío. */
const fleT=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n);
const FLE_DEF=[
 {id:'chavales',n:'Fletes Chavales (FLECHA)',t:'n',ini:'FC',col:'#c2410c',d:'Transporte de mercancía y fletes por carretera',tel:[],wa:'',web:'chavale.com',nota:'No se verificó un número vigente. Hay referencias a David y otras localidades; algunos registros muestran cambio de razón social en 2025. Pida lista de agencias, destinos, horarios y tarifas.'},
 {id:'ferguson',n:'Transportes Ferguson',t:'n',ini:'TF',col:'#1d4ed8',d:'Carga liviana, encomiendas y distribución nacional',tel:['225-1291','261-1482'],wa:'6330-3495',ig:'@transporte.ferguson',
  suc:[['Pueblo Nuevo / Vía Fernández de Córdoba','225-1291 / 261-1482'],['Calle 50, Bella Vista','270-1616'],['Río Abajo / Juan Díaz','233-4597'],['Calidonia / Justo Arosemena','225-1291'],['La Chorrera','253-6591'],['Vista Alegre, Arraiján','344-4847'],['Colón','446-2287 / 6330-6035'],['24 de Diciembre','380-7536']],
  nota:'Datos de directorios públicos: confirme dirección, horario y vigencia antes de visitar.'},
 {id:'uno',n:'Uno Express Panamá',t:'n',ini:'UE',col:'#be123c',d:'Encomiendas de sucursal a sucursal en todo el país',tel:['6781-4532','6675-4152','6781-3007','6676-3445'],wa:'6676-3445',web:'unoexpresspanama.com',ig:'@unoexpresspanama',
  suc:[['24 de Diciembre','6982-4866'],['Aguadulce','6980-6580'],['Albrook','6949-1460'],['Almirante','6781-4520'],['Boquete','6781-4619'],['Vía Brasil','6781-4532'],['San Francisco','6675-4152'],['Vista Hermosa','6781-9588'],['Río Abajo','6670-6874'],['Juan Díaz','6781-4476'],['Los Andes','6983-1202'],['Puerto Armuelles','6781-4623'],['Frontera','6781-4630'],['Changuinola','6781-4622'],['Santiago','6781-4604'],['Las Tablas','6781-4642'],['Gorgona','6781-4280'],['El Valle de Antón','6948-1051'],['Pedasí','6781-4615']],
  nota:'Se menciona una red de unas 45 sucursales; revise el directorio oficial para direcciones y horarios.'},
 {id:'cargasnac',n:'Cargas Nacionales',t:'n',ini:'CN',col:'#15803d',d:'Encomiendas y distribución de mercancía',tel:['393-3660','6028-8753'],wa:'6042-0478',nota:'Cobertura reportada: Ciudad de Panamá, Chiriquí, Santiago y Arraiján. Confirme rutas y oficinas actuales.'},
 {id:'ancon',n:'Ancón Express',t:'n',ini:'AE',col:'#7c3aed',d:'Courier, casillero y transporte aéreo y marítimo desde Miami',tel:['386-1545'],wa:'6617-6911',web:'anconexpress.com',dir:'Premier Plaza, Brisas del Golf, sótano, local 9A',hor:'Lunes a sábado, 9:00 a. m. a 6:00 p. m.'},
 {id:'graygorilla',n:'Gray Gorilla',t:'n',ini:'GG',col:'#475569',d:'Fletes, mudanzas y transporte con camiones',tel:['6280-0099'],wa:'',nota:'WhatsApp por confirmar. Carga voluminosa y traslados al interior; no se verificó red nacional de sucursales.'},
 {id:'dhlexpress',n:'DHL Express Panamá',t:'i',ini:'DHL',col:'#d4a017',d:'Documentos, paquetes urgentes y envíos internacionales',tel:['271-3400'],wa:'',ig:'@dhl_global',dir:'Edificio DHL, avenida Centenario, Costa del Este',nota:'Seguimiento disponible desde su página oficial.'},
 {id:'dhlgf',n:'DHL Global Forwarding',t:'i',ini:'DGF',col:'#b45309',d:'Carga aérea y marítima, importaciones, exportaciones y logística comercial',tel:['290-8901'],wa:'',dir:'Edificio DHL Global Forwarding, Parque Industrial y Corporativo Sur, vía Tocumen',nota:'Para mercancía pesada o contenedores, cotizar aquí.'},
 {id:'fedex',n:'FedEx Panamá',t:'i',ini:'FX',col:'#5b21b6',d:'Paquetería y carga internacional',tel:['+507 271-3838'],wa:'',nota:'Confirmar vigencia del teléfono. Oficinas reportadas en Ciudad de Panamá, David y Colón; consulte dirección y horario en su buscador oficial.'},
 {id:'ups',n:'UPS Panamá',t:'i',ini:'UPS',col:'#78350f',d:'Paquetería internacional, envíos empresariales y mensajería',tel:['+507 6936-6402'],wa:'',dir:'OPI, calle 2.ª, Llano Bonito, frente al Tabernáculo de la Fe, galera de Industrias Fernández, Juan Díaz',nota:'Confirmar vigencia del teléfono.'},
 {id:'dsv',n:'DSV Panamá',t:'i',ini:'DSV',col:'#0f172a',d:'Carga aérea, marítima y terrestre, aduanas y logística empresarial',tel:['+507 280-1111'],wa:'',dir:'Ciudad de Panamá; centro de distribución en Cocosolito, Colón',nota:'Confirmar vigencia del teléfono.'},
 {id:'kn',n:'Kuehne+Nagel Panamá',t:'i',ini:'KN',col:'#0369a1',d:'Carga marítima, aérea, terrestre y logística contractual',tel:[],wa:'',mail:'info.panamacity@kuehne-nagel.com',dir:'Dream Plaza, piso 11, avenida Centenario, Costa del Este',nota:'Otra referencia en Colón por confirmar. Cotizar por formulario oficial o correo.'},
 {id:'copacargo',n:'Copa Airlines Cargo',t:'i',ini:'CC',col:'#0e7490',d:'Transporte aéreo de mercancías entre destinos de su red',tel:['+507 217-2672'],wa:'',nota:'Es el centro de atención de Copa Airlines: pida transferencia al departamento de carga.'}
];
const FLE_WEB=/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/[^\s"'<>]*)?$/i;
function fleSanExtra(x){
 if(!x||typeof x!=='object')return null;const id=String(x.id||''),n=fleT(x.n,80);
 if(!/^x[a-z0-9]{3,16}$/.test(id)||!n)return null;
 let web=fleT(x.web,100).replace(/^https?:\/\//i,'').replace(/\/$/,'');if(!FLE_WEB.test(web))web='';
 const tel=(Array.isArray(x.tel)?x.tel:[x.tel]).map(v=>fleT(v,30)).filter(Boolean).slice(0,4);
 return{id,n,t:x.t==='i'?'i':'n',ini:'',col:'#5b6573',d:fleT(x.d,160),tel,wa:fleT(x.wa,30),web,dir:fleT(x.dir,200),hor:fleT(x.hor,100),nota:fleT(x.nota,300),extra:1}
}
/* Limpia lo que viene de la nube: solo ids conocidos, fotos pequeñas en base64 y empresas propias bien formadas. */
function fleSanCfg(r){
 r=r&&typeof r==='object'?r:{};
 const extra=(Array.isArray(r.extra)?r.extra:[]).slice(0,30).map(fleSanExtra).filter(Boolean),ids=new Set(FLE_DEF.map(x=>x.id).concat(extra.map(x=>x.id)));
 const on=(Array.isArray(r.on)?r.on:[]).filter((i,k,a)=>ids.has(i)&&a.indexOf(i)===k),img={};
 if(r.img&&typeof r.img==='object')Object.keys(r.img).forEach(k=>{const v=r.img[k];if(ids.has(k)&&typeof v==='string'&&v.length<40000&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(v))img[k]=v});
 return{on,extra,img}
}
const fleAll=C=>FLE_DEF.concat((C&&C.extra)||[]);
const fleNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function fleBuscar(nombre,C){
 const q=fleNorm(nombre);if(!q)return null;const L=fleAll(C);
 return L.find(c=>fleNorm(c.n)===q)||(q.length>=3?L.find(c=>fleNorm(c.n).startsWith(q)):null)||null
}
const fleTelTxt=c=>(c.tel||[]).join(' · ');
const fleWaNum=w=>{const d=String(w||'').replace(/\D/g,'');return d.length===8?'507'+d:d};
const _fleMono={};
function fleMono(ini,col){
 const k=ini+'|'+col;if(_fleMono[k]!==undefined)return _fleMono[k];
 try{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  g.fillStyle=col;g.fillRect(0,0,128,128);g.fillStyle='rgba(255,255,255,.14)';g.beginPath();g.arc(112,16,64,0,7);g.fill();
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='700 '+(ini.length>2?42:56)+'px Arial,Helvetica,sans-serif';g.fillText(ini,64,68);
  return _fleMono[k]=c.toDataURL('image/png')}catch(e){return _fleMono[k]=''}
}
const fleIni=c=>c.ini||fleT(c.n,60).split(/\s+/).filter(w=>/[A-Za-zÁÉÍÓÚÑ]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
const fleLogo=(c,C)=>(C&&C.img&&C.img[c.id])||fleMono(fleIni(c),c.col||'#5b6573');
/*FLE-FIN*/
