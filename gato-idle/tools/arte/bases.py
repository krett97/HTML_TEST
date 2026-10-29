# Patrones base repetibles (64×64) que PixelLab pinta encima (init_image, fuerza 60) para las paredes y pisos.
# Uso: python3 -I tools/arte/bases.py tools/arte/bases
import sys
from PIL import Image, ImageDraw
OUT = sys.argv[1]  # p. ej. tools/arte/bases
def hexc(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def new(c): return Image.new('RGB', (64, 64), hexc(c))
def save(im, name): im.save(f'{OUT}/base_{name}.png')

# cocina piso: ajedrez gris
im = new('#9aa0aa'); d = ImageDraw.Draw(im)
for y in range(0, 64, 16):
    for x in range(0, 64, 16):
        if (x // 16 + y // 16) % 2: d.rectangle([x, y, x + 15, y + 15], fill=hexc('#6a6f7a'))
save(im, 'cocina_piso')
# sala pared: tapiz morado con rombos
im = new('#3b2a4d'); d = ImageDraw.Draw(im)
for cx, cy in [(16, 16), (48, 48), (48, 16), (16, 48)]:
    col = '#4a3660' if (cx + cy) % 64 == 32 else '#45325a'
    d.polygon([(cx, cy - 10), (cx + 8, cy), (cx, cy + 10), (cx - 8, cy)], fill=hexc(col))
for x in (0, 32): d.line([(x, 0), (x, 63)], fill=hexc('#33244a'))
save(im, 'sala_pared')
# sala piso / estudio piso: tablas de madera horizontales
for name, a, b, line in [('sala_piso', '#7a5540', '#6b4a3a', '#4e3326'), ('estudio_piso', '#4a3434', '#433030', '#2e2020')]:
    im = new(a); d = ImageDraw.Draw(im)
    for i, y in enumerate(range(0, 64, 16)):
        d.rectangle([0, y, 63, y + 15], fill=hexc(a if i % 2 else b))
        d.line([(0, y), (63, y)], fill=hexc(line))
        off = 0 if i % 2 else 32
        d.line([(off + 10, y), (off + 10, y + 15)], fill=hexc(line))
    save(im, name)
# baño piso: losetas azul grisáceo
im = new('#8fa3b0'); d = ImageDraw.Draw(im)
for v in range(0, 64, 16):
    d.line([(v, 0), (v, 63)], fill=hexc('#74889a')); d.line([(0, v), (63, v)], fill=hexc('#74889a'))
save(im, 'bano_piso')
# recámara piso: alfombra
im = new('#6b3a4a'); d = ImageDraw.Draw(im)
for y in range(2, 64, 6):
    for x in range((y // 6) % 2 * 4, 64, 8): d.point((x, y), fill=hexc('#5a2f3e'))
save(im, 'recamara_piso')
# lavado pared: azulejo gris; lavado piso: losetas grises grandes
im = new('#3a3f4a'); d = ImageDraw.Draw(im)
for v in range(0, 64, 16):
    d.line([(v, 0), (v, 63)], fill=hexc('#30343d')); d.line([(0, v), (63, v)], fill=hexc('#30343d'))
save(im, 'lavado_pared')
im = new('#5a5f68'); d = ImageDraw.Draw(im)
for v in (0, 32):
    d.line([(v, 0), (v, 63)], fill=hexc('#4a4e56')); d.line([(0, v), (63, v)], fill=hexc('#4a4e56'))
save(im, 'lavado_piso')
# jardín piso: pasto
im = new('#5f9e3f'); d = ImageDraw.Draw(im)
for y in range(1, 64, 5):
    for x in range((y // 5) % 2 * 3, 64, 7): d.line([(x, y), (x, y + 1)], fill=hexc('#4a8030'))
save(im, 'jardin_piso')
# estudio pared: espuma acústica a cuadros
im = new('#2a2140'); d = ImageDraw.Draw(im)
for y in range(0, 64, 16):
    for x in range(0, 64, 16):
        dark = (x // 16 + y // 16) % 2
        d.rectangle([x + 1, y + 1, x + 14, y + 14], fill=hexc('#332850' if dark else '#2e2448'))
save(im, 'estudio_pared')
# cochera piso: concreto
im = new('#8a8d93'); d = ImageDraw.Draw(im)
d.line([(0, 31), (63, 31)], fill=hexc('#7a7d83')); d.line([(0, 63), (63, 63)], fill=hexc('#7a7d83'))
d.line([(31, 0), (31, 63)], fill=hexc('#7a7d83'))
save(im, 'cochera_piso')
