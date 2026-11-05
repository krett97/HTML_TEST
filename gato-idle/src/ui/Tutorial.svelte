<script lang="ts">
  import Icon from './Icon.svelte';
  import Rich from './Rich.svelte';
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
    <!-- Arriba de la escena, chiquito: el gato y lo que rompe quedan a la vista. -->
    <div class="tuto" role="status" aria-label={$t('tutorial.gato')} data-testid="tutorial">
      <img class="cara" src={ART_FILES.gato} alt="" />
      <div class="globo">
        <p data-testid="tutorial-{step}"><Rich text={$t(`tutorial.${step}`)} /></p>
        <div class="acciones">
          <button type="button" class="saltar" onclick={() => game.skipTutorial()} data-testid="saltar-tutorial">{$t('tutorial.saltar')}</button>
          {#if INFO_STEPS.includes(step)}
            <button type="button" class="btn btn--accent ok" onclick={() => game.tutorialOk(step)} data-testid="tutorial-ok">{$t('tutorial.ok')}</button>
          {/if}
        </div>
      </div>
    </div>
    {#if step === 'tocar'}<span class="dedo"><Icon name="mano" size={36} /></span>{/if}
  {/key}
{/if}

<style>
  .tuto {
    position: absolute;
    z-index: 7;
    top: 6px;
    left: 8px;
    right: 8px;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    max-width: 360px;
    margin: 0 auto;
    /* Los toques pasan a la escena, salvo en los botones. */
    pointer-events: none;
    animation: entra 260ms ease-out;
  }
  .cara {
    flex: none;
    width: 34px;
    height: auto;
    image-rendering: pixelated;
    filter: drop-shadow(0 2px 0 var(--line));
  }
  .globo {
    position: relative;
    flex: 1;
    display: grid;
    gap: 2px;
    padding: 5px 8px;
    border: 2px solid var(--line);
    border-radius: 8px;
    background: rgba(255, 248, 232, 0.94);
    color: #2b1d2f;
    box-shadow: 0 2px 0 var(--line);
  }
  /* Piquito del globo hacia la cara del gato. */
  .globo::before {
    content: '';
    position: absolute;
    top: 9px;
    left: -9px;
    border: 7px solid transparent;
    border-right-color: var(--line);
    border-left: 0;
  }
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.25;
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
    padding: 2px 0;
    border: 0;
    background: none;
    color: #7a6a80;
    font-size: 11px;
    text-decoration: underline;
    cursor: pointer;
  }
  .ok {
    min-height: 30px;
    padding: 2px 14px;
    font-size: 14px;
  }
  /* La manita señala el centro de la escena: "toca aquí". */
  .dedo {
    position: absolute;
    z-index: 7;
    left: 50%;
    bottom: 22%;
    pointer-events: none;
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
      transform: translateY(-8px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tuto,
    .dedo {
      animation: none;
    }
  }
</style>
