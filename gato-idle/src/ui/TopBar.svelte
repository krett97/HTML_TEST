<script lang="ts">
  import { t } from '../i18n';
  import { useGame } from './context';
  import Pruebas from './Pruebas.svelte';

  const view = useGame().view;
</script>

<header class="top">
  <div class="title">{$t('app.title')}</div>
  <div class="right">
    <div class="money" aria-label={$t('hud.dinero')}>
      <span class="coin" aria-hidden="true">$</span>
      <span data-testid="dinero">{$view.dinero}</span>
    </div>
    {#if $view.pruebas.disponible}
      <Pruebas />
    {/if}
  </div>
</header>

<style>
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 14px;
    background: var(--panel);
    border-bottom: 2px solid var(--line);
  }
  .title {
    color: var(--muted);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .money {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 26px;
    font-weight: 700;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
  }
  .coin {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 2px solid var(--line);
    border-radius: 50%;
    background: var(--gold);
    color: var(--line);
    font-size: 14px;
  }
</style>
