# Ensancha un mueble ya generado a su ancho real repitiendo la franja vertical más lisa (la que mejor
# se repite sin costura), al estilo 9-slice. Antes recorta al contenido.
# Uso: python3 -I tools/arte/ensanchar.py entrada.png salida.png ancho_final [franja_px]
import sys
from PIL import Image
src, out, final_w = sys.argv[1], sys.argv[2], int(sys.argv[3]); band = int(sys.argv[4]) if len(sys.argv) > 4 else 8
im = Image.open(src).convert('RGBA'); im = im.crop(im.getbbox())
if im.width >= final_w: im.save(out); print(out, im.size); sys.exit()
px = im.load(); W, H = im.size
def col(x): return [px[x, y] for y in range(H)]
def diff(a, b): return sum(abs(p - q) for pa, pb in zip(a, b) for p, q in zip(pa, pb))
cols = [col(x) for x in range(W)]
best = None
for x in range(W // 5, W * 4 // 5 - band):
    # costo: variación dentro de la franja + lo que cambia al repetirla (última vs primera columna)
    c = sum(diff(cols[i], cols[i + 1]) for i in range(x, x + band - 1)) + diff(cols[x + band - 1], cols[x])
    if best is None or c < best[0]: best = (c, x)
x = best[1]; strip = im.crop((x, 0, x + band, H))
res = Image.new('RGBA', (final_w, H), (0, 0, 0, 0)); res.paste(im.crop((0, 0, x + band, H)), (0, 0))
cx = x + band
while cx < final_w - (W - x - band):
    res.paste(strip, (cx, 0)); cx += band
res.paste(im.crop((x + band, 0, W, H)), (final_w - (W - x - band), 0))
res.save(out); print(out, res.size, 'franja en', x)
