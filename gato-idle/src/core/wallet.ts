// Pagar y saber si alcanza. Todas las compras pasan por aquí, así el "dinero infinito" del modo
// pruebas funciona igual en Fuerza, Valor, herramientas, aliados y laboratorio.
import type { Decimal } from './num';
import type { GameState } from './state';

export function canAfford(state: GameState, cost: Decimal): boolean {
  return state.pruebas.dineroInfinito || state.dinero.gte(cost);
}

/** Cobra `cost` si alcanza. Con dinero infinito no descuenta nada. */
export function pay(state: GameState, cost: Decimal): boolean {
  if (!canAfford(state, cost)) return false;
  if (!state.pruebas.dineroInfinito) state.dinero = state.dinero.sub(cost);
  return true;
}
