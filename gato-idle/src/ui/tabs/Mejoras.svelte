<script lang="ts">
  // La pantalla principal: sin scroll. Arriba la franja del nivel y el selector
  // ×1/×10; abajo los botones grandes que más se usan (Fuerza y Valor) y "Más mejoras", que abre una
  // ventana con el resto (críticos, sombrero, saco, garras marcadoras y los trofeos).
  import { bossText } from '../bossText';
  import Icon from '../Icon.svelte';
  import Rich from '../Rich.svelte';
  import Coin from '../Coin.svelte';
  import { t } from '../../i18n';
  import { useGame } from '../context';
  import NewBadge from '../NewBadge.svelte';
  import BuyAmount from '../BuyAmount.svelte';

  const game = useGame();
  const view = game.view;
  let masAbierto = $state(false);

  /** Las mejoras secundarias ya descubiertas, con si alcanza para comprarlas. */
  const extras = $derived(
    (
      [
        ['critico', $view.funciones.critico, $view.critico.alcanza && !$view.critico.maximo],
        ['danioCritico', $view.funciones.danioCritico, $view.danioCritico.alcanza],
        ['saco', $view.funciones.saco, $view.saco.alcanza],
        ['marca', $view.funciones.marca, $view.marca.alcanza && !$view.marca.maximo],
      ] as const
    ).filter(([, visible]) => visible),
  );
  const listas = $derived(extras.filter(([, , alcanza]) => alcanza).length);
  const nuevosExtras = $derived(extras.some(([id]) => $view.nuevos.includes(id)));
  const pipsTotal = $derived(Math.min(10, $view.nivel.meta));
  const pipsOn = $derived(Math.floor(($view.nivel.roturas / $view.nivel.meta) * pipsTotal));
</script>

