import { describe, expect, it } from 'vitest';
import { uploadVideo } from '../src/core/canal';
import { currentObject } from '../src/core/economy';
import { homeStartIndex, lastObjectIndex, moveIfReady, moveUnlocked, nextHome } from '../src/core/mudanza';
import { advanceLevel, gateAt, levelMeta } from '../src/core/niveles';
import { normalizeState } from '../src/core/normalize';
import { num } from '../src/core/num';
import { deserialize, serialize } from '../src/core/save';
import { createInitialState } from '../src/core/state';
import { gameData } from '../src/data';
import { irA } from './helpers';

const REFRI = gameData.objects.findIndex((o) => o.id === 'refri');
const casa = gameData.homes[1]!;

/** En el refri, con el nivel terminado y la Escoba vencida: solo falta la mudanza. */
function atRefri() {
  const state = createInitialState(0);
  normalizeState(state, gameData);
  state.desbloqueos.push('valor', 'canal');
  irA(state, REFRI);
  state.progreso.roturas = levelMeta(state, gameData);
  state.jefes.derrotados.push('escoba');
  state.dinero = num(1e30);
  return state;
}

function famous(state: ReturnType<typeof atRefri>) {
  state.canal.seguidores = casa.requisito!.seguidores;
  state.canal.visualizacionesTotales = casa.requisito!.visualizaciones;
}

describe('mudanza', () => {
  it('sin los seguidores y visualizaciones del Canal, el refri es el último nivel', () => {
    const state = atRefri();
    expect(moveUnlocked(state, gameData)).toBe(false);
    expect(lastObjectIndex(state, gameData)).toBe(REFRI);
    expect(gateAt(state, gameData)).toBe('mudanza');
    expect(advanceLevel(state, gameData)).toBe(null);
    expect(currentObject(state, gameData).id).toBe('refri');
    expect(state.casa).toBe(0);
  });

  it('con la meta del Canal, el nivel sigue después del refri y el dueño se muda', () => {
    const state = atRefri();
    famous(state);
    expect(moveUnlocked(state, gameData)).toBe(true);
    expect(gateAt(state, gameData)).toBe(null);
    expect(advanceLevel(state, gameData)?.id).toBe('maceta');
    expect(state.casa).toBe(1);
    expect(currentObject(state, gameData).id).toBe('maceta');
    expect(nextHome(state, gameData)?.id).toBe('mansion');
  });

  it('sin vencer a la Escoba no se pasa del refri aunque el Canal ya alcance', () => {
    const state = atRefri();
    famous(state);
    state.jefes.derrotados = [];
    expect(gateAt(state, gameData)).toBe('jefe');
    expect(advanceLevel(state, gameData)).toBe(null);
  });

  it('a la mansión solo se muda tras vencer al Pepino Gigante', () => {
    const state = atRefri();
    state.casa = 1;
    irA(state, 'coche');
    state.progreso.roturas = levelMeta(state, gameData);
    const req = gameData.homes[2]!.requisito!;
    state.canal.seguidores = req.seguidores;
    state.canal.visualizacionesTotales = req.visualizaciones;
    expect(req.jefe).toBe('pepino');
    expect(moveUnlocked(state, gameData)).toBe(false);
    state.jefes.derrotados.push('pepino');
    expect(moveUnlocked(state, gameData)).toBe(true);
    expect(advanceLevel(state, gameData)?.id).toBe('jarron');
    expect(state.casa).toBe(2);
    expect(nextHome(state, gameData)?.id).toBe('luna');
    // A la Luna, tras vencer a la Aspiradora Industrial.
    const luna = gameData.homes[3]!.requisito!;
    expect(luna.jefe).toBe('industrial');
    state.canal.seguidores = luna.seguidores;
    state.canal.visualizacionesTotales = luna.visualizaciones;
    expect(moveUnlocked(state, gameData)).toBe(false);
    state.jefes.derrotados.push('industrial');
    expect(moveUnlocked(state, gameData)).toBe(true);
  });

  it('un guardado que ya pasó el refri con la mudanza abierta se muda al cargar', () => {
    const state = atRefri();
    famous(state);
    irA(state, REFRI + 1);
    expect(moveIfReady(state, gameData)?.id).toBe('casa');
    expect(state.casa).toBe(1);
    expect(homeStartIndex(gameData, 1)).toBe(REFRI + 1);
  });

  it('ya mudado, cada video empieza en la casa con el gato entrenado', () => {
    const state = atRefri();
    famous(state);
    advanceLevel(state, gameData);
    irA(state, REFRI + 3);
    state.dineroPartida = num(1e12);
    expect(uploadVideo(state, gameData, 0, () => 0.5)).not.toBe(null);
    expect(currentObject(state, gameData).id).toBe('maceta');
    expect(state.nivelFuerza).toBe(casa.fuerzaInicial);
    expect(state.casa).toBe(1);
  });

  it('antes de mudarse, el video regresa al vaso aunque ya se haya desbloqueado la casa', () => {
    const state = atRefri();
    state.dineroPartida = num(1e12);
    famous(state);
    uploadVideo(state, gameData, 0, () => 0.5);
    expect(currentObject(state, gameData).id).toBe('vaso');
    expect(state.nivelFuerza).toBe(0);
  });

  it('la casa se guarda', () => {
    const state = atRefri();
    famous(state);
    advanceLevel(state, gameData);
    const loaded = deserialize(serialize(state, 0), 0);
    expect(loaded.ok && loaded.state.casa).toBe(1);
  });
});
