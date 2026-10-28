<script lang="ts">
  import { t } from '../i18n';
</script>

<span class="badge">{$t('descubrimientos.nuevo')}</span>

<style>
  .badge {
    display: inline-block;
    margin-left: 6px;
    padding: 0 5px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--gold);
    color: var(--line);
    font-size: 11px;
    font-weight: 700;
    vertical-align: middle;
    animation: latido 0.9s ease-in-out infinite alternate;
  }
  @keyframes latido {
    to {
      transform: scale(1.12);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .badge {
      animation: none;
    }
  }
</style>
