import { describe, expect, it } from 'vitest';
import { tap } from '../src/core/actions';
import { allyLevel } from '../src/core/allies';
import { playUntil } from '../src/core/bot';
import { followersFor, uploadVideo, videoPreview } from '../src/core/canal';
import { moneyPerBreak, tapDamage } from '../src/core/economy';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { startResearch } from '../src/core/research';
import { deserialize, serialize } from '../src/core/save';
import { buySkill, skillCost, skillLevel } from '../src/core/skills';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';

function newState() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  return state;
}

describe('Canal: subir el video es el reinicio', () => {
  it('seguidores = ⌊√(dinero de la partida / escala)⌋', () => {
    const escala = gameData.balance.canal.escalaSeguidores;
    expect(followersFor(num(escala * 100), gameData)).toBe(10);
    expect(followersFor(num(escala * 99), gameData)).toBe(9);
  });

  it('no se puede subir antes de descubrir el canal ni antes de llegar lo bastante lejos', () => {
    const state = newState();
    state.dineroPartida = num(1e12);
    expect(videoPreview(state, gameData).listo).toBe(false);
    state.desbloqueos.push('canal');
    state.nivelValor = 100;
    expect(videoPreview(state, gameData).listo).toBe(false);
    state.nivelValor = 115; // lavadora
    expect(videoPreview(state, gameData).listo).toBe(true);
  });

  it('una partida real deja ~24 seguidores al llegar al refri', () => {
    const state = newState();
    playUntil(state, gameData, { objeto: 'refri' });
    const preview = videoPreview(state, gameData);
    expect(preview.listo).toBe(true);
    expect(preview.seguidores).toBeGreaterThanOrEqual(18);
    expect(preview.seguidores).toBeLessThanOrEqual(30);
  });

  it('reinicia la partida y conserva canal, descubrimientos e investigaciones', () => {
    const state = newState();
    playUntil(state, gameData, { objeto: 'refri' });
    state.laboratorio.hechas.push('mirada');
    const unlocked = [...state.desbloqueos];
    const seguidores = videoPreview(state, gameData).seguidores;
    const video = uploadVideo(state, gameData, 123, () => 0.9)!;
    expect(video.viral).toBe(false);
    expect(video.objeto).toBe('refri');
    expect(state.canal.seguidores).toBe(seguidores);
    expect(state.canal.visualizaciones.toNumber()).toBe(seguidores * gameData.balance.canal.visualizacionesPorSeguidor);
    expect(state.canal.videos).toHaveLength(1);
    expect(state.nivelValor).toBe(0);
    expect(state.nivelFuerza).toBe(0);
    expect(state.nivelCritico).toBe(0);
    expect(state.aliados).toEqual([]);
    expect(state.dinero.eq(0)).toBe(true);
    expect(state.desbloqueos).toEqual(unlocked);
    expect(state.laboratorio.hechas).toContain('mirada');
  });

  it('un video viral multiplica seguidores y visualizaciones', () => {
    const state = newState();
    playUntil(state, gameData, { objeto: 'refri' });
    const base = videoPreview(state, gameData).seguidores;
    const video = uploadVideo(state, gameData, 0, () => 0.01)!;
    expect(video.viral).toBe(true);
    expect(video.seguidores).toBe(base * gameData.balance.canal.multViral);
  });

  it('cada seguidor da +2 % de dinero', () => {
    const state = newState();
    const before = moneyPerBreak(state, gameData).toNumber();
    state.nivelValor = 50;
    const at50 = moneyPerBreak(state, gameData).toNumber();
    state.canal.seguidores = 50;
    expect(moneyPerBreak(state, gameData).toNumber()).toBeCloseTo(at50 * 2, 0);
    expect(before).toBeGreaterThan(0);
  });
});

describe('Habilidades', () => {
  it('se compran con visualizaciones y tienen tope', () => {
    const state = newState();
    const def = gameData.skills.find((s) => s.id === 'embestida')!;
    expect(buySkill(state, gameData, 'embestida')).toBe(false);
    state.canal.visualizaciones = skillCost(state, def);
    expect(buySkill(state, gameData, 'embestida')).toBe(true);
    expect(state.canal.visualizaciones.eq(0)).toBe(true);
    state.habilidades = [{ id: 'embestida', nivel: def.max }];
    state.canal.visualizaciones = num(1e30);
    expect(buySkill(state, gameData, 'embestida')).toBe(false);
  });

  it('embestida: cada 10 manotazos, uno pega ×(1 + 2 × nivel)', () => {
    const state = newState();
    state.nivelValor = 130;
    state.habilidades = [{ id: 'embestida', nivel: 2 }];
    const normal = tapDamage(state, gameData);
    const hits = Array.from({ length: 10 }, () => tap(state, gameData, () => 0.99));
    expect(hits.filter((h) => h.embestida)).toHaveLength(1);
    expect(hits[9]!.damage.eq(normal.mul(5))).toBe(true);
  });

  it('pandilla: la partida nueva empieza con gatito, ratón y perro entrenados', () => {
    const state = newState();
    playUntil(state, gameData, { objeto: 'refri' });
    state.habilidades = [{ id: 'pandilla', nivel: 2 }];
    uploadVideo(state, gameData, 0, () => 0.9);
    expect(allyLevel(state, 'gatito')).toBe(10);
    expect(allyLevel(state, 'perro')).toBe(10);
    expect(allyLevel(state, 'cabra')).toBe(0);
  });

  it('express: las investigaciones tardan menos (nunca menos de la mitad)', () => {
    const state = newState();
    state.desbloqueos.push('laboratorio');
    state.nivelValor = 60;
    state.pruebas.dineroInfinito = true;
    state.habilidades = [{ id: 'express', nivel: 3 }];
    startResearch(state, gameData, 'mirada', 0);
    expect(state.laboratorio.actual!.fin).toBe(60 * 0.7 * 1000);
    expect(skillLevel(state, 'express')).toBe(3);
  });

  it('el canal y las habilidades se guardan', () => {
    const state = newState();
    state.canal.seguidores = 33;
    state.canal.visualizaciones = num(1234);
    state.habilidades = [{ id: 'recolectora', nivel: 4 }];
    const loaded = deserialize(serialize(state, 1), 2);
    expect(loaded.ok && loaded.state.canal.seguidores).toBe(33);
    expect(loaded.ok && loaded.state.canal.visualizaciones.eq(1234)).toBe(true);
    expect(loaded.ok && loaded.state.habilidades).toEqual([{ id: 'recolectora', nivel: 4 }]);
  });
});
