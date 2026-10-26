/* Registro de Empresas (VEN CRM): formulario neutro, sin colores ni textos de Tarjetería Jhon. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const emp=leer('js/empresas.js');
const ctx={window:{},console};vm.createContext(ctx);
vm.runInContext(leer('js/empresa-contexto.js')+';'+emp+';this.empSan=empSan;this.C=[EMP_COLOR1,EMP_COLOR2]',ctx);
test('una empresa nueva sin colores recibe los neutros de VEN CRM (negro y azul), no el rosa de Tarjetería',()=>{
 const d=ctx.empSan({nombre:'Genuine Parts'});
 assert.equal(d.color,'#111111');assert.equal(d.color2,'#276EF1');assert.notEqual(d.color,'#E0457B');
 assert.equal(ctx.empSan({nombre:'Genuine Parts',color:'#123456'}).color,'#123456');
});
test('el formulario y la lista no usan #E0457B ni nombran a Tarjetería; solo la empresa inicial conserva su registro',()=>{
 const ini=emp.indexOf('function empInicialRegistrar'),fin=emp.indexOf('function empGuardar');
 const sinIni=emp.slice(0,ini)+emp.slice(fin);
 assert.doesNotMatch(sinIni,/E0457B|0F6CBD/,'colores de Tarjetería fuera del registro de la empresa inicial');
 const ui=emp.slice(emp.indexOf('function empresasRender'),emp.indexOf('function empTab'));
 assert.doesNotMatch(ui,/Tarjeter/i);
 assert.match(emp.slice(ini,fin),/color:'#E0457B',color2:'#0F6CBD'/,'la empresa inicial conserva su color');
});
test('el formulario explica que los datos son de esta empresa y los campos de contacto traen ejemplos neutros',()=>{
 assert.match(emp,/Nueva empresa en VEN CRM/);assert.match(emp,/Cada empresa tiene su propio panel, catálogo, tienda y datos/);
 assert.match(emp,/placeholder="\+507 0000-0000"/);assert.match(emp,/placeholder="contacto@suempresa\.com"/);
 assert.match(emp,/Teléfono de contacto/);assert.match(emp,/Correo de contacto/);
});
test('versiones subidas',()=>{
 const h=leer('index.html');assert.match(h,/js\/empresas\.js\?v=(registro-empresas-a|etapa3-empresas-[a-z])/);assert.match(h,/js\/app\.js\?v=modulos-fase-24[m-z]/);assert.match(leer('sw.js'),/tj-net-first-(3[3-9]|[4-9]\d)/);
});
