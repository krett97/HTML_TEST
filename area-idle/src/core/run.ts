// Una partida: el campo, los enemigos que aparecen y pasean, tu círculo donde caen flechas, el mago
// con sus explosiones de fuego cuadradas y los arqueros que tiran a un objetivo a la vez. Lógica pura: la escena
// llama a stepRun cada cuadro (a través del controlador) y dibuja los eventos.
import { AUTO_ANUNCIO, AUTOAPUNTAR, CLARIDAD, CONTACTO, HIELO, damageMultiplier, effectiveness, ENEMIES, GUARDIA, JEFE, JEFES, cargaNivel, levelConfig, ORDEN_JEFES, oroNivel, ataqueNivel, REBOTE, vidaNivel, LLEGADA, MAX_VIVOS, MAX_VIVOS_OLEADAS, PRIMERA_OLA, type BossDef, type DamageType, type EnemyKind, type LevelConfig, type ProjectileKind } from './datos';
import { between, createRng, type Rng } from './rng';
import type { Stats } from './stats';

/** Ancho del campo en unidades. El alto depende de la pantalla. */
export const FIELD_W = 360;
/** Lo que se deja libre en las orillas al hacer aparecer enemigos. */
const MARGIN = 14;
/** Cada cuánto quema el fuego (segundos). */
/** Cada cuánto quema el suelo en llamas (desde 0.24.0, menos seguido y más fuerte: menos numeritos). */
const FIRE_TICK = 0.6;
/** Lo que tardan en caer tus flechas y en llegar la bola de fuego del mago (segundos). */
export const ARROW_FALL = 0.16;
export const FIREBALL_FLIGHT = 0.28;
/** Velocidad de las flechas de los arqueros (unidades por segundo). */
const ARROW_SPEED = 330;
/** Lo que recibe un enemigo con armadura mientras la tenga (guerreros de hierro, escamas del Dragón). */
export const ARMADURA = 0.6;
/** Después de soltarse de una telaraña, el arquero no puede volver a quedar enredado en estos segundos. */
export const TELA_INMUNE = 4;
/** Abajo del campo, la muralla donde están el mago y los arqueros (los enemigos no llegan ahí). */
export const ALLY_ROW = 50;
/** Lo que sube la torre del mago desde abajo (unidades). */
export const TOWER_H = 80;

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  vidaMax: number;
  /** Segundos hasta cambiar de rumbo. */
  giro: number;
  /** Segundos hasta tirar la siguiente piedra (solo los que tienen resortera). */
  tiro?: number;
  /** Ya se rearmó una vez (los esqueletos). */
  rearmado?: boolean;
  /** Escorpiones: segundos que le quedan bajo tierra (no se le puede pegar) y hasta volver a enterrarse. */
  bajoTierra?: number;
  entierro?: number;
  /** Minotauros: ya va embistiendo. */
  cargando?: boolean;
  /** Ya perdió la armadura (guerreros de hierro, Dragón de acero). */
  sinArmadura?: boolean;
  /** Maldito por la bruja hasta este momento de la partida (le entra más daño de todo). */
  maldito?: number;
  /** Frenado por una flecha de hielo hasta este momento: camina y ataca a `f` de su rapidez. */
  lento?: { hasta: number; f: number };
  /** Salió de otro al partirse (piedritas del gólem): no cuenta para el nivel. */
  cria?: boolean;
  /** Jefe de más en una oleada de Supervivencia: pasea y le tira a la muralla, sin brincos ni invocaciones. */
  elite?: boolean;
}

/** Una piedra de resortera en el aire, de un slime rojo a la muralla. */
export interface Pebble {
  id: number;
  /** Qué es: piedra, lanza, flecha, baba del Rey u hoz del Lobo (cambia cómo se ve y qué tan rápido vuela). */
  tipo: ProjectileKind;
  sx: number;
  sy: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  danio: number;
  /** La telaraña va hacia un arquero (su número) y lo enreda `enreda` s. */
  arquero?: number;
  enreda?: number;
}

/** Velocidad de lo que vuela hacia la muralla (unidades por segundo). */
const PROJECTILE_SPEED: Record<ProjectileKind, number> = { piedra: 170, lanza: 200, flecha: 260, baba: 170, hoz: 150, telarana: 140, daga: 240, bolaFuego: 160, roca: 110, cimitarra: 210, flechaHierro: 260, llamarada: 180 };

export type Forma = { tipo: 'circulo'; r: number } | { tipo: 'rect'; w: number; h: number };

export type Source = 'jugador' | 'mago' | 'fuego' | 'arquero' | 'caballero' | 'sacerdote' | 'bruja';

/**
 * Qué tipo de daño hace cada quien: tus flechas (las de siempre; desde el nivel 45 eliges su elemento), los
 * arqueros y el caballero, físico; el mago y su fuego, fuego; el sacerdote, luz; la bruja, muerte.
 */
export const DAMAGE_TYPE_OF: Record<Source, DamageType> = { jugador: 'fisico', arquero: 'fisico', mago: 'fuego', fuego: 'fuego', caballero: 'fisico', sacerdote: 'luz', bruja: 'muerte' };

/** Hasta dónde llega un rayo de la bruja (atraviesa el campo). */
const RAYO_LARGO = 900;

/** Lo que tarda en caer la columna de luz del sacerdote. */
export const LUZ_DEMORA = 0.35;

interface Impact {
  x: number;
  y: number;
  forma: Forma;
  danio: number;
  fuente: Source;
  falta: number;
}

export interface FireZone {
  x: number;
  y: number;
  w: number;
  h: number;
  restante: number;
  tick: number;
}

/** Una flecha de arquero en el aire, rumbo a un enemigo. */
export interface Arrow {
  id: number;
  x: number;
  y: number;
  /** Hacia dónde apunta (para dibujarla). */
  angulo: number;
  objetivo: number;
  tx: number;
  ty: number;
  danio: number;
  /** Cuántas veces más puede rebotar (talento Rebote) y a quiénes ya tocó. */
  rebotes: number;
  tocados: number[];
}

export type RunEvent =
  | { type: 'spawn'; id: number; kind: EnemyKind; x: number; y: number }
  | { type: 'shot'; x: number; y: number; forma: Forma; fuente: Source; demora: number }
  | { type: 'impact'; x: number; y: number; forma: Forma; fuente: Source }
  | { type: 'hit'; id: number; x: number; y: number; danio: number; fuente: Source; efecto: 'debil' | 'fuerte' | 'critico' | null }
  | { type: 'kill'; id: number; kind: EnemyKind; x: number; y: number; oro: number; danio: number; fuente: Source }
  | { type: 'fire'; x: number; y: number; w: number; h: number; duracion: number }
  | { type: 'volley'; arquero: number }
  /** Un enemigo ataca la muralla: tira algo (`tipo`) o, de cerca (los orcos), la golpea. */
  | { type: 'sling'; id: number; x: number; y: number; tipo: ProjectileKind | 'golpe' }
  | { type: 'wallHit'; x: number; y: number; danio: number; vida: number; max: number }
  | { type: 'wallDown' }
  /** El Albañil reparó la muralla (una vez por nivel). */
  | { type: 'wallRepair'; vida: number; max: number }
  /** El jefe brinca a otro lado (llega en `dura` s), cae aturdido, invoca slimes, lanza baba o se enfurece. */
  | { type: 'bossJump'; id: number; x: number; y: number; tx: number; ty: number; dura: number }
  | { type: 'bossStun'; id: number; x: number; y: number; dura: number }
  | { type: 'bossSummon'; id: number; x: number; y: number }
  | { type: 'bossThrow'; id: number; x: number; y: number }
  | { type: 'bossRage'; id: number }
  /** Un esqueleto cayó y se volvió a armar (con parte de su vida). */
  | { type: 'rise'; id: number; x: number; y: number }
  /** Un escorpión se metió bajo la arena o salió en otro lado. */
  | { type: 'burrow'; id: number; x: number; y: number }
  | { type: 'surface'; id: number; x: number; y: number }
  /** Supervivencia: empieza una oleada (con `jefes` jefes), se aguantó una (y cuántas Runas suma), o se escaparon los que quedaban. */
  | { type: 'wave'; ola: number; total: number; jefes: number }
  | { type: 'waveClear'; ola: number; runas: number }
  /** Se le cayó la armadura (ya recibe todo el daño). */
  | { type: 'armorBreak'; id: number; x: number; y: number }
  /** Un minotauro empezó a embestir la muralla. */
  | { type: 'charge'; id: number; x: number; y: number }
  /** Una telaraña enredó a un arquero: no tira por `dura` s. */
  | { type: 'web'; arquero: number; dura: number }
  /** El caballero dio un tajo (desde x, y hacia tx, ty) y le pegó a `n` enemigos; cayó; volvió a la muralla. */
  | { type: 'knightHit'; x: number; y: number; tx: number; ty: number; n: number }
  | { type: 'knightDown'; x: number; y: number }
  | { type: 'knightUp'; x: number; y: number }
  /** El sacerdote curó al caballero o a la muralla. */
  | { type: 'heal'; a: 'caballero' | 'muro'; x: number; y: number; n: number }
  /** Un rayo de oscuridad de la bruja (de x0, y0 hacia x1, y1, de `ancho`) que le pegó a `n` enemigos. */
  | { type: 'darkRay'; x0: number; y0: number; x1: number; y1: number; ancho: number; n: number }
  /** Se acabó: `gano` si se reventaron todos los slimes del nivel antes de que se acabara el tiempo. */
  | { type: 'end'; gano: boolean };

