// La mudanza: el dueño se va del departamento a una casa (casas.json) cuando el Canal junta los
// seguidores y visualizaciones que pide (totales, nunca se gastan). La partida sigue después del
// último objeto del departamento con los de la casa; desde entonces cada video reinicia en la casa.
import type { GameData, HomeDef } from './data';
import { ZERO } from './num';
import type { GameState } from './state';

/** La siguiente casa, si queda alguna. */
export function nextHome(state: GameState, data: GameData): HomeDef | null {
  return data.homes[state.casa + 1] ?? null;
}

/** Ya se juntó lo que pide la siguiente casa: el Valor puede seguir más allá del último objeto. */
export function moveUnlocked(state: GameState, data: GameData): boolean {
  const req = nextHome(state, data)?.requisito;
  if (!req) return false;
  return state.canal.seguidores >= req.seguidores && state.canal.visualizaciones.gte(req.visualizaciones);
}

/** Primer objeto (índice de objects.json) de una casa. */
export function firstObjectOf(data: GameData, home: number): number {
  return data.objects.findIndex((o) => o.casa === data.homes[home]?.id);
}

/** Nivel de Valor con el que llega el primer objeto de una casa. */
export function homeStartLevel(data: GameData, home: number): number {
  return Math.max(0, firstObjectOf(data, home)) * data.balance.valor.nivelesPorObjeto;
}

/** Hasta qué objeto se puede llegar: el último de la casa actual, o de la siguiente si ya se desbloqueó. */
export function lastObjectIndex(state: GameState, data: GameData): number {
  const home = Math.min(state.casa + (moveUnlocked(state, data) ? 1 : 0), data.homes.length - 1);
  const next = firstObjectOf(data, home + 1);
  return next === -1 ? data.objects.length - 1 : next - 1;
}

/**
 * Si ya se desbloqueó la siguiente casa y el Valor llegó a su primer objeto, el dueño se muda:
 * se queda en ese primer objeto (aunque sobraran niveles de Valor en el último) y la casa queda
 * para siempre. Devuelve la casa nueva o null.
 */
export function moveIfReady(state: GameState, data: GameData): HomeDef | null {
  const home = nextHome(state, data);
  if (!home || !moveUnlocked(state, data)) return null;
  const start = homeStartLevel(data, state.casa + 1);
  if (state.nivelValor < start) return null;
  state.casa += 1;
  if (state.nivelValor > start) state.danioObjeto = ZERO;
  state.nivelValor = start;
  return home;
}

/** Al subir un video, la partida empieza en la casa actual: su primer objeto y su Fuerza inicial. */
export function runStart(state: GameState, data: GameData): { nivelValor: number; nivelFuerza: number } {
  return { nivelValor: homeStartLevel(data, state.casa), nivelFuerza: data.homes[state.casa]?.fuerzaInicial ?? 0 };
}

export function normalizeHome(state: GameState, data: GameData): void {
  state.casa = Math.min(Math.max(0, Math.floor(state.casa)), data.homes.length - 1);
}
