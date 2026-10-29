// La escena: el gato, el cuarto con su superficie (barra, mesa, cama…) y el objeto. Solo dibuja y anima; las reglas están en core/
// y los toques se mandan a Game, que responde con eventos.
import Phaser from 'phaser';
import { get } from 'svelte/store';
import type { HitResult } from '../core/actions';
import { allyLevel } from '../core/allies';
import type { AllyDef, ObjectDef } from '../core/data';
import type { Game, LookChange } from '../app/game';
import { t } from '../i18n';
import { loadArt } from './art';
import { createPlaceholders } from './placeholders';
import { ART, FLOOR_H, SCENE_WIDTH } from './sceneSize';
import { drawRoom, drawSurface, PICTURE_ABOVE_FLOOR, placeOf, WINDOW_ABOVE_FLOOR, type Place } from './places';
import { catPortrait } from './catPortrait';
import { toolLook, type ToolLook } from './sprites';
import { ALLY_ICONS, ALLY_NUMBER_COLORS } from '../ui/allyIcons';
import { COIN_URL } from '../ui/coin';
import type { Decimal } from '../core/num';

// Medidas en unidades del mundo (ver sceneSize.ts). La escena se ancla abajo: si hay más alto, crece la pared.
// La superficie (alto, inicio y orilla) depende del lugar del objeto: ver places.ts.
const START_X = 74;
const CAT_W = 19;
/** Escala de las imágenes: el arte trae ART píxeles por unidad y la cámara amplía ×ART. */
const S = 1 / ART;
/** Dónde va el sombrero respecto al gato (origen abajo a la izquierda): encima de la cabeza, tapando la uva. */
const HAT_X = 11.5;
const HAT_Y = -14;
/** Cuánto dura el cuadro del manotazo (ms) y cuánto se mueve la cabeza (y el sombrero) en ese cuadro. */
const SWAT_MS = 75;
const SWAT_HAT = { dx: -1.5, dy: 2 };
/** Inclinación máxima de los objetos que se "vuelcan", justo antes de caer. */
const MAX_TILT = 22;
/** Frases de la viñeta de objeto nuevo (vineta.objeto.frases.0 … N-1). */
const OBJECT_QUIPS = 6;
/** Números flotantes a la vez, como máximo (con 15 toques por segundo y 7 aliados se juntan muchos). */
const MAX_NUMBERS = 28;
/** Un aliado muestra su número a lo mucho cada tanto (ms). */
const ALLY_NUMBER_GAP = 140;
/** Rasguños visibles en los objetos que se "rasgan". */
const MAX_SCRATCHES = 5;

