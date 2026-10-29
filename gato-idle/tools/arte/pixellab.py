# Cliente mínimo de la API de PixelLab (v2). La llave NUNCA va en el repositorio: se toma de la
# variable de entorno PIXELLAB_TOKEN (o la inyecta el proxy del entorno en la nube).
import base64, json, os, subprocess, sys, time

API = 'https://api.pixellab.ai/v2'

def call(method, path, body=None):
    cmd = ['curl', '-sS', '-m', '300', '-X', method, API + path, '-H', 'Content-Type: application/json', '-w', '\n%{http_code}']
    if os.environ.get('PIXELLAB_TOKEN'):
        cmd += ['-H', 'Authorization: Bearer ' + os.environ['PIXELLAB_TOKEN']]
    if body is not None:
        cmd += ['--data-binary', '@-']
    out = subprocess.run(cmd, input=json.dumps(body).encode() if body is not None else None, capture_output=True).stdout.decode()
    text, _, code = out.rpartition('\n')
    try:
        data = json.loads(text)
    except Exception:
        data = text
    return int(code or 0), data

def wait_job(job_id, every=4, limit=300):
    t0 = time.time()
    while time.time() - t0 < limit:
        code, data = call('GET', f'/background-jobs/{job_id}')
        st = data.get('status') if isinstance(data, dict) else None
        if st in ('completed', 'failed', 'error', 'cancelled'):
            return data
        time.sleep(every)
    return {'status': 'timeout'}

def find_images(obj, acc=None):
    """Busca recursivamente blobs base64 de imagen en la respuesta."""
    if acc is None: acc = []
    if isinstance(obj, dict):
        if obj.get('type') == 'base64' and 'base64' in obj:
            acc.append(obj['base64'])
        else:
            for v in obj.values(): find_images(v, acc)
    elif isinstance(obj, list):
        for v in obj: find_images(v, acc)
    elif isinstance(obj, str) and obj.startswith('data:image'):
        acc.append(obj.split(',', 1)[1])
    return acc

def save_images(resp, prefix):
    paths = []
    for i, b in enumerate(find_images(resp)):
        p = f'{prefix}_{i}.png'
        open(p, 'wb').write(base64.b64decode(b))
        paths.append(p)
    return paths

def strip(obj):
    if isinstance(obj, dict):
        return {k: ('<b64>' if k == 'base64' else strip(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [strip(v) for v in obj]
    if isinstance(obj, str) and len(obj) > 200:
        return obj[:60] + '...'
    return obj
