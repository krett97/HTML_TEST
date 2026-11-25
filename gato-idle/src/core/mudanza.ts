// La mudanza: el dueño se va a la siguiente casa (casas.json: departamento → casa → mansión) cuando
// el Canal junta los seguidores y visualizaciones que pide (totales que nunca bajan) y, si lo pide,
// tras vencer al jefe de la casa anterior. Al pasar el último nivel de la casa (niveles.ts) sigue el
// primero de la casa nueva; desde entonces cada video reinicia en ella.
import type { GameData, HomeDef } from './data';
import type { GameState } from './state';

/** La siguiente casa, si queda alguna. */
export function nextHome(state: GameState, data: GameData): HomeDef | null {
  return data.homes[state.casa + 1] ?? null;
}

/** Ya se juntó lo que pide la siguiente casa: los niveles pueden seguir más allá del último objeto. */
export function moveUnlocked(state: GameState, data: GameData): boolean {
  const req = nextHome(state, data)?.requisito;
  if (!req) return false;
  if (req.jefe && !state.jefes.derrotados.includes(req.jefe)) return false;
  return state.canal.seguidores >= req.seguidores && state.canal.visualizacionesTotales.gte(req.visualizaciones);
}

/** Primer objeto (índice de objects.json) de una casa. */
export function firstObjectOf(data: GameData, home: number): number {
  return data.objects.findIndex((o) => o.casa === data.homes[home]?.id);
}

/** Índice del primer objeto de una casa (0 si no tiene). */
export function homeStartIndex(data: GameData, home: number): number {
  return Math.max(0, firstObjectOf(data, home));
}

/** Hasta qué objeto se puede llegar: el último de la casa actual, o de la siguiente si ya se desbloqueó. */
export function lastObjectIndex(state: GameState, data: GameData): number {
  const home = Math.min(state.casa + (moveUnlocked(state, data) ? 1 : 0), data.homes.length - 1);
  const next = firstObjectOf(data, home + 1);
  return next === -1 ? data.objects.length - 1 : next - 1;
}

/**
 * Si ya se desbloqueó la siguiente casa y la etapa llegó a su primer objeto, el dueño se muda y la casa
 * queda para siempre. Devuelve la casa nueva o null.
 */
export function moveIfReady(state: GameState, data: GameData): HomeDef | null {
  const home = nextHome(state, data);
  if (!home || !moveUnlocked(state, data)) return null;
  const start = homeStartIndex(data, state.casa + 1);
  if (state.progreso.etapa < start) return null;
  state.casa += 1;
  // El gato entrena en la mudanza: llega con al menos la Fuerza inicial de la casa (si no, los objetos
  // nuevos le quedan enormes y la partida se atora).
  state.nivelFuerza = Math.max(state.nivelFuerza, home.fuerzaInicial ?? 0);
  return home;
}

/** Al subir un video, la partida empieza en la casa actual: su primer objeto y su Fuerza inicial. */
export function runStart(state: GameState, data: GameData): { etapa: number; nivelFuerza: number } {
  return { etapa: homeStartIndex(data, state.casa), nivelFuerza: data.homes[state.casa]?.fuerzaInicial ?? 0 };
}

export function normalizeHome(state: GameState, data: GameData): void {
  state.casa = Math.min(Math.max(0, Math.floor(state.casa)), data.homes.length - 1);
}
