// Aliados: mascotas que golpean solas cada cierto tiempo, sin que el jugador toque.
import type { AllyDef, GameData } from './data';
import { applyModifiers, collectModifiers } from './modifiers';
import { num, type Decimal } from './num';
import type { GameState } from './state';
import { hasUnlock } from './unlocks';

export function allyLevel(state: GameState, allyId: string): number {
  return state.aliados.find((a) => a.id === allyId)?.nivel ?? 0;
}

/** Disponible para adoptar: ya se descubrió (unlocks.json, "aliado:<id>"). */
export function allyUnlocked(state: GameState, _data: GameData, ally: AllyDef): boolean {
  return hasUnlock(state, `aliado:${ally.id}`);
}

/** Daño de cada golpe: base × nivel, y ×multHito cada `hitoCada` niveles. */
export function allyHitDamage(level: number, ally: AllyDef, state: GameState, data: GameData): Decimal {
  if (level <= 0) return num(0);
  const { hitoCada, multHito } = data.balance.aliados;
  const base = num(ally.danioBase * level).mul(num(multHito).pow(Math.floor(level / hitoCada)));
  return applyModifiers(base, 'danioAliados', collectModifiers(state, data));
}

export function allyCost(state: GameState, data: GameData, ally: AllyDef): Decimal {
  return ally.costoBase.mul(num(ally.crecimiento).pow(allyLevel(state, ally.id))).floor();
}

/** Daño por segundo de todos los aliados juntos. */
export function alliesDps(state: GameState, data: GameData): Decimal {
  let total = num(0);
  for (const ally of data.allies) {
    total = total.add(allyHitDamage(allyLevel(state, ally.id), ally, state, data).div(ally.intervalo));
  }
  return total;
}

export function buyAlly(state: GameState, data: GameData, allyId: string): boolean {
  const ally = data.allies.find((a) => a.id === allyId);
  if (!ally || !allyUnlocked(state, data, ally)) return false;
  const cost = allyCost(state, data, ally);
  if (state.dinero.lt(cost)) return false;
  state.dinero = state.dinero.sub(cost);
  const entry = state.aliados.find((a) => a.id === allyId);
  if (entry) entry.nivel += 1;
  else state.aliados.push({ id: allyId, nivel: 1 });
  return true;
}

/** Deja solo aliados que existen, con niveles enteros y positivos. */
export function normalizeAllies(state: GameState, data: GameData): void {
  const known = new Set(data.allies.map((a) => a.id));
  const seen = new Set<string>();
  state.aliados = state.aliados.filter((entry) => {
    if (!entry || typeof entry !== 'object' || !known.has(entry.id) || seen.has(entry.id)) return false;
    seen.add(entry.id);
    entry.nivel = Math.max(0, Math.floor(Number(entry.nivel) || 0));
    return entry.nivel > 0;
  });
}
