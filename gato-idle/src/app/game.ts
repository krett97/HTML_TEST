// El pegamento entre la lógica (core/), la escena (game/), la UI (ui/) y los servicios.
// La escena y la UI nunca tocan el estado directamente: llaman métodos de Game y escuchan
// sus eventos (escena) o su `view` (UI).
import { writable, type Readable, type Writable } from 'svelte/store';
import { hit, rollTap, tap, type HitResult } from '../core/actions';
import { applyMark, markActive, markMultiplier, markRemaining } from '../core/marca';
import { bossDef, bossHere, damageBoss, endFight, rematchIn, startFight, type BossFight } from '../core/jefes';
import {
  allyCost,
  allyHitDamage,
  allyLevel,
  allyUnlocked,
  allyUpgradeGain,
  alliesDps,
  bestAllyPurchase,
  buyAlly,
} from '../core/allies';
import { playUntil, type PlayGoal } from '../core/bot';
import { afterBulk, buyBulk, planBulk } from '../core/bulk';
import { followerMultiplier, uploadVideo, videoPreview } from '../core/canal';
import { claimOffline, offlineEarnings } from '../core/offline';
import { formatDuration } from '../core/time';
import { incomePerSecond, sponsorReward } from '../core/income';
import { claimSkill, rammingMultiplier, researchDuration, resourceTotal, skillClaimable, skillLevel, skillMaxed, skillRequirement } from '../core/skills';
import { addAllyLevels, advanceClock, completeAllResearch, discoverAll, discoverNext, finishResearchNow } from '../core/pruebas';
import { deserialize, serialize } from '../core/save';
import { canAfford } from '../core/wallet';
import type { AllyDef, GameData, ObjectDef, SkillDef } from '../core/data';
import { sacoMultiplier, type Effect } from '../core/modifiers';
import { finishResearch, researchRemaining, researchStatus, startResearch, type ResearchStatus } from '../core/research';
import { checkUnlocks, hasUnlock, nextUnlock } from '../core/unlocks';
import { lastObjectIndex, moveIfReady, moveUnlocked, nextHome } from '../core/mudanza';
import {
  buyCritChance,
  buyCritDamage,
  buyFuerza,
  buySaco,
  buyValor,
  critChance,
  critChanceCost,
  critChanceMaxed,
  critDamageCost,
  critMultiplier,
  currentObject,
  fuerzaCost,
  sacoCost,
  buyMark,
  markCost,
  markMaxed,
  objectIndex,
  moneyPerBreak,
  objectProgress,
  tapDamage,
  tapsToBreak,
  valorCost,
  valorNextObject,
  valorStepsInObject,
  viewsPerBreak,
} from '../core/economy';
import { normalizeState } from '../core/normalize';
import { formatNum } from '../core/format';
import { RateLimiter } from '../core/limiter';
import { num, type Decimal } from '../core/num';
import { createInitialState, pruebasIniciales, type GameState, type Pruebas, type Settings, type VideoRecord } from '../core/state';
import { detectLocale, isLocale, locale } from '../i18n';
import type { SoundId } from '../core/sounds';
import { completeTutorialStep, skipTutorial, updateTutorial, type TutorialStep } from '../core/tutorial';
import type { AdResult, AdsService, RewardedPlacement } from '../services/ads';
import type { AudioEngine, PlayOptions } from '../services/audio';
import { vibrate, type HapticStrength } from '../services/haptics';
import { watchLifecycle } from '../services/lifecycle';
import type { KeyValueStore } from '../services/storage';
import { DpsMeter } from './dpsMeter';
import { Emitter } from './emitter';
import { SaveSlots } from './persistence';

export interface GameEvents {
  /** Un manotazo (del jugador o, desde la fase 3, automático). */
  hit: HitResult;
  /** El dueño compró un objeto nuevo (subió Valor de etapa). `primeraVez`: nunca se había visto (viñeta). */
  objeto: { objectId: string; primeraVez: boolean };
  /** El gato empezó a usar otra herramienta (llegó a una familia nueva de objetos). */
  herramienta: { toolId: string };
  /** El gato cambió de aspecto por una mejora: garras (crítico), sombrero (daño crítico) o saco (aliados). */
  aspecto: { cambio: LookChange; primeraVez: boolean };
  /** Un aliado golpeó solo. */
  aliado: { allyId: string; result: HitResult; marcado: boolean };
  /** Un zarpazo crítico marcó el objeto (Garras marcadoras). `nueva`: no estaba marcado. */
  marca: { nueva: boolean };
  /** Se adoptó un aliado (primer nivel). `primeraVez`: nunca se había adoptado (viñeta). */
  aliadoNuevo: { allyId: string; primeraVez: boolean };
  /** Se descubrió algo nuevo (id de unlocks.json). */
  descubrimiento: { unlockId: string };
  /** Terminó una investigación del laboratorio. */
  investigacion: { researchId: string };
  /** El dueño subió el video: la partida vuelve a empezar. */
  video: { video: VideoRecord };
  /** Empezó o terminó la pelea contra un jefe (jefes.json). */
  jefe:
    | { fase: 'inicio'; id: string; primeraVez: boolean }
    | { fase: 'fin'; id: string; gano: boolean; premio: Decimal; primeraVez: boolean };
  /** Un golpe al jefe: del gato (aliado null) o de un aliado. */
  jefeGolpe: { damage: Decimal; critico: boolean; embestida: boolean; aliado: string | null; marcado: boolean };
  /** El dueño se mudó a otra casa (casas.json). `primeraVez`: nunca se había mudado ahí (viñeta). */
  mudanza: { casa: string; primeraVez: boolean };
  /** Se cobraron las ganancias de mientras no estabas. */
  offline: { dinero: Decimal };
  /** Se cobró un patrocinio (anuncio visto completo). */
  patrocinio: { dinero: Decimal };
  /** La partida cambió de golpe (se reinició o se usó el modo pruebas): la escena se redibuja. */
  reset: undefined;
}

/** Cómo se ve el gato por sus mejoras. */
export interface CatLook {
  /** Garras metálicas: ya tiene probabilidad de crítico. */
  garras: boolean;
  /** Sombrero chistoso: ya tiene daño crítico. */
  sombrero: boolean;
  /** Saco de jefe: ya mejoró a los aliados. */
  saco: boolean;
}

/** Las mejoras del gato que tienen viñeta: las que cambian su aspecto y las Garras marcadoras. */
export type LookChange = keyof CatLook | 'marca';

/** Mejoras de la pestaña Mejoras que se compran por niveles. */
export type UpgradeId = 'fuerza' | 'valor' | 'critico' | 'danioCritico' | 'saco' | 'marca';

export interface AllyView {
  id: string;
  nivel: number;
  desbloqueado: boolean;
  /** Qué hace falta para descubrirlo. */
  condicion: { roturas?: number; objeto?: string };
  /** Niveles que compra el botón (1 o 10). */
  cantidad: number;
  costo: string;
  alcanza: boolean;
  danio: string;
  danioSiguiente: string;
  intervalo: number;
  /** Daño por segundo que suma la siguiente compra. */
  ganancia: string;
  /** Es la compra de aliado que más daño da por cada peso. */
  mejor: boolean;
}

