// La escena: la explanada de pasto, los slimes, tu círculo donde llueven flechas, el mago con sus
// bolas de fuego y los arqueros. Solo dibuja: la partida vive en core/run.ts y la avanza el
// controlador (app/juego.ts) en cada cuadro.
import Phaser from 'phaser';
import type { Juego } from '../app/juego';
import { ENEMIES, type EnemyKind } from '../core/datos';
import { formatNum } from '../core/format';
import { crearFuenteNumeros, NUMEROS } from './numeros';
import { ALLY_ROW, archerSpots, FIELD_W, wizardSpot, type Forma, type Run, type RunEvent } from '../core/run';

const URLS = import.meta.glob<string>('../assets/arte/*.png', { eager: true, query: '?url', import: 'default' });

/** Profundidades (de atrás hacia adelante). */
const D = { pasto: 0, deco: 1, mancha: 2, fuego: 3, sombra: 3.5, slime: 4, aliado: 6, muro: 6.2, flecha: 6.5, destello: 7, particula: 8, numero: 9, cursor: 10 };
/** Medidas de los PNG (px) y cómo se ven en el campo (unidades). */
const SLIME_PX = 96;
const MAGO = { px: 150, alto: 46 };
const ARQUERO = { px: 120, alto: 34 };
const FLECHA_PX = 72;
/** Cuántas cosas a la vez, como máximo (con cientos de slimes no caben todas). */
const MAX_NUMEROS = 70;
const MAX_MANCHAS = 60;
const COLOR: Record<EnemyKind, number> = { verde: 0x8be06a, azul: 0x5cc1f2 };
const AMARILLO = 0xffd23f;
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
}

interface Numero {
  text: Phaser.GameObjects.BitmapText;
  vida: number;
  x: number;
  y: number;
}

