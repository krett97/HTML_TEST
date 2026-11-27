// Oro por ver un anuncio (desde el nivel 3): un botón en la pantalla principal que da lo que ganas en
// unos minutos jugando. Uno cada 10 min y como mucho 6 al día (el día cambia a medianoche, hora local).
// También, al volver, el oro de app cerrada se puede cobrar ×2 viendo un anuncio (no cuenta para el tope).
import { AUTO_ANUNCIO } from './datos';
import { activeGoldPerMinute } from './inactivo';
import type { Meta } from './meta';
import { dayKey } from './misiones';

export const ANUNCIO = {
  /** Nivel desde el que sale el botón. */
  desde: 3,
  /** Minutos de lo que ganas jugando que da cada anuncio. */
  minutos: 5,
  /** Espera entre uno y otro. */
  esperaMs: 10 * 60_000,
  /** Cuántos al día. */
  porDia: 6,
  /** Lo menos que da (al principio, cuando aún se gana poco). */
  minimo: 25,
} as const;

export interface AnunciosState {
  /** Día (aaaa-mm-dd local) de la cuenta de `vistos`. */
  dia: string;
  vistos: number;
  /** Cuándo se vio el último (para la espera). */
  ultimo: number;
}

export const emptyAnuncios = (): AnunciosState => ({ dia: '', vistos: 0, ultimo: 0 });

/** El oro que da un anuncio ahora. */
export const adGold = (meta: Meta): number => Math.max(ANUNCIO.minimo, Math.round(ANUNCIO.minutos * activeGoldPerMinute(meta)));

export interface EstadoAnuncio {
  abierto: boolean;
  /** Los que quedan hoy. */
  quedan: number;
  /** Milisegundos para poder ver el siguiente (0: ya). */
  espera: number;
  oro: number;
}

export function adStatus(meta: Meta, ahora: number): EstadoAnuncio {
  const a = meta.anuncios;
  const vistos = a.dia === dayKey(ahora) ? a.vistos : 0;
  // Si el reloj va para atrás, no se queda esperando para siempre.
  const espera = ahora < a.ultimo ? 0 : Math.max(0, a.ultimo + ANUNCIO.esperaMs - ahora);
  return { abierto: meta.nivel >= ANUNCIO.desde, quedan: Math.max(0, ANUNCIO.porDia - vistos), espera, oro: adGold(meta) };
}

export const canWatchAd = (meta: Meta, ahora: number): boolean => {
  const s = adStatus(meta, ahora);
  return s.abierto && s.quedan > 0 && s.espera === 0;
};

/** Se vio el anuncio completo: cuenta, da el oro y lo devuelve (0 si no tocaba). */
export function claimAdGold(meta: Meta, ahora: number): number {
  if (!canWatchAd(meta, ahora)) return 0;
  const hoy = dayKey(ahora);
  const oro = adGold(meta);
  meta.anuncios = { dia: hoy, vistos: (meta.anuncios.dia === hoy ? meta.anuncios.vistos : 0) + 1, ultimo: ahora };
  meta.oro += oro;
  return oro;
}

/** Tolera guardados viejos o dañados. */
export function loadAnuncios(raw: unknown): AnunciosState {
  if (!raw || typeof raw !== 'object') return emptyAnuncios();
  const r = raw as Partial<AnunciosState>;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  return { dia: typeof r.dia === 'string' ? r.dia : '', vistos: Math.floor(n(r.vistos)), ultimo: n(r.ultimo) };
}

// ---- Autoapuntado por anuncio: media hora (de reloj) con tu círculo yendo solo y rápido ----

/** Milisegundos que le quedan al autoapuntado del anuncio (0: no está andando). */
export const autoBoostLeft = (meta: Meta, ahora: number): number => Math.max(0, Math.min(meta.autoHasta - ahora, AUTO_ANUNCIO.minutos * 60_000));

/** Se vio el anuncio: la media hora empieza (o vuelve a empezar) desde ahora. Se abre con el oro por anuncio. */
export function claimAutoBoost(meta: Meta, ahora: number): boolean {
  if (meta.nivel < ANUNCIO.desde) return false;
  meta.autoHasta = ahora + AUTO_ANUNCIO.minutos * 60_000;
  return true;
}
