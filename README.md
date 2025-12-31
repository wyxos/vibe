# @wyxos/vibe

Vue 3 masonry feed component with virtualization + infinite loading.

## Demo

- Local: `npm run dev`
- Live: https://vibe.wyxos.com/

## Install

```bash
npm i @wyxos/vibe
```

## Usage

### Plugin (registers `<Masonry />` globally)

```ts
import { createApp } from 'vue'
import { VibePlugin } from '@wyxos/vibe'

createApp(App).use(VibePlugin).mount('#app')
```

### Component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Masonry } from '@wyxos/vibe'
import type { MasonryItemBase, PageToken } from '@wyxos/vibe'

type FeedItem = MasonryItemBase & {
	type: 'image' | 'video'
	preview: string
	original: string
}

const items = ref<FeedItem[]>([])

async function getContent(page: PageToken) {
	const res = await fetch(`/api/feed?page=${page}`)
	const data = await res.json()
	return { items: data.items as FeedItem[], nextPage: data.nextPage as PageToken | null }
}
</script>

<template>
	<Masonry
		v-model:items="items"
		:get-content="getContent"
		:item-width="300"
		:prefetch-threshold-px="300"
	/>
</template>
```

### Item contract

Layout requires:

- `id: string`
- `width: number`
- `height: number`

The default renderer expects media fields as well:

- `type: 'image' | 'video'`
- `preview: string` (URL)
- `original: string` (URL)

### Slots

VIBE provides two optional per-item slots:

- `#itemHeader="{ item, remove }"`
- `#itemFooter="{ item, remove }"`

### Exposed methods

Using a template ref, you can remove and restore items with transitions:

- `remove(itemOrId | array)`
- `undo()` (undo last removal batch)
- `restore(itemOrId | array)`

## Props

- `getContent(pageToken) => { items, nextPage }` (required)
- `mode`: `'default' | 'backfill'`
- `pageSize`, `backfillRequestDelayMs`
- `itemWidth`, `gapX`, `gapY`
- `prefetchThresholdPx`, `overscanPx`
- `headerHeight`, `footerHeight`

## Local library build

- JS bundles: `npm run build:lib`
- Types: `npm run build:types`
