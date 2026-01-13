// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { describe, it, expect } from "vitest";
import { decodeCBOR, encodeCBOR } from "./cbor-codec.js";
import { CBORParseError } from "./types.js";

describe("decodeCBOR", () => {
  describe("positive integers", () => {
    it("should decode inline integers (0-23)", () => {
      expect(decodeCBOR(new Uint8Array([0x00]))).toBe(0);
      expect(decodeCBOR(new Uint8Array([0x17]))).toBe(23);
    });

    it("should decode 1-byte integers", () => {
      expect(decodeCBOR(new Uint8Array([0x18, 0x18]))).toBe(24);
      expect(decodeCBOR(new Uint8Array([0x18, 0xff]))).toBe(255);
    });

    it("should decode 2-byte integers", () => {
      expect(decodeCBOR(new Uint8Array([0x19, 0x01, 0x00]))).toBe(256);
      expect(decodeCBOR(new Uint8Array([0x19, 0xff, 0xff]))).toBe(65535);
    });

    it("should decode 4-byte integers", () => {
      expect(decodeCBOR(new Uint8Array([0x1a, 0x00, 0x01, 0x00, 0x00]))).toBe(
        65536,
      );
      expect(decodeCBOR(new Uint8Array([0x1a, 0xff, 0xff, 0xff, 0xff]))).toBe(
        4294967295,
      );
    });

    it("should decode 8-byte integers", () => {
      const result = decodeCBOR(
        new Uint8Array([0x1b, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]),
      );
      expect(result).toBe(4294967296);
    });

    it("should decode large 8-byte integers as bigint", () => {
      // Value larger than MAX_SAFE_INTEGER
      const result = decodeCBOR(
        new Uint8Array([0x1b, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
      );
      expect(typeof result).toBe("bigint");
    });
  });

  describe("negative integers", () => {
    it("should decode inline negative integers", () => {
      expect(decodeCBOR(new Uint8Array([0x20]))).toBe(-1);
      expect(decodeCBOR(new Uint8Array([0x37]))).toBe(-24);
    });

    it("should decode 1-byte negative integers", () => {
      expect(decodeCBOR(new Uint8Array([0x38, 0x18]))).toBe(-25);
      expect(decodeCBOR(new Uint8Array([0x38, 0xff]))).toBe(-256);
    });

    it("should decode 2-byte negative integers", () => {
      expect(decodeCBOR(new Uint8Array([0x39, 0x01, 0x00]))).toBe(-257);
    });

    it("should decode 4-byte negative integers", () => {
      expect(decodeCBOR(new Uint8Array([0x3a, 0x00, 0x01, 0x00, 0x00]))).toBe(
        -65537,
      );
    });

    it("should decode 8-byte negative integers", () => {
      const result = decodeCBOR(
        new Uint8Array([0x3b, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]),
      );
      expect(result).toBe(-4294967297);
    });

    it("should decode large negative integers as bigint", () => {
      // Very large negative value
      const result = decodeCBOR(
        new Uint8Array([0x3b, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
      );
      expect(typeof result).toBe("bigint");
    });
  });

  describe("byte strings", () => {
    it("should decode empty byte string", () => {
      const result = decodeCBOR(new Uint8Array([0x40]));
      expect(result).toEqual(new Uint8Array([]));
    });

    it("should decode byte string", () => {
      const result = decodeCBOR(new Uint8Array([0x43, 0x01, 0x02, 0x03]));
      expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
    });

    it("should decode byte string with 8-byte length", () => {
      // Byte string with 8-byte length header (length = 3)
      const result = decodeCBOR(
        new Uint8Array([
          0x5b, // byte string with 8-byte length
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x03, // length = 3
          0x01,
          0x02,
          0x03, // data
        ]),
      );
      expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
    });
  });

  describe("text strings", () => {
    it("should throw on text strings (not supported)", () => {
      expect(() => decodeCBOR(new Uint8Array([0x60]))).toThrow(CBORParseError);
      expect(() => decodeCBOR(new Uint8Array([0x60]))).toThrow(
        "text strings not supported",
      );
    });
  });

  describe("arrays", () => {
    it("should decode empty array", () => {
      expect(decodeCBOR(new Uint8Array([0x80]))).toEqual([]);
    });

    it("should decode array with items", () => {
      // [1, 2, 3]
      expect(decodeCBOR(new Uint8Array([0x83, 0x01, 0x02, 0x03]))).toEqual([
        1, 2, 3,
      ]);
    });

    it("should decode array with 8-byte length", () => {
      // Array with 8-byte length header (length = 2)
      const result = decodeCBOR(
        new Uint8Array([
          0x9b, // array with 8-byte length
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x02, // length = 2
          0x01,
          0x02, // items
        ]),
      );
      expect(result).toEqual([1, 2]);
    });
  });

  describe("maps", () => {
    it("should decode empty map", () => {
      const result = decodeCBOR(new Uint8Array([0xa0]));
      expect(result).toBeInstanceOf(Map);
      expect((result as Map<number, unknown>).size).toBe(0);
    });

    it("should decode map with integer keys", () => {
      // {1: 2}
      const result = decodeCBOR(new Uint8Array([0xa1, 0x01, 0x02]));
      expect((result as Map<number, unknown>).get(1)).toBe(2);
    });

    it("should decode map with bigint key", () => {
      // {large_number: 42} - key that exceeds MAX_SAFE_INTEGER so it's returned as bigint
      // 0x1b + 0x0020_0000_0000_0001 = 9007199254740993 > MAX_SAFE_INTEGER
      const result = decodeCBOR(
        new Uint8Array([
          0xa1, // map(1)
          0x1b,
          0x00,
          0x20,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x01, // uint64 key
          0x18,
          0x2a, // value 42
        ]),
      );
      // Key is converted to Number (may lose precision but tests the code path)
      expect((result as Map<number, unknown>).get(9007199254740992)).toBe(42);
    });

    it("should throw on unsupported map key type", () => {
      // Map with byte string key: {h'01': 42}
      expect(() =>
        decodeCBOR(new Uint8Array([0xa1, 0x41, 0x01, 0x18, 0x2a])),
      ).toThrow(CBORParseError);
    });

    it("should decode map with 8-byte length", () => {
      // Map with 8-byte length header (length = 1)
      const result = decodeCBOR(
        new Uint8Array([
          0xbb, // map with 8-byte length
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x01, // length = 1
          0x01,
          0x02, // key: 1, value: 2
        ]),
      );
      expect((result as Map<number, unknown>).get(1)).toBe(2);
    });
  });

  describe("simple values", () => {
    it("should decode false", () => {
      expect(decodeCBOR(new Uint8Array([0xf4]))).toBe(false);
    });

    it("should decode true", () => {
      expect(decodeCBOR(new Uint8Array([0xf5]))).toBe(true);
    });

    it("should decode null", () => {
      expect(decodeCBOR(new Uint8Array([0xf6]))).toBe(null);
    });

    it("should decode undefined", () => {
      expect(decodeCBOR(new Uint8Array([0xf7]))).toBe(undefined);
    });
  });

  describe("floats", () => {
    it("should decode float16 zero", () => {
      expect(decodeCBOR(new Uint8Array([0xf9, 0x00, 0x00]))).toBe(0);
    });

    it("should decode float16 one", () => {
      expect(decodeCBOR(new Uint8Array([0xf9, 0x3c, 0x00]))).toBe(1);
    });

    it("should decode float16 subnormal", () => {
      // Very small subnormal number
      const result = decodeCBOR(new Uint8Array([0xf9, 0x00, 0x01]));
      expect(result).toBeCloseTo(5.960464477539063e-8, 15);
    });

    it("should decode float16 infinity", () => {
      expect(decodeCBOR(new Uint8Array([0xf9, 0x7c, 0x00]))).toBe(Infinity);
    });

    it("should decode float16 negative infinity", () => {
      expect(decodeCBOR(new Uint8Array([0xf9, 0xfc, 0x00]))).toBe(-Infinity);
    });

    it("should decode float16 NaN", () => {
      expect(decodeCBOR(new Uint8Array([0xf9, 0x7e, 0x00]))).toBeNaN();
    });

    it("should decode float32", () => {
      // 3.14
      const result = decodeCBOR(new Uint8Array([0xfa, 0x40, 0x48, 0xf5, 0xc3]));
      expect(result).toBeCloseTo(3.14, 5);
    });

    it("should decode float64", () => {
      // 3.141592653589793
      const result = decodeCBOR(
        new Uint8Array([0xfb, 0x40, 0x09, 0x21, 0xfb, 0x54, 0x44, 0x2d, 0x18]),
      );
      expect(result).toBeCloseTo(3.141592653589793, 14);
    });
  });

  describe("error handling", () => {
    it("should throw on unexpected end of input", () => {
      expect(() => decodeCBOR(new Uint8Array([]))).toThrow(CBORParseError);
    });

    it("should throw on truncated 1-byte argument", () => {
      expect(() => decodeCBOR(new Uint8Array([0x18]))).toThrow(
        "unexpected end of input",
      );
    });

    it("should throw on truncated 2-byte argument", () => {
      expect(() => decodeCBOR(new Uint8Array([0x19, 0x01]))).toThrow(
        "unexpected end of input",
      );
    });

    it("should throw on truncated 4-byte argument", () => {
      expect(() => decodeCBOR(new Uint8Array([0x1a, 0x01, 0x02]))).toThrow(
        "unexpected end of input",
      );
    });

    it("should throw on truncated 8-byte argument", () => {
      expect(() =>
        decodeCBOR(new Uint8Array([0x1b, 0x01, 0x02, 0x03, 0x04])),
      ).toThrow("unexpected end of input");
    });

    it("should throw on truncated byte string", () => {
      expect(() => decodeCBOR(new Uint8Array([0x43, 0x01]))).toThrow(
        "unexpected end of input",
      );
    });

    it("should throw on truncated float16", () => {
      expect(() => decodeCBOR(new Uint8Array([0xf9, 0x00]))).toThrow(
        "unexpected end of input",
      );
    });

    it("should throw on truncated float32", () => {
      expect(() => decodeCBOR(new Uint8Array([0xfa, 0x00, 0x00]))).toThrow(
        "unexpected end of input",
      );
    });

    it("should throw on truncated float64", () => {
      expect(() =>
        decodeCBOR(new Uint8Array([0xfb, 0x00, 0x00, 0x00, 0x00])),
      ).toThrow("unexpected end of input");
    });

    it("should throw on unsupported argument info", () => {
      // 0x1c is reserved
      expect(() => decodeCBOR(new Uint8Array([0x1c]))).toThrow(
        "unsupported argument info",
      );
    });

    it("should throw on unsupported major type 6 (tags)", () => {
      expect(() => decodeCBOR(new Uint8Array([0xc0, 0x00]))).toThrow(
        "unsupported major type",
      );
    });

    it("should throw on indefinite-length byte strings", () => {
      // 0x5f = major type 2, info 31 (indefinite)
      expect(() => decodeCBOR(new Uint8Array([0x5f, 0xff]))).toThrow(
        "indefinite-length byte strings not supported",
      );
    });

    it("should throw on indefinite-length arrays", () => {
      // 0x9f = major type 4, info 31 (indefinite)
      expect(() => decodeCBOR(new Uint8Array([0x9f, 0xff]))).toThrow(
        "indefinite-length arrays not supported",
      );
    });

    it("should throw on indefinite-length maps", () => {
      // 0xbf = major type 5, info 31 (indefinite)
      expect(() => decodeCBOR(new Uint8Array([0xbf, 0xff]))).toThrow(
        "indefinite-length maps not supported",
      );
    });

    it("should throw on trailing bytes", () => {
      expect(() => decodeCBOR(new Uint8Array([0x00, 0x00]))).toThrow(
        "trailing bytes",
      );
    });
  });
});

describe("encodeCBOR", () => {
  describe("positive integers", () => {
    it("should encode inline integers", () => {
      expect(encodeCBOR(0)).toEqual(new Uint8Array([0x00]));
      expect(encodeCBOR(23)).toEqual(new Uint8Array([0x17]));
    });

    it("should encode 1-byte integers", () => {
      expect(encodeCBOR(24)).toEqual(new Uint8Array([0x18, 0x18]));
      expect(encodeCBOR(255)).toEqual(new Uint8Array([0x18, 0xff]));
    });

    it("should encode 2-byte integers", () => {
      expect(encodeCBOR(256)).toEqual(new Uint8Array([0x19, 0x01, 0x00]));
      expect(encodeCBOR(65535)).toEqual(new Uint8Array([0x19, 0xff, 0xff]));
    });

    it("should encode 4-byte integers", () => {
      expect(encodeCBOR(65536)).toEqual(
        new Uint8Array([0x1a, 0x00, 0x01, 0x00, 0x00]),
      );
      expect(encodeCBOR(4294967295)).toEqual(
        new Uint8Array([0x1a, 0xff, 0xff, 0xff, 0xff]),
      );
    });

    it("should encode large integers via bigint path", () => {
      const result = encodeCBOR(4294967296);
      expect(result[0]).toBe(0x1b); // 8-byte integer
    });
  });

  describe("negative integers", () => {
    it("should encode inline negative integers", () => {
      expect(encodeCBOR(-1)).toEqual(new Uint8Array([0x20]));
      expect(encodeCBOR(-24)).toEqual(new Uint8Array([0x37]));
    });

    it("should encode 1-byte negative integers", () => {
      expect(encodeCBOR(-25)).toEqual(new Uint8Array([0x38, 0x18]));
      expect(encodeCBOR(-256)).toEqual(new Uint8Array([0x38, 0xff]));
    });

    it("should encode 2-byte negative integers", () => {
      expect(encodeCBOR(-257)).toEqual(new Uint8Array([0x39, 0x01, 0x00]));
    });

    it("should encode 4-byte negative integers", () => {
      expect(encodeCBOR(-65537)).toEqual(
        new Uint8Array([0x3a, 0x00, 0x01, 0x00, 0x00]),
      );
    });
  });

  describe("bigint", () => {
    it("should encode positive bigint", () => {
      const result = encodeCBOR(42n);
      expect(decodeCBOR(result)).toBe(42);
    });

    it("should encode small inline bigint (<=23)", () => {
      const result = encodeCBOR(5n);
      expect(result).toEqual(new Uint8Array([0x05])); // inline encoding
      expect(decodeCBOR(result)).toBe(5);
    });

    it("should encode negative bigint", () => {
      const result = encodeCBOR(-42n);
      expect(decodeCBOR(result)).toBe(-42);
    });

    it("should encode large positive bigint", () => {
      const result = encodeCBOR(0xfffffffffffffffn);
      expect(result[0]).toBe(0x1b); // 8-byte integer
    });

    it("should encode large negative bigint", () => {
      // -0x100000000n - 1 = -4294967297, which needs 8 bytes
      const result = encodeCBOR(-0x100000001n);
      expect(result[0]).toBe(0x3b); // 8-byte negative integer
    });

    it("should encode 2-byte bigint", () => {
      const result = encodeCBOR(0x100n);
      expect(result).toEqual(new Uint8Array([0x19, 0x01, 0x00]));
    });

    it("should encode 4-byte bigint", () => {
      const result = encodeCBOR(0x10000n);
      expect(result).toEqual(new Uint8Array([0x1a, 0x00, 0x01, 0x00, 0x00]));
    });
  });

  describe("byte strings", () => {
    it("should encode empty byte string", () => {
      expect(encodeCBOR(new Uint8Array([]))).toEqual(new Uint8Array([0x40]));
    });

    it("should encode byte string", () => {
      expect(encodeCBOR(new Uint8Array([0x01, 0x02, 0x03]))).toEqual(
        new Uint8Array([0x43, 0x01, 0x02, 0x03]),
      );
    });
  });

  describe("text strings", () => {
    it("should throw on text strings (not supported)", () => {
      expect(() => encodeCBOR("")).toThrow(CBORParseError);
      expect(() => encodeCBOR("hello")).toThrow("text strings not supported");
    });
  });

  describe("arrays", () => {
    it("should encode empty array", () => {
      expect(encodeCBOR([])).toEqual(new Uint8Array([0x80]));
    });

    it("should encode array with items", () => {
      const result = encodeCBOR([1, 2, 3]);
      expect(decodeCBOR(result)).toEqual([1, 2, 3]);
    });

    it("should encode array with 24+ elements (non-pre-allocated path)", () => {
      // Array with 25 elements to test the fallback writeHeader path
      const arr = Array.from({ length: 25 }, (_, i) => i);
      const result = encodeCBOR(arr);
      // Header should be 0x98 (major 4, info 24) followed by length byte
      expect(result[0]).toBe(0x98);
      expect(result[1]).toBe(25);
      expect(decodeCBOR(result)).toEqual(arr);
    });
  });

  describe("maps", () => {
    it("should encode Map", () => {
      const map = new Map<number, unknown>([[1, 2]]);
      const result = encodeCBOR(map);
      expect(decodeCBOR(result)).toEqual(map);
    });

    it("should encode Map with 24+ entries (non-pre-allocated path)", () => {
      // Map with 25 entries to test the fallback writeHeader path
      const map = new Map<number, unknown>();
      for (let i = 0; i < 25; i++) {
        map.set(i, i * 2);
      }
      const result = encodeCBOR(map);
      // Header should be 0xb8 (major 5, info 24) followed by length byte
      expect(result[0]).toBe(0xb8);
      expect(result[1]).toBe(25);
      const decoded = decodeCBOR(result) as Map<number, unknown>;
      expect(decoded.size).toBe(25);
      expect(decoded.get(0)).toBe(0);
      expect(decoded.get(24)).toBe(48);
    });

    it("should encode plain object with integer string keys", () => {
      const obj = { 1: 2, 3: 4 };
      const result = encodeCBOR(obj);
      const decoded = decodeCBOR(result) as Map<number, unknown>;
      expect(decoded.get(1)).toBe(2);
      expect(decoded.get(3)).toBe(4);
    });

    it("should encode plain object with 24+ entries (non-pre-allocated path)", () => {
      // Object with 25 entries to test the fallback writeHeader path
      const obj: Record<string, number> = {};
      for (let i = 0; i < 25; i++) {
        obj[i.toString()] = i * 2;
      }
      const result = encodeCBOR(obj);
      // Header should be 0xb8 (major 5, info 24) followed by length byte
      expect(result[0]).toBe(0xb8);
      expect(result[1]).toBe(25);
      const decoded = decodeCBOR(result) as Map<number, unknown>;
      expect(decoded.size).toBe(25);
    });

    it("should throw on non-integer string keys", () => {
      const obj = { foo: 42 };
      expect(() => encodeCBOR(obj)).toThrow(CBORParseError);
      expect(() => encodeCBOR(obj)).toThrow(
        "non-integer map key not supported",
      );
    });
  });

  describe("simple values", () => {
    it("should encode null", () => {
      expect(encodeCBOR(null)).toEqual(new Uint8Array([0xf6]));
    });

    it("should encode undefined", () => {
      expect(encodeCBOR(undefined)).toEqual(new Uint8Array([0xf7]));
    });

    it("should encode true", () => {
      expect(encodeCBOR(true)).toEqual(new Uint8Array([0xf5]));
    });

    it("should encode false", () => {
      expect(encodeCBOR(false)).toEqual(new Uint8Array([0xf4]));
    });
  });

  describe("floats", () => {
    it("should encode float as float32", () => {
      const result = encodeCBOR(3.14);
      expect(result[0]).toBe(0xfa); // float32 marker
      expect(decodeCBOR(result)).toBeCloseTo(3.14, 5);
    });
  });

  describe("error handling", () => {
    it("should throw on unsupported type", () => {
      const fn = () => {};
      expect(() => encodeCBOR(fn as unknown)).toThrow(CBORParseError);
      expect(() => encodeCBOR(fn as unknown)).toThrow("unsupported type");
    });
  });

  describe("roundtrip", () => {
    it("should roundtrip complex structure", () => {
      const original = [
        0x30,
        {
          0: 42,
          1: true,
          2: false,
          3: null,
          4: new Uint8Array([1, 2, 3]),
          5: 3.14,
        },
      ];
      const encoded = encodeCBOR(original);
      const decoded = decodeCBOR(encoded);

      expect(Array.isArray(decoded)).toBe(true);
      expect((decoded as unknown[])[0]).toBe(0x30);

      const map = (decoded as unknown[])[1] as Map<number, unknown>;
      expect(map.get(0)).toBe(42);
      expect(map.get(1)).toBe(true);
      expect(map.get(2)).toBe(false);
      expect(map.get(3)).toBe(null);
      expect(map.get(4)).toEqual(new Uint8Array([1, 2, 3]));
      expect(map.get(5)).toBeCloseTo(3.14, 5);
    });
  });
});
