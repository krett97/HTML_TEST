<script lang="ts">
  import { t } from '../i18n';
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
        <span aria-hidden="true">{tab.icon}</span>
        <span class="label">{$t(`tabs.${tab.id}`)}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .panel {
    flex: 0 0 auto;
    height: clamp(240px, 42dvh, 380px);
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
</style>
