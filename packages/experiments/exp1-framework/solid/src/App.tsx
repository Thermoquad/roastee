import { createSignal, onMount, onCleanup } from 'solid-js';
import './App.css';
import { fusainClient, protocolVersion, type TelemetryState } from './fusain';

export default function App() {
  const [telemetry, setTelemetry] = createSignal<TelemetryState>({
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
      setTelemetry(state);
    });
  });

  onCleanup(() => {
    fusainClient.disconnect();
  });

  const statusClass = () => (telemetry().connected ? 'connected' : 'disconnected');

  return (
    <main>
      <h1>Burner Dashboard</h1>

      <section class="status">
        <span class="indicator" classList={{ connected: telemetry().connected }}></span>
        <span>{telemetry().connected ? 'Connected' : 'Disconnected'}</span>
        <span class="state-badge" data-state={telemetry().stateCode}>
          {telemetry().state}
        </span>
      </section>

      <section class="telemetry">
        <div class="value">
          <label>Temperature</label>
          <span>{telemetry().temperature.toFixed(1)} °C</span>
        </div>
        <div class="value">
          <label>Motor RPM</label>
          <span>{telemetry().motorRpm.toFixed(0)}</span>
        </div>
        <div class="value">
          <label>Target RPM</label>
          <span>{telemetry().motorTarget.toFixed(0)}</span>
        </div>
        <div class="value">
          <label>Pump Rate</label>
          <span>{telemetry().pumpRate > 0 ? `${telemetry().pumpRate} ms` : 'Off'}</span>
        </div>
        <div class="value">
          <label>Glow Plug</label>
          <span class={telemetry().glowLit ? 'glow-on' : 'glow-off'}>
            {telemetry().glowLit ? 'ON' : 'OFF'}
          </span>
        </div>
        <div class="value">
          <label>Packets</label>
          <span>{telemetry().packetCount}</span>
        </div>
      </section>

      <footer class="protocol">
        <span>{protocolVersion}</span>
      </footer>
    </main>
  );
}
