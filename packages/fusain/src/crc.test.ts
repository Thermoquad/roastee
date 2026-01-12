// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { describe, it, expect } from "vitest";
import { calculateCRC } from "./crc.js";
import { CRC_INITIAL } from "./constants.js";

describe("calculateCRC", () => {
  it("should return initial value for empty data", () => {
    const crc = calculateCRC(new Uint8Array(0));
    expect(crc).toBe(CRC_INITIAL);
  });

  it("should return known CRC for ASCII '123456789'", () => {
    // Standard CRC-16-CCITT check value
    const data = new TextEncoder().encode("123456789");
    const crc = calculateCRC(data);
    expect(crc).toBe(0x29b1);
  });

  it("should be deterministic", () => {
    const data = new Uint8Array([0x10, 0x30, 0x01, 0x02, 0x03, 0x04]);
    const crc1 = calculateCRC(data);
    const crc2 = calculateCRC(data);
    expect(crc1).toBe(crc2);
  });

  it("should handle single byte", () => {
    const data = new Uint8Array([0x00]);
    const crc = calculateCRC(data);
    // CRC of 0x00 with initial 0xFFFF
    expect(typeof crc).toBe("number");
    expect(crc).toBeGreaterThanOrEqual(0);
    expect(crc).toBeLessThanOrEqual(0xffff);
  });

  it("should handle bytes that trigger MSB shift", () => {
    // 0xFF will cause MSB to be set frequently
    const data = new Uint8Array([0xff, 0xff, 0xff]);
    const crc = calculateCRC(data);
    expect(typeof crc).toBe("number");
    expect(crc).toBeGreaterThanOrEqual(0);
    expect(crc).toBeLessThanOrEqual(0xffff);
  });

  it("should produce different CRCs for different data", () => {
    const data1 = new Uint8Array([0x01, 0x02, 0x03]);
    const data2 = new Uint8Array([0x01, 0x02, 0x04]);
    const crc1 = calculateCRC(data1);
    const crc2 = calculateCRC(data2);
    expect(crc1).not.toBe(crc2);
  });
});
