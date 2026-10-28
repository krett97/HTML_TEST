// Simulador de balance: un jugador que toca a ritmo constante y compra lo que más rinde.
// Responde "¿en cuántos minutos llego a cada objeto?" sin jugar a mano.
//
//   npm run simular            (5 toques por segundo)
//   npm run simular -- 3       (3 toques por segundo)
import { pathToFileURL } from 'node:url';
import type { GameData } from '../src/core/data';
import {
  buyFuerza,
  buyTool,
  buyValor,
  currentObject,
  fuerzaCost,
  moneyPerBreak,
  nextTool,
  tapDamage,
  tapsToBreak,
  valorCost,
  valorPreview,
  toolAvailable,
  valorStepsInObject,
} from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { allyCost, allyLevel, allyUnlocked, alliesDps, buyAlly } from '../src/core/allies';
import { formatNum } from '../src/core/format';
import { num } from '../src/core/num';
import { createInitialState, type GameState } from '../src/core/state';
import { gameData } from '../src/data';

const TAPS_PER_SECOND = Number(process.argv[2] ?? 5) || 5;
const MAX_MINUTES = 120;

/** Golpes por segundo de los aliados. */
function allyHitsPerSecond(state: GameState, data: GameData): number {
  return data.allies.reduce((sum, ally) => sum + (allyLevel(state, ally.id) > 0 ? 1 / ally.intervalo : 0), 0);
}

/** Dinero por segundo tocando a ritmo constante, más lo que rompen los aliados. */
function income(state: GameState, data: GameData): number {
  const hp = currentObject(state, data).hp.toNumber();
  const dps = tapDamage(state, data).toNumber() * TAPS_PER_SECOND + alliesDps(state, data).toNumber();
  // Cada golpe rompe a lo mucho un objeto.
  const breaks = Math.min(dps / hp, TAPS_PER_SECOND + allyHitsPerSecond(state, data));
  return breaks * moneyPerBreak(state, data).toNumber();
}

function clone(state: GameState): GameState {
  return { ...state, herramientas: [...state.herramientas], aliados: state.aliados.map((a) => ({ ...a })) };
}

interface Option {
  name: string;
  cost: number;
  apply: (s: GameState) => void;
}

function options(state: GameState, data: GameData): Option[] {
  const list: Option[] = [
    { name: 'fuerza', cost: fuerzaCost(state, data).toNumber(), apply: (s) => void buyFuerza(s, data) },
  ];
  const preview = valorPreview(state, data);
  if (!preview.requiredTool) {
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
function choose(state: GameState, data: GameData): Option {
  const rate = income(state, data);
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
    const gain = income(after, data) - rate;
    const wait = Math.max(0, option.cost - state.dinero.toNumber()) / rate;
    const score = option.name === progress ? wait : wait + option.cost / Math.max(gain, 1e-9);
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best!;
}

export interface SimRow {
  minuto: number;
  /** Objeto al que se llegó o herramienta comprada ("🔧 garras"). */
  hito: string;
  fuerza: number;
  valor: number;
  golpes: number;
  pagoPorRotura: string;
  /** Qué parte del daño hacen los aliados. */
  aliadosPct: number;
}

export function simulate(data: GameData, maxMinutes = MAX_MINUTES): { rows: SimRow[]; counts: Record<string, number> } {
  const state = createInitialState(0);
  normalizeState(state, data);
  let seconds = 0;
  let lastObject = '';
  const rows: SimRow[] = [];
  const counts: Record<string, number> = {};
  const lastId = data.objects.at(-1)!.id;

  while (seconds < maxMinutes * 60) {
    const option = choose(state, data);
    const rate = income(state, data);
    const wait = Math.max(0, option.cost - state.dinero.toNumber()) / rate;
    seconds += wait;
    state.dinero = state.dinero.add(rate * wait);
    // Evita quedarse a una fracción de centavo por redondeo.
    if (state.dinero.lt(option.cost)) state.dinero = num(option.cost);
    const before = state.dinero;
    option.apply(state);
    if (state.dinero.eq(before)) throw new Error(`No se pudo comprar ${option.name}`);
    counts[option.name] = (counts[option.name] ?? 0) + 1;

    const object = currentObject(state, data).id;
    const isTool = !['fuerza', 'valor'].includes(option.name) && !option.name.startsWith('aliado:');
    const newAlly = option.name.startsWith('aliado:') && counts[option.name] === 1;
    if (object !== lastObject || isTool || newAlly) {
      rows.push({
        minuto: seconds / 60,
        hito: isTool ? `🔧 ${option.name}` : newAlly ? `🐾 ${option.name.slice(7)}` : object,
        fuerza: state.nivelFuerza,
        valor: state.nivelValor,
        golpes: tapsToBreak(state, data),
        pagoPorRotura: formatNum(moneyPerBreak(state, data)),
        aliadosPct: Math.round((100 * alliesDps(state, data).toNumber()) / (alliesDps(state, data).toNumber() + tapDamage(state, data).toNumber() * TAPS_PER_SECOND)),
      });
      lastObject = object;
    }
    // Termina a media etapa del último objeto.
    if (object === lastId && valorStepsInObject(state, data) >= 5) break;
  }
  return { rows, counts };
}

function main(): void {
  const { rows: simRows, counts } = simulate(gameData);
  const rows = simRows.map((r) => [r.minuto.toFixed(1), r.hito, String(r.fuerza), String(r.valor), String(r.golpes), r.pagoPorRotura, `${r.aliadosPct}%`]);
  const header = ['min', 'objeto / compra', 'fuerza', 'valor', 'golpes', '$/rotura', 'aliados'];
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i]!)).join('  ');
  console.log(`Jugador que toca ${TAPS_PER_SECOND} veces por segundo y compra lo que antes se paga solo.\n`);
  console.log(line(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const row of rows) console.log(line(row));
  console.log(`\nCompras: ${Object.entries(counts).map(([k, v]) => `${k} ×${v}`).join(', ')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
