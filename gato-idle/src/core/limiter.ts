/**
 * Tope de acciones por segundo (ventana deslizante de 1 s). Evita que el multitouch o un
 * autoclicker rompan el balance: los toques de más simplemente no cuentan.
 */
export class RateLimiter {
  private readonly times: number[] = [];

  constructor(private readonly maxPerSecond: number) {}

  tryConsume(nowMs: number): boolean {
    while (this.times.length > 0 && nowMs - this.times[0]! >= 1000) this.times.shift();
    if (this.times.length >= this.maxPerSecond) return false;
    this.times.push(nowMs);
    return true;
  }
}
