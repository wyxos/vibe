# Vibe

Vibe is an initializable Vue 3 media feed with virtualized masonry and reel layouts.

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
    component: MediaInfo,
    height: 40,
  },
  cardFooter: {
    component: MediaReactions,
    height: 48,
  },
})
```

The heights are CSS pixels and let Vibe include both regions in masonry before
virtualized cards mount. In reel layout, one header and footer remain stationary
while only the media viewport scrolls between posts. Each component controls its
own content and alignment, and receives `item`, `layout`, `mediaSource`, zero-based `index`,
`loadedCount`, the active `mediaItem`, its zero-based `mediaIndex`, its inclusive
`mediaCount`, and the optional remote `total`. Import the
`VibeCardRegionProps` type for typed Vue props. Interacting with these regions
does not activate the underlying media.

When a feed item has entries in `item.items`, Vibe treats the parent media as
position one and the nested entries as the remaining positions. Masonry cards
show looping previous/next controls on hover or keyboard focus. Reel layout
keeps those controls visible and supports native horizontal-wheel or touch-swipe
navigation through grouped media. Media changes use a directional horizontal
transition, while vertical reel scrolling continues to move between posts.

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

Autofill targets a number of new top-level cards after grouping and
deduplication. `autofill.pageSize` is the minimum card target for one Vibe load
cycle, not the server's own response size. For example, a server may return up
to 30 cards per request while Vibe is configured with `pageSize: 40`; Vibe then
follows cursors until the cycle contains at least 40 cards.

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
    maxAdditionalPages: 10,
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
await vibe.loadNext()
await vibe.reload()
vibe.getState()
vibe.destroy()
```

Destroying an instance unmounts its Vue tree and aborts its active page request.

In masonry layout, activating a card opens that post in a reel layered over the
still-mounted masonry feed. Pressing Escape returns to the same masonry scroll
position. `getState()` reports the viewer session through `reelOrigin` and
`activeReelPostId`; Escape does not exit a reel configured as the base layout.
