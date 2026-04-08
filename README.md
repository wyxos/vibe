# Vibe

Vibe is a Vue 3 media viewer for large feeds of mixed image, video, audio, and other items.

It ships two built-in surfaces:

- Desktop: a virtualized masonry grid that opens into fullscreen
- Mobile and tablet: fullscreen only

The current `0.3.0` rebuild focuses on a strict item contract, library-owned loading, strong demo coverage, and a small customization surface.

## Install

```bash
npm i @wyxos/vibe
```

Import the bundled stylesheet once:

```ts
import '@wyxos/vibe/style.css'
```

Tailwind scanning is not required for the package UI.

## Plugin install

The default export is the plugin:

```ts
import { createApp } from 'vue'
import App from './App.vue'

import Vibe from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

createApp(App)
  .use(Vibe)
  .mount('#app')
```

That registers the global component as `VibeLayout`.

## Direct import

If you prefer local registration, import `VibeLayout` directly:

```vue
<script setup lang="ts">
import {
  VibeLayout,
  type VibeResolveParams,
  type VibeResolveResult,
} from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

async function resolve({ cursor, pageSize }: VibeResolveParams): Promise<VibeResolveResult> {
  const response = await fetch(`/api/feed?cursor=${cursor ?? ''}&pageSize=${pageSize}`)
  return await response.json()
}
</script>

<template>
  <VibeLayout :resolve="resolve" />
</template>
```

Optional auto-mode pacing props:

```vue
<VibeLayout
  :resolve="resolve"
  :fill-delay-ms="1000"
  :fill-delay-step-ms="250"
/>
```

- `fill-delay-ms`: base delay before the first chained fill request
- `fill-delay-step-ms`: extra delay added for each additional chained fill request in the same fill cycle

Optional auto-mode feed strategy:

```vue
<VibeLayout
  :resolve="resolve"
  mode="dynamic"
/>
```

- `dynamic` is the default
- `static` reloads the current boundary cursor before advancing when the currently visible boundary page is underfilled

## What Vibe does

- Desktop masonry list with virtualization and staged page growth
- Fullscreen viewer with swipe, wheel, keyboard, and custom media controls
- Auto-loading mode with internal pagination ownership
- Controlled mode for advanced/manual integrations
- Remove, restore, and undo by item `id`
- Grid customization through slots for icons, overlays, and footer UI
- Built-in loading and preload error states, including explicit `404` when known

## Item contract

Vibe only requires a minimal item shape:

```ts
type VibeViewerItem = {
  id: string
  type: 'image' | 'video' | 'audio' | 'other'
  title?: string
  url: string
  width?: number
  height?: number
  preview?: {
    url: string
    width?: number
    height?: number
  }
  [key: string]: unknown
}
```

Notes:

- Grid mode prefers `preview.url`, then falls back to `url`
- Fullscreen mode uses `url`
- Grid layout prefers `preview.width/height`, then root `width/height`, then a square fallback tile
- `other` is intentionally broad so the consuming app can layer its own subtypes and icon logic on top

## Loading modes

### Auto mode

Use `resolve` when you want Vibe to own the paging loop:

```ts
type VibeResolveParams = {
  cursor: string | null
  pageSize: number
}

type VibeResolveResult = {
  items: VibeViewerItem[]
  nextPage: string | null
  previousPage?: string | null
}
```

```vue
<script setup lang="ts">
import {
  VibeLayout,
  type VibeResolveParams,
  type VibeResolveResult,
} from '@wyxos/vibe'

async function resolve({ cursor, pageSize }: VibeResolveParams): Promise<VibeResolveResult> {
  const response = await fetch(`/api/feed?cursor=${cursor ?? ''}&pageSize=${pageSize}`)
  return await response.json()
}
</script>

<template>
  <VibeLayout :resolve="resolve" />
</template>
```

In this mode, Vibe owns:

- loaded items
- active index
- next-page prefetch
- optional previous-page loading
- duplicate cursor protection
- initial retry state

Auto mode also supports two feed strategies:

- `dynamic`:
  - default behavior
  - if a resolve returns fewer items than `pageSize`, Vibe enters a fill loop
  - it waits `fillDelayMs`, then `fillDelayMs + fillDelayStepMs`, and so on for each chained request
  - it keeps accumulating results until the collected count reaches `pageSize` or there is no further cursor
  - then it commits that batch into the layout once
- `static`:
  - before advancing at the bottom or top, Vibe checks whether the current boundary page is underfilled after local removals
  - if it is, Vibe reloads that same cursor in place first
  - only once that boundary page is full again will the next edge hit advance to the next or previous cursor

### Controlled mode

Use controlled mode when the app needs to own item aggregation or paging policy:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VibeLayout, type VibeViewerItem } from '@wyxos/vibe'

const items = ref<VibeViewerItem[]>([])
const activeIndex = ref(0)
const loading = ref(false)
const hasNextPage = ref(true)
const hasPreviousPage = ref(false)

async function requestNextPage() {
  // app-owned fetch and append
}

async function requestPreviousPage() {
  // app-owned fetch and prepend
}
</script>

