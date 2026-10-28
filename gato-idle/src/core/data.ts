// Tipos de los datos de balance (src/data/*.json) y su validación.
// Los JSON no tienen lógica; aquí se validan una sola vez al arrancar para que un error de
// captura (un id repetido, una herramienta que no existe) truene con un mensaje claro.
import { OPS, STATS, type Effect } from './modifiers';
import { num, type Decimal } from './num';
import { ALL_SOUNDS, BREAK_SOUNDS, HIT_SOUNDS, type ObjectSound, type SoundId } from './sounds';

export const BREAK_STYLES = ['empujar', 'rasgar', 'volcar'] as const;
export type BreakStyle = (typeof BREAK_STYLES)[number];

export interface PlaceholderSpec {
  w: number;
  h: number;
  color: string;
}

export interface ObjectDef {
  id: string;
  herramienta: string;
  estiloRotura: BreakStyle;
  hp: Decimal;
  vistas: Decimal;
  sonido: ObjectSound;
  sprite: string;
  /** Rectángulo de color que se dibuja mientras no exista el sprite real. */
  placeholder?: PlaceholderSpec;
}

/** Mascota que destruye sola: golpea cada `intervalo` segundos. */
export interface AllyDef {
  id: string;
  /** Aparece al llegar a este objeto (id de objects.json). */
  desbloqueo: string;
  costoBase: Decimal;
  crecimiento: number;
  /** Daño de cada golpe por nivel. */
  danioBase: number;
  intervalo: number;
  sonido: {
    golpe: SoundId;
    /** De vez en cuando, además del golpe: maullido, ladrido… */
    voz: SoundId | null;
    tono: number;
    volumen: number;
  };
}

export interface ToolDef {
  id: string;
  costo: Decimal;
  efectos: Effect[];
}

export interface Balance {
  tarifaPorVista: number;
  toquesMaxPorSegundo: number;
  autoguardadoSegundos: number;
  fuerza: {
    costoBase: number;
    crecimiento: number;
    danioPorNivel: number;
    /** Cada tantos niveles, el daño se multiplica por `multHito`. */
    hitoCada: number;
    multHito: number;
  };
  valor: {
    /** Niveles de Valor que se compran antes de que el dueño cambie de objeto. */
    nivelesPorObjeto: number;
    /** +12 % de vistas por nivel (compuesto). */
    vistasPorNivel: number;
    /** El primer nivel de cada objeto cuesta lo que pagan tantas roturas de ese objeto. */
    costoEnRoturas: number;
    crecimiento: number;
  };
  aliados: {
    /** Cada tantos niveles de un aliado, su daño se multiplica por `multHito`. */
    hitoCada: number;
    multHito: number;
    /** Probabilidad de que un golpe venga con voz (maullido, ladrido…). */
    probabilidadVoz: number;
  };
}

export interface GameData {
  objects: ObjectDef[];
  tools: ToolDef[];
  allies: AllyDef[];
  balance: Balance;
}

export interface RawGameData {
  objects: unknown;
  tools: unknown;
  allies: unknown;
  balance: unknown;
}

type Raw = Record<string, unknown>;

class DataError extends Error {
  constructor(file: string, message: string) {
    super(`[datos/${file}] ${message}`);
    this.name = 'DataError';
  }
}

function asArray(file: string, value: unknown): Raw[] {
  if (!Array.isArray(value)) throw new DataError(file, 'debe ser una lista');
  return value as Raw[];
}

function str(file: string, item: Raw, key: string): string {
  const value = item[key];
  if (typeof value !== 'string' || value === '') {
    throw new DataError(file, `"${String(item.id ?? '?')}": falta "${key}" (texto)`);
  }
  return value;
}

function positive(file: string, item: Raw, key: string, allowZero = false): Decimal {
  const value = item[key];
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new DataError(file, `"${String(item.id ?? '?')}": falta "${key}" (número)`);
  }
  const d = num(value);
  if (!Number.isFinite(d.mantissa) || d.lt(0) || (!allowZero && d.eq(0))) {
    throw new DataError(file, `"${String(item.id ?? '?')}": "${key}" debe ser mayor que 0`);
  }
  return d;
}

function effects(file: string, item: Raw): Effect[] {
  const list = item.efectos ?? [];
  if (!Array.isArray(list)) throw new DataError(file, `"${String(item.id)}": "efectos" debe ser una lista`);
  return list.map((raw: Raw) => {
    const where = `"${String(item.id)}"`;
    if (!(STATS as readonly unknown[]).includes(raw.stat)) {
      throw new DataError(file, `${where}: stat "${String(raw.stat)}" no existe (${STATS.join(', ')})`);
    }
    if (!(OPS as readonly unknown[]).includes(raw.op)) {
      throw new DataError(file, `${where}: op "${String(raw.op)}" no existe (${OPS.join(', ')})`);
    }
    if (typeof raw.valor !== 'number' || !Number.isFinite(raw.valor)) {
      throw new DataError(file, `${where}: "valor" debe ser un número`);
    }
    return { stat: raw.stat, op: raw.op, valor: raw.valor } as Effect;
  });
}

function sound<T extends string>(file: string, item: Raw, value: unknown, allowed: readonly T[], what: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new DataError(file, `"${String(item.id)}": sonido de ${what} "${String(value)}" no existe (${allowed.join(', ')})`);
  }
  return value as T;
}

