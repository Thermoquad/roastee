# Roastee Web Stack Experiments

This directory contains experiments to evaluate web stack choices for the Roastee PWA.

**Budget Constraint:** 150 KB target, 200 KB maximum (gzipped)

## Experiment Summary

| # | Experiment | Winner | Key Finding |
|---|------------|--------|-------------|
| 1 | Framework | SolidJS (4.53 KB) | Smallest for minimal apps |
| 2 | CSS | UnoCSS (7.60 KB) | On-demand beats purge-based |
| 3 | i18n | Minimal (8.20 KB) | 1 KB smaller than typesafe-i18n |
| 4 | PWA | Manual SW (6.42 KB) | Workbox adds 10 KB overhead |
| 5 | Full Stack | 11.72 KB total | 7.8% of 150 KB budget |
| 6 | Alt Stack | SolidJS still wins | 37% smaller than Svelte 5 |

## Final Stack Recommendation

| Component | Choice | Size Impact |
|-----------|--------|-------------|
| **Framework** | SolidJS | ~4 KB runtime |
| **CSS** | UnoCSS | ~2 KB (on-demand) |
| **i18n** | Minimal (as const) | ~0.5 KB |
| **State** | Nanostores | ~0.3 KB |
| **PWA** | Manual SW | ~0.5 KB |
| **Router** | Hash-based | ~0.2 KB |
| **Protocol** | Fusain (CBOR) | ~3 KB |

**Estimated Production Total: ~45 KB (30% of budget)**

## Experiment Details

### Experiment 1: Framework Bundle Comparison
Compares Svelte 5, SolidJS, and Preact for identical device dashboard.
- **Winner:** SolidJS (4.53 KB gzip)
- **Surprise:** Svelte 5 largest at 10.28 KB due to runes overhead

### Experiment 2: CSS Framework Output
Compares UnoCSS, Tailwind v4, and vanilla CSS.
- **Winner:** Vanilla (5.79 KB) but UnoCSS best DX/size balance (7.60 KB)
- **Tailwind:** 8.15 KB (larger reset/preflight)

### Experiment 3: i18n Integration
Compares typesafe-i18n vs minimal custom solution.
- **Winner:** Minimal (8.20 KB vs 9.22 KB)
- **Both** provide full type safety via TypeScript

### Experiment 4: PWA Service Worker
Compares manual SW vs Workbox (vite-plugin-pwa).
- **Winner:** Manual (6.42 KB vs 17.05 KB)
- **Workbox:** Adds 10 KB for features Roastee doesn't need

### Experiment 5: Full Stack Integration
Combines all winners into complete prototype.
- **Result:** 11.72 KB total (7.8% of budget)
- **Includes:** Dashboard, Settings, i18n, routing, PWA

### Experiment 6: Alternative Stack Comparison
Compares winning stack vs original research hypothesis (Svelte 5 + Tailwind).
- **Result:** SolidJS + UnoCSS is 37% smaller (11.20 vs 17.91 KB)
- **Svelte 5:** Runes system adds unexpected overhead

## Key Insights

1. **Svelte 5 is not smallest** - New runes system adds overhead vs Svelte 4
2. **SolidJS scales well** - Small runtime + efficient compiled output
3. **UnoCSS beats Tailwind** - On-demand generation more efficient
4. **Libraries add up** - Workbox alone (10 KB) exceeds manual SW by 8x
5. **Type safety is free** - TypeScript `as const` provides i18n types at no cost

## Reproduction

```bash
# Install all dependencies
pnpm install

# Build all experiments
for dir in exp*/; do
  echo "Building $dir..."
  (cd "$dir" && pnpm build 2>/dev/null || true)
done

# Or build individually
cd exp1-framework/solid && pnpm build
cd exp2-css/unocss && pnpm build
# etc.
```

## Budget Tracking

| Stage | Size | % of 150 KB |
|-------|------|-------------|
| Prototype (Exp 5) | 11.72 KB | 7.8% |
| +Icons/Assets | ~10 KB | 14.5% |
| +Full app (~30 components) | ~25 KB | 24.5% |
| **Projected Total** | ~45 KB | **30%** |

Significant headroom remains for future features.
