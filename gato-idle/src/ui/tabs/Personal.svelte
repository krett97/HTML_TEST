<script lang="ts">
  import { t } from '../../i18n';

  const STAFF = ['camarografo', 'editor', 'seguros', 'cm'] as const;
</script>

<ul class="list">
  {#each STAFF as id (id)}
    <li class="item">
      <span>{$t(`personal.${id}`)}</span>
      <span class="muted">🔒 {$t('personal.pronto')}</span>
    </li>
  {/each}
</ul>

<style>
  .list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 12px;
    border: 2px solid var(--line);
    border-radius: 4px;
    background: var(--panel-2);
  }
  .muted {
    font-size: 14px;
  }
</style>
