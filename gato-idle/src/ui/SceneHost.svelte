<script lang="ts">
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
        <span class="dps-icon" aria-hidden="true">{$view.dps.racha ? '🔥' : '💥'}</span>
        {#key $view.dps.total}<strong class="dps-num cifra">{$view.dps.total}</strong>{/key}
        <span class="dps-unit">{$t('hud.dps')}</span>
      </div>
      {#if $view.dps.activo}
        <div class="dps-bar" title="{$t('hud.dpsGato')} {$view.dps.gato} · {$t('hud.dpsAliados')} {$view.dps.aliados}">
          <span class="dps-cat" style:width="{$view.dps.parteGato * 100}%"></span>
        </div>
        <div class="dps-legend">
          <span>🐱 {$view.dps.gato}</span>
          {#if $view.funciones.aliados}<span>🐾 {$view.dps.aliados}</span>{/if}
        </div>
      {/if}
      {#if $view.dps.racha}<span class="dps-racha">{$t('hud.racha')}</span>{/if}
    </div>
  {/if}
  {#if $view.jefe.pelea}
    {@const pelea = $view.jefe.pelea}
    <!-- Pelea contra el jefe: nombre, vida que le queda y reloj. -->
    <div class="boss" class:apurado={pelea.restante <= 5} data-testid="pelea-jefe">
      <div class="boss-top">
        <strong>🥒 {$t(`jefes.${pelea.id}.nombre`)}</strong>
        <span class="boss-time cifra" data-testid="reloj-jefe">⏱ {pelea.restante.toFixed(1)}</span>
      </div>
      <div class="boss-bar"><span class="boss-fill" style:width="{(1 - pelea.progreso) * 100}%"></span></div>
      <div class="boss-hp cifra">{pelea.vida}</div>
    </div>
  {:else if $view.jefe.aqui}
    {#if $view.jefe.revancha > 0}
      <div class="boss-wait" data-testid="revancha">🥒 {$t('jefe.revancha', { s: $view.jefe.revancha })}</div>
    {:else}
      <button type="button" class="boss-call" onclick={() => game.challengeBoss()} data-testid="retar-jefe">
        🥒 {$t('jefe.retar', { jefe: $t(`jefes.${$view.jefe.aqui}.nombre`) })}
      </button>
    {/if}
  {/if}
  {#if $view.patrocinio.visible}
    <button type="button" class="sponsor" onclick={() => game.claimSponsor()} data-testid="patrocinio">
      <span class="sponsor-tag">📺 {$t('patrocinio.titulo')}</span>
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
    border: 2px solid var(--line);
    border-radius: 6px;
    box-shadow: 0 3px 0 var(--line);
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
    padding: 8px 12px;
    background: #8fe36b;
    color: #1d3b12;
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
    padding: 4px 10px;
    background: rgba(18, 11, 22, 0.75);
    color: var(--muted);
    font-size: 13px;
    pointer-events: none;
  }
  .boss {
    width: min(200px, calc(100% - 150px));
    padding: 6px 8px;
    background: rgba(18, 11, 22, 0.85);
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
  /* Medidor de daño por segundo (arriba a la izquierda, debajo del REC). */
  .dps {
    position: absolute;
    z-index: 3;
    top: 12px;
    left: 12px;
    display: grid;
    gap: 3px;
    min-width: 92px;
    padding: 5px 8px 6px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: rgba(18, 11, 22, 0.72);
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
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 6px;
    background: var(--gold);
    box-shadow: 0 3px 0 var(--line);
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
