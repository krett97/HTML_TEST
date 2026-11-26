<script lang="ts">
  // La pantalla principal: el campo a color con pocos enemigos (la guardia). Tus tropas pelean solas y
  // juntan oro despacio; si tocas el campo, tu círculo lanza flechas ahí un rato. Arriba, el oro y los
  // botones; abajo, el nivel, "Jugar nivel" y "Mejorar" (que abre el árbol encima del campo).
  import { TALENTS } from '../core/datos';
  import { formatGold, formatNum } from '../core/format';
  import { costOf, levelOf, talentState, talentVisible } from '../core/meta';
  import { INTENTOS_MAX } from '../core/pvp';
  import { t } from '../i18n';
  import Ajustes from './Ajustes.svelte';
  import Arbol from './Arbol.svelte';
  import Glosario from './Glosario.svelte';
  import Icon from './Icon.svelte';
  import Misiones from './Misiones.svelte';
  import Pvp from './Pvp.svelte';
  import Ranking from './Ranking.svelte';
  import Supervivencia from './Supervivencia.svelte';

  import { useJuego } from './context';

  const juego = useJuego();
  const view = juego.view;

  let ajustes = $state(false);
  let glosario = $state(false);
  let misiones = $state(false);
  let ranking = $state(false);
  let pvp = $state(false);
  let oleadas = $state(false);

  // Lo que tapa la barra de abajo: la escena sube la muralla para que tus tropas se vean.
  let altoBarra = $state(0);
  $effect(() => juego.setBottomInset(altoBarra));

  const meta = $derived($view.meta);
  /** Hay alguna mejora que ya te alcanza (punto rojo en "Mejorar"); las Reliquias, desde que se abren las misiones. */
  const hayMejora = $derived(
    TALENTS.some((d) => (d.moneda !== 'gemas' || $view.misiones.abiertas) && talentVisible(meta, d) && talentState(meta, d) === 'disponible' && (d.moneda === 'gemas' ? meta.gemas : meta.oro) >= costOf(d, levelOf(meta, d.id))),
  );
</script>

