# Vibe

Vibe `0.3.0` is now a blank rebuild workspace. The old masonry implementation has been removed and replaced with a minimal Vue 3 + Vite + TypeScript + Tailwind CSS 4 foundation.

## Stack

- Vue 3
- Vite
- TypeScript
- Tailwind CSS 4
- ESLint

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run check
npm run build
npm run build:lib
npm run build:types
```

## Package surface

The package currently exports a single placeholder component and plugin from `src/index.ts`:

- `VibeRoot`
- `VibePlugin`
- default export: `VibeRoot`

Compiled CSS is emitted to `lib/style.css` during the library build.

## Project layout

- `src/App.vue`: blank demo shell
- `src/components/VibeRoot.vue`: placeholder exported component
- `src/index.ts`: package entrypoint
- `src/style.css`: Tailwind import and app-level styles
- `vite.config.ts`: demo build config
- `vite.config.lib.ts`: library build config

## Notes

- `lib/` is generated output. Do not edit it directly.
- Tailwind is configured through `@tailwindcss/vite`, so no separate Tailwind config file is required for this baseline.
