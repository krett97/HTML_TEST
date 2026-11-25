// Una partida: el campo, los enemigos que aparecen y pasean, tu círculo donde caen flechas, el mago
// con sus explosiones de fuego cuadradas y los arqueros que tiran a un objetivo a la vez. Lógica pura: la escena
// llama a stepRun cada cuadro (a través del controlador) y dibuja los eventos.
import { damageMultiplier, effectiveness, ENEMIES, JEFE, JEFES, levelConfig, LLEGADA, MAX_VIVOS, PRIMERA_OLA, type BossDef, type DamageType, type EnemyKind, type LevelConfig, type ProjectileKind } from './datos';
import { between, createRng, type Rng } from './rng';
import type { Stats } from './stats';

/** Ancho del campo en unidades. El alto depende de la pantalla. */
export const FIELD_W = 360;
/** Lo que se deja libre en las orillas al hacer aparecer enemigos. */
const MARGIN = 14;
/** Cada cuánto quema el fuego (segundos). */
const FIRE_TICK = 0.25;
/** Lo que tardan en caer tus flechas y en llegar la bola de fuego del mago (segundos). */
export const ARROW_FALL = 0.16;
export const FIREBALL_FLIGHT = 0.28;
/** Velocidad de las flechas de los arqueros (unidades por segundo). */
const ARROW_SPEED = 330;
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
}

/** Velocidad de lo que vuela hacia la muralla (unidades por segundo). */
const PROJECTILE_SPEED: Record<ProjectileKind, number> = { piedra: 170, lanza: 200, flecha: 260, baba: 170, hoz: 150 };

export type Forma = { tipo: 'circulo'; r: number } | { tipo: 'rect'; w: number; h: number };

export type Source = 'jugador' | 'mago' | 'fuego' | 'arquero';

/** Qué tipo de daño hace cada quien: tus flechas y los arqueros, físico; el mago y su fuego, fuego. */
export const DAMAGE_TYPE_OF: Record<Source, DamageType> = { jugador: 'fisico', arquero: 'fisico', mago: 'fuego', fuego: 'fuego' };

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
}

export type RunEvent =
  | { type: 'spawn'; id: number; kind: EnemyKind; x: number; y: number }
  | { type: 'shot'; x: number; y: number; forma: Forma; fuente: Source; demora: number }
  | { type: 'impact'; x: number; y: number; forma: Forma; fuente: Source }
  | { type: 'hit'; id: number; x: number; y: number; danio: number; fuente: Source; efecto: 'debil' | 'fuerte' | null }
  | { type: 'kill'; id: number; kind: EnemyKind; x: number; y: number; oro: number; danio: number; fuente: Source }
  | { type: 'fire'; x: number; y: number; w: number; h: number; duracion: number }
  | { type: 'volley'; arquero: number }
  /** Un enemigo ataca la muralla: tira algo (`tipo`) o, de cerca (los orcos), la golpea. */
  | { type: 'sling'; id: number; x: number; y: number; tipo: ProjectileKind | 'golpe' }
  | { type: 'wallHit'; x: number; y: number; danio: number; vida: number; max: number }
  | { type: 'wallDown' }
  /** El jefe brinca a otro lado (llega en `dura` s), cae aturdido, invoca slimes, lanza baba o se enfurece. */
  | { type: 'bossJump'; id: number; x: number; y: number; tx: number; ty: number; dura: number }
  | { type: 'bossStun'; id: number; x: number; y: number; dura: number }
  | { type: 'bossSummon'; id: number; x: number; y: number }
  | { type: 'bossThrow'; id: number; x: number; y: number }
  | { type: 'bossRage'; id: number }
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
  muro: { vida: number; max: number; caido: boolean };
  cursor: { x: number; y: number };
  disparo: number;
  mago: number;
  /** Lo que le falta a cada arquero para tirar. */
  arcos: number[];
  acumulado: number;
  nextId: number;
  oro: number;
  reventados: number;
  terminada: boolean;
  rng: Rng;
}

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
    muro: { vida: stats.muro.vida, max: stats.muro.vida, caido: false },
    cursor: { x: FIELD_W / 2, y: (alto - ALLY_ROW) / 2 },
    // El primer disparo sale enseguida.
    disparo: 0.15,
    mago: stats.mago.intervalo * 0.5,
    // Los arqueros no tiran todos juntos.
    arcos: Array.from({ length: stats.arqueros.cantidad }, (_, i) => 0.3 + (i * stats.arqueros.intervalo) / Math.max(1, stats.arqueros.cantidad)),
    acumulado: 0,
    nextId: 1,
    oro: 0,
    reventados: 0,
    terminada: false,
    rng: createRng(seed),
  };
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
  const huecos = Array.from({ length: 8 }, (_, i) => 60 + 40 * i);
  return Array.from({ length: n }, (_, i) => ({ x: huecos[Math.min(7, Math.round(((i + 0.5) * 8) / n - 0.5))]!, y: run.h - ALLY_ROW + 12 }));
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
}

