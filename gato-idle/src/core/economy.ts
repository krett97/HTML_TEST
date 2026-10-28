// Fórmulas de la economía: daño, vistas, costos y compras. Todos los números vienen de
// src/data/*.json; aquí solo está cómo se combinan.
import type { GameData, ObjectDef } from './data';
import { applyModifiers, collectModifiers } from './modifiers';
import { num, ZERO, type Decimal } from './num';
import type { GameState } from './state';
import { rammingMultiplier } from './skills';
import { pay } from './wallet';

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
  // Modo pruebas: daño infinito tira cualquier objeto de un manotazo.
  if (state.pruebas.danioInfinito) return currentObject(state, data).hp;
  const damage = applyModifiers(baseDamage(state.nivelFuerza, data), 'danio', collectModifiers(state, data));
  return state.pruebas.multDanio === 1 ? damage : damage.mul(state.pruebas.multDanio);
}

// ---- Críticos ----

/** Probabilidad de que un manotazo sea crítico (0 a probMax). */
export function critChance(state: GameState, data: GameData): number {
  const { probPorNivel, probMax } = data.balance.critico;
  return Math.min(probMax, state.nivelCritico * probPorNivel);
}

/** Por cuánto multiplica el daño un crítico. */
export function critMultiplier(state: GameState, data: GameData): number {
  const { multBase, multPorNivel } = data.balance.danioCritico;
  return multBase + state.nivelDanioCritico * multPorNivel;
}

/**
 * Cuánto rinde en promedio cada manotazo gracias a los críticos: 1 + prob × (mult − 1).
 * Con esto el simulador y la economía tratan los críticos como un multiplicador medible.
 */
export function critFactor(state: GameState, data: GameData): number {
  return 1 + critChance(state, data) * (critMultiplier(state, data) - 1);
}

/** Daño promedio de un manotazo, contando los críticos y la embestida (una de cada `embestidaCada`). */
export function expectedTapDamage(state: GameState, data: GameData): Decimal {
  const ramming = 1 + (rammingMultiplier(state, data) - 1) / data.balance.canal.embestidaCada;
  return tapDamage(state, data).mul(critFactor(state, data) * ramming);
}

export function critChanceMaxed(state: GameState, data: GameData): boolean {
  return critChance(state, data) >= data.balance.critico.probMax;
}

/** Manotazos que necesita el objeto actual desde cero (sin contar críticos). */
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

export function critChanceCost(state: GameState, data: GameData): Decimal {
  const { costoBase, crecimiento } = data.balance.critico;
  return num(costoBase).mul(num(crecimiento).pow(state.nivelCritico)).floor();
}

export function critDamageCost(state: GameState, data: GameData): Decimal {
  const { costoBase, crecimiento } = data.balance.danioCritico;
  return num(costoBase).mul(num(crecimiento).pow(state.nivelDanioCritico)).floor();
}

export function sacoCost(state: GameState, data: GameData): Decimal {
  const { costoBase, crecimiento } = data.balance.saco;
  return num(costoBase).mul(num(crecimiento).pow(state.nivelSaco)).floor();
}

/** El objeto que compraría el dueño con el siguiente nivel de Valor, si cambia. */
export function valorNextObject(state: GameState, data: GameData): ObjectDef | null {
  const current = objectIndexFor(state.nivelValor, data);
  const next = objectIndexFor(state.nivelValor + 1, data);
  return next === current ? null : data.objects[next]!;
}

// ---- Compras ----

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
  const nextObject = valorNextObject(state, data);
  if (!pay(state, valorCost(state, data))) return { bought: false, newObject: null };
  state.nivelValor += 1;
  // Objeto nuevo: empieza en el centro de la mesa.
  if (nextObject) state.danioObjeto = ZERO;
  return { bought: true, newObject: nextObject };
}

export function buyCritChance(state: GameState, data: GameData): boolean {
  if (critChanceMaxed(state, data) || !pay(state, critChanceCost(state, data))) return false;
  state.nivelCritico += 1;
  return true;
}

export function buySaco(state: GameState, data: GameData): boolean {
  if (!pay(state, sacoCost(state, data))) return false;
  state.nivelSaco += 1;
  return true;
}

export function buyCritDamage(state: GameState, data: GameData): boolean {
  if (!pay(state, critDamageCost(state, data))) return false;
  state.nivelDanioCritico += 1;
  return true;
}
