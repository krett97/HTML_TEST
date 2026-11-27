import { describe, expect, it } from 'vitest';
import { playAndShop, simulatePlay } from '../src/core/bot';
import { activeGoldPerMinute, idleGoldPerMinute, idleReward, idleUnlocked } from '../src/core/inactivo';
import { isBossLevel, JEFE, JEFES, bossFor, zoneOf, DESDE, INACTIVO, ROJO_DESDE, AZUL_DESDE, DAMAGE_TYPES, damageMultiplier, ENEMIES, levelConfig, PRIMERA_OLA, SECCIONES, TALENT_BY_ID, TALENTS } from '../src/core/datos';
import { formatClock, formatNum } from '../src/core/format';
import { buyTalent, chooseLevel, costOf, createMeta, finishRun, levelOf, loadMeta, talentState, talentVisible } from '../src/core/meta';
import { ARMADURA, bestSpot as mejorLugar, hidden, inAir, createSurvivalRun, jefesOla, runasOla, OLEADAS } from '../src/core/run';
import { EQUIPO, baseChance, bonosEquipo, chanceOf, costoPieza, emptyEquipo, loadEquipo, mejorar, NIVEL_MAX, SUERTE_POR_FALLO, tierDe } from '../src/core/equipo';
import { ENTRADAS_MAX, RECARGA_ENTRADA_MS, emptySupervivencia, nivelBaseOlas, refillEntradas, survivalUnlocked, usarEntrada } from '../src/core/supervivencia';
import { SUPERVIVENCIA_DESDE } from '../src/core/datos';
import { ANUNCIO, adGold, adStatus, canWatchAd, claimAdGold, loadAnuncios } from '../src/core/anuncios';
import { autoAiming, circleActive, createGuardRun, guardLevel, startGuardRun, updateGuardRun } from '../src/core/run';
import { AUTOAPUNTAR } from '../src/core/datos';
import { CURVA, GUARDIA, ORO_TALENTOS } from '../src/core/datos';
import { ALLY_ROW, archerSpots, bossOf, createRun, DAMAGE_TYPE_OF, FIELD_W, moveCursor, startRun, stepRun, type Run, type RunEvent } from '../src/core/run';
import { KNIGHT_R, priestSpot } from '../src/core/run';
import { BASE, CABALLERO_DESDE, SACERDOTE_DESDE } from '../src/core/datos';
import { computeStats } from '../src/core/stats';
import { BONO_DIARIO, claimableCount, claimBonus, claimMission, dailyProgress, dayKey, DIARIAS, DIARIAS_POR_DIA, MISSION_BY_ID, msUntilReset, permanentProgress, rollDaily } from '../src/core/misiones';
import { MISIONES_DESDE, PVP_DESDE, RANKING_DESDE } from '../src/core/datos';
import { comprimirPoder, myArmy, PODER, rivalArmy } from '../src/core/pvp';
import { buyShop, emptyPvp, endWeek, ESTANDARTE, fight, INTENTOS_MAX, leagueTable, LIGAS, loadPvp, msUntilWeekEnd, pointsFor, positionOf, powerOf, RECARGA_MS, refill, rivalsOf, shopCost, syncPvp, weekKey, winChance } from '../src/core/pvp';
import { formatDuration } from '../src/core/format';
import { cleanName, MAX_NAME, rankingEntry, rankingUnlocked, readRow, sortRows } from '../src/core/ranking';

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
    expect(run.oro).toBeCloseTo(ENEMIES.verde.oro * (1 + 2 * ORO_TALENTOS.oro));
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
    expect(finishRun(meta, { oro: 0, reventados: 15, gano: true, nivel: 1 })).toBe(Math.round(levelConfig(1).premio * (1 + 4 * ORO_TALENTOS.botin)));
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
    // El premio es una parte del oro de todos los enemigos del nivel; en los de jefe, ×5.
    expect(levelConfig(10).premio / levelConfig(9).premio).toBeGreaterThan(JEFE.premio);
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
  it('el jefe del 20 es el Lobo Blanco y llama lobos; luego vienen el Esqueleto Mago y el Líder, y se repiten', () => {
    expect(bossFor(10)).toBe('rey');
    expect(bossFor(20)).toBe('loboBlanco');
    expect(bossFor(30)).toBe('esqueletoMago');
    expect(bossFor(40)).toBe('liderBandido');
    expect(bossFor(50)).toBe('dragonAcero');
    expect(bossFor(60)).toBe('rey');
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
    // Lo que pega crece con el nivel (al principio, menos de lo que dice el enemigo).
    const danio = ENEMIES.rojo.ataque * levelConfig(ROJO_DESDE).ataque;
    expect(danio).toBeLessThan(ENEMIES.rojo.ataque);
    expect((golpe as { danio: number }).danio).toBeCloseTo(danio);
    expect(run.muro.vida).toBeCloseTo(run.muro.max - danio);
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
    expect(idleReward(meta, 1_000_000 + 10 * HORA)!.segundos).toBe((INACTIVO.horas + 3 * INACTIVO.horasPorNivel) * 3600);
    const sinOro = activeGoldPerMinute(meta);
    meta.talentos.oro = 2;
    expect(activeGoldPerMinute(meta)).toBeCloseTo(sinOro * (1 + 2 * ORO_TALENTOS.oro));
    // Y el premio por nivel también.
    const m = createMeta();
    m.talentos.oro = 2;
    expect(finishRun(m, { oro: 0, reventados: 15, gano: true, nivel: 1 })).toBe(Math.round(levelConfig(1).premio * (1 + 2 * ORO_TALENTOS.oro)));
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
  it('cuatro secciones, cada una con una raíz; requisitos que existen y sin dos nodos en el mismo lugar', () => {
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
    expect(m.talentos).toEqual({ danio: TALENT_BY_ID.danio.max });
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
    const partidas = Array.from({ length: 30 }, (_, i) => playAndShop(meta, (i + 1) * 7919));
    expect(partidas.some((p) => !p.gano)).toBe(true);
    const perdida = partidas.findIndex((p) => !p.gano && p.nivel > 1);
    expect(partidas[perdida + 1]!.nivel).toBe(partidas[perdida]!.nivel - 1);
    expect(meta.nivel).toBeGreaterThan(6);
    expect(levelOf(meta, 'mago')).toBe(1);
    expect(levelOf(meta, 'arqueros')).toBe(1);
  });
});

