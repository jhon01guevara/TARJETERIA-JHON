/* Cálculos puros de facturación. No accede al DOM: se puede probar automáticamente. */
(function(root){
  'use strict';

  function numero(valor, predeterminado){
    const n=Number(valor);
    return Number.isFinite(n) ? n : predeterminado;
  }

  function redondear(valor){
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  function calcularTotales(lineas, descuento, itbmsPorcentaje, aplicaItbms){
    const sub=redondear((Array.isArray(lineas)?lineas:[]).reduce((s,linea)=>{
      const cantidad=Math.max(0,numero(linea&&linea.q,1));
      const precio=Math.max(0,numero(linea&&linea.p,0));
      return s+cantidad*precio;
    },0));
    const ds=redondear(Math.min(Math.max(0,numero(descuento,0)),sub));
    const base=redondear(sub-ds);
    const porcentaje=Math.max(0,numero(itbmsPorcentaje,0));
    const it=aplicaItbms ? redondear(base*porcentaje/100) : 0;
    return {sub,ds,it,tot:redondear(base+it)};
  }

  const api={calcularTotales,redondear};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TJFacturacion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
