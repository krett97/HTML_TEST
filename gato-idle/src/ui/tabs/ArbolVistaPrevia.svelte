<script lang="ts">
  // Vista previa del árbol en la pestaña Canal: los íconos de cada piso y cuántas mejoras se pueden
  // subir. Al tocarla se abre el árbol en pantalla completa.
  import Icon from '../Icon.svelte';
  import { t } from '../../i18n';
  import { useGame } from '../context';
  import { BRANCHES, SKILL_ICONS } from '../arbolIcons';
  import { arbolAbierto } from '../pantalla';

  const view = useGame().view;
  const arbol = $derived($view.canal.arbol);
  const floors = $derived(arbol.pisos.map((piso, i) => ({ ...piso, i, nodos: BRANCHES.map((rama) => arbol.habilidades.find((h) => h.rama === rama && h.piso === i)) })));
  const listas = $derived(arbol.habilidades.filter((h) => h.alcanza).length);
</script>

<button type="button" class="card preview" class:ready={listas > 0} onclick={() => arbolAbierto.set(true)} data-testid="abrir-arbol">
  <span class="top">
    <span class="small muted">{$t('canal.arbol.paraGastar')}</span>
    <strong class="cifra"><Icon name="visualizaciones" /> {$view.canal.visualizaciones}</strong>
  </span>
  <span class="mini" aria-hidden="true">
    {#each floors as floor (floor.i)}
      {#each floor.nodos as skill, col (col)}
        {#if skill}
          <span class="dot" class:apagado={!skill.disponible} class:maximo={skill.maximo} class:alcanza={skill.alcanza}>
            <Icon name={skill.pisoAbierto ? SKILL_ICONS[skill.id]! : 'pregunta'} size={22} />
          </span>
        {:else}<span></span>{/if}
      {/each}
    {/each}
  </span>
  <span class="cta">
    {#if listas > 0}<span class="gold">{$t('canal.arbol.listas', { n: listas })}</span>{/if}
    <span>{$t('canal.arbol.abrir')} →</span>
  </span>
</button>

<style>
  .preview {
    display: grid;
    gap: 8px;
    width: 100%;
    text-align: left;
    color: var(--text);
    font: inherit;
    cursor: pointer;
  }
  .preview:active {
    transform: translateY(1px);
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .top strong {
    font-size: 18px;
  }
  .mini {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    justify-items: center;
    gap: 6px;
  }
  .dot {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 2px solid var(--line);
    border-radius: 50%;
    background: var(--panel);
  }
  .dot.apagado {
    filter: grayscale(1);
    opacity: 0.45;
  }
  .dot.maximo {
    border-color: var(--gold);
  }
  .dot.alcanza {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgba(255, 211, 110, 0.35);
  }
  .cta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
  }
  .cta span:last-child {
    margin-left: auto;
    color: var(--accent);
  }
  .small {
    font-size: 13px;
  }
  .muted {
    color: var(--muted);
  }
  .gold {
    color: var(--gold);
  }
</style>
