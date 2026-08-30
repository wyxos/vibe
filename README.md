# Vibe

Vibe is an initializable Vue 3 media feed with virtualized masonry and reel layouts.

Read the [full documentation](./docs/index.md) for guided setup, layout and data-loading concepts, and the API reference.

## Installation

```bash
npm install @wyxos/vibe
```

Import the packaged styles once in the consuming application:

```ts
import '@wyxos/vibe/style.css'
```

## Remote feed

```ts
import { createVibe } from '@wyxos/vibe'

const vibe = createVibe({
  target: '#gallery',
  layout: 'responsive',
  loadPage: async ({ cursor, signal }) => {
    const response = await fetch(`/api/media?cursor=${cursor ?? ''}`, {
      signal,
    })

    return response.json()
  },
})

await vibe.mount()
```

The target element must have a usable height. Vibe owns scrolling inside that target.
In responsive layout, Vibe observes the target and uses reels on phones while
keeping tablets and desktops in masonry. Use `masonry` or `reel` to force a
renderer instead.

Masonry loads `preview`. Reels on tablets and desktops load the canonical
`src`, including a reel forced with `layout: 'reel'` and a reel opened from a
masonry card. Phone reels load the optional `mobile` variant when supplied and
otherwise fall back to the canonical `src`; feed previews are never promoted to
reel playback sources.

`loadPage` receives `cursor: null` for the initial request. It returns normalized Vibe items, the next opaque cursor, and an optional total:

```ts
{
  items: VibeItem[]
  next: string | number | null
  total?: number
}
```

## Static or preloaded feed

```ts
const vibe = createVibe({
  target: document.querySelector('#gallery')!,
  layout: 'reel',
  initialPage: {
    items,
    next: null,
    total: items.length,
  },
})

await vibe.mount()
```

Provide both `initialPage` and `loadPage` when preloaded items can continue to another cursor.

## Custom card chrome

Use `cardHeader` and `cardFooter` to render application-owned regions above and
below media:

```ts
import MediaInfo from './MediaInfo.vue'
import MediaReactions from './MediaReactions.vue'

const vibe = createVibe({
  target: '#gallery',
  layout: 'responsive',
  loadPage,
  cardHeader: {
    background: 'transparent',
    component: MediaInfo,
    height: 40,
  },
  cardFooter: {
    background: 'transparent',
    component: MediaReactions,
    height: 48,
  },
  mediaCard: {
    feedPreload: 'visible-post',
    videoMuted: true,
  },
})
```

The optional `background` is either `default` (the existing Vibe surface) or
`transparent`. The heights are CSS pixels and let Vibe include both regions in
masonry before virtualized cards mount. In reel layout, one header and footer
remain stationary while only the media viewport scrolls between posts. Each
component controls its own content and alignment, and receives `item`, `layout`,
`mediaSource`, zero-based `index`, `loadedCount`, the active `mediaItem`, its
zero-based `mediaIndex`, its inclusive `mediaCount`, and the optional remote
`total`. Import the `VibeCardRegionProps` type for typed Vue props. Interacting
with these regions does not activate the underlying media.

Masonry videos start muted, while the active reel video starts unmuted. Inactive
reel videos are always paused and muted while they remain mounted for nearby
virtualization; their user-selected mute state is restored when they become
active again. Set `mediaCard.videoMuted` to explicitly override the initial
state in either layout. Users can still change mute and volume through the
timed-media controls.

Set `mediaCard.feedPreload` to `'visible-post'` to warm every other preview in
a grouped masonry card after its visible media is ready. Only cards in the
exact viewport qualify: images are fetched at low priority and decoded, while
video or audio sources load metadata without preloading their full bodies.
The default is `'none'`, and reel loading is unchanged.

