// Modo pruebas: atajos para probar etapas avanzadas sin jugar desde cero. Solo para desarrollo:
// en la versión de tienda el panel no aparece y los trucos se apagan al cargar (ver app/game.ts).
import { allyLevel, allyUnlocked } from './allies';
import type { GameData } from './data';
import type { GameState } from './state';
import { hasUnlock } from './unlocks';

/** Descubre el siguiente descubrimiento pendiente, aunque no se cumpla su condición. */
export function discoverNext(state: GameState, data: GameData): string | null {
  const next = data.unlocks.find((u) => !hasUnlock(state, u.id));
  if (!next) return null;
  state.desbloqueos.push(next.id);
  return next.id;
}

/** Descubre todo lo que falta. Devuelve lo nuevo. */
export function discoverAll(state: GameState, data: GameData): string[] {
  const fresh = data.unlocks.filter((u) => !hasUnlock(state, u.id)).map((u) => u.id);
  state.desbloqueos.push(...fresh);
  return fresh;
}

/** Hace que la investigación en curso termine ya (el juego la entrega en el siguiente tick). */
export function finishResearchNow(state: GameState, now: number): boolean {
  const current = state.laboratorio.actual;
  if (!current) return false;
  current.fin = Math.min(current.fin, now);
  return true;
}

/** Marca todas las investigaciones como hechas. */
export function completeAllResearch(state: GameState, data: GameData): number {
  const lab = state.laboratorio;
  const pending = data.research.filter((r) => !lab.hechas.includes(r.id)).map((r) => r.id);
  lab.hechas.push(...pending);
  lab.actual = null;
  return pending.length;
}

/** Sube `levels` niveles a cada aliado descubierto (adopta los que falten). */
export function addAllyLevels(state: GameState, data: GameData, levels: number): number {
  let count = 0;
  for (const ally of data.allies) {
    if (!allyUnlocked(state, data, ally)) continue;
    const entry = state.aliados.find((a) => a.id === ally.id);
    if (entry) entry.nivel += levels;
    else state.aliados.push({ id: ally.id, nivel: levels });
    count += allyLevel(state, ally.id) > 0 ? 1 : 0;
  }
  return count;
}

/** Adelanta el reloj del laboratorio, como si hubieran pasado `seconds` segundos. */
export function advanceClock(state: GameState, seconds: number): void {
  const current = state.laboratorio.actual;
  if (current) current.fin -= seconds * 1000;
}
