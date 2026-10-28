import { describe, expect, it } from 'vitest';
import { collectModifiers } from '../src/core/modifiers';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { finishResearch, researchRemaining, researchStatus, startResearch } from '../src/core/research';
import { createInitialState } from '../src/core/state';
import { formatDuration } from '../src/core/time';
import { checkUnlocks, hasUnlock, nextUnlock } from '../src/core/unlocks';
import { tapDamage } from '../src/core/economy';
import { gameData } from '../src/data';

function newState(dinero = 0) {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.dinero = num(dinero);
  return state;
}

describe('descubrimientos', () => {
  it('al empezar solo hay manotazos; lo siguiente es la Fuerza', () => {
    const state = newState();
    expect(checkUnlocks(state, gameData)).toEqual([]);
    expect(nextUnlock(state, gameData)).toMatchObject({ unlock: { id: 'fuerza' }, current: 0, target: 3 });
  });

  it('se descubren en orden conforme se rompen cosas y se avanza', () => {
    const state = newState();
    state.stats.roturas = 3;
    expect(checkUnlocks(state, gameData).map((u) => u.id)).toEqual(['fuerza']);
    state.stats.roturas = 12;
    expect(checkUnlocks(state, gameData).map((u) => u.id)).toEqual(['valor']);
    state.stats.roturas = 30;
    state.nivelValor = 15; // control remoto
    expect(checkUnlocks(state, gameData).map((u) => u.id)).toEqual(['patrocinios', 'aliado:gatito', 'aliado:raton']);
    expect(nextUnlock(state, gameData)?.unlock.id).toBe('herramientas');
    // No se repiten.
    expect(checkUnlocks(state, gameData)).toEqual([]);
  });

  it('cuando ya no quedan, no hay próximo', () => {
    const state = newState();
    state.stats.roturas = 1000;
    state.nivelValor = 130;
    state.herramientas = ['garras', 'carrito', 'aspiradora'];
    checkUnlocks(state, gameData);
    expect(nextUnlock(state, gameData)).toBeNull();
    expect(hasUnlock(state, 'laboratorio')).toBe(true);
  });
});

describe('laboratorio', () => {
  function labState(dinero: number) {
    const state = newState(dinero);
    state.nivelValor = 60; // lámpara
    state.herramientas = ['garras', 'carrito'];
    state.stats.roturas = 100;
    checkUnlocks(state, gameData);
    return state;
  }

  it('no se investiga sin laboratorio', () => {
    const state = newState(1e9);
    expect(startResearch(state, gameData, 'mirada', 0)).toBe(false);
  });

  it('una investigación tarda tiempo real y luego da su mejora para siempre', () => {
    const state = labState(1e6);
    const before = tapDamage(state, gameData);
    expect(startResearch(state, gameData, 'mirada', 1000)).toBe(true);
    expect(researchRemaining(state, 31_000)).toBe(30);
    expect(finishResearch(state, gameData, 30_000)).toBeNull();
    expect(finishResearch(state, gameData, 61_000)?.id).toBe('mirada');
    expect(collectModifiers(state, gameData).some((m) => m.fuente === 'investigacion:mirada')).toBe(true);

    startResearch(state, gameData, 'fisioterapia', 100_000);
    finishResearch(state, gameData, 100_000 + 300_000);
    expect(tapDamage(state, gameData).toNumber()).toBeCloseTo(before.toNumber() * 1.25);
  });

  it('una a la vez y en orden', () => {
    const state = labState(1e9);
    expect(researchStatus(state, gameData, gameData.research[1]!)).toBe('bloqueada');
    expect(startResearch(state, gameData, 'fisioterapia', 0)).toBe(false);
    expect(startResearch(state, gameData, 'mirada', 0)).toBe(true);
    expect(startResearch(state, gameData, 'mirada', 0)).toBe(false);
  });

  it('las últimas tardan días', () => {
    const last = gameData.research.at(-1)!;
    expect(last.duracion).toBeGreaterThanOrEqual(86400);
  });
});

describe('formatDuration', () => {
  it.each([
    [45, '45 s'],
    [125, '2 min 5 s'],
    [1200, '20 min'],
    [3600, '1 h'],
    [14400 + 300, '4 h 5 min'],
    [259200, '3 d'],
    [90000, '1 d 1 h'],
  ])('%s s → %s', (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });
});
