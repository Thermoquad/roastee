import { For } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $locale, $theme } from '../stores';
import { t, locales, type Locale, type TranslationKey } from '../i18n';

export default function Settings() {
  const locale = useStore($locale);
  const theme = useStore($theme);

  const tt = (key: TranslationKey) => t(locale(), key);

  return (
    <div class="flex flex-col gap-4">
      <h1 class="text-xl font-semibold">{tt('settings.title')}</h1>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <label class="text-sm font-medium">{tt('settings.language')}</label>
            <select
              class="px-3 py-1.5 border border-gray-200 rounded text-sm bg-white"
              value={locale()}
              onChange={(e) => $locale.set(e.target.value as Locale)}
            >
              <For each={locales}>
                {(loc) => (
                  <option value={loc}>
                    {loc.toUpperCase()}
                  </option>
                )}
              </For>
            </select>
          </div>

          <div class="flex justify-between items-center">
            <label class="text-sm font-medium">{tt('settings.theme')}</label>
            <select
              class="px-3 py-1.5 border border-gray-200 rounded text-sm bg-white"
              value={theme()}
              onChange={(e) => $theme.set(e.target.value as 'light' | 'dark')}
            >
              <option value="light">{tt('settings.theme.light')}</option>
              <option value="dark">{tt('settings.theme.dark')}</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
