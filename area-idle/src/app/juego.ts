// El controlador: guarda el progreso (meta), arma cada partida, recibe los toques y avisa a la
// escena (eventos de la partida) y a la interfaz (la vista, un store de Svelte).
import { writable, type Readable } from 'svelte/store';
import type { TalentId } from '../core/datos';
import { buyTalent, chooseLevel, createMeta, finishRun, loadMeta, stats, type Meta } from '../core/meta';
import { idleGoldPerMinute, idleReward, idleUnlocked } from '../core/inactivo';
import { simulatePlay, type SimulatedPlay } from '../core/bot';
import { claimableCount, claimBonus, claimMission, missionsUnlocked, rollDaily } from '../core/misiones';
import { bossOf, createGuardRun, createRun, moveCursor, startGuardRun, startRun, stepRun, updateGuardRun, type Run, type RunEvent } from '../core/run';
import { ENEMIES, GUARDIA, levelConfig, type EnemyKind, type ZoneId } from '../core/datos';
import { locale, detectLocale } from '../i18n';
import type { AudioEngine, SoundId } from '../services/audio';
import { buyShop, endWeek, fight, INTENTOS_MAX, pvpUnlocked, syncPvp, type FightResult, type ShopId } from '../core/pvp';
import { activeGoldPerMinute } from '../core/inactivo';
import { clearRaw, loadRaw, saveRaw } from '../services/storage';
import { RankingService } from '../services/ranking';
import { cleanName, rankingEntry, rankingUnlocked } from '../core/ranking';

export type Fase = 'jugando' | 'fin' | 'arbol';

export interface Vista {
  fase: Fase;
  /** Segundos que quedan y los que dura la partida. */
  restante: number;
  duracion: number;
  oroPartida: number;
  reventados: number;
  /** El nivel que se juega, cuántos slimes trae y si se ganó (al terminar) y con qué premio. */
  nivel: number;
  total: number;
  gano: boolean;
  premio: number;
  vivos: number;
  /** El jugador ya tocó en esta partida (para esconder la pista). */
  toco: boolean;
  meta: Meta;
  /** Oro juntado mientras no jugabas, esperando a que lo cobres (se muestra fuera de la partida). */
  inactivo: { segundos: number; oro: number; tope: boolean } | null;
  /** Oro por minuto sin jugar y hasta cuántas horas (null si aún no se abre). */
  ritmoInactivo: { porMinuto: number; horas: number } | null;
  /** Esta partida abrió el oro por inactividad (aviso en el fin). */
  abrioInactivo: boolean;
  /** Esta partida abrió las misiones y las gemas (nivel 11). */
  abrioMisiones: boolean;
  /** Misiones abiertas y cuántas cosas hay para cobrar. */
  misiones: { abiertas: boolean; listas: number };
  /** Ranking (desde el nivel 17): si ya se abrió y tu nombre. */
  ranking: { abierto: boolean; nombre: string };
  abrioRanking: boolean;
  /** PvP (desde el nivel 19). */
  pvp: { abierto: boolean };
  /** Modo guardia andando (en el árbol, con tropas): cuánto oro da por minuto si tus tropas alcanzan. */
  guardia: { porMinuto: number } | null;
  abrioPvp: boolean;
  /** El jefe del nivel (si es de jefe): quién, su vida y si está aturdido o furioso. */
  jefe: { kind: EnemyKind; vida: number; max: number; aturdido: boolean; furia: boolean } | null;
  /** El nivel elegido en el árbol es de jefe (corona en el selector). */
  nivelDeJefe: boolean;
  /** La zona del nivel que se juega (o del elegido, fuera de la partida). */
  zona: ZoneId;

  /** La muralla en la partida: vida, y si ya cayó (sus aliados no atacan el resto del nivel). */
  muro: { vida: number; max: number; caido: boolean } | null;
  /** Sube en cada partida nueva (la escena se reinicia al verlo cambiar). */
  partida: number;
}

type Listener = (events: RunEvent[], run: Run) => void;

export class Juego {
  meta: Meta;
  run: Run | null = null;
  private readonly vista = writable<Vista>(undefined as unknown as Vista);
  readonly view: Readable<Vista> = this.vista;
  private listeners: Listener[] = [];
  private playListeners: (() => void)[] = [];
  private guardListeners: (() => void)[] = [];
  private toco = false;
  private partida = 0;
  private premio = 0;

