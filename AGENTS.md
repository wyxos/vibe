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
npm run verify:published -- --wait
```

## Universal Conventions

- **Never edit `lib/`** (generated output). Source of truth is `src/`.
- Prefer `@/` imports for internal demo/source files. Use relative imports from `src/index.ts` when it keeps generated declarations portable.
- Keep reusable library code in `src/components/`; keep the public package surface in `src/index.ts`.
- Keep demo-only composition in `src/App.vue` and `src/style.css`.
- Avoid backward-compat shims unless explicitly requested.
- `npm run check` enforces the ESLint `max-lines` rule. Split files before they exceed 500 lines.
- After `npm run release`, verify npm visibility with `npm run verify:published -- --wait` before telling downstream consumers such as Atlas to bump. Use `npm run release:verified` when you want that wait bundled into the release command.

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

## Windows Runtime
- Environment assumption: project commands run from Windows/PowerShell on this machine; WSL is not the active project runtime.
- Use repo-local Node/npm scripts from the Windows checkout.
- Do not route project work through WSL shims, WSL paths, or `wsl2-ubuntu` unless the user explicitly asks for that path.
