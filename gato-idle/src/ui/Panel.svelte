<script lang="ts">
  import { t } from '../i18n';
  import { useGame } from './context';
  import Mejoras from './tabs/Mejoras.svelte';
  import Personal from './tabs/Personal.svelte';
  import Mudanza from './tabs/Mudanza.svelte';
  import Ajustes from './tabs/Ajustes.svelte';

  const TABS = [
    { id: 'mejoras', icon: '🐾', component: Mejoras },
    { id: 'personal', icon: '🎥', component: Personal },
    { id: 'mudanza', icon: '📦', component: Mudanza },
    { id: 'ajustes', icon: '⚙️', component: Ajustes },
  ] as const;

  const view = useGame().view;

  let active = $state<(typeof TABS)[number]['id']>('mejoras');
  const Current = $derived(TABS.find((tab) => tab.id === active)!.component);
</script>

<section class="panel">
  <div class="content" role="tabpanel">
    <Current />
  </div>
  <div class="tabs" role="tablist">
    {#each TABS as tab (tab.id)}
      <button
        type="button"
        role="tab"
        class="tab"
        class:active={tab.id === active}
        aria-selected={tab.id === active}
        onclick={() => (active = tab.id)}
      >
        <span class="tab-icon" aria-hidden="true">
          {tab.icon}
          {#if tab.id === 'mejoras' && $view.hayCompra && active !== 'mejoras'}
            <span class="dot" data-testid="aviso-mejora"></span>
          {/if}
        </span>
        <span class="label">{$t(`tabs.${tab.id}`)}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .panel {
    flex: 0 0 auto;
    height: clamp(260px, 48dvh, 440px);
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border-top: 2px solid var(--line);
  }
  .content {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    padding: 14px;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 2px solid var(--line);
    background: var(--bg);
  }
  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 56px;
    padding: 6px 2px;
    border: 0;
    border-right: 2px solid var(--line);
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    cursor: pointer;
  }
  .tab:last-child {
    border-right: 0;
  }
  .tab.active {
    background: var(--panel-2);
    color: var(--text);
    box-shadow: inset 0 3px 0 var(--accent);
  }
  .label {
    white-space: nowrap;
  }
  .tab-icon {
    position: relative;
  }
  /* Hay algo que comprar en Mejoras. */
  .dot {
    position: absolute;
    top: -2px;
    right: -9px;
    width: 9px;
    height: 9px;
    border: 2px solid var(--line);
    border-radius: 50%;
    background: var(--gold);
  }
</style>
