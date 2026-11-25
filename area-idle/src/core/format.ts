// Cantidades cortas para mostrar: 999 → "999", 1500 → "1.5K", 2.3e6 → "2.3M", 1e15 → "1aa".
// Los sufijos no se traducen: en español "billón" es 10^12, no 10^9. (Igual que en el juego del gato.)
const SHORT = ['', 'K', 'M', 'B', 'T'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function suffixFor(group: number): string | null {
  if (group < SHORT.length) return SHORT[group] ?? null;
  const index = group - SHORT.length;
  if (index >= LETTERS.length * LETTERS.length) return null;
  return LETTERS[Math.floor(index / LETTERS.length)]! + LETTERS[index % LETTERS.length]!;
}

const truncate = (value: number, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor * (1 + 1e-12)) / factor;
};
const trimZeros = (text: string) => (text.includes('.') ? text.replace(/\.?0+$/, '') : text);

/** Tres cifras como máximo, recortando (no redondeando) para no mostrar "1000K". */
function threeDigits(value: number): string {
  if (value >= 100) return String(Math.min(999, truncate(value, 0)));
  if (value >= 10) return trimZeros(truncate(value, 1).toFixed(1));
  return trimZeros(truncate(value, 2).toFixed(2));
}

export function formatNum(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  if (value < 0) return '-' + formatNum(-value);
  if (value === 0) return '0';
  if (value < 1000) return threeDigits(value);
  const exponent = Math.floor(Math.log10(value) + 1e-12);
  const group = Math.floor(exponent / 3);
  const suffix = suffixFor(group);
  if (suffix === null) return value.toExponential(2);
  return threeDigits(value / Math.pow(10, group * 3)) + suffix;
}

/** Segundos como reloj: 19 → "00:19", 75 → "01:15". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Duración corta para leer: 45 → "1 min", 2700 → "45 min", 7980 → "2 h 13 min", 7200 → "2 h". */
export function formatDuration(seconds: number): string {
  const min = Math.max(1, Math.floor(seconds / 60));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Oro para mostrar: sin decimales (el oro se junta con fracciones, pero se cuenta en monedas enteras). */
export const formatGold = (value: number): string => formatNum(Math.floor(value));
