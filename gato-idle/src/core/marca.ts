// Garras marcadoras: cada zarpazo crítico del gato deja el objeto marcado unos segundos (rasguños
// brillantes y "¡MARCADO!"); mientras dura, la pandilla pega un poco más. Premia tocar activo:
// sin toques no hay críticos y la marca se cae sola (y no cuenta en lo que se gana sin jugar).
import type { GameData } from './data';
import { critChance } from './economy';
import { skillAmount } from './skills';
import type { GameState } from './state';

/** Cuánto dura la marca (con la habilidad "garrasLargas", más). */
export function markSeconds(state: GameState, data: GameData): number {
  return data.balance.marca.segundos + skillAmount(state, data, 'garrasLargas');
}

/** Por cuánto se multiplica el daño de los aliados mientras el objeto está marcado. */
export function markMultiplier(state: GameState, data: GameData): number {
  return 1 + state.nivelMarca * data.balance.marca.multPorNivel;
}

export function markActive(state: GameState, now: number): boolean {
  return state.nivelMarca > 0 && now < state.marcaHasta;
}

/** Un crítico marca el objeto (o renueva la marca). Devuelve true si no estaba marcado. */
export function applyMark(state: GameState, data: GameData, now: number): boolean {
  if (state.nivelMarca <= 0) return false;
  const fresh = !markActive(state, now);
  state.marcaHasta = now + markSeconds(state, data) * 1000;
  return fresh;
}

/** Segundos que le quedan a la marca (0: sin marca). */
export function markRemaining(state: GameState, now: number): number {
  return markActive(state, now) ? (state.marcaHasta - now) / 1000 : 0;
}

/**
 * Para el simulador y lo esperado por segundo: qué parte del tiempo está marcado el objeto
 * tocando `tapsPerSecond` veces (la probabilidad de que en `segundos` haya al menos un crítico).
 */
export function markUptime(state: GameState, data: GameData, tapsPerSecond: number): number {
  if (state.nivelMarca <= 0 || tapsPerSecond <= 0) return 0;
  const taps = markSeconds(state, data) * tapsPerSecond;
  return 1 - Math.pow(1 - critChance(state, data), taps);
}

/** Multiplicador promedio del daño de los aliados contando cuánto tiempo dura la marca. */
export function expectedMarkMultiplier(state: GameState, data: GameData, tapsPerSecond: number): number {
  return 1 + markUptime(state, data, tapsPerSecond) * (markMultiplier(state, data) - 1);
}
