// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { describe, it, expect } from "vitest";
import { encodeCBOR } from "./cbor-codec.js";
import { Decoder } from "./decoder.js";
import { calculateCRC } from "./crc.js";
import {
  START_BYTE,
  END_BYTE,
  ESC_BYTE,
  ESC_XOR,
  MSG_PING_REQUEST,
  MSG_STATE_DATA,
  MSG_PING_RESPONSE,
  MAX_PAYLOAD_SIZE,
} from "./constants.js";
import { DecodeError } from "./types.js";

// Helper to build CBOR payload
function buildCBORPayload(
  msgType: number,
  payload: Record<number, unknown> | null,
): Uint8Array {
  const msg = payload ? [msgType, payload] : [msgType, null];
  return encodeCBOR(msg);
}

// Helper to build a complete packet
function buildPacket(
  address: bigint,
  cborPayload: Uint8Array,
  withStuffing: boolean = false,
): Uint8Array {
  const length = cborPayload.length;

  // Build CRC data
  const crcData = new Uint8Array(1 + 8 + length);
  crcData[0] = length;
  for (let i = 0; i < 8; i++) {
    crcData[1 + i] = Number((address >> BigInt(i * 8)) & 0xffn);
  }
  crcData.set(cborPayload, 9);
  const crc = calculateCRC(crcData);

  const output: number[] = [START_BYTE];

  const addByte = (b: number) => {
    if (
      withStuffing &&
      (b === START_BYTE || b === END_BYTE || b === ESC_BYTE)
    ) {
      output.push(ESC_BYTE, b ^ ESC_XOR);
    } else {
      output.push(b);
    }
  };

  // Length
  addByte(length);

  // Address
  for (let i = 0; i < 8; i++) {
    addByte(Number((address >> BigInt(i * 8)) & 0xffn));
  }

  // CBOR payload
  for (const b of cborPayload) {
    addByte(b);
  }

  // CRC
  addByte((crc >> 8) & 0xff);
  addByte(crc & 0xff);

  output.push(END_BYTE);

  return new Uint8Array(output);
}

