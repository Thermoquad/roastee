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
// Performance Constants
// ============================================================================

// Pre-computed BigInt bounds for safe integer conversion
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

// Pre-allocated single-byte arrays for common simple values
const CBOR_FALSE = new Uint8Array([0xf4]);
const CBOR_TRUE = new Uint8Array([0xf5]);
const CBOR_NULL = new Uint8Array([0xf6]);
const CBOR_UNDEFINED = new Uint8Array([0xf7]);

// Pre-allocated single-byte headers for small integers 0-23 (major type 0)
// Used heavily for map keys in Fusain messages
const SMALL_UINT = Array.from({ length: 24 }, (_, i) => new Uint8Array([i]));

// Pre-allocated headers for small arrays (0-23 elements, major type 4)
const SMALL_ARRAY = Array.from(
  { length: 24 },
  (_, i) => new Uint8Array([0x80 | i]),
);

// Pre-allocated headers for small maps (0-23 elements, major type 5)
const SMALL_MAP = Array.from(
  { length: 24 },
  (_, i) => new Uint8Array([0xa0 | i]),
);

// ============================================================================
// Decoder
// ============================================================================

/**
 * Decode CBOR bytes to a JavaScript value
 *
 * @param data - CBOR encoded bytes
 * @returns Decoded value
 * @throws CBORParseError on invalid CBOR
 */
