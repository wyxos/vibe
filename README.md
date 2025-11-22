# VIBE — Vue Infinite Block Engine

[![npm](https://img.shields.io/npm/v/@wyxos/vibe?color=%2300c58e&label=npm)](https://www.npmjs.com/package/@wyxos/vibe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?logo=githubpages)](https://wyxos.github.io/vibe/)

A high-performance, responsive masonry layout engine for Vue 3 with built-in infinite scrolling and virtualization.

VIBE (Vue Infinite Block Engine) is designed for applications that need to display large datasets in a masonry grid without compromising performance. Unlike other masonry libraries, VIBE leverages virtualization to render only what is visible on the screen, ensuring smooth scrolling even with thousands of items.

---

## Features

- **High Performance Virtualization**: Efficiently renders thousands of items by only mounting elements currently in the viewport.
- **Responsive Masonry Layout**: Automatically adjusts column counts and layout based on screen width and breakpoints.
- **Infinite Scrolling**: Seamlessly loads more content as the user scrolls, with built-in support for async data fetching.
- **Dynamic Updates**: Supports adding, removing, and reflowing items with smooth FLIP animations.
- **Scroll Position Maintenance**: Keeps the user's scroll position stable when new items are loaded or the layout changes.
- **Built-in Item Component**: Includes a production-ready `MasonryItem` with image preloading, error handling, and hover effects.
- **Customizable Rendering**: Full control over item markup via scoped slots.

---

## Installation

```bash
npm install @wyxos/vibe
```

---

## Usage

### Basic Usage (Default Item)

By default, VIBE uses the built-in `MasonryItem` component, which handles image loading and provides a clean UI.

```vue
<script setup>
  import { ref } from 'vue'
  import { Masonry } from '@wyxos/vibe'

  const items = ref([])
  
  // Layout configuration
  const layout = {
    gutterX: 12,
    gutterY: 12,
    sizes: { base: 1, sm: 2, md: 3, lg: 4 }
  }

  async function getNextPage(page) {
    const response = await fetch(`/api/items?page=${page}`)
    const data = await response.json()
    // Items must have a 'src' property for the default MasonryItem
    return {
      items: data.items,
      nextPage: page + 1
    }
  }
</script>

<template>
  <Masonry
      v-model:items="items"
      :get-next-page="getNextPage"
      :layout="layout"
  />
</template>
```

### Custom Item Rendering

You can fully customize the item rendering using the `#item` slot. You can also import and use `MasonryItem` inside the slot if you want to wrap it or extend it.

```vue
<script setup>
  import { Masonry, MasonryItem } from '@wyxos/vibe'
  // ... setup code ...
</script>

<template>
  <Masonry
      v-model:items="items"
      :get-next-page="getNextPage"
      :layout="layout"
  >
    <template #item="{ item, remove }">
      <!-- Custom container -->
      <div class="custom-card">
        <!-- You can use the built-in item or your own -->
        <MasonryItem :item="item" :remove="remove">
           <!-- Optional: MasonryItem also has a default slot for overlays -->
           <div class="absolute bottom-0 p-2 text-white">
             {{ item.title }}
           </div>
        </MasonryItem>
      </div>
    </template>
  </Masonry>
</template>
```

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `Array` | Yes | Two-way bound item array. Each item must include `width`, `height`, and `id`. |
| `getNextPage` | `Function(page: Number)` | Yes | Async function to load the next page. Must return `{ items, nextPage }`. |
| `layout` | `Object` | No | Configuration object for layout, including sizes and gutters. |
| `loadAtPage` | `Number` | No | The starting page number (default: `1`). |
| `paginationType` | `String` | No | `'page'` or `'cursor'` (default: `'page'`). |
| `pageSize` | `Number` | No | Number of items per page, used for backfilling (default: `40`). |

### Layout Configuration Example

```js
{
  gutterX: 10,
  gutterY: 10,
  sizes: {
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6
  }
}
```

---

## MasonryItem Component

The built-in `MasonryItem` component is available for use within the `#item` slot or as a standalone component.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `item` | `Object` | The item object. Must contain `src` for image loading. |
| `remove` | `Function` | Optional callback to remove the item. If provided, a remove button is shown. |

### Features
- **Image Preloading**: Shows a spinner while the image loads.
- **Error Handling**: Displays an error state if the image fails to load.
- **Hover Effects**: Includes a subtle zoom and overlay on hover.

---

## Slots

| Slot Name | Props | Description |
|-----------|-------|-------------|
| `item` | `{ item, remove }` | Scoped slot for custom rendering of each masonry block. |

---

## Run Locally

To run the demo project locally:

```bash
git clone https://github.com/wyxos/vibe
cd vibe
npm install
npm run dev
```

Visit `http://localhost:5173` to view the demo.

---

## Live Demo

[View Live Demo on GitHub Pages](https://wyxos.github.io/vibe/)

---

## License

MIT © [@wyxos](https://github.com/wyxos)
