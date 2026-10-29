// El manotazo: modifica el estado y devuelve qué pasó, para que la escena lo anime.
import type { GameData } from './data';
import { critChance, critMultiplier, currentObject, moneyPerBreak, objectIndex, objectProgress, tapDamage, viewsPerBreak } from './economy';
import { rammingMultiplier, skillLevel } from './skills';
import { ZERO, type Decimal } from './num';
import type { GameState } from './state';

export interface HitResult {
  objectId: string;
  damage: Decimal;
  /** Progreso del objeto hacia la orilla, de 0 a 1. */
  progress: number;
  broke: boolean;
  /** Fue un manotazo crítico ("¡ZARPAZO!"). */
  critico?: boolean;
  /** Llegó la embestida del carrito (habilidad del Canal). */
  embestida?: boolean;
  /** Solo si se rompió. */
  reward?: { vistas: Decimal; dinero: Decimal };
}

/** Aplica daño al objeto actual. Si llega a la orilla, se rompe y paga. */
export function hit(state: GameState, data: GameData, damage: Decimal): HitResult {
  const obj = currentObject(state, data);
  state.danioObjeto = state.danioObjeto.add(damage);

  if (state.danioObjeto.lt(obj.hp)) {
    return { objectId: obj.id, damage, progress: objectProgress(state, data), broke: false };
  }

  const vistas = viewsPerBreak(state, data);
  const dinero = moneyPerBreak(state, data);
  state.dinero = state.dinero.add(dinero);
  state.dineroPartida = state.dineroPartida.add(dinero);
  state.stats.roturas += 1;
  state.stats.roturasPartida += 1;
  state.stats.vistasVideo += objectIndex(state, data) + 1;
  state.danioObjeto = ZERO;
  return { objectId: obj.id, damage, progress: 1, broke: true, reward: { vistas, dinero } };
}

/** Cuenta un manotazo y decide su daño: crítico (al azar) y embestida (uno de cada `embestidaCada`). */
export function rollTap(state: GameState, data: GameData, rng: () => number = Math.random): { damage: Decimal; critico: boolean; embestida: boolean } {
  state.stats.toques += 1;
  const critico = rng() < critChance(state, data);
  let damage = critico ? tapDamage(state, data).mul(critMultiplier(state, data)) : tapDamage(state, data);
  const embestida = skillLevel(state, 'embestida') > 0 && state.stats.toques % data.balance.canal.embestidaCada === 0;
  if (embestida) damage = damage.mul(rammingMultiplier(state, data));
  return { damage, critico, embestida };
}

/** Un manotazo del jugador. Con probabilidad de crítico, multiplica su daño. `rng` sirve para las pruebas. */
export function tap(state: GameState, data: GameData, rng: () => number = Math.random): HitResult {
  const { damage, critico, embestida } = rollTap(state, data, rng);
  return { ...hit(state, data, damage), critico, embestida };
}
