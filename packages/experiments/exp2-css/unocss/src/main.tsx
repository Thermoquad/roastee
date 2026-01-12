import { render } from 'solid-js/web';
import 'virtual:uno.css';
import '@unocss/reset/tailwind.css';
import { initFusain } from './fusain';
import App from './App';

// Initialize Fusain WebSocket connection
initFusain();

render(() => <App />, document.getElementById('app')!);
