# 🧱 Vue Infinite Masonry

[![npm](https://img.shields.io/npm/v/@wyxos/vue-infinite-masonry?color=%2300c58e&label=npm)](https://www.npmjs.com/package/@wyxos/vue-infinite-masonry)
[![License](https://img.shields.io/github/license/wyxos/vue-infinite-masonry)](./LICENSE)
[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?logo=githubpages)](https://wyxos.github.io/vue-infinite-masonry/)

A lightweight, high-performance, virtualized infinite masonry layout component built with Vue 3 and Tailwind CSS (v4 ready).  
Efficiently handles large datasets with smooth scroll performance and responsive column layout.

---

## ✨ Features

- 📐 Responsive columns with configurable gutters
- ♾️ Virtual scrolling for performance (renders only visible items)
- 🚀 Lightweight and fast — no dependencies
- 🎨 Tailwind v4 compatible (but not required)
- 🔌 Works with any content — just pass your own array of items

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

const items = ref([
  { id: 1, width: 300, height: 250, src: '...' },
  { id: 2, width: 250, height: 400, src: '...' },
  // more items
]);

const onScroll = (scrollTop, direction) => {
  console.log('Scroll:', scrollTop, direction);
};
</script>

<template>
  <InfiniteMasonry
    :items="items"
    :options="{ columns: 5, gutterX: 16, gutterY: 16 }"
    @scroll="onScroll"
  />
</template>
```

---

## 🔧 Props

| Prop       | Type     | Required | Description                                   |
|------------|----------|----------|-----------------------------------------------|
| `items`    | `Array`  | ✅        | Array of items (must include width + height)  |
| `options`  | `Object` | ❌        | Layout config (`columns`, `gutterX`, `gutterY`) |

---

## 📤 Emits

| Event     | Payload                          | Description                    |
|-----------|----------------------------------|--------------------------------|
| `scroll`  | `(scrollTop, direction)`         | Emits on scroll position change |

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

👉 [View Demo on GitHub Pages](https://wyxos.github.io/vue-infinite-masonry/)

---

## 📄 License

MIT © [@wyxos](https://github.com/wyxos)
```
