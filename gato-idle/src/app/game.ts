// El pegamento entre la lógica (core/), la escena (game/), la UI (ui/) y los servicios.
// La escena y la UI nunca tocan el estado directamente: llaman métodos de Game y escuchan
// sus eventos (escena) o su `view` (UI).
import { writable, type Readable, type Writable } from 'svelte/store';
import { hit, tap, type HitResult } from '../core/actions';
import { allyCost, allyHitDamage, allyLevel, allyUnlocked, alliesDps, buyAlly } from '../core/allies';
import type { AllyDef, GameData, ToolDef } from '../core/data';
import {
  buyFuerza,
  buyTool,
  buyValor,
  currentObject,
  fuerzaCost,
  moneyPerBreak,
  objectProgress,
  ownsTool,
  tapDamage,
  tapsToBreak,
  toolAvailable,
  valorCost,
  valorPreview,
  valorStepsInObject,
  viewsPerBreak,
} from '../core/economy';
import { normalizeState } from '../core/normalize';
import { formatNum } from '../core/format';
import { RateLimiter } from '../core/limiter';
import type { Decimal } from '../core/num';
import { createInitialState, type GameState, type Settings } from '../core/state';
import { detectLocale, isLocale, locale } from '../i18n';
import type { SoundId } from '../core/sounds';
import type { AdResult, AdsService, RewardedPlacement } from '../services/ads';
import type { AudioEngine, PlayOptions } from '../services/audio';
import { vibrate, type HapticStrength } from '../services/haptics';
import { watchLifecycle } from '../services/lifecycle';
import type { KeyValueStore } from '../services/storage';
import { Emitter } from './emitter';
import { SaveSlots } from './persistence';

export interface GameEvents {
  /** Un manotazo (del jugador o, desde la fase 3, automático). */
  hit: HitResult;
  /** El dueño compró un objeto nuevo (subió Valor de etapa). */
  objeto: { objectId: string };
  /** Se compró una herramienta. */
  herramienta: { toolId: string };
  /** Un aliado golpeó solo. */
  aliado: { allyId: string; result: HitResult };
  /** Se adoptó un aliado (primer nivel). */
  aliadoNuevo: { allyId: string };
  /** La partida se reinició: la escena vuelve a poner el objeto al inicio. */
  reset: undefined;
}

export interface ToolView {
  id: string;
  /** 'disponible': hace falta ahora para que el dueño compre el siguiente objeto. */
  estado: 'comprada' | 'disponible' | 'bloqueada';
  costo: string;
  alcanza: boolean;
  /** Multiplicador de daño que da. */
  mult: number;
  /** Ids de los objetos que desbloquea. */
  objetos: string[];
}

