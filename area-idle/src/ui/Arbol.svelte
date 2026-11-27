<script lang="ts">
  // El árbol de talentos (se abre con "Mejorar" encima del campo de la pantalla principal), en secciones
  // (pestañas arriba): Jugador, Mago, Arqueros y Reliquias. Cada nodo muestra su ícono, su nivel y su
  // precio; al tocarlo se abre abajo el detalle con el botón de compra.
  import { CABALLERO_DESDE, SACERDOTE_DESDE, SECCIONES, TALENT_BY_ID, TALENTS, type Seccion, type TalentDef, type TalentId } from '../core/datos';
  import { formatNum } from '../core/format';
  import { costOf, levelOf, talentState, talentVisible } from '../core/meta';
  import { t } from '../i18n';
  import { DAMAGE_TYPE_OF } from '../core/run';
  import { effectValues } from './efectos';
  import Icon from './Icon.svelte';

  import { useJuego } from './context';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  const ICONO: Record<Seccion, string> = { jugador: 'lluvia', mago: 'mago', arqueros: 'arquero', caballero: 'caballero', sacerdote: 'sacerdote', reliquias: 'gema' };

  let seccion = $state<Seccion>('jugador');
  let elegido = $state<TalentId | null>(null);
  /** El tipo de daño de cada sección (marca en la esquina de su pestaña). */
  const TIPO: Partial<Record<Seccion, string>> = { jugador: DAMAGE_TYPE_OF.jugador, mago: DAMAGE_TYPE_OF.mago, arqueros: DAMAGE_TYPE_OF.arquero, caballero: DAMAGE_TYPE_OF.caballero, sacerdote: DAMAGE_TYPE_OF.sacerdote };
  /** Las Reliquias (con gemas) se ven desde que se abren las misiones; el Caballero y el Sacerdote, desde su nivel. */
  const secciones = $derived(
    SECCIONES.filter((s) => (s !== 'reliquias' || $view.misiones.abiertas) && (s !== 'caballero' || $view.meta.nivel >= CABALLERO_DESDE) && (s !== 'sacerdote' || $view.meta.nivel >= SACERDOTE_DESDE)),
  );

  const meta = $derived($view.meta);
  const nodos = $derived(TALENTS.filter((d) => d.seccion === seccion && talentVisible(meta, d)));
  const filas = $derived(Math.max(...TALENTS.filter((d) => d.seccion === seccion).map((d) => d.pos[1])) + 1);
  /** Lo que tienes para pagarlo: gemas (Reliquias) u oro. */
  const tengo = (d: TalentDef) => (d.moneda === 'gemas' ? meta.gemas : meta.oro);
  const monedaDe = (d: TalentDef) => (d.moneda === 'gemas' ? 'gema' : 'moneda');
  const alcanza = (d: TalentDef) => talentState(meta, d) === 'disponible' && tengo(d) >= costOf(d, levelOf(meta, d.id));
  /** Hay algo que se puede comprar ya en la sección (punto rojo en su pestaña). */
  const puede = $derived(Object.fromEntries(SECCIONES.map((s) => [s, TALENTS.some((d) => d.seccion === s && talentVisible(meta, d) && alcanza(d))])) as Record<Seccion, boolean>);
  const detalle = $derived(elegido ? TALENT_BY_ID[elegido] : null);

  /** Centro de un nodo en % del área del árbol (5 columnas, de −2 a 2). */
  const cx = (d: TalentDef) => ((d.pos[0] + 2.5) / 5) * 100;
  const cy = (d: TalentDef) => ((d.pos[1] + 0.5) / filas) * 100;

  /** El texto del efecto: "Daño 3 → 4"; al máximo, solo el valor que quedó ("Daño 264"). */
  function efecto(id: TalentId, maximo: boolean): string {
    const ef = effectValues(id, meta.talentos);
    let plantilla = $t(`talentos.${id}.efecto`);
    if (maximo) plantilla = plantilla.replace(/\{a\}[^{}]*?→\s*/, '').replace('{b}', ef.a);
    return plantilla.replace('{a}', ef.a).replace('{b}', ef.b);
  }

  function cambiar(s: Seccion) {
    seccion = s;
    elegido = null;
  }
</script>

