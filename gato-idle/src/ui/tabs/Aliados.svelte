<script lang="ts">
  import { t } from '../../i18n';
  import { useGame } from '../context';

  const game = useGame();
  const view = game.view;

  const ICONS: Record<string, string> = { gatito: '🐱', perro: '🐶', perico: '🦜', mapache: '🦝' };
  const STAFF = ['camarografo', 'editor', 'seguros', 'cm'] as const;
</script>

<div class="stack">
  <div class="card summary">
    <span class="muted">{$t('aliados.titulo')}</span>
    <strong class="gold" data-testid="dps">{$t('aliados.total', { dps: $view.dpsAliados })}</strong>
  </div>

  {#each $view.aliados as ally (ally.id)}
    <div class="card upgrade" class:locked={!ally.desbloqueado}>
      <span class="icon" aria-hidden="true">{ICONS[ally.id] ?? '🐾'}</span>
      <div class="info">
        <div class="name">
          {$t(`aliados.${ally.id}`)}
          {#if ally.nivel > 0}<span class="level">{$t('mejoras.nivel', { n: ally.nivel })}</span>{/if}
        </div>
        {#if ally.desbloqueado}
          <div class="effect">
            {#if ally.nivel > 0}
              {$t('aliados.efecto', {
                accion: $t(`aliados.accion.${ally.id}`),
                segundos: ally.intervalo,
                actual: ally.danio,
                siguiente: ally.danioSiguiente,
              })}
            {:else}
              {$t('aliados.efectoNuevo', {
                accion: $t(`aliados.accion.${ally.id}`),
                segundos: ally.intervalo,
                siguiente: ally.danioSiguiente,
              })}
            {/if}
          </div>
        {:else}
          <div class="effect">🔒 {$t('aliados.bloqueado', { objeto: $t(`objetos.${ally.desbloqueo}`) })}</div>
        {/if}
      </div>
      {#if ally.desbloqueado}
        <button
          type="button"
          class="btn btn--accent buy"
          disabled={!ally.alcanza}
          onclick={() => game.buyAlly(ally.id)}
          data-testid="comprar-aliado-{ally.id}"
          aria-label="{ally.nivel > 0 ? $t('mejoras.nivel', { n: ally.nivel + 1 }) : $t('aliados.adoptar')} {$t(`aliados.${ally.id}`)} ${ally.costo}"
        >
          {#if ally.nivel === 0}<span class="adopt">{$t('aliados.adoptar')}</span>{/if}
          ${ally.costo}
        </button>
      {/if}
    </div>
  {/each}

  <h3>{$t('personal.titulo')}</h3>
  <ul class="staff">
    {#each STAFF as id (id)}
      <li>{$t(`personal.${id}`)}</li>
    {/each}
  </ul>
  <p class="muted small">🔒 {$t('personal.pronto')}</p>
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
  .summary {
    display: grid;
    gap: 2px;
    font-size: 14px;
  }
  .gold {
    color: var(--gold);
  }
  .upgrade {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
  }
  .locked {
    opacity: 0.6;
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
    flex-direction: column;
    gap: 0;
    font-variant-numeric: tabular-nums;
  }
  .adopt {
    font-size: 12px;
    font-weight: 400;
  }
  h3 {
    margin: 8px 2px 0;
    font-size: 15px;
    color: var(--muted);
  }
  .staff {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .staff li {
    padding: 4px 8px;
    border: 2px solid var(--line);
    border-radius: 4px;
    color: var(--muted);
    font-size: 13px;
  }
  .small {
    margin: 0 2px;
    font-size: 13px;
  }
</style>
