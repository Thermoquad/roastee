import { createSignal, createEffect, onMount } from 'solid-js';
import { fusainReady, protocolVersion } from './fusain';

export default function App() {
  const [online, setOnline] = createSignal(navigator.onLine);
  const [swStatus, setSwStatus] = createSignal<string>('checking');
  const [count, setCount] = createSignal(0);

  onMount(() => {
    // Monitor online status
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setSwStatus('active');
      });
    } else {
      setSwStatus('unsupported');
    }
  });

  createEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(interval);
  });

  return (
    <main class="max-w-120 mx-auto p-4 flex flex-col gap-4 font-sans bg-gray-100 min-h-screen text-gray-900">
      <header class="py-4">
        <h1 class="text-xl font-semibold">PWA Experiment</h1>
        <p class="text-sm text-gray-500">Workbox (vite-plugin-pwa)</p>
      </header>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Status
        </h2>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between p-2 bg-gray-50 rounded">
            <span class="text-sm text-gray-500">Network</span>
            <span class={`font-medium ${online() ? 'text-green-600' : 'text-red-600'}`}>
              {online() ? 'Online' : 'Offline'}
            </span>
          </div>
          <div class="flex justify-between p-2 bg-gray-50 rounded">
            <span class="text-sm text-gray-500">Service Worker</span>
            <span class="font-medium">
              {swStatus()}
            </span>
          </div>
          <div class="flex justify-between p-2 bg-gray-50 rounded">
            <span class="text-sm text-gray-500">Counter</span>
            <span class="font-medium tabular-nums">{count()}</span>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Test Offline
        </h2>
        <p class="text-sm text-gray-600">
          Open DevTools → Network → check "Offline" to test offline mode.
          The app should continue working with cached assets.
        </p>
      </section>

      {fusainReady && (
        <footer class="text-center text-xs text-gray-400 py-2">{protocolVersion}</footer>
      )}
    </main>
  );
}
