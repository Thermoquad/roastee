<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fusainClient, protocolVersion, type TelemetryState } from './fusain';

  // Svelte 5 runes for reactive state
  let telemetry = $state<TelemetryState>({
    connected: false,
    state: 'Connecting...',
    stateCode: 0,
    temperature: 0,
    motorRpm: 0,
    motorTarget: 0,
    pumpRate: 0,
    glowLit: false,
    timestamp: 0,
    packetCount: 0,
  });

  onMount(() => {
    fusainClient.connect((state) => {
      telemetry = state;
    });
  });

  onDestroy(() => {
    fusainClient.disconnect();
  });
</script>

<main>
  <h1>Burner Dashboard</h1>

  <section class="status">
    <span class="indicator" class:connected={telemetry.connected}></span>
    <span>{telemetry.connected ? 'Connected' : 'Disconnected'}</span>
    <span class="state-badge" data-state={telemetry.stateCode}>
      {telemetry.state}
    </span>
  </section>

  <section class="telemetry">
    <div class="value">
      <label>Temperature</label>
      <span>{telemetry.temperature.toFixed(1)} °C</span>
    </div>
    <div class="value">
      <label>Motor RPM</label>
      <span>{telemetry.motorRpm.toFixed(0)}</span>
    </div>
    <div class="value">
      <label>Target RPM</label>
      <span>{telemetry.motorTarget.toFixed(0)}</span>
    </div>
    <div class="value">
      <label>Pump Rate</label>
      <span>{telemetry.pumpRate > 0 ? `${telemetry.pumpRate} ms` : 'Off'}</span>
    </div>
    <div class="value">
      <label>Glow Plug</label>
      <span class={telemetry.glowLit ? 'glow-on' : 'glow-off'}>
        {telemetry.glowLit ? 'ON' : 'OFF'}
      </span>
    </div>
    <div class="value">
      <label>Packets</label>
      <span>{telemetry.packetCount}</span>
    </div>
  </section>

  <footer class="protocol">{protocolVersion}</footer>
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

  .state-badge {
    margin-left: auto;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background: #e5e7eb;
    font-size: 0.875rem;
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

  .glow-on {
    color: #f97316;
    font-weight: bold;
  }

  .glow-off {
    color: #6b7280;
  }

  .protocol {
    text-align: center;
    color: #9ca3af;
    font-size: 0.75rem;
  }
</style>
