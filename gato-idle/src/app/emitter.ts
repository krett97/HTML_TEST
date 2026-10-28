type Handler<T> = (payload: T) => void;

/** Eventos tipados mínimos. `on` devuelve la función para desuscribirse. */
export class Emitter<Events extends object> {
  private readonly handlers = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(name: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(name);
    if (!set) this.handlers.set(name, (set = new Set()));
    set.add(handler as Handler<never>);
    return () => set.delete(handler as Handler<never>);
  }

  emit<K extends keyof Events>(name: K, payload: Events[K]): void {
    for (const handler of this.handlers.get(name) ?? []) (handler as Handler<Events[K]>)(payload);
  }
}
