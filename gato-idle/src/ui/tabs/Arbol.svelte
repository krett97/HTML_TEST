<script lang="ts">
  import { t } from '../../i18n';
  import type { SkillView } from '../../app/game';
  import { useGame } from '../context';

  const game = useGame();
  const view = game.view;

  const BRANCHES = ['manotazo', 'pandilla', 'produccion', 'viral'] as const;
  const BRANCH_ICONS: Record<string, string> = { manotazo: '🐱', pandilla: '🐶', produccion: '🎬', viral: '🔥' };
  const SKILL_ICONS: Record<string, string> = {
    embestida: '🏎️',
    pesas: '🏋️',
    garrasLargas: '💅',
    pandilla: '🐾',
    croquetas: '🦴',
    veterinario: '🩺',
    recolectora: '🤖',
    express: '🧪',
    patrocinador: '🤝',
    clickbait: '😱',
    miniaturas: '🖼️',
    hashtags: '#️⃣',
  };

  const arbol = $derived($view.canal.arbol);
  const floors = $derived(arbol.pisos.map((piso, i) => ({ ...piso, i, nodos: BRANCHES.map((rama) => arbol.habilidades.find((h) => h.rama === rama && h.piso === i)) })));

  let selectedId = $state('embestida');
  const selected = $derived(arbol.habilidades.find((h) => h.id === selectedId) ?? arbol.habilidades[0]!);

  // Mensaje tras ver un anuncio para reiniciar.
  let resetNote = $state('');
  let watching = $state(false);

  function nodeState(skill: SkillView): string {
    if (!skill.pisoAbierto) return 'secreto';
    if (skill.maximo) return 'maximo';
    if (!skill.disponible) return 'bloqueado';
    return skill.alcanza ? 'alcanza' : 'disponible';
  }

  async function watchResetAd() {
    watching = true;
    const before = arbol.anuncios;
    const gastado = arbol.gastado;
    const ok = await game.watchTreeResetAd();
    watching = false;
    if (!ok) return;
    resetNote = before + 1 >= arbol.anunciosMax ? $t('canal.arbol.reiniciado', { n: gastado }) : '';
  }
</script>

<div class="tree-head card">
  <div>
    <span class="muted small">{$t('canal.arbol.paraGastar')}</span>
    <strong class="cifra" data-testid="para-gastar">👁️ {$view.canal.visualizaciones}</strong>
  </div>
  <div class="right">
    <span class="muted small">{$t('canal.seguidores')}</span>
    <strong class="cifra">👥 {$view.canal.seguidores}</strong>
  </div>
</div>
<p class="small muted intro">{$t('canal.arbol.intro')}</p>

