// Datos del juego: los enemigos de la zona y los tres árboles de talentos (jugador, mago y arqueros).
// Los `id` no se renombran nunca (el guardado depende de ellos).

/** Tipos de daño. Por ahora hay físico (tus flechas y los arqueros) y fuego (el mago); los demás llegan después. */
export type DamageType = 'fisico' | 'fuego' | 'hielo' | 'energia' | 'muerte' | 'luz';
export const DAMAGE_TYPES: DamageType[] = ['fisico', 'fuego', 'hielo', 'energia', 'muerte', 'luz'];
export const DAMAGE_TYPES_EN_JUEGO: DamageType[] = ['fisico', 'fuego'];
/** Cuánto reciben los enemigos del tipo al que son débiles y del que son fuertes. */
export const EFFECTIVENESS = { debil: 1.5, fuerte: 0.5 } as const;

export type EnemyKind = 'verde' | 'azul' | 'rojo' | 'rey';

export interface EnemyDef {
  id: EnemyKind;
  vida: number;
  oro: number;
  /** Radio en unidades del campo (el campo mide 360 de ancho). */
  radio: number;
  /** Unidades por segundo al pasear. */
  velocidad: number;
  /** Daño de cada piedra que le tira a la muralla (0: no ataca) y cada cuántos segundos tira. */
  ataque: number;
  tiro?: number;
  /** Tipos de daño que le hacen más (×1.5) y menos (×0.5). */
  debil: DamageType[];
  fuerte: DamageType[];
  /** Es jefe: su vida se calcula por nivel (ver levelConfig) y se gana al vencerlo. */
  jefe?: boolean;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  // Pegajoso y feliz: el fuego lo derrite.
  verde: { id: 'verde', vida: 3, oro: 1, radio: 9, velocidad: 9, ataque: 0, debil: ['fuego'], fuerte: [] },
  // De agua y con casco: el fuego casi no le hace; el hielo y la energía, mucho.
  azul: { id: 'azul', vida: 14, oro: 6, radio: 11, velocidad: 6, ataque: 0, debil: ['hielo', 'energia'], fuerte: ['fuego'] },
  // Con resortera: le tira piedras a la muralla. Sin casco y nervioso: las flechas le duelen.
  // El primer jefe (nivel 10): naranja, gigante, con corona. Invoca slimes, brinca, esquiva y le tira baba a la muralla.
  rey: { id: 'rey', vida: 0, oro: 0, radio: 30, velocidad: 4, ataque: 0, debil: ['fuego'], fuerte: [], jefe: true },
  rojo: { id: 'rojo', vida: 8, oro: 4, radio: 10, velocidad: 8, ataque: 3, tiro: 3, debil: ['fisico', 'luz'], fuerte: ['muerte'] },
};
export const ENEMY_KINDS = Object.keys(ENEMIES) as EnemyKind[];

/** Cuánto daño recibe un enemigo de un tipo (1, o más si es débil, o menos si es fuerte). */
export function effectiveness(kind: EnemyKind, tipo: DamageType): 'debil' | 'fuerte' | null {
  const def = ENEMIES[kind];
  if (def.debil.includes(tipo)) return 'debil';
  if (def.fuerte.includes(tipo)) return 'fuerte';
  return null;
}
export function damageMultiplier(kind: EnemyKind, tipo: DamageType): number {
  const e = effectiveness(kind, tipo);
  return e ? EFFECTIVENESS[e] : 1;
}

/** Lo que vale cada estadística sin talentos. */
export const BASE = {
  danio: 1,
  radio: 30,
  intervalo: 0.6,
  duracion: 20,
  /** Multiplica la rapidez con que llegan los slimes del nivel (el talento "Atraer slimes" la sube). */
  ritmo: 1,
  /** El mago: una explosión de fuego cuadrada (`lado` × `lado`) cada `intervalo` s, con `danio` veces tu daño. */
  mago: { intervalo: 2.2, lado: 40, danio: 1.5 },
  /** El suelo que deja ardiendo el mago: dura `duracion` s y quema `dps` veces tu daño por segundo. */
  fuego: { duracion: 1.6, dps: 0.6 },
  /** La muralla (donde están el mago y los arqueros): si los rojos la tiran, ellos ya no atacan en ese nivel. */
  muro: { vida: 100 },
  /** Cada arquero: una flecha a cada uno de sus `objetivos` cada `intervalo` s, con `danio` veces tu daño. */
  arqueros: { intervalo: 1.2, objetivos: 1, danio: 2 },
} as const;

/**
 * Los niveles: cada uno trae una cantidad fija de slimes y hay que reventarlos todos antes de que se
 * acabe el tiempo. Una parte sale al empezar y el resto llega en los siguientes `llegada` segundos.
 * Si se acaba el tiempo, el nivel se pierde (el oro juntado se queda) y se puede reintentar o jugar
 * el anterior para juntar oro.
 */
