# tests/e2e/AGENTS.md

## Package Identity

Playwright E2E tests for the demo app behavior (scrolling, remove/restore animations, etc.).

Config:
- Playwright config: `playwright.config.js`

## Setup & Run

```bash
npm run test:e2e
```

Run a single spec:

```bash
npx playwright test tests/e2e/infinite-scroll.spec.ts
```

## Patterns & Conventions

- ✅ DO: Use stable `data-testid` selectors.
  - Example: `tests/e2e/infinite-scroll.spec.ts` uses `page.getByTestId('items-scroll-container')`.
- ✅ DO: Use hash-mode routes (`/#/`) when navigating.
  - Example: `page.goto('/#/')` in `tests/e2e/infinite-scroll.spec.ts`.
- ✅ DO: Keep assertions resilient: wait for rendered counts/text rather than hard sleeps.
- ❌ DON’T: Edit generated outputs in `lib/index.js` / `lib/index.cjs`.

## Touch Points / Key Files

- Base URL + webServer config: `playwright.config.js`
- Infinite scroll + animations: `tests/e2e/infinite-scroll.spec.ts`
- Backfill behaviors: `tests/e2e/backfill.spec.ts`

## JIT Index Hints

- Find all E2E selectors: `rg -n "getByTestId\(" tests/e2e`
- Find navigation points: `rg -n "goto\(" tests/e2e`

## Common Gotchas

- Playwright spins up the dev server automatically via `playwright.config.js` (baseURL `http://127.0.0.1:4173`). Don’t start another server on that port when running E2E.

## Pre-PR Checks

```bash
npm run test:e2e
```