Applications that need audio continuity can pass `initialReelAudioState` with
`volume`, `muted`, and `lastAudibleVolume`, then persist user changes through
`onReelAudioStateChange`. Every reel card in that Vibe instance shares the
state. `getReelAudioState()` returns a snapshot and `setReelAudioState()` applies
an external update without invoking the callback, which lets applications sync
several Vibe instances without an echo loop. Masonry's forced mute behavior is
unchanged.

Masonry virtualization keeps the existing 800px/1.5-viewport overscan by
default. Consumers can opt into a capped window while retaining every loaded
item and the same removal, restoration, reel, and pagination behavior:

```ts
masonry: {
  minColumnWidth: 400,
  overscan: {
    minimumPx: 600,
    viewportMultiplier: 0.5,
    maximumPx: 1_000,
  },
},
```

`minColumnWidth` defaults to `240` CSS pixels. Raising it produces fewer,
larger masonry columns without constraining the feed container.

Low-priority images in that overscan window use native lazy loading, and
low-priority masonry videos defer metadata until they reach the real viewport.
Reel preload behavior remains unchanged.

When a feed item has entries in `item.items`, Vibe treats the parent media as
position one and the nested entries as the remaining positions. Masonry cards
show looping previous/next controls on hover or keyboard focus. Reel layout
keeps those controls visible and supports native horizontal-wheel or touch-swipe
navigation through grouped media. Media changes use a directional horizontal
transition, while vertical reel scrolling continues to move between posts.
Media assets may include a stable `mediaId` (`string | number`) when consumers
need to select exact grouped media independently of its array position.

## Media lifecycle hooks

Use `onMediaReady` when an image has loaded or a video has enough metadata for
Vibe to render it. `onMediaVisible` reports each ready masonry media item once
per mount when it first intersects the viewport. `onMediaFullyVisible` reports
each ready media item once per layout: after the masonry card reaches its full
visibility threshold, or after the media is active and ready in a reel.
`onReelMediaChange` reports reel selection changes:

```ts
const vibe = createVibe({
  target: '#gallery',
  loadPage,
  onMediaReady: ({ postId, mediaId, layout, origin }) => {
    recordMediaReady({ postId, mediaId, layout, origin })
  },
  onMediaVisible: ({ postId, mediaIndex }) => {
    recordMediaPreviewed({ postId, mediaIndex })
  },
  onMediaFullyVisible: ({ postId, mediaIndex, layout }) => {
    recordMediaViewed({ postId, mediaIndex, layout })
  },
  onReelMediaChange: ({ postId, mediaId, postIndex, mediaIndex }) => {
    updateActiveMedia({ postId, mediaId, postIndex, mediaIndex })
  },
})
```

All lifecycle callbacks receive `VibeMediaLifecycleContext`: stable `postId`
and `mediaId` identity, zero-based `postIndex` and `mediaIndex`, the complete
`item` and selected `media`, the rendered `layout`, and `origin`. `mediaId` is
`null` when the source asset does not define one. `origin` is `null` for the
masonry grid, `reel` for the base reel, and `masonry` for a reel opened from a
masonry card. The readiness hook may run again if media remounts and becomes
ready again. Visibility callbacks are deduplicated for the lifetime of a mount.
Normal masonry cards require their complete height; cards taller than the
viewport require 80% of their maximum attainable visible height. Reel fully
visible events depend on active-and-ready state rather than intersection.
Reel-change events describe selection changes, not load state.

## Reel URLs with Vue Router

Pass a Vue Router instance when the application should reflect the active reel
in its URL. The consumer owns the route names and the item-to-location mapping:

```ts
import { useRouter } from 'vue-router'
import { createVibe } from '@wyxos/vibe'

const router = useRouter()
const vibe = createVibe({
  target: '#gallery',
  loadPage,
  routing: {
    router,
    feed: { name: 'gallery' },
    reel: ({ item }) => ({
      name: 'gallery-file',
      params: { fileId: String(item.postId) },
    }),
  },
})
```

