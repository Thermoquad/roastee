// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import {
  ADDRESS_SIZE,
  DecoderState,
  END_BYTE,
  ESC_BYTE,
  ESC_XOR,
  MAX_PACKET_SIZE,
  MAX_PAYLOAD_SIZE,
  START_BYTE,
} from "./constants.js";
import { calculateCRC } from "./crc.js";
import { Packet } from "./packet.js";
import { DecodeError } from "./types.js";
import type { DecodeResult, IPacket } from "./types.js";

/**
 * Fusain protocol packet decoder state machine
 *
 * Processes a byte stream and emits complete packets.
 * Handles byte stuffing (escape sequences) and CRC validation.
 */
export class Decoder {
  private state: DecoderState = DecoderState.Idle;
  private buffer: Uint8Array = new Uint8Array(MAX_PACKET_SIZE);
  private bufferIndex: number = 0;
  private escapeNext: boolean = false;
  private addressBytes: number = 0;
  private rawBuffer: number[] = [];

  // Packet being assembled
  private packetLength: number = 0;
  private packetAddress: bigint = 0n;
  private packetPayload: number[] = [];
  private packetCRC: number = 0;

  /**
   * Reset the decoder state to idle
   */
  reset(): void {
    this.state = DecoderState.Idle;
    this.bufferIndex = 0;
    this.addressBytes = 0;
    this.escapeNext = false;
    this.packetLength = 0;
    this.packetAddress = 0n;
    this.packetPayload = [];
    this.packetCRC = 0;
    this.rawBuffer = [];
  }

  /**
   * Get the accumulated raw bytes since the last packet
   */
  getRawBytes(): Uint8Array {
    return new Uint8Array(this.rawBuffer);
  }

  /**
   * Process a single byte through the decoder state machine
   *
   * @param byte - Input byte
   * @returns Completed packet, or null if packet is incomplete
   * @throws DecodeError if decoding fails
   */
  decodeByte(byte: number): DecodeResult {
    // Always accumulate raw bytes for verification
    this.rawBuffer.push(byte);

    // Handle byte stuffing
    if (byte === ESC_BYTE && !this.escapeNext) {
      this.escapeNext = true;
      return null;
    }

    const originalByte = byte;
    if (this.escapeNext) {
      byte ^= ESC_XOR;
      this.escapeNext = false;
    }

    // Handle framing bytes (only if not escaped)
    if (originalByte === START_BYTE && !this.escapeNext) {
      this.reset();
      this.rawBuffer = [originalByte];
      this.state = DecoderState.Length;
      return null;
    }

    if (originalByte === END_BYTE && !this.escapeNext) {
      if (this.state === DecoderState.CRC2) {
        // Packet complete - validate CRC
        const crcData = this.buffer.slice(0, this.bufferIndex);
        const calculatedCRC = calculateCRC(crcData);

        if (this.packetCRC !== calculatedCRC) {
          const err = new DecodeError(
            `CRC mismatch: expected 0x${calculatedCRC.toString(16).padStart(4, "0").toUpperCase()}, got 0x${this.packetCRC.toString(16).padStart(4, "0").toUpperCase()}`,
            this.getRawBytes(),
          );
          this.reset();
          throw err;
        }

        const packet = new Packet(
          this.packetLength,
          this.packetAddress,
          new Uint8Array(this.packetPayload),
          this.packetCRC,
        );

        this.reset();
        return packet;
      }

      const err = new DecodeError(
        `unexpected END byte in state ${this.state}`,
        this.getRawBytes(),
      );
      this.reset();
      throw err;
    }

    // State machine
    switch (this.state) {
      case DecoderState.Idle:
        // Waiting for START byte - ignore other bytes
        return null;

      case DecoderState.Length:
        if (byte > MAX_PAYLOAD_SIZE) {
          const err = new DecodeError(
            `invalid length: ${byte} (max ${MAX_PAYLOAD_SIZE})`,
            this.getRawBytes(),
          );
          this.reset();
          throw err;
        }
        // Check for buffer overflow
        if (this.bufferIndex >= MAX_PACKET_SIZE) {
          const err = new DecodeError(
            "buffer overflow at length byte",
            this.getRawBytes(),
          );
          this.reset();
          throw err;
        }
        this.packetLength = byte;
        this.buffer[this.bufferIndex++] = byte;
        this.addressBytes = 0;
        this.state = DecoderState.Address;
        return null;

      case DecoderState.Address:
        // Check for buffer overflow
        if (this.bufferIndex >= MAX_PACKET_SIZE) {
          const err = new DecodeError(
            "buffer overflow at address byte",
            this.getRawBytes(),
          );
          this.reset();
          throw err;
        }
        // Accumulate address bytes (little-endian)
        this.packetAddress |= BigInt(byte) << BigInt(this.addressBytes * 8);
        this.buffer[this.bufferIndex++] = byte;
        this.addressBytes++;
        if (this.addressBytes >= ADDRESS_SIZE) {
          // Go directly to PAYLOAD (no separate TYPE byte)
          if (this.packetLength === 0) {
            this.state = DecoderState.CRC1;
          } else {
            this.state = DecoderState.Payload;
          }
        }
        return null;

      case DecoderState.Payload:
        // Check for buffer overflow before accepting byte
        if (this.bufferIndex >= MAX_PACKET_SIZE) {
          const err = new DecodeError(
            "buffer overflow: packet exceeds max size",
            this.getRawBytes(),
          );
          this.reset();
          throw err;
        }
        this.packetPayload.push(byte);
        this.buffer[this.bufferIndex++] = byte;
        if (this.packetPayload.length >= this.packetLength) {
          this.state = DecoderState.CRC1;
        }
        return null;

      case DecoderState.CRC1:
        this.packetCRC = byte << 8;
        this.state = DecoderState.CRC2;
        return null;

      case DecoderState.CRC2:
        this.packetCRC |= byte;
        // Wait for END byte
        return null;

      default: {
        // Defensive: handle impossible states for runtime safety
        const err = new DecodeError(
          `invalid state: ${this.state}`,
          this.getRawBytes(),
        );
        this.reset();
        throw err;
      }
    }
  }

  /**
   * Process multiple bytes through the decoder
   *
   * @param bytes - Input bytes
   * @returns Array of completed packets
   * @throws DecodeError if decoding fails
   */
  decodeBytes(bytes: Uint8Array): IPacket[] {
    const packets: IPacket[] = [];
    for (const byte of bytes) {
      const packet = this.decodeByte(byte);
      if (packet) {
        packets.push(packet);
      }
    }
    return packets;
  }
}
