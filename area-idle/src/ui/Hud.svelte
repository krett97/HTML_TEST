<script lang="ts">
  // Durante la partida, arriba de todo: la barra de progreso del nivel (cuántos llevas de cuántos) y,
  // debajo, el tiempo que queda (con su barrita), la zona y el nivel, y el oro que llevas.
  import { formatClock, formatNum, formatGold } from '../core/format';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';

  const juego = useJuego();
  const view = juego.view;
  const prisa = $derived($view.restante <= 5);
  const avance = $derived($view.total ? Math.min(1, $view.reventados / $view.total) : 0);
</script>

<div class="cabecera">
  <div class="progreso" data-testid="progreso" aria-label={$t('hud.progreso')}>
    <span class="hecho" style:width="{avance * 100}%"></span>
    <span class="texto cifra" data-testid="avance">{$view.reventados}/{$view.total} · {Math.floor(avance * 100)}%</span>
  </div>
  <div class="fila">
    <div class="pill reloj" class:prisa data-testid="reloj">
      <Icon name="reloj" size={24} />
      <span class="cifra">{formatClock($view.restante)}</span>
      <span class="barra"><span class="lleno" style:width="{(100 * $view.restante) / $view.duracion}%"></span></span>
    </div>
    <div class="zona" data-testid="nivel-partida">
      <small>{$t('zonas.campo')}</small>
      <strong>{$t('hud.nivel', { n: $view.nivel })}</strong>
    </div>
    <div class="pill oro" data-testid="oro-partida">
      <Icon name="moneda" size={24} />
      <span class="cifra">{formatGold($view.oroPartida)}</span>
    </div>
  </div>
</div>
{#if $view.muro?.caido}
  <div class="caida" data-testid="muralla-caida">{$t('hud.murallaCaida')}</div>
{/if}
{#if !$view.toco && $view.meta.partidas < 3}
  <div class="pista" data-testid="pista"><Icon name="mano" size={30} /> {$t('hud.pista')}</div>
{/if}
{#if __PRUEBAS__}
  <button type="button" class="terminar" onclick={() => juego.endNow()} data-testid="terminar">⏭</button>
{/if}

<style>
  .cabecera {
    position: absolute;
    top: calc(8px + env(safe-area-inset-top));
    left: 8px;
    right: 8px;
    display: grid;
    gap: 6px;
    pointer-events: none;
  }
  /* La barra del nivel, a todo lo ancho. */
  .progreso {
    position: relative;
    height: 24px;
    border: var(--borde);
    border-radius: 999px;
    background: #3a2518cc;
    box-shadow: 0 3px 0 var(--line);
    overflow: hidden;
  }
  .hecho {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(#b6f08a, #57b84a);
    transition: width 0.15s;
  }
  .texto {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 14px;
    -webkit-text-stroke: 3px var(--line);
    paint-order: stroke fill;
  }
  .fila {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: start;
    gap: 6px;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 10px 2px 4px;
    border: var(--borde);
    border-radius: 999px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
    font-size: 20px;
  }
  .reloj {
    position: relative;
    justify-self: start;
    padding-bottom: 7px;
  }
  .reloj.prisa {
    background: #ffd9cc;
  }
  .reloj.prisa .cifra {
    color: var(--danger);
  }
  .barra {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 3px;
    height: 4px;
    border-radius: 999px;
    background: #e6d7bd;
    overflow: hidden;
  }
  .lleno {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.1s linear;
  }
  .oro {
    justify-self: end;
  }
  .zona {
    display: grid;
    justify-items: center;
    padding: 1px 12px 3px;
    border: var(--borde);
    border-radius: 14px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
    line-height: 1.05;
    white-space: nowrap;
  }
  .zona small {
    color: #3a8f53;
    font-size: 12px;
  }
  .zona strong {
    font-size: 18px;
  }
  @media (max-width: 360px) {
    .pill {
      font-size: 17px;
      padding-right: 7px;
    }
    .zona strong {
      font-size: 16px;
    }
  }
  .caida {
    position: absolute;
    left: 50%;
    top: calc(98px + env(safe-area-inset-top));
    translate: -50% 0;
    max-width: calc(100% - 32px);
    padding: 5px 12px;
    border: var(--borde);
    border-radius: 14px;
    background: var(--danger);
    color: #fff;
    font-size: 14px;
    text-align: center;
    pointer-events: none;
    animation: entra 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  @keyframes entra {
    from {
      scale: 0.6;
    }
  }
  .pista {
    position: absolute;
    left: 50%;
    bottom: calc(96px + env(safe-area-inset-bottom));
    translate: -50% 0;
    display: flex;
    align-items: center;
    gap: 8px;
    width: max-content;
    max-width: calc(100% - 32px);
    padding: 8px 14px;
    border: var(--borde);
    border-radius: 16px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
    text-align: center;
    line-height: 1.2;
    pointer-events: none;
    animation: late 1.2s ease-in-out infinite;
  }
  @keyframes late {
    50% {
      scale: 1.05;
    }
  }
  .terminar {
    position: absolute;
    top: calc(96px + env(safe-area-inset-top));
    right: 10px;
    width: 36px;
    height: 32px;
    border: var(--borde);
    border-radius: 10px;
    background: var(--panel);
    font-size: 14px;
    opacity: 0.7;
  }
</style>
