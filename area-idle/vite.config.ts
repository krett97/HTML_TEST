import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig(({ mode }) => {
  // `npm run build:archivo`: todo (código, estilos, fuentes e imágenes) en un solo HTML para compartir.
  const singleFile = mode === 'archivo';
  return {
    base: './',
    plugins: [svelte()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      // La versión para compartir se compila con PRUEBAS=no para quitar el panel de pruebas.
      __PRUEBAS__: JSON.stringify(process.env.PRUEBAS !== 'no'),
    },
    build: {
      target: 'es2022',
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
