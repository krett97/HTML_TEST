# Copia los íconos elegidos (semilla por nombre) de una carpeta de candidatos a src/assets/iconos: quita puntitos sueltos,
# recorta y centra en un cuadrado; los aliados, el gato, el sombrero, el carrito y la aspiradora salen de su arte del juego.
# Uso: python3 -I tools/arte/iconos.py <carpeta de candidatos> src/assets/iconos src/assets/arte
import sys
from PIL import Image
SRC = sys.argv[1]; OUT = sys.argv[2]; ARTE = sys.argv[3]
PICKS = dict(mejoras=1, laboratorio=1, canal=1, ajustes=1, fuerza=2, valor=1, critico=1, saco=1, marca=1, trofeo=1, candado=1, check=2,
             seguidores=2, visualizaciones=1, anuncio=2, mudanza=1, viral=1, subir=2, reiniciar=1, microscopio=1, mano=1, pregunta=1, dps=1,
             reloj=2, claqueta=1, pesas=1, esmalte=1, huellas=1, croquetas=1, estetoscopio=1, apreton=1, susto=1, miniatura=2, hashtag=2, pepino=3, calavera=1, maquinita=1, pescado=9, corona=1, ficha=1, pelos=2)

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

def square(im, pad=1):
    im = im.crop(im.getbbox()); side = max(im.size) + 2 * pad
    sq = Image.new('RGBA', (side, side)); sq.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2)); return sq

for name, seed in PICKS.items():
    square(clean(Image.open(f'{SRC}/{name}_s{seed}.png').convert('RGBA'))).save(f'{OUT}/{name}.png')
# Del arte del juego: los aliados, el gato, el sombrero, el carrito y la aspiradora.
for name, src in dict(gatito='aliado_gatito', raton='aliado_raton', perro='aliado_perro', perico='aliado_perico', cuervo='aliado_cuervo',
                      mapache='aliado_mapache', cabra='aliado_cabra', gato='gato', sombrero='sombrero', carrito='carrito', aspiradora='aspiradora', vaso='obj_vaso').items():
    square(Image.open(f'{ARTE}/{src}.png').convert('RGBA')).save(f'{OUT}/{name}.png')
print('ok')
