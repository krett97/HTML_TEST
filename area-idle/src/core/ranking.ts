// Ranking: se abre al llegar al nivel 17 (RANKING_DESDE). Cada jugador aparece con su nombre y el nivel
// más alto al que ha llegado; si empatan, va primero el que ha reventado más enemigos.
import { RANKING_DESDE } from './datos';

/** Largo máximo del nombre. */
export const MAX_NAME = 16;
/** Un nivel más alto que esto no es creíble (filas dañadas o hechas a mano en el ranking compartido). */
export const NIVEL_MAX = 100_000;

export interface RankingEntry {
  nombre: string;
  nivel: number;
  reventados: number;
}

export interface RankingRow extends RankingEntry {
  id: string;
  tuyo: boolean;
}

export const rankingUnlocked = (m: { nivel: number }): boolean => m.nivel >= RANKING_DESDE;

/** Limpia un nombre escrito por el jugador (o por otro, si viene del ranking compartido). */
export function cleanName(name: unknown): string {
  return typeof name === 'string' ? name.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) : '';
}

/** Tu fila: nombre, nivel más alto y reventados de por vida. */
export function rankingEntry(m: { nombre: string; nivel: number; reventados: number }): RankingEntry {
  return { nombre: cleanName(m.nombre), nivel: m.nivel, reventados: Math.floor(m.reventados) };
}

/** Revisa una fila que llegó de otro jugador: si no tiene sentido, se descarta. */
export function readRow(id: string, data: Record<string, unknown> | undefined, mio: string | null): RankingRow | null {
  if (!data) return null;
  const nivel = Number(data.nivel);
  const reventados = Number(data.reventados);
  if (!Number.isInteger(nivel) || nivel < RANKING_DESDE || nivel > NIVEL_MAX) return null;
  return { id, nombre: cleanName(data.nombre), nivel, reventados: Number.isFinite(reventados) && reventados > 0 ? Math.floor(reventados) : 0, tuyo: id === mio };
}

/** Orden del ranking: más nivel primero; si empatan, más reventados. */
export function sortRows<T extends RankingEntry>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.nivel - a.nivel || b.reventados - a.reventados);
}
