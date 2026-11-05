// Cómo se nombra a cada jefe en los textos: con su artículo ("al Pepino Gigante", "a la Aspiradora
// Industrial") y su "derrotado/derrotada", que vienen de jefes.<id> en los textos.
type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function bossText(tr: Translate, id: string): Record<string, string> {
  const k = (field: string) => tr(`jefes.${id}.${field}`);
  return { jefe: k('nombre'), al: k('al'), el: k('el'), El: k('El'), derrotado: k('derrotado') };
}
