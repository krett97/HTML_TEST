// Investigación gatuna (antes "laboratorio"): investigaciones que tardan tiempo real (de un minuto a días) y dan
// mejoras permanentes. Se investiga una a la vez, en orden, y el reloj sigue con el juego cerrado.
import type { GameData, ResearchDef } from './data';
import { objectIndexFor } from './economy';
import type { GameState } from './state';
import { hasUnlock } from './unlocks';
import { researchDuration } from './skills';
import { canAfford, pay } from './wallet';

export type ResearchStatus = 'hecha' | 'en-curso' | 'disponible' | 'bloqueada';

export function researchStatus(state: GameState, data: GameData, research: ResearchDef): ResearchStatus {
  const lab = state.laboratorio;
  if (lab.hechas.includes(research.id)) return 'hecha';
  if (lab.actual?.id === research.id) return 'en-curso';
  const index = data.research.indexOf(research);
  const previousDone = index === 0 || lab.hechas.includes(data.research[index - 1]!.id);
  const reached = objectIndexFor(state.nivelValor, data) >= data.objects.findIndex((o) => o.id === research.requiere);
  return previousDone && reached ? 'disponible' : 'bloqueada';
}

export function startResearch(state: GameState, data: GameData, researchId: string, now: number): boolean {
  const research = data.research.find((r) => r.id === researchId);
  if (!research || !hasUnlock(state, 'laboratorio') || state.laboratorio.actual) return false;
  if (researchStatus(state, data, research) !== 'disponible' || !canAfford(state, research.costo)) return false;
  pay(state, research.costo);
  state.laboratorio.actual = { id: research.id, fin: now + researchDuration(state, data, research) * 1000 };
  return true;
}

/** Si la investigación en curso ya terminó, la marca como hecha y la devuelve. */
export function finishResearch(state: GameState, data: GameData, now: number): ResearchDef | null {
  const current = state.laboratorio.actual;
  if (!current || now < current.fin) return null;
  state.laboratorio.actual = null;
  state.laboratorio.hechas.push(current.id);
  return data.research.find((r) => r.id === current.id) ?? null;
}

/** Segundos que faltan para terminar la investigación en curso. */
export function researchRemaining(state: GameState, now: number): number {
  const current = state.laboratorio.actual;
  return current ? Math.max(0, Math.ceil((current.fin - now) / 1000)) : 0;
}
