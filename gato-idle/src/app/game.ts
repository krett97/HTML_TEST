// El pegamento entre la lógica (core/), la escena (game/), la UI (ui/) y los servicios.
// La escena y la UI nunca tocan el estado directamente: llaman métodos de Game y escuchan
// sus eventos (escena) o su `view` (UI).
import { writable, type Readable, type Writable } from 'svelte/store';
import { tap, type HitResult } from '../core/actions';
import type { GameData, ToolDef } from '../core/data';
import {
  buyFuerza,
  buyTool,
  buyValor,
  currentObject,
  fuerzaCost,
  moneyPerBreak,
  normalizeState,
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
import { formatNum } from '../core/format';
import { RateLimiter } from '../core/limiter';
import type { Decimal } from '../core/num';
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
  /** El dueño compró un objeto nuevo (subió Valor de etapa). */
  objeto: { objectId: string };
  /** Se compró una herramienta. */
  herramienta: { toolId: string };
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
    if (bought) this.events.emit('herramienta', { toolId });
    return this.afterPurchase(bought);
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
    normalizeState(this.state, this.data);
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

  /** Texto corto de dinero para los números flotantes. */
  formatMoney(value: Decimal): string {
    return formatNum(value, this.state.ajustes.notacion);
  }

  // ---- Internos ----

  private afterPurchase(bought: boolean): boolean {
    if (!bought) return false;
    this.haptic('ligera');
    this.markDirty();
    this.refreshView();
    void this.save();
    return true;
  }

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
      ajustes: { ...s.ajustes },
      ultimoGuardado: this.lastSavedAt,
      guardadoPersistente: this.services.store.persistent,
    };
  }
}
