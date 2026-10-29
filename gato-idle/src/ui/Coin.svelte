<script lang="ts">
  // Moneda dorada con gatito, en lugar del "$". `size` en píxeles CSS (por defecto, el tamaño del texto).
  import { COIN_URL } from './coin';

  let { size }: { size?: number } = $props();
</script>

<img class="coin" src={COIN_URL} alt="" aria-hidden="true" style:--coin={size ? `${size}px` : undefined} />

<style>
  .coin {
    display: inline-block;
    width: var(--coin, 1em);
    height: var(--coin, 1em);
    margin-right: 0.12em;
    vertical-align: -0.12em;
    image-rendering: pixelated;
    flex: none;
  }
</style>
