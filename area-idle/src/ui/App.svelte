<script lang="ts">
  // La pantalla: el campo (Phaser) ocupa todo; encima van el reloj y el oro, el fin de la partida o el árbol.
  import { onMount } from 'svelte';
  import { mountScene } from '../game/boot';
  import Arbol from './Arbol.svelte';
  import Fin from './Fin.svelte';
  import Hud from './Hud.svelte';

  import { useJuego } from './context';

  const juego = useJuego();
  const view = juego.view;
  let host: HTMLDivElement;
  onMount(() => mountScene(host, juego));
</script>

<main>
  <div class="campo" bind:this={host} data-testid="campo"></div>
  {#if $view.fase === 'jugando'}
    <Hud />
  {:else if $view.fase === 'fin'}
    <Fin />
  {:else}
    <Arbol />
  {/if}
</main>

<style>
  main {
    position: fixed;
    inset: 0;
    overflow: hidden;
  }
  .campo {
    position: absolute;
    inset: 0;
    touch-action: none;
  }
</style>
