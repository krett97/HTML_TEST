// Un jugador simulado: juega partidas tocando donde hay más enemigos y entre partidas compra en el
// árbol. Lo usan el simulador de balance (tools/simular.ts) y las pruebas.
import { TALENTS } from './datos';
import { buyTalent, costOf, finishRun, levelOf, stats, talentState, type Meta } from './meta';
import { bestSpot, createRun, moveCursor, startRun, stepRun } from './run';

/** Alto típico del campo en un celular vertical (unidades). */
export const BOT_FIELD_H = 560;
// (Con 560 la densidad de enemigos es la de referencia; ver REF_FIELD_H en run.ts.)

/** Juega una partida completa; el bot mueve el círculo cada `cadaCuanto` segundos. Devuelve oro y reventados. */
export function playRun(meta: Meta, seed: number, cadaCuanto = 1): { oro: number; reventados: number; maxVivos: number } {
  const run = createRun(stats(meta), BOT_FIELD_H, seed);
  startRun(run);
  const dt = 1 / 30;
  let next = 0;
  let maxVivos = 0;
  while (!run.terminada) {
    if (run.t >= next) {
      const spot = bestSpot(run);
      moveCursor(run, spot.x, spot.y);
      next += cadaCuanto;
    }
    stepRun(run, dt);
    maxVivos = Math.max(maxVivos, run.enemies.length);
  }
  return { oro: run.oro, reventados: run.reventados, maxVivos };
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

export function playAndShop(meta: Meta, seed: number): { oro: number; reventados: number; maxVivos: number; compras: string[] } {
  const result = playRun(meta, seed);
  finishRun(meta, result.oro, result.reventados);
  return { ...result, compras: shop(meta) };
}
