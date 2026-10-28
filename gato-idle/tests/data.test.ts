import { describe, expect, it } from 'vitest';
import { parseGameData } from '../src/core/data';
import { gameData } from '../src/data';
import objects from '../src/data/objects.json';
import tools from '../src/data/tools.json';
import balance from '../src/data/balance.json';
import allies from '../src/data/allies.json';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';

describe('datos de balance', () => {
  it('los JSON del juego son válidos', () => {
    expect(gameData.objects.length).toBe(27);
    expect(gameData.allies.map((a) => a.id)).toEqual(['gatito', 'perro', 'perico', 'mapache']);
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

  it('cada objeto, herramienta y aliado tiene nombre en todos los idiomas', () => {
    for (const dict of [es, en] as Record<string, Record<string, unknown>>[]) {
      for (const obj of gameData.objects) expect(dict.objetos, obj.id).toHaveProperty(obj.id);
      for (const tool of gameData.tools) expect(dict.herramientas, tool.id).toHaveProperty(tool.id);
      for (const ally of gameData.allies) expect(dict.aliados, ally.id).toHaveProperty(ally.id);
    }
  });

  it('cada objeto suena distinto a los demás', () => {
    const firmas = gameData.objects.map((o) => `${o.sonido.golpe}/${o.sonido.rotura}/${o.sonido.tono}`);
    expect(new Set(firmas).size).toBe(firmas.length);
  });

  it('detecta errores de captura', () => {
    const repeated = [...objects, objects[0]];
    expect(() => parseGameData({ objects: repeated, tools, allies, balance })).toThrow(/id repetido/);

    const badTool = [{ ...objects[0], herramienta: 'lanzallamas' }];
    expect(() => parseGameData({ objects: badTool, tools, allies, balance })).toThrow(/no existe/);

    const badStyle = [{ ...objects[0], estiloRotura: 'explotar' }];
    expect(() => parseGameData({ objects: badStyle, tools, allies, balance })).toThrow(/estiloRotura/);

    const noHp = [{ ...objects[0], hp: 0 }];
    expect(() => parseGameData({ objects: noHp, tools, allies, balance })).toThrow(/mayor que 0/);

    const badEffect = [tools[0], { ...tools[1], efectos: [{ stat: 'suerte', op: 'mult', valor: 2 }] }];
    expect(() => parseGameData({ objects, tools: badEffect, allies, balance })).toThrow(/stat "suerte"/);

    const badSound = [{ ...objects[0], sonido: { golpe: 'trueno', rotura: 'cristal', tono: 1 } }];
    expect(() => parseGameData({ objects: badSound, tools, allies, balance })).toThrow(/trueno/);

    const badAlly = [{ ...allies[0], desbloqueo: 'castillo' }];
    expect(() => parseGameData({ objects, tools, allies: badAlly, balance })).toThrow(/castillo/);

    const noFreeTool = tools.slice(1);
    expect(() => parseGameData({ objects, tools: noFreeTool, allies, balance })).toThrow(/gratis/);
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
