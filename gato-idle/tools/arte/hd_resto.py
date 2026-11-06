# Pasa a HD (4 px por unidad) lo que falta: objetos, jefes y cuartos, a partir del arte viejo
# (escalado ×2) como guía de forma. Objetos y cuadros/ventanas ≤256 px: edit-image-pixen (redibuja
# respetando la forma). Lo más grande (jefes, objetos y muebles anchos): pixflux con init_image;
# los muebles anchos se parten en dos mitades (pixen) con la misma semilla y se vuelven a unir.
# Uso: python3 -I tools/arte/hd_resto.py <salida> [solo:objetos|jefes|cuartos]
import json, os, subprocess, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]; SOLO = sys.argv[2] if len(sys.argv) > 2 else None
ARTE = 'src/assets/arte'
HD = ", detailed high resolution pixel art, thick dark outline, 3-tone cel shading, vibrant colors, no background"
def run(cmd): subprocess.run(cmd)
def pixen(src, prefix, desc, seeds=(1, 2)):
    im = Image.open(src); w, h = -(-im.width // 4) * 4, -(-im.height // 4) * 4
    run(['python3', '-I', 'tools/arte/editar.py', src, prefix, str(w), str(h), desc, *map(str, seeds)])
def pixflux_init(jobs, folder):
    path = f'{OUT}/{folder}.json'; json.dump(jobs, open(path, 'w')); run(['python3', '-I', 'tools/arte/generar.py', path, f'{OUT}/{folder}'])
def padded(src, dst):
    im = Image.open(src).convert('RGBA'); w, h = -(-im.width // 8) * 8, -(-im.height // 8) * 8
    pad = Image.new('RGBA', (w, h), (0, 0, 0, 0)); pad.paste(im, ((w - im.width) // 2, h - im.height)); pad.save(dst); return w, h

os.makedirs(f'{OUT}/var', exist_ok=True)
# ---- Objetos (fuera del departamento) ----
if SOLO in (None, 'objetos'):
    big = []
    for o in json.load(open('src/data/objects.json')):
        if o['casa'] == 'departamento': continue
        src = f"{ARTE}/{o['sprite']}.png"; im = Image.open(src)
        desc = f"the same {o['id']} redrawn as detailed high resolution pixel art game item, thick dark outline, 3-tone cel shading, vibrant colors, keep the shape, the colors and the joke"
        if max(im.size) <= 256: pixen(src, f"{OUT}/var/{o['sprite']}", desc)
        else:
            w, h = padded(src, f"{OUT}/init_{o['sprite']}.png")
            big.append({"name": o['sprite'], "w": w, "h": h, "seeds": [1, 2], "init": f"{OUT}/init_{o['sprite']}.png", "strength": 90, "desc": f"{o['id']}, same object and colors as the reference" + HD})
    if big: pixflux_init(big, 'objetos_grandes')
# ---- Jefes ----
if SOLO in (None, 'jefes'):
    DESC = {'pepino': "giant angry cucumber monster boss with a furious face, muscular arms, menacing pose, funny meme",
            'industrial': "giant industrial vacuum cleaner robot boss with an angry face on its tank, hose arms, menacing, funny meme",
            'veterinario': "evil space veterinarian in a white spacesuit holding a giant syringe, menacing grin, funny meme"}
    jobs = []
    for bid, desc in DESC.items():
        for suf, extra, seeds in [('', ', menacing pose', [1, 2, 3]), ('_derrotado', ', defeated, dizzy spiral eyes, slumped and tired', [1, 2])]:
            name = f'jefe_{bid}{suf}'; w, h = padded(f'{ARTE}/{name}.png', f'{OUT}/init_{name}.png')
            jobs.append({"name": name, "w": w, "h": h, "seeds": seeds, "direction": "east", "init": f"{OUT}/init_{name}.png", "strength": 110, "desc": desc + extra + HD})
    pixflux_init(jobs, 'jefes')
# ---- Cuartos ----
if SOLO in (None, 'cuartos'):
    cuartos = {j['name']: j for j in json.load(open('tools/arte/cuartos.json'))}
    muebles = {j['name']: j for j in json.load(open('tools/arte/muebles.json'))}
    for extra in ('tools/arte/casa.json', 'tools/arte/mansion.json', 'tools/arte/luna.json'):
        if os.path.exists(extra):
            for j in json.load(open(extra)):
                (muebles if j['name'].split('_')[-1] in ('barra', 'mesa', 'mueble', 'repisa', 'cama', 'escritorio', 'inodoro') else cuartos).setdefault(j['name'], j)
    rooms = ['sala', 'bano', 'recamara', 'lavado', 'jardin', 'estudio', 'cochera', 'salon', 'cine', 'alberca', 'cohete', 'labluna', 'superficie']
    TEX = ", detailed high resolution pixel art texture, flat front view, cozy cartoon game, seamless repeating tile, even lighting, no vignette, fills the whole image"
    tiles = []
    for room in rooms:
        for kind in ('pared', 'piso'):
            key = f'{room}_{kind}'; old = f'{ARTE}/{kind}_{room}.png'
            if not os.path.exists(old): continue
            base = f'tools/arte/bases/base_{key}.png'
            init = base if os.path.exists(base) else old
            im = Image.open(init); im.resize((128, 128), Image.NEAREST).save(f'{OUT}/init_{key}.png')
            desc = cuartos.get(key, cuartos.get(key + '_k60', {})).get('desc', f'{room} {kind} texture')
            tiles.append({"name": key, "w": 128, "h": 128, "seeds": [1, 2], "transparent": False, "init": f"{OUT}/init_{key}.png", "strength": 60, "guidance": 6, "style": TEX, "desc": desc})
        for kind in ('ventana', 'cuadro'):
            old = f'{ARTE}/{kind}_{room}.png'
            if os.path.exists(old):
                desc = cuartos.get(f'{room}_{kind}', {}).get('desc', f'{room} {kind}')
                pixen(old, f'{OUT}/var/{kind}_{room}', f"the same {desc}, redrawn as detailed high resolution pixel art, thick dark outline, 3-tone cel shading, vibrant colors, keep the shape")
    if tiles: pixflux_init(tiles, 'tiles')
    # Muebles: mitades ≤256 con la misma semilla.
    for name, j in muebles.items():
        old = f'{ARTE}/mueble_{name}.png'
        if not os.path.exists(old) or name == 'cocina_barra': continue
        im = Image.open(old).convert('RGBA'); desc = f"the same {j['desc']}, redrawn as detailed high resolution pixel art, thick dark outline, 3-tone cel shading, keep the shape and colors"
        if im.width <= 256: pixen(old, f'{OUT}/var/mueble_{name}', desc, (1,)); continue
        half = -(-im.width // 2 // 4) * 4
        for side, box in (('izq', (0, 0, half, im.height)), ('der', (im.width - half, 0, im.width, im.height))):
            im.crop(box).save(f'{OUT}/mitad_{name}_{side}.png'); pixen(f'{OUT}/mitad_{name}_{side}.png', f'{OUT}/var/mueble_{name}_{side}', desc, (1,))
print('HD-RESTO-LISTO')
