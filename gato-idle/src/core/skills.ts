// Árbol de habilidades del Canal. Se compran con visualizaciones (se gastan); los seguidores son el
// récord del canal y abren los pisos del árbol. Cada habilidad pide el nivel 1 de la de arriba en su rama.
//   manotazo    embestida    cada `embestidaCada` manotazos, uno pega ×(1 + valor × nivel)
//               pesas        +valor × nivel de daño del manotazo
//               garrasLargas la marca de las garras dura +valor × nivel segundos
//   pandilla    pandilla     al empezar cada partida, el gatito, el ratón y el perro ya tienen valor × nivel niveles
//               croquetas    +valor × nivel de daño de los aliados
//               veterinario  los aliados cuestan valor × nivel menos
//   produccion  recolectora  la aspiradora recoge los pedazos: +valor × nivel de dinero
//               express      las investigaciones tardan (1 − valor × nivel), sin bajar de la mitad
//               patrocinador los patrocinios pagan +valor × nivel
//   viral       clickbait    +valor × nivel de probabilidad de que el video se haga viral
//               miniaturas   +valor × nivel de visualizaciones por video
//               hashtags     +valor × nivel de seguidores por video
// Reiniciar el árbol devuelve todo lo gastado; cuesta ver ANUNCIOS_REINICIO anuncios.
import type { GameData, ResearchDef, SkillDef, SkillId } from './data';
import { num, ZERO, type Decimal } from './num';
import type { GameState } from './state';

/** Anuncios que hay que ver para reiniciar el árbol. */
export const RESET_ADS = 3;

export function skillDef(data: GameData, id: SkillId): SkillDef {
  return data.skills.find((s) => s.id === id)!;
}

export function skillLevel(state: GameState, id: SkillId | string): number {
  return state.habilidades.find((s) => s.id === id)?.nivel ?? 0;
}

/** Lo que da la habilidad en su nivel actual (valor × nivel). */
export function skillAmount(state: GameState, data: GameData, id: SkillId): number {
  return skillLevel(state, id) * skillDef(data, id).valor;
}

/** Cuánto cuesta el nivel `level` (1 = el primero). */
export function skillCostAt(def: SkillDef, level: number): Decimal {
  return def.costoBase.mul(num(def.crecimiento).pow(level - 1)).floor();
}

/** Cuánto cuesta el siguiente nivel. */
export function skillCost(state: GameState, def: SkillDef): Decimal {
  return skillCostAt(def, skillLevel(state, def.id) + 1);
}

export function skillMaxed(state: GameState, def: SkillDef): boolean {
  return skillLevel(state, def.id) >= def.max;
}

/** Ya hay seguidores para el piso. */
export function floorOpen(state: GameState, data: GameData, piso: number): boolean {
  return state.pruebas.dineroInfinito || state.canal.seguidores >= (data.skillFloors[piso] ?? Infinity);
}

/** La habilidad de arriba en la misma rama (null en el primer piso). */
export function skillParent(data: GameData, def: SkillDef): SkillDef | null {
  return data.skills.find((s) => s.rama === def.rama && s.piso === def.piso - 1) ?? null;
}

/** Su piso ya se abrió y la de arriba ya tiene nivel. */
export function skillAvailable(state: GameState, data: GameData, def: SkillDef): boolean {
  const parent = skillParent(data, def);
  return floorOpen(state, data, def.piso) && (!parent || skillLevel(state, parent.id) > 0);
}

/** Se puede comprar el siguiente nivel ahora mismo. */
export function skillBuyable(state: GameState, data: GameData, def: SkillDef): boolean {
  if (skillMaxed(state, def) || !skillAvailable(state, data, def)) return false;
  return state.pruebas.dineroInfinito || state.canal.visualizaciones.gte(skillCost(state, def));
}

/** Compra el siguiente nivel con visualizaciones. */
export function buySkill(state: GameState, data: GameData, id: string): boolean {
  const def = data.skills.find((s) => s.id === id);
  if (!def || !skillBuyable(state, data, def)) return false;
  if (!state.pruebas.dineroInfinito) state.canal.visualizaciones = state.canal.visualizaciones.sub(skillCost(state, def));
  const entry = state.habilidades.find((s) => s.id === id);
  if (entry) entry.nivel += 1;
  else state.habilidades.push({ id, nivel: 1 });
  return true;
}

/** Visualizaciones metidas en el árbol (lo que devuelve reiniciarlo). */
export function treeSpent(state: GameState, data: GameData): Decimal {
  let total = ZERO;
  for (const { id, nivel } of state.habilidades) {
    const def = data.skills.find((s) => s.id === id);
    for (let level = 1; def && level <= nivel; level++) total = total.add(skillCostAt(def, level));
  }
  return total;
}

/**
 * Cuenta un anuncio visto para reiniciar el árbol. Al llegar a RESET_ADS devuelve todo lo gastado
 * y deja el árbol vacío. Regresa las visualizaciones devueltas, o null si aún faltan anuncios.
 */
export function watchResetAd(state: GameState, data: GameData): Decimal | null {
  if (state.habilidades.length === 0) return null;
  state.canal.anunciosReinicio += 1;
  if (state.canal.anunciosReinicio < RESET_ADS) return null;
  const refund = treeSpent(state, data);
  state.canal.visualizaciones = state.canal.visualizaciones.add(refund);
  state.habilidades = [];
  state.canal.anunciosReinicio = 0;
  return refund;
}

/** Por cuánto multiplica el daño la embestida cuando llega. */
export function rammingMultiplier(state: GameState, data: GameData): number {
  return 1 + skillAmount(state, data, 'embestida');
}

/** Cuánto tarda una investigación con la habilidad "express". */
export function researchDuration(state: GameState, data: GameData, research: ResearchDef): number {
  return Math.round(research.duracion * Math.max(0.5, 1 - skillAmount(state, data, 'express')));
}

/** Aliados con los que empieza cada partida (habilidad "pandilla"). */
export const STARTING_GANG = ['gatito', 'raton', 'perro'] as const;

export function normalizeSkills(state: GameState, data: GameData): void {
  const seen = new Set<string>();
  state.habilidades = state.habilidades.filter((entry) => {
    const def = data.skills.find((s) => s.id === entry?.id);
    if (!def || seen.has(entry.id)) return false;
    seen.add(entry.id);
    entry.nivel = Math.min(def.max, Math.max(0, Math.floor(Number(entry.nivel) || 0)));
    return entry.nivel > 0;
  });
  const ads = Math.floor(Number(state.canal.anunciosReinicio) || 0);
  state.canal.anunciosReinicio = Math.min(RESET_ADS - 1, Math.max(0, ads));
}
