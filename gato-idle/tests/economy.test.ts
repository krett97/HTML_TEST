import { describe, expect, it } from 'vitest';
import {
  buyFuerza,
  buyTool,
  buyValor,
  currentObject,
  fuerzaCost,
  moneyPerBreak,
  nextTool,
  normalizeState,
  tapDamage,
  tapsToBreak,
  toolAvailable,
  valorCost,
  valorPreview,
} from '../src/core/economy';
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

  it('al décimo nivel el dueño compra el siguiente objeto y empieza al centro de la mesa', () => {
    const state = newState(1e9);
    state.nivelValor = 9;
    state.danioObjeto = num(3);
    expect(valorPreview(state, gameData).nextObject?.id).toBe('florero');

    const result = buyValor(state, gameData);
    expect(result.newObject?.id).toBe('florero');
    expect(currentObject(state, gameData).id).toBe('florero');
    expect(state.danioObjeto.eq(0)).toBe(true);
  });

  it('el siguiente objeto vale más que el último nivel del anterior', () => {
    const state = newState();
    state.nivelValor = 9;
    const lastOfVaso = moneyPerBreak(state, gameData);
    state.nivelValor = 10;
    expect(moneyPerBreak(state, gameData).gt(lastOfVaso)).toBe(true);
  });

  it('sin la herramienta no se puede pasar a la siguiente familia', () => {
    const state = newState(1e12);
    state.nivelValor = 29; // último nivel de los tenis; sigue el sofá (garras)
    expect(valorPreview(state, gameData).requiredTool?.id).toBe('garras');
    expect(buyValor(state, gameData).bought).toBe(false);

    expect(buyTool(state, gameData, 'garras')).toBe(true);
    expect(buyValor(state, gameData).newObject?.id).toBe('sofa');
  });

  it('el costo depende del objeto actual', () => {
    const state = newState();
    const vaso = valorCost(state, gameData);
    state.nivelValor = 20;
    expect(valorCost(state, gameData).gt(vaso)).toBe(true);
  });
});

describe('herramientas', () => {
  it('solo se compran cuando el dueño necesita la siguiente familia', () => {
    const state = newState(1e9);
    expect(nextTool(state, gameData)?.id).toBe('garras');
    expect(toolAvailable(state, gameData, 'garras')).toBe(false);
    expect(buyTool(state, gameData, 'garras')).toBe(false);

    state.nivelValor = 29;
    expect(toolAvailable(state, gameData, 'garras')).toBe(true);
    expect(buyTool(state, gameData, 'carrito')).toBe(false);
    expect(buyTool(state, gameData, 'garras')).toBe(true);
    expect(nextTool(state, gameData)?.id).toBe('carrito');
  });

  it('cada herramienta multiplica el daño', () => {
    const state = newState(1e9);
    state.nivelValor = 29;
    buyTool(state, gameData, 'garras');
    expect(tapDamage(state, gameData).eq(3)).toBe(true);
    state.nivelValor = 59;
    buyTool(state, gameData, 'carrito');
    expect(tapDamage(state, gameData).eq(9)).toBe(true);
  });
});

describe('normalizeState', () => {
  it('corrige un guardado con herramientas sueltas y Valor de más', () => {
    const state = newState();
    state.herramientas = ['carrito', 'inventada'];
    state.nivelValor = 75;
    state.nivelFuerza = 2.7;
    normalizeState(state, gameData);
    expect(state.herramientas).toEqual(['pata']);
    expect(state.nivelValor).toBe(29);
    expect(state.nivelFuerza).toBe(2);
  });
});
