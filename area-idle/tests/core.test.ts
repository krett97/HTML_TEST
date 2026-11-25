import { describe, expect, it } from 'vitest';
import { playAndShop, simulatePlay } from '../src/core/bot';
import { activeGoldPerMinute, idleGoldPerMinute, idleReward, idleUnlocked } from '../src/core/inactivo';
import { isBossLevel, JEFE, JEFES, bossFor, zoneOf, DESDE, INACTIVO, ROJO_DESDE, AZUL_DESDE, DAMAGE_TYPES, damageMultiplier, ENEMIES, levelConfig, PRIMERA_OLA, SECCIONES, TALENT_BY_ID, TALENTS } from '../src/core/datos';
import { formatClock, formatNum } from '../src/core/format';
import { buyTalent, chooseLevel, costOf, createMeta, finishRun, levelOf, loadMeta, talentState, talentVisible } from '../src/core/meta';
import { ALLY_ROW, archerSpots, bossOf, createRun, DAMAGE_TYPE_OF, FIELD_W, moveCursor, startRun, stepRun, type Run, type RunEvent } from '../src/core/run';
import { computeStats } from '../src/core/stats';

/** Una partida vacía con un enemigo puesto a mano. */
function withEnemy(run: Run, x: number, y: number, vida = 3): void {
  run.enemies.push({ id: 999, kind: 'verde', x, y, vx: 0, vy: 0, vida, vidaMax: vida, giro: 99 });
}

describe('formato', () => {
  it('abrevia con K, M, B', () => {
    expect(formatNum(999)).toBe('999');
    expect(formatNum(1500)).toBe('1.5K');
    expect(formatNum(2_300_000)).toBe('2.3M');
    expect(formatNum(0.5)).toBe('0.5');
  });
  it('reloj', () => {
    expect(formatClock(19.2)).toBe('00:20');
    expect(formatClock(75)).toBe('01:15');
    expect(formatClock(-3)).toBe('00:00');
  });
});

describe('estadísticas', () => {
  it('sin talentos', () => {
    const s = computeStats({});
    expect(s.danio).toBe(1);
    expect(s.duracion).toBe(20);
    expect(s.mago.activo).toBe(false);
    expect(s.fuego.activo).toBe(false);
    expect(s.ritmo).toBe(1);
    expect(s.premioMult).toBe(1);
  });
  it('el daño se duplica cada 10 niveles', () => {
    expect(computeStats({ danio: 9 }).danio).toBe(10);
    expect(computeStats({ danio: 10 }).danio).toBe(22);
  });
  it('tiempo suma 2 s por nivel', () => {
    expect(computeStats({ tiempo: 3 }).duracion).toBe(26);
  });
});

