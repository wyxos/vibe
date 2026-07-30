import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
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

describe('unlimited frontend autofill', () => {
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

  function options(loadPage: ReturnType<typeof vi.fn>, pageSize = 20) {
    return {
      autofill: {
        strategy: 'frontend' as const,
        pageSize,
        maxAdditionalPages: 'unlimited' as const,
        delayStepMs: 0,
      },
      loadPage,
      target,
    }
  }

  it('continues beyond the numeric default until the unique-card target is reached', async () => {
    let request = 0
    const loadPage = vi.fn().mockImplementation(async () => {
      request += 1
      return {
        items: [item(request)],
        next: `cursor-${request + 1}`,
      }
    })
    const instance = track(createVibe(options(loadPage, 12)))

    await instance.mount()

    expect(loadPage).toHaveBeenCalledTimes(12)
    expect(instance.getState().autofill).toMatchObject({
      missing: 0,
      received: 12,
      requests: 12,
      status: 'complete',
    })
  })

  it('stops when the provider has no next cursor', async () => {
    let request = 0
    const loadPage = vi.fn().mockImplementation(async () => {
      request += 1
      return {
        items: [item(request)],
        next: request < 3 ? `cursor-${request + 1}` : null,
      }
    })
    const instance = track(createVibe(options(loadPage)))

    await instance.mount()

    expect(loadPage).toHaveBeenCalledTimes(3)
    expect(instance.getState().autofill.status).toBe('exhausted')
  })

  it('stops with an error when a cursor repeats', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'repeat' })
      .mockResolvedValueOnce({ items: [item(2)], next: 'repeat' })
    const instance = track(createVibe(options(loadPage)))

    await instance.mount()

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(instance.getState().autofill.status).toBe('error')
    expect(instance.getState().autofill.error).toEqual(
      new Error('Vibe autofill received a repeated cursor.'),
    )
  })

  it('stops and reports provider errors', async () => {
    const failure = new Error('Provider failed')
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'two' })
      .mockRejectedValueOnce(failure)
    const instance = track(createVibe(options(loadPage)))

    await instance.mount()

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(instance.getState().autofill).toMatchObject({
      error: failure,
      status: 'error',
    })
  })

  it('stops on cancellation without committing the buffered batch', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'two' })
      .mockImplementationOnce(({ signal }: { signal: AbortSignal }) => (
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      ))
    const instance = track(createVibe(options(loadPage)))
    const mounting = instance.mount()
    await flushPromises()

    await instance.cancelAutofill()
    await mounting

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(instance.getState().items).toHaveLength(0)
    expect(instance.getState().autofill.status).toBe('cancelled')
  })

  it('aborts outstanding unlimited work when Vibe is destroyed', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'two' })
      .mockImplementationOnce(({ signal }: { signal: AbortSignal }) => (
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      ))
    const instance = track(createVibe(options(loadPage)))
    const mounting = instance.mount()
    await flushPromises()

    instance.destroy()
    await mounting

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(instance.getState().items).toHaveLength(0)
  })

  it('rejects values other than a non-negative integer or unlimited', () => {
    expect(() => createVibe({
      autofill: {
        strategy: 'frontend',
        pageSize: 2,
        maxAdditionalPages: 'forever',
      },
      loadPage: vi.fn(),
      target,
    } as unknown as Parameters<typeof createVibe>[0])).toThrow(
      'Vibe autofill maxAdditionalPages must be a non-negative integer or "unlimited".',
    )
  })
})
