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
| `onStateChange` | `(state: VibeState) => void` | — | Receives the initial state and every public state change. |
| `removalHistoryLimit` | `number` | `20` | Maximum recent removal transactions retained for `undoLastRemoval()`; use `0` to disable automatic history. |

At least one of `initialPage` or `loadPage` is needed to display content.

## Presentation options

| Option | Type | Description |
| --- | --- | --- |
| `cardHeader` | `VibeCardRegion` | Typed Vue component above each post's media. |
| `cardFooter` | `VibeCardRegion` | Typed Vue component below each post's media. |
| `mediaCard` | `VibeMediaCardOptions` | Consumer-owned header/footer styling and initial video mute behavior. Videos start unmuted; use `videoMuted: true` to start muted. |
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

Frontend `autofill.maxAdditionalPages` accepts a non-negative integer or
`'unlimited'`. The unlimited value is serializable and does not bypass target,
cursor, end-of-feed, error, abort, cancellation, destruction, or request-delay
guards.

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
