// La maquinita del gato: una tragamonedas de tres rodillos que se juega con fichas (no con dinero de
// verdad: no hay compras). Las fichas llegan solas (una cada `minutosFicha`, hasta `fichasMax`), por
// vencer a un jefe, o se gira viendo un anuncio. Los premios son minutos de lo que el jugador gana
// jugando, así valen lo mismo en cualquier etapa. Tras un premio en dinero se puede arriesgar
// "¿Doble o nada?" (50 %) o doblarlo seguro viendo un anuncio.
import type { GameData } from './data';
import { videoPreview } from './canal';
import { incomePerSecond } from './income';
import { isDecimal, ZERO, type Decimal } from './num';
import type { GameState } from './state';

/** Los símbolos de cada rodillo y qué tan seguido salen (de 100). */
export const SYMBOLS = [
  { id: 'croquetas', peso: 30 },
  { id: 'pescado', peso: 25 },
  { id: 'vaso', peso: 20 },
  { id: 'pepino', peso: 15 },
  { id: 'corona', peso: 10 },
] as const;
export type SymbolId = (typeof SYMBOLS)[number]['id'];

/** jackpot: tres coronas · trio: tres iguales · coronas: dos coronas (+1 ficha) · par: dos iguales · pelos: nada. */
export type SpinKind = 'jackpot' | 'trio' | 'coronas' | 'par' | 'pelos';

export interface SpinResult {
  rodillos: [SymbolId, SymbolId, SymbolId];
  tipo: SpinKind;
  dinero: Decimal;
  visualizaciones: Decimal;
  fichas: number;
}

function pick(rng: () => number): SymbolId {
  let r = rng() * 100;
  for (const s of SYMBOLS) {
    r -= s.peso;
    if (r < 0) return s.id;
  }
  return SYMBOLS[0].id;
}