<div class="juego">
  <!-- Franja del nivel: cuántos van rotos de los que pide; ◀ ▶ ponen en la mesa un nivel ya pasado. -->
  <div class="franja" data-testid="nivel" data-tuto="meta">
    <button type="button" class="nav" aria-label={$t('mejoras.nivelAtras')} disabled={$view.nivel.jugando <= 0} onclick={() => game.goToLevel(-1)} data-testid="nivel-atras">◀</button>
    <div class="nivel-info">
      <div class="nivel-top">
        <strong data-testid="objeto">{$t(`objetos.${$view.objetoId}`)}</strong>
        <span class="muted">{$t('mejoras.nivelDe', { n: $view.nivel.jugando + 1, total: $view.nivel.total })}</span>
      </div>
      {#if $view.nivel.enEtapa}
        <div class="nivel-sub">
          <span class="pips" aria-hidden="true">{#each { length: pipsTotal } as _, i (i)}<span class="pip" class:on={i < pipsOn}></span>{/each}</span>
          <span class="gold" data-testid="nivel-progreso">{$view.nivel.terminado ? $t('mejoras.nivelListo') : $t('mejoras.nivelProgreso', { roturas: $view.nivel.roturas, meta: $view.nivel.meta })}</span>
        </div>
        {#if $view.nivel.terminado && $view.nivel.puerta === 'miniJefe'}
          <div class="aviso" data-testid="espera-guardian"><Icon name="corona" /> {$t('mejoras.guardianEspera')}</div>
        {:else if $view.nivel.terminado && $view.nivel.puerta === 'jefe'}
          <div class="aviso" data-testid="espera-jefe"><Icon name="calavera" /> {$t('mejoras.jefeEspera')}</div>
        {:else if $view.nivel.terminado && $view.nivel.puerta === 'mudanza'}
          <div class="aviso" data-testid="espera-mudanza"><Icon name="candado" /> <Rich text={$view.nivel.esperaJefe ? $t('mejoras.esperaJefe', bossText($t, $view.nivel.esperaJefe)) : $t('mejoras.esperaMudanza')} /></div>
        {/if}
      {:else}
        <div class="nivel-sub">
          <span class="muted">{$t('mejoras.juntandoCorto')}</span>
          <button type="button" class="btn frente" onclick={() => game.goToLevel('frente')} data-testid="nivel-frente">{$t('mejoras.alFrente')}</button>
        </div>
      {/if}
    </div>
    <button type="button" class="nav" aria-label={$t('mejoras.nivelAdelante')} disabled={$view.nivel.enEtapa} onclick={() => game.goToLevel(1)} data-testid="nivel-adelante">▶</button>
  </div>

  {#if $view.funciones.fuerza}
    <div class="compra"><BuyAmount /></div>
    <!-- Los botones grandes: lo que más se toca, siempre a la vista. -->
    <div class="grandes">
      <button
        type="button"
        class="grande"
        class:fresh={$view.nuevos.includes('fuerza')}
        disabled={!$view.fuerza.alcanza}
        onclick={() => game.buyFuerza()}
        data-testid="comprar-fuerza"
        data-tuto="fuerza"
      >
        <span class="g-cabeza"><span class="g-icon"><Icon name="fuerza" size={26} /></span><span class="g-nivel cifra">{$t('mejoras.nivel', { n: $view.fuerza.nivel })}</span></span>
        <span class="g-nombre">{$t('mejoras.fuerza')}</span>{#if $view.nuevos.includes('fuerza')}<span class="g-nuevo"><NewBadge /></span>{/if}
        <span class="g-efecto">{$t('mejoras.fuerzaEfecto', { actual: $view.danio, siguiente: $view.fuerza.danioSiguiente })}</span>
        <span class="g-precio cifra"><Coin />{$view.fuerza.costo}{#if $view.fuerza.cantidad > 1}<small>×{$view.fuerza.cantidad}</small>{/if}</span>
      </button>
      {#if $view.funciones.valor}
        <button
          type="button"
          class="grande"
          class:fresh={$view.nuevos.includes('valor')}
          disabled={!$view.valor.alcanza}
          onclick={() => game.buyValor()}
          data-testid="comprar-valor"
          data-tuto="valor"
        >
          <span class="g-cabeza"><span class="g-icon"><Icon name="valor" size={26} /></span><span class="g-nivel cifra">{$t('mejoras.nivel', { n: $view.valor.nivel })}</span></span>
          <span class="g-nombre">{$t('mejoras.valor')}</span>{#if $view.nuevos.includes('valor')}<span class="g-nuevo"><NewBadge /></span>{/if}
          <span class="g-efecto">{$t('mejoras.valorCorto', { actual: $view.ganancia, siguiente: $view.valor.gananciaSiguiente })}</span>
          <span class="g-precio cifra"><Coin />{$view.valor.costo}{#if $view.valor.cantidad > 1}<small>×{$view.valor.cantidad}</small>{/if}</span>
        </button>
      {/if}
      {#if extras.length > 0}
        <button type="button" class="grande mas" class:lista={listas > 0} class:fresh={nuevosExtras} onclick={() => (masAbierto = true)} data-testid="abrir-mas">
          <span class="g-cabeza"><span class="g-icon"><Icon name="critico" size={26} /></span>{#if listas > 0}<span class="g-nivel punto cifra">{listas}</span>{/if}</span>
          <span class="g-nombre">{$t('mejoras.masMejoras')}</span>{#if nuevosExtras}<span class="g-nuevo"><NewBadge /></span>{/if}
          <span class="g-efecto">{listas > 0 ? $t('mejoras.listas', { n: listas }) : $t('mejoras.nadaListo')}</span>
          <span class="g-precio">{$t('mejoras.abrir')} ▸</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

{#if masAbierto}
  <div class="backdrop" role="presentation" onclick={() => (masAbierto = false)}></div>
  <div class="sheet card" role="dialog" aria-modal="true" aria-label={$t('mejoras.masMejoras')} data-testid="mas-mejoras">
    <header>
      <h2>{$t('mejoras.masMejoras')}</h2>
      <button type="button" class="close" aria-label={$t('mejoras.cerrar')} onclick={() => (masAbierto = false)}>✕</button>
    </header>
    <BuyAmount />
    {#if $view.jefe.trofeos.length > 0}
      <div class="trofeos" data-testid="trofeos">
        <Icon name="trofeo" /> {#each $view.jefe.trofeos as trofeo (trofeo.id)}<span>{$t(`jefes.${trofeo.id}.nombre`)} · {$t('jefe.bono', { pct: trofeo.bono })}</span>{/each}
      </div>
    {/if}
    {#if $view.funciones.critico}
      <div class="card upgrade" class:fresh={$view.nuevos.includes('critico')}>
        <span class="icon"><Icon name="critico" size={32} /></span>
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
        <button type="button" class="btn btn--accent buy cifra" disabled={!$view.critico.alcanza} onclick={() => game.buyCritChance()} data-testid="comprar-critico">
          {#if $view.critico.maximo}<Icon name="check" />{:else}
            {#if $view.critico.cantidad > 1}<span class="qty">×{$view.critico.cantidad}</span>{/if}
            <span class="price"><Coin />{$view.critico.costo}</span>
          {/if}
        </button>
      </div>
    {/if}
    {#if $view.funciones.danioCritico}
      <div class="card upgrade" class:fresh={$view.nuevos.includes('danioCritico')}>
        <span class="icon"><Icon name="sombrero" size={32} /></span>
        <div class="info">
          <div class="name">
            {$t('mejoras.danioCritico')} <span class="level">{$t('mejoras.nivel', { n: $view.danioCritico.nivel })}</span>
            {#if $view.nuevos.includes('danioCritico')}<NewBadge />{/if}
          </div>
          <div class="effect">{$t('mejoras.danioCriticoEfecto', { actual: $view.danioCritico.mult, siguiente: $view.danioCritico.multSiguiente })}</div>
        </div>
        <button type="button" class="btn btn--accent buy cifra" disabled={!$view.danioCritico.alcanza} onclick={() => game.buyCritDamage()} data-testid="comprar-danio-critico">
          {#if $view.danioCritico.cantidad > 1}<span class="qty">×{$view.danioCritico.cantidad}</span>{/if}
          <span class="price"><Coin />{$view.danioCritico.costo}</span>
        </button>
      </div>
    {/if}
    {#if $view.funciones.saco}
      <div class="card upgrade" class:fresh={$view.nuevos.includes('saco')}>
        <span class="icon"><Icon name="saco" size={32} /></span>
        <div class="info">
          <div class="name">
            {$t('mejoras.saco')} <span class="level">{$t('mejoras.nivel', { n: $view.saco.nivel })}</span>
            {#if $view.nuevos.includes('saco')}<NewBadge />{/if}
          </div>
          <div class="effect">{$t('mejoras.sacoEfecto', { actual: $view.saco.mult, siguiente: $view.saco.multSiguiente })}</div>
        </div>
        <button type="button" class="btn btn--accent buy cifra" disabled={!$view.saco.alcanza} onclick={() => game.buySaco()} data-testid="comprar-saco">
          {#if $view.saco.cantidad > 1}<span class="qty">×{$view.saco.cantidad}</span>{/if}
          <span class="price"><Coin />{$view.saco.costo}</span>
        </button>
      </div>
    {/if}
    {#if $view.funciones.marca}
      <div class="card upgrade" class:fresh={$view.nuevos.includes('marca')}>
        <span class="icon"><Icon name="marca" size={32} /></span>
        <div class="info">
          <div class="name">
            {$t('mejoras.marca')} <span class="level">{$view.marca.maximo ? $t('mejoras.max') : $t('mejoras.nivel', { n: $view.marca.nivel })}</span>
            {#if $view.nuevos.includes('marca')}<NewBadge />{/if}
          </div>
          <div class="effect">
            {$view.marca.maximo
              ? $t('mejoras.marcaMax', { s: $view.marca.segundos, actual: $view.marca.mult })
              : $t('mejoras.marcaEfecto', { s: $view.marca.segundos, actual: $view.marca.mult, siguiente: $view.marca.multSiguiente })}
          </div>
        </div>
        <button type="button" class="btn btn--accent buy cifra" disabled={!$view.marca.alcanza} onclick={() => game.buyMark()} data-testid="comprar-marca">
          {#if $view.marca.maximo}<Icon name="check" />{:else}
            {#if $view.marca.cantidad > 1}<span class="qty">×{$view.marca.cantidad}</span>{/if}
            <span class="price"><Coin />{$view.marca.costo}</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .juego {
    display: grid;
    gap: 8px;
  }
  /* Franja del nivel */
  .franja {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 2px solid var(--line);
    border-radius: 6px;
    background: var(--panel-2);
  }
  .nivel-info {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .nivel-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    font-size: 15px;
  }
  .nivel-sub {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .aviso {
    font-size: 12px;
    color: var(--muted);
  }
  .nav {
    flex: none;
    width: 32px;
    height: 32px;
    border: 2px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
  }
  .nav:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .pips {
    display: inline-flex;
    gap: 3px;
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
  .gold {
    color: var(--gold);
  }
  .frente {
    min-height: 28px;
    padding: 0 8px;
    font-size: 12px;
  }
  .compra {
    margin: -2px 0 -4px;
  }
  /* Botones grandes */
  .grandes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
    gap: 8px;
  }
  .grande {
    position: relative;
    display: grid;
    gap: 2px;
    min-height: 96px;
    padding: 8px 8px 6px;
    border: 2px solid var(--line);
    border-radius: 6px;
    background: var(--accent);
    color: var(--line);
    text-align: left;
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  .grande:active {
    transform: translateY(2px);
  }
  .grande:disabled {
    background: var(--panel-2);
    color: var(--muted);
    cursor: default;
  }
  .grande.mas {
    background: var(--panel);
    color: var(--text);
  }
  .grande.mas.lista {
    background: var(--panel-2);
  }
  .g-cabeza {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .g-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.55);
  }
  .g-nivel {
    font-size: 11px;
    opacity: 0.85;
  }
  .g-nivel.punto {
    min-width: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--danger);
    color: #fff;
    text-align: center;
    font-weight: 700;
    opacity: 1;
  }
  .g-nombre {
    font-weight: 700;
    font-size: 14px;
    line-height: 1.1;
  }
  .g-nuevo {
    position: absolute;
    top: -9px;
    right: -4px;
  }
  .g-efecto {
    font-size: 11px;
    line-height: 1.15;
    opacity: 0.9;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .g-precio {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: 2px;
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
  }
  .g-precio small {
    margin-left: 4px;
    font-size: 11px;
  }
  /* Ventana "Más mejoras" */
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(18, 11, 22, 0.7);
  }
  .sheet {
    position: fixed;
    z-index: 41;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 10px;
    width: min(380px, calc(100vw - 24px));
    max-height: calc(100dvh - 40px);
    overflow: auto;
    color: var(--text);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .close {
    width: 36px;
    height: 36px;
    border: 2px solid var(--line);
    border-radius: 8px;
    background: var(--panel-2);
    color: var(--text);
    font: inherit;
    cursor: pointer;
  }
  .trofeos {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    font-size: 12px;
    color: var(--gold);
  }
  /* Tarjetas de la ventana */
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
    white-space: nowrap;
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
  .qty {
    font-size: 12px;
  }
  .fresh {
    box-shadow: 0 0 0 2px var(--gold);
  }
  @media (max-height: 640px) {
    .juego {
      gap: 6px;
    }
    .grande {
      min-height: 84px;
      padding: 6px 8px 4px;
    }
    .g-icon {
      width: 28px;
      height: 28px;
    }
    .nivel-top {
      font-size: 14px;
    }
  }
</style>
