// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { CRC_INITIAL, CRC_POLYNOMIAL } from "./constants.js";

/**
 * Calculate CRC-16-CCITT checksum for the given data
 *
 * @param data - Input bytes
 * @returns 16-bit CRC value
 */
export function calculateCRC(data: Uint8Array): number {
  let crc = CRC_INITIAL;

  for (const byte of data) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ CRC_POLYNOMIAL) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc;
}
