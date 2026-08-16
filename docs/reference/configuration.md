# Configuration

Pass `CreateVibeOptions` to `createVibe()`.

```ts
import { createVibe, type CreateVibeOptions } from '@wyxos/vibe'

const options: CreateVibeOptions = {
  target: '#gallery',
  loadPage,
}

const vibe = createVibe(options)
```

## Core options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `Element \| string` | required | Element, or selector resolving to one, that will contain Vibe. |
| `layout` | `'masonry' \| 'reel' \| 'responsive'` | `'masonry'` | Selects the renderer or responsive switching. |
| `initialPage` | `VibePage` | — | Items and cursor restored before mounting. |
| `loadPage` | `VibePageLoader` | — | Asynchronous cursor page loader. |
| `infiniteScroll` | `boolean` | `true` | Loads forward when the feed reaches its boundary; the default footer offers manual loading when the feed is underfilled. |
| `onMediaReady` | `(context: VibeMediaLifecycleContext) => void` | — | Runs when an image loads or a video has enough metadata to render. |
| `onReelMediaChange` | `(context: VibeMediaLifecycleContext) => void` | — | Runs for the initial reel selection and each parent, nested, or single-item media change. |
| `onStateChange` | `(state: VibeState) => void` | — | Receives the initial state and every public state change. |
| `masonry` | `VibeMasonryOptions` | Current behavior | Optionally tunes masonry column width and the virtualized overscan window. |
| `removalHistoryLimit` | `number` | `20` | Maximum recent removal transactions retained for `undoLastRemoval()`; use `0` to disable automatic history. |
| `removalReconciliation` | `VibeRemovalReconciliationOptions` | — | Replays recent provider pages whose unique surviving contribution is below configured capacity. |

At least one of `initialPage` or `loadPage` is needed to display content.

### Media lifecycle context

`onMediaReady` and `onReelMediaChange` receive the same typed context:

| Field | Type | Description |
| --- | --- | --- |
| `postId` | `VibeItemId` | Stable identity of the top-level post. |
| `mediaId` | `VibeItemId \| null` | Stable identity supplied by the selected asset, or `null` when omitted. |
| `postIndex` | `number` | Zero-based index of the post in the loaded feed. |
| `mediaIndex` | `number` | Zero-based index of the selected parent or nested media. |
| `item` | `VibeItem` | Complete top-level post. |
| `media` | `VibeMediaAsset` | Selected parent or nested media asset. |
| `layout` | `VibeLayout` | Layout rendering the media (`masonry` or `reel`). |
| `origin` | `VibeReelOrigin \| null` | `null` for the masonry grid, `reel` for the base reel, or `masonry` for its reel viewer. |

Readiness may be reported again after a media remount. Reel media changes are
selection events and do not imply that the selected media has finished loading.

## Presentation options

| Option | Type | Description |
| --- | --- | --- |
| `cardHeader` | `VibeCardRegion` | Typed Vue component above each post's media. |
| `cardFooter` | `VibeCardRegion` | Typed Vue component below each post's media. |
| `mediaCard` | `VibeMediaCardOptions` | Consumer-owned header/footer styling, failed-preview presentation, and initial video mute behavior. Set `error.component` to customize the error UI; Vibe supplies `status`, `label`, guarded `retry()`, and reactive `retrying` props. Masonry starts muted and reels start unmuted; set `videoMuted` to override either layout. |
| `initialReelAudioState` | `Partial<VibeReelAudioState>` | Initial shared reel `volume`, `muted`, and `lastAudibleVolume`. |
| `onReelAudioStateChange` | `(state: VibeReelAudioState) => void` | Reports user changes from reel audio controls. External `setReelAudioState()` updates do not invoke it. |
| `feedFooter` | `VibeFeedFooter` | Replaces the default `GalleryFooter` with a consumer-owned component. |
| `reelInfoSheet` | `VibeReelInfoSheetOptions` | Application-owned information sheet for an active reel. |
| `reelAutoAdvance` | `VibeReelAutoAdvanceOptions` | Timed image progression and playback-ended media progression. |
| `autoScroll` | `VibeAutoScrollOptions` | Continuous masonry scrolling in pixels per second. |

## Feed workflow options