  private pendiente: { segundos: number; oro: number; tope: boolean } | null = null;
  private abrioInactivo = false;
  private abrioMisiones = false;
  private abrioRanking = false;
  private abrioPvp = false;
  /** El ranking compartido (en Claude) o solo tu fila (fuera de Claude). */
  readonly ranking = new RankingService();
  /** Al abrir: quien ya jugó llega al árbol; quien es nuevo, directo a jugar. */
  fase: Fase = 'jugando';
  private ultimaVista = 0;

  constructor(private readonly audio: AudioEngine) {
    this.meta = loadMeta(loadRaw());
    this.pendiente = idleReward(this.meta, Date.now());
    this.fase = this.meta.partidas > 0 ? 'arbol' : 'jugando';
    this.audio.enabled = this.meta.ajustes.sonido;
    locale.set(this.meta.ajustes.idioma ?? detectLocale());
    this.save();
    this.publish();
  }

  /** La app vuelve del segundo plano: lo juntado mientras tanto (si fue más de un minuto). */
  resume(): void {
    const r = idleReward(this.meta, Date.now());
    if (r) this.pendiente = { segundos: (this.pendiente?.segundos ?? 0) + r.segundos, oro: (this.pendiente?.oro ?? 0) + r.oro, tope: r.tope };
    this.save();
    this.publish();
  }

  /** Cobra lo juntado mientras no jugabas. */
  collectIdle(): number {
    const oro = this.pendiente?.oro ?? 0;
    this.meta.oro += oro;
    if (oro > 0) this.meta.cuenta.cobros++;
    this.pendiente = null;
    if (oro > 0) this.audio.play('compra');
    this.save();
    this.publish();
    return oro;
  }

  /** Modo pruebas: como si hubieras estado fuera `segundos` (se cobra en la ventana de bienvenida). */
  simulateAway(segundos: number): void {
    this.meta.ultimaVez = Date.now() - segundos * 1000;
    this.resume();
  }