export interface ResearchView {
  id: string;
  estado: ResearchStatus;
  costo: string;
  alcanza: boolean;
  /** Segundos que tarda. */
  duracion: number;
  efectos: Effect[];
  requiere: string;
  /** Ya se llegó al objeto que pide (si está bloqueada, es porque falta terminar la anterior). */
  alcanzado: boolean;
}

export interface NextUnlockView {
  /** "fuerza", "valor", "aliado:raton"… */
  id: string;
  tipo: 'funcion' | 'aliado';
  condicion: 'roturas' | 'objeto';
  /** Para "objeto": el id del objeto al que hay que llegar. */
  objeto: string | null;
  actual: number;
  meta: number;
}

/** Lo que la UI necesita mostrar, ya formateado. */
export interface ViewModel {
  dinero: string;
  objetoId: string;
  progreso: number;
  toques: number;
  roturas: number;
  /** Manotazos que necesita el objeto actual. */
  golpes: number;
  danio: string;
  vistas: string;
  ganancia: string;
  /** Niveles que compra cada botón ahora (1 o 10; menos si se llega a un tope). Cada mejora trae su `cantidad`. */
  compra: number;
  fuerza: {
    nivel: number;
    cantidad: number;
    costo: string;
    alcanza: boolean;
    danioSiguiente: string;
    golpesSiguiente: number;
  };
  valor: {
    nivel: number;
    /** Niveles comprados sobre el objeto actual y cuántos hay antes del siguiente. */
    enObjeto: number;
    porObjeto: number;
    ultimoObjeto: boolean;
    /** Está en el último objeto de la casa y falta juntar lo de la mudanza (ver el Canal). */
    esperaMudanza: boolean;
    /** El siguiente nivel de Valor muda al dueño a la casa nueva. */
    mudanza: boolean;
    cantidad: number;
    costo: string;
    alcanza: boolean;
    gananciaSiguiente: string;
    /** El objeto que compra el dueño con la siguiente compra, si cambia. */
    nuevoObjeto: string | null;
  };
  /** Garras afiladas: probabilidad de crítico, en %. */
  critico: { nivel: number; cantidad: number; costo: string; alcanza: boolean; prob: number; probSiguiente: number; maximo: boolean };
  /** Sombrero: por cuánto multiplica un crítico. */
  danioCritico: { nivel: number; cantidad: number; costo: string; alcanza: boolean; mult: string; multSiguiente: string };
  /** Saco de jefe: por cuánto se multiplica el daño de todos los aliados. */
  saco: { nivel: number; cantidad: number; costo: string; alcanza: boolean; mult: string; multSiguiente: string };
  /** Garras marcadoras: cuánto más pega la pandilla mientras el objeto está marcado. */
  marca: { nivel: number; max: number; maximo: boolean; cantidad: number; costo: string; alcanza: boolean; mult: string; multSiguiente: string; segundos: number };
  /** La marca en curso: segundos que le quedan (para la barrita). */
  marcaActiva: { restante: number; segundos: number; mult: string } | null;
  herramientaActual: string;
  /** Algo se puede comprar ahora (punto en la pestaña Mejoras). */
  hayCompra: boolean;
  /** Qué partes del juego ya se descubrieron. */
  funciones: { fuerza: boolean; valor: boolean; critico: boolean; danioCritico: boolean; saco: boolean; marca: boolean; laboratorio: boolean; canal: boolean; aliados: boolean };
  /** Ventana de bienvenida: lo que hizo la pandilla mientras no estabas. */
  offline: {
    visible: boolean;
    /** Tiempo que se cuenta (con tope) y tiempo que estuvo fuera. */
    tiempo: string;
    ausente: string;
    tope: boolean;
    horasMax: number;
    roturas: string;
    dinero: string;
    doble: string;
  };
  /** Daño por segundo real de los últimos segundos (medidor de la escena). */
  dps: {
    total: string;
    gato: string;
    aliados: string;
    /** Qué parte del daño hizo el gato (0 a 1). */
    parteGato: number;
    /** Va tocando rápido (4+ manotazos por segundo): el medidor se prende en llamas. */
    racha: boolean;
    activo: boolean;
  };
  /** Oferta de patrocinio en pantalla: ver un anuncio a cambio de dinero. */
  patrocinio: { visible: boolean; recompensa: string };
  /** El jefe de la casa: si espera en este objeto, la pelea en curso y los trofeos ganados. */
  jefe: {
    aqui: string | null;
    /** Segundos para la revancha tras perder (0: ya se puede). */
    revancha: number;
    pelea: { id: string; vida: string; quitado: string; progreso: number; restante: number } | null;
    trofeos: { id: string; bono: number }[];
  };
  /** Descubrimientos recientes (para la etiqueta "¡Nuevo!"). */
  nuevos: string[];
  proximo: NextUnlockView | null;
  laboratorio: {
    actual: { id: string; restante: number; duracion: number } | null;
    proyectos: ResearchView[];
  };
  aliados: AllyView[];
  /** Daño por segundo de todos los aliados. */
  dpsAliados: string;
  hayCompraAliado: boolean;
  ajustes: Settings;
  ultimoGuardado: number | null;
  guardadoPersistente: boolean;
  canal: {
    seguidores: string;
    /** Bono de los seguidores al dinero, en %. */
    bono: number;
    visualizaciones: string;
    /** El video en grabación (la partida actual). */
    grabando: { roturas: number; objeto: string; seguidores: string; visualizaciones: string; listo: boolean };
    videos: VideoView[];
    habilidades: SkillView[];
    hayCompra: boolean;
    /** La siguiente casa y cuánto falta en el Canal para mudarse (null: ya no hay más casas). */
    mudanza: {
      casa: string;
      siguiente: string;
      desbloqueada: boolean;
      seguidores: { tiene: string; meta: string; progreso: number };
      visualizaciones: { tiene: string; meta: string; progreso: number };
    } | null;
  };
  /** Modo pruebas: si existe en esta versión, los trucos y si alguno está prendido. */
  pruebas: Pruebas & { disponible: boolean; activas: boolean };
  /** Paso del tutorial que el gato está explicando (null: ninguno). */
  tutorial: TutorialStep | null;
}

export interface SkillView {
  id: string;
  nivel: number;
  max: number;
  maximo: boolean;
  /** Con qué se desbloquea: seguidores o visualizaciones. */
  recurso: 'seguidores' | 'visualizaciones';
  /** Cuánto lleva y cuánto pide el siguiente nivel. */
  tiene: string;
  meta: string;
  /** Avance hacia el siguiente nivel (0 a 1). */
  progreso: number;
  /** Ya se puede reclamar el siguiente nivel. */
  listo: boolean;
  /** Lo que da ahora y con el siguiente nivel, ya como texto corto (×5, +30, 10…). */
  actual: string;
  siguiente: string;
}

export interface VideoView {
  plantilla: number;
  objeto: string;
  roturas: number;
  seguidores: string;
  visualizaciones: string;
  viral: boolean;
}

/** Un punto de guardado del modo pruebas. */
export interface TestSlot {
  objetoId: string;
  dinero: string;
  guardado: number;
}

