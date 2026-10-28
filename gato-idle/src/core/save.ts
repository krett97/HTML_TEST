// Formato del guardado: JSON con número de versión. Los Decimal se guardan como {"$d": "1.5e30"}.
// Para cambiar el formato: sube SAVE_VERSION y agrega una migración que convierta la versión anterior.
import { Decimal, isDecimal } from './num';
import { createInitialState, type GameState } from './state';

export const SAVE_VERSION = 3;

/** Lo que se escribe en disco. */
interface SaveFile {
  /** Versión del formato. */
  v: number;
  /** Momento del guardado (ms); decide qué ranura es la más reciente. */
  t: number;
  s: unknown;
}

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

// v1 → v2: la lista pasó de 11 a 27 objetos y de 10 a 5 niveles de Valor por objeto. Se conserva
// el objeto en el que iba el jugador. Las listas quedan fijas aquí aunque objects.json cambie después.
const OBJECTS_V1 = ['vaso', 'florero', 'tenis', 'sofa', 'cortinas', 'colchon', 'tv', 'librero', 'computadora', 'lavadora', 'refri'];
const OBJECTS_V2 = [
  'vaso', 'taza', 'plato', 'control', 'florero', 'celular',
  'papel', 'cojin', 'tenis', 'cortinas', 'sofa', 'colchon',
  'lampara', 'bocina', 'consola', 'tv', 'mesa', 'librero',
  'tostadora', 'cafetera', 'licuadora', 'microondas', 'computadora', 'lavadora', 'secadora', 'estufa', 'refri',
];

function migrateV1(s: Record<string, unknown>): Record<string, unknown> {
  // La versión 0.0.1 guardaba el índice del objeto; la 0.2.0, el nivel de Valor (10 por objeto).
  const valor = typeof s.nivelValor === 'number' ? s.nivelValor : typeof s.objetoActual === 'number' ? s.objetoActual * 10 : 0;
  const oldIndex = Math.min(Math.max(Math.floor(valor / 10), 0), OBJECTS_V1.length - 1);
  const steps = valor - oldIndex * 10;
  const newIndex = Math.max(0, OBJECTS_V2.indexOf(OBJECTS_V1[oldIndex]!));
  return { ...s, nivelValor: newIndex * 5 + Math.min(4, Math.floor(steps / 2)) };
}

// v2 → v3: las herramientas ya no se compran (los críticos tomaron su lugar). Se devuelve lo que
// costaron; los precios quedan fijos aquí aunque cambie el balance.
const TOOL_PRICES_V2: Record<string, number> = { garras: 900, carrito: 30_000, aspiradora: 900_000 };

function migrateV2(s: Record<string, unknown>): Record<string, unknown> {
  const { herramientas, ...rest } = s;
  const owned = Array.isArray(herramientas) ? herramientas : [];
  const refund = owned.reduce<number>((sum, id) => sum + (TOOL_PRICES_V2[String(id)] ?? 0), 0);
  const dinero = isDecimal(rest.dinero) ? rest.dinero : new Decimal(0);
  return { ...rest, dinero: dinero.add(refund) };
}

/** MIGRATIONS[n] convierte un guardado de la versión n a la n + 1. */
export const MIGRATIONS: Record<number, Migration> = { 1: migrateV1, 2: migrateV2 };

export function serialize(state: GameState, now: number): string {
  const file: SaveFile = { v: SAVE_VERSION, t: now, s: state };
  // JSON.stringify llama a toJSON() antes que al replacer, así que se revisa el valor original.
  return JSON.stringify(file, function (this: Record<string, unknown>, key, value) {
    const original = this[key];
    return isDecimal(original) ? { $d: original.toString() } : value;
  });
}

export type LoadResult =
  | { ok: true; state: GameState; savedAt: number; version: number }
  | { ok: false; error: string };

export function deserialize(text: string, now: number): LoadResult {
  let file: SaveFile;
  try {
    file = JSON.parse(text, (_key, value: unknown) => {
      if (value !== null && typeof value === 'object' && '$d' in value) {
        return new Decimal(String((value as { $d: unknown }).$d));
      }
      return value;
    }) as SaveFile;
  } catch {
    return { ok: false, error: 'JSON inválido' };
  }
  if (!file || typeof file !== 'object' || typeof file.v !== 'number' || !isPlainObject(file.s)) {
    return { ok: false, error: 'no es un guardado del juego' };
  }

  let raw = file.s;
  for (let v = file.v; v < SAVE_VERSION; v++) {
    const migrate = MIGRATIONS[v];
    if (!migrate) return { ok: false, error: `no hay migración desde la versión ${v}` };
    raw = migrate(raw);
  }

  const state = mergeDefaults(createInitialState(now), raw) as GameState;
  const savedAt = typeof file.t === 'number' ? file.t : 0;
  return { ok: true, state, savedAt, version: file.v };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !isDecimal(value);
}

/**
 * Toma los valores guardados que coinciden en tipo con los de un estado nuevo. Los campos
 * nuevos reciben su valor inicial; los que ya no existen se descartan.
 */
export function mergeDefaults(defaults: unknown, loaded: unknown): unknown {
  if (isPlainObject(defaults)) {
    if (!isPlainObject(loaded)) return defaults;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(defaults)) {
      out[key] = key in loaded ? mergeDefaults(defaults[key], loaded[key]) : defaults[key];
    }
    return out;
  }
  if (isDecimal(defaults)) {
    return isDecimal(loaded) && Number.isFinite(loaded.mantissa) ? loaded : defaults;
  }
  if (defaults === null) return loaded ?? null;
  if (Array.isArray(defaults)) return Array.isArray(loaded) ? loaded : defaults;
  if (typeof defaults === 'number') return typeof loaded === 'number' && Number.isFinite(loaded) ? loaded : defaults;
  return typeof loaded === typeof defaults ? loaded : defaults;
}

/** Código para copiar el progreso a otro dispositivo (celular ↔ PC). */
export function toExportCode(saveText: string): string {
  const bytes = new TextEncoder().encode(saveText);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function fromExportCode(code: string): string | null {
  try {
    const binary = atob(code.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