const bottom = (run: Run) => run.h - ALLY_ROW - MARGIN;

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
  const vida = def.vida * run.nivel.vida;
  run.salieron++;
  const angle = run.rng() * Math.PI * 2;
  const enemy: Enemy = {
    id: run.nextId++,
    kind,
    x: between(run.rng, MARGIN, run.w - MARGIN),
    y: between(run.rng, run.arriba, bottom(run)),
    // Los que marchan (orcos) van directo hacia la muralla.
    vx: def.marcha ? 0 : Math.cos(angle) * def.velocidad,
    vy: def.marcha ? def.velocidad : Math.sin(angle) * def.velocidad,
    vida,
    vidaMax: vida,
    giro: between(run.rng, ...(def.giro ?? [1, 3])),
    ...(def.tiro ? { tiro: def.tiro * between(run.rng, 0.6, 1.1) } : {}),
  };
  run.enemies.push(enemy);
  events.push({ type: 'spawn', id: enemy.id, kind, x: enemy.x, y: enemy.y });
}

/** ¿El enemigo está dentro de la forma? Cuenta un poco de su cuerpo, no solo el centro. */
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
  const tipo = DAMAGE_TYPE_OF[fuente];
  // El jefe aturdido (recién caído de un brinco) recibe doble.
  const aturdido = run.jefe?.id === e.id && run.jefe.aturdido > 0 ? JEFE.aturdidoMult : 1;
  const danio = base * damageMultiplier(e.kind, tipo) * aturdido;
  e.vida -= danio;
  if (e.vida > 0) {
    events.push({ type: 'hit', id: e.id, x: e.x, y: e.y, danio, fuente, efecto: effectiveness(e.kind, tipo) });
    return;
  }
  const oro = ENEMIES[e.kind].oro * run.nivel.oro * run.stats.oroMult;
  run.oro += oro;
  run.reventados++;
  events.push({ type: 'kill', id: e.id, kind: e.kind, x: e.x, y: e.y, oro, danio, fuente });
}

/** Daña a todos los enemigos dentro de la forma. */
function blast(run: Run, x: number, y: number, forma: Forma, danio: number, fuente: Source, events: RunEvent[]): void {
  for (const e of run.enemies) if (e.vida > 0 && inside(e, x, y, forma)) damage(run, e, danio, fuente, events);
}

/** `n` enemigos vivos distintos, al azar. */
function pickTargets(run: Run, n: number): Enemy[] {
  const vivos = run.enemies.filter((e) => e.vida > 0);
  const out: Enemy[] = [];
  while (out.length < n && vivos.length) out.push(vivos.splice(Math.floor(run.rng() * vivos.length), 1)[0]!);
  return out;
}

