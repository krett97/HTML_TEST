import { normalizeAllies } from './allies';
import { BUY_AMOUNTS } from './bulk';
import { normalizeCanal } from './canal';
import { normalizeSkills } from './skills';
import type { GameData } from './data';
import { ZERO } from './num';
import type { GameState } from './state';

// Partidas guardadas.

/**
 * Corrige lo que no cuadre con los datos actuales (un guardado viejo, un objeto que se quitó de
 * los JSON): niveles enteros, descubrimientos e investigaciones que existan.
 */
export function normalizeState(state: GameState, data: GameData): void {
  state.nivelFuerza = Math.max(0, Math.floor(state.nivelFuerza));
  state.nivelValor = Math.max(0, Math.floor(state.nivelValor));
  state.nivelDanioCritico = Math.max(0, Math.floor(state.nivelDanioCritico));
  state.nivelSaco = Math.max(0, Math.floor(state.nivelSaco));
  // La probabilidad no pasa del tope aunque cambie balance.json.
  const { probPorNivel, probMax } = data.balance.critico;
  state.nivelCritico = Math.min(Math.max(0, Math.floor(state.nivelCritico)), Math.ceil(probMax / probPorNivel));
  if (state.danioObjeto.lt(0)) state.danioObjeto = ZERO;
  normalizeAllies(state, data);
  if (!BUY_AMOUNTS.includes(state.ajustes.compra)) state.ajustes.compra = 1;
  normalizeSkills(state, data);
  normalizeCanal(state);
  state.stats.roturasPartida = Math.max(0, Math.floor(state.stats.roturasPartida));
  const pruebas = state.pruebas;
  if (!Number.isFinite(pruebas.multDanio) || pruebas.multDanio < 1) pruebas.multDanio = 1;

  const unlockIds = new Set(data.unlocks.map((u) => u.id));
  state.desbloqueos = [...new Set(state.desbloqueos.filter((id) => unlockIds.has(id)))];
  const researchIds = new Set(data.research.map((r) => r.id));
  const lab = state.laboratorio;
  lab.hechas = [...new Set(lab.hechas.filter((id) => researchIds.has(id)))];
  if (lab.actual && (!researchIds.has(lab.actual.id) || typeof lab.actual.fin !== 'number' || lab.hechas.includes(lab.actual.id))) {
    lab.actual = null;
  }
}
