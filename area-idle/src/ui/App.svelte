<script lang="ts">
  // La pantalla: el campo (Phaser) ocupa todo; encima van el reloj y el oro (en un nivel), el fin de la
  // partida o la pantalla principal (el campo con la guardia, "Jugar nivel" y "Mejorar").
  import { onMount } from 'svelte';
  import { mountScene } from '../game/boot';
  import Bienvenida from './Bienvenida.svelte';
  import Fin from './Fin.svelte';
  import Hud from './Hud.svelte';
  import Principal from './Principal.svelte';

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
    <Principal />
  {/if}
  <Bienvenida />
</main>

<style>
  main {
    position: fixed;
    inset: 0;
    overflow: hidden;
    /* Que ni un scrollIntoView la corra de lado. */
    overflow: clip;
  }
  .campo {
    position: absolute;
    inset: 0;
    touch-action: none;
  }
</style>
