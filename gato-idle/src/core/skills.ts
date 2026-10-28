// Habilidades del Canal: se compran con visualizaciones y se conservan al subir el video.
//   embestida   cada `embestidaCada` manotazos, uno pega ×(1 + valor × nivel)
//   recolectora la aspiradora recoge los pedazos: +valor × nivel de dinero
//   pandilla    al empezar cada partida, el gatito, el ratón y el perro ya tienen valor × nivel niveles
//   express     las investigaciones tardan (1 − valor × nivel), sin bajar de la mitad
import type { GameData, ResearchDef, SkillDef, SkillId } from './data';
import { num, type Decimal } from './num';
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

export function skillCost(state: GameState, def: SkillDef): Decimal {
  return def.costoBase.mul(num(def.crecimiento).pow(skillLevel(state, def.id))).floor();
}

export function skillMaxed(state: GameState, def: SkillDef): boolean {
  return skillLevel(state, def.id) >= def.max;
}

export function canAffordSkill(state: GameState, def: SkillDef): boolean {
  return state.pruebas.dineroInfinito || state.canal.visualizaciones.gte(skillCost(state, def));
}

/** Paga con visualizaciones (o gratis con el dinero infinito del modo pruebas). */
export function buySkill(state: GameState, data: GameData, id: string): boolean {
  const def = data.skills.find((s) => s.id === id);
  if (!def || skillMaxed(state, def) || !canAffordSkill(state, def)) return false;
  if (!state.pruebas.dineroInfinito) state.canal.visualizaciones = state.canal.visualizaciones.sub(skillCost(state, def));
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
