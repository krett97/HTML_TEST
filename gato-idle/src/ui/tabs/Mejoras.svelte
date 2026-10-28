<script lang="ts">
  import { t } from '../../i18n';
  import { useGame } from '../context';
  import NewBadge from '../NewBadge.svelte';
  import NextDiscovery from '../NextDiscovery.svelte';

  const game = useGame();
  const view = game.view;

  const TOOL_ICONS: Record<string, string> = { pata: '🐾', garras: '🗡️', carrito: '🏎️', aspiradora: '🤖' };

  /** Nombre del primer objeto que desbloquea una herramienta. */
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
      {#if $view.valor.requiere}
        <div class="effect warn">🔒 {$t('mejoras.valorRequiere', { herramienta: $t(`herramientas.${$view.valor.requiere}`) })}</div>
      {:else if $view.valor.nuevoObjeto}
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
    {#if $view.valor.requiere}
      {@const toolId = $view.valor.requiere}
      <button
        type="button"
        class="btn btn--accent buy"
        disabled={!$view.valor.alcanzaHerramienta}
        onclick={() => game.buyTool(toolId)}
        data-testid="comprar-herramienta-valor"
        aria-label="{$t(`herramientas.${toolId}`)} ${$view.valor.costoHerramienta}"
      >
        {TOOL_ICONS[toolId] ?? '🔧'} ${$view.valor.costoHerramienta}
      </button>
    {:else}
      <button
        type="button"
        class="btn btn--accent buy"
        disabled={!$view.valor.alcanza}
        onclick={() => game.buyValor()}
        data-testid="comprar-valor"
      >
        ${$view.valor.costo}
      </button>
    {/if}
  </div>
  {/if}

  {#if $view.funciones.herramientas}
  <h3>{$t('mejoras.herramientas')} {#if $view.nuevos.includes('herramientas')}<NewBadge />{/if}</h3>
  <ul class="tools">
    {#each $view.herramientas as tool (tool.id)}
      <li class="card upgrade tool" class:owned={tool.estado === 'comprada'} class:locked={tool.estado === 'bloqueada'}>
        <span class="icon" aria-hidden="true">{TOOL_ICONS[tool.id] ?? '🔧'}</span>
        <div class="info">
          <div class="name">{$t(`herramientas.${tool.id}`)}</div>
          <div class="effect">
            {#if tool.mult > 1}{$t('mejoras.multiplicador', { mult: tool.mult })} · {/if}{tool.objetos
              .map((id) => $t(`objetos.${id}`))
              .join(', ')}
          </div>
        </div>
        {#if tool.estado === 'comprada'}
          <span class="tag">✓ {$t('mejoras.tuya')}</span>
        {:else if tool.estado === 'disponible'}
          <button
            type="button"
            class="btn btn--accent buy"
            disabled={!tool.alcanza}
            onclick={() => game.buyTool(tool.id)}
            data-testid="comprar-herramienta"
          >
            ${tool.costo}
          </button>
        {:else}
          <span class="tag muted">🔒 {$t('mejoras.bloqueada')}</span>
        {/if}
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
  .warn {
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
  h3 {
    margin: 8px 2px 0;
    font-size: 15px;
    color: var(--muted);
  }
  .tools {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fresh {
    border-color: var(--gold);
  }
  .tool.locked {
    opacity: 0.6;
  }
  .tag {
    max-width: 120px;
    font-size: 13px;
    text-align: right;
  }
  .owned .tag {
    color: var(--good);
  }
</style>
