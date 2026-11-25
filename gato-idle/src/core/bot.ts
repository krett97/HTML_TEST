// Un jugador automático: toca a ritmo constante y compra lo que antes se paga solo. Lo usan el
// simulador de balance (tools/simulate.ts) y el modo pruebas ("avanzar como jugador"), así que
// la partida a la que salta el modo pruebas se parece a la de alguien que jugó de verdad.
import { allyCost, allyUnlocked, buyAlly } from './allies';
import type { GameData } from './data';
import {
  buyCritChance,
  buyCritDamage,
  buyFuerza,
  buySaco,
  buyMark,
  markCost,
  markMaxed,
  buyValor,
  critChanceCost,
  critChanceMaxed,
  critDamageCost,
  fuerzaCost,
  sacoCost,
  valorCost,
  currentObject,
} from './economy';
import { breaksPerSecond, incomePerSecond } from './income';
import { lastObjectIndex } from './mudanza';
import { advanceLevel, atFrontier, frontierIndex, gateAt, levelDone, levelMeta } from './niveles';
import { bossHp, miniBossHere } from './jefes';
import { num, type Decimal } from './num';
import { pruebasIniciales, type GameState } from './state';
import { checkUnlocks, hasUnlock, nextUnlock } from './unlocks';
import type { UnlockDef } from './data';

interface Option {
  name: string;
  /** Precio exacto (Decimal) y como número, para puntuar. */
  precio: Decimal;
  cost: number;
  apply: (s: GameState) => void;
}

function clone(state: GameState): GameState {
  return { ...state, aliados: state.aliados.map((a) => ({ ...a })), valor: state.valor.map((v) => ({ ...v })), progreso: { ...state.progreso } };
}

function options(state: GameState, data: GameData): Option[] {
  const list: Option[] = [];
  if (hasUnlock(state, 'fuerza')) {
    list.push({ name: 'fuerza', precio: fuerzaCost(state, data), cost: fuerzaCost(state, data).toNumber(), apply: (s) => void buyFuerza(s, data) });
  }
  // Valor solo en el objeto del frente (en uno de atrás solo sirve mientras se junta dinero).
  if (hasUnlock(state, 'valor') && atFrontier(state, data)) {
    list.push({ name: 'valor', precio: valorCost(state, data), cost: valorCost(state, data).toNumber(), apply: (s) => void buyValor(s, data) });
  }
  if (hasUnlock(state, 'critico') && !critChanceMaxed(state, data)) {
    list.push({ name: 'critico', precio: critChanceCost(state, data), cost: critChanceCost(state, data).toNumber(), apply: (s) => void buyCritChance(s, data) });
  }
  if (hasUnlock(state, 'danioCritico')) {
    list.push({ name: 'danioCritico', precio: critDamageCost(state, data), cost: critDamageCost(state, data).toNumber(), apply: (s) => void buyCritDamage(s, data) });
  }
  if (hasUnlock(state, 'marca') && !markMaxed(state, data)) {
    list.push({ name: 'marca', precio: markCost(state, data), cost: markCost(state, data).toNumber(), apply: (s) => void buyMark(s, data) });
  }
  if (hasUnlock(state, 'saco')) {
    list.push({ name: 'saco', precio: sacoCost(state, data), cost: sacoCost(state, data).toNumber(), apply: (s) => void buySaco(s, data) });
  }
  for (const ally of data.allies) {
    if (!allyUnlocked(state, data, ally)) continue;
    list.push({ name: `aliado:${ally.id}`, precio: allyCost(state, data, ally), cost: allyCost(state, data, ally).toNumber(), apply: (s) => void buyAlly(s, data, ally.id) });
  }
  return list;
}

/**
 * Elige la compra que antes se paga sola: espera para comprarla + tiempo en recuperarla. Lo que rinde
 * se mide en el objeto del frente (la meta), aunque el dinero se esté juntando en un nivel anterior.
 */
