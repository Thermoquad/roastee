// Minimal type-safe i18n implementation (~200 bytes runtime)

export type Locale = 'en' | 'es' | 'fr';

export const translations = {
  en: {
    'dashboard.title': 'Device Dashboard',
    'dashboard.connected': 'Connected',
    'dashboard.disconnected': 'Disconnected',
    'telemetry.title': 'Telemetry',
    'telemetry.temperature': 'Temperature',
    'telemetry.rpm': 'RPM',
    'telemetry.pressure': 'Pressure',
    'telemetry.flowRate': 'Flow Rate',
    'telemetry.voltage': 'Voltage',
    'controls.title': 'Controls',
    'controls.heater': 'Heater',
    'controls.pump': 'Pump',
    'controls.connection': 'Connection',
    'controls.on': 'ON',
    'controls.off': 'OFF',
    'controls.connect': 'Connect',
    'controls.disconnect': 'Disconnect',
    'units.celsius': '°C',
    'units.kpa': 'kPa',
    'units.litersPerMin': 'L/min',
    'units.volts': 'V',
  },
  es: {
    'dashboard.title': 'Panel de Control',
    'dashboard.connected': 'Conectado',
    'dashboard.disconnected': 'Desconectado',
    'telemetry.title': 'Telemetría',
    'telemetry.temperature': 'Temperatura',
    'telemetry.rpm': 'RPM',
    'telemetry.pressure': 'Presión',
    'telemetry.flowRate': 'Caudal',
    'telemetry.voltage': 'Voltaje',
    'controls.title': 'Controles',
    'controls.heater': 'Calentador',
    'controls.pump': 'Bomba',
    'controls.connection': 'Conexión',
    'controls.on': 'ENCENDIDO',
    'controls.off': 'APAGADO',
    'controls.connect': 'Conectar',
    'controls.disconnect': 'Desconectar',
    'units.celsius': '°C',
    'units.kpa': 'kPa',
    'units.litersPerMin': 'L/min',
    'units.volts': 'V',
  },
  fr: {
    'dashboard.title': 'Tableau de Bord',
    'dashboard.connected': 'Connecté',
    'dashboard.disconnected': 'Déconnecté',
    'telemetry.title': 'Télémétrie',
    'telemetry.temperature': 'Température',
    'telemetry.rpm': 'RPM',
    'telemetry.pressure': 'Pression',
    'telemetry.flowRate': 'Débit',
    'telemetry.voltage': 'Tension',
    'controls.title': 'Commandes',
    'controls.heater': 'Chauffage',
    'controls.pump': 'Pompe',
    'controls.connection': 'Connexion',
    'controls.on': 'MARCHE',
    'controls.off': 'ARRÊT',
    'controls.connect': 'Connecter',
    'controls.disconnect': 'Déconnecter',
    'units.celsius': '°C',
    'units.kpa': 'kPa',
    'units.litersPerMin': 'L/min',
    'units.volts': 'V',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export const t = (locale: Locale, key: TranslationKey): string =>
  translations[locale][key];

export const locales: Locale[] = ['en', 'es', 'fr'];
