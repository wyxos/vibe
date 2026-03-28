# src/demo/AGENTS.md

## Package Identity

Demo-only utilities used by the example pages and E2E tests.

- Fake server: `src/demo/fakeServer.ts`
- Backfill fake server: `src/demo/fakeServerBackfill.ts`
- Demo helpers/composables: `src/demo/demoUtils.ts`

## Setup & Run

```bash
npm run dev
```

## Patterns & Conventions

- ✅ DO: Keep deterministic behavior (seeded randomness / predictable timing) so tests remain stable.
  - Example: `src/demo/fakeServer.ts` uses seeded RNG and caches generated items.
- ✅ DO: Keep demo helpers UI-agnostic where possible.
  - Example: `buildPagesLoadedLabel` in `src/demo/demoUtils.ts`.
- ❌ DON’T: Import demo-only code from the published library entrypoint (`src/index.ts`).
- ❌ DON’T: Edit generated outputs in `lib/index.js` / `lib/index.cjs`.

## Touch Points / Key Files

- Demo pages: `src/pages/**` (consume `@/demo/*`)
- Demo app shell: `src/App.vue`
- Router: `src/router.ts`

## JIT Index Hints

- Find demo imports: `rg -n "@/demo/" src tests`
- Find search token logic: `rg -n "makeSearchPageToken" src/demo/fakeServer.ts`
- Find backfill simulation: `rg -n "fetchBackfillPage" src/demo/fakeServerBackfill.ts`

## Common Gotchas

- The demo uses real remote media URLs (Picsum + MDN video examples). Keep tests resilient by relying on selectors + deterministic behavior, not asset load timing.

## Pre-PR Checks

```bash
npm run test && npm run test:e2e
```

## WSL + Herd Runtime
- Environment assumption: commands run from WSL on a Windows host where Laravel Herd manages primary PHP/Laravel services.
- Before PHP/Laravel tasks, verify runtime resolution (`which php`, `php -v`).
- If binaries/services are not available in WSL PATH, use Windows/Herd-aware invocation paths as needed.
- For DB/service operations, confirm whether runtime/services are Windows-hosted before executing maintenance/debug commands.
