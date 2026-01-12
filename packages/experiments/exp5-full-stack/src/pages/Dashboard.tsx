import { For, createMemo } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $connected, $deviceState, $telemetry, $locale } from '../stores';
import { t, type TranslationKey } from '../i18n';

// Fusain state names (matches fusain_state_t enum)
const STATE_NAMES: Record<number, string> = {
  0x00: 'Initializing',
  0x01: 'Idle',
  0x02: 'Blowing',
  0x03: 'Preheat',
  0x04: 'Preheat Stage 2',
  0x05: 'Heating',
  0x06: 'Cooling',
  0x07: 'Error',
  0x08: 'E-Stop',
};

export default function Dashboard() {
  const locale = useStore($locale);
  const connected = useStore($connected);
  const deviceState = useStore($deviceState);
  const telemetry = useStore($telemetry);

  const tt = (key: TranslationKey) => t(locale(), key);

  const stateName = createMemo(() => STATE_NAMES[deviceState().state] ?? `Unknown (${deviceState().state})`);

  const telemetryItems = createMemo(() => [
    {
      label: tt('telemetry.temperature'),
      value: telemetry().temperature.toFixed(1),
      unit: tt('units.celsius'),
    },
    {
      label: tt('telemetry.motorRpm'),
      value: telemetry().motorRpm.toFixed(0),
      unit: '',
    },
    {
      label: tt('telemetry.motorTarget'),
      value: telemetry().motorTarget.toFixed(0),
      unit: '',
    },
    {
      label: tt('telemetry.pumpRate'),
      value: telemetry().pumpRate > 0 ? `${telemetry().pumpRate}` : 'Off',
      unit: telemetry().pumpRate > 0 ? 'ms' : '',
    },
    {
      label: tt('telemetry.glowPlug'),
      value: telemetry().glowLit ? 'ON' : 'OFF',
      unit: '',
      highlight: telemetry().glowLit,
    },
    {
      label: tt('telemetry.packets'),
      value: telemetry().packetCount.toString(),
      unit: '',
    },
  ]);

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
          {tt('dashboard.state')}
        </h2>
        <div class="flex items-center gap-3">
          <span
            class={`px-3 py-1.5 rounded-full text-sm font-medium ${
              deviceState().state === 0x05
                ? 'bg-orange-100 text-orange-800'
                : deviceState().state === 0x03 || deviceState().state === 0x04
                  ? 'bg-yellow-100 text-yellow-800'
                  : deviceState().state === 0x07 || deviceState().state === 0x08
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {stateName()}
          </span>
          {deviceState().error !== 0 && (
            <span class="text-sm text-red-600">Error: {deviceState().error}</span>
          )}
        </div>
      </section>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {tt('telemetry.title')}
        </h2>
        <div class="flex flex-col gap-2">
          <For each={telemetryItems()}>
            {(item) => (
              <div class="flex justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm text-gray-500">{item.label}</span>
                <span
                  class={`font-medium tabular-nums ${
                    (item as { highlight?: boolean }).highlight ? 'text-orange-600' : ''
                  }`}
                >
                  {item.value} {item.unit}
                </span>
              </div>
            )}
          </For>
        </div>
      </section>
    </div>
  );
}
