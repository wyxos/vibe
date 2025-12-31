# @wyxos/vibe

A Vue 3 masonry feed component.

The demo app is the primary documentation — run it locally and explore the examples.

## Demo

- Dev: `npm run dev`

## Install

```bash
npm i @wyxos/vibe
```

## Usage

### As a plugin (registers `<Masonry />`)

```ts
import { createApp } from 'vue'
import { VibePlugin } from '@wyxos/vibe'

createApp(App).use(VibePlugin).mount('#app')
```

### As a component

```ts
import { Masonry } from '@wyxos/vibe'
```

### Types

```ts
import type { MasonryItemBase, GetContentFn, GetContentResult, PageToken } from '@wyxos/vibe'
```

## Item contract

Each item must include:

- `id: string`
- `width: number`
- `height: number`

Optional fields like `type`, `preview`, and `original` are used by the demo only.

## Local library build

- Build JS bundles: `npm run build:lib`
- Emit declarations: `npm run build:types`
