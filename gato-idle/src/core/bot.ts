// Un jugador automático: toca a ritmo constante y compra lo que antes se paga solo. Lo usan el
// simulador de balance (tools/simulate.ts) y el modo pruebas ("avanzar como jugador"), así que
// la partida a la que salta el modo pruebas se parece a la de alguien que jugó de verdad.
import { allyCost, allyUnlocked, buyAlly } from './allies';
import type { GameData } from './data';
import { buyFuerza, buyTool, buyValor, fuerzaCost, nextTool, objectIndexFor, toolAvailable, valorCost, valorPreview } from './economy';
import { breaksPerSecond, incomePerSecond } from './income';
import { num } from './num';
import { pruebasIniciales, type GameState } from './state';
import { checkUnlocks, hasUnlock, nextUnlock } from './unlocks';
import type { UnlockDef } from './data';

interface Option {
  name: string;
  cost: number;
  apply: (s: GameState) => void;
}

function clone(state: GameState): GameState {
  return { ...state, herramientas: [...state.herramientas], aliados: state.aliados.map((a) => ({ ...a })) };
}

function options(state: GameState, data: GameData): Option[] {
  const list: Option[] = [];
  if (hasUnlock(state, 'fuerza')) {
    list.push({ name: 'fuerza', cost: fuerzaCost(state, data).toNumber(), apply: (s) => void buyFuerza(s, data) });
  }
  const preview = valorPreview(state, data);
  if (hasUnlock(state, 'valor') && !preview.requiredTool) {
    list.push({ name: 'valor', cost: valorCost(state, data).toNumber(), apply: (s) => void buyValor(s, data) });
  }
  for (const ally of data.allies) {
    if (!allyUnlocked(state, data, ally)) continue;
    list.push({ name: `aliado:${ally.id}`, cost: allyCost(state, data, ally).toNumber(), apply: (s) => void buyAlly(s, data, ally.id) });
  }
  const tool = nextTool(state, data);
  if (tool && toolAvailable(state, data, tool.id)) list.push({ name: tool.id, cost: tool.costo.toNumber(), apply: (s) => void buyTool(s, data, tool.id) });
  return list;
}

/** Elige la compra que antes se paga sola: espera para comprarla + tiempo en recuperarla. */
function choose(state: GameState, data: GameData, tps: number): Option {
  const rate = incomePerSecond(state, data, tps).toNumber();
  const preview = valorPreview(state, data);
  const blocked = preview.requiredTool;
  // Un objeto nuevo siempre se compra en cuanto alcanza: es lo que el jugador quiere ver, aunque
  // al principio rinda menos (aguanta más golpes).
  const progress = blocked ? blocked.id : preview.nextObject ? 'valor' : null;
  let best: Option | null = null;
  let bestScore = Infinity;
  for (const option of options(state, data)) {
    const after = clone(state);
    after.dinero = after.dinero.add(option.cost);
    option.apply(after);
    const gain = incomePerSecond(after, data, tps).toNumber() - rate;
    const wait = Math.max(0, option.cost - state.dinero.toNumber()) / rate;
    const score = option.name === progress ? wait : wait + option.cost / Math.max(gain, 1e-9);
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best!;
}

export interface BotStep {
  /** Segundos de juego que tomó este paso. */
  seconds: number;
  /** Qué compró ("fuerza", "valor", "aliado:perro", "garras") o null si solo tocó. */
  bought: string | null;
  discovered: UnlockDef[];
}

/** Un paso: toca hasta poder pagar la mejor compra y la compra (o toca hasta el siguiente descubrimiento). */
export function botStep(state: GameState, data: GameData, tps: number): BotStep {
  if (options(state, data).length === 0) {
    const next = nextUnlock(state, data);
    const missing = next && 'roturas' in next.unlock.condicion ? next.target - next.current : 1;
    const seconds = missing / breaksPerSecond(state, data, tps);
    state.dinero = state.dinero.add(incomePerSecond(state, data, tps).mul(seconds));
    state.stats.roturas += missing;
    return { seconds, bought: null, discovered: checkUnlocks(state, data) };
  }
  const option = choose(state, data, tps);
  const rate = incomePerSecond(state, data, tps).toNumber();
  const seconds = Math.max(0, option.cost - state.dinero.toNumber()) / rate;
  state.dinero = state.dinero.add(rate * seconds);
  state.stats.roturas += Math.floor(breaksPerSecond(state, data, tps) * seconds);
  // Evita quedarse a una fracción de centavo por redondeo.
  if (state.dinero.lt(option.cost)) state.dinero = num(option.cost);
  const before = state.dinero;
  option.apply(state);
  if (state.dinero.eq(before)) throw new Error(`No se pudo comprar ${option.name}`);
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
      if (target !== -1 && objectIndexFor(state.nivelValor, data) >= target) break;
      if (target === -1 && seconds >= limit) break;
      const step = botStep(state, data, tps);
      seconds += step.seconds;
    }
  } finally {
    state.pruebas = trucos;
  }
  return seconds;
}
