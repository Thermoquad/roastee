# Experiment 3: i18n Integration

Compares internationalization approaches: typesafe-i18n vs minimal custom implementation.

## Prototype

Each i18n solution implements:
- Language switcher (EN/ES/FR)
- Translated dashboard labels
- Translated control buttons
- Translated units
- Type-safe translation keys

## Running

```bash
# Install dependencies
pnpm install

# Build and measure each variant
cd typesafe-i18n && pnpm build && cd ..
cd minimal && pnpm build && cd ..
```

## Measurements

| i18n Solution | JS (min) | JS (gzip) | CSS (gzip) | Total (gzip) |
|---------------|----------|-----------|------------|--------------|
| Minimal       | 16.18 KB | 6.01 KB   | 2.19 KB    | **8.20 KB**  |
| typesafe-i18n | 17.89 KB | 7.03 KB   | 2.19 KB    | **9.22 KB**  |

## Analysis

**Minimal i18n wins** with 1.02 KB smaller bundle (8.20 vs 9.22 KB gzipped).

Key findings:
- **typesafe-i18n adds ~1 KB** to the JS bundle
- **Both provide type safety** via TypeScript's `as const` or generated types
- **Minimal is simpler** - just a lookup function and translations object

typesafe-i18n advantages (not reflected in size):
- Nested translation keys (cleaner organization)
- Parameter interpolation (`Hello {name}!`)
- Pluralization support
- CLI tooling for extracting/validating translations

**Recommendation for Roastee:**

Use the **minimal approach** for initial development. The 1 KB savings matters for
the 150 KB budget, and the dashboard has simple translation needs. If complex
interpolation or pluralization is needed later, typesafe-i18n can be adopted.

## Success Criteria

- Compare bundle size with full type safety
- Evaluate DX (autocomplete, error checking)
- Measure i18n library overhead

## Notes

- Both variants use SolidJS + UnoCSS (winners from experiments 1 & 2)
- typesafe-i18n provides generator tooling and nested translations
- Minimal uses flat keys with `as const` for type inference
- Both support 3 languages with identical translations
