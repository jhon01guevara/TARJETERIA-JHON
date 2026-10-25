/* Fase 23 (extracción 2): controles de la configuración de la tienda: tipo de fondo, color, movimiento, marca de agua, foto, video y logo. Contiene: shopCfgBgTypeSet, shopCfgColorSet, shopCfgMotionSet, shopCfgWmSet, shopPhoto*, shopVideo*, shopPresetVideo, shopLogo* (todas function y su window.x=x).
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico cargado justo ANTES de js/app.js: no usa ningún símbolo de app.js al cargarse
   (lo que usa de app.js lo usa dentro de funciones que se ejecutan después de cargar todo). Las const siguen siendo globales de script y las function, propiedades de window. */
function shopCfgBgTypeSet(t){
 TD._curBgType=t;
 const c=$('sh_cfg_bgtype_btns');if(c)c.querySelectorAll('button').forEach(b=>b.classList.toggle('p',b.getAttribute('data-bgtype')===t));
 const sp=$('sh_cfg_sec_photo'),sv=$('sh_cfg_sec_video'),sc=$('sh_cfg_sec_colors'),ss=$('sh_cfg_sec_solid');
 if(sp)sp.style.display=t==='photo'?'block':'none';
 if(sv)sv.style.display=t==='video'?'block':'none';
 if(sc)sc.style.display=t==='colors'?'block':'none';
 if(ss)ss.style.display=t==='solid'?'block':'none';
}
window.shopCfgBgTypeSet=shopCfgBgTypeSet;

function shopCfgColorSet(cId){
 TD._curHeroBgColor=cId;
 const c=$('sh_cfg_color_btns');if(c)c.querySelectorAll('button').forEach(b=>b.classList.toggle('p',b.getAttribute('data-color')===cId));
}
window.shopCfgColorSet=shopCfgColorSet;

function shopCfgMotionSet(m){
 TD._curMotion=m;
 const c=$('sh_cfg_motion_btns');if(c)c.querySelectorAll('button').forEach(b=>b.classList.toggle('p',b.getAttribute('data-motion')===m));
}
window.shopCfgMotionSet=shopCfgMotionSet;

function shopCfgWmSet(w){
 TD._curWmStyle=w;
 const c=$('sh_cfg_wm_btns');if(c)c.querySelectorAll('button').forEach(b=>b.classList.toggle('p',b.getAttribute('data-wm')===w));
}
window.shopCfgWmSet=shopCfgWmSet;

function shopPhotoUpload(e){
 const inpFile=(e&&e.target&&e.target.files)?e.target:$('sh_cfg_photo_file');
 const file=inpFile&&inpFile.files&&inpFile.files[0];if(!file)return;
 if(!file.type.startsWith('image/')){alert('Por favor elija un archivo de imagen válido.');return}
 if(file.size>3.5*1024*1024){alert('La imagen no debe pesar más de 3.5 MB.');return}
 const reader=new FileReader();
 reader.onload=ev=>{
   const dataUrl=ev.target.result;
   const inp=$('sh_cfg_hero_photo');if(inp)inp.value=dataUrl;
   const prev=$('sh_cfg_photo_prev');if(prev){prev.style.display='block';const img=prev.querySelector('img');if(img)img.src=dataUrl}
 };
 reader.readAsDataURL(file);
}
window.shopPhotoUpload=shopPhotoUpload;

function shopPhotoClear(){
 const inp=$('sh_cfg_hero_photo');if(inp)inp.value='';
 const prev=$('sh_cfg_photo_prev');if(prev)prev.style.display='none';
 const inpFile=$('sh_cfg_photo_file');if(inpFile)inpFile.value='';
}
window.shopPhotoClear=shopPhotoClear;

function shopVideoUpload(e){
 const inpFile=(e&&e.target&&e.target.files)?e.target:$('sh_cfg_video_file');
 const file=inpFile&&inpFile.files&&inpFile.files[0];if(!file)return;
 if(file.size>8*1024*1024){alert('Aviso: Para videos mayores a 8 MB se recomienda usar una URL directa de video para que la tienda cargue rápido.')}
 const reader=new FileReader();
 reader.onload=ev=>{
   const dataUrl=ev.target.result;
   const inp=$('sh_cfg_hero_video');if(inp)inp.value=dataUrl;
   alert('✅ Video de movimiento cargado con éxito. Recuerde pulsar Guardar para aplicarlo a la tienda.');
 };
 reader.readAsDataURL(file);
}
window.shopVideoUpload=shopVideoUpload;

function shopVideoClear(){
 const inp=$('sh_cfg_hero_video');if(inp)inp.value='';
 const inpFile=$('sh_cfg_video_file');if(inpFile)inpFile.value='';
}
window.shopVideoClear=shopVideoClear;

function shopPresetVideo(u){
 const inp=$('sh_cfg_hero_video');if(inp)inp.value=u;
 alert('✅ Video asignado. Recuerde pulsar Guardar para aplicarlo a la tienda.');
}
window.shopPresetVideo=shopPresetVideo;

function shopLogoUpload(e){
 const inpFile=(e&&e.target&&e.target.files)?e.target:$('sh_cfg_logo_file');
 const file=inpFile&&inpFile.files&&inpFile.files[0];if(!file)return;
 if(!file.type.startsWith('image/')){alert('Por favor elija un archivo de imagen válido.');return}
 if(file.size>2.5*1024*1024){alert('El logo no debe pesar más de 2.5 MB.');return}
 const reader=new FileReader();
 reader.onload=ev=>{
   const dataUrl=ev.target.result;
   const inp=$('sh_cfg_logo');if(inp)inp.value=dataUrl;
   const prev=$('sh_cfg_logo_prev');if(prev){prev.style.display='block';const img=prev.querySelector('img');if(img)img.src=dataUrl}
 };
 reader.readAsDataURL(file);
}
window.shopLogoUpload=shopLogoUpload;

function shopLogoClear(){
 const inp=$('sh_cfg_logo');if(inp)inp.value='';
 const prev=$('sh_cfg_logo_prev');if(prev)prev.style.display='none';
 const inpFile=$('sh_cfg_logo_file');if(inpFile)inpFile.value='';
}
window.shopLogoClear=shopLogoClear;
