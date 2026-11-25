<script lang="ts">
  // Durante la partida: el reloj (arriba a la izquierda), el oro que llevas (a la derecha) y, hasta
  // que toques, una pista abajo.
  import { formatClock, formatNum } from '../core/format';
  import { t } from '../i18n';
  import Icon from './Icon.svelte';

  import { useJuego } from './context';

  const juego = useJuego();
  const view = juego.view;
  const prisa = $derived($view.restante <= 5);
</script>

<div class="hud">
  <div class="pill reloj" class:prisa data-testid="reloj">
    <Icon name="reloj" size={26} />
    <span class="cifra">{formatClock($view.restante)}</span>
    <span class="barra"><span class="lleno" style:width="{(100 * $view.restante) / $view.duracion}%"></span></span>
  </div>
  <div class="pill oro" data-testid="oro-partida">
    <Icon name="moneda" size={26} />
    <span class="cifra">{formatNum($view.oroPartida)}</span>
  </div>
</div>
{#if !$view.toco && $view.meta.partidas < 3}
  <div class="pista" data-testid="pista"><Icon name="mano" size={30} /> {$t('hud.pista')}</div>
{/if}
{#if __PRUEBAS__}
  <button type="button" class="terminar" onclick={() => juego.endNow()} data-testid="terminar">⏭</button>
{/if}

<style>
  .hud {
    position: absolute;
    top: calc(10px + env(safe-area-inset-top));
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 12px 3px 5px;
    border: var(--borde);
    border-radius: 999px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
    font-size: 22px;
  }
  .reloj {
    position: relative;
    padding-bottom: 7px;
  }
  .reloj.prisa .cifra {
    color: var(--danger);
  }
  .barra {
    position: absolute;
    left: 14px;
    right: 14px;
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
  .pista {
    position: absolute;
    left: 50%;
    bottom: calc(96px + env(safe-area-inset-bottom));
    translate: -50% 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: var(--borde);
    border-radius: 16px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
    white-space: nowrap;
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
    top: calc(60px + env(safe-area-inset-top));
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
