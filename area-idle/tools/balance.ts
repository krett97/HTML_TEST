// Pruebas de balance: varios jugadores simulados (el que juega sin parar, el que juega a ratos y cobra
// el oro de app cerrada, el que deja la guardia) y qué tan difícil es cada zona para ellos.
// Uso: npx tsx tools/balance.ts [minutos] — imprime un informe.
import { GUARDIA, JEFE, levelConfig, TALENT_BY_ID, ZONAS, type TalentId } from '../src/core/datos';
import { PAUSA_ENTRE_PARTIDAS, playAndShop, shop } from '../src/core/bot';
import { activeGoldPerMinute, idleGoldPerMinute } from '../src/core/inactivo';
import { createMeta, levelOf, stats, type Meta } from '../src/core/meta';
import { bestSpot, createSurvivalRun, moveCursor, stepRun } from '../src/core/run';
import { nivelBaseOlas, survivalUnlocked } from '../src/core/supervivencia';
import { costoPieza, mejorar, NIVEL_MAX, nivelPieza, PIEZAS } from '../src/core/equipo';
import { createRng } from '../src/core/rng';

export interface Informe {
  nombre: string;
  /** Nivel superado a cada minuto de juego (y de reloj, para los que se van). */
  porMinuto: Map<number, number>;
  porHora: Map<number, number>;
  /** Por zona: partidas, perdidas, cuánto del tiempo usó al ganar (0–1). */
  zonas: Record<string, { partidas: number; perdidas: number; ratio: number[]; nuevo: number[]; muro: number }>;
  jefes: Record<number, number>;
  oro: { reventar: number; premio: number; inactivo: number; guardia: number };
  meta: Meta;
}

function nuevo(nombre: string): Informe {
  const zonas: Informe['zonas'] = {};
  for (const z of ZONAS) zonas[z.id] = { partidas: 0, perdidas: 0, ratio: [], nuevo: [], muro: 0 };
  return { nombre, porMinuto: new Map(), porHora: new Map(), zonas, jefes: {}, oro: { reventar: 0, premio: 0, inactivo: 0, guardia: 0 }, meta: createMeta() };
}

/** Juega `minutos` seguidos. Devuelve los minutos que de verdad usó. */
function jugar(inf: Informe, minutos: number, juego: { t: number }, seed: number): void {
  const fin = juego.t + minutos * 60;
  let i = 0;
  while (juego.t < fin) {
    const m = inf.meta;
    const nivel = m.jugando;
    const cfg = levelConfig(nivel);
    const dur = stats(m).duracion + (cfg.jefe ? JEFE.extra : 0);
    const r = playAndShop(m, seed + i++ * 7919, true);
    juego.t += r.segundos + PAUSA_ENTRE_PARTIDAS;
    const z = inf.zonas[cfg.zona]!;
    z.partidas++;
    if (r.muroCaido) z.muro++;
    if (r.gano) z.ratio.push(r.segundos / dur);
    else z.perdidas++;
    // Tiempo usado al pasar un nivel nuevo (la frontera, no los que repite para juntar oro).
    if (r.gano && nivel >= m.nivel - 1 && !cfg.jefe) z.nuevo.push(r.segundos / dur);
    if (cfg.jefe) inf.jefes[nivel] = (inf.jefes[nivel] ?? 0) + 1;
    inf.oro.reventar += r.oro;
    inf.oro.premio += r.premio;
    inf.porMinuto.set(Math.floor(juego.t / 60), m.nivel - 1);
  }
}

/** El que juega sin parar. */
export function activo(minutos: number, seed = 1): Informe {
  const inf = nuevo('Activo (juega sin parar)');
  jugar(inf, minutos, { t: 0 }, seed);
  return inf;
}

/** Juega `sesion` min, se va `fuera` h (cobra el oro de app cerrada al volver) o se queda en la guardia. */
export function aRatos(nombre: string, horas: number, sesion: number, fuera: number, modo: 'cerrada' | 'guardia', seed = 1): Informe {
  const inf = nuevo(nombre);
  const juego = { t: 0 };
  let reloj = 0;
  let s = 0;
  while (reloj < horas * 3600) {
    jugar(inf, sesion, juego, seed + s++ * 104729);
    reloj += sesion * 60;
    const m = inf.meta;
    if (modo === 'cerrada') {
      const seg = Math.min(fuera * 3600, stats(m).inactivo.horas * 3600);
      const oro = (idleGoldPerMinute(m) * seg) / 60;
      m.oro += oro;
      inf.oro.inactivo += oro;
    } else {
      // En la guardia: el 20 % de lo que ganas jugando (si tienes tropas que peleen solas).
      const tropas = stats(m).arqueros.cantidad > 0 || stats(m).mago.activo;
      const oro = tropas ? GUARDIA.eficiencia * activeGoldPerMinute(m) * fuera * 60 : 0;
      m.oro += oro;
      inf.oro.guardia += oro;
    }
    shop(m, true);
    reloj += fuera * 3600;
    inf.porHora.set(Math.floor(reloj / 3600), m.nivel - 1);
  }
  return inf;
}

