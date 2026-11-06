# Muebles en HD (4 px por unidad): cada pieza se genera COMPLETA con pixflux (≤400 px de ancho, el arte
# viejo reducido como guía de forma) y luego ensanchar.py la estira a su ancho real repitiendo la franja
# más lisa. Las piezas chicas (≤256) se redibujan con pixen. Uso: python3 -I tools/arte/muebles_hd.py <salida>
import json, os, subprocess, sys
from PIL import Image
OUT = sys.argv[1]; ARTE = 'src/assets/arte'; os.makedirs(f'{OUT}/var', exist_ok=True)
HD = ", detailed high resolution pixel art, thick dark outline, 3-tone cel shading, vibrant colors, side view, no background"
descs = {j['name']: j['desc'] for f in ('muebles.json', 'mansion.json', 'luna.json') for j in json.load(open(f'tools/arte/{f}'))}
FILES = {'bano_inodoro': 'inodoro'}  # nombre en el json -> archivo mueble_<x>.png
jobs = []
for name, desc in descs.items():
    file = FILES.get(name, name); old = f'{ARTE}/mueble_{file}.png'
    if not os.path.exists(old) or file == 'cocina_barra' or name.split('_')[-1] not in ('mesa', 'mueble', 'repisa', 'cama', 'escritorio', 'inodoro'): continue
    im = Image.open(old).convert('RGBA')
    if im.width <= 256:
        w, h = -(-im.width // 4) * 4, -(-im.height // 4) * 4
        subprocess.run(['python3', '-I', 'tools/arte/editar.py', old, f'{OUT}/var/mueble_{file}', str(w), str(h), f"the same {desc}, redrawn as detailed high resolution pixel art, thick dark outline, 3-tone cel shading, keep the shape and colors", '1', '2'])
        continue
    k = min(1, 400 / im.width); w, h = int(im.width * k), max(32, int(im.height * k))
    w8, h8 = -(-w // 8) * 8, -(-h // 8) * 8
    init = Image.new('RGBA', (w8, h8), (0, 0, 0, 0)); init.paste(im.resize((w, int(im.height * k)), Image.LANCZOS), ((w8 - w) // 2, h8 - int(im.height * k)))
    init.save(f'{OUT}/init_{file}.png')
    jobs.append({"name": f'mueble_{file}', "w": w8, "h": h8, "seeds": [1, 2], "init": f'{OUT}/init_{file}.png', "strength": 90, "guidance": 6, "style": HD, "desc": desc + ", the whole piece of furniture visible with margin around it"})
json.dump(jobs, open(f'{OUT}/muebles.json', 'w'))
subprocess.run(['python3', '-I', 'tools/arte/generar.py', f'{OUT}/muebles.json', f'{OUT}/var'])
print('MUEBLES-LISTOS')
