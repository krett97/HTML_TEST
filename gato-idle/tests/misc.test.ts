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
  it('celular: cámara cerca y alto que llena el espacio', () => {
    // 390×380 CSS a densidad 2: ~1.58 px del dispositivo por píxel de arte (lo limita el alto); se ven 123 de las 180 unidades.
    const phone = computeSceneSize(390, 380, 2);
    expect(phone.pixelScale).toBeCloseTo(1.583, 2);
    expect(phone.width).toBe(123);
    expect(phone.height).toBe(120);
    expect(phone.zoom * 2).toBeCloseTo(phone.pixelScale);
    // A densidad 3 (1170 px): 2 enteros por píxel de arte; se ven 146 unidades.
    expect(computeSceneSize(390, 420, 3)).toEqual({ pixelScale: 2, width: 146, height: 157, zoom: 2 / 3 });
  });

  it('PC (densidad 1): columna de 476 px, apenas abajo de 1; en ventanas bajitas se encoge para que quepa', () => {
    const pc = computeSceneSize(476, 500, 1);
    expect(pc.pixelScale).toBeCloseTo(0.992, 2);
    expect(pc.width).toBe(120);
    const low = computeSceneSize(476, 330, 1);
    expect(low.pixelScale).toBeCloseTo(0.6875, 3);
    expect(low).toMatchObject({ width: 173, height: 120 });
  });

  it('nunca baja de media escala ni del ancho y alto mínimos', () => {
    expect(computeSceneSize(100, 100, 1)).toEqual({ pixelScale: 0.5, width: 120, height: 120, zoom: 0.5 });
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
