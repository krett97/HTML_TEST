import { describe, expect, it } from 'vitest';
import { breaksPerSecond } from '../src/core/income';
import { buyMark, markCost, markMaxed } from '../src/core/economy';
import { applyMark, expectedMarkMultiplier, markActive, markMultiplier, markRemaining, markUptime } from '../src/core/marca';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

const { segundos, multPorNivel, max } = gameData.balance.marca;

function withGang() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.nivelValor = 40;
  state.desbloqueos.push('aliado:gatito', 'aliado:perro', 'marca');
  state.aliados = [
    { id: 'gatito', nivel: 30 },
    { id: 'perro', nivel: 20 },
  ];
  state.nivelCritico = 20;
  return state;
}

describe('Garras marcadoras', () => {
  it('sin la mejora, los críticos no marcan', () => {
    const state = withGang();
    expect(applyMark(state, gameData, 1000)).toBe(false);
    expect(markActive(state, 1000)).toBe(false);
  });

  it('un crítico marca el objeto unos segundos, y otro crítico renueva la marca', () => {
    const state = withGang();
    state.nivelMarca = 1;
    expect(applyMark(state, gameData, 1000)).toBe(true);
    expect(markActive(state, 1000 + segundos * 1000 - 1)).toBe(true);
    expect(markRemaining(state, 1000 + 4000)).toBeCloseTo(segundos - 4);
    // Renovada a medio camino: no es "nueva".
    expect(applyMark(state, gameData, 6000)).toBe(false);
    expect(markActive(state, 6000 + segundos * 1000 - 1)).toBe(true);
    expect(markActive(state, 6000 + segundos * 1000)).toBe(false);
  });

  it('cada nivel suma poquito y tiene tope', () => {
    const state = withGang();
    state.nivelMarca = 1;
    expect(markMultiplier(state, gameData)).toBeCloseTo(1 + multPorNivel);
    state.dinero = num(1e30);
    while (buyMark(state, gameData));
    expect(state.nivelMarca).toBe(max);
    expect(markMaxed(state, gameData)).toBe(true);
    expect(markMultiplier(state, gameData)).toBeCloseTo(1 + max * multPorNivel);
    expect(markCost(state, gameData).gt(0)).toBe(true);
  });

  it('sin tocar no hay marca: no cuenta en lo que se gana sin jugar', () => {
    const state = withGang();
    state.nivelMarca = 5;
    expect(markUptime(state, gameData, 0)).toBe(0);
    expect(expectedMarkMultiplier(state, gameData, 0)).toBe(1);
    expect(markUptime(state, gameData, 5)).toBeGreaterThan(0.99);
    const withMark = breaksPerSecond(state, gameData, 5);
    state.nivelMarca = 0;
    expect(withMark).toBeGreaterThan(breaksPerSecond(state, gameData, 5));
  });
});