Vibe pushes the first reel location, replaces it as the active reel changes,
and replaces it with `feed` when the masonry-origin reel closes or responsive
layout returns to masonry. The reel callback also receives the zero-based
`index`, `loadedCount`, optional remote `total`, and whether the reel originated
from `masonry` or the base `reel` layout. Return `null` to skip a URL update for
an item. Vue Router is an optional peer dependency and is only needed when this
integration is used.

## Autofill

Autofill targets a number of new top-level cards after the provider or consumer
adapter has grouped each post into one `VibeItem`. Vibe does not perform
provider-specific grouping; it only deduplicates `postId` defensively as pages
are appended. `autofill.pageSize` is the minimum card target for one Vibe load
cycle, not the server's own response size. For example, a server may return up
to 30 grouped cards per request while Vibe is configured with `pageSize: 40`;
Vibe then follows cursors until the cycle contains at least 40 cards.

### Frontend autofill

Frontend autofill follows cursors and commits the collected batch once the
target is reached or the source is exhausted. Restore committed items with
`initialPage`; its `next` value must follow the last restored item:

```ts
const restoredPage = await feedCache.read() // VibePage | null

const vibe = createVibe({
  target: '#gallery',
  initialPage: restoredPage ?? undefined,
  loadPage,
  autofill: {
    strategy: 'frontend',
    pageSize: 40,
    maxAdditionalPages: 'unlimited',
    delayStepMs: 2_000,
    delayMaxMs: 10_000,
  },
  onStateChange(state) {
    void feedCache.write({
      items: [...state.items],
      next: state.next,
      total: state.total ?? undefined,
    })
  },
})

await vibe.mount()
```

There is no frontend session snapshot. With 25 restored cards and
`pageSize: 40`, Vibe continues from `initialPage.next` until the load cycle has
at least 40 unique cards. Without `initialPage`, Vibe starts at cursor `null`.
`maxAdditionalPages` accepts a non-negative integer or the serializable string
`'unlimited'`. Unlimited cycles still stop at the target, end of pagination,
a repeated cursor, an error, cancellation/abort, or `destroy()`.

The first request is immediate. Each subsequent request waits
`min(completedRequests * delayStepMs, delayMaxMs)`, so the defaults produce
0s, 2s, 4s, 6s, 8s, then 10s between requests. Set both values to `0` when a
frontend source should run without pacing. During a wait,
`state.autofill.delayRemainingMs` counts down and `nextRequestAt` contains the
absolute browser timestamp.

### Backend autofill

Backend autofill lets the consuming application enqueue and cancel durable
work. A restoration endpoint should return the currently committed page and,
when work remains active, its persisted session:

```ts
interface BackendRestoration {
  initialPage?: VibePage
  session?: VibeAutofillSessionSnapshot
}

const restoration: BackendRestoration = await getBackendRestoration()

const vibe = createVibe({
  target: '#gallery',
  initialPage: restoration.initialPage,
  loadPage,
  autofill: {
    strategy: 'backend',
    pageSize: 40,
    feedKey: 'latest-images',
    initialSession: restoration.session,
    async onUnderfilled(context) {
      const { signal, ...payload } = context
      return await startBackendAutofill(payload, { signal })
    },
    onCancel: cancelBackendAutofill,
  },
})

const unsubscribe = subscribeToAutofillUpdates((update) => {
  vibe.applyAutofillUpdate(update)
})

await vibe.mount()
```

Subscribe before mounting so a fast Reverb, WebSocket, or polling update is not
missed. A waiting update reports sequenced progress without items. A `complete`
or `exhausted` update supplies the entire buffered batch and appends it once:

The backend owns its delay policy and job scheduling. Return or emit the
absolute `nextRequestAt` timestamp for a waiting job; Vibe derives the live
`delayRemainingMs` countdown locally. Persist the timestamp in session
snapshots so a refreshed client can resume the same countdown.

