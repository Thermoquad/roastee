// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

/**
 * Minimal CBOR codec for Fusain protocol
 *
 * Supports only the CBOR subset required by Fusain:
 * - Positive integers (major type 0)
 * - Negative integers (major type 1)
 * - Byte strings (major type 2)
 * - Arrays (major type 4)
 * - Maps with integer keys (major type 5)
 * - Simple values: false, true, null, undefined (major type 7)
 * - Floats: half, single, double precision (major type 7)
 *
 * NOT supported: text strings (major type 3), tags (major type 6),
 * indefinite-length items
 */

import { CBORParseError } from "./types.js";

// ============================================================================
// Constants
// ============================================================================

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

// ============================================================================
// Decoder State
// ============================================================================

// Module-level decode state to avoid closure recreation
let decodeData: Uint8Array;
let decodeOffset: number;
let decodeView: DataView;

// ============================================================================
// Decoder - Module Level Functions
// ============================================================================

function decodeReadArg(info: number): number | bigint {
  if (info < 24) return info;
  if (info === 24) {
    if (decodeOffset >= decodeData.length)
      throw new CBORParseError("unexpected end of input");
    return decodeData[decodeOffset++]!;
  }
  if (info === 25) {
    if (decodeOffset + 2 > decodeData.length)
      throw new CBORParseError("unexpected end of input");
    const val = decodeView.getUint16(decodeOffset, false);
    decodeOffset += 2;
    return val;
  }
  if (info === 26) {
    if (decodeOffset + 4 > decodeData.length)
      throw new CBORParseError("unexpected end of input");
    const val = decodeView.getUint32(decodeOffset, false);
    decodeOffset += 4;
    return val;
  }
  if (info === 27) {
    if (decodeOffset + 8 > decodeData.length)
      throw new CBORParseError("unexpected end of input");
    const val = decodeView.getBigUint64(decodeOffset, false);
    decodeOffset += 8;
    return val;
  }
  throw new CBORParseError(`unsupported argument info: ${info}`);
}

function decodeReadBytes(len: number | bigint): Uint8Array {
  const length = typeof len === "bigint" ? Number(len) : len;
  if (decodeOffset + length > decodeData.length) {
    throw new CBORParseError("unexpected end of input");
  }
  const bytes = decodeData.slice(decodeOffset, decodeOffset + length);
  decodeOffset += length;
  return bytes;
}

function decodeReadFloat16(): number {
  if (decodeOffset + 2 > decodeData.length)
    throw new CBORParseError("unexpected end of input");
  const half = decodeView.getUint16(decodeOffset, false);
  decodeOffset += 2;

  const exp = (half >> 10) & 0x1f;
  const mant = half & 0x3ff;
  const sign = half & 0x8000 ? -1 : 1;

  if (exp === 0) {
    return sign * (mant / 1024) * Math.pow(2, -14);
  } else if (exp === 31) {
    return mant === 0 ? sign * Infinity : NaN;
  }
  return sign * Math.pow(2, exp - 15) * (1 + mant / 1024);
}

function decodeReadFloat32(): number {
  if (decodeOffset + 4 > decodeData.length)
    throw new CBORParseError("unexpected end of input");
  const val = decodeView.getFloat32(decodeOffset, false);
  decodeOffset += 4;
  return val;
}

function decodeReadFloat64(): number {
  if (decodeOffset + 8 > decodeData.length)
    throw new CBORParseError("unexpected end of input");
  const val = decodeView.getFloat64(decodeOffset, false);
  decodeOffset += 8;
  return val;
}

