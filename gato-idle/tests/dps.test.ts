import { describe, expect, it } from 'vitest';
import { DpsMeter } from '../src/app/dpsMeter';
import { num } from '../src/core/num';

describe('medidor de daño por segundo', () => {
  it('promedia el daño de los últimos 3 s y separa gato y aliados', () => {
    const meter = new DpsMeter(3000, 100);
    for (let t = 0; t < 3000; t += 200) meter.add(t, num(10), 'gato'); // 15 manotazos de 10
    meter.add(1500, num(30), 'aliados');
    const reading = meter.read(2999);
    expect(reading.gato.toNumber()).toBeCloseTo(50);
    expect(reading.aliados.toNumber()).toBeCloseTo(10);
    expect(reading.total.toNumber()).toBeCloseTo(60);
  });

  it('se vacía cuando ya no hay golpes', () => {
    const meter = new DpsMeter(3000, 100);
    meter.add(0, num(100), 'gato');
    expect(meter.read(500).total.toNumber()).toBeGreaterThan(0);
    expect(meter.read(3200).total.toNumber()).toBe(0);
  });
});