```ts
vibe.applyAutofillUpdate({
  feedKey: 'latest-images',
  sessionId: 'job-456',
  sequence: 2,
  requests: 2,
  received: 48,
  nextRequestAt: null,
  status: 'complete',
  items: completedBatch,
  next: 'cursor-after-completed-batch',
  total: 500,
})

await vibe.cancelAutofill()
unsubscribe()
vibe.destroy()
```

Load-time restoration should provide both `initialPage` and
`autofill.initialSession`; this renders committed items immediately and avoids
starting a duplicate backend job. The snapshot `feedKey` and `pageSize` must
match the configured backend autofill options. Use
`vibe.restoreAutofillSession(snapshot)` only when a session becomes available
after construction; it restores autofill lifecycle state, not a complete
visible page.

`state.autofill` exposes the strategy, lifecycle status, target, received and
missing counts, request count, countdown, session identity, sequence, and error. Backend
results are appended only when an update is `complete` or `exhausted`; stale,
duplicate, mismatched-feed, and post-cancellation updates are ignored.
Terminal backend updates must include `next`, using `null` when the source is
exhausted. Vibe resumes ordinary pagination from that terminal cursor after
autofill completes. A terminal update without `next` is rejected so an older
cursor cannot be requested again.

## Manual fill

Manual fill is separate from autofill. It starts only when the consumer calls
`vibe.fill()` and targets additional page requests rather than an item count:

```ts
await vibe.fill({ pages: 3 })
await vibe.fill({ until: 'end' })
```

`{ pages: 3 }` follows three cursors from the currently loaded page. It becomes
`exhausted` if the source ends before all three requests complete. `{ until:
'end' }` continues until a response returns `next: null`; reaching that end is
a successful `complete` result. Duplicate post IDs are still removed, but they
do not change how page requests are counted.

### Frontend fill

```ts
const restoredPage = await feedCache.read()

const vibe = createVibe({
  target: '#gallery',
  initialPage: restoredPage ?? undefined,
  loadPage,
  fill: {
    strategy: 'frontend',
    delayStepMs: 2_000,
    delayMaxMs: 10_000,
  },
  onStateChange(state) {
    renderFillState(state.fill)
    void feedCache.write({
      items: [...state.items],
      next: state.next,
      total: state.total ?? undefined,
    })
  },
})

await vibe.mount()
await vibe.fill({ pages: 3 })
// or: await vibe.fill({ until: 'end' })
```

Frontend fill invokes `loadPage` in the browser, exposes progress through
`state.fill`, and appends one buffered batch when the requested pages or end is
reached. `await vibe.cancelFill()` aborts the active request and discards the
uncommitted batch. A restored `initialPage.next` is the cursor from which the
next manual fill starts. The first fill request is immediate; subsequent
requests use the same capped incremental delay and expose
`state.fill.delayRemainingMs` plus `state.fill.nextRequestAt`.

### Backend fill

```ts
interface FillRestoration {
  initialPage?: VibePage
  session?: VibeFillSessionSnapshot
}

const restoration: FillRestoration = await getFillRestoration()

const vibe = createVibe({
  target: '#gallery',
  initialPage: restoration.initialPage,
  loadPage,
  fill: {
    strategy: 'backend',
    feedKey: 'latest-images',
    initialSession: restoration.session,
    async onStart(context) {
      const { signal, ...payload } = context
      return await startBackendFill(payload, { signal })
    },
    onCancel: cancelBackendFill,
  },
})

const unsubscribe = subscribeToFillUpdates((update) => {
  vibe.applyFillUpdate(update)
})

await vibe.mount()
await vibe.fill({ pages: 3 })
```

The backend callback should enqueue durable work and return a `sessionId`
without waiting for every page. Each completed endpoint call can emit a
sequenced `waiting` update containing `completedPages` and `received`. The
backend remains responsible for delaying and dispatching each job. Include its
absolute `nextRequestAt` in the returned session and waiting updates so Vibe can
render the countdown. The terminal update supplies the entire buffered batch
and its cursor boundary:

