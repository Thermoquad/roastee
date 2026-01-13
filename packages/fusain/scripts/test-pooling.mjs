#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Test buffer pooling impact

const ITERATIONS = 100_000;

function benchmark(name, fn) {
  for (let i = 0; i < 10000; i++) fn();
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const end = performance.now();
  return Math.round(((end - start) * 1_000_000) / ITERATIONS);
}

console.log("Buffer Pooling Test");
console.log("=".repeat(50));

// Simulate encoding work
function simulateEncode(buffer, view) {
  let offset = 0;
  // Array header
  buffer[offset++] = 0x82;
  // Integer 0x20
  buffer[offset++] = 0x18;
  buffer[offset++] = 0x20;
  // Map header (6 items)
  buffer[offset++] = 0xa6;
  // 6 key-value pairs
  for (let i = 0; i < 6; i++) {
    buffer[offset++] = i; // key
    if (i === 0) {
      buffer[offset++] = 0xf5; // true
    } else if (i < 3) {
      buffer[offset++] = i; // small int
    } else {
      buffer[offset++] = 0x19; // uint16
      view.setUint16(offset, 1000 + i * 100, false);
      offset += 2;
    }
  }
  return offset;
}

// Version 1: Allocate each time
function encodeWithAlloc() {
  const buffer = new Uint8Array(64);
  const view = new DataView(buffer.buffer);
  const len = simulateEncode(buffer, view);
  return buffer.slice(0, len);
}

// Version 2: Pooled buffer, slice return
let pooledBuffer = new Uint8Array(256);
let pooledView = new DataView(pooledBuffer.buffer);
function encodePooledSlice() {
  const len = simulateEncode(pooledBuffer, pooledView);
  return pooledBuffer.slice(0, len);
}

// Version 3: Pooled buffer, subarray return
function encodePooledSubarray() {
  const len = simulateEncode(pooledBuffer, pooledView);
  return pooledBuffer.subarray(0, len);
}

// Version 4: Pooled + inline writes (no DataView for small values)
function encodePooledInline() {
  let offset = 0;
  pooledBuffer[offset++] = 0x82;
  pooledBuffer[offset++] = 0x18;
  pooledBuffer[offset++] = 0x20;
  pooledBuffer[offset++] = 0xa6;
  for (let i = 0; i < 6; i++) {
    pooledBuffer[offset++] = i;
    if (i === 0) {
      pooledBuffer[offset++] = 0xf5;
    } else if (i < 3) {
      pooledBuffer[offset++] = i;
    } else {
      pooledBuffer[offset++] = 0x19;
      const val = 1000 + i * 100;
      pooledBuffer[offset++] = (val >> 8) & 0xff;
      pooledBuffer[offset++] = val & 0xff;
    }
  }
  return pooledBuffer.subarray(0, offset);
}

const allocTime = benchmark("alloc each time", encodeWithAlloc);
const pooledSliceTime = benchmark("pooled + slice", encodePooledSlice);
const pooledSubarrayTime = benchmark("pooled + subarray", encodePooledSubarray);
const pooledInlineTime = benchmark("pooled + inline", encodePooledInline);

console.log(`Alloc each time:    ${allocTime} ns/op`);
console.log(`Pooled + slice:     ${pooledSliceTime} ns/op (${Math.round((1 - pooledSliceTime/allocTime) * 100)}% faster)`);
console.log(`Pooled + subarray:  ${pooledSubarrayTime} ns/op (${Math.round((1 - pooledSubarrayTime/allocTime) * 100)}% faster)`);
console.log(`Pooled + inline:    ${pooledInlineTime} ns/op (${Math.round((1 - pooledInlineTime/allocTime) * 100)}% faster)`);

console.log();
console.log("Breakdown of savings:");
console.log(`  Buffer+DataView alloc: ${allocTime - pooledSliceTime} ns`);
console.log(`  slice vs subarray:     ${pooledSliceTime - pooledSubarrayTime} ns`);
console.log(`  DataView vs inline:    ${pooledSubarrayTime - pooledInlineTime} ns`);
