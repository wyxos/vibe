# AGENTS.md

## Goal: optimize for large datasets

This repo’s `src/Masonry.vue` is designed with **very large item arrays in mind** (think **10k+ items**). When making changes, prefer solutions that keep updates fast and avoid work that scales with the entire list for small interactions.

## Non-negotiables

- **Never edit `lib/`** (generated output). Source of truth is `src/`.
- Keep the masonry logic centralized in `src/Masonry.vue` and the existing helpers in `src/masonryLayout.js`.

## Performance principles (10k items)

- Avoid `watch(..., { deep: true })` on the full `items` array.
  - Rebuild layout only on **structural changes** (new array reference, length change, resize / column count change).
- Avoid O(n) work for single-item interactions.
  - Example: reaction toggles should **mutate the one item in-place**, not `items.map(...)` across 10k entries.
- Preserve stable DOM identity.
  - Keys should be stable (`:key="item.id"`).
  - Avoid re-parenting large numbers of nodes when not necessary (causes remounts and media reloads).
- Keep layout math focused on layout-relevant fields.
  - Layout depends on `id`, `width`, `height` (and container width), not metadata like `reaction`.

## How to implement new features

- If a feature changes **layout**, it should trigger a layout rebuild (append/remove/reload, width/height changes, container resize).
- If a feature changes **metadata only**, it should not trigger full layout recalculation.

## Testing expectations

- Update unit tests in `tests/` when item contracts change.
- Prefer deterministic fixtures and cheap DOM updates in tests.
