// Una partida: el campo, los enemigos que aparecen y pasean, tu círculo donde caen flechas, el mago
// con sus explosiones de fuego cuadradas y los arqueros que tiran a un objetivo a la vez. Lógica pura: la escena
// llama a stepRun cada cuadro (a través del controlador) y dibuja los eventos.
import { damageMultiplier, effectiveness, ENEMIES, levelConfig, LLEGADA, MAX_VIVOS, PRIMERA_OLA, type DamageType, type EnemyKind, type LevelConfig } from './datos';
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
  sx: number;
  sy: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  danio: number;
}

/** Velocidad de las piedras (unidades por segundo). */
const PEBBLE_SPEED = 170;

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
  | { type: 'sling'; id: number; x: number; y: number }
  | { type: 'wallHit'; x: number; y: number; danio: number; vida: number; max: number }
  | { type: 'wallDown' }
  /** Se acabó: `gano` si se reventaron todos los slimes del nivel antes de que se acabara el tiempo. */
  | { type: 'end'; gano: boolean };

export interface Run {
  stats: Stats;
  /** Lo que queda libre arriba (bajo la barra del nivel y el reloj): ahí no aparecen ni pasean slimes. */
  arriba: number;
  nivel: LevelConfig;
  /** Cuántos slimes del nivel ya salieron. */
  salieron: number;
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

export function createRun(stats: Stats, h: number, nivel = 1, seed = Date.now(), arriba = MARGIN): Run {
  const alto = Math.max(240, h);
  return {
    stats,
    arriba: Math.min(alto / 3, Math.max(MARGIN, arriba)),
    nivel: levelConfig(nivel),
    salieron: 0,
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
  const primeros = Math.ceil(run.nivel.total * PRIMERA_OLA);
  for (let i = 0; i < primeros; i++) spawn(run, events);
  return events;
}

/** Mueve el círculo (se queda donde tocó el jugador, dentro del campo). */
export function moveCursor(run: Run, x: number, y: number): void {
  run.cursor.x = Math.min(run.w, Math.max(0, x));
  run.cursor.y = Math.min(run.h, Math.max(0, y));
}

const bottom = (run: Run) => run.h - ALLY_ROW - MARGIN;

function spawn(run: Run, events: RunEvent[]): void {
  const r = run.rng();
  const kind: EnemyKind = r < run.nivel.azules ? 'azul' : r < run.nivel.azules + run.nivel.rojos ? 'rojo' : 'verde';
  const def = ENEMIES[kind];
  const vida = def.vida * run.nivel.vida;
  run.salieron++;
  const angle = run.rng() * Math.PI * 2;
  const enemy: Enemy = {
    id: run.nextId++,
    kind,
    x: between(run.rng, MARGIN, run.w - MARGIN),
    y: between(run.rng, run.arriba, bottom(run)),
    vx: Math.cos(angle) * def.velocidad,
    vy: Math.sin(angle) * def.velocidad,
    vida,
    vidaMax: vida,
    giro: between(run.rng, 1, 3),
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
  const danio = base * damageMultiplier(e.kind, tipo);
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

/** Avanza la partida `dt` segundos. */
export function stepRun(run: Run, dt: number): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.terminada) return events;
  const s = run.stats;
  const step = Math.min(dt, s.duracion - run.t);
  run.t += step;

  // Pasean: cambian de rumbo de vez en cuando y rebotan en las orillas.
  for (const e of run.enemies) {
    e.giro -= step;
    if (e.giro <= 0) {
      const speed = ENEMIES[e.kind].velocidad * between(run.rng, 0.5, 1.4);
      const angle = run.rng() * Math.PI * 2;
      e.vx = Math.cos(angle) * speed;
      e.vy = Math.sin(angle) * speed;
      e.giro = between(run.rng, 1, 3);
    }
    e.x += e.vx * step;
    e.y += e.vy * step;
    if (e.x < MARGIN || e.x > run.w - MARGIN) e.vx = -e.vx;
    if (e.y < run.arriba || e.y > bottom(run)) e.vy = -e.vy;
    e.x = Math.min(run.w - MARGIN, Math.max(MARGIN, e.x));
    e.y = Math.min(bottom(run), Math.max(run.arriba, e.y));
  }

  // Llega el resto de los slimes del nivel (más rápido con "Atraer slimes").
  const resto = run.nivel.total - Math.ceil(run.nivel.total * PRIMERA_OLA);
  run.acumulado += (resto / LLEGADA) * s.ritmo * step;
  while (run.acumulado >= 1 && run.salieron < run.nivel.total && run.enemies.length < MAX_VIVOS) {
    run.acumulado -= 1;
    spawn(run, events);
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
  // Los rojos le tiran piedras a la muralla.
  for (const e of run.enemies) {
    if (e.tiro === undefined || e.vida <= 0 || run.muro.caido) continue;
    e.tiro -= step;
    if (e.tiro > 0) continue;
    const def = ENEMIES[e.kind];
    e.tiro += (def.tiro ?? 3) * between(run.rng, 0.8, 1.2);
    const tx = between(run.rng, 12, run.w - 12);
    const ty = run.h - ALLY_ROW + 14;
    run.piedras.push({ id: run.nextId++, sx: e.x, sy: e.y - 8, x: e.x, y: e.y - 8, tx, ty, danio: def.ataque * run.nivel.ataque });
    events.push({ type: 'sling', id: e.id, x: e.x, y: e.y });
  }
  for (const p of run.piedras) {
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    const paso = PEBBLE_SPEED * step;
    if (d > paso) {
      p.x += (dx / d) * paso;
      p.y += (dy / d) * paso;
      continue;
    }
    p.x = p.tx;
    p.y = p.ty;
    p.id = -1;
    if (run.muro.caido) continue;
    run.muro.vida = Math.max(0, run.muro.vida - p.danio);
    events.push({ type: 'wallHit', x: p.tx, y: p.ty, danio: p.danio, vida: run.muro.vida, max: run.muro.max });
    if (run.muro.vida <= 0) {
      run.muro.caido = true;
      events.push({ type: 'wallDown' });
    }
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

  if (run.reventados >= run.nivel.total) {
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
  const peso = (e: Enemy) => (e.tiro !== undefined && !run.muro.caido ? 4 : 1);
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
