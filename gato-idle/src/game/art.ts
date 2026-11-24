// Arte de PixelLab: cada PNG de src/assets/arte se carga con la clave de su nombre, que es la misma
// de SPRITES y de "sprite" en objects.json. Lo que no tenga PNG usa el dibujo provisional
// (placeholders.ts). Todo el arte mide ART píxeles por unidad del mundo (ver sceneSize.ts).
import type Phaser from 'phaser';

import { ES_VECTOR } from '../app/estilo';

const URLS = import.meta.glob<string>('../assets/arte/*.png', { eager: true, query: '?url', import: 'default' });
// Piloto vectorial (tools/vector/dibujar.mjs): lo que tenga versión vectorial la usa; lo demás sigue en pixel art.
const VECTOR = import.meta.glob<string>('../assets/vector/*.png', { eager: true, query: '?url', import: 'default' });

/** Clave de textura → URL del PNG. */
const byKey = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.png'.length), url]));
export const ART_FILES: Record<string, string> = { ...byKey(URLS), ...(ES_VECTOR ? byKey(VECTOR) : {}) };

/** Claves que en el piloto vectorial siguen en pixel art (4 px por unidad): se amplían ×2 al cargar. */
const PIXEL_KEYS: string[] = ES_VECTOR ? Object.keys(byKey(URLS)).filter((key) => !(key in byKey(VECTOR))) : [];

export function loadArt(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(ART_FILES)) scene.load.image(key, url);
}

/**
 * En el piloto vectorial el arte va a 8 px por unidad; lo que aún es pixel art se amplía ×2 sin suavizar
 * (queda igual que antes) para que todo mida lo mismo en el mundo. Llamar en create().
 */
export function upscalePixelArt(scene: Phaser.Scene): void {
  for (const key of PIXEL_KEYS) {
    const source = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const canvas = document.createElement('canvas');
    canvas.width = source.width * 2;
    canvas.height = source.height * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }
}
