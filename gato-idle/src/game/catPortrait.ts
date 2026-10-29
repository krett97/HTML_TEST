// Retrato del gato con lo que trae puesto (garras, sombrero, saco), para la viñeta de cómic que
// aparece al estrenar una mejora: el cuadro del manotazo, que luce las garras. Se arma con las
// mismas texturas que la escena.
import type Phaser from 'phaser';
import type { CatLook } from '../app/game';

type Source = CanvasImageSource & { width: number; height: number };

/**
 * Dónde va el sombrero en el cuadro del manotazo, en píxeles de arte: su centro y su orilla de
 * abajo medida desde los pies (lo mismo que HAT_X/HAT_Y + SWAT_HAT en MainScene, ×2).
 */
const HAT_CENTER_X = 20;
const HAT_BOTTOM = 24;

/** PNG (data URL) del gato a tamaño real; se amplía con CSS (image-rendering: pixelated). */
export function catPortrait(textures: Phaser.Textures.TextureManager, look: CatLook): string {
  const image = (key: string) => textures.get(key).getSourceImage() as Source;
  const cat = image(`gato${look.saco ? '_saco' : ''}${look.garras ? '_garra' : ''}_golpe`);
  const hat = look.sombrero ? image('sombrero') : null;

  const top = hat ? Math.max(0, HAT_BOTTOM + hat.height - cat.height) : 0;
  const canvas = document.createElement('canvas');
  canvas.width = cat.width;
  canvas.height = top + cat.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;
  const bottom = canvas.height;
  ctx.drawImage(cat, 0, bottom - cat.height);
  if (hat) ctx.drawImage(hat, Math.round(HAT_CENTER_X - hat.width / 2), bottom - HAT_BOTTOM - hat.height);
  return canvas.toDataURL();
}
