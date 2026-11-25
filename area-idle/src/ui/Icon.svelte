<script lang="ts">
  // Ícono dibujado en código (src/assets/arte/iconos/<nombre>.png). `size` en píxeles CSS.
  import { iconUrl } from './icons';
  let { name, size = 24 }: { name: string; size?: number } = $props();
</script>

<img class="icono" src={iconUrl(name)} alt="" width={size} height={size} draggable="false" />

<style>
  .icono {
    display: inline-block;
    vertical-align: middle;
    flex: none;
  }
</style>
