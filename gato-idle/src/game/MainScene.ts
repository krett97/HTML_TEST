// La escena: el gato, la mesa y el objeto. Solo dibuja y anima; las reglas están en core/
// y los toques se mandan a Game, que responde con eventos "hit".
import Phaser from 'phaser';
import type { HitResult } from '../core/actions';
import type { ObjectDef } from '../core/data';
import type { Game } from '../app/game';
import { createPlaceholders } from './placeholders';
import { FLOOR_H, SCENE_WIDTH } from './sceneSize';

// Medidas en píxeles virtuales. La escena se ancla abajo: si hay más alto, crece la pared.
const TABLE_H = 44;
const TABLE_LEFT = 18;
/** La orilla. */
const TABLE_RIGHT = 160;
const START_X = 74;
const CAT_W = 20;

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
};

export class MainScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Graphics;
  private cat!: Phaser.GameObjects.Image;
  private paw!: Phaser.GameObjects.Image;
  private object!: Phaser.GameObjects.Image;
  private objectDef!: ObjectDef;
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
    this.object = this.add.image(0, 0, '__DEFAULT').setOrigin(0.5, 1).setDepth(3);

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    // Se toca en cualquier parte de la escena, no hace falta atinarle al objeto.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.controller.tap());

    this.unsubscribers.push(
      this.controller.events.on('hit', (result) => this.onHit(result)),
      this.controller.events.on('reset', () => this.placeObject()),
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

  private objectX(progress: number, def: ObjectDef = this.objectDef): number {
    const width = this.textures.get(def.sprite).getSourceImage().width;
    // Con progreso 1 el centro del objeto queda justo en la orilla: medio objeto en el aire.
    const edgeX = TABLE_RIGHT;
    const startX = Math.max(START_X, TABLE_LEFT + CAT_W + 4 + width / 2);
    return startX + Math.min(progress, 1) * (edgeX - startX);
  }

  private catXFor(objectX: number): number {
    return objectX - this.object.width / 2 - CAT_W - 1;
  }

  /** Pone el objeto actual en su posición según el progreso guardado. */
  private placeObject(): void {
    this.objectDef = this.controller.data.objects.find((o) => o.id === this.controller.currentObjectId())!;
    this.tweens.killTweensOf([this.object, this.cat]);
    this.object.setTexture(this.objectDef.sprite).setScale(1).setAngle(0).setVisible(true);
    const x = this.objectX(this.controller.progress());
    this.object.setPosition(x, this.tableTop);
    this.cat.setPosition(this.catXFor(x), this.tableTop);
    this.paw.setVisible(false);
  }

  private onHit(result: HitResult): void {
    this.swipePaw();
    if (result.broke) this.breakObject();
    else this.pushObject(result.progress);
  }

  private swipePaw(): void {
    const restX = this.cat.x + 6;
    const strikeX = this.object.x - this.object.width / 2 - this.paw.width + 3;
    this.tweens.killTweensOf(this.paw);
    this.paw.setPosition(restX, this.tableTop - 7).setVisible(true);
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
    this.tweens.killTweensOf([this.object, this.cat]);
    this.object.setScale(1).setVisible(true);
    this.tweens.add({ targets: this.object, x, duration: 90, ease: 'Quad.out' });
    // Pequeño apachurrón para que el golpe se sienta.
    this.tweens.add({ targets: this.object, scaleY: 0.88, scaleX: 1.08, duration: 50, yoyo: true });
    this.tweens.add({ targets: this.cat, x: this.catXFor(x), duration: 140, ease: 'Sine.out' });
  }

  /** El objeto cae de la orilla y se rompe; el siguiente aparece al centro de la mesa. */
  private breakObject(): void {
    const def = this.objectDef;
    const falling = this.add
      .image(this.object.x, this.object.y, def.sprite)
      .setOrigin(0.5, 1)
      .setDepth(4);
    const floorY = this.scale.height - FLOOR_H + 4;
    const color = Phaser.Display.Color.HexStringToColor(def.placeholder?.color ?? '#ffffff').color;

    this.tweens.chain({
      targets: falling,
      tweens: [
        { x: TABLE_RIGHT + falling.width / 2 + 3, duration: 80, ease: 'Quad.out' },
        { y: floorY, angle: 75, duration: 260, ease: 'Quad.in' },
      ],
      onComplete: () => {
        falling.destroy();
        this.shatter(falling.x, floorY - 2, color);
      },
    });

    // El siguiente objeto aparece "comprado" por el dueño.
    this.placeObject();
    this.object.setScale(0);
    this.tweens.add({ targets: this.object, scale: 1, delay: 260, duration: 220, ease: 'Back.out' });
  }

  private shatter(x: number, y: number, tint: number): void {
    const emitter = this.add.particles(x, y, 'px', {
      speed: { min: 30, max: 90 },
      angle: { min: 200, max: 340 },
      gravityY: 260,
      lifespan: 650,
      scale: { start: 1, end: 0.5 },
      tint,
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(16);
    this.cameras.main.shake(110, 0.012);
    this.time.delayedCall(800, () => emitter.destroy());
  }
}
