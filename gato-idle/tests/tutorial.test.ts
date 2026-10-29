import { describe, expect, it } from 'vitest';
import { tap } from '../src/core/actions';
import { buyFuerza, currentObject } from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { createInitialState } from '../src/core/state';
import { completeTutorialStep, skipTutorial, TUTORIAL_STEPS, updateTutorial } from '../src/core/tutorial';
import { gameData } from '../src/data';

function fresh() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  return state;
}

function breakOne(state: ReturnType<typeof fresh>) {
  const before = state.stats.roturas;
  while (state.stats.roturas === before) tap(state, gameData, () => 0.99);
}

describe('tutorial', () => {
  it('empieza pidiendo un manotazo y, al romper algo, explica las monedas', () => {
    const state = fresh();
    expect(updateTutorial(state, gameData)).toBe('tocar');
    breakOne(state);
    expect(updateTutorial(state, gameData)).toBe('monedas');
    completeTutorialStep(state, 'monedas');
    // Fuerza todavía no se descubre: se espera sin mostrar nada.
    expect(updateTutorial(state, gameData)).toBe(null);
  });

  it('pide Fuerza solo cuando ya se descubrió y alcanza el dinero, y se cierra al comprarla', () => {
    const state = fresh();
    completeTutorialStep(state, 'tocar');
    completeTutorialStep(state, 'monedas');
    state.desbloqueos.push('fuerza');
    state.dinero = num(0);
    expect(updateTutorial(state, gameData)).toBe(null);
    state.dinero = num(1e6);
    expect(updateTutorial(state, gameData)).toBe('fuerza');
    buyFuerza(state, gameData);
    expect(updateTutorial(state, gameData)).not.toBe('fuerza');
  });

  it('no se repite después de subir un video (las mejoras vuelven a cero, los vistos no)', () => {
    const state = fresh();
    breakOne(state);
    state.nivelFuerza = 1;
    updateTutorial(state, gameData);
    expect(state.vistos).toContain('tuto:fuerza');
    state.nivelFuerza = 0; // como tras el reinicio
    state.dinero = num(1e6);
    state.desbloqueos.push('fuerza');
    expect(updateTutorial(state, gameData)).not.toBe('fuerza');
  });

  it('al final explica el video, cuando ya se puede subir', () => {
    const state = fresh();
    for (const step of TUTORIAL_STEPS) if (step !== 'video') completeTutorialStep(state, step);
    state.desbloqueos.push('canal');
    expect(updateTutorial(state, gameData)).toBe(null);
    while (currentObject(state, gameData).id !== gameData.balance.canal.objetoMinimo) state.nivelValor += 1;
    state.dineroPartida = num(1e9);
    expect(updateTutorial(state, gameData)).toBe('video');
  });

  it('una partida avanzada no lo ve', () => {
    const state = fresh();
    state.canal.videos.push({ fecha: 0, objeto: 'refri', roturas: 100, seguidores: 5, visualizaciones: num(1000), viral: false, plantilla: 0 });
    expect(updateTutorial(state, gameData)).toBe(null);
  });

  it('se puede saltar', () => {
    const state = fresh();
    skipTutorial(state);
    expect(updateTutorial(state, gameData)).toBe(null);
  });
});