export interface Run {
  stats: Stats;
  /** Lo que queda libre arriba (bajo la barra del nivel y el reloj): ahí no aparecen ni pasean slimes. */
  arriba: number;
  nivel: LevelConfig;
  /** Cuántos slimes del nivel ya salieron. */
  salieron: number;
  /** El jefe del nivel (si es nivel de jefe): cuándo invoca, brinca y lanza otra vez, si va en el aire, si está aturdido y si ya se enfureció. */
  jefe: { id: number; def: BossDef; invoca: number; brinco: number; lanza: number; salto: { tx: number; ty: number; falta: number } | null; aturdido: number; furia: boolean } | null;
  gano: boolean;
  w: number;
  h: number;
  t: number;
  enemies: Enemy[];
  impacts: Impact[];
  fires: FireZone[];
  arrows: Arrow[];
  piedras: Pebble[];
  /** La muralla: si cae, el mago y los arqueros dejan de atacar el resto del nivel. */
  muro: { vida: number; max: number; caido: boolean; reparado: boolean };
  /** Cuántos de cada tipo se reventaron en la partida (para las misiones). */
  porTipo: Partial<Record<EnemyKind, number>>;
  cursor: { x: number; y: number };
  /** Segundos desde que tocaste (el autoapuntado espera un poco después de cada toque). */
  manual: number;
  /** Adónde va el autoapuntado y cuándo vuelve a elegir. */
  auto: { tx: number; ty: number; falta: number };
  disparo: number;
  mago: number;
  /** Lo que le falta a cada arquero para tirar. */
  arcos: number[];
  /** Segundos que le quedan enredado (telaraña) a cada arquero, y luego sin poder enredarse otra vez. */
  enredos: number[];
  inmunes: number[];
  acumulado: number;
  nextId: number;
  oro: number;
  reventados: number;
  terminada: boolean;
  rng: Rng;
  /** Modo guardia (fuera de los niveles): oro fijo por baja y cuándo sale el siguiente. null en un nivel. */
  guardia: { oroPorBaja: number; falta: number } | null;
  /** Supervivencia: oleada actual, tiempo que le queda, pausa entre oleadas, oleadas aguantadas y Runas juntadas. */
  oleadas: Oleadas | null;
  /** El caballero (si lo tienes): dónde está, su vida, lo que le falta para el siguiente tajo y, si cayó, para volver. */
  caballero: { x: number; y: number; vida: number; max: number; golpe: number; caido: number } | null;
  /** El sacerdote (si lo tienes): lo que le falta para la siguiente columna de luz y para la siguiente cura. */
  sacerdote: { disparo: number; cura: number } | null;
  /** La bruja (si la tienes): lo que le falta para el siguiente rayo. */
  bruja: { rayo: number } | null;
  /** El autoapuntado del anuncio está andando (lo pone el juego mientras dura la media hora). */
  autoBoost: boolean;
}

export interface Oleadas {
  ola: number;
  /** Nivel de la primera oleada (cada oleada, uno más) y nivel más alto abierto (de ahí se sortean las zonas). */
  base: number;
  maxNivel: number;
  restante: number;
  duracion: number;
  pausa: number;
  superadas: number;
  bote: number;
}

/**
 * Supervivencia: cada oleada trae `base + porOla × ola` enemigos (hasta `max`) que salen arriba en `llegada`
 * s y **marchan hacia abajo**: su velocidad (entre `pasoMin` y `pasoMax`) × `paso`. Los que llegan a la
 * muralla se quedan golpeándola (su ataque, al menos `golpe`, cada `cadaGolpe` s o su ritmo); si cae, se
 * acaba. Si no limpias la oleada en `duracion` s (con jefes, `duracionJefe`), llega la siguiente igual y se
 * juntan. Cada 5 oleadas, jefes: 1, y uno más cada 10 (2 en la 10, 3 en la 20…), con `jefeVida` de su vida
 * y `jefeGolpe` de su golpe; también bajan. Limpiar una oleada repara `cura` de la muralla.
 */
export const OLEADAS = { duracion: 30, duracionJefe: 45, pausa: 3, llegada: 6, base: 10, porOla: 4, max: 220, jefeVida: 0.35, golpe: 2, cadaGolpe: 2.5, paso: 3, pasoMin: 8, pasoMax: 20, cura: 0.15, jefeGolpe: 0.5 } as const;

/** Qué tan rápido baja hacia la muralla un enemigo en la Supervivencia. */
export const pasoOleada = (velocidad: number): number => Math.min(OLEADAS.pasoMax, Math.max(OLEADAS.pasoMin, velocidad)) * OLEADAS.paso;
export const jefesOla = (ola: number): number => (ola % 5 === 0 ? 1 + Math.floor(ola / 10) : 0);
/** Runas por aguantar la oleada: 1, y 2 por cada jefe. */
export const runasOla = (ola: number): number => 1 + 2 * jefesOla(ola);

export function createRun(base: Stats, h: number, nivel = 1, seed = Date.now(), arriba = MARGIN): Run {
  const alto = Math.max(240, h);
  // En los niveles de jefe hay más tiempo.
  const stats = levelConfig(nivel).jefe ? { ...base, duracion: base.duracion + JEFE.extra } : base;
  return {
    stats,
    arriba: Math.min(alto / 3, Math.max(MARGIN, arriba)),
    nivel: levelConfig(nivel),
    salieron: 0,
    jefe: null,
    gano: false,
    w: FIELD_W,
    h: alto,
    t: 0,
    enemies: [],
    impacts: [],
    fires: [],
    arrows: [],
    piedras: [],
    muro: { vida: stats.muro.vida, max: stats.muro.vida, caido: false, reparado: false },
    porTipo: {},
    cursor: { x: FIELD_W / 2, y: (alto - ALLY_ROW) / 2 },
    manual: Infinity,
    auto: { tx: FIELD_W / 2, ty: (alto - ALLY_ROW) / 2, falta: 0 },
    // El primer disparo sale enseguida.
    disparo: 0.15,
    mago: stats.mago.intervalo * 0.5,
    // Los arqueros no tiran todos juntos.
    arcos: Array.from({ length: stats.arqueros.cantidad }, (_, i) => 0.3 + (i * stats.arqueros.intervalo) / Math.max(1, stats.arqueros.cantidad)),
    enredos: Array.from({ length: stats.arqueros.cantidad }, () => 0),
    inmunes: Array.from({ length: stats.arqueros.cantidad }, () => 0),
    acumulado: 0,
    nextId: 1,
    oro: 0,
    reventados: 0,
    terminada: false,
    rng: createRng(seed),
    guardia: null,
    oleadas: null,
    caballero: stats.caballero.activo ? nuevoCaballero(stats, alto) : null,
    sacerdote: stats.sacerdote.activo ? { disparo: stats.sacerdote.intervalo * 0.6, cura: stats.sacerdote.cadaCura } : null,
    bruja: stats.bruja.activo ? { rayo: stats.bruja.intervalo * 0.4 } : null,
    autoBoost: false,
  };
}

/** Supervivencia: oleadas desde el nivel `base` (uno más cada oleada) hasta que caiga la muralla. */
export function createSurvivalRun(base: Stats, h: number, nivelBase: number, maxNivel: number, seed = Date.now(), arriba = MARGIN): Run {
  const run = createRun({ ...base, duracion: Infinity }, h, nivelBase, seed, arriba);
  run.oleadas = { ola: 0, base: nivelBase, maxNivel: Math.max(1, maxNivel), restante: 0, duracion: OLEADAS.duracion, pausa: 1.5, superadas: 0, bote: 0 };
  // Hasta que llegue la primera oleada no hay a quién contar.
  run.nivel = { ...run.nivel, total: 0, jefe: null };
  return run;
}

/** Un jefe: con su comportamiento completo (`ia`) o de más (élite: pasea y le tira a la muralla). */
function spawnBoss(run: Run, kind: EnemyKind, vida: number, x: number, y: number, ia: boolean, events: RunEvent[]): Enemy {
  const def = JEFES[kind]!;
  const boss: Enemy = { id: run.nextId++, kind, x, y, vx: 0, vy: 0, vida, vidaMax: vida, giro: ia ? Infinity : 1, ...(ia ? {} : { elite: true, tiro: def.lanza * between(run.rng, 0.5, 1) }) };
  run.enemies.push(boss);
  if (ia) run.jefe = { id: boss.id, def, invoca: def.invoca, brinco: def.cada, lanza: def.lanza * 0.6, salto: null, aturdido: 0, furia: false };
  events.push({ type: 'spawn', id: boss.id, kind, x: boss.x, y: boss.y });
  return boss;
}

