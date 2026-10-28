import { describe, expect, it } from 'vitest';
import { allyCost, allyUpgradeGain, bestAllyPurchase } from '../src/core/allies';
import { moneyPerBreak, tapsToBreak } from '../src/core/economy';
import { incomePerSecond, sponsorReward } from '../src/core/income';
import { alliesDps } from '../src/core/allies';
import { normalizeState } from '../src/core/normalize';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

function newState() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  return state;
}

describe('patrocinio (anuncio a cambio de dinero)', () => {
  it('el ejemplo: si un toque rompe un objeto de $10, paga al menos $2,500', () => {
    const state = newState();
    state.nivelValor = 10; // plato, $3.1 por rotura
    state.nivelFuerza = 30; // lo rompe de un toque
    expect(tapsToBreak(state, gameData)).toBe(1);
    // 5 toques por segundo × 60 s = 300 roturas.
    const reward = sponsorReward(state, gameData);
    expect(reward.toNumber()).toBeCloseTo(moneyPerBreak(state, gameData).toNumber() * 300, 0);
    expect(reward.div(moneyPerBreak(state, gameData)).toNumber()).toBeGreaterThanOrEqual(250);
  });

  it('nunca paga menos que 100 roturas del objeto actual', () => {
    const state = newState();
    state.nivelValor = 130; // refri con poca fuerza: muchos golpes por objeto
    expect(sponsorReward(state, gameData).gte(moneyPerBreak(state, gameData).mul(100))).toBe(true);
  });

  it('crece con lo que gana el jugador (aliados incluidos)', () => {
    const state = newState();
    state.desbloqueos = ['aliado:gatito'];
    state.nivelValor = 25;
    const before = sponsorReward(state, gameData);
    state.aliados = [{ id: 'gatito', nivel: 200 }];
    expect(incomePerSecond(state, gameData, 5).gt(0)).toBe(true);
    expect(sponsorReward(state, gameData).gte(before)).toBe(true);
  });
});

describe('cada aliado nuevo conviene más que el anterior', () => {
  it('pega más fuerte por nivel', () => {
    const dps = gameData.allies.map((a) => a.danioBase / a.intervalo);
    for (let i = 1; i < dps.length; i++) expect(dps[i], gameData.allies[i]!.id).toBeGreaterThan(dps[i - 1]! * 2);
  });

  it('al llegar el perro, subirlo rinde más que seguir con el gatito y el ratón', () => {
    const state = newState();
    state.desbloqueos = ['aliado:gatito', 'aliado:raton', 'aliado:perro'];
    state.aliados = [{ id: 'gatito', nivel: 30 }, { id: 'raton', nivel: 15 }, { id: 'perro', nivel: 1 }];
    expect(bestAllyPurchase(state, gameData)).toBe('perro');
    const dog = gameData.allies.find((a) => a.id === 'perro')!;
    expect(allyUpgradeGain(state, gameData, dog).gt(0)).toBe(true);
    expect(allyCost(state, gameData, dog).gt(0)).toBe(true);
  });

  it('"Vida en manada": con perro y gatito, ×1.2 al daño de aliados', () => {
    const state = newState();
    state.aliados = [{ id: 'gatito', nivel: 10 }, { id: 'perro', nivel: 10 }];
    const before = alliesDps(state, gameData);
    state.laboratorio.hechas = ['mirada', 'fisioterapia', 'manada'];
    expect(alliesDps(state, gameData).div(before).toNumber()).toBeCloseTo(1.2);
    // Un aliado más, un 10 % más.
    state.aliados.push({ id: 'raton', nivel: 1 });
    const three = alliesDps(state, gameData);
    expect(three.gt(before.mul(1.2))).toBe(true);
  });
});
