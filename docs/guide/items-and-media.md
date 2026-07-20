# Items and media

Each top-level item is one post in the feed. The parent media is always its first asset; optional entries in `items` become the remaining assets in that post.

```ts
import type { VibeItem } from '@wyxos/vibe'

const item: VibeItem = {
  postId: 42,
  src: 'https://cdn.example.com/photo.jpg',
  width: 1600,
  height: 1200,
  preview: {
    src: 'https://cdn.example.com/photo-preview.jpg',
    width: 640,
    height: 480,
  },
  items: [],
}
```

## Required fields

| Field | Type | Purpose |
| --- | --- | --- |
| `postId` | `string \| number` | Stable identity used for deduplication and reel state. |
| `src` | `string` | Original image, audio, or video URL. |
| `width` | `number \| null` | Original intrinsic width when known. |
| `height` | `number \| null` | Original intrinsic height when known. |
| `preview` | `VibePreview` | Preview URL and dimensions. |
| `items` | `VibeMediaAsset[]` | Additional media in the same post. |

Use `null` for unknown dimensions. Supplying accurate dimensions lets masonry reserve space before assets load and reduces layout movement.

## Preview selection

Phone reels load `preview.src`. Tablet and desktop reels load the original `src`, including reels opened from masonry. Masonry uses previews while preserving the original source for its reel viewer.

Grouped media navigation loops horizontally within the active post. Vertical reel navigation continues to move between top-level posts.
