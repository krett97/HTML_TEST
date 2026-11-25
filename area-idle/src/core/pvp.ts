// PvP sin conexión (desde el nivel 19, PVP_DESDE). Cada semana estás en una liga de 100 jugadores: tú
// y 99 rivales simulados (sin servidor no hay jugadores reales). Peleas gastan intentos (5 como máximo,
// uno vuelve cada 2 h). Gana el de más poder con más probabilidad, no siempre. Ganarle a alguien con
// más puntos que tú da más puntos. Al terminar la semana, los 20 mejores suben de liga y los 20 peores
// bajan. Las peleas y el lugar de la semana dan medallas, que se gastan en la tienda del PvP.
import { PVP_DESDE, type TalentId } from './datos';
import { dayKey } from './misiones';
import { createRng } from './rng';
import { computeStats, type Stats } from './stats';

export const INTENTOS_MAX = 5;
export const RECARGA_MS = 2 * 3600_000;
const DIA_MS = 86_400_000;
export const JUGADORES = 100;
export const SUBEN = 20;
export const BAJAN = 20;
/** Probabilidad de ganar: p^K / (p^K + q^K). Con K = 4, 1.5× de poder gana ~84 % de las veces. */
const K = 4;

export interface LeagueDef {
  id: string;
  /** Qué tan fuertes son los rivales de esta liga respecto a tu poder al empezar la semana. */
  factor: number;
  color: string;
}
export const LIGAS: LeagueDef[] = [
  { id: 'bronce', factor: 0.7, color: '#c47a3a' },
  { id: 'plata', factor: 0.85, color: '#9aa3b2' },
  { id: 'oro', factor: 1, color: '#e8a91c' },
  { id: 'platino', factor: 1.15, color: '#3fb0a8' },
  { id: 'diamante', factor: 1.3, color: '#5b8cff' },
  { id: 'campeon', factor: 1.5, color: '#a24fe0' },
];

// ---------------------------------------------------------------------------------------------
// Poder: una cifra que junta lo que hacen tus tres árboles (y las Reliquias).

export interface Power {
  /** Tu círculo: daño × área ÷ tiempo entre disparos, con los críticos. */
  jugador: number;
  /** El mago: explosión (y suelo en llamas) × área ÷ tiempo entre explosiones. */
  mago: number;
  /** Los arqueros: cuántos × objetivos × daño ÷ tiempo entre flechas. */
  arqueros: number;
  /** Multiplica todo: tiempo por nivel, muralla (y Albañil) y el Estandarte de la tienda. */
  mult: number;
  total: number;
}

export function powerOf(s: Stats, estandarte = 0): Power {
  const critico = 1 + s.critico.prob * (s.critico.mult - 1);
  // Tu círculo y el mago pegan a varios a la vez: cuentan como 4 objetivos por área base.
  const jugador = (40 * s.danio * (s.radio / 30) ** 2 * critico) / s.intervalo;
  const area = (s.mago.lado / 40) ** 2;
  const fuego = s.fuego.activo ? s.fuego.dps * s.fuego.duracion : 0;
  const mago = s.mago.activo ? (40 * area * (s.mago.danio + fuego)) / s.mago.intervalo : 0;
  const arqueros = (10 * s.arqueros.cantidad * s.arqueros.objetivos * s.arqueros.danio) / s.arqueros.intervalo;
  const mult = Math.sqrt(s.duracion / 20) * (s.muro.vida / 100) ** 0.25 * (1 + 0.25 * s.muro.reparar) * (1 + ESTANDARTE.porNivel * estandarte);
  return { jugador, mago, arqueros, mult, total: Math.max(1, Math.round((jugador + mago + arqueros) * mult)) };
}

export const winChance = (mio: number, suyo: number): number => mio ** K / (mio ** K + suyo ** K);

// ---------------------------------------------------------------------------------------------
// Estado guardado.

export interface WeekResult {
  liga: number;
  nueva: number;
  posicion: number;
  medallas: number;
}

