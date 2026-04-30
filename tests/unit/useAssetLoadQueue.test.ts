import { describe, expect, it, vi } from 'vitest'

import { createAssetLoadQueue } from '@/components/viewer-core/useAssetLoadQueue'

describe('useAssetLoadQueue', () => {
  it('grants every requested load without global, domain, or video caps', () => {
    const queue = createAssetLoadQueue()

    const granted: string[] = []

    requestAsset(queue, granted, 'a-video-1', 'https://media-a.example.com/a-video-1.mp4', 'video', 0)
    requestAsset(queue, granted, 'a-video-2', 'https://media-a.example.com/a-video-2.mp4', 'video', 1)
    requestAsset(queue, granted, 'a-image-1', 'https://media-a.example.com/a-image-1.jpg', 'image', 2)
    requestAsset(queue, granted, 'a-image-2', 'https://media-a.example.com/a-image-2.jpg', 'image', 3)
    requestAsset(queue, granted, 'a-video-3', 'https://media-a.example.com/a-video-3.mp4', 'video', 4)
    requestAsset(queue, granted, 'b-video-1', 'https://media-b.example.com/b-video-1.mp4', 'video', 5)
    requestAsset(queue, granted, 'b-video-2', 'https://media-b.example.com/b-video-2.mp4', 'video', 6)
    requestAsset(queue, granted, 'b-image-1', 'https://media-b.example.com/b-image-1.jpg', 'image', 7)
    requestAsset(queue, granted, 'b-image-2', 'https://media-b.example.com/b-image-2.jpg', 'image', 8)
    requestAsset(queue, granted, 'c-image-1', 'https://media-c.example.com/c-image-1.jpg', 'image', 9)
    requestAsset(queue, granted, 'd-image-1', 'https://media-d.example.com/d-image-1.jpg', 'image', 10)

    expect(granted).toEqual([
      'a-video-1',
      'a-video-2',
      'a-image-1',
      'a-image-2',
      'a-video-3',
      'b-video-1',
      'b-video-2',
      'b-image-1',
      'b-image-2',
      'c-image-1',
      'd-image-1',
    ])
  })

  it('keeps leases idempotent after a request is granted', () => {
    const queue = createAssetLoadQueue()

    const granted: string[] = []

    const lease = requestAsset(queue, granted, 'center-item', 'https://media.example.com/center-item.jpg', 'image', 100)

    lease.refresh()
    lease.cancel()
    lease.release()

    expect(granted).toEqual(['center-item'])
  })
})

function requestAsset(
  queue: ReturnType<typeof createAssetLoadQueue>,
  granted: string[],
  id: string,
  url: string,
  assetType: 'image' | 'video' | 'probe',
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