describe('misiones y gemas', () => {
  const HOY = new Date(2026, 10, 25, 15, 0).getTime();
  const MANANA = new Date(2026, 10, 26, 0, 5).getTime();
  const abierta = () => {
    const meta = createMeta();
    meta.nivel = MISIONES_DESDE;
    return meta;
  };
  it('se abren en el nivel 11', () => {
    const meta = createMeta();
    meta.nivel = MISIONES_DESDE - 1;
    expect(rollDaily(meta, HOY)).toBe(false);
    expect(meta.misiones.diarias).toHaveLength(0);
    expect(claimableCount(meta)).toBe(0);
    meta.nivel = MISIONES_DESDE;
    expect(rollDaily(meta, HOY)).toBe(true);
    expect(meta.misiones.diarias).toHaveLength(DIARIAS_POR_DIA);
    expect(new Set(meta.misiones.diarias).size).toBe(DIARIAS_POR_DIA);
  });
  it('las diarias son las mismas todo el día, cambian a medianoche y no piden enemigos que aún no salen', () => {
    const a = abierta();
    const b = abierta();
    rollDaily(a, HOY);
    rollDaily(b, HOY + 3600_000);
    expect(b.misiones.diarias).toEqual(a.misiones.diarias);
    expect(rollDaily(a, HOY + 60_000)).toBe(false);
    expect(dayKey(MANANA)).not.toBe(dayKey(HOY));
    expect(msUntilReset(HOY)).toBe(9 * 3600_000);
    for (let d = 0; d < 40; d++) {
      const m = abierta();
      rollDaily(m, HOY + d * 86_400_000);
      for (const id of m.misiones.diarias) expect(MISSION_BY_ID[id]!.desde ?? 0).toBeLessThanOrEqual(MISIONES_DESDE);
    }
    expect(DIARIAS.some((d) => (d.desde ?? 0) > MISIONES_DESDE)).toBe(true);
  });
  it('las diarias cuentan desde que empieza el día; se cobran una vez y las 3 dan bono', () => {
    const meta = abierta();
    meta.cuenta.reventados = 5000;
    meta.cuenta.partidas = 300;
    meta.cuenta.ganados = 200;
    rollDaily(meta, HOY);
    meta.misiones.diarias = ['reventar', 'partidas', 'ganar'];
    expect(dailyProgress(meta).every((p) => p.actual === 0 && !p.completa)).toBe(true);
    expect(claimMission(meta, 'reventar')).toBe(0);
    finishRun(meta, { oro: 0, reventados: 700, gano: true, nivel: 1 });
    const [reventar] = dailyProgress(meta);
    expect(reventar).toMatchObject({ actual: MISSION_BY_ID.reventar!.meta, completa: true, cobrada: false });
    expect(claimMission(meta, 'reventar')).toBe(MISSION_BY_ID.reventar!.gemas);
    expect(claimMission(meta, 'reventar')).toBe(0);
    expect(meta.gemas).toBe(MISSION_BY_ID.reventar!.gemas);
    for (let i = 0; i < 9; i++) finishRun(meta, { oro: 0, reventados: 1, gano: true, nivel: 1 });
    expect(claimBonus(meta)).toBe(0);
    claimMission(meta, 'partidas');
    claimMission(meta, 'ganar');
    expect(claimBonus(meta)).toBe(BONO_DIARIO);
    expect(claimBonus(meta)).toBe(0);
    // Al día siguiente, otras diarias que vuelven a empezar de cero.
    rollDaily(meta, MANANA);
    expect(meta.misiones.cobradas).toHaveLength(0);
    expect(dailyProgress(meta).every((p) => p.actual === 0)).toBe(true);
  });
  it('las permanentes se cobran una sola vez (nivel, jefes, orcos…)', () => {
    const meta = abierta();
    meta.nivel = 15;
    expect(claimMission(meta, 'nivel15')).toBe(MISSION_BY_ID.nivel15!.gemas);
    expect(claimMission(meta, 'nivel15')).toBe(0);
    expect(claimMission(meta, 'nivel20')).toBe(0);
    expect(claimMission(meta, 'rey')).toBe(0);
    finishRun(meta, { oro: 0, reventados: 50, gano: true, nivel: 10, jefe: 'rey', porTipo: { orco: 100 } });
    expect(claimMission(meta, 'rey')).toBe(MISSION_BY_ID.rey!.gemas);
    expect(claimMission(meta, 'orcos100')).toBe(MISSION_BY_ID.orcos100!.gemas);
    expect(permanentProgress(meta).filter((p) => p.cobrada).map((p) => p.def.id).sort()).toEqual(['nivel15', 'orcos100', 'rey']);
  });
  it('terminar una partida lleva la cuenta (ganadas, sin perder la muralla, por tipo, jefes)', () => {
    const meta = createMeta();
    finishRun(meta, { oro: 0, reventados: 20, gano: true, nivel: 1, muroCaido: false, porTipo: { verde: 20 } });
    finishRun(meta, { oro: 0, reventados: 5, gano: true, nivel: 2, muroCaido: true });
    finishRun(meta, { oro: 0, reventados: 3, gano: false, nivel: 3 });
    expect(meta.cuenta).toMatchObject({ partidas: 3, reventados: 28, ganados: 2, intacta: 1, porTipo: { verde: 20 } });
  });
  it('las Reliquias se pagan con gemas, no con oro, y se abren con las misiones', () => {
    const meta = createMeta();
    meta.oro = 1e9;
    const poder = TALENT_BY_ID.poder;
    expect(poder.moneda).toBe('gemas');
    expect(talentState(meta, poder)).toBe('bloqueado');
    meta.nivel = MISIONES_DESDE;
    expect(talentState(meta, poder)).toBe('disponible');
    expect(buyTalent(meta, 'poder')).toBe(false);
    meta.gemas = costOf(poder, 0);
    expect(buyTalent(meta, 'poder')).toBe(true);
    expect(meta.gemas).toBe(0);
    expect(meta.oro).toBe(1e9);
    expect(computeStats({ poder: 2, danio: 4 }).danio).toBeCloseTo(computeStats({ danio: 4 }).danio * 1.2);
    expect(computeStats({ carcaj: 2, multiflecha: 1 }).arqueros.objetivos).toBe(4);
  });
  it('golpe crítico: tus flechas a veces pegan triple', () => {
    const run = createRun(computeStats({}), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0, critico: { prob: 1, mult: 3 } };
    moveCursor(run, 100, 100);
    withEnemy(run, 100, 100, 100);
    const events = [...stepRun(run, 0.1), ...stepRun(run, 0.25)];
    expect(events.find((e) => e.type === 'hit')).toMatchObject({ efecto: 'critico', danio: 3 });
  });
  it('el Albañil repara la muralla una vez por nivel, aunque el golpe la fuera a tumbar', () => {
    const run = createRun(computeStats({ albanil: 1 }), 560, 7, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    run.muro.vida = 2;
    run.enemies.push({ id: 500, kind: 'rojo', x: 180, y: 200, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99, tiro: 0.01 });
    const events: RunEvent[] = [];
    for (let i = 0; i < 60; i++) events.push(...stepRun(run, 0.05));
    expect(events.filter((e) => e.type === 'wallRepair')).toHaveLength(1);
    expect(run.muro.caido).toBe(false);
    expect(run.muro.vida).toBeGreaterThan(run.muro.max * 0.3);
    run.muro.vida = 1;
    for (let i = 0; i < 80; i++) events.push(...stepRun(run, 0.05));
    expect(events.filter((e) => e.type === 'wallRepair')).toHaveLength(1);
    expect(run.muro.caido).toBe(true);
  });
  it('gemas, cuenta y misiones se guardan y toleran basura', () => {
    const meta = abierta();
    rollDaily(meta, HOY);
    meta.gemas = 17;
    meta.cuenta.compras = 9;
    meta.misiones.logros = ['nivel15'];
    const de = loadMeta(JSON.parse(JSON.stringify(meta)));
    expect(de.gemas).toBe(17);
    expect(de.cuenta.compras).toBe(9);
    expect(de.misiones).toEqual(meta.misiones);
    const roto = loadMeta({ ...JSON.parse(JSON.stringify(meta)), gemas: -4, cuenta: 'x', misiones: { diarias: ['inventada', 3], logros: 5 } });
    expect(roto.gemas).toBe(0);
    expect(roto.cuenta.partidas).toBe(0);
    expect(roto.misiones.diarias.every((id) => MISSION_BY_ID[id])).toBe(true);
    expect(Array.isArray(roto.misiones.logros)).toBe(true);
  });
});

describe('ranking', () => {
  it('se abre en el nivel 17', () => {
    expect(RANKING_DESDE).toBe(17);
    expect(rankingUnlocked({ nivel: 16 })).toBe(false);
    expect(rankingUnlocked({ nivel: 17 })).toBe(true);
  });
  it('limpia nombres: sin caracteres de control, espacios de más ni largos de más', () => {
    expect(cleanName('  Ana\u0000  la   Grande ')).toBe('Ana la Grande');
    expect(cleanName('x'.repeat(40))).toHaveLength(MAX_NAME);
    expect(cleanName('a\u202eb')).toBe('ab');
    expect(cleanName(42)).toBe('');
  });
  it('tu fila: nombre, nivel más alto y reventados', () => {
    const meta = createMeta();
    meta.nivel = 21;
    meta.reventados = 12_345.6;
    meta.nombre = ' Kike ';
    expect(rankingEntry(meta)).toEqual({ nombre: 'Kike', nivel: 21, reventados: 12_345 });
  });
  it('las filas de otros se revisan: niveles imposibles o basura se descartan', () => {
    expect(readRow('a', { nombre: 'Ana', nivel: 30, reventados: 900 }, 'a')).toEqual({ id: 'a', nombre: 'Ana', nivel: 30, reventados: 900, tuyo: true });
    expect(readRow('b', { nombre: 'B', nivel: 3, reventados: 1 }, 'a')).toBeNull();
    expect(readRow('b', { nombre: 'B', nivel: 1e9 }, 'a')).toBeNull();
    expect(readRow('b', { nombre: 'B', nivel: 20.5 }, 'a')).toBeNull();
    expect(readRow('b', { nombre: 'B', nivel: '20' }, 'a')).toMatchObject({ nivel: 20, reventados: 0, tuyo: false });
    expect(readRow('b', undefined, 'a')).toBeNull();
  });
  it('orden: más nivel primero; si empatan, más reventados', () => {
    const filas = sortRows([
      { nombre: 'a', nivel: 20, reventados: 10 },
      { nombre: 'b', nivel: 25, reventados: 1 },
      { nombre: 'c', nivel: 20, reventados: 50 },
    ]);
    expect(filas.map((f) => f.nombre)).toEqual(['b', 'c', 'a']);
  });
  it('el nombre se guarda y se limpia al cargar', () => {
    const meta = createMeta();
    meta.nombre = 'Kike';
    expect(loadMeta(JSON.parse(JSON.stringify(meta))).nombre).toBe('Kike');
    expect(loadMeta({ ...JSON.parse(JSON.stringify(meta)), nombre: { x: 1 } }).nombre).toBe('');
  });
});

describe('PvP', () => {
  const MIE = new Date(2026, 10, 25, 15, 0).getTime(); // miércoles
  const abierto = () => {
    const meta = createMeta();
    meta.nivel = PVP_DESDE;
    meta.talentos = { danio: 10, radio: 3, cadencia: 3, arqueros: 1, multiflecha: 2 };
    syncPvp(meta, MIE);
    return meta;
  };
  it('el poder junta los tres árboles; el Estandarte lo sube 5 % por nivel', () => {
    const base = powerOf(computeStats({}));
    expect(base.total).toBeGreaterThan(0);
    expect(base.mago).toBe(0);
    expect(powerOf(computeStats({ danio: 5 })).total).toBeGreaterThan(base.total);
    const conMago = powerOf(computeStats({ mago: 1, fuego: 1 }));
    expect(conMago.mago).toBeGreaterThan(0);
    expect(conMago.arqueros).toBe(0);
    expect(powerOf(computeStats({ arqueros: 1 })).arqueros).toBeGreaterThan(0);
    const s = computeStats({ danio: 40, radio: 8, arqueros: 1, masArqueros: 3, arcoDanio: 8 });
    expect(powerOf(s, 0).total).toBeGreaterThan(50);
    expect(powerOf(s, 4).total / powerOf(s, 0).total).toBeCloseTo(1.2, 1);
  });
  it('gana el más fuerte casi siempre, pero no siempre', () => {
    expect(winChance(100, 100)).toBeCloseTo(0.5);
    expect(winChance(150, 100)).toBeCloseTo(0.835, 2);
    expect(winChance(100, 150)).toBeCloseTo(0.165, 2);
  });
  it('semanas de lunes a lunes; la cuenta regresiva sale en días', () => {
    expect(weekKey(MIE)).toBe('2026-11-23');
    expect(weekKey(new Date(2026, 10, 29, 23, 59).getTime())).toBe('2026-11-23');
    expect(weekKey(new Date(2026, 10, 30, 0, 1).getTime())).toBe('2026-11-30');
    expect(msUntilWeekEnd(MIE)).toBe((4 * 24 + 9) * 3600_000);
    expect(formatDuration(msUntilWeekEnd(MIE) / 1000)).toBe('4 d 9 h');
    expect(formatDuration(90 * 60)).toBe('1 h 30 min');
  });
  it('se abre en el nivel 19 con 5 intentos en Bronce; un intento vuelve cada 2 h', () => {
    const meta = createMeta();
    meta.nivel = PVP_DESDE - 1;
    expect(syncPvp(meta, MIE)).toBe(false);
    expect(meta.pvp.semana).toBe('');
    const m = abierto();
    expect(m.pvp).toMatchObject({ semana: '2026-11-23', liga: 0, puntos: 0, intentos: INTENTOS_MAX });
    const p = m.pvp;
    p.intentos = 2;
    p.desde = MIE;
    refill(p, MIE + RECARGA_MS - 1);
    expect(p.intentos).toBe(2);
    refill(p, MIE + RECARGA_MS);
    expect(p.intentos).toBe(3);
    refill(p, MIE + 10 * RECARGA_MS);
    expect(p.intentos).toBe(INTENTOS_MAX);
  });
  it('tu liga: 100 jugadores, siempre los mismos esa semana, ordenados por puntos', () => {
    const m = abierto();
    const rivales = rivalsOf(m.pvp);
    expect(rivales).toHaveLength(99);
    expect(new Set(rivales.map((r) => r.nombre)).size).toBe(99);
    expect(rivalsOf(m.pvp).map((r) => r.nombre)).toEqual(rivales.map((r) => r.nombre));
    const tabla = leagueTable(m, MIE);
    expect(tabla).toHaveLength(100);
    expect(tabla.filter((f) => f.tuyo)).toHaveLength(1);
    for (let i = 1; i < tabla.length; i++) expect(tabla[i - 1]!.puntos).toBeGreaterThanOrEqual(tabla[i]!.puntos);
    // Al final de la semana los rivales tienen todos sus puntos; a media semana, menos.
    const final = leagueTable(m, MIE, true).reduce((a, f) => a + f.puntos, 0);
    expect(tabla.reduce((a, f) => a + f.puntos, 0)).toBeLessThan(final);
  });
  it('ganarle a alguien con más puntos da más; perder quita poco y nunca baja de 0', () => {
    expect(pointsFor(100, 300).gana).toBeGreaterThan(pointsFor(100, 100).gana);
    expect(pointsFor(300, 0).gana).toBeGreaterThanOrEqual(6);
    expect(pointsFor(0, 2000).gana).toBe(40);
    expect(pointsFor(100, 300).pierde).toBeLessThan(pointsFor(300, 100).pierde);
    const m = abierto();
    const rival = leagueTable(m, MIE).find((f) => !f.tuyo)!;
    const gano = fight(m, rival.id, MIE, 0)!;
    expect(gano).toMatchObject({ gano: true, medallas: 3 });
    expect(gano.puntos).toBeGreaterThan(0);
    expect(m.pvp).toMatchObject({ intentos: INTENTOS_MAX - 1, puntos: gano.puntos, peleas: 1, ganadas: 1, medallas: 3 });
    m.pvp.puntos = 1;
    const perdio = fight(m, rival.id, MIE, 0.9999)!;
    expect(perdio.gano).toBe(false);
    expect(m.pvp.puntos).toBe(0);
    expect(m.pvp.medallas).toBe(4);
    m.pvp.intentos = 0;
    expect(fight(m, rival.id, MIE, 0)).toBeNull();
    expect(fight(abierto(), 'yo', MIE, 0)).toBeNull();
  });
  it('al terminar la semana: los 20 mejores suben, los 20 peores bajan (de Bronce no se baja)', () => {
    const m = abierto();
    m.pvp.puntos = 99_999;
    const arriba = endWeek(m, MIE);
    expect(arriba).toMatchObject({ liga: 0, nueva: 1, posicion: 1 });
    expect(m.pvp).toMatchObject({ liga: 1, puntos: 0, ronda: 2 });
    expect(m.pvp.medallas).toBe(arriba.medallas);
    const abajo = endWeek(m, MIE);
    expect(abajo.nueva).toBe(0);
    expect(abajo.posicion).toBeGreaterThan(80);
    expect(endWeek(m, MIE).nueva).toBe(0);
    m.pvp.liga = LIGAS.length - 1;
    m.pvp.puntos = 99_999;
    expect(endWeek(m, MIE).nueva).toBe(LIGAS.length - 1);
  });
  it('si pasó la semana, al volver se cierra sola y queda el resultado para mostrarlo', () => {
    const m = abierto();
    m.pvp.puntos = 99_999;
    const lunes = new Date(2026, 10, 30, 9).getTime();
    expect(syncPvp(m, lunes)).toBe(true);
    expect(m.pvp.semana).toBe('2026-11-30');
    expect(m.pvp.resultado).toMatchObject({ posicion: 1, nueva: 1 });
    expect(positionOf(leagueTable(m, lunes))).toBeGreaterThan(1);
    expect(syncPvp(m, lunes + 1000)).toBe(false);
  });
  it('la tienda cobra medallas: cofre de oro, pelea extra (si no estás lleno), gemas y Estandarte', () => {
    const m = abierto();
    m.pvp.medallas = 100;
    expect(buyShop(m, 'intento', 0)).toBe(false);
    expect(buyShop(m, 'oro', 10)).toBe(true);
    expect(m.oro).toBe(150);
    expect(buyShop(m, 'gemas', 0)).toBe(true);
    expect(m.gemas).toBe(5);
    const antes = shopCost(m.pvp, 'estandarte');
    expect(buyShop(m, 'estandarte', 0)).toBe(true);
    expect(shopCost(m.pvp, 'estandarte')).toBeGreaterThan(antes);
    expect(m.pvp.medallas).toBe(100 - 5 - 25 - antes);
    m.pvp.intentos = 3;
    expect(buyShop(m, 'intento', 0)).toBe(true);
    expect(m.pvp.intentos).toBe(4);
    m.pvp.medallas = 0;
    expect(buyShop(m, 'oro', 10)).toBe(false);
    expect(ESTANDARTE.max).toBe(20);
  });
  it('el PvP se guarda y tolera basura', () => {
    const m = abierto();
    m.pvp.medallas = 12;
    expect(loadMeta(JSON.parse(JSON.stringify(m))).pvp).toEqual(m.pvp);
    const roto = loadPvp({ liga: 99, intentos: -3, medallas: 'x', resultado: { liga: 'a' } });
    expect(roto.liga).toBe(LIGAS.length - 1);
    expect(roto.intentos).toBe(INTENTOS_MAX);
    expect(roto.medallas).toBe(0);
    expect(loadPvp(null)).toEqual(emptyPvp());
  });
});

describe('modo guardia', () => {
  const tropas = computeStats({ danio: 3, arqueros: 1, masArqueros: 2 });
  it('salen enemigos del nivel más alto superado (sin jefes)', () => {
    expect(guardLevel(1)).toBe(1);
    expect(guardLevel(8)).toBe(7);
    expect(guardLevel(11)).toBe(9);
    expect(guardLevel(21)).toBe(19);
  });
  it('sin tocar, tu círculo no dispara; salen pocos, uno cada 2.5 s, y no se acaba', () => {
    const run = createGuardRun(computeStats({}), 560, 5, 1, 1);
    const events = startGuardRun(run);
    expect(events.filter((e) => e.type === 'spawn')).toHaveLength(GUARDIA.iniciales);
    const todos: RunEvent[] = [];
    for (let i = 0; i < 20 * 60; i++) todos.push(...stepRun(run, 0.05));
    expect(todos.some((e) => e.type === 'shot' || e.type === 'impact')).toBe(false);
    expect(todos.some((e) => e.type === 'end')).toBe(false);
    expect(run.terminada).toBe(false);
    // Sin tropas nadie los revienta: se llenan hasta el tope y ahí paran.
    expect(run.enemies).toHaveLength(GUARDIA.max);
  });
  it('si tocas el campo, tu círculo dispara ahí (sus bajas dan el oro de la guardia) y descansa unos segundos después', () => {
    const run = createGuardRun(computeStats({ danio: 50 }), 560, 3, 0.5, 9);
    startGuardRun(run);
    expect(circleActive(run)).toBe(false);
    for (const e of run.enemies) Object.assign(e, { x: 150, y: 200, vx: 0, vy: 0, giro: 99 });
    moveCursor(run, 150, 200);
    expect(circleActive(run)).toBe(true);
    const ev: RunEvent[] = [];
    for (let i = 0; i < 40; i++) ev.push(...stepRun(run, 0.05));
    expect(ev.some((e) => e.type === 'shot' && e.fuente === 'jugador')).toBe(true);
    const bajas = ev.filter((e) => e.type === 'kill').length;
    expect(bajas).toBeGreaterThanOrEqual(GUARDIA.iniciales);
    expect(run.oro).toBeCloseTo(bajas * 0.5);
    // Pasado el reposo sin tocar, deja de disparar (y no junta disparos para después).
    for (let i = 0; i < GUARDIA.reposo * 20; i++) stepRun(run, 0.05);
    expect(circleActive(run)).toBe(false);
    const luego: RunEvent[] = [];
    for (let i = 0; i < 100; i++) luego.push(...stepRun(run, 0.05));
    expect(luego.some((e) => e.type === 'shot')).toBe(false);
    moveCursor(run, 100, 100);
    expect(stepRun(run, 0.05).filter((e) => e.type === 'shot')).toHaveLength(1);
  });
  it('tus tropas revientan y cada baja da el oro fijo de la guardia', () => {
    const run = createGuardRun(tropas, 560, 3, 0.5, 2);
    startGuardRun(run);
    let bajas = 0;
    for (let i = 0; i < 60 * 20; i++) bajas += stepRun(run, 0.05).filter((e) => e.type === 'kill').length;
    expect(bajas).toBeGreaterThan(15);
    expect(run.oro).toBeCloseTo(bajas * 0.5);
  });
  it('nadie ataca la muralla ni marcha hacia ella', () => {
    const run = createGuardRun(computeStats({}), 560, 16, 1, 3);
    run.enemies.push({ id: 900, kind: 'orco', x: 100, y: 200, vx: 0, vy: 8, vida: 1e9, vidaMax: 1e9, giro: 0.5, tiro: 0.01 });
    run.enemies.push({ id: 901, kind: 'goblin', x: 200, y: 200, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 0.5, tiro: 0.01 });
    const todos: RunEvent[] = [];
    for (let i = 0; i < 400; i++) todos.push(...stepRun(run, 0.05));
    expect(todos.some((e) => e.type === 'sling' || e.type === 'wallHit')).toBe(false);
    expect(run.muro.vida).toBe(run.muro.max);
  });
  it('al comprar, la guardia toma las nuevas tropas sin empezar de nuevo', () => {
    const run = createGuardRun(computeStats({ arqueros: 1 }), 560, 3, 1, 4);
    startGuardRun(run);
    const enemigos = run.enemies.length;
    updateGuardRun(run, computeStats({ arqueros: 1, masArqueros: 2 }), 2);
    expect(run.arcos).toHaveLength(3);
    expect(run.guardia!.oroPorBaja).toBe(2);
    expect(run.stats.duracion).toBe(Infinity);
    expect(run.enemies).toHaveLength(enemigos);
  });
});

describe('autoapuntado', () => {
  const enGrupo = (run: Run) => {
    for (let i = 0; i < 6; i++) run.enemies.push({ id: 700 + i, kind: 'verde', x: 300 + (i % 3) * 4, y: 120 + i * 3, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 999 });
  };
  it('se abre con Área 3; va de 12 a 36 de velocidad (lento: el campo mide 360)', () => {
    expect(TALENT_BY_ID.autoapuntar.requiere).toEqual({ id: 'radio', nivel: 3 });
    expect(computeStats({}).autoapuntar.velocidad).toBe(0);
    expect(computeStats({ autoapuntar: 1 }).autoapuntar.velocidad).toBe(12);
    expect(computeStats({ autoapuntar: 5 }).autoapuntar.velocidad).toBe(36);
  });
  it('sin el talento el círculo no se mueve solo', () => {
    const run = createRun(computeStats({}), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    enGrupo(run);
    const antes = { ...run.cursor };
    for (let i = 0; i < 100; i++) stepRun(run, 0.05);
    expect(run.cursor).toEqual(antes);
  });
  it('con el talento va solo hacia el grupo, despacio', () => {
    const run = createRun(computeStats({ autoapuntar: 1 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0, duracion: 999 };
    enGrupo(run);
    const inicio = { ...run.cursor };
    expect(autoAiming(run)).toBe(true);
    for (let i = 0; i < 20; i++) stepRun(run, 0.05);
    // En 1 s avanza ~12 unidades hacia ellos (tocar lo pone ahí al instante).
    const avance = Math.hypot(run.cursor.x - inicio.x, run.cursor.y - inicio.y);
    expect(avance).toBeGreaterThan(10);
    expect(avance).toBeLessThan(13);
    expect(run.cursor.x).toBeGreaterThan(inicio.x);
    for (let i = 0; i < 400; i++) stepRun(run, 0.05);
    expect(Math.abs(run.cursor.x - 304)).toBeLessThan(6);
  });
  it('si tocas, espera 2.5 s antes de volver a moverse solo', () => {
    const run = createRun(computeStats({ autoapuntar: 5 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0, duracion: 999 };
    enGrupo(run);
    moveCursor(run, 50, 300);
    for (let i = 0; i < 40; i++) stepRun(run, 0.05);
    expect(run.cursor).toEqual({ x: 50, y: 300 });
    expect(autoAiming(run)).toBe(false);
    for (let i = 0; i < 20; i++) stepRun(run, 0.05);
    expect(autoAiming(run)).toBe(true);
    expect(run.cursor.x).toBeGreaterThan(50);
    expect(AUTOAPUNTAR.espera).toBe(2.5);
  });
});

describe('tercera zona: Pradera amarilla', () => {
  const sinLlegadas = (run: Run) => {
    run.stats = { ...run.stats, ritmo: 0, duracion: 999 };
    run.cursor = { x: -999, y: -999 };
  };
  it('del 21 al 30: arañas y lobos negros; esqueletos desde el 23 y bandidos desde el 25', () => {
    expect(zoneOf(20)).toBe('batalla');
    expect(zoneOf(21)).toBe('pradera');
    expect(zoneOf(30)).toBe('pradera');
    expect(zoneOf(31)).toBe('desierto');
    const quienes = (n: number) => levelConfig(n).mezcla.map(([k]) => k).sort();
    expect(quienes(21)).toEqual(['arana', 'loboNegro']);
    expect(quienes(23)).toEqual(['arana', 'esqueleto', 'loboNegro']);
    expect(quienes(25)).toEqual(['arana', 'bandido', 'esqueleto', 'loboNegro']);
    expect(levelConfig(30).jefe?.kind).toBe('esqueletoMago');
  });
  it('los lobos negros llegan de a 3, juntos', () => {
    const run = createRun(computeStats({}), 560, 21, 5);
    run.nivel = { ...run.nivel, mezcla: [['loboNegro', 1]], total: 9 };
    startRun(run);
    expect(run.enemies).toHaveLength(9);
    expect(run.salieron).toBe(9);
    for (let i = 0; i < 9; i += 3) {
      const [a, b, c] = run.enemies.slice(i, i + 3);
      for (const e of [b!, c!]) expect(Math.hypot(e.x - a!.x, e.y - a!.y)).toBeLessThan(30);
    }
  });
  it('el esqueleto se rearma una vez con media vida y solo cuenta al caer del todo', () => {
    const run = createRun(computeStats({}), 560, 23, 6);
    sinLlegadas(run);
    run.enemies.push({ id: 800, kind: 'esqueleto', x: 100, y: 200, vx: 0, vy: 0, vida: 0.5, vidaMax: 10, giro: 99 });
    moveCursor(run, 100, 200);
    const eventos: RunEvent[] = [];
    for (let i = 0; i < 4; i++) eventos.push(...stepRun(run, 0.2));
    expect(eventos.filter((e) => e.type === 'rise')).toHaveLength(1);
    expect(run.reventados).toBe(0);
    const esq = run.enemies.find((e) => e.id === 800)!;
    expect(esq.rearmado).toBe(true);
    esq.vida = 0.1;
    for (let i = 0; i < 4; i++) eventos.push(...stepRun(run, 0.2));
    expect(eventos.filter((e) => e.type === 'rise')).toHaveLength(1);
    expect(eventos.some((e) => e.type === 'kill' && e.kind === 'esqueleto')).toBe(true);
    expect(run.reventados).toBe(1);
  });
  it('el bandido se aparta de tu círculo', () => {
    const run = createRun(computeStats({}), 560, 25, 7);
    run.stats = { ...run.stats, ritmo: 0, duracion: 999 };
    run.enemies.push({ id: 801, kind: 'bandido', x: 180, y: 250, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99 });
    moveCursor(run, 175, 250);
    for (let i = 0; i < 10; i++) stepRun(run, 0.05);
    const b = run.enemies.find((e) => e.id === 801)!;
    expect(Math.hypot(b.x - 175, b.y - 250)).toBeGreaterThan(15);
  });
  it('la telaraña enreda a un arquero 3 s (no tira); sin arqueros, le pega a la muralla', () => {
    const run = createRun(computeStats({ arqueros: 1 }), 560, 21, 8);
    sinLlegadas(run);
    run.enemies.push({ id: 802, kind: 'arana', x: 180, y: 300, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99, tiro: 0.01 });
    const eventos: RunEvent[] = [];
    for (let i = 0; i < 60 && !eventos.some((e) => e.type === 'web'); i++) eventos.push(...stepRun(run, 0.05));
    const tela = eventos.find((e) => e.type === 'web');
    expect(tela).toMatchObject({ arquero: 0, dura: ENEMIES.arana.enreda });
    // Muchas arañas no lo dejan enredado para siempre: una telaraña por arquero a la vez.
    expect(run.piedras.filter((p) => p.tipo === 'telarana')).toHaveLength(0);
    const despues: RunEvent[] = [];
    for (let i = 0; i < 40; i++) despues.push(...stepRun(run, 0.05));
    expect(despues.some((e) => e.type === 'volley')).toBe(false);
    expect(despues.some((e) => e.type === 'web')).toBe(false);
    expect(run.muro.vida).toBe(run.muro.max);
    // Al soltarse tira otra vez y por 4 s no lo pueden volver a enredar.
    const suelto: RunEvent[] = [];
    for (let i = 0; i < 60; i++) suelto.push(...stepRun(run, 0.05));
    expect(suelto.some((e) => e.type === 'volley')).toBe(true);
    expect(suelto.some((e) => e.type === 'web')).toBe(false);
    const sola = createRun(computeStats({}), 560, 21, 9);
    sinLlegadas(sola);
    sola.enemies.push({ id: 803, kind: 'arana', x: 180, y: 300, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99, tiro: 0.01 });
    const ev2: RunEvent[] = [];
    for (let i = 0; i < 80; i++) ev2.push(...stepRun(sola, 0.05));
    expect(ev2.some((e) => e.type === 'web')).toBe(false);
    expect(ev2.find((e) => e.type === 'wallHit')).toMatchObject({ danio: ENEMIES.arana.ataque * sola.nivel.ataque });
  });
});

describe('cuarta zona: Desierto, y los jefes del 30 y el 40', () => {
  const quieta = (run: Run) => {
    run.stats = { ...run.stats, ritmo: 0, duracion: 999 };
    run.cursor = { x: -999, y: -999 };
  };
  it('del 31 al 40: escorpiones y bandidos del desierto; minotauros desde el 33 y cíclopes desde el 35', () => {
    expect(zoneOf(31)).toBe('desierto');
    const quienes = (n: number) => levelConfig(n).mezcla.map(([k]) => k).sort();
    expect(quienes(31)).toEqual(['bandidoDesierto', 'escorpion']);
    expect(quienes(33)).toEqual(['bandidoDesierto', 'escorpion', 'minotauro']);
    expect(quienes(35)).toEqual(['bandidoDesierto', 'ciclope', 'escorpion', 'minotauro']);
    for (const n of [31, 35, 39]) expect(levelConfig(n).mezcla.reduce((t, [, p]) => t + p, 0)).toBeCloseTo(1);
    expect(levelConfig(40).jefe?.kind).toBe('liderBandido');
  });
  it('el escorpión se entierra: bajo la arena no se le puede pegar', () => {
    const run = createRun(computeStats({}), 560, 31, 11);
    quieta(run);
    const esc = { id: 810, kind: 'escorpion' as const, x: 150, y: 250, vx: 0, vy: 0, vida: 100, vidaMax: 100, giro: 99, entierro: 0.01 };
    run.enemies.push(esc);
    const ev = stepRun(run, 0.05);
    expect(ev.some((e) => e.type === 'burrow')).toBe(true);
    expect(hidden(run, esc)).toBe(true);
    moveCursor(run, esc.x, esc.y);
    for (let i = 0; i < 6; i++) stepRun(run, 0.05);
    expect(esc.vida).toBe(100);
    const sale: RunEvent[] = [];
    for (let i = 0; i < 40; i++) sale.push(...stepRun(run, 0.05));
    expect(sale.some((e) => e.type === 'surface')).toBe(true);
  });
  it('el minotauro embiste pasando la mitad del campo', () => {
    const run = createRun(computeStats({}), 560, 33, 12);
    quieta(run);
    const mino = { id: 811, kind: 'minotauro' as const, x: 180, y: 100, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99 };
    run.enemies.push(mino);
    stepRun(run, 0.5);
    const lento = mino.y - 100;
    const eventos: RunEvent[] = [];
    mino.y = 400;
    eventos.push(...stepRun(run, 0.5));
    expect(mino.y - 400).toBeGreaterThan(lento * 2.5);
    expect(eventos.filter((e) => e.type === 'charge')).toHaveLength(1);
    expect(stepRun(run, 0.1).some((e) => e.type === 'charge')).toBe(false);
  });
  it('el Esqueleto Mago se teletransporta (sin que se le pueda pegar), invoca esqueletos y se rearma una vez', () => {
    const run = createRun(computeStats({}), 560, 30, 13);
    startRun(run);
    expect(bossOf(run)!.kind).toBe('esqueletoMago');
    expect(run.enemies.filter((e) => e.kind === 'esqueleto').length).toBeGreaterThan(0);
    const jefe = bossOf(run)!;
    let vioOculto = false;
    for (let i = 0; i < 200 && !vioOculto; i++) {
      stepRun(run, 0.05);
      if (run.jefe!.salto) vioOculto = hidden(run, jefe);
    }
    expect(vioOculto).toBe(true);
    for (let i = 0; i < 20; i++) stepRun(run, 0.05);
    jefe.vida = 0.01;
    moveCursor(run, jefe.x, jefe.y);
    run.jefe!.aturdido = 5;
    run.jefe!.salto = null;
    run.jefe!.brinco = 99;
    const ev: RunEvent[] = [];
    for (let i = 0; i < 20; i++) ev.push(...stepRun(run, 0.05));
    expect(ev.some((e) => e.type === 'rise' && e.id === jefe.id)).toBe(true);
    expect(bossOf(run)).toBeDefined();
    expect(jefe.vida).toBeGreaterThan(jefe.vidaMax * 0.2);
  });
  it('el Líder de los bandidos lanza tres dagas en abanico', () => {
    const run = createRun(computeStats({}), 560, 40, 14);
    startRun(run);
    expect(bossOf(run)!.kind).toBe('liderBandido');
    const ev: RunEvent[] = [];
    for (let i = 0; i < 80 && !ev.some((e) => e.type === 'bossThrow'); i++) ev.push(...stepRun(run, 0.05));
    const dagas = run.piedras.filter((p) => p.tipo === 'daga');
    expect(dagas.length).toBeGreaterThanOrEqual(3);
    const xs = dagas.slice(0, 3).map((p) => p.tx).sort((a, b) => a - b);
    expect(xs[2]! - xs[0]!).toBeCloseTo(160);
  });
});

describe('curvas de la segunda mitad', () => {
  it('hasta el 20 la vida y el oro crecen con una curva; desde ahí con otra (la vida más lento que antes)', () => {
    expect(levelConfig(20).vida / levelConfig(19).vida).toBeCloseTo(CURVA.vida);
    expect(levelConfig(20).oro / levelConfig(19).oro).toBeCloseTo(CURVA.oro);
    expect(levelConfig(21).vida / levelConfig(20).vida).toBeCloseTo(CURVA.vidaTarde);
    expect(levelConfig(21).oro / levelConfig(20).oro).toBeCloseTo(CURVA.oroTarde);
    expect(levelConfig(35).oro / levelConfig(34).oro).toBeCloseTo(CURVA.oroTarde);
    expect(CURVA.vidaTarde).toBeLessThan(CURVA.vida);
  });
  it('Daño llega a 100 y, pasado el 40, cada nivel cuesta solo ×1.2 más', () => {
    const d = TALENT_BY_ID.danio;
    expect(d.max).toBe(100);
    expect(costOf(d, 40) / costOf(d, 39)).toBeCloseTo(1.4, 1);
    expect(costOf(d, 50) / costOf(d, 49)).toBeCloseTo(1.2, 1);
    expect(TALENT_BY_ID.muralla.max).toBe(20);
  });
  it('cada jefe ajusta su vida (el Lobo Blanco y el Esqueleto Mago, por sus defensas, tienen menos)', () => {
    const base = (n: number) => 3 * (15 + 8 * (n - 1)) * levelConfig(n).vida * JEFE.vida;
    expect(JEFES.loboBlanco!.vida).toBeLessThan(1);
    expect(JEFES.esqueletoMago!.vida).toBeLessThan(1);
    expect(levelConfig(20).jefe!.vida).toBeCloseTo(base(20) * JEFES.loboBlanco!.vida!, -2);
    expect(levelConfig(30).jefe!.vida).toBeCloseTo(base(30) * JEFES.esqueletoMago!.vida!, -2);
    expect(levelConfig(40).jefe!.vida).toBeCloseTo(base(40) * JEFES.liderBandido!.vida!, -2);
    expect(levelConfig(10).jefe!.vida).toBeCloseTo(base(10), -1);
  });
});

describe('quinta zona: Montaña de piedra, y el Dragón de acero', () => {
  const quieta = (run: Run) => {
    run.stats = { ...run.stats, ritmo: 0, duracion: 999 };
    run.cursor = { x: -999, y: -999 };
  };
  it('del 41 al 50: guerreros de hierro y gólems; arqueros de hierro desde el 43 y dragones desde el 45', () => {
    expect(zoneOf(41)).toBe('montana');
    const quienes = (n: number) => levelConfig(n).mezcla.map(([k]) => k).sort();
    expect(quienes(41)).toEqual(['golem', 'guerreroHierro']);
    expect(quienes(43)).toEqual(['arqueroHierro', 'golem', 'guerreroHierro']);
    expect(quienes(45)).toEqual(['arqueroHierro', 'dragoncito', 'golem', 'guerreroHierro']);
    expect(levelConfig(50).jefe?.kind).toBe('dragonAcero');
    // El daño a la muralla crece ×1.02 por nivel después del 20.
    expect(levelConfig(45).ataque / levelConfig(44).ataque).toBeCloseTo(1.02);
  });
  it('la armadura quita parte del daño hasta perder media vida; luego se cae y marcha más rápido', () => {
    const run = createRun(computeStats({}), 560, 41, 21);
    quieta(run);
    const g: Run['enemies'][number] = { id: 820, kind: 'guerreroHierro', x: 150, y: 150, vx: 0, vy: 0, vida: 10, vidaMax: 10, giro: 99 };
    run.enemies.push(g);
    moveCursor(run, 150, 150);
    const ev: RunEvent[] = [];
    for (let i = 0; i < 12; i++) ev.push(...stepRun(run, 0.05));
    const golpe = ev.find((e) => e.type === 'hit' && e.id === 820);
    expect((golpe as { danio: number }).danio).toBeCloseTo(ARMADURA);
    g.vida = 5.2;
    const y0 = g.y;
    for (let i = 0; i < 20; i++) ev.push(...stepRun(run, 0.05));
    expect(ev.some((e) => e.type === 'armorBreak')).toBe(true);
    expect(g.sinArmadura).toBe(true);
    run.cursor = { x: -999, y: -999 };
    const y1 = g.y;
    stepRun(run, 0.5);
    expect(g.y - y1).toBeGreaterThan(ENEMIES.guerreroHierro.velocidad * 0.5 * 1.5);
    expect(y1).toBeGreaterThanOrEqual(y0);
  });
  it('el gólem se parte en dos piedritas que no cuentan para el nivel', () => {
    const run = createRun(computeStats({}), 560, 41, 22);
    quieta(run);
    run.enemies.push({ id: 821, kind: 'golem', x: 150, y: 200, vx: 0, vy: 0, vida: 0.1, vidaMax: 10, giro: 99 });
    moveCursor(run, 150, 200);
    const ev: RunEvent[] = [];
    for (let i = 0; i < 6; i++) ev.push(...stepRun(run, 0.05));
    expect(ev.some((e) => e.type === 'kill' && e.kind === 'golem')).toBe(true);
    const crias = run.enemies.filter((e) => e.kind === 'golemito');
    expect(crias).toHaveLength(2);
    expect(crias.every((e) => e.cria)).toBe(true);
    expect(run.reventados).toBe(1);
    for (const c of crias) c.vida = 0.01;
    moveCursor(run, crias[0]!.x, crias[0]!.y);
    for (let i = 0; i < 20; i++) stepRun(run, 0.05);
    expect(run.reventados).toBe(1);
  });
  it('los dragones pequeños vuelan: tu lluvia de flechas no les pega; los arqueros sí, y les tiran primero', () => {
    const run = createRun(computeStats({ arqueros: 1 }), 560, 45, 23);
    quieta(run);
    const d = { id: 822, kind: 'dragoncito' as const, x: 150, y: 200, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99 };
    for (let i = 0; i < 20; i++) run.enemies.push({ id: 900 + i, kind: 'guerreroHierro', x: 300, y: 100 + i, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99 });
    run.enemies.push(d);
    expect(inAir(run, d)).toBe(true);
    moveCursor(run, 150, 200);
    const ev: RunEvent[] = [];
    for (let i = 0; i < 40; i++) ev.push(...stepRun(run, 0.05));
    const golpes = ev.filter((e) => e.type === 'hit' && e.id === 822);
    expect(golpes.length).toBeGreaterThan(0);
    expect(golpes.every((e) => e.type === 'hit' && e.fuente === 'arquero')).toBe(true);
  });
  it('el arquero de hierro tira dos flechas a la vez', () => {
    const run = createRun(computeStats({}), 560, 43, 24);
    quieta(run);
    run.enemies.push({ id: 823, kind: 'arqueroHierro', x: 150, y: 200, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99, tiro: 0.01 });
    stepRun(run, 0.05);
    expect(run.piedras.filter((p) => p.tipo === 'flechaHierro')).toHaveLength(2);
  });
  it('el Dragón de acero vuela (en el aire tu círculo no le pega), lanza cinco llamaradas y tiene escamas', () => {
    const run = createRun(computeStats({}), 560, 50, 25);
    startRun(run);
    const jefe = bossOf(run)!;
    expect(jefe.kind).toBe('dragonAcero');
    expect(run.enemies.some((e) => e.kind === 'dragoncito')).toBe(true);
    let enAire = false;
    let llamas = 0;
    for (let i = 0; i < 200; i++) {
      stepRun(run, 0.05);
      if (run.jefe!.salto) enAire ||= inAir(run, jefe);
      llamas = Math.max(llamas, run.piedras.filter((p) => p.tipo === 'llamarada').length);
    }
    expect(enAire).toBe(true);
    expect(llamas).toBeGreaterThanOrEqual(5);
    expect(ENEMIES.dragonAcero.armadura).toBe(true);
  });
});

describe('Herrería: mejorar el equipo con Runas (a veces sale, a veces no)', () => {
  it('la primera mejora siempre sale; después la probabilidad baja hasta 20 %', () => {
    expect(baseChance(0)).toBe(1);
    expect(baseChance(1)).toBeCloseTo(0.87);
    expect(baseChance(5)).toBeCloseTo(0.55);
    expect(baseChance(9)).toBeCloseTo(0.23);
    expect(baseChance(20)).toBe(0.2);
  });
  it('cada fallo suma +10 % al siguiente intento de esa pieza; al lograrlo se reinicia', () => {
    const host = { runas: 1000, equipo: emptyEquipo() };
    host.equipo.niveles.baculo = 5;
    const antes = chanceOf(host.equipo, 'baculo');
    const fallo = mejorar(host, 'baculo', 0.999)!;
    expect(fallo).toMatchObject({ exito: false, nivel: 5 });
    expect(fallo.siguiente).toBeCloseTo(antes + SUERTE_POR_FALLO);
    mejorar(host, 'baculo', 0.999);
    expect(chanceOf(host.equipo, 'baculo')).toBeCloseTo(antes + 2 * SUERTE_POR_FALLO);
    // Otra pieza no se ve afectada.
    expect(chanceOf(host.equipo, 'arco')).toBe(1);
    const exito = mejorar(host, 'baculo', 0)!;
    expect(exito).toMatchObject({ exito: true, nivel: 6 });
    expect(chanceOf(host.equipo, 'baculo')).toBeCloseTo(baseChance(6));
  });
  it('cada intento cuesta Runas (salga o no); sin Runas o al máximo no se puede', () => {
    const host = { runas: costoPieza(0), equipo: emptyEquipo() };
    expect(mejorar(host, 'arco', 0)).toMatchObject({ exito: true, costo: costoPieza(0) });
    expect(host.runas).toBe(0);
    expect(mejorar(host, 'arco', 0)).toBeNull();
    host.runas = 1e6;
    host.equipo.niveles.arco = NIVEL_MAX;
    expect(mejorar(host, 'arco', 0)).toBeNull();
    expect(costoPieza(5)).toBeGreaterThan(costoPieza(4));
  });
  it('los bonos multiplican lo del árbol y el aspecto cambia en 3 etapas', () => {
    const b = bonosEquipo({ baculo: 5, tunica: 4, arco: 10, armadura: 10, muralla: 2, torre: 5, estandarte: 3 });
    expect(b.magoDanio).toBeCloseTo(1 + 5 * EQUIPO.baculo);
    expect(b.magoIntervalo).toBeCloseTo(EQUIPO.tunica ** 4);
    expect(b.arcoObjetivos).toBe(2);
    const sin = computeStats({ danio: 5, mago: 1, arqueros: 1 });
    const con = computeStats({ danio: 5, mago: 1, arqueros: 1 }, { baculo: 5, torre: 5, muralla: 2, estandarte: 3 });
    expect(con.mago.danio / sin.mago.danio).toBeCloseTo((1 + 5 * EQUIPO.baculo) * (1 + 5 * EQUIPO.torre));
    expect(con.danio / sin.danio).toBeCloseTo(1 + 5 * EQUIPO.torre);
    expect(con.muro.vida / sin.muro.vida).toBeCloseTo(1 + 2 * EQUIPO.muralla);
    expect(con.oroMult / sin.oroMult).toBeCloseTo(1 + 3 * EQUIPO.estandarte);
    expect(tierDe({}, 'mago')).toBe(0);
    expect(tierDe({ baculo: 2, tunica: 1 }, 'mago')).toBe(1);
    expect(tierDe({ baculo: 5, tunica: 4, sombrero: 3 }, 'mago')).toBe(2);
    expect(tierDe({ baculo: 8, tunica: 8, sombrero: 8 }, 'mago')).toBe(3);
  });
  it('el equipo se guarda y tolera basura', () => {
    const meta = createMeta();
    meta.runas = 33;
    meta.equipo.niveles.torre = 4;
    meta.equipo.suerte.torre = 0.2;
    const de = loadMeta(JSON.parse(JSON.stringify(meta)));
    expect(de.runas).toBe(33);
    expect(de.equipo).toEqual(meta.equipo);
    expect(loadEquipo({ niveles: { torre: 99, inventada: 3 }, suerte: { torre: 'x' } })).toEqual({ niveles: { torre: NIVEL_MAX }, suerte: {} });
  });
});

describe('Supervivencia: oleadas que dan Runas', () => {
  it('se abre en el nivel 26, con 3 entradas que vuelven cada 8 h', () => {
    expect(SUPERVIVENCIA_DESDE).toBe(26);
    expect(survivalUnlocked({ nivel: 25 })).toBe(false);
    expect(survivalUnlocked({ nivel: 26 })).toBe(true);
    const s = emptySupervivencia();
    const t0 = 1_000_000;
    for (let i = 0; i < ENTRADAS_MAX; i++) expect(usarEntrada(s, t0)).toBe(true);
    expect(usarEntrada(s, t0)).toBe(false);
    refillEntradas(s, t0 + RECARGA_ENTRADA_MS);
    expect(s.entradas).toBe(1);
    refillEntradas(s, t0 + 10 * RECARGA_ENTRADA_MS);
    expect(s.entradas).toBe(ENTRADAS_MAX);
    expect(nivelBaseOlas(40)).toBe(30);
  });
  it('jefes cada 5 oleadas (uno más cada 10); 1 Runa por oleada y 2 más por cada jefe', () => {
    expect([1, 4, 5, 9, 10, 15, 20].map(jefesOla)).toEqual([0, 0, 1, 0, 2, 2, 3]);
    expect(runasOla(1)).toBe(1);
    expect(runasOla(4)).toBe(1);
    expect(runasOla(5)).toBe(1 + 2);
    expect(runasOla(10)).toBe(1 + 4);
  });
  it('las oleadas llegan, se aguantan y suman Runas; en la 10 salen dos jefes a la vez', () => {
    const run = createSurvivalRun(computeStats({ danio: 40, radio: 10, cadencia: 10, arqueros: 1, masArqueros: 5, multiflecha: 4, mago: 1, muralla: 20 }), 600, 5, 30, 1);
    const ev: RunEvent[] = [];
    let jefesVistos = 0;
    for (let i = 0; i < 4000 && !run.terminada && run.oleadas!.ola < 10; i++) {
      if (i % 20 === 0) { const b = mejorLugar(run); moveCursor(run, b.x, b.y); }
      const e = stepRun(run, 0.05);
      ev.push(...e);
      for (const x of e) if (x.type === 'wave' && x.ola === 10) jefesVistos = x.jefes;
    }
    expect(run.oleadas!.ola).toBe(10);
    expect(jefesVistos).toBe(2);
    expect(run.enemies.filter((e) => ENEMIES[e.kind].jefe)).toHaveLength(2);
    expect(run.enemies.filter((e) => e.elite)).toHaveLength(1);
    expect(run.oleadas!.superadas).toBeGreaterThanOrEqual(9);
    expect(run.oleadas!.bote).toBe([1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((t, o) => t + runasOla(o), 0));
    expect(ev.filter((e) => e.type === 'waveClear')).toHaveLength(9);
  });
  it('todos salen arriba y bajan hacia la muralla; los que llegan la golpean y, si cae, se acaba', () => {
    // Slimes verdes (no tiran nada): igual golpean la muralla al llegar.
    const run = createSurvivalRun(computeStats({}), 600, 1, 1, 2);
    run.cursor = { x: -999, y: -999 };
    const ev: RunEvent[] = [];
    for (let i = 0; i < 50; i++) ev.push(...stepRun(run, 0.05));
    const salen = ev.filter((e): e is Extract<RunEvent, { type: 'spawn' }> => e.type === 'spawn');
    expect(salen.length).toBeGreaterThan(0);
    for (const e of salen) expect(e.y).toBeLessThanOrEqual(run.arriba + 30 + 14);
    const antes = new Map(run.enemies.map((e) => [e.id, e.y]));
    for (let i = 0; i < 40; i++) ev.push(...stepRun(run, 0.05));
    for (const e of run.enemies) if (antes.has(e.id)) expect(e.y).toBeGreaterThan(antes.get(e.id)!);
    for (let i = 0; i < 8000 && !run.terminada; i++) ev.push(...stepRun(run, 0.05));
    expect(ev.some((e) => e.type === 'sling' && e.tipo === 'golpe')).toBe(true);
    expect(ev.filter((e) => e.type === 'wallHit').every((e) => e.danio >= OLEADAS.golpe * levelConfig(1).ataque - 1e-9)).toBe(true);
    expect(run.muro.caido).toBe(true);
    expect(run.terminada).toBe(true);
    expect(ev.at(-1)).toEqual({ type: 'end', gano: false });
  });
  it('si no limpias la oleada a tiempo, cuenta como aguantada y llega la siguiente: se juntan', () => {
    const run = createSurvivalRun(computeStats({ muralla: 20 }), 600, 1, 1, 3);
    run.cursor = { x: -999, y: -999 };
    run.muro.max = run.muro.vida = 1e9;
    let vivosAlLlegar = -1;
    for (let i = 0; i < 2000 && vivosAlLlegar < 0; i++) {
      const vivos = run.enemies.length;
      for (const e of stepRun(run, 0.05)) if (e.type === 'wave' && e.ola === 2) vivosAlLlegar = vivos;
    }
    expect(vivosAlLlegar).toBeGreaterThan(0);
    expect(run.oleadas!.superadas).toBe(1);
    expect(run.oleadas!.bote).toBe(runasOla(1));
  });
  it('los jefes también salen arriba y bajan', () => {
    const run = createSurvivalRun(computeStats({ muralla: 20 }), 600, 20, 30, 4);
    run.cursor = { x: -999, y: -999 };
    run.muro.max = run.muro.vida = 1e9;
    run.oleadas!.ola = 4;
    let jefe: { id: number; y: number } | null = null;
    for (let i = 0; i < 200 && !jefe; i++) for (const e of stepRun(run, 0.05)) if (e.type === 'spawn' && ENEMIES[e.kind].jefe) jefe = { id: e.id, y: e.y };
    expect(jefe).not.toBeNull();
    expect(jefe!.y).toBeLessThanOrEqual(run.arriba + 20);
    for (let i = 0; i < 400; i++) stepRun(run, 0.05);
    const ahora = run.enemies.find((e) => e.id === jefe!.id);
    expect(ahora && ahora.y).toBeGreaterThan(jefe!.y + 40);
  });
});

describe('oro por ver un anuncio', () => {
  const conNivel = (n: number) => {
    const m = createMeta();
    m.nivel = n;
    m.jugando = n;
    m.oroMinuto = 1000;
    return m;
  };
  const t0 = new Date(2026, 10, 26, 12, 0, 0).getTime();
  it('se abre en el nivel 3 y da lo que ganas en unos minutos jugando (con un mínimo)', () => {
    expect(adStatus(conNivel(2), t0).abierto).toBe(false);
    expect(claimAdGold(conNivel(2), t0)).toBe(0);
    const m = conNivel(ANUNCIO.desde);
    expect(adStatus(m, t0)).toMatchObject({ abierto: true, quedan: ANUNCIO.porDia, espera: 0, oro: ANUNCIO.minutos * 1000 });
    expect(claimAdGold(m, t0)).toBe(ANUNCIO.minutos * 1000);
    expect(m.oro).toBe(ANUNCIO.minutos * 1000);
    m.oroMinuto = 0.01;
    expect(adGold(m)).toBe(ANUNCIO.minimo);
  });
  it('hay que esperar entre uno y otro, y como mucho unos cuantos al día; al otro día vuelven', () => {
    const m = conNivel(10);
    expect(claimAdGold(m, t0)).toBeGreaterThan(0);
    expect(adStatus(m, t0 + 1000)).toMatchObject({ quedan: ANUNCIO.porDia - 1, espera: ANUNCIO.esperaMs - 1000 });
    expect(claimAdGold(m, t0 + 1000)).toBe(0);
    let t = t0;
    for (let i = 1; i < ANUNCIO.porDia; i++) {
      t += ANUNCIO.esperaMs;
      expect(claimAdGold(m, t)).toBeGreaterThan(0);
    }
    expect(adStatus(m, t + ANUNCIO.esperaMs).quedan).toBe(0);
    expect(canWatchAd(m, t + ANUNCIO.esperaMs)).toBe(false);
    const manana = new Date(2026, 10, 27, 9, 0, 0).getTime();
    expect(adStatus(m, manana)).toMatchObject({ quedan: ANUNCIO.porDia, espera: 0 });
    expect(claimAdGold(m, manana)).toBeGreaterThan(0);
  });
  it('el reloj para atrás no deja esperando; se guarda y tolera guardados raros', () => {
    const m = conNivel(10);
    claimAdGold(m, t0);
    expect(adStatus(m, t0 - 3600_000).espera).toBe(0);
    const otra = loadMeta(JSON.parse(JSON.stringify(m)));
    expect(otra.anuncios).toEqual(m.anuncios);
    expect(loadAnuncios({ dia: 5, vistos: -2, ultimo: 'x' })).toEqual({ dia: '', vistos: 0, ultimo: 0 });
    expect(loadMeta({ nivel: 4 }).anuncios).toEqual({ dia: '', vistos: 0, ultimo: 0 });
  });
  it('con el oro por minuto más bajo: la guardia da 10 % y la app cerrada 5 % (+1 % por nivel de Oro inactivo)', () => {
    expect(GUARDIA.eficiencia).toBe(0.1);
    expect(INACTIVO.eficiencia).toBe(0.05);
    expect(computeStats({ inactivo: TALENT_BY_ID.inactivo.max }).inactivo.eficiencia).toBeCloseTo(0.05 + 0.01 * TALENT_BY_ID.inactivo.max);
  });
});

describe('PvP: poder fácil de leer y los dos ejércitos', () => {
  it('el poder es la raíz del bruto entre la escala: ~cientos al abrir el PvP; las partes suman el total', () => {
    const s = computeStats({ danio: 20, radio: 5, cadencia: 5, mago: 1, magoDanio: 5, arqueros: 1, masArqueros: 3, arcoDanio: 5 });
    const p = powerOf(s);
    expect(p.total).toBeLessThan(5000);
    expect(p.jugador + p.mago + p.arqueros).toBeCloseTo(p.total, 0);
    // 4× más en bruto (todo ×4) → el doble de poder.
    const doble = powerOf({ ...s, danio: s.danio * 4, mago: { ...s.mago, danio: s.mago.danio * 4 }, arqueros: { ...s.arqueros, danio: s.arqueros.danio * 4 }, fuego: { ...s.fuego, dps: s.fuego.dps * 4 } });
    expect(doble.total / p.total).toBeCloseTo(2, 1);
    expect(comprimirPoder(PODER.escala ** 2 * 10_000)).toBeCloseTo(100);
  });
  it('los guardados de antes convierten la base de los rivales a la escala nueva', () => {
    expect(loadPvp({ base: 360_000 }).base).toBeCloseTo(Math.sqrt(360_000) / PODER.escala);
    expect(loadPvp({ base: 120, escala: 2 }).base).toBe(120);
    expect(emptyPvp().escala).toBe(2);
  });
  it('tu ejército sale de tu árbol y tu equipo; el del rival se parece, con más arqueros si es más fuerte', () => {
    const m = { ...createMeta(), nivel: 30 };
    m.talentos = { arqueros: 1, masArqueros: 2, mago: 1 };
    m.equipo.niveles = { baculo: 5, tunica: 5, sombrero: 3 };
    const mio = myArmy(m);
    expect(mio).toMatchObject({ arqueros: 3, mago: true, caballero: false, sacerdote: false, etapas: { mago: 2, arqueros: 0, base: 0 } });
    const fuerte = rivalArmy(mio, 2.5, 5, 'r1');
    const flojo = rivalArmy(mio, 0.4, 0, 'r1');
    expect(fuerte.arqueros).toBeGreaterThan(flojo.arqueros);
    expect(fuerte.etapas.base).toBeGreaterThan(flojo.etapas.base);
    expect(rivalArmy(mio, 1, 2, 'r7')).toEqual(rivalArmy(mio, 1, 2, 'r7'));
    for (const id of ['r1', 'r2', 'r3', 'r4']) {
      const e = rivalArmy({ arqueros: 0, mago: false, caballero: false, sacerdote: false, etapas: { mago: 0, arqueros: 0, base: 0 } }, 1, 0, id);
      expect(e.arqueros).toBeGreaterThanOrEqual(1);
      expect(e.arqueros).toBeLessThanOrEqual(6);
    }
  });
});

describe('caballero y sacerdote', () => {
  const quieto = (run: Run) => {
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    run.disparo = Infinity;
  };
  it('se compran desde el nivel 21 y 31, cada uno con su sección (7 y 6 mejoras)', () => {
    const m = createMeta();
    m.oro = 1e12;
    m.nivel = CABALLERO_DESDE - 1;
    expect(talentState(m, TALENT_BY_ID.caballero)).toBe('bloqueado');
    m.nivel = CABALLERO_DESDE;
    expect(buyTalent(m, 'caballero')).toBe(true);
    expect(talentState(m, TALENT_BY_ID.sacerdote)).toBe('bloqueado');
    m.nivel = SACERDOTE_DESDE;
    expect(buyTalent(m, 'sacerdote')).toBe(true);
    expect(TALENTS.filter((t) => t.seccion === 'caballero')).toHaveLength(7);
    expect(TALENTS.filter((t) => t.seccion === 'sacerdote')).toHaveLength(6);
    const s = computeStats({ caballero: 1, sacerdote: 1 });
    expect(s.caballero.activo && s.sacerdote.activo).toBe(true);
    expect(computeStats({ caballero: 1, espada: 4 }).caballero.danio).toBeCloseTo(s.caballero.danio * 3);
    expect(computeStats({ caballero: 1, coraza: 5 }).caballero.vida).toBeCloseTo(s.caballero.vida * 3);
    expect(computeStats({ sacerdote: 1, sanar: 2 }).sacerdote.curaCaballero).toBeGreaterThan(s.sacerdote.curaCaballero);
  });
  it('el caballero camina hasta un enemigo, le da tajos y lo revienta (daño físico)', () => {
    const run = createRun(computeStats({ danio: 10, caballero: 1 }), 600, 22, 1);
    quieto(run);
    const c = run.caballero!;
    expect(c).not.toBeNull();
    run.enemies.push({ id: 900, kind: 'verde', x: 100, y: 200, vx: 0, vy: 0, vida: 50, vidaMax: 50, giro: 99 });
    const y0 = c.y;
    const ev: RunEvent[] = [];
    for (let i = 0; i < 200 && run.enemies.some((e) => e.id === 900); i++) ev.push(...stepRun(run, 0.05));
    expect(c.y).toBeLessThan(y0);
    expect(ev.some((e) => e.type === 'knightHit')).toBe(true);
    expect(ev.some((e) => e.type === 'kill' && e.id === 900 && e.fuente === 'caballero')).toBe(true);
  });
  it('los que lo tocan le pegan; si se queda sin vida cae y vuelve con toda su vida (en guardia, no le pegan)', () => {
    const run = createRun(computeStats({ caballero: 1 }), 600, 30, 2);
    quieto(run);
    const c = run.caballero!;
    for (let i = 0; i < 4; i++) run.enemies.push({ id: 910 + i, kind: 'minotauro', x: c.x + (i - 1.5) * 6, y: c.y - 6, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99 });
    const ev: RunEvent[] = [];
    for (let i = 0; i < 2000 && !ev.some((e) => e.type === 'knightDown'); i++) ev.push(...stepRun(run, 0.05));
    expect(ev.some((e) => e.type === 'knightDown')).toBe(true);
    expect(c.caido).toBeGreaterThan(0);
    run.enemies = [];
    for (let i = 0; i < 400 && !ev.some((e) => e.type === 'knightUp'); i++) ev.push(...stepRun(run, 0.05));
    expect(ev.some((e) => e.type === 'knightUp')).toBe(true);
    expect(c.vida).toBe(c.max);
    const g = createGuardRun(computeStats({ caballero: 1 }), 600, 30, 1, 3);
    const k = g.caballero!;
    g.enemies.push({ id: 920, kind: 'minotauro', x: k.x, y: k.y - 6, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99 });
    for (let i = 0; i < 200; i++) stepRun(g, 0.05);
    expect(k.vida).toBe(k.max);
  });
  it('en la Supervivencia frena a los que marchan: se quedan peleando con él', () => {
    const run = createSurvivalRun(computeStats({ caballero: 1, coraza: 15 }), 600, 5, 10, 4);
    run.cursor = { x: -999, y: -999 };
    const c = run.caballero!;
    run.enemies.push({ id: 930, kind: 'orco', x: c.x, y: c.y - 40, vx: 0, vy: 0, vida: 1e9, vidaMax: 1e9, giro: 99, tiro: 99 });
    for (let i = 0; i < 100; i++) stepRun(run, 0.05);
    const o = run.enemies.find((e) => e.id === 930)!;
    expect(o.y).toBeLessThan(c.y);
    expect(Math.hypot(o.x - c.x, o.y - c.y)).toBeLessThan(ENEMIES.orco.radio + KNIGHT_R + 6);
  });
  it('el sacerdote tira columnas de luz (daño de luz: a los esqueletos les duele más) al de más vida', () => {
    const run = createRun(computeStats({ danio: 10, sacerdote: 1 }), 600, 32, 5);
    quieto(run);
    run.enemies.push({ id: 940, kind: 'esqueleto', x: 120, y: 200, vx: 0, vy: 0, vida: 1e6, vidaMax: 1e6, giro: 99 });
    run.enemies.push({ id: 941, kind: 'verde', x: 250, y: 200, vx: 0, vy: 0, vida: 10, vidaMax: 10, giro: 99 });
    const ev: RunEvent[] = [];
    for (let i = 0; i < 80; i++) ev.push(...stepRun(run, 0.05));
    const luz = ev.filter((e): e is Extract<RunEvent, { type: 'hit' }> => e.type === 'hit' && e.fuente === 'sacerdote');
    expect(luz.length).toBeGreaterThan(0);
    expect(luz[0]!.id).toBe(940);
    expect(luz[0]!.efecto).toBe('debil');
    expect(DAMAGE_TYPE_OF.sacerdote).toBe('luz');
  });
  it('el sacerdote cura al caballero y a la muralla, de a poco', () => {
    const run = createRun(computeStats({ caballero: 1, sacerdote: 1 }), 600, 32, 6);
    quieto(run);
    run.caballero!.vida = run.caballero!.max * 0.5;
    run.muro.vida = run.muro.max * 0.5;
    const ev: RunEvent[] = [];
    for (let i = 0; i < Math.ceil((BASE.sacerdote.cadaCura + 0.1) / 0.05); i++) ev.push(...stepRun(run, 0.05));
    expect(ev.filter((e) => e.type === 'heal').map((e) => (e as { a: string }).a).sort()).toEqual(['caballero', 'muro']);
    expect(run.caballero!.vida).toBeCloseTo(run.caballero!.max * (0.5 + BASE.sacerdote.curaCaballero));
    expect(run.muro.vida).toBeCloseTo(run.muro.max * (0.5 + BASE.sacerdote.curaMuro));
  });
  it('con sacerdote, los arqueros dejan libre el último hueco de la muralla', () => {
    const run = createRun(computeStats({ arqueros: 1, masArqueros: 5, sacerdote: 1 }), 600, 32, 7);
    const xs = archerSpots(run).map((p) => p.x);
    expect(Math.max(...xs)).toBeLessThan(priestSpot(run).x);
  });
});
