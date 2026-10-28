// Fórmulas de la economía: daño, vistas, costos y compras. Todos los números vienen de
// src/data/*.json; aquí solo está cómo se combinan.
import type { GameData, ObjectDef, ToolDef } from './data';
import { applyModifiers, collectModifiers } from './modifiers';
import { nextTool, ownsTool } from './tools';
import { num, ZERO, type Decimal } from './num';
import type { GameState } from './state';

// ---- Objeto en la mesa ----

/** Cada `nivelesPorObjeto` niveles de Valor, el dueño compra el siguiente objeto. */
export function objectIndexFor(nivelValor: number, data: GameData): number {
  const index = Math.floor(nivelValor / data.balance.valor.nivelesPorObjeto);
  return Math.min(Math.max(index, 0), data.objects.length - 1);
}

export function currentObject(state: GameState, data: GameData): ObjectDef {
  return data.objects[objectIndexFor(state.nivelValor, data)]!;
}

/** Niveles de Valor comprados sobre el objeto actual (0 recién comprado). En el último objeto no tiene tope. */
export function valorStepsInObject(state: GameState, data: GameData): number {
  return state.nivelValor - objectIndexFor(state.nivelValor, data) * data.balance.valor.nivelesPorObjeto;
}

export function objectProgress(state: GameState, data: GameData): number {
  return Math.min(1, state.danioObjeto.div(currentObject(state, data).hp).toNumber());
}

// ---- Estadísticas ----

/** (1 + nivel × daño por nivel), y cada `hitoCada` niveles todo se multiplica por `multHito`. */
export function baseDamage(nivelFuerza: number, data: GameData): Decimal {
  const { danioPorNivel, hitoCada, multHito } = data.balance.fuerza;
  return num(1 + nivelFuerza * danioPorNivel).mul(num(multHito).pow(Math.floor(nivelFuerza / hitoCada)));
}

export function tapDamage(state: GameState, data: GameData): Decimal {
  return applyModifiers(baseDamage(state.nivelFuerza, data), 'danio', collectModifiers(state, data));
}

/** Manotazos que necesita el objeto actual desde cero. */
export function tapsToBreak(state: GameState, data: GameData): number {
  const taps = currentObject(state, data).hp.div(tapDamage(state, data)).ceil();
  return Math.max(1, taps.toNumber());
}

export function viewsPerBreak(state: GameState, data: GameData): Decimal {
  const { vistasPorNivel } = data.balance.valor;
  const base = currentObject(state, data).vistas.mul(Math.pow(1 + vistasPorNivel, valorStepsInObject(state, data)));
  return applyModifiers(base, 'vistas', collectModifiers(state, data)).floor();
}

export function moneyPerBreak(state: GameState, data: GameData): Decimal {
  return viewsPerBreak(state, data).mul(data.balance.tarifaPorVista);
}

// ---- Costos ----

export function fuerzaCost(state: GameState, data: GameData): Decimal {
  const { costoBase, crecimiento } = data.balance.fuerza;
  return num(costoBase).mul(num(crecimiento).pow(state.nivelFuerza)).floor();
}

/** Escala con lo que paga el objeto actual, así subir Valor cuesta "unas cuantas roturas" en cualquier etapa. */
export function valorCost(state: GameState, data: GameData): Decimal {
  const { costoEnRoturas, crecimiento } = data.balance.valor;
  const basePayout = currentObject(state, data).vistas.mul(data.balance.tarifaPorVista);
  return basePayout.mul(costoEnRoturas).mul(num(crecimiento).pow(valorStepsInObject(state, data))).floor();
}

export interface ValorPreview {
  /** El objeto que compraría el dueño con el siguiente nivel, si cambia. */
  nextObject: ObjectDef | null;
  /** La herramienta que hace falta para ese objeto, si aún no se tiene. */
  requiredTool: ToolDef | null;
}

export function valorPreview(state: GameState, data: GameData): ValorPreview {
  const current = objectIndexFor(state.nivelValor, data);
  const next = objectIndexFor(state.nivelValor + 1, data);
  if (next === current) return { nextObject: null, requiredTool: null };
  const nextObject = data.objects[next]!;
  const tool = data.tools.find((t) => t.id === nextObject.herramienta)!;
  return { nextObject, requiredTool: ownsTool(state, tool) ? null : tool };
}

// ---- Compras ----

function pay(state: GameState, cost: Decimal): boolean {
  if (state.dinero.lt(cost)) return false;
  state.dinero = state.dinero.sub(cost);
  return true;
}

export function buyFuerza(state: GameState, data: GameData): boolean {
  if (!pay(state, fuerzaCost(state, data))) return false;
  state.nivelFuerza += 1;
  return true;
}

export interface ValorPurchase {
  bought: boolean;
  /** Si el dueño cambió de objeto, el nuevo. */
  newObject: ObjectDef | null;
}

export function buyValor(state: GameState, data: GameData): ValorPurchase {
  const preview = valorPreview(state, data);
  if (preview.requiredTool || !pay(state, valorCost(state, data))) return { bought: false, newObject: null };
  state.nivelValor += 1;
  // Objeto nuevo: empieza en el centro de la mesa.
  if (preview.nextObject) state.danioObjeto = ZERO;
  return { bought: true, newObject: preview.nextObject };
}

/**
 * Una herramienta se compra cuando hace falta: cuando el dueño quiere comprar el primer objeto
 * de su familia. Así no se puede saltar la etapa anterior comprándola antes.
 */
export function toolAvailable(state: GameState, data: GameData, toolId: string): boolean {
  return valorPreview(state, data).requiredTool?.id === toolId;
}

export function buyTool(state: GameState, data: GameData, toolId: string): boolean {
  if (!toolAvailable(state, data, toolId)) return false;
  const tool = nextTool(state, data)!;
  if (!pay(state, tool.costo)) return false;
  state.herramientas.push(tool.id);
  return true;
}

export { nextTool, ownsTool };
