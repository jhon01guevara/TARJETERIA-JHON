const test=require('node:test');
const assert=require('node:assert/strict');
const {calcularTotales,sumarPlazo,prepararPago}=require('../js/facturacion.js');

test('calcula subtotal, descuento e ITBMS',()=>{
  assert.deepEqual(calcularTotales([{q:2,p:1.25},{q:3,p:2}],1.50,7,true),{
    sub:8.50,ds:1.50,it:0.49,tot:7.49
  });
});

test('no cobra ITBMS cuando está desmarcado',()=>{
  assert.deepEqual(calcularTotales([{q:2,p:5}],0,7,false),{
    sub:10,ds:0,it:0,tot:10
  });
});

test('limita el descuento al subtotal y no admite importes negativos',()=>{
  assert.deepEqual(calcularTotales([{q:1,p:10}],99,7,true),{
    sub:10,ds:10,it:0,tot:0
  });
  assert.deepEqual(calcularTotales([{q:-2,p:-4}],-3,7,true),{
    sub:0,ds:0,it:0,tot:0
  });
});

test('redondea importes monetarios a dos decimales',()=>{
  assert.deepEqual(calcularTotales([{q:3,p:0.1}],0,7,true),{
    sub:0.30,ds:0,it:0.02,tot:0.32
  });
});

test('crea un pago mixto completo y conserva el crédito',()=>{
  const r=prepararPago({pago:'Pago mixto',total:25.50,pagosMixtos:[{m:'Efectivo',v:10},{m:'Crédito',v:15.50}],fecha:'2026-10-18',plazo:2,unidad:'semanas'});
  assert.equal(r.ok,true);
  assert.equal(r.pago,'Mixto (Efectivo + Crédito)');
  assert.deepEqual(r.pagos,[{m:'Efectivo',v:10},{m:'Crédito',v:15.50}]);
  assert.deepEqual(r.credito,{n:2,u:'semanas',monto:15.50,vence:'2026-11-01'});
});

test('rechaza pagos mixtos incompletos o con una sola forma de pago',()=>{
  assert.equal(prepararPago({pago:'Pago mixto',total:10,pagosMixtos:[{m:'Efectivo',v:8},{m:'Yappy',v:1}]}).ok,false);
  assert.equal(prepararPago({pago:'Pago mixto',total:10,pagosMixtos:[{m:'Efectivo',v:10}]}).ok,false);
});

test('calcula el vencimiento de crédito sin desbordar el fin de mes',()=>{
  assert.equal(sumarPlazo('2026-01-31',1,'meses'),'2026-02-28');
  const r=prepararPago({pago:'Crédito',total:42,fecha:'2028-01-31',plazo:1,unidad:'meses'});
  assert.deepEqual(r.credito,{n:1,u:'meses',monto:42,vence:'2028-02-29'});
});

test('rechaza crédito sin plazo o fecha válidos',()=>{
  assert.equal(prepararPago({pago:'Crédito',total:10,fecha:'2026-10-18',plazo:0}).ok,false);
  assert.equal(prepararPago({pago:'Crédito',total:10,fecha:'fecha-invalida',plazo:30}).ok,false);
  assert.equal(prepararPago({pago:'Crédito',total:10,fecha:'2026-02-31',plazo:30}).ok,false);
});