interface FuegoVisual {
  img: Phaser.GameObjects.Image;
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
  private emisores!: Record<'verde' | 'azul' | 'fuego' | 'llama' | 'polvo' | 'aparece' | 'confeti', Phaser.GameObjects.Particles.ParticleEmitter>;
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
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsub.forEach((off) => off()));

    if (this.juego.fase === 'jugando') this.nuevaPartida();
    else this.decorar();
  }

  /** Texturas hechas en código: la gota de las partículas, disco, anillo, rectángulo, bola de fuego y sombra. */
  private texturas(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillCircle(32, 32, 32).generateTexture('gota', 64, 64).clear();
    g.fillStyle(0xffffff).fillCircle(64, 64, 64).generateTexture('disco', 128, 128).clear();
    g.lineStyle(10, 0xffffff).strokeCircle(64, 64, 58).generateTexture('anillo', 128, 128).clear();
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, 128, 48, 14).generateTexture('rectangulo', 128, 48).clear();
    g.lineStyle(6, 0xffffff).strokeRoundedRect(3, 3, 122, 42, 12).generateTexture('marco', 128, 48).clear();
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
  private decorar(): void {
    this.decoraciones.forEach((d) => d.destroy());
    this.decoraciones = [];
    const tipos: [string, number][] = [['flor_blanca', 0.2], ['flor_roja', 0.2], ['piedra', 0.24], ['arbusto', 0.3]];
    for (let i = 0; i < 16; i++) {
      const [key, scale] = tipos[i % tipos.length]!;
      const img = this.add
        .image(Phaser.Math.Between(10, FIELD_W - 10), Phaser.Math.Between(Math.ceil(this.libreArriba()), Math.max(Math.ceil(this.libreArriba()) + 20, Math.floor(this.alto - ALLY_ROW) - 6)), key)
        .setOrigin(0.5, 1)
        .setScale(scale * Phaser.Math.FloatBetween(0.8, 1.2))
        .setDepth(D.deco)
        .setAlpha(0.95);
      this.decoraciones.push(img);
    }
  }

  private nuevaPartida(): void {
    for (const v of this.slimes.values()) this.soltar(v);
    this.slimes.clear();
    for (const n of this.numeros) this.numerosLibres.push(n.text.setVisible(false));
    this.numeros.length = 0;
    this.manchas.forEach((m) => m.destroy());
    this.manchas.length = 0;
    this.fuegos.forEach((f) => f.img.destroy());
    this.fuegos.length = 0;
    this.decorar();
    const events = this.juego.start(this.alto, this.libreArriba());
    const run = this.juego.run!;
    this.cursorPos.x = run.cursor.x;
    this.cursorPos.y = run.cursor.y;
    const m = wizardSpot(run);
    this.mago.setVisible(run.stats.mago.activo).setPosition(m.x, m.y);
    this.arqueros.forEach((a) => a.destroy());
    this.arqueros = archerSpots(run).map((p) => this.add.image(p.x, p.y, 'arquero').setOrigin(0.5, 1).setScale(ARQUERO.alto / ARQUERO.px).setDepth(D.aliado));
    this.dibujar(events, run);
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    this.tiempo += dt;
    this.juego.step(dt);
    const run = this.juego.run;
    if (run) {
      this.moverSlimes(run, dt);
      this.dibujarCursor(run, dt);
      this.dibujarFlechas(run);
    }
    this.moverNumeros(dt);
    this.moverFuegos(dt);
  }

  // ---- Slimes ----

  private tomar(kind: EnemyKind): SlimeVisual {
    const v = this.libres.pop();
    const base = (ENEMIES[kind].radio * 2.3) / SLIME_PX;
    if (v) {
      v.img.setTexture(`slime_${kind}`).setVisible(true);
      v.sombra.setVisible(true);
      v.base = base;
      return v;
    }
    return {
      img: this.add.image(0, 0, `slime_${kind}`).setOrigin(0.5, 0.92),
      sombra: this.add.image(0, 0, 'sombra').setDepth(D.sombra),
      base,
      golpe: 0,
      nace: 0,
      fase: 0,
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
      // Saltitos: cada uno a su ritmo.
      const salto = Math.abs(Math.sin(this.tiempo * 5 + v.fase));
      const aplasta = 1 - salto;
      const s = v.base * (v.nace < 1 ? Phaser.Math.Easing.Back.Out(v.nace) : 1);
      v.img
        .setPosition(e.x, e.y - salto * 2.4)
        .setScale(s * (1 + 0.08 * aplasta + 0.25 * v.golpe), s * (1 - 0.08 * aplasta - 0.2 * v.golpe))
        .setDepth(D.slime + e.y / 10000)
        .setFlipX(e.vx < 0);
      v.sombra.setPosition(e.x, e.y + 1).setScale(((ENEMIES[e.kind].radio * 2) / 64) * (1 - 0.2 * salto), 0.3);
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
          const color = e.efecto === 'debil' ? 0xff7043 : e.efecto === 'fuerte' ? 0xa0a8b8 : e.fuente === 'fuego' ? 0xffb15c : 0xffffff;
          if (numeros++ < 30) this.numero(e.x, e.y - 10, e.danio, color, e.efecto === 'debil' ? 10.5 : e.efecto === 'fuerte' ? 6.5 : 8);
          break;
        }
        case 'kill': {
          const v = this.slimes.get(e.id);
          if (v) {
            this.soltar(v);
            this.slimes.delete(e.id);
          }
          this.emisores[e.kind].explode(e.kind === 'azul' ? 12 : 8, e.x, e.y - 6);
          this.mancha(e.x, e.y, COLOR[e.kind]);
          if (numeros++ < 30) this.numero(e.x, e.y - 12, e.danio, 0xffe27a);
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
          const img = this.add.image(e.x, e.y, 'rectangulo').setTint(0xff6a1a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setScale(e.w / 128, e.h / 48).setDepth(D.fuego);
          this.fuegos.push({ img, restante: e.duracion, total: e.duracion, x: e.x, y: e.y, w: e.w, h: e.h });
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
        case 'end':
          if (e.gano) {
            // ¡Nivel superado! Destello y confeti desde abajo.
            this.cameras.main.flash(260, 255, 250, 210);
            for (let i = 0; i < 5; i++) this.time.delayedCall(i * 90, () => this.emisores.confeti.explode(14, 40 + i * 70, this.alto - 60));
          } else {
            // Se acabó el tiempo: un destello rojizo y los slimes que quedan se quedan saltando.
            this.cameras.main.flash(260, 255, 120, 100);
            this.cameras.main.shake(160, 0.004);
          }
          break;
      }
    }
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
    const sy = forma.h / 48;
    const tint = mago ? FUEGO : AMARILLO;
    const relleno = this.add.image(x, y, 'rectangulo').setTint(tint).setAlpha(0.6).setScale(sx, sy).setDepth(D.destello);
    const marco = this.add.image(x, y, 'marco').setTint(0xef5a4c).setAlpha(1).setScale(sx, sy).setDepth(D.destello);
    this.tweens.add({ targets: [relleno, marco], alpha: 0, scaleX: sx * 1.08, scaleY: sy * 1.15, duration: 260, ease: 'Quad.out', onComplete: () => (relleno.destroy(), marco.destroy()) });
    for (let i = 0; i < 14; i++) this.emisores.fuego.explode(1, x + (Math.random() - 0.5) * forma.w, y + (Math.random() - 0.5) * forma.h);
    this.cameras.main.shake(70, 0.0025);
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
        this.fuegos.splice(i, 1);
        continue;
      }
      const vida = f.restante / f.total;
      f.img.setAlpha(0.22 + 0.22 * vida + 0.06 * Math.sin(this.tiempo * 30 + i));
      if (Math.random() < 0.7) this.emisores.llama.explode(1, f.x + (Math.random() - 0.5) * f.w, f.y + (Math.random() - 0.5) * f.h);
    }
  }

  // ---- Tu círculo ----

  private dibujarCursor(run: Run, dt: number): void {
    // El círculo se desliza rápido hasta donde tocaste.
    const k = 1 - Math.pow(0.0005, dt);
    this.cursorPos.x += (run.cursor.x - this.cursorPos.x) * k;
    this.cursorPos.y += (run.cursor.y - this.cursorPos.y) * k;
    const r = run.stats.radio;
    if (r !== this.cursorR) {
      this.cursorR = r;
      const g = this.cursor.clear();
      g.fillStyle(AMARILLO, 0.16).fillCircle(0, 0, r);
      g.lineStyle(2.4, CAFE, 0.85).strokeCircle(0, 0, r);
      g.lineStyle(1.2, AMARILLO, 1).strokeCircle(0, 0, r - 1.6);
      g.lineStyle(1.4, CAFE, 0.7).lineBetween(-4, 0, 4, 0).lineBetween(0, -4, 0, 4);
    }
    // Late un poco al disparar.
    const pulso = 1 + 0.04 * Math.max(0, 1 - (run.stats.intervalo - Math.max(0, run.disparo)) / 0.12);
    this.cursor.setPosition(this.cursorPos.x, this.cursorPos.y).setScale(pulso).setVisible(!run.terminada);
  }

  // ---- Números de daño ----

  private numero(x: number, y: number, valor: number, color: number, tamanio = 8): void {
    if (this.numeros.length >= MAX_NUMEROS) return;
    const text = this.numerosLibres.pop() ?? this.add.bitmapText(0, 0, NUMEROS, '', 8).setOrigin(0.5).setDepth(D.numero);
    text.setText(formatNum(valor)).setFontSize(tamanio).setTint(color).setAlpha(1).setVisible(true);
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
