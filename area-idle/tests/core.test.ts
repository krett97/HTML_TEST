import { describe, expect, it } from 'vitest';
import { playAndShop } from '../src/core/bot';
import { AZUL_DESDE, DAMAGE_TYPES, damageMultiplier, ENEMIES, levelConfig, PRIMERA_OLA, SECCIONES, TALENT_BY_ID, TALENTS } from '../src/core/datos';
import { formatClock, formatNum } from '../src/core/format';
import { buyTalent, chooseLevel, costOf, createMeta, finishRun, levelOf, loadMeta, talentState, talentVisible } from '../src/core/meta';
import { ALLY_ROW, archerSpots, createRun, DAMAGE_TYPE_OF, FIELD_W, moveCursor, startRun, stepRun, type Run, type RunEvent } from '../src/core/run';
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
  it('el mago revienta un rectángulo donde hay alguien', () => {
    const run = createRun(computeStats({ mago: 1 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0 };
    run.cursor = { x: -999, y: -999 };
    withEnemy(run, 200, 300, 100);
    const events: RunEvent[] = [];
    for (let i = 0; i < 40; i++) events.push(...stepRun(run, 0.1));
    const magia = events.filter((e) => e.type === 'shot' && e.fuente === 'mago');
    expect(magia.length).toBeGreaterThan(0);
    expect(magia.every((e) => e.type === 'shot' && e.forma.tipo === 'rect')).toBe(true);
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

describe('tipos de daño', () => {
  it('el verde es débil al fuego y el azul fuerte contra él', () => {
    const run = createRun(computeStats({ mago: 1 }), 560, 1, 1);
    run.stats = { ...run.stats, ritmo: 0, mago: { ...run.stats.mago, intervalo: 100, ancho: 400, alto: 400 } };
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
