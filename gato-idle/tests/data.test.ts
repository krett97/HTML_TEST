import { describe, expect, it } from 'vitest';
import { parseGameData } from '../src/core/data';
import { gameData } from '../src/data';
import objects from '../src/data/objects.json';
import casas from '../src/data/casas.json';
import tools from '../src/data/tools.json';
import balance from '../src/data/balance.json';
import allies from '../src/data/allies.json';
import unlocks from '../src/data/unlocks.json';
import research from '../src/data/research.json';
import habilidades from '../src/data/habilidades.json';

const base = { objects, casas, tools, allies, unlocks, research, balance, habilidades };
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';

describe('datos de balance', () => {
  it('los JSON del juego son válidos', () => {
    expect(gameData.objects.length).toBe(39);
    expect(gameData.homes.map((h) => h.id)).toEqual(['departamento', 'casa']);
    expect(gameData.objects.filter((o) => o.casa === 'departamento').length).toBe(27);
    expect(gameData.objects[27]!.id).toBe('maceta');
    expect(gameData.allies.map((a) => a.id)).toEqual(['gatito', 'raton', 'perro', 'perico', 'cuervo', 'mapache', 'cabra']);
    expect(gameData.tools.map((t) => t.id)).toEqual(['pata', 'carrito', 'aspiradora']);
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

    const badPlace = [{ ...objects[0], lugar: 'azotea-tinaco' }];
    expect(() => parseGameData({ ...base, objects: badPlace })).toThrow(/lugar/);

    const badStyle = [{ ...objects[0], estiloRotura: 'explotar' }];
    expect(() => parseGameData({ ...base, objects: badStyle })).toThrow(/estiloRotura/);

    const noHp = [{ ...objects[0], hp: 0 }];
    expect(() => parseGameData({ ...base, objects: noHp })).toThrow(/mayor que 0/);

    const badEffect = [{ ...research[0], efectos: [{ stat: 'suerte', op: 'mult', valor: 2 }] }];
    expect(() => parseGameData({ ...base, research: badEffect })).toThrow(/stat "suerte"/);

    const badSound = [{ ...objects[0], sonido: { golpe: 'trueno', rotura: 'cristal', tono: 1 } }];
    expect(() => parseGameData({ ...base, objects: badSound })).toThrow(/trueno/);

    const badUnlock = [...unlocks, { id: 'dragon', condicion: { roturas: 1 } }];
    expect(() => parseGameData({ ...base, unlocks: badUnlock })).toThrow(/dragon/);

    const allyWithoutUnlock = unlocks.filter((u) => u.id !== 'aliado:cabra');
    expect(() => parseGameData({ ...base, unlocks: allyWithoutUnlock })).toThrow(/cabra/);

    const badResearch = [{ ...research[0], requiere: 'castillo' }];
    expect(() => parseGameData({ ...base, research: badResearch })).toThrow(/castillo/);

    expect(() => parseGameData({ ...base, tools: [] })).toThrow(/no hay herramientas/);

    const unknownHome = objects.map((o, i) => (i === 3 ? { ...o, casa: 'castillo' } : o));
    expect(() => parseGameData({ ...base, objects: unknownHome })).toThrow(/castillo/);

    const mixedHomes = objects.map((o, i) => (i === 3 ? { ...o, casa: 'casa' } : o));
    expect(() => parseGameData({ ...base, objects: mixedHomes })).toThrow(/por casa/);

    const emptyHome = objects.filter((o) => o.casa === 'departamento');
    expect(() => parseGameData({ ...base, objects: emptyHome })).toThrow(/no tiene objetos/);
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
