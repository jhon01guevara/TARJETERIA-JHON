/* ===== Contexto de empresa activa (Fase 4 del plan multiempresa) =====
   Resuelve qué empresa está usando el panel y da las llaves/rutas particionadas
   por empresa que usará la migración (Fases 6-7). Es autónomo: no depende de
   app.js ni de Firebase, y se carga antes que app.js.

   IMPORTANTE: mientras MULTIEMP sea false, el flujo de datos del panel NO cambia;
   el contexto solo registra la empresa activa (por defecto Tarjetería Jhon) y
   expone helpers para el futuro. Así lo exige el plan: sin migración productiva
   hasta aprobar la simulación y las pruebas. */
'use strict';
var MULTIEMP=false;

/* Empresa inicial: id estable, no depende del nombre comercial (criterio del plan).
   Sus claves locales actuales (tj_db, etc.) se conservan tal cual para no romper
   el panel hoy; las demás empresas usarán el sufijo _{slug} cuando existan. */
var EMPRESA_DEF={id:'tarjeteria-jhon',nombre:'Tarjetería Jhon'};
var EMP_LS='tj_emp';

/* Sanea la entrada: null/undefined no deben convertirse en el texto "null"
   (coincidiría con la regex y la empresa activa quedaría en null). */
function empSlugOk(s){s=String(s==null?'':s);return /^[a-z0-9][a-z0-9-]{2,39}$/.test(s)&&!/--/.test(s)}

/* Empresa indicada en la URL (?emp=slug). Tiene prioridad porque permite abrir
   directamente el contexto correcto al entrar desde un enlace o subdominio. */
function empParam(){
 try{
  if(typeof location==='undefined')return '';
  var s=(new URL(location.href).searchParams.get('emp')||'').trim();
  return empSlugOk(s)?s:''
 }catch(e){return ''}
}

/* Empresa activa: URL → última elegida (localStorage) → empresa inicial. */
function empActiva(){
 var p=empParam();if(p)return p;
 try{
  if(typeof localStorage!=='undefined'){var s=localStorage.getItem(EMP_LS);if(empSlugOk(s))return s}
 }catch(e){}
 return EMPRESA_DEF.id;
}
function empEsInicial(){return empActiva()===EMPRESA_DEF.id}
function empSet(slug){
 if(!empSlugOk(slug))return false;
 try{if(typeof localStorage!=='undefined')localStorage.setItem(EMP_LS,slug)}catch(e){}
 return true;
}

/* Partición de claves locales por empresa (Fase 7): la empresa inicial conserva
   las claves actuales (retro-compatible con los datos ya guardados); cualquier
   otra empresa recibe claves con sufijo. */
function empLSKey(k){return empEsInicial()?k:k+'_'+empActiva()}

/* Rutas Firestore destino del esquema multiempresa (ver docs/ESQUEMA-MULTIEMPRESA.md).
   En esta fase nadie las usa para leer/escribir; existen para que la migración
   simulada y los tests validen el mapeo. */
function empPath(){return 'empresas/'+empActiva()}
function empPathDe(slug){return 'empresas/'+(empSlugOk(slug)?slug:EMPRESA_DEF.id)}

/* Colecciones de NEGOCIO: se particionan por empresa cuando MULTIEMP=true.
   Identidad (roles/perfiles/presencia) y metadatos (empresas/dominios) quedan
   globales por diseño (docs/ESQUEMA-MULTIEMPRESA.md §1). */
var EMP_NEGOCIO={panel:1,panel_public:1,vendedores:1,catalogo:1,tienda_items:1,tienda_leads:1,
 tienda_pedidos:1,galeria:1,chats:1,llamadas:1,wa_conversaciones:1,investigacion_items:1};

/* Ruta de una colección para el panel (Fase 7): con MULTIEMP=false devuelve el
   nombre tal cual — el panel sigue usando exactamente las rutas actuales; con
   MULTIEMP=true las colecciones de negocio bajan a empresas/{eid}/... (lee la
   bandera en cada llamada para que activarla sea un cambio de una línea). */
function empColPath(n){
 n=String(n==null?'':n);
 if(!MULTIEMP||!EMP_NEGOCIO[n])return n;
 return 'empresas/'+empActiva()+'/'+n;
}

var TJEmpresa={MULTIEMP:MULTIEMP,EMPRESA_DEF:EMPRESA_DEF,empActiva:empActiva,empSet:empSet,
 empSlugOk:empSlugOk,empEsInicial:empEsInicial,empLSKey:empLSKey,empPath:empPath,empPathDe:empPathDe,
 EMP_NEGOCIO:EMP_NEGOCIO,empColPath:empColPath};
if(typeof window!=='undefined')window.TJEmpresa=TJEmpresa;
/* Export para tests de Node (mismo patrón que js/facturacion.js). */
if(typeof module!=='undefined'&&module.exports)module.exports=TJEmpresa;
