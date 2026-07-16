import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeAutofillSessionSnapshot,
  type VibeBackendAutofillUpdate,
  type VibeInstance,
  type VibeItem,
} from '@/index'

function item(postId: number): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.jpg`,
    preview: {
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

function session(
  overrides: Partial<VibeAutofillSessionSnapshot> = {},
): VibeAutofillSessionSnapshot {
  return {
    cycleId: 'cycle-1',
    feedKey: 'gallery',
    pageSize: 4,
    received: 1,
    sequence: 0,
    sessionId: 'session-1',
    status: 'waiting',
    ...overrides,
  }
}

describe('Vibe autofill', () => {
  const instances: VibeInstance[] = []
  let target: HTMLDivElement

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    instances.splice(0).forEach((instance) => instance.destroy())
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function track(instance: VibeInstance): VibeInstance {
    instances.push(instance)
    return instance
  }

  it('collects frontend pages until the unique-card target is reached', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1), item(2)], next: 'two', total: 8 })
      .mockResolvedValueOnce({ items: [item(2), item(3), item(4)], next: 'three' })
    const instance = track(createVibe({
      autofill: { strategy: 'frontend', pageSize: 4 },
      loadPage,
      target,
    }))

    await instance.mount()
    await flushPromises()

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(loadPage.mock.calls.map(([request]) => request.cursor)).toEqual([null, 'two'])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3, 4])
    expect(instance.getState().autofill).toMatchObject({
      missing: 0,
      received: 4,
      requests: 2,
      status: 'complete',
      strategy: 'frontend',
    })
  })

  it('marks a frontend cycle exhausted when no subsequent cursor remains', async () => {
    const instance = track(createVibe({
      autofill: { strategy: 'frontend', pageSize: 4 },
      loadPage: vi.fn().mockResolvedValue({ items: [item(1)], next: null }),
      target,
    }))

    await instance.mount()

    expect(instance.getState().items).toHaveLength(1)
    expect(instance.getState().autofill).toMatchObject({
      missing: 3,
      received: 1,
      status: 'exhausted',
    })
  })

  it('continues frontend autofill from a preloaded page', async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [item(2), item(3)],
      next: 'three',
    })
    const instance = track(createVibe({
      autofill: { strategy: 'frontend', pageSize: 3 },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))

    await instance.mount()

    expect(loadPage).toHaveBeenCalledOnce()
    expect(loadPage).toHaveBeenCalledWith(expect.objectContaining({ cursor: 'two' }))
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3])
    expect(instance.getState().autofill).toMatchObject({
      received: 3,
      requests: 2,
      status: 'complete',
    })
  })

  it('cancels an in-flight frontend cycle without committing its buffered batch', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'two' })
      .mockImplementationOnce(({ signal }: { signal: AbortSignal }) => (
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      ))
    const instance = track(createVibe({
      autofill: { strategy: 'frontend', pageSize: 3 },
      loadPage,
      target,
    }))

    const mountPromise = instance.mount()
    await flushPromises()
    expect(loadPage).toHaveBeenCalledTimes(2)

    await instance.cancelAutofill()
    await mountPromise

    expect(instance.getState().items).toHaveLength(0)
    expect(instance.getState().autofill.status).toBe('cancelled')
  })

  it('waits for and atomically applies a backend autofill result', async () => {
    const onCancel = vi.fn()
    const onUnderfilled = vi.fn().mockResolvedValue({
      sessionId: 'session-1',
      sequence: 0,
    })
    const instance = track(createVibe({
      autofill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel,
        onUnderfilled,
        pageSize: 4,
      },
      loadPage: vi.fn().mockResolvedValue({ items: [item(1)], next: 'two' }),
      target,
    }))

    await instance.mount()
    expect(instance.getState().items).toHaveLength(1)
    expect(instance.getState().autofill.status).toBe('waiting')
    expect(onUnderfilled).toHaveBeenCalledWith(expect.objectContaining({
      cycleId: expect.any(String),
      feedKey: 'gallery',
      missing: 3,
      received: 1,
    }))

    expect(instance.applyAutofillUpdate({
      feedKey: 'gallery',
      received: 2,
      requests: 2,
      sequence: 1,
      sessionId: 'session-1',
      status: 'waiting',
    })).toBe(true)
    expect(instance.getState().items).toHaveLength(1)
    expect(instance.getState().autofill.requests).toBe(2)

    expect(instance.applyAutofillUpdate({
      feedKey: 'gallery',
      items: [item(2), item(3), item(4)],
      next: null,
      received: 4,
      sequence: 2,
      sessionId: 'session-1',
      status: 'complete',
    })).toBe(true)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3, 4])
    expect(instance.getState().autofill.status).toBe('complete')
    expect(instance.applyAutofillUpdate({
      feedKey: 'gallery',
      received: 3,
      sequence: 1,
      sessionId: 'session-1',
      status: 'waiting',
    })).toBe(false)
  })

  it('animates only appended items when backend autofill completes for a preloaded page', async () => {
    const instance = track(createVibe({
      autofill: {
        strategy: 'backend',
        feedKey: 'gallery',
        initialSession: {
          cycleId: 'cycle-1',
          feedKey: 'gallery',
          pageSize: 4,
          received: 1,
          sequence: 0,
          sessionId: 'session-1',
          status: 'waiting',
        },
        onCancel: vi.fn(),
        onUnderfilled: vi.fn(),
        pageSize: 4,
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn(),
      target,
    }))

    await instance.mount()
    const initialCard = target.querySelector<HTMLElement>('[data-post-id="1"]')
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))

    expect(instance.applyAutofillUpdate({
      feedKey: 'gallery',
      items: [item(2), item(3), item(4)],
      next: null,
      received: 4,
      sequence: 1,
      sessionId: 'session-1',
      status: 'complete',
    })).toBe(true)
    await flushPromises()

    const existingCard = target.querySelector<HTMLElement>('[data-post-id="1"]')
    const appendedCard = target.querySelector<HTMLElement>('[data-post-id="2"]')
    expect(existingCard).toBe(initialCard)
    expect(existingCard?.classList.contains('media-card--entering')).toBe(false)
    expect(appendedCard?.classList.contains('media-card--entering')).toBe(true)
  })

  it('loads from the terminal backend cursor after autofill completes', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'two' })
      .mockResolvedValueOnce({
        items: [item(5), item(6), item(7), item(8)],
        next: 'nine',
      })
    const instance = track(createVibe({
      autofill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel: vi.fn(),
        onUnderfilled: vi.fn().mockResolvedValue({ sessionId: 'session-1' }),
        pageSize: 4,
      },
      loadPage,
      target,
    }))

    await instance.mount()
    expect(instance.applyAutofillUpdate({
      feedKey: 'gallery',
      items: [item(2), item(3), item(4)],
      next: 'five',
      received: 4,
      requests: 2,
      sequence: 1,
      sessionId: 'session-1',
      status: 'complete',
    })).toBe(true)

    await instance.loadNext()

    expect(loadPage.mock.calls.map(([request]) => request.cursor))
      .toEqual([null, 'five'])
    expect(instance.getState().items.map(({ postId }) => postId))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('rejects a terminal backend update without a continuation cursor', async () => {
    const loadPage = vi.fn().mockResolvedValue({ items: [item(1)], next: 'two' })
    const instance = track(createVibe({
      autofill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel: vi.fn(),
        onUnderfilled: vi.fn().mockResolvedValue({ sessionId: 'session-1' }),
        pageSize: 4,
      },
      loadPage,
      target,
    }))
    const invalidUpdate = {
      feedKey: 'gallery',
      items: [item(2), item(3), item(4)],
      received: 4,
      sequence: 1,
      sessionId: 'session-1',
      status: 'complete',
    } as unknown as VibeBackendAutofillUpdate

    await instance.mount()

    expect(instance.applyAutofillUpdate(invalidUpdate)).toBe(false)
    await instance.loadNext()

    expect(loadPage).toHaveBeenCalledOnce()
    expect(instance.getState().autofill.status).toBe('waiting')
    expect(instance.getState().next).toBe('two')
  })

  it('starts backend autofill for a preloaded page without a session', async () => {
    const onUnderfilled = vi.fn().mockResolvedValue({ sessionId: 'session-1' })
    const loadPage = vi.fn()
    const instance = track(createVibe({
      autofill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel: vi.fn(),
        onUnderfilled,
        pageSize: 3,
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))

    await instance.mount()

    expect(loadPage).not.toHaveBeenCalled()
    expect(onUnderfilled).toHaveBeenCalledOnce()
    expect(instance.getState().autofill).toMatchObject({
      received: 1,
      requests: 1,
      sessionId: 'session-1',
      status: 'waiting',
    })
  })

  it('restores a backend session and cancels its durable job', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined)
    const initialSession: VibeAutofillSessionSnapshot = {
      cycleId: 'cycle-1',
      feedKey: 'gallery',
      pageSize: 4,
      received: 1,
      sequence: 3,
      sessionId: 'session-1',
      status: 'waiting',
    }
    const instance = track(createVibe({
      autofill: {
        strategy: 'backend',
        feedKey: 'gallery',
        initialSession,
        onCancel,
        onUnderfilled: vi.fn(),
        pageSize: 4,
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn(),
      target,
    }))

    await instance.mount()
    expect(instance.getState().autofill.status).toBe('waiting')
    expect(onCancel).not.toHaveBeenCalled()

    await instance.cancelAutofill()

    expect(onCancel).toHaveBeenCalledWith({
      cycleId: 'cycle-1',
      feedKey: 'gallery',
      sessionId: 'session-1',
    })
    expect(instance.getState().autofill.status).toBe('cancelled')
    expect(instance.applyAutofillUpdate({
      feedKey: 'gallery',
      items: [item(2)],
      next: null,
      received: 2,
      sequence: 4,
      sessionId: 'session-1',
      status: 'complete',
    })).toBe(false)
  })

  it.each([
    {
      label: 'feed key',
      message: 'initialSession feedKey must match autofill feedKey',
      overrides: { feedKey: 'another-gallery' },
    },
    {
      label: 'page size',
      message: 'initialSession pageSize must match autofill pageSize',
      overrides: { pageSize: 5 },
    },
  ])('rejects a restored backend session with a mismatched $label', ({
    message,
    overrides,
  }) => {
    expect(() => createVibe({
      autofill: {
        strategy: 'backend',
        feedKey: 'gallery',
        initialSession: session(overrides),
        onCancel: vi.fn(),
        onUnderfilled: vi.fn(),
        pageSize: 4,
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn(),
      target,
    })).toThrow(message)
  })
})
