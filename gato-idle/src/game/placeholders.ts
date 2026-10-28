// Arte provisional generado en código. Cuando llegue el arte de PixelApp, se cargan los PNG con
// las mismas claves (las de "sprite" en objects.json y las de SPRITES) y este archivo se borra.
import type Phaser from 'phaser';
import type { ObjectDef } from '../core/data';
import { PALETTE, SPRITES } from './sprites';

type Ctx = CanvasRenderingContext2D;

const K = PALETTE.k!;
const DARK = '#2a2a34';
const SCREEN = '#2e6f8e';
const GLOW = '#5ec4ff';

function pixelTexture(scene: Phaser.Scene, key: string, rows: string[]): void {
  const width = rows[0]!.length;
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
  const channel = (shift: number) => Math.min(255, Math.round(((value >> shift) & 255) * factor));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Rectángulo con contorno, sombra abajo y un brillo a la izquierda. */
function box(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  px(ctx, x, y, w, h, K);
  px(ctx, x + 1, y + 1, w - 2, h - 2, color);
  if (h > 5) px(ctx, x + 1, y + h - 3, w - 2, 2, shade(color, 0.78));
  if (h > 6 && w > 4) px(ctx, x + 2, y + 2, 1, Math.max(1, h - 6), 'rgba(255, 255, 255, 0.5)');
}

/** Círculo con contorno (ventanas de lavadora, bocinas). */
function circle(ctx: Ctx, cx: number, cy: number, r: number, color: string): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r) px(ctx, x, y, 1, 1, d > r - 1 ? K : color);
    }
  }
}