export interface PvpState {
  /** Fecha del lunes de la semana de tu liga ("" = todavía no se abre). */
  semana: string;
  /** Cuántas ligas has tenido: cambia los rivales de una semana a otra. */
  ronda: number;
  liga: number;
  puntos: number;
  peleas: number;
  ganadas: number;
  /**
   * De aquí sale el poder de los rivales: tu poder (sin el Estandarte) al empezar cada día. Los rivales
   * también "entrenan": lo que mejores hoy te da ventaja hoy; el Estandarte, siempre.
   */
  base: number;
  /** El día en que se tomó `base`. */
  dia: string;
  intentos: number;
  /** Desde cuándo corre la recarga del siguiente intento. */
  desde: number;
  medallas: number;
  /** Niveles del Estandarte de guerra (tienda): +5 % de poder en el PvP cada uno. */
  estandarte: number;
  /** Cómo te fue la semana que acaba de terminar (se muestra una vez). */
  resultado: WeekResult | null;
}

export const emptyPvp = (): PvpState => ({ semana: '', ronda: 0, liga: 0, puntos: 0, peleas: 0, ganadas: 0, base: 1, dia: '', intentos: INTENTOS_MAX, desde: 0, medallas: 0, estandarte: 0, resultado: null });

export interface PvpHost {
  nivel: number;
  oro: number;
  gemas: number;
  talentos: Partial<Record<TalentId, number>>;
  pvp: PvpState;
}

export const pvpUnlocked = (m: { nivel: number }): boolean => m.nivel >= PVP_DESDE;
export const myPower = (m: PvpHost): Power => powerOf(computeStats(m.talentos), m.pvp.estandarte);

/** Tolera guardados viejos o dañados. */
export function loadPvp(raw: unknown): PvpState {
  const p = emptyPvp();
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Partial<PvpState>;
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);
  const ent = (v: unknown, d: number) => Math.floor(n(v, d));
  const res = r.resultado;
  return {
    semana: typeof r.semana === 'string' ? r.semana : '',
    ronda: ent(r.ronda, 0),
    liga: Math.min(LIGAS.length - 1, ent(r.liga, 0)),
    puntos: ent(r.puntos, 0),
    peleas: ent(r.peleas, 0),
    ganadas: ent(r.ganadas, 0),
    base: Math.max(1, n(r.base, 1)),
    dia: typeof r.dia === 'string' ? r.dia : '',
    intentos: Math.min(INTENTOS_MAX, ent(r.intentos, INTENTOS_MAX)),
    desde: n(r.desde, 0),
    medallas: ent(r.medallas, 0),
    estandarte: Math.min(ESTANDARTE.max, ent(r.estandarte, 0)),
    resultado:
      res && typeof res === 'object'
        ? { liga: Math.min(LIGAS.length - 1, ent(res.liga, 0)), nueva: Math.min(LIGAS.length - 1, ent(res.nueva, 0)), posicion: Math.max(1, ent(res.posicion, 1)), medallas: ent(res.medallas, 0) }
        : null,
  };
}

// ---------------------------------------------------------------------------------------------
// Semanas: de lunes 00:00 a lunes 00:00, hora local.

export function weekStart(ahora: number): number {
  const d = new Date(ahora);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)).getTime();
}
export const weekKey = (ahora: number): string => dayKey(weekStart(ahora));
function weekEnd(ahora: number): number {
  const d = new Date(weekStart(ahora));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime();
}
export const msUntilWeekEnd = (ahora: number): number => weekEnd(ahora) - ahora;
/** Qué parte de la semana ya pasó (0 al empezar, 1 al terminar). */
const weekFraction = (ahora: number): number => Math.min(1, Math.max(0, (ahora - weekStart(ahora)) / (weekEnd(ahora) - weekStart(ahora))));

// ---------------------------------------------------------------------------------------------
// Rivales: 99 por liga, siempre los mismos para la misma semana, liga y ronda.