function choose(state: GameState, data: GameData, tps: number): Option {
  const frontier = frontierIndex(state, data);
  const atFront = (s: GameState): GameState => ({ ...s, progreso: { ...s.progreso, jugando: frontier } });
  const earning = incomePerSecond(state, data, tps).toNumber(); // lo que entra ahora (mesa actual)
  const rate = incomePerSecond(atFront(state), data, tps).toNumber();
  let best: Option | null = null;
  let bestScore = Infinity;
  for (const option of options(state, data)) {
    const after = clone(state);
    after.dinero = after.dinero.add(option.cost);
    option.apply(after);
    const gain = incomePerSecond(atFront(after), data, tps).toNumber() - rate;
    const wait = Math.max(0, option.cost - state.dinero.toNumber()) / Math.max(earning, 1e-9);
    const score = wait + option.cost / Math.max(gain, 1e-9);
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }
  if (!best) {
    // Ninguna puntuación salió válida (NaN/∞ por números fuera de rango): se compra lo más barato.
    const all = options(state, data);
    console.warn('bot: sin puntuación válida (números fuera de rango); se compra lo más barato');
    return all.reduce((a, b) => (b.cost < a.cost ? b : a));
  }
  return best;
}

/**
 * Las roturas de un rato de juego cuentan para el nivel (como en actions.ts): se pasa de nivel las veces
 * que alcance y, si espera el guardián del cuarto, se le pelea con el daño por segundo que se tiene
 * (gana si le quita la vida en su tiempo; si no, se queda juntando y lo reintenta en el siguiente paso).
 */
function progressBreaks(state: GameState, data: GameData, broken: number, tps: number): void {
  if (!atFrontier(state, data)) return; // juntando dinero en un nivel anterior: no cuenta
  let left = broken;
  for (let guard = 0; left > 0 && guard < 10_000; guard++) {
    const used = Math.min(left, Math.max(0, levelMeta(state, data) - state.progreso.roturas));
    state.progreso.roturas += used;
    left -= used;
    if (!levelDone(state, data)) break;
    if (advanceLevel(state, data)) continue;
    break; // guardián, jefe de la casa o mudanza: tryGuardian / el simulador / el jugador
  }
  void tps;
}

/** Dinero por segundo que se sacaría con el objeto `index` en la mesa. */
function incomeAt(state: GameState, data: GameData, tps: number, index: number): number {
  return incomePerSecond({ ...state, progreso: { ...state.progreso, jugando: index } }, data, tps).toNumber();
}

/**
 * Decide qué objeto poner en la mesa, como haría un jugador: el del frente mientras caiga a buen ritmo;
 * si ahí cada rotura tarda más de SLOW_SECONDS (gato y pandilla juntos), junta dinero en el nivel
 * anterior que más deje por segundo, para pagar Fuerza y pandilla, y vuelve en cuanto el frente rinda.
 */
const SLOW_SECONDS = 6;

function pickTable(state: GameState, data: GameData, tps: number): void {
  const frontier = frontierIndex(state, data);
  const front = { ...state, progreso: { ...state.progreso, jugando: frontier } };
  if (breaksPerSecond(front, data, tps) >= 1 / SLOW_SECONDS) {
    state.progreso = { ...state.progreso, jugando: frontier };
    return;
  }
  let best = { index: frontier, income: incomeAt(state, data, tps, frontier) };
  for (let i = frontier - 1; i >= 0; i--) {
    const income = incomeAt(state, data, tps, i);
    if (income > best.income) best = { index: i, income };
  }
  state.progreso = { ...state.progreso, jugando: best.index };
}

/** Si el nivel del frente está terminado y espera el guardián, le pelea con el daño que se tiene en ese objeto. */
function tryGuardian(state: GameState, data: GameData, tps: number): void {
  if (!levelDone(state, data) || gateAt(state, data) !== 'miniJefe') return;
  const front = { ...state, progreso: { ...state.progreso, jugando: frontierIndex(state, data) } };
  const mini = miniBossHere(front, data);
  if (!mini) return;
  const dps = breaksPerSecond(front, data, tps) * currentObject(front, data).hp.toNumber();
  if (dps * mini.segundos >= bossHp(data, mini, front).toNumber()) advanceLevel(state, data, true);
}

