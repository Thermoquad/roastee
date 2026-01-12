import { render } from 'solid-js/web';
import 'virtual:uno.css';
import '@unocss/reset/tailwind.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

// Register service worker via vite-plugin-pwa
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('SW Registered:', r);
  },
  onRegisterError(error) {
    console.error('SW registration error:', error);
  },
});

render(() => <App />, document.getElementById('app')!);
