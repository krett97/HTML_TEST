<script lang="ts">
  // Globito del tutorial: el gato explica un paso y una manita señala dónde tocar (los botones
  // llevan data-tuto="<paso>"; el brillo está en global.css). La lógica está en core/tutorial.ts.
  import { ART_FILES } from '../game/art';
  import { INFO_STEPS } from '../core/tutorial';
  import { t } from '../i18n';
  import { useGame } from './context';

  const game = useGame();
  const view = game.view;
  const step = $derived($view.tutorial);

  // El paso actual va en <html data-tuto="…"> para que su botón brille aunque esté en otra parte.
  $effect(() => {
    const root = document.documentElement;
    if (step) root.dataset.tuto = step;
    else delete root.dataset.tuto;
    return () => delete root.dataset.tuto;
  });

  // Si lo que hay que tocar quedó abajo en la lista, se desplaza hasta verlo.
  $effect(() => {
    if (!step) return;
    const timer = setTimeout(() => {
      document.querySelector(`.panel [data-tuto='${step}']`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  });
</script>

{#if step}
  {#key step}
    <div class="tuto" class:arriba={step === 'monedas'} role="status" aria-label={$t('tutorial.gato')} data-testid="tutorial">
      <img class="cara" src={ART_FILES.gato} alt="" />
      <div class="globo">
        <p data-testid="tutorial-{step}">{$t(`tutorial.${step}`)}</p>
        <div class="acciones">
          <button type="button" class="saltar" onclick={() => game.skipTutorial()} data-testid="saltar-tutorial">{$t('tutorial.saltar')}</button>
          {#if INFO_STEPS.includes(step)}
            <button type="button" class="btn btn--accent ok" onclick={() => game.tutorialOk(step)} data-testid="tutorial-ok">{$t('tutorial.ok')}</button>
          {/if}
        </div>
      </div>
      {#if step === 'tocar'}<span class="dedo" aria-hidden="true">👆</span>{/if}
    </div>
  {/key}
{/if}

<style>
  .tuto {
    position: absolute;
    z-index: 6;
    left: 8px;
    right: 8px;
    bottom: 8px;
    display: flex;
    align-items: flex-end;
    gap: 6px;
    max-width: 420px;
    margin: 0 auto;
    /* Los toques pasan a la escena, salvo en los botones. */
    pointer-events: none;
    animation: entra 260ms ease-out;
  }
  /* "Monedas" señala el contador de arriba: el globito se sube. */
  .tuto.arriba {
    top: 8px;
    bottom: auto;
    align-items: flex-start;
  }
  .cara {
    flex: none;
    width: 48px;
    height: auto;
    image-rendering: pixelated;
    filter: drop-shadow(0 2px 0 var(--line));
  }
  .globo {
    position: relative;
    flex: 1;
    display: grid;
    gap: 6px;
    padding: 8px 10px;
    border: 2px solid var(--line);
    border-radius: 8px;
    background: #fff8e8;
    color: #2b1d2f;
    box-shadow: 0 3px 0 var(--line);
  }
  /* Piquito del globo hacia la cara del gato. */
  .globo::before {
    content: '';
    position: absolute;
    left: -9px;
    bottom: 12px;
    border: 8px solid transparent;
    border-right-color: var(--line);
    border-left: 0;
  }
  .arriba .globo::before {
    top: 12px;
    bottom: auto;
  }
  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 700;
  }
  .acciones {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .acciones button {
    pointer-events: auto;
  }
  .saltar {
    padding: 4px 0;
    border: 0;
    background: none;
    color: #7a6a80;
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
  }
  .ok {
    min-height: 36px;
    padding: 4px 16px;
    font-size: 15px;
  }
  .dedo {
    position: absolute;
    left: 36%;
    top: -64px;
    font-size: 34px;
    animation: toca 700ms ease-in-out infinite alternate;
  }
  @keyframes toca {
    to {
      transform: translateY(-10px) scale(0.9);
    }
  }
  @keyframes entra {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tuto,
    .dedo {
      animation: none;
    }
  }
</style>
