// El pegamento entre la lógica (core/), la escena (game/), la UI (ui/) y los servicios.
// La escena y la UI nunca tocan el estado directamente: llaman métodos de Game y escuchan
// sus eventos (escena) o su `view` (UI).
import { writable, type Readable, type Writable } from 'svelte/store';
import { currentObject, objectProgress, tap, type HitResult } from '../core/actions';
import type { GameData } from '../core/data';
import { formatNum } from '../core/format';
import { RateLimiter } from '../core/limiter';
import { createInitialState, type GameState, type Settings } from '../core/state';
import { detectLocale, isLocale, locale } from '../i18n';
import type { AdResult, AdsService, RewardedPlacement } from '../services/ads';
import { vibrate, type HapticStrength } from '../services/haptics';
import { watchLifecycle } from '../services/lifecycle';
import type { KeyValueStore } from '../services/storage';
import { Emitter } from './emitter';
import { SaveSlots } from './persistence';

export interface GameEvents {
  /** Un manotazo (del jugador o, desde la fase 3, automático). */
  hit: HitResult;
  /** La partida se reinició: la escena vuelve a poner el objeto al inicio. */
  reset: undefined;
}

/** Lo que la UI necesita mostrar, ya formateado. */
export interface ViewModel {
  dinero: string;
  objetoId: string;
  progreso: number;
  toques: number;
  roturas: number;
  ajustes: Settings;
  ultimoGuardado: number | null;
  guardadoPersistente: boolean;
}

export interface GameServices {
  store: KeyValueStore;
  ads: AdsService;
}

const TICK_MS = 100;

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

  constructor(
    readonly data: GameData,
    private readonly services: GameServices,
  ) {
    this.state = createInitialState(Date.now());
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
    if (!isLocale(this.state.ajustes.idioma)) this.state.ajustes.idioma = null;
    this.applyLocale();
    await this.services.ads.init();
    this.refreshView();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
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

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.state.ajustes[key] = value;
    if (key === 'idioma') this.applyLocale();
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
    this.state.ajustes = ajustes;
    this.lastSavedAt = null;
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

  // ---- Internos ----

  private tick(): void {
    // Fase 3: aquí corren los manotazos automáticos del camarógrafo.
    if (this.dirty) this.refreshView();
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

  private buildView(): ViewModel {
    const s = this.state;
    return {
      dinero: formatNum(s.dinero, s.ajustes.notacion),
      objetoId: this.currentObjectId(),
      progreso: this.progress(),
      toques: s.stats.toques,
      roturas: s.stats.roturas,
      ajustes: { ...s.ajustes },
      ultimoGuardado: this.lastSavedAt,
      guardadoPersistente: this.services.store.persistent,
    };
  }
}
