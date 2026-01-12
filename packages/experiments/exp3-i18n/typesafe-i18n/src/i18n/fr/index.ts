import type { Translation } from '../i18n-types';

const fr = {
  dashboard: {
    title: 'Tableau de Bord',
    connected: 'Connecté',
    disconnected: 'Déconnecté',
  },
  telemetry: {
    title: 'Télémétrie',
    temperature: 'Température',
    rpm: 'RPM',
    pressure: 'Pression',
    flowRate: 'Débit',
    voltage: 'Tension',
  },
  controls: {
    title: 'Commandes',
    heater: 'Chauffage',
    pump: 'Pompe',
    connection: 'Connexion',
    on: 'MARCHE',
    off: 'ARRÊT',
    connect: 'Connecter',
    disconnect: 'Déconnecter',
  },
  units: {
    celsius: '°C',
    kpa: 'kPa',
    litersPerMin: 'L/min',
    volts: 'V',
  },
} satisfies Translation;

export default fr;
