import { createSignal, createEffect, For } from 'solid-js';
import './App.css';

interface TelemetryValue {
  label: string;
  value: () => number;
  unit: string;
  format: (n: number) => string;
}

export default function App() {
  const [connected, setConnected] = createSignal(true);
  const [heaterOn, setHeaterOn] = createSignal(false);
  const [pumpOn, setPumpOn] = createSignal(false);

  // Telemetry values
  const [temperature, setTemperature] = createSignal(25.0);
  const [rpm, setRpm] = createSignal(0);
  const [pressure, setPressure] = createSignal(101.3);
  const [flowRate, setFlowRate] = createSignal(0.0);
  const [voltage, setVoltage] = createSignal(12.1);

  const telemetry: TelemetryValue[] = [
    { label: 'Temperature', value: temperature, unit: '°C', format: (n) => n.toFixed(1) },
    { label: 'RPM', value: rpm, unit: '', format: (n) => n.toFixed(0) },
    { label: 'Pressure', value: pressure, unit: 'kPa', format: (n) => n.toFixed(1) },
    { label: 'Flow Rate', value: flowRate, unit: 'L/min', format: (n) => n.toFixed(2) },
    { label: 'Voltage', value: voltage, unit: 'V', format: (n) => n.toFixed(2) },
  ];

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
    <main class="dashboard">
      <header class="header">
        <h1 class="title">Device Dashboard</h1>
        <div class="status">
          <span class={`indicator ${connected() ? 'connected' : ''}`} />
          <span class="status-text">{connected() ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <section class="card telemetry-card">
        <h2 class="card-title">Telemetry</h2>
        <div class="telemetry-grid">
          <For each={telemetry}>
            {(item) => (
              <div class="telemetry-item">
                <span class="telemetry-label">{item.label}</span>
                <span class="telemetry-value">
                  {item.format(item.value())} {item.unit}
                </span>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="card controls-card">
        <h2 class="card-title">Controls</h2>
        <div class="controls-grid">
          <button
            class={`control-btn ${heaterOn() ? 'active danger' : ''}`}
            onClick={() => setHeaterOn(!heaterOn())}
          >
            <span class="btn-icon">🔥</span>
            <span class="btn-label">Heater</span>
            <span class="btn-status">{heaterOn() ? 'ON' : 'OFF'}</span>
          </button>
          <button
            class={`control-btn ${pumpOn() ? 'active primary' : ''}`}
            onClick={() => setPumpOn(!pumpOn())}
          >
            <span class="btn-icon">💧</span>
            <span class="btn-label">Pump</span>
            <span class="btn-status">{pumpOn() ? 'ON' : 'OFF'}</span>
          </button>
          <button
            class={`control-btn ${connected() ? '' : 'disabled'}`}
            onClick={() => setConnected(!connected())}
          >
            <span class="btn-icon">🔌</span>
            <span class="btn-label">Connection</span>
            <span class="btn-status">{connected() ? 'Disconnect' : 'Connect'}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
