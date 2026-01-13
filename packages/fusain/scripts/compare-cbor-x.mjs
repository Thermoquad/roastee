#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Direct comparison with cbor-x

import { encodeCBOR, decodeCBOR } from "../dist/cbor-codec.js";

// Dynamic import cbor-x if available
let cborxEncode, cborxDecode;
try {
  const cborx = await import("cbor-x");
  cborxEncode = cborx.encode;
  cborxDecode = cborx.decode;
} catch {
  console.log("cbor-x not installed, skipping comparison");
  process.exit(0);
}

const ITERATIONS = 100_000;

const TELEMETRY_MESSAGE = [
  0x20,
  new Map([
    [0, true],
    [1, 0],
    [2, 1],
    [3, 12345],
    [4, 2500],
    [5, 100],
  ]),
];

function benchmark(name, fn) {
  for (let i = 0; i < 10000; i++) fn();
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const end = performance.now();
  const nsPerOp = Math.round(((end - start) * 1_000_000) / ITERATIONS);
  return nsPerOp;
}

// Pre-encode for decode benchmarks
const customEncoded = encodeCBOR(TELEMETRY_MESSAGE);
const cborxEncoded = cborxEncode(TELEMETRY_MESSAGE);

console.log("Direct Comparison: Custom vs cbor-x");
console.log("=".repeat(50));
console.log();

// Encode benchmarks
const customEncTime = benchmark("custom encode", () => encodeCBOR(TELEMETRY_MESSAGE));
const cborxEncTime = benchmark("cbor-x encode", () => cborxEncode(TELEMETRY_MESSAGE));

console.log("Encode:");
console.log(`  Custom:  ${customEncTime} ns/op`);
console.log(`  cbor-x:  ${cborxEncTime} ns/op`);
const encRatio = customEncTime / cborxEncTime;
console.log(`  Ratio:   ${encRatio.toFixed(2)}x ${encRatio > 1 ? "slower" : "faster"}`);
console.log();

// Decode benchmarks
const customDecTime = benchmark("custom decode", () => decodeCBOR(customEncoded));
const cborxDecTime = benchmark("cbor-x decode", () => cborxDecode(cborxEncoded));

console.log("Decode:");
console.log(`  Custom:  ${customDecTime} ns/op`);
console.log(`  cbor-x:  ${cborxDecTime} ns/op`);
const decRatio = customDecTime / cborxDecTime;
console.log(`  Ratio:   ${decRatio.toFixed(2)}x ${decRatio > 1 ? "slower" : "faster"}`);
console.log();

// Output sizes
console.log("Wire format:");
console.log(`  Custom:  ${customEncoded.length} bytes`);
console.log(`  cbor-x:  ${cborxEncoded.length} bytes`);
console.log();

// Show bytes
console.log("Output bytes:");
console.log(`  Custom: [${Array.from(customEncoded).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
console.log(`  cbor-x: [${Array.from(cborxEncoded).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
