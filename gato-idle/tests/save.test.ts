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
    state.nivelValor = 12;
    state.nivelCritico = 7;
    state.stats.toques = 42;
    state.ajustes.notacion = 'cientifica';
    state.ajustes.idioma = 'en';

    const result = load(serialize(state, NOW + 5));

    expect(result.savedAt).toBe(NOW + 5);
    expect(result.version).toBe(SAVE_VERSION);
    expect(result.state.dinero.eq(new Decimal('1.5e3000'))).toBe(true);
    expect(result.state.danioObjeto.eq(3)).toBe(true);
    expect(result.state.nivelValor).toBe(12);
    expect(result.state.nivelCritico).toBe(7);
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
    const text = JSON.stringify({ v: SAVE_VERSION, t: NOW, s: { dinero: 'mucho', nivelValor: 'dos', ajustes: { sonido: 1 } } });
    const { state } = load(text);
    expect(state.dinero.eq(ZERO)).toBe(true);
    expect(state.nivelValor).toBe(0);
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

  it('v1 → v2: conserva el objeto en el que iba el jugador', () => {
    // 0.2.0: nivel de Valor 34 = sofá (índice 3 de la lista vieja), 4 niveles adentro.
    // En la lista nueva el sofá es el índice 10 y hay la mitad de niveles por objeto.
    const v020 = JSON.stringify({ v: 1, t: NOW, s: { nivelValor: 34, herramientas: ['garras'] } });
    expect(load(v020).state.nivelValor).toBe(10 * 5 + 2);
    // 0.0.1: solo había índice de objeto.
    const v001 = JSON.stringify({ v: 1, t: NOW, s: { objetoActual: 0, dinero: { $d: '12' } } });
    const old = load(v001).state;
    expect(old.nivelValor).toBe(0);
    expect(old.dinero.eq(12)).toBe(true);
  });

  it('v2 → v3: devuelve lo que costaron las herramientas compradas', () => {
    const v2 = JSON.stringify({ v: 2, t: NOW, s: { nivelValor: 70, herramientas: ['pata', 'garras', 'carrito'], dinero: { $d: '100' } } });
    const state = load(v2).state;
    expect(state.dinero.eq(100 + 900 + 30_000)).toBe(true);
    expect(state.nivelValor).toBe(70);
    expect('herramientas' in state).toBe(false);
  });

  it('v3 → v4: los Lentes de jefe pasan a ser el Saco de jefe', () => {
    const v3 = JSON.stringify({ v: 3, t: NOW, s: { nivelLentes: 6, desbloqueos: ['fuerza', 'lentes'] } });
    const state = load(v3).state;
    expect(state.nivelSaco).toBe(6);
    expect(state.desbloqueos).toEqual(['fuerza', 'saco']);
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
