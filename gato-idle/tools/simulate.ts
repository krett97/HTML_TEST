// Simulador de balance: un jugador que toca a ritmo constante y compra lo que más rinde.
// Responde "¿en cuántos minutos llego a cada objeto?" sin jugar a mano.
//
//   npm run simular            (5 toques por segundo)
//   npm run simular -- 3       (3 toques por segundo)
import { pathToFileURL } from 'node:url';
import { alliesDps } from '../src/core/allies';
import { botStep, playUntil } from '../src/core/bot';
import { uploadVideo } from '../src/core/canal';
import type { GameData } from '../src/core/data';
import { currentObject, moneyPerBreak, objectIndex, tapDamage, tapsToBreak, valorStepsInObject } from '../src/core/economy';
import { lastObjectIndex } from '../src/core/mudanza';
import { bossHere, bossHp } from '../src/core/jefes';
import { expectedMarkMultiplier } from '../src/core/marca';
import { expectedTapDamage } from '../src/core/economy';
import { formatNum } from '../src/core/format';
import { normalizeState } from '../src/core/normalize';
import { deserialize, serialize } from '../src/core/save';
import { buySkill, skillBuyable, skillCost } from '../src/core/skills';
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
    const firstBuy = (name.startsWith('aliado:') || ['critico', 'danioCritico', 'saco'].includes(name)) && counts[name] === 1;
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

export interface RunRow {
  vuelta: number;
  /** Casa en la que terminó la vuelta. */
  casa: string;
  /** Si hubo jefe al final: qué parte de su vida se le quita en su tiempo, al llegar y tras 2 y 5 min más. */
  jefe: string | null;
  /** Minuto (desde el inicio de la vuelta) en que llega a cada objeto. */
  minutos: Record<string, number>;
  seguidores: number;
  visualizaciones: string;
  /** Totales del canal después del video. */
  totalSeguidores: number;
  totalVisualizaciones: string;
  habilidades: string;
}

/** Daño que se le haría al jefe en su tiempo (manotazos a TAPS_PER_SECOND + pandilla), como % de su vida. */
function bossShare(state: GameState, data: GameData): number {
  const boss = bossHere(state, data);
  if (!boss) return 0;
  const dps = expectedTapDamage(state, data).mul(TAPS_PER_SECOND).add(alliesDps(state, data).mul(expectedMarkMultiplier(state, data, TAPS_PER_SECOND)));
  return dps.mul(boss.segundos).div(bossHp(data, boss)).toNumber() * 100;
}

/** Al llegar al jefe, y tras jugar 2 y 5 minutos más en su objeto (el bot sigue comprando). */
function bossCheck(state: GameState, data: GameData): string | null {
  if (!bossHere(state, data)) return null;
  const loaded = deserialize(serialize(state, 0), 0);
  if (!loaded.ok) return null;
  const copy = loaded.state;
  const shares = [bossShare(copy, data)];
  playUntil(copy, data, { segundos: 120 }, TAPS_PER_SECOND);
  shares.push(bossShare(copy, data));
  playUntil(copy, data, { segundos: 180 }, TAPS_PER_SECOND);
  shares.push(bossShare(copy, data));
  return shares.map((p) => `${Math.round(p)}%`).join(' → ');
}

/** Objetos que se marcan en cada vuelta (los que caen entre el inicio y el último alcanzable). */
const RUN_MARKS = ['lampara', 'tostadora', 'lavadora', 'refri', 'maceta', 'aro', 'silla', 'parrilla', 'moto', 'coche'];

/** Gasta las visualizaciones en el árbol: siempre el nivel más barato que pueda pagar. */
function buyCheapestSkills(state: GameState, data: GameData): void {
  for (;;) {
    const options = data.skills.filter((d) => skillBuyable(state, data, d));
    if (options.length === 0) return;
    options.sort((a, b) => skillCost(state, a).cmp(skillCost(state, b)));
    buySkill(state, data, options[0]!.id);
  }
}

/**
 * Varias vueltas seguidas: juega hasta el último objeto al que puede llegar (el refri, o el coche
 * si ya se desbloqueó la mudanza), sube el video y gasta las visualizaciones en el árbol
 * (lo más barato primero). Responde "¿cuánto más rápida es la segunda vuelta?" y "¿cuándo
 * se muda?".
 */
export function simulateRuns(data: GameData, runs = 10): RunRow[] {
  const state = createInitialState(0);
  normalizeState(state, data);
  const rows: RunRow[] = [];
  for (let vuelta = 1; vuelta <= runs; vuelta++) {
    const minutos: Record<string, number> = {};
    let seconds = 0;
    const start = objectIndex(state, data);
    const last = lastObjectIndex(state, data);
    const marks = RUN_MARKS.filter((id) => {
      const index = data.objects.findIndex((o) => o.id === id);
      return index > start && index <= last;
    });
    if (!marks.includes(data.objects[last]!.id)) marks.push(data.objects[last]!.id);
    for (const objeto of marks) {
      seconds += playUntil(state, data, { objeto }, TAPS_PER_SECOND);
      minutos[objeto] = seconds / 60;
    }
    const casa = data.homes[state.casa]!.id;
    const jefe = bossCheck(state, data);
    const video = uploadVideo(state, data, 0, () => 0.5)!;
    buyCheapestSkills(state, data);
    rows.push({
      vuelta,
      casa,
      jefe,
      minutos,
      seguidores: video.seguidores,
      visualizaciones: formatNum(video.visualizaciones),
      totalSeguidores: state.canal.seguidores,
      totalVisualizaciones: `${formatNum(state.canal.visualizacionesTotales)} (sobran ${formatNum(state.canal.visualizaciones)})`,
      habilidades: state.habilidades.map((h) => `${h.id} ${h.nivel}`).join(', '),
    });
  }
  return rows;
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

  console.log('\nVueltas (sube el video al llegar al último objeto alcanzable y compra en el árbol):');
  for (const run of simulateRuns(gameData)) {
    const marks = Object.entries(run.minutos).map(([obj, min]) => `${obj} ${min.toFixed(1)}`).join(' · ');
    if (run.jefe) console.log(`     jefe (vida quitada al llegar → +2 min → +5 min): ${run.jefe}`);
    console.log(`  ${run.vuelta}. [${run.casa}] ${marks} → +${run.seguidores} seg, +${run.visualizaciones} vis (total ${run.totalSeguidores} / ${run.totalVisualizaciones}) | ${run.habilidades}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
