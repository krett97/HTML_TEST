// Sistema de modificadores: todo lo que cambia una estadística (herramientas; después personal,
// gatos legendarios, mudanza y anuncios) se declara como un efecto en los datos. Un solo lugar
// calcula el valor final, así que agregar una fuente nueva no obliga a tocar las fórmulas.
import type { GameData } from './data';
import { ownsTool } from './tools';
import type { Decimal } from './num';
import type { GameState } from './state';

export const STATS = ['danio', 'vistas', 'danioAliados'] as const;
export type Stat = (typeof STATS)[number];

export const OPS = ['suma', 'mult'] as const;
export type Op = (typeof OPS)[number];

/** Como aparece en los JSON: { "stat": "danio", "op": "mult", "valor": 5 }. */
export interface Effect {
  stat: Stat;
  op: Op;
  valor: number;
}

export interface Modifier extends Effect {
  /** De dónde viene, p. ej. "herramienta:garras". Sirve para mostrar desgloses. */
  fuente: string;
}

export function collectModifiers(state: GameState, data: GameData): Modifier[] {
  const mods: Modifier[] = [];
  for (const tool of data.tools) {
    if (!ownsTool(state, tool)) continue;
    for (const effect of tool.efectos) mods.push({ ...effect, fuente: `herramienta:${tool.id}` });
  }
  for (const research of data.research) {
    if (!state.laboratorio.hechas.includes(research.id)) continue;
    for (const effect of research.efectos) mods.push({ ...effect, fuente: `investigacion:${research.id}` });
  }
  return mods;
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
