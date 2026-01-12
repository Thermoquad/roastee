import { createSignal, createEffect, For, createMemo } from 'solid-js';
import { t, locales, type Locale, type TranslationKey } from './i18n';

export default function App() {
  const [locale, setLocale] = createSignal<Locale>('en');
  const [connected, setConnected] = createSignal(true);
  const [heaterOn, setHeaterOn] = createSignal(false);
  const [pumpOn, setPumpOn] = createSignal(false);

  // Telemetry values
  const [temperature, setTemperature] = createSignal(25.0);
  const [rpm, setRpm] = createSignal(0);
  const [pressure, setPressure] = createSignal(101.3);
  const [flowRate, setFlowRate] = createSignal(0.0);
  const [voltage, setVoltage] = createSignal(12.1);

  // Helper for reactive translations
  const tt = (key: TranslationKey) => t(locale(), key);

  const telemetry = createMemo(() => [
    {
      label: tt('telemetry.temperature'),
      value: temperature,
      unit: tt('units.celsius'),
      format: (n: number) => n.toFixed(1),
    },
    {
      label: tt('telemetry.rpm'),
      value: rpm,
      unit: '',
      format: (n: number) => n.toFixed(0),
    },
    {
      label: tt('telemetry.pressure'),
      value: pressure,
      unit: tt('units.kpa'),
      format: (n: number) => n.toFixed(1),
    },
    {
      label: tt('telemetry.flowRate'),
      value: flowRate,
      unit: tt('units.litersPerMin'),
      format: (n: number) => n.toFixed(2),
    },
    {
      label: tt('telemetry.voltage'),
      value: voltage,
      unit: tt('units.volts'),
      format: (n: number) => n.toFixed(2),
    },
  ]);

  createEffect(() => {
    const interval = setInterval(() => {
      setTemperature(20 + Math.random() * 30);
      setRpm(heaterOn() ? 1000 + Math.random() * 500 : 0);
      setPressure(100 + Math.random() * 5);
      setFlowRate(pumpOn() ? 1.5 + Math.random() * 0.5 : 0);
      setVoltage(11.8 + Math.random() * 0.6);
    }, 100);

    return () => clearInterval(interval);
  });

  return (
    <main class="max-w-120 mx-auto p-4 flex flex-col gap-4 font-sans bg-gray-100 min-h-screen text-gray-900">
      <header class="flex justify-between items-center py-2">
        <h1 class="text-xl font-semibold">{tt('dashboard.title')}</h1>
        <div class="flex items-center gap-4">
          <select
            class="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
            value={locale()}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <For each={locales}>
              {(loc) => (
                <option value={loc}>
                  {loc.toUpperCase()}
                </option>
              )}
            </For>
          </select>
          <div class="flex items-center gap-2">
            <span
              class={`w-2.5 h-2.5 rounded-full ${connected() ? 'bg-green-600' : 'bg-red-600'}`}
            />
            <span class="text-sm text-gray-500">
              {connected() ? tt('dashboard.connected') : tt('dashboard.disconnected')}
            </span>
          </div>
        </div>
      </header>

      <section class="bg-white rounded-lg p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {tt('telemetry.title')}
        </h2>
        <div class="flex flex-col gap-2">
          <For each={telemetry()}>
            {(item) => (
              <div class="flex justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm text-gray-500">{item.label}</span>
                <span class="font-medium tabular-nums">
                  {item.format(item.value())} {item.unit}
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
        <div class="grid grid-cols-3 gap-2">
          <button
            class={`flex flex-col items-center gap-1 py-3 px-2 border rounded-lg cursor-pointer transition-all
              ${heaterOn() ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            onClick={() => setHeaterOn(!heaterOn())}
          >
            <span class="text-xl">🔥</span>
            <span class="text-xs font-medium">{tt('controls.heater')}</span>
            <span class="text-[10px] uppercase tracking-wide opacity-80">
              {heaterOn() ? tt('controls.on') : tt('controls.off')}
            </span>
          </button>
          <button
            class={`flex flex-col items-center gap-1 py-3 px-2 border rounded-lg cursor-pointer transition-all
              ${pumpOn() ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            onClick={() => setPumpOn(!pumpOn())}
          >
            <span class="text-xl">💧</span>
            <span class="text-xs font-medium">{tt('controls.pump')}</span>
            <span class="text-[10px] uppercase tracking-wide opacity-80">
              {pumpOn() ? tt('controls.on') : tt('controls.off')}
            </span>
          </button>
          <button
            class={`flex flex-col items-center gap-1 py-3 px-2 border rounded-lg cursor-pointer transition-all
              ${!connected() ? 'opacity-50' : ''} bg-white border-gray-200 hover:bg-gray-50`}
            onClick={() => setConnected(!connected())}
          >
            <span class="text-xl">🔌</span>
            <span class="text-xs font-medium">{tt('controls.connection')}</span>
            <span class="text-[10px] uppercase tracking-wide opacity-80">
              {connected() ? tt('controls.disconnect') : tt('controls.connect')}
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
