// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { ADDRESS_BROADCAST, ADDRESS_STATELESS } from "./constants.js";
import { parseCBORMessage } from "./cbor.js";
import type { IPacket, PayloadMap } from "./types.js";

/**
 * Represents a decoded Fusain protocol packet
 */
export class Packet implements IPacket {
  private readonly _length: number;
  private readonly _address: bigint;
  private readonly _cborPayload: Uint8Array;
  private readonly _crc: number;
  private readonly _timestamp: Date;

  // Cached parsed values (lazy parsing)
  private _msgType: number = 0;
  private _payloadMap: PayloadMap | null = null;
  private _parsed: boolean = false;
  private _parseError: Error | null = null;

  constructor(
    length: number,
    address: bigint,
    cborPayload: Uint8Array,
    crc: number,
    timestamp?: Date,
  ) {
    this._length = length;
    this._address = address;
    this._cborPayload = cborPayload;
    this._crc = crc;
    this._timestamp = timestamp ?? new Date();
  }

  private ensureParsed(): void {
    if (this._parsed) return;
    this._parsed = true;

    if (this._cborPayload.length === 0) return;

    try {
      const [msgType, payloadMap] = parseCBORMessage(this._cborPayload);
      this._msgType = msgType;
      this._payloadMap = payloadMap;
    } catch (err) {
      // parseCBORMessage always throws CBORParseError
      this._parseError = err as Error;
    }
  }

  /** CBOR payload length */
  get length(): number {
    return this._length;
  }

  /** 64-bit device address */
  get address(): bigint {
    return this._address;
  }

  /** Message type (parsed from CBOR) */
  get type(): number {
    this.ensureParsed();
    return this._msgType;
  }

  /** Raw CBOR payload bytes */
  get payload(): Uint8Array {
    return this._cborPayload;
  }

  /** Decoded CBOR payload map (null for empty payloads) */
  get payloadMap(): PayloadMap | null {
    this.ensureParsed();
    return this._payloadMap;
  }

  /** Parse error if CBOR decoding failed */
  get parseError(): Error | null {
    this.ensureParsed();
    return this._parseError;
  }

  /** CRC value */
  get crc(): number {
    return this._crc;
  }

  /** Decode timestamp */
  get timestamp(): Date {
    return this._timestamp;
  }

  /** Whether packet is addressed to all devices */
  get isBroadcast(): boolean {
    return this._address === ADDRESS_BROADCAST;
  }

  /** Whether packet uses the stateless address */
  get isStateless(): boolean {
    return this._address === ADDRESS_STATELESS;
  }
}
