// Formato del guardado: JSON con número de versión. Los Decimal se guardan como {"$d": "1.5e30"}.
// Para cambiar el formato: sube SAVE_VERSION y agrega una migración que convierta la versión anterior.
import { Decimal, isDecimal } from './num';
import { createInitialState, type GameState } from './state';

export const SAVE_VERSION = 1;

/** Lo que se escribe en disco. */
interface SaveFile {
  /** Versión del formato. */
  v: number;
  /** Momento del guardado (ms); decide qué ranura es la más reciente. */
  t: number;
  s: unknown;
}

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** MIGRATIONS[n] convierte un guardado de la versión n a la n + 1. */
export const MIGRATIONS: Record<number, Migration> = {};

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