```ts
vibe.applyFillUpdate({
  feedKey: 'latest-images',
  sessionId: 'fill-job-456',
  sequence: 3,
  completedPages: 3,
  received: 86,
  nextRequestAt: null,
  status: 'complete',
  items: completedBatch,
  lastCursor: 'cursor-used-for-page-3',
  next: 'cursor-after-page-3',
  total: 500,
})
```

For load-time restoration, provide both the committed `initialPage` and the
persisted `fill.initialSession`. Subscribe to backend events before mounting.
Use `vibe.restoreFillSession(snapshot)` when a session arrives after
construction. `state.fill` exposes the strategy, target, status, completed page
count, received unique-card count, countdown, session identity, sequence, and error.
Ordinary pagination resumes from the terminal `next` cursor. Stale,
mismatched-feed, invalid-terminal, and post-cancellation updates are ignored.

## Auto scroll

Auto scroll advances the masonry gallery smoothly in pixels per second. It is
disabled by default and can be configured when the instance is created:

```ts
const vibe = createVibe({
  target: '#gallery',
  layout: 'masonry',
  loadPage,
  autoScroll: {
    speedPxPerSecond: 80,
    minSpeedPxPerSecond: 20,
    maxSpeedPxPerSecond: 240,
  },
})

await vibe.mount()
vibe.setAutoScroll(true, 120)
vibe.pauseAutoScroll()
vibe.resumeAutoScroll()
vibe.setAutoScrollSpeed(160)
vibe.setAutoScroll(false)
```

The default speed is 80 px/s within a default 20–240 px/s range. Consumer
values outside the configured range are clamped. `state.autoScroll` exposes the
effective speed, bounds, and `enabled` / `paused` flags. The controller uses the
gallery's animation frames rather than repeated smooth-scroll commands, so
movement remains continuous and responds immediately to speed changes.

Auto scroll waits while reel layout or a masonry-origin reel viewer is active.
It resumes without a position jump when masonry becomes active again. Infinite
scroll continues to work normally because the gallery remains the only scroll
owner.

## Reel auto advance

Reel auto advance renders a countdown progress strip at the bottom of an active
reel and moves to the next post when the configured interval expires:

```ts
const vibe = createVibe({
  target: '#gallery',
  layout: 'reel',
  loadPage,
  reelAutoAdvance: {
    enabled: true,
    intervalMs: 5_000,
    includePostItems: false,
  },
})

await vibe.mount()
vibe.setReelAutoAdvance(false)
vibe.setReelAutoAdvance({
  enabled: true,
  intervalMs: 8_000,
  includePostItems: true,
})
```

The default interval is five seconds and grouped post items are excluded by
default. When `includePostItems` is enabled, Vibe counts through the parent media
and then each item in its `items` array before moving vertically to the next post.
Still images use the countdown. Audio and video stop looping while auto advance
is enabled and advance from their playback `ended` event instead, so pausing the
media also pauses progression. Manual vertical or horizontal navigation restarts
the countdown for the newly active image. The feature is inactive in masonry and
becomes visible in either a base reel layout or a reel opened from masonry.

`state.reelAutoAdvance` exposes `enabled`, `intervalMs`, and `includePostItems`.
At the loaded boundary, normal pagination is requested when another cursor is
available; the load-more lock continues to prevent that request when active.

## Reel runtime controls

Use the instance to drive the active reel through the same state paths as
horizontal and vertical reel gestures:

```ts
// Media items within the active post (horizontal reel navigation).
vibe.nextReelMediaItem()
vibe.previousReelMediaItem()

// Posts within the reel (vertical reel navigation).
vibe.nextReelPost()
vibe.previousReelPost()

// An exact loaded post/media pair by stable identity.
vibe.navigateToReelItem({ postId: 'post-42', mediaId: 'asset-101' })
```

Each navigation method returns `true` when it accepted a navigation and `false`
when it was a no-op. Media-item navigation loops from the first item to the last
and from the last item to the first, matching reel swipes; a post with only one
media item returns `false`. Post navigation does not loop and returns `false` at
the first or last currently loaded post. It does not implicitly load another
page.

