// Qué tan "esponja" son los enemigos (desde 0.24.0): el jugador simulado juega sin parar 7 horas y, en
// algunos niveles nuevos, se mide cuántos golpes recibe cada enemigo (tuyos y de todos), cuánto vive y de
// quién es el daño; y el avance por tiempo y por días. Uso: npx tsx tools/golpes.ts
import { JEFE, levelConfig } from '../src/core/datos';
import { playAndShop, BOT_FIELD_H } from '../src/core/bot';
import { stats, type Meta, createMeta } from '../src/core/meta';
import { bestSpot, createRun, moveCursor, startRun, stepRun } from '../src/core/run';
import { dias } from './balance';


function medir(meta: Meta, seed: number) {
  const s = stats(meta);
  const run = createRun(s, BOT_FIELD_H, meta.jugando, seed);
  startRun(run);
  let next = 0;
  const golpesJ = new Map<number, number>(), golpes = new Map<number, number>();
  const porQuien = new Map<number, Record<string, number>>(), nace = new Map<number, number>();
  const golpesPor: Record<string, number> = {};
  const vidas: number[] = [];
  let bajas = 0;
  const hj: number[] = [], ht: number[] = [];
  const porFuente: Record<string, number> = {};
  while (!run.terminada) {
    if (run.t >= next) { const q = bestSpot(run); moveCursor(run, q.x, q.y); next += 1; }
    for (const e of stepRun(run, 1 / 30)) {
      if (e.type === 'spawn') nace.set(e.id, run.t);
      if (e.type === 'hit') {
        const q = porQuien.get(e.id) ?? {};
        q[e.fuente] = (q[e.fuente] ?? 0) + 1;
        porQuien.set(e.id, q);
        golpes.set(e.id, (golpes.get(e.id) ?? 0) + 1);
        if (e.fuente === 'jugador') golpesJ.set(e.id, (golpesJ.get(e.id) ?? 0) + 1);
        porFuente[e.fuente] = (porFuente[e.fuente] ?? 0) + e.danio;
      } else if (e.type === 'kill') {
        porFuente[e.fuente] = (porFuente[e.fuente] ?? 0) + e.danio;
        hj.push((golpesJ.get(e.id) ?? 0) + (e.fuente === 'jugador' ? 1 : 0));
        bajas++;
        if (nace.has(e.id)) vidas.push(run.t - nace.get(e.id)!);
        const q = porQuien.get(e.id) ?? {};
        q[e.fuente] = (q[e.fuente] ?? 0) + 1;
        for (const [k, v] of Object.entries(q)) golpesPor[k] = (golpesPor[k] ?? 0) + v;
        ht.push((golpes.get(e.id) ?? 0) + 1);
      }
    }
  }
  const prom = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const total = Object.values(porFuente).reduce((a, b) => a + b, 0) || 1;
  const dur = s.duracion + (levelConfig(meta.jugando).jefe ? JEFE.extra : 0);
  const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)]! : 0; };
  const quien = Object.entries(golpesPor).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / Math.max(1, bajas)).toFixed(1)}`).join(' ');
  return { quien, vive: med(vidas), tuyos: prom(hj), todos: prom(ht), tuParte: (porFuente.jugador ?? 0) / total, arco: (porFuente.arquero ?? 0) / total, uso: run.t / dur, gano: run.gano };
}

const MUESTRA = [8, 18, 28, 38, 48, 58];
const filas: Record<number, ReturnType<typeof medir>> = {};
const meta = createMeta();
let i = 0, t = 0;
const marcas: Record<number, number> = {};
const jefes: Record<number, number> = {};
while (t < 420 * 60) {
  if (meta.jugando === meta.nivel && MUESTRA.includes(meta.jugando)) filas[meta.jugando] = medir(structuredClone(meta), 777 + i);
  const n = meta.jugando;
  if (n % 10 === 0) jefes[n] = (jefes[n] ?? 0) + 1;
  const r = playAndShop(meta, 1 + i++ * 7919, true);
  t += r.segundos + 3;
  for (const m of [10, 20, 30, 60, 90, 120, 180, 240]) if (t <= m * 60) marcas[m] = meta.nivel - 1;
}
const d = dias(4);
const pct = (x: number) => `${Math.round(100 * x)}%`;
console.log('  activo ' + Object.entries(marcas).map(([m, n]) => `${m}:${n}`).join(' ') + ' | jefes ' + Object.entries(jefes).map(([n, k]) => `${n}:${k}`).join(' '));
console.log('  días ' + d.filas.map((f) => f.match(/nivel (\d+)/)![1]).join(' ') + ' | oleadas ' + d.filas.map((f) => f.match(/oleadas ([\d/-]+)/)![1]).join(' '));
for (const [n, f] of Object.entries(filas)) console.log(`  ${n.padStart(2)}: tuyos ${f.tuyos.toFixed(1)} todos ${f.todos.toFixed(1)} tu parte ${pct(f.tuParte)} arco ${pct(f.arco)} usó ${pct(f.uso)}${f.gano ? '' : ' PERDIÓ'} vive ${f.vive.toFixed(1)}s | golpes/baja: ${f.quien}`);
