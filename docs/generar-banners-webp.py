#!/usr/bin/env python3
"""Fase 22: genera banners/<id>.webp junto a cada banners/<id>.jpg (los JPG NO se tocan ni se borran).
Para cada imagen prueba calidades de 92 a 85 (método 6, sin metadatos) y se queda con la MÁS ALTA que ahorre >= 20 % de bytes
respecto al JPG original. Si ni a q85 ahorra >= 15 %, no genera el .webp (el banner queda en JPG).
Uso (desde la raíz del repo): python3 docs/generar-banners-webp.py [--escribir]
Requiere: pip install pillow numpy scikit-image   (scikit-image solo para el SSIM informativo)"""
import glob,io,os,sys,json,numpy as np,PIL.Image as I
from concurrent.futures import ProcessPoolExecutor
try:
    from skimage.metrics import structural_similarity as ssim
except Exception:
    ssim=None
OBJ=20.0;MIN=15.0;ESCRIBIR='--escribir' in sys.argv
def uno(f):
    b=os.path.getsize(f);a=I.open(f).convert('RGB');sel=None
    for q in range(92,84,-1):
        buf=io.BytesIO();a.save(buf,'WEBP',quality=q,method=6);d=buf.getvalue();ah=100*(1-len(d)/b)
        if ah>=OBJ or (q==85 and ah>=MIN):sel=(q,d,ah);break
    r={'archivo':os.path.basename(f),'jpg':b}
    if not sel:r['webp']=None;return r
    q,d,ah=sel
    r.update(webp=len(d),q=q,ahorro=round(ah,1))
    if ssim:
        c=np.asarray(I.open(io.BytesIO(d)).convert('RGB'));r['ssim']=round(float(ssim(np.asarray(a),c,channel_axis=2)),4)
    if ESCRIBIR:open(f[:-4]+'.webp','wb').write(d)
    return r
if __name__=='__main__':
    with ProcessPoolExecutor(4) as ex:rows=list(ex.map(uno,sorted(glob.glob('banners/*.jpg'))))
    tj=sum(r['jpg'] for r in rows);tw=sum(r['webp'] or r['jpg'] for r in rows)
    for r in rows:print(r)
    print(json.dumps({'total_jpg':tj,'total_con_webp':tw,'ahorro_pct':round(100*(1-tw/tj),1)}))
