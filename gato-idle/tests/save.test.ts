import { afterEach, describe, expect, it } from 'vitest';
import { Decimal, ZERO } from '../src/core/num';
import { deserialize, fromExportCode, MIGRATIONS, SAVE_VERSION, serialize, toExportCode } from '../src/core/save';
import { createInitialState } from '../src/core/state';

const NOW = 1_800_000_000_000;

function load(text: string) {
  const result = deserialize(text, NOW);
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe('guardado', () => {
  afterEach(() => {
    delete MIGRATIONS[0];
  });

  it('ida y vuelta conserva números enormes y ajustes', () => {
    const state = createInitialState(NOW);
    state.dinero = new Decimal('1.5e3000');
    state.danioObjeto = new Decimal(3);
    state.objetoActual = 2;
    state.stats.toques = 42;
    state.ajustes.notacion = 'cientifica';
    state.ajustes.idioma = 'en';

    const result = load(serialize(state, NOW + 5));

    expect(result.savedAt).toBe(NOW + 5);
    expect(result.version).toBe(SAVE_VERSION);
    expect(result.state.dinero.eq(new Decimal('1.5e3000'))).toBe(true);
    expect(result.state.danioObjeto.eq(3)).toBe(true);
    expect(result.state.objetoActual).toBe(2);
    expect(result.state.stats.toques).toBe(42);
    expect(result.state.ajustes).toEqual(state.ajustes);
  });

  it('un guardado viejo recibe los campos nuevos con su valor inicial', () => {
    const text = JSON.stringify({ v: SAVE_VERSION, t: NOW, s: { dinero: { $d: '250' } } });
    const { state } = load(text);
    expect(state.dinero.eq(250)).toBe(true);
    expect(state.stats).toEqual({ toques: 0, roturas: 0 });
    expect(state.ajustes.vibracion).toBe(true);
  });

  it('descarta valores con el tipo equivocado', () => {
    const text = JSON.stringify({ v: SAVE_VERSION, t: NOW, s: { dinero: 'mucho', objetoActual: 'dos', ajustes: { sonido: 1 } } });
    const { state } = load(text);
    expect(state.dinero.eq(ZERO)).toBe(true);
    expect(state.objetoActual).toBe(0);
    expect(state.ajustes.sonido).toBe(true);
  });

  it('rechaza texto que no es un guardado', () => {
    expect(deserialize('{no es json', NOW).ok).toBe(false);
    expect(deserialize('{"hola": 1}', NOW).ok).toBe(false);
  });

  it('aplica las migraciones en orden', () => {
    // Ejemplo: la versión 0 llamaba "plata" al dinero.
    MIGRATIONS[0] = (s) => ({ dinero: new Decimal(Number(s.plata)) });
    const text = JSON.stringify({ v: 0, t: NOW, s: { plata: 7 } });
    expect(load(text).state.dinero.eq(7)).toBe(true);
  });

  it('falla si falta una migración', () => {
    const result = deserialize(JSON.stringify({ v: 0, t: NOW, s: {} }), NOW);
    expect(result.ok).toBe(false);
  });

  it('el código de exportación sobrevive acentos y emojis', () => {
    const text = '{"nombre":"Michi ñoño 🐱"}';
    expect(fromExportCode(toExportCode(text))).toBe(text);
    expect(fromExportCode('%%%')).toBeNull();
  });
});
