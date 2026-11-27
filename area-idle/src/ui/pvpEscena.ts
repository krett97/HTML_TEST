// Dónde va cada cosa en el campo de batalla del PvP (en píxeles, dentro del campo): tu castillo abajo
// (muralla con arqueros y la torre con el mago a la izquierda, como en el juego) y el del rival arriba
// (su muralla volteada y su torre a la derecha). Lo usan el dibujo del castillo y los disparos.
import type { Ejercito } from '../core/pvp';

export type Lado = 'abajo' | 'arriba';

export interface Puesto {
  x: number;
  /** Dónde pisa (los dibujos se paran ahí). */
  y: number;
  /** Alto del dibujo. */
  h: number;
}

export interface Puestos {
  arqueros: Puesto[];
  mago: Puesto | null;
  torre: { x: number; y: number; w: number; h: number };
  /** La franja de la muralla (arriba y alto). */
  muro: { y: number; h: number };
  /** Dónde caen los golpes que recibe este castillo. */
  blanco: { x0: number; x1: number; y: number };
}

/** `W`×`F`: el campo; `B`: alto de la franja del castillo. */
export function puestos(e: Ejercito, lado: Lado, W: number, F: number, B: number): Puestos {
  const muroH = 0.38 * B;
  const torreH = 0.72 * B;
  const torreW = torreH * (384 / 640);
  const arqueroH = 0.3 * B;
  const magoH = 0.36 * B;
  const n = e.arqueros;
  if (lado === 'abajo') {
    const desde = torreW + 10;
    const hasta = W - 16;
    return {
      arqueros: Array.from({ length: n }, (_, i) => ({ x: desde + ((i + 0.5) / n) * (hasta - desde), y: F - 0.3 * B, h: arqueroH })),
      mago: e.mago ? { x: torreW * 0.48, y: F - 0.64 * B, h: magoH } : null,
      torre: { x: 0, y: F - torreH, w: torreW, h: torreH },
      muro: { y: F - muroH, h: muroH },
      blanco: { x0: W * 0.12, x1: W * 0.88, y: F - muroH * 0.55 },
    };
  }
  const desde = 16;
  const hasta = W - torreW - 10;
  return {
    arqueros: Array.from({ length: n }, (_, i) => ({ x: desde + ((i + 0.5) / n) * (hasta - desde), y: 0.62 * B, h: arqueroH })),
    mago: e.mago ? { x: W - torreW * 0.48, y: 0.98 * B, h: magoH } : null,
    torre: { x: W - torreW, y: 0, w: torreW, h: torreH },
    muro: { y: 0, h: muroH },
    blanco: { x0: W * 0.12, x1: W * 0.88, y: muroH * 0.55 },
  };
}

/** El dibujo según su etapa de equipo: `arquero`, `arquero_1`… */
export const conEtapa = (base: string, etapa: number): string => (etapa > 0 ? `${base}_${etapa}` : base);

/** El suelo del campo según la zona. */
export const SUELO: Record<string, string> = { campo: 'pasto', batalla: 'pasto', pradera: 'pasto_amarillo', desierto: 'arena', montana: 'roca_suelo' };
