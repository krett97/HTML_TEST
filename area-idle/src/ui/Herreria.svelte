<script lang="ts">
  // Herrería: mejorar el equipo con Runas. Cada intento puede salir o no; cada fallo suma +10 % al
  // siguiente intento de esa pieza. El dibujo de arriba muestra cómo se ve el grupo con su equipo.
  import { bonosEquipo, chanceOf, costoPieza, GRUPOS, NIVEL_MAX, nivelPieza, PIEZAS, tierDe, type Grupo, type Intento, type PiezaId } from '../core/equipo';
  import { formatNum } from '../core/format';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  let grupo = $state<Grupo>('mago');
  let ultimo = $state<{ id: PiezaId; r: Intento; n: number } | null>(null);
  let veces = 0;

  const meta = $derived($view.meta);
  const eq = $derived(meta.equipo);
  const DIBUJO: Record<Grupo, string> = { mago: 'mago', arqueros: 'arquero', base: 'torre' };
  const dibujo = (g: Grupo) => {
    const tier = tierDe(eq.niveles, g);
    return artUrl(tier ? `${DIBUJO[g]}_${tier}` : DIBUJO[g]);
  };
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  /** Lo que da la pieza ahora y con un nivel más. */
  function bono(id: PiezaId, nivel: number): string {
    const b = bonosEquipo({ [id]: nivel });
    const mas = (x: number) => `+${Math.round((x - 1) * 100)}%`;
    switch (id) {
      case 'baculo': return mas(b.magoDanio);
      case 'tunica': return mas(1 / b.magoIntervalo);
      case 'sombrero': return mas(b.magoArea);
      case 'arco': return mas(b.arcoDanio);
      case 'flechas': return mas(1 / b.arcoIntervalo);
      case 'armadura': return `${mas(b.arcoDanio)} · +${b.arcoObjetivos}`;
      case 'muralla': return mas(b.muroVida);
      case 'torre': return mas(b.danio);
      default: return mas(b.oro);
    }
  }

  function intentar(id: PiezaId) {
    const r = juego.forge(id);
    if (r) ultimo = { id, r, n: ++veces };
  }
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('herreria.titulo')} data-testid="herreria">
  <header>
    <h2><Icon name="herreria" size={30} /> {$t('herreria.titulo')}</h2>
    <div class="pill"><Icon name="runa" size={22} /><span class="cifra" data-testid="herreria-runas">{formatNum(meta.runas)}</span></div>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>

  <div class="pestanas" role="tablist">
    {#each GRUPOS as g (g)}
      <button type="button" role="tab" class="pestana" class:activa={grupo === g} aria-selected={grupo === g} onclick={() => ((grupo = g), (ultimo = null))} data-testid="grupo-{g}">
        <img src={dibujo(g)} alt="" width="34" height="34" />{$t(`herreria.grupos.${g}`)}
      </button>
    {/each}
  </div>

  <div class="vista">
    <img src={dibujo(grupo)} alt="" width="96" height="96" data-testid="vista-equipo" />
    <div>
      <strong>{$t(`herreria.grupos.${grupo}`)}</strong>
      <span class="muted">{$t('herreria.aspecto', { n: tierDe(eq.niveles, grupo), max: 3 })}</span>
    </div>
  </div>

  {#each PIEZAS.filter((p) => p.grupo === grupo) as p (p.id)}
    {@const nivel = nivelPieza(eq, p.id)}
    {@const chance = chanceOf(eq, p.id)}
    {@const extra = eq.suerte[p.id] ?? 0}
    <article class="pieza" class:exito={ultimo?.id === p.id && ultimo.r.exito} class:fallo={ultimo?.id === p.id && !ultimo.r.exito} data-testid="pieza-{p.id}">
      <Icon name={p.icono} size={40} />
      <div class="info">
        <strong>{$t(`herreria.piezas.${p.id}.nombre`)} <span class="nivel cifra" data-testid="nivel-{p.id}">+{nivel}</span></strong>
        <span class="muted">{$t(`herreria.piezas.${p.id}.efecto`)}: {bono(p.id, nivel)}{#if nivel < NIVEL_MAX} → {bono(p.id, nivel + 1)}{/if}</span>
        {#if nivel < NIVEL_MAX}
          <span class="chance cifra" data-testid="chance-{p.id}">{$t('herreria.probabilidad', { p: pct(chance) })}{#if extra > 0} <em>({$t('herreria.porFallos', { p: pct(extra) })})</em>{/if}</span>
        {/if}
      </div>
      {#if nivel < NIVEL_MAX}
        <button type="button" class="btn btn--accent" disabled={meta.runas < costoPieza(nivel)} onclick={() => intentar(p.id)} data-testid="mejorar-{p.id}">
          <Icon name="runa" size={18} /><span class="cifra">{costoPieza(nivel)}</span>
        </button>
      {:else}
        <span class="max">{$t('arbol.max')}</span>
      {/if}
    </article>
  {/each}

  {#if ultimo}
    {#key ultimo.n}
      <p class="resultado" class:bien={ultimo.r.exito} data-testid={ultimo.r.exito ? 'forja-exito' : 'forja-fallo'}>
        {ultimo.r.exito ? $t('herreria.exito', { n: ultimo.r.nivel }) : $t('herreria.fallo', { p: pct(ultimo.r.siguiente) })}
      </p>
    {/key}
  {/if}
  <p class="muted nota">{$t('herreria.como')}</p>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 52;
    background: rgba(18, 22, 18, 0.55);
  }
  .sheet {
    position: fixed;
    z-index: 53;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 8px;
    width: min(420px, calc(100vw - 16px));
    max-height: calc(100dvh - 20px);
    overflow: auto;
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
  .pill {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px 2px 4px;
    border: var(--borde);
    border-radius: 999px;
    background: #dcecff;
    font-size: 17px;
  }
  .redondo {
    width: 38px;
    height: 38px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel-2);
  }
  .pestanas {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .pestana {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 44px;
    border: var(--borde);
    border-radius: 12px;
    background: #fff;
    color: var(--muted);
    font-size: 13px;
  }
  .pestana img {
    object-fit: contain;
  }
  .pestana.activa {
    background: linear-gradient(#cfe4ff, #9ac4f5);
    color: var(--text);
  }
  .vista {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: radial-gradient(circle at 25% 50%, #fff6d8, #fff 60%);
  }
  .vista img {
    object-fit: contain;
  }
  .vista div {
    display: grid;
  }
  .muted {
    color: var(--muted);
    font-size: 12px;
  }
  .pieza {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: #fff;
    transition: background-color 0.3s;
  }
  .pieza.exito {
    background: #e2f7dc;
  }
  .pieza.fallo {
    background: #ffe6e1;
  }
  .info {
    display: grid;
    min-width: 0;
    font-size: 14px;
  }
  .nivel {
    color: #3a78c8;
  }
  .chance {
    font-size: 12px;
  }
  .chance em {
    color: #2f8a3a;
    font-style: normal;
  }
  .pieza .btn {
    min-width: 62px;
    min-height: 40px;
    padding: 4px 10px;
    font-size: 16px;
  }
  .max {
    color: var(--muted);
    font-weight: 700;
  }
  .resultado {
    margin: 0;
    padding: 6px 10px;
    border-radius: 12px;
    background: #ffe6e1;
    color: #a6382c;
    font-weight: 700;
    text-align: center;
    animation: salta 0.35s ease-out;
  }
  .resultado.bien {
    background: #e2f7dc;
    color: #2f7a2a;
  }
  @keyframes salta {
    from {
      transform: scale(0.85);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  .nota {
    margin: 0;
  }
</style>
