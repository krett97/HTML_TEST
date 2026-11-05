import { describe, expect, it } from 'vitest';
import { buyValor } from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { cleanName, MAX_NAME, rankingUnlocked, recordObject, updateRecord } from '../src/core/ranking';
import { deserialize, serialize } from '../src/core/save';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

const PER_OBJECT = gameData.balance.valor.nivelesPorObjeto;

function newState() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  return state;
}

describe('ranking', () => {
  it('se abre con la segunda casa', () => {
    const state = newState();
    expect(rankingUnlocked(state)).toBe(false);
    state.casa = 1;
    expect(rankingUnlocked(state)).toBe(true);
  });

  it('el nivel es el objeto más lejano alcanzado (récord de todas las partidas)', () => {
    const state = newState();
    expect(state.ranking.nivel).toBe(1);
    expect(recordObject(state, gameData)).toBe('vaso');
    state.desbloqueos.push('valor');
    state.dinero = num(1e9);
    for (let i = 0; i < PER_OBJECT; i++) buyValor(state, gameData);
    expect(updateRecord(state, gameData)).toBe(true);
    expect(state.ranking.nivel).toBe(2);
    expect(recordObject(state, gameData)).toBe('taza');
    // Al reiniciar (subir el video) se vuelve al vaso, pero el récord se queda.
    state.nivelValor = 0;
    expect(updateRecord(state, gameData)).toBe(false);
    expect(state.ranking.nivel).toBe(2);
  });

  it('limpia los nombres y los guarda con la partida', () => {
    expect(cleanName('  Michi\u0007 ')).toBe('Michi');
    expect(cleanName('x'.repeat(40))).toHaveLength(MAX_NAME);
    expect(cleanName(42)).toBe('');
    const state = newState();
    state.ranking = { nombre: 'Don Gato', nivel: 9 };
    const loaded = deserialize(serialize(state, 0), 0);
    expect(loaded.ok && loaded.state.ranking).toEqual({ nombre: 'Don Gato', nivel: 9 });
  });
});
