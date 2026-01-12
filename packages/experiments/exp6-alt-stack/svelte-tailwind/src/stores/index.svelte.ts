import type { Locale } from '../i18n/index';

// App settings
export let locale = $state<Locale>('en');
export let theme = $state<'light' | 'dark'>('light');

// Connection state
export let connected = $state(false);

// Device state
export let heaterOn = $state(false);
export let pumpOn = $state(false);

// Telemetry data
export let temperature = $state(25.0);
export let rpm = $state(0);
export let pressure = $state(101.3);
export let flowRate = $state(0.0);
export let voltage = $state(12.1);

// Router state
export type Route = 'dashboard' | 'settings';
export let route = $state<Route>('dashboard');
