// Medidor de daño por segundo: suma el daño real (manotazos, críticos, aliados) de los últimos
// segundos, en cubetas de 100 ms. Así sube cuando el jugador toca rápido y baja cuando se detiene.
import { ZERO, type Decimal } from '../core/num';

export type DamageSource = 'gato' | 'aliados';

interface Bucket {
  /** Inicio de la cubeta (ms). */
  t: number;
  gato: Decimal;
  aliados: Decimal;
  /** Manotazos del jugador (para saber si va "en racha"). */
  toques: number;
}

export interface DpsReading {
  gato: Decimal;
  aliados: Decimal;
  total: Decimal;
  /** Manotazos por segundo. */
  toques: number;
}

export class DpsMeter {
  private buckets: Bucket[] = [];

  constructor(
    private readonly windowMs = 3000,
    private readonly bucketMs = 100,
  ) {}

  add(now: number, amount: Decimal, source: DamageSource): void {
    const t = now - (now % this.bucketMs);
    let bucket = this.buckets.at(-1);
    if (!bucket || bucket.t !== t) {
      bucket = { t, gato: ZERO, aliados: ZERO, toques: 0 };
      this.buckets.push(bucket);
      this.prune(now);
    }
    bucket[source] = bucket[source].add(amount);
    if (source === 'gato') bucket.toques += 1;
  }

  /** Daño por segundo promedio en la ventana. */
  read(now: number): DpsReading {
    this.prune(now);
    let gato = ZERO;
    let aliados = ZERO;
    let toques = 0;
    for (const b of this.buckets) {
      gato = gato.add(b.gato);
      aliados = aliados.add(b.aliados);
      toques += b.toques;
    }
    const seconds = this.windowMs / 1000;
    return { gato: gato.div(seconds), aliados: aliados.div(seconds), total: gato.add(aliados).div(seconds), toques: toques / seconds };
  }

  /** Hay golpes en la ventana (hace falta seguir actualizando la pantalla). */
  get active(): boolean {
    return this.buckets.length > 0;
  }

  clear(): void {
    this.buckets = [];
  }

  private prune(now: number): void {
    const from = now - this.windowMs;
    while (this.buckets.length > 0 && this.buckets[0]!.t + this.bucketMs <= from) this.buckets.shift();
  }
}
