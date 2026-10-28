import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig(({ mode }) => {
  // `npm run build:archivo`: todo (código, estilos y fuentes) en un solo HTML para compartir.
  const singleFile = mode === 'archivo';
  return {
    // Rutas relativas: el mismo build sirve en Capacitor, en una subcarpeta o en un archivo suelto.
    base: './',
    plugins: [svelte()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      target: 'es2022',
      // Phaser pesa ~1.5 MB; no es un problema para un juego empaquetado.
      chunkSizeWarningLimit: 2500,
      ...(singleFile && {
        outDir: 'dist-archivo',
        assetsInlineLimit: () => true,
        cssCodeSplit: false,
        rolldownOptions: { output: { codeSplitting: false } },
      }),
    },
  };
});
