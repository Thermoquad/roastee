import { i18nObject, i18nString } from 'typesafe-i18n';
import type { Locales, Translation, TranslationFunctions } from './i18n-types';

import en from './en';
import es from './es';
import fr from './fr';

const localeTranslations: Record<Locales, Translation> = {
  en,
  es,
  fr,
};

export const loadedLocales: Record<Locales, Translation> = localeTranslations;

export const i18n = (locale: Locales): TranslationFunctions =>
  i18nObject<Locales, Translation, TranslationFunctions>(locale, localeTranslations[locale]);

export const i18nL = (locale: Locales) => i18nString<Locales, Translation>(locale, localeTranslations[locale]);

export const baseLocale: Locales = 'en';
export const locales: Locales[] = ['en', 'es', 'fr'];
