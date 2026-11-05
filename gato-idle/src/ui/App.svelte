<script lang="ts">
  import TopBar from './TopBar.svelte';
  import SceneHost from './SceneHost.svelte';
  import Panel from './Panel.svelte';
  import OfflineModal from './OfflineModal.svelte';

  // Alto de la barra de arriba: el árbol en pantalla completa empieza justo debajo.
  let topHeight = $state(0);
</script>

<main class="app" style:--arriba="{topHeight}px">
  <div bind:clientHeight={topHeight}><TopBar /></div>
  <SceneHost />
  <Panel />
</main>
<OfflineModal />

<style>
  .app {
    position: relative;
    width: 100%;
    max-width: 480px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }

  @media (min-width: 520px) {
    .app {
      border-left: 2px solid var(--line);
      border-right: 2px solid var(--line);
    }
  }
</style>
