# Vuelve repetible una textura: la recorre medio tamaño (las orillas quedan en una cruz al centro) y
# PixelLab repinta esa cruz (inpaint). Uso: python3 -I tools/arte/sincostura.py entrada.png salida.png "descripción" [semilla] [ancho_banda]
import base64, io, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageChops, ImageDraw
import pixellab as pl

src, out, desc = sys.argv[1], sys.argv[2], sys.argv[3]
seed = int(sys.argv[4]) if len(sys.argv) > 4 else 1
band = int(sys.argv[5]) if len(sys.argv) > 5 else 10
im = Image.open(src).convert('RGBA')
w, h = im.size
rolled = ImageChops.offset(im, w // 2, h // 2)
mask = Image.new('RGB', (w, h), 'black')
d = ImageDraw.Draw(mask)
d.rectangle([w // 2 - band // 2, 0, w // 2 + band // 2 - 1, h - 1], fill='white')
d.rectangle([0, h // 2 - band // 2, w - 1, h // 2 + band // 2 - 1], fill='white')
b64 = lambda img: base64.b64encode((lambda b: (img.save(b, 'PNG'), b.getvalue())[1])(io.BytesIO())).decode()
body = {'description': desc, 'image_size': {'width': w, 'height': h}, 'inpainting_image': {'type': 'base64', 'base64': b64(rolled)},
        'mask_image': {'type': 'base64', 'base64': b64(mask)}, 'no_background': False, 'seed': seed, 'text_guidance_scale': 3}
code, d2 = pl.call('POST', '/inpaint', body)
if isinstance(d2, dict) and d2.get('background_job_id'):
    d2 = pl.wait_job(d2['background_job_id'])
imgs = pl.find_images(d2.get('last_response', d2) if isinstance(d2, dict) else d2)
if not imgs:
    print('FAIL', code, str(d2)[:300]); sys.exit(1)
res = Image.open(io.BytesIO(base64.b64decode(imgs[-1]))).convert('RGBA')
res.save(out); print('ok', out, res.size)
