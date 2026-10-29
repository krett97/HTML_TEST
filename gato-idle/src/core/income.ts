// Cuánto gana el jugador por segundo y cuánto paga un patrocinio (anuncio recompensado).
import { allyLevel, alliesDps } from './allies';
import type { GameData } from './data';
import { currentObject, expectedTapDamage, moneyPerBreak } from './economy';
import { expectedMarkMultiplier } from './marca';
import type { Decimal } from './num';
import type { GameState } from './state';
import { skillAmount } from './skills';

/** Golpes por segundo de los aliados adoptados. */
export function allyHitsPerSecond(state: GameState, data: GameData): number {
  return data.allies.reduce((sum, ally) => sum + (allyLevel(state, ally.id) > 0 ? 1 / ally.intervalo : 0), 0);
}

/** Objetos rotos por segundo tocando `tapsPerSecond` veces, más lo que rompen los aliados. */
export function breaksPerSecond(state: GameState, data: GameData, tapsPerSecond: number): number {
  const hp = currentObject(state, data).hp.toNumber();
  // Los críticos cuentan por su promedio (ver critFactor).
  // La marca de las Garras marcadoras cuenta por el tiempo que dura en promedio (ver markUptime).
  const allies = alliesDps(state, data).toNumber() * expectedMarkMultiplier(state, data, tapsPerSecond);
  const dps = expectedTapDamage(state, data).toNumber() * tapsPerSecond + allies;
  // Cada golpe rompe a lo mucho un objeto.
  return Math.min(dps / hp, tapsPerSecond + allyHitsPerSecond(state, data));
}

export function incomePerSecond(state: GameState, data: GameData, tapsPerSecond: number): Decimal {
  return moneyPerBreak(state, data).mul(breaksPerSecond(state, data, tapsPerSecond));
}

/**
 * Lo que paga un patrocinio: lo que el jugador ganaría en `segundosDeJuego` jugando activo, y
 * nunca menos que `roturasMinimas` roturas del objeto actual. Así siempre vale más la pena que
 * los segundos que dura el anuncio. Ejemplo: si un toque rompe un objeto de $10, con 5 toques
 * por segundo y 60 s, paga $3,000.
 */
export function sponsorReward(state: GameState, data: GameData): Decimal {
  const { segundosDeJuego, toquesPorSegundo, roturasMinimas } = data.balance.patrocinio;
  const played = incomePerSecond(state, data, toquesPorSegundo).mul(segundosDeJuego);
  const floor = moneyPerBreak(state, data).mul(roturasMinimas);
  const patrocinador = 1 + skillAmount(state, data, 'patrocinador');
  return (played.gt(floor) ? played : floor).mul(patrocinador).floor();
}

