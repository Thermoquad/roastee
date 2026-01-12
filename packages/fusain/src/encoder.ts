// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { encode } from "cbor-x";
import {
  ADDRESS_SIZE,
  END_BYTE,
  ESC_BYTE,
  ESC_XOR,
  MAX_PAYLOAD_SIZE,
  START_BYTE,
} from "./constants.js";
import { calculateCRC } from "./crc.js";
import type { PayloadMap } from "./types.js";

/**
 * Encode a Fusain packet
 *
 * @param address - 64-bit device address
 * @param msgType - Message type
 * @param payload - Optional payload map (null for empty payloads)
 * @returns Encoded packet bytes with framing
 */
export function encodePacket(
  address: bigint,
  msgType: number,
  payload: PayloadMap | null = null,
): Uint8Array {
  // Build CBOR payload: [msg_type, payload_map]
  const cborData = payload
    ? encode([msgType, Object.fromEntries(payload)])
    : encode([msgType, null]);

  if (cborData.length > MAX_PAYLOAD_SIZE) {
    throw new Error(
      `CBOR payload too large: ${cborData.length} > ${MAX_PAYLOAD_SIZE}`,
    );
  }

  // Build CRC data: length + address + CBOR payload
  const crcDataLength = 1 + ADDRESS_SIZE + cborData.length;
  const crcData = new Uint8Array(crcDataLength);
  let offset = 0;

  // Length
  crcData[offset++] = cborData.length;

  // Address (little-endian)
  for (let i = 0; i < ADDRESS_SIZE; i++) {
    crcData[offset++] = Number((address >> BigInt(i * 8)) & 0xffn);
  }

  // CBOR payload
  crcData.set(cborData, offset);

  // Calculate CRC
  const crc = calculateCRC(crcData);

  // Build output with byte stuffing
  const output: number[] = [START_BYTE];

  // Add data with byte stuffing
  for (const byte of crcData) {
    if (byte === START_BYTE || byte === END_BYTE || byte === ESC_BYTE) {
      output.push(ESC_BYTE, byte ^ ESC_XOR);
    } else {
      output.push(byte);
    }
  }

  // Add CRC (big-endian) with byte stuffing
  const crcHigh = (crc >> 8) & 0xff;
  const crcLow = crc & 0xff;

  if (crcHigh === START_BYTE || crcHigh === END_BYTE || crcHigh === ESC_BYTE) {
    output.push(ESC_BYTE, crcHigh ^ ESC_XOR);
  } else {
    output.push(crcHigh);
  }

  if (crcLow === START_BYTE || crcLow === END_BYTE || crcLow === ESC_BYTE) {
    output.push(ESC_BYTE, crcLow ^ ESC_XOR);
  } else {
    output.push(crcLow);
  }

  output.push(END_BYTE);

  return new Uint8Array(output);
}
