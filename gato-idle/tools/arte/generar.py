# Genera candidatos con PixelLab (pixflux, 1 generación cada uno) en paralelo y arma un montaje para elegir.
# Uso: python3 -I tools/arte/generar.py tools/arte/personajes.json /tmp/salida
# Lotes: [{"name", "desc", "w", "h", "seeds": [...], opcionales "style", "direction", "init", "strength", "transparent", "guidance"}]
# Los elegidos están en tools/arte/elegidos.json; se recortan y se copian a src/assets/arte.
import base64, json, os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab as pl
from PIL import Image, ImageDraw

STYLE = ', pixel art game sprite, side view, bold black outline, cartoon, vibrant colors'
jobs = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)

def run(job, seed):
    path = f"{out}/{job['name']}_s{seed}.png"
    if os.path.exists(path): return path
    body = {'description': job['desc'] + job.get('style', STYLE), 'image_size': {'width': job['w'], 'height': job['h']},
            'no_background': job.get('transparent', True), 'view': job.get('view', 'side'), 'outline': 'single color black outline', 'seed': seed,
            'text_guidance_scale': job.get('guidance', 8)}
    if job.get('direction'): body['direction'] = job['direction']
    if job.get('init'):
        body['init_image'] = {'type': 'base64', 'base64': base64.b64encode(open(job['init'], 'rb').read()).decode()}
        body['init_image_strength'] = job.get('strength', 300)
    for attempt in range(3):
        code, d = pl.call('POST', '/create-image-pixflux', body)
        if code == 200:
            open(path, 'wb').write(base64.b64decode(pl.find_images(d)[0])); return path
    print('FAIL', job['name'], seed, code, str(d)[:200]); return None

tasks = [(j, s) for j in jobs for s in j['seeds']]
with ThreadPoolExecutor(6) as ex:
    results = list(ex.map(lambda t: run(*t), tasks))

# Montaje: una fila por asset, ampliado ×4 sobre fondo de cuarto.
S = 4
rows = []
for j in jobs:
    ims = [(s, Image.open(f"{out}/{j['name']}_s{s}.png").convert('RGBA')) for s in j['seeds'] if os.path.exists(f"{out}/{j['name']}_s{s}.png")]
    rows.append((j['name'], ims))
W = max(sum(i.width * S + 12 for _, i in ims) for _, ims in rows) + 140
H = sum(max([i.height * S for _, i in ims] or [0]) + 24 for _, ims in rows)
m = Image.new('RGBA', (W, H), (59, 42, 77, 255)); d = ImageDraw.Draw(m); y = 0
for name, ims in rows:
    d.text((4, y + 4), name, fill=(255, 255, 255, 255)); x = 140
    for s, i in ims:
        m.alpha_composite(i.resize((i.width * S, i.height * S), Image.NEAREST), (x, y + 18)); d.text((x, y + 4), f's{s}', fill=(255, 211, 110, 255)); x += i.width * S + 12
    y += max([i.height * S for _, i in ims] or [0]) + 24
m.save(f"{out}/montaje.png"); print('ok', sum(1 for r in results if r))
