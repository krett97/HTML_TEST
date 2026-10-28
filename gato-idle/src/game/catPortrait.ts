// Retrato del gato con lo que trae puesto (garras, sombrero, saco), para la viñeta de cómic que
// aparece al estrenar una mejora. Se dibuja con los mismos mapas de píxeles que la escena.
import type { CatLook } from '../app/game';
import { PALETTE, SPRITES } from './sprites';

const W = 34;
const H = 27;

function draw(ctx: CanvasRenderingContext2D, rows: readonly string[], x: number, y: number): void {
  rows.forEach((row, dy) => {
    [...row].forEach((ch, dx) => {
      if (ch === '.') return;
      ctx.fillStyle = PALETTE[ch]!;
      ctx.fillRect(x + dx, y + dy, 1, 1);
    });
  });
}

/** PNG (data URL) del gato a tamaño real; se amplía con CSS (image-rendering: pixelated). */
export function catPortrait(look: CatLook): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const traje = look.saco ? '_saco' : '';
  const bottom = H - 1;
  // Mismas posiciones que en la escena: el gato abajo a la izquierda, la pata estirada al frente.
  draw(ctx, SPRITES[`gato${traje}` as keyof typeof SPRITES], 0, bottom - 16);
  draw(ctx, SPRITES[`${look.garras ? 'garra' : 'pata'}${traje}` as keyof typeof SPRITES], 20, bottom - 9);
  if (look.sombrero) draw(ctx, SPRITES.sombrero, 10, bottom - 15 - 9);
  return canvas.toDataURL();
}