function decodeRead(): unknown {
  if (decodeOffset >= decodeData.length) {
    throw new CBORParseError("unexpected end of input");
  }

  const byte = decodeData[decodeOffset++]!;
  const major = byte >> 5;
  const info = byte & 0x1f;

  switch (major) {
    case 0: {
      const arg = decodeReadArg(info);
      if (typeof arg === "bigint") {
        return arg <= MAX_SAFE_BIGINT ? Number(arg) : arg;
      }
      return arg;
    }

    case 1: {
      const arg = decodeReadArg(info);
      if (typeof arg === "bigint") {
        const neg = -1n - arg;
        return neg >= MIN_SAFE_BIGINT ? Number(neg) : neg;
      }
      return -1 - arg;
    }

    case 2: {
      if (info === 31) {
        throw new CBORParseError(
          "indefinite-length byte strings not supported",
        );
      }
      return decodeReadBytes(decodeReadArg(info));
    }

    case 3:
      throw new CBORParseError("text strings not supported");

    case 4: {
      if (info === 31) {
        throw new CBORParseError("indefinite-length arrays not supported");
      }
      const len = decodeReadArg(info);
      const count = typeof len === "bigint" ? Number(len) : len;
      const arr: unknown[] = new Array(count);
      for (let i = 0; i < count; i++) {
        arr[i] = decodeRead();
      }
      return arr;
    }

    case 5: {
      if (info === 31) {
        throw new CBORParseError("indefinite-length maps not supported");
      }
      const len = decodeReadArg(info);
      const count = typeof len === "bigint" ? Number(len) : len;
      const map = new Map<number, unknown>();
      for (let i = 0; i < count; i++) {
        const key = decodeRead();
        const val = decodeRead();
        if (typeof key === "number") {
          map.set(key, val);
        } else if (typeof key === "bigint") {
          map.set(Number(key), val);
        } else {
          throw new CBORParseError(`unsupported map key type: ${typeof key}`);
        }
      }
      return map;
    }

    case 7: {
      if (info === 20) return false;
      if (info === 21) return true;
      if (info === 22) return null;
      if (info === 23) return undefined;
      if (info === 25) return decodeReadFloat16();
      if (info === 26) return decodeReadFloat32();
      if (info === 27) return decodeReadFloat64();
      throw new CBORParseError(
        `CBOR decode error: unsupported simple value ${info}`,
      );
    }

    default:
      throw new CBORParseError(`unsupported major type: ${major}`);
  }
}

/**
 * Decode CBOR bytes to a JavaScript value
 */
export function decodeCBOR(data: Uint8Array): unknown {
  decodeData = data;
  decodeOffset = 0;
  decodeView = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const result = decodeRead();

  if (decodeOffset !== data.length) {
    throw new CBORParseError(`trailing bytes: ${data.length - decodeOffset}`);
  }

  return result;
}

// ============================================================================
// Encoder State
// ============================================================================

// Pooled buffer for encoder output - reused across calls
const INITIAL_BUFFER_SIZE = 256;
let encodeBuffer: Uint8Array = new Uint8Array(INITIAL_BUFFER_SIZE);
let encodeView: DataView = new DataView(encodeBuffer.buffer);
let encodeOffset: number = 0;

function encodeEnsureCapacity(needed: number): void {
  const required = encodeOffset + needed;
  if (required <= encodeBuffer.length) return;

  // Double buffer size until it fits
  let newSize = encodeBuffer.length * 2;
  while (newSize < required) newSize *= 2;

  const newBuffer = new Uint8Array(newSize);
  newBuffer.set(encodeBuffer.subarray(0, encodeOffset));
  encodeBuffer = newBuffer;
  encodeView = new DataView(encodeBuffer.buffer);
}

// ============================================================================
// Encoder - Module Level Functions
// ============================================================================

