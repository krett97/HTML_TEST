// La escena: la explanada de pasto, los slimes, tu círculo donde llueven flechas, el mago con sus
// bolas de fuego y los arqueros. Solo dibuja: la partida vive en core/run.ts y la avanza el
// controlador (app/juego.ts) en cada cuadro.
import Phaser from 'phaser';
import type { Juego } from '../app/juego';
import { ENEMIES, levelConfig, type EnemyKind, type ZoneId } from '../core/datos';
import { formatNum } from '../core/format';
import { crearFuenteNumeros, NUMEROS } from './numeros';
import { ALLY_ROW, archerSpots, autoAiming, FIELD_W, wizardSpot, type Forma, type Run, type RunEvent } from '../core/run';

const URLS = import.meta.glob<string>('../assets/arte/*.png', { eager: true, query: '?url', import: 'default' });

/** Profundidades (de atrás hacia adelante). */
const D = { pasto: 0, deco: 1, mancha: 2, fuego: 3, sombra: 3.5, slime: 4, aliado: 6, muro: 6.2, flecha: 6.5, destello: 7, particula: 8, numero: 9, cursor: 10 };
/** Medidas de los PNG (px) y cómo se ven en el campo (unidades). */
const MAGO = { px: 150, alto: 46 };
const ARQUERO = { px: 120, alto: 34 };
const FLECHA_PX = 72;
/** Cuántas cosas a la vez, como máximo (con cientos de slimes no caben todas). */
const MAX_NUMEROS = 70;
const MAX_MANCHAS = 60;
const COLOR: Record<EnemyKind, number> = { verde: 0x8be06a, azul: 0x5cc1f2, rojo: 0xff6b5e, rey: 0xffa53a, goblin: 0x7cc35a, lobo: 0x9aa0ad, orco: 0x8aa070, orcoArquero: 0x8aa070, loboBlanco: 0xf4f6fb };
/** Textura de cada enemigo y su ancho (el jefe va en un lienzo más grande, con corona). */
const TEXTURA: Record<EnemyKind, { key: string; base: (radio: number) => number; origenY: number }> = {
  verde: { key: 'slime_verde', base: (r) => (r * 2.3) / 96, origenY: 0.92 },
  azul: { key: 'slime_azul', base: (r) => (r * 2.3) / 96, origenY: 0.92 },
  rojo: { key: 'slime_rojo', base: (r) => (r * 2.3) / 96, origenY: 0.92 },
  rey: { key: 'jefe_rey', base: (r) => (r * 3.2) / 200, origenY: 0.91 },
  goblin: { key: 'goblin', base: (r) => (r * 2.5) / 96, origenY: 0.96 },
  lobo: { key: 'lobo', base: (r) => (r * 3) / 112, origenY: 0.93 },
  orco: { key: 'orco', base: (r) => (r * 2.5) / 112, origenY: 0.97 },
  orcoArquero: { key: 'orcoArquero', base: (r) => (r * 2.5) / 112, origenY: 0.97 },
  loboBlanco: { key: 'loboBlanco', base: (r) => (r * 4) / 140, origenY: 0.9 },
};
/** Lo que hay tirado en el pasto según la zona (clave del dibujo y su escala). */
const ADORNOS: Record<ZoneId, [string, number][]> = {
  campo: [['flor_blanca', 0.2], ['flor_roja', 0.2], ['piedra', 0.24], ['arbusto', 0.3]],
  batalla: [['espada', 0.22], ['tabla', 0.22], ['escudo', 0.26], ['piedra', 0.22], ['espada', 0.2], ['flor_blanca', 0.16]],
};
const AMARILLO = 0xffd23f;
const AZUL_AUTO = 0x6cc8f5;
const FUEGO = 0xff8a2a;
const CAFE = 0x3a2518;

interface SlimeVisual {
  img: Phaser.GameObjects.Image;
  sombra: Phaser.GameObjects.Image;
  base: number;
  /** 1 al recibir un golpe; baja a 0 (el apachurrón). */
  golpe: number;
  /** 0 → 1 al aparecer. */
  nace: number;
  fase: number;
  /** El jefe en el aire: cuánto lleva del brinco y cuánto dura (0: en el piso). */
  salto: number;
  saltoDura: number;
}

interface Numero {
  text: Phaser.GameObjects.BitmapText;
  vida: number;
  x: number;
  y: number;
}

