// Ranking de gatos: se abre al mudarse a la segunda casa. El "nivel" de cada jugador es el objeto
// más lejano al que ha llegado con Valor (el vaso es el nivel 1), su récord de todas las partidas.
import type { GameData } from './data';
import { objectIndex } from './economy';
import type { GameState } from './state';

/** Largo máximo del nombre del gato. */
export const MAX_NAME = 16;

export function rankingUnlocked(state: GameState): boolean {
  return state.casa >= 1;
}

/** Sube el récord si el objeto actual es el más lejano hasta ahora. Devuelve true si subió. */
export function updateRecord(state: GameState, data: GameData): boolean {
  const nivel = objectIndex(state, data) + 1;
  if (nivel <= state.ranking.nivel) return false;
  state.ranking.nivel = nivel;
  return true;
}

/** El objeto del récord (el del nivel). */
export function recordObject(state: GameState, data: GameData): string {
  return data.objects[Math.max(0, state.ranking.nivel - 1)]!.id;
}

/** Limpia un nombre escrito por el jugador (o por otro, si viene del ranking compartido). */
export function cleanName(name: unknown): string {
  return typeof name === 'string' ? name.replace(/[\u0000-\u001f]/g, '').trim().slice(0, MAX_NAME) : '';
}

export function normalizeRanking(state: GameState, data: GameData): void {
  const r = state.ranking;
  r.nombre = cleanName(r.nombre);
  r.nivel = Math.min(data.objects.length, Math.max(0, Math.floor(Number(r.nivel) || 0)));
  // Guardados de antes del ranking: el récord es al menos donde va ahora.
  updateRecord(state, data);
}
