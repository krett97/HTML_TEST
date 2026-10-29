import { describe, expect, it } from 'vitest';
import { breaksPerSecond } from '../src/core/income';
import { moneyPerBreak } from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { claimOffline, offlineEarnings } from '../src/core/offline';
import { deserialize, serialize } from '../src/core/save';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

function gangState() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.nivelValor = 30; // papel de baño
  state.desbloqueos = ['aliado:gatito', 'aliado:perro'];
  state.aliados = [
    { id: 'gatito', nivel: 20 },
    { id: 'perro', nivel: 10 },
  ];
  return state;
}

describe('mientras no estabas', () => {
  it('sin aliados no se gana nada', () => {
    const state = createInitialState(0);
    normalizeState(state, gameData);
    expect(offlineEarnings(state, gameData, 3600).roturas).toBe(0);
  });

  it('la pandilla rompe a la mitad de su ritmo, con el dinero del objeto actual', () => {
    const state = gangState();
    const earnings = offlineEarnings(state, gameData, 600);
    const expected = Math.floor(breaksPerSecond(state, gameData, 0) * 600 * gameData.balance.offline.eficiencia);
    expect(earnings.roturas).toBe(expected);
    expect(earnings.dinero.eq(moneyPerBreak(state, gameData).mul(expected))).toBe(true);
    expect(earnings.tope).toBe(false);
  });

  it('cuenta a lo mucho el tope de horas', () => {
    const state = gangState();
    const max = gameData.balance.offline.horasMax * 3600;
    const capped = offlineEarnings(state, gameData, max * 5);
    expect(capped.tope).toBe(true);
    expect(capped.segundos).toBe(max);
    expect(capped.roturas).toBe(offlineEarnings(state, gameData, max).roturas);
  });

  it('cobrar suma dinero (×2 con el anuncio) y las roturas cuentan para el video', () => {
    const state = gangState();
    const earnings = offlineEarnings(state, gameData, 600);
    const paid = claimOffline(state, gameData, earnings, 2);
    expect(paid.eq(earnings.dinero.mul(2))).toBe(true);
    expect(state.dinero.eq(paid)).toBe(true);
    expect(state.stats.roturasPartida).toBe(earnings.roturas);
    expect(state.stats.vistasVideo).toBe(earnings.roturas * 7); // papel de baño = objeto 7
  });

  it('lo pendiente se guarda si se cierra el juego sin cobrar', () => {
    const state = gangState();
    state.offline = offlineEarnings(state, gameData, 600);
    const loaded = deserialize(serialize(state, 1), 2);
    expect(loaded.ok).toBe(true);
    expect(String(loaded.ok && loaded.state.offline?.dinero)).toBe(String(state.offline.dinero));
  });
});
