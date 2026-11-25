<script lang="ts">
  // Fin de la partida. Si reventaste todos: nivel superado, con su premio. Si se acabó el tiempo: el oro
  // juntado se queda y puedes reintentar o jugar el nivel anterior para juntar más.
  import { formatNum, formatGold } from '../core/format';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';

  const juego = useJuego();
  const view = juego.view;
  const nivel = $derived($view.nivel);
</script>

<div class="fondo" data-testid="fin">
  <div class="tarjeta" class:perdio={!$view.gano} data-testid={$view.gano ? 'gano' : 'perdio'}>
    <h2>{$view.gano ? ($view.jefe ? $t('fin.ganoJefe', { nombre: $t(`enemigos.${$view.jefe.kind}.nombre`) }) : $t('fin.gano', { n: nivel })) : $t('fin.perdio')}</h2>
    {#if $view.jefe && !$view.gano}
      <div class="fila"><Icon name="corona" size={34} /><span>{$t(`enemigos.${$view.jefe.kind}.nombre`)}</span><strong class="cifra" data-testid="fin-jefe">{$t('fin.leQuedo', { pct: Math.ceil((100 * $view.jefe.vida) / $view.jefe.max) })}</strong></div>
    {/if}
    <div class="fila"><Icon name="slimes" size={34} /><span>{$t('fin.reventados')}</span><strong class="cifra" data-testid="fin-reventados">{$view.jefe ? $view.reventados : `${$view.reventados}/${$view.total}`}</strong></div>
    <div class="fila"><Icon name="moneda" size={34} /><span>{$t('fin.oro')}</span><strong class="cifra oro" data-testid="fin-oro">+{formatGold($view.oroPartida)}</strong></div>
    {#if $view.gano}
      <div class="fila"><Icon name="botin" size={34} /><span>{$t('fin.premio')}</span><strong class="cifra oro" data-testid="fin-premio">+{formatNum($view.premio)}</strong></div>
    {:else}
      <p class="nota">{$t('fin.seQueda')}</p>
    {/if}
    {#if $view.abrioInactivo}
      <div class="nuevo" data-testid="nuevo-inactivo"><Icon name="inactivo" size={36} /><span>{$t('inactivo.nuevo')}</span></div>
    {/if}
    <div class="botones">
      {#if $view.gano}
        <button type="button" class="btn" onclick={() => juego.openTree()} data-testid="mejorar"><Icon name="arbol" size={26} /> {$t('fin.mejorar')}</button>
        <button type="button" class="btn btn--accent" onclick={() => juego.playLevel(nivel + 1)} data-testid="siguiente"><Icon name="jugar" size={22} /> {$t('fin.siguiente')}</button>
      {:else}
        <button type="button" class="btn btn--accent ancho" onclick={() => juego.playLevel(nivel)} data-testid="reintentar"><Icon name="jugar" size={22} /> {$t('fin.reintentar', { n: nivel })}</button>
        {#if nivel > 1}
          <button type="button" class="btn" onclick={() => juego.playLevel(nivel - 1)} data-testid="anterior"><Icon name="moneda" size={22} /> {$t('fin.anterior', { n: nivel - 1 })}</button>
        {/if}
        <button type="button" class="btn" class:ancho={nivel <= 1} onclick={() => juego.openTree()} data-testid="mejorar"><Icon name="arbol" size={26} /> {$t('fin.mejorar')}</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .fondo {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(30, 50, 30, 0.45);
    animation: aparece 0.25s ease-out;
  }
  @keyframes aparece {
    from {
      opacity: 0;
    }
  }
  .tarjeta {
    display: grid;
    gap: 10px;
    width: min(340px, 100%);
    padding: 18px;
    border: var(--borde);
    border-radius: 22px;
    background: var(--panel);
    box-shadow: var(--sombra);
    animation: salta 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  @keyframes salta {
    from {
      scale: 0.7;
    }
  }
  h2 {
    margin: 0;
    text-align: center;
    font-size: 30px;
    line-height: 1.1;
    color: #7fd36a;
    -webkit-text-stroke: 1.5px var(--line);
    paint-order: stroke fill;
  }
  .perdio h2 {
    color: var(--danger);
  }
  .fila {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    font-size: 18px;
  }
  .fila strong {
    font-size: 24px;
  }
  .oro {
    color: var(--gold);
  }
  .nota {
    margin: 0;
    text-align: center;
    color: var(--muted);
    font-size: 14px;
  }
  .nuevo {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: #e8ddff;
    font-size: 15px;
    line-height: 1.2;
    animation: late 1.2s ease-in-out 3;
  }
  @keyframes late {
    50% {
      scale: 1.04;
    }
  }
  .botones {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 6px;
  }
  .ancho {
    grid-column: 1 / -1;
  }
</style>
