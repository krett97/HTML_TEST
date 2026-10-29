"""Dibuja la pata del gato (y sus variantes con garras y con manga del saco) con la paleta del
gato de PixelLab. La pata sale de detrás del cuerpo y se estira hasta el objeto, por eso va aparte.
Uso: python3 tools/arte/patas.py  (escribe src/assets/arte/{pata,garra,pata_saco,garra_saco}.png)"""
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / 'src/assets/arte'
C = {
    'k': (0x2c, 0x21, 0x31), 'o': (0xf1, 0xa0, 0x41), 'd': (0xcd, 0x76, 0x29), 'w': (0xfb, 0xf3, 0xd1),
    'p': (0xff, 0xad, 0xb3), 's': (0xd8, 0xe2, 0xee), 'S': (0x8a, 0x94, 0xa6), 'j': (0x26, 0x27, 0x2a),
    'J': (0x0e, 0x11, 0x16), 'c': (0xe8, 0xee, 0xf8),
}
# Brazo de 26×10 (pixeles de arte): rayas naranjas y la pata crema con cojincito rosa.
PAW = [
    '.kkkkkkkkkkkkkkkkkk.......',
    'kooodooooodoooooookwwk....',
    'koooodooooodoooookwwwwk...',
    'kooooodooooodoookwwwwwwk..',
    'kooooooooooooooowwwwppwk..',
    'kooooooooooooooowwwwppwk..',
    'kooooodooooodoookwwwwwwk..',
    'koooodooooodoooookwwwwk...',
    'kooodooooodoooooookwwk....',
    '.kkkkkkkkkkkkkkkkkk.......',
]
# Garras de metal (mejora de crítico): tres uñas que brillan.
CLAWS = {2: 'Sssk', 3: 'k', 4: 'Ssssk', 5: 'Ssssk', 6: 'k', 7: 'Sssk'}

def claws(rows):
    out = []
    for y, row in enumerate(rows):
        if y in CLAWS:
            end = row.rstrip('.')
            row = (end + CLAWS[y]).ljust(len(row) + 4, '.')[: len(row) + 4]
        else:
            row = row + '....'
        out.append(row)
    return out

def sleeve(rows):
    # Manga negra del saco hasta la mitad del brazo, con puño de camisa.
    out = []
    for row in rows:
        r = list(row)
        for x in range(0, 12):
            if r[x] in 'od': r[x] = 'J' if x == 0 else 'j'
        for x in (12, 13):
            if r[x] in 'od': r[x] = 'c'
        out.append(''.join(r))
    return out

def save(rows, name):
    im = Image.new('RGBA', (len(rows[0]), len(rows)), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != '.': im.putpixel((x, y), C[ch] + (255,))
    im.save(OUT / f'{name}.png')

save(PAW, 'pata')
save(claws(PAW), 'garra')
save(sleeve(PAW), 'pata_saco')
save(claws(sleeve(PAW)), 'garra_saco')
