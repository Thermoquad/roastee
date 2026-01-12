# Experiment 4: PWA Service Worker

Compares PWA service worker approaches: manual implementation vs Workbox (vite-plugin-pwa).

## Prototype

Each PWA solution implements:
- Service worker registration
- Asset caching for offline support
- Network status monitoring
- Cache invalidation on update

## Running

```bash
# Install dependencies
pnpm install

# Build and measure each variant
cd manual && pnpm build && cd ..
cd workbox && pnpm build && cd ..
```

## Measurements

| PWA Solution | App JS (gzip) | SW (gzip) | CSS (gzip) | Total (gzip) |
|--------------|---------------|-----------|------------|--------------|
| Manual       | 3.86 KB       | 0.65 KB   | 1.91 KB    | **6.42 KB**  |
| Workbox      | 7.02 KB*      | 8.12 KB   | 1.91 KB    | **17.05 KB** |

*Workbox app JS includes 2.37 KB for workbox-window registration module.

## Analysis

**Manual service worker is significantly smaller** (6.42 KB vs 17.05 KB total).

Key findings:
- **Workbox SW is 12.5x larger** (8.12 KB vs 0.65 KB gzipped)
- **Manual SW is ~50 lines** with basic cache-first strategy
- **Workbox adds 10.6 KB** total overhead

Workbox advantages (not reflected in size):
- Automatic cache versioning and cleanup
- Runtime caching configuration
- Background sync support
- Precache manifest generation
- Update prompt handling
- More robust edge case handling

**Recommendation for Roastee:**

Use **manual service worker** for initial deployment. The 10 KB savings
(from 17 KB to 6 KB) is substantial for the 150 KB budget. Roastee's
caching needs are simple:
- Cache app shell on install
- Network-first for API calls
- Cache-first for static assets

If complex caching strategies (background sync, retry queues) are needed
later, Workbox can be adopted incrementally.

## Success Criteria

- Compare total download size (app + service worker)
- Evaluate complexity of caching strategies
- Measure update/versioning handling

## Notes

- Both variants use SolidJS + UnoCSS
- Manual SW is ~50 lines with basic cache-first strategy
- Workbox provides precaching, runtime caching, and update handling
- The service worker itself may be larger with Workbox but provides more features
