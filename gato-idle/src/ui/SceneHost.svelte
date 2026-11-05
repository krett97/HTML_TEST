<script lang="ts">
  import { bossText } from './bossText';
  import Icon from './Icon.svelte';
  import Coin from './Coin.svelte';
  import Tutorial from './Tutorial.svelte';
  import { onMount } from 'svelte';
  import { mountScene } from '../game/boot';
  import { t } from '../i18n';
  import { useGame } from './context';

  const game = useGame();
  const view = game.view;
  let host: HTMLElement;

  onMount(() => mountScene(host, game));
</script>

<section class="scene" bind:this={host} data-testid="escena">
  {#if $view.toques === 0 && $view.roturas === 0 && !$view.tutorial}
    <p class="hint">{$t('hud.toca')}</p>
  {/if}
  <Tutorial />
  {#if $view.funciones.canal}
    <!-- El dueño está grabando: la escena es el video. -->
    <div class="visor" aria-hidden="true"></div>
    <div class="rec" data-testid="rec"><span class="rec-dot"></span> REC</div>
  {/if}
  {#if $view.roturas > 0}
    <!-- Medidor de daño por segundo: total, y cuánto pone el gato y cuánto la pandilla. -->
    <div class="dps" class:con-rec={$view.funciones.canal} class:racha={$view.dps.racha} data-testid="dps-escena">
      <div class="dps-top">
        <span class="dps-icon"><Icon name={$view.dps.racha ? 'viral' : 'dps'} size={24} /></span>
        {#key $view.dps.total}<strong class="dps-num cifra">{$view.dps.total}</strong>{/key}
        <span class="dps-unit">{$t('hud.dps')}</span>
      </div>
      {#if $view.dps.activo}
        <div class="dps-bar" title="{$t('hud.dpsGato')} {$view.dps.gato} · {$t('hud.dpsAliados')} {$view.dps.aliados}">
          <span class="dps-cat" style:width="{$view.dps.parteGato * 100}%"></span>
        </div>
        <div class="dps-legend">
          <span><Icon name="gato" /> {$view.dps.gato}</span>
          {#if $view.funciones.aliados}<span><Icon name="mejoras" /> {$view.dps.aliados}</span>{/if}
        </div>
      {/if}
      {#if $view.dps.racha}<span class="dps-racha">{$t('hud.racha')}</span>{/if}
      {#if $view.marcaActiva}
        <!-- Garras marcadoras: cuánto le queda a la marca y cuánto más pega la pandilla. -->
        <div class="marca" data-testid="marca">
          <span class="marca-tag"><Icon name="marca" /> {$t('hud.marcado')} <span class="cifra">{$view.marcaActiva.mult}</span></span>
          <span class="marca-bar"><span class="marca-fill" style:width="{($view.marcaActiva.restante / $view.marcaActiva.segundos) * 100}%"></span></span>
        </div>
      {/if}
    </div>
  {/if}
  {#if $view.jefe.pelea}
    {@const pelea = $view.jefe.pelea}
    <!-- Pelea contra el jefe: nombre, vida que le queda y reloj. -->
    <div class="boss" class:apurado={pelea.restante <= 5} data-testid="pelea-jefe">
      <div class="boss-top">
        <strong><Icon name={pelea.id} /> {$t(`jefes.${pelea.id}.nombre`)}</strong>
        <span class="boss-time cifra" data-testid="reloj-jefe"><Icon name="reloj" /> {pelea.restante.toFixed(1)}</span>
      </div>
      <div class="boss-bar"><span class="boss-fill" style:width="{(1 - pelea.progreso) * 100}%"></span></div>
      <div class="boss-hp cifra">{pelea.vida}</div>
    </div>
  {:else if $view.jefe.aqui}
    {#if $view.jefe.revancha > 0}
      <div class="boss-wait" data-testid="revancha">
        <Icon name="reloj" /> {$t('jefe.revancha', { s: $view.jefe.revancha })}
        <button type="button" class="btn btn--gold revancha-ya" onclick={() => game.skipRematchWait()} data-testid="revancha-ya"><Icon name="anuncio" /> {$t('jefe.revanchaYa')}</button>
      </div>
    {:else}
      <button type="button" class="boss-call" onclick={() => game.challengeBoss()} data-testid="retar-jefe">
        <Icon name={$view.jefe.aqui} /> {$t('jefe.retar', bossText($t, $view.jefe.aqui))}
      </button>
    {/if}
  {/if}
  {#if $view.turbo.disponible && !$view.jefe.pelea}
    <!-- Turbo: ×2 daño y dinero por 3 minutos viendo un anuncio; mientras dura, la cuenta regresiva. -->
    <button type="button" class="turbo" class:activo={$view.turbo.restante > 0} disabled={$view.turbo.restante > 0 || $view.turbo.espera > 0} onclick={() => game.startTurbo()} data-testid="turbo">
      <Icon name="turbo" size={22} />
      {#if $view.turbo.restante > 0}
        <span class="cifra">×1.5 {Math.floor($view.turbo.restante / 60)}:{String($view.turbo.restante % 60).padStart(2, '0')}</span>
      {:else if $view.turbo.espera > 0}
        <span class="cifra">{Math.floor($view.turbo.espera / 60)}:{String($view.turbo.espera % 60).padStart(2, '0')}</span>
      {:else}
        <span>{$t('turbo.boton')}</span><Icon name="anuncio" size={16} />
      {/if}
    </button>
  {/if}
  {#if $view.patrocinio.visible}
    <button type="button" class="sponsor" onclick={() => game.claimSponsor()} data-testid="patrocinio">
      <span class="sponsor-tag"><Icon name="anuncio" /> {$t('patrocinio.titulo')}</span>
      <strong class="cifra">+<Coin />{$view.patrocinio.recompensa}</strong>
      <span class="sponsor-tag">{$t('patrocinio.ver')}</span>
    </button>
  {/if}
</section>

<style>
  .scene {
    position: relative;
    flex: 1 1 0;
    min-height: 160px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: linear-gradient(to top, #6b4a3a var(--piso, 0px), #3b2a4d var(--piso, 0px));
    touch-action: none;
  }
  .scene :global(canvas) {
    display: block;
  }
  .hint {
    position: absolute;
    top: 16px;
    left: 0;
    right: 0;
    width: fit-content;
    max-width: calc(100% - 32px);
    margin: 0 auto;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: rgba(18, 11, 22, 0.75);
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    text-shadow: 0 2px 0 var(--line);
    pointer-events: none;
    animation: bob 1s ease-in-out infinite alternate;
  }
  /*
   * Jefe: el botón para retarlo y la espera de la revancha van abajo al centro, sobre el piso
   * (cerca del gato); la barra de la pelea, arriba a la derecha (el patrocinio se oculta en la pelea).
   */
  .boss-call,
  .boss-wait,
  .boss {
    position: absolute;
    z-index: 5;
    image-rendering: pixelated;
  }
  /* Marcos de PixelLab: el del HUD deja ver la escena detrás. */
  .boss-wait,
  .boss {
    border: 8px solid transparent;
    border-image: url('../assets/ui/panel_hud.png') 11 fill / 8px stretch;
  }
  .boss-call,
  .boss-wait {
    bottom: calc(var(--piso, 0px) + 8px);
    left: 50%;
    translate: -50% 0;
    white-space: nowrap;
  }
  .boss {
    top: 12px;
    right: 12px;
  }
  .boss-call {
    padding: 1px 6px;
    border: 7px solid transparent;
    border-image: url('../assets/ui/boton.png') 7 fill / 7px stretch;
    background: none;
    color: var(--line);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    animation: reto 900ms ease-in-out infinite;
  }
  @keyframes reto {
    50% {
      scale: 1.07;
    }
  }
  .boss-wait {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px;
    pointer-events: auto;
    color: var(--muted);
    font-size: 13px;
    pointer-events: none;
  }
  .boss {
    /* Sin encimarse con el medidor de daño (a la izquierda) en pantallas angostas. */
    width: min(200px, calc(100% - 186px));
    padding: 0 2px;
    color: var(--text);
    pointer-events: none;
  }
  .boss-top {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: 13px;
  }
  .boss-time {
    color: var(--gold);
    font-size: 18px;
    line-height: 1;
  }
  .boss.apurado .boss-time {
    color: var(--danger);
    animation: bob 300ms ease-in-out infinite alternate;
  }
  .boss-bar {
    height: 10px;
    margin-top: 4px;
    border: 2px solid var(--line);
    background: var(--bg);
  }
  .boss-fill {
    display: block;
    height: 100%;
    background: #5ec44a;
    transition: width 120ms linear;
  }
  .boss-hp {
    margin-top: 2px;
    text-align: right;
    font-size: 12px;
    color: var(--muted);
  }
  .marca {
    display: grid;
    gap: 2px;
    margin-top: 2px;
  }
  .marca-tag {
    font-size: 11px;
    font-weight: 700;
    color: #ff4d5e;
    text-shadow: 0 1px 0 var(--line);
  }
  .marca-bar {
    height: 5px;
    border: 1px solid var(--line);
    background: var(--bg);
  }
  .marca-fill {
    display: block;
    height: 100%;
    background: #ff4d5e;
    transition: width 120ms linear;
  }
  /* Medidor de daño por segundo (arriba a la izquierda, debajo del REC). */
  .dps {
    position: absolute;
    z-index: 3;
    top: 12px;
    left: 12px;
    display: grid;
    gap: 3px;
    min-width: 92px;
    padding: 0 2px 1px;
    border: 8px solid transparent;
    border-image: url('../assets/ui/panel_hud.png') 11 fill / 8px stretch;
    image-rendering: pixelated;
    color: var(--text);
    pointer-events: none;
    transition: box-shadow 200ms;
  }
  .dps.con-rec {
    top: 34px;
  }
  .dps-top {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .dps-icon {
    font-size: 14px;
  }
  .dps-num {
    font-size: 22px;
    line-height: 1;
    color: var(--gold);
    text-shadow: 0 2px 0 var(--line);
    animation: dps-pulso 180ms ease-out;
  }
  @keyframes dps-pulso {
    from {
      scale: 1.18;
    }
  }
  .dps-unit {
    font-size: 11px;
    color: var(--muted);
  }
  /* Barra: naranja = gato, morado = pandilla. */
  .dps-bar {
    height: 6px;
    border: 1px solid var(--line);
    background: #8e5bd1;
  }
  .dps-cat {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 250ms ease-out;
  }
  .dps-legend {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 10px;
    color: var(--muted);
  }
  /* En racha: borde de fuego y el número en rojo encendido. */
  .dps.racha {
    border-color: var(--danger);
    box-shadow:
      0 0 0 2px var(--accent),
      0 0 12px 2px rgba(242, 140, 40, 0.7);
    animation: dps-fuego 400ms ease-in-out infinite alternate;
  }
  .dps.racha .dps-num {
    color: #ff7a3d;
  }
  .dps-racha {
    font-size: 10px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 1px;
  }
  @keyframes dps-fuego {
    from {
      rotate: -1deg;
    }
    to {
      rotate: 1deg;
    }
  }
  /* Marco de cámara (esquinas) y "● REC" parpadeando. */
  .visor {
    position: absolute;
    inset: 8px;
    z-index: 1;
    pointer-events: none;
    --c: rgba(255, 241, 224, 0.55);
    background:
      linear-gradient(var(--c), var(--c)) top left / 14px 2px,
      linear-gradient(var(--c), var(--c)) top left / 2px 14px,
      linear-gradient(var(--c), var(--c)) top right / 14px 2px,
      linear-gradient(var(--c), var(--c)) top right / 2px 14px,
      linear-gradient(var(--c), var(--c)) bottom left / 14px 2px,
      linear-gradient(var(--c), var(--c)) bottom left / 2px 14px,
      linear-gradient(var(--c), var(--c)) bottom right / 14px 2px,
      linear-gradient(var(--c), var(--c)) bottom right / 2px 14px;
    background-repeat: no-repeat;
  }
  .rec {
    position: absolute;
    z-index: 2;
    top: 14px;
    left: 16px;
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
    text-shadow: 0 1px 0 var(--line);
    pointer-events: none;
  }
  .rec-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--danger);
    animation: parpadeo 1s steps(2, start) infinite;
  }
  @keyframes parpadeo {
    to {
      visibility: hidden;
    }
  }
  .revancha-ya {
    min-height: 30px;
    font-size: 12px;
  }
  /* Turbo: a la derecha, a media altura (debajo del patrocinio). */
  .turbo {
    position: absolute;
    z-index: 4;
    right: 10px;
    top: 42%;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 4px;
    border: 7px solid transparent;
    border-image: url('../assets/ui/boton_morado.png') 7 fill / 7px stretch;
    background: none;
    image-rendering: pixelated;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .turbo:disabled:not(.activo) {
    opacity: 0.6;
    cursor: default;
  }
  .turbo.activo {
    border-image-source: url('../assets/ui/boton_oro.png');
    color: var(--line);
    animation: turbo-brillo 600ms ease-in-out infinite alternate;
  }
  @keyframes turbo-brillo {
    to {
      filter: brightness(1.2);
    }
  }
  /* Oferta de patrocinio: arriba a la derecha, salta para llamar la atención. */
  .sponsor {
    position: absolute;
    z-index: 4;
    top: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    padding: 0 4px;
    border: 7px solid transparent;
    border-image: url('../assets/ui/boton_oro.png') 7 fill / 7px stretch;
    background: none;
    image-rendering: pixelated;
    color: var(--line);
    font: inherit;
    cursor: pointer;
    animation: llamar 1.2s ease-in-out infinite;
  }
  .sponsor strong {
    font-size: 20px;
  }
  .sponsor-tag {
    font-size: 11px;
  }
  .sponsor:active {
    transform: translateY(2px);
  }
  @keyframes llamar {
    0%,
    70%,
    100% {
      rotate: 0deg;
    }
    80% {
      rotate: -6deg;
    }
    90% {
      rotate: 6deg;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sponsor {
      animation: none;
    }
  }
  @keyframes bob {
    to {
      transform: translateY(-6px);
    }
  }
</style>
