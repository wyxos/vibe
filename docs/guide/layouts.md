# Layouts

Set `layout` when creating the instance or change it later with `setLayout()`.

| Mode | Behaviour |
| --- | --- |
| `masonry` | A virtualized, calculated masonry feed. Activating a card opens a reel over the still-mounted feed. |
| `reel` | A fullscreen-first, one-post-per-swipe feed. |
| `responsive` | Reels on phones and masonry on tablets and desktops. |

```ts
const vibe = createVibe({
  target: '#gallery',
  layout: 'responsive',
  loadPage,
})
```

`masonry` is the default. In responsive mode Vibe observes its target rather than assuming the browser viewport is the available surface.

## Runtime layout changes

```ts
vibe.setLayout('reel')
vibe.setLayout('masonry')
vibe.setLayout('responsive')
```

When a masonry card opens in the reel viewer, the underlying masonry renderer stays mounted. Closing the viewer returns to the same scroll position and focus target.

## Application-owned regions

Use `cardHeader` and `cardFooter` to render typed Vue components around the media:

```ts
import MediaInfo from './MediaInfo.vue'

const vibe = createVibe({
  target: '#gallery',
  loadPage,
  cardHeader: {
    component: MediaInfo,
    height: 40,
  },
})
```

The declared height is included in masonry calculations before the component mounts. Region components receive `VibeCardRegionProps` and remain owned by the consuming application.

## Application-owned feed footer

Use `feedFooter: { component }` to replace the default `GalleryFooter` in
masonry and reel layouts. The component receives `VibeFeedFooterProps`, whose
reactive public state covers loading, autofill, countdown, pause, error, and
end states. Its typed actions can load more, retry the end cursor, retry the
feed, or cancel autofill. The same actions can be requested by emitting
`load-more`, `retry-end`, `retry`, or `autofill-cancel`.