export function decodeCBOR(data: Uint8Array): unknown {
  let offset = 0;

  function readArg(info: number): number | bigint {
    if (info < 24) return info;
    if (info === 24) {
      if (offset >= data.length)
        throw new CBORParseError("unexpected end of input");
      return data[offset++]!;
    }
    if (info === 25) {
      if (offset + 2 > data.length)
        throw new CBORParseError("unexpected end of input");
      const val = (data[offset]! << 8) | data[offset + 1]!;
      offset += 2;
      return val;
    }
    if (info === 26) {
      if (offset + 4 > data.length)
        throw new CBORParseError("unexpected end of input");
      const val =
        (data[offset]! << 24) |
        (data[offset + 1]! << 16) |
        (data[offset + 2]! << 8) |
        data[offset + 3]!;
      offset += 4;
      // Handle as unsigned
      return val >>> 0;
    }
    if (info === 27) {
      if (offset + 8 > data.length)
        throw new CBORParseError("unexpected end of input");
      // Use BigInt for 64-bit
      let val = 0n;
      for (let i = 0; i < 8; i++) {
        val = (val << 8n) | BigInt(data[offset + i]!);
      }
      offset += 8;
      return val;
    }
    throw new CBORParseError(`unsupported argument info: ${info}`);
  }

  function readBytes(len: number | bigint): Uint8Array {
    const length = typeof len === "bigint" ? Number(len) : len;
    if (offset + length > data.length) {
      throw new CBORParseError("unexpected end of input");
    }
    const bytes = data.slice(offset, offset + length);
    offset += length;
    return bytes;
  }

  function readFloat16(): number {
    if (offset + 2 > data.length)
      throw new CBORParseError("unexpected end of input");
    const half = (data[offset]! << 8) | data[offset + 1]!;
    offset += 2;

    const exp = (half >> 10) & 0x1f;
    const mant = half & 0x3ff;
    const sign = half & 0x8000 ? -1 : 1;

    if (exp === 0) {
      // Subnormal or zero
      return sign * (mant / 1024) * Math.pow(2, -14);
    } else if (exp === 31) {
      // Infinity or NaN
      return mant === 0 ? sign * Infinity : NaN;
    }
    // Normalized
    return sign * Math.pow(2, exp - 15) * (1 + mant / 1024);
  }

  function readFloat32(): number {
    if (offset + 4 > data.length)
      throw new CBORParseError("unexpected end of input");
    const view = new DataView(data.buffer, data.byteOffset + offset, 4);
    offset += 4;
    return view.getFloat32(0, false);
  }

  function readFloat64(): number {
    if (offset + 8 > data.length)
      throw new CBORParseError("unexpected end of input");
    const view = new DataView(data.buffer, data.byteOffset + offset, 8);
    offset += 8;
    return view.getFloat64(0, false);
  }

  function read(): unknown {
    if (offset >= data.length) {
      throw new CBORParseError("unexpected end of input");
    }

    const byte = data[offset++]!;
    const major = byte >> 5;
    const info = byte & 0x1f;

    switch (major) {
      case 0: {
        // Positive integer
        const arg = readArg(info);
        // Return as number if safe, bigint otherwise
        if (typeof arg === "bigint") {
          return arg <= MAX_SAFE_BIGINT ? Number(arg) : arg;
        }
        return arg;
      }

      case 1: {
        // Negative integer: -1 - n
        const arg = readArg(info);
        if (typeof arg === "bigint") {
          const neg = -1n - arg;
          return neg >= MIN_SAFE_BIGINT ? Number(neg) : neg;
        }
        return -1 - arg;
      }

      case 2: {
        // Byte string
        if (info === 31) {
          throw new CBORParseError(
            "indefinite-length byte strings not supported",
          );
        }
        const len = readArg(info);
        return readBytes(len);
      }

      case 3:
        // Text strings not supported in Fusain
        throw new CBORParseError("text strings not supported");

      case 4: {
        // Array
        if (info === 31) {
          throw new CBORParseError("indefinite-length arrays not supported");
        }
        const len = readArg(info);
        const count = typeof len === "bigint" ? Number(len) : len;
        const arr: unknown[] = [];
        for (let i = 0; i < count; i++) {
          arr.push(read());
        }
        return arr;
      }

      case 5: {
        // Map - return as Map<number, unknown> for integer keys
        if (info === 31) {
          throw new CBORParseError("indefinite-length maps not supported");
        }
        const len = readArg(info);
        const count = typeof len === "bigint" ? Number(len) : len;
        const map = new Map<number, unknown>();
        for (let i = 0; i < count; i++) {
          const key = read();
          const val = read();
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
        // Simple values and floats
        if (info === 20) return false;
        if (info === 21) return true;
        if (info === 22) return null;
        if (info === 23) return undefined;
        if (info === 25) return readFloat16();
        if (info === 26) return readFloat32();
        if (info === 27) return readFloat64();
        throw new CBORParseError(
          `CBOR decode error: unsupported simple value ${info}`,
        );
      }

      default:
        throw new CBORParseError(`unsupported major type: ${major}`);
    }
  }

  const result = read();

  // Ensure we consumed all bytes
  if (offset !== data.length) {
    throw new CBORParseError(`trailing bytes: ${data.length - offset}`);
  }

  return result;
}

// ============================================================================
// Encoder
// ============================================================================

/**
 * Encode a JavaScript value to CBOR bytes
 *
 * @param value - Value to encode
 * @returns CBOR encoded bytes
 * @throws Error on unsupported types
 */
export function encodeCBOR(value: unknown): Uint8Array {
  const chunks: Uint8Array[] = [];

  function writeHeader(major: number, arg: number | bigint): void {
    const majorBits = major << 5;

    if (typeof arg === "bigint") {
      if (arg <= 23n) {
        chunks.push(new Uint8Array([majorBits | Number(arg)]));
      } else if (arg <= 0xffn) {
        chunks.push(new Uint8Array([majorBits | 24, Number(arg)]));
      } else if (arg <= 0xffffn) {
        chunks.push(
          new Uint8Array([
            majorBits | 25,
            Number(arg >> 8n) & 0xff,
            Number(arg) & 0xff,
          ]),
        );
      } else if (arg <= 0xffffffffn) {
        chunks.push(
          new Uint8Array([
            majorBits | 26,
            Number(arg >> 24n) & 0xff,
            Number(arg >> 16n) & 0xff,
            Number(arg >> 8n) & 0xff,
            Number(arg) & 0xff,
          ]),
        );
      } else {
        const bytes = new Uint8Array(9);
        bytes[0] = majorBits | 27;
        for (let i = 0; i < 8; i++) {
          bytes[8 - i] = Number(arg & 0xffn);
          arg >>= 8n;
        }
        chunks.push(bytes);
      }
    } else {
      if (arg <= 23) {
        // Use pre-allocated arrays for small integers (major type 0 only)
        if (major === 0) {
          chunks.push(SMALL_UINT[arg]!);
        } else {
          chunks.push(new Uint8Array([majorBits | arg]));
        }
      } else if (arg <= 0xff) {
        chunks.push(new Uint8Array([majorBits | 24, arg]));
      } else if (arg <= 0xffff) {
        chunks.push(
          new Uint8Array([majorBits | 25, (arg >> 8) & 0xff, arg & 0xff]),
        );
      } else if (arg <= 0xffffffff) {
        chunks.push(
          new Uint8Array([
            majorBits | 26,
            (arg >> 24) & 0xff,
            (arg >> 16) & 0xff,
            (arg >> 8) & 0xff,
            arg & 0xff,
          ]),
        );
      } else {
        // Use BigInt for 64-bit
        writeHeader(major, BigInt(arg));
      }
    }
  }

  function writeFloat(val: number): void {
    // Use single precision (float32) for Fusain
    const bytes = new Uint8Array(5);
    bytes[0] = 0xfa; // Major 7, info 26 (float32)
    const view = new DataView(bytes.buffer, 1, 4);
    view.setFloat32(0, val, false);
    chunks.push(bytes);
  }

  function write(val: unknown): void {
    if (val === null) {
      chunks.push(CBOR_NULL);
    } else if (val === undefined) {
      chunks.push(CBOR_UNDEFINED);
    } else if (typeof val === "boolean") {
      chunks.push(val ? CBOR_TRUE : CBOR_FALSE);
    } else if (typeof val === "number") {
      if (Number.isInteger(val)) {
        if (val >= 0) {
          writeHeader(0, val);
        } else {
          writeHeader(1, -1 - val);
        }
      } else {
        writeFloat(val);
      }
    } else if (typeof val === "bigint") {
      if (val >= 0n) {
        writeHeader(0, val);
      } else {
        writeHeader(1, -1n - val);
      }
    } else if (val instanceof Uint8Array) {
      writeHeader(2, val.length);
      chunks.push(val);
    } else if (Array.isArray(val)) {
      // Use pre-allocated header for small arrays
      if (val.length < 24) {
        chunks.push(SMALL_ARRAY[val.length]!);
      } else {
        writeHeader(4, val.length);
      }
      for (const item of val) {
        write(item);
      }
    } else if (val instanceof Map) {
      // Use pre-allocated header for small maps
      if (val.size < 24) {
        chunks.push(SMALL_MAP[val.size]!);
      } else {
        writeHeader(5, val.size);
      }
      for (const [k, v] of val) {
        write(k);
        write(v);
      }
    } else if (typeof val === "string") {
      // Text strings not supported in Fusain
      throw new CBORParseError("text strings not supported");
    } else if (typeof val === "object") {
      const entries = Object.entries(val);
      // Use pre-allocated header for small maps
      if (entries.length < 24) {
        chunks.push(SMALL_MAP[entries.length]!);
      } else {
        writeHeader(5, entries.length);
      }
      for (const [k, v] of entries) {
        // Convert string keys to integers (Fusain uses integer keys only)
        const numKey = parseInt(k, 10);
        if (!isNaN(numKey) && String(numKey) === k) {
          write(numKey);
        } else {
          throw new CBORParseError(`non-integer map key not supported: ${k}`);
        }
        write(v);
      }
    } else {
      throw new CBORParseError(
        `CBOR encode error: unsupported type ${typeof val}`,
      );
    }
  }

  write(value);

  // Concatenate chunks
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
