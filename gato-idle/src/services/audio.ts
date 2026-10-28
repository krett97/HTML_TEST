// Efectos de sonido sintetizados con Web Audio: no hay archivos de audio todavía, así que cada
// sonido es una "receta" de osciladores y ruido filtrado. Cada objeto elige su receta de golpe y
// de rotura, y un tono, en objects.json. Cuando haya grabaciones reales, se cambia la receta por
// el archivo y los datos siguen igual.
import type { SoundId } from '../core/sounds';

interface Voice {
  ctx: BaseAudioContext;
  out: AudioNode;
  /** Momento de inicio, en segundos del contexto. */
  t: number;
  /** Multiplica todas las frecuencias. */
  tono: number;
  /** Multiplica todos los volúmenes. */
  vol: number;
}

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** Un segundo de ruido blanco, compartido por todos los sonidos del contexto. */
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** Ataque corto y caída exponencial. */
function envelope(ctx: BaseAudioContext, t: number, attack: number, decay: number, peak: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return gain;
}

interface ToneOptions {
  type?: OscillatorType;
  /** Frecuencia inicial y, si se da, final (Hz, antes de aplicar el tono). */
  f: number;
  f2?: number;
  /** Retraso desde el inicio del sonido (s). */
  at?: number;
  dur: number;
  vol: number;
  attack?: number;
  /** Vibrato: frecuencia (Hz) y profundidad (Hz). */
  vibrato?: [number, number];
}

function tone(v: Voice, o: ToneOptions): void {
  const { ctx } = v;
  const t = v.t + (o.at ?? 0);
  const attack = o.attack ?? 0.003;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f * v.tono, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2 * v.tono, t + attack + o.dur);
  const stop = t + attack + o.dur + 0.02;
  if (o.vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.vibrato[0];
    depth.gain.value = o.vibrato[1] * v.tono;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(stop);
  }
  osc.connect(envelope(ctx, t, attack, o.dur, o.vol * v.vol)).connect(v.out);
  osc.start(t);
  osc.stop(stop);
}

interface NoiseOptions {
  filter: BiquadFilterType;
  f: number;
  f2?: number;
  q?: number;
  at?: number;
  dur: number;
  vol: number;
  attack?: number;
  /** Trémolo (Hz): da textura de tela que se rasga. */
  tremolo?: number;
}

function noise(v: Voice, o: NoiseOptions): void {
  const { ctx } = v;
  const t = v.t + (o.at ?? 0);
  const attack = o.attack ?? 0.002;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = o.filter;
  filter.Q.value = o.q ?? 1;
  filter.frequency.setValueAtTime(o.f * v.tono, t);
  if (o.f2) filter.frequency.exponentialRampToValueAtTime(o.f2 * v.tono, t + attack + o.dur);
  let node: AudioNode = src.connect(filter).connect(envelope(ctx, t, attack, o.dur, o.vol * v.vol));
  const stop = t + attack + o.dur + 0.02;
  if (o.tremolo) {
    const trem = ctx.createGain();
    trem.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.tremolo;
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(trem.gain);
    lfo.start(t);
    lfo.stop(stop);
    node = node.connect(trem);
  }
  node.connect(v.out);
  src.start(t, Math.random() * 0.5);
  src.stop(stop);
}

/** Pedacitos que tintinean al caer, cada uno a su tiempo. */
function shards(v: Voice, count: number, fMin: number, fMax: number, vol: number, type: OscillatorType = 'sine'): void {
  for (let i = 0; i < count; i++) {
    tone(v, { type, f: rnd(fMin, fMax), at: rnd(0.01, 0.28), dur: rnd(0.08, 0.22), vol });
  }
}

