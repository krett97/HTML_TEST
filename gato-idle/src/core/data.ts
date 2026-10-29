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
  /** Cuarto y superficie donde está (cambia el escenario). */
  lugar: PlaceId;
  estiloRotura: BreakStyle;
  hp: Decimal;
  vistas: Decimal;
  sonido: ObjectSound;
  sprite: string;
  /** Rectángulo de color que se dibuja mientras no exista el sprite real. */
  placeholder?: PlaceholderSpec;
  /** En qué casa está (casas.json): los de la casa siguiente llegan después de la mudanza. */
  casa: string;
}

/**
 * Una casa (casas.json, en orden): el departamento, la casa… La primera ya está; a cada una de
 * las demás el dueño se muda al juntar `requisito` en el Canal (totales, nunca se gastan), y
 * desde entonces cada partida empieza en ella con `fuerzaInicial` niveles de Fuerza.
 */
export interface HomeDef {
  id: string;
  requisito: { seguidores: number; visualizaciones: Decimal } | null;
  fuerzaInicial: number;
}

/**
 * Jefe de una casa (jefes.json): aparece en el último objeto de su casa. Hay `segundos` para
 * quitarle una vida de `vidaEnRoturas` veces la del último objeto. Si se gana, paga lo de
 * `premioEnRoturas` roturas de ese objeto y deja un trofeo con `efectos` para siempre; si no, paga
 * una parte según el daño hecho y la revancha llega en `esperaDerrota` segundos.
 */
export interface BossDef {
  id: string;
  casa: string;
  segundos: number;
  vidaEnRoturas: number;
  premioEnRoturas: number;
  esperaDerrota: number;
  efectos: Effect[];
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

/**
 * Dónde está cada objeto: cuarto y superficie ("cocina-barra", "sala-piso"…). Cambia el escenario;
 * cómo se dibuja cada uno está en game/places.ts.
 */
export const PLACES = [
  'cocina-barra',
  'cocina-piso',
  'sala-mesa',
  'sala-mueble',
  'sala-piso',
  'bano-repisa',
  'recamara-cama',
  'recamara-piso',
  'recamara-escritorio',
  'lavado-piso',
  'jardin-mesa',
  'jardin-piso',
  'estudio-escritorio',
  'estudio-repisa',
  'estudio-piso',
  'cochera-piso',
] as const;
export type PlaceId = (typeof PLACES)[number];

/** Habilidades que el código sabe aplicar (core/skills.ts). */
export const SKILLS = ['embestida', 'recolectora', 'pandilla', 'express'] as const;
export type SkillId = (typeof SKILLS)[number];

/** Funciones que se van descubriendo: "fuerza", "valor", "critico", "laboratorio", "aliado:<id>"… */
export const FEATURES = ['fuerza', 'valor', 'patrocinios', 'critico', 'danioCritico', 'saco', 'laboratorio', 'canal'] as const;

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
/**
 * Habilidad del Canal: no se compra, se desbloquea por niveles al juntar seguidores o
 * visualizaciones (totales, nunca se gastan). Nivel n pide ⌈base × crecimiento^(n−1)⌉ del `recurso`.
 * `valor` es lo que da cada nivel (ver core/skills.ts para qué significa en cada una).
 */
export interface SkillDef {
  id: string;
  recurso: SkillResource;
  base: number;
  crecimiento: number;
  max: number;
  valor: number;
}

export const SKILL_RESOURCES = ['seguidores', 'visualizaciones'] as const;
export type SkillResource = (typeof SKILL_RESOURCES)[number];

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
  saco: {
    /** Saco de jefe: el daño de todos los aliados se multiplica por 1 + nivel × multPorNivel. */
    multPorNivel: number;
    costoBase: number;
    crecimiento: number;
  };
  canal: {
    /** Seguidores por video = ⌊(dinero ganado en la partida / escalaSeguidores)^exponenteSeguidores⌋. */
    escalaSeguidores: number;
    exponenteSeguidores: number;
    /** Cada seguidor da +2 % de dinero, para siempre. */
    bonoPorSeguidor: number;
    /** Visualizaciones del video por cada "vista" de la partida (stats.vistasVideo). */
    visualizacionesPorVista: number;
    /** Cada seguidor que ya tiene el canal trae +10 % de visualizaciones a cada video. */
    vistasPorSeguidor: number;
    /** Probabilidad de que el video se haga viral y cuánto multiplica. */
    probabilidadViral: number;
    multViral: number;
    /** Desde este objeto se puede subir el video. */
    objetoMinimo: string;
    /** La embestida de la habilidad llega cada tantos manotazos. */
    embestidaCada: number;
  };
  offline: {
    /** Qué tanto rinde la pandilla sin ti (0.5 = la mitad) y hasta cuántas horas cuenta. */
    eficiencia: number;
    horasMax: number;
    /** Ausencias más cortas se cobran solas, sin ventana. */
    minimoSegundos: number;
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
  homes: HomeDef[];
  bosses: BossDef[];
  tools: ToolDef[];
  allies: AllyDef[];
  unlocks: UnlockDef[];
  research: ResearchDef[];
  skills: SkillDef[];
  balance: Balance;
}

export interface RawGameData {
  objects: unknown;
  casas: unknown;
  jefes: unknown;
  tools: unknown;
  allies: unknown;
  unlocks: unknown;
  research: unknown;
  balance: unknown;
  habilidades: unknown;
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

function skillResource(value: string, id: string): SkillResource {
  if (!(SKILL_RESOURCES as readonly string[]).includes(value)) {
    throw new DataError('habilidades.json', `"${id}": recurso "${value}" no es válido (${SKILL_RESOURCES.join(', ')})`);
  }
  return value as SkillResource;
}

function uniqueIds(file: string, items: { id: string }[]): void {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) throw new DataError(file, `id repetido: "${id}"`);
    seen.add(id);
  }
}

