// Cómo se nombra a cada jefe en los textos: con su artículo ("al Pepino Gigante", "a la Aspiradora
// Industrial") y su "derrotado/derrotada", que vienen de jefes.<id> en los textos. Los guardianes de
// cuarto ("mini:cocina") se nombran con el cuarto: jefes.mini.* con {cuarto} de cuartos.<cuarto>.
type Translate = (key: string, vars?: Record<string, string | number>) => string;

export const MINI_PREFIX = 'mini:';

export function bossText(tr: Translate, id: string): Record<string, string> {
  if (id.startsWith(MINI_PREFIX)) {
    const cuarto = tr(`cuartos.${id.slice(MINI_PREFIX.length)}`);
    const k = (field: string) => tr(`jefes.mini.${field}`, { cuarto });
    return { jefe: k('nombre'), al: k('al'), el: k('el'), El: k('El'), derrotado: k('derrotado'), cuarto };
  }
  const k = (field: string) => tr(`jefes.${id}.${field}`);
  return { jefe: k('nombre'), al: k('al'), el: k('el'), El: k('El'), derrotado: k('derrotado') };
}
