const test=require('node:test');
const assert=require('node:assert/strict');
const {calcularTotales}=require('../js/facturacion.js');

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
