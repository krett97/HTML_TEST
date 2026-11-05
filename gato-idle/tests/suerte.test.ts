import { describe, expect, it } from 'vitest';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { deserialize, serialize } from '../src/core/save';
import { createInitialState } from '../src/core/state';
import { adSpinsLeft, awardBossTokens, doubleOrNothing, doublePrize, expectedMinutes, judge, minuteValue, refillTokens, spin } from '../src/core/suerte';
import { gameData } from '../src/data';

const HOUR = 3_600_000;
const b = gameData.balance.suerte;

function newState() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.nivelValor = 60;
  state.nivelFuerza = 20;
  return state;
}

/** Un rng que da estos valores en orden (de 0 a 1). */
const seq = (...xs: number[]) => () => xs.shift() ?? 0.99;

describe('la maquinita', () => {
  it('reconoce cada combinación', () => {
    expect(judge(['corona', 'corona', 'corona'])).toBe('jackpot');
    expect(judge(['pepino', 'pepino', 'pepino'])).toBe('trio');
    expect(judge(['corona', 'vaso', 'corona'])).toBe('coronas');
    expect(judge(['vaso', 'pescado', 'vaso'])).toBe('par');
    expect(judge(['vaso', 'pescado', 'corona'])).toBe('pelos');
  });

  it('las fichas llegan solas, una por hora, hasta el máximo', () => {
    const state = newState();
    state.suerte.fichas = 0;
    refillTokens(state, gameData, 0);
    refillTokens(state, gameData, HOUR - 1);
    expect(state.suerte.fichas).toBe(0);
    refillTokens(state, gameData, HOUR);
    expect(state.suerte.fichas).toBe(1);
    refillTokens(state, gameData, 10 * HOUR);
    expect(state.suerte.fichas).toBe(b.fichasMax);
  });

  it('un giro con ficha la gasta y paga minutos de juego', () => {
    const state = newState();
    state.suerte.fichas = 1;
    const before = state.dinero;
    // corona, corona, corona = 0.95 cada rodillo (los últimos 10 de 100).
    const r = spin(state, gameData, 0, 'ficha', seq(0.95, 0.95, 0.95))!;
    expect(r.tipo).toBe('jackpot');
    expect(state.suerte.fichas).toBe(0);
    expect(r.dinero.eq(minuteValue(state, gameData).mul(b.minutosJackpot).floor())).toBe(true);
    expect(state.dinero.eq(before.add(r.dinero))).toBe(true);
    expect(r.visualizaciones.gte(1000)).toBe(true);
    expect(spin(state, gameData, 0, 'ficha')).toBe(null);
  });

  it('doble o nada: gana el doble o lo pierde; con anuncio, doble seguro', () => {
    const state = newState();
    state.suerte.fichas = 3;
    const r = spin(state, gameData, 0, 'ficha', seq(0.1, 0.1, 0.5))!; // croquetas, croquetas, vaso = par
    expect(r.tipo).toBe('par');
    const after = state.dinero;
    expect(doubleOrNothing(state, () => 0.2)).toBe(true);
    expect(state.dinero.eq(after.add(r.dinero))).toBe(true);
    expect(doubleOrNothing(state)).toBe(null); // una sola vez
    spin(state, gameData, 0, 'ficha', seq(0.1, 0.1, 0.5));
    const mid = state.dinero;
    expect(doubleOrNothing(state, () => 0.8)).toBe(false);
    expect(state.dinero.lt(mid)).toBe(true);
    spin(state, gameData, 0, 'ficha', seq(0.1, 0.1, 0.5));
    expect(doublePrize(state)?.gt(0)).toBe(true);
  });

  it('giros con anuncio: tope por día, se renueva al día siguiente', () => {
    const state = newState();
    for (let i = 0; i < b.girosAnuncioPorDia; i++) expect(spin(state, gameData, 1000, 'anuncio')).not.toBe(null);
    expect(adSpinsLeft(state, gameData, 1000)).toBe(0);
    expect(spin(state, gameData, 1000, 'anuncio')).toBe(null);
    const tomorrow = 1000 + 26 * HOUR;
    refillTokens(state, gameData, tomorrow);
    expect(adSpinsLeft(state, gameData, tomorrow)).toBe(b.girosAnuncioPorDia);
  });

  it('vencer a un jefe da fichas y todo se guarda', () => {
    const state = newState();
    state.suerte.fichas = 0;
    awardBossTokens(state, gameData);
    expect(state.suerte.fichas).toBe(b.fichasPorJefe);
    state.suerte.doblable = num(500);
    const loaded = deserialize(serialize(state, 0), 0);
    expect(loaded.ok && loaded.state.suerte.fichas).toBe(b.fichasPorJefe);
    expect(loaded.ok && loaded.state.suerte.doblable?.eq(500)).toBe(true);
  });

  it('un giro vale en promedio unos minutos de juego (más que el anuncio que cuesta)', () => {
    const ev = expectedMinutes(gameData);
    expect(ev).toBeGreaterThan(1.5);
    expect(ev).toBeLessThan(5);
  });
});