/** Empieza la siguiente oleada: su nivel, quiénes salen (de una zona al azar entre las abiertas) y sus jefes. */
function startWave(run: Run, events: RunEvent[]): void {
  const o = run.oleadas!;
  o.ola++;
  const n = o.base + o.ola - 1;
  const zona = levelConfig(1 + Math.floor(run.rng() * o.maxNivel));
  const total = Math.min(OLEADAS.max, OLEADAS.base + OLEADAS.porOla * o.ola);
  // Las oleadas no cambiaron con la Claridad: su vida y su oro son los de siempre.
  run.nivel = { ...levelConfig(n), vida: vidaNivel(n) * CLARIDAD.vida, oro: oroNivel(n), ataque: ataqueNivel(n), mezcla: zona.mezcla, total, jefe: null };
  run.salieron = 0;
  run.acumulado = 0;
  const jefes = jefesOla(o.ola);
  o.duracion = o.restante = jefes ? OLEADAS.duracionJefe : OLEADAS.duracion;
  events.push({ type: 'wave', ola: o.ola, total, jefes });
  for (let i = 0; i < Math.ceil(total * PRIMERA_OLA); i++) spawn(run, events);
  for (let i = 0; i < jefes; i++) {
    const kind = ORDEN_JEFES[(o.ola / 5 - 1 + i) % ORDEN_JEFES.length]!;
    const vida = Math.round(3 * cargaNivel(n) * vidaNivel(n) * CLARIDAD.vida * JEFE.vida * (JEFES[kind]?.vida ?? 1) * OLEADAS.jefeVida);
    const x = run.w * (jefes === 1 ? 0.5 : 0.2 + (0.6 * i) / (jefes - 1));
    // Salen arriba, como todos, y bajan hacia la muralla.
    spawnBoss(run, kind, vida, x, run.arriba + 16, i === 0 && !run.jefe, events);
  }
}

/** Supervivencia, cada paso: pausa, llegada de la oleada, si se aguantó o se acabó su tiempo, y si cayó la muralla. */
function stepWaves(run: Run, step: number, events: RunEvent[]): void {
  const o = run.oleadas!;
  if (run.jefe && !bossOf(run)) run.jefe = null;
  if (run.muro.caido) {
    run.terminada = true;
    events.push({ type: 'end', gano: false });
    return;
  }
  if (o.pausa > 0) {
    o.pausa -= step;
    if (o.pausa <= 0) startWave(run, events);
    return;
  }
  run.acumulado += (run.nivel.total / OLEADAS.llegada) * step;
  while (run.acumulado >= 1 && run.salieron < run.nivel.total && run.enemies.length < MAX_VIVOS_OLEADAS) {
    run.acumulado -= 1;
    spawn(run, events);
  }
  o.restante -= step;
  const quedan = run.enemies.filter((e) => !e.cria);
  if (run.salieron >= run.nivel.total && quedan.length === 0) {
    // Oleada limpia: la muralla se repara un poco.
    run.muro.vida = Math.min(run.muro.max, run.muro.vida + run.muro.max * OLEADAS.cura);
    o.superadas = o.ola;
    o.bote += runasOla(o.ola);
    events.push({ type: 'waveClear', ola: o.ola, runas: runasOla(o.ola) });
    o.pausa = OLEADAS.pausa;
    return;
  }
  if (o.restante <= 0) {
    // Se acabó el tiempo de la oleada: la aguantaste, pero llega la siguiente aunque queden enemigos
    // (los que siguen vivos siguen bajando o golpeando la muralla).
    o.superadas = o.ola;
    o.bote += runasOla(o.ola);
    events.push({ type: 'waveClear', ola: o.ola, runas: runasOla(o.ola) });
    startWave(run, events);
  }
}

/** El nivel cuyos enemigos salen en guardia: el más alto ya superado que no sea de jefe. */
export function guardLevel(nivelAbierto: number): number {
  const n = Math.max(1, nivelAbierto - 1);
  return levelConfig(n).jefe ? Math.max(1, n - 1) : n;
}

/** Las estadísticas de la guardia: sin límite de tiempo. */
const guardStats = (base: Stats): Stats => ({ ...base, duracion: Infinity });

/**
 * Modo guardia (la pantalla principal): tus tropas contra pocos enemigos del nivel `nivel`, sin tiempo, sin
 * perder y sin que le peguen a la muralla. Cada baja da `oroPorBaja`. Tu círculo descansa hasta que tocas
 * el campo; entonces dispara donde tocaste, hasta `GUARDIA.reposo` s después del último toque.
 */
export function createGuardRun(base: Stats, h: number, nivel: number, oroPorBaja: number, seed = Date.now(), arriba = MARGIN): Run {
  const run = createRun(guardStats(base), h, guardLevel(nivel), seed, arriba);
  run.guardia = { oroPorBaja, falta: GUARDIA.cada };
  run.cursor = { x: -999, y: -999 };
  return run;
}

/** Qué tan rápido va (y ataca) un enemigo: 1 normal; menos si lo frenó una flecha de hielo (a los jefes, la mitad del freno). */
export function slowFactor(run: Run, e: Enemy): number {
  if (!e.lento || e.lento.hasta <= run.t) return 1;
  return ENEMIES[e.kind].jefe ? 1 - (1 - e.lento.f) / 2 : e.lento.f;
}

/** ¿Tu círculo está disparando? En un nivel, siempre; en guardia, solo un rato después de tocar. */
export const circleActive = (run: Run): boolean => !run.guardia || run.manual < GUARDIA.reposo || (run.autoBoost && run.enemies.length > 0);

/** Al comprar algo con la guardia andando: mismas tropas, nuevas estadísticas (y el oro por baja). */
export function updateGuardRun(run: Run, base: Stats, oroPorBaja: number): void {
  if (!run.guardia) return;
  run.stats = guardStats(base);
  run.guardia.oroPorBaja = oroPorBaja;
  run.muro.max = run.muro.vida = run.stats.muro.vida;
  while (run.arcos.length < run.stats.arqueros.cantidad) run.arcos.push(0.3 + run.arcos.length * 0.2);
  run.arcos.length = run.stats.arqueros.cantidad;
  while (run.enredos.length < run.arcos.length) run.enredos.push(0);
  run.enredos.length = run.arcos.length;
  while (run.inmunes.length < run.arcos.length) run.inmunes.push(0);
  run.inmunes.length = run.arcos.length;
  // El caballero y el sacerdote: si los acabas de comprar, llegan; si ya estaban, toman lo nuevo.
  if (run.stats.caballero.activo) {
    if (!run.caballero) run.caballero = nuevoCaballero(run.stats, run.h);
    else {
      const k = run.stats.caballero.vida / run.caballero.max;
      run.caballero.max = run.stats.caballero.vida;
      run.caballero.vida = Math.min(run.caballero.max, run.caballero.vida * k);
    }
  }
  if (run.stats.sacerdote.activo && !run.sacerdote) run.sacerdote = { disparo: run.stats.sacerdote.intervalo * 0.6, cura: run.stats.sacerdote.cadaCura };
  if (run.stats.bruja.activo && !run.bruja) run.bruja = { rayo: run.stats.bruja.intervalo * 0.4 };
}

/** Los primeros enemigos de la guardia. */
export function startGuardRun(run: Run): RunEvent[] {
  const events: RunEvent[] = [];
  for (let i = 0; i < GUARDIA.iniciales; i++) spawn(run, events);
  return events;
}

/** Dónde está parado el mago: arriba de la torre, a la izquierda (los pies, detrás de las almenas). */
export function wizardSpot(run: Run): { x: number; y: number } {
  return { x: 24, y: run.h - TOWER_H + 18 };
}

/**
 * Dónde están parados los arqueros: sobre la muralla, cada uno en un hueco entre almenas (los huecos
 * están cada 40 unidades; el primero queda bajo la torre). Los pies quedan detrás del parapeto.
 */
export function archerSpots(run: Run): { x: number; y: number }[] {
  const n = run.stats.arqueros.cantidad;
  // Con sacerdote, el último hueco (a la derecha) es suyo.
  const m = run.stats.sacerdote.activo ? 7 : 8;
  const huecos = Array.from({ length: m }, (_, i) => 60 + 40 * i);
  return Array.from({ length: n }, (_, i) => ({ x: huecos[Math.min(m - 1, Math.round(((i + 0.5) * m) / n - 0.5))]!, y: run.h - ALLY_ROW + 12 }));
}

/** Dónde está parado el sacerdote: en el último hueco de la muralla, a la derecha. */
export function priestSpot(run: Run): { x: number; y: number } {
  return { x: 60 + 40 * 7, y: run.h - ALLY_ROW + 12 };
}

/** Dónde flota la bruja: delante de la muralla, a la izquierda (el caballero sale al centro). */
export function witchSpot(run: Run): { x: number; y: number } {
  return { x: 84, y: run.h - ALLY_ROW - MARGIN + 2 };
}

/** Los enemigos que toca un rayo que sale de (x0, y0) hacia (tx, ty), de `ancho`. */
function enRayo(run: Run, x0: number, y0: number, tx: number, ty: number, ancho: number): Enemy[] {
  const d = Math.hypot(tx - x0, ty - y0) || 1;
  const ux = (tx - x0) / d;
  const uy = (ty - y0) / d;
  return run.enemies.filter((e) => {
    if (e.vida <= 0 || hidden(run, e)) return false;
    const px = e.x - x0;
    const py = e.y - y0;
    const a = px * ux + py * uy;
    return a >= 0 && a <= RAYO_LARGO && Math.abs(px * uy - py * ux) <= ancho / 2 + ENEMIES[e.kind].radio;
  });
}

