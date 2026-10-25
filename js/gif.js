/* Fase 19 (extracción 7a): compresión de GIF animados del perfil (se decodifican los cuadros, se reducen y se vuelve a generar el GIF).
   Movido TAL CUAL desde js/app.js, sin cambiar lógica. Script clásico, cargado justo ANTES de js/app.js; no usa ningún símbolo de app.js al cargarse
   (solo APIs del navegador al ejecutarse). _gifMedianCut, _gifLZW, _gifEncode, _u8b64 (const) y gifComprimir (function) siguen siendo globales como antes. */
// --- Compresión automática de GIF animados: se decodifican los cuadros, se reducen y se vuelve a generar el GIF ---
function _gifMedianCut(S,n){const cnt=S.length/3;let boxes=[Array.from({length:cnt},(_,i)=>i)];
 const rng=bx=>{const mn=[255,255,255],mx=[0,0,0];for(const i of bx)for(let c=0;c<3;c++){const v=S[i*3+c];if(v<mn[c])mn[c]=v;if(v>mx[c])mx[c]=v}return [mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]]};
 while(boxes.length<n){let bi=-1,bs=0,bc=0;boxes.forEach((bx,i)=>{if(bx.length<2)return;const r=rng(bx),m=Math.max(r[0],r[1],r[2]),sc=m*Math.sqrt(bx.length);if(sc>bs){bs=sc;bi=i;bc=r.indexOf(m)}});if(bi<0||bs===0)break;
  const bx=boxes[bi].sort((x,y)=>S[x*3+bc]-S[y*3+bc]),h=bx.length>>1;boxes.splice(bi,1,bx.slice(0,h),bx.slice(h))}
 return boxes.map(bx=>{let r=0,g=0,bl=0;for(const i of bx){r+=S[i*3];g+=S[i*3+1];bl+=S[i*3+2]}const k=bx.length||1;return [Math.round(r/k),Math.round(g/k),Math.round(bl/k)]})}
function _gifLZW(px,minC){const clear=1<<minC,eoi=clear+1;let size=minC+1,next=eoi+1,dict=new Map(),out=[],cur=0,nb=0;
 const emit=c=>{cur|=c<<nb;nb+=size;while(nb>=8){out.push(cur&255);cur>>>=8;nb-=8}};
 emit(clear);let pre=px[0];
 for(let i=1;i<px.length;i++){const k=px[i],key=(pre<<8)|k,v=dict.get(key);
  if(v!==undefined){pre=v;continue}
  emit(pre);
  if(next===4096){emit(clear);next=eoi+1;size=minC+1;dict=new Map()}
  else{if(next>=(1<<size))size++;dict.set(key,next++)}
  pre=k}
 emit(pre);emit(eoi);if(nb>0)out.push(cur&255);return out}
function _gifEncode(frames,D,bits){const all=[];frames.forEach(f=>{const d=f.data;const st=Math.max(1,Math.floor(d.length/4/(14000/frames.length)));for(let i=0;i<d.length;i+=4*st)all.push(d[i],d[i+1],d[i+2])});
 const pal=_gifMedianCut(Uint8Array.from(all),1<<bits);while(pal.length<(1<<bits))pal.push([0,0,0]);
 const cache=new Map(),near=(r,g,b)=>{const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);let v=cache.get(key);if(v!==undefined)return v;let bd=1e9;v=0;for(let i=0;i<pal.length;i++){const q=pal[i],dd=(q[0]-r)**2+(q[1]-g)**2+(q[2]-b)**2;if(dd<bd){bd=dd;v=i}}cache.set(key,v);return v};
 const o=[],w16=n=>o.push(n&255,(n>>8)&255),minC=Math.max(2,bits);
 'GIF89a'.split('').forEach(c=>o.push(c.charCodeAt(0)));w16(D);w16(D);o.push(0x80|(7<<4)|(bits-1),0,0);pal.forEach(c=>o.push(c[0],c[1],c[2]));
 o.push(0x21,0xFF,0x0B);'NETSCAPE2.0'.split('').forEach(c=>o.push(c.charCodeAt(0)));o.push(3,1,0,0,0);
 frames.forEach(f=>{o.push(0x21,0xF9,4,0x04);w16(Math.max(2,Math.round(f.d/10)));o.push(0,0);
  o.push(0x2C);w16(0);w16(0);w16(D);w16(D);o.push(0);
  const d=f.data,idx=new Uint8Array(D*D);for(let i=0,j=0;i<idx.length;i++,j+=4)idx[i]=near(d[j],d[j+1],d[j+2]);
  o.push(minC);const z=_gifLZW(idx,minC);for(let i=0;i<z.length;i+=255){const ch=z.slice(i,i+255);o.push(ch.length);for(const x of ch)o.push(x)}o.push(0)});
 o.push(0x3B);return Uint8Array.from(o)}
const _u8b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)};
async function gifComprimir(file,maxBytes){
 if(!('ImageDecoder' in window))return null;
 const dec=new ImageDecoder({data:await file.arrayBuffer(),type:'image/gif'});await dec.tracks.ready;const n=dec.tracks.selectedTrack.frameCount;if(!n)return null;
 const D0=128,cv=document.createElement('canvas');cv.width=cv.height=D0;const cx=cv.getContext('2d',{willReadFrequently:true});
 const keep=Math.min(n,60),step=n/keep,fr=[];let acc=0,nx=0;
 for(let i=0;i<n;i++){const {image}=await dec.decode({frameIndex:i});acc+=(image.duration||100000)/1000;
  if(i>=Math.floor(nx)){const w=image.displayWidth,h=image.displayHeight,s=Math.min(w,h);cx.fillStyle='#fff';cx.fillRect(0,0,D0,D0);cx.drawImage(image,(w-s)/2,(h-s)/2,s,s,0,0,D0,D0);fr.push({d:acc,data:cx.getImageData(0,0,D0,D0)});acc=0;nx+=step}
  image.close()}
 dec.close&&dec.close();
 const tmp=document.createElement('canvas'),tx=tmp.getContext('2d',{willReadFrequently:true});
 for(const [D,mf,bits] of [[128,60,8],[128,40,7],[112,32,7],[96,24,6],[80,18,6],[64,14,5],[48,10,5]]){
  const k=Math.max(1,Math.ceil(fr.length/mf)),sel=[];for(let i=0;i<fr.length;i+=k){let d=0;for(let j=i;j<Math.min(fr.length,i+k);j++)d+=fr[j].d;sel.push({d,src:fr[i].data})}
  const fs=sel.map(f=>{if(D===D0)return {d:f.d,data:f.src.data};tmp.width=tmp.height=D0;tx.putImageData(f.src,0,0);const c2=document.createElement('canvas');c2.width=c2.height=D;const x2=c2.getContext('2d',{willReadFrequently:true});x2.drawImage(tmp,0,0,D0,D0,0,0,D,D);return {d:f.d,data:x2.getImageData(0,0,D,D).data}});
  const bytes=_gifEncode(fs,D,bits);if(bytes.length<=maxBytes)return 'data:image/gif;base64,'+_u8b64(bytes)}
 return null}
