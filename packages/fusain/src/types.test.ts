// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad

import { describe, it, expect } from "vitest";
import { DecodeError, CBORParseError } from "./types.js";

describe("DecodeError", () => {
  it("should create error with message", () => {
    const err = new DecodeError("test error");
    expect(err.message).toBe("test error");
    expect(err.name).toBe("DecodeError");
  });

  it("should store raw bytes", () => {
    const rawBytes = new Uint8Array([1, 2, 3]);
    const err = new DecodeError("test error", rawBytes);
    expect(err.rawBytes).toEqual(rawBytes);
  });

  it("should be instanceof Error", () => {
    const err = new DecodeError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DecodeError);
  });

  it("should work without raw bytes", () => {
    const err = new DecodeError("test");
    expect(err.rawBytes).toBeUndefined();
  });
});

describe("CBORParseError", () => {
  it("should create error with message", () => {
    const err = new CBORParseError("parse failed");
    expect(err.message).toBe("parse failed");
    expect(err.name).toBe("CBORParseError");
  });

  it("should be instanceof Error", () => {
    const err = new CBORParseError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CBORParseError);
  });
});