export interface GameServices {
  store: KeyValueStore;
  ads: AdsService;
  audio: AudioEngine;
}

const TICK_MS = 100;
/** Si el juego estuvo pausado más que esto, los aliados no "recuperan" golpes (eso será el offline). */
const MAX_TICK_MS = 3000;
/** Golpes que un aliado puede dar en un solo tick, como máximo. */
const MAX_HITS_PER_TICK = 4;
/** Cuánto tiempo se marca algo recién descubierto con "¡Nuevo!". */
const NEW_BADGE_MS = 45_000;
/** Manotazos por segundo para considerar que el jugador va "en racha". */
const STREAK_TAPS_PER_SECOND = 4;
/** Puntos de guardado del modo pruebas (aparte de la partida). */
const TEST_SLOTS = 3;
const testSlotKey = (slot: number) => `gato-idle.prueba.${slot}`;

export class Game {
  readonly events = new Emitter<GameEvents>();
  state: GameState;

  private readonly viewStore: Writable<ViewModel>;
  readonly view: Readable<ViewModel>;

  private readonly saves: SaveSlots;
  private readonly limiter: RateLimiter;
  private lastSavedAt: number | null = null;
  private dirty = true;
  private started = false;
  private lastTick = 0;
  /** Milisegundos acumulados por aliado hacia su siguiente golpe. */
  private readonly allyTimers = new Map<string, number>();
  /** Descubrimientos recientes y cuándo ocurrieron (no se guarda). */
  private readonly recentUnlocks = new Map<string, number>();
  private lastSecond = 0;
  private readonly dpsMeter = new DpsMeter();
  private lastDpsRefresh = 0;
  /** Cuándo aparece la siguiente oferta de patrocinio y hasta cuándo sigue visible (ms, performance.now). */
  private sponsorAt = 0;
  private sponsorUntil = 0;
  private sponsorBusy = false;
  /** Cuándo se fue a segundo plano (para las ganancias de mientras no estabas). */
  private backgroundAt: number | null = null;
  private offlineBusy = false;
  /** Pelea contra un jefe en curso (no se guarda: si se cierra el juego, se pierde sin premio ni espera). */
  private fight: BossFight | null = null;
  /** Si en el último cuadro el objeto estaba marcado (para refrescar al acabarse la marca). */
  private wasMarked = false;

  constructor(
    readonly data: GameData,
    private readonly services: GameServices,
  ) {
    this.state = createInitialState(Date.now());
    normalizeState(this.state, data);
    this.saves = new SaveSlots(services.store);
    this.limiter = new RateLimiter(data.balance.toquesMaxPorSegundo);
    this.viewStore = writable(this.buildView());
    this.view = { subscribe: this.viewStore.subscribe };
  }

  get ads(): AdsService {
    return this.services.ads;
  }

  async init(): Promise<void> {
    const loaded = await this.saves.load(Date.now());
    if (loaded) {
      this.state = loaded.state;
      this.lastSavedAt = loaded.savedAt;
    }
    normalizeState(this.state, this.data);
    // La pandilla siguió trabajando con el juego cerrado.
    if (loaded) this.collectOffline((Date.now() - loaded.savedAt) / 1000);
    if (!__PRUEBAS__) this.state.pruebas = pruebasIniciales();
    // Lo que ya se había ganado antes de esta versión se descubre en silencio.
    checkUnlocks(this.state, this.data);
    if (!isLocale(this.state.ajustes.idioma)) this.state.ajustes.idioma = null;
    this.applyLocale();
    this.services.audio.enabled = this.state.ajustes.sonido;
    await this.services.ads.init();
    this.refreshView();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.lastTick = performance.now();
    setInterval(() => this.tick(), TICK_MS);
    setInterval(() => void this.save(), this.data.balance.autoguardadoSegundos * 1000);
    watchLifecycle({
      onBackground: () => {
        this.backgroundAt = Date.now();
        void this.save();
      },
      onForeground: () => {
        if (this.backgroundAt !== null) this.collectOffline((Date.now() - this.backgroundAt) / 1000);
        this.backgroundAt = null;
        this.markDirty();
      },
    });
  }

  // ---- Acciones del jugador ----

  tap(): void {
    if (!this.limiter.tryConsume(performance.now())) return;
    if (this.fight) {
      const roll = rollTap(this.state, this.data);
      // Modo pruebas: el daño infinito también tumba al jefe de un manotazo.
      const damage = this.state.pruebas.danioInfinito ? this.fight.vida : roll.damage;
      this.dpsMeter.add(performance.now(), damage, 'gato');
      this.haptic('ligera');
      if (roll.critico) this.mark();
      this.hitBoss(damage, roll.critico, roll.embestida, null);
      return;
    }
    const result = tap(this.state, this.data);
    this.dpsMeter.add(performance.now(), result.damage, 'gato');
    this.haptic(result.broke ? 'media' : 'ligera');
    this.events.emit('hit', result);
    if (result.critico) this.mark();
    this.markDirty();
  }

  /** Un zarpazo crítico marca el objeto (si ya se tienen las Garras marcadoras). */
  private mark(): void {
    if (this.state.nivelMarca <= 0) return;
    this.events.emit('marca', { nueva: applyMark(this.state, this.data, Date.now()) });
  }

  /** Daño de un golpe de aliado, con el extra de la marca si el objeto está marcado. */
  private allyDamage(ally: AllyDef, level: number): { damage: Decimal; marcado: boolean } {
    const base = allyHitDamage(level, ally, this.state, this.data);
    const marcado = markActive(this.state, Date.now());
    return { damage: marcado ? base.mul(markMultiplier(this.state, this.data)) : base, marcado };
  }

  // ---- Jefes ----

  /** "¡Retar al jefe!": empieza la pelea si el jefe espera en este objeto y no hay que esperar la revancha. */
  challengeBoss(): boolean {
    const boss = bossHere(this.state, this.data);
    if (this.fight || !boss || rematchIn(this.state, Date.now()) > 0) return false;
    this.startBoss(boss.id);
    return true;
  }

  private startBoss(id: string): void {
    this.fight = startFight(this.data, bossDef(this.data, id)!, Date.now());
    this.events.emit('jefe', { fase: 'inicio', id, primeraVez: this.firstTime(`jefe:${id}`) });
    this.playSound('descubrimiento');
    this.markDirty();
  }

  private hitBoss(damage: Decimal, critico: boolean, embestida: boolean, aliado: string | null, marcado = false): void {
    const fight = this.fight;
    if (!fight) return;
    const won = damageBoss(fight, damage);
    this.events.emit('jefeGolpe', { damage, critico, embestida, aliado, marcado });
    if (won) this.finishBoss();
    this.markDirty();
  }

  /** Se acabó el tiempo o la vida del jefe: paga y avisa a la escena. */
  private finishBoss(): void {
    const fight = this.fight;
    if (!fight) return;
    this.fight = null;
    const outcome = endFight(this.state, this.data, fight, Date.now());
    const primeraVez = outcome.gano && this.firstTime(`trofeo:${outcome.id}`);
    this.events.emit('jefe', { fase: 'fin', id: outcome.id, gano: outcome.gano, premio: outcome.premio, primeraVez });
    this.playSound(outcome.gano ? 'objeto-nuevo' : 'critico');
    this.markDirty();
    void this.save();
  }

