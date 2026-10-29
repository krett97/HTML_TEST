# Edita una imagen con edit-image-pixen (respeta pose y cara). Uso: python3 -I tools/arte/editar.py fuente.png salida_prefijo ancho alto "descripción" semillas...
import base64, io, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import pixellab as pl

src, prefix, W, H, desc = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
seeds = [int(x) for x in sys.argv[6:]]
im = Image.open(src).convert('RGBA')
# Pixen pide lados múltiplos de 4: se rellena con transparente (nunca se reescala).
w4, h4 = -(-im.width // 4) * 4, -(-im.height // 4) * 4
pad = Image.new('RGBA', (w4, h4), (0, 0, 0, 0)); pad.paste(im, (0, h4 - im.height))
buf = io.BytesIO(); pad.save(buf, 'PNG')
b64 = base64.b64encode(buf.getvalue()).decode()

def run(seed):
    out = f'{prefix}_s{seed}.png'
    if os.path.exists(out): return out
    for _ in range(3):
        code, d = pl.call('POST', '/edit-image-pixen', {'image': {'type': 'base64', 'base64': b64}, 'description': desc,
                                                         'width': W, 'height': H, 'seed': seed, 'no_background': True})
        if isinstance(d, dict) and d.get('background_job_id'):
            d = pl.wait_job(d['background_job_id'])
        imgs = pl.find_images(d.get('last_response', d) if isinstance(d, dict) else d)
        if imgs:
            open(out, 'wb').write(base64.b64decode(imgs[0])); return out
    print('FAIL', seed, str(d)[:200])

with ThreadPoolExecutor(4) as ex:
    print(list(ex.map(run, seeds)))
