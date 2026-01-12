# Experiment 2: CSS Framework Output

Compares CSS output sizes of UnoCSS, Tailwind v4, and vanilla CSS using SolidJS as the base framework.

## Prototype

Each CSS solution implements identical styling for:
- Dashboard layout (max-width, centering, spacing)
- Card components with shadows and rounded corners
- Status indicator with color states
- Telemetry grid with alternating backgrounds
- Control buttons with active/inactive states
- Typography and color utilities

## Running

```bash
# Install dependencies
pnpm install

# Build and measure each variant
cd vanilla && pnpm build && cd ..
cd unocss && pnpm build && cd ..
cd tailwind && pnpm build && cd ..
```

## Measurements

| CSS Framework | JS (min) | JS (gzip) | CSS (min) | CSS (gzip) | Total (gzip) |
|---------------|----------|-----------|-----------|------------|--------------|
| Vanilla       | 12.35 KB | 5.07 KB   | 1.77 KB   | 0.72 KB    | **5.79 KB**  |
| UnoCSS        | 13.36 KB | 5.33 KB   | 7.69 KB   | 2.27 KB    | **7.60 KB**  |
| Tailwind v4   | 13.35 KB | 5.33 KB   | 9.85 KB   | 2.82 KB    | **8.15 KB**  |

## Analysis

**Vanilla CSS wins on pure size** but requires manual CSS authoring.

Key findings:
- **Vanilla is ~1.8 KB smaller** than UnoCSS gzipped (5.79 vs 7.60 KB)
- **UnoCSS beats Tailwind** by 0.55 KB gzipped (7.60 vs 8.15 KB)
- **JS overhead is minimal** - utility frameworks add ~0.26 KB to JS bundle
- **CSS overhead is significant** - atomic CSS adds 1.55-2.10 KB gzipped

CSS size breakdown:
- Vanilla: 0.72 KB - only what's written
- UnoCSS: 2.27 KB - includes reset + used utilities
- Tailwind: 2.82 KB - includes larger reset/preflight

**Recommendation for Roastee:**

Given the 150 KB budget target, the CSS framework overhead (1.5-2 KB) is acceptable.
UnoCSS provides the best balance of:
- Smaller output than Tailwind
- Better DX than vanilla CSS
- Consistent utility classes across components
- On-demand generation (only includes used utilities)

## Success Criteria

- Compare CSS output size for identical UI
- Evaluate developer experience (utility classes vs custom CSS)
- Measure any JS runtime overhead from CSS frameworks

## Notes

- All variants use SolidJS (smallest from Experiment 1)
- UnoCSS uses on-demand generation (only used utilities are included)
- Tailwind v4 uses new native CSS output with tree-shaking
- Vanilla CSS provides baseline comparison
