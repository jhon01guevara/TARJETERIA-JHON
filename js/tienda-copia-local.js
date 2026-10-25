/* Fase 23 (extracción 3): copia local del catálogo de la tienda (tj_cached_items) con presupuesto de memoria. Contiene: shopCacheItems y su window.shopCacheItems.
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico cargado justo ANTES de js/app.js: no usa ningún símbolo de app.js al cargarse
   (lo que usa de app.js lo usa dentro de funciones que se ejecutan después de cargar todo). Las const siguen siendo globales de script y las function, propiedades de window. */
/* Fase 20: copia local del catálogo de la tienda (tj_cached_items) con presupuesto.
   Antes se guardaban los 180 primeros artículos enteros, pero cada foto va dentro del artículo como data: (~120 000 caracteres),
   así que el JSON (~7 MB con 63 artículos) superaba la cuota de localStorage (~5 M caracteres) y setItem fallaba SIEMPRE
   ('exceeded the quota'): nunca hubo copia y la consola avisaba en cada carga. Ahora se guarda un prefijo de los artículos MÁS
   NUEVOS, completos (con su foto), que quepa en un presupuesto: como máximo 2 M caracteres y sin llenar la memoria que usan las
   demás claves (tj_db del panel, etc.: el total no pasa de ~3,8 M). Si aun así falla, se borran las copias de otras empresas
   (se regeneran solas), se reintenta con la mitad y, si no cabe, se quita la copia: es opcional, la nube manda y no se avisa. Una lista vacía no pisa la última copia buena.
   Nota: la línea que guardaba tj_cached_cfg usaba 'cf', que solo existe dentro del bloque de arriba (ReferenceError atrapado), así que esa copia
   nunca se escribió. No se activa aquí a propósito (cambiaría el primer pintado de la tienda); se deja documentado en docs/GUIA-PRUEBAS-FASE-20.md. */
function shopCacheItems(items){
  let K;try{K=lsk('tj_cached_items')}catch(e){return}
  try{
    let otros=0;
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!==K)otros+=k.length+(localStorage.getItem(k)||'').length}
    let tope=Math.min(2000000,3800000-otros);
    const L=(Array.isArray(items)?items:[]).slice(0,180);
    if(!L.length)return; // lista vacía (p.ej. snapshot sin red): se conserva la última copia buena
    for(let intento=0;intento<4&&tope>=100000;intento++,tope=Math.floor(tope/2)){
      const sel=[];let n=2;
      for(const it of L){const s=JSON.stringify(it);if(n+s.length+1>tope)break;sel.push(s);n+=s.length+1}
      if(!sel.length)continue;
      try{localStorage.setItem(K,'['+sel.join(',')+']');return}
      catch(e){
        for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k!==K&&k.indexOf('tj_cached_items_')===0)localStorage.removeItem(k)}
      }
    }
    localStorage.removeItem(K);
  }catch(e){}
}
window.shopCacheItems=shopCacheItems;
