// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { describe, it, expect } from "vitest";
import { encode } from "cbor-x";
import { Packet } from "./packet.js";
import {
  ADDRESS_BROADCAST,
  ADDRESS_STATELESS,
  MSG_PING_REQUEST,
  MSG_STATE_DATA,
  MSG_PING_RESPONSE,
  MSG_STATE_COMMAND,
  MSG_DISCOVERY_REQUEST,
} from "./constants.js";

// Helper to build CBOR payload
function buildCBORPayload(
  msgType: number,
  payload: Record<number, unknown> | null,
): Uint8Array {
  const msg = payload ? [msgType, payload] : [msgType, null];
  return encode(msg);
}

describe("Packet", () => {
  it("should create a packet with correct properties", () => {
    const cborPayload = buildCBORPayload(MSG_STATE_DATA, {
      0: false,
      1: 0,
      2: 1,
      3: 1000,
    });
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0x1234,
    );

    expect(packet.length).toBe(cborPayload.length);
    expect(packet.address).toBe(0x123456789abcdef0n);
    expect(packet.type).toBe(MSG_STATE_DATA);
    expect(packet.crc).toBe(0x1234);
  });

  it("should lazily parse CBOR payload", () => {
    const cborPayload = buildCBORPayload(MSG_PING_RESPONSE, { 0: 1000 });
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0x1234,
    );

    // Access type triggers parsing
    expect(packet.type).toBe(MSG_PING_RESPONSE);
    // PayloadMap should be available
    expect(packet.payloadMap?.get(0)).toBe(1000);
    expect(packet.parseError).toBeNull();
  });

  it("should return null payloadMap for empty payload", () => {
    const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0x1234,
    );

    expect(packet.type).toBe(MSG_PING_REQUEST);
    expect(packet.payloadMap).toBeNull();
    expect(packet.parseError).toBeNull();
  });

  it("should handle empty CBOR payload array", () => {
    const packet = new Packet(
      0,
      0x123456789abcdef0n,
      new Uint8Array(0),
      0x1234,
    );

    expect(packet.type).toBe(0);
    expect(packet.payloadMap).toBeNull();
    expect(packet.parseError).toBeNull();
  });

  it("should set parseError for invalid CBOR", () => {
    const invalidCBOR = new Uint8Array([0xff, 0xff, 0xff]);
    const packet = new Packet(
      invalidCBOR.length,
      0x123456789abcdef0n,
      invalidCBOR,
      0x1234,
    );

    expect(packet.type).toBe(0);
    expect(packet.parseError).not.toBeNull();
    expect(packet.parseError?.message).toContain("CBOR");
  });

  it("should return raw payload bytes", () => {
    const cborPayload = buildCBORPayload(MSG_STATE_DATA, { 0: 42 });
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0x1234,
    );

    expect(packet.payload).toEqual(cborPayload);
  });

  it("should set timestamp on creation", () => {
    const before = new Date();
    const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0x1234,
    );
    const after = new Date();

    expect(packet.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(packet.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should accept custom timestamp", () => {
    const customTime = new Date("2025-01-01T00:00:00Z");
    const cborPayload = buildCBORPayload(MSG_PING_REQUEST, null);
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0x1234,
      customTime,
    );

    expect(packet.timestamp).toBe(customTime);
  });

  it("should identify broadcast address", () => {
    const cborPayload = buildCBORPayload(MSG_STATE_COMMAND, { 0: 1 });
    const packet = new Packet(
      cborPayload.length,
      ADDRESS_BROADCAST,
      cborPayload,
      0,
    );

    expect(packet.isBroadcast).toBe(true);
    expect(packet.isStateless).toBe(false);
  });

  it("should identify non-broadcast address", () => {
    const cborPayload = buildCBORPayload(MSG_STATE_COMMAND, { 0: 1 });
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0,
    );

    expect(packet.isBroadcast).toBe(false);
  });

  it("should identify stateless address", () => {
    const cborPayload = buildCBORPayload(MSG_DISCOVERY_REQUEST, null);
    const packet = new Packet(
      cborPayload.length,
      ADDRESS_STATELESS,
      cborPayload,
      0,
    );

    expect(packet.isStateless).toBe(true);
    expect(packet.isBroadcast).toBe(false);
  });

  it("should identify non-stateless address", () => {
    const cborPayload = buildCBORPayload(MSG_DISCOVERY_REQUEST, null);
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0,
    );

    expect(packet.isStateless).toBe(false);
  });

  it("should cache parsed result", () => {
    const cborPayload = buildCBORPayload(MSG_STATE_DATA, { 0: 42 });
    const packet = new Packet(
      cborPayload.length,
      0x123456789abcdef0n,
      cborPayload,
      0x1234,
    );

    // First access
    const type1 = packet.type;
    const map1 = packet.payloadMap;

    // Second access should return same values
    const type2 = packet.type;
    const map2 = packet.payloadMap;

    expect(type1).toBe(type2);
    expect(map1).toBe(map2);
  });

  it("should handle CBOR parse error", () => {
    // Test CBOR parse errors are properly captured
    // Use 0x1c (reserved additional info value that errors immediately)
    const invalidCBOR = new Uint8Array([0x1c]);
    const packet = new Packet(
      invalidCBOR.length,
      0x123456789abcdef0n,
      invalidCBOR,
      0x1234,
    );

    // Should not throw, but set parseError
    expect(packet.parseError).not.toBeNull();
    expect(packet.parseError).toBeInstanceOf(Error);
  });
});
