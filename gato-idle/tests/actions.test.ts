import { describe, expect, it } from 'vitest';
import { currentObject, objectProgress, tap } from '../src/core/actions';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

describe('manotazo', () => {
  it('el vaso avanza hacia la orilla y se rompe al quinto golpe', () => {
    const state = createInitialState(0);
    const vaso = currentObject(state, gameData);
    expect(vaso.id).toBe('vaso');

    for (let i = 1; i < 5; i++) {
      const result = tap(state, gameData);
      expect(result.broke).toBe(false);
      expect(result.progress).toBeCloseTo(i / 5);
    }

    const last = tap(state, gameData);
    expect(last.broke).toBe(true);
    expect(last.reward?.vistas.eq(10)).toBe(true);
    expect(last.reward?.dinero.eq(1)).toBe(true);
    expect(state.dinero.eq(1)).toBe(true);
    expect(state.dineroPartida.eq(1)).toBe(true);
    expect(state.stats).toEqual({ toques: 5, roturas: 1 });
    expect(objectProgress(state, gameData)).toBe(0);
  });

  it('un índice de objeto fuera de rango no truena', () => {
    const state = createInitialState(0);
    state.objetoActual = 999;
    expect(currentObject(state, gameData).id).toBe('refri');
  });
});
