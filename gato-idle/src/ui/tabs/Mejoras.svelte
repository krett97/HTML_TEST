<script lang="ts">
  import { t } from '../../i18n';
  import { useGame } from '../context';

  const view = useGame().view;
</script>

<div class="card">
  <div class="row">
    <span class="muted">{$t('mejoras.enLaMesa')}</span>
    <strong data-testid="objeto">{$t(`objetos.${$view.objetoId}`)}</strong>
  </div>
  <div class="bar" role="progressbar" aria-label={$t('mejoras.progreso')} aria-valuenow={Math.round($view.progreso * 100)}>
    <div class="fill" style:width="{$view.progreso * 100}%"></div>
  </div>
  <div class="stats">
    <span>{$t('mejoras.toques')}: <strong data-testid="toques">{$view.toques}</strong></span>
    <span>{$t('mejoras.roturas')}: <strong data-testid="roturas">{$view.roturas}</strong></span>
  </div>
</div>

<p class="muted soon">{$t('mejoras.pronto')}</p>

<style>
  .card {
    padding: 12px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  .row,
  .stats {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .bar {
    height: 12px;
    margin: 10px 0;
    border: 2px solid var(--line);
    background: var(--bg);
  }
  .fill {
    height: 100%;
    background: var(--accent);
    transition: width 90ms ease-out;
  }
  .stats {
    font-size: 14px;
    color: var(--muted);
  }
  .stats strong {
    color: var(--text);
  }
  .soon {
    margin: 14px 2px 0;
    font-size: 14px;
  }
</style>
