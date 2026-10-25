const {chromium}=require('playwright-core');
const BASE=process.env.BASE,USER=process.env.PUSER||'admin.prueba@example.com',PASS=process.env.PRUEBA_PASSWORD;
const R=[];const ok=(n,c,d)=>{R.push((c?'OK    ':'FALLA ')+n+(d?' — '+d:''));console.log(R[R.length-1])};
const errs=[];
(async()=>{
 const br=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
 ctx.on('page',p=>{p.on('pageerror',e=>errs.push(e.message.slice(0,150)))});
 const page=await ctx.newPage();
 const foco=()=>page.evaluate(()=>{const a=document.activeElement;return a?(a.tagName+'#'+a.id+'.'+(a.className||'')+'|'+(a.textContent||'').trim().slice(0,25)):'none'});
 const dentro=sel=>page.evaluate(s=>{const m=document.querySelector(s),a=document.activeElement;return !!(m&&a&&m.contains(a))},sel);
 await page.goto(BASE,{waitUntil:'load'});await page.waitForTimeout(2500);
 // 1 LOGIN: foco dentro y Tab atrapado
 ok('login: role=dialog aria-modal',await page.evaluate(()=>{const a=document.getElementById('auth');return a&&a.getAttribute('role')==='dialog'&&a.getAttribute('aria-modal')==='true'}));
 ok('login: foco dentro al cargar',await dentro('#auth'),await foco());
 let fuera=0;for(let i=0;i<14;i++){await page.keyboard.press('Tab');if(!await dentro('#auth'))fuera++}
 ok('login: 14 Tab seguidos sin salir de la ventana',fuera===0,'salidas='+fuera);
 await page.fill('#au_e',USER);await page.fill('#au_p',PASS);await page.click('text=Entrar');
 await page.waitForSelector('.ni',{timeout:25000});await page.waitForTimeout(3000);
 ok('login cerrado: ya no atrapa foco (Tab llega al menú/skip)',await (async()=>{await page.keyboard.press('Tab');return !(await dentro('#auth'))})());
 // 2 PANEL #md : Agenda → Nuevo evento
 await page.click('#nav .ni[data-k="agenda"]');await page.waitForTimeout(1500);
 const btn='button:has-text("Nuevo evento")';
 await page.focus(btn);await page.click(btn);await page.waitForTimeout(500);
 ok('#md abierto',await page.evaluate(()=>document.getElementById('md').classList.contains('on')));
 const nm=await page.evaluate(()=>{const b=document.getElementById('mb');const l=b.getAttribute('aria-labelledby');const t=l&&document.getElementById(l);return {role:b.getAttribute('role'),modal:b.getAttribute('aria-modal'),name:t&&t.textContent}});
 ok('#mb role=dialog aria-modal y nombre accesible = título',nm.role==='dialog'&&nm.modal==='true'&&/evento/i.test(nm.name||''),JSON.stringify(nm));
 ok('foco dentro del modal al abrir',await dentro('#mb'),await foco());
 fuera=0;for(let i=0;i<40;i++){await page.keyboard.press('Tab');if(!await dentro('#mb'))fuera++}
 ok('Tab x40 atrapado dentro de #mb',fuera===0,'salidas='+fuera);
 fuera=0;for(let i=0;i<40;i++){await page.keyboard.press('Shift+Tab');if(!await dentro('#mb'))fuera++}
 ok('Mayús+Tab x40 atrapado dentro de #mb',fuera===0,'salidas='+fuera);
 await page.keyboard.press('Escape');await page.waitForTimeout(400);
 ok('Esc cierra #md (formulario sin tocar)',!(await page.evaluate(()=>document.getElementById('md').classList.contains('on'))));
 const f1=await foco();ok('foco vuelve al botón que abrió el modal',/Nuevo evento/.test(f1),f1);
 // dirty: escribir y Esc no cierra
 await page.click(btn);await page.waitForTimeout(400);
 await page.fill('#ag_ti','Prueba');await page.keyboard.press('Escape');await page.waitForTimeout(300);
 ok('Esc NO cierra si ya se escribió algo (protege formulario)',await page.evaluate(()=>document.getElementById('md').classList.contains('on')));
 await page.evaluate(()=>cerrar());await page.waitForTimeout(300);
 ok('cierre normal (cerrar()) también devuelve el foco',/Nuevo evento/.test(await foco()),await foco());
 // clic en fondo cierra y no rompe
 await page.click(btn);await page.waitForTimeout(300);await page.mouse.click(5,5);await page.waitForTimeout(300);
 ok('clic en el fondo sigue cerrando',!(await page.evaluate(()=>document.getElementById('md').classList.contains('on'))));
 // 3 Investigación overlay (iframe)
 await page.evaluate(()=>investigacionAbrir());await page.waitForTimeout(1500);
 ok('investOv: role=dialog y foco dentro',await page.evaluate(()=>{const o=document.getElementById('investOv');return o.getAttribute('role')==='dialog'&&o.contains(document.activeElement)}),await foco());
 ok('iframe de investigación con title',await page.evaluate(()=>document.getElementById('investFrame').title.length>3));
 await page.focus('#investX');await page.keyboard.press('Escape');await page.waitForTimeout(300);
 ok('Esc cierra la ventana de Investigación',!(await page.evaluate(()=>!!document.getElementById('investOv'))));
 // 4 PDF viewer
 await page.evaluate(()=>shopPdfVer(new Blob(['%PDF-1.4 x'],{type:'application/pdf'}),'prueba.pdf'));await page.waitForTimeout(500);
 await page.waitForTimeout(1200);
 ok('pdfv: nombre accesible y foco dentro',await page.evaluate(()=>{const o=document.getElementById('pdfv');return o.getAttribute('role')==='dialog'&&!!o.getAttribute('aria-labelledby')&&o.contains(document.activeElement)}),await foco());
 await page.keyboard.press('Escape');await page.waitForTimeout(300);
 ok('Esc cierra el visor PDF',!(await page.evaluate(()=>!!document.getElementById('pdfv'))));
 // Check iframe
 await page.click('#nav .ni[data-k="check"]');await page.waitForTimeout(1500);
 ok('iframe Check con title',await page.evaluate(()=>/Check/.test(document.getElementById('checkFrame').title)),await page.evaluate(()=>document.getElementById('checkFrame').title));
 // 5 Tienda pública
 const pt=await ctx.newPage();await pt.goto(BASE+'?tienda',{waitUntil:'load'});await pt.waitForTimeout(4500);
 const fp=()=>pt.evaluate(()=>{const a=document.activeElement;return a?(a.tagName+'#'+a.id+'.'+(a.className||'')+'|'+(a.getAttribute('aria-label')||(a.textContent||'')).trim().slice(0,25)):'none'});
 const dp=sel=>pt.evaluate(s=>{const m=document.querySelector(s),a=document.activeElement;return !!(m&&a&&m.contains(a))},sel);
 // abrir detalle de un producto con Enter sobre su imagen (role=button)
 const img=await pt.$('#shop [data-h-click="h49"], #shop .kcard img[role="button"], #shop img[role="button"]');
 if(!img){ok('tienda: hay imagen clicable de producto',false)}else{
  await img.focus();const antes=await fp();await pt.keyboard.press('Enter');await pt.waitForTimeout(800);
  ok('tienda: detalle abre en #shopm (role=dialog)',await pt.evaluate(()=>{const m=document.getElementById('shopm');return m.style.display==='flex'&&m.getAttribute('role')==='dialog'}));
  ok('tienda: foco dentro del detalle',await dp('#shopm'),await fp());
  const nm2=await pt.evaluate(()=>{const m=document.getElementById('shopm');const l=m.getAttribute('aria-labelledby');return l?document.getElementById(l).textContent:m.getAttribute('aria-label')});
  ok('tienda: nombre accesible del detalle',!!nm2,nm2);
  fuera=0;for(let i=0;i<30;i++){await pt.keyboard.press('Tab');if(!await dp('#shopm'))fuera++}
  ok('tienda: Tab x30 atrapado en #shopm',fuera===0,'salidas='+fuera);
  await pt.keyboard.press('Escape');await pt.waitForTimeout(500);
  ok('tienda: Esc cierra el detalle',await pt.evaluate(()=>document.getElementById('shopm').style.display==='none'));
  const despues=await fp();ok('tienda: el foco vuelve a la imagen que abrió el detalle',despues===antes,antes+' → '+despues);
 }
 // carrito
 await pt.evaluate(()=>shopCart());await pt.waitForTimeout(600);
 ok('tienda: carrito abierto atrapa foco',await dp('#shopm'),await fp());
 await pt.keyboard.press('Escape');await pt.waitForTimeout(400);
 ok('tienda: Esc cierra el carrito',await pt.evaluate(()=>document.getElementById('shopm').style.display==='none'));
 // zoom de imagen
 await pt.evaluate(()=>{const i=SH.items[0];if(i)shopZoom(i.id)});await pt.waitForTimeout(500);
 ok('tienda: zoom abierto con role=dialog',await pt.evaluate(()=>{const z=document.getElementById('kzoom');return !!z&&z.getAttribute('role')==='dialog'}));
 ok('tienda: foco dentro del zoom',await dp('#kzoom'),await fp());
 await pt.keyboard.press('Escape');await pt.waitForTimeout(400);
 ok('tienda: Esc cierra el zoom',!(await pt.evaluate(()=>!!document.getElementById('kzoom'))));
 console.log('pageerrors',[...new Set(errs)].join(' || ')||'ninguno');
 console.log('RESUMEN',R.filter(x=>x.startsWith('OK')).length+'/'+R.length);
 await br.close();
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
