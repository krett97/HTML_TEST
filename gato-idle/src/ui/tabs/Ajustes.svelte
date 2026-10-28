<script lang="ts">
  import type { Notation } from '../../core/format';
  import type { Locale, Settings } from '../../core/state';
  import { isLocale, LOCALES, t } from '../../i18n';
  import { platform } from '../../services/platform';
  import { useGame } from '../context';

  const game = useGame();
  const view = game.view;

  // "Música" vuelve cuando haya música.
  const TOGGLES = ['sonido', 'vibracion'] as const;
  const NOTATIONS: Notation[] = ['letras', 'cientifica'];
  const LANGUAGE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English' };

  let adMessage = $state('');
  let confirmingReset = $state(false);
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;

  function toggle(key: (typeof TOGGLES)[number]) {
    game.setSetting(key, !$view.ajustes[key]);
  }

  function setNotation(event: Event) {
    game.setSetting('notacion', (event.currentTarget as HTMLSelectElement).value as Notation);
  }

  function setLanguage(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    game.setSetting('idioma', (isLocale(value) ? value : null) satisfies Settings['idioma']);
  }

  async function testAd() {
    adMessage = '';
    const result = await game.showRewarded('caja');
    adMessage = $t(result.rewarded ? 'ajustes.anuncioOk' : 'ajustes.anuncioNo');
  }

  // Borrar pide dos toques (sin diálogos del navegador, que no siempre se muestran).
  async function reset() {
    if (!confirmingReset) {
      confirmingReset = true;
      confirmTimer = setTimeout(() => (confirmingReset = false), 4000);
      return;
    }
    clearTimeout(confirmTimer);
    confirmingReset = false;
    await game.resetGame();
  }

  function formatTime(ms: number): string {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
</script>

<div class="group">
  {#each TOGGLES as key (key)}
    <label class="row">
      <span>{$t(`ajustes.${key}`)}</span>
      <input type="checkbox" class="switch" checked={$view.ajustes[key]} onchange={() => toggle(key)} />
    </label>
  {/each}
  <label class="row">
    <span>{$t('ajustes.notacion')}</span>
    <select value={$view.ajustes.notacion} onchange={setNotation}>
      {#each NOTATIONS as notation (notation)}
        <option value={notation}>{$t(`ajustes.${notation}`)}</option>
      {/each}
    </select>
  </label>
  <label class="row">
    <span>{$t('ajustes.idioma')}</span>
    <select value={$view.ajustes.idioma ?? 'auto'} onchange={setLanguage}>
      <option value="auto">{$t('ajustes.auto')}</option>
      {#each LOCALES as code (code)}
        <option value={code}>{LANGUAGE_NAMES[code]}</option>
      {/each}
    </select>
  </label>
</div>

<h3>{$t('ajustes.partida')}</h3>
<p class="muted small" data-testid="guardado">
  {$view.ultimoGuardado ? $t('ajustes.ultimoGuardado', { hora: formatTime($view.ultimoGuardado) }) : $t('ajustes.nuncaGuardado')}
</p>
{#if !$view.guardadoPersistente}
  <p class="warning small">{$t('ajustes.soloMemoria')}</p>
{/if}
<div class="buttons">
  <button type="button" class="btn" onclick={() => game.save()}>{$t('ajustes.guardarAhora')}</button>
  <button type="button" class="btn btn--danger" onclick={reset}>
    {confirmingReset ? $t('ajustes.borrarConfirmar') : $t('ajustes.borrar')}
  </button>
</div>

<h3>{$t('ajustes.pruebas')}</h3>
<div class="buttons">
  <button type="button" class="btn btn--accent" onclick={testAd}>{$t('ajustes.probarAnuncio')}</button>
</div>
{#if adMessage}
  <p class="small" data-testid="resultado-anuncio">{adMessage}</p>
{/if}
<p class="muted small">
  {$t('ajustes.version', { version: __APP_VERSION__, plataforma: platform, anuncios: game.ads.name })}
</p>

<style>
  .group {
    display: grid;
    gap: 6px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    padding: 4px 10px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  select {
    max-width: 60%;
    min-height: 34px;
    padding: 4px 6px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--bg);
  }
  .switch {
    appearance: none;
    position: relative;
    width: 46px;
    height: 26px;
    margin: 0;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--bg);
    cursor: pointer;
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--muted);
    transition: transform 120ms;
  }
  .switch:checked {
    background: var(--good);
  }
  .switch:checked::after {
    background: var(--text);
    transform: translateX(20px);
  }
  h3 {
    margin: 18px 2px 6px;
    font-size: 15px;
    color: var(--muted);
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .small {
    margin: 6px 2px;
    font-size: 13px;
  }
  .warning {
    color: var(--gold);
  }
</style>
