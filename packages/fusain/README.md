# fusain

TypeScript implementation of the Fusain protocol for Thermoquad.

## Installation

```bash
npm install fusain
```

## Supported Environments

The library is transport-agnostic and works in:

- **Server (Node.js):** TCP sockets, WebSocket servers
- **Browser:** WebSocket clients, Web Bluetooth

## Usage

### Decoding Packets

```typescript
import { Decoder, getMapNumber } from "fusain";

const decoder = new Decoder();

function onData(data: Uint8Array) {
  for (const byte of data) {
    try {
      const packet = decoder.decodeByte(byte);
      if (packet) {
        console.log(`Type: ${packet.type}`);
        console.log(`Address: ${packet.address.toString(16)}`);

        // Access payload fields
        const uptime = getMapNumber(packet.payloadMap, 0);
        console.log(`Uptime: ${uptime}`);
      }
    } catch (err) {
      console.error("Decode error:", err);
    }
  }
}
```

### Encoding Packets

```typescript
import { encodePacket, MSG_STATE_COMMAND, Mode } from "fusain";

const address = 0x123456789abcdef0n;
const payload = new Map<number, unknown>([
  [0, Mode.Heat], // mode
  [1, 100], // argument
]);

const bytes = encodePacket(address, MSG_STATE_COMMAND, payload);
// Send bytes via TCP, WebSocket, or Web Bluetooth
```

### Batch Decoding

```typescript
import { Decoder } from "fusain";

const decoder = new Decoder();
const packets = decoder.decodeBytes(data);

for (const packet of packets) {
  // Process packet
}
```

### Transport Examples

```typescript
// Node.js TCP socket
socket.on("data", (buffer: Buffer) => {
  const packets = decoder.decodeBytes(buffer);
});

// Browser WebSocket
ws.onmessage = (event) => {
  const packets = decoder.decodeBytes(new Uint8Array(event.data));
};

// Browser Web Bluetooth
characteristic.oncharacteristicvaluechanged = (event) => {
  const packets = decoder.decodeBytes(new Uint8Array(event.target.value.buffer));
};
```

## API

### Constants

- `START_BYTE`, `END_BYTE`, `ESC_BYTE`, `ESC_XOR` - Framing bytes
- `MAX_PACKET_SIZE`, `MAX_PAYLOAD_SIZE`, `ADDRESS_SIZE` - Size limits
- `ADDRESS_BROADCAST`, `ADDRESS_STATELESS` - Special addresses
- `MSG_*` - Message type constants
- `SysState`, `ErrorCode`, `Mode`, etc. - Enum values

### Classes

#### `Decoder`

State machine for decoding byte streams.

- `decodeByte(byte: number): IPacket | null` - Process single byte
- `decodeBytes(bytes: Uint8Array): Packet[]` - Process multiple bytes
- `reset(): void` - Reset decoder state
- `getRawBytes(): Uint8Array` - Get accumulated raw bytes

#### `Packet`

Decoded packet with lazy CBOR parsing.

- `length`, `address`, `type`, `payload`, `payloadMap`, `crc`, `timestamp`
- `isBroadcast`, `isStateless`
- `parseError` - Error if CBOR parsing failed

### Functions

- `encodePacket(address, msgType, payload?)` - Encode a packet
- `calculateCRC(data)` - Calculate CRC-16-CCITT
- `parseCBORMessage(data)` - Parse CBOR message
- `getMapNumber(map, key)` - Extract number from payload map
- `getMapBigInt(map, key)` - Extract bigint from payload map
- `getMapBool(map, key)` - Extract boolean from payload map
- `getMapBytes(map, key)` - Extract bytes from payload map

### Errors

- `DecodeError` - Thrown on decode failures (CRC mismatch, invalid data)
- `CBORParseError` - Thrown on CBOR parsing failures

## Thread Safety

The library is safe for typical single-threaded JavaScript usage. All encoding
and decoding functions are synchronous and use no shared mutable state.

**Patterns to avoid:**

1. **Sharing a `Decoder` instance between Web Workers** — Each `Decoder`
   maintains internal parsing state. Create a separate instance per worker.

2. **Using `SharedArrayBuffer` for input that may be modified during decoding**
   — The decoder reads from the input buffer without copying. If another thread
   modifies the buffer mid-decode, results are undefined.

**Recommended pattern:** One `Decoder` instance per connection or stream.

## Protocol Reference

See the Fusain Protocol Specification:
https://thermoquad.github.io/origin/specifications/fusain/

## Related Implementations

- **C (Embedded):** `modules/lib/fusain/`
- **Go (Heliostat):** `tools/heliostat/pkg/fusain/`

## License

Apache-2.0 — See [LICENSE.md](LICENSE.md)
