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

Use `cardHeader` and `cardFooter` to render application-owned controls over every
media card:

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
virtualized cards mount. In reel layout, they reduce the media area while the
whole card remains one viewport tall. Each component controls its own content
and alignment, and receives `item`, `layout`, `mediaSource`, zero-based `index`,
`loadedCount`, and the optional remote `total`. Import the
`VibeCardRegionProps` type for typed Vue props. Interacting with these regions
does not activate the underlying media.

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
