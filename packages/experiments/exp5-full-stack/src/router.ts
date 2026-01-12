import { $route } from './stores';

type Route = 'dashboard' | 'settings';

const routes: Record<string, Route> = {
  '': 'dashboard',
  '#/': 'dashboard',
  '#/dashboard': 'dashboard',
  '#/settings': 'settings',
};

export function initRouter() {
  // Parse initial hash
  const hash = window.location.hash || '#/';
  $route.set(routes[hash] || 'dashboard');

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#/';
    $route.set(routes[hash] || 'dashboard');
  });
}

export function navigate(route: Route) {
  window.location.hash = `#/${route === 'dashboard' ? '' : route}`;
}
