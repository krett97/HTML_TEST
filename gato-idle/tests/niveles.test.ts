import { describe, expect, it } from 'vitest';
import { hit, tap } from '../src/core/actions';
import { currentObject } from '../src/core/economy';
import { bossHere, damageBoss, endFight, miniBossHere, startFight } from '../src/core/jefes';
import { advanceLevel, frontierIndex, gateAt, goToLevel, isLastOfRoom, levelMeta, metaFor } from '../src/core/niveles';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';
import { indexOf, irA } from './helpers';

function newState() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.pruebas.danioInfinito = true; // cada manotazo tira el objeto
  return state;
}

describe('niveles', () => {
  it('cada nivel pide más roturas que el anterior, y cada casa empieza más alto', () => {
    const meta = (id: string) => metaFor(gameData, gameData.objects.find((o) => o.id === id)!);
    expect(meta('vaso')).toBe(10);
    expect(meta('taza')).toBe(12);
    expect(meta('refri')).toBe(10 + 2 * 26);
    expect(meta('maceta')).toBe(15);
    expect(meta('jarron')).toBe(20);
    expect(meta('casco')).toBe(25);
  });

  it('al romper la meta del nivel, el dueño pone el siguiente objeto', () => {
    const state = newState();
    for (let i = 0; i < 9; i++) expect(tap(state, gameData).newObject).toBeUndefined();
    expect(state.progreso.roturas).toBe(9);
    const result = tap(state, gameData);
    expect(result.newObject?.id).toBe('taza');
    expect(currentObject(state, gameData).id).toBe('taza');
    expect(state.progreso).toEqual({ etapa: 1, roturas: 0, jugando: 1 });
  });

  it('en un nivel anterior las roturas pagan pero no cuentan para avanzar', () => {
    const state = newState();
    irA(state, 'control');
    expect(goToLevel(state, gameData, 0)).toBe(true);
    expect(currentObject(state, gameData).id).toBe('vaso');
    for (let i = 0; i < 30; i++) tap(state, gameData);
    expect(state.progreso).toMatchObject({ etapa: 3, roturas: 0, jugando: 0 });
    expect(state.dinero.gt(0)).toBe(true);
    // No se puede ir más allá de la etapa.
    expect(goToLevel(state, gameData, 10)).toBe(true);
    expect(state.progreso.jugando).toBe(3);
  });

  it('al terminar el último nivel de un cuarto espera el guardián; vencerlo pasa al siguiente cuarto', () => {
    const state = newState();
    const microondas = indexOf('microondas'); // último de la barra de la cocina... (el cuarto cambia según lugar)
    const lastKitchen = gameData.objects.findIndex((o, i) => o.lugar.startsWith('cocina') && isLastOfRoom(gameData, i));
    irA(state, lastKitchen);
    for (let i = 0; i < levelMeta(state, gameData); i++) tap(state, gameData);
    expect(frontierIndex(state, gameData)).toBe(lastKitchen); // no avanzó solo
    expect(gateAt(state, gameData)).toBe('miniJefe');
    const mini = miniBossHere(state, gameData)!;
    expect(mini.id).toBe('mini:cocina');
    expect(bossHere(state, gameData)).toBe(null);
    // Pierde: nada cambia y se puede volver a retar.
    const lost = startFight(gameData, mini, 0, state);
    expect(endFight(state, gameData, lost, 1000).gano).toBe(false);
    expect(state.jefes.revancha).toBe(0);
    expect(frontierIndex(state, gameData)).toBe(lastKitchen);
    // Gana: pasa al primer objeto del cuarto siguiente.
    const won = startFight(gameData, mini, 0, state);
    expect(damageBoss(won, won.vida)).toBe(true);
    const outcome = endFight(state, gameData, won, 1000);
    expect(outcome.gano).toBe(true);
    expect(outcome.premio.gt(0)).toBe(true);
    expect(frontierIndex(state, gameData)).toBe(lastKitchen + 1);
    expect(state.progreso.roturas).toBe(0);
    void microondas;
  });

  it('al terminar el último nivel de la casa espera el jefe de la casa (y luego la mudanza)', () => {
    const state = newState();
    irA(state, 'refri');
    for (let i = 0; i < 10; i++) tap(state, gameData);
    expect(gateAt(state, gameData)).toBe('jefe');
    expect(miniBossHere(state, gameData)).toBe(null);
    expect(bossHere(state, gameData)?.id).toBe('escoba');
    expect(advanceLevel(state, gameData)).toBe(null);
    state.jefes.derrotados.push('escoba');
    expect(gateAt(state, gameData)).toBe('mudanza');
    expect(currentObject(state, gameData).id).toBe('refri');
  });

  it('el daño sobrante no cuenta y el objeto nuevo empieza entero', () => {
    const state = newState();
    state.pruebas.danioInfinito = false;
    irA(state, 'vaso');
    state.progreso.roturas = 9;
    hit(state, gameData, num(1000));
    expect(currentObject(state, gameData).id).toBe('taza');
    expect(state.danioObjeto.eq(0)).toBe(true);
  });
});
