# src/AGENTS.md

## Package Identity

This folder contains the **source of truth** for the rebuilt Vibe library and its demo shell.

- Library entrypoint: `src/index.ts`
- Demo shell: `src/App.vue`, `src/main.ts`, `src/router.ts`, `src/style.css`

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
- Keep demo-only composition in `src/App.vue`, routed pages in `src/pages/`, and support modules in `src/demo/`.
- Prefer `@/` imports inside demo/source files.
- Use relative imports from `src/index.ts` when exporting public package symbols.
- Don’t edit generated outputs in `lib/`.

## Touch Points / Key Files

- Library export surface: `src/index.ts`
- Demo entry: `src/main.ts`
- Demo shell: `src/App.vue`
- Demo routing: `src/router.ts`
- Main workspace: `src/pages/HomePage.vue`
- Debug surface: `src/pages/FakeServerDebugPage.vue`
- Demo helpers: `src/demo/**`
- Public component: `src/components/Layout.vue`

## Pre-PR Checks

```bash
npm run check && npm run build && npm run build:lib && npm run build:types
```

## Windows Runtime
- Environment assumption: project commands run from Windows/PowerShell on this machine; WSL is not the active project runtime.
- Use repo-local Node/npm scripts from the Windows checkout.
- Do not route project work through WSL shims, WSL paths, or `wsl2-ubuntu` unless the user explicitly asks for that path.
