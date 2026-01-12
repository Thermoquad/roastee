<script lang="ts">
  import * as stores from '../stores/index.svelte';
  import { t, locales, type Locale, type TranslationKey } from '../i18n/index';

  const tt = (key: TranslationKey) => t(stores.locale, key);
</script>

<div class="flex flex-col gap-4">
  <h1 class="text-xl font-semibold">{tt('settings.title')}</h1>

  <section class="bg-white rounded-lg p-4 shadow-sm">
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <label class="text-sm font-medium">{tt('settings.language')}</label>
        <select
          class="px-3 py-1.5 border border-gray-200 rounded text-sm bg-white"
          bind:value={stores.locale}
        >
          {#each locales as loc}
            <option value={loc}>{loc.toUpperCase()}</option>
          {/each}
        </select>
      </div>

      <div class="flex justify-between items-center">
        <label class="text-sm font-medium">{tt('settings.theme')}</label>
        <select
          class="px-3 py-1.5 border border-gray-200 rounded text-sm bg-white"
          bind:value={stores.theme}
        >
          <option value="light">{tt('settings.theme.light')}</option>
          <option value="dark">{tt('settings.theme.dark')}</option>
        </select>
      </div>
    </div>
  </section>
</div>
