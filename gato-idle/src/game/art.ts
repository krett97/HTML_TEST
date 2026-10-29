// Arte de PixelLab: cada PNG de src/assets/arte se carga con la clave de su nombre, que es la misma
// de SPRITES y de "sprite" en objects.json. Lo que no tenga PNG usa el dibujo provisional
// (placeholders.ts). Todo el arte mide ART píxeles por unidad del mundo (ver sceneSize.ts).
import type Phaser from 'phaser';

const URLS = import.meta.glob<string>('../assets/arte/*.png', { eager: true, query: '?url', import: 'default' });

/** Clave de textura → URL del PNG. */
export const ART_FILES: Record<string, string> = Object.fromEntries(
  Object.entries(URLS).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.png'.length), url]),
);

export function loadArt(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(ART_FILES)) scene.load.image(key, url);
}
