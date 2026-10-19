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

  function fechaValida(fecha){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha||''))return false;
    const [anio,mes,dia]=fecha.split('-').map(Number),d=new Date(Date.UTC(anio,mes-1,dia));
    return d.getUTCFullYear()===anio&&d.getUTCMonth()===mes-1&&d.getUTCDate()===dia;
  }

  function sumarPlazo(fecha, cantidad, unidad){
    if(!fechaValida(fecha))return null;
    const n=Math.floor(numero(cantidad,0));
    if(n<0)return null;
    const [anio,mes,dia]=fecha.split('-').map(Number);
    const d=new Date(Date.UTC(anio,mes-1,dia));
    if(unidad==='meses'){
      const destino=mes-1+n;
      const y=anio+Math.floor(destino/12),m=((destino%12)+12)%12;
      const ultimo=new Date(Date.UTC(y,m+1,0)).getUTCDate();
      d.setUTCFullYear(y,m,Math.min(dia,ultimo));
    }else d.setUTCDate(d.getUTCDate()+n*(unidad==='semanas'?7:1));
    return d.toISOString().slice(0,10);
  }

  function prepararPago({pago,total,pagosMixtos=[],fecha,plazo=0,unidad='dias'}={}){
    const importe=redondear(Math.max(0,numero(total,0)));
    let pagos,creditoMonto=0;
    if(pago==='Pago mixto'){
      pagos=(Array.isArray(pagosMixtos)?pagosMixtos:[]).map(p=>({m:String(p&&p.m||''),v:redondear(Math.max(0,numero(p&&p.v,0)))})).filter(p=>p.m&&p.v>0);
      const suma=redondear(pagos.reduce((s,p)=>s+p.v,0));
      if(pagos.length<2)return {ok:false,error:'El pago mixto necesita al menos 2 métodos con monto.'};
      if(Math.abs(suma-importe)>0.01)return {ok:false,error:'La suma de los pagos debe ser igual al total.'};
      creditoMonto=redondear(pagos.filter(p=>p.m==='Crédito').reduce((s,p)=>s+p.v,0));
    }else{
      pagos=[{m:String(pago||'Efectivo'),v:importe}];
      if(pago==='Crédito')creditoMonto=importe;
    }
    let credito=null;
    if(creditoMonto>0){
      const n=Math.floor(numero(plazo,0)),vence= n>=1 ? sumarPlazo(fecha,n,unidad) : null;
      if(!vence)return {ok:false,error:'Indique una fecha y un plazo de crédito válidos.'};
      credito={n,u:unidad,monto:creditoMonto,vence};
    }
    return {ok:true,pago:pago==='Pago mixto'?'Mixto ('+[...new Set(pagos.map(p=>p.m))].join(' + ')+')':String(pago||'Efectivo'),pagos,credito};
  }

  const api={calcularTotales,redondear,sumarPlazo,prepararPago};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TJFacturacion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
