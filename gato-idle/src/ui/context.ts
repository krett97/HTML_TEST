import { getContext } from 'svelte';
import type { Game } from '../app/game';

const KEY = Symbol('juego');

/** Contexto raíz para mount(): así todos los componentes reciben el juego sin pasarlo como prop. */
export function gameContext(game: Game): Map<symbol, Game> {
  return new Map([[KEY, game]]);
}

export function useGame(): Game {
  return getContext<Game>(KEY);
}