<div class="arbol" data-testid="arbol">
  <div class="arriba">
    <div class="pestanas" role="tablist" style:--cols={secciones.length} class:cuatro={secciones.length > 3}>
      {#each secciones as s (s)}
        <button type="button" role="tab" class="pestana" class:activa={seccion === s} aria-selected={seccion === s} onclick={() => cambiar(s)} data-testid="seccion-{s}">
          <Icon name={ICONO[s]} size={30} />
          <span>{$t(`secciones.${s}`)}</span>
          {#if TIPO[s]}<span class="tipo-sec" title={$t(`tipos.${TIPO[s]}`)}><Icon name="tipo_{TIPO[s]}" size={18} /></span>{/if}
          {#if puede[s] && seccion !== s}<span class="punto"></span>{/if}
        </button>
      {/each}
    </div>
    <button type="button" class="redondo cerrar" aria-label={$t('arbol.cerrar')} onclick={cerrar} data-testid="cerrar-arbol">✕</button>
  </div>

  <!-- Si no cabe (pantallas chicas), el árbol se desliza hacia arriba y abajo. -->
  <div class="lienzo" data-testid="lienzo-arbol">
  <div class="tablero" style:--filas={filas}>
    <svg class="lineas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {#each nodos as d (d.id)}
        {#if d.requiere && TALENT_BY_ID[d.requiere.id].seccion === seccion}
          {@const r = TALENT_BY_ID[d.requiere.id]}
          <line x1={cx(r)} y1={cy(r)} x2={cx(d)} y2={cy(d)} class:abierta={levelOf(meta, d.id) > 0} vector-effect="non-scaling-stroke" />
        {/if}
      {/each}
    </svg>
    {#each nodos as d (d.id)}
      {@const estado = talentState(meta, d)}
      {@const nivel = levelOf(meta, d.id)}
      <button
        type="button"
        class="nodo {estado}"
        class:alcanza={alcanza(d)}
        class:elegido={elegido === d.id}
        style:left="{cx(d)}%"
        style:top="{cy(d)}%"
        onclick={() => (elegido = d.id)}
        data-testid="talento-{d.id}"
      >
        <Icon name={estado === 'bloqueado' ? 'candado' : d.icono} size={34} />
        {#if estado !== 'bloqueado'}<span class="nivel cifra">{nivel}/{d.max}</span>{/if}
        {#if estado === 'disponible'}<span class="precio cifra" class:gemas={d.moneda === 'gemas'}><Icon name={monedaDe(d)} size={13} />{formatNum(costOf(d, nivel))}</span>{/if}
      </button>
    {/each}
  </div>
  </div>

  {#if detalle}
    {@const estado = talentState(meta, detalle)}
    {@const nivel = levelOf(meta, detalle.id)}
    <div class="detalle" data-testid="detalle">
      <Icon name={detalle.icono} size={48} />
      <div class="info">
        <strong>{$t(`talentos.${detalle.id}.nombre`)} <span class="muted cifra">{nivel}/{detalle.max}</span></strong>
        <span class="muted" data-testid="efecto">{efecto(detalle.id, estado === 'maximo')}</span>
        {#if estado === 'bloqueado' && detalle.requiere && levelOf(meta, detalle.requiere.id) < detalle.requiere.nivel}
          <span class="aviso">{$t('arbol.requiere', { nombre: $t(`talentos.${detalle.requiere.id}.nombre`), n: detalle.requiere.nivel })}</span>
        {:else if estado === 'bloqueado' && detalle.nivelMin}
          <span class="aviso" data-testid="requiere-nivel">{$t('arbol.requiereNivel', { n: detalle.nivelMin })}</span>
        {/if}
      </div>
      {#if estado === 'maximo'}
        <span class="max">{$t('arbol.max')}</span>
      {:else}
        <button type="button" class="btn btn--accent comprar" disabled={!alcanza(detalle)} onclick={() => juego.buy(detalle.id)} data-testid="comprar">
          <Icon name={monedaDe(detalle)} size={20} /><span class="cifra">{formatNum(costOf(detalle, nivel))}</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Un panel sobre el campo, entre el oro (arriba) y los botones (abajo). */
  .arbol {
    position: absolute;
    inset: 10px 10px 8px;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    /* Que nada (las pestañas) ensanche la columna más allá de la pantalla. */
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
    padding: 10px 10px 12px;
    border: var(--borde);
    border-radius: 22px;
    background-color: rgba(30, 70, 50, 0.95);
    background-image: radial-gradient(rgba(255, 255, 255, 0.06) 2px, transparent 2px);
    background-size: 22px 22px;
    box-shadow: var(--sombra);
    pointer-events: auto;
    animation: sube 0.18s ease-out;
  }
  @keyframes sube {
    from {
      translate: 0 24px;
      opacity: 0;
    }
  }
  .arriba {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
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
  .precio.gemas {
    background: #efe4ff;
  }
  /* Con cuatro pestañas solo cabe el dibujo (el nombre, en pantallas anchas). */
  .pestanas.cuatro .pestana span:not(.tipo-sec):not(.punto) {
    display: none;
  }
  @media (min-width: 560px) {
    .pestanas.cuatro .pestana span:not(.tipo-sec):not(.punto) {
      display: inline;
    }
  }
  .tipo-sec {
    position: absolute;
    top: -8px;
    left: -6px;
    display: grid;
  }
  .pestanas {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 6px;
  }
  .pestana {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 46px;
    padding: 2px 4px;
    border: var(--borde);
    border-radius: 14px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
    color: var(--muted);
    font-size: 14px;
  }
  .pestana.activa {
    background: linear-gradient(#ffe27a, #ffc93c);
    color: var(--text);
  }
  .punto {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 14px;
    height: 14px;
    border: 2px solid var(--line);
    border-radius: 50%;
    background: var(--danger);
  }
  .lienzo {
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    /* Lugar para el precio de los de arriba y el nivel de los de abajo. */
    padding: 14px 0 12px;
    overscroll-behavior: contain;
  }
  .tablero {
    position: relative;
    height: 100%;
    min-height: calc(var(--filas) * 74px);
    margin: 0 4px;
  }
  .lineas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .lineas line {
    stroke: #1d3a2a;
    stroke-width: 9;
    stroke-linecap: round;
  }
  .lineas line.abierta {
    stroke: #ffd23f;
  }
  .nodo {
    position: absolute;
    translate: -50% -50%;
    display: grid;
    place-items: center;
    width: 62px;
    height: 62px;
    border: var(--borde);
    border-radius: 16px;
    background: var(--panel);
    box-shadow: 0 4px 0 var(--line);
  }
  .nodo.bloqueado {
    background: #9aa79c;
    box-shadow: 0 4px 0 #2a3a2e;
  }
  .nodo.maximo {
    background: #c9f0b8;
  }
  .nodo.alcanza {
    background: linear-gradient(#ffe27a, #ffc93c);
    animation: brilla 1.4s ease-in-out infinite;
  }
  .nodo.elegido {
    outline: 4px solid #fff;
    outline-offset: 2px;
  }
  @keyframes brilla {
    50% {
      box-shadow: 0 4px 0 var(--line), 0 0 14px 4px rgba(255, 210, 63, 0.8);
    }
  }
  .nivel {
    position: absolute;
    bottom: -9px;
    padding: 0 6px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: #fff;
    font-size: 11px;
    line-height: 14px;
  }
  .precio {
    position: absolute;
    top: -12px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 5px 0 2px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: #fff8ea;
    font-size: 11px;
    line-height: 15px;
    white-space: nowrap;
  }
  .detalle {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: var(--borde);
    border-radius: 18px;
    background: var(--panel);
    box-shadow: var(--sombra);
  }
  .info {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .info strong {
    font-size: 18px;
  }
  .muted {
    color: var(--muted);
    font-size: 14px;
  }
  .aviso {
    color: var(--danger);
    font-size: 13px;
  }
  .comprar {
    min-width: 92px;
    min-height: 46px;
    font-size: 18px;
  }
  /* Pantallas bajitas: el detalle más compacto para que quepa más árbol. */
  @media (max-height: 680px) {
    .detalle {
      gap: 8px;
      padding: 6px 10px;
    }
    .detalle > :global(img:first-child) {
      width: 36px;
      height: 36px;
    }
    .info strong {
      font-size: 16px;
    }
    .muted {
      font-size: 13px;
    }
    .comprar {
      min-width: 80px;
      min-height: 40px;
      font-size: 16px;
    }
  }
  .max {
    padding: 4px 10px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: #c9f0b8;
  }
</style>
