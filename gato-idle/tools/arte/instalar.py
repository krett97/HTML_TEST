# Instala arte elegido en src/assets/arte: quita motas sueltas, recorta al contenido y guarda con el
# nombre del juego. Los candidatos vienen de generar.py o editar.py (nombre_sSEMILLA.png).
# Uso: python3 -I tools/arte/instalar.py <carpeta de candidatos> src/assets/arte clave=nombre_sN [clave=nombre_sN ...]
#   p. ej. gato=gato96_s33 aliado_gatito=bebe96_s44
# Con "clave=nombre_sN:marco" varios cuadros comparten el mismo recorte (los cuadros del manotazo del gato),
# para que la pose no brinque: el marco es la unión de los contenidos de todos los que llevan ese marco.
import os, sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]

def clean(im):
    """Deja solo los grupos de píxeles grandes (quita motas sueltas de la orilla)."""
    a = im.getchannel('A'); w, h = im.size; seen = set(); groups = []
    for y in range(h):
        for x in range(w):
            if a.getpixel((x, y)) < 40 or (x, y) in seen: continue
            stack = [(x, y)]; seen.add((x, y)); g = []
            while stack:
                cx, cy = stack.pop(); g.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and a.getpixel((nx, ny)) >= 40:
                        seen.add((nx, ny)); stack.append((nx, ny))
            groups.append(g)
    biggest = max(len(g) for g in groups)
    out = im.copy()
    for g in groups:
        if len(g) < max(6, biggest * 0.04):
            for p in g: out.putpixel(p, (0, 0, 0, 0))
    return out

def sin_fondo(im):
    """Si la imagen trae fondo sólido (esquinas opacas), lo vuelve transparente desde las esquinas."""
    from PIL import ImageDraw
    corners = [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]
    if all(im.getpixel(c)[3] < 40 for c in corners): return im
    out = im.copy()
    for c in corners:
        if out.getpixel(c)[3] >= 40: ImageDraw.floodfill(out, c, (0, 0, 0, 0), thresh=36)
    return out

items = []
for arg in sys.argv[3:]:
    key, rest = arg.split('=', 1)
    name, _, frame = rest.partition(':')
    path = f'{SRC}/{name}.png' if not os.path.exists(f'{SRC}/{name}') else f'{SRC}/{name}'
    items.append((key, clean(sin_fondo(Image.open(path).convert('RGBA'))), frame or None))

# Marcos compartidos: la unión de los contenidos.
frames = {}
for key, im, frame in items:
    if not frame: continue
    box = im.getbbox()
    old = frames.get(frame)
    frames[frame] = box if not old else (min(old[0], box[0]), min(old[1], box[1]), max(old[2], box[2]), max(old[3], box[3]))

for key, im, frame in items:
    box = frames[frame] if frame else im.getbbox()
    out = im.crop(box)
    out.save(f'{OUT}/{key}.png')
    print(key, out.size)
