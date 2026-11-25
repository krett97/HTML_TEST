<script lang="ts">
  // Misiones (desde el nivel 11): las 3 diarias (se renuevan a medianoche, con bono por completarlas
  // todas) y las permanentes. Cada una dice cuánto llevas y cuántas gemas da; se cobran con un toque.
  import { formatDuration, formatNum } from '../core/format';
  import { BONO_DIARIO, bonusReady, dailyProgress, msUntilReset, permanentProgress, type MissionProgress } from '../core/misiones';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';
  import { artUrl } from './icons';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  let pestana = $state<'diarias' | 'permanentes'>('diarias');

  const meta = $derived($view.meta);
  const diarias = $derived(dailyProgress(meta));
  // Las permanentes: primero las que se pueden cobrar, luego las pendientes y al final las cobradas.
  const permanentes = $derived(
    [...permanentProgress(meta)].sort((a, b) => Number(b.completa && !b.cobrada) - Number(a.completa && !a.cobrada) || Number(a.cobrada) - Number(b.cobrada)),
  );
  const bono = $derived(bonusReady(meta));
  const bonoCobrado = $derived(meta.misiones.bono);
  const listas = (ps: MissionProgress[]) => ps.filter((p) => p.completa && !p.cobrada).length;
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('misiones.titulo')} data-testid="misiones">
  <header>
    <h2><Icon name="misiones" size={30} /> {$t('misiones.titulo')}</h2>
    <div class="pill gemas"><Icon name="gema" size={22} /><span class="cifra">{formatNum(meta.gemas)}</span></div>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>

  <div class="pestanas" role="tablist">
    {#each ['diarias', 'permanentes'] as const as p (p)}
      {@const n = listas(p === 'diarias' ? diarias : permanentes) + (p === 'diarias' && bono ? 1 : 0)}
      <button type="button" role="tab" class="pestana" class:activa={pestana === p} aria-selected={pestana === p} onclick={() => (pestana = p)} data-testid="misiones-{p}">
        {$t(`misiones.${p}`)}{#if n > 0}<span class="punto cifra">{n}</span>{/if}
      </button>
    {/each}
  </div>

  {#if pestana === 'diarias'}
    <p class="muted">{$t('misiones.renueva', { t: formatDuration(msUntilReset(Date.now()) / 1000) })}</p>
  {/if}

  <div class="lista">
    {#each pestana === 'diarias' ? diarias : permanentes as p (p.def.id)}
      <article class="mision" class:cobrada={p.cobrada} class:lista={p.completa && !p.cobrada} data-testid="mision-{p.def.id}">
        {#if p.def.icono.startsWith('arte:')}<img src={artUrl(p.def.icono.slice(5))} alt="" width="36" height="36" />{:else}<Icon name={p.def.icono} size={36} />{/if}
        <div class="info">
          <span>{$t(`misiones.textos.${p.def.id}`, { n: formatNum(p.def.meta) })}</span>
          <span class="barra"><span class="lleno" style:width="{(100 * p.actual) / p.def.meta}%"></span><span class="cuenta cifra">{formatNum(p.actual)}/{formatNum(p.def.meta)}</span></span>
        </div>
        {#if p.cobrada}
          <span class="hecho"><Icon name="check" size={28} /></span>
        {:else}
          <button type="button" class="btn btn--accent cobrar" disabled={!p.completa} onclick={() => juego.claim(p.def.id)} data-testid="cobrar-{p.def.id}">
            <Icon name="gema" size={18} /><span class="cifra">{p.def.gemas}</span>
          </button>
        {/if}
      </article>
    {/each}
    {#if pestana === 'diarias'}
      <article class="mision bono" class:lista={bono} class:cobrada={bonoCobrado} data-testid="mision-bono">
        <Icon name="gema" size={36} />
        <div class="info"><span>{$t('misiones.bono')}</span></div>
        {#if bonoCobrado}
          <span class="hecho"><Icon name="check" size={28} /></span>
        {:else}
          <button type="button" class="btn btn--accent cobrar" disabled={!bono} onclick={() => juego.claim('bono')} data-testid="cobrar-bono">
            <Icon name="gema" size={18} /><span class="cifra">{BONO_DIARIO}</span>
          </button>
        {/if}
      </article>
    {/if}
  </div>
  <p class="muted">{$t('misiones.gastar')}</p>
</div>

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
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 10px;
    width: min(400px, calc(100vw - 20px));
    max-height: calc(100dvh - 24px);
    overflow: auto;
    padding: 14px;
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
    margin: 0;
    flex: 1;
    font-size: 22px;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px 2px 4px;
    border: var(--borde);
    border-radius: 999px;
    background: #efe4ff;
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
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .pestana {
    position: relative;
    min-height: 40px;
    border: var(--borde);
    border-radius: 12px;
    background: #fff;
    color: var(--muted);
  }
  .pestana.activa {
    background: linear-gradient(#e0c8ff, #c9a9f5);
    color: var(--text);
  }
  .punto {
    position: absolute;
    top: -8px;
    right: -6px;
    min-width: 20px;
    padding: 0 5px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--danger);
    color: #fff;
    font-size: 12px;
  }
  .muted {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
  .lista {
    display: grid;
    gap: 8px;
  }
  .mision {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: #fff;
  }
  .mision img {
    object-fit: contain;
  }
  .mision.lista {
    background: #f3eaff;
    box-shadow: 0 0 0 3px #c9a9f5;
  }
  .mision.cobrada {
    opacity: 0.6;
  }
  .info {
    display: grid;
    gap: 4px;
    min-width: 0;
    font-size: 14px;
  }
  .barra {
    position: relative;
    height: 16px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: #ece4f7;
    overflow: hidden;
  }
  .lleno {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(#c9a9f5, #a46cf0);
  }
  .cuenta {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 11px;
  }
  .cobrar {
    min-width: 64px;
    min-height: 40px;
    padding: 4px 10px;
    font-size: 16px;
  }
  .hecho {
    display: grid;
    place-items: center;
    min-width: 64px;
  }
</style>