interface FuegoVisual {
  /** Tierra quemada (oscura) y el borde de brasas (brilla y titila). */
  img: Phaser.GameObjects.Image;
  borde: Phaser.GameObjects.Image;
  restante: number;
  total: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Campo extends Phaser.Scene {
  private pasto!: Phaser.GameObjects.TileSprite;
  /** La muralla de abajo (se repite a lo ancho), su sombra sobre el pasto y la torre del mago. */
  private muralla!: Phaser.GameObjects.TileSprite;
  private sombraMuro!: Phaser.GameObjects.Image;
  private torre!: Phaser.GameObjects.Image;
  private cursor!: Phaser.GameObjects.Graphics;
  private cursorR = 0;
  /** Si el círculo se dibujó en modo autoapuntado (azul). */
  private cursorAuto = false;
  private readonly cursorPos = { x: FIELD_W / 2, y: 280 };
  private mago!: Phaser.GameObjects.Image;
  private arqueros: Phaser.GameObjects.Image[] = [];
  private flechas!: Phaser.GameObjects.Graphics;
  private readonly slimes = new Map<number, SlimeVisual>();
  private readonly libres: SlimeVisual[] = [];
  private readonly numeros: Numero[] = [];
  private readonly numerosLibres: Phaser.GameObjects.BitmapText[] = [];
  private readonly manchas: Phaser.GameObjects.Image[] = [];
  private readonly fuegos: FuegoVisual[] = [];
  private readonly lluviaLibre: Phaser.GameObjects.Image[] = [];
  private decoraciones: Phaser.GameObjects.Image[] = [];
  private emisores!: Record<EnemyKind | 'fuego' | 'llama' | 'polvo' | 'aparece' | 'confeti' | 'piedra', Phaser.GameObjects.Particles.ParticleEmitter>;
  /** Las piedras de los rojos en el aire y la barra de vida de la muralla. */
  private piedrasG!: Phaser.GameObjects.Graphics;
  private barraMuro!: Phaser.GameObjects.Graphics;
  private zoom = 1;
  private tiempo = 0;
  private unsub: (() => void)[] = [];

  constructor(private readonly juego: Juego) {
    super('campo');
  }

  /** Alto del campo en unidades (el ancho siempre es FIELD_W). */
  get alto(): number {
    return this.scale.height / this.zoom;
  }

  preload(): void {
    for (const [path, url] of Object.entries(URLS)) this.load.image(path.slice(path.lastIndexOf('/') + 1, -4), url);
  }

  create(): void {
    this.texturas();
    crearFuenteNumeros(this);
    this.ajustarCamara();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.ajustarCamara, this);

    this.pasto = this.add.tileSprite(0, 0, FIELD_W, this.alto + 4, 'pasto').setOrigin(0, 0).setTileScale(0.36).setDepth(D.pasto);
    // El arte de la muralla y la torre va a 8 px por unidad.
    this.muralla = this.add.tileSprite(0, 0, FIELD_W, ALLY_ROW, 'muralla').setOrigin(0, 0).setTileScale(1 / 8).setDepth(D.muro);
    this.sombraMuro = this.add.image(0, 0, 'rectangulo').setOrigin(0, 1).setTint(0x1e4a2a).setAlpha(0.25).setDepth(D.sombra - 0.1);
    this.torre = this.add.image(0, 0, 'torre').setOrigin(0, 1).setScale(1 / 8).setDepth(D.muro + 0.01);
    this.colocarMuralla();
    this.cursor = this.add.graphics().setDepth(D.cursor);
    this.flechas = this.add.graphics().setDepth(D.flecha);
    this.piedrasG = this.add.graphics().setDepth(D.flecha);
    this.barraMuro = this.add.graphics().setDepth(D.muro + 0.1);
    this.mago = this.add.image(0, 0, 'mago').setOrigin(0.5, 1).setScale(MAGO.alto / MAGO.px).setDepth(D.aliado).setVisible(false);

    const particulas = (tint: number, extra: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) =>
      this.add
        .particles(0, 0, 'gota', {
          speed: { min: 40, max: 120 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.09, end: 0 },
          lifespan: { min: 260, max: 520 },
          gravityY: 120,
          tint,
          emitting: false,
          ...extra,
        })
        .setDepth(D.particula);
    this.emisores = {
      verde: particulas(COLOR.verde),
      azul: particulas(COLOR.azul),
      rojo: particulas(COLOR.rojo),
      rey: particulas(COLOR.rey, { speed: { min: 60, max: 200 }, scale: { start: 0.16, end: 0 }, lifespan: { min: 400, max: 800 } }),
      goblin: particulas(COLOR.goblin),
      lobo: particulas(COLOR.lobo),
      orco: particulas(COLOR.orco, { scale: { start: 0.11, end: 0 } }),
      orcoArquero: particulas(COLOR.orcoArquero, { scale: { start: 0.11, end: 0 } }),
      loboBlanco: particulas(COLOR.loboBlanco, { speed: { min: 60, max: 200 }, scale: { start: 0.16, end: 0 }, lifespan: { min: 400, max: 800 } }),
      piedra: particulas(0xc9c0b2, { speed: { min: 40, max: 110 }, angle: { min: 200, max: 340 }, gravityY: 300, scale: { start: 0.07, end: 0.03 }, lifespan: 500, tint: [0xc9c0b2, 0xa89e8f, 0x8a7f70] }),
      fuego: particulas(FUEGO, { speed: { min: 50, max: 140 }, scale: { start: 0.1, end: 0 }, gravityY: -30, tint: [FUEGO, AMARILLO, 0xef5a4c] }),
      llama: particulas(FUEGO, { gravityY: -90, speed: { min: 5, max: 25 }, angle: { min: 250, max: 290 }, scale: { start: 0.07, end: 0 }, lifespan: 420, tint: [FUEGO, AMARILLO] }),
      polvo: particulas(0xf3ead2, { speed: { min: 15, max: 50 }, angle: { min: 200, max: 340 }, scale: { start: 0.06, end: 0 }, lifespan: 300, gravityY: 60 }),
      // La chispa de aparición: estrellitas que giran y se apagan.
      aparece: this.add
        .particles(0, 0, 'chispa', {
          speed: { min: 18, max: 45 },
          angle: { min: 0, max: 360 },
          rotate: { start: 0, end: 180 },
          scale: { start: 0.14, end: 0 },
          lifespan: 380,
          tint: [0xffffff, 0xfff3a0, 0xffd23f],
          emitting: false,
        })
        .setDepth(D.particula),
      confeti: particulas(0xffffff, { speed: { min: 80, max: 220 }, angle: { min: 220, max: 320 }, gravityY: 260, scale: { start: 0.08, end: 0.04 }, lifespan: 1400, tint: [0xef5a4c, 0xffd23f, 0x5ec47a, 0x5cc1f2, 0xa46cf0] }),
    };


    // Se toca para mover el círculo; si se arrastra, el círculo sigue al dedo.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => this.juego.tap(p.worldX, p.worldY));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.juego.tap(p.worldX, p.worldY);
    });

    this.unsub.push(
      this.juego.onEvents((events, run) => this.dibujar(events, run)),
      this.juego.onPlay(() => this.nuevaPartida()),
      this.juego.onGuard(() => this.nuevaGuardia()),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsub.forEach((off) => off()));

    if (this.juego.fase === 'jugando') this.nuevaPartida();
    else this.nuevaGuardia();
  }

  /** Texturas hechas en código: la gota de las partículas, disco, anillo, rectángulo, bola de fuego y sombra. */
  private texturas(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillCircle(32, 32, 32).generateTexture('gota', 64, 64).clear();
    g.fillStyle(0xffffff).fillCircle(64, 64, 64).generateTexture('disco', 128, 128).clear();
    g.lineStyle(10, 0xffffff).strokeCircle(64, 64, 58).generateTexture('anillo', 128, 128).clear();
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, 128, 48, 14).generateTexture('rectangulo', 128, 48).clear();
    // El cuadrado de la explosión del mago (y del suelo en llamas) y su borde.
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, 128, 128, 18).generateTexture('cuadro', 128, 128).clear();
    g.lineStyle(7, 0xffffff).strokeRoundedRect(4, 4, 120, 120, 16).generateTexture('marco', 128, 128).clear();
    g.fillStyle(0xef5a4c).fillCircle(32, 32, 30).fillStyle(FUEGO).fillCircle(30, 30, 22).fillStyle(AMARILLO).fillCircle(27, 27, 12).generateTexture('bola', 64, 64).clear();
    // Estrellita de cuatro puntas: la chispa con que aparecen los slimes.
    g.fillStyle(0xffffff).fillPoints([0, -32, 7, -7, 32, 0, 7, 7, 0, 32, -7, 7, -32, 0, -7, -7].reduce<Phaser.Math.Vector2[]>((acc, v, i, arr) => (i % 2 ? acc : [...acc, new Phaser.Math.Vector2(arr[i]! + 32, arr[i + 1]! + 32)]), []), true).generateTexture('chispa', 64, 64).clear();
    g.fillStyle(0x1e4a2a, 0.28).fillEllipse(32, 12, 64, 24).generateTexture('sombra', 64, 24).destroy();
  }

  private ajustarCamara(): void {
    this.zoom = this.scale.width / FIELD_W;
    this.cameras.main.setOrigin(0, 0).setZoom(this.zoom).setScroll(0, 0);
    this.pasto?.setSize(FIELD_W, this.alto + 4);
    if (this.muralla) this.colocarMuralla();
  }

  private colocarMuralla(): void {
    const top = this.alto - ALLY_ROW;
    this.muralla.setPosition(0, top);
    this.sombraMuro.setPosition(0, top + 9).setScale(FIELD_W / 128, 10 / 48);
    this.torre.setPosition(0, this.alto);
  }

  /** Arriba van la barra del nivel, el reloj y el oro (unos 92 px de pantalla): ahí no salen slimes ni adornos. */
  private libreArriba(): number {
    const pxPorUnidad = this.game.canvas.getBoundingClientRect().width / FIELD_W || 1;
    return 92 / pxPorUnidad;
  }

  /** Flores, piedras y arbustos al azar sobre el pasto. */
  private decorar(zona: ZoneId): void {
    this.decoraciones.forEach((d) => d.destroy());
    this.decoraciones = [];
    const tipos = ADORNOS[zona];
    for (let i = 0; i < 16; i++) {
      const [key, scale] = tipos[i % tipos.length]!;
      const img = this.add
        .image(Phaser.Math.Between(10, FIELD_W - 10), Phaser.Math.Between(Math.ceil(this.libreArriba()), Math.max(Math.ceil(this.libreArriba()) + 20, Math.floor(this.alto - ALLY_ROW) - 6)), key)
        .setOrigin(0.5, 1)
        .setScale(scale * Phaser.Math.FloatBetween(0.8, 1.2))
        .setFlipX(Math.random() < 0.5)
        .setDepth(D.deco)
        .setAlpha(0.95);
      this.decoraciones.push(img);
    }
  }

  /** Deja el campo vacío: sin slimes, números, manchas ni fuego. */
  private limpiar(): void {
    for (const v of this.slimes.values()) this.soltar(v);
    this.slimes.clear();
    for (const n of this.numeros) this.numerosLibres.push(n.text.setVisible(false));
    this.numeros.length = 0;
    this.manchas.forEach((m) => m.destroy());
    this.manchas.length = 0;
    this.fuegos.forEach((f) => (f.img.destroy(), f.borde.destroy()));
    this.fuegos.length = 0;
  }

  /** El mago y los arqueros en su lugar (los que haya), y la muralla entera. */
  private colocarTropas(run: Run): void {
    const m = wizardSpot(run);
    this.mago.setVisible(run.stats.mago.activo).setPosition(m.x, m.y).clearTint().setAngle(0).setAlpha(1);
    this.muralla.clearTint();
    this.torre.clearTint();
    this.arqueros.forEach((a) => a.destroy());
    this.arqueros = archerSpots(run).map((p) => this.add.image(p.x, p.y, 'arquero').setOrigin(0.5, 1).setScale(ARQUERO.alto / ARQUERO.px).setDepth(D.aliado));
  }

  private nuevaPartida(): void {
    this.limpiar();
    const events = this.juego.start(this.alto, this.libreArriba());
    const run = this.juego.run!;
    this.decorar(run.nivel.zona);
    this.cursorPos.x = run.cursor.x;
    this.cursorPos.y = run.cursor.y;
    this.cursor.setVisible(true);
    this.colocarTropas(run);
    this.dibujar(events, run);
  }

  /** Modo guardia (en el árbol): tus tropas solas contra pocos enemigos. Sin tropas, el campo queda quieto. */
  private nuevaGuardia(): void {
    this.limpiar();
    const events = this.juego.startGuard(this.alto, this.libreArriba());
    const run = this.juego.run;
    if (!run?.guardia) {
      this.decorar(levelConfig(this.juego.meta.jugando).zona);
      this.mago.setVisible(false);
      this.cursor.setVisible(false);
      this.arqueros.forEach((a) => a.destroy());
      this.arqueros = [];
      this.muralla.clearTint();
      this.torre.clearTint();
      return;
    }
    this.decorar(run.nivel.zona);
    this.colocarTropas(run);
    this.dibujar(events, run);
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    this.tiempo += dt;
    this.juego.step(dt);
    const run = this.juego.run;
    // En guardia, si compraste tropas, se acomodan.
    if (run?.guardia && (this.arqueros.length !== run.stats.arqueros.cantidad || this.mago.visible !== run.stats.mago.activo)) this.colocarTropas(run);
    if (run) {
      this.moverSlimes(run, dt);
      this.dibujarCursor(run, dt);
      this.dibujarFlechas(run);
      this.dibujarPiedras(run);
      this.dibujarBarraMuro(run);
    }
    this.moverNumeros(dt);
    this.moverFuegos(dt);
  }

  // ---- Slimes ----

  private tomar(kind: EnemyKind): SlimeVisual {
    const v = this.libres.pop();
    const t = TEXTURA[kind];
    const base = t.base(ENEMIES[kind].radio);
    if (v) {
      v.img.setTexture(t.key).setOrigin(0.5, t.origenY).clearTint().setVisible(true);
      v.sombra.setVisible(true);
      v.base = base;
      v.salto = 0;
      v.saltoDura = 0;
      return v;
    }
    return {
      img: this.add.image(0, 0, t.key).setOrigin(0.5, t.origenY),
      sombra: this.add.image(0, 0, 'sombra').setDepth(D.sombra),
      base,
      golpe: 0,
      nace: 0,
      fase: 0,
      salto: 0,
      saltoDura: 0,
    };
  }

  private soltar(v: SlimeVisual): void {
    v.img.setVisible(false);
    v.sombra.setVisible(false);
    this.libres.push(v);
  }

  private moverSlimes(run: Run, dt: number): void {
    for (const e of run.enemies) {
      const v = this.slimes.get(e.id);
      if (!v) continue;
      v.nace = Math.min(1, v.nace + dt * 6);
      v.golpe = Math.max(0, v.golpe - dt * 7);
      // Saltitos: cada uno a su ritmo (el jefe, más lento y pesado).
      const jefe = run.jefe?.id === e.id;
      const salto = Math.abs(Math.sin(this.tiempo * (jefe ? 2.5 : 5) + v.fase));
      const aplasta = 1 - salto;
      const s = v.base * (v.nace < 1 ? Phaser.Math.Easing.Back.Out(v.nace) : 1);
      // El brinco del jefe: sube en arco y su sombra se queda en el piso.
      let alto = 0;
      if (v.saltoDura > 0) {
        v.salto += dt;
        alto = Math.sin(Math.PI * Math.min(1, v.salto / v.saltoDura)) * 46;
        if (v.salto >= v.saltoDura) v.saltoDura = 0;
      }
      if (jefe) v.img.setTint(run.jefe!.furia && Math.sin(this.tiempo * 12) > 0 ? 0xff8a80 : 0xffffff);
      v.img
        .setPosition(e.x, e.y - salto * (jefe ? 3.5 : 2.4) - alto)
        .setScale(s * (1 + 0.08 * aplasta + 0.25 * v.golpe), s * (1 - 0.08 * aplasta - 0.2 * v.golpe))
        .setDepth(D.slime + e.y / 10000)
        .setFlipX(e.vx < 0);
      v.sombra.setPosition(e.x, e.y + 1).setScale(((ENEMIES[e.kind].radio * 2) / 64) * (1 - 0.2 * salto) * (1 - alto / 120), 0.3);
    }
  }

  // ---- Lo que pasa en la partida ----

  private dibujar(events: RunEvent[], run: Run): void {
    let numeros = 0;
    for (const e of events) {
      switch (e.type) {
        case 'spawn': {
          const v = this.tomar(e.kind);
          v.nace = 0;
          v.golpe = 0;
          v.fase = Math.random() * Math.PI * 2;
          v.img.setPosition(e.x, e.y);
          this.slimes.set(e.id, v);
          this.aparicion(e.x, e.y);
          break;
        }
        case 'hit': {
          const v = this.slimes.get(e.id);
          if (v) v.golpe = 1;
          // Contra una debilidad, número grande y rojizo; contra una fortaleza, chico y gris.
          // Un crítico de tus flechas: número rosa y grande.
          const color = e.efecto === 'critico' ? 0xff5ad2 : e.efecto === 'debil' ? 0xff7043 : e.efecto === 'fuerte' ? 0xa0a8b8 : e.fuente === 'fuego' ? 0xffb15c : 0xffffff;
          const tamano = e.efecto === 'critico' ? 11.5 : e.efecto === 'debil' ? 10.5 : e.efecto === 'fuerte' ? 6.5 : 8;
          // Al jefe aturdido: números dorados y grandes (le duele doble).
          const aturdido = run.jefe?.id === e.id && run.jefe.aturdido > 0;
          const alto = run.jefe?.id === e.id ? 30 : 10;
          if (aturdido) this.numero(e.x, e.y - alto, e.danio, 0xffd23f, 12);
          else if (numeros++ < 30 || run.jefe?.id === e.id || e.efecto === 'critico') this.numero(e.x, e.y - alto, e.danio, color, tamano);
          break;
        }
        case 'kill': {
          const v = this.slimes.get(e.id);
          if (v) {
            this.soltar(v);
            this.slimes.delete(e.id);
          }
          if (ENEMIES[e.kind].jefe) {
            // ¡Cayó el jefe! Gran explosión de baba, confeti y sacudida.
            for (let i = 0; i < 4; i++) this.time.delayedCall(i * 80, () => this.emisores[e.kind].explode(25, e.x + Phaser.Math.Between(-20, 20), e.y - 20));
            this.emisores.confeti.explode(40, e.x, e.y - 30);
            this.sacudir(380, 0.005);
            this.cameras.main.flash(300, 255, 220, 160);
            for (let i = 0; i < 5; i++) this.mancha(e.x + Phaser.Math.Between(-25, 25), e.y + Phaser.Math.Between(-10, 10), COLOR[e.kind]);
          } else this.emisores[e.kind].explode(e.kind === 'azul' ? 12 : 8, e.x, e.y - 6);
          this.mancha(e.x, e.y, COLOR[e.kind]);
          // En guardia, lo que sale es el oro que da cada uno.
          if (run.guardia) this.numero(e.x, e.y - 12, e.oro, 0xffc93c, 9, '+');
          else if (numeros++ < 30) this.numero(e.x, e.y - 12, e.danio, 0xffe27a);
          break;
        }
        case 'shot':
          if (e.fuente === 'mago') this.bolaDeFuego(e.x, e.y, e.demora);
          else if (e.forma.tipo === 'circulo') this.lluvia(e.x, e.y, e.forma.r, e.demora);
          break;
        case 'impact':
          this.impacto(e.x, e.y, e.forma, e.fuente === 'mago');
          break;
        case 'fire': {
          const img = this.add.image(e.x, e.y, 'cuadro').setTint(0x5a240c).setAlpha(0.4).setScale(e.w / 128, e.h / 128).setDepth(D.fuego);
          const borde = this.add.image(e.x, e.y, 'marco').setTint(0xff7a1a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9).setScale(e.w / 128, e.h / 128).setDepth(D.fuego);
          this.fuegos.push({ img, borde, restante: e.duracion, total: e.duracion, x: e.x, y: e.y, w: e.w, h: e.h });
          break;
        }
        case 'volley': {
          const a = this.arqueros[e.arquero];
          if (a) {
            const y = archerSpots(run)[e.arquero]?.y ?? a.y;
            this.tweens.killTweensOf(a);
            a.setY(y);
            this.tweens.add({ targets: a, y: y - 3, duration: 70, yoyo: true, ease: 'Quad.out' });
          }
          break;
        }
        case 'sling': {
          // Tira algo (se encoge al soltarlo) o, si es un orco pegado a la muralla, la golpea.
          const v = this.slimes.get(e.id);
          if (v) v.golpe = e.tipo === 'golpe' ? 1 : 0.7;
          if (e.tipo === 'golpe') this.emisores.piedra.explode(5, e.x, this.alto - ALLY_ROW + 8);
          else this.emisores.polvo.explode(3, e.x, e.y - 4);
          break;
        }
        case 'wallHit': {
          this.emisores.piedra.explode(7, e.x, e.y);
          for (const img of [this.muralla, this.torre]) img.setTint(0xffa090);
          this.time.delayedCall(90, () => {
            if (!this.juego.run?.muro.caido) for (const img of [this.muralla, this.torre]) img.clearTint();
          });
          // Solo los golpes fuertes (jefes) mueven un poco la pantalla; los normales, no.
          if (e.danio >= 10) this.sacudir(90, 0.0015);
          break;
        }
        case 'bossJump': {
          const v = this.slimes.get(e.id);
          const embiste = run.jefe?.def.mueve === 'embestida';
          if (v) {
            // El Rey brinca en arco; el Lobo embiste por el piso (se estira y deja una estela de polvo).
            v.salto = 0;
            v.saltoDura = embiste ? 0 : e.dura;
            v.golpe = embiste ? -0.6 : 0.8;
          }
          if (embiste) {
            const pasos = 8;
            for (let i = 0; i <= pasos; i++) {
              const t = i / pasos;
              this.time.delayedCall(t * e.dura * 1000, () => this.emisores.polvo.explode(4, e.x + (e.tx - e.x) * t, e.y + (e.ty - e.y) * t));
            }
          } else this.emisores.polvo.explode(10, e.x, e.y);
          break;
        }
        case 'bossStun':
          // Cae de golpe: polvo, anillo y sacudida. Queda aturdido (estrellitas).
          this.emisores.polvo.explode(24, e.x, e.y);
          this.anilloEn(e.x, e.y, 0xffffff, 0.55);
          this.sacudir(140, 0.0025);
          break;
        case 'bossSummon': {
          const v = this.slimes.get(e.id);
          if (v) v.golpe = 1;
          this.emisores.aparece.explode(16, e.x, e.y - 20);
          break;
        }
        case 'bossThrow': {
          const v = this.slimes.get(e.id);
          if (v) v.golpe = 0.9;
          break;
        }
        case 'bossRage':
          this.cameras.main.flash(260, 255, 90, 70);
          this.sacudir(220, 0.003);
          break;
        case 'wallDown':
          this.derrumbe(run);
          break;
        case 'wallRepair': {
          // El albañil la parcha: destello verde y polvito a lo largo de la muralla.
          for (const img of [this.muralla, this.torre]) img.setTint(0xa8f0a0);
          this.time.delayedCall(260, () => {
            if (!this.juego.run?.muro.caido) for (const img of [this.muralla, this.torre]) img.clearTint();
          });
          const y = this.alto - ALLY_ROW;
          for (let i = 0; i < 6; i++) this.time.delayedCall(i * 50, () => this.emisores.polvo.explode(4, 30 + i * 60, y));
          this.emisores.aparece.explode(14, FIELD_W / 2, y - 10);
          break;
        }
        case 'end':
          if (e.gano) {
            // ¡Nivel superado! Destello y confeti desde abajo.
            this.cameras.main.flash(260, 255, 250, 210);
            for (let i = 0; i < 5; i++) this.time.delayedCall(i * 90, () => this.emisores.confeti.explode(14, 40 + i * 70, this.alto - 60));
          } else {
            // Se acabó el tiempo: un destello rojizo y los slimes que quedan se quedan saltando.
            this.cameras.main.flash(260, 255, 120, 100);
            this.sacudir(140, 0.0015);
          }
          break;
      }
    }
  }

  /** Cayó la muralla: se pone gris, sale polvo, y el mago y los arqueros quedan fuera de combate. */
  private derrumbe(run: Run): void {
    for (const img of [this.muralla, this.torre]) img.setTint(0x8a8378);
    const y = this.alto - ALLY_ROW + 16;
    for (let i = 0; i < 8; i++) this.time.delayedCall(i * 50, () => this.emisores.piedra.explode(10, 20 + i * 45, y));
    for (let i = 0; i < 6; i++) this.emisores.polvo.explode(10, 30 + i * 60, y);
    this.sacudir(260, 0.003);
    const caer = (img: Phaser.GameObjects.Image, lado: number) => {
      this.tweens.killTweensOf(img);
      img.setTint(0x8a8a8a);
      this.tweens.add({ targets: img, angle: 24 * lado, y: img.y + 6, alpha: 0.75, duration: 280, ease: 'Quad.in' });
    };
    if (this.mago.visible) caer(this.mago, -1);
    this.arqueros.forEach((a, i) => caer(a, i % 2 ? 1 : -1));
    void run;
  }

  /** Las piedras de los rojos: vuelan en arco hasta la muralla. */
  private dibujarPiedras(run: Run): void {
    const g = this.piedrasG.clear();
    for (const p of run.piedras) {
      const total = Math.hypot(p.tx - p.sx, p.ty - p.sy) || 1;
      const avance = 1 - Math.hypot(p.tx - p.x, p.ty - p.y) / total;
      if (p.tipo === 'baba') {
        // La bola de baba del Rey: grande, naranja, con brillo, en un arco alto.
        const y = p.y - Math.sin(Math.PI * avance) * 70;
        g.fillStyle(CAFE).fillCircle(p.x, y, 6.5);
        g.fillStyle(COLOR.rey).fillCircle(p.x, y, 5.2);
        g.fillStyle(0xffd59a).fillCircle(p.x - 1.6, y - 1.6, 1.8);
        continue;
      }
      if (p.tipo === 'hoz') {
        // La hoz del Lobo: gira en el aire (media luna plateada con mango).
        const y = p.y - Math.sin(Math.PI * avance) * 40;
        const a = this.tiempo * 14;
        g.lineStyle(4.6, CAFE).beginPath().arc(p.x, y, 7, a, a + 2.4).strokePath();
        g.lineStyle(2.6, 0xdfe5ee).beginPath().arc(p.x, y, 7, a, a + 2.4).strokePath();
        g.lineStyle(2.4, 0xb2733a).lineBetween(p.x, y, p.x + Math.cos(a + 3.6) * 8, y + Math.sin(a + 3.6) * 8);
        continue;
      }
      if (p.tipo === 'lanza' || p.tipo === 'flecha') {
        // Lanza (larga, de madera) o flecha de orco (oscura): apuntan hacia donde van, en un arco bajo.
        const alto = p.tipo === 'lanza' ? 30 : 16;
        const y = p.y - Math.sin(Math.PI * avance) * alto;
        // Dirección: la del camino recto, inclinada por el arco (sube al principio, baja al final).
        const ang = Math.atan2((p.ty - p.sy) / total - (Math.cos(Math.PI * avance) * alto * Math.PI) / total, (p.tx - p.sx) / total);
        const largo = p.tipo === 'lanza' ? 14 : 10;
        const cx = Math.cos(ang);
        const cy = Math.sin(ang);
        const color = p.tipo === 'lanza' ? 0xb2733a : 0x4a3b30;
        g.lineStyle(p.tipo === 'lanza' ? 2.6 : 2, CAFE).lineBetween(p.x - cx * largo, y - cy * largo, p.x, y);
        g.lineStyle(p.tipo === 'lanza' ? 1.4 : 1, color).lineBetween(p.x - cx * largo, y - cy * largo, p.x, y);
        g.fillStyle(0xdfe5ee).fillTriangle(p.x + cx * 3.5, y + cy * 3.5, p.x - cy * 2, y + cx * 2, p.x + cy * 2, y - cx * 2);
        continue;
      }
      const y = p.y - Math.sin(Math.PI * avance) * 34;
      g.fillStyle(CAFE).fillCircle(p.x, y, 2.6);
      g.fillStyle(0xa89e8f).fillCircle(p.x, y, 1.8);
      g.fillStyle(0xffffff, 0.6).fillCircle(p.x - 0.6, y - 0.6, 0.6);
    }
    // Estrellitas girando sobre el jefe aturdido.
    const jefe = run.jefe && run.jefe.aturdido > 0 ? run.enemies.find((e) => e.id === run.jefe!.id) : undefined;
    if (jefe) {
      for (let i = 0; i < 3; i++) {
        const a = this.tiempo * 5 + (i * Math.PI * 2) / 3;
        const x = jefe.x + Math.cos(a) * 16;
        const y = jefe.y - 46 + Math.sin(a) * 5;
        g.fillStyle(CAFE).fillCircle(x, y, 3.2);
        g.fillStyle(0xffd23f).fillCircle(x, y, 2.4);
      }
    }
  }

  private anilloEn(x: number, y: number, tint: number, escala: number): void {
    const anillo = this.add.image(x, y, 'anillo').setTint(tint).setAlpha(0.9).setScale(escala * 0.4).setDepth(D.destello);
    this.tweens.add({ targets: anillo, scale: escala, alpha: 0, duration: 320, ease: 'Quad.out', onComplete: () => anillo.destroy() });
  }

  /** Barra de vida de la muralla (en su cara, a la derecha de la torre): sale cuando hay rojos o ya recibió daño. */
  private dibujarBarraMuro(run: Run): void {
    const g = this.barraMuro.clear();
    const m = run.muro;
    if (run.nivel.rojos <= 0 && m.vida >= m.max) return;
    const x = 56;
    const w = FIELD_W - x - 10;
    const y = this.alto - 11;
    const parte = m.max > 0 ? m.vida / m.max : 0;
    g.fillStyle(CAFE).fillRoundedRect(x - 1.2, y - 1.2, w + 2.4, 7.4, 3.5);
    g.fillStyle(0x5a3a2a).fillRoundedRect(x, y, w, 5, 2.5);
    if (parte > 0) g.fillStyle(parte > 0.5 ? 0x7fd36a : parte > 0.25 ? 0xffd23f : 0xef5a4c).fillRoundedRect(x, y, Math.max(5, w * parte), 5, 2.5);
  }

  /** Un slime aparece: chispa de estrellitas y un anillo blanco que se abre (lo demás lo hace el rebote al nacer). */
  private aparicion(x: number, y: number): void {
    this.emisores.aparece.explode(5, x, y - 6);
    const anillo = this.add.image(x, y - 6, 'anillo').setAlpha(0.85).setScale(0.05).setDepth(D.destello);
    this.tweens.add({ targets: anillo, scale: 0.2, alpha: 0, duration: 260, ease: 'Quad.out', onComplete: () => anillo.destroy() });
  }

  /** Tu disparo: caen flechas del cielo a puntos al azar dentro del círculo. */
  private lluvia(x: number, y: number, r: number, demora: number): void {
    const n = Phaser.Math.Clamp(Math.round(r / 5), 5, 12);
    const alto = 46;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * r * 0.85;
      const tx = x + Math.cos(a) * d;
      const ty = y + Math.sin(a) * d;
      const img = (this.lluviaLibre.pop() ?? this.add.image(0, 0, 'flecha').setOrigin(0.5, 1).setDepth(D.flecha))
        .setScale(14 / FLECHA_PX)
        .setVisible(true)
        .setAlpha(1)
        .setPosition(tx + 6, ty - alto);
      const retraso = Math.random() * demora * 0.35;
      this.tweens.add({
        targets: img,
        x: tx,
        y: ty,
        delay: retraso,
        duration: demora * 1000 - retraso,
        ease: 'Quad.in',
        onComplete: () => {
          // Clavada un momento en el pasto y se va.
          this.tweens.add({ targets: img, alpha: 0, delay: 120, duration: 160, onComplete: () => this.lluviaLibre.push(img.setVisible(false)) });
        },
      });
    }
  }

  /** La bola de fuego del mago vuela en arco hasta el blanco. */
  private bolaDeFuego(x: number, y: number, demora: number): void {
    const desde = { x: this.mago.x + 11, y: this.mago.y - MAGO.alto * 0.88 };
    const bola = this.add.image(desde.x, desde.y, 'bola').setScale(10 / 64).setDepth(D.destello);
    const t = { p: 0 };
    this.tweens.add({
      targets: t,
      p: 1,
      duration: demora * 1000,
      onUpdate: () => {
        const arco = Math.sin(t.p * Math.PI) * 40;
        bola.setPosition(desde.x + (x - desde.x) * t.p, desde.y + (y - desde.y) * t.p - arco).setAngle(t.p * 540);
        if (Math.random() < 0.6) this.emisores.llama.explode(1, bola.x, bola.y);
      },
      onComplete: () => bola.destroy(),
    });
    this.tweens.killTweensOf(this.mago);
    const base = this.juego.run ? wizardSpot(this.juego.run).y : this.mago.y;
    this.mago.setY(base);
    this.tweens.add({ targets: this.mago, y: base - 4, duration: 90, yoyo: true, ease: 'Quad.out' });
  }

  /** Aterriza un disparo: destello en la forma (círculo amarillo o rectángulo de fuego). */
  private impacto(x: number, y: number, forma: Forma, mago: boolean): void {
    if (forma.tipo === 'circulo') {
      const escala = (forma.r * 2) / 128;
      const disco = this.add.image(x, y, 'disco').setTint(AMARILLO).setAlpha(0.45).setScale(escala).setDepth(D.destello);
      const anillo = this.add.image(x, y, 'anillo').setTint(AMARILLO).setAlpha(0.9).setScale(escala * 0.7).setDepth(D.destello);
      this.tweens.add({ targets: disco, alpha: 0, scale: escala * 1.05, duration: 180, ease: 'Quad.out', onComplete: () => disco.destroy() });
      this.tweens.add({ targets: anillo, alpha: 0, scale: escala * 1.08, duration: 220, ease: 'Quad.out', onComplete: () => anillo.destroy() });
      this.emisores.polvo.explode(6, x, y);
      return;
    }
    const sx = forma.w / 128;
    const sy = forma.h / 128;
    const tint = mago ? FUEGO : AMARILLO;
    const relleno = this.add.image(x, y, 'cuadro').setTint(tint).setAlpha(0.6).setScale(sx, sy).setDepth(D.destello);
    const marco = this.add.image(x, y, 'marco').setTint(0xef5a4c).setAlpha(1).setScale(sx, sy).setDepth(D.destello);
    this.tweens.add({ targets: [relleno, marco], alpha: 0, scaleX: sx * 1.08, scaleY: sy * 1.15, duration: 260, ease: 'Quad.out', onComplete: () => (relleno.destroy(), marco.destroy()) });
    for (let i = 0; i < 14; i++) this.emisores.fuego.explode(1, x + (Math.random() - 0.5) * forma.w, y + (Math.random() - 0.5) * forma.h);
  }

  /**
   * Sacude la cámara, poquito y no seguido: si ya hubo una sacudida hace menos de medio segundo, solo
   * cuenta una más fuerte.
   */
  private ultimaSacudida = { t: -1e9, fuerza: 0 };
  private sacudir(ms: number, fuerza: number): void {
    const ahora = this.time.now;
    if (ahora - this.ultimaSacudida.t < 500 && fuerza <= this.ultimaSacudida.fuerza) return;
    this.ultimaSacudida = { t: ahora, fuerza };
    this.cameras.main.shake(ms, fuerza);
  }

  /** Las flechas de los arqueros en el aire (una raya con punta, hacia su blanco). */
  private dibujarFlechas(run: Run): void {
    const g = this.flechas.clear();
    for (const a of run.arrows) {
      const cx = Math.cos(a.angulo);
      const cy = Math.sin(a.angulo);
      const largo = 9;
      const x0 = a.x - cx * largo;
      const y0 = a.y - cy * largo;
      g.lineStyle(2.2, CAFE, 1).lineBetween(x0, y0, a.x, a.y);
      g.lineStyle(1, 0xd9a066, 1).lineBetween(x0, y0, a.x, a.y);
      g.fillStyle(0x8d93aa).fillTriangle(a.x + cx * 3, a.y + cy * 3, a.x - cy * 1.8, a.y + cx * 1.8, a.x + cy * 1.8, a.y - cx * 1.8);
      g.fillStyle(0xffffff).fillTriangle(x0, y0, x0 - cx * 3 - cy * 2, y0 - cy * 3 + cx * 2, x0 - cx * 3 + cy * 2, y0 - cy * 3 - cx * 2);
    }
  }

  private mancha(x: number, y: number, tint: number): void {
    const img = this.manchas.length >= MAX_MANCHAS ? this.manchas.shift()! : this.add.image(0, 0, 'mancha').setDepth(D.mancha);
    this.tweens.killTweensOf(img);
    img.setPosition(x, y).setTint(tint).setAlpha(0.55).setScale(Phaser.Math.FloatBetween(0.22, 0.32)).setAngle(Phaser.Math.Between(-20, 20));
    this.tweens.add({ targets: img, alpha: 0, delay: 1800, duration: 1400 });
    this.manchas.push(img);
  }

  private moverFuegos(dt: number): void {
    for (let i = this.fuegos.length - 1; i >= 0; i--) {
      const f = this.fuegos[i]!;
      f.restante -= dt;
      if (f.restante <= 0) {
        f.img.destroy();
        f.borde.destroy();
        this.fuegos.splice(i, 1);
        continue;
      }
      const vida = f.restante / f.total;
      f.img.setAlpha(0.15 + 0.25 * vida);
      f.borde.setAlpha((0.5 + 0.4 * vida) * (0.8 + 0.2 * Math.sin(this.tiempo * 30 + i)));
      // Llamitas por todo el cuadro (más al principio).
      const n = vida > 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) this.emisores.llama.explode(1, f.x + (Math.random() - 0.5) * f.w, f.y + (Math.random() - 0.5) * f.h);
    }
  }

  // ---- Tu círculo ----

  private dibujarCursor(run: Run, dt: number): void {
    // En guardia tu círculo descansa.
    this.cursor.setVisible(!run.guardia);
    if (run.guardia) return;
    // El círculo se desliza rápido hasta donde tocaste.
    const k = 1 - Math.pow(0.0005, dt);
    this.cursorPos.x += (run.cursor.x - this.cursorPos.x) * k;
    this.cursorPos.y += (run.cursor.y - this.cursorPos.y) * k;
    const r = run.stats.radio;
    // Cuando apunta solo (Autoapuntado), el círculo se pone azul: así se nota que no es tu dedo.
    const auto = autoAiming(run);
    if (r !== this.cursorR || auto !== this.cursorAuto) {
      this.cursorR = r;
      this.cursorAuto = auto;
      const color = auto ? AZUL_AUTO : AMARILLO;
      const g = this.cursor.clear();
      g.fillStyle(color, 0.16).fillCircle(0, 0, r);
      g.lineStyle(2.4, CAFE, 0.85).strokeCircle(0, 0, r);
      g.lineStyle(1.2, color, 1).strokeCircle(0, 0, r - 1.6);
      g.lineStyle(1.4, CAFE, 0.7).lineBetween(-4, 0, 4, 0).lineBetween(0, -4, 0, 4);
    }
    // Late un poco al disparar.
    const pulso = 1 + 0.04 * Math.max(0, 1 - (run.stats.intervalo - Math.max(0, run.disparo)) / 0.12);
    this.cursor.setPosition(this.cursorPos.x, this.cursorPos.y).setScale(pulso).setVisible(!run.terminada);
  }

  // ---- Números de daño ----

  private numero(x: number, y: number, valor: number, color: number, tamanio = 8, prefijo = ''): void {
    if (this.numeros.length >= MAX_NUMEROS) return;
    const text = this.numerosLibres.pop() ?? this.add.bitmapText(0, 0, NUMEROS, '', 8).setOrigin(0.5).setDepth(D.numero);
    text.setText(prefijo + formatNum(valor)).setFontSize(tamanio).setTint(color).setAlpha(1).setVisible(true);
    const n = { text, vida: 0.6, x: x + Phaser.Math.FloatBetween(-4, 4), y };
    text.setPosition(n.x, n.y);
    this.numeros.push(n);
  }

  private moverNumeros(dt: number): void {
    for (let i = this.numeros.length - 1; i >= 0; i--) {
      const n = this.numeros[i]!;
      n.vida -= dt;
      if (n.vida <= 0) {
        n.text.setVisible(false);
        this.numerosLibres.push(n.text);
        this.numeros.splice(i, 1);
        continue;
      }
      n.y -= dt * 18;
      n.text.setPosition(n.x, n.y).setAlpha(Math.min(1, n.vida / 0.25));
    }
  }
}
