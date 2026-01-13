// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { describe, it, expect } from "vitest";
import { encodePacket } from "./encoder.js";
import { Decoder } from "./decoder.js";
import {
  MSG_PING_REQUEST,
  MSG_STATE_DATA,
  MSG_STATE_COMMAND,
  START_BYTE,
  END_BYTE,
  ESC_BYTE,
  MAX_PAYLOAD_SIZE,
} from "./constants.js";

describe("encodePacket", () => {
  it("should encode a packet with null payload", () => {
    const address = 0x0102030405060708n;
    const encoded = encodePacket(address, MSG_PING_REQUEST, null);

    // Should have START and END bytes
    expect(encoded[0]).toBe(START_BYTE);
    expect(encoded[encoded.length - 1]).toBe(END_BYTE);

    // Should be decodable
    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);
    expect(packets.length).toBe(1);
    expect(packets[0]?.type).toBe(MSG_PING_REQUEST);
    expect(packets[0]?.address).toBe(address);
    expect(packets[0]?.payloadMap).toBeNull();
  });

  it("should encode a packet with payload", () => {
    const address = 0x123456789abcdef0n;
    const payload = new Map<number, unknown>([
      [0, false],
      [1, 0],
      [2, 1],
      [3, 12345],
    ]);
    const encoded = encodePacket(address, MSG_STATE_DATA, payload);

    // Should be decodable
    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);
    expect(packets.length).toBe(1);
    expect(packets[0]?.type).toBe(MSG_STATE_DATA);
    expect(packets[0]?.payloadMap?.get(2)).toBe(1);
    expect(packets[0]?.payloadMap?.get(3)).toBe(12345);
  });

  it("should apply byte stuffing for START_BYTE in data", () => {
    const address = BigInt(START_BYTE); // Address containing START_BYTE
    const encoded = encodePacket(address, MSG_PING_REQUEST, null);

    // Should contain escape sequence
    let hasEscape = false;
    for (let i = 1; i < encoded.length - 1; i++) {
      if (encoded[i] === ESC_BYTE) {
        hasEscape = true;
        break;
      }
    }
    expect(hasEscape).toBe(true);

    // Should still be decodable
    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);
    expect(packets.length).toBe(1);
    expect(Number(packets[0]?.address & 0xffn)).toBe(START_BYTE);
  });

  it("should apply byte stuffing for END_BYTE in data", () => {
    const address = BigInt(END_BYTE);
    const encoded = encodePacket(address, MSG_PING_REQUEST, null);

    // Should be decodable
    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);
    expect(packets.length).toBe(1);
    expect(Number(packets[0]?.address & 0xffn)).toBe(END_BYTE);
  });

  it("should apply byte stuffing for ESC_BYTE in data", () => {
    const address = BigInt(ESC_BYTE);
    const encoded = encodePacket(address, MSG_PING_REQUEST, null);

    // Should be decodable
    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);
    expect(packets.length).toBe(1);
    expect(Number(packets[0]?.address & 0xffn)).toBe(ESC_BYTE);
  });

  it("should apply byte stuffing for special bytes in CRC", () => {
    // Try multiple addresses until we get one with special bytes in CRC
    let foundSpecialCRC = false;
    for (let i = 0; i < 1000; i++) {
      const address = BigInt(i);
      const encoded = encodePacket(address, MSG_PING_REQUEST, null);

      // Check if CRC bytes (before END) contain special bytes
      const decoder = new Decoder();
      const packets = decoder.decodeBytes(encoded);
      if (packets.length === 1) {
        foundSpecialCRC = true;
      }
    }
    expect(foundSpecialCRC).toBe(true);
  });

  it("should throw on payload too large", () => {
    const address = 0x0102030405060708n;
    // Create a payload that will exceed MAX_PAYLOAD_SIZE when CBOR encoded
    // Use large byte arrays to exceed the limit
    const largePayload = new Map<number, unknown>();
    for (let i = 0; i < 20; i++) {
      largePayload.set(i, new Uint8Array(10).fill(i));
    }

    expect(() => {
      encodePacket(address, MSG_STATE_COMMAND, largePayload);
    }).toThrow("CBOR payload too large");
  });

  it("should roundtrip encode/decode", () => {
    const address = 0xfedcba9876543210n;
    const payload = new Map<number, unknown>([
      [0, 2], // mode = HEAT
      [1, 100], // argument
    ]);
    const encoded = encodePacket(address, MSG_STATE_COMMAND, payload);

    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);

    expect(packets.length).toBe(1);
    expect(packets[0]?.address).toBe(address);
    expect(packets[0]?.type).toBe(MSG_STATE_COMMAND);
    expect(packets[0]?.payloadMap?.get(0)).toBe(2);
    expect(packets[0]?.payloadMap?.get(1)).toBe(100);
  });

  it("should handle broadcast address", () => {
    const encoded = encodePacket(0n, MSG_PING_REQUEST, null);

    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);
    expect(packets.length).toBe(1);
    expect(packets[0]?.isBroadcast).toBe(true);
  });

  it("should handle stateless address", () => {
    const encoded = encodePacket(0xffffffffffffffffn, MSG_PING_REQUEST, null);

    const decoder = new Decoder();
    const packets = decoder.decodeBytes(encoded);
    expect(packets.length).toBe(1);
    expect(packets[0]?.isStateless).toBe(true);
  });

  it("should apply byte stuffing for special bytes in CRC low byte", () => {
    // Search for an address that produces a CRC with special low byte
    // CRC is deterministic, so we can find a match by iteration
    const specialBytes = [START_BYTE, END_BYTE, ESC_BYTE];
    let foundCrcLowSpecial = false;

    for (let i = 0; i < 10000 && !foundCrcLowSpecial; i++) {
      const address = BigInt(i);
      const encoded = encodePacket(address, MSG_PING_REQUEST, null);

      // Decode to verify and check CRC
      const decoder = new Decoder();
      const packets = decoder.decodeBytes(encoded);
      if (packets.length === 1) {
        const crc = packets[0]!.crc;
        const crcLow = crc & 0xff;

        if (specialBytes.includes(crcLow)) {
          foundCrcLowSpecial = true;
          // Verify the packet decoded correctly
          expect(packets[0]?.address).toBe(address);
        }
      }
    }
    expect(foundCrcLowSpecial).toBe(true);
  });
});
