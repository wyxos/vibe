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
import Vibe from '@wyxos/vibe'
import { ref } from 'vue'
import fixture from './pages.json'

const items = ref([])

const getNextPage = async (page) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        items: fixture[page - 1].items,
        nextPage: page + 1
      })
    }, 1000)
  })
}
</script>

<template>
  <Vibe v-model:items="items" :get-next-page="getNextPage">
    <template #item="{ item, onRemove }">
      <img :src="item.src" class="w-full" />
      <button
        class="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer"
        @click="onRemove(item)"
      >
        <i class="fas fa-trash"></i>
      </button>
    </template>
  </Vibe>
</template>
```

---

## ⚙️ Props

| Prop         | Type     | Required | Description                                                                 |
|--------------|----------|----------|-----------------------------------------------------------------------------|
| `items`      | `Array`  | ✅        | Two-way bound item array (each item must include `width`, `height`, `id`) |
| `getNextPage`| `Function(page: Number)` | ✅ | Async function to load the next page — returns `{ items, nextPage }`       |
| `loadAtPage` | `Number` | ❌        | Starting page number (default: `1`)                                        |
| `sizes`      | `Object` | ❌        | Mobile-first column config (default: Tailwind-style breakpoints)          |
| `gutterX`    | `Number` | ❌        | Horizontal gutter between items (default: `10`)                            |
| `gutterY`    | `Number` | ❌        | Vertical gutter between items (default: `10`)                              |

### `sizes` example:
```js
{
  base: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  '2xl': 6
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