/**
 * La bruja: cada tanto lanza sus rayos de oscuridad hacia donde atraviesen a más enemigos (prueba unos
 * cuantos blancos al azar y se queda con el mejor). Daño de muerte a todos los que toca, y con Maldición
 * les entra más daño de todo un rato.
 */
function stepWitch(run: Run, step: number, events: RunEvent[]): void {
  const b = run.bruja;
  const s = run.stats.bruja;
  if (!b || !s.activo) return;
  b.rayo -= step;
  if (b.rayo > 0) return;
  const vivos = run.enemies.filter((e) => e.vida > 0 && !hidden(run, e));
  if (!vivos.length) {
    b.rayo = 0.3;
    return;
  }
  b.rayo += s.intervalo;
  const o = witchSpot(run);
  const y0 = o.y - 26;
  const usados = new Set<number>();
  for (let r = 0; r < s.rayos; r++) {
    let mejor: { e: Enemy; n: number } | null = null;
    for (let i = 0; i < 8; i++) {
      const e = vivos[Math.floor(run.rng() * vivos.length)]!;
      if (usados.has(e.id)) continue;
      const n = enRayo(run, o.x, y0, e.x, e.y, s.ancho).length;
      if (!mejor || n > mejor.n) mejor = { e, n };
    }
    if (!mejor) break;
    usados.add(mejor.e.id);
    const tocados = enRayo(run, o.x, y0, mejor.e.x, mejor.e.y, s.ancho);
    const d = Math.hypot(mejor.e.x - o.x, mejor.e.y - y0) || 1;
    events.push({ type: 'darkRay', x0: o.x, y0, x1: o.x + ((mejor.e.x - o.x) / d) * RAYO_LARGO, y1: y0 + ((mejor.e.y - y0) / d) * RAYO_LARGO, ancho: s.ancho, n: tocados.length });
    for (const e of tocados) {
      damage(run, e, s.danio, 'bruja', events);
      if (s.maldicion > 0) e.maldito = run.t + s.dura;
    }
  }
}

/** Adónde vuelve el caballero (y de dónde sale): delante de la muralla, al centro. */
export const knightHome = (h: number): { x: number; y: number } => ({ x: FIELD_W / 2, y: h - ALLY_ROW - MARGIN - 4 });
/** Lo que mide el caballero para chocar con los enemigos. */
export const KNIGHT_R = CONTACTO.radio;

function nuevoCaballero(stats: Stats, h: number): NonNullable<Run['caballero']> {
  const casa = knightHome(h);
  return { x: casa.x, y: casa.y, vida: stats.caballero.vida, max: stats.caballero.vida, golpe: 0.4, caido: 0 };
}

/** ¿El caballero está en pie? */
export const knightUp = (run: Run): boolean => !!run.caballero && run.caballero.caido <= 0;

/** ¿Este enemigo está chocando con el caballero (y lo tiene delante, rumbo a la muralla)? Ahí se queda peleando. */
function blockedByKnight(run: Run, e: Enemy): boolean {
  const c = run.caballero;
  if (!c || c.caido > 0 || inAir(run, e) || hidden(run, e)) return false;
  return e.y <= c.y + 4 && Math.hypot(e.x - c.x, e.y - c.y) < ENEMIES[e.kind].radio + KNIGHT_R + 2;
}

/**
 * El caballero: va hacia el enemigo más adelantado de los cercanos (no alcanza a los que vuelan ni a los
 * enterrados), le da tajos (a varios si tiene Barrido) y, mientras lo tocan, recibe golpes (en guardia,
 * no). Si se queda sin vida cae y vuelve a la muralla al rato, con toda su vida.
 */
function stepKnight(run: Run, step: number, events: RunEvent[]): void {
  const c = run.caballero;
  const s = run.stats.caballero;
  if (!c || !s.activo) return;
  if (c.caido > 0) {
    c.caido -= step;
    if (c.caido <= 0) {
      const casa = knightHome(run.h);
      Object.assign(c, { x: casa.x, y: casa.y, vida: c.max, caido: 0, golpe: 0.3 });
      events.push({ type: 'knightUp', x: c.x, y: c.y });
    }
    return;
  }
  c.golpe = Math.max(0, c.golpe - step);
  const vivos = run.enemies.filter((e) => e.vida > 0 && !hidden(run, e) && !inAir(run, e));
  let blanco: Enemy | undefined;
  let mejor = Infinity;
  for (const e of vivos) {
    // Cerca de él y, sobre todo, los que ya van llegando a la muralla.
    const valor = Math.hypot(e.x - c.x, e.y - c.y) - 0.6 * (e.y - run.arriba);
    if (valor < mejor) {
      mejor = valor;
      blanco = e;
    }
  }
  const casa = knightHome(run.h);
  const destino = blanco ?? casa;
  const alcance = s.alcance + KNIGHT_R + (blanco ? ENEMIES[blanco.kind].radio : 0);
  const d = Math.hypot(destino.x - c.x, destino.y - c.y);
  if (d > (blanco ? alcance * 0.85 : 2)) {
    const paso = Math.min(d, s.velocidad * step);
    c.x = Math.min(run.w - MARGIN, Math.max(MARGIN, c.x + ((destino.x - c.x) / d) * paso));
    c.y = Math.min(casa.y, Math.max(run.arriba, c.y + ((destino.y - c.y) / d) * paso));
  }
  if (blanco && c.golpe <= 0 && Math.hypot(blanco.x - c.x, blanco.y - c.y) <= alcance) {
    c.golpe = s.intervalo;
    // Barrido: también a los que estén a su alcance, los más cercanos primero.
    const otros = vivos
      .filter((e) => e !== blanco && Math.hypot(e.x - c.x, e.y - c.y) <= s.alcance + KNIGHT_R + ENEMIES[e.kind].radio)
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y));
    const golpeados = [blanco, ...otros].slice(0, s.objetivos);
    events.push({ type: 'knightHit', x: c.x, y: c.y, tx: blanco.x, ty: blanco.y, n: golpeados.length });
    for (const e of golpeados) damage(run, e, s.danio, 'caballero', events);
  }
  if (run.guardia) return;
  // Los que lo tocan le pegan.
  let dps = 0;
  for (const e of run.enemies) {
    if (e.vida <= 0 || hidden(run, e) || inAir(run, e)) continue;
    const def = ENEMIES[e.kind];
    if (Math.hypot(e.x - c.x, e.y - c.y) >= def.radio + KNIGHT_R + 4) continue;
    const jd = def.jefe ? JEFES[e.kind] : undefined;
    dps += (jd ? jd.golpe * CONTACTO.jefe : Math.max(1, def.ataque)) * CONTACTO.mult * run.nivel.ataque;
  }
  if (dps <= 0) return;
  c.vida -= dps * step;
  if (c.vida <= 0) {
    c.vida = 0;
    c.caido = s.regreso;
    events.push({ type: 'knightDown', x: c.x, y: c.y });
  }
}

/**
 * El sacerdote (en la muralla; si cae, deja de ayudar como los demás): una columna de luz sobre el enemigo
 * con más vida, y cada tanto cura al caballero y a la muralla (en guardia la muralla no recibe golpes).
 */
function stepPriest(run: Run, step: number, events: RunEvent[]): void {
  const p = run.sacerdote;
  const s = run.stats.sacerdote;
  if (!p || !s.activo || run.muro.caido) return;
  p.disparo -= step;
  while (p.disparo <= 0) {
    p.disparo += s.intervalo;
    let blanco: Enemy | undefined;
    for (const e of run.enemies) if (e.vida > 0 && !hidden(run, e) && (!blanco || e.vida > blanco.vida)) blanco = e;
    if (!blanco) {
      // Nadie a quien pegarle: espera un poco (no junta disparos).
      p.disparo = Math.max(p.disparo, 0.3);
      break;
    }
    const forma: Forma = { tipo: 'circulo', r: s.radio };
    events.push({ type: 'shot', x: blanco.x, y: blanco.y, forma, fuente: 'sacerdote', demora: LUZ_DEMORA });
    run.impacts.push({ x: blanco.x, y: blanco.y, forma, danio: s.danio, fuente: 'sacerdote', falta: LUZ_DEMORA });
  }
  p.cura -= step;
  if (p.cura > 0) return;
  p.cura = s.cadaCura;
  const c = run.caballero;
  if (c && c.caido <= 0 && c.vida < c.max) {
    const n = Math.min(c.max - c.vida, c.max * s.curaCaballero);
    c.vida += n;
    events.push({ type: 'heal', a: 'caballero', x: c.x, y: c.y, n });
  }
  if (run.muro.vida < run.muro.max) {
    const n = Math.min(run.muro.max - run.muro.vida, run.muro.max * s.curaMuro);
    run.muro.vida += n;
    const yo = priestSpot(run);
    events.push({ type: 'heal', a: 'muro', x: yo.x, y: yo.y, n });
  }
}

