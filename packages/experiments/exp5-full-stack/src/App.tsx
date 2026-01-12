import { A, useLocation } from '@solidjs/router';
import { useStore } from '@nanostores/solid';
import { $locale } from './stores';
import { t, type TranslationKey } from './i18n';
import { protocolVersion } from './fusain';

export default function App(props: { children?: any }) {
  const locale = useStore($locale);
  const location = useLocation();

  const tt = (key: TranslationKey) => t(locale(), key);

  const isActive = (path: string) => {
    const current = location.pathname;
    if (path === '/') return current === '/' || current === '';
    return current === path;
  };

  return (
    <div class="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <main class="max-w-md mx-auto p-4 pb-20">
        {props.children}
        <footer class="text-center text-xs text-gray-400 py-2">{protocolVersion}</footer>
      </main>

      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div class="max-w-md mx-auto flex">
          <A
            href="/"
            class={`flex-1 py-3 text-center text-sm font-medium transition-colors
              ${isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tt('nav.dashboard')}
          </A>
          <A
            href="/settings"
            class={`flex-1 py-3 text-center text-sm font-medium transition-colors
              ${isActive('/settings') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tt('nav.settings')}
          </A>
        </div>
      </nav>
    </div>
  );
}
