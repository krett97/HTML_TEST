// Datos del juego: los enemigos de la zona y los tres árboles de talentos (jugador, mago y arqueros).
// Los `id` no se renombran nunca (el guardado depende de ellos).

/** Tipos de daño. Por ahora hay físico (tus flechas y los arqueros) y fuego (el mago); los demás llegan después. */
export type DamageType = 'fisico' | 'fuego' | 'hielo' | 'energia' | 'muerte' | 'luz';
export const DAMAGE_TYPES: DamageType[] = ['fisico', 'fuego', 'hielo', 'energia', 'muerte', 'luz'];
export const DAMAGE_TYPES_EN_JUEGO: DamageType[] = ['fisico', 'fuego'];
/** Cuánto reciben los enemigos del tipo al que son débiles y del que son fuertes. */
export const EFFECTIVENESS = { debil: 1.5, fuerte: 0.5 } as const;

export type EnemyKind = 'verde' | 'azul' | 'rojo' | 'rey' | 'goblin' | 'lobo' | 'orco' | 'orcoArquero' | 'loboBlanco' | 'arana' | 'esqueleto' | 'loboNegro' | 'bandido' | 'esqueletoMago' | 'escorpion' | 'minotauro' | 'ciclope' | 'bandidoDesierto' | 'liderBandido' | 'golem' | 'golemito' | 'guerreroHierro' | 'arqueroHierro' | 'dragoncito' | 'dragonAcero';

/** Lo que vuela hacia la muralla: piedra de resortera, lanza de goblin, flecha de orco, baba del Rey, hoz del Lobo, telaraña de araña y daga de bandido. */
export type ProjectileKind = 'piedra' | 'lanza' | 'flecha' | 'baba' | 'hoz' | 'telarana' | 'daga' | 'bolaFuego' | 'roca' | 'cimitarra' | 'flechaHierro' | 'llamarada';

