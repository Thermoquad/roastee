import type { Translation } from '../i18n-types';

const es = {
  dashboard: {
    title: 'Panel de Control',
    connected: 'Conectado',
    disconnected: 'Desconectado',
  },
  telemetry: {
    title: 'Telemetría',
    temperature: 'Temperatura',
    rpm: 'RPM',
    pressure: 'Presión',
    flowRate: 'Caudal',
    voltage: 'Voltaje',
  },
  controls: {
    title: 'Controles',
    heater: 'Calentador',
    pump: 'Bomba',
    connection: 'Conexión',
    on: 'ENCENDIDO',
    off: 'APAGADO',
    connect: 'Conectar',
    disconnect: 'Desconectar',
  },
  units: {
    celsius: '°C',
    kpa: 'kPa',
    litersPerMin: 'L/min',
    volts: 'V',
  },
} satisfies Translation;

export default es;
