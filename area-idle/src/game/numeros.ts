// Fuente de mapa de bits para los números de daño, dibujada al arrancar con Fredoka (relleno blanco y
// contorno café). Con cientos de slimes salen decenas de números por segundo: un texto normal se
// redibuja y se sube a la tarjeta de video cada vez; con esta fuente solo se cambian letras ya hechas.
// El color se pone con tinte (multiplica el blanco; el contorno sigue café).
import type Phaser from 'phaser';

export const NUMEROS = 'numeros';
const CHARS = '0123456789.,+-KMBTabcdefghijklmnopqrstuvwxyz∞e';
const PX = 48;
const STROKE = 10;

export function crearFuenteNumeros(scene: Phaser.Scene): void {
  if (scene.cache.bitmapFont.exists(NUMEROS)) return;
  const font = `700 ${PX}px "Fredoka Variable", Fredoka, system-ui, sans-serif`;
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  const pad = STROKE / 2 + 2;
  const h = Math.ceil(PX * 1.25) + pad * 2;
  const widths = [...CHARS].map((c) => Math.ceil(measure.measureText(c).width) + pad * 2);
  const canvas = document.createElement('canvas');
  canvas.width = widths.reduce((a, b) => a + b, 0) + CHARS.length * 2;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = STROKE;
  ctx.strokeStyle = '#3a2518';
  ctx.fillStyle = '#ffffff';

  const chars: Record<number, unknown> = {};
  let x = 0;
  [...CHARS].forEach((c, i) => {
    const w = widths[i]!;
    ctx.strokeText(c, x + pad, h / 2);
    ctx.fillText(c, x + pad, h / 2);
    chars[c.charCodeAt(0)] = {
      x,
      y: 0,
      width: w,
      height: h,
      centerX: Math.floor(w / 2),
      centerY: Math.floor(h / 2),
      xOffset: 0,
      yOffset: 0,
      // Las letras se enciman un poco: el contorno de una tapa la orilla de la otra.
      xAdvance: w - pad * 1.6,
      data: {},
      kerning: {},
      u0: x / canvas.width,
      v0: 1,
      u1: (x + w) / canvas.width,
      v1: 0,
    };
    x += w + 2;
  });
  scene.textures.addCanvas(NUMEROS, canvas);
  scene.cache.bitmapFont.add(NUMEROS, { data: { retroFont: false, font: NUMEROS, size: h, lineHeight: h, chars }, frame: null, texture: NUMEROS });
}
