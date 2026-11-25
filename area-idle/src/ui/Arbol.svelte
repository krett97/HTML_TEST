<script lang="ts">
  // El árbol de talentos, en tres secciones (pestañas arriba): Jugador, Mago y Arqueros. Cada nodo
  // muestra su ícono, su nivel y su precio; al tocarlo se abre abajo el detalle con el botón de compra.
  import { SECCIONES, TALENT_BY_ID, TALENTS, type Seccion, type TalentDef, type TalentId } from '../core/datos';
  import { formatNum, formatGold } from '../core/format';
  import { costOf, levelOf, talentState, talentVisible } from '../core/meta';
  import { t } from '../i18n';
  import Ajustes from './Ajustes.svelte';
  import Glosario from './Glosario.svelte';
  import Misiones from './Misiones.svelte';
  import { DAMAGE_TYPE_OF } from '../core/run';
  import { effectValues } from './efectos';
  import Icon from './Icon.svelte';

  import { useJuego } from './context';

  const juego = useJuego();
  const view = juego.view;
  const ICONO: Record<Seccion, string> = { jugador: 'lluvia', mago: 'mago', arqueros: 'arquero', reliquias: 'gema' };

  let seccion = $state<Seccion>('jugador');
  let elegido = $state<TalentId | null>(null);
  let ajustes = $state(false);
  let glosario = $state(false);
  let misiones = $state(false);
  /** El tipo de daño de cada sección (marca en la esquina de su pestaña). */
  const TIPO: Partial<Record<Seccion, string>> = { jugador: DAMAGE_TYPE_OF.jugador, mago: DAMAGE_TYPE_OF.mago, arqueros: DAMAGE_TYPE_OF.arquero };
  /** Las Reliquias (con gemas) se ven desde que se abren las misiones. */
  const secciones = $derived(SECCIONES.filter((s) => s !== 'reliquias' || $view.misiones.abiertas));

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
  <header>
    <div class="izq">
      <!-- El oro, y debajo lo que se junta por minuto sin jugar (desde el nivel 3). -->
      <div class="pill oro">
        <Icon name="moneda" size={28} />
        <span class="cifras">
          <span class="cifra" data-testid="oro-total">{formatGold(meta.oro)}</span>
          {#if $view.ritmoInactivo}
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
      <button type="button" class="redondo" aria-label={$t('glosario.titulo')} onclick={() => (glosario = true)} data-testid="abrir-glosario"><Icon name="glosario" size={28} /></button>
      <button type="button" class="redondo" aria-label={$t('ajustes.titulo')} onclick={() => (ajustes = true)} data-testid="abrir-ajustes"><Icon name="ajustes" size={26} /></button>
    </div>
  </header>

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

  <!-- Qué nivel jugar: el más alto abierto, o uno anterior para juntar oro. -->
  <div class="niveles">
    <button type="button" class="flecha" aria-label={$t('arbol.nivelAnterior')} disabled={meta.jugando <= 1} onclick={() => juego.playLevel(meta.jugando - 1, false)} data-testid="nivel-menos">◀</button>
    <span class="nivel-actual" data-testid="nivel-actual"><small class="zona">{$t(`zonas.${$view.zona}`)}{#if $view.nivelDeJefe}&nbsp;· {$t('hud.jefe')}{/if}</small><span class="con-corona">{#if $view.nivelDeJefe}<Icon name="corona" size={24} />{/if}{$t('hud.nivel', { n: meta.jugando })}</span>{#if meta.jugando < meta.nivel}<small>{$t('arbol.paraOro')}</small>{/if}</span>
    <button type="button" class="flecha" aria-label={$t('arbol.nivelSiguiente')} disabled={meta.jugando >= meta.nivel} onclick={() => juego.playLevel(meta.jugando + 1, false)} data-testid="nivel-mas">▶</button>
  </div>
  <button type="button" class="btn btn--accent jugar" onclick={() => juego.play()} data-testid="jugar"><Icon name="jugar" size={26} /> {$t('arbol.jugar')}</button>
</div>

{#if ajustes}
  <Ajustes cerrar={() => (ajustes = false)} />
{/if}
{#if misiones}
  <Misiones cerrar={() => (misiones = false)} />
{/if}
{#if glosario}
  <Glosario cerrar={() => (glosario = false)} />
{/if}

<style>
  .arbol {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: auto auto 1fr auto auto auto;
    /* Que nada (pestañas, encabezado) ensanche la columna más allá de la pantalla. */
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: calc(10px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));
    background: rgba(30, 70, 50, 0.88);
    background-image: radial-gradient(rgba(255, 255, 255, 0.06) 2px, transparent 2px);
    background-size: 22px 22px;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px 6px;
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
  .izq {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
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
  .pill.gemas {
    padding: 3px 12px 3px 5px;
    background: #efe4ff;
    font-size: 20px;
  }
  .precio.gemas {
    background: #efe4ff;
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
  /* Con cuatro pestañas solo cabe el dibujo (el nombre, en pantallas anchas). */
  .pestanas.cuatro .pestana span:not(.tipo-sec):not(.punto) {
    display: none;
  }
  @media (min-width: 560px) {
    .pestanas.cuatro .pestana span:not(.tipo-sec):not(.punto) {
      display: inline;
    }
  }
  .acciones {
    display: flex;
    gap: 8px;
    margin-left: auto;
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
  .tablero {
    position: relative;
    min-height: 0;
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
  .max {
    padding: 4px 10px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: #c9f0b8;
  }
  .niveles {
    display: grid;
    grid-template-columns: 46px 1fr 46px;
    align-items: center;
    gap: 8px;
  }
  .flecha {
    height: 42px;
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
    -webkit-text-stroke: 1px var(--line);
    paint-order: stroke fill;
  }
  .con-corona {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .nivel-actual small.zona {
    color: #c8f59b;
  }
  .nivel-actual small {
    font-size: 12px;
    -webkit-text-stroke: 0;
    color: #ffe27a;
  }
  .jugar {
    min-height: 58px;
    font-size: 24px;
  }
</style>
