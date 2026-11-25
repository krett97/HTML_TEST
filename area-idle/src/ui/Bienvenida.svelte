<script lang="ts">
  // Al volver: lo que se juntó mientras no jugabas (desde el nivel 3). Se cobra con un toque.
  import { formatDuration, formatNum } from '../core/format';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';

  const juego = useJuego();
  const view = juego.view;
</script>

{#if $view.inactivo && $view.fase !== 'jugando'}
  <div class="backdrop" role="presentation"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label={$t('inactivo.titulo')} data-testid="bienvenida">
    <Icon name="inactivo" size={72} />
    <h2>{$t('inactivo.titulo')}</h2>
    <p class="muted" data-testid="tiempo-fuera">{$t('inactivo.tiempo', { t: formatDuration($view.inactivo.segundos) })}</p>
    <div class="oro"><Icon name="moneda" size={36} /><strong class="cifra" data-testid="oro-inactivo">+{formatNum($view.inactivo.oro)}</strong></div>
    {#if $view.inactivo.tope && $view.ritmoInactivo}
      <p class="tope">{$t('inactivo.tope', { h: $view.ritmoInactivo.horas })}</p>
    {/if}
    <button type="button" class="btn btn--accent cobrar" onclick={() => juego.collectIdle()} data-testid="cobrar">{$t('inactivo.cobrar')}</button>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(18, 22, 18, 0.6);
  }
  .sheet {
    position: fixed;
    z-index: 51;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    justify-items: center;
    gap: 8px;
    width: min(320px, calc(100vw - 32px));
    padding: 18px;
    border: var(--borde);
    border-radius: 22px;
    background: var(--panel);
    box-shadow: var(--sombra);
    text-align: center;
    animation: salta 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  @keyframes salta {
    from {
      scale: 0.7;
    }
  }
  h2 {
    margin: 0;
  }
  .muted {
    margin: 0;
    color: var(--muted);
  }
  .oro {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 34px;
    color: var(--gold);
  }
  .tope {
    margin: 0;
    color: var(--danger);
    font-size: 13px;
  }
  .cobrar {
    width: 100%;
    font-size: 22px;
  }
</style>
