// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { describe, it, expect } from "vitest";
import { encode } from "cbor-x";
import {
  parseCBORMessage,
  getMapNumber,
  getMapBigInt,
  getMapBool,
  getMapBytes,
} from "./cbor.js";
import { CBORParseError } from "./types.js";
import { MSG_PING_REQUEST, MSG_STATE_DATA } from "./constants.js";

// Helper to build CBOR payload
function buildCBORPayload(
  msgType: number,
  payload: Record<number, unknown> | null,
): Uint8Array {
  const msg = payload ? [msgType, payload] : [msgType, null];
  return encode(msg);
}

describe("parseCBORMessage", () => {
  it("should throw on empty payload", () => {
    expect(() => parseCBORMessage(new Uint8Array(0))).toThrow(CBORParseError);
    expect(() => parseCBORMessage(new Uint8Array(0))).toThrow(
      "empty CBOR payload",
    );
  });

  it("should parse PING_REQUEST with null payload", () => {
    const data = buildCBORPayload(MSG_PING_REQUEST, null);
    const [msgType, payload] = parseCBORMessage(data);
    expect(msgType).toBe(MSG_PING_REQUEST);
    expect(payload).toBeNull();
  });

  it("should parse STATE_DATA with payload", () => {
    const data = buildCBORPayload(MSG_STATE_DATA, {
      0: false,
      1: 0,
      2: 1,
      3: 12345,
    });
    const [msgType, payload] = parseCBORMessage(data);
    expect(msgType).toBe(MSG_STATE_DATA);
    expect(payload).not.toBeNull();
    expect(payload?.get(0)).toBe(false);
    expect(payload?.get(2)).toBe(1);
  });

  it("should throw on invalid CBOR", () => {
    const invalid = new Uint8Array([0xff, 0xff, 0xff]);
    expect(() => parseCBORMessage(invalid)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(invalid)).toThrow("failed to decode CBOR");
  });

  it("should throw on non-array", () => {
    const data = encode({ foo: "bar" });
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow("expected 2-element array");
  });

  it("should throw on wrong array length", () => {
    const data = encode([1, 2, 3]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow("expected 2-element array");
  });

  it("should throw on non-integer message type", () => {
    const data = encode(["foo", null]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow(
      "expected integer for message type",
    );
  });

  it("should throw on float message type", () => {
    const data = encode([1.5, null]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow(
      "expected integer for message type",
    );
  });

  it("should throw on message type out of range (negative)", () => {
    const data = encode([-1, null]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow("message type out of range");
  });

  it("should throw on message type out of range (> 255)", () => {
    const data = encode([256, null]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow("message type out of range");
  });

  it("should throw on non-map payload", () => {
    const data = encode([0x30, "invalid"]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow(
      "expected map or null for payload",
    );
  });

  it("should handle undefined payload as null", () => {
    // cbor-x may decode null as undefined in some cases
    const data = encode([0x2f, undefined]);
    const [msgType, payload] = parseCBORMessage(data);
    expect(msgType).toBe(0x2f);
    expect(payload).toBeNull();
  });

  it("should handle Map payload from cbor-x", () => {
    // Manually create a CBOR with Map
    const map = new Map<number, unknown>([
      [0, 100],
      [1, "test"],
    ]);
    const data = encode([0x30, map]);
    const [msgType, payload] = parseCBORMessage(data);
    expect(msgType).toBe(0x30);
    expect(payload?.get(0)).toBe(100);
  });

  it("should throw on non-integer map key in Map", () => {
    const map = new Map<string, unknown>([["foo", 100]]);
    const data = encode([0x30, map]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow("expected integer map key");
  });

  it("should handle plain object payload with integer string keys", () => {
    // Some CBOR decoders return plain objects instead of Maps
    // We can't directly test this with cbor-x as it returns Maps,
    // but we can manually construct CBOR with string keys that parse as integers
    // CBOR: [0x30, {"0": 42, "1": true}] with text string keys
    // Major type 5 (map) + length 2 = 0xa2
    // Text string "0" = 0x61 0x30 (major type 3, length 1, "0")
    // Integer 42 = 0x18 0x2a
    // Text string "1" = 0x61 0x31
    // True = 0xf5
    const data = new Uint8Array([
      0x82, // array(2)
      0x18,
      0x30, // uint(0x30)
      0xa2, // map(2)
      0x61,
      0x30, // text(1) "0"
      0x18,
      0x2a, // uint(42)
      0x61,
      0x31, // text(1) "1"
      0xf5, // true
    ]);
    const [msgType, payload] = parseCBORMessage(data);
    expect(msgType).toBe(0x30);
    expect(payload?.get(0)).toBe(42);
    expect(payload?.get(1)).toBe(true);
  });

  it("should throw on non-numeric string key in plain object", () => {
    // CBOR: [0x30, {"foo": 42}] with text string key "foo"
    const data = new Uint8Array([
      0x82, // array(2)
      0x18,
      0x30, // uint(0x30)
      0xa1, // map(1)
      0x63,
      0x66,
      0x6f,
      0x6f, // text(3) "foo"
      0x18,
      0x2a, // uint(42)
    ]);
    expect(() => parseCBORMessage(data)).toThrow(CBORParseError);
    expect(() => parseCBORMessage(data)).toThrow("expected integer map key");
  });
});

describe("getMapNumber", () => {
  it("should return undefined for null map", () => {
    expect(getMapNumber(null, 0)).toBeUndefined();
  });

  it("should return undefined for missing key", () => {
    const m = new Map<number, unknown>([[0, 42]]);
    expect(getMapNumber(m, 99)).toBeUndefined();
  });

  it("should return number value", () => {
    const m = new Map<number, unknown>([[0, 42]]);
    expect(getMapNumber(m, 0)).toBe(42);
  });

  it("should convert bigint to number", () => {
    const m = new Map<number, unknown>([[0, 100n]]);
    expect(getMapNumber(m, 0)).toBe(100);
  });

  it("should return undefined for non-numeric value", () => {
    const m = new Map<number, unknown>([[0, "string"]]);
    expect(getMapNumber(m, 0)).toBeUndefined();
  });
});

describe("getMapBigInt", () => {
  it("should return undefined for null map", () => {
    expect(getMapBigInt(null, 0)).toBeUndefined();
  });

  it("should return undefined for missing key", () => {
    const m = new Map<number, unknown>([[0, 42n]]);
    expect(getMapBigInt(m, 99)).toBeUndefined();
  });

  it("should return bigint value", () => {
    const m = new Map<number, unknown>([[0, 42n]]);
    expect(getMapBigInt(m, 0)).toBe(42n);
  });

  it("should convert number to bigint", () => {
    const m = new Map<number, unknown>([[0, 100]]);
    expect(getMapBigInt(m, 0)).toBe(100n);
  });

  it("should truncate float when converting to bigint", () => {
    const m = new Map<number, unknown>([[0, 3.14]]);
    expect(getMapBigInt(m, 0)).toBe(3n);
  });

  it("should return undefined for non-numeric value", () => {
    const m = new Map<number, unknown>([[0, "string"]]);
    expect(getMapBigInt(m, 0)).toBeUndefined();
  });
});

describe("getMapBool", () => {
  it("should return undefined for null map", () => {
    expect(getMapBool(null, 0)).toBeUndefined();
  });

  it("should return undefined for missing key", () => {
    const m = new Map<number, unknown>([[0, true]]);
    expect(getMapBool(m, 99)).toBeUndefined();
  });

  it("should return boolean value", () => {
    const m = new Map<number, unknown>([
      [0, true],
      [1, false],
    ]);
    expect(getMapBool(m, 0)).toBe(true);
    expect(getMapBool(m, 1)).toBe(false);
  });

  it("should return undefined for non-boolean value", () => {
    const m = new Map<number, unknown>([[0, 1]]);
    expect(getMapBool(m, 0)).toBeUndefined();
  });
});

describe("getMapBytes", () => {
  it("should return undefined for null map", () => {
    expect(getMapBytes(null, 0)).toBeUndefined();
  });

  it("should return undefined for missing key", () => {
    const m = new Map<number, unknown>([[0, new Uint8Array([1, 2, 3])]]);
    expect(getMapBytes(m, 99)).toBeUndefined();
  });

  it("should return Uint8Array value", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const m = new Map<number, unknown>([[0, bytes]]);
    expect(getMapBytes(m, 0)).toEqual(bytes);
  });

  it("should return undefined for non-bytes value", () => {
    const m = new Map<number, unknown>([[0, [1, 2, 3]]]);
    expect(getMapBytes(m, 0)).toBeUndefined();
  });
});