/** El día (para los giros con anuncio de hoy), en la zona del jugador. */
export function dayOf(now: number): number {
  const d = new Date(now);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Suma las fichas que llegaron solas desde la última vez. */
export function refillTokens(state: GameState, data: GameData, now: number): void {
  const s = state.suerte;
  const { fichasMax, minutosFicha } = data.balance.suerte;
  const every = minutosFicha * 60_000;
  if (s.fichas >= fichasMax) {
    s.proximaFicha = now + every;
    return;
  }
  if (!(s.proximaFicha > 0)) s.proximaFicha = now + every;
  while (s.fichas < fichasMax && now >= s.proximaFicha) {
    s.fichas += 1;
    s.proximaFicha += every;
  }
  if (s.fichas >= fichasMax) s.proximaFicha = now + every;
  if (s.dia !== dayOf(now)) {
    s.dia = dayOf(now);
    s.girosAnuncio = 0;
  }
}

/** Segundos para la siguiente ficha (0: ya está llena). */
export function nextTokenIn(state: GameState, data: GameData, now: number): number {
  if (state.suerte.fichas >= data.balance.suerte.fichasMax) return 0;
  return Math.max(0, Math.ceil((state.suerte.proximaFicha - now) / 1000));
}

export function adSpinsLeft(state: GameState, data: GameData, now: number): number {
  const used = state.suerte.dia === dayOf(now) ? state.suerte.girosAnuncio : 0;
  return Math.max(0, data.balance.suerte.girosAnuncioPorDia - used);
}

/** Lo que vale un minuto de juego ahora (la base de los premios). */
export function minuteValue(state: GameState, data: GameData): Decimal {
  return incomePerSecond(state, data, data.balance.suerte.toquesPorSegundo).mul(60);
}

/** Decide el resultado de tres rodillos. */
export function judge(rodillos: [SymbolId, SymbolId, SymbolId]): SpinKind {
  const [a, b, c] = rodillos;
  const coronas = rodillos.filter((x) => x === 'corona').length;
  if (coronas === 3) return 'jackpot';
  if (a === b && b === c) return 'trio';
  if (coronas === 2) return 'coronas';
  if (a === b || b === c || a === c) return 'par';
  return 'pelos';
}

/**
 * Un giro: con `pago` "ficha" gasta una ficha; con "anuncio" cuenta un giro con anuncio del día.
 * Devuelve null si no se puede (sin fichas o sin giros con anuncio). Paga en el momento.
 */
export function spin(state: GameState, data: GameData, now: number, pago: 'ficha' | 'anuncio', rng: () => number = Math.random): SpinResult | null {
  refillTokens(state, data, now);
  const s = state.suerte;
  if (pago === 'ficha') {
    if (s.fichas <= 0) return null;
    if (s.fichas >= data.balance.suerte.fichasMax) s.proximaFicha = now + data.balance.suerte.minutosFicha * 60_000;
    s.fichas -= 1;
  } else {
    if (adSpinsLeft(state, data, now) <= 0) return null;
    s.girosAnuncio += 1;
  }
  const rodillos: [SymbolId, SymbolId, SymbolId] = [pick(rng), pick(rng), pick(rng)];
  const tipo = judge(rodillos);
  const b = data.balance.suerte;
  const minutes = { jackpot: b.minutosJackpot, trio: b.minutosTrio, coronas: b.minutosPar, par: b.minutosPar, pelos: b.minutosConsuelo }[tipo];
  const dinero = minuteValue(state, data).mul(minutes).floor();
  const visualizaciones = tipo === 'jackpot' ? videoPreview(state, data).visualizaciones.mul(b.vistasJackpot).floor().max(1000) : ZERO;
  const fichas = tipo === 'coronas' ? 1 : 0;
  state.dinero = state.dinero.add(dinero);
  state.dineroPartida = state.dineroPartida.add(dinero);
  state.canal.visualizaciones = state.canal.visualizaciones.add(visualizaciones);
  state.canal.visualizacionesTotales = state.canal.visualizacionesTotales.add(visualizaciones);
  s.fichas += fichas;
  // Lo que se gana en dinero se puede arriesgar (doble o nada) o doblar con anuncio, una sola vez.
  s.doblable = tipo === 'pelos' ? null : dinero;
  return { rodillos, tipo, dinero, visualizaciones, fichas };
}

/** "¿Doble o nada?": 50 % se gana otra vez el premio, 50 % se pierde. Devuelve true si ganó. */
export function doubleOrNothing(state: GameState, rng: () => number = Math.random): boolean | null {
  const prize = state.suerte.doblable;
  if (!prize) return null;
  state.suerte.doblable = null;
  const won = rng() < 0.5;
  if (won) {
    state.dinero = state.dinero.add(prize);
    state.dineroPartida = state.dineroPartida.add(prize);
  } else {
    const lost = prize.min(state.dinero);
    state.dinero = state.dinero.sub(lost);
  }
  return won;
}

/** Doblar el premio seguro (después de ver un anuncio). */
export function doublePrize(state: GameState): Decimal | null {
  const prize = state.suerte.doblable;
  if (!prize) return null;
  state.suerte.doblable = null;
  state.dinero = state.dinero.add(prize);
  state.dineroPartida = state.dineroPartida.add(prize);
  return prize;
}

/** Fichas de premio por vencer a un jefe (pueden pasar del máximo). */
export function awardBossTokens(state: GameState, data: GameData): void {
  state.suerte.fichas += data.balance.suerte.fichasPorJefe;
}

export function normalizeLuck(state: GameState): void {
  const s = state.suerte;
  s.fichas = Math.max(0, Math.min(99, Math.floor(Number(s.fichas) || 0)));
  s.girosAnuncio = Math.max(0, Math.floor(Number(s.girosAnuncio) || 0));
  if (!Number.isFinite(s.proximaFicha)) s.proximaFicha = 0;
  if (!Number.isFinite(s.dia)) s.dia = 0;
  if (s.doblable && !isDecimal(s.doblable)) s.doblable = null;
}

/** Valor esperado de un giro, en minutos de juego (para el balance). */
export function expectedMinutes(data: GameData): number {
  const b = data.balance.suerte;
  const ids = SYMBOLS.map((x) => x.id);
  const p = Object.fromEntries(SYMBOLS.map((x) => [x.id, x.peso / 100])) as Record<SymbolId, number>;
  let total = 0;
  for (const a of ids) for (const bb of ids) for (const c of ids) {
    const tipo = judge([a, bb, c]);
    const m = { jackpot: b.minutosJackpot, trio: b.minutosTrio, coronas: b.minutosPar, par: b.minutosPar, pelos: b.minutosConsuelo }[tipo];
    total += p[a] * p[bb] * p[c] * m;
  }
  return total;
}
