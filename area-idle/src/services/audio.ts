// Sonidos sintetizados con Web Audio (sin archivos), como en el juego del gato: cada sonido es una
// receta de osciladores y ruido. Con cientos de slimes reventando, cada sonido tiene un tope de
// veces por segundo para no saturar.
export type SoundId = 'pop' | 'popGrande' | 'disparo' | 'magia' | 'fuego' | 'arco' | 'resortera' | 'golpeMuro' | 'derrumbe' | 'compra' | 'fin' | 'pierde' | 'aparece' | 'error';

const MIN_GAP: Record<SoundId, number> = { pop: 0.035, popGrande: 0.06, disparo: 0.05, magia: 0.08, fuego: 0.25, arco: 0.07, resortera: 0.12, golpeMuro: 0.08, derrumbe: 0, pierde: 0, aparece: 0.09, compra: 0, fin: 0, error: 0 };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly last = new Map<SoundId, number>();
  enabled = true;

  constructor() {
    // Los navegadores solo dejan sonar después de un toque.
    const unlock = () => {
      const ctx = this.context();
      if (ctx && ctx.state !== 'running') void ctx.resume();
    };
    for (const type of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(type, unlock, { capture: true, passive: true });
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    const comp = this.ctx.createDynamicsCompressor();
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.55;
    this.out.connect(comp).connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return this.ctx;
  }

  private tone(type: OscillatorType, f0: number, f1: number, at: number, dur: number, vol: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.out!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(filter: BiquadFilterType, f: number, at: number, dur: number, vol: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const biq = ctx.createBiquadFilter();
    biq.type = filter;
    biq.frequency.value = f;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(biq).connect(gain).connect(this.out!);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }

  play(id: SoundId): void {
    if (!this.enabled || document.visibilityState === 'hidden') return;
    const ctx = this.context();
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - (this.last.get(id) ?? -1) < MIN_GAP[id]) return;
    this.last.set(id, now);
    const p = 0.85 + Math.random() * 0.3;
    switch (id) {
      case 'pop':
        this.tone('sine', 700 * p, 180 * p, 0, 0.07, 0.22);
        this.noise('bandpass', 2400 * p, 0, 0.03, 0.12);
        break;
      case 'popGrande':
        this.tone('sine', 420 * p, 90 * p, 0, 0.12, 0.3);
        this.noise('lowpass', 1200, 0, 0.08, 0.2);
        break;
      case 'disparo':
        // La lluvia de flechas se clava: varios "tuc" muy juntos.
        for (let i = 0; i < 4; i++) this.noise('bandpass', 1500 + i * 300, i * 0.018, 0.035, 0.09);
        this.tone('triangle', 160, 60, 0, 0.08, 0.1);
        break;
      case 'magia':
        // La bola de fuego revienta: golpe grave con chisporroteo.
        this.tone('sine', 220 * p, 70, 0, 0.2, 0.22);
        this.noise('lowpass', 1800, 0, 0.16, 0.16);
        this.tone('sine', 1350 * p, 2600 * p, 0.02, 0.12, 0.04);
        break;
      case 'arco':
        // La cuerda del arco: un "tuang" corto.
        this.tone('triangle', 320 * p, 220 * p, 0, 0.08, 0.1);
        this.noise('highpass', 3000, 0, 0.04, 0.05);
        break;
      case 'fuego':
        this.noise('bandpass', 900, 0, 0.3, 0.08);
        break;
      case 'compra':
        this.tone('square', 660, 660, 0, 0.06, 0.08);
        this.tone('square', 990, 990, 0.06, 0.1, 0.08);
        break;
      case 'fin':
        for (const [i, f] of [523, 659, 784, 1046].entries()) this.tone('triangle', f, f, i * 0.09, 0.16, 0.14);
        break;
      case 'resortera':
        // "Fiu": la liga de la resortera.
        this.tone('sine', 500 * p, 1400 * p, 0, 0.09, 0.06);
        break;
      case 'golpeMuro':
        this.tone('sine', 140 * p, 60, 0, 0.12, 0.2);
        this.noise('lowpass', 900, 0, 0.08, 0.14);
        break;
      case 'derrumbe':
        this.noise('lowpass', 500, 0, 0.9, 0.35);
        this.tone('sine', 90, 40, 0, 0.8, 0.3);
        break;
      case 'pierde':
        // Tres notas que bajan: "uy".
        for (const [i, f] of [392, 330, 262].entries()) this.tone('triangle', f, f * 0.97, i * 0.14, 0.2, 0.13);
        break;
      case 'aparece':
        // Un brillito muy bajito (salen muchos).
        this.tone('sine', 1800 * p, 2400 * p, 0, 0.05, 0.025);
        break;
      case 'error':
        this.tone('square', 180, 140, 0, 0.12, 0.06);
        break;
    }
  }
}
