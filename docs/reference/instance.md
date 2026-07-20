# Instance methods

`createVibe()` returns a `VibeInstance`. Mount it once, retain it for the lifetime of its target, and destroy it during cleanup.

## Lifecycle and state

| Method | Purpose |
| --- | --- |
| `mount()` | Mounts the Vue tree and starts initial loading when needed. |
| `destroy()` | Unmounts Vibe and aborts its active page request. |
| `getState()` | Returns the current public state snapshot. |
| `reload()` | Reloads the feed from its initial boundary. |
| `loadNext()` | Requests the next ordinary cursor page. |

## Layout and navigation

| Method | Purpose |
| --- | --- |
| `setLayout(mode)` | Changes between masonry, reel, and responsive modes. |
| `nextReelPost()` / `previousReelPost()` | Moves vertically between loaded posts. |
| `nextReelMediaItem()` / `previousReelMediaItem()` | Moves horizontally within grouped media. |
| `setReelInfoSheet(enabled)` | Opens or closes the configured information sheet. |
| `setReelAutoAdvance(update)` | Enables, disables, or updates reel auto advance. |

Navigation methods return `true` when a navigation was accepted and `false` when it was a no-op.

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
