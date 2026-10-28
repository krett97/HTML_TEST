<script lang="ts">
  import TopBar from './TopBar.svelte';
  import SceneHost from './SceneHost.svelte';
  import Panel from './Panel.svelte';
</script>

<main class="app">
  <TopBar />
  <SceneHost />
  <Panel />
</main>

<style>
  .app {
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