function objectSound(file: string, item: Raw): ObjectSound {
  const raw = (item.sonido ?? {}) as Raw;
  const tono = typeof raw.tono === 'number' && raw.tono > 0 ? raw.tono : 1;
  return {
    golpe: sound(file, item, raw.golpe, HIT_SOUNDS, 'golpe'),
    rotura: sound(file, item, raw.rotura, BREAK_SOUNDS, 'rotura'),
    tono,
  };
}

function section(file: string, parent: Raw, key: string): Raw {
  const value = parent[key];
  if (value === null || typeof value !== 'object') throw new DataError(file, `falta la sección "${key}"`);
  return { id: key, ...(value as Raw) };
}

function uniqueIds(file: string, items: { id: string }[]): void {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) throw new DataError(file, `id repetido: "${id}"`);
    seen.add(id);
  }
}

export function parseGameData(raw: RawGameData): GameData {
  const tools: ToolDef[] = asArray('tools.json', raw.tools).map((item) => ({
    id: str('tools.json', item, 'id'),
    costo: positive('tools.json', item, 'costo', true),
    efectos: effects('tools.json', item),
  }));
  if (tools.length === 0 || !tools[0]!.costo.eq(0)) {
    throw new DataError('tools.json', 'la primera herramienta debe ser gratis (con ella empieza el gato)');
  }
  uniqueIds('tools.json', tools);
  const toolIds = new Set(tools.map((t) => t.id));

  const objects: ObjectDef[] = asArray('objects.json', raw.objects).map((item) => {
    const id = str('objects.json', item, 'id');
    const herramienta = str('objects.json', item, 'herramienta');
    if (!toolIds.has(herramienta)) {
      throw new DataError('objects.json', `"${id}": la herramienta "${herramienta}" no existe en tools.json`);
    }
    const estilo = str('objects.json', item, 'estiloRotura');
    if (!(BREAK_STYLES as readonly string[]).includes(estilo)) {
      throw new DataError('objects.json', `"${id}": estiloRotura "${estilo}" no es válido (${BREAK_STYLES.join(', ')})`);
    }
    return {
      id,
      herramienta,
      estiloRotura: estilo as BreakStyle,
      hp: positive('objects.json', item, 'hp'),
      vistas: positive('objects.json', item, 'vistas'),
      sonido: objectSound('objects.json', item),
      sprite: str('objects.json', item, 'sprite'),
      placeholder: item.placeholder as PlaceholderSpec | undefined,
    };
  });
  uniqueIds('objects.json', objects);
  if (objects.length === 0) throw new DataError('objects.json', 'no hay objetos');

  const objectIds = new Set(objects.map((o) => o.id));
  const allies: AllyDef[] = asArray('allies.json', raw.allies).map((item) => {
    const id = str('allies.json', item, 'id');
    const desbloqueo = str('allies.json', item, 'desbloqueo');
    if (!objectIds.has(desbloqueo)) {
      throw new DataError('allies.json', `"${id}": desbloqueo "${desbloqueo}" no existe en objects.json`);
    }
    const rawSound = (item.sonido ?? {}) as Raw;
    return {
      id,
      desbloqueo,
      costoBase: positive('allies.json', item, 'costoBase'),
      crecimiento: positive('allies.json', item, 'crecimiento').toNumber(),
      danioBase: positive('allies.json', item, 'danioBase').toNumber(),
      intervalo: positive('allies.json', item, 'intervalo').toNumber(),
      sonido: {
        golpe: sound('allies.json', item, rawSound.golpe, ALL_SOUNDS, 'golpe'),
        voz: rawSound.voz == null ? null : sound('allies.json', item, rawSound.voz, ALL_SOUNDS, 'voz'),
        tono: typeof rawSound.tono === 'number' && rawSound.tono > 0 ? rawSound.tono : 1,
        volumen: typeof rawSound.volumen === 'number' && rawSound.volumen > 0 ? rawSound.volumen : 1,
      },
    };
  });
  uniqueIds('allies.json', allies);

  const file = 'balance.json';
  const b = (raw.balance ?? {}) as Raw;
  const n = (item: Raw, key: string) => positive(file, item, key).toNumber();
  const fuerza = section(file, b, 'fuerza');
  const valor = section(file, b, 'valor');
  const aliados = section(file, b, 'aliados');
  const balance: Balance = {
    tarifaPorVista: n(b, 'tarifaPorVista'),
    toquesMaxPorSegundo: n(b, 'toquesMaxPorSegundo'),
    autoguardadoSegundos: n(b, 'autoguardadoSegundos'),
    fuerza: {
      costoBase: n(fuerza, 'costoBase'),
      crecimiento: n(fuerza, 'crecimiento'),
      danioPorNivel: n(fuerza, 'danioPorNivel'),
      hitoCada: Math.max(1, Math.floor(n(fuerza, 'hitoCada'))),
      multHito: n(fuerza, 'multHito'),
    },
    valor: {
      nivelesPorObjeto: Math.max(1, Math.floor(n(valor, 'nivelesPorObjeto'))),
      vistasPorNivel: n(valor, 'vistasPorNivel'),
      costoEnRoturas: n(valor, 'costoEnRoturas'),
      crecimiento: n(valor, 'crecimiento'),
    },
    aliados: {
      hitoCada: Math.max(1, Math.floor(n(aliados, 'hitoCada'))),
      multHito: n(aliados, 'multHito'),
      probabilidadVoz: Math.min(1, n(aliados, 'probabilidadVoz')),
    },
  };

  return { objects, tools, allies, balance };
}
