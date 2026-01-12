<script lang="ts">
  import { fusainReady, protocolVersion } from './fusain';

  // Svelte 5 runes for reactive state
  let connected = $state(true);
  let heaterOn = $state(false);

  // Telemetry values
  let temperature = $state(25.0);
  let rpm = $state(0);
  let pressure = $state(101.3);
  let flowRate = $state(0.0);
  let voltage = $state(12.1);

  // Derived state
  let statusText = $derived(connected ? 'Connected' : 'Disconnected');
  let heaterText = $derived(heaterOn ? 'ON' : 'OFF');

  // Simulate telemetry updates
  $effect(() => {
    const interval = setInterval(() => {
      temperature = 20 + Math.random() * 30;
      rpm = heaterOn ? 1000 + Math.random() * 500 : 0;
      pressure = 100 + Math.random() * 5;
      flowRate = heaterOn ? 1.5 + Math.random() * 0.5 : 0;
      voltage = 11.8 + Math.random() * 0.6;
    }, 100);

    return () => clearInterval(interval);
  });

  function toggleHeater() {
    heaterOn = !heaterOn;
  }

  function toggleConnection() {
    connected = !connected;
  }
</script>

<main>
  <h1>Device Dashboard</h1>

  <section class="status">
    <span class="indicator" class:connected></span>
    <span>{statusText}</span>
    <button onclick={toggleConnection}>
      {connected ? 'Disconnect' : 'Connect'}
    </button>
  </section>

  <section class="telemetry">
    <div class="value">
      <label>Temperature</label>
      <span>{temperature.toFixed(1)} °C</span>
    </div>
    <div class="value">
      <label>RPM</label>
      <span>{rpm.toFixed(0)}</span>
    </div>
    <div class="value">
      <label>Pressure</label>
      <span>{pressure.toFixed(1)} kPa</span>
    </div>
    <div class="value">
      <label>Flow Rate</label>
      <span>{flowRate.toFixed(2)} L/min</span>
    </div>
    <div class="value">
      <label>Voltage</label>
      <span>{voltage.toFixed(2)} V</span>
    </div>
  </section>

  <section class="controls">
    <button onclick={toggleHeater} class:active={heaterOn}>
      Heater: {heaterText}
    </button>
  </section>

  {#if fusainReady}
    <footer class="protocol">{protocolVersion}</footer>
  {/if}
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    max-width: 400px;
    margin: 0 auto;
    padding: 1rem;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  section {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #dc2626;
  }

  .indicator.connected {
    background: #16a34a;
  }

  .telemetry {
    display: grid;
    gap: 0.5rem;
  }

  .value {
    display: flex;
    justify-content: space-between;
  }

  .value label {
    color: #666;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }

  button:hover {
    background: #f5f5f5;
  }

  button.active {
    background: #dc2626;
    color: white;
    border-color: #dc2626;
  }
</style>
