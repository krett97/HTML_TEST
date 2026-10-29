<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '../../i18n';
  import { useGame } from '../context';
  import Arbol from './Arbol.svelte';

  const game = useGame();
  const view = game.view;

  // Subir reinicia la partida: pide dos toques (sin diálogos del navegador).
  let confirming = $state(false);
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;
  onDestroy(() => clearTimeout(confirmTimer));

  function upload() {
    if (!confirming) {
      confirming = true;
      confirmTimer = setTimeout(() => (confirming = false), 4000);
      return;
    }
    clearTimeout(confirmTimer);
    confirming = false;
    game.uploadVideo();
  }

  // Con anuncio el video vale el doble; el anuncio mismo es la confirmación.
  let watchingAd = $state(false);
  async function uploadWithAd() {
    clearTimeout(confirmTimer);
    confirming = false;
    watchingAd = true;
    await game.uploadVideoWithAd();
    watchingAd = false;
  }

  function title(plantilla: number, objeto: string, roturas: number): string {
    return $t(`canal.titulos.${plantilla}`, { objeto: $t(`objetos.${objeto}`), n: roturas });
  }
</script>

<div class="stack">
  <div class="card stats">
    <div class="stat-title small gold">🏆 {$t('canal.record')}</div>
    <div class="stat">
      <span class="muted">{$t('canal.seguidores')}</span>
      <strong class="cifra" data-testid="seguidores">👥 {$view.canal.seguidores}</strong>
      <span class="small gold">{$t('canal.bono', { pct: $view.canal.bono })}</span>
    </div>
    <div class="stat">
      <span class="muted">{$t('canal.visualizaciones')}</span>
      <strong class="cifra" data-testid="visualizaciones">👁️ {$view.canal.totales}</strong>
      <span class="small muted">{$t('canal.totalHistorico')}</span>
    </div>
  </div>

  <div class="card recording">
    <div class="rec-title"><span class="rec-dot" aria-hidden="true"></span> {$t('canal.grabando')}</div>
    <div class="small muted">
      {$t('canal.resumen', { n: $view.canal.grabando.roturas, objeto: $t(`objetos.${$view.canal.grabando.objeto}`) })}
    </div>
    {#if $view.canal.grabando.listo}
      <div class="small gold" data-testid="si-subes">
        {$t('canal.siSubes', { seguidores: $view.canal.grabando.seguidores, visualizaciones: $view.canal.grabando.visualizaciones })}
      </div>
      <div class="small muted">{$t('canal.probViral', { pct: $view.canal.viral })}</div>
    {:else}
      <div class="small muted">🔒 {$t('canal.faltaMas')}</div>
    {/if}
    <button
      type="button"
      class="btn btn--accent upload"
      class:confirming
      disabled={!$view.canal.grabando.listo}
      onclick={upload}
      data-testid="subir-video"
      data-tuto="video"
    >
      {confirming ? $t('canal.confirmar') : $t('canal.subir')}
    </button>
    {#if $view.canal.grabando.listo}
      <button type="button" class="btn btn--gold upload doble" disabled={watchingAd} onclick={uploadWithAd} data-testid="subir-doble">
        {$t('canal.subirDoble', { seguidores: $view.canal.grabando.seguidoresDoble, visualizaciones: $view.canal.grabando.visualizacionesDoble })}
      </button>
    {/if}
    <p class="small muted note">{$t('canal.explica')}</p>
  </div>

  {#if $view.canal.mudanza}
    {@const mudanza = $view.canal.mudanza}
    <!-- La mudanza: se desbloquea al juntar seguidores y visualizaciones (no se gastan). -->
    <div class="card move" class:ready={mudanza.desbloqueada} data-testid="mudanza">
      <div class="name">🚚 {$t('canal.mudanza.titulo', { casa: $t(`casas.${mudanza.siguiente}`) })}</div>
      <p class="small muted note">
        {mudanza.desbloqueada ? $t('canal.mudanza.lista') : $t('canal.mudanza.explica')}
      </p>
      {#each [['seguidores', '👥', mudanza.seguidores], ['visualizaciones', '👁️', mudanza.visualizaciones]] as const as [recurso, icono, meta] (recurso)}
        <div class="goal" title={$t(`canal.meta.${recurso}`, { tiene: meta.tiene, meta: meta.meta })}>
          <span class="goal-icon" aria-hidden="true">{icono}</span>
          <span class="goal-bar"><span class="goal-fill" style:width="{meta.progreso * 100}%"></span></span>
          <span class="goal-text cifra">{meta.tiene}/{meta.meta}</span>
        </div>
      {/each}
    </div>
  {/if}

  <h3>{$t('canal.habilidades')}</h3>
  <Arbol />

  <h3>{$t('canal.videos')}</h3>
  {#if $view.canal.videos.length === 0}
    <p class="small muted intro">{$t('canal.sinVideos')}</p>
  {:else}
    <ul class="videos">
      {#each $view.canal.videos as video, i (i)}
        <li class="card video">
          <span class="thumb" aria-hidden="true">▶</span>
          <div class="info">
            <div class="video-title">{title(video.plantilla, video.objeto, video.roturas)}</div>
            <div class="small muted">
              {$t('canal.videoStats', { seguidores: video.seguidores, visualizaciones: video.visualizaciones })}
              {#if video.viral}<span class="viral">{$t('canal.viral')}</span>{/if}
              {#if video.doble}<span class="viral">📺 ×2</span>{/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .stack {
    display: grid;
    gap: 8px;
  }
  .card {
    padding: 10px 12px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .stat {
    display: grid;
    gap: 2px;
  }
  .stat strong {
    font-size: 20px;
  }
  .stat-title {
    grid-column: 1 / -1;
    margin-bottom: -6px;
    font-weight: 700;
  }
  .info {
    min-width: 0;
  }
  .move {
    border-color: var(--line);
  }
  .move.ready {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgba(255, 211, 110, 0.35);
  }
  .recording {
    display: grid;
    gap: 6px;
    border-color: var(--danger);
  }
  .rec-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
  }
  .rec-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--danger);
    animation: parpadeo 1s steps(2, start) infinite;
  }
  @keyframes parpadeo {
    to {
      visibility: hidden;
    }
  }
  .upload {
    width: 100%;
  }
  .upload.confirming {
    background: var(--danger);
    color: var(--text);
  }
  .note {
    margin: 0;
  }
  h3 {
    margin: 8px 2px 0;
    font-size: 15px;
    color: var(--muted);
  }
  .intro {
    margin: 0 2px;
  }
  .goal {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  .goal-bar {
    height: 8px;
    border: 1px solid var(--line);
    background: var(--bg);
  }
  .goal-fill {
    display: block;
    height: 100%;
    background: var(--gold);
    transition: width 300ms ease-out;
  }
  .move {
    display: grid;
    gap: 4px;
  }
  .move .name {
    font-weight: 700;
  }
  .videos {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .video {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 10px;
  }
  .thumb {
    display: grid;
    place-items: center;
    width: 40px;
    height: 28px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--danger);
    color: var(--text);
    font-size: 12px;
  }
  .video-title {
    font-size: 14px;
    font-weight: 700;
  }
  .viral {
    margin-left: 6px;
    color: var(--accent);
    font-weight: 700;
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
