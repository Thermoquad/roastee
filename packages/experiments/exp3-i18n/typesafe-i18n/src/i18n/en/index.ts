import type { BaseTranslation } from '../i18n-types';

const en = {
  dashboard: {
    title: 'Device Dashboard',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },
  telemetry: {
    title: 'Telemetry',
    temperature: 'Temperature',
    rpm: 'RPM',
    pressure: 'Pressure',
    flowRate: 'Flow Rate',
    voltage: 'Voltage',
  },
  controls: {
    title: 'Controls',
    heater: 'Heater',
    pump: 'Pump',
    connection: 'Connection',
    on: 'ON',
    off: 'OFF',
    connect: 'Connect',
    disconnect: 'Disconnect',
  },
  units: {
    celsius: '°C',
    kpa: 'kPa',
    litersPerMin: 'L/min',
    volts: 'V',
  },
} satisfies BaseTranslation;

export default en;
