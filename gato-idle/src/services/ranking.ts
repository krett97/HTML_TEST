// Ranking compartido. En la versión que se comparte por Claude usa la base de datos de la página
// (capacidad `db`, con `user` para saber quién juega): cada jugador escribe solo su fila
// `ranking/<su id>` y todos leen la tabla. Fuera de Claude (el APK, el navegador) no hay dónde
// guardarlo todavía: la ventana muestra solo tu nivel. Lo que llega de otros jugadores no es de
// confianza: se limpia antes de mostrarlo.
import { writable, type Readable } from 'svelte/store';
import { cleanName } from '../core/ranking';

export interface RankingRow {
  id: string;
  nombre: string;
  nivel: number;
  casa: string;
  objeto: string;
  tuyo: boolean;
}

/** cargando: esperando la tabla · listo · soloLectura: se ve la tabla pero no se puede escribir · sinConexion: no hay ranking en línea. */
export type RankingStatus = 'cargando' | 'listo' | 'soloLectura' | 'sinConexion';

export interface RankingSubmission {
  nombre: string;
  nivel: number;
  casa: string;
  objeto: string;
}

/** Cuántos se muestran (los de más nivel). */
const TOP = 100;
/** Si la base de datos no contesta en este tiempo, se avisa. */
const LOAD_TIMEOUT_MS = 10_000;

// Lo mínimo de `window.claude` que se usa (ver los tipos de la plataforma).
interface DbDoc {
  id: string;
  data(): Record<string, unknown> | undefined;
}
interface DbQuery {
  orderBy(field: string, dir?: 'asc' | 'desc'): DbQuery;
  limit(n: number): DbQuery;
  onSnapshot(next: (snap: { docs: DbDoc[]; metadata: { fromCache: boolean } }) => void, error?: (e: unknown) => void): () => void;
}
interface Db {
  collection(path: string): DbQuery;
  doc(path: string): { set(data: Record<string, unknown>): Promise<void> };
}
interface UserCap {
  id(): Promise<string | null>;
}
interface ClaudeHost {
  use(name: string): Promise<unknown>;
}

export class RankingService {
  private readonly rowsStore = writable<RankingRow[]>([]);
  private readonly statusStore = writable<RankingStatus>('cargando');
  readonly rows: Readable<RankingRow[]> = this.rowsStore;
  readonly status: Readable<RankingStatus> = this.statusStore;
  private db: Db | null = null;
  private uid: string | null = null;
  private started = false;
  private readOnly = false;
  /** Lo último que se mandó, para no reescribir lo mismo. */
  private sent = '';
  private pending: RankingSubmission | null = null;
  private writing = false;

  constructor(private readonly validHomes: string[], private readonly validObjects: string[]) {}

  /** Se conecta (una sola vez) y empieza a escuchar la tabla. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    const host = (globalThis as { claude?: ClaudeHost }).claude;
    if (!host?.use) {
      this.statusStore.set('sinConexion');
      return;
    }
    const [db, user] = (await Promise.all([host.use('db'), host.use('user')])) as [Db | null, UserCap | null];
    this.uid = user ? await user.id() : null;
    if (!db || !this.uid) {
      this.statusStore.set('sinConexion');
      return;
    }
    this.db = db;
    const timer = setTimeout(() => this.statusStore.set('sinConexion'), LOAD_TIMEOUT_MS);
    db.collection('ranking')
      .orderBy('nivel', 'desc')
      .limit(TOP)
      .onSnapshot(
        (snap) => {
          if (!snap.metadata.fromCache) clearTimeout(timer);
          this.rowsStore.set(snap.docs.map((d) => this.row(d)).filter((r): r is RankingRow => r !== null));
          this.statusStore.set(this.readOnly ? 'soloLectura' : 'listo');
        },
        () => {
          clearTimeout(timer);
          this.statusStore.set('sinConexion');
        },
      );
    if (this.pending) void this.flush();
  }

  /** Manda tu fila (solo si cambió). Se puede llamar antes de conectar: se manda al conectar. */
  submit(entry: RankingSubmission): void {
    this.pending = entry;
    void this.flush();
  }

  private async flush(): Promise<void> {
    if (!this.db || !this.uid || this.writing || this.readOnly || !this.pending) return;
    const entry = this.pending;
    const key = JSON.stringify(entry);
    if (key === this.sent) return;
    this.writing = true;
    try {
      await this.db.doc(`ranking/${this.uid}`).set({ ...entry, actualizado: Date.now() });
      this.sent = key;
    } catch {
      // Quien solo puede ver la página no puede escribir: ve la tabla sin su fila.
      this.readOnly = true;
      this.statusStore.set('soloLectura');
    } finally {
      this.writing = false;
    }
    if (this.pending !== entry) void this.flush();
  }

  /** Una fila del ranking compartido, ya revisada (los datos de otros no son de confianza). */
  private row(doc: DbDoc): RankingRow | null {
    const data = doc.data();
    if (!data) return null;
    const nivel = Math.floor(Number(data.nivel));
    if (!(nivel >= 1 && nivel <= this.validObjects.length)) return null;
    const casa = typeof data.casa === 'string' && this.validHomes.includes(data.casa) ? data.casa : this.validHomes[0]!;
    const objeto = typeof data.objeto === 'string' && this.validObjects.includes(data.objeto) ? data.objeto : this.validObjects[nivel - 1]!;
    return { id: doc.id, nombre: cleanName(data.nombre), nivel, casa, objeto, tuyo: doc.id === this.uid };
  }
}
