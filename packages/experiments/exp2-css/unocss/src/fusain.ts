// Fusain protocol integration
import { Decoder, encodePacket, MSG_PING_REQUEST, ADDRESS_BROADCAST } from 'fusain';

export const decoder = new Decoder();
const pingPacket = encodePacket(ADDRESS_BROADCAST, MSG_PING_REQUEST, new Map());
for (const byte of pingPacket) decoder.decodeByte(byte);

export const fusainReady = pingPacket.length > 0;
export const protocolVersion = 'Fusain v3.0 (CBOR)';
