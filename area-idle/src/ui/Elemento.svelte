<script lang="ts">
  // El elemento de tu círculo (desde el nivel 45): los seis tipos de daño, a quién le duele más cada uno y a
  // quién menos (de los enemigos que ya viste). Cada cambio pide ver un anuncio completo.
  import { DAMAGE_TYPES, DESDE, ENEMIES, ENEMY_KINDS, type DamageType } from '../core/datos';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import { IMAGEN } from './enemigosImg';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;

  const meta = $derived($view.meta);
  /** Los enemigos (no jefes ni crías) que ya viste, para no adelantar los que faltan. */
  const vistos = $derived(ENEMY_KINDS.filter((k) => !ENEMIES[k].jefe && !ENEMIES[k].cria && meta.nivel >= DESDE[k]));
  const debiles = (tipo: DamageType) => vistos.filter((k) => ENEMIES[k].debil.includes(tipo));
  const fuertes = (tipo: DamageType) => vistos.filter((k) => ENEMIES[k].fuerte.includes(tipo));
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('elemento.titulo')} data-testid="elemento">
  <header>
    <h2><Icon name="tipo_{meta.elemento}" size={30} /> {$t('elemento.titulo')}</h2>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>
  <p class="muted">{$t('elemento.explica')}</p>
  <ul>
    {#each DAMAGE_TYPES as tipo (tipo)}
      {@const actual = meta.elemento === tipo}
      <li class:actual>
        <Icon name="tipo_{tipo}" size={34} />
        <div class="info">
          <strong>{$t(`tipos.${tipo}`)}</strong>
          <span class="quienes">
            {#each debiles(tipo) as k (k)}<img src={artUrl(IMAGEN[k])} alt="" width="22" height="22" class="debil" title={$t(`enemigos.${k}.nombre`)} />{/each}
            {#each fuertes(tipo) as k (k)}<img src={artUrl(IMAGEN[k])} alt="" width="22" height="22" class="fuerte" title={$t(`enemigos.${k}.nombre`)} />{/each}
            {#if !debiles(tipo).length && !fuertes(tipo).length}<small class="muted">{$t('elemento.nadie')}</small>{/if}
          </span>
        </div>
        {#if actual}
          <span class="es" data-testid="elemento-actual">{$t('elemento.actual')}</span>
        {:else}
          <button type="button" class="btn btn--accent cambiar" disabled={$view.anuncio.viendo} onclick={() => juego.changeElement(tipo)} data-testid="elemento-{tipo}">
            <Icon name="anuncio" size={22} />{$t('elemento.cambiar')}
          </button>
        {/if}
      </li>
    {/each}
  </ul>
  <p class="leyenda muted"><span class="punto debil"></span>{$t('elemento.debiles')} <span class="punto fuerte"></span>{$t('elemento.fuertes')}</p>
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
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 8px;
    width: min(420px, calc(100vw - 20px));
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 14px;
    border: var(--borde);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--sombra);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 22px;
  }
  .redondo {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
  }
  .muted {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
  ul {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: #fff;
  }
  li.actual {
    background: #fff3c4;
    border-width: 3px;
  }
  .info {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .quienes {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .quienes img {
    object-fit: contain;
    border-radius: 6px;
    padding: 1px;
  }
  img.debil,
  .punto.debil {
    background: #c9f0b8;
  }
  img.fuerte,
  .punto.fuerte {
    background: #ffc9c2;
  }
  .es {
    padding: 2px 10px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: #ffe27a;
    font-size: 13px;
  }
  .cambiar {
    min-height: 38px;
    padding: 4px 10px;
    font-size: 14px;
    gap: 4px;
  }
  .leyenda {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .punto {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--line);
    border-radius: 4px;
  }
</style>
