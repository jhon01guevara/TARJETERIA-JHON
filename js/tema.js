(function(){if(!/[?&]tienda(=|&|$)/.test(location.search))return;var H=document.documentElement;
function pref(){try{return localStorage.getItem('tj_shop_theme')||'auto'}catch(e){return'auto'}}
function calc(){var p=pref();if(p==='light'||p==='dark')return p;var h=new Date().getHours();return(h>=6&&h<18)?'light':'dark'}
function apply(){var t=calc();H.setAttribute('data-kt',t);var m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='dark'?'#000000':'#FFFFFF';var b=document.getElementById('ktheme');if(b)draw(b)}
var IC={light:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',dark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>'};
var LB={light:'Día',dark:'Noche',auto:'Auto'};
function draw(b){var p=pref();b.innerHTML=IC[p]+'<span>'+LB[p]+'</span>';b.setAttribute('aria-label','Tema: '+LB[p])}
function mk(){if(document.getElementById('ktheme'))return;var b=document.createElement('button');b.id='ktheme';b.type='button';b.onclick=function(){var n={auto:'light',light:'dark',dark:'auto'}[pref()];try{localStorage.setItem('tj_shop_theme',n)}catch(e){window._tjw&&_tjw(e)}apply()};document.body.appendChild(b);draw(b)}
apply();document.addEventListener('DOMContentLoaded',mk);setInterval(apply,60000);
})()
