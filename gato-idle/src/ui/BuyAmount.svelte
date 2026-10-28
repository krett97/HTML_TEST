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
    padding: 4px 10px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
    box-shadow: 0 3px 0 var(--line);
    font-weight: 700;
    cursor: pointer;
  }
  button:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--line);
  }
  .active {
    background: var(--accent);
    color: var(--line);
  }
</style>
