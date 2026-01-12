# Roastee Web Stack Experiments

This directory contains experiments to evaluate web stack choices for the Roastee PWA.

**Budget Constraint:** 150 KB target, 200 KB maximum (gzipped)

**All measurements include the Fusain protocol library** (~12 KB gzipped).

## Experiment Summary

| # | Experiment | Winner | Key Finding |
|---|------------|--------|-------------|
| 1 | Framework | SolidJS (16.61 KB) | Smallest for minimal apps |
| 2 | CSS | UnoCSS (19.65 KB) | On-demand beats purge-based |
| 3 | i18n | Minimal (20.37 KB) | 1 KB smaller than typesafe-i18n |
| 4 | PWA | Manual SW (18.51 KB) | Workbox adds 11 KB overhead |
| 5 | Full Stack | 23.28 KB total | 15.5% of 150 KB budget |
| 6 | Alt Stack | SolidJS still wins | 23% smaller than Svelte 5 |

## Final Stack Recommendation

| Component | Choice | Size Impact |
|-----------|--------|-------------|
| **Framework** | SolidJS | ~4 KB runtime |
| **CSS** | UnoCSS | ~2 KB (on-demand) |
| **i18n** | Minimal (as const) | ~0.5 KB |
| **State** | Nanostores | ~0.3 KB |
| **PWA** | Manual SW | ~0.5 KB |
| **Router** | Hash-based | ~0.2 KB |
| **Protocol** | Fusain (included) | ~12 KB |

**Estimated Production Total: ~60 KB (40% of budget)**

## Measuring Bundle Sizes

Use the included measurement script to rebuild and measure all experiments:

```bash
# Measure existing builds (fast)
./measure-sizes.sh

# Rebuild all and measure (slower)
./measure-sizes.sh --rebuild

# Output CSV format for parsing
./measure-sizes.sh 2>/dev/null > sizes.csv
```

The script outputs both human-readable format (stderr) and CSV (stdout).

## Experiment Details

### Experiment 1: Framework Bundle Comparison
Compares Svelte 5, SolidJS, and Preact for identical device dashboard.
- **Winner:** SolidJS (16.61 KB gzip with Fusain)
- **Surprise:** Svelte 5 largest at 23.06 KB due to runes overhead

### Experiment 2: CSS Framework Output
Compares UnoCSS, Tailwind v4, and vanilla CSS.
- **Winner:** Vanilla (17.79 KB) but UnoCSS best DX/size balance (19.65 KB)
- **Tailwind:** 20.21 KB (larger reset/preflight)

### Experiment 3: i18n Integration
Compares typesafe-i18n vs minimal custom solution.
- **Winner:** Minimal (20.37 KB vs 21.34 KB)
- **Both** provide full type safety via TypeScript

### Experiment 4: PWA Service Worker
Compares manual SW vs Workbox (vite-plugin-pwa).
- **Winner:** Manual (18.51 KB vs 29.50 KB)
- **Workbox:** Adds 11 KB for features Roastee doesn't need

### Experiment 5: Full Stack Integration
Combines all winners into complete prototype.
- **Result:** 23.28 KB total (15.5% of budget)
- **Includes:** Dashboard, Settings, i18n, routing, Fusain

### Experiment 6: Alternative Stack Comparison
Compares winning stack vs original research hypothesis (Svelte 5 + Tailwind).
- **Result:** SolidJS + UnoCSS is 23% smaller (23.28 vs 30.12 KB)
- **Svelte 5:** Runes system adds unexpected overhead

## Key Insights

1. **Svelte 5 is not smallest** - New runes system adds overhead vs Svelte 4
2. **SolidJS scales well** - Small runtime + efficient compiled output
3. **UnoCSS beats Tailwind** - On-demand generation more efficient
4. **Libraries add up** - Workbox alone (8 KB) exceeds manual SW by 13x
5. **Type safety is free** - TypeScript `as const` provides i18n types at no cost
6. **Fusain is ~12 KB** - Protocol library adds baseline overhead

## Reproduction

```bash
# Install all dependencies from roastee root
pnpm install

# Build fusain first (required)
cd ../fusain && pnpm build && cd ../experiments

# Rebuild all experiments and measure
./measure-sizes.sh --rebuild

# Or build individually
cd exp1-framework/solid && pnpm build
cd exp2-css/unocss && pnpm build
# etc.
```

## Budget Tracking

| Stage | Size | % of 150 KB |
|-------|------|-------------|
| Prototype (Exp 5) | 23.28 KB | 15.5% |
| +Icons/Assets | ~10 KB | 22.2% |
| +Full app (~30 components) | ~25 KB | 38.8% |
| **Projected Total** | ~60 KB | **40%** |

Significant headroom remains for future features.
