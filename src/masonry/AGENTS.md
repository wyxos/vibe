# src/masonry/AGENTS.md

## Package Identity

Framework-agnostic masonry logic: layout math, virtualization bucketing, and backfill helpers.

Primary files:
- Layout sizing helpers: `src/masonry/layout.ts`
- Layout engine + virtualization: `src/masonry/layoutEngine.ts`
- Backfill pipeline: `src/masonry/backfill.ts`
- Public types/contracts: `src/masonry/types.ts`

## Setup & Run

Same as repo root.

```bash
npm run check
```

## Patterns & Conventions

- ✅ DO: Keep the item contract stable: `{ id, width, height }` (see `src/masonry/types.ts`).
- ✅ DO: Keep utilities deterministic and easy to test (pure functions where possible).
- ✅ DO: Update/extend layout behavior in `buildMasonryLayout` / `getVisibleIndicesFromBuckets` (see `src/masonry/layoutEngine.ts`).
- ❌ DON’T: Edit generated outputs in `lib/index.js` / `lib/index.cjs`.

### Testing expectations

- ✅ DO: Add/adjust unit tests in `tests/masonryLayout.test.ts` and related suites when changing layout rules.

## Touch Points / Key Files

- Item contract/types: `src/masonry/types.ts`
- Layout engine + buckets: `src/masonry/layoutEngine.ts`
- Layout sizing: `src/masonry/layout.ts`
- Backfill behavior: `src/masonry/backfill.ts`

## JIT Index Hints

- Find bucket/virtualization logic: `rg -n "buckets|bucketPx|getVisibleIndicesFromBuckets" src/masonry`
- Find layout entrypoints: `rg -n "buildMasonryLayout" src/masonry src/components`
- Find backfill loader usage: `rg -n "createBackfillBatchLoader" src`

## Common Gotchas

- Layout depends on dimensions and container sizing; avoid threading metadata fields into layout computations unless required.

## Pre-PR Checks

```bash
npm run test -- tests/masonryLayout.test.ts
```
