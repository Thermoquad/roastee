import { atom, map } from 'nanostores';
import type { Locale } from '../i18n';

// App settings
export const $locale = atom<Locale>('en');
export const $theme = atom<'light' | 'dark'>('light');

// Connection state
export const $connected = atom(false);

// Device state (from Fusain STATE_DATA)
export const $deviceState = map({
  state: 0, // fusain_state_t
  error: 0, // fusain_error_t
});

// Telemetry data (from Fusain telemetry messages)
export const $telemetry = map({
  temperature: 25.0,
  motorRpm: 0,
  motorTarget: 0,
  pumpRate: 0,
  glowLit: false,
  packetCount: 0,
});
