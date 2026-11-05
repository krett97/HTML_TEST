<script lang="ts">
  // El árbol del Canal en pantalla completa (encima de la escena y el panel; las pestañas siguen abajo).
  import { onMount } from 'svelte';
  import { t } from '../../i18n';
  import { arbolAbierto } from '../pantalla';
  import Arbol from './Arbol.svelte';

  const close = () => arbolAbierto.set(false);
  onMount(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="screen" data-testid="arbol-pantalla">
  <header>
    <button type="button" class="btn back" onclick={close} data-testid="cerrar-arbol">← {$t('canal.arbol.volver')}</button>
    <h2>{$t('canal.habilidades')}</h2>
  </header>
  <Arbol />
</div>

<style>
  .screen {
    display: grid;
    gap: 8px;
    max-width: 460px;
    margin: 0 auto;
  }
  header {
    position: sticky;
    top: -14px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: -14px -14px 0;
    padding: 8px 14px;
    background: var(--panel);
    border-bottom: 2px solid var(--line);
  }
  .back {
    min-height: 38px;
    font-size: 14px;
  }
  h2 {
    margin: 0;
    font-size: 17px;
  }
</style>
