import { atom, map } from 'nanostores';
import type { Locale } from '../i18n';

// App settings
export const $locale = atom<Locale>('en');
export const $theme = atom<'light' | 'dark'>('light');

// Connection state
export const $connected = atom(false);

// Device state
export const $deviceState = map({
  heaterOn: false,
  pumpOn: false,
});

// Telemetry data
export const $telemetry = map({
  temperature: 25.0,
  rpm: 0,
  pressure: 101.3,
  flowRate: 0.0,
  voltage: 12.1,
});

// Router state
export const $route = atom<'dashboard' | 'settings'>('dashboard');