export interface LevelConfig {
  nivel: number;
  total: number;
  /** Multiplican la vida y el oro de cada slime. */
  vida: number;
  oro: number;
  /** Fracción de los slimes que son azules y rojos, y cuánto pegan las piedras de los rojos. */
  azules: number;
  rojos: number;
  ataque: number;
  /** Oro extra por superar el nivel. */
  premio: number;
  /** En los niveles de jefe (cada 10): quién es y cuánta vida tiene. */
  jefe: { kind: EnemyKind; vida: number } | null;
}

/**
 * Jefes: cada 10 niveles (el primero, el Rey Slime, en el nivel 10). Su vida es la de todos los slimes
 * de un nivel normal ×`vida`. Cada `invoca` s llama a `escolta` slimes a su alrededor; cada `brinco` s
 * salta a otro lado y, al caer, queda **aturdido** `aturdido` s recibiendo ×`aturdidoMult`; cada `lanza` s
 * le tira una bola de baba a la muralla (`golpe` de daño). Mientras tu círculo esté cerca, **camina para
 * esquivarlo** (`esquiva`), salvo aturdido. A media vida se **enfurece**: todo más seguido
 * (los tiempos ×`furia`) y una escolta más. El nivel dura `extra` s más y el premio es ×`premio`.
 */
export const JEFE = {
  cada: 10,
  vida: 6,
  invoca: 3,
  escolta: 3,
  brinco: 5,
  aturdido: 1.5,
  aturdidoMult: 2,
  lanza: 4,
  golpe: 10,
  /** Camina para salirse de tu círculo (unidades por segundo) cuando lo tiene a menos de `alerta` de su orilla. */
  esquiva: 22,
  alerta: 25,
  furia: 0.65,
  extra: 10,
  premio: 5,
  inicial: 6,
} as const;
export const isBossLevel = (nivel: number): boolean => nivel % JEFE.cada === 0;
/** Desde qué nivel salen los slimes azules y los rojos (con resortera). */
export const AZUL_DESDE = 4;
export const ROJO_DESDE = 5;
export const PRIMERA_OLA = 0.3;
export const LLEGADA = 8;
/** Lo más que puede haber vivos a la vez (por rendimiento; el resto espera su turno). */
export const MAX_VIVOS = 450;

export function levelConfig(nivel: number): LevelConfig {
  const n = Math.max(1, Math.floor(nivel));
  return {
    nivel: n,
    total: 15 + 8 * (n - 1),
    vida: Math.pow(1.3, n - 1),
    oro: Math.pow(1.05, n - 1),
    azules: n < AZUL_DESDE ? 0 : Math.min(0.5, 0.1 + 0.05 * (n - AZUL_DESDE)),
    rojos: n < ROJO_DESDE ? 0 : Math.min(0.12, 0.06 + 0.01 * (n - ROJO_DESDE)),
    ataque: Math.pow(1.05, Math.max(0, n - ROJO_DESDE)),
    premio: Math.round(8 * Math.pow(1.12, n - 1) * (isBossLevel(n) ? JEFE.premio : 1)),
    jefe: isBossLevel(n) ? { kind: 'rey', vida: Math.round(3 * (15 + 8 * (n - 1)) * Math.pow(1.3, n - 1) * JEFE.vida) } : null,
  };
}

/**
 * Oro mientras no juegas: se abre al llegar al nivel 3. Da una parte (`eficiencia`) de lo que se gana
 * por minuto jugando el nivel más alto superado, hasta `horas` horas. Los talentos Oro inactivo y Bolsa
 * grande suben la parte y las horas. Menos de un minuto fuera no cuenta.
 */
export const INACTIVO = { desde: 3, eficiencia: 0.15, porNivel: 0.1, horas: 2, horasPorNivel: 1, minSegundos: 60, segundosPorNivelJugado: 30 } as const;

export type Seccion = 'jugador' | 'mago' | 'arqueros';
export const SECCIONES: Seccion[] = ['jugador', 'mago', 'arqueros'];

export type TalentId =
  // Jugador
  | 'danio'
  | 'radio'
  | 'cadencia'
  | 'tiempo'
  | 'slimes'
  | 'oro'
  | 'botin'
  | 'inactivo'
  | 'bolsa'
  // Mago
  | 'mago'
  | 'magoRapido'
  | 'magoArea'
  | 'magoDanio'
  | 'fuego'
  | 'fuegoFuerte'
  // Arqueros
  | 'arqueros'
  | 'masArqueros'
  | 'multiflecha'
  | 'arcoRapido'
  | 'arcoDanio'
  | 'muralla';

export interface TalentDef {
  id: TalentId;
  seccion: Seccion;
  /** Ícono (src/assets/arte/iconos/<icono>.png). */
  icono: string;
  max: number;
  costo: { base: number; crece: number };
  /** Talento que hace falta (con al menos ese nivel) para abrir este; puede ser de otra sección. */
  requiere: { id: TalentId; nivel: number } | null;
  /** La raíz de una sección: se ve siempre (con candado mientras falte su requisito). */
  raiz?: boolean;
  /** Nivel del juego que hay que haber alcanzado para comprarlo (además del requisito). */
  nivelMin?: number;
  /** Lugar en su árbol: columna (−2…2) y fila (0 arriba). */
  pos: [number, number];
}

