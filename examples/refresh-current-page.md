# Refresh Current Page Example

## Demo Scenario

This example demonstrates the automatic refresh behavior when all items are removed from the current page.

## Usage in App.vue (Demo)

```vue
<script setup lang="ts">
import Masonry from "./Masonry.vue";
import { ref } from "vue";
import fixture from "./pages.json";

const items = ref([]);
const masonry = ref(null);

const getPage = async (page: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const pageData = fixture[page - 1];
      
      if (!pageData) {
        resolve({ items: [], nextPage: null });
        return;
      }

      resolve({
        items: pageData.items,
        nextPage: page < fixture.length ? page + 1 : null
      });
    }, 1000);
  });
};

// Function to remove all visible items (for testing)
const removeAllVisible = async () => {
  if (masonry.value) {
    // Get current items
    const currentItems = [...items.value];
    // Remove them all - this will trigger automatic refreshCurrentPage
    await masonry.value.removeMany(currentItems);
  }
};
</script>

<template>
  <main class="flex flex-col items-center p-4 bg-slate-100 h-screen overflow-hidden">
    <header class="sticky top-0 z-10 bg-slate-100 w-full p-4 flex flex-col items-center gap-4">
      <h1 class="text-2xl font-semibold mb-4">Refresh Current Page Demo</h1>
      
      <div class="flex gap-4">
        <button 
          @click="removeAllVisible"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Remove All Items (Will Refresh Current Page)
        </button>
      </div>
      
      <div v-if="masonry" class="flex gap-4">
        <p>Loading: <span class="bg-blue-500 text-white p-2 rounded">{{ masonry.isLoading }}</span></p>
        <p>Items: <span class="bg-blue-500 text-white p-2 rounded">{{ items.length }}</span></p>
      </div>
    </header>
    
    <Masonry
      ref="masonry"
      v-model:items="items"
      :get-next-page="getPage"
      :load-at-page="1"
    >
      <template #item="{ item, remove }">
        <img :src="item.src" class="w-full" loading="lazy" />
        <div class="absolute top-2 right-2 flex gap-2">
          <button 
            class="bg-red-500 text-white p-2 rounded cursor-pointer shadow-lg hover:bg-red-600"
            @click="remove(item)"
          >
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
        <div class="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          Page {{ item.page }} - ID: {{ item.id }}
        </div>
      </template>
    </Masonry>
  </main>
</template>
```

## Expected Behavior

### Before Removing All Items
- Page 3 is loaded with 40 photos
- User scrolled to page 3 (pagination history: `[1, 2, 3, 4]`)

### After Clicking "Remove All Items"
1. All 40 items on page 3 are removed
2. `removeMany()` detects that `next.length === 0`
3. **Automatically calls** `refreshCurrentPage()`
4. Pagination history is reset to `[3]`
5. `getPage(3)` is called again
6. Fresh items from page 3 are loaded
7. Pagination history becomes `[3, 4]` again

### Key Points
- **No jumping to page 4** - stays on page 3
- **Seamless experience** - new items load automatically
- **Maintained context** - user stays in the same area of content

## Manual Usage

You can also manually trigger a refresh:

```vue
<script setup>
const masonry = ref(null);

const manualRefresh = async () => {
  await masonry.value.refreshCurrentPage();
};
</script>

<template>
  <button @click="manualRefresh">Refresh Current Page</button>
  <Masonry ref="masonry" ... />
</template>
```

## Testing the Feature

1. Start the dev server: `vite`
2. Load the demo page
3. Scroll down to page 2 or 3
4. Delete items one by one until all are gone
5. Observe that the same page reloads with new content
6. Compare with removing a single item (which just rearranges the layout)

## Alternative: Remove One Item at a Time

When removing individual items (not all):
```vue
<button @click="remove(item)">Delete</button>
```

If this is the last item:
- ✅ Triggers `refreshCurrentPage()` automatically
- ✅ New content from same page loads
- ✅ User experience remains smooth

If items remain:
- ✅ Layout recalculates
- ✅ Items animate to new positions
- ✅ No page reload occurs