/** Le pega a la muralla; si se queda sin vida, cae (y el mago y los arqueros dejan de atacar). */
function hitWall(run: Run, x: number, y: number, danio: number, events: RunEvent[]): void {
  if (run.muro.caido) return;
  run.muro.vida = Math.max(0, run.muro.vida - danio);
  events.push({ type: 'wallHit', x, y, danio, vida: run.muro.vida, max: run.muro.max });
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
    if (def.marcha) {
      // Marchan hacia la muralla (bamboleándose un poco) y al llegar se quedan golpeándola.
      if (e.y >= bottom(run)) {
        e.vx = 0;
        e.vy = 0;
      } else {
        e.vy = def.velocidad;
        e.vx = Math.sin(run.t * 2 + e.id) * def.velocidad * 0.4;
      }
      e.x = Math.min(run.w - MARGIN, Math.max(MARGIN, e.x + e.vx * step));
      e.y = Math.min(bottom(run), e.y + e.vy * step);
      continue;
    }
    e.giro -= step;
    if (e.giro <= 0) {
      const speed = def.velocidad * between(run.rng, 0.5, 1.4);
      const angle = run.rng() * Math.PI * 2;
      e.vx = Math.cos(angle) * speed;
      e.vy = Math.sin(angle) * speed;
      e.giro = between(run.rng, ...(def.giro ?? [1, 3]));
    }
    e.x += e.vx * step;
    e.y += e.vy * step;
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
      for (let i = 0; i < cuantos && run.enemies.length < MAX_VIVOS; i++) spawnNear(run, boss, events);
    }
    j.lanza -= step;
    if (j.lanza <= 0 && !j.salto) {
      j.lanza += jd.lanza * ritmo;
      if (!run.muro.caido) {
        const tx = between(run.rng, 12, run.w - 12);
        run.piedras.push({ id: run.nextId++, tipo: jd.proyectil, sx: boss.x, sy: boss.y - 20, x: boss.x, y: boss.y - 20, tx, ty: run.h - ALLY_ROW + 14, danio: jd.golpe * run.nivel.ataque });
        events.push({ type: 'bossThrow', id: boss.id, x: boss.x, y: boss.y });
      }
    }
    j.brinco -= step;
    if (j.brinco <= 0 && !j.salto) {
      j.brinco += jd.cada * ritmo;
      const r = ENEMIES[boss.kind].radio;
      const tx = between(run.rng, r + MARGIN, run.w - r - MARGIN);
      const ty = between(run.rng, run.arriba + r * 0.5, bottom(run) - r * 0.5);
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
        const v = jd.esquiva * (j.furia ? 1.4 : 1) * step;
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
  } else if (!run.jefe) {
    // Llega el resto de los slimes del nivel (más rápido con "Atraer slimes").
    const resto = run.nivel.total - Math.ceil(run.nivel.total * PRIMERA_OLA);
    run.acumulado += (resto / LLEGADA) * s.ritmo * step;
    while (run.acumulado >= 1 && run.salieron < run.nivel.total && run.enemies.length < MAX_VIVOS) {
      run.acumulado -= 1;
      spawn(run, events);
    }
  }

  // Tu círculo: cada intervalo empiezan a caer flechas donde está; pegan al aterrizar.
  run.disparo -= step;
  while (run.disparo <= 0) {
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
    if (e.tiro === undefined || e.vida <= 0 || run.muro.caido) continue;
    const def = ENEMIES[e.kind];
    if (def.marcha && e.y < bottom(run)) continue;
    e.tiro -= step;
    if (e.tiro > 0) continue;
    e.tiro += (def.tiro ?? 3) * between(run.rng, 0.8, 1.2);
    const danio = def.ataque * run.nivel.ataque;
    const ty = run.h - ALLY_ROW + 14;
    if (def.marcha) {
      events.push({ type: 'sling', id: e.id, x: e.x, y: e.y, tipo: 'golpe' });
      hitWall(run, e.x, ty, danio, events);
      continue;
    }
    const tipo = def.proyectil ?? 'piedra';
    run.piedras.push({ id: run.nextId++, tipo, sx: e.x, sy: e.y - 8, x: e.x, y: e.y - 8, tx: between(run.rng, 12, run.w - 12), ty, danio });
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
    run.arcos[i]! -= step;
    while (run.arcos[i]! <= 0) {
      run.arcos[i]! += s.arqueros.intervalo;
      const origen = arcos[i]!;
      const blancos = pickTargets(run, s.arqueros.objetivos);
      if (blancos.length) events.push({ type: 'volley', arquero: i });
      for (const b of blancos) {
        run.arrows.push({ id: run.nextId++, x: origen.x, y: origen.y - 22, angulo: Math.atan2(b.y - origen.y, b.x - origen.x), objetivo: b.id, tx: b.x, ty: b.y, danio: s.arqueros.danio });
      }
    }
  });
  const porId = new Map(run.enemies.map((e) => [e.id, e]));
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
      if (blanco && blanco.vida > 0) damage(run, blanco, a.danio, 'arquero', events);
      a.objetivo = -1;
    } else {
      a.x += (dx / d) * paso;
      a.y += (dy / d) * paso;
    }
  }
  run.arrows = run.arrows.filter((a) => a.objetivo !== -1);

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

  // Nivel de jefe: se gana al vencerlo, y su escolta revienta con él. Si no, al reventar a todos.
  const jefeVencido = !!run.jefe && !bossOf(run);
  if (jefeVencido) {
    for (const e of run.enemies) {
      const oro = ENEMIES[e.kind].oro * run.nivel.oro * run.stats.oroMult;
      run.oro += oro;
      run.reventados++;
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
  const peso = (e: Enemy) => (run.jefe?.id === e.id ? 12 : e.tiro !== undefined && !run.muro.caido ? 4 : 1);
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
