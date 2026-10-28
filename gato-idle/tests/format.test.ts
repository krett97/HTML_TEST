import { describe, expect, it } from 'vitest';
import { formatNum } from '../src/core/format';
import { Decimal } from '../src/core/num';

describe('formatNum', () => {
  it.each([
    [0, '0'],
    [5, '5'],
    [0.1, '0.1'],
    [1.5, '1.5'],
    [999, '999'],
    [1000, '1K'],
    [1500, '1.5K'],
    [12345, '12.3K'],
    [999999, '999K'],
    [2.3e6, '2.3M'],
    [4.1e9, '4.1B'],
    [1e12, '1T'],
    [1e15, '1aa'],
    [1e18, '1ab'],
    [1e93, '1ba'],
    [-1500, '-1.5K'],
  ])('%s → %s', (value, expected) => {
    expect(formatNum(value)).toBe(expected);
  });

  it('usa letras más allá del límite de los números de JavaScript', () => {
    expect(formatNum(new Decimal('1e2040'))).toBe('1zz');
  });

  it('pasa a notación científica cuando se acaban las letras', () => {
    expect(formatNum(new Decimal('1e2043'))).toBe('1e2043');
  });

  it('notación científica', () => {
    expect(formatNum(1500, 'cientifica')).toBe('1.5e3');
    expect(formatNum(new Decimal('2.345e400'), 'cientifica')).toBe('2.34e400');
    expect(formatNum(12, 'cientifica')).toBe('12');
  });

  it('trunca en lugar de redondear', () => {
    expect(formatNum(999_999_999)).toBe('999M');
    expect(formatNum(1999)).toBe('1.99K');
  });
});
