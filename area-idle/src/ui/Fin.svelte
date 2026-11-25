<script lang="ts">
  // Se acabó el tiempo: lo que reventaste y el oro que juntaste. Mejorar abre el árbol.
  import { formatNum } from '../core/format';
  import { t } from '../i18n';
  import Icon from './Icon.svelte';

  import { useJuego } from './context';

  const juego = useJuego();
  const view = juego.view;
  const record = $derived($view.meta.partidas > 1 && $view.oroPartida >= $view.meta.mejor && $view.oroPartida > 0);
</script>

<div class="fondo" data-testid="fin">
  <div class="tarjeta">
    <h2>{$t('fin.titulo')}</h2>
    {#if record}<div class="record">{$t('fin.record')}</div>{/if}
    <div class="fila"><Icon name="slimes" size={34} /><span>{$t('fin.reventados')}</span><strong class="cifra" data-testid="fin-reventados">{formatNum($view.reventados)}</strong></div>
    <div class="fila"><Icon name="moneda" size={34} /><span>{$t('fin.oro')}</span><strong class="cifra oro" data-testid="fin-oro">+{formatNum($view.oroPartida)}</strong></div>
    <div class="botones">
      <button type="button" class="btn" onclick={() => juego.play()} data-testid="otra-vez">{$t('fin.otra')}</button>
      <button type="button" class="btn btn--accent" onclick={() => juego.openTree()} data-testid="mejorar"><Icon name="arbol" size={26} /> {$t('fin.mejorar')}</button>
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
    font-size: 34px;
    color: var(--accent);
    -webkit-text-stroke: 1.5px var(--line);
    paint-order: stroke fill;
  }
  .record {
    justify-self: center;
    padding: 2px 12px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--danger);
    color: #fff;
    font-size: 14px;
  }
  .fila {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    font-size: 18px;
  }
  .fila strong {
    font-size: 26px;
  }
  .oro {
    color: var(--gold);
  }
  .botones {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 10px;
    margin-top: 6px;
  }
</style>