  onEvents(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((l) => l !== fn));
  }

  /** La escena se apunta para saber cuándo empezar la guardia (al entrar al árbol). */
  onGuard(fn: () => void): () => void {
    this.guardListeners.push(fn);
    return () => (this.guardListeners = this.guardListeners.filter((l) => l !== fn));
  }

  /** ¿Hay tropas para la guardia? (al menos un arquero o el mago) */
  get hayTropas(): boolean {
    const s = stats(this.meta);
    return s.arqueros.cantidad > 0 || s.mago.activo;
  }

  /** Oro por baja en guardia: el 20 % (más "Oro inactivo") de lo que se gana jugando, si tus tropas alcanzan. */
  private oroGuardia(): number {
    return (stats(this.meta).inactivo.eficiencia + GUARDIA.extra) * activeGoldPerMinute(this.meta) * (GUARDIA.cada / 60);
  }

  /** Oro por minuto de la guardia (si tus tropas alcanzan a todos). */
  get ritmoGuardia(): number {
    return (stats(this.meta).inactivo.eficiencia + GUARDIA.extra) * activeGoldPerMinute(this.meta);
  }

  /** Empieza la guardia en un campo de `alto` unidades; sin tropas no hay guardia. */
  startGuard(alto: number, arriba?: number): RunEvent[] {
    if (this.fase !== 'arbol' || !this.hayTropas) {
      if (this.run?.guardia) this.run = null;
      return [];
    }
    this.run = createGuardRun(stats(this.meta), alto, this.meta.nivel, this.oroGuardia(), Date.now(), arriba);
    return startGuardRun(this.run);
  }

  private guard(): void {
    for (const fn of this.guardListeners) fn();
  }

  /** La escena se apunta para saber cuándo empezar otra partida (botón ¡Jugar! u Otra vez). */
  onPlay(fn: () => void): () => void {
    this.playListeners.push(fn);
    return () => (this.playListeners = this.playListeners.filter((l) => l !== fn));
  }

  play(): void {
    for (const fn of this.playListeners) fn();
  }

  /** Empieza una partida en un campo de `alto` unidades (lo decide la escena según la pantalla). */
  start(alto: number, arriba?: number): RunEvent[] {
    this.run = createRun(stats(this.meta), alto, this.meta.jugando, Date.now(), arriba);

    this.premio = 0;
    this.toco = false;
    this.partida++;
    this.fase = 'jugando';
    const events = startRun(this.run);
    this.publish();
    return events;
  }

  /** Lo llama la escena cada cuadro. */
  step(dt: number): RunEvent[] {
    const run = this.run;
    if (!run) return [];
    if (run.guardia) return this.stepGuard(run, dt);
    if (this.fase !== 'jugando') return [];
    const events = stepRun(run, dt);
    for (const e of events) {
      if (e.type === 'spawn' && run.t > 0) this.audio.play('aparece');
      else if (e.type === 'kill' && ENEMIES[e.kind].jefe) this.audio.play('jefeCae');
      else if (e.type === 'kill') this.audio.play(e.kind === 'azul' ? 'popGrande' : 'pop');
      else if (e.type === 'impact') this.audio.play(e.fuente === 'mago' ? 'magia' : 'disparo');
      else if (e.type === 'volley') this.audio.play('arco');
      else if (e.type === 'sling') this.audio.play(e.tipo === 'golpe' ? 'golpeMuro' : e.tipo === 'flecha' ? 'arco' : e.tipo === 'lanza' ? 'lanza' : 'resortera');
      else if (e.type === 'bossJump') this.audio.play(run.jefe?.def.mueve === 'embestida' ? 'embiste' : 'brinco');
      else if (e.type === 'bossStun') this.audio.play('aturde');
      else if (e.type === 'bossSummon') this.audio.play(run.jefe?.def.escolta === 'lobo' ? 'aullido' : 'invoca');
      else if (e.type === 'bossThrow') this.audio.play('lanza');
      else if (e.type === 'bossRage') this.audio.play('furia');
      else if (e.type === 'wallHit') this.audio.play('golpeMuro');
      else if (e.type === 'wallDown') this.audio.play('derrumbe');
      else if (e.type === 'wallRepair') this.audio.play('repara');
      else if (e.type === 'rise') this.audio.play('invoca');
      else if (e.type === 'hit' && e.efecto === 'critico') this.audio.play('critico');
      else if (e.type === 'fire') this.audio.play('fuego');
      else if (e.type === 'end') this.end(e.gano);
    }
    for (const fn of this.listeners) fn(events, run);
    const now = performance.now();
    if (now - this.ultimaVista > 100 || this.fase !== 'jugando') {
      this.ultimaVista = now;
      this.publish();
    }
    return events;
  }

  /** La guardia: tus tropas solas; el oro va directo a tu bolsa. Solo suena cuando revientan. */
  private stepGuard(run: Run, dt: number): RunEvent[] {
    if (this.fase !== 'arbol') return [];
    const events = stepRun(run, dt);
    if (events.some((e) => e.type === 'kill')) this.audio.play('pop');
    for (const fn of this.listeners) fn(events, run);
    if (run.oro > 0) {
      this.meta.oro += run.oro;
      run.oro = 0;
    }
    const now = performance.now();
    if (now - this.ultimaVista > 250) {
      this.ultimaVista = now;
      this.publish();
    }
    return events;
  }

  /** El jugador tocó (o arrastró) en el campo: el círculo se queda ahí. */
  tap(x: number, y: number): void {
    if (!this.run || this.fase !== 'jugando') return;
    moveCursor(this.run, x, y);
    if (!this.toco) {
      this.toco = true;
      this.publish();
    }
  }

  private end(gano: boolean): void {
    const run = this.run!;
    const antes = idleUnlocked(this.meta);
    const misionesAntes = missionsUnlocked(this.meta);
    const rankingAntes = rankingUnlocked(this.meta);
    const pvpAntes = pvpUnlocked(this.meta);
    this.premio = finishRun(this.meta, { oro: run.oro, reventados: run.reventados, gano, nivel: run.nivel.nivel, porTipo: run.porTipo, muroCaido: run.muro.caido, jefe: run.nivel.jefe?.kind ?? null });
    this.abrioInactivo = !antes && idleUnlocked(this.meta);
    this.abrioMisiones = !misionesAntes && missionsUnlocked(this.meta);
    this.abrioRanking = !rankingAntes && rankingUnlocked(this.meta);
    this.abrioPvp = !pvpAntes && pvpUnlocked(this.meta);
    if (!this.meta.vistos.includes('primera')) this.meta.vistos.push('primera');
    this.fase = 'fin';
    this.audio.play(gano ? 'fin' : 'pierde');
    this.save();
    this.publish();
  }

  /** Elige el nivel (de 1 al más alto abierto) y, si `jugar`, empieza la partida. */
  playLevel(nivel: number, jugar = true): void {
    chooseLevel(this.meta, nivel);
    this.save();
    this.publish();
    if (jugar) this.play();
  }

  /** Modo pruebas: abre el siguiente nivel sin jugarlo. */
  unlockNext(): void {
    this.meta.nivel++;
    this.meta.jugando = this.meta.nivel;
    this.save();
    this.publish();
  }

  openTree(): void {
    this.fase = 'arbol';
    this.publish();
    this.guard();
  }

  buy(id: TalentId): boolean {
    const ok = buyTalent(this.meta, id);
    this.audio.play(ok ? 'compra' : 'error');
    if (ok) {
      this.save();
      // La guardia toma lo comprado; si era la primera tropa, empieza.
      if (this.fase === 'arbol') {
        if (this.run?.guardia) updateGuardRun(this.run, stats(this.meta), this.oroGuardia());
        else if (this.hayTropas) this.guard();
      }
    }
    this.publish();
    return ok;
  }

  setSound(on: boolean): void {
    this.meta.ajustes.sonido = on;
    this.audio.enabled = on;
    this.save();
    this.publish();
  }

  setLanguage(idioma: 'es' | 'en'): void {
    this.meta.ajustes.idioma = idioma;
    locale.set(idioma);
    this.save();
    this.publish();
  }

  /** Borra todo: partida nueva como recién instalado (los ajustes se quedan). */
  reset(): void {
    const ajustes = this.meta.ajustes;
    clearRaw();
    this.meta = createMeta();
    this.meta.ajustes = ajustes;
    this.save();
    this.fase = 'arbol';
    this.publish();
    this.guard();
  }

  /** Cobra una misión (diaria o permanente) o el bono diario. Devuelve las gemas. */
  claim(id: string | 'bono'): number {
    const gemas = id === 'bono' ? claimBonus(this.meta) : claimMission(this.meta, id);
    this.audio.play(gemas > 0 ? 'gema' : 'error');
    if (gemas > 0) this.save();
    this.publish();
    return gemas;
  }

  /** Vuelve a publicar la vista (p. ej. cuando vuelve un intento del PvP con la ventana abierta). */
  refresh(): void {
    this.publish();
  }

  /** Un sonido suelto (la batalla del PvP los pide). */
  sonar(id: SoundId): void {
    this.audio.play(id);
  }

  /** PvP: pelea contra un rival de tu liga. La ventana anima el resultado. */
  pvpFight(rivalId: string): FightResult | null {
    const r = fight(this.meta, rivalId, Date.now(), Math.random());
    if (!r) {
      this.audio.play('error');
      return null;
    }
    this.save();
    this.publish();
    return r;
  }

  /** PvP: compra en la tienda (con medallas). */
  pvpBuy(id: ShopId): boolean {
    const ok = buyShop(this.meta, id, activeGoldPerMinute(this.meta));
    this.audio.play(ok ? 'compra' : 'error');
    if (ok) {
      this.save();
      this.publish();
    }
    return ok;
  }

  /** Ya se vio cómo te fue la semana pasada. */
  pvpAck(): void {
    this.meta.pvp.resultado = null;
    this.save();
    this.publish();
  }

  /** Modo pruebas del PvP: intentos llenos, cerrar la semana ya, medallas de regalo. */
  pvpRefill(): void {
    this.meta.pvp.intentos = INTENTOS_MAX;
    this.meta.pvp.desde = Date.now();
    this.save();
    this.publish();
  }

  pvpEndWeek(): void {
    if (!pvpUnlocked(this.meta)) return;
    syncPvp(this.meta, Date.now());
    endWeek(this.meta, Date.now());
    this.save();
    this.publish();
  }

  addMedals(n: number): void {
    this.meta.pvp.medallas += n;
    this.save();
    this.publish();
  }

  /** Modo pruebas: gemas de regalo y un día nuevo (otras diarias). */
  addGems(n: number): void {
    this.meta.gemas += n;
    this.save();
    this.publish();
  }

  newDay(): void {
    rollDaily(this.meta, Date.now(), 1 + Math.floor(Math.random() * 1e6));
    this.save();
    this.publish();
  }

  /** Modo pruebas: oro de regalo. */
  addGold(oro: number): void {
    this.meta.oro += oro;
    this.save();
    this.publish();
  }

  /**
   * Modo pruebas: avanza la partida como si hubieras jugado `segundos` (partidas, oro, compras en el
   * árbol, niveles). Devuelve un resumen.
   */
  simulatePlay(segundos: number): SimulatedPlay {
    const r = simulatePlay(this.meta, segundos);
    this.save();
    this.publish();
    // Con lo nuevo (nivel y tropas), la guardia vuelve a empezar.
    if (this.fase === 'arbol') this.guard();
    return r;
  }

  /** Modo pruebas: termina la partida ya. */
  endNow(): void {
    if (this.run && this.fase === 'jugando') {
      this.run.stats = { ...this.run.stats, duracion: this.run.t };
      this.step(0.0001);
    }
  }

  save(): void {
    this.meta.ultimaVez = Date.now();
    saveRaw(this.meta);
    // Con el ranking abierto, tu fila se manda cada que se guarda (solo si cambió).
    if (rankingUnlocked(this.meta)) {
      void this.ranking.start();
      this.ranking.submit(rankingEntry(this.meta));
    }
  }

  /** Tu nombre en el ranking. Devuelve true si cambió. */
  setName(nombre: string): boolean {
    const limpio = cleanName(nombre);
    if (!limpio || limpio === this.meta.nombre) return false;
    this.meta.nombre = limpio;
    this.save();
    this.publish();
    return true;
  }

  private publish(): void {
    const run = this.run;
    // Las diarias cambian a medianoche (y se eligen la primera vez que se abren); el PvP recarga
    // intentos y, si cambió la semana, la cierra.
    rollDaily(this.meta, Date.now());
    if (syncPvp(this.meta, Date.now())) saveRaw(this.meta);
    this.vista.set({
      fase: this.fase,
      restante: run ? Math.max(0, run.stats.duracion - run.t) : 0,
      duracion: run?.stats.duracion ?? stats(this.meta).duracion,
      oroPartida: run?.oro ?? 0,
      reventados: run?.reventados ?? 0,
      nivel: run && this.fase !== 'arbol' ? run.nivel.nivel : this.meta.jugando,
      total: run?.nivel.total ?? 0,
      gano: run?.gano ?? false,
      premio: this.premio,
      inactivo: this.pendiente,
      muro: run ? { ...run.muro } : null,
      jefe: run?.nivel.jefe
        ? (() => {
            const b = bossOf(run);
            return { kind: run.nivel.jefe.kind, vida: b?.vida ?? 0, max: run.nivel.jefe.vida, aturdido: (run.jefe?.aturdido ?? 0) > 0, furia: run.jefe?.furia ?? false };
          })()
        : null,
      nivelDeJefe: !!levelConfig(this.meta.jugando).jefe,
      zona: run && this.fase !== 'arbol' ? run.nivel.zona : levelConfig(this.meta.jugando).zona,

      ritmoInactivo: idleUnlocked(this.meta) ? { porMinuto: idleGoldPerMinute(this.meta), horas: stats(this.meta).inactivo.horas } : null,
      abrioInactivo: this.abrioInactivo && this.fase === 'fin',
      abrioMisiones: this.abrioMisiones && this.fase === 'fin',
      abrioRanking: this.abrioRanking && this.fase === 'fin',
      abrioPvp: this.abrioPvp && this.fase === 'fin',
      pvp: { abierto: pvpUnlocked(this.meta) },
      guardia: run?.guardia && this.fase === 'arbol' ? { porMinuto: this.ritmoGuardia } : null,
      ranking: { abierto: rankingUnlocked(this.meta), nombre: this.meta.nombre },
      misiones: { abiertas: missionsUnlocked(this.meta), listas: claimableCount(this.meta) },
      vivos: run?.enemies.length ?? 0,
      toco: this.toco,
      // Una copia: la interfaz solo se entera de un cambio si recibe un objeto nuevo.
      meta: { ...this.meta, talentos: { ...this.meta.talentos }, ajustes: { ...this.meta.ajustes }, cuenta: { ...this.meta.cuenta }, misiones: { ...this.meta.misiones }, pvp: { ...this.meta.pvp } },
      partida: this.partida,
    });
  }
}
