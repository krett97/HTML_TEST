// Un jugador simulado: juega el nivel elegido tocando donde hay más slimes y entre partidas compra en
// el árbol. Si pierde, juega una vez el nivel anterior para juntar oro y vuelve a intentarlo. Lo usan
// el simulador de balance (tools/simular.ts) y las pruebas.
import { TALENTS } from './datos';
import { buyTalent, chooseLevel, costOf, finishRun, levelOf, stats, talentState, type Meta } from './meta';
import { bestSpot, createRun, moveCursor, startRun, stepRun } from './run';

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
