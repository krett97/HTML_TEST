// Retrato del gato con lo que trae puesto (garras, sombrero, saco), para la viñeta de cómic que
// aparece al estrenar una mejora. Se arma con las mismas texturas que la escena.
import type Phaser from 'phaser';
import type { CatLook } from '../app/game';

type Source = CanvasImageSource & { width: number; height: number };

/** PNG (data URL) del gato a tamaño real; se amplía con CSS (image-rendering: pixelated). */
export function catPortrait(textures: Phaser.Textures.TextureManager, look: CatLook): string {
  const traje = look.saco ? '_saco' : '';
  const image = (key: string) => textures.get(key).getSourceImage() as Source;
  const cat = image(`gato${traje}`);
  const paw = image(`${look.garras ? 'garra' : 'pata'}${traje}`);
  const hat = look.sombrero ? image('sombrero') : null;

  // Mismas posiciones que en la escena (en píxeles de arte): la pata estirada al frente y el
  // sombrero sobre la cabeza.
  const pawX = Math.round(cat.width * 0.6);
  // La orilla de abajo del sombrero queda a 2/3 del alto del gato (como HAT_Y en la escena).
  const hatBottom = Math.round(cat.height * 0.67);
  const top = hat ? Math.max(0, hatBottom + hat.height - cat.height) : 0;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(cat.width, pawX + paw.width);
  canvas.height = top + cat.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;
  const bottom = canvas.height;
  ctx.drawImage(paw, pawX, bottom - Math.round(cat.height / 3) - Math.round(paw.height / 2));
  ctx.drawImage(cat, 0, bottom - cat.height);
  if (hat) ctx.drawImage(hat, Math.round(cat.width / 2 - hat.width / 2), bottom - hatBottom - hat.height);
  return canvas.toDataURL();
}