export function parseGameData(raw: RawGameData): GameData {
  const homes: HomeDef[] = asArray('casas.json', raw.casas).map((item, index) => {
    const id = str('casas.json', item, 'id');
    if (index === 0) return { id, requisito: null, fuerzaInicial: 0 };
    const req = (item.requisito ?? {}) as Raw;
    return {
      id,
      requisito: {
        seguidores: positive('casas.json', req, 'seguidores').toNumber(),
        visualizaciones: positive('casas.json', req, 'visualizaciones'),
      },
      fuerzaInicial: Math.floor(positive('casas.json', item, 'fuerzaInicial').toNumber()),
    };
  });
  if (homes.length === 0) throw new DataError('casas.json', 'no hay casas');
  uniqueIds('casas.json', homes);
  const homeIds = homes.map((h) => h.id);

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
    const lugar = str('objects.json', item, 'lugar');
    if (!(PLACES as readonly string[]).includes(lugar)) {
      throw new DataError('objects.json', `"${id}": lugar "${lugar}" no es válido (${PLACES.join(', ')})`);
    }
    const estilo = str('objects.json', item, 'estiloRotura');
    if (!(BREAK_STYLES as readonly string[]).includes(estilo)) {
      throw new DataError('objects.json', `"${id}": estiloRotura "${estilo}" no es válido (${BREAK_STYLES.join(', ')})`);
    }
    return {
      id,
      herramienta,
      lugar: lugar as PlaceId,
      estiloRotura: estilo as BreakStyle,
      hp: positive('objects.json', item, 'hp'),
      vistas: positive('objects.json', item, 'vistas'),
      sonido: objectSound('objects.json', item),
      sprite: str('objects.json', item, 'sprite'),
      placeholder: item.placeholder as PlaceholderSpec | undefined,
      casa: str('objects.json', item, 'casa'),
    };
  });
  uniqueIds('objects.json', objects);
  if (objects.length === 0) throw new DataError('objects.json', 'no hay objetos');
  // Los objetos van por casa, en el orden de casas.json, y cada casa tiene al menos uno.
  let lastHome = 0;
  for (const obj of objects) {
    const home = homeIds.indexOf(obj.casa);
    if (home === -1) throw new DataError('objects.json', `"${obj.id}": la casa "${obj.casa}" no existe en casas.json`);
    if (home < lastHome || home > lastHome + 1) {
      throw new DataError('objects.json', `"${obj.id}": los objetos deben ir por casa, en el orden de casas.json`);
    }
    lastHome = home;
  }
  if (lastHome !== homes.length - 1) throw new DataError('objects.json', `la casa "${homeIds[homes.length - 1]}" no tiene objetos`);

  const bosses: BossDef[] = asArray('jefes.json', raw.jefes).map((item) => {
    const id = str('jefes.json', item, 'id');
    const casa = str('jefes.json', item, 'casa');
    if (!homeIds.includes(casa)) throw new DataError('jefes.json', `"${id}": la casa "${casa}" no existe en casas.json`);
    const n = (key: string) => positive('jefes.json', item, key).toNumber();
    return {
      id,
      casa,
      segundos: n('segundos'),
      vidaEnRoturas: n('vidaEnRoturas'),
      premioEnRoturas: n('premioEnRoturas'),
      esperaDerrota: n('esperaDerrota'),
      efectos: effects('jefes.json', item),
    };
  });
  uniqueIds('jefes.json', bosses);
  if (new Set(bosses.map((b) => b.casa)).size !== bosses.length) throw new DataError('jefes.json', 'cada casa tiene a lo mucho un jefe');

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
  const canal = section(file, b, 'canal');
  const offline = section(file, b, 'offline');
  const objetoMinimo = str(file, canal, 'objetoMinimo');
  if (!objectIds.has(objetoMinimo)) throw new DataError(file, `canal.objetoMinimo "${objetoMinimo}" no existe en objects.json`);
  const critico = section(file, b, 'critico');
  const danioCritico = section(file, b, 'danioCritico');
  const saco = section(file, b, 'saco');
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
    saco: {
      multPorNivel: n(saco, 'multPorNivel'),
      costoBase: n(saco, 'costoBase'),
      crecimiento: n(saco, 'crecimiento'),
    },
    canal: {
      escalaSeguidores: n(canal, 'escalaSeguidores'),
      exponenteSeguidores: Math.min(1, n(canal, 'exponenteSeguidores')),
      bonoPorSeguidor: n(canal, 'bonoPorSeguidor'),
      visualizacionesPorVista: n(canal, 'visualizacionesPorVista'),
      vistasPorSeguidor: n(canal, 'vistasPorSeguidor'),
      probabilidadViral: Math.min(1, n(canal, 'probabilidadViral')),
      multViral: n(canal, 'multViral'),
      objetoMinimo,
      embestidaCada: Math.max(1, Math.floor(n(canal, 'embestidaCada'))),
    },
    offline: {
      eficiencia: Math.min(1, n(offline, 'eficiencia')),
      horasMax: n(offline, 'horasMax'),
      minimoSegundos: n(offline, 'minimoSegundos'),
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

  const skills: SkillDef[] = asArray('habilidades.json', raw.habilidades).map((item) => ({
    id: str('habilidades.json', item, 'id'),
    recurso: skillResource(str('habilidades.json', item, 'recurso'), String(item.id)),
    base: positive('habilidades.json', item, 'base').toNumber(),
    crecimiento: positive('habilidades.json', item, 'crecimiento').toNumber(),
    max: Math.max(1, Math.floor(positive('habilidades.json', item, 'max').toNumber())),
    valor: positive('habilidades.json', item, 'valor').toNumber(),
  }));
  uniqueIds('habilidades.json', skills);
  for (const id of SKILLS) {
    if (!skills.some((s) => s.id === id)) throw new DataError('habilidades.json', `falta la habilidad "${id}"`);
  }

  return { objects, homes, bosses, tools, allies, unlocks, research, skills, balance };
}
