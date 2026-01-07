<p align="center">
  <img src="public/logo.svg" width="120" alt="VIBE logo" />
</p>
<h1 align="center">VIBE</h1>
<p align="center">
  <img src="demo.webp" alt="VIBE demo" />
</p>

VIBE (Vue Infinite Block Engine) is a high-performance masonry feed component for Vue 3.

It’s built for large, scroll-heavy media feeds and aims to stay smooth with thousands of items.

## Highlights

- Virtualized rendering (keeps DOM small)
- Infinite loading via an async `getContent(pageToken) => { items, nextPage }`
- Optional backfill mode to reach a target `pageSize`
- Smooth removal + reorder transitions, with `remove` / `undo` / `restore`
- Preserves a single DOM sequence (no column re-parenting)
- Item templates via `<MasonryItem>` with `#header` / `#default` / `#footer`

## Demo

- Local: `npm run dev`
- Live: https://vibe.wyxos.com/

## Install

```bash
npm i @wyxos/vibe
```

## Simple integration (minimal)

Minimal example with the required scrolling container CSS and a simple `getContent(page)`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Masonry, MasonryItem } from '@wyxos/vibe'

type Item = { id: string; width: number; height: number }

const items = ref<Item[]>([])

async function getContent(page: number) {
	// Replace with your server/API call.
	const pageSize = 20
	const newItems: Item[] = Array.from({ length: pageSize }, (_, i) => ({
		id: `${page}-${i}`,
		width: 640,
		height: 480,
	}))

	return {
		items: newItems,
		nextPage: page + 1,
	}
}
</script>

<template>
	<div class="app">
		<Masonry class="masonry" v-model:items="items" :get-content="getContent" :page="1">
			<MasonryItem>
				<template #default="{ item }">
					<div>{{ item.id }}</div>
				</template>
			</MasonryItem>
		</Masonry>
	</div>
</template>

<style>
.app {
	height: 100vh;
	display: flex;
	flex-direction: column;
}

/* Required: gives the Masonry internal scroll viewport a real height */
.masonry {
	flex: 1 1 auto;
	min-height: 0;
}
</style>
```

> **Warning**
> Each item must include `{ id, width, height }` so the layout can be calculated.

## Local library build

- JS bundles: `npm run build:lib`
- Types: `npm run build:types`
