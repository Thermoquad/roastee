#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Profile encoder to identify performance bottlenecks

import { encodeCBOR } from "../dist/cbor-codec.js";

const ITERATIONS = 100_000;

// Typical Fusain telemetry message
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
  // Warmup
  for (let i = 0; i < 10000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const end = performance.now();

  const totalMs = end - start;
  const nsPerOp = Math.round((totalMs * 1_000_000) / ITERATIONS);
  return { name, totalMs, nsPerOp };
}

console.log("Encoder Profiling");
console.log("=".repeat(60));
console.log(`Iterations: ${ITERATIONS.toLocaleString()}`);
console.log();

// Baseline: full encode
const baseline = benchmark("Full encodeCBOR", () => encodeCBOR(TELEMETRY_MESSAGE));
console.log(`Baseline: ${baseline.nsPerOp} ns/op`);
console.log();

// Test individual operations
console.log("Component costs:");
console.log("-".repeat(60));

// 1. Buffer allocation cost
const allocResult = benchmark("new Uint8Array(64)", () => new Uint8Array(64));
console.log(`  Buffer alloc:     ${allocResult.nsPerOp} ns/op`);

// 2. DataView creation cost
const buf = new Uint8Array(64);
const dvResult = benchmark("new DataView()", () => new DataView(buf.buffer));
console.log(`  DataView create:  ${dvResult.nsPerOp} ns/op`);

// 3. Slice cost
const sliceResult = benchmark("buffer.slice(0, 21)", () => buf.slice(0, 21));
console.log(`  buffer.slice():   ${sliceResult.nsPerOp} ns/op`);

// 4. Subarray cost (alternative)
const subarrayResult = benchmark("buffer.subarray(0, 21)", () => buf.subarray(0, 21));
console.log(`  buffer.subarray(): ${subarrayResult.nsPerOp} ns/op`);

// 5. Function call overhead
let counter = 0;
function incrementCounter() { counter++; }
const fnCallResult = benchmark("empty function call", () => incrementCounter());
console.log(`  Function call:    ${fnCallResult.nsPerOp} ns/op`);

// 6. Capacity check function
let offset = 0;
const buffer = new Uint8Array(256);
function ensureCapacity(needed) {
  if (offset + needed > buffer.length) {
    // grow (never happens in this test)
  }
}
const capacityResult = benchmark("ensureCapacity(1)", () => {
  ensureCapacity(1);
  offset = (offset + 1) % 200; // prevent overflow, keep in bounds
});
console.log(`  Capacity check:   ${capacityResult.nsPerOp} ns/op`);

// 7. Inline capacity check
offset = 0;
const inlineResult = benchmark("inline capacity check", () => {
  if (offset >= buffer.length) { /* grow */ }
  offset = (offset + 1) % 200;
});
console.log(`  Inline check:     ${inlineResult.nsPerOp} ns/op`);

// 8. Map iteration cost
const testMap = new Map([[0, true], [1, 0], [2, 1], [3, 12345], [4, 2500], [5, 100]]);
let sum = 0;
const mapIterResult = benchmark("Map iteration (6 entries)", () => {
  for (const [k, v] of testMap) {
    sum += k;
  }
});
console.log(`  Map iteration:    ${mapIterResult.nsPerOp} ns/op`);

// 9. typeof checks
let typeSum = 0;
const values = [true, 0, 1, 12345, 2500, 100];
const typeofResult = benchmark("typeof checks (6 values)", () => {
  for (const v of values) {
    if (v === null) typeSum++;
    else if (v === undefined) typeSum++;
    else if (v === true) typeSum++;
    else if (v === false) typeSum++;
    else if (typeof v === "number") typeSum++;
  }
});
console.log(`  typeof checks:    ${typeofResult.nsPerOp} ns/op`);

// 10. DataView.setUint16 vs manual
const view = new DataView(buffer.buffer);
let writeOffset = 0;
const setUint16Result = benchmark("DataView.setUint16", () => {
  view.setUint16(writeOffset, 12345, false);
  writeOffset = (writeOffset + 2) % 200;
});
console.log(`  setUint16:        ${setUint16Result.nsPerOp} ns/op`);

writeOffset = 0;
const manualUint16Result = benchmark("manual uint16 write", () => {
  buffer[writeOffset] = (12345 >> 8) & 0xff;
  buffer[writeOffset + 1] = 12345 & 0xff;
  writeOffset = (writeOffset + 2) % 200;
});
console.log(`  manual uint16:    ${manualUint16Result.nsPerOp} ns/op`);

console.log();
console.log("Analysis:");
console.log("-".repeat(60));

const overheadEstimate =
  allocResult.nsPerOp +
  dvResult.nsPerOp +
  sliceResult.nsPerOp +
  (capacityResult.nsPerOp * 20) + // ~20 capacity checks per encode
  mapIterResult.nsPerOp;

console.log(`  Estimated overhead: ${overheadEstimate} ns`);
console.log(`  Actual encode time: ${baseline.nsPerOp} ns`);
console.log(`  Overhead ratio:     ${((overheadEstimate / baseline.nsPerOp) * 100).toFixed(1)}%`);
