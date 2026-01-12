import { createEffect, For, createMemo } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $connected, $deviceState, $telemetry, $locale } from '../stores';
import { t, type TranslationKey } from '../i18n';

export default function Dashboard() {
  const locale = useStore($locale);
  const connected = useStore($connected);
  const deviceState = useStore($deviceState);
  const telemetry = useStore($telemetry);

  const tt = (key: TranslationKey) => t(locale(), key);

  const telemetryItems = createMemo(() => [
    {
      label: tt('telemetry.temperature'),
      value: telemetry().temperature.toFixed(1),
      unit: tt('units.celsius'),
    },
    {
      label: tt('telemetry.rpm'),
      value: telemetry().rpm.toFixed(0),
      unit: '',
    },
    {
      label: tt('telemetry.pressure'),
      value: telemetry().pressure.toFixed(1),
      unit: tt('units.kpa'),
    },
    {
      label: tt('telemetry.flowRate'),
      value: telemetry().flowRate.toFixed(2),
      unit: tt('units.litersPerMin'),
    },
    {
      label: tt('telemetry.voltage'),
      value: telemetry().voltage.toFixed(2),
      unit: tt('units.volts'),
    },
  ]);

  // Simulate telemetry updates
  createEffect(() => {
    const interval = setInterval(() => {
      $telemetry.setKey('temperature', 20 + Math.random() * 30);
      $telemetry.setKey('rpm', deviceState().heaterOn ? 1000 + Math.random() * 500 : 0);
      $telemetry.setKey('pressure', 100 + Math.random() * 5);
      $telemetry.setKey('flowRate', deviceState().pumpOn ? 1.5 + Math.random() * 0.5 : 0);
      $telemetry.setKey('voltage', 11.8 + Math.random() * 0.6);
    }, 100);
    return () => clearInterval(interval);
  });

  return (
    <div class="flex flex-col gap-4">
      <header class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">{tt('dashboard.title')}</h1>
        <div class="flex items-center gap-2">
          <span
            class={`w-2.5 h-2.5 rounded-full ${connected() ? 'bg-green-600' : 'bg-red-600'}`}
          />
          <span class="text-sm text-gray-500">
            {connected() ? tt('dashboard.connected') : tt('dashboard.disconnected')}
          </span>
        </div>
      </header>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {tt('telemetry.title')}
        </h2>
        <div class="flex flex-col gap-2">
          <For each={telemetryItems()}>
            {(item) => (
              <div class="flex justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm text-gray-500">{item.label}</span>
                <span class="font-medium tabular-nums">
                  {item.value} {item.unit}
                </span>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {tt('controls.title')}
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            class={`flex flex-col items-center gap-1 py-3 px-2 border rounded-lg cursor-pointer transition-all
              ${deviceState().heaterOn ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            onClick={() => $deviceState.setKey('heaterOn', !deviceState().heaterOn)}
          >
            <span class="text-xl">🔥</span>
            <span class="text-xs font-medium">{tt('controls.heater')}</span>
            <span class="text-[10px] uppercase tracking-wide opacity-80">
              {deviceState().heaterOn ? tt('controls.on') : tt('controls.off')}
            </span>
          </button>
          <button
            class={`flex flex-col items-center gap-1 py-3 px-2 border rounded-lg cursor-pointer transition-all
              ${deviceState().pumpOn ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            onClick={() => $deviceState.setKey('pumpOn', !deviceState().pumpOn)}
          >
            <span class="text-xl">💧</span>
            <span class="text-xs font-medium">{tt('controls.pump')}</span>
            <span class="text-[10px] uppercase tracking-wide opacity-80">
              {deviceState().pumpOn ? tt('controls.on') : tt('controls.off')}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
