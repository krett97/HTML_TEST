// Equipo (la Herrería): nueve piezas para el mago, los arqueros y la base que se mejoran con Runas, de +0 a
// +10. Cada intento cuesta Runas y no siempre sale: la probabilidad baja conforme sube el nivel, y cada
// fallo suma +10 % al siguiente intento de esa pieza (se reinicia al lograrlo). Fallar no quita niveles.
// Los bonos multiplican lo que da el árbol, y el mago, los arqueros y la base cambian de aspecto.
export type Grupo = 'mago' | 'arqueros' | 'base';
export type PiezaId = 'baculo' | 'tunica' | 'sombrero' | 'arco' | 'flechas' | 'armadura' | 'muralla' | 'torre' | 'estandarte';

export interface PiezaDef {
  id: PiezaId;
  grupo: Grupo;
  icono: string;
}

export const PIEZAS: PiezaDef[] = [
  { id: 'baculo', grupo: 'mago', icono: 'eq_baculo' },
  { id: 'tunica', grupo: 'mago', icono: 'eq_tunica' },
  { id: 'sombrero', grupo: 'mago', icono: 'eq_sombrero' },
  { id: 'arco', grupo: 'arqueros', icono: 'eq_arco' },
  { id: 'flechas', grupo: 'arqueros', icono: 'eq_flechas' },
  { id: 'armadura', grupo: 'arqueros', icono: 'eq_armadura' },
  { id: 'muralla', grupo: 'base', icono: 'eq_muralla' },
  { id: 'torre', grupo: 'base', icono: 'eq_torre' },
  { id: 'estandarte', grupo: 'base', icono: 'eq_estandarte' },
];
export const GRUPOS: Grupo[] = ['mago', 'arqueros', 'base'];

export const NIVEL_MAX = 10;
/**
 * Números del equipo: costo del primer intento y cuánto sube por nivel, y lo que da cada nivel de cada pieza.
 * (Ajustados con el simulador de días: con los primeros valores se llegaba al nivel 57 el primer día.)
 */
export const EQUIPO = { costo: 10, crece: 1.6, baculo: 0.12, tunica: 0.97, sombrero: 0.04, arco: 0.12, flechas: 0.97, armadura: 0.03, muralla: 0.1, torre: 0.05, estandarte: 0.05 };
/** Lo que sube la probabilidad del siguiente intento por cada fallo. */
export const SUERTE_POR_FALLO = 0.1;

export type EquipoNiveles = Partial<Record<PiezaId, number>>;
export interface EquipoState {
  niveles: EquipoNiveles;
  /** Lo que suman los fallos seguidos de cada pieza a su siguiente intento. */
  suerte: Partial<Record<PiezaId, number>>;
}

export const emptyEquipo = (): EquipoState => ({ niveles: {}, suerte: {} });
export const nivelPieza = (e: EquipoState, id: PiezaId): number => e.niveles[id] ?? 0;

/** Probabilidad de subir de `nivel` a `nivel + 1` sin fallos previos: 100 % el primero, y baja hasta 20 %. */
export function baseChance(nivel: number): number {
  return nivel <= 0 ? 1 : Math.max(0.2, 0.95 - 0.08 * nivel);
}

/** La probabilidad del siguiente intento de esta pieza (con lo que suman sus fallos). */
export function chanceOf(e: EquipoState, id: PiezaId): number {
  return Math.min(1, baseChance(nivelPieza(e, id)) + (e.suerte[id] ?? 0));
}

/** Runas que cuesta cada intento para subir desde `nivel`. */
export const costoPieza = (nivel: number): number => Math.round(EQUIPO.costo * Math.pow(EQUIPO.crece, nivel));

export interface Intento {
  exito: boolean;
  /** Nivel de la pieza después del intento. */
  nivel: number;
  /** La probabilidad que tenía. */
  chance: number;
  costo: number;
  /** Lo que tendrá el siguiente intento (si falló, más). */
  siguiente: number;
}

/** Intenta mejorar una pieza. `tiro` (0–1): si es menor que la probabilidad, sube. null si no alcanzan las Runas o ya está al máximo. */
export function mejorar(host: { runas: number; equipo: EquipoState }, id: PiezaId, tiro: number): Intento | null {
  const e = host.equipo;
  const nivel = nivelPieza(e, id);
  const costo = costoPieza(nivel);
  if (nivel >= NIVEL_MAX || host.runas < costo) return null;
  const chance = chanceOf(e, id);
  host.runas -= costo;
  const exito = tiro < chance;
  if (exito) {
    e.niveles = { ...e.niveles, [id]: nivel + 1 };
    e.suerte = { ...e.suerte, [id]: 0 };
  } else {
    e.suerte = { ...e.suerte, [id]: Math.round(((e.suerte[id] ?? 0) + SUERTE_POR_FALLO) * 100) / 100 };
  }
  return { exito, nivel: nivelPieza(e, id), chance, costo, siguiente: nivelPieza(e, id) >= NIVEL_MAX ? 0 : chanceOf(e, id) };
}

/** Qué tan equipado se ve cada grupo (0 a 3), según la suma de los niveles de sus tres piezas (máximo 30). */
export function tierDe(niveles: EquipoNiveles, grupo: Grupo): 0 | 1 | 2 | 3 {
  const total = PIEZAS.filter((p) => p.grupo === grupo).reduce((t, p) => t + (niveles[p.id] ?? 0), 0);
  return total >= 24 ? 3 : total >= 12 ? 2 : total >= 3 ? 1 : 0;
}

export interface BonosEquipo {
  /** Multiplica el daño del mago, su tiempo entre explosiones y el lado de la explosión. */
  magoDanio: number;
  magoIntervalo: number;
  magoArea: number;
  /** Multiplica el daño de los arqueros y su tiempo entre flechas; objetivos de más. */
  arcoDanio: number;
  arcoIntervalo: number;
  arcoObjetivos: number;
  /** Multiplica la vida de la muralla, todo el daño (también el de tu círculo) y todo el oro. */
  muroVida: number;
  danio: number;
  oro: number;
}

export function bonosEquipo(niveles: EquipoNiveles = {}): BonosEquipo {
  const n = (id: PiezaId) => niveles[id] ?? 0;
  const E = EQUIPO;
  return {
    magoDanio: 1 + E.baculo * n('baculo'),
    magoIntervalo: Math.pow(E.tunica, n('tunica')),
    magoArea: 1 + E.sombrero * n('sombrero'),
    arcoDanio: (1 + E.arco * n('arco')) * (1 + E.armadura * n('armadura')),
    arcoIntervalo: Math.pow(E.flechas, n('flechas')),
    arcoObjetivos: Math.floor(n('armadura') / 5),
    muroVida: 1 + E.muralla * n('muralla'),
    danio: 1 + E.torre * n('torre'),
    oro: 1 + E.estandarte * n('estandarte'),
  };
}

/** Tolera guardados viejos o dañados. */
export function loadEquipo(raw: unknown): EquipoState {
  const e = emptyEquipo();
  if (!raw || typeof raw !== 'object') return e;
  const r = raw as Partial<EquipoState>;
  for (const p of PIEZAS) {
    const nv = Number(r.niveles?.[p.id]);
    if (Number.isFinite(nv) && nv > 0) e.niveles[p.id] = Math.min(NIVEL_MAX, Math.floor(nv));
    const su = Number(r.suerte?.[p.id]);
    if (Number.isFinite(su) && su > 0) e.suerte[p.id] = Math.min(1, su);
  }
  return e;
}
