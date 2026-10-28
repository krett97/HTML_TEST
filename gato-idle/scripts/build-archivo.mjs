// Junta el build de `vite build --mode archivo` en un solo HTML (dist-archivo/swat-to-the-moon.html)
// que se abre sin servidor: sirve para mandar una prueba por mensaje o subirla a cualquier lado.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-archivo';
let html = readFileSync(join(dir, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/, (_, file) => {
  const css = readFileSync(join(dir, file), 'utf8');
  return `<style>\n${css}\n</style>`;
});
html = html.replace(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/, (_, file) => {
  // "</script" dentro del código cerraría la etiqueta antes de tiempo.
  const js = readFileSync(join(dir, file), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">\n${js}\n</script>`;
});

if (/src="\.\/assets|href="\.\/assets/.test(html)) {
  throw new Error('Quedaron referencias a archivos sueltos en el HTML');
}
const out = join(dir, 'swat-to-the-moon.html');
writeFileSync(out, html);
console.log(`${out}: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
