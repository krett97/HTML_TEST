# Alarga una imagen hacia la derecha con relleno de PixelLab (inpaint): para muebles más anchos que
# los 400 px que genera de una vez. Se repite en pasos: cada paso toma una ventana de `ventana` px
# que termina con `paso` px nuevos (en blanco, enmascarados) y PixelLab los pinta siguiendo lo que ya hay.
# Uso: python3 -I tools/arte/extender.py entrada.png salida.png ancho_final "descripción" [semilla] [paso] [ventana]
import base64, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import pixellab as pl

src, out, final_w, desc = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
seed = int(sys.argv[5]) if len(sys.argv) > 5 else 1
step = int(sys.argv[6]) if len(sys.argv) > 6 else 160
window = int(sys.argv[7]) if len(sys.argv) > 7 else 400
b64 = lambda img: base64.b64encode((lambda b: (img.save(b, 'PNG'), b.getvalue())[1])(io.BytesIO())).decode()

im = Image.open(src).convert('RGBA')
while im.width < final_w:
    add = min(step, final_w - im.width)
    canvas = Image.new('RGBA', (im.width + add, im.height), (0, 0, 0, 0))
    canvas.paste(im, (0, 0))
    left = canvas.width - window
    piece = canvas.crop((left, 0, canvas.width, canvas.height))
    mask = Image.new('RGB', piece.size, 'black')
    ImageDraw.Draw(mask).rectangle([piece.width - add - 6, 0, piece.width - 1, piece.height - 1], fill='white')
    body = {'description': desc, 'image_size': {'width': piece.width, 'height': piece.height},
            'inpainting_image': {'type': 'base64', 'base64': b64(piece)}, 'mask_image': {'type': 'base64', 'base64': b64(mask)},
            'no_background': True, 'seed': seed, 'text_guidance_scale': 4}
    res = None
    for _ in range(3):
        code, d = pl.call('POST', '/inpaint', body)
        if isinstance(d, dict) and d.get('background_job_id'):
            d = pl.wait_job(d['background_job_id'])
        imgs = pl.find_images(d.get('last_response', d) if isinstance(d, dict) else d)
        if imgs:
            res = Image.open(io.BytesIO(base64.b64decode(imgs[-1]))).convert('RGBA'); break
        print('reintento', code, str(d)[:200])
    if res is None:
        print('FAIL'); sys.exit(1)
    canvas.paste(res, (left, 0))
    im = canvas
    print('ancho', im.width)
im.save(out); print('ok', out, im.size)
