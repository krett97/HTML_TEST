<script lang="ts">
  import Coin from '../Coin.svelte';
  import { t } from '../../i18n';
  import { useGame } from '../context';
  import NewBadge from '../NewBadge.svelte';
  import NextDiscovery from '../NextDiscovery.svelte';
  import BuyAmount from '../BuyAmount.svelte';

  const game = useGame();
  const view = game.view;
</script>

<div class="stack">
  {#if $view.funciones.fuerza}<BuyAmount />{/if}
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
      class="btn btn--accent buy cifra"
      disabled={!$view.fuerza.alcanza}
      onclick={() => game.buyFuerza()}
      data-testid="comprar-fuerza"
      data-tuto="fuerza"
    >
      {#if $view.fuerza.cantidad > 1}<span class="qty">×{$view.fuerza.cantidad}</span>{/if}
      <span class="price"><Coin />{$view.fuerza.costo}</span>
    </button>
  </div>
  {/if}

  {#if $view.jefe.trofeos.length > 0}
    <div class="trofeos" data-testid="trofeos">
      🏆 {#each $view.jefe.trofeos as trofeo (trofeo.id)}<span>{$t(`jefes.${trofeo.id}.nombre`)} · {$t('jefe.bono', { pct: trofeo.bono })}</span>{/each}
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
      {#if $view.valor.mudanza && $view.valor.nuevoObjeto}
        <div class="effect gold" data-testid="valor-mudanza">{$t('mejoras.valorMudanza', { objeto: $t(`objetos.${$view.valor.nuevoObjeto}`) })}</div>
      {:else if $view.valor.nuevoObjeto}
        <div class="effect gold">{$t('mejoras.valorNuevo', { objeto: $t(`objetos.${$view.valor.nuevoObjeto}`) })}</div>
      {:else}
        <div class="effect">{$t('mejoras.valorEfecto', { actual: $view.ganancia, siguiente: $view.valor.gananciaSiguiente })}</div>
      {/if}
      {#if $view.valor.ultimoObjeto}
        <div class="steps muted">{$t('mejoras.valorUltimo')}</div>
        {#if $view.valor.esperaMudanza}
          <div class="steps muted" data-testid="espera-mudanza">🔒 {$t('mejoras.esperaMudanza')}</div>
        {/if}
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
      class="btn btn--accent buy cifra"
      disabled={!$view.valor.alcanza}
      onclick={() => game.buyValor()}
      data-testid="comprar-valor"
      data-tuto="valor"
    >
      {#if $view.valor.cantidad > 1}<span class="qty">×{$view.valor.cantidad}</span>{/if}
      <span class="price"><Coin />{$view.valor.costo}</span>
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
      class="btn btn--accent buy cifra"
      disabled={!$view.critico.alcanza}
      onclick={() => game.buyCritChance()}
      data-testid="comprar-critico"
    >
      {#if !$view.critico.maximo}{#if $view.critico.cantidad > 1}<span class="qty">×{$view.critico.cantidad}</span>{/if}{/if}
      {#if $view.critico.maximo}✓{:else}<span class="price"><Coin />{$view.critico.costo}</span>{/if}
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
      class="btn btn--accent buy cifra"
      disabled={!$view.danioCritico.alcanza}
      onclick={() => game.buyCritDamage()}
      data-testid="comprar-danio-critico"
    >
      {#if $view.danioCritico.cantidad > 1}<span class="qty">×{$view.danioCritico.cantidad}</span>{/if}
      <span class="price"><Coin />{$view.danioCritico.costo}</span>
    </button>
  </div>
  {/if}

  {#if $view.funciones.saco}
  <div class="card upgrade" class:fresh={$view.nuevos.includes('saco')}>
    <span class="icon" aria-hidden="true">🤵</span>
    <div class="info">
      <div class="name">
        {$t('mejoras.saco')} <span class="level">{$t('mejoras.nivel', { n: $view.saco.nivel })}</span>
        {#if $view.nuevos.includes('saco')}<NewBadge />{/if}
      </div>
      <div class="effect">{$t('mejoras.sacoEfecto', { actual: $view.saco.mult, siguiente: $view.saco.multSiguiente })}</div>
    </div>
    <button
      type="button"
      class="btn btn--accent buy cifra"
      disabled={!$view.saco.alcanza}
      onclick={() => game.buySaco()}
      data-testid="comprar-saco"
    >
      {#if $view.saco.cantidad > 1}<span class="qty">×{$view.saco.cantidad}</span>{/if}
      <span class="price"><Coin />{$view.saco.costo}</span>
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
    flex-direction: column;
    gap: 0;
    font-variant-numeric: tabular-nums;
  }
  .qty {
    font-size: 12px;
  }
  .fresh {
    border-color: var(--gold);
  }
  .trofeos {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    padding: 6px 10px;
    border: 2px solid var(--gold);
    border-radius: 4px;
    color: var(--gold);
    font-size: 13px;
    font-weight: 700;
  }
</style>
