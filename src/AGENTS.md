# src/AGENTS.md

## Package Identity

This folder contains the **source of truth** for the Vibe library and its demo app.

- Library entrypoint: `src/index.ts`
- Demo shell/router: `src/App.vue`, `src/router.ts`, `src/pages/**`

## Setup & Run

```bash
npm install
npm run dev
```

Useful one-offs:

```bash
npm run check
npm run build
npm run build:lib
npm run build:types
```

## Patterns & Conventions

- ✅ DO: Keep reusable library behavior in `src/components/Masonry.vue` + `src/masonry/**`.
- ✅ DO: Keep demo-only behavior in `src/demo/**` and `src/pages/**`.
- ✅ DO: Use `@/` imports (example: `src/components/Masonry.vue` imports `@/masonry/types`).
- ❌ DON’T: Edit generated outputs in `lib/index.js` / `lib/index.cjs`.

## Touch Points / Key Files

- Library export surface: `src/index.ts`
- Demo entry + version display: `src/App.vue`
- Demo routing: `src/router.ts`
- Public component(s): `src/components/Masonry.vue`, `src/components/MasonryLoader.vue`

## JIT Index Hints

- Find all component exports: `rg -n "export" src/components`
- Find alias imports: `rg -n "from '@/" src`
- Find demo-only references: `rg -n "src/demo|@/demo" src tests`

## Common Gotchas

- The demo displays the package version from build-time metadata (see `src/App.vue`). If you change versioning/release flow, validate the demo build output.

## Pre-PR Checks

```bash
npm run check && npm run build && npm run build:lib && npm run build:types
```
