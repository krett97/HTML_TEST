import type { Notation } from './format';
import { ZERO, type Decimal } from './num';

export type Locale = 'es' | 'en';

export interface Settings {
  sonido: boolean;
  musica: boolean;
  vibracion: boolean;
  notacion: Notation;
  /** null = usar el idioma del dispositivo. */
  idioma: Locale | null;
}

/**
 * Todo lo que se guarda de una partida. Solo datos planos y Decimal: nada de funciones ni
 * referencias a Phaser o al DOM. Si agregas un campo, dale valor en createInitialState y las
 * partidas viejas lo recibirán al cargar (ver mergeDefaults en save.ts).
 */
export interface GameState {
  dinero: Decimal;
  /** Dinero ganado en la partida actual; define los seguidores al mudarse (fase 4). */
  dineroPartida: Decimal;
  nivelFuerza: number;
  /** Cada `nivelesPorObjeto` niveles el dueño compra el siguiente objeto (ver economy.ts). */
  nivelValor: number;
  /** Ids de herramientas compradas, en el orden de tools.json. */
  herramientas: string[];
  /** Daño acumulado sobre el objeto actual. */
  danioObjeto: Decimal;
  stats: {
    toques: number;
    roturas: number;
  };
  ajustes: Settings;
  /** Momento del último guardado (ms). Sirve para las ganancias offline (fase 3). */
  ultimaVez: number;
  creadoEn: number;
}

export function createInitialState(now: number): GameState {
  return {
    dinero: ZERO,
    dineroPartida: ZERO,
    nivelFuerza: 0,
    nivelValor: 0,
    herramientas: [],
    danioObjeto: ZERO,
    stats: { toques: 0, roturas: 0 },
    ajustes: {
      sonido: true,
      musica: true,
      vibracion: true,
      notacion: 'letras',
      idioma: null,
    },
    ultimaVez: now,
    creadoEn: now,
  };
}
