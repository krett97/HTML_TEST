// Progresión por niveles. Cada objeto de objects.json es un nivel: se pasa rompiéndolo `meta` veces
// (balance.niveles.roturasPorCasa, según la casa del objeto). Al pasar el último objeto de un cuarto
// espera el guardián del cuarto (un mini jefe: el mismo objeto, dorado y enojado; ver jefes.ts), y al
// pasar el último de la casa, el jefe de la casa y la mudanza (mudanza.ts). El Valor ya no avanza
// objetos: solo multiplica lo que paga cada uno (economy.ts).
//
// `progreso.etapa` es el nivel más lejano; `progreso.jugando`, el objeto en la mesa: se puede regresar
// a un nivel anterior para juntar dinero, pero solo las roturas en la etapa cuentan para avanzar.
import type { GameData, ObjectDef } from './data';
import { lastObjectIndex, moveIfReady } from './mudanza';
import { ZERO } from './num';
import type { GameState } from './state';

/** Cuarto de un objeto ("cocina-barra" → "cocina"). */
export function roomOf(obj: ObjectDef): string {
  return obj.lugar.split('-')[0]!;
}

export function frontierIndex(state: GameState, data: GameData): number {
  return Math.min(Math.max(0, state.progreso.etapa), data.objects.length - 1);
}

export function frontierObject(state: GameState, data: GameData): ObjectDef {
  return data.objects[frontierIndex(state, data)]!;
}

/** El jugador está en el nivel más lejano (lo que rompa cuenta para avanzar). */
export function atFrontier(state: GameState, data: GameData): boolean {
  return state.progreso.jugando >= frontierIndex(state, data);
}

/** Roturas que pide el nivel de un objeto: `base` de su casa más `porNivel` por cada objeto anterior de la misma casa. */
export function metaFor(data: GameData, obj: ObjectDef): number {
  const porCasa = data.balance.niveles.roturasPorCasa;
  const regla = porCasa[obj.casa] ?? Object.values(porCasa).at(-1) ?? { base: 10, porNivel: 0 };
  const enCasa = data.objects.indexOf(obj) - data.objects.findIndex((o) => o.casa === obj.casa);
  return Math.floor(regla.base + regla.porNivel * Math.max(0, enCasa));
}

export function levelMeta(state: GameState, data: GameData): number {
  return metaFor(data, frontierObject(state, data));
}

/** Último objeto de su cuarto (después espera el guardián). */
export function isLastOfRoom(data: GameData, index: number): boolean {
  const obj = data.objects[index];
  const next = data.objects[index + 1];
  return !!obj && (!next || next.casa !== obj.casa || roomOf(next) !== roomOf(obj));
}

/** Último objeto de su casa (después esperan el jefe de la casa y la mudanza). */
export function isLastOfHome(data: GameData, index: number): boolean {
  const obj = data.objects[index];
  const next = data.objects[index + 1];
  return !!obj && (!next || next.casa !== obj.casa);
}

/** Qué detiene el avance al terminar el nivel: el guardián del cuarto, el jefe de la casa o la mudanza. */
export type Gate = 'miniJefe' | 'jefe' | 'mudanza';

export function gateAt(state: GameState, data: GameData): Gate | null {
  const index = frontierIndex(state, data);
  if (isLastOfHome(data, index)) {
    const boss = data.bosses.find((b) => b.casa === data.objects[index]!.casa);
    if (boss && !state.jefes.derrotados.includes(boss.id)) return 'jefe';
    return index >= lastObjectIndex(state, data) ? 'mudanza' : null;
  }
  return isLastOfRoom(data, index) ? 'miniJefe' : null;
}

/** Ya se rompió lo que pide el nivel. */
export function levelDone(state: GameState, data: GameData): boolean {
  return state.progreso.roturas >= levelMeta(state, data);
}

/** El guardián del cuarto espera: nivel terminado, en la etapa, y lo que sigue es otro cuarto. */
export function miniBossDue(state: GameState, data: GameData): boolean {
  return atFrontier(state, data) && levelDone(state, data) && gateAt(state, data) === 'miniJefe';
}

/**
 * Pasa al siguiente nivel si el actual está terminado y nada lo detiene (`force` salta la puerta del
 * guardián, cuando ya se le ganó). Devuelve el objeto nuevo o null.
 */
export function advanceLevel(state: GameState, data: GameData, force = false): ObjectDef | null {
  if (!levelDone(state, data)) return null;
  const gate = gateAt(state, data);
  if (gate && !(force && gate === 'miniJefe')) return null;
  const index = frontierIndex(state, data);
  if (index >= data.objects.length - 1) return null;
  state.progreso = { etapa: index + 1, roturas: 0, jugando: index + 1 };
  state.danioObjeto = ZERO;
  moveIfReady(state, data);
  return data.objects[index + 1]!;
}

/** Cambia el objeto de la mesa a un nivel ya alcanzado (para juntar dinero en uno fácil). */
export function goToLevel(state: GameState, data: GameData, index: number): boolean {
  const target = Math.min(Math.max(0, Math.floor(index)), frontierIndex(state, data));
  if (target === state.progreso.jugando) return false;
  state.progreso.jugando = target;
  state.danioObjeto = ZERO;
  return true;
}

/** Pone la etapa en un objeto (modo pruebas, migraciones y pruebas unitarias). */
export function setFrontier(state: GameState, data: GameData, index: number): void {
  const target = Math.min(Math.max(0, Math.floor(index)), data.objects.length - 1);
  state.progreso = { etapa: target, roturas: 0, jugando: target };
  state.danioObjeto = ZERO;
}

export function normalizeProgress(state: GameState, data: GameData): void {
  const last = data.objects.length - 1;
  const p = state.progreso;
  p.etapa = Math.min(Math.max(0, Math.floor(Number(p.etapa) || 0)), last);
  p.jugando = Math.min(Math.max(0, Math.floor(Number(p.jugando) || 0)), p.etapa);
  p.roturas = Math.max(0, Math.floor(Number(p.roturas) || 0));
  const ids = new Set(data.objects.map((o) => o.id));
  state.valor = state.valor.filter((v) => v && ids.has(v.objeto) && Number.isFinite(v.nivel)).map((v) => ({ objeto: v.objeto, nivel: Math.max(0, Math.floor(v.nivel)) }));
}
