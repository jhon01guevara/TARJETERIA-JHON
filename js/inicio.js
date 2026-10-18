(function(){
 if(self===top){var s=document.getElementById('_akOff');if(s)s.remove();return}
 try{top.location.replace(self.location.href)}catch(e){}
})();
/* Registro de errores silenciados (SEG-10): avisa en consola, máximo 60 veces, sin interrumpir nada. */
window._tjw=function(e){try{var n=(window._tjwN=(window._tjwN||0)+1);if(n>60)return;var st=e&&e.stack?String(e.stack).split("\n")[1]:"";console.warn("[Tarjetería] error ignorado #"+n+":",(e&&e.message)||e,st?st.trim():"")}catch(_){}};