export interface Rival {
  id: string;
  nombre: string;
  avatar: string;
  /** 0 (el más flojo) a 1 (el más fuerte): de esto salen su poder y sus puntos. */
  nivel: number;
  /** Puntos con los que termina la semana. */
  total: number;
  /** Cómo los junta: <1 juega más al principio de la semana, >1 al final. */
  ritmo: number;
}

const NOMBRES = ['Lupita', 'Beto', 'Kike', 'Ana', 'Sofi', 'Toño', 'Memo', 'Pau', 'Rafa', 'Lalo', 'Vale', 'Nico', 'Dani', 'Chuy', 'Fer', 'Mau', 'Cami', 'Isa', 'Gabo', 'Leo', 'Tere', 'Paco', 'Rosi', 'Santi', 'Mati', 'Juli', 'Pepe', 'Nacho', 'Lola', 'Fito', 'Majo', 'Rocío', 'Iker', 'Emi', 'Valen', 'Tavo', 'Yaz', 'Luz', 'Sam', 'Alex', 'Max', 'Mia', 'Zoe', 'Hugo', 'Noa', 'Teo', 'Eva', 'Gus'];
const APODOS = ['SlimeHunter', 'Flechazo', 'ReyDelBlob', 'Arquera', 'MagoLoco', 'Murallas', 'PopPop', 'Babosín', 'LoboFeroz', 'Goblinator', 'OrcoBrr', 'Chispa', 'Lluvia', 'Ballesta', 'Tirolargo'];
const COLAS = ['', '', '', '7', '77', '99', '_xd', 'Pro', 'GG', 'MX', '2010', 'Jr', '_ok'];
const AVATARES = ['slime_verde', 'slime_azul', 'slime_rojo', 'goblin', 'lobo', 'orco', 'orcoArquero'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function rivalsOf(p: PvpState): Rival[] {
  const rng = createRng(hash(`${p.semana}|${p.liga}|${p.ronda}`));
  const usados = new Set<string>();
  const out: Rival[] = [];
  for (let i = 0; i < JUGADORES - 1; i++) {
    let nombre = '';
    for (let intento = 0; !nombre || usados.has(nombre); intento++) {
      const base = rng() < 0.7 ? NOMBRES[Math.floor(rng() * NOMBRES.length)]! : APODOS[Math.floor(rng() * APODOS.length)]!;
      nombre = base + COLAS[Math.floor(rng() * COLAS.length)]!;
      // Casi nunca: si tras varios intentos se repite, un número de dos cifras lo hace único.
      if (intento > 8 && usados.has(nombre)) nombre = base + Math.floor(rng() * 90 + 10);
    }
    usados.add(nombre);
    const nivel = rng();
    // Puntos al final de la semana: el 20.º termina con ~340, el 80.º con ~40.
    const total = Math.round(480 * nivel ** 1.7 * (0.75 + 0.5 * rng()));
    out.push({ id: `r${i}`, nombre, avatar: AVATARES[Math.floor(rng() * AVATARES.length)]!, nivel, total, ritmo: 0.75 + 0.5 * rng() });
  }
  return out;
}

/** Los puntos que lleva un rival a esta hora de la semana. */
export const rivalPoints = (r: Rival, ahora: number, final = false): number => (final ? r.total : Math.round(r.total * weekFraction(ahora) ** r.ritmo));

/** Su poder: según tu poder de hoy (sin Estandarte), la liga y qué tan bueno es; sube un poco cada día de la semana. */
export function rivalPower(r: Rival, p: PvpState, ahora: number): number {
  const dias = (ahora - weekStart(ahora)) / DIA_MS;
  return Math.max(1, Math.round(p.base * LIGAS[p.liga]!.factor * (0.5 + r.nivel) * (1 + 0.02 * dias)));
}

export interface LeagueRow {
  id: string;
  nombre: string;
  avatar: string;
  poder: number;
  puntos: number;
  tuyo: boolean;
}

/** La tabla de tu liga ordenada por puntos (tú con tu nombre; si empatas, vas antes). */
export function leagueTable(m: PvpHost & { nombre?: string }, ahora: number, final = false): LeagueRow[] {
  const p = m.pvp;
  const filas: LeagueRow[] = rivalsOf(p).map((r) => ({ id: r.id, nombre: r.nombre, avatar: r.avatar, poder: rivalPower(r, p, ahora), puntos: rivalPoints(r, ahora, final), tuyo: false }));
  filas.push({ id: 'yo', nombre: m.nombre ?? '', avatar: 'arquero', poder: myPower(m).total, puntos: p.puntos, tuyo: true });
  return filas.sort((a, b) => b.puntos - a.puntos || Number(b.tuyo) - Number(a.tuyo));
}

export const positionOf = (tabla: LeagueRow[]): number => tabla.findIndex((f) => f.tuyo) + 1;

// ---------------------------------------------------------------------------------------------
// Intentos, semanas y peleas.

/** Recupera los intentos que tocan (uno cada 2 h; mientras estás lleno no corre el reloj). */
export function refill(p: PvpState, ahora: number): void {
  if (p.intentos >= INTENTOS_MAX || ahora < p.desde) {
    p.desde = ahora;
    return;
  }
  const n = Math.floor((ahora - p.desde) / RECARGA_MS);
  if (n <= 0) return;
  p.intentos = Math.min(INTENTOS_MAX, p.intentos + n);
  p.desde = p.intentos >= INTENTOS_MAX ? ahora : p.desde + n * RECARGA_MS;
}

export const msUntilNextAttempt = (p: PvpState, ahora: number): number => (p.intentos >= INTENTOS_MAX ? 0 : Math.max(0, RECARGA_MS - (ahora - p.desde)));

function startWeek(m: PvpHost, ahora: number): void {
  const p = m.pvp;
  p.semana = weekKey(ahora);
  p.ronda++;
  p.puntos = 0;
  p.peleas = 0;
  p.ganadas = 0;
  p.base = powerOf(computeStats(m.talentos), 0).total;
  p.dia = dayKey(ahora);
}

/** Al empezar cada día, los rivales se ponen a tu altura (nunca bajan). */
function newDay(m: PvpHost, ahora: number): void {
  const p = m.pvp;
  if (p.dia === dayKey(ahora)) return;
  p.dia = dayKey(ahora);
  p.base = Math.max(p.base, powerOf(computeStats(m.talentos), 0).total);
}

/** Premio en medallas por cómo quedaste: más en los 20 de arriba, y más en ligas altas. */
export function weekMedals(posicion: number, liga: number): number {
  const base = posicion <= SUBEN ? 30 : posicion > JUGADORES - BAJAN ? 4 : 12;
  return Math.round(base * (1 + 0.5 * liga));
}

/** Cierra la semana: lugar final, sube o baja de liga, medallas, y empieza otra. */
export function endWeek(m: PvpHost & { nombre?: string }, ahora: number): WeekResult {
  const p = m.pvp;
  const posicion = positionOf(leagueTable(m, ahora, true));
  const nueva = posicion <= SUBEN ? Math.min(LIGAS.length - 1, p.liga + 1) : posicion > JUGADORES - BAJAN ? Math.max(0, p.liga - 1) : p.liga;
  const medallas = weekMedals(posicion, p.liga);
  const resultado = { liga: p.liga, nueva, posicion, medallas };
  p.medallas += medallas;
  p.liga = nueva;
  p.resultado = resultado;
  startWeek(m, ahora);
  return resultado;
}

/** Al abrir el juego o volver: recarga intentos y, si cambió la semana, la cierra. Devuelve si cerró una. */
export function syncPvp(m: PvpHost & { nombre?: string }, ahora: number): boolean {
  if (!pvpUnlocked(m)) return false;
  const p = m.pvp;
  if (!p.semana) {
    startWeek(m, ahora);
    p.intentos = INTENTOS_MAX;
    p.desde = ahora;
    return false;
  }
  refill(p, ahora);
  if (p.semana === weekKey(ahora)) {
    newDay(m, ahora);
    return false;
  }
  // Se cierra con la hora del final de esa semana (los rivales terminan con todos sus puntos).
  endWeek(m, ahora);
  return true;
}

export interface FightResult {
  gano: boolean;
  /** Puntos que ganaste (positivo) o perdiste (negativo). */
  puntos: number;
  medallas: number;
  probabilidad: number;
  miPoder: number;
  suPoder: number;
  rival: LeagueRow;
}

/** Puntos por ganarle (o perder) contra alguien con `suyos` puntos cuando tú tienes `mios`. */
export function pointsFor(mios: number, suyos: number): { gana: number; pierde: number } {
  const dif = suyos - mios;
  return { gana: Math.min(40, Math.max(6, Math.round(16 + dif / 20))), pierde: Math.min(10, Math.max(2, Math.round(5 - dif / 60))) };
}

export const MEDALLAS_GANAR = 3;
export const MEDALLAS_PERDER = 1;

/** Pelea contra un rival de tu liga. `tiro` (0–1) decide si ganas: menor que la probabilidad, ganas. */
export function fight(m: PvpHost & { nombre?: string }, rivalId: string, ahora: number, tiro: number): FightResult | null {
  syncPvp(m, ahora);
  const p = m.pvp;
  if (!pvpUnlocked(m) || p.intentos < 1) return null;
  const rival = leagueTable(m, ahora).find((f) => f.id === rivalId && !f.tuyo);
  if (!rival) return null;
  if (p.intentos >= INTENTOS_MAX) p.desde = ahora;
  p.intentos--;
  const miPoder = myPower(m).total;
  const probabilidad = winChance(miPoder, rival.poder);
  const gano = tiro < probabilidad;
  const { gana, pierde } = pointsFor(p.puntos, rival.puntos);
  const puntos = gano ? gana : -Math.min(pierde, p.puntos);
  p.puntos += puntos;
  p.peleas++;
  if (gano) p.ganadas++;
  const medallas = gano ? MEDALLAS_GANAR : MEDALLAS_PERDER;
  p.medallas += medallas;
  return { gano, puntos, medallas, probabilidad, miPoder, suPoder: rival.poder, rival };
}

// ---------------------------------------------------------------------------------------------
// Tienda del PvP (con medallas).

export type ShopId = 'oro' | 'gemas' | 'intento' | 'estandarte';
export const ESTANDARTE = { max: 20, porNivel: 0.05, base: 15, crece: 1.3 };
export const TIENDA: { id: ShopId; icono: string; costo: number }[] = [
  { id: 'oro', icono: 'botin', costo: 5 },
  { id: 'intento', icono: 'pvp', costo: 6 },
  { id: 'gemas', icono: 'gema', costo: 25 },
  { id: 'estandarte', icono: 'estandarte', costo: ESTANDARTE.base },
];
/** Cuánto oro da el cofre: 15 minutos de lo que ganas jugando. */
export const COFRE_MINUTOS = 15;
export const GEMAS_POR_BOLSA = 5;

export function shopCost(p: PvpState, id: ShopId): number {
  if (id === 'estandarte') return Math.round(ESTANDARTE.base * ESTANDARTE.crece ** p.estandarte);
  return TIENDA.find((x) => x.id === id)!.costo;
}

export function canBuy(p: PvpState, id: ShopId): boolean {
  if (id === 'intento' && p.intentos >= INTENTOS_MAX) return false;
  if (id === 'estandarte' && p.estandarte >= ESTANDARTE.max) return false;
  return p.medallas >= shopCost(p, id);
}

/** Compra en la tienda. `oroPorMinuto`: lo que ganas jugando (para el cofre). */
export function buyShop(m: PvpHost, id: ShopId, oroPorMinuto: number): boolean {
  const p = m.pvp;
  if (!pvpUnlocked(m) || !canBuy(p, id)) return false;
  p.medallas -= shopCost(p, id);
  if (id === 'oro') m.oro += Math.round(oroPorMinuto * COFRE_MINUTOS);
  else if (id === 'gemas') m.gemas += GEMAS_POR_BOLSA;
  else if (id === 'intento') p.intentos++;
  else p.estandarte++;
  return true;
}
