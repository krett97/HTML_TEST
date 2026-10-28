// Tipos de los datos de balance (src/data/*.json) y su validación.
// Los JSON no tienen lógica; aquí se validan una sola vez al arrancar para que un error de
// captura (un id repetido, una herramienta que no existe) truene con un mensaje claro.
import { num, type Decimal } from './num';

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
  sprite: string;
  /** Rectángulo de color que se dibuja mientras no exista el sprite real. */
  placeholder?: PlaceholderSpec;
}

export interface ToolDef {
  id: string;
  costo: Decimal;
  multDanio: number;
}

export interface Balance {
  tarifaPorVista: number;
  toquesMaxPorSegundo: number;
  autoguardadoSegundos: number;
}

export interface GameData {
  objects: ObjectDef[];
  tools: ToolDef[];
  balance: Balance;
}

export interface RawGameData {
  objects: unknown;
  tools: unknown;
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
    multDanio: positive('tools.json', item, 'multDanio').toNumber(),
  }));
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
      sprite: str('objects.json', item, 'sprite'),
      placeholder: item.placeholder as PlaceholderSpec | undefined,
    };
  });
  uniqueIds('objects.json', objects);
  if (objects.length === 0) throw new DataError('objects.json', 'no hay objetos');

  const b = (raw.balance ?? {}) as Raw;
  const balance: Balance = {
    tarifaPorVista: positive('balance.json', b, 'tarifaPorVista').toNumber(),
    toquesMaxPorSegundo: positive('balance.json', b, 'toquesMaxPorSegundo').toNumber(),
    autoguardadoSegundos: positive('balance.json', b, 'autoguardadoSegundos').toNumber(),
  };

  return { objects, tools, balance };
}