function encodeWriteHeader(major: number, arg: number | bigint): void {
  const majorBits = major << 5;

  if (typeof arg === "bigint") {
    if (arg <= 23n) {
      encodeEnsureCapacity(1);
      encodeBuffer[encodeOffset++] = majorBits | Number(arg);
    } else if (arg <= 0xffn) {
      encodeEnsureCapacity(2);
      encodeBuffer[encodeOffset++] = majorBits | 24;
      encodeBuffer[encodeOffset++] = Number(arg);
    } else if (arg <= 0xffffn) {
      encodeEnsureCapacity(3);
      encodeBuffer[encodeOffset++] = majorBits | 25;
      encodeView.setUint16(encodeOffset, Number(arg), false);
      encodeOffset += 2;
    } else if (arg <= 0xffffffffn) {
      encodeEnsureCapacity(5);
      encodeBuffer[encodeOffset++] = majorBits | 26;
      encodeView.setUint32(encodeOffset, Number(arg), false);
      encodeOffset += 4;
    } else {
      encodeEnsureCapacity(9);
      encodeBuffer[encodeOffset++] = majorBits | 27;
      encodeView.setBigUint64(encodeOffset, arg, false);
      encodeOffset += 8;
    }
  } else {
    if (arg <= 23) {
      encodeEnsureCapacity(1);
      encodeBuffer[encodeOffset++] = majorBits | arg;
    } else if (arg <= 0xff) {
      encodeEnsureCapacity(2);
      encodeBuffer[encodeOffset++] = majorBits | 24;
      encodeBuffer[encodeOffset++] = arg;
    } else if (arg <= 0xffff) {
      encodeEnsureCapacity(3);
      encodeBuffer[encodeOffset++] = majorBits | 25;
      encodeView.setUint16(encodeOffset, arg, false);
      encodeOffset += 2;
    } else if (arg <= 0xffffffff) {
      encodeEnsureCapacity(5);
      encodeBuffer[encodeOffset++] = majorBits | 26;
      encodeView.setUint32(encodeOffset, arg, false);
      encodeOffset += 4;
    } else {
      encodeWriteHeader(major, BigInt(arg));
    }
  }
}

function encodeWriteFloat(val: number): void {
  encodeEnsureCapacity(5);
  encodeBuffer[encodeOffset++] = 0xfa; // float32
  encodeView.setFloat32(encodeOffset, val, false);
  encodeOffset += 4;
}

function encodeWrite(val: unknown): void {
  if (val === null) {
    encodeEnsureCapacity(1);
    encodeBuffer[encodeOffset++] = 0xf6;
  } else if (val === undefined) {
    encodeEnsureCapacity(1);
    encodeBuffer[encodeOffset++] = 0xf7;
  } else if (val === true) {
    encodeEnsureCapacity(1);
    encodeBuffer[encodeOffset++] = 0xf5;
  } else if (val === false) {
    encodeEnsureCapacity(1);
    encodeBuffer[encodeOffset++] = 0xf4;
  } else if (typeof val === "number") {
    if (Number.isInteger(val)) {
      if (val >= 0) {
        encodeWriteHeader(0, val);
      } else {
        encodeWriteHeader(1, -1 - val);
      }
    } else {
      encodeWriteFloat(val);
    }
  } else if (typeof val === "bigint") {
    if (val >= 0n) {
      encodeWriteHeader(0, val);
    } else {
      encodeWriteHeader(1, -1n - val);
    }
  } else if (val instanceof Uint8Array) {
    encodeWriteHeader(2, val.length);
    encodeEnsureCapacity(val.length);
    encodeBuffer.set(val, encodeOffset);
    encodeOffset += val.length;
  } else if (Array.isArray(val)) {
    encodeWriteHeader(4, val.length);
    for (let i = 0; i < val.length; i++) {
      encodeWrite(val[i]);
    }
  } else if (val instanceof Map) {
    encodeWriteHeader(5, val.size);
    for (const [k, v] of val) {
      encodeWrite(k);
      encodeWrite(v);
    }
  } else if (typeof val === "string") {
    throw new CBORParseError("text strings not supported");
  } else if (typeof val === "object") {
    const keys = Object.keys(val as object);
    encodeWriteHeader(5, keys.length);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]!;
      const numKey = parseInt(k, 10);
      if (isNaN(numKey) || String(numKey) !== k) {
        throw new CBORParseError(`non-integer map key not supported: ${k}`);
      }
      encodeWrite(numKey);
      encodeWrite((val as Record<string, unknown>)[k]);
    }
  } else {
    throw new CBORParseError(
      `CBOR encode error: unsupported type ${typeof val}`,
    );
  }
}

/**
 * Encode a JavaScript value to CBOR bytes
 */
export function encodeCBOR(value: unknown): Uint8Array {
  encodeOffset = 0;
  encodeWrite(value);
  return encodeBuffer.slice(0, encodeOffset);
}
