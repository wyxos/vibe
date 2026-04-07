import { describe, expect, it, vi } from 'vitest'

import { createAssetLoadQueue } from '@/components/viewer-core/useAssetLoadQueue'

describe('useAssetLoadQueue', () => {
  it('limits concurrent loads globally, by domain, and by video domain cap', () => {
    const queue = createAssetLoadQueue({
      maxGlobal: 10,
      maxPerDomain: 4,
      maxVideoPerDomain: 2,
    })

    const granted: string[] = []

    const leases = [
      requestAsset(queue, granted, 'a-video-1', 'https://media-a.example.com/a-video-1.mp4', 'video', 0),
      requestAsset(queue, granted, 'a-video-2', 'https://media-a.example.com/a-video-2.mp4', 'video', 1),
      requestAsset(queue, granted, 'a-image-1', 'https://media-a.example.com/a-image-1.jpg', 'image', 2),
      requestAsset(queue, granted, 'a-image-2', 'https://media-a.example.com/a-image-2.jpg', 'image', 3),
      requestAsset(queue, granted, 'a-video-3', 'https://media-a.example.com/a-video-3.mp4', 'video', 4),
      requestAsset(queue, granted, 'b-video-1', 'https://media-b.example.com/b-video-1.mp4', 'video', 5),
      requestAsset(queue, granted, 'b-video-2', 'https://media-b.example.com/b-video-2.mp4', 'video', 6),
      requestAsset(queue, granted, 'b-image-1', 'https://media-b.example.com/b-image-1.jpg', 'image', 7),
      requestAsset(queue, granted, 'b-image-2', 'https://media-b.example.com/b-image-2.jpg', 'image', 8),
      requestAsset(queue, granted, 'c-image-1', 'https://media-c.example.com/c-image-1.jpg', 'image', 9),
      requestAsset(queue, granted, 'd-image-1', 'https://media-d.example.com/d-image-1.jpg', 'image', 10),
    ]

    expect(granted).toEqual([
      'a-video-1',
      'a-video-2',
      'a-image-1',
      'a-image-2',
      'b-video-1',
      'b-video-2',
      'b-image-1',
      'b-image-2',
      'c-image-1',
      'd-image-1',
    ])

    expect(granted).not.toContain('a-video-3')

    leases[0].release()

    expect(granted).toEqual([
      'a-video-1',
      'a-video-2',
      'a-image-1',
      'a-image-2',
      'b-video-1',
      'b-video-2',
      'b-image-1',
      'b-image-2',
      'c-image-1',
      'd-image-1',
      'a-video-3',
    ])
  })

  it('prioritizes nearer queued assets first and skips canceled requests', () => {
    const queue = createAssetLoadQueue({
      maxGlobal: 1,
      maxPerDomain: 4,
      maxVideoPerDomain: 2,
    })

    const granted: string[] = []

    const firstLease = requestAsset(queue, granted, 'far-item', 'https://media.example.com/far-item.jpg', 'image', 500)
    const secondLease = requestAsset(queue, granted, 'center-item', 'https://media.example.com/center-item.jpg', 'image', 100)
    const thirdLease = requestAsset(queue, granted, 'cancelled-item', 'https://media.example.com/cancelled-item.jpg', 'image', 0)

    thirdLease.cancel()
    firstLease.release()
    secondLease.release()

    expect(granted).toEqual([
      'far-item',
      'center-item',
    ])
  })
})

function requestAsset(
  queue: ReturnType<typeof createAssetLoadQueue>,
  granted: string[],
  id: string,
  url: string,
  assetType: 'image' | 'video',
  priority: number,
) {
  return queue.request({
    assetType,
    getPriority: vi.fn(() => priority),
    onGrant: vi.fn(() => {
      granted.push(id)
    }),
    url,
  })
}
