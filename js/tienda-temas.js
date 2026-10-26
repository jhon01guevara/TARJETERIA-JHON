/* Fase 23 (extracción 4): temas de producto (TEMAS, temaOf, temaMeta) e iconos SVG de la tienda (KI, kico). Contiene: TEMAS, temaOf, temaMeta, KI, kico (const) y el Object.assign(KI,…) que completa los iconos.
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico cargado justo ANTES de js/app.js: no usa ningún símbolo de app.js al cargarse
   (lo que usa de app.js lo usa dentro de funciones que se ejecutan después de cargar todo). Las const siguen siendo globales de script y las function, propiedades de window. */
/* Las «ocasiones» (Quinceañero, Boda, Baby shower…) son etiquetas de Tarjetería Jhon: SOLO la empresa inicial las tiene. Otra empresa clasifica por las categorías de su propio catálogo. */
const TEMAS=(typeof TJEmpresa!=='undefined'&&TJEmpresa.empEsInicial&&!TJEmpresa.empEsInicial())?[]:[
 {id:'quince',n:'Quinceañero',e:'👑',re:/quince|\bxv\b|15 anos/},
 {id:'cumple',n:'Cumpleaños',e:'🎂',re:/cumple|birthday|aniversario de vida/},
 {id:'boda',n:'Boda',e:'💍',re:/boda|matrimonio|novios|save the date|wedding/},
 {id:'baby',n:'Baby shower',e:'🍼',re:/baby|bebe|nacimiento/},
 {id:'revela',n:'Revelación de sexo',e:'💙',re:/revelacion|gender|sexo|nino o nina/},
 {id:'bautizo',n:'Bautizo / Comunión',e:'⛪',re:/bautizo|bautismo|comunion|confirmacion/},
 {id:'grad',n:'Graduación',e:'🎓',re:/gradua/},
 {id:'aniv',n:'Aniversario',e:'❤️',re:/aniversario/},
 {id:'amor',n:'Amor',e:'💕',re:/\bamor\b|enamor|valentin|te quiero|te amo/},
 {id:'felic',n:'Felicidades',e:'🎉',re:/felicid|enhorabuena|congrat|logro/},
 {id:'pesame',n:'Pésame',e:'🕊️',re:/pesame|condolenc|descanse|luto|q\.?e\.?p\.?d/},
 {id:'infantil',n:'Infantil',e:'🧸',re:/infantil|unicornio|princesa|superheroe|dinosaurio|nino|nina/},
 {id:'patrio',n:'Mes patrio',e:'⭐',re:/patri|panama|independ|separacion|bandera|himno|(3|10|28) de noviembre/},
 {id:'navidad',n:'Navidad',e:'🎄',re:/navid|ano nuevo|fin de ano/},
 {id:'gracias',n:'Gracias',e:'💌',re:/gracias|agradec/},
 {id:'personal',n:'Personalizado',e:'✨',re:/personaliz|a tu medida|a su medida/},
 {id:'otros',n:'Otros',e:'📦',re:/$^/}];
const temaOf=i=>{if(!TEMAS.length)return [];let r;if(Array.isArray(i.tags))r=i.tags;else{const t=shopN((i.name||'')+' '+(i.cat||'')+' '+(i.desc||''));r=TEMAS.filter(x=>x.re.test(t)).map(x=>x.id)}return r.length?r:['otros']};
const temaMeta=id=>TEMAS.find(x=>x.id===id)||{id,n:id,e:'🏷️'};
const KI={user:'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',home:'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',heart:'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',heartO:'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',cart:'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',search:'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',plus:'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'};
const kico=(d,s)=>`<svg viewBox="0 0 24 24" width="${s||24}" height="${s||24}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
Object.assign(KI,{menu:'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',filter:'M3 5h18v2H3V5zm4 6h10v2H7v-2zm3 6h4v2h-4v-2z',grid:'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',list:'M4 6h3v3H4V6zm5 1h11v1H9V7zM4 11h3v3H4v-3zm5 1h11v1H9v-1zM4 16h3v3H4v-3zm5 1h11v1H9v-1z',star:'M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2z'});