/** Los enemigos del principio. Devuelve sus eventos para que la escena los dibuje. */
export function startRun(run: Run): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.nivel.jefe) {
    // El jefe sale arriba al centro, con su escolta.
    const { kind, vida } = run.nivel.jefe;
    const boss: Enemy = { id: run.nextId++, kind, x: run.w / 2, y: run.arriba + (bottom(run) - run.arriba) * 0.3, vx: 0, vy: 0, vida, vidaMax: vida, giro: Infinity };
    run.enemies.push(boss);
    const def = JEFES[kind]!;
    run.jefe = { id: boss.id, def, invoca: def.invoca, brinco: def.cada, lanza: def.lanza * 0.6, salto: null, aturdido: 0, furia: false };
    events.push({ type: 'spawn', id: boss.id, kind, x: boss.x, y: boss.y });
    for (let i = 0; i < def.inicial; i++) spawnNear(run, boss, events);
    return events;
  }
  const primeros = Math.ceil(run.nivel.total * PRIMERA_OLA);
  for (let i = 0; i < primeros; i++) spawn(run, events);
  return events;
}

/** Uno de la escolta del jefe (slime verde del Rey, lobo del Lobo Blanco), junto a él. */
function spawnNear(run: Run, boss: Enemy, events: RunEvent[]): void {
  const kind = run.jefe?.def.escolta ?? 'verde';
  const def = ENEMIES[kind];
  const a = run.rng() * Math.PI * 2;
  const d = ENEMIES[boss.kind].radio + between(run.rng, 10, 30);
  const vida = def.vida * run.nivel.vida;
  const e: Enemy = {
    id: run.nextId++,
    kind,
    x: Math.min(run.w - MARGIN, Math.max(MARGIN, boss.x + Math.cos(a) * d)),
    y: Math.min(bottom(run), Math.max(run.arriba, boss.y + Math.sin(a) * d)),
    vx: Math.cos(a) * def.velocidad,
    vy: Math.sin(a) * def.velocidad,
    vida,
    vidaMax: vida,
    giro: between(run.rng, ...(def.giro ?? [1, 3])),
  };
  run.enemies.push(e);
  events.push({ type: 'spawn', id: e.id, kind, x: e.x, y: e.y });
}

/** El jefe del nivel (vivo), o undefined. */
export function bossOf(run: Run): Enemy | undefined {
  return run.jefe ? run.enemies.find((e) => e.id === run.jefe!.id && e.vida > 0) : undefined;
}

/** Mueve el círculo (se queda donde tocó el jugador, dentro del campo). */
export function moveCursor(run: Run, x: number, y: number): void {
  run.cursor.x = Math.min(run.w, Math.max(0, x));
  run.cursor.y = Math.min(run.h, Math.max(0, y));
  run.manual = 0;
}

/** ¿El círculo se está moviendo solo? (tienes Autoapuntado y no has tocado en un rato) */
export const autoAiming = (run: Run): boolean =>
  run.autoBoost ? run.manual >= AUTO_ANUNCIO.espera : run.stats.autoapuntar.velocidad > 0 && !run.guardia && run.manual >= AUTOAPUNTAR.espera;

const bottom = (run: Run) => run.h - ALLY_ROW - MARGIN;
/** Lo más que puede haber vivos a la vez (en la Supervivencia hay más). */
const topeVivos = (run: Run): number => (run.oleadas ? MAX_VIVOS_OLEADAS : MAX_VIVOS);

function spawn(run: Run, events: RunEvent[]): void {
  // Se sortea quién sale según la mezcla del nivel.
  let r = run.rng();
  let kind: EnemyKind = run.nivel.mezcla.at(-1)?.[0] ?? 'verde';
  for (const [k, p] of run.nivel.mezcla) {
    if (r < p) {
      kind = k;
      break;
    }
    r -= p;
  }
  const def = ENEMIES[kind];
  const x0 = between(run.rng, MARGIN, run.w - MARGIN);
  // En la Supervivencia salen todos arriba (y bajan); en un nivel, en cualquier lugar del campo.
  const y0 = run.oleadas ? between(run.rng, run.arriba, run.arriba + 30) : between(run.rng, run.arriba, bottom(run));
  // Los que salen en manada (lobos negros) llegan juntos, uno al lado del otro.
  const cuantos = Math.max(1, def.manada ?? 1);
  const tope = topeVivos(run);
  for (let i = 0; i < cuantos && (i === 0 || (run.salieron < run.nivel.total && run.enemies.length < tope) || !!run.guardia); i++) {
    const x = i === 0 ? x0 : Math.min(run.w - MARGIN, Math.max(MARGIN, x0 + between(run.rng, -18, 18)));
    const y = i === 0 ? y0 : Math.min(bottom(run), Math.max(run.arriba, y0 + between(run.rng, -14, 14)));
    spawnOne(run, kind, x, y, events);
  }
}

function spawnOne(run: Run, kind: EnemyKind, x: number, y: number, events: RunEvent[]): void {
  const def = ENEMIES[kind];
  const vida = def.vida * run.nivel.vida;
  run.salieron++;
  const angle = run.rng() * Math.PI * 2;
  const enemy: Enemy = {
    id: run.nextId++,
    kind,
    x,
    y,
    // Los que marchan (orcos) van directo hacia la muralla.
    vx: def.marcha ? 0 : Math.cos(angle) * def.velocidad,
    vy: def.marcha ? def.velocidad : Math.sin(angle) * def.velocidad,
    vida,
    vidaMax: vida,
    giro: between(run.rng, ...(def.giro ?? [1, 3])),
    // En la Supervivencia todos golpean la muralla al llegar, también los que no tiran nada.
    ...(def.tiro ? { tiro: def.tiro * between(run.rng, 0.6, 1.1) } : run.oleadas ? { tiro: OLEADAS.cadaGolpe * between(run.rng, 0.6, 1.1) } : {}),
  };
  run.enemies.push(enemy);
  events.push({ type: 'spawn', id: enemy.id, kind, x: enemy.x, y: enemy.y });
}

/** ¿El enemigo está dentro de la forma? Cuenta un poco de su cuerpo, no solo el centro. */
/** ¿No se le puede pegar ahora? (escorpión bajo la arena, o el jefe a media teletransportación) */
export function hidden(run: Run, e: Enemy): boolean {
  return (e.bajoTierra ?? 0) > 0 || (run.jefe?.id === e.id && !!run.jefe.salto && run.jefe.def.mueve === 'teletransporte');
}

export function inside(e: Enemy, x: number, y: number, forma: Forma): boolean {
  const extra = ENEMIES[e.kind].radio * 0.6;
  const dx = e.x - x;
  const dy = e.y - y;
  if (forma.tipo === 'circulo') {
    const reach = forma.r + extra;
    return dx * dx + dy * dy <= reach * reach;
  }
  return Math.abs(dx) <= forma.w / 2 + extra && Math.abs(dy) <= forma.h / 2 + extra;
}

function damage(run: Run, e: Enemy, base: number, fuente: Source, events: RunEvent[]): void {
  // Tus flechas son del elemento que elegiste; las de los arqueros, de hielo si las tienen; los demás, del suyo.
  const tipo = fuente === 'jugador' ? run.stats.elemento : fuente === 'arquero' && run.stats.arqueros.hielo > 0 ? 'hielo' : DAMAGE_TYPE_OF[fuente];
  // Maldito por la bruja: le entra más daño de todo.
  const maldito = (e.maldito ?? 0) > run.t ? 1 + run.stats.bruja.maldicion : 1;
  // El jefe aturdido (recién caído de un brinco) recibe doble.
  const aturdido = run.jefe?.id === e.id && run.jefe.aturdido > 0 ? JEFE.aturdidoMult : 1;
  // Tus flechas pueden dar golpe crítico (Reliquia).
  const critico = fuente === 'jugador' && run.stats.critico.prob > 0 && run.rng() < run.stats.critico.prob;
  const def = ENEMIES[e.kind];
  // Con armadura (guerreros de hierro, escamas del Dragón) recibe el 60 % hasta perder media vida.
  const armadura = def.armadura && !e.sinArmadura ? ARMADURA : 1;
  const danio = base * damageMultiplier(e.kind, tipo) * aturdido * armadura * maldito * (critico ? run.stats.critico.mult : 1);
  e.vida -= danio;
  if (def.armadura && !e.sinArmadura && e.vida > 0 && e.vida <= e.vidaMax / 2) {
    e.sinArmadura = true;
    events.push({ type: 'armorBreak', id: e.id, x: e.x, y: e.y });
  }
  // El esqueleto se rearma una vez (con parte de su vida) en vez de caer.
  const rearma = ENEMIES[e.kind].rearma;
  if (e.vida <= 0 && rearma && !e.rearmado) {
    e.rearmado = true;
    e.vida = e.vidaMax * rearma;
    events.push({ type: 'rise', id: e.id, x: e.x, y: e.y });
    return;
  }
  if (e.vida > 0) {
    events.push({ type: 'hit', id: e.id, x: e.x, y: e.y, danio, fuente, efecto: critico ? 'critico' : effectiveness(e.kind, tipo) });
    return;
  }
  // Las crías (piedritas del gólem) no cuentan para el nivel ni para las misiones; en guardia no dan oro.
  const oro = e.cria && run.guardia ? 0 : run.guardia ? run.guardia.oroPorBaja : def.oro * run.nivel.oro * run.stats.oroMult;
  run.oro += oro;
  if (!e.cria) {
    run.porTipo[e.kind] = (run.porTipo[e.kind] ?? 0) + 1;
    run.reventados++;
  }
  events.push({ type: 'kill', id: e.id, kind: e.kind, x: e.x, y: e.y, oro, danio, fuente });
  // El gólem se parte en piedritas.
  if (def.parte) for (let i = 0; i < def.parte.n && run.enemies.length < topeVivos(run); i++) spawnCria(run, def.parte.en, e.x + (i - (def.parte.n - 1) / 2) * 14, e.y, events);
}

