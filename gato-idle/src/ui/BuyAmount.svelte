<script lang="ts">
  // Selector "Comprar ×1 / ×10" de arriba de Mejoras y Aliados (se guarda en los ajustes).
  import { BUY_AMOUNTS } from '../core/bulk';
  import { t } from '../i18n';
  import { useGame } from './context';

  const game = useGame();
  const view = game.view;
</script>

<div class="amount" role="group" aria-label={$t('mejoras.comprar')}>
  <span class="label">{$t('mejoras.comprar')}</span>
  {#each BUY_AMOUNTS as n (n)}
    <button
      type="button"
      class:active={$view.compra === n}
      aria-pressed={$view.compra === n}
      onclick={() => game.setSetting('compra', n)}
      data-testid="compra-{n}">×{n}</button
    >
  {/each}
</div>

<style>
  .amount {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .label {
    margin-right: auto;
    color: var(--muted);
    font-size: 14px;
  }
  button {
    min-width: 56px;
    min-height: 36px;
    padding: 0 4px;
    border: 7px solid transparent;
    border-image: url('../assets/ui/boton_morado.png') 7 fill / 7px stretch;
    background: none;
    color: var(--text);
    image-rendering: pixelated;
    font-weight: 700;
    cursor: pointer;
  }
  button:active {
    transform: translateY(2px);
  }
  .active {
    border-image-source: url('../assets/ui/boton.png');
    color: var(--line);
  }
</style>
