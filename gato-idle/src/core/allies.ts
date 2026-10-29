// Aliados: mascotas que golpean solas cada cierto tiempo, sin que el jugador toque.
import type { AllyDef, GameData } from './data';
import { applyModifiers, collectModifiers } from './modifiers';
import { num, type Decimal } from './num';
import type { GameState } from './state';
import { hasUnlock } from './unlocks';
import { pay } from './wallet';
import { skillAmount } from './skills';

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
  // Habilidad "veterinario": la pandilla sale más barata.
  const discount = 1 - skillAmount(state, data, 'veterinario');
  return ally.costoBase.mul(num(ally.crecimiento).pow(allyLevel(state, ally.id))).mul(discount).floor();
}

/** Daño por segundo de todos los aliados juntos. */
export function alliesDps(state: GameState, data: GameData): Decimal {
  let total = num(0);
  for (const ally of data.allies) {
    total = total.add(allyHitDamage(allyLevel(state, ally.id), ally, state, data).div(ally.intervalo));
  }
  return total;
}

/** Cuánto daño por segundo sumaría el siguiente nivel (o adoptarlo), con todos los bonos. */
export function allyUpgradeGain(state: GameState, data: GameData, ally: AllyDef): Decimal {
  const after: GameState = {
    ...state,
    aliados: allyLevel(state, ally.id) > 0
      ? state.aliados.map((a) => (a.id === ally.id ? { ...a, nivel: a.nivel + 1 } : a))
      : [...state.aliados, { id: ally.id, nivel: 1 }],
  };
  return alliesDps(after, data).sub(alliesDps(state, data));
}

/**
 * El aliado cuya siguiente compra da más daño por cada peso. Solo para revisar el balance: el juego
 * no lo muestra, escoger bien es parte de la habilidad del jugador.
 */
export function bestAllyPurchase(state: GameState, data: GameData): string | null {
  let best: string | null = null;
  let bestRatio = -1;
  for (const ally of data.allies) {
    if (!allyUnlocked(state, data, ally)) continue;
    const ratio = allyUpgradeGain(state, data, ally).div(allyCost(state, data, ally)).toNumber();
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = ally.id;
    }
  }
  return best;
}

export function buyAlly(state: GameState, data: GameData, allyId: string): boolean {
  const ally = data.allies.find((a) => a.id === allyId);
  if (!ally || !allyUnlocked(state, data, ally)) return false;
  if (!pay(state, allyCost(state, data, ally))) return false;
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