  /** "¡Va!" en un globito del tutorial que solo explica. */
  tutorialOk(step: TutorialStep): void {
    completeTutorialStep(this.state, step);
    this.markDirty();
  }

  skipTutorial(): void {
    skipTutorial(this.state);
    this.markDirty();
    void this.save();
  }

  /** Las viñetas de cómic salen solo la primera vez en la partida guardada (no en cada vuelta). */
  private firstTime(key: string): boolean {
    if (this.state.vistos.includes(key)) return false;
    this.state.vistos.push(key);
    return true;
  }

  /** Cuántos niveles compra cada botón (selector ×1 / ×10). */
  private get buyAmount(): number {
    return this.state.ajustes.compra;
  }

  /** Compra `buyAmount` niveles de una mejora de la pestaña Mejoras (todos o ninguno). */
  private buyUpgrade(id: UpgradeId): number {
    const { cost, buy } = this.upgrade(id);
    return buyBulk(this.state, this.buyAmount, cost, buy);
  }

  private upgrade(id: UpgradeId): { cost: (s: GameState) => Decimal; buy: (s: GameState) => boolean } {
    const d = this.data;
    switch (id) {
      case 'fuerza':
        return { cost: (s) => fuerzaCost(s, d), buy: (s) => buyFuerza(s, d) };
      case 'valor':
        return { cost: (s) => valorCost(s, d), buy: (s) => buyValor(s, d).bought };
      case 'critico':
        return { cost: (s) => critChanceCost(s, d), buy: (s) => buyCritChance(s, d) };
      case 'danioCritico':
        return { cost: (s) => critDamageCost(s, d), buy: (s) => buyCritDamage(s, d) };
      case 'saco':
        return { cost: (s) => sacoCost(s, d), buy: (s) => buySaco(s, d) };
      case 'marca':
        return { cost: (s) => markCost(s, d), buy: (s) => buyMark(s, d) };
    }
  }

  buyFuerza(): boolean {
    return this.afterPurchase(this.buyUpgrade('fuerza') > 0);
  }

  buyValor(): boolean {
    const before = currentObject(this.state, this.data);
    const home = this.state.casa;
    const bought = this.buyUpgrade('valor') > 0;
    this.afterObjectChange(before, home);
    return this.afterPurchase(bought);
  }

  /** Avisa a la escena si cambió el objeto (y si con eso el dueño se mudó). */
  private afterObjectChange(before: ObjectDef, home: number): void {
    const after = currentObject(this.state, this.data);
    if (after === before) return;
    const moved = this.state.casa !== home;
    // Al mudarse, la viñeta es la de la casa nueva; el objeto solo lleva su aviso.
    const primeraVez = this.firstTime(`objeto:${after.id}`) && !moved;
    this.events.emit('objeto', { objectId: after.id, primeraVez });
    if (moved) {
      const casa = this.data.homes[this.state.casa]!.id;
      this.events.emit('mudanza', { casa, primeraVez: this.firstTime(`casa:${casa}`) });
      void this.save();
    }
    // El gato se sube solo al carrito o a la aspiradora al llegar a esos objetos.
    if (after.herramienta !== before.herramienta) {
      this.events.emit('herramienta', { toolId: after.herramienta });
      this.playSound('herramienta');
    }
  }

  /** Garras afiladas: +probabilidad de crítico. */
  buyCritChance(): boolean {
    return this.buyLookUpgrade('critico', 'garras', () => this.state.nivelCritico);
  }

  /** Garras marcadoras: los críticos marcan el objeto y la pandilla pega un poco más mientras dura. */
  buyMark(): boolean {
    return this.buyLookUpgrade('marca', 'marca', () => this.state.nivelMarca);
  }

  /** Saco de jefe: +daño de todos los aliados. */
  buySaco(): boolean {
    return this.buyLookUpgrade('saco', 'saco', () => this.state.nivelSaco);
  }

  /** Sombrero: +daño de los críticos. */
  buyCritDamage(): boolean {
    return this.buyLookUpgrade('danioCritico', 'sombrero', () => this.state.nivelDanioCritico);
  }

  /** Las mejoras que cambian el aspecto del gato avisan la primera vez (viñeta de cómic en la escena). */
  private buyLookUpgrade(id: UpgradeId, cambio: LookChange, level: () => number): boolean {
    const first = level() === 0;
    const bought = this.buyUpgrade(id) > 0;
    if (bought && first) this.events.emit('aspecto', { cambio, primeraVez: this.firstTime(`aspecto:${cambio}`) });
    return this.afterPurchase(bought);
  }

  buyAlly(allyId: string): boolean {
    const ally = this.data.allies.find((a) => a.id === allyId);
    if (!ally) return false;
    const isNew = allyLevel(this.state, allyId) === 0;
    const bought = buyBulk(this.state, this.buyAmount, (s) => allyCost(s, this.data, ally), (s) => buyAlly(s, this.data, allyId)) > 0;
    if (bought && isNew) {
      this.allyTimers.set(allyId, 0);
      this.events.emit('aliadoNuevo', { allyId, primeraVez: this.firstTime(`aliado:${allyId}`) });
    }
    return this.afterPurchase(bought);
  }

  startResearch(researchId: string): boolean {
    return this.afterPurchase(startResearch(this.state, this.data, researchId, Date.now()));
  }

  /** El dueño sube el video: cobra seguidores y visualizaciones, y la partida vuelve al vaso. */
  uploadVideo(): VideoRecord | null {
    const video = uploadVideo(this.state, this.data, Date.now());
    if (!video) return null;
    this.fight = null;
    this.allyTimers.clear();
    this.dpsMeter.clear();
    this.events.emit('video', { video });
    this.events.emit('reset', undefined);
    this.playSound('descubrimiento');
    this.markDirty();
    this.refreshView();
    void this.save();
    return video;
  }

  /** Reclama el siguiente nivel de una habilidad cuya meta ya se alcanzó. */
  claimSkill(id: string): boolean {
    return this.afterPurchase(claimSkill(this.state, this.data, id));
  }

  // ---- Mientras no estabas ----

  /**
   * Calcula lo que hizo la pandilla en `seconds` sin jugar. Las ausencias cortas se cobran solas;
   * las largas quedan pendientes y se muestran en la ventana de bienvenida.
   */
  private collectOffline(seconds: number): void {
    if (!(seconds > 0)) return;
    const earnings = offlineEarnings(this.state, this.data, seconds);
    if (earnings.roturas <= 0) return;
    if (seconds < this.data.balance.offline.minimoSegundos && !this.state.offline) {
      claimOffline(this.state, this.data, earnings);
      this.markDirty();
      return;
    }
    // Si ya había algo pendiente (se volvió a salir sin cobrar), se suma.
    const prev = this.state.offline;
    this.state.offline = prev
      ? {
          segundos: prev.segundos + earnings.segundos,
          ausente: prev.ausente + earnings.ausente,
          tope: prev.tope || earnings.tope,
          roturas: prev.roturas + earnings.roturas,
          dinero: prev.dinero.add(earnings.dinero),
        }
      : earnings;
    this.markDirty();
  }

