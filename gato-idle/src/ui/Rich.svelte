<script lang="ts">
  // Texto con íconos: cada [[nombre]] se dibuja con su ícono de PixelLab.
  import Icon from './Icon.svelte';
  import { richParts } from './icons';

  let { text }: { text: string } = $props();
  const parts = $derived(richParts(text));
</script>

{#each parts as part, i (i)}{#if 'icon' in part}<Icon name={part.icon} />{:else}{part.text}{/if}{/each}
