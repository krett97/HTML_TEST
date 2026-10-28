// Acciones del juego: modifican el estado y devuelven qué pasó, para que la escena lo anime.
import type { GameData, ObjectDef } from './data';
import { num, ZERO, type Decimal } from './num';
import type { GameState } from './state';

export interface HitResult {
  objectId: string;
  damage: Decimal;
  /** Progreso del objeto hacia la orilla, de 0 a 1. */
  progress: number;
  broke: boolean;
  /** Solo si se rompió. */
  reward?: { vistas: Decimal; dinero: Decimal };
}

export function currentObject(state: GameState, data: GameData): ObjectDef {
  const index = Math.min(Math.max(state.objetoActual, 0), data.objects.length - 1);
  return data.objects[index]!;
}

export function objectProgress(state: GameState, data: GameData): number {
  const hp = currentObject(state, data).hp;
  return Math.min(1, state.danioObjeto.div(hp).toNumber());
}

/** Daño de un manotazo. Fuerza y herramientas llegan en la fase 2 (sistema de modificadores). */
export function tapDamage(_state: GameState, _data: GameData): Decimal {
  return num(1);
}

/** Aplica daño al objeto actual. Si llega a la orilla, se rompe y paga. */
export function hit(state: GameState, data: GameData, damage: Decimal): HitResult {
  const obj = currentObject(state, data);
  state.danioObjeto = state.danioObjeto.add(damage);

  if (state.danioObjeto.lt(obj.hp)) {
    return { objectId: obj.id, damage, progress: objectProgress(state, data), broke: false };
  }

  const vistas = obj.vistas;
  const dinero = vistas.mul(data.balance.tarifaPorVista);
  state.dinero = state.dinero.add(dinero);
  state.dineroPartida = state.dineroPartida.add(dinero);
  state.stats.roturas += 1;
  state.danioObjeto = ZERO;
  return { objectId: obj.id, damage, progress: 1, broke: true, reward: { vistas, dinero } };
}

export function tap(state: GameState, data: GameData): HitResult {
  state.stats.toques += 1;
  return hit(state, data, tapDamage(state, data));
}
