# 🧱 Vue Infinite Masonry

[![npm](https://img.shields.io/npm/v/@wyxos/vue-infinite-masonry?color=%2300c58e&label=npm)](https://www.npmjs.com/package/@wyxos/vue-infinite-masonry)
[![License](https://img.shields.io/github/license/wyxos/vue-infinite-masonry)](./LICENSE)
[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?logo=githubpages)](https://wyxos.github.io/vue-infinite-masonry/)

A responsive, infinite-scrolling masonry layout component built with Vue 3 + Tailwind CSS (v4 compatible).  
Automatically adjusts columns based on screen size and triggers lazy loading as the user scrolls.

---

## ✨ Features

- 📐 Dynamic responsive columns based on screen width
- ♾️ Infinite scroll via IntersectionObserver
- 🎯 Simple, flexible slot-based content rendering
- ⚡ Tailwind CSS v4 ready

---

## 📦 Installation

```bash
npm install @wyxos/vue-infinite-masonry
```

---

## 🚀 Usage

```vue
<script setup>
import InfiniteMasonry from '@wyxos/vue-infinite-masonry';
import { ref } from 'vue';

const items = ref([]);
const loadItems = async () => { /* initial fetch */ };
const loadMoreItems = async () => { /* fetch more */ };
</script>

<template>
  <InfiniteMasonry
    v-model="items"
    :callbacks="{ load: loadItems, loadNext: loadMoreItems }"
  >
    <template #item="{ item }">
      <div class="bg-white rounded shadow p-4">
        {{ item.name }}
      </div>
    </template>
  </InfiniteMasonry>
</template>
```

---

## 🧰 Props

| Prop         | Type     | Required | Description                                  |
|--------------|----------|----------|----------------------------------------------|
| `modelValue` | `Array`  | ✅        | Items to display                             |
| `callbacks`  | `Object` | ✅        | `{ load, loadNext }` async functions         |
| `sizes`      | `Object` | ❌        | Custom responsive breakpoints (default: 1–8) |

---

## 🧪 Run the Demo Locally

```bash
git clone https://github.com/wyxos/vue-infinite-masonry
cd vue-infinite-masonry
npm install
npm run dev
```

Then open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 🌐 Live Demo

👉 [View the GitHub Pages Demo](https://wyxos.github.io/vue-infinite-masonry/)

---

## 📄 License

MIT © [@wyxos](https://github.com/wyxos)
```
