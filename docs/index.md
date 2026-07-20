# Getting started

Vibe creates an isolated Vue media-feed application inside a target element. The target must have a usable height because Vibe owns scrolling within it.

## Install

```bash
npm install @wyxos/vibe
```

Import the packaged styles once in your application:

```ts
import '@wyxos/vibe/style.css'
```

## Create and mount a feed

```html
<div id="gallery"></div>
```

```css
#gallery {
  height: 100dvh;
}
```

```ts
import { createVibe } from '@wyxos/vibe'

const vibe = createVibe({
  target: '#gallery',
  layout: 'responsive',
  async loadPage({ cursor, signal }) {
    const response = await fetch(`/api/media?cursor=${cursor ?? ''}`, {
      signal,
    })

    if (!response.ok) {
      throw new Error(`Media request failed: ${response.status}`)
    }

    return response.json()
  },
})

await vibe.mount()
```

`loadPage` receives `cursor: null` for the first request. Abort the underlying request when its `signal` is cancelled.

## Clean up

Destroy the instance when the owning page or application is removed:

```ts
vibe.destroy()
```

Destroying Vibe unmounts its Vue tree and aborts the active page request.

## Next steps

- Define the [item and media contract](./guide/items-and-media).
- Choose a [layout mode](./guide/layouts).
- Configure [pagination and initial data](./guide/loading-data).
