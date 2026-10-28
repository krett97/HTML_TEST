// Arte provisional generado en código. Cuando llegue el arte de PixelApp, se cargan los PNG con
// las mismas claves (las de "sprite" en objects.json, "gato", "pata") y este archivo se borra.
import type Phaser from 'phaser';
import type { ObjectDef } from '../core/data';

const PALETTE: Record<string, string> = {
  k: '#2b1d2f', // contorno
  o: '#f28c28', // naranja
  d: '#c4621a', // rayas
  w: '#fff1e0', // blanco
  p: '#ff8fab', // nariz y cojinetes
  e: '#1a1020', // ojo
};

// Gato naranja sentado, de perfil, mirando a la derecha (hacia la orilla).
const CAT = [
  '...........k....k...',
  '..........kok..kok..',
  '..........koooooook.',
  '..........kooooeook.',
  '..........koooowwwp.',
  '..........koooowwwk.',
  '...........kooowwk..',
  '.....kkkkkkooowwk...',
  '....kooddooooowwwk..',
  '...koooooddoooowwk..',
  'k..kooddoooooooowk..',
  'k.koooooddooooooowk.',
  'kokooddoooooooooowk.',
  'kokooooooooooooowk..',
  'kkkoooookooooowwk...',
  '...kwwkkkkkkkwwk....',
];

// Brazo con la patita blanca en la punta; sale del pecho del gato en cada manotazo.
const PAW = [
  'kkkkkkkkk.',
  'oooooowwwk',
  'oooooowpwk',
  'kkkkkkkkk.',
];

function pixelTexture(scene: Phaser.Scene, key: string, rows: string[]): void {
  const width = rows[0]!.length;
  if (rows.some((row) => row.length !== width)) throw new Error(`placeholder "${key}": filas de distinto ancho`);
  const canvas = scene.textures.createCanvas(key, width, rows.length)!;
  const ctx = canvas.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const color = PALETTE[char];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  canvas.refresh();
}

function shade(hex: string, factor: number): string {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * factor);
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/** Rectángulo con contorno, una franja de sombra y un brillo: suficiente para distinguir objetos. */
function objectTexture(scene: Phaser.Scene, obj: ObjectDef): void {
  const spec = obj.placeholder ?? { w: 12, h: 12, color: '#cccccc' };
  const canvas = scene.textures.createCanvas(obj.sprite, spec.w, spec.h)!;
  const ctx = canvas.getContext();
  ctx.fillStyle = PALETTE.k!;
  ctx.fillRect(0, 0, spec.w, spec.h);
  ctx.fillStyle = spec.color;
  ctx.fillRect(1, 1, spec.w - 2, spec.h - 2);
  ctx.fillStyle = shade(spec.color, 0.75);
  ctx.fillRect(1, spec.h - 3, spec.w - 2, 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillRect(2, 2, 1, Math.max(1, spec.h - 6));
  canvas.refresh();
}

export function createPlaceholders(scene: Phaser.Scene, objects: ObjectDef[]): void {
  pixelTexture(scene, 'gato', CAT);
  pixelTexture(scene, 'pata', PAW);
  for (const obj of objects) {
    if (!scene.textures.exists(obj.sprite)) objectTexture(scene, obj);
  }
  // Un píxel blanco para las partículas (se tiñe del color de cada objeto).
  const px = scene.textures.createCanvas('px', 2, 2)!;
  px.getContext().fillStyle = '#ffffff';
  px.getContext().fillRect(0, 0, 2, 2);
  px.refresh();
}
