<script lang="ts">
  // Ajustes: sonido, idioma y reiniciar desde cero (dos toques). En la versión de pruebas, oro de regalo.
  import { t } from '../i18n';

  import { useJuego } from './context';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  let confirmar = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function reiniciar() {
    if (!confirmar) {
      confirmar = true;
      timer = setTimeout(() => (confirmar = false), 4000);
      return;
    }
    clearTimeout(timer);
    confirmar = false;
    juego.reset();
    cerrar();
  }
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('ajustes.titulo')} data-testid="ajustes">
  <header>
    <h2>{$t('ajustes.titulo')}</h2>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>
  <label class="fila">
    <span>{$t('ajustes.sonido')}</span>
    <input type="checkbox" checked={$view.meta.ajustes.sonido} onchange={(e) => juego.setSound(e.currentTarget.checked)} />
  </label>
  <label class="fila">
    <span>{$t('ajustes.idioma')}</span>
    <select value={$view.meta.ajustes.idioma ?? ''} onchange={(e) => juego.setLanguage(e.currentTarget.value === 'en' ? 'en' : 'es')}>
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  </label>
  <button type="button" class="btn btn--danger" onclick={reiniciar} data-testid="reiniciar">
    {confirmar ? $t('ajustes.reiniciarConfirmar') : $t('ajustes.reiniciar')}
  </button>
  {#if __PRUEBAS__}
    <h3>🛠 {$t('ajustes.pruebas')}</h3>
    <div class="botones">
      {#each [100, 10_000, 1_000_000] as n (n)}
        <button type="button" class="btn" onclick={() => juego.addGold(n)} data-testid="oro-{n}">{$t('ajustes.oro', { n: n.toLocaleString('es') })}</button>
      {/each}
      <button type="button" class="btn" onclick={() => juego.unlockNext()} data-testid="mas-nivel">{$t('ajustes.masNivel')}</button>
      <button type="button" class="btn" onclick={() => (juego.simulateAway(3600), cerrar())} data-testid="simular-hora">{$t('ajustes.simular')}</button>
      <button type="button" class="btn" onclick={() => juego.addMinute()} data-testid="mas-minuto-ajustes">{$t('ajustes.masMinuto')}</button>
    </div>
    <p class="version" data-testid="minutos-extra">{$t('ajustes.minutosExtra', { n: $view.minutosExtra })}</p>
  {/if}
  <p class="version">{$t('ajustes.version', { v: __APP_VERSION__ })}</p>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(18, 22, 18, 0.6);
  }
  .sheet {
    position: fixed;
    z-index: 41;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 12px;
    width: min(340px, calc(100vw - 24px));
    max-height: calc(100dvh - 40px);
    overflow: auto;
    padding: 16px;
    border: var(--borde);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--sombra);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2,
  h3 {
    margin: 0;
  }
  h3 {
    font-size: 16px;
  }
  .redondo {
    width: 38px;
    height: 38px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel-2);
    font: inherit;
  }
  .fila {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .fila input {
    width: 24px;
    height: 24px;
  }
  .fila select {
    font: inherit;
    padding: 4px 8px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: #fff;
  }
  .botones {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .version {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
</style>
