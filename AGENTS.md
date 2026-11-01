# AGENTS.md (root)

## Project Snapshot

**Repo type**: Vue 3 library package with a separate public showcase consumer in `site/`.

**Stack**: Vue 3 + TypeScript + Vite + Tailwind CSS 4; lint via ESLint.

## Root Setup Commands

```bash
npm install
npm run dev
npm run dev:lib
npm run check
npm run build
npm run build:lib
npm run build:types
npm run verify:published -- --wait
```

## Universal Conventions

- **Never edit `lib/`** (generated output). Source of truth is `src/`.
- Use relative imports within library source to keep generated declarations portable. Unit tests use the configured `@/` alias.
- Keep reusable library code in `src/components/`; keep the public package surface in `src/index.ts`.
- Keep browser-only test fixtures in `tests/browser/`; use synthetic local assets and the public library API. They are not a public site or package export.
- Keep the public showcase in `site/`, outside library source and package exports. Its original media and generation records live in `site/public/media/`; preserve independent regression fixtures in `tests/`.
- Keep private curated selections ignored. Public showcase assets need explicit provenance; public availability alone does not establish reuse permission.
- Publishing the showcase to `vibe.wyxos.com` requires the user's review and explicit publication instruction.
- Avoid backward-compat shims unless explicitly requested.
- `npm run check` enforces the ESLint `max-lines` rule. Split files before they exceed 500 lines.
- After `npm run release`, verify npm visibility with `npm run verify:published -- --wait` before telling downstream consumers such as Atlas to bump. Use `npm run release:verified` when you want that wait bundled into the release command.

## Security & Secrets

- Don’t commit tokens/keys. Keep local secrets in ignored configuration; the library does not require application credentials.

## JIT Index (what to open, not what to paste)

- Public entrypoint: `src/index.ts`
- Library implementation: `src/core/` and `src/components/`
- Shared library styles: `src/vibe.css`
- Browser fixture: `tests/browser/`
- Public showcase: `site/App.vue`; showcase browser checks: `tests/site/`

## Definition of Done

- `npm run check` passes
- `npm run build && npm run build:lib && npm run build:types` pass
- `npm run test:unit`, `npm run test:runner`, `npm run test:e2e`, `npm run test:e2e:built`, and `npm run check:package` pass.
- `npm run dev` serves the showcase and chooses a free port; `npm run dev:lib` watches library bundles and declarations. Library browser checks use their own synthetic fixture server and verify source and built artifacts.
- Showcase changes also require `npm run build:site:dev` and `npm run test:site`, with desktop and phone evidence. The package remains library-only.

## Windows Runtime
- Environment assumption: project commands run from Windows/PowerShell on this machine; WSL is not the active project runtime.
- Use repo-local Node/npm scripts from the Windows checkout.
- Do not route project work through WSL shims, WSL paths, or `wsl2-ubuntu` unless the user explicitly asks for that path.
