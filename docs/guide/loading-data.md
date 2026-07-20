# Loading data

Vibe supports cursor-based remote feeds, fully preloaded feeds, and a combination of both.

## Remote pages

```ts
const vibe = createVibe({
  target: '#gallery',
  async loadPage({ cursor, signal }) {
    const response = await fetch(`/api/media?cursor=${cursor ?? ''}`, { signal })
    return response.json()
  },
})
```

Each result follows this shape:

```ts
interface VibePage {
  items: VibeItem[]
  next: string | number | null
  total?: number
}
```

`next` is opaque to Vibe and is passed unchanged to the next request. Return `null` when the source is exhausted.

## Initial or static data

```ts
const vibe = createVibe({
  target: '#gallery',
  initialPage: {
    items,
    next: null,
    total: items.length,
  },
})
```

Provide both `initialPage` and `loadPage` when restored or server-rendered items can continue to another cursor. `initialPage.next` must identify the page after the last restored item.

## Pagination controls

Infinite scrolling is enabled by default. You can disable it and load explicitly:

```ts
const vibe = createVibe({
  target: '#gallery',
  infiniteScroll: false,
  loadPage,
})

await vibe.mount()
await vibe.loadNext()
```

Use `setLoadMoreLocked(true)` to pause forward pagination without cancelling an active request or disabling interaction with loaded items.

## Reloading and errors

`loadPage` may throw. Vibe exposes the failure through state and renders retry UI for its owned request surfaces.

```ts
await vibe.reload()

const state = vibe.getState()
console.log(state.lifecycle, state.error, state.nextPageError)
```

For batch collection beyond ordinary pagination, see the `autofill` and `fill` options in the [configuration reference](../reference/configuration).
