import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createAutoScrollState,
  validateAutoScrollOptions,
  VibeAutoScrollController,
} from '@/core/autoScroll'
import { createVibe, type VibeItem } from '@/index'

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

describe('auto scroll', () => {
  const frames = new Map<number, FrameRequestCallback>()
  let frameId = 0

  beforeEach(() => {
    frames.clear()
    frameId = 0
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      const id = ++frameId
      frames.set(id, callback)
      return id
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
      frames.delete(id)
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function runFrames(timestamp: number): void {
    const callbacks = [...frames.values()]
    frames.clear()
    expect(callbacks.length).toBeGreaterThan(0)
    callbacks.forEach((callback) => callback(timestamp))
  }

  it('provides configurable bounded speed defaults', () => {
    expect(createAutoScrollState()).toEqual({
      enabled: false,
      maxSpeedPxPerSecond: 240,
      minSpeedPxPerSecond: 20,
      paused: false,
      speedPxPerSecond: 80,
    })
    expect(createAutoScrollState({
      minSpeedPxPerSecond: 100,
      maxSpeedPxPerSecond: 140,
      speedPxPerSecond: 20,
    }).speedPxPerSecond).toBe(100)
    expect(createAutoScrollState({
      minSpeedPxPerSecond: 100,
      maxSpeedPxPerSecond: 140,
      speedPxPerSecond: 200,
    }).speedPxPerSecond).toBe(140)
  })

  it('rejects invalid speed ranges', () => {
    expect(() => validateAutoScrollOptions({ minSpeedPxPerSecond: 0 }))
      .toThrow('Vibe autoScroll.minSpeedPxPerSecond must be a positive number.')
    expect(() => validateAutoScrollOptions({
      minSpeedPxPerSecond: 100,
      maxSpeedPxPerSecond: 50,
    })).toThrow(
      'Vibe autoScroll.minSpeedPxPerSecond cannot exceed maxSpeedPxPerSecond.',
    )
  })

  it('moves by frame time and supports pause, resume, speed, and stop', () => {
    const element = {
      clientHeight: 100,
      scrollHeight: 1_000,
      scrollTop: 0,
    } as HTMLElement
    const state = createAutoScrollState({
      minSpeedPxPerSecond: 30,
      maxSpeedPxPerSecond: 120,
      speedPxPerSecond: 60,
    })
    const controller = new VibeAutoScrollController({
      getScrollElement: () => element,
      state,
    })

    controller.mount()
    controller.setEnabled(true, 1_000)
    expect(state).toMatchObject({ enabled: true, speedPxPerSecond: 120 })
    runFrames(0)
    runFrames(50)
    runFrames(100)
    expect(element.scrollTop).toBe(12)

    controller.setPaused(true)
    expect(state.paused).toBe(true)
    expect(frames.size).toBe(0)

    controller.setPaused(false)
    runFrames(1_000)
    runFrames(1_050)
    expect(element.scrollTop).toBe(18)

    controller.setSpeed(1)
    expect(state.speedPxPerSecond).toBe(30)
    runFrames(1_100)
    expect(element.scrollTop).toBe(19.5)

    controller.setEnabled(false)
    expect(state).toMatchObject({ enabled: false, paused: false })
    expect(frames.size).toBe(0)
    controller.destroy()
  })

  it('waits without jumping until the masonry scroll element is available', () => {
    const state = createAutoScrollState({ enabled: true })
    const element = {
      clientHeight: 100,
      scrollHeight: 1_000,
      scrollTop: 0,
    } as HTMLElement
    let available = false
    const controller = new VibeAutoScrollController({
      getScrollElement: () => available ? element : null,
      state,
    })

    controller.mount()
    runFrames(0)
    available = true
    runFrames(1_000)
    expect(element.scrollTop).toBe(0)
    runFrames(1_100)
    expect(element.scrollTop).toBe(8)
    controller.destroy()
  })

  it('controls the mounted masonry owner and waits while its reel is open', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    const target = document.createElement('div')
    document.body.append(target)
    const vibe = createVibe({
      autoScroll: {
        minSpeedPxPerSecond: 50,
        maxSpeedPxPerSecond: 100,
        speedPxPerSecond: 75,
      },
      initialPage: { items: [item(1), item(2), item(3)], next: null },
      target,
    })

    await vibe.mount()
    await flushPromises()
    const masonry = target.querySelector<HTMLElement>('.masonry-feed')!
    Object.defineProperties(masonry, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
    })

    vibe.setAutoScroll(true)
    runFrames(0)
    runFrames(100)
    expect(masonry.scrollTop).toBe(7.5)
    expect(vibe.getState().autoScroll).toMatchObject({
      enabled: true,
      paused: false,
      speedPxPerSecond: 75,
    })

    target.querySelector<HTMLElement>('[data-post-id="1"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    expect(vibe.getState().reelOrigin).toBe('masonry')
    runFrames(200)
    expect(masonry.scrollTop).toBe(7.5)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    runFrames(300)
    runFrames(400)
    expect(masonry.scrollTop).toBe(15)

    vibe.destroy()
    target.remove()
  })
})
