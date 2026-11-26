// Lo que se guarda entre partidas: el oro, los niveles del árbol y los récords.
import { ENEMY_KINDS, levelConfig, TALENT_BY_ID, TALENTS, type EnemyKind, type TalentDef, type TalentId } from './datos';
import { cleanName } from './ranking';
import { emptyPvp, loadPvp, type PvpState } from './pvp';
import { emptyEquipo, loadEquipo, type EquipoState } from './equipo';
import { emptySupervivencia, loadSupervivencia, type SupervivenciaState } from './supervivencia';
import { emptyCounters, emptyMissions, MISSION_BY_ID, type Counters, type MissionsState } from './misiones';
import { computeStats, type Stats } from './stats';

export const SAVE_VERSION = 1;

export type Locale = 'es' | 'en';

export interface Meta {
  version: number;
  oro: number;
  talentos: Partial<Record<TalentId, number>>;
  partidas: number;
  /** El nivel más alto abierto y el que se va a jugar (puede ser uno anterior, para juntar oro). */
  nivel: number;
  jugando: number;
  /** Lo más que se ha juntado en una partida. */
  mejor: number;
  reventados: number;
  ajustes: { sonido: boolean; idioma: Locale | null };
  /** Gemas moradas (de las misiones; compran Reliquias). */
  gemas: number;
  /** Lo que el juego va contando de por vida, y las misiones (desde el nivel 11). */
  cuenta: Counters;
  misiones: MissionsState;
  /** Cuándo se guardó por última vez (ms): de ahí se cuenta el oro mientras no juegas. 0: nunca. */
  ultimaVez: number;
  /** Avisos que ya se vieron (la primera vez que se juega, etc.). */
  vistos: string[];
  /** Tu nombre en el ranking (desde el nivel 17) y en el PvP. */
  nombre: string;
  /** El PvP (desde el nivel 19): liga, puntos, intentos, medallas. */
  pvp: PvpState;
  /** Runas (de la Supervivencia; mejoran el equipo), el equipo de la Herrería y las entradas a la Supervivencia. */
  runas: number;
  equipo: EquipoState;
  supervivencia: SupervivenciaState;
}

export function createMeta(): Meta {
  return { version: SAVE_VERSION, oro: 0, talentos: {}, partidas: 0, nivel: 1, jugando: 1, mejor: 0, reventados: 0, ajustes: { sonido: true, idioma: null }, gemas: 0, cuenta: emptyCounters(), misiones: emptyMissions(), ultimaVez: 0, vistos: [], nombre: '', pvp: emptyPvp(), runas: 0, equipo: emptyEquipo(), supervivencia: emptySupervivencia() };
}

export const levelOf = (meta: Meta, id: TalentId): number => meta.talentos[id] ?? 0;

export function stats(meta: Meta): Stats {
  return computeStats(meta.talentos, meta.equipo.niveles);
}

export function costOf(def: TalentDef, nivel: number): number {
  const { base, crece, tarde } = def.costo;
  if (!tarde || nivel <= tarde.desde) return Math.ceil(base * Math.pow(crece, nivel));
  return Math.ceil(base * Math.pow(crece, tarde.desde) * Math.pow(tarde.crece, nivel - tarde.desde));
}

export type TalentState = 'bloqueado' | 'disponible' | 'maximo';

export function talentState(meta: Meta, def: TalentDef): TalentState {
  if (levelOf(meta, def.id) >= def.max) return 'maximo';
  if (def.requiere && levelOf(meta, def.requiere.id) < def.requiere.nivel) return 'bloqueado';
  if (def.nivelMin && meta.nivel < def.nivelMin) return 'bloqueado';
  return 'disponible';
}

/**
 * Se ve en el árbol cuando ya se invirtió en el talento del que sale. La raíz de cada sección se ve
 * siempre (con candado mientras falte su requisito), así se sabe que el mago y los arqueros existen.
 */
export function talentVisible(meta: Meta, def: TalentDef): boolean {
  return !def.requiere || !!def.raiz || levelOf(meta, def.requiere.id) > 0;
}

export function buyTalent(meta: Meta, id: TalentId): boolean {
  const def = TALENT_BY_ID[id];
  if (talentState(meta, def) !== 'disponible') return false;
  const cost = costOf(def, levelOf(meta, id));
  // Las Reliquias se pagan con gemas moradas; lo demás, con oro.
  if (def.moneda === 'gemas') {
    if (meta.gemas < cost) return false;
    meta.gemas -= cost;
  } else {
    if (meta.oro < cost) return false;
    meta.oro -= cost;
  }
  meta.talentos[id] = levelOf(meta, id) + 1;
  meta.cuenta.compras++;
  return true;
}

/**
 * Termina una partida: se queda el oro juntado (gane o pierda) y, si ganó, el premio del nivel. Al
 * superar el nivel más alto se abre el siguiente y queda elegido. Devuelve el premio.
 */
