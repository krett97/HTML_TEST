<script lang="ts">
  // Ranking (desde el nivel 17): tu nivel más alto contra el de los demás. En la versión publicada en
  // Claude es una tabla compartida; fuera de Claude (APK, archivo) solo se ve tu fila.
  import { bossFor, JEFE, type EnemyKind } from '../core/datos';
  import { formatNum } from '../core/format';
  import { MAX_NAME, rankingEntry, type RankingRow } from '../core/ranking';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  const rows = juego.ranking.rows;
  const status = juego.ranking.status;

  // svelte-ignore state_referenced_locally
  let borrador = $state($view.ranking.nombre);
  let guardado = $state(false);

  function guardar(event: SubmitEvent) {
    event.preventDefault();
    guardado = juego.setName(borrador);
  }

  const yo = $derived<RankingRow>({ id: 'yo', tuyo: true, ...rankingEntry($view.meta) });
  // Tu fila sale aunque no estés entre los primeros (o mientras se manda, o sin ranking en línea).
  const lista = $derived($rows.some((r) => r.tuyo) ? $rows : [...$rows, yo]);
  const posicion = (r: RankingRow, i: number) => ($rows.length && !$rows.some((x) => x.tuyo) && r.id === 'yo' ? '—' : String(i + 1));
  const MEDALLAS = ['#e8a91c', '#9aa3b2', '#c47a3a'];
  // El dibujo de cada fila: el último jefe que venció (o un slime, si aún no vence ninguno).
  const IMAGEN: Partial<Record<EnemyKind, string>> = { rey: 'jefe_rey', loboBlanco: 'loboBlanco', esqueletoMago: 'esqueletoMago', liderBandido: 'liderBandido' };
  function trofeo(nivel: number): string {
    const ultimo = Math.floor((nivel - 1) / JEFE.cada) * JEFE.cada;
    return ultimo > 0 ? artUrl(IMAGEN[bossFor(ultimo)] ?? 'slime_verde') : artUrl('slime_verde');
  }
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('ranking.titulo')} data-testid="ranking">
  <header>
    <h2><Icon name="trofeo" size={30} /> {$t('ranking.titulo')}</h2>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>

  <form class="nombre" onsubmit={guardar}>
    <label for="nombre-jugador" class="muted">{$t('ranking.tuNombre')}</label>
    <input id="nombre-jugador" bind:value={borrador} maxlength={MAX_NAME} autocomplete="off" placeholder={$t('ranking.anonimo')} data-testid="nombre-jugador" />
    <button type="submit" class="btn btn--accent" disabled={!borrador.trim() || borrador.trim() === $view.ranking.nombre} data-testid="guardar-nombre">{$t('ranking.guardar')}</button>
  </form>
  {#if guardado}<p class="nota ok">{$t('ranking.guardado')}</p>{/if}

  {#if $status === 'cargando'}
    <p class="nota">{$t('ranking.cargando')}</p>
  {:else if $status === 'sinConexion'}
    <p class="nota" data-testid="ranking-sin-conexion">{$t('ranking.sinConexion')}</p>
  {:else if $status === 'soloLectura'}
    <p class="nota">{$t('ranking.soloLectura')}</p>
  {/if}

  <ol class="filas">
    {#each lista as fila, i (fila.id)}
      <li class="fila" class:tuyo={fila.tuyo} data-testid={fila.tuyo ? 'ranking-tuyo' : 'ranking-fila'}>
        <span class="pos cifra" style:color={MEDALLAS[i] ?? 'var(--muted)'}>{posicion(fila, i)}</span>
        <img src={trofeo(fila.nivel)} alt="" width="40" height="40" />
        <span class="quien">
          <strong>{fila.nombre || $t('ranking.anonimo')}{#if fila.tuyo} <span class="tu">{$t('ranking.tu')}</span>{/if}</strong>
          <span class="muted">{$t('ranking.reventados', { n: formatNum(fila.reventados) })}</span>
        </span>
        <span class="nivel cifra">{$t('ranking.nivel', { n: fila.nivel })}</span>
      </li>
    {/each}
  </ol>
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
  .nombre {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 8px;
    align-items: center;
  }
  .nombre label {
    grid-column: 1 / -1;
    font-size: 13px;
  }
  input {
    min-width: 0;
    min-height: 40px;
    padding: 4px 12px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: #fff;
    font: inherit;
    font-size: 16px;
  }
  .nombre .btn {
    min-height: 40px;
    padding: 4px 14px;
  }
  .muted {
    color: var(--muted);
  }
  .nota {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
  .nota.ok {
    color: #2f8a3a;
  }
  .filas {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fila {
    display: grid;
    grid-template-columns: 28px 40px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: #fff;
  }
  .fila.tuyo {
    background: #fff4cc;
    box-shadow: 0 0 0 3px #ffc93c;
  }
  .fila img {
    object-fit: contain;
  }
  .pos {
    font-size: 20px;
    text-align: center;
  }
  .quien {
    display: grid;
    min-width: 0;
    font-size: 15px;
  }
  .quien strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .quien .muted {
    font-size: 12px;
  }
  .tu {
    margin-left: 4px;
    color: #b07a00;
    font-size: 12px;
  }
  .nivel {
    font-size: 16px;
    white-space: nowrap;
  }
</style>
