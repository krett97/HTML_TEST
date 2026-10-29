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
  /** Cuántos niveles compra cada botón de Mejoras y Aliados (selector ×1 / ×10). */
  compra: number;
}

/** Trucos del modo pruebas (solo para desarrollo; ver src/core/pruebas.ts). */
export interface Pruebas {
  /** Las compras no cuestan. */
  dineroInfinito: boolean;
  /** Multiplica el daño del manotazo (1 = normal). */
  multDanio: number;
  /** Cada manotazo tira el objeto. */
  danioInfinito: boolean;
}

export function pruebasIniciales(): Pruebas {
  return { dineroInfinito: false, multDanio: 1, danioInfinito: false };
}

/** Un video que subió el dueño (el título se arma con los textos del idioma: plantilla + objeto). */
export interface VideoRecord {
  plantilla: number;
  /** El objeto más caro al que llegó la partida. */
  objeto: string;
  roturas: number;
  seguidores: number;
  visualizaciones: Decimal;
  viral: boolean;
  fecha: number;
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
  /** Niveles de "Prob. de crítico" y "Daño crítico" (ver economy.ts). */
  nivelCritico: number;
  nivelDanioCritico: number;
  /** Nivel de "Saco de jefe" (más daño para todos los aliados). */
  nivelSaco: number;
  /** Nivel de "Garras marcadoras" y hasta cuándo dura la marca del último crítico (ms de reloj). */
  nivelMarca: number;
  marcaHasta: number;
  /** Nivel de cada aliado comprado (los que no aparecen están en 0). */
  aliados: { id: string; nivel: number }[];
  /** Descubrimientos ya conseguidos (ids de unlocks.json), en orden. */
  desbloqueos: string[];
  laboratorio: {
    /** Investigaciones terminadas. */
    hechas: string[];
    /** La que está en curso y cuándo termina (ms de reloj, sigue con el juego cerrado). */
    actual: { id: string; fin: number } | null;
  };
  /** Daño acumulado sobre el objeto actual. */
  danioObjeto: Decimal;
  /** Casa a la que ya se mudó el dueño (índice de casas.json; 0 = departamento). Sobrevive al subir el video. */
  casa: number;
  /** Jefes derrotados (sus trofeos duran para siempre) y desde cuándo se puede pedir la revancha (ms de reloj). */
  jefes: { derrotados: string[]; revancha: number };
  stats: {
    toques: number;
    roturas: number;
    /** Roturas de la partida actual (el video en grabación). */
    roturasPartida: number;
    /** Vistas del video en grabación: cada rotura suma según el tamaño del objeto (vaso 1 … refri 27). */
    vistasVideo: number;
  };
  /** El canal del dueño: lo que sobrevive al subir el video. */
  canal: {
    /** Seguidores y visualizaciones son totales que solo crecen: las Habilidades se desbloquean con ellos. */
    seguidores: number;
    visualizaciones: Decimal;
    /** Los más recientes primero. */
    videos: VideoRecord[];
  };
  /** Ganancias de mientras no estabas, esperando a que el jugador las cobre (ventana de bienvenida). */
  offline: { segundos: number; ausente: number; tope: boolean; roturas: number; dinero: Decimal } | null;
  /** Lo que ya se presentó con viñeta de cómic ("objeto:plato", "aliado:perro", "aspecto:garras"): solo la primera vez. */
  vistos: string[];
  /** Habilidades del Canal compradas (se conservan al subir el video). */
  habilidades: { id: string; nivel: number }[];
  ajustes: Settings;
  pruebas: Pruebas;
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
    nivelCritico: 0,
    nivelDanioCritico: 0,
    nivelSaco: 0,
    nivelMarca: 0,
    marcaHasta: 0,
    aliados: [],
    desbloqueos: [],
    laboratorio: { hechas: [], actual: null },
    danioObjeto: ZERO,
    casa: 0,
    jefes: { derrotados: [], revancha: 0 },
    stats: { toques: 0, roturas: 0, roturasPartida: 0, vistasVideo: 0 },
    canal: { seguidores: 0, visualizaciones: ZERO, videos: [] },
    habilidades: [],
    vistos: [],
    offline: null,
    ajustes: {
      sonido: true,
      musica: true,
      vibracion: true,
      notacion: 'letras',
      idioma: null,
      compra: 1,
    },
    pruebas: pruebasIniciales(),
    ultimaVez: now,
    creadoEn: now,
  };
}
