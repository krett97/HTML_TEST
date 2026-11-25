// Misiones: se abren en el nivel 11 (MISIONES_DESDE) y dan gemas moradas, que compran Reliquias.
// - Diarias: cada día salen 3 (siempre las mismas para esa fecha), y completar las 3 da un bono. Se
//   miden desde que empieza el día (lo que cuentan los contadores ahora menos lo que contaban entonces).
// - Permanentes: logros que se cobran una sola vez (llegar a un nivel, vencer a un jefe, reventar mucho…).
import { DESDE, MISIONES_DESDE, type EnemyKind } from './datos';
import { createRng } from './rng';

/** Lo que el juego va contando de por vida (las misiones lo leen). */
export interface Counters {
  partidas: number;
  reventados: number;
  /** Niveles ganados, compras en el árbol, niveles ganados sin que cayera la muralla, cobros de oro inactivo. */
  ganados: number;
  compras: number;
  intacta: number;
  cobros: number;
  /** Jefes vencidos y enemigos reventados, por tipo. */
  jefes: Partial<Record<EnemyKind, number>>;
  porTipo: Partial<Record<EnemyKind, number>>;
}

export const emptyCounters = (): Counters => ({ partidas: 0, reventados: 0, ganados: 0, compras: 0, intacta: 0, cobros: 0, jefes: {}, porTipo: {} });

/** Qué mide una misión: un contador, el nivel alcanzado, los jefes de un tipo o los reventados de un tipo. */
export type Medida = 'partidas' | 'reventados' | 'ganados' | 'compras' | 'intacta' | 'cobros' | 'jefes' | 'nivel' | `jefe:${EnemyKind}` | `tipo:${EnemyKind}`;

export interface MissionDef {
  id: string;
  medida: Medida;
  meta: number;
  gemas: number;
  /** Ícono (de la interfaz) o dibujo de un enemigo ("arte:goblin"). */
  icono: string;
  /** Solo sale si ya se llegó a este nivel (p. ej., orcos desde el 13). */
  desde?: number;
}

export const DIARIAS_POR_DIA = 3;
export const BONO_DIARIO = 5;

export const DIARIAS: MissionDef[] = [
  { id: 'reventar', medida: 'reventados', meta: 600, gemas: 3, icono: 'slimes' },
  { id: 'ganar', medida: 'ganados', meta: 5, gemas: 3, icono: 'jugar' },
  { id: 'partidas', medida: 'partidas', meta: 10, gemas: 3, icono: 'reloj' },
  { id: 'jefe', medida: 'jefes', meta: 1, gemas: 5, icono: 'corona' },
  { id: 'compras', medida: 'compras', meta: 8, gemas: 3, icono: 'arbol' },
  { id: 'intacta', medida: 'intacta', meta: 3, gemas: 4, icono: 'muralla' },
  { id: 'cobrar', medida: 'cobros', meta: 1, gemas: 2, icono: 'inactivo' },
  { id: 'goblins', medida: 'tipo:goblin', meta: 150, gemas: 3, icono: 'arte:goblin' },
  { id: 'lobos', medida: 'tipo:lobo', meta: 60, gemas: 3, icono: 'arte:lobo' },
  { id: 'orcos', medida: 'tipo:orco', meta: 40, gemas: 4, icono: 'arte:orco', desde: DESDE.orco },
  { id: 'arqueros', medida: 'tipo:orcoArquero', meta: 25, gemas: 4, icono: 'arte:orcoArquero', desde: DESDE.orcoArquero },
  { id: 'aranas', medida: 'tipo:arana', meta: 120, gemas: 3, icono: 'arte:arana', desde: DESDE.arana },
  { id: 'esqueletos', medida: 'tipo:esqueleto', meta: 40, gemas: 4, icono: 'arte:esqueleto', desde: DESDE.esqueleto },
  { id: 'bandidos', medida: 'tipo:bandido', meta: 25, gemas: 4, icono: 'arte:bandido', desde: DESDE.bandido },
];

export const PERMANENTES: MissionDef[] = [
  { id: 'nivel15', medida: 'nivel', meta: 15, gemas: 5, icono: 'jugar' },
  { id: 'nivel20', medida: 'nivel', meta: 20, gemas: 10, icono: 'jugar' },
  { id: 'nivel25', medida: 'nivel', meta: 25, gemas: 15, icono: 'jugar' },
  { id: 'nivel30', medida: 'nivel', meta: 30, gemas: 20, icono: 'jugar' },
  { id: 'rey', medida: 'jefe:rey', meta: 1, gemas: 8, icono: 'arte:jefe_rey' },
  { id: 'loboBlanco', medida: 'jefe:loboBlanco', meta: 1, gemas: 12, icono: 'arte:loboBlanco' },
  { id: 'reventar1k', medida: 'reventados', meta: 1000, gemas: 3, icono: 'slimes' },
  { id: 'reventar10k', medida: 'reventados', meta: 10_000, gemas: 8, icono: 'slimes' },
  { id: 'reventar100k', medida: 'reventados', meta: 100_000, gemas: 15, icono: 'slimes' },
  { id: 'compras50', medida: 'compras', meta: 50, gemas: 5, icono: 'arbol' },
  { id: 'compras150', medida: 'compras', meta: 150, gemas: 10, icono: 'arbol' },
  { id: 'orcos100', medida: 'tipo:orco', meta: 100, gemas: 5, icono: 'arte:orco' },
  { id: 'intacta20', medida: 'intacta', meta: 20, gemas: 8, icono: 'muralla' },
];