  /** Cobra lo de mientras no estabas; con `doble`, después de ver el anuncio "vacaciones" (×2). */
  async claimOffline(doble: boolean): Promise<boolean> {
    const pending = this.state.offline;
    if (!pending || this.offlineBusy) return false;
    let mult = 1;
    if (doble) {
      this.offlineBusy = true;
      const result = await this.services.ads.showRewarded('vacaciones');
      this.offlineBusy = false;
      // Si cerró el anuncio antes, la ventana sigue ahí para cobrar normal.
      if (!result.rewarded) return false;
      mult = 2;
    }
    const dinero = claimOffline(this.state, this.data, pending, mult);
    this.state.offline = null;
    this.events.emit('offline', { dinero });
    this.playSound('compra');
    this.markDirty();
    this.refreshView();
    void this.save();
    return true;
  }

  /** Sonido respetando el ajuste "Sonido". */
  playSound(id: SoundId, options?: PlayOptions): void {
    this.services.audio.play(id, options);
  }

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.state.ajustes[key] = value;
    if (key === 'idioma') this.applyLocale();
    if (key === 'sonido') this.services.audio.enabled = Boolean(value);
    this.refreshView();
    void this.save();
  }

  /** Ver el anuncio del patrocinio; si se ve completo, paga. */
  async claimSponsor(): Promise<boolean> {
    if (this.sponsorBusy || !this.sponsorVisible()) return false;
    this.sponsorBusy = true;
    this.sponsorUntil = 0;
    this.markDirty();
    const result = await this.services.ads.showRewarded('dinero');
    this.sponsorBusy = false;
    this.sponsorAt = performance.now() + this.data.balance.patrocinio.cadaSegundos * 1000;
    if (!result.rewarded) return false;
    const dinero = sponsorReward(this.state, this.data);
    this.state.dinero = this.state.dinero.add(dinero);
    this.state.dineroPartida = this.state.dineroPartida.add(dinero);
    this.events.emit('patrocinio', { dinero });
    this.playSound('compra');
    this.markDirty();
    void this.save();
    return true;
  }

  private sponsorVisible(): boolean {
    return hasUnlock(this.state, 'patrocinios') && performance.now() < this.sponsorUntil;
  }

  async showRewarded(placement: RewardedPlacement): Promise<AdResult> {
    return this.services.ads.showRewarded(placement);
  }

  async save(): Promise<void> {
    const now = Date.now();
    this.state.ultimaVez = now;
    await this.saves.write(this.state, now);
    this.lastSavedAt = now;
    this.markDirty();
  }

  async resetGame(): Promise<void> {
    const ajustes = this.state.ajustes;
    await this.saves.clear();
    this.state = createInitialState(Date.now());
    normalizeState(this.state, this.data);
    this.state.ajustes = ajustes;
    this.lastSavedAt = null;
    this.allyTimers.clear();
    this.recentUnlocks.clear();
    this.dpsMeter.clear();
    this.events.emit('reset', undefined);
    await this.save();
  }

  // ---- Modo pruebas (panel 🛠) ----

  setPrueba<K extends keyof Pruebas>(key: K, value: Pruebas[K]): void {
    this.state.pruebas[key] = value;
    this.afterTest();
  }

  /** Da el dinero que se ganaría en `seconds` segundos jugando activo. */
  testMoney(seconds: number): Decimal {
    const dinero = incomePerSecond(this.state, this.data, 5).mul(seconds).floor();
    this.state.dinero = this.state.dinero.add(dinero);
    this.state.dineroPartida = this.state.dineroPartida.add(dinero);
    this.afterTest();
    return dinero;
  }

  /** Juega como un jugador real hasta un objeto o durante un tiempo. Devuelve los segundos jugados. */
  testAdvance(goal: PlayGoal): number {
    const before = new Set(this.state.desbloqueos);
    const seconds = playUntil(this.state, this.data, goal);
    // El laboratorio también avanza ese tiempo.
    advanceClock(this.state, seconds);
    this.markNew(this.state.desbloqueos.filter((id) => !before.has(id)));
    this.afterTest(true);
    return seconds;
  }

  testDiscover(all: boolean): number {
    const fresh = all ? discoverAll(this.state, this.data) : [discoverNext(this.state, this.data)].filter((id) => id !== null);
    this.markNew(fresh);
    this.afterTest(true);
    return fresh.length;
  }

  testResearch(all: boolean): void {
    if (all) completeAllResearch(this.state, this.data);
    else finishResearchNow(this.state, Date.now());
    this.afterTest();
  }

  testAllies(levels: number): void {
    addAllyLevels(this.state, this.data, levels);
    this.afterTest(true);
  }

  /** Modo pruebas: junta justo lo que pide la mudanza a la siguiente casa (si queda alguna). */
  testMudanza(): boolean {
    const req = nextHome(this.state, this.data)?.requisito;
    if (!req) return false;
    const canal = this.state.canal;
    canal.seguidores = Math.max(canal.seguidores, req.seguidores);
    if (canal.visualizaciones.lt(req.visualizaciones)) canal.visualizaciones = req.visualizaciones;
    this.checkMove();
    this.afterTest();
    return true;
  }

  /** Modo pruebas: pelea contra el jefe de la casa aquí mismo (aunque no esté en su objeto ni se haya ganado). */
  testBoss(): boolean {
    if (this.fight) return false;
    const home = this.data.homes[this.state.casa]!.id;
    const boss = this.data.bosses.find((b) => b.casa === home) ?? this.data.bosses[0];
    if (!boss) return false;
    this.state.jefes.revancha = 0;
    this.startBoss(boss.id);
    return true;
  }

  /** Modo pruebas: seguidores y visualizaciones de regalo. */
  testCanal(seguidores: number, visualizaciones: number): void {
    this.state.canal.seguidores += seguidores;
    this.state.canal.visualizaciones = this.state.canal.visualizaciones.add(visualizaciones);
    this.checkMove();
    this.afterTest();
  }

  /** Modo pruebas: como si hubieras salido del juego `seconds` segundos. */
  testOffline(seconds: number): void {
    this.collectOffline(seconds);
    this.refreshView();
  }

  /** Muestra la oferta de patrocinio ahora. */
  testSponsor(): void {
    if (!hasUnlock(this.state, 'patrocinios')) {
      this.state.desbloqueos.push('patrocinios');
      this.markNew(['patrocinios']);
    }
    const now = performance.now();
    this.sponsorAt = now;
    this.sponsorUntil = 0;
    this.runSponsor(now);
    this.afterTest();
  }

  async testSlots(): Promise<(TestSlot | null)[]> {
    const slots: (TestSlot | null)[] = [];
    for (let slot = 1; slot <= TEST_SLOTS; slot++) {
      const text = await this.services.store.get(testSlotKey(slot));
      const loaded = text === null ? null : deserialize(text, Date.now());
      slots.push(
        loaded?.ok
          ? { objetoId: currentObject(loaded.state, this.data).id, dinero: this.formatMoney(loaded.state.dinero), guardado: loaded.savedAt }
          : null,
      );
    }
    return slots;
  }

  async saveTestSlot(slot: number): Promise<void> {
    await this.services.store.set(testSlotKey(slot), serialize(this.state, Date.now()));
  }

  async loadTestSlot(slot: number): Promise<boolean> {
    const text = await this.services.store.get(testSlotKey(slot));
    const loaded = text === null ? null : deserialize(text, Date.now());
    if (!loaded?.ok) return false;
    const ajustes = this.state.ajustes;
    this.state = loaded.state;
    this.state.ajustes = ajustes;
    normalizeState(this.state, this.data);
    this.allyTimers.clear();
    this.recentUnlocks.clear();
    this.afterTest(true);
    return true;
  }

  private markNew(ids: string[]): void {
    const now = performance.now();
    for (const id of ids) this.recentUnlocks.set(id, now);
  }

  /** Después de un truco: la escena se redibuja si cambió algo visible, y se guarda. */
  private afterTest(redraw = false): void {
    normalizeState(this.state, this.data);
    // Si cambió la partida de golpe, la pelea en curso se cancela (sin premio).
    if (redraw) this.fight = null;
    if (redraw) this.events.emit('reset', undefined);
    this.markDirty();
    this.refreshView();
    void this.save();
  }

  // ---- Consultas para la escena ----

  /** Si el objeto está marcado por las Garras marcadoras (la escena dibuja los rasguños). */
  isMarked(): boolean {
    return markActive(this.state, Date.now());
  }

  /** El jefe contra el que se pelea ahora, o null. */
  bossFightId(): string | null {
    return this.fight?.id ?? null;
  }

  currentObjectId(): string {
    return currentObject(this.state, this.data).id;
  }

  catLook(): CatLook {
    const s = this.state;
    return { garras: s.nivelCritico > 0, sombrero: s.nivelDanioCritico > 0, saco: s.nivelSaco > 0 };
  }

  progress(): number {
    return objectProgress(this.state, this.data);
  }

  /** Texto corto de dinero para los números flotantes. */
  formatMoney(value: Decimal): string {
    return formatNum(value, this.state.ajustes.notacion);
  }

  // ---- Internos ----

  private afterPurchase(bought: boolean): boolean {
    if (!bought) return false;
    this.playSound('compra');
    this.haptic('ligera');
    this.markDirty();
    this.refreshView();
    void this.save();
    return true;
  }

  private tick(): void {
    const now = performance.now();
    const dt = Math.min(now - this.lastTick, MAX_TICK_MS);
    this.lastTick = now;
    this.runAllies(dt);
    this.runDiscoveries(now);
    this.runSponsor(now);
    // Pelea contra el jefe (el reloj corre) o marca de las garras (la barrita baja): se actualiza
    // seguido, y una vez más cuando la marca se acaba para quitar la barrita.
    const marked = markActive(this.state, Date.now());
    if (marked !== this.wasMarked) {
      this.wasMarked = marked;
      this.markDirty();
    }
    if (this.fight || marked) {
      if (this.fight && Date.now() >= this.fight.fin) this.finishBoss();
      this.markDirty();
    } else if (this.state.jefes.revancha > Date.now() && now - this.lastSecond < TICK_MS) {
      this.markDirty();
    }
    // El medidor de daño baja solo cuando se deja de golpear: se actualiza aunque no pase nada más.
    if (this.dpsMeter.active && now - this.lastDpsRefresh > 250) {
      this.lastDpsRefresh = now;
      this.markDirty();
    }
    if (this.dirty) this.refreshView();
  }

  /** La oferta aparece cada `cadaSegundos` y se queda `visibleSegundos`. */
  private runSponsor(now: number): void {
    if (!hasUnlock(this.state, 'patrocinios') || this.sponsorBusy) return;
    const { cadaSegundos, visibleSegundos } = this.data.balance.patrocinio;
    if (this.sponsorAt === 0) this.sponsorAt = now + 20_000; // la primera, pronto, para que se conozca
    if (now >= this.sponsorAt && now >= this.sponsorUntil) {
      this.sponsorUntil = now + visibleSegundos * 1000;
      this.sponsorAt = now + cadaSegundos * 1000;
      this.markDirty();
    } else if (this.sponsorUntil !== 0 && now >= this.sponsorUntil) {
      this.sponsorUntil = 0;
      this.markDirty();
    }
  }

  /**
   * La meta de la mudanza se puede cumplir con Valor de sobra en el último objeto (o con el modo
   * pruebas): entonces el dueño se muda en ese momento.
   */
  private checkMove(): void {
    const before = currentObject(this.state, this.data);
    const home = this.state.casa;
    if (moveIfReady(this.state, this.data)) {
      this.afterObjectChange(before, home);
      this.markDirty();
    }
  }

  private runDiscoveries(now: number): void {
    this.checkMove();
    for (const unlock of checkUnlocks(this.state, this.data)) {
      this.recentUnlocks.set(unlock.id, now);
      this.events.emit('descubrimiento', { unlockId: unlock.id });
      this.playSound('descubrimiento');
      this.markDirty();
    }
    const done = finishResearch(this.state, this.data, Date.now());
    if (done) {
      this.events.emit('investigacion', { researchId: done.id });
      this.playSound('descubrimiento');
      this.markDirty();
      void this.save();
    }
    // Una vez por segundo: cuenta regresiva del laboratorio y caducidad de "¡Nuevo!".
    if (now - this.lastSecond >= 1000) {
      this.lastSecond = now;
      for (const [id, at] of this.recentUnlocks) if (now - at > NEW_BADGE_MS) this.recentUnlocks.delete(id);
      if (this.state.laboratorio.actual || this.recentUnlocks.size > 0) this.markDirty();
    }
  }

  /** Cada aliado golpea cada `intervalo` segundos. */
  private runAllies(dtMs: number): void {
    for (const ally of this.data.allies) {
      const level = allyLevel(this.state, ally.id);
      if (level === 0) continue;
      const interval = ally.intervalo * 1000;
      let elapsed = (this.allyTimers.get(ally.id) ?? 0) + dtMs;
      let hits = 0;
      while (elapsed >= interval && hits < MAX_HITS_PER_TICK) {
        elapsed -= interval;
        hits += 1;
        this.allyHit(ally, level);
      }
      this.allyTimers.set(ally.id, Math.min(elapsed, interval));
    }
  }

  private allyHit(ally: AllyDef, level: number): void {
    const { damage, marcado } = this.allyDamage(ally, level);
    if (this.fight) {
      this.dpsMeter.add(performance.now(), damage, 'aliados');
      this.hitBoss(damage, false, false, ally.id, marcado);
      return;
    }
    const result = hit(this.state, this.data, damage);
    this.dpsMeter.add(performance.now(), result.damage, 'aliados');
    this.events.emit('aliado', { allyId: ally.id, result, marcado });
    this.markDirty();
  }

  private markDirty(): void {
    this.dirty = true;
  }

  private haptic(strength: HapticStrength): void {
    if (this.state.ajustes.vibracion) vibrate(strength);
  }

  private applyLocale(): void {
    locale.set(this.state.ajustes.idioma ?? detectLocale());
  }

  private refreshView(): void {
    this.dirty = false;
    this.viewStore.set(this.buildView());
  }

  private allyView(ally: AllyDef, fmt: (value: Decimal) => string): AllyView {
    const s = this.state;
    const nivel = allyLevel(s, ally.id);
    const buy = (state: GameState) => buyAlly(state, this.data, ally.id);
    const plan = planBulk(s, this.buyAmount, (state) => allyCost(state, this.data, ally), buy);
    const after = afterBulk(s, plan.count, buy);
    return {
      id: ally.id,
      nivel,
      desbloqueado: allyUnlocked(s, this.data, ally),
      condicion: { ...this.data.unlocks.find((u) => u.id === `aliado:${ally.id}`)!.condicion },
      cantidad: plan.count,
      costo: fmt(plan.total),
      alcanza: plan.count > 0 && canAfford(s, plan.total),
      danio: fmt(allyHitDamage(nivel, ally, s, this.data)),
      danioSiguiente: fmt(allyHitDamage(nivel + plan.count, ally, s, this.data)),
      intervalo: ally.intervalo,
      ganancia: fmt(alliesDps(after, this.data).sub(alliesDps(s, this.data))),
      mejor: false,
    };
  }

  private offlineView(fmt: (value: Decimal) => string): ViewModel['offline'] {
    const o = this.state.offline;
    return {
      visible: o !== null,
      tiempo: formatDuration(o?.segundos ?? 0),
      ausente: formatDuration(o?.ausente ?? 0),
      tope: o?.tope ?? false,
      horasMax: this.data.balance.offline.horasMax,
      roturas: fmt(num(o?.roturas ?? 0)),
      dinero: fmt(o?.dinero ?? num(0)),
      doble: fmt((o?.dinero ?? num(0)).mul(2)),
    };
  }

  private dpsView(fmt: (value: Decimal) => string): ViewModel['dps'] {
    const reading = this.dpsMeter.read(performance.now());
    const total = reading.total.toNumber();
    return {
      total: fmt(reading.total),
      gato: fmt(reading.gato),
      aliados: fmt(reading.aliados),
      parteGato: total > 0 ? reading.gato.toNumber() / total : 0,
      racha: reading.toques >= STREAK_TAPS_PER_SECOND,
      activo: total > 0,
    };
  }

  private canalView(fmt: (value: Decimal) => string): ViewModel['canal'] {
    const s = this.state;
    const d = this.data;
    const preview = videoPreview(s, d);
    const habilidades = d.skills.map((def) => this.skillView(def, fmt));
    return {
      seguidores: fmt(num(s.canal.seguidores)),
      bono: Math.round((followerMultiplier(s, d) - 1) * 100),
      visualizaciones: fmt(s.canal.visualizaciones),
      grabando: {
        roturas: s.stats.roturasPartida,
        objeto: currentObject(s, d).id,
        seguidores: fmt(num(preview.seguidores)),
        visualizaciones: fmt(preview.visualizaciones),
        listo: preview.listo,
      },
      videos: s.canal.videos.map((v) => ({
        plantilla: v.plantilla,
        objeto: v.objeto,
        roturas: v.roturas,
        seguidores: fmt(num(v.seguidores)),
        visualizaciones: fmt(v.visualizaciones),
        viral: v.viral,
      })),
      habilidades,
      hayCompra: habilidades.some((h) => h.listo),
      mudanza: this.moveView(fmt),
    };
  }

  private bossView(fmt: (value: Decimal) => string): ViewModel['jefe'] {
    const s = this.state;
    const fight = this.fight;
    const now = Date.now();
    return {
      aqui: bossHere(s, this.data)?.id ?? null,
      revancha: rematchIn(s, now),
      pelea: fight && {
        id: fight.id,
        vida: fmt(fight.vida.sub(fight.danio)),
        quitado: fmt(fight.danio),
        progreso: Math.min(1, fight.danio.div(fight.vida).toNumber()),
        restante: Math.max(0, Math.ceil((fight.fin - now) / 100) / 10),
      },
      trofeos: this.data.bosses
        .filter((b) => s.jefes.derrotados.includes(b.id))
        .map((b) => ({ id: b.id, bono: Math.round(((b.efectos.find((e) => e.stat === 'danio')?.valor ?? 1) - 1) * 100) })),
    };
  }

  private moveView(fmt: (value: Decimal) => string): ViewModel['canal']['mudanza'] {
    const s = this.state;
    const home = nextHome(s, this.data);
    if (!home?.requisito) return null;
    const { seguidores, visualizaciones } = home.requisito;
    return {
      casa: this.data.homes[s.casa]!.id,
      siguiente: home.id,
      desbloqueada: moveUnlocked(s, this.data),
      seguidores: { tiene: fmt(num(s.canal.seguidores)), meta: fmt(num(seguidores)), progreso: Math.min(1, s.canal.seguidores / seguidores) },
      visualizaciones: {
        tiene: fmt(s.canal.visualizaciones),
        meta: fmt(visualizaciones),
        progreso: Math.min(1, s.canal.visualizaciones.div(visualizaciones).toNumber()),
      },
    };
  }

  private skillView(def: SkillDef, fmt: (value: Decimal) => string): SkillView {
    const s = this.state;
    const nivel = skillLevel(s, def.id);
    const next = { ...s, habilidades: [...s.habilidades.filter((h) => h.id !== def.id), { id: def.id, nivel: nivel + 1 }] };
    const show = (state: GameState): string => {
      const amount = skillLevel(state, def.id) * def.valor;
      switch (def.id) {
        case 'embestida':
          return `×${Math.round(rammingMultiplier(state, this.data) * 10) / 10}`;
        case 'recolectora':
        case 'express':
          return `${Math.round(amount * 100)}`;
        default:
          return `${amount}`;
      }
    };
    const maximo = skillMaxed(s, def);
    const tiene = resourceTotal(s, def.recurso);
    const meta = skillRequirement(def, nivel + 1);
    return {
      id: def.id,
      nivel,
      max: def.max,
      maximo,
      recurso: def.recurso,
      tiene: fmt(num(Math.min(tiene, meta))),
      meta: fmt(num(meta)),
      progreso: maximo ? 1 : Math.min(1, tiene / meta),
      listo: skillClaimable(s, def),
      actual: show(s),
      siguiente: show(next),
    };
  }

  private buildView(): ViewModel {
    const s = this.state;
    const d = this.data;
    const fmt = (value: Decimal) => formatNum(value, s.ajustes.notacion);
    // Cada mejora: cuántos niveles compra el botón (×1 / ×10), cuánto cuestan juntos y cómo queda
    // el estado después (para mostrar "qué cambia").
    const plan = (id: UpgradeId) => {
      const { cost, buy } = this.upgrade(id);
      const p = planBulk(s, this.buyAmount, cost, buy);
      return { cantidad: p.count, costo: fmt(p.total), alcanza: p.count > 0 && canAfford(s, p.total), after: afterBulk(s, p.count, buy) };
    };
    const fuerza = plan('fuerza');
    const valor = plan('valor');
    const critico = plan('critico');
    const danioCritico = plan('danioCritico');
    const saco = plan('saco');
    const marca = plan('marca');
    const object = currentObject(s, d);
    const nuevoObjeto = currentObject(valor.after, d);
    const pct = (p: number) => Math.round(p * 1000) / 10;
    const mult = (m: number) => `×${Math.round(m * 100) / 100}`;

    const puedeFuerza = fuerza.alcanza;
    const puedeValor = valor.alcanza;
    const puedeCritico = critico.alcanza;
    const puedeDanioCritico = danioCritico.alcanza;
    const puedeSaco = saco.alcanza;
    const puedeMarca = marca.alcanza;
    const aliados = d.allies.map((ally) => this.allyView(ally, fmt));
    const best = bestAllyPurchase(s, d);
    for (const ally of aliados) ally.mejor = ally.id === best && aliados.filter((a) => a.desbloqueado).length > 1;
    const next = nextUnlock(s, d);
    const now = Date.now();
    const current = s.laboratorio.actual;
    const currentDef = current ? d.research.find((r) => r.id === current.id) : undefined;

    return {
      dinero: s.pruebas.dineroInfinito ? '∞' : fmt(s.dinero),
      objetoId: object.id,
      progreso: this.progress(),
      toques: s.stats.toques,
      roturas: s.stats.roturas,
      golpes: tapsToBreak(s, d),
      danio: fmt(tapDamage(s, d)),
      vistas: fmt(viewsPerBreak(s, d)),
      ganancia: fmt(moneyPerBreak(s, d)),
      compra: this.buyAmount,
      fuerza: {
        nivel: s.nivelFuerza,
        cantidad: fuerza.cantidad,
        costo: fuerza.costo,
        alcanza: puedeFuerza,
        danioSiguiente: fmt(tapDamage(fuerza.after, d)),
        golpesSiguiente: tapsToBreak(fuerza.after, d),
      },
      valor: {
        nivel: s.nivelValor,
        enObjeto: valorStepsInObject(s, d),
        porObjeto: d.balance.valor.nivelesPorObjeto,
        ultimoObjeto: objectIndex(s, d) === lastObjectIndex(s, d),
        esperaMudanza: objectIndex(s, d) === lastObjectIndex(s, d) && nextHome(s, d) !== null && !moveUnlocked(s, d),
        mudanza: nuevoObjeto !== object && nextHome(s, d) !== null && nuevoObjeto.casa === nextHome(s, d)!.id,
        cantidad: valor.cantidad,
        costo: valor.costo,
        alcanza: puedeValor,
        gananciaSiguiente: fmt(moneyPerBreak(valor.after, d)),
        nuevoObjeto: nuevoObjeto !== object ? nuevoObjeto.id : null,
      },
      critico: {
        nivel: s.nivelCritico,
        cantidad: critico.cantidad,
        costo: critico.costo,
        alcanza: puedeCritico,
        prob: pct(critChance(s, d)),
        probSiguiente: pct(critChance(critico.after, d)),
        maximo: critChanceMaxed(s, d),
      },
      danioCritico: {
        nivel: s.nivelDanioCritico,
        cantidad: danioCritico.cantidad,
        costo: danioCritico.costo,
        alcanza: puedeDanioCritico,
        mult: mult(critMultiplier(s, d)),
        multSiguiente: mult(critMultiplier(danioCritico.after, d)),
      },
      saco: {
        nivel: s.nivelSaco,
        cantidad: saco.cantidad,
        costo: saco.costo,
        alcanza: puedeSaco,
        mult: mult(sacoMultiplier(s, d)),
        multSiguiente: mult(sacoMultiplier(saco.after, d)),
      },
      marca: {
        nivel: s.nivelMarca,
        max: d.balance.marca.max,
        maximo: markMaxed(s, d),
        cantidad: marca.cantidad,
        costo: marca.costo,
        alcanza: puedeMarca,
        mult: mult(markMultiplier(s, d)),
        multSiguiente: mult(markMultiplier(marca.after, d)),
        segundos: d.balance.marca.segundos,
      },
      marcaActiva: markActive(s, Date.now())
        ? { restante: markRemaining(s, Date.now()), segundos: d.balance.marca.segundos, mult: mult(markMultiplier(s, d)) }
        : null,
      herramientaActual: object.herramienta,
      hayCompra:
        (hasUnlock(s, 'fuerza') && puedeFuerza) ||
        (hasUnlock(s, 'valor') && puedeValor) ||
        (hasUnlock(s, 'critico') && puedeCritico) ||
        (hasUnlock(s, 'danioCritico') && puedeDanioCritico) ||
        (hasUnlock(s, 'saco') && puedeSaco) ||
        (hasUnlock(s, 'marca') && puedeMarca),
      funciones: {
        fuerza: hasUnlock(s, 'fuerza'),
        valor: hasUnlock(s, 'valor'),
        critico: hasUnlock(s, 'critico'),
        danioCritico: hasUnlock(s, 'danioCritico'),
        saco: hasUnlock(s, 'saco'),
        marca: hasUnlock(s, 'marca'),
        laboratorio: hasUnlock(s, 'laboratorio'),
        canal: hasUnlock(s, 'canal'),
        aliados: s.desbloqueos.some((id) => id.startsWith('aliado:')),
      },
      nuevos: [...this.recentUnlocks.keys()],
      dps: this.dpsView(fmt),
      offline: this.offlineView(fmt),
      patrocinio: { visible: this.sponsorVisible() && !this.sponsorBusy && !this.fight, recompensa: fmt(sponsorReward(s, d)) },
      jefe: this.bossView(fmt),
      proximo: next && {
        id: next.unlock.id,
        tipo: next.unlock.id.startsWith('aliado:') ? 'aliado' : 'funcion',
        condicion: 'roturas' in next.unlock.condicion ? 'roturas' : 'objeto',
        objeto: 'objeto' in next.unlock.condicion ? next.unlock.condicion.objeto : null,
        actual: next.current,
        meta: next.target,
      },
      laboratorio: {
        actual: current && currentDef ? { id: current.id, restante: researchRemaining(s, now), duracion: currentDef.duracion } : null,
        proyectos: d.research.map((r) => ({
          id: r.id,
          estado: researchStatus(s, d, r),
          costo: fmt(r.costo),
          alcanza: canAfford(s, r.costo),
          duracion: researchDuration(s, d, r),
          efectos: r.efectos,
          requiere: r.requiere,
          alcanzado: objectIndex(s, d) >= d.objects.findIndex((o) => o.id === r.requiere),
        })),
      },
      canal: this.canalView(fmt),
      aliados,
      dpsAliados: fmt(alliesDps(s, d)),
      hayCompraAliado: aliados.some((a) => a.desbloqueado && a.alcanza),
      ajustes: { ...s.ajustes },
      ultimoGuardado: this.lastSavedAt,
      guardadoPersistente: this.services.store.persistent,
      pruebas: {
        ...s.pruebas,
        disponible: __PRUEBAS__,
        activas: s.pruebas.dineroInfinito || s.pruebas.danioInfinito || s.pruebas.multDanio !== 1,
      },
      // También anota los pasos que ya se cumplieron.
      tutorial: updateTutorial(s, d),
    };
  }
}
