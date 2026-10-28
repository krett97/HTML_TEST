// Guardado en dos ranuras alternas: si la app muere a medio escribir una, la otra sigue intacta.
// Al cargar se usa la más reciente que se pueda leer.
import { deserialize, serialize } from '../core/save';
import type { GameState } from '../core/state';
import type { KeyValueStore } from '../services/storage';

const SLOT_KEYS = ['gato-idle.save.a', 'gato-idle.save.b'] as const;

export class SaveSlots {
  private next = 0;

  constructor(private readonly store: KeyValueStore) {}

  async load(now: number): Promise<{ state: GameState; savedAt: number } | null> {
    let best: { state: GameState; savedAt: number; slot: number } | null = null;

    for (let slot = 0; slot < SLOT_KEYS.length; slot++) {
      const text = await this.store.get(SLOT_KEYS[slot]!);
      if (text === null) continue;
      const result = deserialize(text, now);
      if (!result.ok) {
        console.warn(`[guardado] ranura ${slot} ilegible: ${result.error}`);
        continue;
      }
      if (!best || result.savedAt > best.savedAt) best = { state: result.state, savedAt: result.savedAt, slot };
    }

    if (!best) return null;
    // El siguiente guardado va a la otra ranura, para no pisar la única copia buena.
    this.next = (best.slot + 1) % SLOT_KEYS.length;
    return { state: best.state, savedAt: best.savedAt };
  }

  /** Devuelve el texto escrito (sirve para exportar). */
  async write(state: GameState, now: number): Promise<string> {
    const text = serialize(state, now);
    await this.store.set(SLOT_KEYS[this.next]!, text);
    this.next = (this.next + 1) % SLOT_KEYS.length;
    return text;
  }

  async clear(): Promise<void> {
    for (const key of SLOT_KEYS) await this.store.remove(key);
    this.next = 0;
  }
}
