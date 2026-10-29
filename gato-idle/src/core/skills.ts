// Habilidades del Canal: no se compran. Cada nivel se desbloquea al juntar seguidores o
// visualizaciones (totales que solo crecen) y el jugador lo reclama con un toque.
//   embestida   cada `embestidaCada` manotazos, uno pega ×(1 + valor × nivel)   (seguidores)
//   recolectora la aspiradora recoge los pedazos: +valor × nivel de dinero      (visualizaciones)
//   pandilla    al empezar cada partida, el gatito, el ratón y el perro ya tienen valor × nivel niveles (seguidores)
//   express     las investigaciones tardan (1 − valor × nivel), sin bajar de la mitad (visualizaciones)
import type { GameData, ResearchDef, SkillDef, SkillId, SkillResource } from './data';
import type { GameState } from './state';

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

/** Cuánto del recurso pide el nivel `level` (1 = el primero). */
export function skillRequirement(def: SkillDef, level: number): number {
  return Math.ceil(def.base * Math.pow(def.crecimiento, level - 1));
}

/** Seguidores o visualizaciones totales del canal. */
export function resourceTotal(state: GameState, recurso: SkillResource): number {
  return recurso === 'seguidores' ? state.canal.seguidores : state.canal.visualizaciones.toNumber();
}

export function skillMaxed(state: GameState, def: SkillDef): boolean {
  return skillLevel(state, def.id) >= def.max;
}

/** Ya se alcanzó la meta del siguiente nivel y se puede reclamar. */
export function skillClaimable(state: GameState, def: SkillDef): boolean {
  if (skillMaxed(state, def)) return false;
  return state.pruebas.dineroInfinito || resourceTotal(state, def.recurso) >= skillRequirement(def, skillLevel(state, def.id) + 1);
}

/** Reclama el siguiente nivel si ya se alcanzó su meta (no cuesta nada). */
export function claimSkill(state: GameState, data: GameData, id: string): boolean {
  const def = data.skills.find((s) => s.id === id);
  if (!def || !skillClaimable(state, def)) return false;
  const entry = state.habilidades.find((s) => s.id === id);
  if (entry) entry.nivel += 1;
  else state.habilidades.push({ id, nivel: 1 });
  return true;
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
}
