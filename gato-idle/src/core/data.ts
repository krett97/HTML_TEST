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

/** Funciones que se van descubriendo: "fuerza", "valor", "critico", "laboratorio", "aliado:<id>"… */
export const FEATURES = ['fuerza', 'valor', 'patrocinios', 'critico', 'danioCritico', 'lentes', 'laboratorio'] as const;

/** Un descubrimiento: se desbloquea al cumplir su condición, en el orden de unlocks.json. */
export interface UnlockDef {
  id: string;
  condicion: { roturas: number } | { objeto: string };
}

/** Investigación del laboratorio: tarda tiempo real y da una mejora permanente. */
export interface ResearchDef {
  id: string;
  /** Hay que haber llegado a este objeto (además de terminar la anterior). */
  requiere: string;
  costo: Decimal;
  /** Segundos. */
  duracion: number;
  efectos: Effect[];
}

/**
 * Con qué tira el gato cada familia de objetos (pata, garras, carrito, aspiradora). Ya no se
 * compran: el gato las usa solo al llegar a esos objetos y solo cambian cómo se ve. Las compras
 * con efecto volverán como "Habilidades" en los reinicios (fase 4).
 */
export interface ToolDef {
  id: string;
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
  critico: {
    /** Probabilidad de crítico que da cada nivel (0.01 = 1 %), hasta `probMax`. */
    probPorNivel: number;
    probMax: number;
    costoBase: number;
    crecimiento: number;
  };
  danioCritico: {
    /** Un crítico multiplica el daño por multBase + nivel × multPorNivel. */
    multBase: number;
    multPorNivel: number;
    costoBase: number;
    crecimiento: number;
  };
  lentes: {
    /** Lentes de jefe: el daño de todos los aliados se multiplica por 1 + nivel × multPorNivel. */
    multPorNivel: number;
    costoBase: number;
    crecimiento: number;
  };
  patrocinio: {
    /** Cada cuánto aparece la oferta (s) y cuánto se queda en pantalla (s). */
    cadaSegundos: number;
    visibleSegundos: number;
    /** Paga lo que el jugador ganaría en tantos segundos de juego activo… */
    segundosDeJuego: number;
    /** …a este ritmo de toques… */
    toquesPorSegundo: number;
    /** …y nunca menos que tantas roturas del objeto actual. */
    roturasMinimas: number;
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
  unlocks: UnlockDef[];
  research: ResearchDef[];
  balance: Balance;
}

export interface RawGameData {
  objects: unknown;
  tools: unknown;
  allies: unknown;
  unlocks: unknown;
  research: unknown;
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
    if (raw.escala !== undefined && raw.escala !== 'aliados') {
      throw new DataError(file, `${where}: escala "${String(raw.escala)}" no existe (aliados)`);
    }
    return { stat: raw.stat, op: raw.op, valor: raw.valor, ...(raw.escala ? { escala: raw.escala } : {}) } as Effect;
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
  const tools: ToolDef[] = asArray('tools.json', raw.tools).map((item) => ({ id: str('tools.json', item, 'id') }));
  if (tools.length === 0) throw new DataError('tools.json', 'no hay herramientas');
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
    const rawSound = (item.sonido ?? {}) as Raw;
    return {
      id,
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

  const allyIds = new Set(allies.map((a) => a.id));
  const unlocks: UnlockDef[] = asArray('unlocks.json', raw.unlocks).map((item) => {
    const id = str('unlocks.json', item, 'id');
    const known = (FEATURES as readonly string[]).includes(id) || (id.startsWith('aliado:') && allyIds.has(id.slice(7)));
    if (!known) throw new DataError('unlocks.json', `"${id}" no es una función ni un aliado conocido`);
    const cond = (item.condicion ?? {}) as Raw;
    if (typeof cond.roturas === 'number' && cond.roturas >= 0) return { id, condicion: { roturas: cond.roturas } };
    if (typeof cond.objeto === 'string' && objectIds.has(cond.objeto)) return { id, condicion: { objeto: cond.objeto } };
    throw new DataError('unlocks.json', `"${id}": la condición debe ser { "roturas": n } o { "objeto": id existente }`);
  });
  uniqueIds('unlocks.json', unlocks);
  for (const ally of allies) {
    if (!unlocks.some((u) => u.id === `aliado:${ally.id}`)) {
      throw new DataError('unlocks.json', `falta cuándo se desbloquea el aliado "${ally.id}"`);
    }
  }

  const research: ResearchDef[] = asArray('research.json', raw.research).map((item) => {
    const id = str('research.json', item, 'id');
    const requiere = str('research.json', item, 'requiere');
    if (!objectIds.has(requiere)) throw new DataError('research.json', `"${id}": requiere "${requiere}" no existe en objects.json`);
    return {
      id,
      requiere,
      costo: positive('research.json', item, 'costo'),
      duracion: positive('research.json', item, 'duracion').toNumber(),
      efectos: effects('research.json', item),
    };
  });
  uniqueIds('research.json', research);

  const file = 'balance.json';
  const b = (raw.balance ?? {}) as Raw;
  const n = (item: Raw, key: string) => positive(file, item, key).toNumber();
  const fuerza = section(file, b, 'fuerza');
  const valor = section(file, b, 'valor');
  const aliados = section(file, b, 'aliados');
  const patrocinio = section(file, b, 'patrocinio');
  const critico = section(file, b, 'critico');
  const danioCritico = section(file, b, 'danioCritico');
  const lentes = section(file, b, 'lentes');
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
    critico: {
      probPorNivel: n(critico, 'probPorNivel'),
      probMax: Math.min(1, n(critico, 'probMax')),
      costoBase: n(critico, 'costoBase'),
      crecimiento: n(critico, 'crecimiento'),
    },
    danioCritico: {
      multBase: n(danioCritico, 'multBase'),
      multPorNivel: n(danioCritico, 'multPorNivel'),
      costoBase: n(danioCritico, 'costoBase'),
      crecimiento: n(danioCritico, 'crecimiento'),
    },
    lentes: {
      multPorNivel: n(lentes, 'multPorNivel'),
      costoBase: n(lentes, 'costoBase'),
      crecimiento: n(lentes, 'crecimiento'),
    },
    patrocinio: {
      cadaSegundos: n(patrocinio, 'cadaSegundos'),
      visibleSegundos: n(patrocinio, 'visibleSegundos'),
      segundosDeJuego: n(patrocinio, 'segundosDeJuego'),
      toquesPorSegundo: n(patrocinio, 'toquesPorSegundo'),
      roturasMinimas: n(patrocinio, 'roturasMinimas'),
    },
    aliados: {
      hitoCada: Math.max(1, Math.floor(n(aliados, 'hitoCada'))),
      multHito: n(aliados, 'multHito'),
      probabilidadVoz: Math.min(1, n(aliados, 'probabilidadVoz')),
    },
  };

  return { objects, tools, allies, unlocks, research, balance };
}
