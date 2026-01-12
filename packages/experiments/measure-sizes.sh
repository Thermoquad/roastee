#!/usr/bin/env bash
# Measure bundle sizes for all experiments
# Usage: ./measure-sizes.sh [--rebuild]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REBUILD=false
if [[ "$1" == "--rebuild" ]]; then
    REBUILD=true
fi

# Helper function to format bytes as KB
format_kb() {
    local bytes=$1
    local kb=$(awk "BEGIN {printf \"%.2f\", $bytes / 1024}")
    echo "$kb"
}

# Build and measure a single experiment
measure_exp() {
    local dir=$1
    local name=$2

    echo "=== $name ===" >&2

    if [[ ! -d "$dir" ]]; then
        echo "  SKIPPED (directory not found)" >&2
        return
    fi

    cd "$dir"

    if $REBUILD; then
        if ! pnpm build >/dev/null 2>&1; then
            echo "  BUILD FAILED" >&2
            cd - >/dev/null
            return
        fi
    fi

    if [[ ! -d "dist" ]]; then
        echo "  NO DIST (run with --rebuild)" >&2
        cd - >/dev/null
        return
    fi

    local js_raw=0
    local css_raw=0
    local js_gz=0
    local css_gz=0
    local sw_gz=0

    # Measure JS files
    shopt -s nullglob
    for f in dist/assets/*.js; do
        if [[ -f "$f" ]]; then
            js_raw=$((js_raw + $(wc -c < "$f")))
            js_gz=$((js_gz + $(gzip -c "$f" | wc -c)))
        fi
    done

    # Measure CSS files
    for f in dist/assets/*.css; do
        if [[ -f "$f" ]]; then
            css_raw=$((css_raw + $(wc -c < "$f")))
            css_gz=$((css_gz + $(gzip -c "$f" | wc -c)))
        fi
    done

    # Measure service worker (if present)
    if [[ -f "dist/sw.js" ]]; then
        sw_gz=$(gzip -c dist/sw.js | wc -c)
        # Also check for workbox runtime
        for f in dist/workbox-*.js; do
            if [[ -f "$f" ]]; then
                sw_gz=$((sw_gz + $(gzip -c "$f" | wc -c)))
            fi
        done
    fi
    shopt -u nullglob

    local total_gz=$((js_gz + css_gz + sw_gz))
    local total_kb=$(format_kb $total_gz)

    printf "  JS:  %6d B raw, %6d B gzip (%.2f KB)\n" $js_raw $js_gz $(format_kb $js_gz) >&2
    printf "  CSS: %6d B raw, %6d B gzip (%.2f KB)\n" $css_raw $css_gz $(format_kb $css_gz) >&2
    if [[ $sw_gz -gt 0 ]]; then
        printf "  SW:  %6d B gzip (%.2f KB)\n" $sw_gz $(format_kb $sw_gz) >&2
    fi
    printf "  Total: %s KB gzip\n" "$total_kb" >&2

    # Output CSV format for parsing
    echo "$name,$js_raw,$js_gz,$css_raw,$css_gz,$sw_gz,$total_gz"

    cd - >/dev/null
}

echo ""
echo "Bundle Size Measurements"
echo "========================"
echo ""

# Header for CSV output
echo "Experiment,JS_Raw,JS_Gzip,CSS_Raw,CSS_Gzip,SW_Gzip,Total_Gzip"

# Experiment 1: Framework comparison
echo "" >&2
echo "--- Experiment 1: Framework Comparison ---" >&2
for fw in solid svelte preact; do
    measure_exp "exp1-framework/$fw" "exp1-$fw"
done

# Experiment 2: CSS comparison
echo "" >&2
echo "--- Experiment 2: CSS Framework ---" >&2
for css in unocss tailwind vanilla; do
    measure_exp "exp2-css/$css" "exp2-$css"
done

# Experiment 3: i18n comparison
echo "" >&2
echo "--- Experiment 3: i18n ---" >&2
for i18n in minimal typesafe-i18n; do
    measure_exp "exp3-i18n/$i18n" "exp3-$i18n"
done

# Experiment 4: PWA comparison
echo "" >&2
echo "--- Experiment 4: PWA Service Worker ---" >&2
for pwa in manual workbox; do
    measure_exp "exp4-pwa/$pwa" "exp4-$pwa"
done

# Experiment 5: Full stack
echo "" >&2
echo "--- Experiment 5: Full Stack ---" >&2
measure_exp "exp5-full-stack" "exp5-full-stack"

# Experiment 6: Alt stack comparison
echo "" >&2
echo "--- Experiment 6: Alternative Stack ---" >&2
measure_exp "exp6-alt-stack/svelte-tailwind" "exp6-svelte-tailwind"

echo "" >&2
echo "Done! CSV output above can be piped to a file." >&2
