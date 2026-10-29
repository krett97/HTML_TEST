// Tutorial: el gato explica lo básico en globitos, un paso a la vez y solo cuando hace falta
// (cuando ya se puede hacer lo que pide). Cada paso se termina al hacerlo (o con "¡Va!" en los que
// solo explican) y queda en `vistos`, así que no se repite al subir un video ni al recargar.
// Lo que vino después (críticos, laboratorio…) ya lo presentan las viñetas y los avisos.
import { allyCost, allyLevel, allyUnlocked } from './allies';
import { videoPreview } from './canal';
import type { GameData } from './data';
import { fuerzaCost, valorCost } from './economy';
import type { GameState } from './state';
import { hasUnlock } from './unlocks';
import { canAfford } from './wallet';

export const TUTORIAL_STEPS = ['tocar', 'monedas', 'fuerza', 'valor', 'meta', 'aliado', 'video'] as const;
export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

/** Pasos que solo explican: se cierran con "¡Va!". */
export const INFO_STEPS: readonly TutorialStep[] = ['monedas', 'meta'];

const SKIP = 'tuto:saltar';
const key = (step: TutorialStep) => `tuto:${step}`;

/** El jugador ya hizo lo que el paso enseña (o ya pasó por ahí). */
function achieved(state: GameState, data: GameData, step: TutorialStep): boolean {
  // Quien ya subió un video conoce el juego.
  if (state.canal.videos.length > 0) return true;
  const hasAlly = data.allies.some((ally) => allyLevel(state, ally.id) > 0);
  switch (step) {
    case 'tocar':
      return state.stats.roturas >= 1;
    case 'monedas':
    case 'fuerza':
      return state.nivelFuerza >= 1;
    case 'valor':
      return state.nivelValor >= 1;
    case 'meta':
    case 'aliado':
      return hasAlly;
    case 'video':
      return false;
  }
}

/** Ya se puede hacer lo que pide el paso (si no, se espera sin mostrar nada). */
function ready(state: GameState, data: GameData, step: TutorialStep): boolean {
  switch (step) {
    case 'fuerza':
      return hasUnlock(state, 'fuerza') && canAfford(state, fuerzaCost(state, data));
    case 'valor':
      return hasUnlock(state, 'valor') && canAfford(state, valorCost(state, data));
    case 'aliado': {
      const first = data.allies[0];
      return !!first && allyUnlocked(state, data, first) && canAfford(state, allyCost(state, data, first));
    }
    case 'video':
      return videoPreview(state, data).listo;
    default:
      return true;
  }
}

/**
 * Paso que toca mostrar ahora, o null. De paso anota en `vistos` los que ya se cumplieron, para
 * que una partida avanzada (o de una versión anterior) no vea el tutorial.
 */
export function updateTutorial(state: GameState, data: GameData): TutorialStep | null {
  if (state.vistos.includes(SKIP)) return null;
  for (const step of TUTORIAL_STEPS) {
    if (state.vistos.includes(key(step))) continue;
    if (achieved(state, data, step)) {
      state.vistos.push(key(step));
      continue;
    }
    return ready(state, data, step) ? step : null;
  }
  return null;
}

/** "¡Va!": da por visto un paso. */
export function completeTutorialStep(state: GameState, step: TutorialStep): void {
  if (!state.vistos.includes(key(step))) state.vistos.push(key(step));
}

export function skipTutorial(state: GameState): void {
  if (!state.vistos.includes(SKIP)) state.vistos.push(SKIP);
}
