import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';
import 'virtual:uno.css';
import '@unocss/reset/tailwind.css';
import { initFusain } from './fusain';
import App from './App';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

// Initialize Fusain WebSocket connection
initFusain();

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

render(
  () => (
    <HashRouter root={App}>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} />
    </HashRouter>
  ),
  document.getElementById('app')!
);