/** Detalles de cada objeto para que se reconozca a simple vista. */
function drawObject(ctx: Ctx, id: string, w: number, h: number, c: string): void {
  switch (id) {
    case 'taza':
      box(ctx, 0, 0, 9, h, c);
      px(ctx, 1, 1, 7, 1, '#6b3a1c'); // café
      px(ctx, 9, 2, 3, 1, K);
      px(ctx, 11, 2, 1, 5, K);
      px(ctx, 9, 6, 3, 1, K);
      return;
    case 'plato':
      px(ctx, 2, 0, w - 4, 1, K);
      px(ctx, 0, 1, w, h - 2, K);
      px(ctx, 1, 1, w - 2, h - 3, c);
      px(ctx, 3, 2, w - 6, 1, shade(c, 0.85));
      px(ctx, 2, h - 1, w - 4, 1, K);
      return;
    case 'control':
      box(ctx, 0, 0, w, h, c);
      px(ctx, 2, 2, 1, 1, '#e5534b');
      for (let x = 5; x < w - 2; x += 2) px(ctx, x, 2, 1, 1, '#9a9aa8');
      return;
    case 'florero':
      box(ctx, 1, 6, w - 2, h - 6, c);
      box(ctx, 3, 3, w - 6, 4, c);
      px(ctx, 4, 0, 2, 3, '#4caf50');
      px(ctx, 2, 0, 2, 2, '#ff8fab');
      px(ctx, 6, 0, 2, 2, '#ff8fab');
      return;
    case 'celular':
      box(ctx, 0, 0, w, h, c);
      px(ctx, 1, 2, w - 2, h - 5, GLOW);
      px(ctx, w / 2 - 1, h - 2, 2, 1, '#9a9aa8');
      return;
    case 'papel':
      box(ctx, 0, 0, w - 2, h, c);
      px(ctx, 2, 1, w - 6, 2, '#d8cfbd');
      px(ctx, 3, 1, 2, 1, '#a07850');
      px(ctx, w - 2, 5, 2, h - 5, c); // la hoja que cuelga
      px(ctx, w - 1, 5, 1, h - 5, K);
      return;
    case 'cojin':
      box(ctx, 0, 0, w, h, c);
      for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) ctx.clearRect(x!, y!, 1, 1);
      px(ctx, w / 2 - 1, h / 2 - 1, 2, 2, shade(c, 0.7));
      return;
    case 'tenis':
      box(ctx, 0, 1, 13, h - 2, c);
      box(ctx, 10, 3, 8, h - 4, c);
      px(ctx, 0, h - 2, w, 2, K);
      px(ctx, 1, h - 2, w - 2, 1, '#e5534b'); // suela
      for (let x = 4; x < 11; x += 2) px(ctx, x, 2, 1, 1, K); // agujetas
      return;
    case 'cortinas':
      px(ctx, 0, 0, w, 2, K);
      box(ctx, 1, 2, w / 2 - 1, h - 2, c);
      box(ctx, w / 2, 2, w / 2 - 1, h - 2, c);
      for (let x = 4; x < w - 2; x += 3) px(ctx, x, 3, 1, h - 5, shade(c, 0.8));
      return;
    case 'sofa':
      box(ctx, 3, 0, w - 6, 11, shade(c, 0.9));
      box(ctx, 0, 9, w, 8, c);
      box(ctx, 0, 5, 6, 12, c);
      box(ctx, w - 6, 5, 6, 12, c);
      px(ctx, 3, h - 3, 3, 3, K);
      px(ctx, w - 6, h - 3, 3, 3, K);
      return;
    case 'colchon':
      box(ctx, 0, 0, w, h, c);
      for (let x = 5; x < w - 2; x += 6) for (let y = 3; y < h - 2; y += 4) px(ctx, x, y, 1, 1, shade(c, 0.7));
      return;
    case 'lampara':
      for (let y = 0; y < 10; y++) px(ctx, 3 - Math.floor(y / 3), y, 8 + 2 * Math.floor(y / 3), 1, y === 0 || y === 9 ? K : c);
      px(ctx, 6, 10, 2, 16, '#9a9aa8');
      box(ctx, 2, h - 4, 10, 4, '#6a6a7a');
      return;
    case 'bocina':
      box(ctx, 0, 0, w, h, c);
      circle(ctx, w / 2, 6, 3, '#6a6a7a');
      circle(ctx, w / 2, 15, 5.5, '#4a4a5a');
      px(ctx, w / 2 - 1, 14, 2, 2, K);
      return;
    case 'consola':
      box(ctx, 0, 0, w, h, c);
      px(ctx, 1, 3, w - 2, 1, DARK);
      px(ctx, w - 4, 5, 2, 1, '#5ec4a8');
      return;
    case 'tv':
      box(ctx, 0, 0, w, h - 3, c);
      px(ctx, 2, 2, w - 4, h - 8, SCREEN);
      px(ctx, 3, 3, 4, 1, GLOW);
      px(ctx, w / 2 - 3, h - 3, 6, 3, K);
      return;
    case 'mesa':
      box(ctx, 0, 0, w, 4, c);
      px(ctx, 2, 4, 3, h - 4, K);
      px(ctx, w - 5, 4, 3, h - 4, K);
      px(ctx, 5, h - 5, w - 10, 2, shade(c, 0.8));
      return;
    case 'librero': {
      box(ctx, 0, 0, w, h, c);
      const books = ['#e5534b', '#5ec4a8', '#ffd36e', '#8e6bbf', '#9fd8ff'];
      for (let shelf = 0; shelf < 3; shelf++) {
        const y = 3 + shelf * 14;
        px(ctx, 1, y + 10, w - 2, 1, K);
        for (let x = 3, i = shelf; x < w - 4; x += 3, i++) px(ctx, x, y + 2 + (i % 2), 2, 8 - (i % 2), books[i % books.length]!);
      }
      return;
    }
    case 'tostadora':
      box(ctx, 0, 2, w, h - 2, c);
      px(ctx, 3, 0, 4, 3, '#e0a458'); // pan
      px(ctx, 9, 0, 4, 3, '#e0a458');
      px(ctx, 3, 2, 4, 1, K);
      px(ctx, 9, 2, 4, 1, K);
      px(ctx, w - 1, 6, 1, 3, K);
      return;
    case 'cafetera':
      box(ctx, 0, 0, w, 6, c);
      box(ctx, 0, 0, 4, h, c);
      box(ctx, 4, 7, w - 4, h - 7, '#9fd8ff');
      px(ctx, 5, 12, w - 6, h - 14, '#6b3a1c');
      return;
    case 'licuadora':
      box(ctx, 1, 0, w - 2, h - 8, '#bfe6ff');
      px(ctx, 1, 0, w - 2, 2, K);
      px(ctx, 3, 8, w - 6, 6, '#ff8fab'); // licuado de fresa
      box(ctx, 0, h - 8, w, 8, c);
      px(ctx, 3, h - 5, 2, 2, '#e5534b');
      px(ctx, 7, h - 5, 2, 2, '#5ec4a8');
      return;
    case 'microondas':
      box(ctx, 0, 0, w, h, c);
      px(ctx, 2, 2, w - 9, h - 4, DARK);
      px(ctx, 3, 3, 3, 1, '#3a3a46');
      for (let y = 3; y < h - 3; y += 3) px(ctx, w - 5, y, 2, 1, '#6a6a7a');
      return;
    case 'computadora':
      box(ctx, 0, 0, w, h - 4, c);
      px(ctx, 2, 2, w - 4, h - 9, SCREEN);
      px(ctx, 3, 3, 5, 1, GLOW);
      px(ctx, w / 2 - 2, h - 4, 4, 2, K);
      px(ctx, w / 2 - 6, h - 2, 12, 2, K);
      return;
    case 'lavadora':
    case 'secadora':
      box(ctx, 0, 0, w, h, c);
      px(ctx, 1, 1, w - 2, 6, shade(c, 0.85));
      px(ctx, 3, 3, 3, 2, '#5ec4a8');
      px(ctx, w - 8, 3, 4, 2, K);
      circle(ctx, w / 2, h / 2 + 4, id === 'lavadora' ? 9 : 8, id === 'lavadora' ? SCREEN : '#4a4a5a');
      return;
    case 'estufa':
      box(ctx, 0, 0, w, h, c);
      for (let x = 4; x < w - 3; x += 6) px(ctx, x, 2, 2, 2, K); // perillas
      px(ctx, 3, 7, w - 6, 1, K); // jaladera
      box(ctx, 4, 10, w - 8, h - 14, DARK);
      return;
    case 'refri':
      box(ctx, 0, 0, w, h, c);
      px(ctx, 1, 16, w - 2, 1, K);
      px(ctx, w - 5, 5, 2, 8, '#9a9aa8');
      px(ctx, w - 5, 20, 2, 14, '#9a9aa8');
      px(ctx, 5, 24, 4, 3, '#e5534b'); // imán
      return;
    default:
      box(ctx, 0, 0, w, h, c);
  }
}

function objectTexture(scene: Phaser.Scene, obj: ObjectDef): void {
  const spec = obj.placeholder ?? { w: 12, h: 12, color: '#cccccc' };
  const canvas = scene.textures.createCanvas(obj.sprite, spec.w, spec.h)!;
  drawObject(canvas.getContext(), obj.id, spec.w, spec.h, spec.color);
  canvas.refresh();
}

export function createPlaceholders(scene: Phaser.Scene, objects: ObjectDef[]): void {
  for (const [key, rows] of Object.entries(SPRITES)) {
    if (!scene.textures.exists(key)) pixelTexture(scene, key, rows);
  }
  for (const obj of objects) {
    if (!scene.textures.exists(obj.sprite)) objectTexture(scene, obj);
  }
  // Un píxel blanco para las partículas (se tiñe del color de cada objeto).
  if (!scene.textures.exists('px')) {
    const px2 = scene.textures.createCanvas('px', 2, 2)!;
    px2.getContext().fillStyle = '#ffffff';
    px2.getContext().fillRect(0, 0, 2, 2);
    px2.refresh();
  }
}

