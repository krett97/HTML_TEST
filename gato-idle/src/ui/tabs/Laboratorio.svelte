<script lang="ts">
  import type { Effect } from '../../core/modifiers';
  import { formatDuration } from '../../core/time';
  import { t } from '../../i18n';
  import { useGame } from '../context';

  const game = useGame();
  const view = game.view;

  const lab = $derived($view.laboratorio);
  const busy = $derived(lab.actual !== null);
  /** Hechas, la que está en curso, las disponibles y solo una secreta por delante. */
  const visible = $derived.by(() => {
    // La que está en curso ya se ve arriba.
    const firstLocked = lab.proyectos.findIndex((p) => p.estado === 'bloqueada');
    const shown = firstLocked === -1 ? lab.proyectos : lab.proyectos.slice(0, firstLocked + 1);
    return shown.filter((p) => p.estado !== 'en-curso');
  });

  const adopted = $derived($view.aliados.filter((a) => a.nivel > 0).length);

  function describe(effects: Effect[]): string {
    return effects
      .map((e) =>
        e.escala === 'aliados'
          ? $t('laboratorio.porAliado', {
              pct: Math.round(e.valor * 100),
              stat: $t(`laboratorio.stats.${e.stat}`),
              ahora: Math.round((1 + e.valor * adopted) * 100) / 100,
            })
          : `×${e.valor} ${$t(`laboratorio.stats.${e.stat}`)}`,
      )
      .join(' · ');
  }
</script>

<div class="stack">
  <div class="card intro">
    <strong>🧪 {$t('laboratorio.titulo')}</strong>
    <span class="muted">{$t('laboratorio.intro')}</span>
  </div>

  {#if lab.actual}
    {@const actual = lab.actual}
    <div class="card running" data-testid="investigacion-actual">
      <div class="row">
        <strong>{$t('laboratorio.enCurso', { nombre: $t(`laboratorio.proyectos.${actual.id}`) })}</strong>
      </div>
      <div class="bar" role="progressbar" aria-valuenow={Math.round((1 - actual.restante / actual.duracion) * 100)}>
        <div class="fill" style:width="{(1 - actual.restante / actual.duracion) * 100}%"></div>
      </div>
      <span class="muted small">{$t('laboratorio.falta', { tiempo: formatDuration(actual.restante) })}</span>
    </div>
  {/if}

  <ul class="list">
    {#each visible as project (project.id)}
      <li class="card upgrade" class:done={project.estado === 'hecha'} class:locked={project.estado === 'bloqueada'}>
        <span class="icon" aria-hidden="true">{project.estado === 'hecha' ? '✅' : project.estado === 'bloqueada' ? '🔒' : '🔬'}</span>
        <div class="info">
          {#if project.estado === 'bloqueada'}
            <div class="name">{$t('laboratorio.oculta')}</div>
            <div class="effect">
              {project.alcanzado ? $t('laboratorio.despues') : $t('laboratorio.requiere')}
            </div>
          {:else}
            <div class="name">{$t(`laboratorio.proyectos.${project.id}`)}</div>
            <div class="effect">
              {describe(project.efectos)}
              {#if project.estado === 'disponible'} · {$t('laboratorio.dura', { tiempo: formatDuration(project.duracion) })}{/if}
            </div>
          {/if}
        </div>
        {#if project.estado === 'hecha'}
          <span class="tag">{$t('laboratorio.hecha')}</span>
        {:else if project.estado === 'disponible'}
          <button
            type="button"
            class="btn btn--accent buy"
            disabled={busy || !project.alcanza}
            title={busy ? $t('laboratorio.ocupado') : undefined}
            onclick={() => game.startResearch(project.id)}
            data-testid="investigar-{project.id}"
          >
            <span class="small-label">{$t('laboratorio.investigar')}</span>
            ${project.costo}
          </button>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .stack,
  .list {
    display: grid;
    gap: 8px;
  }
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .card {
    padding: 10px 12px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  .intro {
    display: grid;
    gap: 4px;
    font-size: 14px;
  }
  .running {
    border-color: var(--good);
  }
  .bar {
    height: 10px;
    margin: 8px 0 4px;
    border: 2px solid var(--line);
    background: var(--bg);
  }
  .fill {
    height: 100%;
    background: var(--good);
    transition: width 900ms linear;
  }
  .upgrade {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
  }
  .icon {
    font-size: 22px;
  }
  .info {
    min-width: 0;
  }
  .name {
    font-weight: 700;
  }
  .effect,
  .small {
    font-size: 13px;
    color: var(--muted);
  }
  .done {
    opacity: 0.75;
  }
  .locked {
    opacity: 0.6;
  }
  .tag {
    color: var(--good);
    font-size: 13px;
  }
  .buy {
    min-width: 92px;
    flex-direction: column;
    gap: 0;
  }
  .small-label {
    font-size: 12px;
    font-weight: 400;
  }
</style>
