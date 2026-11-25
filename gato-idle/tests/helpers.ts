// Atajos para las pruebas: poner la partida en un nivel (objeto) dado.
import { setFrontier } from '../src/core/niveles';
import type { GameState } from '../src/core/state';
import { gameData } from '../src/data';

/** Deja la etapa (y la mesa) en el objeto `id` (o índice). */
export function irA(state: GameState, objeto: string | number): GameState {
  const index = typeof objeto === 'number' ? objeto : gameData.objects.findIndex((o) => o.id === objeto);
  if (index < 0) throw new Error(`no existe el objeto ${objeto}`);
  setFrontier(state, gameData, index);
  return state;
}

export const indexOf = (id: string): number => gameData.objects.findIndex((o) => o.id === id);
