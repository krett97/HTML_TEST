// Simulador de balance: un jugador que toca a ritmo constante y compra lo que más rinde.
// Responde "¿en cuántos minutos llego a cada objeto?" sin jugar a mano.
//
//   npm run simular            (5 toques por segundo)
//   npm run simular -- 3       (3 toques por segundo)
import { pathToFileURL } from 'node:url';
import { alliesDps } from '../src/core/allies';
import { botStep } from '../src/core/bot';
import type { GameData } from '../src/core/data';
import { currentObject, moneyPerBreak, tapDamage, tapsToBreak, valorStepsInObject } from '../src/core/economy';
import { formatNum } from '../src/core/format';
import { normalizeState } from '../src/core/normalize';
import { createInitialState, type GameState } from '../src/core/state';
import { gameData } from '../src/data';

const TAPS_PER_SECOND = Number(process.argv[2] ?? 5) || 5;
const MAX_MINUTES = 120;

export interface SimRow {
  minuto: number;
  /** Objeto al que se llegó o primera compra ("🐾 perro", "🎯 critico"). */
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

  const row = (seconds: number, hito: string, state: GameState, aliadosPct: number): SimRow => ({
    minuto: seconds / 60,
    hito,
    fuerza: state.nivelFuerza,
    valor: state.nivelValor,
    golpes: tapsToBreak(state, data),
    pagoPorRotura: formatNum(moneyPerBreak(state, data)),
    aliadosPct,
  });

  while (seconds < maxMinutes * 60) {
    const step = botStep(state, data, TAPS_PER_SECOND);
    seconds += step.seconds;
    for (const unlock of step.discovered) rows.push(row(seconds, `✨ ${unlock.id}`, state, 0));
    // Sin nada que comprar todavía: solo tocó hasta el siguiente descubrimiento.
    if (!step.bought) continue;
    const name = step.bought;
    counts[name] = (counts[name] ?? 0) + 1;

    const object = currentObject(state, data).id;
    // Se anota la primera compra de cada aliado y de cada mejora de crítico.
    const firstBuy = (name.startsWith('aliado:') || name === 'critico' || name === 'danioCritico') && counts[name] === 1;
    if (object !== lastObject || firstBuy) {
      const allies = alliesDps(state, data).toNumber();
      const pct = Math.round((100 * allies) / (allies + tapDamage(state, data).toNumber() * TAPS_PER_SECOND));
      rows.push(row(seconds, !firstBuy ? object : name.startsWith('aliado:') ? `🐾 ${name.slice(7)}` : `🎯 ${name}`, state, pct));
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
