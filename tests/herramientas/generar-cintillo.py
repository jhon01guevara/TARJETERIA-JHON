#!/usr/bin/env python3
"""Genera apps/modelos-cintillo.json: los 30 primeros modelos de apps/modelos.js (código, descripción y miniatura 88x88)
para la barra «Modelos» de Inicio (cintChk en js/app.js), sin tener que descargar los 1,6 MB de apps/modelos.js.
Uso (desde la raíz del repo):  python3 tests/herramientas/generar-cintillo.py   (requiere Pillow)
Hay que volver a ejecutarlo si cambian las imágenes o la lista DATA de apps/modelos.js; tests/avisos-fase17.test.js lo comprueba."""
import base64, io, json, re, sys
from PIL import Image
src = open('apps/modelos.js', encoding='utf-8').read()
i = src.index('const IMGS = ') + len('const IMGS = ')
j = src.index('\n', i)
IMGS = json.loads(re.sub(r';\s*$', '', src[i:j]))
k = src.index('const DATA = `') + len('const DATA = `')
DATA = src[k:src.index('`', k)].split('\n')
out = []
for l in DATA:
    p = l.split('|')
    c, cat, d = (p + ['', '', ''])[:3]
    c = c.strip()
    if c and c in IMGS:
        im = Image.open(io.BytesIO(base64.b64decode(IMGS[c].split(',', 1)[1]))).convert('RGB')
        w, h = im.size; s = min(w, h)
        im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((88, 88), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, 'JPEG', quality=72, optimize=True, progressive=False)
        out.append({'n': c, 's': (d or cat or '').strip(), 'i': 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()})
    if len(out) == 30: break
open('apps/modelos-cintillo.json', 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
print(len(out), 'modelos,', sum(len(o['i']) for o in out), 'bytes de imágenes')
