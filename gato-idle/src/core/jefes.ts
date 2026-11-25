// Jefes (jefes.json): en el último objeto de una casa aparece su jefe (el Pepino Gigante en la
// casa con jardín); al terminar el último nivel de cada cuarto, su guardián (mini jefe, ver niveles.ts). La pelea dura `segundos`: manotazos y aliados le pegan a él en vez de al
// objeto. Ganar paga un premio y deja un trofeo para siempre; perder paga una parte según el
// daño hecho y la revancha llega tras `esperaDerrota` segundos. La pelea en curso no se guarda.
import type { BossDef, GameData } from './data';
import { currentObject, moneyPerBreak, objectIndex } from './economy';
import { advanceLevel, miniBossDue, roomOf } from './niveles';
import { num, type Decimal } from './num';
import type { GameState } from './state';

/** Prefijo de los guardianes de cuarto (mini jefes): "mini:cocina". */
export const MINI = 'mini:';
export const isMini = (id: string): boolean => id.startsWith(MINI);

/** Parte del premio que se lleva quien pierde, por la fracción de vida que le quitó. */
export const CONSOLATION = 0.5;

export interface BossFight {
  id: string;
  vida: Decimal;
  danio: Decimal;
  /** Cuándo empezó y cuándo se acaba el tiempo (ms de reloj). */
  inicio: number;
  fin: number;
}

export interface BossOutcome {
  id: string;
  gano: boolean;
  premio: Decimal;
}

function lastObjectOfHome(data: GameData, home: string): number {
  let last = -1;
  data.objects.forEach((o, i) => {
    if (o.casa === home) last = i;
  });
  return last;
}

/** El guardián de un cuarto: el mismo objeto, dorado y enojado, con la vida y el premio de balance.niveles.miniJefe. */
export function miniBossDef(data: GameData, room: string): BossDef {
  const { segundos, vidaEnRoturas, premioEnRoturas } = data.balance.niveles.miniJefe;
  return { id: MINI + room, casa: '', segundos, vidaEnRoturas, premioEnRoturas, esperaDerrota: 0, efectos: [] };
}

export function bossDef(data: GameData, id: string): BossDef | undefined {
  return isMini(id) ? miniBossDef(data, id.slice(MINI.length)) : data.bosses.find((b) => b.id === id);
}

/** El guardián que espera al terminar el último nivel del cuarto, si toca. */
export function miniBossHere(state: GameState, data: GameData): BossDef | null {
  return miniBossDue(state, data) ? miniBossDef(data, roomOf(currentObject(state, data))) : null;
}

/** El jefe que espera en el objeto actual (el último de su casa), si no se ha derrotado. */
export function bossHere(state: GameState, data: GameData): BossDef | null {
  const index = objectIndex(state, data);
  const boss = data.bosses.find((b) => lastObjectOfHome(data, b.casa) === index);
  return boss && !state.jefes.derrotados.includes(boss.id) ? boss : null;
}

/** Vida del jefe: tantas veces la del último objeto de su casa (el guardián: la del objeto de la mesa). */
export function bossHp(data: GameData, boss: BossDef, state?: GameState): Decimal {
  const obj = isMini(boss.id) && state ? currentObject(state, data) : data.objects[lastObjectOfHome(data, boss.casa)]!;
  return obj.hp.mul(boss.vidaEnRoturas).floor();
}

/** Segundos que faltan para la revancha (0: ya se puede). */
export function rematchIn(state: GameState, now: number): number {
  return Math.max(0, Math.ceil((state.jefes.revancha - now) / 1000));
}

export function startFight(data: GameData, boss: BossDef, now: number, state?: GameState): BossFight {
  return { id: boss.id, vida: bossHp(data, boss, state), danio: num(0), inicio: now, fin: now + boss.segundos * 1000 };
}

/** Le pega al jefe. Devuelve true si ya no le queda vida. */
export function damageBoss(fight: BossFight, damage: Decimal): boolean {
  const total = fight.danio.add(damage);
  fight.danio = total.lt(fight.vida) ? total : fight.vida;
  return fight.danio.gte(fight.vida);
}

/** El premio completo: lo que pagan `premioEnRoturas` roturas del objeto actual. */
export function bossPrize(state: GameState, data: GameData, boss: BossDef): Decimal {
  return moneyPerBreak(state, data).mul(boss.premioEnRoturas).floor();
}

/** Termina la pelea: paga, anota el trofeo o la espera de la revancha. */
export function endFight(state: GameState, data: GameData, fight: BossFight, now: number): BossOutcome {
  const boss = bossDef(data, fight.id)!;
  const gano = fight.danio.gte(fight.vida);
  const fraction = gano ? 1 : fight.danio.div(fight.vida).toNumber() * CONSOLATION;
  const premio = bossPrize(state, data, boss).mul(fraction).floor();
  state.dinero = state.dinero.add(premio);
  state.dineroPartida = state.dineroPartida.add(premio);
  if (isMini(boss.id)) {
    // Al guardián se le gana y se pasa de nivel; si se pierde, se reintenta gratis cuando se quiera.
    if (gano) advanceLevel(state, data, true);
  } else if (gano) {
    if (!state.jefes.derrotados.includes(boss.id)) state.jefes.derrotados.push(boss.id);
  } else {
    state.jefes.revancha = now + boss.esperaDerrota * 1000;
  }
  return { id: boss.id, gano, premio };
}

export function normalizeBosses(state: GameState, data: GameData): void {
  const ids = new Set(data.bosses.map((b) => b.id));
  state.jefes.derrotados = [...new Set(state.jefes.derrotados.filter((id) => ids.has(id)))];
  if (!Number.isFinite(state.jefes.revancha)) state.jefes.revancha = 0;
}