/** Una cría (piedrita de gólem) junto a donde cayó su padre: no cuenta para el nivel. */
function spawnCria(run: Run, kind: EnemyKind, x: number, y: number, events: RunEvent[]): void {
  const def = ENEMIES[kind];
  const vida = def.vida * run.nivel.vida;
  const angle = run.rng() * Math.PI * 2;
  const enemy: Enemy = { id: run.nextId++, kind, x: Math.min(run.w - MARGIN, Math.max(MARGIN, x)), y, vx: Math.cos(angle) * def.velocidad, vy: Math.sin(angle) * def.velocidad, vida, vidaMax: vida, giro: between(run.rng, ...(def.giro ?? [1, 3])), cria: true };
  run.enemies.push(enemy);
  events.push({ type: 'spawn', id: enemy.id, kind, x: enemy.x, y: enemy.y });
}

/** ¿Está en el aire? (dragones pequeños, o el Dragón de acero a medio vuelo) Ahí tu lluvia de flechas y el suelo en llamas no le pegan. */
export function inAir(run: Run, e: Enemy): boolean {
  return !!ENEMIES[e.kind].vuela || (run.jefe?.id === e.id && !!run.jefe.salto && run.jefe.def.mueve === 'vuelo');
}

/** Daña a todos los enemigos dentro de la forma. */
function blast(run: Run, x: number, y: number, forma: Forma, danio: number, fuente: Source, events: RunEvent[]): void {
  const suelo = fuente === 'jugador' || fuente === 'fuego';
  for (const e of run.enemies) if (e.vida > 0 && !hidden(run, e) && !(suelo && inAir(run, e)) && inside(e, x, y, forma)) damage(run, e, danio, fuente, events);
}

/** `n` enemigos vivos distintos, al azar. */
function pickTargets(run: Run, n: number, primeroAire = false): Enemy[] {
  const vivos = run.enemies.filter((e) => e.vida > 0 && !hidden(run, e));
  const out: Enemy[] = [];
  if (primeroAire) {
    const aire = vivos.filter((e) => inAir(run, e));
    while (out.length < n && aire.length) {
      const e = aire.splice(Math.floor(run.rng() * aire.length), 1)[0]!;
      out.push(e);
      vivos.splice(vivos.indexOf(e), 1);
    }
  }
  while (out.length < n && vivos.length) out.push(vivos.splice(Math.floor(run.rng() * vivos.length), 1)[0]!);
  return out;
}

/** Le pega a la muralla; si se queda sin vida, cae (y el mago y los arqueros dejan de atacar). */
function hitWall(run: Run, x: number, y: number, danio: number, events: RunEvent[]): void {
  if (run.muro.caido) return;
  run.muro.vida = Math.max(0, run.muro.vida - danio);
  events.push({ type: 'wallHit', x, y, danio, vida: run.muro.vida, max: run.muro.max });
  // El Albañil la repara una vez por nivel cuando le queda poco (aunque el golpe la fuera a tumbar).
  const reparar = run.stats.muro.reparar;
  if (reparar > 0 && !run.muro.reparado && run.muro.vida <= run.muro.max * 0.3) {
    run.muro.reparado = true;
    run.muro.vida = Math.min(run.muro.max, Math.max(run.muro.vida, 1) + run.muro.max * reparar);
    events.push({ type: 'wallRepair', vida: run.muro.vida, max: run.muro.max });
    return;
  }
  if (run.muro.vida <= 0) {
    run.muro.caido = true;
    events.push({ type: 'wallDown' });
  }
}

