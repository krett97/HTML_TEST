import { describe, expect, it } from 'vitest';
import { RateLimiter } from '../src/core/limiter';
import { computeSceneSize } from '../src/game/sceneSize';

describe('tope de toques', () => {
  it('deja pasar hasta el máximo por segundo', () => {
    const limiter = new RateLimiter(15);
    const accepted = Array.from({ length: 20 }, (_, i) => limiter.tryConsume(i * 10)).filter(Boolean);
    expect(accepted.length).toBe(15);
    expect(limiter.tryConsume(1000)).toBe(true);
  });
});

describe('tamaño de la escena', () => {
  it('celular: escala entera de píxeles y alto que llena el espacio', () => {
    const size = computeSceneSize(390, 420, 3);
    expect(size).toEqual({ pixelScale: 3, width: 195, height: 210, zoom: 1 });
  });

  it('PC: columna de 476 px', () => {
    expect(computeSceneSize(476, 500, 1)).toEqual({ pixelScale: 1, width: 238, height: 250, zoom: 1 });
  });

  it('nunca baja de escala 1 ni del alto mínimo', () => {
    expect(computeSceneSize(100, 100, 1)).toEqual({ pixelScale: 1, width: 180, height: 160, zoom: 1 });
  });

  it('densidades fraccionarias dan píxeles enteros del dispositivo', () => {
    const size = computeSceneSize(412, 400, 2.625);
    expect(Number.isInteger(size.pixelScale)).toBe(true);
    expect(size.zoom * 2.625).toBeCloseTo(size.pixelScale);
  });
});
