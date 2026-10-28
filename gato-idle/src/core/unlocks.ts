// Descubrimientos: el juego empieza solo con el manotazo y va revelando funciones, aliados y el
// laboratorio conforme el jugador avanza (unlocks.json, en orden). Siempre hay uno "próximo".
import type { GameData, UnlockDef } from './data';
import { objectIndexFor } from './economy';
import type { GameState } from './state';

export function hasUnlock(state: GameState, id: string): boolean {
  return state.desbloqueos.includes(id);
}

export interface UnlockProgress {
  unlock: UnlockDef;
  /** Cuánto lleva y cuánto pide (roturas, o niveles de Valor para llegar al objeto). */
  current: number;
  target: number;
}

export function unlockProgress(state: GameState, data: GameData, unlock: UnlockDef): UnlockProgress {
  if ('roturas' in unlock.condicion) {
    return { unlock, current: Math.min(state.stats.roturas, unlock.condicion.roturas), target: unlock.condicion.roturas };
  }
  // Se mide en niveles de Valor (el objeto llega con el nivel índice × nivelesPorObjeto), así la
  // barra avanza con cada compra de Valor. Al jugador no se le dice qué objeto es: solo "mejora el Valor".
  const objectId = unlock.condicion.objeto;
  const index = data.objects.findIndex((o) => o.id === objectId);
  const target = index * data.balance.valor.nivelesPorObjeto;
  const reached = objectIndexFor(state.nivelValor, data) >= index;
  return { unlock, current: reached ? target : Math.min(state.nivelValor, target), target };
}

function met(state: GameState, data: GameData, unlock: UnlockDef): boolean {
  const { current, target } = unlockProgress(state, data, unlock);
  return current >= target;
}

/** Registra los descubrimientos cuya condición ya se cumple. Devuelve los nuevos, en orden. */
export function checkUnlocks(state: GameState, data: GameData): UnlockDef[] {
  const fresh: UnlockDef[] = [];
  for (const unlock of data.unlocks) {
    if (!hasUnlock(state, unlock.id) && met(state, data, unlock)) {
      state.desbloqueos.push(unlock.id);
      fresh.push(unlock);
    }
  }
  return fresh;
}

/** El siguiente descubrimiento pendiente, o null si ya no quedan. */
export function nextUnlock(state: GameState, data: GameData): UnlockProgress | null {
  const unlock = data.unlocks.find((u) => !hasUnlock(state, u.id));
  return unlock ? unlockProgress(state, data, unlock) : null;
}
