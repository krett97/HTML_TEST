<script lang="ts">
  // La maquinita del gato (arriba, junto al dinero): tres rodillos que giran con fichas o viendo un
  // anuncio. Tras un premio en dinero: "¿Doble o nada?" o doblarlo seguro con un anuncio.
  import { onDestroy } from 'svelte';
  import { SYMBOLS, type SpinResult } from '../core/suerte';
  import { t } from '../i18n';
  import { useGame } from './context';
  import Icon from './Icon.svelte';

  const game = useGame();
  const view = game.view;
  const ICON: Record<string, string> = { croquetas: 'croquetas', pescado: 'pescado', vaso: 'vaso', pepino: 'pepino', corona: 'corona' };

  let open = $state(false);
  let spinning = $state(false);
  let reels = $state<string[]>(['corona', 'corona', 'corona']);
  let result = $state<SpinResult | null>(null);
  let message = $state('');
  let timer: ReturnType<typeof setInterval> | undefined;
  onDestroy(() => clearInterval(timer));

  const fmt = (v: SpinResult['dinero']) => game.formatMoney(v);

  function show() {
    open = true;
    message = '';
  }

  /** Los rodillos dan vueltas y se detienen uno por uno en el resultado. */
  function animate(final: string[]): Promise<void> {
    return new Promise((resolve) => {
      let ticks = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        ticks++;
        reels = reels.map((r, i) => (ticks > 8 + i * 4 ? final[i]! : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]!.id));
        if (ticks > 16) {
          clearInterval(timer);
          resolve();
        }
      }, 70);
    });
  }

  async function play(pago: 'ficha' | 'anuncio') {
    if (spinning) return;
    message = '';
    result = null;
    spinning = true;
    const r = await game.spinLuck(pago);
    if (!r) {
      spinning = false;
      return;
    }
    await animate(r.rodillos);
    spinning = false;
    result = r;
    message = $t(`suerte.resultados.${r.tipo}`, { dinero: fmt(r.dinero), vistas: fmt(r.visualizaciones) });
  }

  function gamble() {
    const won = game.gambleLuck();
    if (won === null) return;
    message = won ? $t('suerte.dobleGano') : $t('suerte.doblePerdio');
    result = null;
  }

  async function doubleWithAd() {
    if (await game.doubleLuckWithAd()) {
      message = $t('suerte.dobleAnuncio');
      result = null;
    }
  }

  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
</script>

<button type="button" class="opener" aria-label={$t('suerte.abrir')} onclick={show} data-testid="abrir-maquinita">
  <Icon name="maquinita" size={28} />
  {#if $view.suerte.fichas > 0}<span class="badge cifra">{$view.suerte.fichas}</span>{/if}
</button>

{#if open}
  <div class="backdrop" role="presentation" onclick={() => !spinning && (open = false)}></div>
  <div class="sheet card" role="dialog" aria-modal="true" aria-label={$t('suerte.titulo')} data-testid="maquinita">
    <header>
      <h2><Icon name="maquinita" /> {$t('suerte.titulo')}</h2>
      <button type="button" class="close" aria-label={$t('ranking.cerrar')} disabled={spinning} onclick={() => (open = false)}>×</button>
    </header>

    <div class="machine" class:spinning>
      {#each reels as r, i (i)}
        <span class="reel"><Icon name={ICON[r] ?? r} size={48} /></span>
      {/each}
    </div>

    <p class="message" aria-live="polite" data-testid="maquinita-mensaje">{message || $t('suerte.invita')}</p>

    {#if result && $view.suerte.doblable}
      <div class="double">
        <button type="button" class="btn" onclick={gamble} data-testid="doble-o-nada">{$t('suerte.dobleONada')}</button>
        <button type="button" class="btn btn--gold" onclick={doubleWithAd} data-testid="doble-anuncio"><Icon name="anuncio" /> {$t('suerte.dobleSeguro')}</button>
      </div>
    {:else}
      <div class="tokens small">
        <span><Icon name="ficha" /> <span class="cifra" data-testid="fichas">{$view.suerte.fichas}</span>/{$view.suerte.max}</span>
        {#if $view.suerte.proxima > 0}<span class="muted">{$t('suerte.siguiente', { t: mm($view.suerte.proxima) })}</span>{/if}
      </div>
      <button type="button" class="btn btn--accent spin" disabled={spinning || $view.suerte.fichas <= 0} onclick={() => play('ficha')} data-testid="girar-ficha">
        <Icon name="ficha" /> {$t('suerte.girar')}
      </button>
      <button type="button" class="btn btn--gold spin" disabled={spinning || $view.suerte.girosAnuncio <= 0} onclick={() => play('anuncio')} data-testid="girar-anuncio">
        <Icon name="anuncio" /> {$t('suerte.girarAnuncio', { n: $view.suerte.girosAnuncio })}
      </button>
    {/if}

    <details class="small muted">
      <summary>{$t('suerte.premios')}</summary>
      <ul>
        <li><Icon name="corona" /><Icon name="corona" /><Icon name="corona" /> {$t('suerte.tabla.jackpot')}</li>
        <li><Icon name="pescado" /><Icon name="pescado" /><Icon name="pescado" /> {$t('suerte.tabla.trio')}</li>
        <li><Icon name="corona" /><Icon name="corona" /> {$t('suerte.tabla.coronas')}</li>
        <li><Icon name="vaso" /><Icon name="vaso" /> {$t('suerte.tabla.par')}</li>
        <li><Icon name="pelos" /> {$t('suerte.tabla.pelos')}</li>
      </ul>
      <p>{$t('suerte.aviso')}</p>
    </details>
  </div>
{/if}

<style>
  .opener {
    position: relative;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .badge {
    position: absolute;
    top: -2px;
    right: -4px;
    min-width: 16px;
    padding: 0 3px;
    border: 2px solid var(--line);
    border-radius: 8px;
    background: var(--danger);
    color: var(--text);
    font-size: 11px;
    line-height: 13px;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(18, 11, 22, 0.7);
  }
  .sheet {
    position: fixed;
    z-index: 41;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 10px;
    width: min(360px, calc(100vw - 24px));
    max-height: calc(100dvh - 40px);
    overflow: auto;
    color: var(--text);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .close {
    width: 36px;
    height: 36px;
    border: 0;
    background: none;
    color: var(--muted);
    font-size: 26px;
    cursor: pointer;
  }
  .machine {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 10px;
    border: 3px solid var(--line);
    border-radius: 8px;
    background: linear-gradient(#8b1e2c, #5a1220);
    box-shadow: inset 0 0 0 3px #d9a441;
  }
  .reel {
    display: grid;
    place-items: center;
    height: 72px;
    border: 2px solid var(--line);
    border-radius: 6px;
    background: #fff8e8;
  }
  .spinning .reel {
    animation: temblor 140ms linear infinite;
  }
  @keyframes temblor {
    50% {
      translate: 0 3px;
    }
  }
  .message {
    margin: 0;
    min-height: 2.6em;
    text-align: center;
    font-weight: 700;
    color: var(--gold);
  }
  .tokens {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .spin {
    width: 100%;
  }
  .double {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  details ul {
    margin: 6px 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }
  details p {
    margin: 4px 0 0;
  }
  .small {
    font-size: 13px;
  }
  .muted {
    color: var(--muted);
  }
  @media (prefers-reduced-motion: reduce) {
    .spinning .reel {
      animation: none;
    }
  }
</style>
