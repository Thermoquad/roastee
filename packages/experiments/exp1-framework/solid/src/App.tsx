import { createSignal, createEffect, onCleanup } from 'solid-js';
import './App.css';
import { fusainReady, protocolVersion } from './fusain';

export default function App() {
  const [connected, setConnected] = createSignal(true);
  const [heaterOn, setHeaterOn] = createSignal(false);

  // Telemetry values
  const [temperature, setTemperature] = createSignal(25.0);
  const [rpm, setRpm] = createSignal(0);
  const [pressure, setPressure] = createSignal(101.3);
  const [flowRate, setFlowRate] = createSignal(0.0);
  const [voltage, setVoltage] = createSignal(12.1);

  // Derived state
  const statusText = () => (connected() ? 'Connected' : 'Disconnected');
  const heaterText = () => (heaterOn() ? 'ON' : 'OFF');

  // Simulate telemetry updates
  createEffect(() => {
    const interval = setInterval(() => {
      setTemperature(20 + Math.random() * 30);
      setRpm(heaterOn() ? 1000 + Math.random() * 500 : 0);
      setPressure(100 + Math.random() * 5);
      setFlowRate(heaterOn() ? 1.5 + Math.random() * 0.5 : 0);
      setVoltage(11.8 + Math.random() * 0.6);
    }, 100);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <main>
      <h1>Device Dashboard</h1>

      <section class="status">
        <span class="indicator" classList={{ connected: connected() }}></span>
        <span>{statusText()}</span>
        <button onClick={() => setConnected(!connected())}>
          {connected() ? 'Disconnect' : 'Connect'}
        </button>
      </section>

      <section class="telemetry">
        <div class="value">
          <label>Temperature</label>
          <span>{temperature().toFixed(1)} °C</span>
        </div>
        <div class="value">
          <label>RPM</label>
          <span>{rpm().toFixed(0)}</span>
        </div>
        <div class="value">
          <label>Pressure</label>
          <span>{pressure().toFixed(1)} kPa</span>
        </div>
        <div class="value">
          <label>Flow Rate</label>
          <span>{flowRate().toFixed(2)} L/min</span>
        </div>
        <div class="value">
          <label>Voltage</label>
          <span>{voltage().toFixed(2)} V</span>
        </div>
      </section>

      <section class="controls">
        <button
          onClick={() => setHeaterOn(!heaterOn())}
          classList={{ active: heaterOn() }}
        >
          Heater: {heaterText()}
        </button>
      </section>

      <footer class="protocol">
        {fusainReady && <span>{protocolVersion}</span>}
      </footer>
    </main>
  );
}
