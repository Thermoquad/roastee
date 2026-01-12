// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

/**
 * Fusain Protocol Types
 */

/**
 * CBOR payload map with integer keys
 */
export type PayloadMap = Map<number, unknown>;

/**
 * Decoded Fusain packet
 */
export interface IPacket {
  /** CBOR payload length */
  readonly length: number;
  /** 64-bit device address */
  readonly address: bigint;
  /** Message type (parsed from CBOR) */
  readonly type: number;
  /** Raw CBOR payload bytes */
  readonly payload: Uint8Array;
  /** Decoded CBOR payload map (null for empty payloads) */
  readonly payloadMap: PayloadMap | null;
  /** Parse error if CBOR decoding failed */
  readonly parseError: Error | null;
  /** CRC value */
  readonly crc: number;
  /** Decode timestamp */
  readonly timestamp: Date;
  /** Whether packet is addressed to all devices */
  readonly isBroadcast: boolean;
  /** Whether packet uses the stateless address */
  readonly isStateless: boolean;
}

/**
 * Decoder result - either a packet or null (incomplete)
 */
export type DecodeResult = IPacket | null;

/**
 * Decoder error with context
 */
export class DecodeError extends Error {
  constructor(
    message: string,
    public readonly rawBytes?: Uint8Array,
  ) {
    super(message);
    this.name = "DecodeError";
  }
}

/**
 * CBOR parse error
 */
export class CBORParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CBORParseError";
  }
}
