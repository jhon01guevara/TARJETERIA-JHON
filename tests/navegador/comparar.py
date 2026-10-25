#!/usr/bin/env python3
"""Compara dos carpetas de recorrido.js (antes/después): consola nueva, CSP, huellas de texto y diferencia de píxeles por captura.
Uso: python3 comparar.py /tmp/antes /tmp/despues"""
import json, sys, os, re
from PIL import Image, ImageChops
a, b = sys.argv[1:3]
A = json.load(open(a + '/resultado.json')); B = json.load(open(b + '/resultado.json'))
norm = lambda k: re.sub(r'\?v=[\w-]+', '', re.sub(r'http://localhost:\d+/', '', k))
for D in (A, B):
    for r in D['roles'].values(): r['consola'] = {norm(k).split(' at ')[0]: v for k, v in r['consola'].items()}
mal = 0
for rol in B['roles']:
    x, y = A['roles'][rol], B['roles'][rol]
    print('==', rol)
    nuevos = [k for k in y['consola'] if k not in x['consola']]
    quitados = [k for k in x['consola'] if k not in y['consola']]
    print('  consola: antes', len(x['consola']), '(%d)' % sum(x['consola'].values()), 'después', len(y['consola']), '(%d)' % sum(y['consola'].values()))
    for k in nuevos: print('  NUEVO en consola:', k); mal += 1
    for k in quitados: print('  desaparece:', k)
    print('  CSP antes/después:', len(x['csp']) + len(x['cspTienda']), len(y['csp']) + len(y['cspTienda']))
    if len(y['csp']) + len(y['cspTienda']) > len(x['csp']) + len(x['cspTienda']): mal += 1; print('  CSP NUEVA', y['csp'], y['cspTienda'])
    print('  pageerrors antes/después:', len(x['pageerrors']), len(y['pageerrors']))
    if len(y['pageerrors']) > len(x['pageerrors']): mal += 1
    print('  cintillo antes/después:', x['cintillo'], y['cintillo'])
    for k in y['pantallas']:
        px, py = x['pantallas'].get(k), y['pantallas'][k]
        if 'error' in py: print('  PANTALLA FALLA', k, py); mal += 1; continue
        if px != py: print('  texto distinto en', k, px, py)
    for f in sorted(os.listdir(b)):
        if not f.endswith('.png') or not os.path.exists(a + '/' + f): continue
        i1 = Image.open(a + '/' + f).convert('RGB'); i2 = Image.open(b + '/' + f).convert('RGB')
        if i1.size != i2.size: print('  captura', f, 'tamaño distinto', i1.size, i2.size); continue
        d = ImageChops.difference(i1, i2).convert('L').point(lambda v: 255 if v > 24 else 0)
        n = sum(1 for v in d.getdata() if v); r = 100.0 * n / (i1.size[0] * i1.size[1])
        if r > 0.5: print('  captura %-45s difiere %.2f %%' % (f, r))
print('RESULTADO:', 'HAY DIFERENCIAS A REVISAR (%d)' % mal if mal else 'sin consola/CSP/pantallas nuevas')