/** Avanza la partida `dt` segundos. */
export function stepRun(run: Run, dt: number): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.terminada) return events;
  const s = run.stats;
  const step = Math.min(dt, s.duracion - run.t);
  run.t += step;

  // Pasean: cambian de rumbo de vez en cuando y rebotan en las orillas.
  for (const e of run.enemies) {
    if (run.jefe && e.id === run.jefe.id) continue;
    const def = ENEMIES[e.kind];
    // Frenado por el hielo: todo lo que camina va más despacio.
    const paso = step * slowFactor(run, e);
    // Los escorpiones se meten bajo la arena un rato (ahí no se les puede pegar) y salen más adelante.
    if (def.entierra) {
      if ((e.bajoTierra ?? 0) > 0) {
        e.bajoTierra! -= step;
        if (e.bajoTierra! <= 0) events.push({ type: 'surface', id: e.id, x: e.x, y: e.y });
      } else {
        e.entierro = (e.entierro ?? def.entierra.cada) - step;
        if (e.entierro <= 0) {
          e.bajoTierra = def.entierra.dura;
          e.entierro = def.entierra.cada * between(run.rng, 0.8, 1.2);
          events.push({ type: 'burrow', id: e.id, x: e.x, y: e.y });
        }
      }
    }
    // En guardia nadie marcha hacia la muralla: todos pasean. En la Supervivencia marchan todos.
    if ((def.marcha || run.oleadas) && !run.guardia) {
      // Marchan hacia la muralla (bamboleándose un poco) y al llegar se quedan golpeándola. Los que
      // embisten (minotauros), pasando la mitad del campo van mucho más rápido.
      const embiste = !!def.carga && e.y > (run.arriba + bottom(run)) / 2;
      if (embiste && !e.cargando) {
        e.cargando = true;
        events.push({ type: 'charge', id: e.id, x: e.x, y: e.y });
      }
      // El caballero los frena: se quedan peleando con él.
      if (blockedByKnight(run, e)) {
        e.vx = 0;
        e.vy = 0;
        continue;
      }
      const base = run.oleadas ? pasoOleada(def.velocidad) : def.velocidad;
      const vel = base * (embiste ? def.carga! : 1) * (def.armadura && e.sinArmadura ? 1.8 : 1);
      if (e.y >= bottom(run)) {
        e.vx = 0;
        e.vy = 0;
      } else {
        e.vy = vel;
        e.vx = embiste ? 0 : Math.sin(run.t * 2 + e.id) * def.velocidad * 0.4;
      }
      e.x = Math.min(run.w - MARGIN, Math.max(MARGIN, e.x + e.vx * paso));
      e.y = Math.min(bottom(run), e.y + e.vy * paso);
      continue;
    }
    // Los bandidos se apartan de tu círculo cuando lo tienen cerca.
    if (def.esquiva && !run.guardia) {
      const dx = e.x - run.cursor.x;
      const dy = e.y - run.cursor.y;
      const d = Math.hypot(dx, dy);
      if (d < s.radio + def.radio + 18) {
        const ang = d > 0.01 ? Math.atan2(dy, dx) : run.rng() * Math.PI * 2;
        e.vx = Math.cos(ang) * def.esquiva;
        e.vy = Math.sin(ang) * def.esquiva;
        e.giro = 0.4;
      }
    }
    e.giro -= step;
    if (e.giro <= 0) {
      const speed = def.velocidad * between(run.rng, 0.5, 1.4);
      const angle = run.rng() * Math.PI * 2;
      e.vx = Math.cos(angle) * speed;
      e.vy = Math.sin(angle) * speed;
      e.giro = between(run.rng, ...(def.giro ?? [1, 3]));
    }
    e.x += e.vx * paso;
    e.y += e.vy * paso;
    if (e.x < MARGIN || e.x > run.w - MARGIN) e.vx = -e.vx;
    if (e.y < run.arriba || e.y > bottom(run)) e.vy = -e.vy;
    e.x = Math.min(run.w - MARGIN, Math.max(MARGIN, e.x));
    e.y = Math.min(bottom(run), Math.max(run.arriba, e.y));
  }

  const boss = bossOf(run);
  if (run.jefe && boss) {
    // El jefe: a media vida se enfurece; invoca escolta, lanza baba a la muralla y brinca a otro lado.
    const j = run.jefe;
    if (!j.furia && boss.vida <= boss.vidaMax / 2) {
      j.furia = true;
      events.push({ type: 'bossRage', id: boss.id });
    }
    const ritmo = j.furia ? JEFE.furia : 1;
    const jd = j.def;
    j.aturdido = Math.max(0, j.aturdido - step);
    j.invoca -= step;
    if (j.invoca <= 0) {
      j.invoca += jd.invoca * ritmo;
      events.push({ type: 'bossSummon', id: boss.id, x: boss.x, y: boss.y });
      const cuantos = jd.escoltaN + (j.furia ? 1 : 0);
      for (let i = 0; i < cuantos && run.enemies.length < topeVivos(run); i++) spawnNear(run, boss, events);
    }
    j.lanza -= step;
    if (j.lanza <= 0 && !j.salto) {
      j.lanza += jd.lanza * ritmo;
      if (!run.muro.caido) {
        // Uno, o varios en abanico (el Líder de los bandidos, tres dagas).
        const n = jd.rafaga ?? 1;
        const centro = between(run.rng, 12 + 40 * (n - 1), run.w - 12 - 40 * (n - 1));
        for (let i = 0; i < n; i++) {
          const tx = centro + (i - (n - 1) / 2) * 80;
          run.piedras.push({ id: run.nextId++, tipo: jd.proyectil, sx: boss.x, sy: boss.y - 20, x: boss.x, y: boss.y - 20, tx, ty: run.h - ALLY_ROW + 14, danio: jd.golpe * run.nivel.ataque * (run.oleadas ? OLEADAS.jefeGolpe : 1) });
        }
        events.push({ type: 'bossThrow', id: boss.id, x: boss.x, y: boss.y });
      }
    }
    j.brinco -= step;
    if (j.brinco <= 0 && !j.salto) {
      j.brinco += jd.cada * ritmo;
      const r = ENEMIES[boss.kind].radio;
      const tx = between(run.rng, r + MARGIN, run.w - r - MARGIN);
      // En la Supervivencia cada brinco lo acerca a la muralla.
      const ty = run.oleadas ? Math.min(bottom(run) - r * 0.3, boss.y + between(run.rng, 40, 90)) : between(run.rng, run.arriba + r * 0.5, bottom(run) - r * 0.5);
      // El Rey brinca en arco; el Lobo embiste por el piso (la escena lo dibuja distinto).
      j.salto = { tx, ty, falta: jd.dura };
      events.push({ type: 'bossJump', id: boss.id, x: boss.x, y: boss.y, tx, ty, dura: jd.dura });
    }
    // Esquiva tu círculo: si lo tiene cerca, camina alejándose (en furia, más rápido). Aturdido no se mueve.
    if (!j.salto && j.aturdido <= 0) {
      const r = ENEMIES[boss.kind].radio;
      const dx = boss.x - run.cursor.x;
      const dy = boss.y - run.cursor.y;
      const d = Math.hypot(dx, dy);
      if (d < s.radio + r + jd.alerta) {
        const v = jd.esquiva * (j.furia ? 1.4 : 1) * step * slowFactor(run, boss);
        const ang = d > 0.01 ? Math.atan2(dy, dx) : run.rng() * Math.PI * 2;
        boss.vx = Math.cos(ang) * jd.esquiva;
        boss.vy = Math.sin(ang) * jd.esquiva;
        // Contra la orilla se desliza por ella (se recorta cada eje por separado).
        boss.x = Math.min(run.w - r, Math.max(r, boss.x + Math.cos(ang) * v));
        boss.y = Math.min(bottom(run) - r * 0.3, Math.max(run.arriba + r * 0.5, boss.y + Math.sin(ang) * v));
      } else {
        boss.vx = 0;
        boss.vy = 0;
      }
    }
    if (j.salto) {
      const k = Math.min(1, step / j.salto.falta);
      boss.x += (j.salto.tx - boss.x) * k;
      boss.y += (j.salto.ty - boss.y) * k;
      j.salto.falta -= step;
      if (j.salto.falta <= 0) {
        // Cae de golpe (o se frena jadeando) y queda aturdido un momento: es cuando más le duele.
        j.salto = null;
        j.aturdido = jd.aturdido;
        events.push({ type: 'bossStun', id: boss.id, x: boss.x, y: boss.y, dura: jd.aturdido });
      }
    }
  } else if (run.guardia) {
    // Guardia: uno cada tanto, sin pasar de unos cuantos a la vez.
    run.guardia.falta -= step;
    while (run.guardia.falta <= 0) {
      run.guardia.falta += GUARDIA.cada;
      if (run.enemies.length < GUARDIA.max) spawn(run, events);
    }
  } else if (!run.jefe && !run.oleadas) {
    // Llega el resto de los slimes del nivel (más rápido con "Atraer slimes").
    const resto = run.nivel.total - Math.ceil(run.nivel.total * PRIMERA_OLA);
    run.acumulado += (resto / LLEGADA) * s.ritmo * step;
    while (run.acumulado >= 1 && run.salieron < run.nivel.total && run.enemies.length < MAX_VIVOS) {
      run.acumulado -= 1;
      spawn(run, events);
    }
  }

  // Autoapuntado: si no has tocado en un rato, el círculo se va solo (despacio) a donde hay más enemigos.
  // Con el del anuncio, rápido y eligiendo más seguido.
  run.manual += step;
  if (autoAiming(run)) {
    run.auto.falta -= step;
    if (run.auto.falta <= 0) {
      run.auto.falta = run.autoBoost ? AUTO_ANUNCIO.cada : AUTOAPUNTAR.cada;
      if (run.enemies.length) {
        const b = bestSpot(run);
        run.auto.tx = b.x;
        run.auto.ty = b.y;
        // En la pantalla principal el círculo descansa fuera del campo: aparece directo donde va.
        if (run.cursor.x < 0) run.cursor = { x: b.x, y: b.y };
      }
    }
    const dx = run.auto.tx - run.cursor.x;
    const dy = run.auto.ty - run.cursor.y;
    const d = Math.hypot(dx, dy);
    const vel = run.autoBoost ? Math.max(AUTO_ANUNCIO.velocidad, s.autoapuntar.velocidad) : s.autoapuntar.velocidad;
    const k = d > 0.01 ? Math.min(1, (vel * step) / d) : 0;
    run.cursor.x += dx * k;
    run.cursor.y += dy * k;
  }

  // Tu círculo: cada intervalo empiezan a caer flechas donde está; pegan al aterrizar (en guardia, solo
  // si tocaste hace poco: mientras descansa no junta disparos).
  const circulo = circleActive(run);
  run.disparo -= step;
  if (!circulo) run.disparo = Math.max(0, run.disparo);
  while (circulo && run.disparo <= 0) {
    run.disparo += s.intervalo;
    const forma: Forma = { tipo: 'circulo', r: s.radio };
    const { x, y } = run.cursor;
    events.push({ type: 'shot', x, y, forma, fuente: 'jugador', demora: ARROW_FALL });
    run.impacts.push({ x, y, forma, danio: s.danio, fuente: 'jugador', falta: ARROW_FALL });
  }

  // El mago lanza una bola de fuego a donde haya alguien: revienta en un cuadrado.
  // Los que atacan la muralla: los de lejos le tiran algo (piedras, lanzas, flechas); los orcos, ya
  // pegados a ella, la golpean.
  for (const e of run.enemies) {
    // En guardia no atacan la muralla.
    if (e.tiro === undefined || e.vida <= 0 || run.muro.caido || run.guardia) continue;
    const def = ENEMIES[e.kind];
    // Los que marchan (en la Supervivencia, todos menos los jefes de más) solo pegan al llegar a la muralla.
    const golpea = def.marcha || (!!run.oleadas && !e.elite);
    if (golpea && e.y < bottom(run)) continue;
    // Los jefes de más (Supervivencia) le tiran lo suyo a la muralla.
    const jd = e.elite ? JEFES[e.kind] : undefined;
    // Frenado, también tira (o golpea) más despacio.
    e.tiro -= step * slowFactor(run, e);
    if (e.tiro > 0) continue;
    e.tiro += (jd ? jd.lanza : (def.tiro ?? (run.oleadas ? OLEADAS.cadaGolpe : 3))) * between(run.rng, 0.8, 1.2);
    const danio = (jd ? jd.golpe * OLEADAS.jefeGolpe : run.oleadas && golpea ? Math.max(OLEADAS.golpe, def.ataque) : def.ataque) * run.nivel.ataque;
    const ty = run.h - ALLY_ROW + 14;
    if (golpea) {
      events.push({ type: 'sling', id: e.id, x: e.x, y: e.y, tipo: 'golpe' });
      hitWall(run, e.x, ty, danio, events);
      continue;
    }
    const tipo = jd ? jd.proyectil : def.proyectil ?? 'piedra';
    // La araña le apunta a un arquero libre (ni enredado, ni recién soltado, ni con otra telaraña en
    // camino); si todos están ocupados, espera. Sin arqueros, le tira a la muralla.
    const arcos = def.enreda && run.stats.arqueros.cantidad > 0 ? archerSpots(run) : null;
    let arquero: number | undefined;
    if (arcos) {
      const libres = arcos.map((_, i) => i).filter((i) => run.enredos[i]! <= 0 && run.inmunes[i]! <= 0 && !run.piedras.some((p) => p.arquero === i));
      if (!libres.length) continue;
      arquero = libres[Math.floor(run.rng() * libres.length)]!;
    }
    const destino = arcos && arquero !== undefined ? { x: arcos[arquero]!.x, y: arcos[arquero]!.y - 14 } : { x: between(run.rng, 12, run.w - 12), y: ty };
    run.piedras.push({ id: run.nextId++, tipo, sx: e.x, sy: e.y - 8, x: e.x, y: e.y - 8, tx: destino.x, ty: destino.y, danio, ...(arquero !== undefined ? { arquero, enreda: def.enreda } : {}) });
    // Los que tiran varios a la vez (arqueros de hierro): los demás caen a un lado.
    for (let i = 1; i < (def.rafaga ?? 1); i++) {
      const tx = Math.min(run.w - 12, Math.max(12, destino.x + (i % 2 ? 1 : -1) * 26 * Math.ceil(i / 2)));
      run.piedras.push({ id: run.nextId++, tipo, sx: e.x, sy: e.y - 8, x: e.x, y: e.y - 8, tx, ty: destino.y, danio });
    }
    events.push({ type: 'sling', id: e.id, x: e.x, y: e.y, tipo });
  }
  for (const p of run.piedras) {
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    const paso = PROJECTILE_SPEED[p.tipo] * step;
    if (d > paso) {
      p.x += (dx / d) * paso;
      p.y += (dy / d) * paso;
      continue;
    }
    p.x = p.tx;
    p.y = p.ty;
    p.id = -1;
    // La telaraña enreda a su arquero (si la muralla sigue en pie); lo demás le pega a la muralla.
    if (p.arquero !== undefined && p.enreda && p.arquero < run.enredos.length) {
      if (!run.muro.caido) {
        run.enredos[p.arquero] = Math.max(run.enredos[p.arquero]!, p.enreda);
        events.push({ type: 'web', arquero: p.arquero, dura: p.enreda });
      }
      continue;
    }
    hitWall(run, p.tx, p.ty, p.danio, events);
  }
  run.piedras = run.piedras.filter((p) => p.id !== -1);

  // Sin muralla, el mago y los arqueros ya no atacan en este nivel.
  if (s.mago.activo && !run.muro.caido) {
    run.mago -= step;
    while (run.mago <= 0) {
      run.mago += s.mago.intervalo;
      const [blanco] = pickTargets(run, 1);
      const x = blanco?.x ?? between(run.rng, 0, run.w);
      const y = blanco?.y ?? between(run.rng, 0, bottom(run));
      const forma: Forma = { tipo: 'rect', w: s.mago.lado, h: s.mago.lado };
      events.push({ type: 'shot', x, y, forma, fuente: 'mago', demora: FIREBALL_FLIGHT });
      run.impacts.push({ x, y, forma, danio: s.mago.danio, fuente: 'mago', falta: FIREBALL_FLIGHT });
    }
  }

  // Los arqueros: cada uno tira una flecha a cada uno de sus objetivos.
  const arcos = archerSpots(run);
  if (!run.muro.caido) run.arcos.forEach((_, i) => {
    // Enredado en telaraña: no tira hasta soltarse.
    if (run.enredos[i]! > 0) {
      run.enredos[i] = Math.max(0, run.enredos[i]! - step);
      if (run.enredos[i] === 0) run.inmunes[i] = TELA_INMUNE;
      return;
    }
    run.inmunes[i] = Math.max(0, run.inmunes[i]! - step);
    run.arcos[i]! -= step;
    while (run.arcos[i]! <= 0) {
      run.arcos[i]! += s.arqueros.intervalo;
      const origen = arcos[i]!;
      // Los arqueros le tiran primero a los que vuelan (tu lluvia de flechas no los alcanza).
      const blancos = pickTargets(run, s.arqueros.objetivos, true);
      if (blancos.length) events.push({ type: 'volley', arquero: i });
      for (const b of blancos) {
        run.arrows.push({ id: run.nextId++, x: origen.x, y: origen.y - 22, angulo: Math.atan2(b.y - origen.y, b.x - origen.x), objetivo: b.id, tx: b.x, ty: b.y, danio: s.arqueros.danio, rebotes: s.arqueros.rebotes, tocados: [] });
      }
    }
  });
  stepPriest(run, step, events);
  stepKnight(run, step, events);
  stepWitch(run, step, events);

  const porId = new Map(run.enemies.map((e) => [e.id, e]));
  const rebotes: Arrow[] = [];
  for (const a of run.arrows) {
    const blanco = porId.get(a.objetivo);
    if (blanco && blanco.vida > 0) {
      a.tx = blanco.x;
      a.ty = blanco.y;
    }
    const dx = a.tx - a.x;
    const dy = a.ty - a.y;
    const d = Math.hypot(dx, dy);
    const paso = ARROW_SPEED * step;
    a.angulo = Math.atan2(dy, dx);
    if (d <= paso + 2) {
      a.x = a.tx;
      a.y = a.ty;
      // Si el blanco ya reventó, la flecha se clava en el pasto.
      if (blanco && blanco.vida > 0 && !hidden(run, blanco)) {
        damage(run, blanco, a.danio, 'arquero', events);
        // La flecha de hielo lo frena un rato (si ya estaba frenado, se renueva).
        const h = s.arqueros.hielo;
        if (h > 0 && blanco.vida > 0) blanco.lento = { hasta: run.t + HIELO.dura, f: 1 - h };
        // Rebote: salta al más cercano que todavía no tocó.
        if (a.rebotes > 0) {
          const tocados = [...a.tocados, blanco.id];
          let otro: Enemy | null = null;
          let mejor: number = REBOTE.alcance;
          for (const e of run.enemies) {
            if (e.vida <= 0 || tocados.includes(e.id) || hidden(run, e)) continue;
            const d2 = Math.hypot(e.x - a.x, e.y - a.y);
            if (d2 < mejor) {
              mejor = d2;
              otro = e;
            }
          }
          if (otro) rebotes.push({ id: run.nextId++, x: a.x, y: a.y, angulo: Math.atan2(otro.y - a.y, otro.x - a.x), objetivo: otro.id, tx: otro.x, ty: otro.y, danio: a.danio * REBOTE.danio, rebotes: a.rebotes - 1, tocados });
        }
      }
      a.objetivo = -1;
    } else {
      a.x += (dx / d) * paso;
      a.y += (dy / d) * paso;
    }
  }
  run.arrows = run.arrows.filter((a) => a.objetivo !== -1).concat(rebotes);

  // Aterrizan las flechas y las bolas de fuego.
  for (const imp of run.impacts) {
    imp.falta -= step;
    if (imp.falta > 0) continue;
    events.push({ type: 'impact', x: imp.x, y: imp.y, forma: imp.forma, fuente: imp.fuente });
    blast(run, imp.x, imp.y, imp.forma, imp.danio, imp.fuente, events);
    if (imp.fuente === 'mago' && s.fuego.activo && imp.forma.tipo === 'rect') {
      const { w, h } = imp.forma;
      run.fires.push({ x: imp.x, y: imp.y, w, h, restante: s.fuego.duracion, tick: FIRE_TICK });
      events.push({ type: 'fire', x: imp.x, y: imp.y, w, h, duracion: s.fuego.duracion });
    }
  }
  run.impacts = run.impacts.filter((imp) => imp.falta > 0);

  // El suelo en llamas quema a quien pase.
  for (const fire of run.fires) {
    fire.restante -= step;
    fire.tick -= step;
    while (fire.tick <= 0 && fire.restante > -FIRE_TICK) {
      fire.tick += FIRE_TICK;
      blast(run, fire.x, fire.y, { tipo: 'rect', w: fire.w, h: fire.h }, s.fuego.dps * FIRE_TICK, 'fuego', events);
    }
  }
  run.fires = run.fires.filter((f) => f.restante > 0);
  run.enemies = run.enemies.filter((e) => e.vida > 0);

  // La guardia no se acaba; la Supervivencia sigue hasta que cae la muralla.
  if (run.guardia) return events;
  if (run.oleadas) {
    stepWaves(run, step, events);
    return events;
  }

  // Nivel de jefe: se gana al vencerlo, y su escolta revienta con él. Si no, al reventar a todos.
  const jefeVencido = !!run.jefe && !bossOf(run);
  if (jefeVencido) {
    for (const e of run.enemies) {
      const oro = ENEMIES[e.kind].oro * run.nivel.oro * run.stats.oroMult;
      run.oro += oro;
      run.reventados++;
      run.porTipo[e.kind] = (run.porTipo[e.kind] ?? 0) + 1;
      events.push({ type: 'kill', id: e.id, kind: e.kind, x: e.x, y: e.y, oro, danio: Math.max(1, Math.round(e.vida)), fuente: 'jugador' });
    }
    run.enemies = [];
  }
  if (jefeVencido || (!run.jefe && run.reventados >= run.nivel.total)) {
    run.terminada = true;
    run.gano = true;
    events.push({ type: 'end', gano: true });
  } else if (run.t >= s.duracion) {
    run.terminada = true;
    events.push({ type: 'end', gano: false });
  }
  return events;
}

