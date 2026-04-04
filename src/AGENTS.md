# src/AGENTS.md

## Package Identity

This folder contains the **source of truth** for the rebuilt Vibe library and its demo shell.

- Library entrypoint: `src/index.ts`
- Demo shell: `src/App.vue`, `src/main.ts`, `src/style.css`

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

- Keep reusable library behavior in `src/components/`.
- Keep demo-only composition in `src/App.vue`.
- Prefer `@/` imports inside demo/source files.
- Use relative imports from `src/index.ts` when exporting public package symbols.
- Don’t edit generated outputs in `lib/`.

## Touch Points / Key Files

- Library export surface: `src/index.ts`
- Demo entry: `src/main.ts`
- Demo shell: `src/App.vue`
- Public component: `src/components/VibeRoot.vue`

## Pre-PR Checks

```bash
npm run check && npm run build && npm run build:lib && npm run build:types
```

## WSL + Herd Runtime
- Environment assumption: commands run from WSL on a Windows host where Laravel Herd manages primary PHP/Laravel services.
- Before PHP/Laravel tasks, verify runtime resolution (`which php`, `php -v`).
- If binaries/services are not available in WSL PATH, use Windows/Herd-aware invocation paths as needed.
- For DB/service operations, confirm whether runtime/services are Windows-hosted before executing maintenance/debug commands.
