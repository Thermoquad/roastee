#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Performance benchmark for Fusain CBOR codec
//
// Usage: node scripts/benchmark.mjs [--check]
//
// With --check flag, exits with code 1 if performance is below thresholds.

import { encodeCBOR, decodeCBOR } from "../dist/cbor-codec.js";

const ITERATIONS = 50_000;
const WARMUP = 5_000;

// Minimum acceptable performance (ops/sec)
// Set conservatively low to avoid flaky CI on varying hardware
const THRESHOLDS = {
  encode: 100_000, // 100K ops/sec minimum
  decode: 500_000, // 500K ops/sec minimum
};

// Typical Fusain telemetry message
const TELEMETRY_MESSAGE = [
  0x20, // MSG_TELEMETRY_DATA
  new Map([
    [0, true], // enabled
    [1, 0], // mode
    [2, 1], // state
    [3, 12345], // timestamp
    [4, 2500], // temperature
    [5, 100], // motor_rpm
  ]),
];

function benchmark(name, fn) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) fn();

  // Timed run
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const end = performance.now();

  const totalMs = end - start;
  const opsPerSec = Math.round(ITERATIONS / (totalMs / 1000));
  const nsPerOp = Math.round((totalMs * 1_000_000) / ITERATIONS);

  return { name, opsPerSec, nsPerOp };
}

function formatOps(ops) {
  if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M`;
  if (ops >= 1_000) return `${(ops / 1_000).toFixed(0)}K`;
  return ops.toString();
}

// Parse args
const checkMode = process.argv.includes("--check");

console.log("Fusain CBOR Benchmark");
console.log("=".repeat(50));
console.log(`Iterations: ${ITERATIONS.toLocaleString()}`);
console.log();

// Pre-encode for decode benchmark
const encoded = encodeCBOR(TELEMETRY_MESSAGE);

// Run benchmarks
const encodeResult = benchmark("encode", () => encodeCBOR(TELEMETRY_MESSAGE));
const decodeResult = benchmark("decode", () => decodeCBOR(encoded));

// Print results
console.log("Results:");
console.log("-".repeat(50));
console.log(
  `  Encode: ${formatOps(encodeResult.opsPerSec).padStart(8)} ops/sec  (${encodeResult.nsPerOp} ns/op)`
);
console.log(
  `  Decode: ${formatOps(decodeResult.opsPerSec).padStart(8)} ops/sec  (${decodeResult.nsPerOp} ns/op)`
);
console.log();

// Throughput
const encodeThroughput = Math.round(
  (encoded.length * encodeResult.opsPerSec) / (1024 * 1024)
);
const decodeThroughput = Math.round(
  (encoded.length * decodeResult.opsPerSec) / (1024 * 1024)
);

console.log("Throughput:");
console.log("-".repeat(50));
console.log(`  Message size: ${encoded.length} bytes`);
console.log(`  Encode: ${encodeThroughput} MB/s`);
console.log(`  Decode: ${decodeThroughput} MB/s`);
console.log();

// Check thresholds if requested
if (checkMode) {
  console.log("Threshold Check:");
  console.log("-".repeat(50));

  let failed = false;

  if (encodeResult.opsPerSec < THRESHOLDS.encode) {
    console.log(
      `  FAIL: Encode ${formatOps(encodeResult.opsPerSec)} < ${formatOps(THRESHOLDS.encode)} threshold`
    );
    failed = true;
  } else {
    console.log(
      `  PASS: Encode ${formatOps(encodeResult.opsPerSec)} >= ${formatOps(THRESHOLDS.encode)} threshold`
    );
  }

  if (decodeResult.opsPerSec < THRESHOLDS.decode) {
    console.log(
      `  FAIL: Decode ${formatOps(decodeResult.opsPerSec)} < ${formatOps(THRESHOLDS.decode)} threshold`
    );
    failed = true;
  } else {
    console.log(
      `  PASS: Decode ${formatOps(decodeResult.opsPerSec)} >= ${formatOps(THRESHOLDS.decode)} threshold`
    );
  }

  console.log();

  if (failed) {
    console.log("Benchmark FAILED - performance below thresholds");
    process.exit(1);
  } else {
    console.log("Benchmark PASSED");
  }
}
