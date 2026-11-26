<script lang="ts">
  // Supervivencia (desde el nivel 26): entradas, récord y Runas; desde aquí se entra a las oleadas o a la Herrería.
  import { onDestroy } from 'svelte';
  import { formatDuration, formatNum } from '../core/format';
  import { msHastaEntrada } from '../core/supervivencia';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Herreria from './Herreria.svelte';
  import Icon from './Icon.svelte';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  let herreria = $state(false);
  let ahora = $state(Date.now());
  const s = $derived($view.supervivencia);
  // Cuánto falta para la siguiente entrada (con la hora de su recarga guardada).
  const espera = $derived(msHastaEntrada($view.meta.supervivencia, ahora));
  const reloj = setInterval(() => {
    ahora = Date.now();
    if (s.entradas < s.max && espera <= 0) juego.refresh();
  }, 1000);
  onDestroy(() => clearInterval(reloj));

  function entrar() {
    if (juego.playSurvival()) cerrar();
  }
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('oleadas.titulo')} data-testid="supervivencia">
  <header>
    <h2><Icon name="oleadas" size={30} /> {$t('oleadas.titulo')}</h2>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>
  <p class="muted">{$t('oleadas.explica')}</p>
  <div class="datos">
    <div class="dato"><Icon name="oleadas" size={26} /><span>{$t('oleadas.entradas')}</span><strong class="cifra" data-testid="entradas">{s.entradas}/{s.max}</strong></div>
    <div class="dato"><Icon name="trofeo" size={26} /><span>{$t('oleadas.mejor')}</span><strong class="cifra" data-testid="record">{s.record}</strong></div>
    <div class="dato"><Icon name="runa" size={26} /><span>{$t('oleadas.runas')}</span><strong class="cifra" data-testid="runas">{formatNum($view.meta.runas)}</strong></div>
  </div>
  {#if s.entradas < s.max}<p class="muted">{$t('oleadas.recarga', { t: formatDuration(espera / 1000) })}</p>{/if}
  <div class="botones">
    <button type="button" class="btn" onclick={() => (herreria = true)} data-testid="abrir-herreria"><Icon name="herreria" size={26} /> {$t('herreria.titulo')}</button>
    <button type="button" class="btn btn--accent" disabled={s.entradas < 1} onclick={entrar} data-testid="entrar-oleadas"><Icon name="jugar" size={22} /> {$t('oleadas.entrar')}</button>
  </div>
</div>
{#if herreria}
  <Herreria cerrar={() => (herreria = false)} />
{/if}

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
    gap: 10px;
    width: min(400px, calc(100vw - 20px));
    max-height: calc(100dvh - 24px);
    overflow: auto;
    padding: 14px;
    border: var(--borde);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--sombra);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    margin: 0;
    font-size: 22px;
  }
  .redondo {
    width: 38px;
    height: 38px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel-2);
  }
  .muted {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
  .datos {
    display: grid;
    gap: 6px;
  }
  .dato {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: #fff;
    font-size: 15px;
  }
  .dato strong {
    font-size: 18px;
  }
  .botones {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .botones .btn {
    min-height: 52px;
    font-size: 17px;
  }
</style>
