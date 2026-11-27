<script lang="ts">
  // Arena PvP (desde el nivel 19): tu liga de la semana (100 jugadores), tu poder, tus intentos y la
  // tabla. Tocar "Pelear" gasta un intento y abre la batalla. Los 20 de arriba suben de liga y los 20
  // de abajo bajan al terminar la semana.
  import { onDestroy } from 'svelte';
  import { formatDuration, formatNum } from '../core/format';
  import { BAJAN, INTENTOS_MAX, JUGADORES, LIGAS, leagueTable, msUntilNextAttempt, msUntilWeekEnd, myArmy, myPower, pointsFor, positionOf, SUBEN, winChance, type FightResult } from '../core/pvp';
  import { t } from '../i18n';
  import Batalla from './Batalla.svelte';
  import Castillo from './Castillo.svelte';
  import { SUELO } from './pvpEscena';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';
  import TiendaPvp from './TiendaPvp.svelte';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;

  // Un reloj para las cuentas regresivas (intentos y fin de semana).
  let ahora = $state(Date.now());
  const reloj = setInterval(() => {
    ahora = Date.now();
    // Volvió un intento (o terminó la semana): que el juego lo cuente.
    const pv = juego.meta.pvp;
    if ((pv.intentos < INTENTOS_MAX && msUntilNextAttempt(pv, ahora) <= 0) || msUntilWeekEnd(ahora) < 1000) juego.refresh();
  }, 1000);
  onDestroy(() => clearInterval(reloj));

  let pelea = $state<FightResult | null>(null);
  let tienda = $state(false);

  const meta = $derived($view.meta);
  const p = $derived(meta.pvp);
  const liga = $derived(LIGAS[p.liga]!);
  const poder = $derived(myPower(meta));
  const ejercito = $derived(myArmy(meta));
  // La franja de tu castillo (se mide para acomodar a tus tropas).
  let anchoMini = $state(320);
  // La tabla se recalcula cuando cambia algo tuyo o pasa un minuto (los rivales también juntan puntos).
  const minuto = $derived(Math.floor(ahora / 60_000));
  const tabla = $derived(leagueTable(meta, minuto * 60_000));
  const lugar = $derived(positionOf(tabla));
  const espera = $derived(msUntilNextAttempt(p, ahora));

  function dificultad(suyo: number): 'facil' | 'parejo' | 'dificil' {
    const c = winChance(poder.total, suyo);
    return c >= 0.7 ? 'facil' : c >= 0.4 ? 'parejo' : 'dificil';
  }

  function pelear(id: string) {
    const r = juego.pvpFight(id);
    if (r) pelea = r;
  }
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('pvp.titulo')} data-testid="pvp">
  <header>
    <h2><Icon name="pvp" size={30} /> {$t('pvp.titulo')}</h2>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>

  {#if p.resultado}
    {@const r = p.resultado}
    <div class="resultado" data-testid="pvp-resultado">
      <Icon name="liga_{LIGAS[r.nueva]!.id}" size={44} />
      <div>
        <strong>{$t('pvp.semanaFin', { n: r.posicion, liga: $t(`ligas.${LIGAS[r.liga]!.id}`) })}</strong>
        <span>{r.nueva > r.liga ? $t('pvp.subes', { liga: $t(`ligas.${LIGAS[r.nueva]!.id}`) }) : r.nueva < r.liga ? $t('pvp.bajas', { liga: $t(`ligas.${LIGAS[r.nueva]!.id}`) }) : $t('pvp.sigues')} · +{r.medallas} <Icon name="medalla" size={16} /></span>
      </div>
      <button type="button" class="btn btn--accent" onclick={() => juego.pvpAck()} data-testid="pvp-ok">OK</button>
    </div>
  {/if}

  <div class="liga" style:--color={liga.color}>
    <Icon name="liga_{liga.id}" size={46} />
    <div class="info">
      <strong data-testid="pvp-liga">{$t('pvp.liga', { liga: $t(`ligas.${liga.id}`) })}</strong>
      <small>{$t('pvp.termina', { t: formatDuration(msUntilWeekEnd(ahora) / 1000) })}</small>
    </div>
    <div class="lugar">
      <strong class="cifra" data-testid="pvp-lugar">#{lugar}</strong>
      <small class="cifra">{$t('pvp.puntos', { n: p.puntos })}</small>
    </div>
  </div>

  <!-- Tu castillo con tus tropas (como se ven en la batalla) y tu poder. -->
  <div class="ejercito" data-testid="mi-poder">
    <div class="mini" bind:clientWidth={anchoMini} style:background-image="url({artUrl(SUELO[$view.zona] ?? 'pasto')})">
      <!-- Las tropas, en lo que deja libre el cartel del poder (la muralla sí va de lado a lado). -->
      <Castillo {ejercito} lado="abajo" ancho={Math.max(170, anchoMini - 150)} alto={112} banda={104} testid="mi-castillo" />
      <div class="poder">
        <span class="titulo">{$t('pvp.tuPoder')}</span>
        <strong class="cifra" data-testid="mi-poder-total"><Icon name="pvp" size={22} />{formatNum(poder.total)}</strong>
        <span class="desglose cifra">
          <span title={$t('secciones.jugador')}><Icon name="lluvia" size={16} />{formatNum(Math.round(poder.jugador))}</span>
          {#if poder.mago > 0}<span title={$t('secciones.mago')}><Icon name="mago" size={16} />{formatNum(Math.round(poder.mago))}</span>{/if}
          {#if poder.arqueros > 0}<span title={$t('secciones.arqueros')}><Icon name="arquero" size={16} />{formatNum(Math.round(poder.arqueros))}</span>{/if}
          {#if poder.caballero > 0}<span title={$t('secciones.caballero')}><Icon name="caballero" size={16} />{formatNum(Math.round(poder.caballero))}</span>{/if}
          {#if poder.sacerdote > 0}<span title={$t('secciones.sacerdote')}><Icon name="sacerdote" size={16} />{formatNum(Math.round(poder.sacerdote))}</span>{/if}
          {#if poder.bruja > 0}<span title={$t('secciones.bruja')}><Icon name="bruja" size={16} />{formatNum(Math.round(poder.bruja))}</span>{/if}
        </span>
      </div>
    </div>
  </div>

  <div class="barra">
    <span class="intentos cifra" data-testid="pvp-intentos"><Icon name="pvp" size={22} />{p.intentos}/{INTENTOS_MAX}</span>
    <small class="muted">{p.intentos < INTENTOS_MAX ? $t('pvp.recarga', { t: formatDuration(espera / 1000) }) : $t('pvp.lleno')}</small>
    <button type="button" class="tienda" onclick={() => (tienda = true)} data-testid="abrir-tienda-pvp">
      <Icon name="medalla" size={22} /><span class="cifra" data-testid="pvp-medallas">{formatNum(p.medallas)}</span><Icon name="tienda" size={24} />
    </button>
  </div>

  <ol class="tabla">
    {#each tabla as f, i (f.id)}
      {#if i === SUBEN && p.liga < LIGAS.length - 1}<li class="corte sube">▲ {$t('pvp.sube', { liga: $t(`ligas.${LIGAS[p.liga + 1]!.id}`) })}</li>{/if}
      {#if i === JUGADORES - BAJAN && p.liga > 0}<li class="corte baja">▼ {$t('pvp.baja', { liga: $t(`ligas.${LIGAS[p.liga - 1]!.id}`) })}</li>{/if}
      <li class="fila" class:tuyo={f.tuyo} data-testid={f.tuyo ? 'pvp-tuyo' : 'pvp-rival'}>
        <span class="pos cifra">{i + 1}</span>
        <img src={artUrl(f.avatar)} alt="" width="34" height="34" />
        <span class="quien">
          <strong>{f.tuyo ? f.nombre || $t('pvp.tu') : f.nombre}</strong>
          <span class="muted cifra"><Icon name="pvp" size={13} />{formatNum(f.poder)} · {$t('pvp.puntos', { n: f.puntos })}</span>
        </span>
        {#if !f.tuyo}
          {@const d = dificultad(f.poder)}
          <button type="button" class="pelear {d}" disabled={p.intentos < 1} onclick={() => pelear(f.id)} data-testid="pelear-{f.id}">
            <span>{$t(`pvp.${d}`)}</span><small class="cifra">+{pointsFor(p.puntos, f.puntos).gana}</small>
          </button>
        {:else}
          <span></span>
        {/if}
      </li>
    {/each}
  </ol>
</div>

{#if pelea}
  <Batalla resultado={pelea} cerrar={() => (pelea = null)} />
{/if}
{#if tienda}
  <TiendaPvp cerrar={() => (tienda = false)} />
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(18, 22, 18, 0.6);
  }
  .sheet {
    position: fixed;
    z-index: 41;
    inset: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 440px;
    margin: 0 auto;
    padding: 12px;
    border: var(--borde);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--sombra);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    margin: 0;
    font-size: 22px;
  }
  .redondo {
    width: 38px;
    height: 38px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel-2);
  }
  .resultado {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: #fff4cc;
    font-size: 13px;
  }
  .resultado div {
    display: grid;
  }
  .resultado span {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .liga {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 6px 8px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--color) 30%, #fff), #fff);
  }
  .info,
  .lugar {
    display: grid;
  }
  .info strong {
    font-size: 17px;
  }
  small {
    color: var(--muted);
    font-size: 12px;
  }
  .lugar {
    text-align: right;
  }
  .lugar strong {
    font-size: 22px;
  }
  /* Tu castillo en una franja de campo, con el poder en un cartel arriba a la derecha. */
  .ejercito {
    border: var(--borde);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 3px 0 var(--line);
  }
  .mini {
    position: relative;
    height: 112px;
    background-color: #5ec47a;
    background-size: 110px 110px;
  }
  .poder {
    position: absolute;
    top: 8px;
    right: 8px;
    display: grid;
    justify-items: end;
    gap: 1px;
    padding: 4px 10px;
    border: var(--borde);
    border-radius: 14px;
    background: rgba(255, 248, 234, 0.95);
    box-shadow: 0 2px 0 var(--line);
    line-height: 1.05;
  }
  .poder .titulo {
    color: var(--muted);
    font-size: 12px;
  }
  .poder strong {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 24px;
  }
  .desglose {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 2px 8px;
    font-size: 12px;
  }
  .desglose span {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .barra {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .intentos {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 18px;
  }
  .muted {
    color: var(--muted);
  }
  .barra .muted {
    flex: 1;
    font-size: 12px;
  }
  .tienda {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px 4px 6px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel-2);
    box-shadow: 0 3px 0 var(--line);
    font-size: 16px;
  }
  .tabla {
    flex: 1;
    display: grid;
    align-content: start;
    gap: 5px;
    min-height: 0;
    margin: 0;
    padding: 2px 2px 4px;
    overflow-y: auto;
    list-style: none;
  }
  .fila {
    display: grid;
    grid-template-columns: 26px 34px 1fr auto;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: #fff;
  }
  .fila.tuyo {
    background: #fff4cc;
    box-shadow: 0 0 0 3px #ffc93c;
  }
  .fila img {
    object-fit: contain;
  }
  .pos {
    font-size: 15px;
    text-align: center;
  }
  .quien {
    display: grid;
    min-width: 0;
    font-size: 14px;
  }
  .quien strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .quien .muted {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
  }
  .pelear {
    display: grid;
    min-width: 70px;
    padding: 2px 8px;
    border: 2px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 2px 0 var(--line);
    font-size: 13px;
    line-height: 1.1;
  }
  .pelear small {
    color: inherit;
    font-size: 11px;
  }
  .pelear.facil {
    background: #b8eeb0;
  }
  .pelear.parejo {
    background: #ffe27a;
  }
  .pelear.dificil {
    background: #ffb3a8;
  }
  .pelear:disabled {
    opacity: 0.5;
  }
  .corte {
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 12px;
    text-align: center;
  }
  .corte.sube {
    background: #d8f5d2;
    color: #2f7a2a;
  }
  .corte.baja {
    background: #ffe0db;
    color: #a6382c;
  }
</style>
