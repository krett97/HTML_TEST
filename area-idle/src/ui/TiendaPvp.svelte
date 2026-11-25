<script lang="ts">
  // Tienda del PvP: se paga con medallas (3 por pelea ganada, 1 por perdida y un premio cada semana).
  import { formatNum } from '../core/format';
  import { cofreOro } from './pvpTexto';
  import { canBuy, COFRE_MINUTOS, ESTANDARTE, GEMAS_POR_BOLSA, INTENTOS_MAX, shopCost, TIENDA } from '../core/pvp';
  import { t } from '../i18n';
  import { useJuego } from './context';
  import Icon from './Icon.svelte';

  let { cerrar }: { cerrar: () => void } = $props();
  const juego = useJuego();
  const view = juego.view;
  const meta = $derived($view.meta);
  const p = $derived(meta.pvp);

  function texto(id: string): string {
    if (id === 'oro') return $t('tienda.oroTexto', { n: formatNum(cofreOro(meta)), m: COFRE_MINUTOS });
    if (id === 'gemas') return $t('tienda.gemasTexto', { n: GEMAS_POR_BOLSA });
    if (id === 'intento') return $t('tienda.intentoTexto', { n: p.intentos, max: INTENTOS_MAX });
    return $t('tienda.estandarteTexto', { a: Math.round(p.estandarte * ESTANDARTE.porNivel * 100), b: Math.round((p.estandarte + 1) * ESTANDARTE.porNivel * 100), n: p.estandarte, max: ESTANDARTE.max });
  }
</script>

<div class="backdrop" role="presentation" onclick={cerrar}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={$t('tienda.titulo')} data-testid="tienda-pvp">
  <header>
    <h2><Icon name="tienda" size={30} /> {$t('tienda.titulo')}</h2>
    <div class="pill"><Icon name="medalla" size={22} /><span class="cifra">{formatNum(p.medallas)}</span></div>
    <button type="button" class="redondo" aria-label={$t('arbol.cerrar')} onclick={cerrar}>✕</button>
  </header>
  {#each TIENDA as item (item.id)}
    <article class="item">
      <Icon name={item.icono} size={40} />
      <div class="info">
        <strong>{$t(`tienda.${item.id}`)}</strong>
        <span class="muted">{texto(item.id)}</span>
      </div>
      <button type="button" class="btn btn--accent" disabled={!canBuy(p, item.id)} onclick={() => juego.pvpBuy(item.id)} data-testid="comprar-{item.id}">
        <Icon name="medalla" size={18} /><span class="cifra">{shopCost(p, item.id)}</span>
      </button>
    </article>
  {/each}
  <p class="muted nota">{$t('tienda.como')}</p>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 52;
    background: rgba(18, 22, 18, 0.5);
  }
  .sheet {
    position: fixed;
    z-index: 53;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: grid;
    gap: 8px;
    width: min(380px, calc(100vw - 20px));
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
    background: #fff4cc;
    font-size: 17px;
  }
  .redondo {
    width: 38px;
    height: 38px;
    border: var(--borde);
    border-radius: 12px;
    background: var(--panel-2);
  }
  .item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: #fff;
  }
  .info {
    display: grid;
    min-width: 0;
    font-size: 15px;
  }
  .muted {
    color: var(--muted);
    font-size: 12px;
  }
  .item .btn {
    min-width: 64px;
    min-height: 40px;
    padding: 4px 10px;
    font-size: 16px;
  }
  .nota {
    margin: 0;
  }
</style>
