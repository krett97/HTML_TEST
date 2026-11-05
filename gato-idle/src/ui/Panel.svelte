<script lang="ts">
  import Icon from './Icon.svelte';
  import { t } from '../i18n';
  import { useGame } from './context';
  import Mejoras from './tabs/Mejoras.svelte';
  import Aliados from './tabs/Aliados.svelte';
  import Laboratorio from './tabs/Laboratorio.svelte';
  import Canal from './tabs/Canal.svelte';
  import Ajustes from './tabs/Ajustes.svelte';
  import NewBadge from './NewBadge.svelte';
  import ArbolPantalla from './tabs/ArbolPantalla.svelte';
  import { arbolAbierto } from './pantalla';

  const ALL_TABS = [
    { id: 'mejoras', icon: 'mejoras', component: Mejoras },
    { id: 'aliados', icon: 'gatito', component: Aliados },
    { id: 'laboratorio', icon: 'laboratorio', component: Laboratorio },
    { id: 'canal', icon: 'canal', component: Canal },
    { id: 'ajustes', icon: 'ajustes', component: Ajustes },
  ] as const;
  type TabId = (typeof ALL_TABS)[number]['id'];
  /** Pestaña que señala el tutorial en cada paso. */
  const TAB_STEP: Partial<Record<TabId, string>> = { aliados: 'aliado', canal: 'video' };

  const view = useGame().view;

  // Las pestañas aparecen conforme se descubren.
  const tabs = $derived(
    ALL_TABS.filter(
      (tab) =>
        (tab.id !== 'aliados' || $view.funciones.aliados) &&
        (tab.id !== 'laboratorio' || $view.funciones.laboratorio) &&
        (tab.id !== 'canal' || $view.funciones.canal),
    ),
  );

  let active = $state<TabId>('mejoras');
  const Current = $derived((tabs.find((tab) => tab.id === active) ?? tabs[0]!).component);

  function hasDot(id: TabId): boolean {
    if (id === active) return false;
    if (id === 'mejoras') return $view.hayCompra;
    if (id === 'aliados') return $view.hayCompraAliado;
    if (id === 'laboratorio') return !$view.laboratorio.actual && $view.laboratorio.proyectos.some((p) => p.estado === 'disponible' && p.alcanza);
    if (id === 'canal') return $view.canal.grabando.listo || $view.canal.hayCompra;
    return false;
  }

  function isNew(id: TabId): boolean {
    if (id === 'aliados') return $view.nuevos.some((n) => n.startsWith('aliado:'));
    if (id === 'laboratorio') return $view.nuevos.includes('laboratorio');
    if (id === 'canal') return $view.nuevos.includes('canal');
    return false;
  }
</script>

<!-- Con el árbol abierto, el panel cubre también la escena (las pestañas se quedan abajo). -->
<section class="panel" class:expandida={$arbolAbierto}>
  <div class="content" role="tabpanel">
    {#if $arbolAbierto}<ArbolPantalla />{:else}<Current />{/if}
  </div>
  <div class="tabs" role="tablist" style:grid-template-columns="repeat({tabs.length}, 1fr)">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        role="tab"
        class="tab"
        class:active={tab.id === active}
        aria-selected={tab.id === active}
        onclick={() => {
          active = tab.id;
          arbolAbierto.set(false);
        }}
        data-tuto={TAB_STEP[tab.id]}
      >
        <span class="tab-icon" aria-hidden="true">
          <Icon name={tab.icon} size={26} />
          {#if hasDot(tab.id)}
            <span class="dot" data-testid="aviso-{tab.id}"></span>
          {/if}
        </span>
        <span class="label">{$t(`tabs.${tab.id}`)}</span>
        {#if isNew(tab.id) && tab.id !== active}<span class="new"><NewBadge /></span>{/if}
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
  .panel.expandida {
    position: absolute;
    z-index: 30;
    top: var(--arriba, 0px);
    right: 0;
    bottom: env(safe-area-inset-bottom);
    left: 0;
    height: auto;
    border-top: 0;
  }
  .content {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    padding: 14px;
  }
  .tabs {
    display: grid;
    border-top: 2px solid var(--line);
    background: var(--bg);
  }
  .tab {
    position: relative;
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
    font-size: 12px;
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
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tab-icon {
    position: relative;
  }
  .new {
    position: absolute;
    top: 2px;
    right: 2px;
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