<template>
  <VibeLayout
    :items="items"
    :active-index="activeIndex"
    :loading="loading"
    :has-next-page="hasNextPage"
    :has-previous-page="hasPreviousPage"
    pagination-detail="P10-12 · V11"
    :request-next-page="requestNextPage"
    :request-previous-page="requestPreviousPage"
    @update:active-index="activeIndex = $event"
  />
</template>
```

## Slots

`VibeLayout` exposes three customization slots:

### `#item-icon`

Lets the app replace the fallback icon, especially useful for `other` items.

Slot props:

- `item`
- `icon`

```vue
<VibeLayout :resolve="resolve">
  <template #item-icon="{ item, icon }">
    <component :is="item.type === 'other' ? MyCustomIcon : icon" />
  </template>
</VibeLayout>
```

### `#grid-item-overlay`

Desktop grid-only overlay content for reactions, menus, badges, and similar controls.

Slot props:

- `item`
- `index`
- `active`
- `hovered`
- `focused`
- `openFullscreen`

```vue
<VibeLayout :resolve="resolve">
  <template #grid-item-overlay="{ item, hovered }">
    <div v-if="hovered" class="absolute inset-x-0 bottom-0 p-3">
      <div class="pointer-events-auto bg-black/45 px-3 py-2 backdrop-blur">
        {{ item.title }}
      </div>
    </div>
  </template>
</VibeLayout>
```

### `#grid-footer`

Desktop grid-only footer surface for app-owned status bars or controls.

```vue
<VibeLayout :resolve="resolve">
  <template #grid-footer>
    <div class="bg-black/55 px-4 py-3 backdrop-blur">
      Custom footer UI
    </div>
  </template>
</VibeLayout>
```

## Exposed handle

Get a component ref and use `VibeHandle`:

```ts
import { ref } from 'vue'
import type { VibeHandle } from '@wyxos/vibe'

const vibe = ref<VibeHandle | null>(null)
```

```vue
<VibeLayout ref="vibe" :resolve="resolve" />
```

Available methods:

- `remove(ids)`
- `restore(ids)`
- `undo()`
- `getRemovedIds()`
- `clearRemoved()`

Available state:

```ts
type VibeStatus = {
  activeIndex: number
  currentCursor: string | null
  errorMessage: string | null
  fillCollectedCount: number | null
  fillDelayRemainingMs: number | null
  fillTargetCount: number | null
  hasNextPage: boolean
  hasPreviousPage: boolean
  isAutoMode: boolean
  itemCount: number
  loadState: 'failed' | 'loaded' | 'loading'
  mode: 'dynamic' | 'static' | null
  nextCursor: string | null
  phase: 'failed' | 'filling' | 'idle' | 'loading' | 'reloading'
  previousCursor: string | null
  removedCount: number
  surfaceMode: 'fullscreen' | 'list'
}
```

Example:

```ts
vibe.value?.remove(['item-2', 'item-5'])
vibe.value?.undo()
console.log(vibe.value?.status.itemCount)
```

## Events

`VibeLayout` emits:

- `update:activeIndex`
- `asset-loads`
- `asset-errors`

`asset-loads` is micro-batched and emits an array payload:

```ts
type VibeAssetLoadEvent = {
  item: VibeViewerItem
  occurrenceKey: string
  url: string
  surface: 'grid' | 'fullscreen'
}
```

`asset-errors` is micro-batched and emits an array payload:

```ts
type VibeAssetErrorEvent = {
  item: VibeViewerItem
  occurrenceKey: string
  url: string
  kind: 'generic' | 'not-found'
  surface: 'grid' | 'fullscreen'
}
```

Example:

```vue
<script setup lang="ts">
import type { VibeAssetErrorEvent, VibeAssetLoadEvent } from '@wyxos/vibe'

function onAssetLoads(loads: VibeAssetLoadEvent[]) {
  console.log(loads)
}

function onAssetErrors(errors: VibeAssetErrorEvent[]) {
  console.log(errors)
}
</script>

<template>
  <VibeLayout
    :resolve="resolve"
    @asset-loads="onAssetLoads"
    @asset-errors="onAssetErrors"
  />
</template>
```

Notes:

- successful loads that happen close together are batched into one event
- grid load events usually report `preview.url` when a preview exists
- fullscreen load events report `item.url`
- multiple failures that happen close together are batched into one event
- identical failures are deduped inside the same batch
- if the same item fails again later, it can emit again in a later batch

## Surface behavior

- Desktop starts in the masonry grid
- Clicking a grid tile opens fullscreen
- `Escape` returns from fullscreen to grid on desktop
- Mobile and tablet always force fullscreen
- Grid uses preview assets and in-view loading
- Fullscreen uses the original asset and shows a spinner until ready

## Local demo routes

Run:

```bash
npm run dev
```

Routes:

- `/` – clean default demo
- `/documentation` – in-app documentation
- `/demo/dynamic-feed` – dynamic feed fill-loop demo
- `/demo/advanced-integration` – advanced static integration demo
- `/debug/fake-server` – fake-server inspection route

## Local development

```bash
npm run check
npm run build
npm run build:lib
npm run build:types
npm run test:unit
npm run test:e2e
```

## Notes

- `lib/` is generated output
- Source of truth is under `src/`
- The package ships compiled CSS at `@wyxos/vibe/style.css`
