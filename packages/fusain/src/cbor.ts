// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { decodeCBOR } from "./cbor-codec.js";
import { CBORParseError } from "./types.js";
import type { PayloadMap } from "./types.js";

/**
 * Parse a Fusain CBOR message: [msg_type, payload_map]
 *
 * @param data - Raw CBOR bytes
 * @returns Tuple of [messageType, payloadMap]
 * @throws CBORParseError if parsing fails
 */
export function parseCBORMessage(
  data: Uint8Array,
): [number, PayloadMap | null] {
  if (data.length === 0) {
    throw new CBORParseError("empty CBOR payload");
  }

  // decodeCBOR always throws CBORParseError on failure
  const msg = decodeCBOR(data);

  if (!Array.isArray(msg) || msg.length !== 2) {
    throw new CBORParseError(
      `expected 2-element array, got ${Array.isArray(msg) ? msg.length : typeof msg}`,
    );
  }

  const [rawType, rawPayload] = msg;

  // Extract message type
  if (typeof rawType !== "number" || !Number.isInteger(rawType)) {
    throw new CBORParseError(
      `expected integer for message type, got ${typeof rawType}`,
    );
  }
  if (rawType < 0 || rawType > 255) {
    throw new CBORParseError(`message type out of range: ${rawType}`);
  }
  const msgType = rawType;

  // Extract payload map (null for empty payloads)
  if (rawPayload === null || rawPayload === undefined) {
    return [msgType, null];
  }

  if (!(rawPayload instanceof Map)) {
    throw new CBORParseError(
      `expected map or null for payload, got ${typeof rawPayload}`,
    );
  }

  // Our codec only returns Map<number, unknown> - text strings throw during decoding
  // and bigint keys are converted to Number. The cast is safe.
  return [msgType, rawPayload as PayloadMap];
}

/**
 * Extract a number from a CBOR payload map
 */
export function getMapNumber(
  m: PayloadMap | null,
  key: number,
): number | undefined {
  if (!m) return undefined;
  const val = m.get(key);
  if (typeof val === "number") return val;
  if (typeof val === "bigint") return Number(val);
  return undefined;
}

/**
 * Extract a bigint from a CBOR payload map
 */
export function getMapBigInt(
  m: PayloadMap | null,
  key: number,
): bigint | undefined {
  if (!m) return undefined;
  const val = m.get(key);
  if (typeof val === "bigint") return val;
  if (typeof val === "number") return BigInt(Math.trunc(val));
  return undefined;
}

/**
 * Extract a boolean from a CBOR payload map
 */
export function getMapBool(
  m: PayloadMap | null,
  key: number,
): boolean | undefined {
  if (!m) return undefined;
  const val = m.get(key);
  if (typeof val === "boolean") return val;
  return undefined;
}

/**
 * Extract bytes from a CBOR payload map
 */
export function getMapBytes(
  m: PayloadMap | null,
  key: number,
): Uint8Array | undefined {
  if (!m) return undefined;
  const val = m.get(key);
  if (val instanceof Uint8Array) return val;
  return undefined;
}
