/* Crea/actualiza la empresa de PRUEBA «genuine-prueba» SOLO en tarjeteria-jhon-prueba (imita a Genuine: logo ancho, plantilla y contacto propios).
   Aborta si la app no apunta al proyecto de PRUEBA. Uso: BASE=http://127.0.0.1:PUERTO/ PRUEBA_PASSWORD=… PW=/ruta/playwright-core node tests/navegador/genuine-siembra.js (BASE = copia hecha con copia-prueba.js) */
const {chromium}=require(process.env.PW||'playwright-core');
const BASE=process.env.BASE;if(!BASE||/tarjeteria-jhon\.(web|firebaseapp)|github\.io/.test(BASE))throw new Error('Solo contra la copia de PRUEBA (BASE=…)');
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
 const page=await ctx.newPage();
 await page.goto(BASE,{waitUntil:'load'});
 await page.waitForSelector('#au_e',{timeout:25000});await page.waitForTimeout(1200);
 await page.fill('#au_e','admin.prueba@example.com');await page.fill('#au_p',process.env.PRUEBA_PASSWORD);await page.click('text=Entrar');
 await page.waitForSelector('#nav .ni',{state:'attached',timeout:45000});await page.waitForTimeout(3000);
 const r=await page.evaluate(async()=>{
  if(!/tarjeteria-jhon-prueba/.test(JSON.stringify(firebase.app().options)))throw new Error('NO ES PRUEBA');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="480" height="120"><rect width="480" height="120" fill="#fff"/><text x="240" y="70" font-family="Arial Black,Arial" font-weight="900" font-size="64" text-anchor="middle" fill="#000">GENUINE</text><text x="240" y="100" font-family="Arial" font-weight="700" font-size="16" text-anchor="middle" fill="#000">GLOBAL ONLINE PARTS</text></svg>';
  const logo='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const id='genuine-prueba';
  await fbDb.collection('empresas').doc(id).set({id,slug:id,nombre:'Genuine Prueba',logo:'',color:'#111111',color2:'#0F6CBD',contacto:{tel:'+507 6999-0000',email:'ventas@genuine-prueba.example'},estado:'activa',ts:Date.now()},{merge:true});
  const base='empresas/'+id;
  await fbDb.collection(base+'/tienda_items').doc('__cfg').set({__cfg:true,empresaNombre:'Genuine Prueba',heroTitle:'Global Online Part',heroSub:'Accesorios & partes para tu automóvil',logoUrl:logo,wordmark:'',paleta:'shop',heroBgType:'none',btnRadio:999,
    contacto:{tel:'+507 6999-0000',email:'ventas@genuine-prueba.example',dir:'Zona Libre de Colón, Panamá',wa:'50769990000',horario:'Lun a Vie 8-5'},ts:Date.now()},{merge:true});
  await fbDb.collection(base+'/tienda_items').doc('prod_1').set({id:'prod_1',name:'Filtro de aceite',cat:'Motor',price:12.5,desc:'Filtro de prueba',img:logo,tags:[],stock:'ok',badges:[],ts:Date.now()});
  await fbDb.collection(base+'/panel').doc('data').set({cfg:{nombre:'Genuine Prueba',tel:'+507 6999-0000',email:'ventas@genuine-prueba.example',dir:'Zona Libre de Colón, Panamá',panelLogoSrc:logo,loginLogoSrc:logo,loginLogoKind:'image'}},{merge:true});
  return 'ok';
 });
 console.log(r);await br.close();
})();
