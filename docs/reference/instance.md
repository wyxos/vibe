# Instance methods

`createVibe()` returns a `VibeInstance`. Mount it once, retain it for the lifetime of its target, and destroy it during cleanup.

## Lifecycle and state

| Method | Purpose |
| --- | --- |
| `mount()` | Mounts the Vue tree and starts initial loading when needed. |
| `destroy()` | Unmounts Vibe and aborts its active page request. |
| `getState()` | Returns the current public state snapshot. |
| `refresh()` | Replaces the visible feed from its current continuation boundary. |
| `reload()` | Reloads the feed from its initial boundary. |
| `loadNext()` | Requests the next ordinary cursor page. |

`refresh()` requests the current `next` cursor. When `next` is `null`, it falls
back to the cursor that produced the last successfully loaded page so an
exhausted feed can still be refreshed. `reload()` always requests the initial
`null` cursor. Both methods replace the currently visible items and reset
feed-owned fill, autofill, error, and removal-history state before loading.

## Item removal and restoration

| Method | Purpose |
| --- | --- |
| `removeItems(postIds)` | Animates loaded items out, removes them, records the transaction, and resolves with a `VibeRemoval`. |
| `removeMediaAnimated(target)` | Advances an active reel through Vibe's media/post transition, then removes the exact media and resolves with a `VibeMediaRemoval`. |
| `removeMedia(target)` | Removes exact media immediately and returns a `VibeMediaRemoval`. |
| `restoreMediaRemoval(removal)` | Restores an exact-media removal at its original group and media position. |
| `restoreRemoval(removal)` | Restores a removal transaction once, including one evicted from automatic undo history. |
| `undoLastRemoval()` | Restores and returns the latest recorded removal, or returns `null`. |
| `restoreItems(placements)` | Restores explicit item/index placements without creating an undo transaction. |

`VibeRemoval` is an opaque, readonly removal token whose entries contain the
removed items and their original indexes. Pass the token back when application
state, a failed request, or a specific queue action needs to restore that
removal:

```ts
const removal = await vibe.removeItems(['post-12', 'post-18'])

// Restores this transaction even if later removals happened.
vibe.restoreRemoval(removal)
```

For a conventional latest-action undo:

```ts
const restored = vibe.undoLastRemoval()
if (restored) console.log(`Restored ${restored.length} items`)
```

Vibe preserves the field's logical item order, so restoring removal
transactions out of sequence still places their items correctly. Each
instance retains the latest 20 removals by default. Configure
`removalHistoryLimit` to use another non-negative limit; `0` disables
`undoLastRemoval()` history without invalidating the tokens returned by
`removeItems()`. Reloading or destroying the instance clears its history.

`restoreItems()` remains available for consumer-created `{ item, index }`
placements. Indexes must be non-negative integers. Items whose `postId` is
already loaded are ignored. Passing a current `VibeRemoval` to this method is
equivalent to `restoreRemoval()`.

All restored cards use the same entry motion as newly loaded cards.

Use `removeMediaAnimated()` for reactions or other actions against the media
currently visible in a reel. Vibe completes the horizontal group transition or
vertical post transition before committing the exact removal. When no loaded
post follows, the reel remains open while its configured forward loader reaches
the next page, an error, or the end of the feed. `removeMedia()` remains the
immediate, backward-compatible primitive for consumers that own their own
transition.

## Layout and navigation

| Method | Purpose |
| --- | --- |
| `setLayout(mode)` | Changes between masonry, reel, and responsive modes. |
| `navigateToReelItem(target)` | Selects a loaded post and media asset by stable `postId` and `mediaId`. |
| `nextReelPost()` / `previousReelPost()` | Moves vertically between loaded posts. |
| `nextReelMediaItem()` / `previousReelMediaItem()` | Moves horizontally within grouped media. |
| `setReelInfoSheet(enabled)` | Opens or closes the configured information sheet. |
| `setReelAutoAdvance(update)` | Enables, disables, or updates reel auto advance. |

The next/previous navigation methods return `true` when a navigation was
accepted and `false` when it was a no-op.

`navigateToReelItem({ postId, mediaId })` returns `navigated` when both stable
identities resolve in the active reel, including when that exact item is
already active. It returns `not-found` when either identity is absent from the
loaded feed, and `reel-inactive` before mount, after destroy, during initial
loading, or while only masonry is visible. It never loads, inserts, or falls
back to another item.

## Loading controls

| Method | Purpose |
| --- | --- |
| `setInfiniteScroll(enabled)` | Changes automatic boundary loading. |
| `setLoadMoreLocked(locked)` | Pauses or resumes ordinary forward pagination. |
| `fill(target)` | Collects a requested number of pages or continues to the end. |
| `cancelFill()` | Cancels active manual fill work. |
| `cancelAutofill()` | Cancels active autofill work. |
| `applyFillUpdate(update)` | Applies a sequenced backend fill update. |
| `applyAutofillUpdate(update)` | Applies a sequenced backend autofill update. |
| `restoreFillSession(snapshot)` | Restores fill lifecycle state received after construction. |
| `restoreAutofillSession(snapshot)` | Restores autofill lifecycle state received after construction. |

## Masonry auto scroll

| Method | Purpose |
| --- | --- |
| `setAutoScroll(enabled, speed?)` | Enables or disables auto scroll and optionally changes its speed. |
| `setAutoScrollSpeed(speed)` | Updates the requested speed within configured bounds. |
| `pauseAutoScroll()` | Pauses without disabling the feature. |
| `resumeAutoScroll()` | Resumes a paused controller. |

## Example cleanup in Vue

```ts
import { onBeforeUnmount, onMounted } from 'vue'
import { createVibe } from '@wyxos/vibe'

const vibe = createVibe({ target: '#gallery', loadPage })

onMounted(() => vibe.mount())
onBeforeUnmount(() => vibe.destroy())
```