<div class="tree" data-testid="arbol">
  <div class="row heads">
    {#each BRANCHES as rama (rama)}
      <div class="head"><span aria-hidden="true">{BRANCH_ICONS[rama]}</span>{$t(`canal.ramas.${rama}`)}</div>
    {/each}
  </div>
  {#each floors as floor (floor.i)}
    <div class="row" class:fog={!floor.abierto}>
      {#each floor.nodos as skill, col (col)}
        {#if skill}
          {@const st = nodeState(skill)}
          <button
            type="button"
            class="node {st}"
            class:selected={skill.id === selected.id}
            class:child={floor.i > 0}
            onclick={() => {
              selectedId = skill.id;
              resetNote = '';
            }}
            aria-label={st === 'secreto' ? '???' : $t(`canal.nombres.${skill.id}`)}
            data-testid="nodo-{skill.id}"
          >
            <span class="node-icon" aria-hidden="true">{st === 'secreto' ? '?' : SKILL_ICONS[skill.id]}</span>
            {#if st !== 'secreto'}
              <span class="badge cifra">{skill.maximo ? $t('canal.max') : `${skill.nivel}/${skill.max}`}</span>
            {/if}
          </button>
        {:else}
          <span></span>
        {/if}
      {/each}
      {#if !floor.abierto}
        <div class="lock small">🔒 {$t('canal.arbol.pisoBloqueado', { meta: floor.meta })}</div>
      {/if}
    </div>
  {/each}
</div>

<!-- Ficha de la habilidad elegida. -->
<div class="card detail" data-testid="ficha">
  {#if !selected.pisoAbierto}
    <div class="name">??? <span class="level">{$t(`canal.ramas.${selected.rama}`)}</span></div>
    <div class="effect">{$t('canal.arbol.pisoBloqueado', { meta: arbol.pisos[selected.piso]!.meta })}</div>
  {:else}
    <div class="name">
      <span aria-hidden="true">{SKILL_ICONS[selected.id]}</span>
      {$t(`canal.nombres.${selected.id}`)}
      <span class="level">{selected.maximo ? $t('canal.max') : `${selected.nivel}/${selected.max}`}</span>
    </div>
    <div class="effect">
      {$t(`canal.efectos.${selected.id}`, { actual: selected.actual, siguiente: selected.maximo ? selected.actual : selected.siguiente })}
    </div>
    {#if selected.maximo}
      <div class="small gold">✓ {$t('canal.arbol.completa')}</div>
    {:else if !selected.disponible}
      <div class="small muted">🔒 {$t('canal.arbol.requiere', { padre: $t(`canal.nombres.${selected.padre}`) })}</div>
    {:else}
      <button
        type="button"
        class="btn btn--accent buy"
        disabled={!selected.alcanza}
        onclick={() => game.buySkill(selected.id)}
        data-testid="comprar-habilidad"
      >
        {$t('canal.arbol.subir')} · 👁️ <span class="cifra">{selected.costo}</span>
      </button>
    {/if}
  {/if}
</div>

{#if !arbol.vacio}
  <div class="card reset" data-testid="reiniciar-arbol">
    <div class="name">🔄 {$t('canal.arbol.reiniciar')}</div>
    <p class="small muted note">{$t('canal.arbol.reiniciarExplica', { gastado: arbol.gastado, max: arbol.anunciosMax })}</p>
    <div class="ads" aria-label="{arbol.anuncios}/{arbol.anunciosMax}">
      {#each Array.from({ length: arbol.anunciosMax }, (_, i) => i) as i (i)}
        <span class="ad-dot" class:done={i < arbol.anuncios}>📺</span>
      {/each}
    </div>
    <button type="button" class="btn" disabled={watching} onclick={watchResetAd} data-testid="anuncio-arbol">
      {$t('canal.arbol.verAnuncio', { n: arbol.anuncios + 1, max: arbol.anunciosMax })}
    </button>
  </div>
{/if}
{#if resetNote}
  <p class="small gold note" data-testid="arbol-reiniciado">{resetNote}</p>
{/if}

<style>
  .card {
    padding: 10px 12px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  .tree-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 10px;
  }
  .tree-head div {
    display: grid;
  }
  .tree-head .right {
    text-align: right;
  }
  .tree-head strong {
    font-size: 20px;
  }
  .intro {
    margin: 0 2px;
  }
  .tree {
    display: grid;
    gap: 14px;
    padding: 10px 6px 12px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel);
  }
  .row {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    justify-items: center;
    gap: 4px;
  }
  .heads {
    margin-bottom: -6px;
  }
  .head {
    display: grid;
    justify-items: center;
    font-size: 11px;
    color: var(--muted);
    text-align: center;
  }
  .head span {
    font-size: 18px;
  }
  .node {
    position: relative;
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    padding: 0;
    border: 3px solid var(--line);
    border-radius: 50%;
    background: var(--panel-2);
    color: var(--text);
    cursor: pointer;
  }
  /* Rama: una línea une cada habilidad con la de arriba. */
  .node.child::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    width: 4px;
    height: 17px;
    margin-left: -2px;
    background: var(--line);
  }
  .node.maximo,
  .node.maximo.child::before {
    border-color: var(--gold);
  }
  .node.maximo.child::before,
  .node.disponible.child::before,
  .node.alcanza.child::before {
    background: var(--gold);
  }
  .node.alcanza {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(255, 211, 110, 0.35);
    animation: latido 900ms ease-in-out infinite;
  }
  .node.bloqueado {
    filter: grayscale(1);
    opacity: 0.55;
  }
  .node.secreto {
    background: var(--bg);
    color: var(--muted);
    opacity: 0.6;
  }
  .node.selected {
    outline: 3px solid var(--text);
    outline-offset: 2px;
  }
  @keyframes latido {
    50% {
      scale: 1.07;
    }
  }
  .node-icon {
    font-size: 24px;
    line-height: 1;
  }
  .badge {
    position: absolute;
    bottom: -8px;
    padding: 0 4px;
    border: 2px solid var(--line);
    border-radius: 3px;
    background: var(--bg);
    font-size: 10px;
    line-height: 13px;
  }
  .node.maximo .badge {
    background: var(--gold);
    color: var(--line);
  }
  /* Piso cerrado: niebla encima y cuántos seguidores lo abren. */
  .fog::after {
    content: '';
    position: absolute;
    inset: -6px -4px;
    border-radius: 4px;
    background: repeating-linear-gradient(135deg, rgba(30, 20, 36, 0.55) 0 6px, rgba(30, 20, 36, 0.35) 6px 12px);
    pointer-events: none;
  }
  .lock {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    translate: -50% -50%;
    padding: 2px 8px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--bg);
    white-space: nowrap;
    pointer-events: none;
  }
  .detail {
    display: grid;
    gap: 4px;
    border-color: var(--gold);
  }
  .name {
    font-weight: 700;
  }
  .level {
    margin-left: 4px;
    color: var(--muted);
    font-weight: 400;
    font-size: 14px;
  }
  .effect {
    font-size: 13px;
    color: var(--muted);
  }
  .buy {
    width: 100%;
    margin-top: 4px;
  }
  .reset {
    display: grid;
    gap: 6px;
  }
  .ads {
    display: flex;
    gap: 6px;
  }
  .ad-dot {
    filter: grayscale(1);
    opacity: 0.45;
  }
  .ad-dot.done {
    filter: none;
    opacity: 1;
  }
  .note {
    margin: 0;
  }
  .muted {
    color: var(--muted);
  }
  .small {
    font-size: 13px;
  }
  .gold {
    color: var(--gold);
  }
</style>
