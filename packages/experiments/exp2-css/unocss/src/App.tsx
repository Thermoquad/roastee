import { For, createMemo } from 'solid-js';
import {
  connected,
  deviceState,
  deviceError,
  temperature,
  motorRpm,
  motorTarget,
  pumpRate,
  glowLit,
  packetCount,
  protocolVersion,
  STATE_NAMES,
} from './fusain';

interface TelemetryItem {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}

export default function App() {
  const stateName = createMemo(
    () => STATE_NAMES[deviceState()] ?? `Unknown (${deviceState()})`
  );

  const telemetryItems = createMemo((): TelemetryItem[] => [
    {
      label: 'Temperature',
      value: temperature().toFixed(1),
      unit: '°C',
    },
    {
      label: 'Motor RPM',
      value: motorRpm().toFixed(0),
      unit: '',
    },
    {
      label: 'Target RPM',
      value: motorTarget().toFixed(0),
      unit: '',
    },
    {
      label: 'Pump Rate',
      value: pumpRate() > 0 ? `${pumpRate()}` : 'Off',
      unit: pumpRate() > 0 ? 'ms' : '',
    },
    {
      label: 'Glow Plug',
      value: glowLit() ? 'ON' : 'OFF',
      unit: '',
      highlight: glowLit(),
    },
    {
      label: 'Packets',
      value: packetCount().toString(),
      unit: '',
    },
  ]);

  return (
    <main class="max-w-120 mx-auto p-4 flex flex-col gap-4 font-sans bg-gray-100 min-h-screen text-gray-900">
      <header class="flex justify-between items-center py-2">
        <h1 class="text-xl font-semibold">Device Dashboard</h1>
        <div class="flex items-center gap-2">
          <span
            class={`w-2.5 h-2.5 rounded-full ${connected() ? 'bg-green-600' : 'bg-red-600'}`}
          />
          <span class="text-sm text-gray-500">
            {connected() ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          System State
        </h2>
        <div class="flex items-center gap-3">
          <span
            class={`px-3 py-1.5 rounded-full text-sm font-medium ${
              deviceState() === 0x05
                ? 'bg-orange-100 text-orange-800'
                : deviceState() === 0x03 || deviceState() === 0x04
                  ? 'bg-yellow-100 text-yellow-800'
                  : deviceState() === 0x07 || deviceState() === 0x08
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {stateName()}
          </span>
          {deviceError() !== 0 && (
            <span class="text-sm text-red-600">Error: {deviceError()}</span>
          )}
        </div>
      </section>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Telemetry
        </h2>
        <div class="flex flex-col gap-2">
          <For each={telemetryItems()}>
            {(item) => (
              <div class="flex justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm text-gray-500">{item.label}</span>
                <span
                  class={`font-medium tabular-nums ${item.highlight ? 'text-orange-600' : ''}`}
                >
                  {item.value} {item.unit}
                </span>
              </div>
            )}
          </For>
        </div>
      </section>

      <footer class="text-center text-xs text-gray-400 py-2">
        {protocolVersion}
      </footer>
    </main>
  );
}
