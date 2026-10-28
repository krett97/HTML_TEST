import { describe, expect, it } from 'vitest';
import { PALETTE, SPRITES, toolLook } from '../src/game/sprites';
import { gameData } from '../src/data';

describe('dibujos provisionales', () => {
  it.each(Object.entries(SPRITES))('%s: filas del mismo ancho y colores conocidos', (_name, rows) => {
    const width = rows[0]!.length;
    for (const row of rows) {
      expect(row.length).toBe(width);
      for (const char of row) expect(char === '.' || char in PALETTE, `color "${char}"`).toBe(true);
    }
  });

  it('cada herramienta tiene un aspecto definido', () => {
    for (const tool of gameData.tools) {
      const look = toolLook(tool.id);
      if (look.vehicle) expect(look.vehicle in SPRITES).toBe(true);
    }
  });
});
