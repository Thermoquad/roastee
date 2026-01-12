// Fusain WebSocket client for Bucket demo
import { createSignal } from 'solid-js';
import {
  Decoder,
  MSG_STATE_DATA,
  MSG_MOTOR_DATA,
  MSG_TEMP_DATA,
  MSG_PUMP_DATA,
  MSG_GLOW_DATA,
  getMapNumber,
  getMapBool,
} from 'fusain';
import type { IPacket } from 'fusain';

export const decoder = new Decoder();
export const protocolVersion = 'Fusain v3.0 (CBOR)';

// Fusain state names
export const STATE_NAMES: Record<number, string> = {
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

// Connection state
export const [connected, setConnected] = createSignal(false);

// Device state
export const [deviceState, setDeviceState] = createSignal(0);
export const [deviceError, setDeviceError] = createSignal(0);

// Telemetry
export const [temperature, setTemperature] = createSignal(25.0);
export const [motorRpm, setMotorRpm] = createSignal(0);
export const [motorTarget, setMotorTarget] = createSignal(0);
export const [pumpRate, setPumpRate] = createSignal(0);
export const [glowLit, setGlowLit] = createSignal(false);
export const [packetCount, setPacketCount] = createSignal(0);

let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;

function handlePacket(packet: IPacket) {
  const m = packet.payloadMap;
  setPacketCount((c) => c + 1);

  switch (packet.type) {
    case MSG_STATE_DATA: {
      const state = getMapNumber(m, 2) ?? 0;
      const error = getMapNumber(m, 1) ?? 0;
      setDeviceState(state);
      setDeviceError(error);
      break;
    }
    case MSG_MOTOR_DATA: {
      const rpm = getMapNumber(m, 2) ?? 0;
      const target = getMapNumber(m, 3) ?? 0;
      setMotorRpm(rpm);
      setMotorTarget(target);
      break;
    }
    case MSG_TEMP_DATA: {
      const temp = getMapNumber(m, 2) ?? 25.0;
      setTemperature(temp);
      break;
    }
    case MSG_PUMP_DATA: {
      const rate = getMapNumber(m, 3) ?? 0;
      setPumpRate(rate);
      break;
    }
    case MSG_GLOW_DATA: {
      const lit = getMapBool(m, 2) ?? false;
      setGlowLit(lit);
      break;
    }
  }
}

function connect() {
  if (ws?.readyState === WebSocket.OPEN) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/ws/fusain`;

  ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    setConnected(true);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  ws.onclose = () => {
    setConnected(false);
    ws = null;
    reconnectTimer = window.setTimeout(connect, 2000);
  };

  ws.onerror = () => {
    ws?.close();
  };

  ws.onmessage = (event) => {
    if (!(event.data instanceof ArrayBuffer)) return;

    const bytes = new Uint8Array(event.data);
    try {
      const packets = decoder.decodeBytes(bytes);
      for (const packet of packets) {
        handlePacket(packet);
      }
    } catch {
      // Decode error - ignore
    }
  };
}

export function initFusain() {
  connect();
}
