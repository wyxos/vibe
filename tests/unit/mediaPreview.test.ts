import { describe, expect, it } from 'vitest'

import {
  mediaErrorLabel,
  mediaErrorStatus,
} from '@/core/mediaPreview'

describe('media preview errors', () => {
  it.each([401, 403, 404, 419, 500])('does not infer a %s HTTP status from a URL', (status) => {
    const src = `/assets/${status}/fixture.jpg`

    expect(mediaErrorStatus(src)).toBe('Error')
    expect(mediaErrorLabel(src)).toBe('Preview unavailable')
  })

  it('uses a generic fallback for an unknown media failure', () => {
    const src = 'https://example.com/broken.jpg'

    expect(mediaErrorStatus(src)).toBe('Error')
    expect(mediaErrorLabel(src)).toBe('Preview unavailable')
  })
})
