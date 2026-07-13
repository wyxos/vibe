import { describe, expect, it } from 'vitest'

import {
  mediaErrorLabel,
  mediaErrorStatus,
} from '@/demo/mediaPreview'

describe('media preview errors', () => {
  it.each([
    [401, 'Authentication required'],
    [403, 'Access forbidden'],
    [404, 'Preview not found'],
    [419, 'Session expired'],
    [500, 'Server error'],
  ])('labels a %s response', (status, label) => {
    const src = `/demo-errors/${status}/fixture.jpg`

    expect(mediaErrorStatus(src)).toBe(String(status))
    expect(mediaErrorLabel(src)).toBe(label)
  })

  it('uses a generic fallback for an unknown media failure', () => {
    const src = 'https://example.com/broken.jpg'

    expect(mediaErrorStatus(src)).toBe('Error')
    expect(mediaErrorLabel(src)).toBe('Preview unavailable')
  })
})
