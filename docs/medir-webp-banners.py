# Mide ahorro y SSIM de WebP (q85/q90) contra los JPG de banners/. Uso: python docs/medir-webp-banners.py  (requiere pillow, numpy, scikit-image; ejecutar desde la raíz del repo)
import glob,io,os,numpy as np,PIL.Image as I
from skimage.metrics import structural_similarity as ssim
T={}
for f in sorted(glob.glob('banners/*.jpg')):
    n=os.path.basename(f);v='m' if n.endswith('-m.jpg') else 'd'
    b=os.path.getsize(f);a=np.asarray(I.open(f).convert('RGB'))
    for q in (85,90):
        buf=io.BytesIO();I.fromarray(a).save(buf,'WEBP',quality=q,method=6);d=buf.getvalue()
        s=ssim(a,np.asarray(I.open(io.BytesIO(d)).convert('RGB')),channel_axis=2)
        t=T.setdefault((v,q),[0,0,99,0,0]);t[0]+=b;t[1]+=len(d);t[2]=min(t[2],s);t[3]=max(t[3],s);t[4]+= (s>=0.985 and len(d)<=0.8*b)
for k,t in sorted(T.items()):print(k,t,f"{100*(1-t[1]/t[0]):.1f}%")
