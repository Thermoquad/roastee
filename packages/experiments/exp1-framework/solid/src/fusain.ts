// Fusain WebSocket client for exp1-framework
// Connects to /ws/fusain endpoint and decodes telemetry packets

import {
  Decoder,
  MSG_STATE_DATA,
  MSG_MOTOR_DATA,
  MSG_PUMP_DATA,
  MSG_GLOW_DATA,
  MSG_TEMP_DATA,
  type IPacket,
} from 'fusain';

// State names for display
const STATE_NAMES: Record<number, string> = {
  0x00: 'Initializing',
  0x01: 'Idle',
  0x02: 'Blowing',
  0x03: 'Preheat',
  0x04: 'Preheat 2',
  0x05: 'Heating',
  0x06: 'Cooling',
  0x07: 'Error',
  0x08: 'E-Stop',
};

export interface TelemetryState {
  connected: boolean;
  state: string;
  stateCode: number;
  temperature: number;
  motorRpm: number;
  motorTarget: number;
  pumpRate: number;
  glowLit: boolean;
  timestamp: number;
  packetCount: number;
}

export type TelemetryCallback = (state: TelemetryState) => void;

export class FusainClient {
  private ws: WebSocket | null = null;
  private decoder = new Decoder();
  private callback: TelemetryCallback | null = null;
  private reconnectTimer: number | null = null;

  private state: TelemetryState = {
    connected: false,
    state: 'Unknown',
    stateCode: 0,
    temperature: 0,
    motorRpm: 0,
    motorTarget: 0,
    pumpRate: 0,
    glowLit: false,
    timestamp: 0,
    packetCount: 0,
  };

  connect(onUpdate: TelemetryCallback): void {
    this.callback = onUpdate;
    this.doConnect();
  }

  private doConnect(): void {
    // Connect to WebSocket endpoint on same host
    const wsUrl = `ws://${window.location.host}/ws/fusain`;
    console.log('[Fusain] Connecting to', wsUrl);

    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('[Fusain] Connected');
      this.state.connected = true;
      this.notify();
    };

    this.ws.onclose = () => {
      console.log('[Fusain] Disconnected');
      this.state.connected = false;
      this.notify();
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[Fusain] WebSocket error:', err);
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.handleBinaryMessage(new Uint8Array(event.data));
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.doConnect();
    }, 2000);
  }

  private handleBinaryMessage(data: Uint8Array): void {
    // Feed each byte to the decoder
    for (const byte of data) {
      try {
        const packet = this.decoder.decodeByte(byte);
        if (packet) {
          this.handlePacket(packet);
        }
      } catch (err) {
        console.error('[Fusain] Decode error:', err);
      }
    }
  }

  private handlePacket(packet: IPacket): void {
    this.state.packetCount++;

    const payload = packet.payloadMap;
    if (!payload) return;

    switch (packet.type) {
      case MSG_STATE_DATA: {
        const stateCode = (payload.get(2) as number) ?? 0;
        this.state.stateCode = stateCode;
        this.state.state = STATE_NAMES[stateCode] ?? `Unknown (${stateCode})`;
        this.state.timestamp = (payload.get(3) as number) ?? 0;
        break;
      }

      case MSG_MOTOR_DATA: {
        this.state.motorRpm = (payload.get(2) as number) ?? 0;
        this.state.motorTarget = (payload.get(3) as number) ?? 0;
        this.state.timestamp = (payload.get(1) as number) ?? 0;
        break;
      }

      case MSG_TEMP_DATA: {
        this.state.temperature = (payload.get(2) as number) ?? 0;
        this.state.timestamp = (payload.get(1) as number) ?? 0;
        break;
      }

      case MSG_PUMP_DATA: {
        this.state.pumpRate = (payload.get(2) as number) ?? 0;
        this.state.timestamp = (payload.get(1) as number) ?? 0;
        break;
      }

      case MSG_GLOW_DATA: {
        this.state.glowLit = (payload.get(2) as boolean) ?? false;
        this.state.timestamp = (payload.get(1) as number) ?? 0;
        break;
      }
    }

    this.notify();
  }

  private notify(): void {
    if (this.callback) {
      this.callback({ ...this.state });
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const fusainClient = new FusainClient();
export const protocolVersion = 'Fusain v3.0 (CBOR)';
