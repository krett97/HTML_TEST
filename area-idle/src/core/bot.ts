// Un jugador simulado: juega el nivel elegido tocando donde hay más slimes y entre partidas compra en
// el árbol. Si pierde, juega una vez el nivel anterior para juntar oro y vuelve a intentarlo. Lo usan
// el simulador de balance (tools/simular.ts) y las pruebas.
import { TALENTS } from './datos';
import { buyTalent, chooseLevel, costOf, finishRun, levelOf, stats, talentState, type Meta } from './meta';
import { bestSpot, createRun, moveCursor, startRun, stepRun } from './run';

/** Segundos que pasa un jugador entre partidas (ver el fin, comprar en el árbol). */
export const PAUSA_ENTRE_PARTIDAS = 6;

/** Alto típico del campo en un celular vertical (unidades). */
export const BOT_FIELD_H = 700;

export interface BotRun {
  nivel: number;
  gano: boolean;
  oro: number;
  premio: number;
  reventados: number;
  total: number;
  segundos: number;
  muroCaido: boolean;
  compras: string[];
}

/** Juega una partida completa del nivel elegido; el bot mueve el círculo cada `cadaCuanto` segundos. */
export function playRun(meta: Meta, seed: number, cadaCuanto = 1): { oro: number; reventados: number; gano: boolean; total: number; segundos: number; muroCaido: boolean } {
  const run = createRun(stats(meta), BOT_FIELD_H, meta.jugando, seed);
  startRun(run);
  const dt = 1 / 30;
  let next = 0;
  while (!run.terminada) {
    if (run.t >= next) {
      const spot = bestSpot(run);
      moveCursor(run, spot.x, spot.y);
      next += cadaCuanto;
    }
    stepRun(run, dt);
  }
  return { oro: run.oro, reventados: run.reventados, gano: run.gano, total: run.nivel.total, segundos: run.t, muroCaido: run.muro.caido };
}

/** Compra mientras alcance: siempre lo más barato que esté disponible. Devuelve qué compró. */
export function shop(meta: Meta): string[] {
  const bought: string[] = [];
  for (;;) {
    const options = TALENTS.filter((t) => talentState(meta, t) === 'disponible').map((t) => ({ t, cost: costOf(t, levelOf(meta, t.id)) }));
    options.sort((a, b) => a.cost - b.cost);
    const pick = options[0];
    if (!pick || pick.cost > meta.oro) return bought;
    buyTalent(meta, pick.t.id);
    bought.push(pick.t.id);
  }
}

/** Una vuelta: juega, cobra, compra y elige el siguiente nivel (el más alto, o el anterior si perdió ahí). */
export function playAndShop(meta: Meta, seed: number): BotRun {
  const nivel = meta.jugando;
  const r = playRun(meta, seed);
  const premio = finishRun(meta, { ...r, nivel });
  const compras = shop(meta);
  if (r.gano || nivel < meta.nivel) chooseLevel(meta, meta.nivel);
  else chooseLevel(meta, nivel - 1);
  return { nivel, gano: r.gano, oro: r.oro, premio, reventados: r.reventados, total: r.total, segundos: r.segundos, muroCaido: r.muroCaido, compras };
}

export interface SimulatedPlay {
  partidas: number;
  ganadas: number;
  desde: number;
  hasta: number;
  compras: number;
  oro: number;
}

/**
 * Juega `segundos` de tiempo de juego como lo haría un jugador atento (partidas, oro, compras en el
 * árbol, avanzar de nivel o juntar oro en el anterior), sobre la partida guardada. La última partida se
 * termina aunque se pase un poco del tiempo. Lo usa el modo pruebas ("+1 min de juego").
 */
export function simulatePlay(meta: Meta, segundos: number, seed = Date.now()): SimulatedPlay {
  const r: SimulatedPlay = { partidas: 0, ganadas: 0, desde: meta.nivel, hasta: meta.nivel, compras: 0, oro: 0 };
  let t = 0;
  while (t < segundos) {
    const p = playAndShop(meta, seed + r.partidas * 7919);
    t += p.segundos + PAUSA_ENTRE_PARTIDAS;
    r.partidas++;
    if (p.gano) r.ganadas++;
    r.compras += p.compras.length;
    r.oro += p.oro + p.premio;
  }
  r.hasta = meta.nivel;
  return r;
}
