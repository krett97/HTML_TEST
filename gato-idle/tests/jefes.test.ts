import { describe, expect, it } from 'vitest';
import { tapDamage } from '../src/core/economy';
import { bossHere, bossHp, bossPrize, CONSOLATION, damageBoss, endFight, rematchIn, startFight } from '../src/core/jefes';
import { homeStartLevel } from '../src/core/mudanza';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { deserialize, serialize } from '../src/core/save';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

const PER_OBJECT = gameData.balance.valor.nivelesPorObjeto;
const pepino = gameData.bosses.find((b) => b.id === 'pepino')!;

/** Partida ya mudada a la casa, en el objeto `id`. */
function inHouse(id: string) {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.casa = 1;
  state.nivelValor = gameData.objects.findIndex((o) => o.id === id) * PER_OBJECT;
  return state;
}

describe('jefes', () => {
  it('el Pepino Gigante espera en el coche, el último objeto de la casa', () => {
    expect(bossHere(inHouse('moto'), gameData)).toBe(null);
    expect(bossHere(inHouse('coche'), gameData)?.id).toBe('pepino');
    const refri = createInitialState(0);
    normalizeState(refri, gameData);
    refri.nivelValor = homeStartLevel(gameData, 1) - 1;
    expect(bossHere(refri, gameData)).toBe(null);
  });

  it('su vida es la de varios coches', () => {
    const coche = gameData.objects.find((o) => o.id === 'coche')!;
    expect(bossHp(gameData, pepino).eq(coche.hp.mul(pepino.vidaEnRoturas).floor())).toBe(true);
  });

  it('ganar paga el premio completo y deja el trofeo (+daño para siempre)', () => {
    const state = inHouse('coche');
    const before = tapDamage(state, gameData);
    const fight = startFight(gameData, pepino, 1000);
    expect(fight.fin).toBe(1000 + pepino.segundos * 1000);
    expect(damageBoss(fight, fight.vida.div(2))).toBe(false);
    expect(damageBoss(fight, fight.vida)).toBe(true);
    expect(fight.danio.eq(fight.vida)).toBe(true);
    const prize = bossPrize(state, gameData, pepino);
    const outcome = endFight(state, gameData, fight, 2000);
    expect(outcome.gano).toBe(true);
    expect(outcome.premio.eq(prize)).toBe(true);
    expect(state.dinero.eq(prize)).toBe(true);
    expect(state.jefes.derrotados).toEqual(['pepino']);
    expect(tapDamage(state, gameData).gt(before)).toBe(true);
    // Ya derrotado, no vuelve a aparecer.
    expect(bossHere(state, gameData)).toBe(null);
  });

  it('perder paga una parte según el daño y la revancha tarda', () => {
    const state = inHouse('coche');
    const fight = startFight(gameData, pepino, 0);
    damageBoss(fight, fight.vida.mul(0.4));
    const prize = bossPrize(state, gameData, pepino);
    const outcome = endFight(state, gameData, fight, 5000);
    expect(outcome.gano).toBe(false);
    expect(outcome.premio.eq(prize.mul(0.4 * CONSOLATION).floor())).toBe(true);
    expect(state.jefes.derrotados).toEqual([]);
    expect(rematchIn(state, 5000)).toBe(pepino.esperaDerrota);
    expect(rematchIn(state, 5000 + pepino.esperaDerrota * 1000)).toBe(0);
  });

  it('los trofeos se guardan', () => {
    const state = inHouse('coche');
    state.jefes.derrotados.push('pepino');
    state.dinero = num(5);
    const loaded = deserialize(serialize(state, 0), 0);
    expect(loaded.ok && loaded.state.jefes.derrotados).toEqual(['pepino']);
  });
});