<div class="principal" data-testid="principal">
  <header>
    <div class="izq">
      <!-- El oro, y debajo lo que juntan tus tropas por minuto (o, sin tropas, lo que se junta sin jugar). -->
      <div class="pill oro">
        <Icon name="moneda" size={28} />
        <span class="cifras">
          <span class="cifra" data-testid="oro-total">{formatGold(meta.oro)}</span>
          {#if $view.guardia?.tropas}
            <span class="ritmo guardia cifra" data-testid="ritmo-guardia" title={$t('guardia.explica')}>
              <Icon name="arquero" size={13} />{$t('inactivo.ritmo', { n: formatNum($view.guardia.porMinuto) })}
            </span>
          {:else if $view.ritmoInactivo}
            <span class="ritmo cifra" data-testid="ritmo-inactivo" title={$t('inactivo.explica', { h: $view.ritmoInactivo.horas })}>
              <Icon name="inactivo" size={13} />{$t('inactivo.ritmo', { n: formatNum($view.ritmoInactivo.porMinuto) })}
            </span>
          {/if}
        </span>
      </div>
      {#if $view.misiones.abiertas}
        <div class="pill gemas"><Icon name="gema" size={24} /><span class="cifra" data-testid="gemas">{formatNum(meta.gemas)}</span></div>
      {/if}
    </div>
    <div class="acciones">
      {#if $view.misiones.abiertas}
        <button type="button" class="redondo con-punto" aria-label={$t('misiones.titulo')} onclick={() => (misiones = true)} data-testid="abrir-misiones">
          <Icon name="misiones" size={28} />{#if $view.misiones.listas > 0}<span class="punto-rojo cifra">{$view.misiones.listas}</span>{/if}
        </button>
      {/if}
      {#if $view.ranking.abierto}
        <button type="button" class="redondo" aria-label={$t('ranking.titulo')} onclick={() => (ranking = true)} data-testid="abrir-ranking"><Icon name="trofeo" size={28} /></button>
      {/if}
      <button type="button" class="redondo" aria-label={$t('glosario.titulo')} onclick={() => (glosario = true)} data-testid="abrir-glosario"><Icon name="glosario" size={28} /></button>
      <button type="button" class="redondo" aria-label={$t('ajustes.titulo')} onclick={() => (ajustes = true)} data-testid="abrir-ajustes"><Icon name="ajustes" size={26} /></button>
    </div>
  </header>

  <div class="medio">
    {#if $view.mejorando}
      <Arbol cerrar={() => juego.toggleTree(false)} />
    {:else if $view.pistaGuardia}
      <p class="pista" data-testid="pista-guardia"><Icon name="mano" size={26} />{$t('principal.pista')}</p>
    {/if}
  </div>

  <div class="barra" class:mejorando={$view.mejorando} bind:offsetHeight={altoBarra} data-testid="barra-principal">
    <!-- Qué nivel jugar: el más alto abierto, o uno anterior para juntar oro (con el árbol abierto se esconde: más lugar). -->
    <div class="niveles">
      <button type="button" class="flecha" aria-label={$t('arbol.nivelAnterior')} disabled={meta.jugando <= 1} onclick={() => juego.playLevel(meta.jugando - 1, false)} data-testid="nivel-menos">◀</button>
      <span class="nivel-actual" data-testid="nivel-actual"
        ><small class="zona">{$t(`zonas.${$view.zona}`)}{#if $view.nivelDeJefe}&nbsp;· {$t('hud.jefe')}{/if}</small><span class="con-corona"
          >{#if $view.nivelDeJefe}<Icon name="corona" size={24} />{/if}{$t('hud.nivel', { n: meta.jugando })}</span
        >{#if meta.jugando < meta.nivel}<small>{$t('arbol.paraOro')}</small>{/if}</span
      >
      <button type="button" class="flecha" aria-label={$t('arbol.nivelSiguiente')} disabled={meta.jugando >= meta.nivel} onclick={() => juego.playLevel(meta.jugando + 1, false)} data-testid="nivel-mas">▶</button>
    </div>
    <div class="botones">
      {#if $view.supervivencia.abierto}
        <button type="button" class="btn modo oleadas-btn" aria-label={$t('oleadas.titulo')} onclick={() => (oleadas = true)} data-testid="abrir-supervivencia">
          <Icon name="oleadas" size={28} /><small class="cifra">{$view.supervivencia.entradas}/{$view.supervivencia.max}</small>
        </button>
      {/if}
      {#if $view.pvp.abierto}
        <button type="button" class="btn modo pvp" aria-label={$t('pvp.titulo')} onclick={() => (pvp = true)} data-testid="abrir-pvp">
          <Icon name="pvp" size={28} /><small class="cifra">{meta.pvp.intentos}/{INTENTOS_MAX}</small>
        </button>
      {/if}
      <button type="button" class="btn btn--accent jugar" onclick={() => juego.play()} data-testid="jugar"><Icon name="jugar" size={26} /> {$t('arbol.jugar')}</button>
      <button type="button" class="btn modo mejorar" class:abierto={$view.mejorando} aria-pressed={$view.mejorando} onclick={() => juego.toggleTree()} data-testid="abrir-mejorar">
        <Icon name="mejorar" size={32} /><small>{$t('principal.mejorar')}</small>
        {#if hayMejora && !$view.mejorando}<span class="punto" data-testid="punto-mejorar"></span>{/if}
      </button>
    </div>
  </div>
</div>

{#if ajustes}
  <Ajustes cerrar={() => (ajustes = false)} />
{/if}
{#if oleadas}
  <Supervivencia cerrar={() => (oleadas = false)} />
{/if}
{#if pvp}
  <Pvp cerrar={() => (pvp = false)} />
{/if}
{#if ranking}
  <Ranking cerrar={() => (ranking = false)} />
{/if}
{#if misiones}
  <Misiones cerrar={() => (misiones = false)} />
{/if}
{#if glosario}
  <Glosario cerrar={() => (glosario = false)} />
{/if}

<style>
  /* El campo se ve completo y a color: solo los botones atrapan los toques; lo demás llega al campo. */
  .principal {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-columns: minmax(0, 1fr);
    pointer-events: none;
  }
  .principal :global(button),
  .pill {
    pointer-events: auto;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px 6px;
    padding: calc(10px + env(safe-area-inset-top)) 12px 0;
  }
  .izq {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 14px 3px 5px;
    border: var(--borde);
    border-radius: 999px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
    font-size: 24px;
  }
  .pill.gemas {
    padding: 3px 12px 3px 5px;
    background: #efe4ff;
    font-size: 20px;
  }
  .cifras {
    display: grid;
    line-height: 1;
  }
  .ritmo {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 1px;
    color: #6a4bb0;
    font-size: 12px;
    white-space: nowrap;
  }
  .ritmo.guardia {
    color: #2f7a2a;
  }
  .acciones {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .redondo {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: var(--borde);
    border-radius: 14px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
  }
  .con-punto {
    position: relative;
  }
  .punto-rojo {
    position: absolute;
    top: -7px;
    right: -7px;
    min-width: 20px;
    padding: 0 5px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--danger);
    color: #fff;
    font-size: 12px;
  }
  .medio {
    position: relative;
    min-height: 0;
    padding: 10px 10px 8px;
  }
  /* La pista de la primera vez: toca el campo y tu círculo lanza flechas. */
  .pista {
    position: absolute;
    left: 50%;
    top: 42%;
    translate: -50% -50%;
    display: flex;
    align-items: center;
    gap: 6px;
    width: max-content;
    max-width: calc(100% - 32px);
    margin: 0;
    padding: 6px 14px 6px 8px;
    border: var(--borde);
    border-radius: 999px;
    background: rgba(255, 248, 234, 0.92);
    box-shadow: 0 3px 0 var(--line);
    font-size: 15px;
    animation: late 1.6s ease-in-out infinite;
  }
  @keyframes late {
    50% {
      scale: 1.05;
    }
  }
  /* Abajo: una franja de tierra oscura bajo la muralla, con el nivel y los botones. */
  .barra {
    display: grid;
    /* Que los botones no la ensanchen más allá de la pantalla. */
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
    border-top: var(--borde);
    border-radius: 22px 22px 0 0;
    background: linear-gradient(rgba(42, 74, 50, 0.93), rgba(26, 52, 36, 0.97));
    box-shadow: 0 -3px 0 rgba(0, 0, 0, 0.15);
    pointer-events: auto;
  }
  .barra.mejorando .niveles {
    display: none;
  }
  .niveles {
    display: grid;
    grid-template-columns: 46px 1fr 46px;
    align-items: center;
    gap: 8px;
  }
  .flecha {
    height: 40px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
  }
  .flecha:disabled {
    opacity: 0.4;
  }
  .nivel-actual {
    display: grid;
    justify-items: center;
    color: #fff;
    font-size: 22px;
    line-height: 1.1;
    -webkit-text-stroke: 1px var(--line);
    paint-order: stroke fill;
  }
  .con-corona {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .nivel-actual small {
    font-size: 12px;
    -webkit-text-stroke: 0;
    color: #ffe27a;
  }
  .nivel-actual small.zona {
    color: #c8f59b;
  }
  .botones {
    display: flex;
    gap: 8px;
  }
  .jugar {
    flex: 1;
    min-width: 0;
    min-height: 60px;
    font-size: 22px;
    line-height: 1.05;
    text-align: center;
  }
  /* Supervivencia, PvP y Mejorar: botones compactos (el dibujo y, abajo, su número o su nombre). */
  .modo {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 1px;
    min-height: 60px;
    padding: 2px 9px;
    line-height: 1;
  }
  .modo small {
    font-size: 13px;
  }
  .oleadas-btn {
    background: linear-gradient(#cfe4ff, #8ab8f0);
  }
  .pvp {
    background: linear-gradient(#ffb3a8, #ef7a6c);
  }
  .mejorar {
    min-width: 78px;
    background: linear-gradient(#fffaf0, #ffe9c2);
  }
  .mejorar.abierto {
    background: linear-gradient(#ffe27a, #ffc93c);
    translate: 0 2px;
    box-shadow: 0 1px 0 var(--line);
  }
  /* Dentro del botón (si se sale de la pantalla, la página se corre de lado). */
  .punto {
    position: absolute;
    top: -8px;
    right: 2px;
    width: 18px;
    height: 18px;
    border: 3px solid var(--line);
    border-radius: 50%;
    background: var(--danger);
    animation: punto 1.2s ease-in-out infinite;
  }
  @keyframes punto {
    50% {
      scale: 1.2;
    }
  }
  @media (max-width: 360px) {
    .jugar {
      padding: 4px 8px;
      font-size: 18px;
    }
    .modo {
      padding: 2px 6px;
    }
    .mejorar {
      min-width: 66px;
    }
  }
</style>
