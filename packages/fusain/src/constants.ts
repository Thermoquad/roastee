// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

/**
 * Fusain Protocol Constants
 *
 * Reference implementation for the Fusain protocol.
 * See: https://thermoquad.github.io/origin/specifications/fusain/
 */

// Protocol framing bytes
export const START_BYTE = 0x7e;
export const END_BYTE = 0x7f;
export const ESC_BYTE = 0x7d;
export const ESC_XOR = 0x20;

// Packet size limits
export const MAX_PACKET_SIZE = 128; // 14 overhead + 114 payload
export const MAX_PAYLOAD_SIZE = 114;
export const ADDRESS_SIZE = 8;

// CRC-16-CCITT configuration
export const CRC_POLYNOMIAL = 0x1021;
export const CRC_INITIAL = 0xffff;

// Special addresses
export const ADDRESS_BROADCAST = 0x0000000000000000n; // All devices
export const ADDRESS_STATELESS = 0xffffffffffffffffn; // Routers, subscriptions

// Message types - Configuration Commands (Controller → Appliance) 0x10-0x1F
export const MSG_MOTOR_CONFIG = 0x10;
export const MSG_PUMP_CONFIG = 0x11;
export const MSG_TEMP_CONFIG = 0x12;
export const MSG_GLOW_CONFIG = 0x13;
export const MSG_DATA_SUBSCRIPTION = 0x14;
export const MSG_DATA_UNSUBSCRIBE = 0x15;
export const MSG_TELEMETRY_CONFIG = 0x16;
export const MSG_TIMEOUT_CONFIG = 0x17;
export const MSG_DISCOVERY_REQUEST = 0x1f;

// Message types - Control Commands (Controller → Appliance) 0x20-0x2F
export const MSG_STATE_COMMAND = 0x20;
export const MSG_MOTOR_COMMAND = 0x21;
export const MSG_PUMP_COMMAND = 0x22;
export const MSG_GLOW_COMMAND = 0x23;
export const MSG_TEMP_COMMAND = 0x24;
export const MSG_SEND_TELEMETRY = 0x25;
export const MSG_PING_REQUEST = 0x2f;

// Message types - Telemetry Data (Appliance → Controller) 0x30-0x3F
export const MSG_STATE_DATA = 0x30;
export const MSG_MOTOR_DATA = 0x31;
export const MSG_PUMP_DATA = 0x32;
export const MSG_GLOW_DATA = 0x33;
export const MSG_TEMP_DATA = 0x34;
export const MSG_DEVICE_ANNOUNCE = 0x35;
export const MSG_PING_RESPONSE = 0x3f;

// Message types - Errors (Bidirectional) 0xE0-0xEF
export const MSG_ERROR_INVALID_CMD = 0xe0;
export const MSG_ERROR_STATE_REJECT = 0xe1;

// Decoder states (internal)
export const enum DecoderState {
  Idle = 0,
  Length = 1,
  Address = 2,
  Payload = 3,
  CRC1 = 4,
  CRC2 = 5,
}

// System state values
export const enum SysState {
  Initializing = 0,
  Idle = 1,
  Blowing = 2,
  Preheat = 3,
  PreheatStage2 = 4,
  Heating = 5,
  Cooling = 6,
  Error = 7,
  Estop = 8,
}

// Error code values
export const enum ErrorCode {
  None = 0x00,
  Overheat = 0x01,
  SensorFault = 0x02,
  IgnitionFail = 0x03,
  FlameOut = 0x04,
  MotorStall = 0x05,
  PumpFault = 0x06,
  CommandedStop = 0x07,
}

// Operating mode values
export const enum Mode {
  Idle = 0x00,
  Fan = 0x01,
  Heat = 0x02,
  Emergency = 0x03,
}

// Temperature command type values
export const enum TempCmdType {
  WatchMotor = 0x00,
  UnwatchMotor = 0x01,
  EnableRpmControl = 0x02,
  DisableRpmControl = 0x03,
  SetTargetTemp = 0x04,
}

// Telemetry type values
export const enum TelemetryType {
  State = 0x00,
  Motor = 0x01,
  Temp = 0x02,
  Pump = 0x03,
  Glow = 0x04,
}

// Pump event values
export const enum PumpEvent {
  Initializing = 0x00,
  Ready = 0x01,
  Error = 0x02,
  CycleStart = 0x03,
  PulseEnd = 0x04,
  CycleEnd = 0x05,
}