export interface BotStep {
  /** Segundos de juego que tomó este paso. */
  seconds: number;
  /** Qué compró ("fuerza", "valor", "critico", "aliado:perro"…) o null si solo tocó. */
  bought: string | null;
  discovered: UnlockDef[];
}

/** Un paso: toca hasta poder pagar la mejor compra y la compra (o toca hasta el siguiente descubrimiento). */
export function botStep(state: GameState, data: GameData, tps: number): BotStep {
  pickTable(state, data, tps);
  if (options(state, data).length === 0) {
    const next = nextUnlock(state, data);
    const missing = next && 'roturas' in next.unlock.condicion ? next.target - next.current : 1;
    const seconds = missing / breaksPerSecond(state, data, tps);
    const earned = incomePerSecond(state, data, tps).mul(seconds);
    state.dinero = state.dinero.add(earned);
    state.dineroPartida = state.dineroPartida.add(earned);
    state.stats.roturas += missing;
    state.stats.roturasPartida += missing;
    progressBreaks(state, data, missing, tps);
    tryGuardian(state, data, tps);
    return { seconds, bought: null, discovered: checkUnlocks(state, data) };
  }
  const option = choose(state, data, tps);
  const rate = incomePerSecond(state, data, tps).toNumber();
  const seconds = Math.max(0, option.cost - state.dinero.toNumber()) / rate;
  state.dinero = state.dinero.add(rate * seconds);
  state.dineroPartida = state.dineroPartida.add(rate * seconds);
  const broken = Math.floor(breaksPerSecond(state, data, tps) * seconds);
  state.stats.roturas += broken;
  state.stats.roturasPartida += broken;
  // Evita quedarse a una fracción de centavo por redondeo (con el precio exacto: los números grandes pierden decimales).
  if (state.dinero.lt(option.precio)) state.dinero = option.precio;
  const before = state.dinero;
  option.apply(state);
  if (state.dinero.eq(before)) throw new Error(`No se pudo comprar ${option.name}`);
  // Las roturas de ese rato cuentan para el nivel después de comprar (el precio era el del objeto de antes).
  progressBreaks(state, data, broken, tps);
  tryGuardian(state, data, tps);
  return { seconds, bought: option.name, discovered: checkUnlocks(state, data) };
}

export interface PlayGoal {
  /** Jugar hasta llegar a este objeto (id de objects.json)… */
  objeto?: string;
  /** …o durante estos segundos de juego. */
  segundos?: number;
}

/**
 * Juega sobre `state` hasta cumplir la meta y devuelve los segundos de juego que pasaron. Juega
 * sin los trucos del modo pruebas (si no, el "jugador" compraría todo gratis).
 */
export function playUntil(state: GameState, data: GameData, goal: PlayGoal, tps = 5): number {
  const target = goal.objeto ? data.objects.findIndex((o) => o.id === goal.objeto) : -1;
  const limit = goal.segundos ?? Infinity;
  const trucos = state.pruebas;
  state.pruebas = pruebasIniciales();
  let seconds = 0;
  try {
    for (let steps = 0; steps < 100_000; steps++) {
      // Un objeto de una casa que aún no se desbloquea: juega hasta el último al que se puede llegar.
      if (target !== -1 && frontierIndex(state, data) >= Math.min(target, lastObjectIndex(state, data))) break;
      // Nivel terminado y detenido por el jefe de la casa o la mudanza: jugando ya no se avanza.
      if (target !== -1 && levelDone(state, data) && ['jefe', 'mudanza'].includes(gateAt(state, data) ?? '')) break;
      if (target === -1 && seconds >= limit) break;
      const step = botStep(state, data, tps);
      seconds += step.seconds;
    }
  } finally {
    state.pruebas = trucos;
  }
  return seconds;
}
