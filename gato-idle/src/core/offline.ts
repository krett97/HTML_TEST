// Ganancias mientras no se juega: la pandilla sigue rompiendo cosas con el juego cerrado. Solo
// cuentan los aliados (nadie toca), con una eficiencia y un tope de horas. El objeto no cambia:
// el dueño no compra nada nuevo mientras no estás.
import type { GameData } from './data';
import { objectIndex, moneyPerBreak } from './economy';
import { breaksPerSecond } from './income';
import { ZERO, type Decimal } from './num';
import type { GameState } from './state';

export interface OfflineEarnings {
  /** Segundos que se cuentan (ya con el tope). */
  segundos: number;
  /** Cuánto tiempo estuvo fuera de verdad. */
  ausente: number;
  /** Llegó al tope de horas. */
  tope: boolean;
  roturas: number;
  dinero: Decimal;
}

export function offlineEarnings(state: GameState, data: GameData, awaySeconds: number): OfflineEarnings {
  const { eficiencia, horasMax } = data.balance.offline;
  const ausente = Math.max(0, awaySeconds);
  const segundos = Math.min(ausente, horasMax * 3600);
  const roturas = Math.floor(breaksPerSecond(state, data, 0) * segundos * eficiencia);
  return {
    segundos,
    ausente,
    tope: ausente > horasMax * 3600,
    roturas,
    dinero: roturas > 0 ? moneyPerBreak(state, data).mul(roturas) : ZERO,
  };
}

/** Cobra lo ganado (×mult si se vio el anuncio): dinero, y las roturas cuentan para el video. */
export function claimOffline(state: GameState, data: GameData, earnings: { roturas: number; dinero: Decimal }, mult = 1): Decimal {
  const dinero = earnings.dinero.mul(mult);
  state.dinero = state.dinero.add(dinero);
  state.dineroPartida = state.dineroPartida.add(dinero);
  state.stats.roturas += earnings.roturas;
  state.stats.roturasPartida += earnings.roturas;
  state.stats.vistasVideo += earnings.roturas * (objectIndex(state, data) + 1);
  return dinero;
}
