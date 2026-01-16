# Fusain (TypeScript) - AI Assistant Guide

> **Note:** This file documents the TypeScript Fusain reference implementation specifically.
> Always read the [Thermoquad Organization CLAUDE.md](../../../../CLAUDE.md) first
> for organization-wide structure and conventions.

## Overview

**Fusain (TypeScript)** is the canonical TypeScript/JavaScript reference implementation of the Fusain protocol. It provides a complete, production-ready implementation for encoding, decoding, and validating Fusain protocol packets with CBOR payloads.

**Package:** `fusain` (npm)

**Purpose:**
- Reference TypeScript implementation for web browsers and Node.js
- Protocol encoder/decoder library for web applications
- PWA and Node.js server integration

**Protocol Specification:** `origin/documentation/source/specifications/fusain/` (Sphinx docs)

**License:** Apache-2.0 (matches C and Go implementations)

**Status:** Not yet published to npm

---

## Key Features

- ✅ Complete Fusain protocol implementation (CBOR payloads)
- ✅ State machine decoder with byte unstuffing
- ✅ Packet encoder with byte stuffing
- ✅ CRC-16-CCITT validation
- ✅ Minimal CBOR codec (protocol subset only)
- ✅ Full TypeScript type safety
- ✅ Zero runtime dependencies
- ✅ ES modules (import/export)
- ✅ Browser and Node.js compatible
- ✅ 100% test coverage (enforced)

---

## Architecture

### Package Structure

```
packages/fusain/
├── package.json             # npm package configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Vitest test configuration
├── CLAUDE.md                # This file
├── README.md                # User documentation
├── LICENSE                  # Apache-2.0 license
└── src/
    ├── index.ts             # Public exports
    ├── constants.ts         # Protocol constants (message types, framing bytes)
    ├── types.ts             # TypeScript types and error classes
    ├── crc.ts               # CRC-16-CCITT implementation
    ├── cbor.ts              # CBOR parsing helpers
    ├── cbor-codec.ts        # Minimal CBOR codec (protocol subset)
    ├── packet.ts            # Packet class with lazy CBOR parsing
    ├── decoder.ts           # State machine decoder
    ├── encoder.ts           # Packet encoder
    └── *.test.ts            # Unit tests (100% coverage)
```

### Dependencies

**Runtime:** None (zero dependencies)

**Development:**
- TypeScript 5.8.0+
- Vitest 3.2.4+ (testing)
- Node.js 22.0.0+ (development)

**Browser Support:** Modern browsers with ES2020+ support

---

## Installation

**Not yet published to npm.** When published:

```bash
npm install fusain
# or
pnpm add fusain
# or
yarn add fusain
```

**TypeScript types are included** - no separate `@types` package needed.

---

## API Reference

### Core Classes

#### Packet

Represents a complete Fusain protocol packet with lazy CBOR parsing.

**Constructor:**
```typescript
class Packet {
  constructor(
    address: bigint,
    msgType: number,
    payloadMap: Map<number, unknown>,
    timestamp?: Date
  )
}
```

**Properties:**
- `address: bigint` - Device address (64-bit)
- `msgType: number` - Message type byte
- `payloadMap: Map<number, unknown>` - CBOR payload map with integer keys
- `timestamp: Date` - Packet receive timestamp

**Methods:**
- `isBroadcast(): boolean` - Check if address is broadcast (0n)
- `isStateless(): boolean` - Check if address is stateless (0xFFFFFFFFFFFFFFFFn)

#### Decoder

State machine for decoding byte streams into Fusain packets.

**Constructor:**
```typescript
class Decoder {
  constructor()
}
```

**Methods:**
- `decodeByte(byte: number): Packet | null` - Process single byte, returns packet when complete
- `reset(): void` - Reset decoder to idle state

**State Machine:**
1. Idle - Waiting for `START_BYTE (0x7E)`
2. Length - Read CBOR payload length
3. Address - Read 8-byte address (little-endian)
4. Payload - Read CBOR payload bytes
5. CRC1 - Read CRC high byte
6. CRC2 - Read CRC low byte
7. Validate CRC and return to idle on `END_BYTE (0x7F)`

**Byte Unstuffing:** Handles escape sequences (`ESC_BYTE 0x7D` + `ESC_XOR 0x20`)

**Errors:**
- Throws `CRCError` on CRC mismatch
- Throws `DecodeError` on invalid packet structure
- Throws `CBORParseError` on CBOR parsing failure

---

### Encoding Functions

#### encodePacket

Creates a complete wire-formatted Fusain packet ready for transmission.

```typescript
function encodePacket(
  address: bigint,
  msgType: number,
  payloadMap: Map<number, unknown>
): Uint8Array
```

**Process:**
1. Encode CBOR payload: `[msgType, payloadMap]`
2. Build data section: `length + address + CBOR payload`
3. Calculate CRC over data section
4. Apply byte stuffing to data + CRC
5. Add framing bytes: `START_BYTE + stuffed data + END_BYTE`

