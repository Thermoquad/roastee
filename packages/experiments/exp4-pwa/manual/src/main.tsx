import { render } from 'solid-js/web';
import 'virtual:uno.css';
import '@unocss/reset/tailwind.css';
import App from './App';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

render(() => <App />, document.getElementById('app')!);
