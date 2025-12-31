# @wyxos/vibe

VIBE is a Vue 3 masonry feed component built for large, scroll-heavy image/video feeds.

It exists because most “feed” implementations eventually hit the same problems:

- Long scrolling sessions get slow (too many mounted nodes)
- Tabs crash (memory grows with the DOM)
- New content arrives too late (no prefetch)
- Removing items feels jarring (no smooth removal/move transitions)
- Column-based DOM re-parenting breaks reading order

VIBE focuses on keeping the DOM small (virtualization), prefetching before you hit the end, and preserving a single DOM sequence while still laying out as masonry.

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

The built-in card renderer (current default) expects media fields as well:

- `type: 'image' | 'video'`
- `preview: string` (URL)
- `original: string` (URL)

### Slots

VIBE provides two optional per-item slots:

- `#itemHeader="{ item, remove }"`
- `#itemFooter="{ item, remove }"`

Example:

```vue
<Masonry v-model:items="items" :get-content="getContent">
	<template #itemHeader="{ item, remove }">
		<div class="flex items-center justify-between px-3 py-2">
			<div class="text-xs text-slate-600">{{ item.id }}</div>
			<button class="text-xs text-red-600" @click="remove()">Remove</button>
		</div>
	</template>

	<template #itemFooter="{ item }">
		<div class="px-3 py-2 text-xs text-slate-600">{{ item.width }}×{{ item.height }}</div>
	</template>
</Masonry>
```

### Exposed methods

Using a template ref, you can remove and restore items with transitions:

- `remove(itemOrId | array)`
- `undo()` (undo the last removal batch)
- `restore(itemOrId | array)`

## Props (high level)

- `getContent(pageToken) => { items, nextPage }` (required)
- `mode`: `'default' | 'backfill'`
- `pageSize`: target items/page (used for backfill)
- `prefetchThresholdPx`: prefetch before reaching the end
- `itemWidth`, `gapX`, `gapY`, `headerHeight`, `footerHeight`, `overscanPx`

## Local library build

- JS bundles: `npm run build:lib`
- Types: `npm run build:types`
