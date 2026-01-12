// Fusain WebSocket client for Bucket demo
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
import { $connected, $deviceState, $telemetry } from './stores';

export const decoder = new Decoder();
export const protocolVersion = 'Fusain v3.0 (CBOR)';

let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;

function handlePacket(packet: IPacket) {
  const m = packet.payloadMap;
  $telemetry.setKey('packetCount', $telemetry.get().packetCount + 1);

  switch (packet.type) {
    case MSG_STATE_DATA: {
      // Keys: 0=error, 1=code, 2=state, 3=timestamp
      const state = getMapNumber(m, 2) ?? 0;
      const error = getMapNumber(m, 1) ?? 0;
      $deviceState.setKey('state', state);
      $deviceState.setKey('error', error);
      break;
    }
    case MSG_MOTOR_DATA: {
      // Keys: 0=motor, 1=timestamp, 2=rpm, 3=target
      const rpm = getMapNumber(m, 2) ?? 0;
      const target = getMapNumber(m, 3) ?? 0;
      $telemetry.setKey('motorRpm', rpm);
      $telemetry.setKey('motorTarget', target);
      break;
    }
    case MSG_TEMP_DATA: {
      // Keys: 0=thermometer, 1=timestamp, 2=reading
      const temp = getMapNumber(m, 2) ?? 25.0;
      $telemetry.setKey('temperature', temp);
      break;
    }
    case MSG_PUMP_DATA: {
      // Keys: 0=pump, 1=timestamp, 2=event, 3=rate
      const rate = getMapNumber(m, 3) ?? 0;
      $telemetry.setKey('pumpRate', rate);
      break;
    }
    case MSG_GLOW_DATA: {
      // Keys: 0=glow, 1=timestamp, 2=lit
      const lit = getMapBool(m, 2) ?? false;
      $telemetry.setKey('glowLit', lit);
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
    $connected.set(true);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  ws.onclose = () => {
    $connected.set(false);
    ws = null;
    // Reconnect after 2 seconds
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
      // Decode error - ignore malformed packets
    }
  };
}

export function initFusain() {
  connect();
}

export function disconnectFusain() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
  $connected.set(false);
}
