import { describe, expect, it } from 'vitest';
import { parseGameData } from '../src/core/data';
import { gameData } from '../src/data';
import objects from '../src/data/objects.json';
import tools from '../src/data/tools.json';
import balance from '../src/data/balance.json';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';

describe('datos de balance', () => {
  it('los JSON del juego son válidos', () => {
    expect(gameData.objects.length).toBe(11);
    expect(gameData.tools.map((t) => t.id)).toEqual(['pata', 'garras', 'carrito', 'aspiradora']);
  });

  it('cada objeto vale más y aguanta más que el anterior', () => {
    for (let i = 1; i < gameData.objects.length; i++) {
      const prev = gameData.objects[i - 1]!;
      const obj = gameData.objects[i]!;
      expect(obj.hp.gt(prev.hp), obj.id).toBe(true);
      expect(obj.vistas.gt(prev.vistas), obj.id).toBe(true);
    }
  });

  it('cada objeto tiene nombre en todos los idiomas', () => {
    for (const obj of gameData.objects) {
      expect(es.objetos, obj.id).toHaveProperty(obj.id);
      expect(en.objetos, obj.id).toHaveProperty(obj.id);
    }
  });

  it('detecta errores de captura', () => {
    const repeated = [...objects, objects[0]];
    expect(() => parseGameData({ objects: repeated, tools, balance })).toThrow(/id repetido/);

    const badTool = [{ ...objects[0], herramienta: 'lanzallamas' }];
    expect(() => parseGameData({ objects: badTool, tools, balance })).toThrow(/no existe/);

    const badStyle = [{ ...objects[0], estiloRotura: 'explotar' }];
    expect(() => parseGameData({ objects: badStyle, tools, balance })).toThrow(/estiloRotura/);

    const noHp = [{ ...objects[0], hp: 0 }];
    expect(() => parseGameData({ objects: noHp, tools, balance })).toThrow(/mayor que 0/);
  });
});

describe('textos', () => {
  function keys(dict: object, prefix = ''): string[] {
    return Object.entries(dict).flatMap(([key, value]) =>
      typeof value === 'object' ? keys(value as object, `${prefix}${key}.`) : [`${prefix}${key}`],
    );
  }

  it('español e inglés tienen las mismas claves', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });
});
