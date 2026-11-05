import { afterEach, describe, expect, it, vi } from 'vitest';
import { tapDamage, moneyPerBreak } from '../src/core/economy';
import { startTurbo, turboActive, turboCooldown } from '../src/core/modifiers';
import { normalizeState } from '../src/core/normalize';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

afterEach(() => vi.useRealTimers());

describe('turbo (anuncio)', () => {
  it('sube el daño y el dinero por 3 minutos; luego hay que esperar para otro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const state = createInitialState(0);
    normalizeState(state, gameData);
    state.nivelFuerza = 10;
    state.nivelValor = 20;
    const damage = tapDamage(state, gameData);
    const money = moneyPerBreak(state, gameData);
    startTurbo(state, gameData, Date.now());
    expect(turboActive(state, Date.now())).toBe(true);
    expect(tapDamage(state, gameData).eq(damage.mul(gameData.balance.turbo.mult))).toBe(true);
    expect(moneyPerBreak(state, gameData).div(money).toNumber()).toBeCloseTo(gameData.balance.turbo.mult, 1);
    // Mientras dura no se puede prender otro.
    expect(startTurbo(state, gameData, Date.now())).toBe(false);
    vi.setSystemTime(state.turboHasta);
    expect(turboActive(state, Date.now())).toBe(false);
    expect(tapDamage(state, gameData).eq(damage)).toBe(true);
    // Hay que esperar `esperaMinutos` para el siguiente.
    expect(turboCooldown(state, gameData, Date.now())).toBe(gameData.balance.turbo.esperaMinutos * 60);
    expect(startTurbo(state, gameData, Date.now())).toBe(false);
    vi.setSystemTime(state.turboHasta + gameData.balance.turbo.esperaMinutos * 60_000);
    expect(startTurbo(state, gameData, Date.now())).toBe(true);
  });
});
