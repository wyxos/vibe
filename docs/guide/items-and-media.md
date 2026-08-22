# Items and media

Each top-level item is one post in the feed. The parent media is always its first asset; optional entries in `items` become the remaining assets in that post.

```ts
import type { VibeItem } from '@wyxos/vibe'

const item: VibeItem = {
  postId: 42,
  mediaId: 'asset-101',
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
| `preview` | `VibePreview \| undefined` | Preview URL and dimensions; for audio this is optional cover art. |
| `mobile` | `VibeMediaVariant \| undefined` | Optional mobile-optimized full-playback URL and dimensions. |
| `items` | `VibeMediaAsset[]` | Additional media in the same post. |

Use `null` for unknown dimensions. Supplying accurate dimensions lets masonry reserve space before assets load and reduces layout movement.

Each `VibeMediaAsset` may also provide a stable `mediaId` (`string | number`).
It is optional for rendering, but required when a consumer uses
`navigateToReelItem()` to select exact media without relying on its current
position in the group.

## Provider grouping boundary

Every provider or consumer adapter must return one grouped top-level
`VibeItem` per post. Put the post's first media asset on the parent item and
its remaining assets in `items`. Vibe deliberately does not contain
provider-specific grouping logic. It only deduplicates matching `postId`
values defensively when pages are appended.

## Preview selection

Masonry loads `preview`. Tablet and desktop reels load the canonical `src`, including reels opened from masonry. Phone reels load `mobile` when supplied and otherwise fall back to `src`. A mobile video variant should preserve complete playback and audio; a shortened or audio-stripped feed derivative belongs only in `preview`.

Set `type: 'audio'` for extensionless audio sources. Audio always plays from
`src` (or an audio `mobile` variant on phones). When `preview` resolves to an
image, Vibe uses it as cover art in masonry and reel layouts. If it is omitted,
does not resolve to an image, or fails to load, Vibe renders its built-in disc
fallback. Masonry never starts audio playback; reel audio uses the same timed
media controls and shared mute/volume state as video.

Grouped media navigation loops horizontally within the active post. Vertical reel navigation continues to move between top-level posts.
