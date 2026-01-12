import { useState, useEffect } from 'preact/hooks';
import './App.css';
import { fusainReady, protocolVersion } from './fusain';

export function App() {
  const [connected, setConnected] = useState(true);
  const [heaterOn, setHeaterOn] = useState(false);

  // Telemetry values
  const [temperature, setTemperature] = useState(25.0);
  const [rpm, setRpm] = useState(0);
  const [pressure, setPressure] = useState(101.3);
  const [flowRate, setFlowRate] = useState(0.0);
  const [voltage, setVoltage] = useState(12.1);

  // Derived state
  const statusText = connected ? 'Connected' : 'Disconnected';
  const heaterText = heaterOn ? 'ON' : 'OFF';

  // Simulate telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature(20 + Math.random() * 30);
      setRpm(heaterOn ? 1000 + Math.random() * 500 : 0);
      setPressure(100 + Math.random() * 5);
      setFlowRate(heaterOn ? 1.5 + Math.random() * 0.5 : 0);
      setVoltage(11.8 + Math.random() * 0.6);
    }, 100);

    return () => clearInterval(interval);
  }, [heaterOn]);

  return (
    <main>
      <h1>Device Dashboard</h1>

      <section class="status">
        <span class={`indicator ${connected ? 'connected' : ''}`}></span>
        <span>{statusText}</span>
        <button onClick={() => setConnected(!connected)}>
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
        <button
          onClick={() => setHeaterOn(!heaterOn)}
          class={heaterOn ? 'active' : ''}
        >
          Heater: {heaterText}
        </button>
      </section>

      {fusainReady && <footer class="protocol">{protocolVersion}</footer>}
    </main>
  );
}
