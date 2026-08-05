import { afterEach, describe, expect, it } from 'vitest'

import { createVibe, type VibeInstance } from '@/index'

describe('authoritative total', () => {
  let instance: VibeInstance | null = null

  afterEach(() => instance?.destroy())

  it('updates independently from pagination and validates input', async () => {
    instance = createVibe({
      initialPage: { items: [], next: 'next', total: 10 },
      loadPage: async () => ({ items: [], next: null }),
      target: document.createElement('div'),
    })
    await instance.mount()

    instance.setTotal(7)
    expect(instance.getState().total).toBe(7)
    expect(instance.getState().next).toBe('next')

    instance.setTotal(null)
    expect(instance.getState().total).toBeNull()
    expect(() => instance?.setTotal(-1)).toThrow(
      'Vibe total must be a non-negative integer or null.',
    )
  })
})
