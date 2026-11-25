// Lo que se guarda entre partidas: el oro, los niveles del árbol y los récords.
import { levelConfig, TALENT_BY_ID, TALENTS, type TalentDef, type TalentId } from './datos';
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
  /** Cuándo se guardó por última vez (ms): de ahí se cuenta el oro mientras no juegas. 0: nunca. */
  ultimaVez: number;
  /** Avisos que ya se vieron (la primera vez que se juega, etc.). */
  vistos: string[];
}

export function createMeta(): Meta {
  return { version: SAVE_VERSION, oro: 0, talentos: {}, partidas: 0, nivel: 1, jugando: 1, mejor: 0, reventados: 0, ajustes: { sonido: true, idioma: null }, ultimaVez: 0, vistos: [] };
}

export const levelOf = (meta: Meta, id: TalentId): number => meta.talentos[id] ?? 0;

export function stats(meta: Meta): Stats {
  return computeStats(meta.talentos);
}

export function costOf(def: TalentDef, nivel: number): number {
  return Math.ceil(def.costo.base * Math.pow(def.costo.crece, nivel));
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
  if (meta.oro < cost) return false;
  meta.oro -= cost;
  meta.talentos[id] = levelOf(meta, id) + 1;
  return true;
}

/**
 * Termina una partida: se queda el oro juntado (gane o pierda) y, si ganó, el premio del nivel. Al
 * superar el nivel más alto se abre el siguiente y queda elegido. Devuelve el premio.
 */
export function finishRun(meta: Meta, r: { oro: number; reventados: number; gano: boolean; nivel: number }): number {
  const s = stats(meta);
  const premio = r.gano ? Math.round(levelConfig(r.nivel).premio * s.premioMult * s.oroMult) : 0;
  meta.oro += r.oro + premio;
  meta.partidas++;
  meta.mejor = Math.max(meta.mejor, r.oro);
  meta.reventados += r.reventados;
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
    ultimaVez: num(r.ultimaVez, 0),
    vistos: Array.isArray(r.vistos) ? r.vistos.filter((v): v is string => typeof v === 'string') : [],
  };
}
