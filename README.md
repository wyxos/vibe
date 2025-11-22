# 🔷 VIBE — Vue Infinite Block Engine

[![npm](https://img.shields.io/npm/v/@wyxos/vibe?color=%2300c58e&label=npm)](https://www.npmjs.com/package/@wyxos/vibe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?logo=githubpages)](https://wyxos.github.io/vibe/)

A responsive, dynamic, infinite-scroll masonry layout engine for Vue 3.  
Built for performance, flexibility, and pixel-perfect layout control.

---

## ✅ Features

- Responsive masonry layout that adapts to screen size
- Automatically loads more items as you scroll
- Supports removing and reflowing items with animation
- Keeps scroll position stable after layout updates
- Fully customizable item rendering
- Optimized for large datasets

---

## 📦 Installation

```bash
npm install @wyxos/vibe
```

---

## 🚀 Usage

```vue
<script setup>
  import { ref } from 'vue'
  import { Masonry } from '@wyxos/vibe' // named export
  // or if globally registered via `app.use()`, you can skip this import

  const items = ref([])

  const layout = {
    gutterX: 12,
    gutterY: 12,
    sizes: { base: 1, sm: 2, md: 3, lg: 4 }
  }

  async function getNextPage(page) {
    const response = await fetch(`/api/items?page=${page}`)
    const data = await response.json()
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
  >
    <template #item="{ item, onRemove }">
      <div class="relative">
        <img :src="item.src" class="w-full" />
        <button
            class="absolute bottom-2 right-2 bg-red-600 text-white text-xs p-1 rounded"
            @click="onRemove(item)"
        >
          Remove
        </button>
      </div>
    </template>
  </Masonry>
</template>
```

---

## ⚙️ Props

| Prop         | Type     | Required | Description                                                                 |
|--------------|----------|----------|-----------------------------------------------------------------------------|
| `items`      | `Array`  | ✅        | Two-way bound item array (each item must include `width`, `height`, `id`) |
| `getNextPage`| `Function(page: Number)` | ✅ | Async function to load the next page — returns `{ items, nextPage }`       |
| `layout`     | `Object` | ❌        | Layout configuration (sizes, gutters, etc.)                                |
| `loadAtPage` | `Number` | ❌        | Starting page number (default: `1`)                                        |

### `layout` example:
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

## 💡 Slots

| Slot Name | Props                          | Description                       |
|-----------|--------------------------------|-----------------------------------|
| `item`    | `{ item, onRemove }`           | Custom rendering for each block   |

---

## 🧪 Run Locally

```bash
git clone https://github.com/wyxos/vibe
cd vibe
npm install
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173)

---

## 🌐 Live Demo

👉 [View Demo on GitHub Pages](https://wyxos.github.io/vibe/)

---

## 📄 License

MIT © [@wyxos](https://github.com/wyxos)