export const MISSION_BY_ID = Object.fromEntries([...DIARIAS, ...PERMANENTES].map((m) => [m.id, m])) as Record<string, MissionDef>;

/** Lo que se guarda de las misiones. */
export interface MissionsState {
  /** Día de las diarias ("2026-11-25"), cuáles son, cómo estaban los contadores al empezar el día, cuáles ya se cobraron y si el bono ya se cobró. */
  dia: string;
  diarias: string[];
  base: Counters;
  cobradas: string[];
  bono: boolean;
  /** Permanentes ya cobradas. */
  logros: string[];
}

export const emptyMissions = (): MissionsState => ({ dia: '', diarias: [], base: emptyCounters(), cobradas: [], bono: false, logros: [] });

/** Lo que las misiones necesitan del progreso. */
export interface MissionHost {
  nivel: number;
  gemas: number;
  cuenta: Counters;
  misiones: MissionsState;
}

export const missionsUnlocked = (m: MissionHost): boolean => m.nivel >= MISIONES_DESDE;

/** Fecha local del día ("2026-11-25"): las diarias cambian a medianoche. */
export function dayKey(ahora: number): string {
  const d = new Date(ahora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Milisegundos que faltan para que se renueven las diarias. */
export function msUntilReset(ahora: number): number {
  const d = new Date(ahora);
  const manana = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return manana - ahora;
}

function measure(c: Counters, nivel: number, medida: Medida): number {
  if (medida === 'nivel') return nivel;
  if (medida.startsWith('jefe:')) return c.jefes[medida.slice(5) as EnemyKind] ?? 0;
  if (medida.startsWith('tipo:')) return c.porTipo[medida.slice(5) as EnemyKind] ?? 0;
  if (medida === 'jefes') return Object.values(c.jefes).reduce((a, b) => a + (b ?? 0), 0);
  return c[medida as 'partidas'];
}

const copy = (c: Counters): Counters => ({ ...c, jefes: { ...c.jefes }, porTipo: { ...c.porTipo } });

/**
 * Si cambió el día (o recién se abren), elige las 3 diarias de hoy y empieza a medir desde ahora.
 * `otra` (modo pruebas, "Nuevo día") fuerza a elegir otras aunque sea el mismo día.
 */
export function rollDaily(m: MissionHost, ahora: number, otra = 0): boolean {
  if (!missionsUnlocked(m)) return false;
  const dia = dayKey(ahora);
  if (m.misiones.dia === dia && !otra) return false;
  let seed = 7 + otra;
  for (const ch of dia) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rng = createRng(seed);
  const pool = DIARIAS.filter((d) => !d.desde || m.nivel >= d.desde);
  const elegidas: string[] = [];
  while (elegidas.length < DIARIAS_POR_DIA && pool.length) elegidas.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!.id);
  m.misiones = { ...m.misiones, dia, diarias: elegidas, base: copy(m.cuenta), cobradas: [], bono: false };
  return true;
}

export interface MissionProgress {
  def: MissionDef;
  actual: number;
  completa: boolean;
  cobrada: boolean;
}

export function dailyProgress(m: MissionHost): MissionProgress[] {
  return m.misiones.diarias.map((id) => {
    const def = MISSION_BY_ID[id]!;
    const actual = Math.min(def.meta, measure(m.cuenta, m.nivel, def.medida) - measure(m.misiones.base, m.nivel, def.medida));
    return { def, actual: Math.max(0, actual), completa: actual >= def.meta, cobrada: m.misiones.cobradas.includes(id) };
  });
}

export function permanentProgress(m: MissionHost): MissionProgress[] {
  return PERMANENTES.map((def) => {
    const actual = Math.min(def.meta, measure(m.cuenta, m.nivel, def.medida));
    return { def, actual, completa: actual >= def.meta, cobrada: m.misiones.logros.includes(def.id) };
  });
}

/** Cobra una misión completa (diaria o permanente). Devuelve las gemas que dio (0 si no se podía). */
export function claimMission(m: MissionHost, id: string): number {
  const diaria = dailyProgress(m).find((p) => p.def.id === id);
  const p = diaria ?? permanentProgress(m).find((x) => x.def.id === id);
  if (!p || !p.completa || p.cobrada) return 0;
  if (diaria) m.misiones.cobradas = [...m.misiones.cobradas, id];
  else m.misiones.logros = [...m.misiones.logros, id];
  m.gemas += p.def.gemas;
  return p.def.gemas;
}

/** El bono por cobrar las 3 diarias del día. */
export function bonusReady(m: MissionHost): boolean {
  return m.misiones.diarias.length > 0 && !m.misiones.bono && m.misiones.diarias.every((id) => m.misiones.cobradas.includes(id));
}

export function claimBonus(m: MissionHost): number {
  if (!bonusReady(m)) return 0;
  m.misiones.bono = true;
  m.gemas += BONO_DIARIO;
  return BONO_DIARIO;
}

/** Cuántas cosas hay para cobrar (punto rojo en el botón de misiones). */
export function claimableCount(m: MissionHost): number {
  if (!missionsUnlocked(m)) return 0;
  const listas = [...dailyProgress(m), ...permanentProgress(m)].filter((p) => p.completa && !p.cobrada).length;
  return listas + (bonusReady(m) ? 1 : 0);
}
