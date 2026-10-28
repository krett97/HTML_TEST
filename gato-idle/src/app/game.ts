// El pegamento entre la lógica (core/), la escena (game/), la UI (ui/) y los servicios.
// La escena y la UI nunca tocan el estado directamente: llaman métodos de Game y escuchan
// sus eventos (escena) o su `view` (UI).
import { writable, type Readable, type Writable } from 'svelte/store';
import { hit, tap, type HitResult } from '../core/actions';
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
import { incomePerSecond, sponsorReward } from '../core/income';
import { addAllyLevels, advanceClock, completeAllResearch, discoverAll, discoverNext, finishResearchNow } from '../core/pruebas';
import { deserialize, serialize } from '../core/save';
import { canAfford } from '../core/wallet';
import type { AllyDef, GameData, ToolDef } from '../core/data';
import type { Effect } from '../core/modifiers';
import { finishResearch, researchRemaining, researchStatus, startResearch, type ResearchStatus } from '../core/research';
import { checkUnlocks, hasUnlock, nextUnlock } from '../core/unlocks';
import {
  buyFuerza,
  buyTool,
  buyValor,
  currentObject,
  fuerzaCost,
  objectIndexFor,
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
import { createInitialState, pruebasIniciales, type GameState, type Pruebas, type Settings } from '../core/state';
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
  /** Se descubrió algo nuevo (id de unlocks.json). */
  descubrimiento: { unlockId: string };
  /** Terminó una investigación del laboratorio. */
  investigacion: { researchId: string };
  /** Se cobró un patrocinio (anuncio visto completo). */
  patrocinio: { dinero: Decimal };
  /** La partida cambió de golpe (se reinició o se usó el modo pruebas): la escena se redibuja. */
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
  /** Qué hace falta para descubrirlo. */
  condicion: { roturas?: number; objeto?: string };
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
  /** Qué partes del juego ya se descubrieron. */
  funciones: { fuerza: boolean; valor: boolean; herramientas: boolean; laboratorio: boolean; aliados: boolean };
  /** Oferta de patrocinio en pantalla: ver un anuncio a cambio de dinero. */
  patrocinio: { visible: boolean; recompensa: string };
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
  /** Modo pruebas: si existe en esta versión, los trucos y si alguno está prendido. */
  pruebas: Pruebas & { disponible: boolean; activas: boolean };
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
  /** Cuándo aparece la siguiente oferta de patrocinio y hasta cuándo sigue visible (ms, performance.now). */
  private sponsorAt = 0;
  private sponsorUntil = 0;
  private sponsorBusy = false;

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

  startResearch(researchId: string): boolean {
    return this.afterPurchase(startResearch(this.state, this.data, researchId, Date.now()));
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
    if (redraw) this.events.emit('reset', undefined);
    this.markDirty();
    this.refreshView();
    void this.save();
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
    this.runDiscoveries(now);
    this.runSponsor(now);
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

  private runDiscoveries(now: number): void {
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
      condicion: { ...this.data.unlocks.find((u) => u.id === `aliado:${ally.id}`)!.condicion },
      costo: fmt(costo),
      alcanza: canAfford(s, costo),
      danio: fmt(allyHitDamage(nivel, ally, s, this.data)),
      danioSiguiente: fmt(allyHitDamage(nivel + 1, ally, s, this.data)),
      intervalo: ally.intervalo,
      ganancia: fmt(allyUpgradeGain(s, this.data, ally)),
      mejor: false,
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
      alcanza: canAfford(s, tool.costo),
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

    const puedeFuerza = canAfford(s, costoFuerza);
    const puedeValor = !preview.requiredTool && canAfford(s, costoValor);
    const puedeHerramienta = herramientas.some((t) => t.estado === 'disponible' && t.alcanza);
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
        alcanzaHerramienta: preview.requiredTool ? canAfford(s, preview.requiredTool.costo) : false,
      },
      herramientaActual: object.herramienta,
      herramientas,
      hayCompra: (hasUnlock(s, 'fuerza') && puedeFuerza) || (hasUnlock(s, 'valor') && puedeValor) || puedeHerramienta,
      funciones: {
        fuerza: hasUnlock(s, 'fuerza'),
        valor: hasUnlock(s, 'valor'),
        herramientas: hasUnlock(s, 'herramientas'),
        laboratorio: hasUnlock(s, 'laboratorio'),
        aliados: s.desbloqueos.some((id) => id.startsWith('aliado:')),
      },
      nuevos: [...this.recentUnlocks.keys()],
      patrocinio: { visible: this.sponsorVisible() && !this.sponsorBusy, recompensa: fmt(sponsorReward(s, d)) },
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
          duracion: r.duracion,
          efectos: r.efectos,
          requiere: r.requiere,
          alcanzado: objectIndexFor(s.nivelValor, d) >= d.objects.findIndex((o) => o.id === r.requiere),
        })),
      },
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
    };
  }
}