/**
 * El mejor lugar para el círculo: el centro (entre los enemigos) que alcanza a más. Los rojos (los que
 * le tiran a la muralla) cuentan por cuatro mientras la muralla siga en pie: un jugador atento los
 * busca primero. Lo usan el simulador y las pruebas para "tocar" como lo haría una persona.
 */
export function bestSpot(run: Run): { x: number; y: number; cuantos: number } {
  const r = run.stats.radio;
  const peso = (e: Enemy) => (hidden(run, e) || inAir(run, e) ? 0 : run.jefe?.id === e.id ? 12 : e.tiro !== undefined && !run.muro.caido ? 4 : 1);
  let best = { x: run.cursor.x, y: run.cursor.y, cuantos: 0 };
  const paso = Math.max(1, Math.ceil(run.enemies.length / 60));
  for (let i = 0; i < run.enemies.length; i += paso) {
    const c = run.enemies[i]!;
    let n = 0;
    for (const e of run.enemies) {
      const dx = e.x - c.x;
      const dy = e.y - c.y;
      if (dx * dx + dy * dy <= r * r) n += peso(e);
    }
    if (n > best.cuantos) best = { x: c.x, y: c.y, cuantos: n };
  }
  // Un rojo lejos de todos también se busca.
  for (const e of run.enemies) {
    if (peso(e) > 1 && peso(e) > best.cuantos) best = { x: e.x, y: e.y, cuantos: peso(e) };
  }
  return best;
}
