<script lang="ts">
  // La batalla del PvP en un campo de batalla: el castillo del rival arriba y el tuyo abajo, cada uno con
  // su mago y sus arqueros (y el aspecto de su equipo). Se turnan: los arqueros disparan flechas, el mago
  // una bola de fuego y el círculo de cada uno cae sobre la muralla de enfrente. El resultado ya está
  // decidido (según el poder de cada uno); aquí se cuenta en unos segundos, la muralla del que pierde se
  // derrumba y luego se muestra cuántos puntos y medallas te dio.
  import { onDestroy } from 'svelte';
  import { formatNum } from '../core/format';
  import { LIGAS, myArmy, rivalArmy, type FightResult } from '../core/pvp';
  import { t } from '../i18n';
  import Castillo from './Castillo.svelte';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';
  import { puestos, SUELO, type Lado } from './pvpEscena';

  let { resultado, cerrar }: { resultado: FightResult; cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;

  const GOLPES = 6;
  const PASO = 420;
  /** Lo que tarda en llegar un disparo. */
  const VUELO = 340;
  // svelte-ignore state_referenced_locally
  const r = resultado;
  const meta = juego.meta;
  const mio = myArmy(meta);
  const suyo = rivalArmy(mio, r.suPoder / Math.max(1, r.miPoder), meta.pvp.liga, r.rival.id);
  const liga = LIGAS[meta.pvp.liga]!;

  // El que gana deja al otro en 0; al ganador le queda más vida si era mucho más fuerte.
  const ganador = r.gano ? r.miPoder : r.suPoder;
  const perdedor = r.gano ? r.suPoder : r.miPoder;
  const queda = Math.min(90, Math.max(10, 100 * (1 - 0.85 * (perdedor / ganador))));
  let mia = $state(100);
  let suya = $state(100);
  let fin = $state(false);
  let golpe = $state<'yo' | 'el' | null>(null);

  // El campo (se mide para poner a cada quien en su lugar).
  let ancho = $state(360);
  let alto = $state(460);
  const banda = $derived(Math.min(180, alto * 0.32));

  // Los caballeros salen a pelear al centro un momento después de empezar.
  let avanzan = $state(false);
  interface Disparo {
    id: number;
    tipo: 'flecha' | 'bola' | 'aro' | 'luz' | 'cura';
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    ang: number;
  }
  let disparos = $state<Disparo[]>([]);
  let numeros = $state<{ id: number; x: number; y: number; n: number }[]>([]);
  const timers: ReturnType<typeof setTimeout>[] = [];
  let id = 0;
  const azar = (a: number, b: number) => a + Math.random() * (b - a);

  /** Un lado dispara todo lo que tiene a la muralla de enfrente; al llegar, le baja vida. */
  function ataca(lado: 'yo' | 'el', baja: number, poder: number) {
    const desde: Lado = lado === 'yo' ? 'abajo' : 'arriba';
    const hacia: Lado = lado === 'yo' ? 'arriba' : 'abajo';
    const p = puestos(lado === 'yo' ? mio : suyo, desde, ancho, alto, banda);
    const b = puestos(lado === 'yo' ? suyo : mio, hacia, ancho, alto, banda).blanco;
    const nuevos: Disparo[] = [];
    const tiro = (tipo: Disparo['tipo'], x0: number, y0: number) => {
      const x1 = azar(b.x0, b.x1);
      const y1 = b.y + azar(-6, 6);
      nuevos.push({ id: id++, tipo, x0, y0, x1, y1, ang: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI });
    };
    for (const a of p.arqueros) tiro('flecha', a.x, a.y - a.h * 0.6);
    if (p.mago) tiro('bola', p.mago.x, p.mago.y - p.mago.h * 0.8);
    // El círculo de cada jugador: cae en un lugar de la muralla de enfrente.
    const x = azar(b.x0 + 30, b.x1 - 30);
    nuevos.push({ id: id++, tipo: 'aro', x0: x, y0: b.y, x1: x, y1: b.y, ang: 0 });
    // El sacerdote: una columna de luz en la muralla de enfrente y una cura en la suya.
    if (p.sacerdote) {
      const xl = azar(b.x0 + 20, b.x1 - 20);
      nuevos.push({ id: id++, tipo: 'luz', x0: xl, y0: b.y, x1: xl, y1: b.y, ang: 0 });
      const propia = puestos(lado === 'yo' ? mio : suyo, desde, ancho, alto, banda).blanco;
      const xc = azar(propia.x0 + 20, propia.x1 - 20);
      nuevos.push({ id: id++, tipo: 'cura', x0: xc, y0: propia.y, x1: xc, y1: propia.y, ang: 0 });
    }
    disparos = [...disparos, ...nuevos];
    juego.sonar(p.arqueros.length ? 'arco' : 'disparo');
    if (p.mago) juego.sonar('magia');
    timers.push(
      setTimeout(() => {
        disparos = disparos.filter((d) => !nuevos.includes(d));
        golpe = lado === 'yo' ? 'el' : 'yo';
        if (lado === 'yo') suya = Math.max(0, suya - baja);
        else mia = Math.max(0, mia - baja);
        const n = { id: id++, x: (b.x0 + b.x1) / 2 + azar(-40, 40), y: b.y, n: Math.max(1, Math.round(poder * azar(0.12, 0.2))) };
        numeros = [...numeros, n];
        timers.push(setTimeout(() => (numeros = numeros.filter((x) => x.id !== n.id)), 800));
        timers.push(setTimeout(() => (golpe = null), 260));
        juego.sonar('golpeMuro');
      }, VUELO),
    );
  }

  timers.push(setTimeout(() => (avanzan = true), 120));
  for (let i = 0; i < GOLPES; i++) {
    const ultimo = i === GOLPES - 1;
    // Tú atacas primero; el último golpe siempre es del que gana.
    const yo = r.gano ? 100 / GOLPES : (100 - queda) / GOLPES;
    const el = r.gano ? (100 - queda) / GOLPES : 100 / GOLPES;
    timers.push(setTimeout(() => ataca('yo', ultimo && r.gano ? 100 : yo, r.miPoder), 500 + i * 2 * PASO));
    timers.push(setTimeout(() => ataca('el', ultimo && !r.gano ? 100 : el, r.suPoder), 500 + (i * 2 + 1) * PASO));
  }
  timers.push(
    setTimeout(
      () => {
        terminar();
        juego.sonar('derrumbe');
        timers.push(setTimeout(() => juego.sonar(r.gano ? 'fin' : 'pierde'), 500));
      },
      500 + GOLPES * 2 * PASO + VUELO,
    ),
  );
  onDestroy(() => timers.forEach(clearTimeout));

  function terminar() {
    golpe = null;
    disparos = [];
    if (r.gano) suya = 0;
    else mia = 0;
    fin = true;
  }

  function saltar() {
    timers.forEach(clearTimeout);
    numeros = [];
    terminar();
  }
</script>

<div class="fondo" role="presentation"></div>
<div class="batalla" role="dialog" aria-modal="true" aria-label={$t('pvp.batalla')} data-testid="batalla">
  <!-- El rival (arriba). -->
  <div class="tag rival">
    <img src={artUrl(r.rival.avatar)} alt="" width="40" height="40" />
    <span class="quien">
      <strong>{r.rival.nombre}</strong>
      <span class="poder cifra"><Icon name="pvp" size={14} />{formatNum(r.suPoder)}</span>
    </span>
    <span class="vida rival" data-testid="vida-rival"><span style:width="{suya}%"></span></span>
  </div>

  <div class="campo" style:background-image="url({artUrl(SUELO[$view.zona] ?? 'pasto')})" bind:clientWidth={ancho} bind:clientHeight={alto} data-testid="campo-batalla">
    <Castillo ejercito={suyo} lado="arriba" {ancho} {alto} {banda} recibe={golpe === 'el'} cae={fin && r.gano} festeja={fin && !r.gano} avanza={avanzan} testid="castillo-rival" />
    <Castillo ejercito={mio} lado="abajo" {ancho} {alto} {banda} recibe={golpe === 'yo'} cae={fin && !r.gano} festeja={fin && r.gano} avanza={avanzan} testid="castillo-tuyo" />
    {#each disparos as d (d.id)}
      <span
        class="disparo {d.tipo}"
        style:--x0="{d.x0}px"
        style:--y0="{d.y0}px"
        style:--x1="{d.x1}px"
        style:--y1="{d.y1}px"
        style:--ang="{d.ang}deg"
        style:--vuelo="{VUELO}ms"
      >
        {#if d.tipo === 'flecha'}
          <svg viewBox="0 0 26 8" width="26" height="8" aria-hidden="true"><path d="M1 4 H20" stroke="#6b4423" stroke-width="2.2" stroke-linecap="round" /><path d="M19 1 L25 4 L19 7 Z" fill="#c9d0dc" stroke="#3a2518" stroke-width="1" /><path d="M1 1.5 L5 4 L1 6.5" fill="none" stroke="#ef5a4c" stroke-width="1.6" /></svg>
        {/if}
      </span>
    {/each}
    {#each numeros as n (n.id)}
      <span class="num cifra" style:left="{n.x}px" style:top="{n.y}px">-{formatNum(n.n)}</span>
    {/each}
    {#if !fin}
      <!-- Si hay caballeros, pelean al centro: el VS se hace a un lado. -->
      <span class="vs" class:aparte={mio.caballero || suyo.caballero} style:--color={liga.color}>VS</span>
    {:else}
      <div class="final" class:gano={r.gano} data-testid={r.gano ? 'pvp-gano' : 'pvp-perdio'}>
        <h2>{r.gano ? $t('pvp.ganaste') : $t('pvp.perdiste')}</h2>
        <p class="premios cifra">
          <span>{r.puntos >= 0 ? '+' : ''}{r.puntos} {$t('pvp.pts')}</span>
          <span>+{r.medallas} <Icon name="medalla" size={20} /></span>
        </p>
        <p class="muted">{$t('pvp.probabilidad', { n: Math.round(r.probabilidad * 100) })}</p>
        <button type="button" class="btn btn--accent" onclick={cerrar} data-testid="batalla-ok">{$t('pvp.continuar')}</button>
      </div>
    {/if}
  </div>

  <!-- Tú (abajo). -->
  <div class="tag tuyo">
    <img src={artUrl('arquero')} alt="" width="40" height="40" />
    <span class="quien">
      <strong>{$view.meta.nombre || $t('pvp.tu')}</strong>
      <span class="poder cifra"><Icon name="pvp" size={14} />{formatNum(r.miPoder)}</span>
    </span>
    <span class="vida" data-testid="vida-tuya"><span style:width="{mia}%"></span></span>
  </div>
  {#if !fin}
    <button type="button" class="btn saltar" onclick={saltar} data-testid="batalla-saltar">{$t('pvp.saltar')}</button>
  {/if}
</div>

<style>
  .fondo {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(18, 22, 18, 0.82);
  }
  .batalla {
    position: fixed;
    z-index: 51;
    inset: calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    gap: 8px;
    max-width: 460px;
    margin: 0 auto;
  }
  /* El nombre, el poder y la vida de cada uno. */
  .tag {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) minmax(90px, 42%);
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: var(--borde);
    border-radius: 16px;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--line);
  }
  .tag.rival {
    background: #ffe9e4;
  }
  .tag.tuyo {
    background: #e9f7df;
  }
  .tag img {
    object-fit: contain;
  }
  .quien {
    display: grid;
    min-width: 0;
    line-height: 1.15;
  }
  .quien strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
  }
  .poder {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
  }
  .vida {
    height: 16px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: #ece4dc;
    overflow: hidden;
  }
  .vida span {
    display: block;
    height: 100%;
    background: linear-gradient(#8be06a, #57b84a);
    transition: width 0.25s ease-out;
  }
  .vida.rival span {
    background: linear-gradient(#ff8a7a, #ef5a4c);
  }
  /* El campo de batalla: el suelo de tu zona, con los dos castillos. */
  .campo {
    position: relative;
    min-height: 0;
    overflow: hidden;
    border: var(--borde);
    border-radius: 18px;
    background-color: #5ec47a;
    background-size: 128px 128px;
    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.25);
  }
  .disparo {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
    animation: vuela var(--vuelo) linear forwards;
  }
  @keyframes vuela {
    from {
      translate: var(--x0) var(--y0);
    }
    to {
      translate: var(--x1) var(--y1);
    }
  }
  .disparo.flecha svg {
    display: block;
    translate: -13px -4px;
    rotate: var(--ang);
  }
  .disparo.bola::before {
    content: '';
    display: block;
    width: 16px;
    height: 16px;
    translate: -8px -8px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 40%, #fff3a0, #ffd23f 35%, #ff8a2a 65%, #ef5a4c);
    box-shadow: 0 0 10px 3px rgba(255, 138, 42, 0.8);
  }
  /* El círculo del jugador: un aro dorado que cae sobre la muralla. */
  .disparo.aro {
    animation: none;
    translate: var(--x1) var(--y1);
  }
  .disparo.aro::before {
    content: '';
    display: block;
    width: 64px;
    height: 34px;
    translate: -32px -17px;
    border: 3px solid #ffd23f;
    border-radius: 50%;
    background: rgba(255, 226, 122, 0.3);
    box-shadow: 0 0 0 2px #8a5a2b;
    animation: aro var(--vuelo) ease-in forwards;
  }
  /* La columna de luz del sacerdote: baja del cielo sobre la muralla de enfrente. */
  .disparo.luz {
    animation: none;
    translate: var(--x1) var(--y1);
  }
  .disparo.luz::before {
    content: '';
    display: block;
    width: 26px;
    height: 120px;
    translate: -13px -112px;
    border-radius: 13px 13px 50% 50%;
    background: linear-gradient(rgba(255, 246, 192, 0), rgba(255, 246, 192, 0.95) 60%, #fff);
    box-shadow: 0 0 16px 6px rgba(255, 226, 122, 0.7);
    animation: baja var(--vuelo) ease-in forwards;
  }
  @keyframes baja {
    from {
      scale: 1 0.2;
      transform-origin: bottom;
      opacity: 0;
    }
    to {
      scale: 1 1;
      opacity: 1;
    }
  }
  /* Su cura: una cruz verde que sube en su propia muralla. */
  .disparo.cura {
    animation: none;
    translate: var(--x1) var(--y1);
  }
  .disparo.cura::before {
    content: '+';
    display: block;
    translate: -50% -50%;
    color: #7fe07a;
    font-size: 30px;
    font-weight: 700;
    -webkit-text-stroke: 2px #2a5a22;
    paint-order: stroke fill;
    animation: curita var(--vuelo) ease-out forwards;
  }
  @keyframes curita {
    from {
      translate: -50% 0;
      opacity: 0;
    }
    to {
      translate: -50% -60%;
      opacity: 1;
    }
  }
  @keyframes aro {
    from {
      scale: 1.6;
      opacity: 0;
    }
    to {
      scale: 1;
      opacity: 1;
    }
  }
  .num {
    position: absolute;
    translate: -50% -50%;
    color: #ef5a4c;
    font-size: 22px;
    -webkit-text-stroke: 1px #3a2a1a;
    paint-order: stroke fill;
    animation: sube 0.8s ease-out forwards;
    pointer-events: none;
  }
  @keyframes sube {
    from {
      transform: translateY(0) scale(1.25);
      opacity: 1;
    }
    to {
      transform: translateY(-34px) scale(0.9);
      opacity: 0;
    }
  }
  .vs {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    padding: 2px 14px;
    border: var(--borde);
    border-radius: 999px;
    background: var(--color, #ef5a4c);
    color: #fff;
    font-size: 26px;
    font-weight: 700;
    -webkit-text-stroke: 1px var(--line);
    paint-order: stroke fill;
    box-shadow: 0 3px 0 var(--line);
  }
  .vs.aparte {
    left: 16%;
    font-size: 20px;
  }
  .final {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    display: grid;
    justify-items: center;
    gap: 4px;
    width: min(280px, 86%);
    padding: 14px 16px;
    border: var(--borde);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--sombra);
    text-align: center;
    animation: aparece 0.3s ease-out;
  }
  @keyframes aparece {
    from {
      scale: 0.7;
      opacity: 0;
    }
  }
  .final h2 {
    margin: 0;
    color: #c0392b;
    font-size: 30px;
  }
  .final.gano h2 {
    color: #2f8a3a;
  }
  .premios {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin: 0;
    font-size: 20px;
  }
  .premios span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .muted {
    margin: 0 0 6px;
    color: var(--muted);
    font-size: 12px;
  }
  .saltar {
    justify-self: center;
    min-height: 38px;
    padding: 4px 18px;
  }
</style>
