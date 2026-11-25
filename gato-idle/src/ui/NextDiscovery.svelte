<script lang="ts">
  import Icon from './Icon.svelte';
  import { t } from '../i18n';
  import { useGame } from './context';

  const view = useGame().view;
  const next = $derived($view.proximo);
  const remaining = $derived(next ? next.meta - next.actual : 0);
</script>

<div class="card" data-testid="proximo" data-tuto="meta">
  <span class="icon"><Icon name="pregunta" size={30} /></span>
  <div class="info">
    <div class="label">{$t('descubrimientos.proximo')}</div>
    {#if next}
      <div class="hint">
        {next.tipo === 'aliado' ? $t('descubrimientos.pistaAliado') : $t('descubrimientos.pistaFuncion')}
        ·
        {next.condicion === 'roturas'
          ? $t('descubrimientos.roturas', { n: remaining })
          : $t('descubrimientos.objeto')}
      </div>
      <div class="bar" role="progressbar" aria-valuenow={Math.round((next.actual / Math.max(1, next.meta)) * 100)}>
        <div class="fill" style:width="{(next.actual / Math.max(1, next.meta)) * 100}%"></div>
      </div>
    {:else}
      <div class="hint">{$t('descubrimientos.todo')}</div>
    {/if}
  </div>
</div>

<style>
  .card {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border: 2px dashed var(--gold);
    border-radius: 4px;
    background: var(--bg);
  }
  .icon {
    font-size: 22px;
  }
  .info {
    min-width: 0;
  }
  .label {
    color: var(--gold);
    font-weight: 700;
    font-size: 14px;
  }
  .hint {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--muted);
    font-size: 13px;
  }
  .bar {
    height: 6px;
    margin-top: 4px;
    border: 2px solid var(--line);
    background: var(--panel);
  }
  .fill {
    height: 100%;
    background: var(--gold);
    transition: width 200ms ease-out;
  }
  /* Pantallas bajas: una sola línea para dejarle sitio a la escena. */
  @media (max-height: 640px) {
    .card {
      padding: 4px 10px;
    }
    .label {
      display: none;
    }
    .bar {
      margin-top: 2px;
    }
  }
</style>
