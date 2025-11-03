# Refresh Current Page Feature

## Overview

The `refreshCurrentPage()` method allows you to reload the current page of items instead of loading the next page. This is particularly useful when items are removed and you want to stay on the same logical page rather than advancing to the next set of data.

## Behavior

When items are removed using `remove()` or `removeMany()`:
- If **all items are removed** (resulting in an empty masonry), the component automatically calls `refreshCurrentPage()` to reload data from the current page
- This prevents the automatic loading of the next page that would normally occur when content becomes sparse
- The pagination history is reset to the current page, ensuring subsequent operations remain on the same page

## API

### Method: `refreshCurrentPage()`

Manually triggers a refresh of the current page.

**Returns:** `Promise<GetPageResult>`

**Example:**
```typescript
const masonryRef = ref<InstanceType<typeof Masonry> | null>(null)

// Later...
await masonryRef.value?.refreshCurrentPage()
```

## Automatic Behavior

The component automatically refreshes the current page when:
1. You call `remove(item)` and it results in zero items remaining
2. You call `removeMany(items)` and it results in zero items remaining

## Use Cases

### Photo Gallery

When users delete all visible photos on page 3, instead of jumping to page 4, the app reloads page 3 with fresh content.

```vue
<template>
  <Masonry
    ref="masonryRef"
    v-model:items="photos"
    :get-next-page="fetchPhotos"
    :load-at-page="1"
  >
    <template #item="{ item, remove }">
      <img :src="item.src" />
      <button @click="remove(item)">Delete</button>
    </template>
  </Masonry>
</template>
```

When a user deletes the last photo on the page, `fetchPhotos(3)` is automatically called again to get new photos from page 3.

### Feed with Soft Deletes

When implementing a social feed where items can be hidden/removed, you want to backfill from the same position rather than jumping ahead in the feed.

## Implementation Details

### How It Works

1. **Tracks Current Page**: The pagination history maintains a reference to the current page number
2. **Clears Items**: When triggered, all existing items are cleared
3. **Resets Pagination**: The pagination history is reset to `[currentPage]`
4. **Reloads**: Calls `getNextPage(currentPage)` to fetch fresh data
5. **Updates History**: Adds the `nextPage` returned from the fetch to the pagination history

### Pagination History

Before refresh:
```javascript
paginationHistory = [1, 2, 3, 4] // Currently on page 3, next is 4
```

After refresh (assuming we were on page 3):
```javascript
paginationHistory = [3, 4] // Reset to page 3, next is 4
```

## Comparison with Other Methods

| Method | When Items Removed | Behavior |
|--------|-------------------|----------|
| `loadNext()` | N/A | Loads the next sequential page |
| `refreshCurrentPage()` | N/A | Reloads the current page |
| `remove()` / `removeMany()` | All items removed | **Automatically** calls `refreshCurrentPage()` |
| `remove()` / `removeMany()` | Some items remain | Triggers layout recalculation only |
| `removeAll()` | All items | Clears everything, emits event, does not reload |

## Configuration

No additional props are required. The feature works automatically with your existing `getNextPage` function.

### Disabling Automatic Refresh

If you want to handle empty states differently, you can:
1. Listen for the automatic behavior by tracking `totalItems`
2. Implement custom logic in your `getNextPage` function
3. Use `removeAll()` instead, which clears without reloading

## Notes

- The feature respects the `backfillEnabled` prop and other loading configurations
- Loading states (`isLoading`) are properly managed during refresh
- Works with both page-based and cursor-based pagination modes
- The `cancelLoad()` method can be used to interrupt an ongoing refresh
