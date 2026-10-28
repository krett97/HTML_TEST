import { normalizeAllies } from './allies';
import type { GameData } from './data';
import { ZERO } from './num';
import type { GameState } from './state';
import { ownsTool } from './tools';

// Partidas guardadas.

/**
 * Corrige lo que no cuadre con los datos actuales (un guardado viejo, un objeto que se quitó de
 * los JSON): herramientas en orden y sin huecos, niveles enteros y el Valor sin pasar de lo que
 * permiten las herramientas.
 */
export function normalizeState(state: GameState, data: GameData): void {
  const owned: string[] = [];
  for (const tool of data.tools) {
    if (ownsTool(state, tool)) owned.push(tool.id);
    else break;
  }
  state.herramientas = owned;
  state.nivelFuerza = Math.max(0, Math.floor(state.nivelFuerza));
  state.nivelValor = Math.max(0, Math.floor(state.nivelValor));

  const { nivelesPorObjeto } = data.balance.valor;
  const blocked = data.objects.findIndex((obj) => !owned.includes(obj.herramienta));
  if (blocked !== -1) state.nivelValor = Math.min(state.nivelValor, blocked * nivelesPorObjeto - 1);
  if (state.danioObjeto.lt(0)) state.danioObjeto = ZERO;
  normalizeAllies(state, data);

  const unlockIds = new Set(data.unlocks.map((u) => u.id));
  state.desbloqueos = [...new Set(state.desbloqueos.filter((id) => unlockIds.has(id)))];
  const researchIds = new Set(data.research.map((r) => r.id));
  const lab = state.laboratorio;
  lab.hechas = [...new Set(lab.hechas.filter((id) => researchIds.has(id)))];
  if (lab.actual && (!researchIds.has(lab.actual.id) || typeof lab.actual.fin !== 'number' || lab.hechas.includes(lab.actual.id))) {
    lab.actual = null;
  }
}
