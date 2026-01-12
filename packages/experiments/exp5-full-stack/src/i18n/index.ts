// Minimal type-safe i18n
export type Locale = 'en' | 'es' | 'fr';

export const translations = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'dashboard.title': 'Device Dashboard',
    'dashboard.connected': 'Connected',
    'dashboard.disconnected': 'Disconnected',
    'dashboard.state': 'System State',
    'telemetry.title': 'Telemetry',
    'telemetry.temperature': 'Temperature',
    'telemetry.motorRpm': 'Motor RPM',
    'telemetry.motorTarget': 'Target RPM',
    'telemetry.pumpRate': 'Pump Rate',
    'telemetry.glowPlug': 'Glow Plug',
    'telemetry.packets': 'Packets',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'units.celsius': '°C',
  },
  es: {
    'nav.dashboard': 'Panel',
    'nav.settings': 'Ajustes',
    'dashboard.title': 'Panel de Control',
    'dashboard.connected': 'Conectado',
    'dashboard.disconnected': 'Desconectado',
    'dashboard.state': 'Estado del Sistema',
    'telemetry.title': 'Telemetría',
    'telemetry.temperature': 'Temperatura',
    'telemetry.motorRpm': 'RPM Motor',
    'telemetry.motorTarget': 'RPM Objetivo',
    'telemetry.pumpRate': 'Tasa de Bomba',
    'telemetry.glowPlug': 'Bujía',
    'telemetry.packets': 'Paquetes',
    'settings.title': 'Ajustes',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.theme.light': 'Claro',
    'settings.theme.dark': 'Oscuro',
    'units.celsius': '°C',
  },
  fr: {
    'nav.dashboard': 'Tableau',
    'nav.settings': 'Paramètres',
    'dashboard.title': 'Tableau de Bord',
    'dashboard.connected': 'Connecté',
    'dashboard.disconnected': 'Déconnecté',
    'dashboard.state': 'État du Système',
    'telemetry.title': 'Télémétrie',
    'telemetry.temperature': 'Température',
    'telemetry.motorRpm': 'RPM Moteur',
    'telemetry.motorTarget': 'RPM Cible',
    'telemetry.pumpRate': 'Débit Pompe',
    'telemetry.glowPlug': 'Bougie',
    'telemetry.packets': 'Paquets',
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.theme.light': 'Clair',
    'settings.theme.dark': 'Sombre',
    'units.celsius': '°C',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export const t = (locale: Locale, key: TranslationKey): string =>
  translations[locale][key];

export const locales: Locale[] = ['en', 'es', 'fr'];
