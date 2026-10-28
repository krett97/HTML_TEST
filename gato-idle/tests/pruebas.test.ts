import { describe, expect, it } from 'vitest';
import { allyLevel, buyAlly } from '../src/core/allies';
import { playUntil } from '../src/core/bot';
import { buyFuerza, currentObject, tapDamage, tapsToBreak } from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { addAllyLevels, advanceClock, completeAllResearch, discoverAll, discoverNext, finishResearchNow } from '../src/core/pruebas';
import { startResearch } from '../src/core/research';
import { deserialize, serialize } from '../src/core/save';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

function newState() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  return state;
}

describe('modo pruebas', () => {
  it('dinero infinito: se compra sin dinero y no se descuenta', () => {
    const state = newState();
    state.desbloqueos = ['aliado:gatito'];
    expect(buyFuerza(state, gameData)).toBe(false);
    state.pruebas.dineroInfinito = true;
    expect(buyFuerza(state, gameData)).toBe(true);
    expect(buyAlly(state, gameData, 'gatito')).toBe(true);
    expect(state.nivelFuerza).toBe(1);
    expect(allyLevel(state, 'gatito')).toBe(1);
    expect(state.dinero.toNumber()).toBe(0);
  });

  it('multiplicador de daño y daño infinito', () => {
    const state = newState();
    state.nivelValor = 130; // refri
    const normal = tapDamage(state, gameData).toNumber();
    state.pruebas.multDanio = 100;
    expect(tapDamage(state, gameData).toNumber()).toBe(normal * 100);
    state.pruebas.danioInfinito = true;
    expect(tapsToBreak(state, gameData)).toBe(1);
    expect(tapDamage(state, gameData).eq(currentObject(state, gameData).hp)).toBe(true);
  });

  it('avanzar como jugador llega al objeto pedido sin usar los trucos', () => {
    const state = newState();
    state.pruebas.dineroInfinito = true;
    const seconds = playUntil(state, gameData, { objeto: 'lampara' });
    expect(currentObject(state, gameData).id).toBe('lampara');
    expect(state.herramientas).toEqual(expect.arrayContaining(['garras', 'carrito']));
    expect(state.desbloqueos).toContain('laboratorio');
    // Mismo ritmo que el simulador: la lámpara llega hacia el minuto 10.
    expect(seconds / 60).toBeGreaterThan(8);
    expect(seconds / 60).toBeLessThan(13);
    // Los trucos se conservan después de jugar.
    expect(state.pruebas.dineroInfinito).toBe(true);
  });

  it('avanzar por tiempo', () => {
    const state = newState();
    const seconds = playUntil(state, gameData, { segundos: 300 });
    expect(seconds).toBeGreaterThanOrEqual(300);
    expect(state.stats.roturas).toBeGreaterThan(100);
  });

  it('descubrir, laboratorio y aliados', () => {
    const state = newState();
    expect(discoverNext(state, gameData)).toBe('fuerza');
    discoverAll(state, gameData);
    expect(state.desbloqueos).toHaveLength(gameData.unlocks.length);
    expect(discoverNext(state, gameData)).toBeNull();

    state.pruebas.dineroInfinito = true;
    state.nivelValor = 60; // lámpara: ya hay laboratorio
    expect(startResearch(state, gameData, 'mirada', 1000)).toBe(true);
    advanceClock(state, 30);
    expect(state.laboratorio.actual!.fin).toBe(1000 + 60_000 - 30_000);
    expect(finishResearchNow(state, 5000)).toBe(true);
    expect(state.laboratorio.actual!.fin).toBe(5000);
    expect(completeAllResearch(state, gameData)).toBe(gameData.research.length);
    expect(state.laboratorio.actual).toBeNull();

    expect(addAllyLevels(state, gameData, 10)).toBe(gameData.allies.length);
    expect(allyLevel(state, 'cabra')).toBe(10);
  });

  it('los trucos se guardan, y un guardado viejo los recibe apagados', () => {
    const state = newState();
    state.pruebas = { dineroInfinito: true, multDanio: 1000, danioInfinito: false };
    const loaded = deserialize(serialize(state, 1), 2);
    expect(loaded.ok && loaded.state.pruebas).toEqual(state.pruebas);
    const old = JSON.parse(serialize(newState(), 1));
    delete old.s.pruebas;
    const fromOld = deserialize(JSON.stringify(old), 2);
    expect(fromOld.ok && fromOld.state.pruebas).toEqual({ dineroInfinito: false, multDanio: 1, danioInfinito: false });
  });
});
