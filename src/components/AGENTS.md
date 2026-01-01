# src/components/AGENTS.md

## Package Identity

Vue components for Vibe.

- Main component: `src/components/Masonry.vue`
- Supporting component: `src/components/MasonryLoader.vue`

## Setup & Run

Same as repo root.

```bash
npm run dev
npm run check
```

## Patterns & Conventions

### Performance (large item arrays)

`src/components/Masonry.vue` is designed for **very large item arrays** (10k+). Keep per-interaction work cheap.

- ✅ DO: Keep layout recalculation driven by layout-relevant changes (id/width/height/container sizing).
- ✅ DO: Preserve stable DOM identity (`:key="item.id"` pattern in `src/components/Masonry.vue`).
- ✅ DO: Use virtualization helpers rather than rendering everything when sizes are known (see `getVisibleIndicesFromBuckets` usage in `src/components/Masonry.vue`).
- ❌ DON’T: Add new library logic to the generated bundle in `lib/index.js`; always change `src/**`.

### Layout / engine boundaries

- ✅ DO: Change layout math in `src/masonry/layoutEngine.ts` and sizing helpers in `src/masonry/layout.ts`.
- ✅ DO: Keep `src/components/Masonry.vue` focused on orchestration (measuring, scroll, pagination/backfill state, rendering).

### Public API exposure

- ✅ DO: Expose consumer-facing methods via `defineExpose(...)` in `src/components/Masonry.vue`.
- ✅ DO: Keep public API names short and stable; prefer descriptive internal helper names.

## Touch Points / Key Files

- Component implementation: `src/components/Masonry.vue`
- Loader component: `src/components/MasonryLoader.vue`
- Item contract: `src/masonry/types.ts`
- Layout engine: `src/masonry/layoutEngine.ts`

## JIT Index Hints

- Find exposed API surface: `rg -n "defineExpose" src/components/Masonry.vue`
- Find scroll container selectors: `rg -n "items-scroll-container" src/components/Masonry.vue tests`
- Find virtualization constants: `rg -n "BUCKET_PX|overscanPx" src/components/Masonry.vue`

## Common Gotchas

- Avoid deep `watch()` patterns on the entire items array; prefer targeted triggers (see existing `watch(...)` patterns in `src/components/Masonry.vue`).

## Pre-PR Checks

```bash
npm run check
```
