// Comprar varios niveles a la vez (selector ×1 / ×10 de Mejoras y Aliados). Se simula la compra
// nivel por nivel sobre una copia, porque cada nivel cuesta distinto (y Valor cambia de objeto).
import { pay } from './wallet';
import { ZERO, type Decimal } from './num';
import type { GameState } from './state';

/** Opciones del selector de compra. */
export const BUY_AMOUNTS = [1, 10];

export interface BulkPlan {
  /** Cuántos niveles se pueden comprar (menos de lo pedido si se llega a un tope). */
  count: number;
  /** Lo que cuestan todos juntos. */
  total: Decimal;
}

function sandbox(state: GameState): GameState {
  return {
    ...state,
    aliados: state.aliados.map((a) => ({ ...a })),
    // Para sumar costos sin que importe cuánto dinero hay.
    pruebas: { ...state.pruebas, dineroInfinito: true },
  };
}

/** Cuánto cuestan `amount` niveles. `cost` da el precio del siguiente nivel y `buy` lo compra. */
export function planBulk(state: GameState, amount: number, cost: (s: GameState) => Decimal, buy: (s: GameState) => boolean): BulkPlan {
  const copy = sandbox(state);
  let total = ZERO;
  let count = 0;
  for (; count < amount; count++) {
    const price = cost(copy);
    if (!buy(copy)) break;
    total = total.add(price);
  }
  return { count, total };
}

/** Compra los niveles del plan solo si alcanza para todos. Devuelve cuántos compró. */
export function buyBulk(state: GameState, amount: number, cost: (s: GameState) => Decimal, buy: (s: GameState) => boolean): number {
  const plan = planBulk(state, amount, cost, buy);
  if (plan.count === 0 || !pay(state, plan.total)) return 0;
  // Ya se cobró todo junto: cada compra individual va "gratis".
  const trucos = state.pruebas;
  state.pruebas = { ...trucos, dineroInfinito: true };
  try {
    for (let i = 0; i < plan.count; i++) buy(state);
  } finally {
    state.pruebas = trucos;
  }
  return plan.count;
}

/** Estado tras comprar `count` niveles (para mostrar "daño 60 → 70" con ×10). */
export function afterBulk(state: GameState, count: number, buy: (s: GameState) => boolean): GameState {
  const copy = sandbox(state);
  for (let i = 0; i < count; i++) buy(copy);
  copy.pruebas = state.pruebas;
  return copy;
}
