// La escena: el gato, la mesa y el objeto. Solo dibuja y anima; las reglas están en core/
// y los toques se mandan a Game, que responde con eventos.
import Phaser from 'phaser';
import { get } from 'svelte/store';
import type { HitResult } from '../core/actions';
import { allyLevel } from '../core/allies';
import type { AllyDef, ObjectDef } from '../core/data';
import type { Game, LookChange } from '../app/game';
import { t } from '../i18n';
import { createPlaceholders } from './placeholders';
import { FLOOR_H, SCENE_WIDTH } from './sceneSize';
import { toolLook, type ToolLook } from './sprites';

// Medidas en píxeles virtuales. La escena se ancla abajo: si hay más alto, crece la pared.
const TABLE_H = 44;
const TABLE_LEFT = 18;
/** La orilla. */
const TABLE_RIGHT = 160;
const START_X = 74;
const CAT_W = 20;
/** Dónde va el sombrero respecto al gato (origen abajo a la izquierda): centrado en la cabeza, con las puntas de las orejas asomando. */
const HAT_X = 15;
const HAT_Y = -15;
/** Inclinación máxima de los objetos que se "vuelcan", justo antes de caer. */
const MAX_TILT = 22;
/** Rasguños visibles en los objetos que se "rasgan". */
const MAX_SCRATCHES = 5;

const COLORS = {
  wall: 0x3b2a4d,
  wallDark: 0x30223f,
  floor: 0x6b4a3a,
  floorLine: 0x56392c,
  table: 0x8a5a3c,
  tableEdge: 0x5e3b26,
  window: 0x8fc7e8,
  windowFrame: 0xe8d8c4,
  frame: 0xd9a441,
  picture: 0x5ec4a8,
  scratch: 0x2b1d2f,
};

/** Color de las chispitas que deja cada aliado al golpear. */
const ALLY_SPARK: Record<string, number> = {
  gatito: 0xb8b0c0,
  raton: 0xb8b0c0,
  perro: 0xa8693a,
  perico: 0x4caf50,
  cuervo: 0x45405a,
  mapache: 0x8a8296,
  cabra: 0xfff1e0,
};

interface AllyVisual {
  sprite: Phaser.GameObjects.Image;
  /** Desplazamiento animado sobre su lugar de descanso (los saltitos al atacar). */
  hop: { dx: number; dy: number };
}

