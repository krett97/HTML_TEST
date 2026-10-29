<script lang="ts">
  // Ventana de bienvenida: lo que rompió la pandilla mientras no estabas. Se cobra normal o ×2
  // viendo el anuncio "Los dueños se fueron de vacaciones".
  import { ALLY_ICONS } from './allyIcons';
  import Coin from './Coin.svelte';
  import { t } from '../i18n';
  import { useGame } from './context';

  const game = useGame();
  const view = game.view;
  const gang = $derived($view.aliados.filter((a) => a.nivel > 0).map((a) => ALLY_ICONS[a.id] ?? '🐾'));
</script>

{#if $view.offline.visible}
  <div class="backdrop" role="presentation"></div>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="offline-title" data-testid="offline">
    <h2 id="offline-title">{$t('offline.titulo')}</h2>
    <div class="gang" aria-hidden="true">{gang.join(' ')}</div>
    <p class="muted">{$t('offline.trabajo', { tiempo: $view.offline.tiempo })}</p>
    <p class="loot">
      <span class="cifra big"><Coin />+{$view.offline.dinero}</span>
      <span class="muted small">{$t('offline.roturas', { n: $view.offline.roturas })}</span>
    </p>
    {#if $view.offline.tope}
      <p class="small warn">{$t('offline.tope', { horas: $view.offline.horasMax, ausente: $view.offline.ausente })}</p>
    {/if}
    <button type="button" class="btn btn--accent double" onclick={() => game.claimOffline(true)} data-testid="offline-doble">
      <span>📺 {$t('offline.doble')}</span>
      <span class="cifra"><Coin />+{$view.offline.doble}</span>
    </button>
    <button type="button" class="btn claim" onclick={() => game.claimOffline(false)} data-testid="offline-cobrar">
      {$t('offline.cobrar')}
    </button>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    background: rgba(18, 11, 22, 0.7);
  }
  .modal {
    position: fixed;
    z-index: 31;
    left: 50%;
    top: 50%;
    width: min(360px, calc(100% - 32px));
    translate: -50% -50%;
    display: grid;
    gap: 10px;
    padding: 18px 16px 16px;
    border: 3px solid var(--line);
    border-radius: 6px;
    text-align: center;
    /* Puntitos de historieta, como las viñetas. */
    background:
      radial-gradient(circle, rgba(18, 11, 22, 0.25) 1.4px, transparent 1.6px) 0 0 / 8px 8px,
      var(--panel-2);
    box-shadow: 6px 6px 0 var(--line);
    animation: entra 380ms cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }
  @keyframes entra {
    from {
      scale: 0.6;
      rotate: -6deg;
      opacity: 0;
    }
  }
  h2 {
    margin: 0;
    font-size: 22px;
    color: var(--gold);
  }
  .gang {
    font-size: 26px;
    letter-spacing: 2px;
    animation: brinca 700ms ease-in-out infinite alternate;
  }
  @keyframes brinca {
    to {
      translate: 0 -4px;
    }
  }
  p {
    margin: 0;
  }
  .loot {
    display: grid;
    gap: 2px;
  }
  .big {
    font-size: 40px;
    color: var(--gold);
    text-shadow: 0 3px 0 var(--line);
  }
  .muted {
    color: var(--muted);
  }
  .small {
    font-size: 13px;
  }
  .warn {
    color: var(--accent);
  }
  .double {
    display: grid;
    gap: 2px;
    width: 100%;
    font-size: 16px;
  }
  .claim {
    width: 100%;
  }
</style>