const COLORS = {
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
  private hat!: Phaser.GameObjects.Image;
  private owner!: Phaser.GameObjects.Image;
  private object!: Phaser.GameObjects.Image;
  private objectDef!: ObjectDef;
  private look: ToolLook = toolLook('pata');
  private readonly allies = new Map<string, AllyVisual>();
  /** El gato está soltando un manotazo (cuadro de golpe) y cuánto se inclina hacia el objeto. */
  private swatting = false;
  private swatTimer?: Phaser.Time.TimerEvent;
  private readonly lean = { angle: 0 };
  private readonly lastAllyNumber = new Map<string, number>();
  private unsubscribers: (() => void)[] = [];

  constructor(private readonly controller: Game) {
    super('principal');
  }

  /** Cuarto y superficie del objeto en la mesa (o en la barra, la cama, el piso…). */
  private place: Place = placeOf('sala-mesa');

  private get floorY(): number {
    return this.worldH - FLOOR_H;
  }

  /** Altura de la cubierta donde están el gato y el objeto. */
  private get surfaceTop(): number {
    return this.floorY - this.place.surface.height;
  }

  preload(): void {
    loadArt(this);
  }

  /** Medidas de una imagen en unidades del mundo (sin contar su escala animada). */
  private widthOf(img: Phaser.GameObjects.Image): number {
    return img.width * S;
  }

  private heightOf(img: Phaser.GameObjects.Image): number {
    return img.height * S;
  }

  /** Ancho y alto visibles del mundo. */
  private get worldW(): number {
    return this.scale.width / ART;
  }

  private get worldH(): number {
    return this.scale.height / ART;
  }

  create(): void {
    createPlaceholders(this, this.controller.data.objects);
    this.cameras.main.setOrigin(0, 0).setZoom(ART);

    this.background = this.add.graphics();
    this.cat = this.add.image(0, 0, 'gato').setOrigin(0, 1).setScale(S).setDepth(2);
    this.vehicle = this.add.image(0, 0, 'carrito').setOrigin(0.5, 1).setScale(S).setDepth(2.5).setVisible(false);
    this.hat = this.add.image(0, 0, 'sombrero').setOrigin(0.5, 1).setScale(S).setDepth(2.8).setVisible(false);
    this.owner = this.add.image(0, 0, 'duenio').setOrigin(0.5, 1).setScale(S).setDepth(4.5).setVisible(false);
    this.object = this.add.image(0, 0, '__DEFAULT').setOrigin(0.5, 1).setScale(S).setDepth(3);
    this.scratches = this.add.graphics().setDepth(3.5);
    for (const ally of this.controller.data.allies) {
      const sprite = this.add.image(0, 0, `aliado_${ally.id}`).setOrigin(0, 1).setScale(S).setDepth(2.2);
      this.allies.set(ally.id, { sprite, hop: { dx: 0, dy: 0 } });
    }

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    // Se toca en cualquier parte de la escena, no hace falta atinarle al objeto.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.controller.tap());

    this.unsubscribers.push(
      this.controller.events.on('hit', (result) => this.onHit(result)),
      this.controller.events.on('objeto', ({ objectId, primeraVez }) => this.onNewObject(objectId, primeraVez)),
      this.controller.events.on('herramienta', ({ toolId }) => this.onNewTool(toolId)),
      this.controller.events.on('aspecto', ({ cambio, primeraVez }) => this.onNewLook(cambio, primeraVez)),
      this.controller.events.on('aliado', ({ allyId, result }) => this.onAllyHit(allyId, result)),
      this.controller.events.on('aliadoNuevo', ({ allyId, primeraVez }) => this.onNewAlly(allyId, primeraVez)),
      this.controller.events.on('descubrimiento', ({ unlockId }) => this.onDiscovery(unlockId)),
      this.controller.events.on('patrocinio', ({ dinero }) => {
        this.toast(get(t)('patrocinio.gracias', { dinero: this.controller.formatMoney(dinero) }));
        this.popNumber(this.object.x, this.object.y - this.heightOf(this.object) - 10, 'dinero grande', `+${this.controller.formatMoney(dinero)}`, { coin: true });
      }),
      this.controller.events.on('video', ({ video }) => this.onVideo(video.seguidores, video.viral)),
      this.controller.events.on('offline', ({ dinero }) => {
        // Lluvia de monedas al cobrar lo de mientras no estabas.
        this.popNumber(this.object.x, this.object.y - this.heightOf(this.object) - 10, 'dinero grande', `+${this.controller.formatMoney(dinero)}`, { coin: true });
        this.burst(0xffd36e, 24);
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
    this.cameras.main.setScroll(-Math.floor((this.worldW - SCENE_WIDTH) / 2), 0);
    // Al redibujar (inicio, cambio de tamaño) se entra directo al cuarto, sin fundido.
    this.place = placeOf(this.controller.data.objects.find((o) => o.id === this.controller.currentObjectId())!.lugar);
    this.drawBackground();
    this.placeObject();
    this.refreshAllies();
  }

  /** Cada cuadro: el sombrero va en la cabeza del gato y los aliados siguen su lugar (el gatito, junto al gato). */
  update(): void {
    const swat = this.swatting ? SWAT_HAT : { dx: 0, dy: 0 };
    this.cat.setAngle(this.lean.angle);
    this.hat.setPosition(this.cat.x + HAT_X + swat.dx, this.cat.y + HAT_Y + swat.dy).setAngle(this.lean.angle);
    for (const [id, visual] of this.allies) {
      if (!visual.sprite.visible) continue;
      const base = this.allyRest(id);
      visual.sprite.setPosition(Math.round(base.x + visual.hop.dx), Math.round(base.y + visual.hop.dy));
    }
  }

  private drawBackground(): void {
    const g = this.background.clear();
    drawRoom(g, this.place.room, this.cameras.main.scrollX, this.worldW, this.worldH, this.floorY);
    drawSurface(g, this.place.surface, this.floorY);
  }

  /** Cambia de cuarto si el objeto nuevo está en otro lugar (con un fundido corto). */
  private enterPlace(animate: boolean): void {
    const next = placeOf(this.objectDef.lugar);
    if (next.room === this.place.room && next.surface === this.place.surface) return;
    this.place = next;
    this.drawBackground();
    if (animate) this.cameras.main.fadeIn(280, 18, 11, 22);
  }

  // ---- Posiciones ----

  private startX(): number {
    const width = this.textures.get(this.objectDef.sprite).getSourceImage().width * S;
    return Math.max(START_X, this.place.surface.left + CAT_W + 6 + width / 2);
  }

  /** Lo que se rasga o está en el piso no se mueve; lo demás avanza hasta que su centro queda en la orilla. */
  private objectX(progress: number): number {
    if (this.objectDef.estiloRotura === 'rasgar' || this.onFloor) return this.startX();
    return this.startX() + Math.min(progress, 1) * (this.place.surface.right - this.startX());
  }

  private get onFloor(): boolean {
    return this.place.surface.height === 0;
  }

  private objectAngle(progress: number): number {
    return this.objectDef.estiloRotura === 'volcar' ? progress * MAX_TILT : 0;
  }

  private catXFor(objectX: number): number {
    return objectX - this.widthOf(this.object) / 2 - CAT_W - 1;
  }

  /** Pone el objeto actual en su posición según el progreso guardado. */
  private placeObject(): void {
    this.objectDef = this.controller.data.objects.find((o) => o.id === this.controller.currentObjectId())!;
    this.enterPlace(true);
    this.tweens.killTweensOf([this.object, this.cat, this.vehicle]);
    const progress = this.controller.progress();
    this.object.setTexture(this.objectDef.sprite).setScale(S).setAlpha(1).setVisible(true);
    this.object.setPosition(this.objectX(progress), this.surfaceTop).setAngle(this.objectAngle(progress));
    this.applyLook();
    this.moveCat(this.catXFor(this.object.x), false);
    this.drawScratches(progress);
  }

  /** Vehículo según la herramienta del objeto en la mesa; garras, sombrero y saco según las mejoras. */
  private applyLook(): void {
    this.look = toolLook(this.objectDef.herramienta);
    this.applyCatTexture();
    this.hat.setVisible(this.controller.catLook().sombrero);
    this.vehicle.setVisible(this.look.vehicle !== null);
    if (this.look.vehicle) this.vehicle.setTexture(this.look.vehicle);
    this.cat.y = this.surfaceTop - this.look.lift;
    this.vehicle.y = this.surfaceTop;
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
    const w = this.widthOf(this.object);
    const h = this.heightOf(this.object);
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
    this.swat();
    this.tapNumber(result);
    if (result.critico) this.criticalHit();
    else if (result.embestida) this.rammingHit();
    const sound = this.objectDef.sonido;
    if (result.broke) {
      this.controller.playSound(sound.rotura, { tono: sound.tono });
      this.breakObject();
      if (result.reward) this.moneyNumber(result.reward.dinero);
    } else {
      this.controller.playSound(sound.golpe, { tono: sound.tono, minGapMs: 45 });
      this.pushObject(result.progress);
    }
  }

  // ---- Aliados ----

  /** Dónde descansa cada aliado (esquina inferior izquierda del dibujo). */
  private allyRest(id: string): { x: number; y: number } {
    const floorY = this.floorY;
    switch (id) {
      case 'gatito':
        // A un lado del gato, llorando con el pulgar arriba.
        return { x: this.cat.x - 13, y: this.cat.y };
      case 'perro':
        return { x: 1, y: floorY + 5 };
      case 'raton':
        return { x: 66, y: floorY + 4 };
      case 'perico': {
        const pictureY = floorY - PICTURE_ABOVE_FLOOR;
        return pictureY >= 18 ? { x: 125, y: pictureY + 1 } : { x: 132, y: floorY - 78 };
      }
      case 'cuervo': {
        const windowY = floorY - WINDOW_ABOVE_FLOOR;
        return windowY >= 16 ? { x: 40, y: windowY + 1 } : { x: 100, y: floorY - 84 };
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

  private onNewAlly(allyId: string, primeraVez: boolean): void {
    const visual = this.allies.get(allyId);
    if (!visual) return;
    visual.sprite.setVisible(true).setScale(0);
    this.update();
    this.tweens.add({ targets: visual.sprite, scale: S, duration: 260, ease: 'Back.out' });
    const tr = get(t);
    const ally = tr(`aliados.${allyId}`);
    if (primeraVez) {
      this.comicPanel('aliado', this.textures.getBase64(`aliado_${allyId}`), tr(`vineta.aliado.titulos.${allyId}`), tr(`vineta.aliado.frases.${allyId}`));
    } else {
      this.toast(tr('avisos.aliadoNuevo', { aliado: ally }));
    }
    const def = this.allyDef(allyId);
    if (def.sonido.voz) this.controller.playSound(def.sonido.voz, { tono: def.sonido.tono });
  }

  /** Algo nuevo se puede usar: aviso con su nombre (o el del aliado). */
  private onDiscovery(unlockId: string): void {
    const tr = get(t);
    if (unlockId === 'canal') {
      this.ownerCameo();
      return;
    }
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
      if (result.reward) this.moneyNumber(result.reward.dinero);
    } else {
      this.controller.playSound(sound.golpe, { tono: sound.tono, volumen: 0.45, minGapMs: 60 });
      this.pushObject(result.progress);
      this.sparks(ALLY_SPARK[allyId] ?? 0xffffff);
    }
    this.allyNumber(allyId, result.damage);
  }

  /** Saltito hacia el objeto: el gatito brinca, el perico vuela, perro y mapache dan un brinco. */
  private allyAttack(allyId: string, visual: AllyVisual): void {
    this.tweens.killTweensOf(visual.hop);
    visual.hop.dx = 0;
    visual.hop.dy = 0;
    const rest = this.allyRest(allyId);
    const sprite = visual.sprite;
    const idleKey = `aliado_${allyId}`;
    const swatKey = `${idleKey}_golpe`;
    sprite.setTexture(idleKey).setDepth(2.2);
    if (this.textures.exists(swatKey)) {
      // Brinca en arco hasta el objeto, suelta el manotazo (delante del objeto) y regresa.
      const dx = this.object.x - this.widthOf(this.object) / 2 - this.widthOf(sprite) + 2 - rest.x;
      this.tweens.add({ targets: visual.hop, dy: -8, duration: 45, ease: 'Quad.out', yoyo: true });
      this.tweens.add({
        targets: visual.hop,
        dx,
        duration: 90,
        ease: 'Quad.out',
        yoyo: true,
        hold: 90,
        onYoyo: () => sprite.setTexture(idleKey).setDepth(2.2),
      });
      this.time.delayedCall(90, () => {
        if (visual.hop.dx !== 0) sprite.setTexture(swatKey).setDepth(3.2);
      });
      return;
    }
    let target = { dx: 0, dy: -6 };
    if (allyId === 'perico' || allyId === 'cuervo') {
      // Vuelan hasta el objeto y regresan.
      target = { dx: this.object.x - 5 - rest.x, dy: this.object.y - this.heightOf(this.object) - 2 - rest.y };
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

  /** Explosión de chispas en el objeto (críticos y embestidas). */
  private burst(tint: number, count: number): void {
    const { x, y } = this.numberAnchor();
    const emitter = this.add.particles(x, y + this.heightOf(this.object) / 2, 'px', {
      speed: { min: 60, max: 140 },
      lifespan: 420,
      scale: { start: 1.6, end: 0.3 },
      tint,
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(count);
    this.time.delayedCall(500, () => emitter.destroy());
  }

  private sparks(tint: number): void {
    const emitter = this.add.particles(this.object.x, this.object.y - this.heightOf(this.object) / 2, 'px', {
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

  private onNewObject(objectId: string, primeraVez: boolean): void {
    this.placeObject();
    this.popIn();
    const tr = get(t);
    const objeto = tr(`objetos.${objectId}`);
    if (primeraVez) {
      const frase = tr(`vineta.objeto.frases.${Phaser.Math.Between(0, OBJECT_QUIPS - 1)}`, { objeto });
      this.comicPanel('objeto', this.textures.getBase64(this.objectDef.sprite), tr('vineta.objeto.titulo', { objeto }), frase);
    } else {
      this.toast(tr('avisos.objetoNuevo', { objeto }));
    }
  }

  private onNewTool(toolId: string): void {
    const herramienta = get(t)(`herramientas.${toolId}`);
    this.toast(get(t)('avisos.herramienta', { herramienta }));
    // Saltito de gusto.
    this.tweens.add({ targets: this.cat, y: this.cat.y - 6, duration: 120, yoyo: true, ease: 'Quad.out' });
  }

  /** Compró su primera Garra afilada, Sombrero o Saco: se lo pone, salta y presume. */
  private onNewLook(cambio: LookChange, primeraVez: boolean): void {
    const tr = get(t);
    this.applyLook();
    if (primeraVez) this.comicPanel(cambio, catPortrait(this.textures, this.controller.catLook()), tr(`vineta.${cambio}.titulo`), tr(`vineta.${cambio}.texto`));
    else this.toast(tr(`vineta.${cambio}.titulo`));
    this.controller.playSound('herramienta');
    this.tweens.add({ targets: this.cat, y: this.cat.y - 6, duration: 120, yoyo: true, ease: 'Quad.out' });
    if (cambio === 'sombrero') {
      this.hat.setScale(0);
      this.tweens.add({ targets: this.hat, scale: S, duration: 260, ease: 'Back.out' });
    }
    if (cambio === 'saco') {
      // Se acomoda el saco: se estira y vuelve, muy profesional.
      this.tweens.add({ targets: this.cat, scaleX: 1.15 * S, duration: 90, yoyo: true, repeat: 1, ease: 'Sine.inOut' });
    }
  }

  /** El dueño entra, cacha al gato… y en vez de regañarlo, saca el celular y graba. */
  private ownerCameo(): void {
    const tr = get(t);
    const floorY = this.floorY;
    const outX = SCENE_WIDTH + 30;
    this.tweens.killTweensOf(this.owner);
    this.owner.setPosition(outX, floorY + 2).setFlipX(false).setVisible(true);
    this.tweens.chain({
      targets: this.owner,
      tweens: [
        { x: SCENE_WIDTH - 22, duration: 600, ease: 'Sine.out' },
        { y: floorY - 4, duration: 90, yoyo: true, ease: 'Quad.out' }, // brinco de sorpresa
        { x: SCENE_WIDTH - 22, duration: 2200 }, // se queda grabando
        { x: outX, duration: 500, ease: 'Sine.in' },
      ],
      onComplete: () => this.owner.setVisible(false),
    });
    this.time.delayedCall(650, () => {
      this.toast(tr('avisos.dueno'));
      this.controller.playSound('objeto-nuevo');
    });
    this.time.delayedCall(1500, () => {
      this.toast(tr('avisos.duenoGraba'));
      this.cameras.main.flash(120, 255, 241, 224); // flash del celular
    });
  }

  /** Se subió el video: festejo, y si se hizo viral, confeti y sacudida. */
  private onVideo(seguidores: number, viral: boolean): void {
    const tr = get(t);
    this.toast(tr('avisos.videoSubido', { seguidores }));
    this.cameras.main.flash(160, 255, 241, 224);
    if (viral) {
      this.toast(tr('avisos.viral'));
      this.cameras.main.shake(300, 0.015);
      const colors = [0xe5534b, 0xffd36e, 0x5ec4a8, 0x8e5bd1];
      colors.forEach((color, i) => this.time.delayedCall(i * 120, () => this.shatter(30 + i * 40, this.surfaceTop - 40, color, 24, 200)));
    }
  }

  /**
   * Viñeta de cómic (2.5 s) que cruza la escena: un dibujo (el gato con su nuevo aspecto, el aliado
   * nuevo o el objeto nuevo) y un globo de texto. No bloquea los toques. Arte provisional: cuando
   * llegue el de PixelLab cada viñeta tendrá su ilustración.
   */
  private comicPanel(kind: string, image: string, titleText: string, subText: string): void {
    const host = this.game.canvas.parentElement;
    if (!host) return;
    host.querySelector(':scope > .vineta')?.remove();
    const el = document.createElement('div');
    el.className = `vineta vineta--${kind}`;
    el.dataset.testid = 'vineta';
    const panel = document.createElement('div');
    panel.className = 'vineta-panel';
    const img = document.createElement('img');
    img.className = 'vineta-gato';
    img.alt = '';
    img.src = image;
    const text = document.createElement('div');
    text.className = 'vineta-texto';
    const title = document.createElement('strong');
    title.className = 'vineta-globo';
    title.textContent = titleText;
    const sub = document.createElement('span');
    sub.className = 'vineta-sub';
    sub.textContent = subText;
    text.append(title, sub);
    panel.append(img, text);
    el.append(panel);
    el.addEventListener('animationend', (event) => {
      if (event.target === el) el.remove();
    });
    host.append(el);
  }

  // ---- Animaciones ----

  /** Zarpazo crítico: tajo de acero, chispas doradas y sacudida (el número lo pone tapNumber). */
  private criticalHit(): void {
    this.controller.playSound('critico', { minGapMs: 60 });
    this.burst(0xffd36e, 14);
    this.cameras.main.shake(90, 0.01);
  }

  /** Embestida del carrito: motor, chispas azules y sacudida. */
  private rammingHit(): void {
    this.controller.playSound('motor', { minGapMs: 120 });
    this.burst(0x6fd3ff, 12);
    this.cameras.main.shake(110, 0.012);
  }

  // ---- Números de daño ----

  /** Arriba del objeto, donde salen los números. */
  private numberAnchor(): { x: number; y: number } {
    return { x: this.object.x, y: this.object.y - this.heightOf(this.object) - 2 };
  }

  /** Qué tanto del objeto se llevó el golpe (0 a 1): los golpes grandes se ven más grandes. */
  private damageRatio(damage: Decimal): number {
    return Math.min(1, damage.div(this.objectDef.hp).toNumber());
  }

  /** El manotazo del gato: número que salta en arco; el crítico y la embestida, enormes y con letrero. */
  private tapNumber(result: HitResult): void {
    const tr = get(t);
    const { x, y } = this.numberAnchor();
    const ratio = this.damageRatio(result.damage);
    const text = this.controller.formatMoney(result.damage);
    if (result.critico || result.embestida) {
      const label = result.critico && result.embestida ? tr('mejoras.superZarpazo') : result.critico ? tr('mejoras.zarpazo') : tr('mejoras.embestida');
      this.popNumber(x, y - 4, result.critico ? 'critico' : 'embestida', text, { label, size: 30 + ratio * 10 });
    } else {
      this.popNumber(x, y, 'toque', text, { size: 17 + ratio * 13 });
    }
  }

  /** Golpe de un aliado: número de su color con su ícono (no más de uno cada ALLY_NUMBER_GAP por aliado). */
  private allyNumber(allyId: string, damage: Decimal): void {
    const now = this.time.now;
    if (now - (this.lastAllyNumber.get(allyId) ?? -Infinity) < ALLY_NUMBER_GAP) return;
    this.lastAllyNumber.set(allyId, now);
    const { x, y } = this.numberAnchor();
    this.popNumber(x, y, 'aliado', this.controller.formatMoney(damage), {
      icon: ALLY_ICONS[allyId],
      color: ALLY_NUMBER_COLORS[allyId],
      size: 13 + this.damageRatio(damage) * 9,
    });
  }

  /** Dinero de una rotura, en la orilla por donde cayó el objeto. */
  private moneyNumber(dinero: Decimal): void {
    this.popNumber(this.place.surface.right - 10, this.surfaceTop - 18, 'dinero', `+${this.controller.formatMoney(dinero)}`, { coin: true });
  }

  /** Crea el número (HTML, para que se lea nítido) con un desvío y giro al azar. */
  private popNumber(
    x: number,
    y: number,
    kind: string,
    text: string,
    opts: { label?: string; icon?: string; color?: string; size?: number; coin?: boolean } = {},
  ): void {
    const parent = this.game.canvas.parentElement;
    if (!parent) return;
    const live = parent.querySelectorAll(':scope > .num');
    if (live.length >= MAX_NUMBERS) live[0]!.remove();
    const el = document.createElement('div');
    el.className = `num ${kind}`;
    if (opts.label) {
      const label = document.createElement('span');
      label.className = 'num-label';
      label.textContent = opts.label;
      el.append(label);
    }
    const value = document.createElement('span');
    value.className = 'num-value';
    if (opts.coin) {
      // El dinero lleva la moneda con gatito en lugar del "$": "+🪙4.4K".
      const sign = text.startsWith('+') ? '+' : '';
      const coin = document.createElement('img');
      coin.className = 'num-coin';
      coin.src = COIN_URL;
      coin.alt = '';
      value.append(sign, coin, text.slice(sign.length));
    } else {
      value.textContent = opts.icon ? `${opts.icon}${text}` : text;
    }
    el.append(value);
    const pos = this.toCss(x, y);
    el.style.left = `${pos.left}px`;
    el.style.top = `${pos.top}px`;
    el.style.setProperty('--dx', `${Phaser.Math.Between(-26, 26)}px`);
    el.style.setProperty('--rot', `${Phaser.Math.Between(-12, 12)}deg`);
    if (opts.color) el.style.setProperty('--c', opts.color);
    if (opts.size) el.style.setProperty('--size', `${Math.round(opts.size)}px`);
    el.addEventListener('animationend', (event) => {
      if (event.target === el) el.remove();
    });
    parent.append(el);
  }

  /** Dibujo del gato: sentado, o soltando el manotazo (con las garras de metal, si las tiene). */
  private applyCatTexture(): void {
    const mejoras = this.controller.catLook();
    const traje = mejoras.saco ? '_saco' : '';
    const golpe = this.swatting ? `${mejoras.garras ? '_garra' : ''}_golpe` : '';
    this.cat.setTexture(`gato${traje}${golpe}`);
    // En el manotazo pasa delante del objeto para que la pata le llegue (en un vehículo no: va sentado adentro).
    this.cat.setDepth(this.swatting && !this.look.vehicle ? 3.2 : 2);
  }

  /** El manotazo: el gato se para, suelta la pata hacia el objeto inclinándose y se vuelve a sentar. */
  private swat(): void {
    this.swatTimer?.remove();
    this.swatting = true;
    this.applyCatTexture();
    this.swatTimer = this.time.delayedCall(SWAT_MS, () => {
      this.swatting = false;
      this.applyCatTexture();
    });
    this.tweens.killTweensOf(this.lean);
    this.lean.angle = 0;
    this.tweens.add({ targets: this.lean, angle: 5, duration: SWAT_MS / 2, ease: 'Quad.out', yoyo: true });
  }

  private pushObject(progress: number): void {
    const x = this.objectX(progress);
    this.tweens.killTweensOf([this.object, this.cat, this.vehicle]);
    this.object.setScale(S).setVisible(true);
    this.tweens.add({ targets: this.object, x, angle: this.objectAngle(progress), duration: 90, ease: 'Quad.out' });
    // Pequeño apachurrón para que el golpe se sienta.
    this.tweens.add({ targets: this.object, scaleY: 0.88 * S, scaleX: 1.08 * S, duration: 50, yoyo: true });
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
      .setScale(S)
      .setDepth(4);
    const floorY = this.floorY + 4;

    if (def.estiloRotura === 'rasgar') {
      // Queda hecho jirones ahí mismo.
      this.shatter(piece.x, piece.y - this.heightOf(piece) / 2, color, 24, 400);
      this.tweens.add({
        targets: piece,
        scaleY: 0.1 * S,
        alpha: 0,
        duration: 260,
        ease: 'Quad.in',
        onComplete: () => piece.destroy(),
      });
    } else if (this.onFloor) {
      // En el piso no hay orilla: se vuelca ahí mismo y se hace pedazos.
      this.tweens.add({
        targets: piece,
        angle: 90,
        x: piece.x + 4,
        duration: 300,
        ease: 'Quad.in',
        onComplete: () => {
          piece.destroy();
          this.shatter(piece.x + this.heightOf(piece) / 2, floorY - 2, color, 20, 260);
        },
      });
    } else {
      // Se va de la orilla y cae; lo que se vuelca gira más.
      this.tweens.chain({
        targets: piece,
        tweens: [
          { x: this.place.surface.right + this.widthOf(piece) / 2 + 3, duration: 80, ease: 'Quad.out' },
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
    this.tweens.add({ targets: this.object, scale: S, delay, duration: 220, ease: 'Back.out' });
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
    const zoom = this.scale.zoom * ART;
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