All four methods return `false` before mount, during the initial loading or empty
state, after destroy, and while the instance is showing only its masonry feed.
They work in both a base reel layout and an open masonry-origin reel viewer.
Successful navigation updates `state.activeReelPostId`, the selected media item,
card-region props, route synchronization, and an open information sheet's
consumer context through the same handlers used by gestures and keyboard input.

`navigateToReelItem()` returns `navigated` when both identities resolve,
including when the requested media is already active. It returns `not-found`
when the loaded post or media is missing, and `reel-inactive` before mount,
after destroy, during initial loading, or while only masonry is visible. The
method does not load, insert, or fall back to another item. Every targetable
parent or nested `VibeMediaAsset` must provide its stable `mediaId`.

## Reel information sheet

Provide an application-owned Vue component when a reel should offer a
customizable information sheet. The component is fixed for the lifetime of the
Vibe instance, while its open state can be initialized and changed at runtime:

```ts
import ReelInformationSheet from './ReelInformationSheet.vue'

const vibe = createVibe({
  target: '#gallery',
  layout: 'responsive',
  loadPage,
  reelInfoSheet: {
    component: ReelInformationSheet,
    enabled: false,
  },
})

await vibe.mount()
vibe.setReelInfoSheet(true)
vibe.setReelInfoSheet(false)
```

Import `VibeReelInfoSheetProps` to type the consumer component. It receives the
active `item`, zero-based post and media indexes, the active media item and
source, inclusive media count, loaded and optional total counts, `layout:
'reel'`, whether the reel originated from `reel` or `masonry`, and a `close()`
callback. The component owns its visible controls and content:

```vue
<script setup lang="ts">
import type { VibeReelInfoSheetProps } from '@wyxos/vibe'

defineProps<VibeReelInfoSheetProps>()
</script>

<template>
  <aside>
    <button type="button" @click="close">Close</button>
    <h2>Post {{ item.postId }}</h2>
  </aside>
</template>
```

Phones render the sheet as a full-width modal overlay and make the reel inert
until it closes. Tablets through 1024px render a full-width non-overlay sheet
below the reel. Larger layouts render it beside the reel at 25% width, changing
to 40% at a 1920px viewport. Non-phone sheets stay mounted while vertical reel
swipes update their active context. All presentations animate open and closed
and honor reduced-motion preferences.

`state.reelInfoSheet.enabled` reports the requested open state. Enabling without
a configured component throws an error; disabling is always safe. In a base
reel, Escape closes an open sheet. In a masonry-origin reel, Escape closes the
viewer without disabling the sheet, so it is open again when another masonry
card opens a reel. The consumer close control or `setReelInfoSheet(false)`
explicitly disables it. The underlying masonry renderer stays mounted, so
closing either surface preserves its scroll, media selections, and focus target.
Calling `setReelInfoSheet()` before mount, during loading, or outside an active
reel still updates this requested state; the sheet becomes visible when a valid
reel context exists. This preserves the existing persistent sheet-state
behavior across masonry viewer closes.

When a sheet contains another Vibe instance, Escape is owned by the topmost
active reel. A nested masonry-origin reel therefore closes back to its nested
feed without also closing the parent sheet or reel. Single-instance Escape
behavior is unchanged.

## Custom feed footer

Set `feedFooter.component` to replace the built-in `GalleryFooter`. Consumers
that omit it keep the built-in manual load, retry, and end-of-feed controls.
The manual Load more action remains available when infinite scrolling is
disabled or the rendered feed is too short to scroll. Scrollable feeds using
infinite scrolling keep the action hidden until the viewport becomes
underfilled again.

```ts
import FeedFooter from './FeedFooter.vue'

const vibe = createVibe({
  target: '#gallery',
  loadPage,
  feedFooter: {
    component: FeedFooter,
  },
})
```