const RECIPES: Record<SoundId, (v: Voice) => void> = {
  // ---- Golpes ----
  tintineo: (v) => {
    tone(v, { f: 2600, dur: 0.18, vol: 0.22 });
    tone(v, { f: 3900, dur: 0.1, vol: 0.1 });
    noise(v, { filter: 'highpass', f: 6000, dur: 0.02, vol: 0.12 });
  },
  ceramica: (v) => {
    tone(v, { type: 'triangle', f: 900, f2: 820, dur: 0.09, vol: 0.32 });
    noise(v, { filter: 'bandpass', f: 1800, q: 2, dur: 0.04, vol: 0.2 });
  },
  plastico: (v) => {
    tone(v, { type: 'square', f: 420, f2: 300, dur: 0.05, vol: 0.14 });
    noise(v, { filter: 'bandpass', f: 1500, q: 3, dur: 0.03, vol: 0.38 });
  },
  rasguno: (v) => {
    noise(v, { filter: 'bandpass', f: 3200, f2: 1700, q: 2.5, dur: 0.1, vol: 0.7, attack: 0.01 });
    noise(v, { filter: 'bandpass', f: 2800, f2: 1500, q: 2.5, at: 0.05, dur: 0.08, vol: 0.5, attack: 0.008 });
  },
  rechinido: (v) => {
    tone(v, { f: 700, f2: 1400, dur: 0.09, vol: 0.14 });
    noise(v, { filter: 'bandpass', f: 2200, q: 4, dur: 0.05, vol: 0.12 });
  },
  madera: (v) => {
    tone(v, { f: 230, f2: 160, dur: 0.13, vol: 0.5 });
    noise(v, { filter: 'bandpass', f: 1200, q: 1.5, dur: 0.025, vol: 0.25 });
  },
  metal: (v) => {
    tone(v, { f: 350, dur: 0.5, vol: 0.2 });
    tone(v, { f: 350 * 2.76, dur: 0.35, vol: 0.1 });
    tone(v, { f: 350 * 5.4, dur: 0.2, vol: 0.06 });
    noise(v, { filter: 'highpass', f: 3000, dur: 0.02, vol: 0.15 });
  },

  // ---- Roturas ----
  cristal: (v) => {
    noise(v, { filter: 'lowpass', f: 900, dur: 0.08, vol: 0.4 });
    noise(v, { filter: 'bandpass', f: 5000, q: 1, dur: 0.35, vol: 0.35 });
    shards(v, 7, 2200, 5200, 0.1);
  },
  'ceramica-rota': (v) => {
    noise(v, { filter: 'lowpass', f: 450, dur: 0.1, vol: 0.45 });
    noise(v, { filter: 'bandpass', f: 2500, q: 0.8, dur: 0.3, vol: 0.4 });
    shards(v, 5, 1200, 2600, 0.12, 'triangle');
  },
  'plastico-roto': (v) => {
    noise(v, { filter: 'lowpass', f: 600, dur: 0.08, vol: 0.4 });
    noise(v, { filter: 'bandpass', f: 1800, q: 1.2, dur: 0.18, vol: 0.35 });
    for (let i = 0; i < 3; i++) tone(v, { type: 'square', f: rnd(500, 900), at: rnd(0.02, 0.2), dur: 0.03, vol: 0.06 });
  },
  chispazo: (v) => {
    tone(v, { type: 'sawtooth', f: 1400, f2: 90, dur: 0.28, vol: 0.14 });
    tone(v, { type: 'square', f: 60, dur: 0.22, vol: 0.08 });
    noise(v, { filter: 'highpass', f: 4000, dur: 0.12, vol: 0.18, tremolo: 40 });
    noise(v, { filter: 'lowpass', f: 700, dur: 0.1, vol: 0.35 });
  },
  desgarro: (v) => {
    noise(v, { filter: 'bandpass', f: 2600, f2: 700, q: 1.5, dur: 0.45, vol: 0.5, attack: 0.02, tremolo: 32 });
    noise(v, { filter: 'lowpass', f: 300, at: 0.3, dur: 0.15, vol: 0.4 });
  },
  resorte: (v) => {
    tone(v, { f: 180, dur: 0.55, vol: 0.32, vibrato: [9, 45] });
    noise(v, { filter: 'bandpass', f: 1800, f2: 600, q: 1.5, dur: 0.3, vol: 0.35, tremolo: 30 });
  },
  tele: (v) => {
    RECIPES.chispazo(v);
    tone(v, { f: 70, f2: 40, dur: 0.4, vol: 0.5 });
    RECIPES.cristal({ ...v, t: v.t + 0.08, vol: v.vol * 0.7 });
  },
  'madera-rota': (v) => {
    noise(v, { filter: 'highpass', f: 2500, dur: 0.05, vol: 0.4 });
    noise(v, { filter: 'lowpass', f: 1200, dur: 0.28, vol: 0.4 });
    for (let i = 0; i < 3; i++) tone(v, { f: rnd(150, 300), at: rnd(0.05, 0.3), dur: 0.1, vol: 0.3 });
  },
  'metal-cae': (v) => {
    tone(v, { f: 75, f2: 45, dur: 0.45, vol: 0.6 });
    noise(v, { filter: 'lowpass', f: 600, dur: 0.35, vol: 0.4 });
    RECIPES.metal(v);
    RECIPES.metal({ ...v, t: v.t + 0.12, tono: v.tono * 0.8, vol: v.vol * 0.7 });
  },
  ding: (v) => {
    tone(v, { f: 1760, dur: 0.8, vol: 0.22 });
    tone(v, { f: 3520, dur: 0.4, vol: 0.06 });
    RECIPES['metal-cae']({ ...v, t: v.t + 0.25, vol: v.vol * 0.6 });
  },
  motor: (v) => {
    tone(v, { type: 'sawtooth', f: 90, f2: 220, dur: 0.35, vol: 0.12 });
    noise(v, { filter: 'lowpass', f: 500, dur: 0.35, vol: 0.15, tremolo: 25 });
    RECIPES.cristal({ ...v, t: v.t + 0.3 });
  },

  // ---- Aliados ----
  miau: (v) => {
    tone(v, { type: 'triangle', f: 700, f2: 1050, dur: 0.12, vol: 0.12, attack: 0.03 });
    tone(v, { type: 'triangle', f: 1050, f2: 650, at: 0.14, dur: 0.18, vol: 0.12, vibrato: [7, 25] });
  },
  guau: (v) => {
    for (const at of [0, 0.16]) {
      noise(v, { filter: 'bandpass', f: 650, q: 3, at, dur: 0.11, vol: 0.6, attack: 0.008 });
      tone(v, { type: 'sawtooth', f: 320, f2: 180, at, dur: 0.1, vol: 0.15 });
    }
  },
  pio: (v) => {
    tone(v, { f: 2000, f2: 3300, dur: 0.07, vol: 0.13 });
    tone(v, { f: 2200, f2: 3600, at: 0.09, dur: 0.06, vol: 0.11 });
  },
  chillido: (v) => {
    tone(v, { type: 'square', f: 1300, f2: 900, dur: 0.1, vol: 0.1, vibrato: [30, 80] });
    noise(v, { filter: 'bandpass', f: 1600, q: 3, dur: 0.08, vol: 0.3 });
  },

  chirrido: (v) => {
    for (const at of [0, 0.07, 0.14]) tone(v, { f: 3200, f2: 4200, at, dur: 0.04, vol: 0.1 });
  },
  graznido: (v) => {
    for (const at of [0, 0.22]) {
      tone(v, { type: 'sawtooth', f: 520, f2: 380, at, dur: 0.16, vol: 0.12 });
      noise(v, { filter: 'bandpass', f: 1400, q: 2, at, dur: 0.15, vol: 0.35, tremolo: 55 });
    }
  },
  balido: (v) => {
    tone(v, { type: 'sawtooth', f: 330, f2: 300, dur: 0.45, vol: 0.12, attack: 0.03, vibrato: [11, 30] });
    noise(v, { filter: 'bandpass', f: 1100, q: 3, dur: 0.4, vol: 0.2, tremolo: 11 });
  },

  // ---- Interfaz ----
  compra: (v) => {
    tone(v, { type: 'square', f: 988, dur: 0.06, vol: 0.08 });
    tone(v, { type: 'square', f: 1319, at: 0.07, dur: 0.22, vol: 0.08 });
  },
  herramienta: (v) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(v, { type: 'square', f, at: i * 0.08, dur: 0.16, vol: 0.07 }));
  },
  // Zarpazo crítico: tajo metálico + "¡ting!" de acero.
  critico: (v) => {
    noise(v, { filter: 'highpass', f: 2500, f2: 6000, dur: 0.12, vol: 0.6, attack: 0.004 });
    tone(v, { type: 'square', f: 1760, f2: 2349, at: 0.02, dur: 0.07, vol: 0.06 });
    tone(v, { f: 3520, at: 0.05, dur: 0.35, vol: 0.08, vibrato: [9, 30] });
  },
  descubrimiento: (v) => {
    [659, 784, 988, 1319].forEach((f, i) => tone(v, { type: 'triangle', f, at: i * 0.07, dur: 0.25, vol: 0.12 }));
    tone(v, { f: 2637, at: 0.3, dur: 0.5, vol: 0.06, vibrato: [6, 20] });
  },
  'objeto-nuevo': (v) => {
    tone(v, { f: 400, f2: 900, dur: 0.09, vol: 0.2 });
    RECIPES.compra({ ...v, t: v.t + 0.06 });
  },
};

