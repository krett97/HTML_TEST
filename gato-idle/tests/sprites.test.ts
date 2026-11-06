import { describe, expect, it } from 'vitest';
import { PALETTE, SPRITES } from '../src/game/sprites';

describe('dibujos provisionales', () => {
  it.each(Object.entries(SPRITES))('%s: filas del mismo ancho y colores conocidos', (_name, rows) => {
    const width = rows[0]!.length;
    for (const row of rows) {
      expect(row.length).toBe(width);
      for (const char of row) expect(char === '.' || char in PALETTE, `color "${char}"`).toBe(true);
    }
  });
});
