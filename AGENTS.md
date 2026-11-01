# AGENTS.md (root)

## Project Snapshot

**Repo type**: single Vue 3 library package. Public documentation and demo applications are not part of this checkout.

**Stack**: Vue 3 + TypeScript + Vite + Tailwind CSS 4; lint via ESLint.

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
- Use relative imports within library source to keep generated declarations portable. Unit tests use the configured `@/` alias.
- Keep reusable library code in `src/components/`; keep the public package surface in `src/index.ts`.
- Keep browser-only test fixtures in `tests/browser/`; use synthetic local assets and the public library API. They are not a public site or package export.
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

## Definition of Done

- `npm run check` passes
- `npm run build && npm run build:lib && npm run build:types` pass
- `npm run test:unit`, `npm run test:runner`, `npm run test:e2e`, `npm run test:e2e:built`, and `npm run check:package` pass.
- `npm run dev` watches the library build; it does not start a public demo. Browser checks use their own local synthetic fixture server and verify both source and built library artifacts.

## Windows Runtime
- Environment assumption: project commands run from Windows/PowerShell on this machine; WSL is not the active project runtime.
- Use repo-local Node/npm scripts from the Windows checkout.
- Do not route project work through WSL shims, WSL paths, or `wsl2-ubuntu` unless the user explicitly asks for that path.