export interface RunResult {
  oro: number;
  reventados: number;
  gano: boolean;
  nivel: number;
  /** Para las misiones: cuántos de cada tipo, si cayó la muralla y qué jefe había. */
  porTipo?: Partial<Record<EnemyKind, number>>;
  muroCaido?: boolean;
  jefe?: EnemyKind | null;
}

export function finishRun(meta: Meta, r: RunResult): number {
  const s = stats(meta);
  const premio = r.gano ? Math.round(levelConfig(r.nivel).premio * s.premioMult * s.oroMult) : 0;
  meta.oro += r.oro + premio;
  meta.partidas++;
  meta.mejor = Math.max(meta.mejor, r.oro);
  meta.reventados += r.reventados;
  const c = meta.cuenta;
  c.partidas++;
  c.reventados += r.reventados;
  for (const [k, n] of Object.entries(r.porTipo ?? {})) c.porTipo[k as EnemyKind] = (c.porTipo[k as EnemyKind] ?? 0) + (n ?? 0);
  if (r.gano) {
    c.ganados++;
    if (!r.muroCaido) c.intacta++;
    if (r.jefe) c.jefes[r.jefe] = (c.jefes[r.jefe] ?? 0) + 1;
  }
  if (r.gano && r.nivel >= meta.nivel) {
    meta.nivel = r.nivel + 1;
    meta.jugando = meta.nivel;
  }
  return premio;
}

/** Elige qué nivel jugar (de 1 al más alto abierto). */
export function chooseLevel(meta: Meta, nivel: number): void {
  meta.jugando = Math.min(meta.nivel, Math.max(1, Math.floor(nivel)));
}

/** Carga un guardado, tolerando datos viejos o dañados (lo que no sirve vuelve a su valor inicial). */
export function loadMeta(raw: unknown): Meta {
  const base = createMeta();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Meta>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);
  const talentos: Meta['talentos'] = {};
  for (const def of TALENTS) {
    const n = Math.floor(num(r.talentos?.[def.id], 0));
    if (n > 0) talentos[def.id] = Math.min(def.max, n);
  }
  return {
    version: SAVE_VERSION,
    oro: num(r.oro, 0),
    talentos,
    partidas: Math.floor(num(r.partidas, 0)),
    nivel: Math.max(1, Math.floor(num(r.nivel, 1))),
    jugando: Math.min(Math.max(1, Math.floor(num(r.nivel, 1))), Math.max(1, Math.floor(num(r.jugando, 1)))),
    mejor: num(r.mejor, 0),
    reventados: Math.floor(num(r.reventados, 0)),
    ajustes: {
      sonido: typeof r.ajustes?.sonido === 'boolean' ? r.ajustes.sonido : true,
      idioma: r.ajustes?.idioma === 'es' || r.ajustes?.idioma === 'en' ? r.ajustes.idioma : null,
    },
    gemas: Math.floor(num(r.gemas, 0)),
    cuenta: loadCounters(r.cuenta),
    misiones: (() => {
      const m = r.misiones;
      // Solo misiones que existen (un guardado dañado o de otra versión no debe romper la ventana).
      const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && Object.hasOwn(MISSION_BY_ID, x)) : []);
      if (!m || typeof m !== 'object') return emptyMissions();
      const diarias = ids(m.diarias);
      // Si faltan diarias, que se vuelvan a elegir.
      const dia = typeof m.dia === 'string' && Array.isArray(m.diarias) && diarias.length === m.diarias.length ? m.dia : '';
      return { dia, diarias, base: loadCounters(m.base), cobradas: ids(m.cobradas), bono: m.bono === true, logros: ids(m.logros) };
    })(),
    ultimaVez: num(r.ultimaVez, 0),
    vistos: Array.isArray(r.vistos) ? r.vistos.filter((v): v is string => typeof v === 'string') : [],
    nombre: cleanName(r.nombre),
    pvp: loadPvp(r.pvp),
    runas: Math.floor(num(r.runas, 0)),
    equipo: loadEquipo(r.equipo),
    supervivencia: loadSupervivencia(r.supervivencia),
  };
}

function loadCounters(raw: unknown): Counters {
  const c = emptyCounters();
  if (!raw || typeof raw !== 'object') return c;
  const r = raw as Partial<Counters>;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  for (const k of ['partidas', 'reventados', 'ganados', 'compras', 'intacta', 'cobros'] as const) c[k] = n(r[k]);
  for (const kind of ENEMY_KINDS) {
    if (n(r.jefes?.[kind])) c.jefes[kind] = n(r.jefes?.[kind]);
    if (n(r.porTipo?.[kind])) c.porTipo[kind] = n(r.porTipo?.[kind]);
  }
  return c;
}
