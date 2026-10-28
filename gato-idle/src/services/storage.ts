// Almacenamiento clave-valor. En Android usa Preferences (nativo); en web, localStorage.
import { Preferences } from '@capacitor/preferences';
import { isNative } from './platform';

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** false si el navegador no deja guardar (modo privado, iframe sin permisos). */
  readonly persistent: boolean;
}

class NativeStore implements KeyValueStore {
  readonly persistent = true;
  async get(key: string) {
    return (await Preferences.get({ key })).value;
  }
  async set(key: string, value: string) {
    await Preferences.set({ key, value });
  }
  async remove(key: string) {
    await Preferences.remove({ key });
  }
}

/** localStorage, con respaldo en memoria si el navegador lo bloquea. */
class WebStore implements KeyValueStore {
  private readonly memory = new Map<string, string>();
  readonly persistent: boolean;

  constructor() {
    this.persistent = WebStore.probe();
  }

  private static probe(): boolean {
    try {
      const key = '__prueba__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  // Las escrituras son síncronas dentro de la promesa: así un guardado al cerrar la pestaña
  // termina aunque nadie espere el resultado.
  async get(key: string) {
    if (!this.persistent) return this.memory.get(key) ?? null;
    try {
      return localStorage.getItem(key);
    } catch {
      return this.memory.get(key) ?? null;
    }
  }
  async set(key: string, value: string) {
    this.memory.set(key, value);
    if (!this.persistent) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Sin espacio o bloqueado: queda en memoria hasta el siguiente intento.
    }
  }
  async remove(key: string) {
    this.memory.delete(key);
    if (!this.persistent) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Nada que hacer.
    }
  }
}

export function createStore(): KeyValueStore {
  return isNative ? new NativeStore() : new WebStore();
}
