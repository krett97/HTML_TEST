<script lang="ts">
  import { t } from '../../i18n';
  import { useGame } from '../context';
  import NewBadge from '../NewBadge.svelte';

  const game = useGame();
  const view = game.view;

  const ICONS: Record<string, string> = {
    gatito: '🐱',
    raton: '🐭',
    perro: '🐶',
    perico: '🦜',
    cuervo: '🐦‍⬛',
    mapache: '🦝',
    cabra: '🐐',
  };

  const unlocked = $derived($view.aliados.filter((a) => a.desbloqueado));
  /** Solo se asoma el siguiente, sin nombre: lo demás es sorpresa. */
  const teaser = $derived($view.aliados.find((a) => !a.desbloqueado));
</script>

<div class="stack">
  <div class="card summary">
    <span class="muted">{$t('aliados.titulo')}</span>
    <strong class="gold" data-testid="dps">{$t('aliados.total', { dps: $view.dpsAliados })}</strong>
  </div>

  {#each unlocked as ally (ally.id)}
    <div class="card upgrade" class:fresh={$view.nuevos.includes(`aliado:${ally.id}`)}>
      <span class="icon" aria-hidden="true">{ICONS[ally.id] ?? '🐾'}</span>
      <div class="info">
        <div class="name">
          {$t(`aliados.${ally.id}`)}
          {#if ally.nivel > 0}<span class="level">{$t('mejoras.nivel', { n: ally.nivel })}</span>{/if}
          {#if $view.nuevos.includes(`aliado:${ally.id}`)}<NewBadge />{/if}
        </div>
        <div class="gain">
          <span class="gold">{$t('aliados.ganancia', { dps: ally.ganancia })}</span>
          {#if ally.mejor}<span class="best" data-testid="mejor-{ally.id}">{$t('aliados.mejor')}</span>{/if}
        </div>
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
      </div>
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
    </div>
  {/each}

  {#if teaser}
    <div class="card upgrade locked" data-testid="aliado-oculto">
      <span class="icon" aria-hidden="true">❔</span>
      <div class="info">
        <div class="name">{$t('aliados.oculto')}</div>
        <div class="effect">
          🔒 {$t('aliados.pista')} ·
          {teaser.condicion.objeto
            ? $t('descubrimientos.objeto')
            : $t('descubrimientos.roturas', { n: Math.max(0, (teaser.condicion.roturas ?? 0) - $view.roturas) })}
        </div>
      </div>
    </div>
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
  .fresh {
    border-color: var(--gold);
  }
  .gain {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 13px;
  }
  .best {
    padding: 0 5px;
    border-radius: 4px;
    background: var(--good);
    color: var(--line);
    font-weight: 700;
    font-size: 12px;
  }
</style>