export interface EnemyDef {
  id: EnemyKind;
  vida: number;
  oro: number;
  /** Radio en unidades del campo (el campo mide 360 de ancho). */
  radio: number;
  /** Unidades por segundo al pasear. */
  velocidad: number;
  /** Daño de cada ataque a la muralla (0: no ataca) y cada cuántos segundos ataca. */
  ataque: number;
  tiro?: number;
  /** Qué le tira a la muralla (si ataca de lejos). */
  proyectil?: ProjectileKind;
  /** Camina hasta la muralla y la golpea de cerca (los orcos). */
  marcha?: boolean;
  /** Cada cuántos segundos cambia de rumbo (los lobos, muy seguido). */
  giro?: [number, number];
  /** Sale en manada: cuando aparece uno, llegan estos en total (los lobos negros, de a 3). */
  manada?: number;
  /** Al caer la primera vez se rearma con esta parte de su vida (los esqueletos). */
  rearma?: number;
  /** Se aleja de tu círculo a esta velocidad cuando lo tiene cerca (los bandidos). */
  esquiva?: number;
  /** Su proyectil enreda a un arquero estos segundos en vez de pegarle a la muralla (las arañas). */
  enreda?: number;
  /** Se entierra en la arena cada `cada` s durante `dura` s: bajo tierra no se le puede pegar (escorpiones). */
  entierra?: { cada: number; dura: number };
  /** Al marchar, pasando la mitad del campo embiste: su velocidad ×`carga` (minotauros). */
  carga?: number;
  /** Armadura: recibe 60 % del daño mientras tenga más de la mitad de su vida; al perderla, marcha ×1.8 más rápido. */
  armadura?: boolean;
  /** Al caer se parte en `n` enemigos de tipo `en` (los gólems, en piedritas). */
  parte?: { en: EnemyKind; n: number };
  /** Sale de otro (al partirse): no cuenta para los enemigos del nivel. No sale en el glosario. */
  cria?: boolean;
  /** Vuela: la lluvia de flechas de tu círculo y el suelo en llamas no le pegan (los arqueros y el mago sí). */
  vuela?: boolean;
  /** Cuántos proyectiles tira a la vez (los arqueros de hierro, 2). */
  rafaga?: number;
  /** Tipos de daño que le hacen más (×1.5) y menos (×0.5). */
  debil: DamageType[];
  fuerte: DamageType[];
  /** Es jefe: su vida se calcula por nivel (ver levelConfig) y se gana al vencerlo. */
  jefe?: boolean;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  // ---- Campo verde (niveles 1–10) ----
  // Pegajoso y feliz: el fuego lo derrite.
  verde: { id: 'verde', vida: 3, oro: 1, radio: 9, velocidad: 9, ataque: 0, debil: ['fuego'], fuerte: [] },
  // De agua y con casco: el fuego casi no le hace; el hielo y la energía, mucho.
  azul: { id: 'azul', vida: 14, oro: 6, radio: 11, velocidad: 6, ataque: 0, debil: ['hielo', 'energia'], fuerte: ['fuego'] },
  // Con resortera: le tira piedras a la muralla. Sin casco y nervioso: las flechas le duelen.
  rojo: { id: 'rojo', vida: 8, oro: 4, radio: 10, velocidad: 8, ataque: 3, tiro: 3, proyectil: 'piedra', debil: ['fisico', 'luz'], fuerte: ['muerte'] },
  // El primer jefe (nivel 10): naranja, gigante, con corona. Invoca slimes, brinca, esquiva y le tira baba a la muralla.
  rey: { id: 'rey', vida: 0, oro: 0, radio: 30, velocidad: 4, ataque: 0, debil: ['fuego'], fuerte: [], jefe: true },
  // ---- Campo de batalla (niveles 11–20) ----
  // Goblin verde con lanzas: se las arroja a la muralla.
  goblin: { id: 'goblin', vida: 4, oro: 1.5, radio: 9, velocidad: 9, ataque: 2, tiro: 4, proyectil: 'lanza', debil: ['fuego'], fuerte: [] },
  // Lobo: rapidísimo y cambia de rumbo a cada rato; sin armadura, las flechas le duelen.
  lobo: { id: 'lobo', vida: 3, oro: 1, radio: 9, velocidad: 26, ataque: 0, giro: [0.4, 1], debil: ['fisico'], fuerte: [] },
  // Orco: lento y con armadura; camina hasta la muralla y la golpea con su garrote.
  orco: { id: 'orco', vida: 12, oro: 6, radio: 12, velocidad: 8, ataque: 4, tiro: 2.5, marcha: true, debil: ['fuego'], fuerte: ['fisico'] },
  // Orco arquero: el más fuerte (sin contar al jefe). Flechas a la muralla desde lejos, con armadura.
  orcoArquero: { id: 'orcoArquero', vida: 9, oro: 8, radio: 11, velocidad: 5, ataque: 4, tiro: 3, proyectil: 'flecha', debil: ['fuego'], fuerte: ['fisico'] },
  // El jefe del nivel 20: un lobo blanco enorme con una hoz en la boca. Embiste, aúlla (llama lobos) y avienta la hoz.
  loboBlanco: { id: 'loboBlanco', vida: 0, oro: 0, radio: 30, velocidad: 6, ataque: 0, debil: ['fuego'], fuerte: ['hielo'], jefe: true },
  // ---- Pradera amarilla (niveles 21–30) ----
  // Araña gigante: escupe telaraña a un arquero y lo deja enredado (sin tirar) unos segundos. Se quema fácil.
  arana: { id: 'arana', vida: 12, oro: 2.5, radio: 11, velocidad: 14, ataque: 2, tiro: 7, proyectil: 'telarana', enreda: 2.5, giro: [0.8, 2], debil: ['fuego'], fuerte: ['hielo'] },
  // Esqueleto con espada y escudo: marcha a la muralla y la golpea; el escudo aguanta flechas y, al caer, se rearma una vez.
  esqueleto: { id: 'esqueleto', vida: 16, oro: 7, radio: 11, velocidad: 8, ataque: 5, tiro: 2.5, marcha: true, rearma: 0.5, debil: ['luz'], fuerte: ['fisico'] },
  // Lobo negro: sale en manada de 3 y es más rápido que el gris.
  loboNegro: { id: 'loboNegro', vida: 8, oro: 1.5, radio: 10, velocidad: 30, ataque: 0, manada: 3, giro: [0.3, 0.8], debil: ['fisico'], fuerte: ['muerte'] },
  // Bandido con dagas (el más fuerte de la zona): las lanza a la muralla muy seguido y se aparta de tu círculo.
  bandido: { id: 'bandido', vida: 10, oro: 9, radio: 10, velocidad: 10, ataque: 3, tiro: 1.8, proyectil: 'daga', esquiva: 26, debil: ['fisico'], fuerte: [] },
  // El jefe del nivel 30: esqueleto con sombrero de mago y bastón de fuego. Invoca esqueletos, se teletransporta
  // entre llamas, lanza bolas de fuego y, al caer, se rearma una vez. El fuego casi no le hace.
  esqueletoMago: { id: 'esqueletoMago', vida: 0, oro: 0, radio: 30, velocidad: 4, ataque: 0, rearma: 0.3, debil: ['luz'], fuerte: ['fuego'], jefe: true },
  // ---- Desierto (niveles 31–40) ----
  // Escorpión gigante: se entierra en la arena (no se le puede pegar) y sale en otro lado; el caparazón aguanta flechas.
  escorpion: { id: 'escorpion', vida: 9, oro: 3, radio: 12, velocidad: 12, ataque: 0, entierra: { cada: 4, dura: 1.6 }, giro: [1, 2.5], debil: ['hielo'], fuerte: ['fisico'] },
  // Bandido del desierto: lanza cimitarras a la muralla y esquiva tu círculo; acostumbrado al calor, aguanta el fuego.
  bandidoDesierto: { id: 'bandidoDesierto', vida: 8, oro: 3, radio: 10, velocidad: 12, ataque: 3, tiro: 2.2, proyectil: 'cimitarra', esquiva: 30, debil: ['hielo'], fuerte: ['fuego'] },
  // Minotauro guerrero: marcha y, pasando la mitad del campo, embiste la muralla y la golpea fuerte con su hacha.
  minotauro: { id: 'minotauro', vida: 26, oro: 12, radio: 14, velocidad: 7, ataque: 6, tiro: 3, marcha: true, carga: 3, debil: ['fuego'], fuerte: [] },
  // Cíclope guerrero (el más fuerte de la zona): mucha vida y le avienta rocas enormes a la muralla.
  ciclope: { id: 'ciclope', vida: 30, oro: 15, radio: 15, velocidad: 5, ataque: 7, tiro: 6, proyectil: 'roca', debil: ['luz'], fuerte: ['fuego'] },
  // El jefe del nivel 40: el Líder de los bandidos. Llama a sus bandidos, embiste, lanza un abanico de dagas y
  // es el que más esquiva tu círculo.
  liderBandido: { id: 'liderBandido', vida: 0, oro: 0, radio: 30, velocidad: 6, ataque: 0, debil: ['hielo'], fuerte: ['fuego'], jefe: true },
  // ---- Montaña de piedra (niveles 41–50) ----
  // Guerrero de hierro (el más común): marcha con armadura pesada (mitad de daño hasta perder media vida; luego corre).
  guerreroHierro: { id: 'guerreroHierro', vida: 9, oro: 4, radio: 11, velocidad: 8, ataque: 2, tiro: 2.5, marcha: true, armadura: true, debil: ['energia'], fuerte: [] },
  // Gólem de piedra: lento, le pega fuerte a la muralla y al caer se parte en dos piedritas.
  golem: { id: 'golem', vida: 22, oro: 9, radio: 15, velocidad: 5, ataque: 5, tiro: 3.5, marcha: true, parte: { en: 'golemito', n: 2 }, debil: ['hielo'], fuerte: ['fuego'] },
  // Piedrita: lo que queda de un gólem. Rápida y débil; no cuenta para el nivel.
  golemito: { id: 'golemito', vida: 4, oro: 1, radio: 8, velocidad: 18, ataque: 0, giro: [0.4, 1], cria: true, debil: ['hielo'], fuerte: [] },
  // Arquero de hierro: dos flechas de hierro a la vez a la muralla; el hierro aguanta tus flechas.
  arqueroHierro: { id: 'arqueroHierro', vida: 9, oro: 7, radio: 10, velocidad: 6, ataque: 1.5, tiro: 3.4, proyectil: 'flechaHierro', rafaga: 2, debil: ['energia'], fuerte: ['fisico'] },
  // Dragón pequeño (el más fuerte de la zona): vuela (tu lluvia de flechas no le pega) y escupe fuego a la muralla.
  dragoncito: { id: 'dragoncito', vida: 12, oro: 12, radio: 12, velocidad: 20, ataque: 3, tiro: 4, proyectil: 'llamarada', vuela: true, giro: [0.8, 1.6], debil: ['hielo'], fuerte: ['fuego'] },
  // El jefe del nivel 50: dragón de escamas de acero. Vuela a otro lado, invoca dragones pequeños, escupe cinco
  // llamaradas a lo ancho de la muralla y sus escamas le quitan la mitad del daño hasta perder media vida.
  dragonAcero: { id: 'dragonAcero', vida: 0, oro: 0, radio: 32, velocidad: 5, ataque: 0, armadura: true, debil: ['hielo'], fuerte: ['fuego'], jefe: true },
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
 * Zonas: cada 10 niveles cambia el campo, lo que hay tirado y quién sale. La primera (Campo verde) tiene
 * flores, piedras y arbustos y slimes; la segunda (Campo de batalla), espadas y tablas tiradas, y
 * goblins, lobos y orcos; la tercera (Pradera amarilla, 21–30), hierba seca, cráneos y pedazos de
 * armadura, y arañas, esqueletos, lobos negros y bandidos; la cuarta (Desierto, 31–40), arena, cactus y
 * vasijas, y escorpiones, bandidos del desierto, minotauros y cíclopes; la quinta (Montaña de piedra, 41–50),
 * roca, peñascos y pinos, y guerreros y arqueros de hierro, gólems y dragones pequeños. Después del 50 sigue la montaña.
 */
export type ZoneId = 'campo' | 'batalla' | 'pradera' | 'desierto' | 'montana';
export const ZONAS: { id: ZoneId; desde: number }[] = [
  { id: 'campo', desde: 1 },
  { id: 'batalla', desde: 11 },
  // Pradera amarilla: hierba seca, cráneos y pedazos de armadura; arañas, esqueletos, lobos negros y bandidos.
  { id: 'pradera', desde: 21 },
  // Desierto: arena, cactus, vasijas rotas y cráneos; escorpiones, bandidos del desierto, minotauros y cíclopes.
  { id: 'desierto', desde: 31 },
  // Montaña de piedra: suelo de roca, peñascos y pinos; guerreros y arqueros de hierro, gólems y dragones pequeños.
  { id: 'montana', desde: 41 },
];
export function zoneOf(nivel: number): ZoneId {
  let z: ZoneId = 'campo';
  for (const zona of ZONAS) if (nivel >= zona.desde) z = zona.id;
  return z;
}

/**
 * Los niveles: cada uno trae una cantidad fija de enemigos y hay que reventarlos todos antes de que se
 * acabe el tiempo. Una parte sale al empezar y el resto llega en los siguientes `llegada` segundos.
 * Si se acaba el tiempo, el nivel se pierde (el oro juntado se queda) y se puede reintentar o jugar
 * el anterior para juntar oro.
 */
export interface LevelConfig {
  nivel: number;
  zona: ZoneId;
  total: number;
  /** Multiplican la vida y el oro de cada enemigo. */
  vida: number;
  oro: number;
  /** Quiénes salen y en qué proporción (la suma es 1). */
  mezcla: [EnemyKind, number][];
  /** Fracción de azules y rojos (primera zona; para el glosario y las pruebas). */
  azules: number;
  rojos: number;
  /** Multiplica el daño de los ataques a la muralla. */
  ataque: number;
  /** Oro extra por superar el nivel. */
  premio: number;
  /** En los niveles de jefe (cada 10): quién es y cuánta vida tiene. */
  jefe: { kind: EnemyKind; vida: number } | null;
}

/**
 * Jefes: cada 10 niveles (el Rey Slime en el 10, el Lobo Blanco en el 20; después se alternan). Su vida
 * es la de todos los enemigos de un nivel normal ×`vida`; el nivel dura `extra` s más, el premio es
 * ×`premio`, a media vida se **enfurecen** (sus tiempos ×`furia`, una escolta más) y, después de moverse
 * (brinco o embestida), quedan **aturdidos** recibiendo ×`aturdidoMult`. Lo propio de cada uno, en JEFES.
 */
export const JEFE = { cada: 10, vida: 4, aturdidoMult: 2, furia: 0.65, extra: 10, premio: 5 } as const;

export interface BossDef {
  /** Quién llega a ayudarlo, cuántos al empezar y cuántos cada `invoca` s. */
  escolta: EnemyKind;
  inicial: number;
  invoca: number;
  escoltaN: number;
  /** Cómo se mueve a otro lado cada `cada` s: brincando en arco, embistiendo por el piso o teletransportándose (dura `dura` s). */
  mueve: 'brinco' | 'embestida' | 'teletransporte' | 'vuelo';
  cada: number;
  dura: number;
  /** Segundos aturdido después de moverse. */
  aturdido: number;
  /** Qué le avienta a la muralla, cada cuánto y cuánto daño hace. */
  proyectil: ProjectileKind;
  lanza: number;
  golpe: number;
  /** Cuántos lanza a la vez (en abanico); 1 si no se dice. */
  rafaga?: number;
  /** Multiplica su vida (los que tienen defensas extra, como rearmarse o aguantar fuego, tienen menos). */
  vida?: number;
  /** Camina para salirse de tu círculo (u/s) cuando lo tiene a menos de `alerta` de su orilla. */
  esquiva: number;
  alerta: number;
}

export const JEFES: Partial<Record<EnemyKind, BossDef>> = {
  // Brinca en arco, invoca slimes y lanza bolas de baba.
  rey: { escolta: 'verde', inicial: 6, invoca: 3, escoltaN: 3, mueve: 'brinco', cada: 5, dura: 0.5, aturdido: 1.5, proyectil: 'baba', lanza: 4, golpe: 10, esquiva: 22, alerta: 25 },
  // Embiste rapidísimo por el piso (y queda jadeando), aúlla para llamar lobos y avienta su hoz girando.
  loboBlanco: { escolta: 'lobo', inicial: 6, invoca: 3.5, escoltaN: 3, mueve: 'embestida', cada: 3.5, dura: 0.35, aturdido: 1.2, proyectil: 'hoz', lanza: 4.5, golpe: 14, esquiva: 32, alerta: 30, vida: 0.7 },
  // Se teletransporta entre llamas (y queda recuperándose), invoca esqueletos y lanza bolas de fuego.
  esqueletoMago: { escolta: 'esqueleto', inicial: 3, invoca: 5, escoltaN: 2, mueve: 'teletransporte', cada: 4, dura: 0.4, aturdido: 1.3, proyectil: 'bolaFuego', lanza: 3.5, golpe: 16, esquiva: 18, alerta: 28, vida: 0.6 },
  // Embiste rapidísimo, llama bandidos del desierto, lanza tres dagas en abanico y esquiva más que nadie.
  liderBandido: { escolta: 'bandidoDesierto', inicial: 5, invoca: 3.5, escoltaN: 2, mueve: 'embestida', cada: 3, dura: 0.3, aturdido: 1, proyectil: 'daga', lanza: 3, golpe: 8, rafaga: 3, esquiva: 40, alerta: 34, vida: 1.2 },
  // Vuela alto a otro lado (en el aire tu círculo no le pega) y aterriza aturdido; llama dragones pequeños y
  // escupe cinco llamaradas a lo ancho de la muralla.
  dragonAcero: { escolta: 'dragoncito', inicial: 2, invoca: 6, escoltaN: 1, mueve: 'vuelo', cada: 5, dura: 0.9, aturdido: 1.6, proyectil: 'llamarada', lanza: 4, golpe: 8, rafaga: 5, esquiva: 18, alerta: 26, vida: 0.5 },
};
/** Los jefes en orden: Rey Slime (10), Lobo Blanco (20), Esqueleto Mago (30), Líder de los bandidos (40), Dragón de acero (50); luego se repiten. */
export const ORDEN_JEFES: EnemyKind[] = ['rey', 'loboBlanco', 'esqueletoMago', 'liderBandido', 'dragonAcero'];
export function bossFor(nivel: number): EnemyKind {
  return ORDEN_JEFES[(Math.max(1, Math.round(nivel / JEFE.cada)) - 1) % ORDEN_JEFES.length]!;
}
export const isBossLevel = (nivel: number): boolean => nivel % JEFE.cada === 0;
/** Desde qué nivel sale cada enemigo (los de la segunda zona, desde que empieza). */
export const AZUL_DESDE = 4;
export const ROJO_DESDE = 7;
export const DESDE: Record<EnemyKind, number> = { verde: 1, azul: AZUL_DESDE, rojo: ROJO_DESDE, rey: 10, goblin: 11, lobo: 11, orco: 13, orcoArquero: 15, loboBlanco: 20, arana: 21, loboNegro: 21, esqueleto: 23, bandido: 25, esqueletoMago: 30, escorpion: 31, bandidoDesierto: 31, minotauro: 33, ciclope: 35, liderBandido: 40, guerreroHierro: 41, golem: 41, golemito: 41, arqueroHierro: 43, dragoncito: 45, dragonAcero: 50 };
export const PRIMERA_OLA = 0.3;
export const LLEGADA = 8;
/** Lo más que puede haber vivos a la vez (por rendimiento; el resto espera su turno). */
export const MAX_VIVOS = 450;

/** Quiénes salen en un nivel: los de su zona, cada uno con su parte (el más común se queda con el resto). */
function mixFor(n: number): [EnemyKind, number][] {
  if (zoneOf(n) === 'campo') {
    const azul = n < AZUL_DESDE ? 0 : Math.min(0.5, 0.1 + 0.05 * (n - AZUL_DESDE));
    const rojo = n < ROJO_DESDE ? 0 : Math.min(0.12, 0.06 + 0.01 * (n - ROJO_DESDE));
    return [['azul', azul], ['rojo', rojo], ['verde', 1 - azul - rojo]];
  }
  if (zoneOf(n) === 'montana') {
    const golem = 0.15;
    const arquero = n < DESDE.arqueroHierro ? 0 : Math.min(0.1, 0.05 + 0.02 * (n - DESDE.arqueroHierro));
    const dragon = n < DESDE.dragoncito ? 0 : Math.min(0.12, 0.05 + 0.02 * (n - DESDE.dragoncito));
    return [['golem', golem], ['arqueroHierro', arquero], ['dragoncito', dragon], ['guerreroHierro', 1 - golem - arquero - dragon]];
  }
  if (zoneOf(n) === 'desierto') {
    const bandidos = 0.15;
    const minotauro = n < DESDE.minotauro ? 0 : Math.min(0.18, 0.08 + 0.03 * (n - DESDE.minotauro));
    const ciclope = n < DESDE.ciclope ? 0 : Math.min(0.1, 0.05 + 0.015 * (n - DESDE.ciclope));
    return [['bandidoDesierto', bandidos], ['minotauro', minotauro], ['ciclope', ciclope], ['escorpion', 1 - bandidos - minotauro - ciclope]];
  }
  if (zoneOf(n) === 'pradera') {
    // Los lobos negros salen de a 3: con 10 % de los turnos son ~25 % de los enemigos.
    const lobos = 0.1;
    const esqueleto = n < DESDE.esqueleto ? 0 : Math.min(0.2, 0.08 + 0.03 * (n - DESDE.esqueleto));
    const bandido = n < DESDE.bandido ? 0 : Math.min(0.12, 0.05 + 0.02 * (n - DESDE.bandido));
    return [['loboNegro', lobos], ['esqueleto', esqueleto], ['bandido', bandido], ['arana', 1 - lobos - esqueleto - bandido]];
  }
  const lobo = 0.22;
  const orco = n < DESDE.orco ? 0 : Math.min(0.2, 0.08 + 0.03 * (n - DESDE.orco));
  const arquero = n < DESDE.orcoArquero ? 0 : Math.min(0.12, 0.05 + 0.02 * (n - DESDE.orcoArquero));
  return [['lobo', lobo], ['orco', orco], ['orcoArquero', arquero], ['goblin', 1 - lobo - orco - arquero]];
}

/**
 * Cómo crecen la vida y el oro de los enemigos por nivel. Hasta el 20, la vida ×1.3 y el oro ×1.05 por
 * nivel; desde ahí la vida crece menos y el oro más (si no, hacia el 29 las mejoras ya no alcanzan y el
 * juego se atora: lo mostró el simulador al agregar el desierto). El daño a la muralla, ×1.05 hasta el 20
 * y luego ×1.02 (la muralla tiene un máximo; con ×1.05 para siempre, en la montaña caía en cada partida).
 */
export const CURVA = { vida: 1.32, oro: 1.05, desde: 20, vidaTarde: 1.17, oroTarde: 1.15, ataqueTarde: 1.02, ataqueBase: 0.6 };
export const vidaNivel = (n: number): number => Math.pow(CURVA.vida, Math.min(n, CURVA.desde) - 1) * Math.pow(CURVA.vidaTarde, Math.max(0, n - CURVA.desde));
/** El daño de los ataques a la muralla: ×1.05 por nivel desde el 7 hasta el 20; después solo ×`ataqueTarde` (la muralla tiene un máximo). */
export const ataqueNivel = (n: number): number => CURVA.ataqueBase * Math.pow(1.05, Math.max(0, Math.min(n, CURVA.desde) - ROJO_DESDE)) * Math.pow(CURVA.ataqueTarde, Math.max(0, n - CURVA.desde));
export const oroNivel = (n: number): number => Math.pow(CURVA.oro, Math.min(n, CURVA.desde) - 1) * Math.pow(CURVA.oroTarde, Math.max(0, n - CURVA.desde));

/**
 * El premio por superar un nivel: `frac` del oro que dan todos sus enemigos (×5 en los de jefe). Así el
 * Botín vale algo (antes el premio era ~1 % del oro).
 */
export const PREMIO = { frac: 0.3 };
function premioNivel(n: number, mezcla: [EnemyKind, number][]): number {
  const oroMedio = mezcla.reduce((t, [k, p]) => t + p * ENEMIES[k].oro * (ENEMIES[k].manada ?? 1), 0) / mezcla.reduce((t, [k, p]) => t + p * (ENEMIES[k].manada ?? 1), 0);
  return Math.round(PREMIO.frac * (15 + 8 * (n - 1)) * oroMedio * oroNivel(n) * (isBossLevel(n) ? JEFE.premio : 1));
}

export function levelConfig(nivel: number): LevelConfig {
  const n = Math.max(1, Math.floor(nivel));
  const mezcla = mixFor(n).filter(([, p]) => p > 0);
  const parte = (k: EnemyKind) => mezcla.find(([kind]) => kind === k)?.[1] ?? 0;
  return {
    nivel: n,
    zona: zoneOf(n),
    total: 15 + 8 * (n - 1),
    vida: vidaNivel(n),
    oro: oroNivel(n),
    mezcla,
    azules: parte('azul'),
    rojos: parte('rojo'),
    ataque: ataqueNivel(n),
    premio: premioNivel(n, mezcla),
    jefe: isBossLevel(n) ? { kind: bossFor(n), vida: Math.round(3 * (15 + 8 * (n - 1)) * vidaNivel(n) * JEFE.vida * (JEFES[bossFor(n)]?.vida ?? 1)) } : null,
  };
}

/**
 * Oro mientras no juegas: se abre al llegar al nivel 3. Da una parte (`eficiencia`) de lo que se gana
 * por minuto jugando el nivel más alto superado, hasta `horas` horas. Los talentos Oro inactivo y Bolsa
 * grande suben la parte y las horas. Menos de un minuto fuera no cuenta.
 */
/** Lo que da cada nivel de las mejoras de oro: Ganancia de oro (todo el oro) y Botín (el premio por nivel). */
export const ORO_TALENTOS = { oro: 0.1, botin: 0.1 };
export const INACTIVO = { desde: 3, eficiencia: 0.1, porNivel: 0.02, horas: 2, horasPorNivel: 0.5, minSegundos: 60, segundosPorNivelJugado: 30 } as const;

/**
 * Modo guardia: mientras estás en el árbol (sin jugar un nivel), tus tropas (arqueros y mago) pelean solas
 * contra pocos enemigos: uno cada `cada` s, como mucho `max` a la vez, sin tiempo ni ataques a la muralla.
 * Cada baja da oro fijo para que, si tus tropas alcanzan, se gane el 20 % de lo que de verdad ganas
 * jugando (no lo sube "Oro inactivo", que es solo para la app cerrada).
 */
export const GUARDIA = { cada: 2.5, max: 12, eficiencia: 0.2, iniciales: 3 } as const;

/**
 * Autoapuntado (talento del jugador): si no tocas en `espera` s, tu círculo se va solo hacia donde hay más
 * enemigos, a `velocidad` (+`porNivel` por nivel) unidades por segundo, y cada `cada` s vuelve a elegir.
 * Es lento a propósito (el campo mide 360 de ancho): tocar siempre es mejor.
 */
export const AUTOAPUNTAR = { velocidad: 12, porNivel: 6, espera: 2.5, cada: 1 } as const;

/** Desde qué nivel se abren las misiones (diarias y permanentes), las gemas moradas y las Reliquias. */
export const MISIONES_DESDE = 11;
/** El ranking se abre al llegar a este nivel. */
export const RANKING_DESDE = 17;
/** El PvP (ligas semanales contra otros jugadores) se abre al llegar a este nivel. */
export const PVP_DESDE = 19;
/** La Supervivencia (oleadas que dan Runas para el equipo) se abre al llegar a este nivel. */
export const SUPERVIVENCIA_DESDE = 26;

export type Seccion = 'jugador' | 'mago' | 'arqueros' | 'reliquias';
export const SECCIONES: Seccion[] = ['jugador', 'mago', 'arqueros', 'reliquias'];

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
  | 'autoapuntar'
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
  | 'muralla'
  // Reliquias (se pagan con gemas moradas)
  | 'poder'
  | 'critico'
  | 'carcaj'
  | 'albanil';

export interface TalentDef {
  id: TalentId;
  seccion: Seccion;
  /** Ícono (src/assets/arte/iconos/<icono>.png). */
  icono: string;
  max: number;
  /** Precio: `base` × `crece`^nivel; desde el nivel `tarde.desde` sube más despacio (`tarde.crece`). */
  costo: { base: number; crece: number; tarde?: { desde: number; crece: number } };
  /** Talento que hace falta (con al menos ese nivel) para abrir este; puede ser de otra sección. */
  requiere: { id: TalentId; nivel: number } | null;
  /** La raíz de una sección: se ve siempre (con candado mientras falte su requisito). */
  raiz?: boolean;
  /** Nivel del juego que hay que haber alcanzado para comprarlo (además del requisito). */
  nivelMin?: number;
  /** Se paga con gemas moradas en vez de oro (las Reliquias). */
  moneda?: 'gemas';
  /** Lugar en su árbol: columna (−2…2) y fila (0 arriba). */
  pos: [number, number];
}

export const TALENTS: TalentDef[] = [
  // ---- Jugador: tu área, donde caen las flechas ----
  { id: 'danio', seccion: 'jugador', icono: 'danio', max: 100, costo: { base: 4, crece: 1.4, tarde: { desde: 40, crece: 1.2 } }, requiere: null, raiz: true, pos: [0, 0] },
  { id: 'radio', seccion: 'jugador', icono: 'radio', max: 10, costo: { base: 8, crece: 2 }, requiere: { id: 'danio', nivel: 1 }, pos: [-1, 1] },
  { id: 'slimes', seccion: 'jugador', icono: 'slimes', max: 10, costo: { base: 6, crece: 1.9 }, requiere: { id: 'danio', nivel: 1 }, pos: [0, 1] },
  { id: 'cadencia', seccion: 'jugador', icono: 'cadencia', max: 10, costo: { base: 8, crece: 2 }, requiere: { id: 'danio', nivel: 1 }, pos: [1, 1] },
  { id: 'tiempo', seccion: 'jugador', icono: 'tiempo', max: 10, costo: { base: 12, crece: 2.1 }, requiere: { id: 'radio', nivel: 2 }, pos: [-1, 2] },
  { id: 'botin', seccion: 'jugador', icono: 'botin', max: 15, costo: { base: 20, crece: 1.8 }, requiere: { id: 'slimes', nivel: 2 }, pos: [0, 2] },
  { id: 'oro', seccion: 'jugador', icono: 'oro', max: 15, costo: { base: 15, crece: 1.9 }, requiere: { id: 'slimes', nivel: 2 }, pos: [1, 2] },
  // Oro mientras no juegas (se abre solo al llegar al nivel 3; estos lo mejoran).
  { id: 'inactivo', seccion: 'jugador', icono: 'inactivo', max: 5, costo: { base: 40, crece: 2.2 }, requiere: { id: 'oro', nivel: 1 }, nivelMin: 3, pos: [1, 3] },
  { id: 'bolsa', seccion: 'jugador', icono: 'bolsa', max: 6, costo: { base: 60, crece: 2 }, requiere: { id: 'inactivo', nivel: 1 }, pos: [2, 3] },
  { id: 'autoapuntar', seccion: 'jugador', icono: 'autoapuntar', max: 5, costo: { base: 50, crece: 2.4 }, requiere: { id: 'radio', nivel: 3 }, pos: [-2, 2] },

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
  { id: 'muralla', seccion: 'arqueros', icono: 'muralla', max: 20, costo: { base: 50, crece: 1.9, tarde: { desde: 10, crece: 1.5 } }, requiere: { id: 'masArqueros', nivel: 1 }, pos: [-1, 2] },
  { id: 'arcoDanio', seccion: 'arqueros', icono: 'arcoDanio', max: 15, costo: { base: 40, crece: 1.8 }, requiere: { id: 'multiflecha', nivel: 1 }, pos: [0, 2] },

  // ---- Reliquias: mejoras que el oro no da; se pagan con gemas moradas (misiones) ----
  { id: 'poder', seccion: 'reliquias', icono: 'poder', max: 10, costo: { base: 5, crece: 1.35 }, moneda: 'gemas', requiere: null, raiz: true, nivelMin: MISIONES_DESDE, pos: [0, 0] },
  { id: 'critico', seccion: 'reliquias', icono: 'critico', max: 6, costo: { base: 6, crece: 1.5 }, moneda: 'gemas', requiere: { id: 'poder', nivel: 1 }, pos: [-1, 1] },
  { id: 'carcaj', seccion: 'reliquias', icono: 'carcaj', max: 3, costo: { base: 10, crece: 2 }, moneda: 'gemas', requiere: { id: 'poder', nivel: 1 }, pos: [0, 1] },
  { id: 'albanil', seccion: 'reliquias', icono: 'albanil', max: 3, costo: { base: 8, crece: 1.8 }, moneda: 'gemas', requiere: { id: 'poder', nivel: 1 }, pos: [1, 1] },
];

export const TALENT_BY_ID = Object.fromEntries(TALENTS.map((t) => [t.id, t])) as Record<TalentId, TalentDef>;
