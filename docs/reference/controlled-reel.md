# Host-controlled reel

Use `VibeControlledReel` when your application already owns a player and its queue. Vibe supplies the vertical viewport, native touch/wheel scrolling, keyboard navigation and transitions. Your queue remains the only selection authority.

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  VibeControlledReel,
  type VibeControlledReelRequest,
  type VibeControlledReelState,
} from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

const state = shallowRef<VibeControlledReelState>({
  revision: 1,
  current: { id: 'current' },
  previous: null,
  next: { id: 'next', artwork: '/next-preview.jpg' },
  canPrevious: false,
  canNext: true,
  position: 0,
  total: 3_000_000,
})

async function navigate(request: VibeControlledReelRequest) {
  // Application-owned function: guard both the request signal and captured revision
  // immediately before committing selection; do not let stale responses mutate the queue.
  const committedWindow = await queue.navigate(request)
  if (request.signal.aborted || !committedWindow) return false
  state.value = committedWindow
}
</script>

<template>
  <div style="height: 100dvh">
    <VibeControlledReel :state="state" :on-navigate="navigate">
      <template #default="{ item, pending }">
        <!-- Keep this host player unkeyed so its media element survives selection. -->
        <ExistingPlayer :item-id="item?.id" :pending="pending" />
      </template>
      <template #next="{ item }">
        <ApplicationArtwork :item-id="item?.id" />
      </template>
    </VibeControlledReel>
  </div>
</template>
```

`queue`, `ExistingPlayer` and `ApplicationArtwork` above belong to the consuming application. A host can also place a stable Teleport target in the default slot and move its existing media node there. Vibe never creates audio or video elements in this mode. Keep adjacent slots limited to artwork; keep playback, ratings, shuffle, media-ended actions, horizontal item navigation, permissions and content filtering in the host.

## State

| Field | Meaning |
| --- | --- |
| `revision: string \| number` | Change on queue source, order, membership or selection changes that invalidate an in-flight request. Revisions must not be reused for different queue generations. |
| `current: VibeControlledReelItem \| null` | Current committed selection, or the empty state. |
| `previous?`, `next?` | Optional adjacent items. Each item has `id: string \| number`, optional `artwork` URL and optional `label`. |
| `canPrevious`, `canNext` | Navigation availability, independent of whether adjacent metadata has loaded. |
| `position?`, `total?` | Optional zero-based position and total for accessible position announcements. |

Supply only this bounded projection. No full array of IDs or media is needed, even for a native indexed queue with millions of entries. At most three frames are mounted. Missing neighbor metadata leaves a placeholder frame when its navigation flag is true.

The active default slot always remains mounted and unkeyed, including when `current` becomes `null`. Render your empty state inside that slot. Do not key the player or its Teleport target by item ID. Updating artwork or labels without changing the navigation identity does not abort a pending intent.

## Requests and cancellation

`onNavigate({ direction, snapshot, signal })` receives `direction: 'next' | 'previous'`, a frozen copy of the bounded state, and an `AbortSignal`. Swiping up or scrolling down requests next; swiping down or scrolling up requests previous. Focus the viewport to use Arrow Up/Down or Page Up/Down. Editable fields, buttons, links and media controls retain their own keys. Horizontal keys and gestures remain available to host controls.

Only one request or recovery transition runs at a time. Vibe does not optimistically change the selected item. Push a new committed state to acknowledge a queue change. Return `false` to decline without an error, or throw/reject to emit `navigationError(error)` and return to the current frame. Display application-specific feedback through the host interface or slots. A settled callback without a new state also returns to the current frame.

Changing revision, current ID or either navigation flag aborts obsolete work and centers the new current frame. Unmounting aborts work and cancels animation frames. Late errors from aborted callbacks are ignored. The host **must** honor the signal and revision at its actual selection-commit boundary; Vibe cannot undo a stale host mutation. Cancellation from an accepted state push is an ordinary lifecycle event, not a selection failure.

If navigation changes during an active touch, Vibe discards the rest of that pan and its native inertia. This also covers a touch that has not yet crossed the selection threshold. The current frame stays centered until a fresh deliberate interaction starts, so continuing an old swipe cannot select from a replacement queue.

The exposed `navigate(direction): Promise<void>` supports existing host buttons or media-ended actions. Its completion does not report acceptance: the pushed host state is the authoritative receipt. Boundary calls and calls during a pending request are ignored.

The viewport shares its native scroll selection rule, animated scroll helper and reduced-motion handling with ordinary feed reels. No polling or response-deadline timers are used. A request that never settles remains pending until the host changes navigation identity or the component unmounts.

## Slots and events

`default`, `previous` and `next` receive `{ item: VibeControlledReelItem | null, pending: boolean }`. The adjacent slots default to a contained image when `artwork` exists. Adjacent frames are inert and hidden from accessibility navigation. The active slot owns the host player's controls and focus.

The optional `label` prop defaults to “Media queue”. `navigationError` emits only failures from the current non-aborted request. A revision change does not move keyboard focus or replace the active host slot.

The local synthetic demo at `/demos/controlled-reel` provides first/last boundaries, held requests, rejection, failure and restart controls. It projects three sample entries from a three-million-position queue without creating that queue in memory or calling external services.
