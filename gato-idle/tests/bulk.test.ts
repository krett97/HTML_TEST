import { describe, expect, it } from 'vitest';
import { allyCost, allyLevel, buyAlly } from '../src/core/allies';
import { afterBulk, buyBulk, planBulk } from '../src/core/bulk';
import { buyCritChance, buyFuerza, buyValor, critChanceCost, currentObject, fuerzaCost, valorCost } from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

function newState(dinero = 0) {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.dinero = num(dinero);
  return state;
}

describe('comprar ×10', () => {
  it('suma el costo de los 10 niveles y los compra todos juntos', () => {
    const state = newState();
    const fuerza = (s: typeof state) => fuerzaCost(s, gameData);
    const buy = (s: typeof state) => buyFuerza(s, gameData);
    const plan = planBulk(state, 10, fuerza, buy);
    expect(plan.count).toBe(10);
    // 5 × (1.28^0 + … + 1.28^9), con piso en cada nivel.
    let expected = 0;
    for (let i = 0; i < 10; i++) expected += Math.floor(5 * 1.28 ** i);
    expect(plan.total.toNumber()).toBe(expected);
    expect(state.nivelFuerza).toBe(0);

    state.dinero = plan.total.sub(1);
    expect(buyBulk(state, 10, fuerza, buy)).toBe(0);
    state.dinero = plan.total;
    expect(buyBulk(state, 10, fuerza, buy)).toBe(10);
    expect(state.nivelFuerza).toBe(10);
    expect(state.dinero.toNumber()).toBe(0);
  });

  it('Valor ×10 pasa de objeto si toca', () => {
    const state = newState(1e12);
    const bought = buyBulk(state, 10, (s) => valorCost(s, gameData), (s) => buyValor(s, gameData).bought);
    expect(bought).toBe(10);
    expect(currentObject(state, gameData).id).toBe('plato');
  });

  it('se detiene en el tope (la probabilidad de crítico no pasa del 50 %)', () => {
    const state = newState(1e30);
    state.nivelCritico = 46;
    const plan = planBulk(state, 10, (s) => critChanceCost(s, gameData), (s) => buyCritChance(s, gameData));
    expect(plan.count).toBe(4);
  });

  it('aliados ×10 y la vista previa no tocan el estado real', () => {
    const state = newState(1e9);
    state.desbloqueos = ['aliado:gatito'];
    const gatito = gameData.allies[0]!;
    const preview = afterBulk(state, 10, (s) => buyAlly(s, gameData, 'gatito'));
    expect(allyLevel(preview, 'gatito')).toBe(10);
    expect(allyLevel(state, 'gatito')).toBe(0);
    expect(buyBulk(state, 10, (s) => allyCost(s, gameData, gatito), (s) => buyAlly(s, gameData, 'gatito'))).toBe(10);
    expect(allyLevel(state, 'gatito')).toBe(10);
  });
});
