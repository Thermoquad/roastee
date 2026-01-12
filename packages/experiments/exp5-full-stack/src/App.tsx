import { Show } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $route, $locale } from './stores';
import { navigate } from './router';
import { t, type TranslationKey } from './i18n';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

export default function App() {
  const route = useStore($route);
  const locale = useStore($locale);

  const tt = (key: TranslationKey) => t(locale(), key);

  return (
    <div class="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <main class="max-w-md mx-auto p-4 pb-20">
        <Show when={route() === 'dashboard'}>
          <Dashboard />
        </Show>
        <Show when={route() === 'settings'}>
          <Settings />
        </Show>
      </main>

      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div class="max-w-md mx-auto flex">
          <button
            class={`flex-1 py-3 text-center text-sm font-medium transition-colors
              ${route() === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => navigate('dashboard')}
          >
            {tt('nav.dashboard')}
          </button>
          <button
            class={`flex-1 py-3 text-center text-sm font-medium transition-colors
              ${route() === 'settings' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => navigate('settings')}
          >
            {tt('nav.settings')}
          </button>
        </div>
      </nav>
    </div>
  );
}
