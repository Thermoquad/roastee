<script lang="ts">
  import * as stores from '../stores/index.svelte';
  import { t, type TranslationKey } from '../i18n/index';

  const tt = (key: TranslationKey) => t(stores.locale, key);

  $effect(() => {
    const interval = setInterval(() => {
      stores.temperature = 20 + Math.random() * 30;
      stores.rpm = stores.heaterOn ? 1000 + Math.random() * 500 : 0;
      stores.pressure = 100 + Math.random() * 5;
      stores.flowRate = stores.pumpOn ? 1.5 + Math.random() * 0.5 : 0;
      stores.voltage = 11.8 + Math.random() * 0.6;
    }, 100);
    return () => clearInterval(interval);
  });

  const telemetryItems = $derived([
    { label: tt('telemetry.temperature'), value: stores.temperature.toFixed(1), unit: tt('units.celsius') },
    { label: tt('telemetry.rpm'), value: stores.rpm.toFixed(0), unit: '' },
    { label: tt('telemetry.pressure'), value: stores.pressure.toFixed(1), unit: tt('units.kpa') },
    { label: tt('telemetry.flowRate'), value: stores.flowRate.toFixed(2), unit: tt('units.litersPerMin') },
    { label: tt('telemetry.voltage'), value: stores.voltage.toFixed(2), unit: tt('units.volts') },
  ]);
</script>

<div class="flex flex-col gap-4">
  <header class="flex justify-between items-center">
    <h1 class="text-xl font-semibold">{tt('dashboard.title')}</h1>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full {stores.connected ? 'bg-green-600' : 'bg-red-600'}"></span>
      <span class="text-sm text-gray-500">
        {stores.connected ? tt('dashboard.connected') : tt('dashboard.disconnected')}
      </span>
    </div>
  </header>

  <section class="bg-white rounded-lg p-4 shadow-sm">
    <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {tt('telemetry.title')}
    </h2>
    <div class="flex flex-col gap-2">
      {#each telemetryItems as item}
        <div class="flex justify-between p-2 bg-gray-50 rounded">
          <span class="text-sm text-gray-500">{item.label}</span>
          <span class="font-medium tabular-nums">{item.value} {item.unit}</span>
        </div>
      {/each}
    </div>
  </section>

  <section class="bg-white rounded-lg p-4 shadow-sm">
    <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {tt('controls.title')}
    </h2>
    <div class="grid grid-cols-2 gap-2">
      <button
        class="flex flex-col items-center gap-1 py-3 px-2 border rounded-lg cursor-pointer transition-all
          {stores.heaterOn ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 hover:bg-gray-50'}"
        onclick={() => stores.heaterOn = !stores.heaterOn}
      >
        <span class="text-xl">🔥</span>
        <span class="text-xs font-medium">{tt('controls.heater')}</span>
        <span class="text-[10px] uppercase tracking-wide opacity-80">
          {stores.heaterOn ? tt('controls.on') : tt('controls.off')}
        </span>
      </button>
      <button
        class="flex flex-col items-center gap-1 py-3 px-2 border rounded-lg cursor-pointer transition-all
          {stores.pumpOn ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 hover:bg-gray-50'}"
        onclick={() => stores.pumpOn = !stores.pumpOn}
      >
        <span class="text-xl">💧</span>
        <span class="text-xs font-medium">{tt('controls.pump')}</span>
        <span class="text-[10px] uppercase tracking-wide opacity-80">
          {stores.pumpOn ? tt('controls.on') : tt('controls.off')}
        </span>
      </button>
    </div>
  </section>
</div>