Type the component with `VibeFeedFooterProps`. Its optional `showLoadMore` prop reports
when manual pagination is needed because infinite scrolling is disabled or the
rendered feed is too short to scroll. Its `state` prop is the reactive
public `VibeState`, including autofill progress, request count, countdown,
loading, end, error, and load-more-lock state. Its `actions` prop contains
`loadMore()`, `retryEnd()`, `retry()`, and `cancelAutofill()`:

```vue
<script setup lang="ts">
import type { VibeFeedFooterProps } from '@wyxos/vibe'

const props = defineProps<VibeFeedFooterProps>()
</script>

<template>
  <footer>
    <span>{{ props.state.autofill.received }} / {{ props.state.autofill.pageSize }}</span>
    <button type="button" @click="props.actions.cancelAutofill()">Cancel</button>
  </footer>
</template>
```

A footer may instead emit `load-more`, `retry-end`, `retry`, or
`autofill-cancel`; Vibe routes those events to the same actions. Consumer
components own their markup, styling, state selection, and additional controls.

## Load-more lock

Pause ordinary forward pagination without disabling the feed or cancelling a request
that is already running:

```ts
vibe.setLoadMoreLocked(true)

// Existing items remain interactive. Later, allow pagination again.
vibe.setLoadMoreLocked(false)
```

While locked, Vibe ignores `loadNext()`, infinite-scroll boundary triggers, the
load-more action, and the end-of-feed retry. `reload()`, initial loading, autofill,
and explicit `fill()` operations keep their own lifecycles. If infinite scroll is
enabled when the instance is unlocked, Vibe immediately checks the current bottom
boundary so the consumer does not need to nudge the scroll position.

Read `state.loadMoreLocked` through `getState()` or `onStateChange` when application
chrome needs to reflect the gate. The built-in pagination action is disabled and
shown as `Loading paused` while the gate is active.

## Feed state

Use `onStateChange` to render request and layout state outside Vibe, such as an
application-header lifecycle indicator:

```ts
const vibe = createVibe({
  target: '#gallery',
  loadPage,
  onStateChange: (state) => {
    renderFeedState({
      layout: state.layout,
      lifecycle: state.lifecycle,
    })
  },
})
```

The callback receives an initial snapshot when the instance is created and a
new snapshot whenever its public state changes. The typed `lifecycle` value is
`loading`, `loaded`, or `error`; it covers initial and pagination requests.
Individual media preview errors do not mark the feed request as failed.

## Instance lifecycle

```ts
vibe.setLayout('reel')
vibe.setLayout('responsive')
vibe.setInfiniteScroll(false)
vibe.setLoadMoreLocked(true)
vibe.setLoadMoreLocked(false)
vibe.setReelAutoAdvance(true)
vibe.setReelAutoAdvance({ includePostItems: true, intervalMs: 8_000 })
vibe.setReelInfoSheet(true)
vibe.setReelInfoSheet(false)
vibe.nextReelMediaItem()
vibe.previousReelMediaItem()
vibe.nextReelPost()
vibe.previousReelPost()
vibe.navigateToReelItem({ postId: 'post-42', mediaId: 'asset-101' })
vibe.setAutoScroll(true, 80)
vibe.pauseAutoScroll()
vibe.resumeAutoScroll()
vibe.setAutoScroll(false)
await vibe.loadNext()
await vibe.refresh()
await vibe.reload()
vibe.getState()
vibe.destroy()
```

`refresh()` replaces the visible feed from its current continuation cursor. At
the end of the feed, it requests the cursor that produced the last loaded page
again. Use `reload()` to replace the feed from its initial `null` cursor instead.

Destroying an instance unmounts its Vue tree and aborts its active page request.

In masonry layout, activating a card opens that post in a reel layered over the
still-mounted masonry feed. Pressing Escape returns to the same masonry scroll
position. `getState()` reports the viewer session through `reelOrigin` and
`activeReelPostId`; Escape does not exit a reel configured as the base layout.
