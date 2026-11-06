import { describe, expect, it } from 'vitest';
import { RateLimiter } from '../src/core/limiter';
import { cameraScroll, computeSceneSize } from '../src/game/sceneSize';

describe('tope de toques', () => {
  it('deja pasar hasta el máximo por segundo', () => {
    const limiter = new RateLimiter(15);
    const accepted = Array.from({ length: 20 }, (_, i) => limiter.tryConsume(i * 10)).filter(Boolean);
    expect(accepted.length).toBe(15);
    expect(limiter.tryConsume(1000)).toBe(true);
  });
});

describe('tamaño de la escena', () => {
  it('celular: escala entera de píxeles, cámara cerca y alto que llena el espacio', () => {
    // 390×380 CSS a densidad 2: cada píxel de arte mide 3 del dispositivo (1.5 CSS); se ven 130 de las 180 unidades.
    expect(computeSceneSize(390, 380, 2)).toEqual({ pixelScale: 3, width: 130, height: 126, zoom: 1.5 });
    // A densidad 3 (1170 px): 4 por píxel de arte; se ven 146 unidades.
    expect(computeSceneSize(390, 420, 3)).toEqual({ pixelScale: 4, width: 146, height: 157, zoom: 4 / 3 });
  });

  it('PC: columna de 476 px', () => {
    expect(computeSceneSize(476, 500, 1)).toEqual({ pixelScale: 1, width: 238, height: 250, zoom: 1 });
  });

  it('nunca baja de escala 1 ni del ancho y alto mínimos', () => {
    expect(computeSceneSize(100, 100, 1)).toEqual({ pixelScale: 1, width: 120, height: 120, zoom: 1 });
  });

  it('la cámara sigue al gato sin salirse del mundo; en pantallas anchas centra el mundo', () => {
    expect(cameraScroll(40, 130)).toBe(0);
    expect(cameraScroll(100, 130)).toBe(35);
    expect(cameraScroll(170, 130)).toBe(50);
    expect(cameraScroll(90, 238)).toBe(-29);
  });

  it('densidades fraccionarias dan píxeles enteros del dispositivo', () => {
    const size = computeSceneSize(412, 400, 2.625);
    expect(Number.isInteger(size.pixelScale)).toBe(true);
    expect(size.zoom * 2.625).toBeCloseTo(size.pixelScale);
  });
});