**Returns:** `Uint8Array` with complete packet bytes

**Throws:** `CBOREncodeError` if payload cannot be encoded

---

### CBOR Codec

#### encodeCBOR

```typescript
function encodeCBOR(value: unknown): Uint8Array
```

Encodes JavaScript values to CBOR format (protocol subset only).

**Supported Types:**
- `number` - Positive/negative integers, floats (half/single/double precision)
- `bigint` - Large integers
- `boolean` - true, false
- `null` - CBOR null
- `undefined` - CBOR undefined
- `Uint8Array` - Byte strings
- `Array` - CBOR arrays
- `Map<number, unknown>` - CBOR maps with integer keys

**Not Supported:** Text strings (use Uint8Array), tags, indefinite-length items

#### decodeCBOR

```typescript
function decodeCBOR(bytes: Uint8Array): unknown
```

Decodes CBOR bytes to JavaScript values.

**Returns:** Decoded value matching the types listed above

**Throws:** `CBORParseError` if bytes are invalid CBOR

---

### CRC Functions

#### calculateCRC

```typescript
function calculateCRC(data: Uint8Array): number
```

**Algorithm:** CRC-16-CCITT
- Polynomial: 0x1021
- Initial value: 0xFFFF
- Returns 16-bit CRC value

---

### Constants

Protocol-level constants defined in `constants.ts`:

**Framing:**
```typescript
export const START_BYTE = 0x7E;
export const END_BYTE = 0x7F;
export const ESC_BYTE = 0x7D;
export const ESC_XOR = 0x20;
```

**Size Limits:**
```typescript
export const MAX_PACKET_SIZE = 128;
export const MAX_PAYLOAD_SIZE = 114;
export const ADDRESS_SIZE = 8;
```

**Special Addresses:**
```typescript
export const ADDRESS_BROADCAST = 0n;
export const ADDRESS_STATELESS = 0xFFFFFFFFFFFFFFFFn;
```

**Message Types:**
- Configuration: `0x10-0x1F` (MSG_MOTOR_CONFIG, MSG_PUMP_CONFIG, etc.)
- Commands: `0x20-0x2F` (MSG_STATE_COMMAND, MSG_MOTOR_COMMAND, MSG_PING_REQUEST, etc.)
- Telemetry: `0x30-0x3F` (MSG_STATE_DATA, MSG_MOTOR_DATA, MSG_TEMP_DATA, etc.)
- Errors: `0xE0-0xEF` (MSG_ERROR_INVALID_CMD, MSG_ERROR_STATE_REJECT)

---

### Types

#### FusainError

Base error class for all Fusain errors.

```typescript
class FusainError extends Error {
  constructor(message: string)
}
```

#### CRCError

Thrown when CRC validation fails.

```typescript
class CRCError extends FusainError {
  expected: number;
  actual: number;
}
```

#### DecodeError

Thrown when packet structure is invalid.

```typescript
class DecodeError extends FusainError {
  constructor(message: string)
}
```

#### CBORParseError

Thrown when CBOR parsing fails.

```typescript
class CBORParseError extends FusainError {
  offset: number;  // Byte offset where parsing failed
}
```

#### CBOREncodeError

Thrown when CBOR encoding fails.

```typescript
class CBOREncodeError extends FusainError {
  value: unknown;  // Value that failed to encode
}
```

---

## Usage Examples

### Decoding Packets (Browser/Node.js)

```typescript
import { Decoder } from 'fusain';

// Create decoder
const decoder = new Decoder();

// Process byte stream
for (const byte of bytes) {
  try {
    const packet = decoder.decodeByte(byte);

    if (packet) {
      // Packet complete
      console.log('Received:', packet.msgType);
      console.log('Address:', packet.address);
      console.log('Payload:', packet.payloadMap);
    }
  } catch (error) {
    if (error instanceof CRCError) {
      console.error('CRC mismatch:', error.message);
    } else if (error instanceof DecodeError) {
      console.error('Decode error:', error.message);
    }
  }
}
```

### Encoding Packets

```typescript
import { encodePacket, MSG_PING_REQUEST, ADDRESS_BROADCAST } from 'fusain';

// Create ping request packet
const packet = encodePacket(
  ADDRESS_BROADCAST,
  MSG_PING_REQUEST,
  new Map() // Empty payload for ping
);

// Send over serial/WebSocket
await port.write(packet);
```

### Web Serial API Integration

```typescript
import { Decoder } from 'fusain';

// Request serial port
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 115200 });

const decoder = new Decoder();
const reader = port.readable.getReader();

try {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    for (const byte of value) {
      const packet = decoder.decodeByte(byte);
      if (packet) {
        console.log('Packet received:', packet);
      }
    }
  }
} finally {
  reader.releaseLock();
}
```

### WebSocket Integration

