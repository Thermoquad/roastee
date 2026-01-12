# Experiment 6: Alternative Stack Comparison

Compares the winning stack (SolidJS + UnoCSS) against the original research
hypothesis (Svelte 5 + Tailwind) at realistic app size.

## Stacks Compared

| Stack | Framework | CSS | State |
|-------|-----------|-----|-------|
| A (Winner) | SolidJS | UnoCSS | Nanostores |
| B (Hypothesis) | Svelte 5 | Tailwind v4 | Svelte runes |

## Features (Both Identical)

- Dashboard with telemetry display
- Device controls (heater, pump)
- Settings page (language, theme)
- Hash-based routing
- Type-safe translations (EN/ES/FR)
- Reactive state management

## Running

```bash
# Install dependencies
pnpm install

# Build both stacks
# Note: SolidJS stack is exp5-full-stack
cd svelte-tailwind && pnpm build && cd ..
```

## Measurements

| Stack | JS (min) | JS (gzip) | CSS (gzip) | Total (gzip) |
|-------|----------|-----------|------------|--------------|
| SolidJS + UnoCSS | 24.44 KB | 8.89 KB | 2.31 KB | **11.20 KB** |
| Svelte + Tailwind | 39.85 KB | 14.92 KB | 2.99 KB | **17.91 KB** |

**Difference: SolidJS stack is 6.71 KB smaller (37% smaller)**

## Analysis

**Unexpected: SolidJS wins even at realistic app size.**

Key findings:
- **SolidJS JS is 6 KB smaller** (8.89 vs 14.92 KB gzipped)
- **UnoCSS CSS is 0.68 KB smaller** (2.31 vs 2.99 KB gzipped)
- **Svelte 5 runes compile to larger output** than expected

Why Svelte 5 is larger:
- Svelte 5's new runes system adds runtime overhead not present in Svelte 4
- Each component compiles to more code than SolidJS signals
- The "lower per-component growth" advantage doesn't manifest at this scale

### Crossover Analysis

Research suggested Svelte would win at larger app sizes due to lower per-component
growth (0.493 bytes/byte vs React's 0.153). However:
- SolidJS growth is similar to Svelte
- Initial runtime difference dominates at this scale
- Crossover point would require 100+ components (unlikely for Roastee)

## Recommendation

**Use SolidJS + UnoCSS for Roastee.**

The SolidJS stack:
- Is 37% smaller at realistic app size
- Has simpler mental model than Svelte 5 runes
- Works well with existing nanostores pattern
- Provides excellent TypeScript integration
- Has proven performance characteristics

## Success Criteria

- Determine if Svelte's lower per-component growth catches up at realistic size
- Compare DX between the two approaches
- Make final recommendation for Roastee