export interface AllyView {
  id: string;
  nivel: number;
  desbloqueado: boolean;
  /** Objeto con el que llega. */
  desbloqueo: string;
  costo: string;
  alcanza: boolean;
  danio: string;
  danioSiguiente: string;
  intervalo: number;
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
  fuerza: {
    nivel: number;
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
    costo: string;
    alcanza: boolean;
    gananciaSiguiente: string;
    /** El objeto que compra el dueño con el siguiente nivel, si cambia. */
    nuevoObjeto: string | null;
    /** La herramienta que falta para seguir, si falta. */
    requiere: string | null;
    costoHerramienta: string;
    alcanzaHerramienta: boolean;
  };
  herramientaActual: string;
  herramientas: ToolView[];
  /** Algo se puede comprar ahora (punto en la pestaña Mejoras). */
  hayCompra: boolean;
  aliados: AllyView[];
  /** Daño por segundo de todos los aliados. */
  dpsAliados: string;
  hayCompraAliado: boolean;
  ajustes: Settings;
  ultimoGuardado: number | null;
  guardadoPersistente: boolean;
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
      onBackground: () => void this.save(),
      onForeground: () => this.markDirty(),
    });
  }

  // ---- Acciones del jugador ----

  tap(): void {
    if (!this.limiter.tryConsume(performance.now())) return;
    const result = tap(this.state, this.data);
    this.haptic(result.broke ? 'media' : 'ligera');
    this.events.emit('hit', result);
    this.markDirty();
  }

  buyFuerza(): boolean {
    return this.afterPurchase(buyFuerza(this.state, this.data));
  }

  buyValor(): boolean {
    const result = buyValor(this.state, this.data);
    if (result.newObject) this.events.emit('objeto', { objectId: result.newObject.id });
    return this.afterPurchase(result.bought);
  }

  buyTool(toolId: string): boolean {
    const bought = buyTool(this.state, this.data, toolId);
    if (bought) {
      this.events.emit('herramienta', { toolId });
      this.playSound('herramienta');
    }
    return this.afterPurchase(bought);
  }

  buyAlly(allyId: string): boolean {
    const isNew = allyLevel(this.state, allyId) === 0;
    const bought = buyAlly(this.state, this.data, allyId);
    if (bought && isNew) {
      this.allyTimers.set(allyId, 0);
      this.events.emit('aliadoNuevo', { allyId });
    }
    return this.afterPurchase(bought);
  }

  /** Sonido respetando el ajuste "Sonido". */
  playSound(id: SoundId, options?: PlayOptions): void {
    this.services.audio.play(id, options);
  }

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.state.ajustes[key] = value;
    if (key === 'idioma') this.applyLocale();
    if (key === 'sonido') this.services.audio.enabled = Boolean(value);
    this.markDirty();
    void this.save();
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
    this.events.emit('reset', undefined);
    await this.save();
  }

  // ---- Consultas para la escena ----

  currentObjectId(): string {
    return currentObject(this.state, this.data).id;
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
    if (this.dirty) this.refreshView();
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
    const result = hit(this.state, this.data, allyHitDamage(level, ally, this.state, this.data));
    this.events.emit('aliado', { allyId: ally.id, result });
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
    const costo = allyCost(s, this.data, ally);
    return {
      id: ally.id,
      nivel,
      desbloqueado: allyUnlocked(s, this.data, ally),
      desbloqueo: ally.desbloqueo,
      costo: fmt(costo),
      alcanza: s.dinero.gte(costo),
      danio: fmt(allyHitDamage(nivel, ally, s, this.data)),
      danioSiguiente: fmt(allyHitDamage(nivel + 1, ally, s, this.data)),
      intervalo: ally.intervalo,
    };
  }

  private toolView(tool: ToolDef): ToolView {
    const s = this.state;
    const mult = tool.efectos
      .filter((e) => e.stat === 'danio' && e.op === 'mult')
      .reduce((total, e) => total * e.valor, 1);
    return {
      id: tool.id,
      estado: ownsTool(s, tool) ? 'comprada' : toolAvailable(s, this.data, tool.id) ? 'disponible' : 'bloqueada',
      costo: formatNum(tool.costo, s.ajustes.notacion),
      alcanza: s.dinero.gte(tool.costo),
      mult,
      objetos: this.data.objects.filter((o) => o.herramienta === tool.id).map((o) => o.id),
    };
  }

  private buildView(): ViewModel {
    const s = this.state;
    const d = this.data;
    const fmt = (value: Decimal) => formatNum(value, s.ajustes.notacion);
    // Para mostrar "qué cambia", se calcula sobre una copia con un nivel más.
    const withFuerza = { ...s, nivelFuerza: s.nivelFuerza + 1 };
    const withValor = { ...s, nivelValor: s.nivelValor + 1 };

    const costoFuerza = fuerzaCost(s, d);
    const costoValor = valorCost(s, d);
    const preview = valorPreview(s, d);
    const object = currentObject(s, d);
    const herramientas = d.tools.map((tool) => this.toolView(tool));

    const puedeFuerza = s.dinero.gte(costoFuerza);
    const puedeValor = !preview.requiredTool && s.dinero.gte(costoValor);
    const puedeHerramienta = herramientas.some((t) => t.estado === 'disponible' && t.alcanza);
    const aliados = d.allies.map((ally) => this.allyView(ally, fmt));

    return {
      dinero: fmt(s.dinero),
      objetoId: object.id,
      progreso: this.progress(),
      toques: s.stats.toques,
      roturas: s.stats.roturas,
      golpes: tapsToBreak(s, d),
      danio: fmt(tapDamage(s, d)),
      vistas: fmt(viewsPerBreak(s, d)),
      ganancia: fmt(moneyPerBreak(s, d)),
      fuerza: {
        nivel: s.nivelFuerza,
        costo: fmt(costoFuerza),
        alcanza: puedeFuerza,
        danioSiguiente: fmt(tapDamage(withFuerza, d)),
        golpesSiguiente: tapsToBreak(withFuerza, d),
      },
      valor: {
        nivel: s.nivelValor,
        enObjeto: valorStepsInObject(s, d),
        porObjeto: d.balance.valor.nivelesPorObjeto,
        ultimoObjeto: object === d.objects[d.objects.length - 1],
        costo: fmt(costoValor),
        alcanza: puedeValor,
        gananciaSiguiente: fmt(moneyPerBreak(withValor, d)),
        nuevoObjeto: preview.nextObject?.id ?? null,
        requiere: preview.requiredTool?.id ?? null,
        costoHerramienta: preview.requiredTool ? fmt(preview.requiredTool.costo) : '',
        alcanzaHerramienta: preview.requiredTool ? s.dinero.gte(preview.requiredTool.costo) : false,
      },
      herramientaActual: object.herramienta,
      herramientas,
      hayCompra: puedeFuerza || puedeValor || puedeHerramienta,
      aliados,
      dpsAliados: fmt(alliesDps(s, d)),
      hayCompraAliado: aliados.some((a) => a.desbloqueado && a.alcanza),
      ajustes: { ...s.ajustes },
      ultimoGuardado: this.lastSavedAt,
      guardadoPersistente: this.services.store.persistent,
    };
  }
}
