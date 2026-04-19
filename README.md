# Vibe

Vibe is an opinionated Vue 3 mixed-media feed and viewer engine for large datasets.

It is built for apps that need a virtualized desktop feed, fullscreen browsing, library-owned paging, removals, retries, and asset-failure handling without stitching together a masonry grid, lightbox, and feed state by hand.

![Vibe desktop feed surface](./docs/readme-hero.jpg)

[Live demo](https://vibe.wyxos.com/) · [In-app docs](https://vibe.wyxos.com/documentation)

## Built for

Vibe is built for applications that browse large mixed-media collections and need feed state to stay coherent as items load, fail, disappear, and move between desktop and fullscreen surfaces.

It owns paging, fullscreen browsing, removals, retries, and asset-failure handling as part of one viewer model so those behaviors stay consistent under real feed pressure.

Vibe is hardened in production through [Atlas](https://github.com/wyxos/atlas) as a downstream consumer.

## When Vibe fits

Use Vibe when your app needs:

- a large mixed-media feed of images, video, audio, and document-like items
- library-owned paging driven by opaque cursors
- a desktop masonry surface that opens into fullscreen
- fullscreen-first behavior on mobile and tablet
- built-in remove, restore, undo, retry, and asset-failure handling
- a small customization surface through slots instead of a headless rendering API

## Quick start

Install the package and import the bundled stylesheet once:

```bash
npm i @wyxos/vibe
```

```ts
import '@wyxos/vibe/style.css'
```

Tailwind scanning is not required for the package UI.

### Plugin install

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

### Direct import

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

## Core concepts

### Item contract

Vibe keeps the item contract deliberately small:

```ts
type VibeViewerItem = {
  id: string
  type: 'image' | 'video' | 'audio' | 'other'
  title?: string
  url: string
  preview?: {
    url: string
    width?: number
    height?: number
    mediaType?: 'image' | 'video'
  }
  healthCheck?: {
    url: string
    kind?: 'playback'
  } | null
  width?: number
  height?: number
  [key: string]: unknown
}
```

Notes:

- grid mode prefers `preview.url`, then falls back to `url`
- fullscreen mode uses `url`
- grid layout prefers preview dimensions, then root dimensions, then a square fallback tile
- `other` stays intentionally broad so the consuming app can layer its own file subtypes and icon logic on top
- `healthCheck` is optional and lets the app provide an explicit asset probe, for example when preview URLs are not enough to classify playback health reliably

### Resolve and feed state

Use `resolve` when you want Vibe to own the paging loop:

```ts
type VibeResolveParams = {
  cursor: string | null
  pageSize: number
  signal?: AbortSignal
}

type VibeResolveResult = {
  items: VibeViewerItem[]
  nextPage: string | null
  previousPage?: string | null
}
```

Vibe owns:

- loaded items
- active index
- next-page prefetch
- optional previous-page loading
- duplicate cursor protection
- initial retry state
- removal-aware feed navigation

### Default paging behavior

Vibe has one built-in paging model:

- if a resolve returns fewer visible items than `pageSize`, Vibe enters a fill loop
- it waits `fillDelayMs`, then `fillDelayMs + fillDelayStepMs`, and so on for each chained request
- it keeps accumulating results until the collected count reaches `pageSize` or there is no further cursor
- then it commits that batch into the layout once
- before advancing at the bottom or top, Vibe checks whether the current boundary page is underfilled after local removals
- if it is, Vibe reloads that same cursor in place first and reconciles only that page's content in the grid
- if that boundary refresh comes back empty, the same boundary attempt can continue to the next or previous cursor
- when the trailing edge is exhausted, another bottom-edge attempt reloads the trailing cursor so newly available pages can be discovered

Example:

```vue
<VibeLayout
  :resolve="resolve"
  :page-size="25"
  :fill-delay-ms="2000"
  :fill-delay-step-ms="1000"
  :show-end-badge="false"
  :show-status-badges="false"
/>
```

### Seeded hydration

Use `initialState` when the app already knows a restored slice of the feed and wants Vibe to hydrate from that snapshot immediately:

```vue
<VibeLayout
  :resolve="resolve"
  :initial-state="{
    cursor: 'page-10',
    items: restoredItems,
    nextCursor: 'page-11',
    previousCursor: 'page-9',
    activeIndex: 4,
  }"
/>
```

Notes:

- `resolve` is optional if you only need a seeded snapshot
- when `resolve` is present, Vibe continues paging from the seeded cursors

### Surface behavior

- desktop starts in the masonry list surface
- clicking a grid tile opens fullscreen
- `Escape` returns from fullscreen to the list on desktop
- mobile and tablet always force fullscreen
- grid uses preview assets and in-view loading
- fullscreen uses the original asset and shows a spinner until ready

Common behavior props:

- `surfaceMode`: lets the parent drive the desktop list/fullscreen surface explicitly
- `emptyStateMode`: controls whether empty states render inline, as a badge, or stay hidden
- `paginationDetail`: lets the parent attach app-owned cursor or page context to the built-in status UI
- `showDominantImageTone`, `loopFullscreenVideo`, `showEndBadge`, and `showStatusBadges`: tune the built-in fullscreen and status behavior without taking over the surfaces

## Customization

### Surface slots

`VibeLayout` exposes a small set of app-owned surfaces instead of a headless render API:

- `empty-state`
- `fullscreen-aside`
- `fullscreen-header-actions`
- `fullscreen-overlay`
- `fullscreen-status`
- `grid-footer`
- `grid-item-overlay`
- `grid-status`
- `item-icon`

Example:

```vue
<VibeLayout :resolve="resolve">
  <template #item-icon="{ item, icon }">
    <component :is="item.type === 'other' ? MyCustomIcon : icon" />
  </template>

  <template #grid-item-overlay="{ item, hovered }">
    <div v-if="hovered" class="absolute inset-x-0 bottom-0 p-3">
      <div class="pointer-events-auto bg-black/45 px-3 py-2 backdrop-blur">
        Like {{ item.title }}
      </div>
    </div>
  </template>

  <template #grid-footer>
    <div class="bg-black/55 px-4 py-3 backdrop-blur">
      Custom footer UI
    </div>
  </template>
</VibeLayout>
```

### Exposed handle

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

- `lockPageLoading()`
- `unlockPageLoading()`
- `loadNext()`
- `loadPrevious()`
- `retry()`
- `cancel()`
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
  fillCursor: string | null
  fillDelayRemainingMs: number | null
  fillTargetCount: number | null
  hasNextPage: boolean
  hasPreviousPage: boolean
  itemCount: number
  loadState: 'failed' | 'loaded' | 'loading'
  nextBoundaryLoadProgress: number
  nextCursor: string | null
  pageLoadingLocked: boolean
  phase: 'failed' | 'filling' | 'idle' | 'initializing' | 'loading' | 'refreshing'
  previousBoundaryLoadProgress: number
  previousCursor: string | null
  removedCount: number
  removedIds: readonly string[]
  surfaceMode: 'fullscreen' | 'list'
}
```

Example:

```ts
vibe.value?.lockPageLoading()
vibe.value?.remove(['item-2', 'item-5'])
vibe.value?.undo()
vibe.value?.unlockPageLoading()
console.log(vibe.value?.status.itemCount)
console.log(vibe.value?.status.pageLoadingLocked)
console.log(vibe.value?.status.nextBoundaryLoadProgress)
console.log(vibe.value?.status.removedIds)
```

### Events

`VibeLayout` emits:

- `update:activeIndex`
- `update:surfaceMode`
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
- built-in Vibe error surfaces allow retrying `generic` failures, but not `not-found`

## Local demo routes

Run:

```bash
npm run dev
```

Routes:

- `/` - default feed surface
- `/documentation` - in-app documentation
- `/demo/feed-behavior` - unified fill, retry, boundary refresh, removals, and paging-lock demo
- `/debug/fake-server` - fake-server inspection route

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
- source of truth is under `src/`
- the package ships compiled CSS at `@wyxos/vibe/style.css`
