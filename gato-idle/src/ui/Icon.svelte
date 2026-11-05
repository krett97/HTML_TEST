<script lang="ts">
  // Ícono de PixelLab. `size` en píxeles CSS; sin tamaño, mide como el texto.
  import { iconUrl } from './icons';

  let { name, size }: { name: string; size?: number } = $props();
  const src = $derived(iconUrl(name));
</script>

{#if src}<img class="icono" {src} alt="" aria-hidden="true" style:width={size ? `${size}px` : null} style:height={size ? `${size}px` : null} />{/if}