/** Dibuja un sonido en cualquier contexto (también en uno sin bocinas, para pruebas). */
export function renderSound(ctx: BaseAudioContext, out: AudioNode, id: SoundId, tono = 1, vol = 1, t = 0): void {
  RECIPES[id]({ ctx, out, t, tono, vol });
}

export interface PlayOptions {
  tono?: number;
  volumen?: number;
  /** No repetir el mismo sonido más seguido que esto (ms): con 15 toques por segundo se satura. */
  minGapMs?: number;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly lastPlayed = new Map<SoundId, number>();
  /** Ajuste "Sonido". */
  enabled = true;
  /** Cuántos sonidos se han tocado (para pruebas). */
  played = 0;

  constructor() {
    // Los navegadores solo dejan sonar después de un toque: el primero desbloquea el audio.
    const unlock = () => {
      const ctx = this.context();
      if (ctx && ctx.state !== 'running') void ctx.resume();
    };
    for (const type of ['pointerdown', 'touchend', 'keydown']) {
      document.addEventListener(type, unlock, { capture: true, passive: true });
    }
  }

  get state(): AudioContextState | 'sin-audio' {
    return this.ctx?.state ?? 'sin-audio';
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    // Un compresor evita que varios sonidos juntos distorsionen.
    const compressor = this.ctx.createDynamicsCompressor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(compressor).connect(this.ctx.destination);
    return this.ctx;
  }

  play(id: SoundId, options: PlayOptions = {}): void {
    if (!this.enabled || document.visibilityState === 'hidden') return;
    const ctx = this.context();
    if (!ctx || ctx.state !== 'running' || !this.master) return;
    const now = performance.now();
    if (options.minGapMs && now - (this.lastPlayed.get(id) ?? -Infinity) < options.minGapMs) return;
    this.lastPlayed.set(id, now);
    // Una pequeña variación de tono para que no suene siempre idéntico.
    const tono = (options.tono ?? 1) * rnd(0.95, 1.05);
    renderSound(ctx, this.master, id, tono, options.volumen ?? 1, ctx.currentTime + 0.005);
    this.played += 1;
  }
}