```typescript
import { Decoder, encodePacket } from 'fusain';

const ws = new WebSocket('ws://thermoquad-1234.local/fusain');
const decoder = new Decoder();

ws.binaryType = 'arraybuffer';

ws.onmessage = (event) => {
  const bytes = new Uint8Array(event.data);

  for (const byte of bytes) {
    const packet = decoder.decodeByte(byte);
    if (packet) {
      handlePacket(packet);
    }
  }
};

// Send command
function sendCommand(address: bigint, msgType: number, payload: Map<number, unknown>) {
  const packet = encodePacket(address, msgType, payload);
  ws.send(packet);
}
```

---

## Building & Testing

### Development Commands

```bash
# Install dependencies
pnpm install

# Build TypeScript to JavaScript
pnpm build

# Run tests
pnpm test

# Run tests with coverage (100% required)
pnpm test:coverage

# Watch mode
pnpm test:watch

# Linting
pnpm lint

# Format code
pnpm format

# Format check
pnpm format:check
```

### Coverage Requirements

**Test coverage must be 100%** for all source files. Coverage is enforced in `vitest.config.ts`:

```typescript
thresholds: {
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100,
}
```

### TypeScript Configuration

- **Target:** ES2020
- **Module:** ES2020 (ES modules)
- **Strict mode:** Enabled
- **Output:** `dist/` directory with `.d.ts` type definitions

---

## Relationship to Other Implementations

### Fusain Protocol Specification

**Location:** `origin/documentation/source/specifications/fusain/`

**Relationship:** This TypeScript implementation follows the canonical specification. All three implementations (C, Go, TypeScript) must match the specification.

### Fusain C Library

**Location:** `modules/lib/fusain/`

**Relationship:** Embedded C implementation for Zephyr RTOS (Helios, Slate firmware).

**Shared Concepts:**
- Protocol constants (message types, framing bytes)
- CRC-16-CCITT algorithm
- Byte stuffing/unstuffing
- CBOR payload format with integer keys

**Differences:**
- C: Embedded systems, uses zcbor, memory-constrained
- TypeScript: Web/Node.js, zero dependencies, modern JavaScript

### Fusain Go Library

**Location:** `tools/heliostat/pkg/fusain/`

**Relationship:** Reference Go implementation for desktop tools.

**Shared Concepts:**
- Identical protocol implementation
- Similar API design
- Same validation rules

**Differences:**
- Go: Server tools, uses fxamacker/cbor
- TypeScript: Web browsers, custom minimal CBOR codec

---

## Development Conventions

### Code Style

- ESLint for linting
- Prettier for formatting
- Strict TypeScript (`strict: true`)
- 100% test coverage required

### Naming

- `camelCase` for functions and variables
- `PascalCase` for types and classes
- `UPPER_SNAKE_CASE` for constants

### Testing

- Vitest test framework
- Tests in `*.test.ts` files alongside source
- `describe`/`it` blocks
- Coverage enforced in CI

### File Headers

All source files must include SPDX header:

```typescript
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad
```

---

## Git Workflow

Follow the organization git workflow in `../../../../CLAUDE.md`.

**Commit Scopes:**
- `fusain` - TypeScript Fusain package changes
- `roastee` - Monorepo changes

**Important:** Changes to `packages/fusain/` should be reviewed carefully as this is the reference TypeScript implementation.

---

## AI Assistant Operations

### Content Integrity Check

To verify consistency across all CLAUDE.md files in the organization, see the **Content Integrity Check** section in the [Thermoquad Organization CLAUDE.md](../../../../CLAUDE.md).

**How to Request:** Ask the AI assistant to "run a content integrity check on all CLAUDE.md files"

### Content Status Integrity Check

To validate that this CLAUDE.md accurately reflects the actual TypeScript Fusain implementation, see the **Content Status Integrity Check** section in the [Thermoquad Organization CLAUDE.md](../../../../CLAUDE.md).

**How to Request:** Ask the AI assistant to "run a content status integrity check on ts fusain"

**What Gets Checked for TypeScript Fusain:**
- File count matches documentation (9 .ts source files)
- All documented exports exist in src/index.ts
- Test coverage actually meets 100% requirement
- Build succeeds with `pnpm build`
- Tests pass with `pnpm test`
- npm publication status (currently not published, should match docs)
- package.json dependencies match documented versions (zero runtime deps)
- TypeScript configuration matches documented settings

### CLAUDE.md Reload

To reload all organization CLAUDE.md files, see the **CLAUDE.md Reload** section in the [Thermoquad Organization CLAUDE.md](../../../../CLAUDE.md).

---

## Resources

### Protocol Specification

- **Fusain Specification:** https://thermoquad.github.io/origin/specifications/fusain/
- **CDDL Schema:** `origin/documentation/source/specifications/fusain/fusain.cddl`

### CBOR Resources

- **CBOR RFC 8949:** https://datatracker.ietf.org/doc/html/rfc8949
- **CBOR.io:** https://cbor.io/

### Web APIs

- **Web Serial API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
- **WebSocket API:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

**Last Updated:** 2026-01-15

**Maintainer:** Kaz Walker
