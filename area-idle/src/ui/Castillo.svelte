<script lang="ts">
  // Un castillo del PvP: la muralla, la torre, el mago y los arqueros de un jugador, con el aspecto de su
  // equipo. Abajo el tuyo (como en el juego); arriba el del rival, volteado. Al recibir un golpe tiembla;
  // el del que pierde se derrumba y el del que gana festeja.
  import type { Ejercito } from '../core/pvp';
  import { artUrl } from './icons';
  import { conEtapa, puestos, type Lado } from './pvpEscena';

  let {
    ejercito,
    lado,
    ancho,
    alto,
    banda,
    recibe = false,
    cae = false,
    festeja = false,
    testid = undefined,
  }: { ejercito: Ejercito; lado: Lado; ancho: number; alto: number; banda: number; recibe?: boolean; cae?: boolean; festeja?: boolean; testid?: string } = $props();

  const p = $derived(puestos(ejercito, lado, ancho, alto, banda));
  const muro = $derived(artUrl(conEtapa('muralla', ejercito.etapas.base)));
</script>

<div class="castillo {lado}" class:recibe class:cae class:festeja data-testid={testid} data-arqueros={ejercito.arqueros} data-mago={ejercito.mago}>
  <div class="muro" style:top="{p.muro.y}px" style:height="{p.muro.h}px" style:background-image="url({muro})" style:background-size="auto {p.muro.h}px"></div>
  <img class="torre" src={artUrl(conEtapa('torre', ejercito.etapas.base))} alt="" style:left="{p.torre.x}px" style:top="{p.torre.y}px" style:width="{p.torre.w}px" style:height="{p.torre.h}px" />
  {#if p.mago}
    <img class="unidad mago" src={artUrl(conEtapa('mago', ejercito.etapas.mago))} alt="" style:left="{p.mago.x}px" style:top="{p.mago.y}px" style:height="{p.mago.h}px" />
  {/if}
  {#each p.arqueros as a, i (i)}
    <img class="unidad arquero" src={artUrl(conEtapa('arquero', ejercito.etapas.arqueros))} alt="" style:left="{a.x}px" style:top="{a.y}px" style:height="{a.h}px" style:--retraso="{i * 70}ms" />
  {/each}
</div>

<style>
  .castillo {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .muro {
    position: absolute;
    left: 0;
    right: 0;
    background-repeat: repeat-x;
    background-position: left bottom;
  }
  /* El del rival: la muralla volteada (las almenas hacia el campo) y la torre a la derecha. */
  .arriba .muro {
    transform: scaleY(-1);
  }
  .torre {
    position: absolute;
  }
  .arriba .torre {
    transform: scaleX(-1);
  }
  .unidad {
    position: absolute;
    width: auto;
    translate: -50% -100%;
  }
  .arriba .unidad {
    scale: -1 1;
  }
  .recibe .muro,
  .recibe .torre {
    animation: tiembla 0.26s linear;
    filter: sepia(0.6) saturate(3) hue-rotate(-30deg);
  }
  @keyframes tiembla {
    25% {
      translate: -3px 1px;
    }
    50% {
      translate: 3px -1px;
    }
    75% {
      translate: -2px 0;
    }
  }
  /* Se derrumba: tiembla, se hunde y queda gris; sus tropas caen. */
  .cae .muro,
  .cae .torre {
    animation: derrumbe 1s ease-in forwards;
  }
  .cae .unidad {
    animation: caen 0.7s ease-in forwards;
  }
  @keyframes derrumbe {
    0%,
    30% {
      translate: 0 0;
      filter: none;
    }
    10% {
      translate: -4px 0;
    }
    20% {
      translate: 4px 0;
    }
    100% {
      translate: 0 18%;
      rotate: 2deg;
      filter: grayscale(1) brightness(0.7);
      opacity: 0.75;
    }
  }
  @keyframes caen {
    to {
      rotate: 80deg;
      opacity: 0;
      translate: -50% -40%;
    }
  }
  .festeja .unidad {
    animation: festeja 0.5s ease-in-out infinite alternate;
    animation-delay: var(--retraso, 0ms);
  }
  @keyframes festeja {
    to {
      translate: -50% -118%;
    }
  }
</style>
