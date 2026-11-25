<script lang="ts">
  // La batalla del PvP: tú contra el rival, cada uno con su barra de vida. El resultado ya está
  // decidido (según el poder de cada uno); aquí solo se cuenta en unos segundos y luego se muestra
  // cuántos puntos y medallas te dio.
  import { onDestroy } from 'svelte';
  import { formatNum } from '../core/format';
  import type { FightResult } from '../core/pvp';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';

  let { resultado, cerrar }: { resultado: FightResult; cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;

  const GOLPES = 6;
  const PASO = 380;
  // svelte-ignore state_referenced_locally
  const r = resultado;
  // El que gana deja al otro en 0; al ganador le queda más vida si era mucho más fuerte.
  const ganador = r.gano ? r.miPoder : r.suPoder;
  const perdedor = r.gano ? r.suPoder : r.miPoder;
  const queda = Math.min(90, Math.max(10, 100 * (1 - 0.85 * (perdedor / ganador))));
  let mia = $state(100);
  let suya = $state(100);
  let numeros = $state<{ id: number; lado: 'yo' | 'el'; n: number }[]>([]);
  let fin = $state(false);
  let golpe = $state<'yo' | 'el' | null>(null);
  const timers: ReturnType<typeof setTimeout>[] = [];
  let id = 0;

  function pega(lado: 'yo' | 'el', baja: number, poder: number) {
    golpe = lado === 'yo' ? 'el' : 'yo';
    if (lado === 'yo') suya = Math.max(0, suya - baja);
    else mia = Math.max(0, mia - baja);
    const n = { id: id++, lado: lado === 'yo' ? ('el' as const) : ('yo' as const), n: Math.round(poder * (0.12 + Math.random() * 0.08)) };
    numeros = [...numeros, n];
    timers.push(setTimeout(() => (numeros = numeros.filter((x) => x.id !== n.id)), 700));
    juego.sonar(lado === 'yo' ? 'disparo' : 'golpeMuro');
  }

  for (let i = 0; i < GOLPES; i++) {
    const ultimo = i === GOLPES - 1;
    // Tú pegas primero; el último golpe siempre es del que gana.
    const yo = r.gano ? 100 / GOLPES : (100 - queda) / GOLPES;
    const el = r.gano ? (100 - queda) / GOLPES : 100 / GOLPES;
    timers.push(setTimeout(() => pega('yo', ultimo && r.gano ? 100 : yo, r.miPoder), 300 + i * 2 * PASO));
    timers.push(setTimeout(() => pega('el', ultimo && !r.gano ? 100 : el, r.suPoder), 300 + (i * 2 + 1) * PASO));
  }
  timers.push(
    setTimeout(() => {
      golpe = null;
      fin = true;
      juego.sonar(r.gano ? 'fin' : 'pierde');
    }, 300 + GOLPES * 2 * PASO),
  );
  onDestroy(() => timers.forEach(clearTimeout));

  function saltar() {
    timers.forEach(clearTimeout);
    if (r.gano) suya = 0;
    else mia = 0;
    numeros = [];
    golpe = null;
    fin = true;
  }
</script>

<div class="fondo" role="presentation"></div>
<div class="batalla" role="dialog" aria-modal="true" aria-label={$t('pvp.batalla')} data-testid="batalla">
  <div class="lados">
    <div class="lado" class:recibe={golpe === 'yo'} class:cae={fin && !r.gano}>
      <img src={artUrl('arquero')} alt="" width="72" height="72" />
      <strong>{$view.meta.nombre || $t('pvp.tu')}</strong>
      <span class="poder cifra"><Icon name="pvp" size={14} />{formatNum(r.miPoder)}</span>
      <span class="vida"><span style:width="{mia}%"></span></span>
      {#each numeros.filter((x) => x.lado === 'yo') as n (n.id)}<span class="num cifra">-{formatNum(n.n)}</span>{/each}
    </div>
    <span class="vs">VS</span>
    <div class="lado" class:recibe={golpe === 'el'} class:cae={fin && r.gano}>
      <img src={artUrl(r.rival.avatar)} alt="" width="72" height="72" />
      <strong>{r.rival.nombre}</strong>
      <span class="poder cifra"><Icon name="pvp" size={14} />{formatNum(r.suPoder)}</span>
      <span class="vida rival"><span style:width="{suya}%"></span></span>
      {#each numeros.filter((x) => x.lado === 'el') as n (n.id)}<span class="num cifra">-{formatNum(n.n)}</span>{/each}
    </div>
  </div>
  <p class="muted">{$t('pvp.probabilidad', { n: Math.round(r.probabilidad * 100) })}</p>
  {#if fin}
    <div class="final" class:gano={r.gano} data-testid={r.gano ? 'pvp-gano' : 'pvp-perdio'}>
      <h2>{r.gano ? $t('pvp.ganaste') : $t('pvp.perdiste')}</h2>
      <p class="premios cifra">
        <span>{r.puntos >= 0 ? '+' : ''}{r.puntos} {$t('pvp.pts')}</span>
        <span>+{r.medallas} <Icon name="medalla" size={20} /></span>
      </p>
      <button type="button" class="btn btn--accent" onclick={cerrar} data-testid="batalla-ok">{$t('pvp.continuar')}</button>
    </div>
  {:else}
    <button type="button" class="btn saltar" onclick={saltar} data-testid="batalla-saltar">{$t('pvp.saltar')}</button>
  {/if}
</div>

<style>
  .fondo {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(18, 22, 18, 0.7);
  }
  .batalla {
    position: fixed;
    z-index: 51;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 10px;
    width: min(380px, calc(100vw - 20px));
    padding: 16px 14px;
    border: var(--borde);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--sombra);
    text-align: center;
  }
  .lados {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 6px;
  }
  .lado {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 3px;
    min-width: 0;
    transition:
      transform 0.12s,
      opacity 0.4s;
  }
  .lado img {
    object-fit: contain;
  }
  .lado strong {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
  }
  .lado.recibe {
    transform: translateX(4px) rotate(3deg);
    filter: brightness(1.4) saturate(0.6);
  }
  .lado.cae {
    opacity: 0.45;
    transform: rotate(-8deg) translateY(4px);
  }
  .poder {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
  }
  .vida {
    width: 100%;
    height: 14px;
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
  .num {
    position: absolute;
    top: 6px;
    left: 50%;
    color: #ef5a4c;
    font-size: 20px;
    -webkit-text-stroke: 1px #3a2a1a;
    animation: sube 0.7s ease-out forwards;
    pointer-events: none;
  }
  @keyframes sube {
    from {
      transform: translate(-50%, 0) scale(1.2);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -34px) scale(0.9);
      opacity: 0;
    }
  }
  .vs {
    font-size: 26px;
    font-weight: 700;
    color: #ef5a4c;
  }
  .muted {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
  }
  .final h2 {
    margin: 0 0 4px;
    color: #c0392b;
    font-size: 28px;
  }
  .final.gano h2 {
    color: #2f8a3a;
  }
  .premios {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin: 0 0 10px;
    font-size: 20px;
  }
  .premios span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .saltar {
    justify-self: center;
    min-height: 36px;
    padding: 4px 16px;
  }
</style>
