# Guidance for AI Coding Agents

## Project Overview
- Library project exporting a Vue 3 masonry component; source of truth lives in `src/`, while `lib/` is generated during publishes—never edit files under `lib/` manually.
- The demo app (`src/App.vue`, `examples/`) exists only for showcase and manual verification; keep library logic isolated from demo-specific concerns.

## Key Architecture
- `src/Masonry.vue` is the primary component: it composes layout (`calculateLayout.ts`), scroll orchestration (`useMasonryScroll.ts`), and transition helpers (`useMasonryTransitions.ts`). Any feature work should integrate through these composables instead of duplicating logic.
- Layout math expects every item to carry `{ id, width, height }`; `refreshLayout` preserves `originalIndex` before piping into `calculateLayout`. Maintain these invariants when mutating items.
- Pagination pipeline relies on `getNextPage(page)` returning `{ items, nextPage }` and tracks history via `paginationHistory` and `currentPage`. Features like backfill, retry, and the `refreshCurrentPage` method build on this state machine—respect those fields to avoid regressions.
- `calculateLayout.ts` contains two placement modes (`masonry`, `sequential-balanced`) and handles scrollbar/padding adjustments. Extend placement behaviour here rather than in the component.

## Working Conventions
- Keep new state in `Masonry.vue` inside the Composition API `setup` function, and expose capabilities via `defineExpose` so downstream users receive them. When you add an exposed method, mirror it in the type declarations if hand-maintained.
- Use the provided composables: for scroll-triggered loading call `handleScroll` from `useMasonryScroll`; for animations hook into `useMasonryTransitions`. This prevents inconsistencies in timing and data flow.
- Diagnostics such as `checkItemDimensions` log once per malformed item (`Set`-based dedupe). Preserve that pattern for future warnings.


## Commands & Tooling
- Install deps with `npm install`. Key scripts: `npm run dev` (Vite dev server), `npm run build:lib` (library bundle + declarations), `npm test` (Vitest unit suite), `npm run build` (demo site + CNAME). There is no lint script.
- Release workflow is scripted via `npm run release <major|minor|patch>`; it enforces a clean git state, runs tests/builds, bumps versions, tags, publishes to npm, and redeploys the demo. Use flags like `--skip-build` only when you understand the implications.

## Testing Expectations
- Unit tests live in `tests/` and exercise both pure utilities (`calculateLayout.test.js`, `masonryDistribution.test.js`) and the component (`Masonry.test.js`) via `@vue/test-utils`. Add similar tests when introducing behaviours, especially around pagination/backfill edge cases.
- Prefer deterministic fixtures rather than random data; see existing tests for how items are shaped.

Let me know if any of these guidelines feel incomplete or if a workflow is unclear so we can refine the instructions further.