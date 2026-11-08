# Selection and ordering

Selection and manual ordering are optional. Existing consumers keep their current feed behavior until they enable either capability.

```ts
import { createVibe } from '@wyxos/vibe'

const vibe = createVibe({
  target: '#feed',
  initialPage,
  selection: {
    getLabel: (item) => String(item.postId),
    onChange: ({ selectedIds, count }) => {
      // Keep application selection state or update an application toolbar here.
    },
    actions: [{
      id: 'collect',
      label: 'Add to collection',
      run: async (selectedIds, { signal }) => {
        await saveCollectionMembers(selectedIds, { signal })
      },
    }],
  },
  ordering: {
    collectionKey: () => currentCollectionId,
    onReorder: async ({ movedPostIds, targetPostId, position, signal }) => {
      await saveCollectionOrder({ movedPostIds, targetPostId, position }, { signal })
    },
  },
})
await vibe.mount()
```

The page and save functions above belong to the consuming application. Import the normal Vibe stylesheet; the selection styles are included. Set `selection: true` for selection without batch actions. Enable `ordering` only for a collection that supports manual order.

## Selection

Select items enters selection mode. A card click or checkbox toggles its whole post, including grouped media. Done returns card clicks to opening the reel and keeps the selection. Media navigation and consumer card controls retain their own actions.

Selection uses stable `postId` values, with string and numeric representations treated as the same identity. IDs must identify posts consistently throughout a selection session. Store provider-qualified IDs if the application combines providers with overlapping identifiers.

The count includes all selected posts, independently of mounted cards or the loaded page. Review selection includes earlier selections even after `replacePage`. Each action receives an immutable snapshot of the full selection. Success and failure both preserve it. Retry uses the same batch snapshot as the failed attempt; new selections are not silently added to that retry.

The application controls selection when changing filters or feeds:

```ts
vibe.getSelection() // { selectedIds, count }
vibe.setSelection([1, 2, 3])
vibe.toggleSelection(4)
vibe.clearSelection()
vibe.setSelectionMode('select') // 'browse' | 'select' | 'arrange'
await vibe.runSelectionAction('collect')
```

Pagination, reload, page replacement and reel navigation do not clear selection. Call `clearSelection()` when a successful filter or account change requires it. The application owns persistence across destroyed instances or reloads; restore saved IDs through `selection.initialIds` or `setSelection()`.

Review labels use `getLabel` while an item is loaded and retain its last known label when selected. IDs without loaded metadata have an ID-only label. Visible/off-screen counts refer to cards intersecting the masonry viewport, excluding overscan.

## Ordering

Arrange items exposes drag handles and a Move action usable with keyboard or touch. Move offers searchable, paginated destinations and Before/After placement. Native wheel and touch scrolling remain available.

Dragging a selected post moves every selected post in its existing collection order, including off-screen loaded posts. Dragging an unselected post moves it alone and preserves the selection. Drop targets are item IDs, never viewport indexes.

```ts
const saved = await vibe.reorderItems(sourcePostId, targetPostId, 'before')
```

Vibe waits for `onReorder` to resolve before changing local order. Reject the callback when the save fails; the previous order stays usable and retry feedback appears. Pages appended during the save remain in the feed. Item removal, page replacement, collection changes, cancellation or destruction cannot apply a late result to a different collection.

All moved posts and the destination must be loaded in the current ordered collection. A selection retained from another feed still supports batch actions, but a group move is unavailable until the current collection contains every selected post. Cross-feed moves and loading unseen destinations are application responsibilities. `collectionKey` must change when the ordered collection changes. Keep subsequent page results consistent with the saved order; Vibe does not rewrite server cursors.

## Pending operations and recovery

The toolbar shows an indeterminate operation state while a batch or reorder callback is pending. Consumer callbacks own progress, per-item outcomes, permissions and persistence. For partial completion, keep successful outcomes in application state and make retries skip them.

```ts
await vibe.retrySelectionOperation() // true only when the retry succeeds
vibe.cancelSelectionOperation()
```

Callbacks must honor their `AbortSignal` where cancellation is supported. Cancelling prevents late local order changes; it does not undo completed external writes. Keep long-running application job status outside Vibe so it remains available after navigation or instance destruction. Feed replacement cancels pending operations while retaining selection.

Theme the controls with the `--vibe-selection-*` custom properties in the stylesheet. The showcase demonstrates Copy selected IDs and ordering for its current session only.
