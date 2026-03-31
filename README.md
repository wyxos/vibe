# VIBE

VIBE is a styled Vue 3 masonry feed component for large, scroll-heavy media timelines. It ships virtualization, infinite loading, optional backfill mode, removal and undo flows, and resume support for restored sessions.

## Install

```bash
npm i @wyxos/vibe
```

VIBE ships compiled CSS. Import it once in your app entry or in the component that mounts the feed:

```ts
import '@wyxos/vibe/style.css'
```

Tailwind scanning is not required for the package UI.

## Direct imports

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  Masonry,
  MasonryItem,
  type GetContentFn,
  type MasonryInstance,
  type MasonryItemBase,
} from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

type FeedItem = MasonryItemBase & {
  preview: string
  original: string
  type?: 'image' | 'video'
}

const items = ref<FeedItem[]>([])
const masonry = ref<MasonryInstance | null>(null)

const getContent: GetContentFn<FeedItem> = async (pageToken) => {
  const response = await fetch(`/api/feed?page=${pageToken}`)
  return await response.json()
}
</script>

<template>
  <div class="app-shell">
    <Masonry
      ref="masonry"
      v-model:items="items"
      :get-content="getContent"
      :page="1"
      :header-height="40"
      :footer-height="44"
    >
      <MasonryItem>
        <template #header="{ item }">
          <div class="card-bar">{{ item.id }}</div>
        </template>

        <template #overlay="{ item, remove }">
          <div class="card-overlay">
            <span>{{ item.type ?? 'image' }}</span>
            <button type="button" @click="remove()">Remove</button>
          </div>
        </template>
      </MasonryItem>
    </Masonry>
  </div>
</template>

<style>
.app-shell {
  height: 100vh;
  display: flex;
  min-height: 0;
}

.app-shell > * {
  flex: 1 1 auto;
  min-height: 0;
}

.card-bar,
.card-overlay {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 1rem;
}
</style>
```

The mounted `Masonry` element must have a real height. If it sits inside a flex layout, give the flex child `min-height: 0`.

## Plugin install

```ts
import { createApp } from 'vue'
import { VibePlugin } from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

import App from './App.vue'

const app = createApp(App)
app.use(VibePlugin)
app.mount('#app')
```

## Item contract

Every item needs these layout fields:

- `id: string`
- `width: number`
- `height: number`

If you use the built-in media loader, each item should also include:

- `preview: string`
- `original: string`
- `type?: string`

Use `type: 'video'` for video items. If `type` is omitted, the built-in loader treats the item as image-like content.

The exported base type is:

```ts
type MasonryItemBase = {
  id: string
  width: number
  height: number
  originalIndex?: number
  type?: string
  preview?: string
  original?: string
  [key: string]: unknown
}
```

## Slots

`Masonry` reads a single child `MasonryItem` definition and uses these named slots:

- `#header="{ item, remove }"`: top bar content for each card
- `#loader="{ item, remove }"`: custom pending-state content inside the media area
- `#overlay="{ item, remove }"`: body content rendered between the media and the footer
- `#error="{ item, remove, error }"`: custom error-state content for failed media
- `#footer="{ item, remove }"`: bottom bar content for each card

`#default` is no longer supported for item bodies. Migrate old item content to `#overlay`.

## Props

### Feed control

- `getContent`: required async function with the shape `async (pageToken) => ({ items, nextPage })`
- `v-model:items`: controlled list of items currently rendered by the feed
- `page`: starting page token or the next page token after a reset. Default: `1`
- `restoredPages`: previously loaded page token or tokens when resuming an already-restored feed

### Backfill

- `mode`: `'default' | 'backfill'`. Default: `'default'`
- `pageSize`: target count per batch when backfilling. Default: `20`
- `backfillRequestDelayMs`: cooldown between backfill requests. Default: `2000`

### Layout

- `itemWidth`: target column width. Default: `300`
- `prefetchThresholdPx`: distance from the bottom before requesting the next page. Default: `200`
- `gapX`: horizontal gap between cards. Default: `16`
- `gapY`: vertical gap between cards. Default: `16`
- `headerHeight`: reserved header height per item. Default: `0`
- `footerHeight`: reserved footer height per item. Default: `0`
- `overscanPx`: extra vertical render range above and below the viewport. Default: `600`

### Motion

- `enterStaggerMs`: stagger delay for enter animations. Default: `40`

## Events

- `update:items`: emitted whenever the component mutates the feed array through removal, restore, undo, or new page loads
- `preloaded`: batched array of items whose media finished loading
- `failures`: batched array of `{ item, error }` payloads for failed media
- `removed`: `{ items, ids }` payload after one or more items are removed from the feed

## Exposed instance API

Get a component ref and use the exported `MasonryInstance` type:

```ts
import { ref } from 'vue'
import type { MasonryInstance } from '@wyxos/vibe'

const masonry = ref<MasonryInstance | null>(null)
```

Available methods and state:

- `remove(itemsOrIds)`: remove one item, one id, or an array of either
- `restore(itemsOrIds)`: restore previously removed items
- `undo()`: restore the most recent removal batch
- `forget(itemsOrIds)`: clear removed items from the undo buffer
- `loadNextPage()`: trigger the next page request immediately
- `cancel()`: cancel the active request flow
- `pagesLoaded`: array of page tokens already loaded by the feed
- `nextPage`: next page token or `null` when the feed has reached the end
- `isLoading`: `true` while the initial or next-page request is running
- `hasReachedEnd`: `true` when no more content remains
- `backfillStats`: backfill-only state with cooldown, progress, and fetch totals

## Backfill mode

Use backfill mode when your source can return short pages because of filtering, moderation, or "already seen" exclusions.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Masonry, MasonryItem } from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

const items = ref([])

async function getContent(pageToken: number) {
  return fetchBackfillPage(pageToken)
}
</script>

<template>
  <Masonry
    v-model:items="items"
    mode="backfill"
    :page-size="20"
    :backfill-request-delay-ms="2000"
    :get-content="getContent"
    :page="1"
  >
    <MasonryItem>
      <template #overlay="{ item }">{{ item.id }}</template>
    </MasonryItem>
  </Masonry>
</template>
```

## Resume / restored state

If the parent has already restored pages and items from persistence, pass both the restored item list and the pagination state back into `Masonry`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Masonry, MasonryItem, type MasonryRestoredPages } from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

const items = ref(await restoreItemsFromStorage())
const restoredPages = ref<MasonryRestoredPages>(5)
const nextPage = ref(6)

async function getContent(pageToken: number) {
  return fetchPage(pageToken)
}
</script>

<template>
  <Masonry
    v-model:items="items"
    :get-content="getContent"
    :page="nextPage"
    :restored-pages="restoredPages"
  >
    <MasonryItem>
      <template #overlay="{ item }">{{ item.id }}</template>
    </MasonryItem>
  </Masonry>
</template>
```

## Low-level exports

`MasonryVideoControls` is also exported for advanced custom video UIs, but most apps can treat it as a low-level helper and rely on the built-in controls rendered by `MasonryLoader`.

## Local development

- `npm run dev`
- `npm run check`
- `npm run build`
- `npm run build:lib`
- `npm run build:types`

## Demo

- Local: `npm run dev`
- Live: [vibe.wyxos.com](https://vibe.wyxos.com/)
