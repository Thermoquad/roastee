// Fusain protocol integration
// This module ensures fusain is included in the bundle by using its core features

import {
  Decoder,
  encodePacket,
  MSG_STATE_DATA,
  MSG_PING_REQUEST,
  ADDRESS_BROADCAST,
} from 'fusain';

// Create a decoder instance for receiving packets
export const decoder = new Decoder();

// Encode a ping request packet (demonstrates encoder usage)
const pingPacket = encodePacket(ADDRESS_BROADCAST, MSG_PING_REQUEST, new Map());

// Feed the encoded packet to the decoder to verify round-trip
for (const byte of pingPacket) {
  const result = decoder.feed(byte);
  if (result) {
    console.debug('[Fusain] Decoded packet:', result.packet.messageType);
  }
}

// Export packet info for use in UI (prevents tree-shaking)
export const fusainReady = pingPacket.length > 0;
export const protocolVersion = 'Fusain v3.0 (CBOR)';

// Helper to create telemetry packet (would be used with real device)
export function createTelemetrySubscription(types: number[]): Uint8Array {
  const payload = new Map<number, unknown>();
  payload.set(1, types); // telemetry_types field
  return encodePacket(ADDRESS_BROADCAST, MSG_STATE_DATA, payload);
}