describe("Decoder", () => {
  describe("reset", () => {
    it("should reset to idle state", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04);
      decoder.reset();

      // After reset, should ignore non-START bytes
      const result = decoder.decodeByte(0x00);
      expect(result).toBeNull();
    });
  });

  describe("getRawBytes", () => {
    it("should return accumulated raw bytes", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04);
      decoder.decodeByte(0x01);

      const raw = decoder.getRawBytes();
      expect(raw.length).toBeGreaterThan(0);
      expect(raw[0]).toBe(START_BYTE);
    });
  });

  describe("simple packet decoding", () => {
    it("should decode a PING_REQUEST packet", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
      const packet = buildPacket(address, cborPayload);

      let result = null;
      for (const byte of packet) {
        result = decoder.decodeByte(byte);
        if (result) break;
      }

      expect(result).not.toBeNull();
      expect(result?.type).toBe(MSG_PING_REQUEST);
      expect(result?.address).toBe(address);
      expect(result?.payloadMap).toBeNull();
    });

    it("should decode a packet with payload", () => {
      const decoder = new Decoder();
      const address = 0x123456789abcdef0n;
      const cborPayload = buildCBORPayload(MSG_STATE_DATA, {
        0: false,
        1: 0,
        2: 1,
        3: 123456,
      });
      const packet = buildPacket(address, cborPayload);

      let result = null;
      for (const byte of packet) {
        result = decoder.decodeByte(byte);
        if (result) break;
      }

      expect(result).not.toBeNull();
      expect(result?.type).toBe(MSG_STATE_DATA);
      expect(result?.payloadMap?.get(2)).toBe(1);
    });
  });

  describe("byte stuffing", () => {
    it("should handle escaped bytes in payload", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      // Create payload with START_BYTE value
      const cborPayload = buildCBORPayload(MSG_PING_RESPONSE, {
        0: START_BYTE,
      });
      const packet = buildPacket(address, cborPayload, true);

      let result = null;
      for (const byte of packet) {
        result = decoder.decodeByte(byte);
        if (result) break;
      }

      expect(result).not.toBeNull();
      expect(result?.payloadMap?.get(0)).toBe(START_BYTE);
    });

    it("should handle escaped END_BYTE in data", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_RESPONSE, { 0: END_BYTE });
      const packet = buildPacket(address, cborPayload, true);

      let result = null;
      for (const byte of packet) {
        result = decoder.decodeByte(byte);
        if (result) break;
      }

      expect(result).not.toBeNull();
      expect(result?.payloadMap?.get(0)).toBe(END_BYTE);
    });

    it("should handle escaped ESC_BYTE in data", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_RESPONSE, { 0: ESC_BYTE });
      const packet = buildPacket(address, cborPayload, true);

      let result = null;
      for (const byte of packet) {
        result = decoder.decodeByte(byte);
        if (result) break;
      }

      expect(result).not.toBeNull();
      expect(result?.payloadMap?.get(0)).toBe(ESC_BYTE);
    });
  });

  describe("error handling", () => {
    it("should throw on CRC mismatch", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
      const packet = buildPacket(address, cborPayload);

      // Corrupt the CRC
      packet[packet.length - 3] = 0xbe;
      packet[packet.length - 2] = 0xef;

      expect(() => {
        for (const byte of packet) {
          decoder.decodeByte(byte);
        }
      }).toThrow(DecodeError);
    });

    it("should include CRC values in error message", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
      const packet = buildPacket(address, cborPayload);

      packet[packet.length - 3] = 0xbe;
      packet[packet.length - 2] = 0xef;

      try {
        for (const byte of packet) {
          decoder.decodeByte(byte);
        }
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(DecodeError);
        expect((err as DecodeError).message).toContain("CRC mismatch");
        expect((err as DecodeError).message).toContain("BEEF");
      }
    });

    it("should throw on invalid length", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);

      expect(() => {
        decoder.decodeByte(MAX_PAYLOAD_SIZE + 1);
      }).toThrow(DecodeError);
    });

    it("should include max size in length error", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);

      try {
        decoder.decodeByte(MAX_PAYLOAD_SIZE + 1);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(DecodeError);
        expect((err as DecodeError).message).toContain("invalid length");
        expect((err as DecodeError).message).toContain(
          String(MAX_PAYLOAD_SIZE),
        );
      }
    });

    it("should throw on unexpected END byte", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04);

      expect(() => {
        decoder.decodeByte(END_BYTE);
      }).toThrow(DecodeError);
    });

    it("should include state in unexpected END error", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04);

      try {
        decoder.decodeByte(END_BYTE);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(DecodeError);
        expect((err as DecodeError).message).toContain("unexpected END byte");
      }
    });

    it("should provide raw bytes in error", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04);

      try {
        decoder.decodeByte(END_BYTE);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(DecodeError);
        expect((err as DecodeError).rawBytes).toBeDefined();
        expect((err as DecodeError).rawBytes?.length).toBeGreaterThan(0);
      }
    });
  });

  describe("state machine", () => {
    it("should ignore bytes in idle state", () => {
      const decoder = new Decoder();
      const result = decoder.decodeByte(0x00);
      expect(result).toBeNull();
    });

    it("should reset on new START byte", () => {
      const decoder = new Decoder();

      // Start a packet
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04);
      decoder.decodeByte(0x01);

      // New START resets
      decoder.decodeByte(START_BYTE);

      // Now complete a valid packet
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
      const packet = buildPacket(address, cborPayload);

      // Skip the START_BYTE since we already sent it
      let result = null;
      for (let i = 1; i < packet.length; i++) {
        result = decoder.decodeByte(packet[i]!);
        if (result) break;
      }

      expect(result).not.toBeNull();
    });

    it("should handle zero-length payload", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;

      // Build a packet with zero-length CBOR payload
      // This would be unusual but valid per the state machine
      const crcData = new Uint8Array(9);
      crcData[0] = 0; // length = 0
      for (let i = 0; i < 8; i++) {
        crcData[1 + i] = Number((address >> BigInt(i * 8)) & 0xffn);
      }
      const crc = calculateCRC(crcData);

      const packet = new Uint8Array([
        START_BYTE,
        0, // length
        ...Array.from({ length: 8 }, (_, i) =>
          Number((address >> BigInt(i * 8)) & 0xffn),
        ),
        (crc >> 8) & 0xff,
        crc & 0xff,
        END_BYTE,
      ]);

      let result = null;
      for (const byte of packet) {
        result = decoder.decodeByte(byte);
        if (result) break;
      }

      expect(result).not.toBeNull();
      expect(result?.length).toBe(0);
    });
  });

  describe("decodeBytes", () => {
    it("should decode multiple packets", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
      const packet = buildPacket(address, cborPayload);

      // Send two packets
      const combined = new Uint8Array(packet.length * 2);
      combined.set(packet, 0);
      combined.set(packet, packet.length);

      const packets = decoder.decodeBytes(combined);
      expect(packets.length).toBe(2);
    });

    it("should handle partial packet", () => {
      const decoder = new Decoder();
      const address = 0x0102030405060708n;
      const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
      const packet = buildPacket(address, cborPayload);

      // Send partial packet
      const partial = packet.slice(0, packet.length - 2);
      const packets = decoder.decodeBytes(partial);
      expect(packets.length).toBe(0);
    });
  });

  describe("buffer overflow protection", () => {
    it("should detect buffer overflow at length byte", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);

      // Manually set bufferIndex to trigger overflow
      // This is a defensive test - in practice this shouldn't happen
      (decoder as unknown as { bufferIndex: number }).bufferIndex = 128;

      expect(() => {
        decoder.decodeByte(0x04);
      }).toThrow("buffer overflow at length byte");
    });

    it("should detect buffer overflow at address byte", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04); // length

      // Manually set bufferIndex to trigger overflow
      (decoder as unknown as { bufferIndex: number }).bufferIndex = 128;

      expect(() => {
        decoder.decodeByte(0x01);
      }).toThrow("buffer overflow at address byte");
    });

    it("should detect buffer overflow at payload byte", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);
      decoder.decodeByte(0x04); // length

      // Send 8 address bytes
      for (let i = 0; i < 8; i++) {
        decoder.decodeByte(i);
      }

      // Manually set bufferIndex to trigger overflow
      (decoder as unknown as { bufferIndex: number }).bufferIndex = 128;

      expect(() => {
        decoder.decodeByte(0x01);
      }).toThrow("buffer overflow: packet exceeds max size");
    });

    it("should handle invalid state", () => {
      const decoder = new Decoder();
      decoder.decodeByte(START_BYTE);

      // Manually set invalid state
      (decoder as unknown as { state: number }).state = 999;

      expect(() => {
        decoder.decodeByte(0x04);
      }).toThrow("invalid state: 999");
    });
  });
});
