# tests/AGENTS.md

## Package Identity

Vitest unit/integration tests for the Vibe library and demo wiring.

- Test runner: Vitest
- Vue testing: `@vue/test-utils`

## Setup & Run

```bash
npm run test
```

Single file:

```bash
npm run test -- tests/Masonry.loading.test.ts
```

## Patterns & Conventions

- ✅ DO: Prefer deterministic fixtures.
  - Example: `makeItem(...)` pattern in `tests/Masonry.loading.test.ts`.
- ✅ DO: Use `data-testid` selectors for stability.
  - Example: scroll container selector in `tests/Masonry.loading.test.ts` uses `[data-testid="items-scroll-container"]`.
- ✅ DO: When timing matters, use Vitest fake timers + explicit microtask flush.
  - Example: `vi.useFakeTimers()` and `flushMicrotasks()` in `tests/Masonry.loading.test.ts`.
- ❌ DON’T: Edit generated outputs in `lib/index.js` / `lib/index.cjs`.

## Touch Points / Key Files

- Component resilience tests: `tests/Masonry.loading.test.ts`, `tests/Masonry.resume.test.ts`
- Warnings/diagnostics tests: `tests/Masonry.warnings.test.ts`
- Layout engine tests: `tests/masonryLayout.test.ts`

## JIT Index Hints

- Find Masonry mounts: `rg -n "mount\(Masonry" tests`
- Find scroll triggers: `rg -n "items-scroll-container" tests src/components/Masonry.vue`
- Find mock usage: `rg -n "vi\.mock\(" tests`

## Common Gotchas

- JSDOM frequently reports 0 sizing; some code intentionally renders all items when `viewportHeight <= 0` (see `src/masonry/layoutEngine.ts`). Tests should account for that behavior.

## Pre-PR Checks

```bash
npm run check
```
