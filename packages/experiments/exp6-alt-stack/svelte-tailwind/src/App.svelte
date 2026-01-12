<script lang="ts">
  import * as stores from './stores/index.svelte';
  import { t, type TranslationKey } from './i18n/index';
  import { fusainReady, protocolVersion } from './fusain';
  import Dashboard from './pages/Dashboard.svelte';
  import Settings from './pages/Settings.svelte';

  const tt = (key: TranslationKey) => t(stores.locale, key);

  function navigate(route: typeof stores.route) {
    stores.route = route;
    window.location.hash = `#/${route === 'dashboard' ? '' : route}`;
  }

  $effect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '#/';
      if (hash === '#/' || hash === '#/dashboard') {
        stores.route = 'dashboard';
      } else if (hash === '#/settings') {
        stores.route = 'settings';
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  });
</script>

<div class="min-h-screen bg-gray-100 text-gray-900 font-sans">
  <main class="max-w-md mx-auto p-4 pb-20">
    {#if stores.route === 'dashboard'}
      <Dashboard />
    {:else if stores.route === 'settings'}
      <Settings />
    {/if}
    {#if fusainReady}
      <footer class="text-center text-xs text-gray-400 py-2">{protocolVersion}</footer>
    {/if}
  </main>

  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
    <div class="max-w-md mx-auto flex">
      <button
        class="flex-1 py-3 text-center text-sm font-medium transition-colors
          {stores.route === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
        onclick={() => navigate('dashboard')}
      >
        {tt('nav.dashboard')}
      </button>
      <button
        class="flex-1 py-3 text-center text-sm font-medium transition-colors
          {stores.route === 'settings' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
        onclick={() => navigate('settings')}
      >
        {tt('nav.settings')}
      </button>
    </div>
  </nav>
</div>
