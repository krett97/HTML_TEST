// Números grandes del juego. Todo el código usa este módulo, nunca break_infinity.js directo,
// para poder cambiar de librería sin tocar el resto.
import Decimal from 'break_infinity.js';

export { Decimal };

/** Lo que aceptan las funciones que reciben cantidades: Decimal, número o texto ("1.5e30"). */
export type NumLike = Decimal | number | string;

export function num(value: NumLike): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function isDecimal(value: unknown): value is Decimal {
  return value instanceof Decimal;
}

export const ZERO = new Decimal(0);
