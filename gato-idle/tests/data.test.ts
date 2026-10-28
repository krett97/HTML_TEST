import { describe, expect, it } from 'vitest';
import { parseGameData } from '../src/core/data';
import { gameData } from '../src/data';
import objects from '../src/data/objects.json';
import tools from '../src/data/tools.json';
import balance from '../src/data/balance.json';
import allies from '../src/data/allies.json';
import unlocks from '../src/data/unlocks.json';
import research from '../src/data/research.json';

const base = { objects, tools, allies, unlocks, research, balance };
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';

describe('datos de balance', () => {
  it('los JSON del juego son válidos', () => {
    expect(gameData.objects.length).toBe(27);
    expect(gameData.allies.map((a) => a.id)).toEqual(['gatito', 'raton', 'perro', 'perico', 'cuervo', 'mapache', 'cabra']);
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
      for (const r of gameData.research) expect((dict.laboratorio as Record<string, object>).proyectos, r.id).toHaveProperty(r.id);
    }
  });

  it('cada objeto suena distinto a los demás', () => {
    const firmas = gameData.objects.map((o) => `${o.sonido.golpe}/${o.sonido.rotura}/${o.sonido.tono}`);
    expect(new Set(firmas).size).toBe(firmas.length);
  });

  it('detecta errores de captura', () => {
    const repeated = [...objects, objects[0]];
    expect(() => parseGameData({ ...base, objects: repeated })).toThrow(/id repetido/);

    const badTool = [{ ...objects[0], herramienta: 'lanzallamas' }];
    expect(() => parseGameData({ ...base, objects: badTool })).toThrow(/no existe/);

    const badStyle = [{ ...objects[0], estiloRotura: 'explotar' }];
    expect(() => parseGameData({ ...base, objects: badStyle })).toThrow(/estiloRotura/);

    const noHp = [{ ...objects[0], hp: 0 }];
    expect(() => parseGameData({ ...base, objects: noHp })).toThrow(/mayor que 0/);

    const badEffect = [tools[0], { ...tools[1], efectos: [{ stat: 'suerte', op: 'mult', valor: 2 }] }];
    expect(() => parseGameData({ ...base, tools: badEffect })).toThrow(/stat "suerte"/);

    const badSound = [{ ...objects[0], sonido: { golpe: 'trueno', rotura: 'cristal', tono: 1 } }];
    expect(() => parseGameData({ ...base, objects: badSound })).toThrow(/trueno/);

    const badUnlock = [...unlocks, { id: 'dragon', condicion: { roturas: 1 } }];
    expect(() => parseGameData({ ...base, unlocks: badUnlock })).toThrow(/dragon/);

    const allyWithoutUnlock = unlocks.filter((u) => u.id !== 'aliado:cabra');
    expect(() => parseGameData({ ...base, unlocks: allyWithoutUnlock })).toThrow(/cabra/);

    const badResearch = [{ ...research[0], requiere: 'castillo' }];
    expect(() => parseGameData({ ...base, research: badResearch })).toThrow(/castillo/);

    const noFreeTool = tools.slice(1);
    expect(() => parseGameData({ ...base, tools: noFreeTool })).toThrow(/gratis/);
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
