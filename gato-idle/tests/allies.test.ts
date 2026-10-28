import { describe, expect, it } from 'vitest';
import { allyCost, allyHitDamage, allyLevel, allyUnlocked, alliesDps, buyAlly } from '../src/core/allies';
import { normalizeState } from '../src/core/normalize';
import { checkUnlocks } from '../src/core/unlocks';
import { num } from '../src/core/num';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

const ally = (id: string) => gameData.allies.find((a) => a.id === id)!;

function newState(dinero = 0) {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.dinero = num(dinero);
  return state;
}

describe('aliados', () => {
  it('cada aliado llega con su descubrimiento', () => {
    const state = newState();
    expect(allyUnlocked(state, gameData, ally('gatito'))).toBe(false);
    state.stats.roturas = 30;
    checkUnlocks(state, gameData);
    expect(allyUnlocked(state, gameData, ally('gatito'))).toBe(true);
    expect(allyUnlocked(state, gameData, ally('perro'))).toBe(false);
    state.nivelValor = 30; // papel de baño
    checkUnlocks(state, gameData);
    expect(allyUnlocked(state, gameData, ally('perro'))).toBe(true);
  });

  it('adoptar y mejorar sube el nivel y cobra', () => {
    const state = newState(100);
    state.desbloqueos = ['aliado:gatito'];
    const cost = allyCost(state, gameData, ally('gatito'));
    expect(buyAlly(state, gameData, 'gatito')).toBe(true);
    expect(allyLevel(state, 'gatito')).toBe(1);
    expect(state.dinero.eq(num(100).sub(cost))).toBe(true);
    expect(allyCost(state, gameData, ally('gatito')).gt(cost)).toBe(true);

    expect(buyAlly(state, gameData, 'gatito')).toBe(true);
    expect(allyLevel(state, 'gatito')).toBe(2);
  });

  it('no se adopta un aliado bloqueado ni sin dinero', () => {
    const state = newState(1e9);
    expect(buyAlly(state, gameData, 'perro')).toBe(false);
    const poor = newState(1);
    expect(buyAlly(poor, gameData, 'gatito')).toBe(false);
  });

  it('empieza con poquito daño y crece con el nivel', () => {
    const state = newState();
    const kitten = ally('gatito');
    expect(allyHitDamage(0, kitten, state, gameData).eq(0)).toBe(true);
    expect(allyHitDamage(1, kitten, state, gameData).eq(1)).toBe(true);
    expect(allyHitDamage(10, kitten, state, gameData).eq(10)).toBe(true);
    // Cada 25 niveles, el doble.
    expect(allyHitDamage(25, kitten, state, gameData).eq(50)).toBe(true);
  });

  it('el daño por segundo suma a todos según su ritmo', () => {
    const state = newState();
    state.aliados = [{ id: 'gatito', nivel: 3 }, { id: 'perro', nivel: 1 }];
    // gatito: 3 de daño cada 1 s; perro: 20 cada 2 s.
    expect(alliesDps(state, gameData).toNumber()).toBeCloseTo(3 + 10);
  });

  it('un guardado con aliados raros se corrige', () => {
    const state = newState();
    state.aliados = [
      { id: 'gatito', nivel: 2.9 },
      { id: 'dragon', nivel: 5 },
      { id: 'gatito', nivel: 7 },
      { id: 'perro', nivel: 0 },
    ];
    normalizeState(state, gameData);
    expect(state.aliados).toEqual([{ id: 'gatito', nivel: 2 }]);
  });
});

describe('Lentes de jefe', () => {
  it('multiplican el daño de todos los aliados: ×(1 + 0.1 × nivel)', async () => {
    const { buyLentes, lentesCost } = await import('../src/core/economy');
    const { lentesMultiplier } = await import('../src/core/modifiers');
    const state = createInitialState(0);
    normalizeState(state, gameData);
    const gatito = gameData.allies.find((a) => a.id === 'gatito')!;
    const cabra = gameData.allies.find((a) => a.id === 'cabra')!;
    const before = [allyHitDamage(10, gatito, state, gameData).toNumber(), allyHitDamage(10, cabra, state, gameData).toNumber()];
    state.dinero = lentesCost(state, gameData).mul(10);
    expect(buyLentes(state, gameData)).toBe(true);
    state.nivelLentes = 5;
    expect(lentesMultiplier(state, gameData)).toBeCloseTo(1.5);
    expect(allyHitDamage(10, gatito, state, gameData).toNumber()).toBeCloseTo(before[0]! * 1.5);
    expect(allyHitDamage(10, cabra, state, gameData).toNumber()).toBeCloseTo(before[1]! * 1.5);
  });
});
