# Escala ×2 (vecino más cercano) los PNG de src/assets/arte que todavía están a 2 píxeles por unidad,
# para que sigan midiendo lo mismo con ART = 4 (arte en alta definición). Se corrió una sola vez al
# cambiar de resolución; el arte nuevo ya se genera a 4 píxeles por unidad y no debe pasar por aquí.
# Uso: python3 -I tools/arte/escalar.py src/assets/arte
import glob, sys
from PIL import Image
for path in sorted(glob.glob(f'{sys.argv[1]}/*.png')):
    im = Image.open(path)
    im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(path)
    print(path, im.size, '->', (im.width * 2, im.height * 2))
