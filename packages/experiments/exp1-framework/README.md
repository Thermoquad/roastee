# Experiment 1: Framework Bundle Comparison

Compares bundle sizes of Svelte 5, SolidJS, and Preact for an identical device dashboard.

## Prototype

Each framework implements:
- Device connection status display
- 5 telemetry values (temperature, RPM, pressure, flow rate, voltage)
- Toggle button for heater on/off
- Reactive updates every 100ms

## Running

```bash
# Install dependencies
pnpm install

# Build and measure each framework
cd svelte && pnpm build && cd ..
cd solid && pnpm build && cd ..
cd preact && pnpm build && cd ..
```

## Measurements

| Framework | JS (min) | JS (gzip) | CSS (gzip) | Total (gzip) |
|-----------|----------|-----------|------------|--------------|
| SolidJS   | 10.21 KB | 4.18 KB   | 0.35 KB    | **4.53 KB**  |
| Preact    | 15.22 KB | 6.24 KB   | 0.35 KB    | **6.59 KB**  |
| Svelte 5  | 25.08 KB | 9.90 KB   | 0.38 KB    | **10.28 KB** |

## Analysis

**Unexpected result:** SolidJS is smallest for this minimal prototype.

This contradicts the initial research hypothesis. The reason:
- SolidJS has a small runtime (~4 KB) and efficient compiled output
- Svelte compiles each component to standalone JS, growing faster per component
- For very small apps (<10 components), SolidJS wins on size

**Growth characteristics matter:** Research indicated Svelte grows at 0.493 bytes/byte
vs React at 0.153 bytes/byte. SolidJS likely falls between these. For Roastee's
expected ~20-30 components, the crossover point needs to be determined.

## Success Criteria

Original: Svelte 5 produces smallest bundle with comparable performance.

**Result:** For this prototype, SolidJS is smallest. Need to test with more
realistic app size (Experiment 5) to verify crossover point.

## Next Steps

1. Run Experiment 5 with full stack to measure at realistic app size
2. Consider SolidJS as alternative if Svelte doesn't catch up at scale
3. Factor in developer experience and ecosystem in final decision
