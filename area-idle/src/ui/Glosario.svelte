<script lang="ts">
  // El glosario: los tipos de daño (y quién hace cuál) y cada enemigo con su vida, su velocidad, si
  // ataca y a qué es débil o fuerte. Los enemigos que aún no salen se ven como silueta.
  import { JEFES, DESDE, zoneOf, levelConfig, DAMAGE_TYPES, DAMAGE_TYPES_EN_JUEGO, EFFECTIVENESS, ENEMIES, ENEMY_KINDS, type EnemyKind } from '../core/datos';
  import { DAMAGE_TYPE_OF } from '../core/run';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';

  let { cerrar }: { cerrar: () => void } = $props();
  const view = useJuego().view;

  /** Quién hace qué tipo de daño (con el ícono de su sección). */
  const QUIEN = [
    { id: 'jugador', icono: 'lluvia', tipo: DAMAGE_TYPE_OF.jugador },
    { id: 'arqueros', icono: 'arquero', tipo: DAMAGE_TYPE_OF.arquero },
    { id: 'mago', icono: 'mago', tipo: DAMAGE_TYPE_OF.mago },
  ] as const;
  /** Los comunes, agrupados por la zona donde salen; los jefes aparte. Cada uno con su dibujo. */
  const COMUNES = ENEMY_KINDS.filter((k) => !ENEMIES[k].jefe).sort((a, b) => DESDE[a] - DESDE[b]);
  const POR_ZONA = (['campo', 'batalla', 'pradera'] as const).map((z) => ({ zona: z, kinds: COMUNES.filter((k) => zoneOf(DESDE[k]) === z) }));
  const JEFES_KINDS = ENEMY_KINDS.filter((k) => ENEMIES[k].jefe).sort((a, b) => DESDE[a] - DESDE[b]);
  const IMAGEN: Record<EnemyKind, string> = { verde: 'slime_verde', azul: 'slime_azul', rojo: 'slime_rojo', rey: 'jefe_rey', goblin: 'goblin', lobo: 'lobo', orco: 'orco', orcoArquero: 'orcoArquero', loboBlanco: 'loboBlanco', arana: 'arana', esqueleto: 'esqueleto', loboNegro: 'loboNegro', bandido: 'bandido' };
  const MECANICAS: Partial<Record<EnemyKind, string[]>> = { rey: ['invoca', 'esquiva', 'aturdido', 'furia'], loboBlanco: ['aulla', 'embiste', 'hoz', 'furia'] };

  const visto = (kind: EnemyKind) => $view.meta.nivel >= DESDE[kind];
  const rapidez = (v: number) => (v < 7 ? 'lenta' : v < 12 ? 'normal' : 'rapida');
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('glosario.titulo')} data-testid="glosario">
  <header>
    <h2><Icon name="glosario" size={30} /> {$t('glosario.titulo')}</h2>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>

  <h3>{$t('glosario.tipos')}</h3>
  <div class="tipos">
    {#each DAMAGE_TYPES as tipo (tipo)}
      {@const hay = DAMAGE_TYPES_EN_JUEGO.includes(tipo)}
      <div class="tipo" class:pronto={!hay} data-testid="tipo-{tipo}">
        <Icon name="tipo_{tipo}" size={30} />
        <span>{$t(`tipos.${tipo}`)}</span>
        {#if !hay}<small>{$t('glosario.pronto')}</small>{/if}
      </div>
    {/each}
  </div>
  <div class="quien">
    {#each QUIEN as q (q.id)}
      <div class="fila-quien"><Icon name={q.icono} size={26} /><span>{$t(`glosario.quien.${q.id}`)}</span><span class="flecha">→</span><Icon name="tipo_{q.tipo}" size={24} /><span>{$t(`tipos.${q.tipo}`)}</span></div>
    {/each}
  </div>

  <h3>{$t('glosario.enemigos')}</h3>
  {#each POR_ZONA as grupo (grupo.zona)}
  <h4>{$t(`zonas.${grupo.zona}`)}</h4>
  {#each grupo.kinds as kind (kind)}
    {@const def = ENEMIES[kind]}
    {@const ok = visto(kind)}
    <article class="enemigo" class:oculto={!ok} data-testid="enemigo-{kind}">
      <img src={artUrl(IMAGEN[kind])} alt="" width="72" height="68" style="object-fit: contain" />
      <div class="datos">
        {#if ok}
          <strong>{$t(`enemigos.${kind}.nombre`)}</strong>
          <span class="texto">{$t(`enemigos.${kind}.texto`)}</span>
          <div class="stats">
            <span><Icon name="vida" size={20} /> <span class="cifra">{def.vida}</span></span>
            <span><Icon name="velocidad" size={20} /> {$t(`glosario.${rapidez(def.velocidad)}`)}</span>
            <span><Icon name="ataque" size={20} /> {def.ataque > 0 ? $t(def.marcha ? 'glosario.golpea' : 'glosario.ataca', { n: def.ataque }) : $t('glosario.noAtaca')}</span>
          </div>
          <div class="efectos">
            <span class="etiqueta">{$t('glosario.debil')}</span>
            {#each def.debil as tipo (tipo)}<span class="chip debil"><Icon name="tipo_{tipo}" size={20} />×{EFFECTIVENESS.debil}</span>{:else}<span class="nada">—</span>{/each}
          </div>
          <div class="efectos">
            <span class="etiqueta">{$t('glosario.fuerte')}</span>
            {#each def.fuerte as tipo (tipo)}<span class="chip fuerte"><Icon name="tipo_{tipo}" size={20} />×{EFFECTIVENESS.fuerte}</span>{:else}<span class="nada">—</span>{/each}
          </div>
        {:else}
          <strong>???</strong>
          <span class="texto">{$t('glosario.ocultoPista', { n: DESDE[kind] })}</span>
        {/if}
      </div>
    </article>
  {/each}
  {/each}

  <h3>{$t('glosario.jefes')}</h3>
  {#each JEFES_KINDS as kind (kind)}
    {@const def = ENEMIES[kind]}
    {@const ok = visto(kind)}
    <article class="enemigo jefe" class:oculto={!ok} data-testid="enemigo-{kind}">
      <img src={artUrl(IMAGEN[kind])} alt="" width="80" height="80" style="object-fit: contain" />
      <div class="datos">
        {#if ok}
          <strong>{$t(`enemigos.${kind}.nombre`)} <small class="muted">{$t('hud.nivel', { n: DESDE[kind] })}</small></strong>
          <span class="texto">{$t(`enemigos.${kind}.texto`)}</span>
          <div class="stats">
            <span><Icon name="vida" size={20} /> <span class="cifra">{levelConfig(DESDE[kind]).jefe?.vida ?? 0}</span></span>
            <span><Icon name="velocidad" size={20} /> {$t(JEFES[kind]?.mueve === 'embestida' ? 'glosario.embiste' : 'glosario.brinca')}</span>
            <span><Icon name="ataque" size={20} /> {$t('glosario.ataca', { n: JEFES[kind]?.golpe ?? 0 })}</span>
          </div>
          <ul class="mecanicas">
            {#each MECANICAS[kind] ?? [] as m (m)}<li>{$t(`glosario.mecanicas.${m}`)}</li>{/each}
          </ul>
          <div class="efectos">
            <span class="etiqueta">{$t('glosario.debil')}</span>
            {#each def.debil as tipo (tipo)}<span class="chip debil"><Icon name="tipo_{tipo}" size={20} />×{EFFECTIVENESS.debil}</span>{:else}<span class="nada">—</span>{/each}
          </div>
          <div class="efectos">
            <span class="etiqueta">{$t('glosario.fuerte')}</span>
            {#each def.fuerte as tipo (tipo)}<span class="chip fuerte"><Icon name="tipo_{tipo}" size={20} />×{EFFECTIVENESS.fuerte}</span>{:else}<span class="nada">—</span>{/each}
          </div>
        {:else}
          <strong>???</strong>
          <span class="texto">{$t('glosario.ocultoPista', { n: DESDE[kind] })}</span>
        {/if}
      </div>
    </article>
  {/each}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(18, 22, 18, 0.6);
  }
  .sheet {
    position: fixed;
    z-index: 41;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 10px;
    width: min(400px, calc(100vw - 20px));
    max-height: calc(100dvh - 24px);
    overflow: auto;
    padding: 14px;
    border: var(--borde);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--sombra);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  h4 {
    margin: 2px 0 0;
    color: #3a8f53;
    font-size: 14px;
  }
  h3 {
    margin: 4px 0 0;
    font-size: 16px;
    color: var(--muted);
  }
  .redondo {
    width: 38px;
    height: 38px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel-2);
  }
  .tipos {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .tipo {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: #fff;
    font-size: 14px;
  }
  .tipo.pronto {
    opacity: 0.5;
  }
  .tipo small {
    position: absolute;
    top: -9px;
    right: 4px;
    padding: 0 5px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--panel-2);
    font-size: 10px;
  }
  .quien {
    display: grid;
    gap: 4px;
    font-size: 14px;
  }
  .fila-quien {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .flecha {
    color: var(--muted);
  }
  .enemigo {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    padding: 10px;
    border: 2px solid var(--line);
    border-radius: 16px;
    background: #fff;
  }
  .enemigo.oculto img {
    filter: brightness(0);
    opacity: 0.35;
  }
  .datos {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .texto {
    color: var(--muted);
    font-size: 13px;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 14px;
  }
  .stats > span,
  .efectos {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .efectos {
    flex-wrap: wrap;
    font-size: 13px;
  }
  .etiqueta {
    min-width: 92px;
    color: var(--muted);
  }
  .enemigo.jefe {
    background: #fff3e2;
  }
  .mecanicas {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 0 6px 0 2px;
    border: 2px solid var(--line);
    border-radius: 999px;
    font-weight: 700;
  }
  .chip.debil {
    background: #ffd9cc;
  }
  .chip.fuerte {
    background: #e3e6ec;
  }
</style>
