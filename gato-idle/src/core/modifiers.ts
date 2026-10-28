// Sistema de modificadores: todo lo que cambia una estadística (investigaciones; después personal,
// gatos legendarios, habilidades de la mudanza y anuncios) se declara como un efecto en los datos. Un solo lugar
// calcula el valor final, así que agregar una fuente nueva no obliga a tocar las fórmulas.
import type { GameData } from './data';
import type { Decimal } from './num';

import type { GameState } from './state';

export const STATS = ['danio', 'vistas', 'danioAliados'] as const;
export type Stat = (typeof STATS)[number];

export const OPS = ['suma', 'mult'] as const;
export type Op = (typeof OPS)[number];

/**
 * Como aparece en los JSON: { "stat": "danio", "op": "mult", "valor": 5 }.
 * Con "escala": "aliados", el efecto crece con los aliados adoptados: ×(1 + valor × aliados).
 */
export interface Effect {
  stat: Stat;
  op: Op;
  valor: number;
  escala?: 'aliados';
}

export interface Modifier extends Effect {
  /** De dónde viene, p. ej. "investigacion:mirada". Sirve para mostrar desgloses. */
  fuente: string;
}

export function collectModifiers(state: GameState, data: GameData): Modifier[] {
  const mods: Modifier[] = [];
  // Saco de jefe: el gato de traje dirige a la pandilla y todos los aliados pegan más.
  if (state.nivelSaco > 0) {
    mods.push({ stat: 'danioAliados', op: 'mult', valor: sacoMultiplier(state, data), fuente: 'mejora:saco' });
  }
  for (const research of data.research) {
    if (!state.laboratorio.hechas.includes(research.id)) continue;
    for (const effect of research.efectos) {
      mods.push({ ...resolveEffect(effect, state), fuente: `investigacion:${research.id}` });
    }
  }
  return mods;
}

/** Por cuánto multiplica el Saco de jefe el daño de los aliados. */
export function sacoMultiplier(state: GameState, data: GameData): number {
  return 1 + state.nivelSaco * data.balance.saco.multPorNivel;
}

/** Cuántos aliados distintos se han adoptado. */
export function adoptedAllies(state: GameState): number {
  return state.aliados.filter((a) => a.nivel > 0).length;
}

/** Convierte un efecto que escala ("por cada aliado") en su valor de ahora. */
export function resolveEffect(effect: Effect, state: GameState): Effect {
  if (effect.escala !== 'aliados') return effect;
  const count = adoptedAllies(state);
  return { stat: effect.stat, op: effect.op, valor: effect.op === 'mult' ? 1 + effect.valor * count : effect.valor * count };
}

/** Primero las sumas y después las multiplicaciones: (base + Σ suma) × Π mult. */
export function applyModifiers(base: Decimal, stat: Stat, mods: Modifier[]): Decimal {
  let add = 0;
  let mult = 1;
  for (const mod of mods) {
    if (mod.stat !== stat) continue;
    if (mod.op === 'suma') add += mod.valor;
    else mult *= mod.valor;
  }
  return base.add(add).mul(mult);
}
