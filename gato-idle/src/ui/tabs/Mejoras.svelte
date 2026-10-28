<script lang="ts">
  import { t } from '../../i18n';
  import { useGame } from '../context';
  import NewBadge from '../NewBadge.svelte';
  import NextDiscovery from '../NextDiscovery.svelte';

  const game = useGame();
  const view = game.view;
</script>

<div class="stack">
  <div class="card current">
    <div class="row">
      <span class="muted">{$t('mejoras.enLaMesa')}</span>
      <strong data-testid="objeto">{$t(`objetos.${$view.objetoId}`)}</strong>
    </div>
    <div
      class="bar"
      role="progressbar"
      aria-label={$t('mejoras.progreso')}
      aria-valuenow={Math.round($view.progreso * 100)}
    >
      <div class="fill" style:width="{$view.progreso * 100}%"></div>
    </div>
    <div class="row small">
      <span>{$view.golpes === 1 ? $t('mejoras.golpe') : $t('mejoras.golpes', { n: $view.golpes })}</span>
      <span class="gold">{$t('mejoras.porRotura', { dinero: $view.ganancia })}</span>
    </div>
  </div>

  <NextDiscovery />

  {#if $view.funciones.fuerza}
  <div class="card upgrade" class:fresh={$view.nuevos.includes('fuerza')}>
    <span class="icon" aria-hidden="true">💪</span>
    <div class="info">
      <div class="name">
        {$t('mejoras.fuerza')} <span class="level">{$t('mejoras.nivel', { n: $view.fuerza.nivel })}</span>
        {#if $view.nuevos.includes('fuerza')}<NewBadge />{/if}
      </div>
      <div class="effect">{$t('mejoras.fuerzaEfecto', { actual: $view.danio, siguiente: $view.fuerza.danioSiguiente })}</div>
    </div>
    <button
      type="button"
      class="btn btn--accent buy"
      disabled={!$view.fuerza.alcanza}
      onclick={() => game.buyFuerza()}
      data-testid="comprar-fuerza"
    >
      ${$view.fuerza.costo}
    </button>
  </div>
  {/if}

  {#if $view.funciones.valor}
  <div class="card upgrade" class:fresh={$view.nuevos.includes('valor')}>
    <span class="icon" aria-hidden="true">💎</span>
    <div class="info">
      <div class="name">
        {$t('mejoras.valor')} <span class="level">{$t('mejoras.nivel', { n: $view.valor.nivel })}</span>
        {#if $view.nuevos.includes('valor')}<NewBadge />{/if}
      </div>
      {#if $view.valor.nuevoObjeto}
        <div class="effect gold">{$t('mejoras.valorNuevo', { objeto: $t(`objetos.${$view.valor.nuevoObjeto}`) })}</div>
      {:else}
        <div class="effect">{$t('mejoras.valorEfecto', { actual: $view.ganancia, siguiente: $view.valor.gananciaSiguiente })}</div>
      {/if}
      {#if $view.valor.ultimoObjeto}
        <div class="steps muted">{$t('mejoras.valorUltimo')}</div>
      {:else}
        <div class="steps" title={$t('mejoras.valorEtapa', { n: $view.valor.enObjeto, total: $view.valor.porObjeto })}>
          {#each { length: $view.valor.porObjeto } as _, i (i)}
            <span class="pip" class:on={i < $view.valor.enObjeto}></span>
          {/each}
        </div>
      {/if}
    </div>
    <button
      type="button"
      class="btn btn--accent buy"
      disabled={!$view.valor.alcanza}
      onclick={() => game.buyValor()}
      data-testid="comprar-valor"
    >
      ${$view.valor.costo}
    </button>
  </div>
  {/if}

  {#if $view.funciones.critico}
  <div class="card upgrade" class:fresh={$view.nuevos.includes('critico')}>
    <span class="icon" aria-hidden="true">🗡️</span>
    <div class="info">
      <div class="name">
        {$t('mejoras.critico')} <span class="level">{$t('mejoras.nivel', { n: $view.critico.nivel })}</span>
        {#if $view.nuevos.includes('critico')}<NewBadge />{/if}
      </div>
      <div class="effect">
        {$view.critico.maximo
          ? $t('mejoras.criticoMax', { actual: $view.critico.prob })
          : $t('mejoras.criticoEfecto', { actual: $view.critico.prob, siguiente: $view.critico.probSiguiente })}
      </div>
    </div>
    <button
      type="button"
      class="btn btn--accent buy"
      disabled={!$view.critico.alcanza}
      onclick={() => game.buyCritChance()}
      data-testid="comprar-critico"
    >
      {$view.critico.maximo ? '✓' : `$${$view.critico.costo}`}
    </button>
  </div>
  {/if}

  {#if $view.funciones.danioCritico}
  <div class="card upgrade" class:fresh={$view.nuevos.includes('danioCritico')}>
    <span class="icon" aria-hidden="true">🎩</span>
    <div class="info">
      <div class="name">
        {$t('mejoras.danioCritico')} <span class="level">{$t('mejoras.nivel', { n: $view.danioCritico.nivel })}</span>
        {#if $view.nuevos.includes('danioCritico')}<NewBadge />{/if}
      </div>
      <div class="effect">
        {$t('mejoras.danioCriticoEfecto', { actual: $view.danioCritico.mult, siguiente: $view.danioCritico.multSiguiente })}
      </div>
    </div>
    <button
      type="button"
      class="btn btn--accent buy"
      disabled={!$view.danioCritico.alcanza}
      onclick={() => game.buyCritDamage()}
      data-testid="comprar-danio-critico"
    >
      ${$view.danioCritico.costo}
    </button>
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
  .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .small {
    font-size: 14px;
  }
  .bar {
    height: 12px;
    margin: 8px 0;
    border: 2px solid var(--line);
    background: var(--bg);
  }
  .fill {
    height: 100%;
    background: var(--accent);
    transition: width 90ms ease-out;
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
  .gold {
    color: var(--gold);
  }
  .steps {
    display: flex;
    gap: 3px;
    margin-top: 5px;
    font-size: 12px;
  }
  .pip {
    width: 10px;
    height: 6px;
    border: 1px solid var(--line);
    background: var(--bg);
  }
  .pip.on {
    background: var(--gold);
  }
  .buy {
    min-width: 84px;
    font-variant-numeric: tabular-nums;
  }
  .fresh {
    border-color: var(--gold);
  }
</style>