export const TALENTS: TalentDef[] = [
  // ---- Jugador: tu área, donde caen las flechas ----
  { id: 'danio', seccion: 'jugador', icono: 'danio', max: 40, costo: { base: 4, crece: 1.4 }, requiere: null, raiz: true, pos: [0, 0] },
  { id: 'radio', seccion: 'jugador', icono: 'radio', max: 10, costo: { base: 8, crece: 2 }, requiere: { id: 'danio', nivel: 1 }, pos: [-1, 1] },
  { id: 'slimes', seccion: 'jugador', icono: 'slimes', max: 10, costo: { base: 6, crece: 1.9 }, requiere: { id: 'danio', nivel: 1 }, pos: [0, 1] },
  { id: 'cadencia', seccion: 'jugador', icono: 'cadencia', max: 10, costo: { base: 8, crece: 2 }, requiere: { id: 'danio', nivel: 1 }, pos: [1, 1] },
  { id: 'tiempo', seccion: 'jugador', icono: 'tiempo', max: 10, costo: { base: 12, crece: 2.1 }, requiere: { id: 'radio', nivel: 2 }, pos: [-1, 2] },
  { id: 'botin', seccion: 'jugador', icono: 'botin', max: 15, costo: { base: 20, crece: 1.8 }, requiere: { id: 'slimes', nivel: 2 }, pos: [0, 2] },
  { id: 'oro', seccion: 'jugador', icono: 'oro', max: 15, costo: { base: 15, crece: 1.9 }, requiere: { id: 'slimes', nivel: 2 }, pos: [1, 2] },
  // Oro mientras no juegas (se abre solo al llegar al nivel 3; estos lo mejoran).
  { id: 'inactivo', seccion: 'jugador', icono: 'inactivo', max: 7, costo: { base: 40, crece: 2.2 }, requiere: { id: 'oro', nivel: 1 }, nivelMin: 3, pos: [1, 3] },
  { id: 'bolsa', seccion: 'jugador', icono: 'bolsa', max: 10, costo: { base: 60, crece: 2 }, requiere: { id: 'inactivo', nivel: 1 }, pos: [2, 3] },

  // ---- Mago: rectángulos de fuego ----
  { id: 'mago', seccion: 'mago', icono: 'mago', max: 1, costo: { base: 200, crece: 1 }, requiere: { id: 'cadencia', nivel: 3 }, raiz: true, pos: [0, 0] },
  { id: 'magoRapido', seccion: 'mago', icono: 'magoRapido', max: 10, costo: { base: 45, crece: 2 }, requiere: { id: 'mago', nivel: 1 }, pos: [-1, 1] },
  { id: 'magoDanio', seccion: 'mago', icono: 'magoDanio', max: 15, costo: { base: 60, crece: 1.8 }, requiere: { id: 'mago', nivel: 1 }, pos: [0, 1] },
  { id: 'magoArea', seccion: 'mago', icono: 'magoArea', max: 10, costo: { base: 45, crece: 2 }, requiere: { id: 'mago', nivel: 1 }, pos: [1, 1] },
  { id: 'fuego', seccion: 'mago', icono: 'fuego', max: 1, costo: { base: 600, crece: 1 }, requiere: { id: 'magoDanio', nivel: 2 }, pos: [0, 2] },
  { id: 'fuegoFuerte', seccion: 'mago', icono: 'fuegoFuerte', max: 10, costo: { base: 120, crece: 2.1 }, requiere: { id: 'fuego', nivel: 1 }, pos: [0, 3] },

  // ---- Arqueros: flechas a un objetivo a la vez (luego a varios) ----
  { id: 'arqueros', seccion: 'arqueros', icono: 'arquero', max: 1, costo: { base: 40, crece: 1 }, requiere: { id: 'danio', nivel: 3 }, raiz: true, pos: [0, 0] },
  { id: 'masArqueros', seccion: 'arqueros', icono: 'masArqueros', max: 5, costo: { base: 90, crece: 3 }, requiere: { id: 'arqueros', nivel: 1 }, pos: [-1, 1] },
  { id: 'multiflecha', seccion: 'arqueros', icono: 'multiflecha', max: 4, costo: { base: 70, crece: 3.2 }, requiere: { id: 'arqueros', nivel: 1 }, pos: [0, 1] },
  { id: 'arcoRapido', seccion: 'arqueros', icono: 'arcoRapido', max: 10, costo: { base: 30, crece: 1.9 }, requiere: { id: 'arqueros', nivel: 1 }, pos: [1, 1] },
  { id: 'muralla', seccion: 'arqueros', icono: 'muralla', max: 10, costo: { base: 50, crece: 1.9 }, requiere: { id: 'masArqueros', nivel: 1 }, pos: [-1, 2] },
  { id: 'arcoDanio', seccion: 'arqueros', icono: 'arcoDanio', max: 15, costo: { base: 40, crece: 1.8 }, requiere: { id: 'multiflecha', nivel: 1 }, pos: [0, 2] },
];

export const TALENT_BY_ID = Object.fromEntries(TALENTS.map((t) => [t.id, t])) as Record<TalentId, TalentDef>;
