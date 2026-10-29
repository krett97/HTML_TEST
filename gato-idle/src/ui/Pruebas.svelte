<script lang="ts">
  // Panel del modo pruebas: el botón 🛠 de la barra superior abre atajos para probar etapas
  // avanzadas sin empezar de cero. No existe en la versión de tienda (PRUEBAS=no al compilar).
  import { onDestroy } from 'svelte';
  import type { TestSlot } from '../app/game';
  import { formatDuration } from '../core/time';
  import { t } from '../i18n';
  import { useGame } from './context';

  const game = useGame();
  const view = game.view;
  const objects = game.data.objects;
  const DAMAGE = [1, 10, 100, 1000] as const;

  let open = $state(false);
  let message = $state('');
  let target = $state('');
  let slots = $state<(TestSlot | null)[]>([]);
  let messageTimer: ReturnType<typeof setTimeout> | undefined;

  const currentIndex = $derived(objects.findIndex((o) => o.id === $view.objetoId));
  const ahead = $derived(objects.slice(currentIndex + 1));

  function say(text: string) {
    message = text;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => (message = ''), 5000);
  }
  onDestroy(() => clearTimeout(messageTimer));

  async function show() {
    open = true;
    target = '';
    slots = await game.testSlots();
  }

  function money(seconds: number) {
    const dinero = game.testMoney(seconds);
    say($t('pruebas.recibiste', { dinero: game.formatMoney(dinero) }));
  }

  function advance(goal: { segundos?: number; objeto?: string }) {
    const seconds = game.testAdvance(goal);
    say($t('pruebas.jugaste', { tiempo: formatDuration(Math.round(seconds)), objeto: $t(`objetos.${game.currentObjectId()}`) }));
    target = '';
  }

  function discover(all: boolean) {
    const count = game.testDiscover(all);
    say(count > 0 ? $t('pruebas.descubriste', { n: count }) : $t('pruebas.nadaQueDescubrir'));
  }

  async function saveSlot(slot: number) {
    await game.saveTestSlot(slot);
    slots = await game.testSlots();
    say($t('pruebas.puntoGuardado', { n: slot }));
  }

  async function loadSlot(slot: number) {
    if (await game.loadTestSlot(slot)) say($t('pruebas.puntoCargado', { n: slot }));
  }

  function allOff() {
    game.setPrueba('dineroInfinito', false);
    game.setPrueba('danioInfinito', false);
    game.setPrueba('multDanio', 1);
    say($t('pruebas.apagados'));
  }

  function formatTime(ms: number): string {
    return new Date(ms).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
</script>

<button
  type="button"
  class="open"
  class:open--on={$view.pruebas.activas}
  aria-label={$t('pruebas.titulo')}
  data-testid="abrir-pruebas"
  onclick={show}>🛠</button
>

{#if open}
  <div class="backdrop" role="presentation" onclick={() => (open = false)}></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label={$t('pruebas.titulo')} data-testid="pruebas">
    <header>
      <div>
        <h2>🛠 {$t('pruebas.titulo')}</h2>
        <p class="muted small">{$t('pruebas.intro')}</p>
      </div>
      <button type="button" class="close" aria-label={$t('pruebas.cerrar')} onclick={() => (open = false)}>✕</button>
    </header>

    <p class="message" aria-live="polite" data-testid="mensaje-pruebas">{message}</p>

    <div class="body">
      <section>
        <h3>💰 {$t('pruebas.dinero')}</h3>
        <label class="row">
          <span>{$t('pruebas.dineroInfinito')}</span>
          <input
            type="checkbox"
            class="switch"
            data-testid="dinero-infinito"
            checked={$view.pruebas.dineroInfinito}
            onchange={(e) => game.setPrueba('dineroInfinito', e.currentTarget.checked)}
          />
        </label>
        <div class="buttons">
          <button type="button" class="btn" onclick={() => money(60)}>{$t('pruebas.ganancias', { tiempo: '1 min' })}</button>
          <button type="button" class="btn" onclick={() => money(600)}>{$t('pruebas.ganancias', { tiempo: '10 min' })}</button>
          <button type="button" class="btn" onclick={() => money(3600)}>{$t('pruebas.ganancias', { tiempo: '1 h' })}</button>
        </div>
      </section>

      <section>
        <h3>🐾 {$t('pruebas.danio')}</h3>
        <div class="segmented" role="group" aria-label={$t('pruebas.danio')}>
          {#each DAMAGE as mult (mult)}
            <button
              type="button"
              class:active={!$view.pruebas.danioInfinito && $view.pruebas.multDanio === mult}
              onclick={() => {
                game.setPrueba('danioInfinito', false);
                game.setPrueba('multDanio', mult);
              }}>×{mult}</button
            >
          {/each}
          <button
            type="button"
            data-testid="danio-infinito"
            class:active={$view.pruebas.danioInfinito}
            onclick={() => game.setPrueba('danioInfinito', true)}>∞</button
          >
        </div>
        <p class="muted small">{$t('pruebas.danioNota')}</p>
      </section>

      <section>
        <h3>⏩ {$t('pruebas.avanzar')}</h3>
        <p class="muted small">{$t('pruebas.avanzarNota')}</p>
        <div class="buttons">
          <button type="button" class="btn" onclick={() => advance({ segundos: 300 })}>+5 min</button>
          <button type="button" class="btn" onclick={() => advance({ segundos: 1800 })}>+30 min</button>
        </div>
        {#if ahead.length > 0}
          <div class="inline">
            <select bind:value={target} aria-label={$t('pruebas.hasta')} data-testid="objeto-meta">
              <option value="" disabled>{$t('pruebas.hasta')}</option>
              {#each ahead as obj (obj.id)}
                <option value={obj.id}>{$t(`objetos.${obj.id}`)}</option>
              {/each}
            </select>
            <button
              type="button"
              class="btn btn--accent"
              data-testid="jugar-hasta"
              disabled={!target}
              onclick={() => advance({ objeto: target })}>{$t('pruebas.jugar')}</button
            >
          </div>
        {/if}
      </section>

      <section>
        <h3>✨ {$t('pruebas.atajos')}</h3>
        <div class="buttons">
          <button type="button" class="btn" onclick={() => discover(false)}>{$t('pruebas.descubrirSiguiente')}</button>
          <button type="button" class="btn" onclick={() => discover(true)}>{$t('pruebas.descubrirTodo')}</button>
          <button type="button" class="btn" onclick={() => game.testAllies(10)}>{$t('pruebas.aliados')}</button>
          <button type="button" class="btn" disabled={!$view.laboratorio.actual} onclick={() => game.testResearch(false)}
            >{$t('pruebas.terminarInvestigacion')}</button
          >
          <button type="button" class="btn" onclick={() => game.testResearch(true)}>{$t('pruebas.todasInvestigaciones')}</button>
          <button type="button" class="btn" onclick={() => game.testSponsor()}>{$t('pruebas.patrocinio')}</button>
          <button type="button" class="btn" data-testid="regalo-canal" onclick={() => game.testCanal(25, 100000)}>{$t('pruebas.canal')}</button>
          <button type="button" class="btn" data-testid="probar-jefe" onclick={() => { if (game.testBoss()) open = false; }}>{$t('pruebas.jefe')}</button>
          <button type="button" class="btn" data-testid="probar-mudanza" onclick={() => say(game.testMudanza() ? $t('pruebas.mudanzaLista') : $t('pruebas.sinMudanza'))}
            >{$t('pruebas.mudanza')}</button
          >
          <button type="button" class="btn" onclick={() => { game.testOffline(3600); open = false; }}>{$t('pruebas.offline')}</button>
        </div>
      </section>

      <section>
        <h3>💾 {$t('pruebas.puntos')}</h3>
        <p class="muted small">{$t('pruebas.puntosNota')}</p>
        {#each slots as slot, i (i)}
          <div class="row slot">
            <span class="small">
              <strong>{$t('pruebas.punto', { n: i + 1 })}</strong>
              {#if slot}
                · {$t(`objetos.${slot.objetoId}`)} · ${slot.dinero}
                <span class="muted">· {formatTime(slot.guardado)}</span>
              {:else}
                <span class="muted">· {$t('pruebas.vacio')}</span>
              {/if}
            </span>
            <span class="slot-buttons">
              <button type="button" class="btn" onclick={() => saveSlot(i + 1)}>{$t('pruebas.guardar')}</button>
              <button type="button" class="btn" disabled={!slot} onclick={() => loadSlot(i + 1)}>{$t('pruebas.cargar')}</button>
            </span>
          </div>
        {/each}
      </section>

      {#if $view.pruebas.activas}
        <button type="button" class="btn btn--danger off" onclick={allOff}>{$t('pruebas.apagar')}</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .open {
    flex: none;
    width: 40px;
    height: 40px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
    box-shadow: 0 3px 0 var(--line);
    font-size: 20px;
    cursor: pointer;
  }
  .open:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--line);
  }
  /* Con un truco prendido el botón se pone rojo, para no olvidarlo. */
  .open--on {
    background: var(--danger);
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    background: rgba(18, 11, 22, 0.6);
  }
  .sheet {
    position: fixed;
    z-index: 21;
    top: max(12px, env(safe-area-inset-top));
    bottom: max(12px, env(safe-area-inset-bottom));
    left: 50%;
    width: min(460px, calc(100% - 24px));
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    border: 2px solid var(--line);
    border-radius: 6px;
    background: var(--panel);
    box-shadow: 0 4px 0 var(--line);
  }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px 4px;
  }
  h2 {
    margin: 0;
    font-size: 20px;
  }
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    color: var(--gold);
  }
  header p {
    margin: 4px 0 0;
  }
  .close {
    flex: none;
    width: 40px;
    height: 40px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
    cursor: pointer;
  }
  .message {
    min-height: 20px;
    margin: 0;
    padding: 0 14px;
    color: var(--good);
    font-size: 14px;
  }
  .body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 14px 16px;
    display: grid;
    gap: 16px;
    align-content: start;
  }
  section {
    display: grid;
    gap: 8px;
  }
  section p {
    margin: 0;
  }
  .muted {
    color: var(--muted);
  }
  .small {
    font-size: 13px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    padding: 4px 10px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .buttons .btn {
    flex: 1 1 auto;
    font-size: 14px;
  }
  .inline {
    display: flex;
    gap: 8px;
  }
  .inline select {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0 8px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  .segmented {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border: 2px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .segmented button {
    min-height: 44px;
    border: 0;
    border-left: 2px solid var(--line);
    background: var(--panel-2);
    cursor: pointer;
  }
  .segmented button:first-child {
    border-left: 0;
  }
  .segmented .active {
    background: var(--accent);
    color: var(--line);
    font-weight: 700;
  }
  .slot {
    flex-wrap: wrap;
  }
  .slot-buttons {
    display: flex;
    gap: 6px;
  }
  .slot-buttons .btn {
    min-height: 36px;
    padding: 4px 10px;
    font-size: 13px;
  }
  .off {
    width: 100%;
  }
</style>
