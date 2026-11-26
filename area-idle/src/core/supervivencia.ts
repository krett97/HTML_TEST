// Supervivencia (desde el nivel 26): oleadas cada vez más difíciles hasta que cae la muralla. Cada oleada
// aguantada suma Runas (con las que se mejora el equipo en la Herrería). Hay 3 entradas; una vuelve cada 8 h.
import { SUPERVIVENCIA_DESDE } from './datos';

export const ENTRADAS_MAX = 3;
export const RECARGA_ENTRADA_MS = 8 * 3600_000;

export interface SupervivenciaState {
  entradas: number;
  /** Desde cuándo corre la recarga de la siguiente entrada. */
  desde: number;
  /** Más oleadas aguantadas en una partida. */
  record: number;
  partidas: number;
}

export const emptySupervivencia = (): SupervivenciaState => ({ entradas: ENTRADAS_MAX, desde: 0, record: 0, partidas: 0 });
export const survivalUnlocked = (m: { nivel: number }): boolean => m.nivel >= SUPERVIVENCIA_DESDE;

/** Recupera las entradas que tocan (mientras estás lleno no corre el reloj). */
export function refillEntradas(s: SupervivenciaState, ahora: number): void {
  if (s.entradas >= ENTRADAS_MAX || ahora < s.desde) {
    s.desde = ahora;
    return;
  }
  const n = Math.floor((ahora - s.desde) / RECARGA_ENTRADA_MS);
  if (n <= 0) return;
  s.entradas = Math.min(ENTRADAS_MAX, s.entradas + n);
  s.desde = s.entradas >= ENTRADAS_MAX ? ahora : s.desde + n * RECARGA_ENTRADA_MS;
}

export const msHastaEntrada = (s: SupervivenciaState, ahora: number): number => (s.entradas >= ENTRADAS_MAX ? 0 : Math.max(0, RECARGA_ENTRADA_MS - (ahora - s.desde)));

/** Gasta una entrada (false si no hay). */
export function usarEntrada(s: SupervivenciaState, ahora: number): boolean {
  refillEntradas(s, ahora);
  if (s.entradas < 1) return false;
  if (s.entradas >= ENTRADAS_MAX) s.desde = ahora;
  s.entradas--;
  return true;
}

/** Desde qué nivel empiezan las oleadas: 10 abajo del más alto que has abierto (las primeras son fáciles). */
export const nivelBaseOlas = (nivel: number): number => Math.max(1, nivel - 10);

export function loadSupervivencia(raw: unknown): SupervivenciaState {
  const s = emptySupervivencia();
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Partial<SupervivenciaState>;
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);
  return {
    entradas: Math.min(ENTRADAS_MAX, Math.floor(n(r.entradas, ENTRADAS_MAX))),
    desde: n(r.desde, 0),
    record: Math.floor(n(r.record, 0)),
    partidas: Math.floor(n(r.partidas, 0)),
  };
}