describe('partida', () => {
  it('el disparo daña a todos los del círculo y a nadie fuera', () => {
    const run = createRun(computeStats({}), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    moveCursor(run, 100, 100);
    withEnemy(run, 110, 100);
    withEnemy(run, 300, 400);
    run.enemies[1]!.id = 1000;
    // Las flechas tardan en caer: el daño llega al aterrizar.
    expect(stepRun(run, 0.1).some((e) => e.type === 'hit')).toBe(false);
    const events = stepRun(run, 0.25);
    expect(events.some((e) => e.type === 'impact')).toBe(true);
    const hits = events.filter((e) => e.type === 'hit');
    expect(hits).toHaveLength(1);
    expect(run.enemies.find((e) => e.id === 999)!.vida).toBe(2);
    expect(run.enemies.find((e) => e.id === 1000)!.vida).toBe(3);
  });
  it('al reventar da oro y cuenta', () => {
    const run = createRun(computeStats({ oro: 2 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    moveCursor(run, 100, 100);
    withEnemy(run, 100, 100, 1);
    const events = stepRun(run, 0.4);
    const kill = events.find((e) => e.type === 'kill');
    expect(kill).toBeDefined();
    expect(run.oro).toBeCloseTo(ENEMIES.verde.oro * 1.6);
    expect(run.reventados).toBe(1);
    expect(run.enemies).toHaveLength(0);
  });
  it('dispara solo, cada intervalo', () => {
    const run = createRun(computeStats({}), 560, 1, 1);
    let shots = 0;
    for (let i = 0; i < 60; i++) shots += stepRun(run, 0.05).filter((e) => e.type === 'shot').length;
    // 3 s con un disparo cada 0.6 s (el primero a los 0.15 s): 5.
    expect(shots).toBe(5);
  });
  it('el círculo no sale del campo', () => {
    const run = createRun(computeStats({}), 500, 1, 1);
    moveCursor(run, -50, 9999);
    expect(run.cursor).toEqual({ x: 0, y: 500 });
  });
  it('cada nivel trae su cantidad fija de slimes: una parte al empezar y el resto después', () => {
    const run = createRun(computeStats({}), 560, 1, 3);
    expect(run.nivel.total).toBe(15);
    startRun(run);
    expect(run.enemies).toHaveLength(Math.ceil(15 * PRIMERA_OLA));
    run.cursor = { x: -999, y: -999 };
    for (let i = 0; i < 150; i++) stepRun(run, 0.1);
    expect(run.salieron).toBe(15);
    expect(run.enemies).toHaveLength(15);
    // Nadie se mete en la fila de abajo, donde están el mago y los arqueros, ni bajo lo de arriba.
    const conArriba = createRun(computeStats({}), 560, 1, 3, 80);
    startRun(conArriba);
    for (let i = 0; i < 100; i++) stepRun(conArriba, 0.1);
    expect(conArriba.enemies.every((e) => e.y >= 80)).toBe(true);
    expect(run.enemies.every((e) => e.x >= 0 && e.x <= FIELD_W && e.y >= 0 && e.y <= run.h - ALLY_ROW)).toBe(true);
  });
  it('si se acaba el tiempo, se pierde el nivel', () => {
    const run = createRun(computeStats({}), 560, 1, 1);
    run.cursor = { x: -999, y: -999 };
    let end: RunEvent | undefined;
    for (let i = 0; i < 500 && !end; i++) end = stepRun(run, 0.1).find((e) => e.type === 'end');
    expect(end).toEqual({ type: 'end', gano: false });
    expect(run.gano).toBe(false);
    expect(run.t).toBeCloseTo(20);
    expect(stepRun(run, 1)).toEqual([]);
  });
  it('el mago revienta un cuadrado donde hay alguien', () => {
    const run = createRun(computeStats({ mago: 1 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    withEnemy(run, 200, 300, 100);
    const events: RunEvent[] = [];
    for (let i = 0; i < 40; i++) events.push(...stepRun(run, 0.1));
    const magia = events.filter((e) => e.type === 'shot' && e.fuente === 'mago');
    expect(magia.length).toBeGreaterThan(0);
    // Cuadrada: igual de ancho que de alto.
    expect(magia.every((e) => e.type === 'shot' && e.forma.tipo === 'rect' && e.forma.w === e.forma.h)).toBe(true);
    expect(events.some((e) => e.type === 'hit' && e.fuente === 'mago')).toBe(true);
  });
  it('el fuego del mago sigue quemando', () => {
    const run = createRun(computeStats({ mago: 1, fuego: 1 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0, intervalo: 100 };
    run.cursor = { x: -999, y: -999 };
    withEnemy(run, 100, 100, 500);
    const events: RunEvent[] = [];
    for (let i = 0; i < 60; i++) events.push(...stepRun(run, 0.05));
    expect(events.some((e) => e.type === 'fire')).toBe(true);
    expect(events.filter((e) => e.type === 'hit' && e.fuente === 'fuego').length).toBeGreaterThan(1);
  });
  it('sin mago no hay fuego aunque se tenga el talento', () => {
    expect(computeStats({ fuego: 1 }).fuego.activo).toBe(false);
  });
  it('los arqueros tiran a un objetivo a la vez y luego a varios', () => {
    const uno = computeStats({ arqueros: 1 });
    expect(uno.arqueros).toMatchObject({ cantidad: 1, objetivos: 1 });
    expect(computeStats({ arqueros: 1, multiflecha: 2, masArqueros: 1 }).arqueros).toMatchObject({ cantidad: 2, objetivos: 3 });
    expect(computeStats({}).arqueros.cantidad).toBe(0);

    const run = createRun(computeStats({ arqueros: 1, multiflecha: 1 }), 560, 1, 1);
    // Una sola tanda (el primer tiro sale a los 0.3 s).
    run.stats = { ...run.stats, ritmo: 0, arqueros: { ...run.stats.arqueros, intervalo: 100 } };
    run.cursor = { x: -999, y: -999 };
    withEnemy(run, 100, 100, 100);
    withEnemy(run, 250, 200, 100);
    run.enemies[1]!.id = 1000;
    expect(archerSpots(run)).toHaveLength(1);
    const events: RunEvent[] = [];
    for (let i = 0; i < 60; i++) events.push(...stepRun(run, 0.05));
    expect(events.filter((e) => e.type === 'volley')).toHaveLength(1);
    const heridos = new Set(events.filter((e) => e.type === 'hit' && e.fuente === 'arquero').map((e) => (e.type === 'hit' ? e.id : 0)));
    // Dos objetivos por tiro: los dos reciben su flecha, cada una a uno solo.
    expect(heridos).toEqual(new Set([999, 1000]));
    expect(run.enemies.every((e) => e.vida === 100 - computeStats({ arqueros: 1 }).arqueros.danio)).toBe(true);
  });
});

describe('niveles', () => {
  it('se gana al reventar todos los slimes del nivel antes de tiempo', () => {
    const run = createRun({ ...computeStats({ danio: 9 }), radio: 999, intervalo: 0.2, ritmo: 5 }, 560, 1, 1);
    startRun(run);
    let end: RunEvent | undefined;
    for (let i = 0; i < 400 && !end; i++) end = stepRun(run, 0.05).find((e) => e.type === 'end');
    expect(end).toEqual({ type: 'end', gano: true });
    expect(run.reventados).toBe(run.nivel.total);
    expect(run.t).toBeLessThan(20);
  });
  it('cada nivel trae más slimes, con más vida y más oro; los azules salen desde el nivel 4', () => {
    const [uno, dos, diez] = [levelConfig(1), levelConfig(2), levelConfig(10)];
    expect(dos.total).toBeGreaterThan(uno.total);
    expect(diez.vida).toBeGreaterThan(dos.vida);
    expect(diez.oro).toBeGreaterThan(uno.oro);
    expect(diez.premio).toBeGreaterThan(uno.premio);
    expect(levelConfig(AZUL_DESDE - 1).azules).toBe(0);
    expect(levelConfig(AZUL_DESDE).azules).toBeGreaterThan(0);
    const run = createRun(computeStats({}), 560, 5, 1);
    startRun(run);
    expect(run.enemies[0]!.vidaMax).toBeCloseTo(ENEMIES[run.enemies[0]!.kind].vida * levelConfig(5).vida);
  });
  it('ganar abre el siguiente nivel y da premio; perder deja el oro juntado', () => {
    const meta = createMeta();
    const premio = finishRun(meta, { oro: 10, reventados: 15, gano: true, nivel: 1 });
    expect(premio).toBe(levelConfig(1).premio);
    expect(meta.oro).toBe(10 + premio);
    expect(meta).toMatchObject({ nivel: 2, jugando: 2 });
    expect(finishRun(meta, { oro: 7, reventados: 5, gano: false, nivel: 2 })).toBe(0);
    expect(meta.oro).toBe(17 + premio);
    expect(meta).toMatchObject({ nivel: 2, jugando: 2 });
    // Volver a un nivel anterior para juntar oro no cambia el más alto.
    chooseLevel(meta, 1);
    finishRun(meta, { oro: 5, reventados: 15, gano: true, nivel: 1 });
    expect(meta).toMatchObject({ nivel: 2, jugando: 1 });
    chooseLevel(meta, 9);
    expect(meta.jugando).toBe(2);
  });
  it('el Botín sube el premio', () => {
    const meta = createMeta();
    meta.talentos.botin = 4;
    expect(finishRun(meta, { oro: 0, reventados: 15, gano: true, nivel: 1 })).toBe(Math.round(levelConfig(1).premio * 2));
  });
});

describe('jefes', () => {
  it('el nivel 10 es de jefe (y cada 10), con más tiempo y premio ×5', () => {
    expect(isBossLevel(9)).toBe(false);
    expect(isBossLevel(10)).toBe(true);
    expect(levelConfig(10).jefe?.kind).toBe('rey');
    expect(levelConfig(11).jefe).toBeNull();
    expect(levelConfig(20).jefe!.vida).toBeGreaterThan(levelConfig(10).jefe!.vida);
    const run = createRun(computeStats({}), 560, 10, 1);
    expect(run.stats.duracion).toBe(20 + JEFE.extra);
    expect(levelConfig(10).premio).toBe(Math.round(8 * Math.pow(1.12, 9) * JEFE.premio));
  });
  it('sale con su escolta, invoca más y brinca a otro lado', () => {
    const run = createRun(computeStats({}), 560, 10, 1);
    run.cursor = { x: -999, y: -999 };
    const inicio = startRun(run);
    expect(inicio.filter((e) => e.type === 'spawn')).toHaveLength(1 + JEFES.rey!.inicial);
    const boss = bossOf(run)!;
    expect(boss.kind).toBe('rey');
    expect(boss.vida).toBe(levelConfig(10).jefe!.vida);
    const events: RunEvent[] = [];
    for (let i = 0; i < 130; i++) events.push(...stepRun(run, 0.05));
    expect(events.filter((e) => e.type === 'bossSummon')).toHaveLength(2);
    const salto = events.find((e) => e.type === 'bossJump');
    expect(salto).toBeDefined();
    if (salto?.type === 'bossJump') expect(Math.hypot(boss.x - salto.tx, boss.y - salto.ty)).toBeLessThan(1);
  });
  it('lanza bolas de baba a la muralla, cae aturdido (recibe ×2) y a media vida se enfurece', () => {
    const run = createRun(computeStats({}), 560, 10, 1);
    run.cursor = { x: -999, y: -999 };
    startRun(run);
    const events: RunEvent[] = [];
    for (let i = 0; i < 160; i++) events.push(...stepRun(run, 0.05));
    expect(events.some((e) => e.type === 'bossThrow')).toBe(true);
    const golpe = events.find((e) => e.type === 'wallHit' && Math.abs(e.danio - JEFES.rey!.golpe * levelConfig(10).ataque) < 1e-9);
    expect(golpe).toBeDefined();
    const caida = events.find((e) => e.type === 'bossStun');
    expect(caida).toBeDefined();
    // Aturdido: el siguiente disparo le pega doble.
    const boss = bossOf(run)!;
    run.jefe!.aturdido = 1;
    run.cursor = { x: boss.x, y: boss.y };
    run.disparo = 0;
    const antes = boss.vida;
    const golpes: RunEvent[] = [];
    for (let i = 0; i < 6; i++) golpes.push(...stepRun(run, 0.05));
    const alJefe = golpes.find((e) => e.type === 'hit' && e.id === boss.id);
    expect(alJefe).toMatchObject({ danio: run.stats.danio * 2 });
    expect(boss.vida).toBeLessThan(antes);
    // Furia a media vida.
    boss.vida = boss.vidaMax * 0.4;
    expect(stepRun(run, 0.05).some((e) => e.type === 'bossRage')).toBe(true);
    expect(run.jefe!.furia).toBe(true);
  });
  it('esquiva tu círculo caminando, salvo aturdido', () => {
    const run = createRun(computeStats({}), 560, 10, 1);
    startRun(run);
    run.enemies = run.enemies.filter((e) => e.kind === 'rey');
    run.jefe!.brinco = 99;
    run.jefe!.def = { ...run.jefe!.def };
    run.jefe!.invoca = 99;
    run.jefe!.lanza = 99;
    const boss = bossOf(run)!;
    boss.x = 180;
    boss.y = 250;
    run.cursor = { x: 170, y: 250 };
    stepRun(run, 0.5);
    expect(boss.x).toBeGreaterThan(185);
    // Lejos del círculo, se queda quieto.
    run.cursor = { x: 10, y: 450 };
    const x = boss.x;
    stepRun(run, 0.5);
    expect(boss.x).toBe(x);
    // Aturdido, no esquiva.
    run.cursor = { x: boss.x - 5, y: boss.y };
    run.jefe!.aturdido = 1;
    stepRun(run, 0.3);
    expect(boss.x).toBe(x);
  });
  it('se gana al vencer al jefe (y su escolta revienta); reventar escoltas no basta', () => {
    const run = createRun(computeStats({}), 560, 10, 1);
    run.cursor = { x: -999, y: -999 };
    startRun(run);
    for (const e of run.enemies) if (e.kind !== 'rey') e.vida = 0.001;
    run.enemies = run.enemies.filter((e) => e.kind === 'rey');
    run.reventados = 500;
    expect(stepRun(run, 0.05).some((e) => e.type === 'end')).toBe(false);
    bossOf(run)!.vida = 0.5;
    run.cursor = { x: bossOf(run)!.x, y: bossOf(run)!.y };
    run.disparo = 0;
    const events: RunEvent[] = [];
    for (let i = 0; i < 20 && !events.some((e) => e.type === 'end'); i++) events.push(...stepRun(run, 0.05));
    expect(events.find((e) => e.type === 'end')).toEqual({ type: 'end', gano: true });
    expect(events.some((e) => e.type === 'kill' && e.kind === 'rey')).toBe(true);
    expect(run.enemies).toHaveLength(0);
  });
});

describe('segunda zona: campo de batalla', () => {
  it('del 11 al 20 cambia la zona y salen goblins, lobos, orcos y orcos arqueros', () => {
    expect(zoneOf(10)).toBe('campo');
    expect(zoneOf(11)).toBe('batalla');
    const once = levelConfig(11).mezcla.map(([k]) => k);
    expect(once).toEqual(expect.arrayContaining(['goblin', 'lobo']));
    expect(once).not.toContain('verde');
    expect(levelConfig(12).mezcla.map(([k]) => k)).not.toContain('orco');
    expect(levelConfig(DESDE.orco).mezcla.map(([k]) => k)).toContain('orco');
    expect(levelConfig(DESDE.orcoArquero).mezcla.map(([k]) => k)).toContain('orcoArquero');
    for (const n of [1, 5, 11, 15, 19]) expect(levelConfig(n).mezcla.reduce((t, [, p]) => t + p, 0)).toBeCloseTo(1);
  });
  it('el jefe del 20 es el Lobo Blanco y llama lobos; los jefes se alternan', () => {
    expect(bossFor(10)).toBe('rey');
    expect(bossFor(20)).toBe('loboBlanco');
    expect(bossFor(30)).toBe('rey');
    const run = createRun(computeStats({}), 560, 20, 1);
    const inicio = startRun(run);
    expect(bossOf(run)!.kind).toBe('loboBlanco');
    expect(inicio.filter((e) => e.type === 'spawn' && e.kind === 'lobo')).toHaveLength(JEFES.loboBlanco!.inicial);
    run.cursor = { x: -999, y: -999 };
    const events: RunEvent[] = [];
    for (let i = 0; i < 120; i++) events.push(...stepRun(run, 0.05));
    expect(events.some((e) => e.type === 'bossThrow')).toBe(true);
    expect(events.some((e) => e.type === 'bossJump' && e.dura === JEFES.loboBlanco!.dura)).toBe(true);
  });
  it('los goblins lanzan lanzas y los orcos arqueros flechas a la muralla', () => {
    const run = createRun(computeStats({}), 560, 15, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    run.enemies.push({ id: 700, kind: 'goblin', x: 100, y: 200, vx: 0, vy: 0, vida: 999, vidaMax: 999, giro: 99, tiro: 0.01 });
    run.enemies.push({ id: 701, kind: 'orcoArquero', x: 250, y: 200, vx: 0, vy: 0, vida: 999, vidaMax: 999, giro: 99, tiro: 0.01 });
    const events: RunEvent[] = [];
    for (let i = 0; i < 5; i++) events.push(...stepRun(run, 0.05));
    const tipos = events.filter((e) => e.type === 'sling').map((e) => (e.type === 'sling' ? e.tipo : ''));
    expect(tipos).toEqual(expect.arrayContaining(['lanza', 'flecha']));
    expect(run.piedras.map((p) => p.tipo).sort()).toEqual(['flecha', 'lanza']);
  });
  it('los orcos marchan hasta la muralla y la golpean de cerca', () => {
    const run = createRun(computeStats({}), 560, 13, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    run.enemies.push({ id: 800, kind: 'orco', x: 180, y: 420, vx: 0, vy: ENEMIES.orco.velocidad, vida: 999, vidaMax: 999, giro: 99, tiro: 0.01 });
    const events: RunEvent[] = [];
    for (let i = 0; i < 400; i++) events.push(...stepRun(run, 0.1));
    const orco = run.enemies.find((e) => e.id === 800)!;
    expect(orco.y).toBeGreaterThan(560 - ALLY_ROW - 20);
    expect(events.some((e) => e.type === 'sling' && e.tipo === 'golpe')).toBe(true);
    expect(run.muro.vida).toBeLessThan(run.muro.max);
  });
  it('orcos y orcos arqueros resisten las flechas; el fuego les duele; los lobos son débiles a lo físico', () => {
    expect(damageMultiplier('orco', 'fisico')).toBe(0.5);
    expect(damageMultiplier('orcoArquero', 'fuego')).toBe(1.5);
    expect(damageMultiplier('lobo', 'fisico')).toBe(1.5);
    expect(damageMultiplier('loboBlanco', 'hielo')).toBe(0.5);
  });
});

describe('slime rojo y muralla', () => {
  const rojo = (run: Run, x: number, y: number, tiro = 0.01) =>
    run.enemies.push({ id: 500, kind: 'rojo', x, y, vx: 0, vy: 0, vida: 100, vidaMax: 100, giro: 99, tiro });
  it('los rojos salen desde el nivel 7', () => {
    expect(levelConfig(ROJO_DESDE - 1).rojos).toBe(0);
    expect(levelConfig(ROJO_DESDE).rojos).toBeGreaterThan(0);
    expect(levelConfig(ROJO_DESDE + 10).ataque).toBeGreaterThan(levelConfig(ROJO_DESDE).ataque);
  });
  it('tiran piedras a la muralla y le bajan vida', () => {
    const run = createRun(computeStats({}), 560, ROJO_DESDE, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    rojo(run, 180, 200);
    const events: RunEvent[] = [];
    // La piedra tarda en llegar (vuela a 170 unidades por segundo).
    for (let i = 0; i < 60; i++) events.push(...stepRun(run, 0.05));
    expect(events.some((e) => e.type === 'sling')).toBe(true);
    const golpe = events.find((e) => e.type === 'wallHit');
    expect(golpe).toMatchObject({ danio: ENEMIES.rojo.ataque });
    expect(run.muro.vida).toBe(run.muro.max - ENEMIES.rojo.ataque);
  });
  it('si cae la muralla, el mago y los arqueros dejan de atacar el resto del nivel', () => {
    const run = createRun(computeStats({ mago: 1, arqueros: 1 }), 560, ROJO_DESDE, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    withEnemy(run, 100, 100, 1e9);
    run.muro.vida = 1;
    rojo(run, 180, 200);
    const events: RunEvent[] = [];
    for (let i = 0; i < 60; i++) events.push(...stepRun(run, 0.05));
    expect(events.some((e) => e.type === 'wallDown')).toBe(true);
    expect(run.muro).toMatchObject({ vida: 0, caido: true });
    const despues: RunEvent[] = [];
    for (let i = 0; i < 100; i++) despues.push(...stepRun(run, 0.05));
    expect(despues.some((e) => e.type === 'shot' && e.fuente === 'mago')).toBe(false);
    expect(despues.some((e) => e.type === 'volley')).toBe(false);
    expect(despues.some((e) => e.type === 'sling')).toBe(false);
  });
  it('Muralla reforzada sube su vida; los rojos son débiles al daño físico', () => {
    expect(computeStats({ muralla: 4 }).muro.vida).toBe(computeStats({}).muro.vida * 3);
    expect(damageMultiplier('rojo', 'fisico')).toBe(1.5);
  });
});

describe('oro mientras no juegas', () => {
  const HORA = 3600 * 1000;
  const conNivel = (nivel: number) => {
    const meta = createMeta();
    meta.nivel = nivel;
    meta.ultimaVez = 1_000_000;
    return meta;
  };
  it('se abre al llegar al nivel 3', () => {
    expect(idleUnlocked(conNivel(2))).toBe(false);
    expect(idleReward(conNivel(2), 1_000_000 + HORA)).toBeNull();
    expect(idleUnlocked(conNivel(3))).toBe(true);
    expect(idleReward(conNivel(3), 1_000_000 + HORA)!.oro).toBeGreaterThan(0);
  });
  it('da una parte de lo que se gana jugando, por el tiempo fuera, hasta el tope de horas', () => {
    const meta = conNivel(5);
    const porMin = idleGoldPerMinute(meta);
    expect(porMin).toBeCloseTo(activeGoldPerMinute(meta) * INACTIVO.eficiencia);
    expect(idleReward(meta, 1_000_000 + HORA)!.oro).toBe(Math.floor(porMin * 60));
    const tres = idleReward(meta, 1_000_000 + 3 * HORA)!;
    expect(tres).toMatchObject({ segundos: 2 * 3600, tope: true, oro: Math.floor(porMin * 120) });
  });
  it('menos de un minuto o el reloj para atrás no cuentan; nunca guardado tampoco', () => {
    const meta = conNivel(5);
    expect(idleReward(meta, 1_000_000 + 30_000)).toBeNull();
    expect(idleReward(meta, 1_000_000 - HORA)).toBeNull();
    meta.ultimaVez = 0;
    expect(idleReward(meta, Date.now())).toBeNull();
  });
  it('Oro inactivo sube la parte; Bolsa grande, las horas; Ganancia de oro lo multiplica todo', () => {
    const meta = conNivel(5);
    const base = idleGoldPerMinute(meta);
    meta.talentos.inactivo = 2;
    expect(idleGoldPerMinute(meta)).toBeCloseTo((base * (INACTIVO.eficiencia + 2 * INACTIVO.porNivel)) / INACTIVO.eficiencia);
    meta.talentos.bolsa = 3;
    expect(idleReward(meta, 1_000_000 + 10 * HORA)!.segundos).toBe(5 * 3600);
    const sinOro = activeGoldPerMinute(meta);
    meta.talentos.oro = 2;
    expect(activeGoldPerMinute(meta)).toBeCloseTo(sinOro * 1.6);
    // Y el premio por nivel también.
    const m = createMeta();
    m.talentos.oro = 2;
    expect(finishRun(m, { oro: 0, reventados: 15, gano: true, nivel: 1 })).toBe(Math.round(levelConfig(1).premio * 1.6));
  });
  it('Oro inactivo pide haber llegado al nivel 3 (además de Ganancia de oro)', () => {
    const meta = createMeta();
    meta.oro = 1e9;
    meta.talentos.oro = 1;
    expect(talentState(meta, TALENT_BY_ID.inactivo)).toBe('bloqueado');
    meta.nivel = 3;
    expect(talentState(meta, TALENT_BY_ID.inactivo)).toBe('disponible');
    expect(buyTalent(meta, 'inactivo')).toBe(true);
  });
  it('el guardado recuerda cuándo se guardó', () => {
    const meta = conNivel(4);
    expect(loadMeta(JSON.parse(JSON.stringify(meta))).ultimaVez).toBe(1_000_000);
  });
});

describe('tipos de daño', () => {
  it('el verde es débil al fuego y el azul fuerte contra él', () => {
    const run = createRun(computeStats({ mago: 1 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0, mago: { ...run.stats.mago, intervalo: 100, lado: 400 } };
    run.mago = 0.01;
    run.cursor = { x: -999, y: -999 };
    withEnemy(run, 100, 100, 1000);
    run.enemies.push({ id: 1000, kind: 'azul', x: 120, y: 100, vx: 0, vy: 0, vida: 1000, vidaMax: 1000, giro: 99 });
    const events: RunEvent[] = [];
    for (let i = 0; i < 10; i++) events.push(...stepRun(run, 0.05));
    const golpe = run.stats.mago.danio;
    const aVerde = events.find((e) => e.type === 'hit' && e.id === 999);
    const aAzul = events.find((e) => e.type === 'hit' && e.id === 1000);
    expect(aVerde).toMatchObject({ danio: golpe * 1.5, efecto: 'debil' });
    expect(aAzul).toMatchObject({ danio: golpe * 0.5, efecto: 'fuerte' });
  });
  it('las flechas son daño físico: normal contra los dos slimes', () => {
    expect(DAMAGE_TYPE_OF.jugador).toBe('fisico');
    expect(DAMAGE_TYPE_OF.arquero).toBe('fisico');
    expect(DAMAGE_TYPE_OF.mago).toBe('fuego');
    expect(damageMultiplier('verde', 'fisico')).toBe(1);
    expect(damageMultiplier('azul', 'fisico')).toBe(1);
    expect(damageMultiplier('azul', 'hielo')).toBe(1.5);
  });
  it('cada enemigo es débil o fuerte solo a tipos que existen, y nunca a los dos a la vez', () => {
    for (const def of Object.values(ENEMIES)) {
      for (const tipo of [...def.debil, ...def.fuerte]) expect(DAMAGE_TYPES).toContain(tipo);
      expect(def.debil.filter((t) => def.fuerte.includes(t))).toEqual([]);
    }
  });
});

describe('árbol', () => {
  it('se compra con oro y sube de precio', () => {
    const meta = createMeta();
    meta.oro = 100;
    const precio = costOf(TALENT_BY_ID.danio, 0);
    expect(buyTalent(meta, 'danio')).toBe(true);
    expect(meta.oro).toBe(100 - precio);
    expect(levelOf(meta, 'danio')).toBe(1);
    expect(costOf(TALENT_BY_ID.danio, 1)).toBeGreaterThan(precio);
  });
  it('no se compra sin oro, bloqueado ni al máximo', () => {
    const meta = createMeta();
    expect(buyTalent(meta, 'danio')).toBe(false);
    meta.oro = 1e9;
    expect(talentState(meta, TALENT_BY_ID.mago)).toBe('bloqueado');
    expect(buyTalent(meta, 'mago')).toBe(false);
    meta.talentos.mago = 1;
    expect(talentState(meta, TALENT_BY_ID.mago)).toBe('maximo');
  });
  it('al principio solo se ve Daño; cada compra muestra lo que sale de ahí', () => {
    const meta = createMeta();
    expect(talentVisible(meta, TALENT_BY_ID.danio)).toBe(true);
    // Las raíces del mago y los arqueros se ven desde el principio, con candado.
    expect(talentVisible(meta, TALENT_BY_ID.mago)).toBe(true);
    expect(talentState(meta, TALENT_BY_ID.mago)).toBe('bloqueado');
    expect(talentVisible(meta, TALENT_BY_ID.magoDanio)).toBe(false);
    expect(talentVisible(meta, TALENT_BY_ID.radio)).toBe(false);
    meta.talentos.danio = 1;
    expect(talentVisible(meta, TALENT_BY_ID.radio)).toBe(true);
    expect(talentVisible(meta, TALENT_BY_ID.tiempo)).toBe(false);
    meta.talentos.radio = 1;
    expect(talentVisible(meta, TALENT_BY_ID.tiempo)).toBe(true);
  });
  it('tres secciones, cada una con una raíz; requisitos que existen y sin dos nodos en el mismo lugar', () => {
    for (const sec of SECCIONES) expect(TALENTS.filter((t) => t.seccion === sec && t.raiz)).toHaveLength(1);
    const lugares = new Set(TALENTS.map((t) => `${t.seccion}:${t.pos.join(',')}`));
    expect(lugares.size).toBe(TALENTS.length);
    for (const t of TALENTS) if (t.requiere) expect(TALENT_BY_ID[t.requiere.id]).toBeDefined();
  });
  it('terminar una partida guarda oro y récord', () => {
    const meta = createMeta();
    finishRun(meta, { oro: 50, reventados: 20, gano: false, nivel: 1 });
    finishRun(meta, { oro: 30, reventados: 10, gano: false, nivel: 1 });
    expect(meta.oro).toBe(80);
    expect(meta.mejor).toBe(50);
    expect(meta.partidas).toBe(2);
    expect(meta.reventados).toBe(30);
  });
});

describe('guardado', () => {
  it('ida y vuelta', () => {
    const meta = createMeta();
    meta.oro = 123;
    meta.talentos = { danio: 4, mago: 1 };
    expect(loadMeta(JSON.parse(JSON.stringify(meta)))).toEqual(meta);
  });
  it('tolera basura', () => {
    expect(loadMeta(null)).toEqual(createMeta());
    const m = loadMeta({ oro: -5, talentos: { danio: 999, inventado: 3 }, ajustes: { sonido: 'si' } });
    expect(m.oro).toBe(0);
    expect(m.talentos).toEqual({ danio: 40 });
    expect(m.ajustes.sonido).toBe(true);
  });
});

describe('modo pruebas: jugar tiempo simulado', () => {
  it('"+1 min de juego" juega partidas, compra y avanza sobre la partida guardada', () => {
    const meta = createMeta();
    const r = simulatePlay(meta, 60, 1);
    expect(r.partidas).toBeGreaterThanOrEqual(2);
    expect(r.desde).toBe(1);
    expect(r.hasta).toBe(meta.nivel);
    expect(meta.partidas).toBe(r.partidas);
    expect(r.compras).toBeGreaterThan(0);
    expect(levelOf(meta, 'danio')).toBeGreaterThan(0);
    const diez = simulatePlay(meta, 600, 2);
    expect(diez.hasta).toBeGreaterThan(diez.desde);
  });
});

describe('ritmo (bot)', () => {
  it('pierde a veces al principio, junta oro en el nivel anterior y avanza; abre arqueros y mago', () => {
    const meta = createMeta();
    const partidas = Array.from({ length: 20 }, (_, i) => playAndShop(meta, (i + 1) * 7919));
    expect(partidas.some((p) => !p.gano)).toBe(true);
    const perdida = partidas.findIndex((p) => !p.gano && p.nivel > 1);
    expect(partidas[perdida + 1]!.nivel).toBe(partidas[perdida]!.nivel - 1);
    expect(meta.nivel).toBeGreaterThan(8);
    expect(levelOf(meta, 'mago')).toBe(1);
    expect(levelOf(meta, 'arqueros')).toBe(1);
  });
});
