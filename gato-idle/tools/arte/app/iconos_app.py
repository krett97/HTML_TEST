# Arma los íconos de la app desde tools/arte/app/icono.png (PixelLab, 128×128, el gato pegado a la cámara a punto de
# darle al vaso; base.png es el boceto que se le dio como init_image, fuerza 45). Uso: python3 -I tools/arte/app/iconos_app.py
import os
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
art = Image.open(os.path.join(HERE, 'icono.png')).convert('RGBA')
# Primero ×4 sin suavizar (para que el pixel art quede nítido) y de ahí a cada tamaño.
big = art.resize((art.width * 4, art.height * 4), Image.NEAREST)
def at(size): return big.resize((size, size), Image.LANCZOS)
def rounded(img, radius):
    mask = Image.new('L', img.size, 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius, fill=255)
    out = Image.new('RGBA', img.size); out.paste(img, (0, 0), mask); return out
def circle(img):
    mask = Image.new('L', img.size, 0); ImageDraw.Draw(mask).ellipse([0, 0, img.width - 1, img.height - 1], fill=255)
    out = Image.new('RGBA', img.size); out.paste(img, (0, 0), mask); return out
bg = art.getpixel((1, 1))
DENS = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for d, size in DENS.items():
    res = os.path.join(ROOT, 'android/app/src/main/res', f'mipmap-{d}')
    rounded(at(size), size // 6).save(os.path.join(res, 'ic_launcher.png'))
    circle(at(size)).save(os.path.join(res, 'ic_launcher_round.png'))
    # Ícono adaptable: 108 dp con el dibujo al 82 % (lo de afuera lo recorta la máscara del teléfono).
    fg_size = size * 108 // 48; inner = int(fg_size * 0.82)
    # El margen repite las orillas del dibujo, para que no se note un recuadro.
    pad = (fg_size - inner) // 2
    fg = Image.fromarray(np.pad(np.array(at(inner)), ((pad, fg_size - inner - pad), (pad, fg_size - inner - pad), (0, 0)), mode='edge'))
    fg.save(os.path.join(res, 'ic_launcher_foreground.png'))
    rounded(at(size), size // 6).save(os.path.join(ROOT, 'apk-prueba/res', f'mipmap-{d}', 'ic_launcher.png'))
with open(os.path.join(ROOT, 'android/app/src/main/res/values/ic_launcher_background.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n' % bg[:3])
rounded(at(192), 32).save(os.path.join(ROOT, 'public/icono.png'))
at(512).save(os.path.join(ROOT, 'tools/arte/app/icono-512.png'))
print('ok, fondo', '#%02X%02X%02X' % bg[:3])
