// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

/**
 * Fusain Protocol - TypeScript Implementation
 *
 * Reference implementation for the Fusain protocol.
 * See: https://thermoquad.github.io/origin/specifications/fusain/
 *
 * @packageDocumentation
 */

// Constants
export {
  // Framing bytes
  START_BYTE,
  END_BYTE,
  ESC_BYTE,
  ESC_XOR,
  // Size limits
  MAX_PACKET_SIZE,
  MAX_PAYLOAD_SIZE,
  ADDRESS_SIZE,
  // CRC configuration
  CRC_POLYNOMIAL,
  CRC_INITIAL,
  // Special addresses
  ADDRESS_BROADCAST,
  ADDRESS_STATELESS,
  // Message types - Configuration Commands
  MSG_MOTOR_CONFIG,
  MSG_PUMP_CONFIG,
  MSG_TEMP_CONFIG,
  MSG_GLOW_CONFIG,
  MSG_DATA_SUBSCRIPTION,
  MSG_DATA_UNSUBSCRIBE,
  MSG_TELEMETRY_CONFIG,
  MSG_TIMEOUT_CONFIG,
  MSG_DISCOVERY_REQUEST,
  // Message types - Control Commands
  MSG_STATE_COMMAND,
  MSG_MOTOR_COMMAND,
  MSG_PUMP_COMMAND,
  MSG_GLOW_COMMAND,
  MSG_TEMP_COMMAND,
  MSG_SEND_TELEMETRY,
  MSG_PING_REQUEST,
  // Message types - Telemetry Data
  MSG_STATE_DATA,
  MSG_MOTOR_DATA,
  MSG_PUMP_DATA,
  MSG_GLOW_DATA,
  MSG_TEMP_DATA,
  MSG_DEVICE_ANNOUNCE,
  MSG_PING_RESPONSE,
  // Message types - Errors
  MSG_ERROR_INVALID_CMD,
  MSG_ERROR_STATE_REJECT,
  // Enums
  DecoderState,
  SysState,
  ErrorCode,
  Mode,
  TempCmdType,
  TelemetryType,
  PumpEvent,
} from "./constants.js";

// Types
export type { IPacket, PayloadMap, DecodeResult } from "./types.js";
export { DecodeError, CBORParseError } from "./types.js";

// CRC
export { calculateCRC } from "./crc.js";

// CBOR helpers
export {
  parseCBORMessage,
  getMapNumber,
  getMapBigInt,
  getMapBool,
  getMapBytes,
} from "./cbor.js";

// Packet
export { Packet } from "./packet.js";

// Decoder
export { Decoder } from "./decoder.js";

// Encoder
export { encodePacket } from "./encoder.js";
