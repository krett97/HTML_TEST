<script lang="ts">
  // Ajustes: sonido, idioma y reiniciar desde cero (dos toques). En la versión de pruebas, oro de regalo.
  import { locale, t } from '../i18n';
  import { formatGold } from '../core/format';

  import { useJuego } from './context';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  let confirmar = $state(false);
  let resumen = $state('');

  function jugar(min: number) {
    const r = juego.simulatePlay(min * 60);
    resumen = $t('ajustes.resumen', { min, partidas: r.partidas, ganadas: r.ganadas, desde: r.desde, hasta: r.hasta, compras: r.compras, oro: formatGold(r.oro) });
  }
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
    <select value={$view.meta.ajustes.idioma ?? $locale} onchange={(e) => juego.setLanguage(e.currentTarget.value === 'en' ? 'en' : 'es')}>
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
      <button type="button" class="btn" onclick={() => juego.addGems(10)} data-testid="mas-gemas">{$t('ajustes.masGemas')}</button>
      <button type="button" class="btn" onclick={() => juego.newDay()} data-testid="nuevo-dia">{$t('ajustes.nuevoDia')}</button>
      <button type="button" class="btn" onclick={() => juego.pvpRefill()} data-testid="pvp-recargar">{$t('ajustes.pvpRecargar')}</button>
      <button type="button" class="btn" onclick={() => juego.pvpEndWeek()} data-testid="pvp-fin-semana">{$t('ajustes.pvpSemana')}</button>
      <button type="button" class="btn" onclick={() => juego.addMedals(50)} data-testid="mas-medallas">{$t('ajustes.masMedallas')}</button>
      <button type="button" class="btn" onclick={() => (juego.simulateAway(3600), cerrar())} data-testid="simular-hora">{$t('ajustes.simular')}</button>
    </div>
    <!-- Como si hubieras jugado ese tiempo: partidas, oro, compras en el árbol y niveles. -->
    <div class="botones">
      {#each [1, 10] as min (min)}
        <button type="button" class="btn" onclick={() => jugar(min)} data-testid="jugar-{min}-min">{$t('ajustes.jugarMin', { n: min })}</button>
      {/each}
    </div>
    {#if resumen}
      <p class="resumen" data-testid="resultado-simulado">{resumen}</p>
    {/if}
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
  .resumen {
    margin: 0;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: #e8f6dd;
    font-size: 13px;
  }
  .version {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
</style>
