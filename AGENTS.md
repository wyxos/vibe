# AGENTS.md (root)

## Project Snapshot

**Repo type**: single package (Vue 3 library + demo app)

**Stack**: Vue 3 + TypeScript + Vite; tests via Vitest and Playwright; lint via ESLint.

**Nearest-wins docs**: detailed guidance lives in sub-folder AGENTS.md files.

## Root Setup Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run build:lib
npm run build:types
npm run test:e2e
```

## Universal Conventions

- **Never edit `lib/`** (generated output). Source of truth is `src/`.
- Prefer `@/` imports (Vite alias) for internal modules.
- Keep library logic in `src/components/` + `src/masonry/`; demo-only code stays in `src/demo/` and `src/pages/`.
- Avoid backward-compat shims (aliases/deprecated fallbacks) unless explicitly requested.

## Security & Secrets

- Don’t commit tokens/keys. If secrets are introduced, put them in `.env` (gitignored) and document required vars in README.

## JIT Index (what to open, not what to paste)

- Source overview: `src/` → see `src/AGENTS.md`
- Public components: `src/components/` → see `src/components/AGENTS.md`
- Layout/backfill engine: `src/masonry/` → see `src/masonry/AGENTS.md`
- Demo/fake server: `src/demo/` → see `src/demo/AGENTS.md`
- Unit/integration tests: `tests/` → see `tests/AGENTS.md`
- Playwright tests: `tests/e2e/` → see `tests/e2e/AGENTS.md`

### Quick Find Commands

- Find exposed public API: `rg -n "defineExpose" src/components/Masonry.vue`
- Find item contract: `rg -n "export type MasonryItemBase" src/masonry/types.ts`
- Find virtualization logic: `rg -n "BUCKET_PX|overscanPx|getVisibleIndicesFromBuckets" src/components src/masonry`
- Find Masonry tests: `rg -n "mount\(Masonry" tests`

## Definition of Done

- `npm run check` passes
- `npm run build && npm run build:lib && npm run build:types` pass
- If you touched UI/scrolling behavior: `npm run test:e2e`