export class MainScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Graphics;
  private scratches!: Phaser.GameObjects.Graphics;
  private cat!: Phaser.GameObjects.Image;
  private vehicle!: Phaser.GameObjects.Image;
  private paw!: Phaser.GameObjects.Image;
  private hat!: Phaser.GameObjects.Image;
  private object!: Phaser.GameObjects.Image;
  private objectDef!: ObjectDef;
  private look: ToolLook = toolLook('pata');
  private readonly allies = new Map<string, AllyVisual>();
  private unsubscribers: (() => void)[] = [];

  constructor(private readonly controller: Game) {
    super('principal');
  }

  private get tableTop(): number {
    return this.scale.height - FLOOR_H - TABLE_H;
  }

  create(): void {
    createPlaceholders(this, this.controller.data.objects);

    this.background = this.add.graphics();
    this.paw = this.add.image(0, 0, 'pata').setOrigin(0, 0.5).setDepth(1).setVisible(false);
    this.cat = this.add.image(0, 0, 'gato').setOrigin(0, 1).setDepth(2);
    this.vehicle = this.add.image(0, 0, 'carrito').setOrigin(0.5, 1).setDepth(2.5).setVisible(false);
    this.hat = this.add.image(0, 0, 'sombrero').setOrigin(0.5, 1).setDepth(2.8).setVisible(false);
    this.object = this.add.image(0, 0, '__DEFAULT').setOrigin(0.5, 1).setDepth(3);
    this.scratches = this.add.graphics().setDepth(3.5);
    for (const ally of this.controller.data.allies) {
      const sprite = this.add.image(0, 0, `aliado_${ally.id}`).setOrigin(0, 1).setDepth(ally.id === 'gatito' ? 2.7 : 2.2);
      this.allies.set(ally.id, { sprite, hop: { dx: 0, dy: 0 } });
    }

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    // Se toca en cualquier parte de la escena, no hace falta atinarle al objeto.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.controller.tap());

    this.unsubscribers.push(
      this.controller.events.on('hit', (result) => this.onHit(result)),
      this.controller.events.on('objeto', ({ objectId }) => this.onNewObject(objectId)),
      this.controller.events.on('herramienta', ({ toolId }) => this.onNewTool(toolId)),
      this.controller.events.on('aspecto', ({ cambio }) => this.onNewLook(cambio)),
      this.controller.events.on('aliado', ({ allyId, result }) => this.onAllyHit(allyId, result)),
      this.controller.events.on('aliadoNuevo', ({ allyId }) => this.onNewAlly(allyId)),
      this.controller.events.on('descubrimiento', ({ unlockId }) => this.onDiscovery(unlockId)),
      this.controller.events.on('patrocinio', ({ dinero }) => {
        this.toast(get(t)('patrocinio.gracias', { dinero: this.controller.formatMoney(dinero) }));
        this.floatText(this.object.x, this.object.y - this.object.height - 10, `+$${this.controller.formatMoney(dinero)}`, 'flotante');
      }),
      this.controller.events.on('investigacion', ({ researchId }) => {
        const tr = get(t);
        this.toast(tr('avisos.investigacion', { nombre: tr(`laboratorio.proyectos.${researchId}`) }));
      }),
      this.controller.events.on('reset', () => {
        this.placeObject();
        this.refreshAllies();
      }),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribers.forEach((off) => off());
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  /** Redibuja el fondo y recoloca todo según el tamaño actual. */
  private layout(): void {
    // El área de juego (0..180) queda centrada; lo que sobra a los lados es más cuarto.
    this.cameras.main.setScroll(-Math.floor((this.scale.width - SCENE_WIDTH) / 2), 0);
    this.drawBackground();
    this.placeObject();
    this.refreshAllies();
  }

  /** Cada cuadro: el sombrero va en la cabeza del gato y los aliados siguen su lugar (el gatito, en el lomo). */
  update(): void {
    this.hat.setPosition(this.cat.x + HAT_X, this.cat.y + HAT_Y);
    for (const [id, visual] of this.allies) {
      if (!visual.sprite.visible) continue;
      const base = this.allyRest(id);
      visual.sprite.setPosition(Math.round(base.x + visual.hop.dx), Math.round(base.y + visual.hop.dy));
    }
  }

  private drawBackground(): void {
    const g = this.background.clear();
    const left = this.cameras.main.scrollX;
    const w = this.scale.width;
    const h = this.scale.height;
    const floorY = h - FLOOR_H;
    const top = this.tableTop;

    g.fillStyle(COLORS.wall).fillRect(left, 0, w, floorY);
    g.fillStyle(COLORS.wallDark).fillRect(left, floorY - 6, w, 6); // zoclo

    // Ventana y cuadro, solo si caben arriba de la mesa.
    const windowY = top - 96;
    if (windowY >= 6) {
      g.fillStyle(COLORS.windowFrame).fillRect(22, windowY, 48, 40);
      g.fillStyle(COLORS.window).fillRect(25, windowY + 3, 42, 34);
      g.fillStyle(COLORS.windowFrame).fillRect(45, windowY + 3, 2, 34).fillRect(25, windowY + 19, 42, 2);
    }
    const pictureY = top - 70;
    if (pictureY >= 6) {
      g.fillStyle(COLORS.frame).fillRect(116, pictureY, 30, 22);
      g.fillStyle(COLORS.picture).fillRect(118, pictureY + 2, 26, 18);
    }

    g.fillStyle(COLORS.floor).fillRect(left, floorY, w, FLOOR_H);
    for (let y = floorY + 8; y < h; y += 8) g.fillStyle(COLORS.floorLine).fillRect(left, y, w, 1);

    // Mesa: cubierta y patas.
    g.fillStyle(COLORS.table).fillRect(TABLE_LEFT, top, TABLE_RIGHT - TABLE_LEFT, 5);
    g.fillStyle(COLORS.tableEdge).fillRect(TABLE_LEFT, top + 5, TABLE_RIGHT - TABLE_LEFT, 2);
    g.fillStyle(COLORS.tableEdge).fillRect(TABLE_LEFT + 6, top + 7, 5, TABLE_H - 7);
    g.fillStyle(COLORS.tableEdge).fillRect(TABLE_RIGHT - 11, top + 7, 5, TABLE_H - 7);
  }

  // ---- Posiciones ----

  private startX(): number {
    const width = this.textures.get(this.objectDef.sprite).getSourceImage().width;
    return Math.max(START_X, TABLE_LEFT + CAT_W + 6 + width / 2);
  }

  /** Lo que se rasga no se mueve; lo demás avanza hasta que su centro queda en la orilla. */
  private objectX(progress: number): number {
    if (this.objectDef.estiloRotura === 'rasgar') return this.startX();
    return this.startX() + Math.min(progress, 1) * (TABLE_RIGHT - this.startX());
  }

  private objectAngle(progress: number): number {
    return this.objectDef.estiloRotura === 'volcar' ? progress * MAX_TILT : 0;
  }

  private catXFor(objectX: number): number {
    return objectX - this.object.width / 2 - CAT_W - 1;
  }

  /** Pone el objeto actual en su posición según el progreso guardado. */
  private placeObject(): void {
    this.objectDef = this.controller.data.objects.find((o) => o.id === this.controller.currentObjectId())!;
    this.tweens.killTweensOf([this.object, this.cat, this.vehicle]);
    const progress = this.controller.progress();
    this.object.setTexture(this.objectDef.sprite).setScale(1).setAlpha(1).setVisible(true);
    this.object.setPosition(this.objectX(progress), this.tableTop).setAngle(this.objectAngle(progress));
    this.applyLook();
    this.moveCat(this.catXFor(this.object.x), false);
    this.drawScratches(progress);
    this.paw.setVisible(false);
  }

  /** Vehículo según la herramienta del objeto en la mesa; garras y sombrero según las mejoras de crítico. */
  private applyLook(): void {
    this.look = toolLook(this.objectDef.herramienta);
    const mejoras = this.controller.catLook();
    // Con saco cambia el dibujo del gato y la manga del brazo.
    const traje = mejoras.saco ? '_saco' : '';
    this.cat.setTexture(`gato${traje}`);
    this.paw.setTexture(`${mejoras.garras ? 'garra' : 'pata'}${traje}`);
    this.hat.setVisible(mejoras.sombrero);
    this.vehicle.setVisible(this.look.vehicle !== null);
    if (this.look.vehicle) this.vehicle.setTexture(this.look.vehicle);
    this.cat.y = this.tableTop - this.look.lift;
    this.vehicle.y = this.tableTop;
  }

  private moveCat(x: number, animate: boolean): void {
    const vehicleX = x + CAT_W / 2;
    if (!animate) {
      this.cat.x = x;
      this.vehicle.x = vehicleX;
      return;
    }
    this.tweens.add({ targets: this.cat, x, duration: 140, ease: 'Sine.out' });
    this.tweens.add({ targets: this.vehicle, x: vehicleX, duration: 140, ease: 'Sine.out' });
  }

  private drawScratches(progress: number): void {
    const g = this.scratches.clear();
    if (this.objectDef.estiloRotura !== 'rasgar' || progress <= 0) return;
    const count = Math.min(MAX_SCRATCHES, Math.ceil(progress * MAX_SCRATCHES));
    const w = this.object.width;
    const h = this.object.height;
    const left = this.object.x - w / 2;
    const top = this.object.y - h;
    g.fillStyle(COLORS.scratch, 0.85);
    for (let i = 0; i < count; i++) {
      // Tres rayitas diagonales por rasguño, repartidas a lo ancho.
      const x0 = Math.round(left + 3 + ((w - 8) * (i + 0.5)) / MAX_SCRATCHES);
      const y0 = Math.round(top + 2 + ((i * 7) % Math.max(1, h - 8)));
      for (let line = 0; line < 3; line++) {
        for (let step = 0; step < Math.min(5, h - 4); step++) g.fillRect(x0 + line * 2 + step, y0 + step, 1, 1);
      }
    }
  }

  // ---- Eventos ----

  private onHit(result: HitResult): void {
    this.swipePaw();
    if (result.critico) this.criticalHit();
    const sound = this.objectDef.sonido;
    if (result.broke) {
      this.controller.playSound(sound.rotura, { tono: sound.tono });
      this.breakObject();
      if (result.reward) this.floatText(TABLE_RIGHT - 10, this.tableTop - 20, `+$${this.controller.formatMoney(result.reward.dinero)}`, 'flotante');
    } else {
      this.controller.playSound(sound.golpe, { tono: sound.tono, minGapMs: 45 });
      this.pushObject(result.progress);
    }
  }

  // ---- Aliados ----

  /** Dónde descansa cada aliado (esquina inferior izquierda del dibujo). */
  private allyRest(id: string): { x: number; y: number } {
    const floorY = this.scale.height - FLOOR_H;
    switch (id) {
      case 'gatito':
        return { x: this.cat.x + 1, y: this.cat.y - 8 };
      case 'perro':
        return { x: 1, y: floorY + 5 };
      case 'raton':
        return { x: 66, y: floorY + 4 };
      case 'perico': {
        const pictureY = this.tableTop - 70;
        return pictureY >= 18 ? { x: 125, y: pictureY + 1 } : { x: 132, y: this.tableTop - 34 };
      }
      case 'cuervo': {
        const windowY = this.tableTop - 96;
        return windowY >= 16 ? { x: 40, y: windowY + 1 } : { x: 100, y: this.tableTop - 40 };
      }
      case 'cabra':
        return { x: 162, y: floorY + 5 };
      default:
        return { x: 127, y: floorY + 5 };
    }
  }

  private refreshAllies(): void {
    for (const [id, visual] of this.allies) {
      visual.sprite.setVisible(allyLevel(this.controller.state, id) > 0);
      this.tweens.killTweensOf(visual.hop);
      visual.hop.dx = 0;
      visual.hop.dy = 0;
    }
    this.update();
  }

  private onNewAlly(allyId: string): void {
    const visual = this.allies.get(allyId);
    if (!visual) return;
    visual.sprite.setVisible(true).setScale(0);
    this.update();
    this.tweens.add({ targets: visual.sprite, scale: 1, duration: 260, ease: 'Back.out' });
    const ally = get(t)(`aliados.${allyId}`);
    this.toast(get(t)('avisos.aliadoNuevo', { aliado: ally }));
    const def = this.allyDef(allyId);
    if (def.sonido.voz) this.controller.playSound(def.sonido.voz, { tono: def.sonido.tono });
  }

  /** Algo nuevo se puede usar: aviso con su nombre (o el del aliado). */
  private onDiscovery(unlockId: string): void {
    const tr = get(t);
    if (unlockId.startsWith('aliado:')) {
      this.toast(tr('avisos.aliadoDisponible', { aliado: tr(`aliados.${unlockId.slice(7)}`) }));
    } else {
      this.toast(tr('avisos.descubrimiento', { nombre: tr(`descubrimientos.${unlockId}`) }));
    }
  }

  private allyDef(allyId: string): AllyDef {
    return this.controller.data.allies.find((a) => a.id === allyId)!;
  }

  private onAllyHit(allyId: string, result: HitResult): void {
    const visual = this.allies.get(allyId);
    const def = this.allyDef(allyId);
    if (visual?.sprite.visible) this.allyAttack(allyId, visual);

    // Sonido del aliado (y a veces su voz) y, más bajito, el del objeto.
    const { golpe, voz, tono, volumen } = def.sonido;
    this.controller.playSound(golpe, { tono, volumen, minGapMs: 60 });
    if (voz && Math.random() < this.controller.data.balance.aliados.probabilidadVoz) {
      this.controller.playSound(voz, { tono, volumen });
    }
    const sound = this.objectDef.sonido;
    if (result.broke) {
      this.controller.playSound(sound.rotura, { tono: sound.tono });
      this.breakObject();
      if (result.reward) this.floatText(TABLE_RIGHT - 10, this.tableTop - 20, `+$${this.controller.formatMoney(result.reward.dinero)}`, 'flotante');
    } else {
      this.controller.playSound(sound.golpe, { tono: sound.tono, volumen: 0.45, minGapMs: 60 });
      this.pushObject(result.progress);
      this.sparks(ALLY_SPARK[allyId] ?? 0xffffff);
      this.floatText(this.object.x, this.object.y - this.object.height, this.controller.formatMoney(result.damage), 'flotante chico');
    }
  }

  /** Saltito hacia el objeto: el gatito brinca, el perico vuela, perro y mapache dan un brinco. */
  private allyAttack(allyId: string, visual: AllyVisual): void {
    this.tweens.killTweensOf(visual.hop);
    visual.hop.dx = 0;
    visual.hop.dy = 0;
    const rest = this.allyRest(allyId);
    let target = { dx: 0, dy: -6 };
    if (allyId === 'gatito') {
      target = { dx: this.object.x - this.object.width / 2 - 13 - rest.x, dy: -3 };
    } else if (allyId === 'perico' || allyId === 'cuervo') {
      // Vuelan hasta el objeto y regresan.
      target = { dx: this.object.x - 5 - rest.x, dy: this.object.y - this.object.height - 2 - rest.y };
    } else if (allyId === 'cabra') {
      // Embiste la pata de la mesa.
      target = { dx: -8, dy: 0 };
    }
    this.tweens.add({
      targets: visual.hop,
      dx: target.dx,
      dy: target.dy,
      duration: allyId === 'perico' || allyId === 'cuervo' ? 140 : 90,
      ease: 'Quad.out',
      yoyo: true,
      hold: 40,
    });
  }

  private sparks(tint: number): void {
    const emitter = this.add.particles(this.object.x, this.object.y - this.object.height / 2, 'px', {
      speed: { min: 20, max: 50 },
      lifespan: 300,
      scale: { start: 0.8, end: 0.2 },
      tint,
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(4);
    this.time.delayedCall(400, () => emitter.destroy());
  }

  private onNewObject(objectId: string): void {
    this.placeObject();
    this.popIn();
    const objeto = get(t)(`objetos.${objectId}`);
    this.toast(get(t)('avisos.objetoNuevo', { objeto }));
  }

  private onNewTool(toolId: string): void {
    const herramienta = get(t)(`herramientas.${toolId}`);
    this.toast(get(t)('avisos.herramienta', { herramienta }));
    // Saltito de gusto.
    this.tweens.add({ targets: this.cat, y: this.cat.y - 6, duration: 120, yoyo: true, ease: 'Quad.out' });
  }

  /** Compró su primera Garra afilada, Sombrero o Saco: se lo pone, salta y presume. */
  private onNewLook(cambio: LookChange): void {
    this.applyLook();
    this.toast(get(t)(`avisos.${cambio}`));
    this.controller.playSound('herramienta');
    this.tweens.add({ targets: this.cat, y: this.cat.y - 6, duration: 120, yoyo: true, ease: 'Quad.out' });
    if (cambio === 'sombrero') {
      this.hat.setScale(0);
      this.tweens.add({ targets: this.hat, scale: 1, duration: 260, ease: 'Back.out' });
    }
    if (cambio === 'saco') {
      // Se acomoda el saco: se estira y vuelve, muy profesional.
      this.tweens.add({ targets: this.cat, scaleX: 1.15, duration: 90, yoyo: true, repeat: 1, ease: 'Sine.inOut' });
    }
  }

  // ---- Animaciones ----

  /** "¡ZARPAZO!": texto rojo, tajo de acero y sacudida. */
  private criticalHit(): void {
    this.controller.playSound('critico', { minGapMs: 60 });
    this.floatText(this.object.x, this.object.y - this.object.height - 4, get(t)('mejoras.zarpazo'), 'flotante critico');
    this.cameras.main.shake(80, 0.008);
  }

  private swipePaw(): void {
    const restX = this.cat.x + 6;
    const strikeX = this.object.x - this.object.width / 2 - this.paw.width + 3;
    this.tweens.killTweensOf(this.paw);
    this.paw.setPosition(restX, this.cat.y - 7).setVisible(true);
    this.tweens.add({
      targets: this.paw,
      x: Math.max(restX, strikeX),
      duration: 45,
      ease: 'Quad.out',
      yoyo: true,
      hold: 30,
      onComplete: () => this.paw.setVisible(false),
    });
  }

  private pushObject(progress: number): void {
    const x = this.objectX(progress);
    this.tweens.killTweensOf([this.object, this.cat, this.vehicle]);
    this.object.setScale(1).setVisible(true);
    this.tweens.add({ targets: this.object, x, angle: this.objectAngle(progress), duration: 90, ease: 'Quad.out' });
    // Pequeño apachurrón para que el golpe se sienta.
    this.tweens.add({ targets: this.object, scaleY: 0.88, scaleX: 1.08, duration: 50, yoyo: true });
    this.moveCat(this.catXFor(x), true);
    // Lo que se rasga no se mueve, así que los rasguños van ya en su lugar.
    this.drawScratches(progress);
  }

  /** El objeto se rompe según su estilo; el siguiente aparece al centro de la mesa. */
  private breakObject(): void {
    const def = this.objectDef;
    const color = Phaser.Display.Color.HexStringToColor(def.placeholder?.color ?? '#ffffff').color;
    const piece = this.add
      .image(this.object.x, this.object.y, def.sprite)
      .setOrigin(0.5, 1)
      .setAngle(this.object.angle)
      .setDepth(4);
    const floorY = this.scale.height - FLOOR_H + 4;

    if (def.estiloRotura === 'rasgar') {
      // Queda hecho jirones ahí mismo.
      this.shatter(piece.x, piece.y - piece.height / 2, color, 24, 400);
      this.tweens.add({
        targets: piece,
        scaleY: 0.1,
        alpha: 0,
        duration: 260,
        ease: 'Quad.in',
        onComplete: () => piece.destroy(),
      });
    } else {
      // Se va de la orilla y cae; lo que se vuelca gira más.
      this.tweens.chain({
        targets: piece,
        tweens: [
          { x: TABLE_RIGHT + piece.width / 2 + 3, duration: 80, ease: 'Quad.out' },
          { y: floorY, angle: def.estiloRotura === 'volcar' ? 90 : 75, duration: 260, ease: 'Quad.in' },
        ],
        onComplete: () => {
          piece.destroy();
          this.shatter(piece.x, floorY - 2, color, 16, 260);
        },
      });
    }

    // El dueño ya puso otro igual en la mesa.
    this.placeObject();
    this.popIn(260);
  }

  private popIn(delay = 0): void {
    this.object.setScale(0);
    this.tweens.add({ targets: this.object, scale: 1, delay, duration: 220, ease: 'Back.out' });
  }

  private shatter(x: number, y: number, tint: number, count: number, gravity: number): void {
    const emitter = this.add.particles(x, y, 'px', {
      speed: { min: 30, max: 90 },
      angle: { min: 200, max: 340 },
      gravityY: gravity,
      lifespan: 650,
      scale: { start: 1, end: 0.5 },
      tint,
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(count);
    this.cameras.main.shake(110, 0.012);
    this.time.delayedCall(800, () => emitter.destroy());
  }

  // ---- Textos sobre la escena (HTML, para que se lean nítidos) ----

  /** Convierte un punto de la escena a píxeles CSS dentro del contenedor del canvas. */
  private toCss(x: number, y: number): { left: number; top: number } {
    const canvas = this.game.canvas;
    const zoom = this.scale.zoom;
    return {
      left: canvas.offsetLeft + (x - this.cameras.main.scrollX) * zoom,
      top: canvas.offsetTop + y * zoom,
    };
  }

  private overlay(text: string, className: string, position?: { left: number; top: number }, parent?: HTMLElement): void {
    parent ??= this.game.canvas.parentElement ?? undefined;
    if (!parent) return;
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    if (position) {
      el.style.left = `${position.left}px`;
      el.style.top = `${position.top}px`;
    }
    el.addEventListener('animationend', () => el.remove());
    parent.appendChild(el);
  }

  private floatText(x: number, y: number, text: string, className: string): void {
    this.overlay(text, className, this.toCss(x, y));
  }

  /** Los avisos se apilan en una columna para que dos seguidos no se encimen. */
  private toast(text: string): void {
    const host = this.game.canvas.parentElement;
    if (!host) return;
    let column = host.querySelector<HTMLElement>(':scope > .avisos');
    if (!column) {
      column = document.createElement('div');
      column.className = 'avisos';
      host.appendChild(column);
    }
    this.overlay(text, 'aviso', undefined, column);
  }
}
