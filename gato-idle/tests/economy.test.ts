import { describe, expect, it } from 'vitest';
import { tap } from '../src/core/actions';
import {
  buyCritChance,
  buyCritDamage,
  buyFuerza,
  buyValor,
  critChance,
  critFactor,
  critMultiplier,
  currentObject,
  expectedTapDamage,
  fuerzaCost,
  moneyPerBreak,
  tapDamage,
  tapsToBreak,
  valorCost,
  valorNextObject,
} from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

function newState(dinero = 0) {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.dinero = num(dinero);
  return state;
}

describe('Fuerza', () => {
  it('sube el daño y baja los manotazos necesarios', () => {
    const state = newState(1000);
    expect(tapDamage(state, gameData).eq(1)).toBe(true);
    expect(tapsToBreak(state, gameData)).toBe(5);

    expect(buyFuerza(state, gameData)).toBe(true);
    expect(state.dinero.eq(995)).toBe(true);
    expect(tapDamage(state, gameData).eq(2)).toBe(true);
    expect(tapsToBreak(state, gameData)).toBe(3);
  });

  it('el costo crece con cada nivel', () => {
    const state = newState();
    const first = fuerzaCost(state, gameData);
    state.nivelFuerza = 10;
    expect(fuerzaCost(state, gameData).gt(first.mul(3))).toBe(true);
  });

  it('no se compra sin dinero', () => {
    const state = newState(4);
    expect(buyFuerza(state, gameData)).toBe(false);
    expect(state.nivelFuerza).toBe(0);
    expect(state.dinero.eq(4)).toBe(true);
  });
});

describe('Valor', () => {
  it('cada nivel paga más por rotura', () => {
    const state = newState(1e6);
    const before = moneyPerBreak(state, gameData);
    expect(buyValor(state, gameData)).toEqual({ bought: true, newObject: null });
    expect(moneyPerBreak(state, gameData).gt(before)).toBe(true);
  });

  it('al quinto nivel el dueño compra el siguiente objeto y empieza al centro de la mesa', () => {
    const state = newState(1e9);
    state.nivelValor = 4;
    state.danioObjeto = num(3);
    expect(valorNextObject(state, gameData)?.id).toBe('taza');

    const result = buyValor(state, gameData);
    expect(result.newObject?.id).toBe('taza');
    expect(currentObject(state, gameData).id).toBe('taza');
    expect(state.danioObjeto.eq(0)).toBe(true);
  });

  it('el siguiente objeto vale más que el último nivel del anterior', () => {
    const state = newState();
    state.nivelValor = 4;
    const lastOfVaso = moneyPerBreak(state, gameData);
    state.nivelValor = 5;
    expect(moneyPerBreak(state, gameData).gt(lastOfVaso)).toBe(true);
  });

  it('Valor pasa de una familia de objetos a la siguiente sin comprar nada más', () => {
    const state = newState(1e12);
    state.nivelValor = 29; // último nivel del celular; sigue el papel de baño
    expect(buyValor(state, gameData).newObject?.id).toBe('papel');
    state.nivelValor = 59;
    expect(buyValor(state, gameData).newObject?.herramienta).toBe('carrito');
  });

  it('el costo depende del objeto actual', () => {
    const state = newState();
    const vaso = valorCost(state, gameData);
    state.nivelValor = 20;
    expect(valorCost(state, gameData).gt(vaso)).toBe(true);
  });
});

describe('críticos', () => {
  it('Garras afiladas: +1 % por nivel, con tope', () => {
    const state = newState(1e30);
    expect(critChance(state, gameData)).toBe(0);
    expect(buyCritChance(state, gameData)).toBe(true);
    expect(critChance(state, gameData)).toBeCloseTo(0.01);
    state.nivelCritico = 50;
    expect(critChance(state, gameData)).toBe(0.5);
    expect(buyCritChance(state, gameData)).toBe(false);
  });

  it('Sombrero: el crítico empieza en ×2 y sube 0.1 por nivel', () => {
    const state = newState(1e30);
    expect(critMultiplier(state, gameData)).toBe(2);
    expect(buyCritDamage(state, gameData)).toBe(true);
    expect(critMultiplier(state, gameData)).toBeCloseTo(2.1);
  });

  it('daño promedio = daño × (1 + prob × (mult − 1))', () => {
    const state = newState();
    state.nivelFuerza = 9; // daño 10
    state.nivelCritico = 20; // 20 %
    state.nivelDanioCritico = 10; // ×3
    expect(critFactor(state, gameData)).toBeCloseTo(1.4);
    expect(expectedTapDamage(state, gameData).toNumber()).toBeCloseTo(tapDamage(state, gameData).toNumber() * 1.4);
  });

  it('el manotazo crítico multiplica el daño y lo marca', () => {
    const state = newState();
    state.nivelValor = 130; // refri: no se rompe de un golpe
    state.nivelCritico = 20;
    const normal = tap(state, gameData, () => 0.5);
    expect(normal.critico).toBe(false);
    const crit = tap(state, gameData, () => 0.1);
    expect(crit.critico).toBe(true);
    expect(crit.damage.eq(normal.damage.mul(2))).toBe(true);
  });
});

describe('normalizeState', () => {
  it('corrige niveles rotos y la probabilidad de crítico por encima del tope', () => {
    const state = newState();
    state.nivelValor = 75.5;
    state.nivelFuerza = 2.7;
    state.nivelCritico = 400;
    normalizeState(state, gameData);
    expect(state.nivelValor).toBe(75);
    expect(state.nivelFuerza).toBe(2);
    expect(state.nivelCritico).toBe(50);
  });
});
