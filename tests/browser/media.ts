import type { VibeItem, VibeMediaAsset } from '../../src/index'

export function image(post: number, index = 0): VibeMediaAsset {
  return {
    mediaId: `${post}-${index}`,
    src: `/media/${post}-${index}-original.svg`,
    preview: { src: `/media/${post}-${index}-preview.svg`, width: 400, height: 600 },
    type: 'image', width: 400, height: 600,
  }
}

export function items(first = 1, count = 40): VibeItem[] {
  return Array.from({ length: count }, (_, index) => {
    const postId = first + index
    return { postId, ...image(postId), items: [image(postId, 1), image(postId, 2)] }
  })
}

export function video(postId: number): VibeItem {
  return {
    postId, mediaId: `${postId}-video`, src: '/synthetic-video.mp4',
    preview: { src: '/synthetic-video.mp4', width: 320, height: 180 },
    width: 320, height: 180, type: 'video', items: [],
  }
}

export function audio(): VibeItem[] {
  return [true, false].map((cover, index) => ({
    postId: cover ? 'covered-audio' : 'uncovered-audio',
    mediaId: `audio-${index}`, src: '/audio.wav', type: 'audio',
    ...(cover ? { preview: { src: '/media/cover.svg', width: 256, height: 256, type: 'image' as const } } : {}),
    width: null, height: null, items: [],
  }))
}
