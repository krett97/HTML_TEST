<script lang="ts">
  import { onMount } from 'svelte';
  import { mountScene } from '../game/boot';
  import { t } from '../i18n';
  import { useGame } from './context';

  const game = useGame();
  const view = game.view;
  let host: HTMLElement;

  onMount(() => mountScene(host, game));
</script>

<section class="scene" bind:this={host} data-testid="escena">
  {#if $view.toques === 0}
    <p class="hint">{$t('hud.toca')}</p>
  {/if}
</section>

<style>
  .scene {
    position: relative;
    flex: 1 1 0;
    min-height: 160px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: linear-gradient(to top, #6b4a3a var(--piso, 0px), #3b2a4d var(--piso, 0px));
    touch-action: none;
  }
  .scene :global(canvas) {
    display: block;
  }
  .hint {
    position: absolute;
    top: 16px;
    left: 0;
    right: 0;
    width: fit-content;
    max-width: calc(100% - 32px);
    margin: 0 auto;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: rgba(18, 11, 22, 0.75);
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    text-shadow: 0 2px 0 var(--line);
    pointer-events: none;
    animation: bob 1s ease-in-out infinite alternate;
  }
  @keyframes bob {
    to {
      transform: translateY(-6px);
    }
  }
</style>
