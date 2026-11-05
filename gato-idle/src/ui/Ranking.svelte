<script lang="ts">
  // Ranking de gatos: el botón del trofeo (arriba) abre la ventana. El nivel es el objeto más lejano
  // al que llegó cada jugador; tu fila va resaltada. Fuera de Claude solo se ve tu récord.
  import { ART_FILES } from '../game/art';
  import { MAX_NAME } from '../core/ranking';
  import { t } from '../i18n';
  import { useGame } from './context';
  import Icon from './Icon.svelte';

  const game = useGame();
  const view = game.view;
  const rows = game.ranking.rows;
  const status = game.ranking.status;

  let open = $state(false);
  let draft = $state('');
  let saved = $state(false);

  function show() {
    draft = $view.ranking.nombre;
    saved = false;
    open = true;
  }

  function saveName(event: SubmitEvent) {
    event.preventDefault();
    saved = game.setRankingName(draft);
  }

  // Sin ranking en línea (o mientras carga), al menos se ve tu propia fila.
  const shown = $derived(
    $rows.length > 0
      ? $rows
      : [{ id: 'yo', nombre: $view.ranking.nombre, nivel: $view.ranking.nivel, casa: $view.ranking.casa, objeto: $view.ranking.objeto, tuyo: true }],
  );
  const MEDALS = ['#ffd36e', '#d8dde6', '#d9945a'];
</script>

<button type="button" class="trophy" aria-label={$t('ranking.abrir')} onclick={show} data-testid="abrir-ranking">
  <Icon name="trofeo" size={28} />
</button>

{#if open}
  <div class="backdrop" role="presentation" onclick={() => (open = false)}></div>
  <div class="sheet card" role="dialog" aria-modal="true" aria-label={$t('ranking.titulo')} data-testid="ranking">
    <header>
      <h2><Icon name="trofeo" /> {$t('ranking.titulo')}</h2>
      <button type="button" class="close" aria-label={$t('ranking.cerrar')} onclick={() => (open = false)}>×</button>
    </header>
    <p class="small muted">{$t('ranking.explica')}</p>

    <form class="name" onsubmit={saveName}>
      <label for="nombre-gato" class="small muted">{$t('ranking.tuGato')}</label>
      <input id="nombre-gato" bind:value={draft} maxlength={MAX_NAME} autocomplete="off" data-testid="nombre-gato" />
      <button type="submit" class="btn btn--accent" disabled={!draft.trim() || draft.trim() === $view.ranking.nombre}>{$t('ranking.guardar')}</button>
    </form>
    {#if saved}<p class="small gold note">{$t('ranking.guardado')}</p>{/if}

    {#if $status === 'cargando'}
      <p class="small muted note">{$t('ranking.cargando')}</p>
    {:else if $status === 'sinConexion'}
      <p class="small muted note" data-testid="ranking-sin-conexion">{$t('ranking.sinConexion')}</p>
    {:else if $status === 'soloLectura'}
      <p class="small muted note">{$t('ranking.soloLectura')}</p>
    {/if}

    <ol class="rows">
      {#each shown as row, i (row.id)}
        <li class="row" class:tuyo={row.tuyo} data-testid={row.tuyo ? 'ranking-tuyo' : undefined}>
          <span class="pos cifra" style:color={MEDALS[i] ?? 'var(--muted)'}>{i + 1}</span>
          {#if ART_FILES[`obj_${row.objeto}`]}<img class="obj" src={ART_FILES[`obj_${row.objeto}`]} alt="" />{:else}<span class="obj"></span>{/if}
          <span class="who">
            <strong>{row.nombre || $t('ranking.anonimo')}</strong>
            <span class="small muted">{$t(`objetos.${row.objeto}`)} · {$t(`casas.${row.casa}`)}</span>
          </span>
          <span class="lvl cifra">{$t('ranking.nivel', { n: row.nivel })}</span>
        </li>
      {/each}
    </ol>
  </div>
{/if}

<style>
  .trophy {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(18, 11, 22, 0.7);
  }
  .sheet {
    position: fixed;
    z-index: 41;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 8px;
    width: min(380px, calc(100vw - 24px));
    max-height: calc(100dvh - 40px);
    overflow: auto;
    color: var(--text);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .close {
    width: 36px;
    height: 36px;
    border: 0;
    background: none;
    color: var(--muted);
    font-size: 26px;
    cursor: pointer;
  }
  .name {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
    align-items: center;
  }
  .name label {
    grid-column: 1 / -1;
  }
  input {
    min-width: 0;
    height: 40px;
    padding: 0 10px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
  }
  .rows {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: grid;
    grid-template-columns: 28px 32px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 4px;
    background: rgba(18, 11, 22, 0.35);
  }
  .row.tuyo {
    outline: 2px solid var(--gold);
    background: rgba(255, 211, 110, 0.12);
  }
  .pos {
    font-size: 18px;
    text-align: center;
  }
  .obj {
    width: 32px;
    height: 32px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .who {
    display: grid;
    min-width: 0;
  }
  .who strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lvl {
    color: var(--gold);
    font-size: 15px;
  }
  .note {
    margin: 0;
  }
  .muted {
    color: var(--muted);
  }
  .small {
    font-size: 13px;
  }
  .gold {
    color: var(--gold);
  }
</style>
