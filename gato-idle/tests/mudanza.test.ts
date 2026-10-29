import { describe, expect, it } from 'vitest';
import { uploadVideo } from '../src/core/canal';
import { buyValor, currentObject, valorNextObject } from '../src/core/economy';
import { homeStartLevel, lastObjectIndex, moveIfReady, moveUnlocked, nextHome } from '../src/core/mudanza';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { deserialize, serialize } from '../src/core/save';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

const REFRI = gameData.objects.findIndex((o) => o.id === 'refri');
const PER_OBJECT = gameData.balance.valor.nivelesPorObjeto;
const casa = gameData.homes[1]!;

function atRefri() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.desbloqueos.push('valor', 'canal');
  state.nivelValor = REFRI * PER_OBJECT;
  state.dinero = num(1e30);
  return state;
}

function famous(state: ReturnType<typeof atRefri>) {
  state.canal.seguidores = casa.requisito!.seguidores;
  state.canal.visualizacionesTotales = casa.requisito!.visualizaciones;
}

describe('mudanza', () => {
  it('sin los seguidores y visualizaciones del Canal, el refri es el último objeto', () => {
    const state = atRefri();
    expect(moveUnlocked(state, gameData)).toBe(false);
    expect(lastObjectIndex(state, gameData)).toBe(REFRI);
    for (let i = 0; i < 20; i++) buyValor(state, gameData);
    expect(currentObject(state, gameData).id).toBe('refri');
    expect(state.casa).toBe(0);
  });

  it('con la meta del Canal, el Valor sigue después del refri y el dueño se muda', () => {
    const state = atRefri();
    famous(state);
    expect(moveUnlocked(state, gameData)).toBe(true);
    for (let i = 0; i < PER_OBJECT - 1; i++) expect(buyValor(state, gameData).home).toBe(null);
    expect(valorNextObject(state, gameData)?.id).toBe('maceta');
    const purchase = buyValor(state, gameData);
    expect(purchase.newObject?.id).toBe('maceta');
    expect(purchase.home?.id).toBe('casa');
    expect(state.casa).toBe(1);
    expect(currentObject(state, gameData).id).toBe('maceta');
    expect(nextHome(state, gameData)).toBe(null);
  });

  it('si sobraba Valor en el refri, se muda a la maceta (no se salta objetos)', () => {
    const state = atRefri();
    state.nivelValor += 12;
    state.danioObjeto = num(500);
    famous(state);
    expect(moveIfReady(state, gameData)?.id).toBe('casa');
    expect(state.nivelValor).toBe(homeStartLevel(gameData, 1));
    expect(currentObject(state, gameData).id).toBe('maceta');
    expect(state.danioObjeto.eq(0)).toBe(true);
  });

  it('ya mudado, cada video empieza en la casa con el gato entrenado', () => {
    const state = atRefri();
    famous(state);
    state.nivelValor = homeStartLevel(gameData, 1);
    expect(moveIfReady(state, gameData)?.id).toBe('casa');
    state.nivelValor += 10;
    state.dineroPartida = num(1e12);
    expect(uploadVideo(state, gameData, 0, () => 0.5)).not.toBe(null);
    expect(currentObject(state, gameData).id).toBe('maceta');
    expect(state.nivelFuerza).toBe(casa.fuerzaInicial);
    expect(state.casa).toBe(1);
  });

  it('antes de mudarse, el video regresa al vaso aunque ya se haya desbloqueado la casa', () => {
    const state = atRefri();
    state.dineroPartida = num(1e12);
    famous(state);
    uploadVideo(state, gameData, 0, () => 0.5);
    expect(currentObject(state, gameData).id).toBe('vaso');
    expect(state.nivelFuerza).toBe(0);
  });

  it('la casa se guarda', () => {
    const state = atRefri();
    famous(state);
    state.nivelValor = homeStartLevel(gameData, 1);
    expect(moveIfReady(state, gameData)?.id).toBe('casa');
    const loaded = deserialize(serialize(state, 0), 0);
    expect(loaded.ok && loaded.state.casa).toBe(1);
  });
});