/** Una partida de Supervivencia con el jugador simulado. Devuelve oleadas y Runas. */
export function supervivencia(m: Meta, seed: number): { olas: number; runas: number; oro: number } {
  const run = createSurvivalRun(stats(m), 700, nivelBaseOlas(m.nivel), m.nivel, seed);
  let t = 0;
  while (!run.terminada && t < 1800) {
    if (Math.floor(t) !== Math.floor(t - 0.05)) {
      const b = bestSpot(run);
      moveCursor(run, b.x, b.y);
    }
    stepRun(run, 0.05);
    t += 0.05;
  }
  return { olas: run.oleadas!.superadas, runas: run.oleadas!.bote, oro: run.oro };
}

/** Gasta las Runas en la Herrería: intenta siempre la pieza más barata (a veces sale, a veces no). */
export function herreria(m: Meta, rng: () => number): number {
  let intentos = 0;
  for (;;) {
    const opciones = PIEZAS.filter((p) => nivelPieza(m.equipo, p.id) < NIVEL_MAX).sort((a, b) => costoPieza(nivelPieza(m.equipo, a.id)) - costoPieza(nivelPieza(m.equipo, b.id)));
    const p = opciones[0];
    if (!p || m.runas < costoPieza(nivelPieza(m.equipo, p.id))) return intentos;
    mejorar(m, p.id, rng());
    intentos++;
  }
}

/** Días de juego: 4 ratos de 15 min (con 3.5 h de app cerrada entre uno y otro) y 3 partidas de Supervivencia. */
export function dias(n: number, seed = 1): { inf: Informe; filas: string[] } {
  const inf = nuevo('Días: 4 × 15 min de juego, app cerrada entre ratos y 3 Supervivencias al día');
  const juego = { t: 0 };
  const rng = createRng(seed);
  const filas: string[] = [];
  for (let d = 1; d <= n; d++) {
    const olas: number[] = [];
    let runasDia = 0;
    for (let s = 0; s < 4; s++) {
      jugar(inf, 15, juego, seed + d * 1000 + s * 77);
      const m = inf.meta;
      if (survivalUnlocked(m) && s < 3) {
        const r = supervivencia(m, seed + d * 31 + s);
        m.runas += r.runas;
        m.oro += r.oro;
        runasDia += r.runas;
        olas.push(r.olas);
        herreria(m, rng);
      }
      const seg = Math.min(3.5 * 3600, stats(m).inactivo.horas * 3600);
      const oro = (idleGoldPerMinute(m) * seg) / 60;
      m.oro += oro;
      inf.oro.inactivo += oro;
      shop(m, true);
    }
    const m = inf.meta;
    const eq = PIEZAS.map((p) => nivelPieza(m.equipo, p.id)).join('');
    filas.push(`  día ${String(d).padStart(2)}: nivel ${m.nivel - 1} · oleadas ${olas.join('/') || '-'} · runas ${runasDia} · equipo ${eq}`);
  }
  return { inf, filas };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
export function imprimir(inf: Informe, marcas: number[], horas = false): void {
  const mapa = horas ? inf.porHora : inf.porMinuto;
  const ultimo = (k: number) => {
    let v = 0;
    for (const [m, n] of mapa) if (m <= k) v = Math.max(v, n);
    return v;
  };
  console.log(`\n== ${inf.nombre}`);
  console.log('  ' + marcas.map((k) => `${horas ? 'h' : 'min'} ${k}: ${ultimo(k)}`).join(' · '));
  for (const [z, d] of Object.entries(inf.zonas)) {
    if (!d.partidas) continue;
    const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    console.log(`  ${z.padEnd(9)} partidas ${String(d.partidas).padStart(4)} · perdidas ${pct(d.perdidas / d.partidas).padStart(4)} · tiempo al pasar uno nuevo ${pct(media(d.nuevo)).padStart(4)} (al ganar ${pct(media(d.ratio))}) · muralla cayó ${d.muro}`);
  }
  console.log('  jefes (intentos): ' + Object.entries(inf.jefes).map(([n, k]) => `${n}:${k}`).join(' '));
  const o = inf.oro;
  const total = o.reventar + o.premio + o.inactivo + o.guardia || 1;
  console.log(`  oro: reventar ${pct(o.reventar / total)} · premio ${pct(o.premio / total)} · app cerrada ${pct(o.inactivo / total)} · guardia ${pct(o.guardia / total)}`);
  const m = inf.meta;
  const t = (id: TalentId) => `${levelOf(m, id)}/${TALENT_BY_ID[id].max}`;
  console.log(`  oro: ganancia ${t('oro')} · botín ${t('botin')} · inactivo ${t('inactivo')} · bolsa ${t('bolsa')}; daño ${t('danio')}`);
}

if (process.argv[1]?.endsWith('balance.ts')) {
  const minutos = Number(process.argv[2] ?? 180);
  imprimir(activo(minutos), [10, 20, 30, 60, 90, 120, 180].filter((m) => m <= minutos));
  imprimir(aRatos('A ratos: 15 min de juego y 3 h con la app cerrada', 48, 15, 3, 'cerrada'), [6, 12, 24, 48], true);
  imprimir(aRatos('A ratos: 15 min de juego y 1 h en la guardia', 24, 15, 1, 'guardia'), [3, 6, 12, 24], true);
  const d = dias(Number(process.argv[3] ?? 14));
  console.log(`\n== ${d.inf.nombre}`);
  console.log(d.filas.join('\n'));
}
