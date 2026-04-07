# AGENTS.md (root)

## Project Snapshot

**Repo type**: single package (Vue 3 library + demo app)

**Stack**: Vue 3 + TypeScript + Vite + Tailwind CSS 4; lint via ESLint.

**Nearest-wins docs**: detailed guidance lives in sub-folder AGENTS.md files.

## Root Setup Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run build:lib
npm run build:types
```

## Universal Conventions

- **Never edit `lib/`** (generated output). Source of truth is `src/`.
- Prefer `@/` imports for internal demo/source files. Use relative imports from `src/index.ts` when it keeps generated declarations portable.
- Keep reusable library code in `src/components/`; keep the public package surface in `src/index.ts`.
- Keep demo-only composition in `src/App.vue` and `src/style.css`.
- Avoid backward-compat shims unless explicitly requested.

## Security & Secrets

- Don’t commit tokens/keys. If secrets are introduced, put them in `.env` (gitignored) and document required vars in README.

## JIT Index (what to open, not what to paste)

- Source overview: `src/` → see `src/AGENTS.md`
- Public entrypoint: `src/index.ts`
- Demo shell: `src/App.vue`
- Public components: `src/components/Vibe.vue`

## Definition of Done

- `npm run check` passes
- `npm run build && npm run build:lib && npm run build:types` pass

## WSL + Herd Runtime
- Environment assumption: commands run from WSL on a Windows host where Laravel Herd manages primary PHP/Laravel services.
- Before PHP/Laravel tasks, verify runtime resolution (`which php`, `php -v`).
- If binaries/services are not available in WSL PATH, use Windows/Herd-aware invocation paths as needed.
- For DB/service operations, confirm whether runtime/services are Windows-hosted before executing maintenance/debug commands.