| Option | Type | Description |
| --- | --- | --- |
| `autofill` | `VibeAutofillOptions` | Collects toward a target number of unique top-level cards. Supports frontend and backend strategies. |
| `fill` | `VibeFillOptions` | Configures caller-triggered page collection through `vibe.fill()`. Supports frontend and backend strategies. |
| `routing` | `VibeRoutingOptions` | Synchronizes active reel locations through an application-owned Vue Router instance. |

Vue Router is an optional peer dependency and is only required when `routing` is configured.

Use `getReelAudioState()` to read the current shared reel audio snapshot and
`setReelAudioState()` to apply an application-owned update to every mounted reel
card in the instance. Volume values are clamped from `0` to `1`; mute remains a
separate user preference so unmuting can restore `lastAudibleVolume`.

Frontend `autofill.maxAdditionalPages` accepts a non-negative integer or
`'unlimited'`. The unlimited value is serializable and does not bypass target,
cursor, end-of-feed, error, abort, cancellation, destruction, or request-delay
guards.

`removalReconciliation` is opt-in and requires `loadPage` plus the provider's
positive integer `pageSize`. This is the capacity of one provider request, not
the larger autofill target. `maxReplayPages` defaults to `5` and counts concrete
provider requests, including requests followed internally by frontend autofill
or fill. Before ordinary forward loading, Vibe checks the unique surviving
contribution of each recorded page. When one is below capacity, Vibe replays
from the earliest underfilled page through the latest loaded page, keeps
surviving cards in place, and appends every new unique result before continuing
from the refreshed next cursor. Providers using this option must support
replaying previously issued cursors. Backend autofill and backend fill are not
compatible because their provider request ledgers are owned outside Vibe.

## Custom feed footer

The configured component receives `VibeFeedFooterProps`: a reactive public
`state: VibeState`, `canRetryEnd: boolean`, optional `showLoadMore?: boolean`, and `actions` containing `loadMore()`, `retryEnd()`,
`retry()`, and `cancelAutofill()`. It may invoke those callbacks or emit
`load-more`, `retry-end`, `retry`, and `autofill-cancel`. Omitting
`feedFooter` preserves the built-in `GalleryFooter`, including its manual Load
more fallback when infinite scrolling is disabled or the feed is too short to scroll.

## Media card chrome

`mediaCard.header` and `mediaCard.footer` accept `background`, `paddingX`, and
`paddingY`. Numeric spacing values are CSS pixels and must be non-negative.
Region-specific `mediaCard` backgrounds take precedence over the legacy
`cardHeader.background` and `cardFooter.background` values.

### Failed-preview component

Set `mediaCard.error.component` to replace the built-in error panel. The
component receives `VibeMediaErrorProps`; Vibe owns the source retry lifecycle
and guards repeated calls to `retry()` while `retrying` is true.

```ts
import { defineComponent, h } from 'vue'
import type { VibeMediaErrorProps } from '@wyxos/vibe'

const MediaError = defineComponent((props: VibeMediaErrorProps) => () => h(
  'button',
  { disabled: props.retrying, onClick: props.retry },
  props.retrying ? 'Trying again…' : `${props.status}: ${props.label}`,
))

createVibe({
  mediaCard: { error: { component: MediaError } },
  // ...
})
```

## Masonry virtualization

`masonry.minColumnWidth` controls calculated masonry density and defaults to
`240` CSS pixels. Raising it produces fewer, larger columns while leaving the
feed container responsive.

`masonry.overscan` controls how far beyond the real viewport Vibe keeps
masonry cards mounted. `minimumPx` defaults to `800` and
`viewportMultiplier` defaults to `1.5`, preserving the existing behavior.
Omit `maximumPx` to keep that window uncapped. Consumers can opt into a smaller,
capped window without changing the loaded feed, item ordering, removal motion,
reel navigation, or pagination:

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

Images mounted only in the overscan window use native lazy loading. Masonry
videos defer metadata until they enter the real viewport. Active viewport media
remains high priority, and reel preload behavior is unchanged.

## State changes

```ts
const vibe = createVibe({
  target: '#gallery',
  loadPage,
  onStateChange(state) {
    renderStatus({
      layout: state.layout,
      lifecycle: state.lifecycle,
      loaded: state.items.length,
      total: state.total,
    })
  },
})
```

The callback is observational. Use instance methods to request runtime changes.
