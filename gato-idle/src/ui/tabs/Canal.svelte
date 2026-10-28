<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '../../i18n';
  import { useGame } from '../context';

  const game = useGame();
  const view = game.view;

  const SKILL_ICONS: Record<string, string> = { embestida: '🏎️', recolectora: '🤖', pandilla: '🐾', express: '🧪' };

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

  function title(plantilla: number, objeto: string, roturas: number): string {
    return $t(`canal.titulos.${plantilla}`, { objeto: $t(`objetos.${objeto}`), n: roturas });
  }
</script>

<div class="stack">
  <div class="card stats">
    <div class="stat">
      <span class="muted">{$t('canal.seguidores')}</span>
      <strong data-testid="seguidores">👥 {$view.canal.seguidores}</strong>
      <span class="small gold">{$t('canal.bono', { pct: $view.canal.bono })}</span>
    </div>
    <div class="stat">
      <span class="muted">{$t('canal.visualizaciones')}</span>
      <strong data-testid="visualizaciones">👁️ {$view.canal.visualizaciones}</strong>
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
    >
      {confirming ? $t('canal.confirmar') : $t('canal.subir')}
    </button>
    <p class="small muted note">{$t('canal.explica')}</p>
  </div>

  <h3>{$t('canal.habilidades')}</h3>
  <p class="small muted intro">{$t('canal.habilidadesIntro')}</p>
  {#each $view.canal.habilidades as skill (skill.id)}
    <div class="card upgrade">
      <span class="icon" aria-hidden="true">{SKILL_ICONS[skill.id] ?? '✨'}</span>
      <div class="info">
        <div class="name">
          {$t(`canal.nombres.${skill.id}`)}
          <span class="level">{skill.maximo ? $t('canal.max') : `${skill.nivel}/${skill.max}`}</span>
        </div>
        <div class="effect">{$t(`canal.efectos.${skill.id}`, { actual: skill.actual, siguiente: skill.siguiente })}</div>
      </div>
      <button
        type="button"
        class="btn btn--accent buy"
        disabled={!skill.alcanza}
        onclick={() => game.buySkill(skill.id)}
        data-testid="habilidad-{skill.id}"
      >
        {skill.maximo ? '✓' : `👁️ ${skill.costo}`}
      </button>
    </div>
  {/each}

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
  .upgrade {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
  }
  .icon {
    font-size: 24px;
    line-height: 1;
  }
  .info {
    min-width: 0;
  }
  .name {
    font-weight: 700;
  }
  .level {
    margin-left: 4px;
    color: var(--muted);
    font-weight: 400;
    font-size: 14px;
  }
  .effect {
    font-size: 13px;
    color: var(--muted);
  }
  .buy {
    min-width: 84px;
    font-variant-numeric: tabular-nums;
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
