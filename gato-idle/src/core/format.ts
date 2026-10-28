import { num, type NumLike } from './num';

export type Notation = 'letras' | 'cientifica';

// K, M, B, T y luego aa, ab … zz. No se traducen: en español "billón" es 10^12, no 10^9.
const SHORT_SUFFIXES = ['', 'K', 'M', 'B', 'T'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LETTER_SUFFIX_COUNT = LETTERS.length * LETTERS.length;

function suffixFor(group: number): string | null {
  if (group < SHORT_SUFFIXES.length) return SHORT_SUFFIXES[group] ?? null;
  const index = group - SHORT_SUFFIXES.length;
  if (index >= LETTER_SUFFIX_COUNT) return null;
  return LETTERS[Math.floor(index / LETTERS.length)]! + LETTERS[index % LETTERS.length]!;
}

/** Trunca a `decimals` decimales tolerando el error de punto flotante (4.1 * 100 = 409.999…). */
function truncate(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor * (1 + 1e-12)) / factor;
}

/** Recorta (no redondea) a 3 cifras significativas, para no mostrar "1000K" en lugar de "1M". */
function threeDigits(mantissa: number): string {
  if (mantissa >= 100) return String(Math.min(999, truncate(mantissa, 0)));
  if (mantissa >= 10) return trimZeros(truncate(mantissa, 1).toFixed(1));
  return trimZeros(truncate(mantissa, 2).toFixed(2));
}

function trimZeros(text: string): string {
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

/**
 * Formatea una cantidad para mostrarla: 999 → "999", 1500 → "1.5K", 2.3e6 → "2.3M",
 * 1e15 → "1aa". Con notación científica: 1.23e45.
 */
export function formatNum(value: NumLike, notation: Notation = 'letras'): string {
  const d = num(value);
  if (d.lt(0)) return '-' + formatNum(d.neg(), notation);
  if (d.eq(0)) return '0';

  if (d.lt(1000)) return threeDigits(d.toNumber());

  const exponent = d.exponent;
  if (notation === 'cientifica') {
    return `${trimZeros(truncate(d.mantissa, 2).toFixed(2))}e${exponent}`;
  }

  const group = Math.floor(exponent / 3);
  const suffix = suffixFor(group);
  if (suffix === null) return formatNum(d, 'cientifica');
  const mantissa = d.mantissa * Math.pow(10, exponent - group * 3);
  return threeDigits(mantissa) + suffix;
}
