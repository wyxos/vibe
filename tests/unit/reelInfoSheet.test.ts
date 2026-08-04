import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeReelInfoSheetProps,
} from '@/index'

function item(postId: number, grouped = false): VibeItem {
  const media = {
    height: 1200,
    preview: {
      height: 600,
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
    },
    src: `https://example.com/${postId}.jpg`,
    width: 900,
  }

  return {
    ...media,
    items: grouped ? [{ ...media, src: `${media.src}?item=1` }] : [],
    postId,
  }
}

const InfoSheet = defineComponent({
  props: [
    'close',
    'index',
    'item',
    'layout',
    'loadedCount',
    'mediaCount',
    'mediaIndex',
    'mediaItem',
    'mediaSource',
    'origin',
    'total',
  ],
  setup(componentProps) {
    const props = componentProps as unknown as VibeReelInfoSheetProps

    return () => h('div', { 'data-test': 'consumer-sheet' }, [
      h(
        'output',
        `${props.item.postId}:${props.index}:${props.layout}:${props.origin}`
        + `:${props.mediaSource}:${props.mediaIndex}:${props.mediaCount}`
        + `:${props.loadedCount}:${props.total}`,
      ),
      h('button', {
        'data-test': 'consumer-close',
        type: 'button',
        onClick: props.close,
      }, 'Close'),
      h('div', { 'data-test': 'nested-vibe-target' }),
    ])
  },
})

describe('reel information sheet', () => {
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

  it('requires a configured component before enabling the sheet', () => {
    const instance = track(createVibe({
      target,
      initialPage: { items: [item(1)], next: null },
    }))

    expect(instance.getState().reelInfoSheet).toEqual({ enabled: false })
    expect(() => instance.setReelInfoSheet(true)).toThrow(
      'Vibe cannot enable reelInfoSheet without a configured component.',
    )
    expect(() => instance.setReelInfoSheet(false)).not.toThrow()
  })

  it('passes live reel context and lets consumer content close the sheet', async () => {
    const instance = track(createVibe({
      target,
      layout: 'reel',
      initialPage: { items: [item(1, true), item(2)], next: null, total: 8 },
      reelInfoSheet: { component: InfoSheet },
    }))
    await instance.mount()
    await flushPromises()

    const focusAnchor = document.createElement('button')
    target.append(focusAnchor)
    focusAnchor.focus()
    expect(target.querySelector('[data-test="consumer-sheet"]')).toBeNull()
    instance.setReelInfoSheet(true)
    await flushPromises()

    expect(instance.getState().reelInfoSheet.enabled).toBe(true)
    expect(target.querySelector('[data-test="consumer-sheet"] output')?.textContent)
      .toBe('1:0:reel:reel:original:0:2:2:8')
    expect(target.querySelector('.reel-info-sheet')?.getAttribute('role'))
      .toBe('complementary')

    expect(instance.nextReelMediaItem()).toBe(true)
    await flushPromises()
    expect(target.querySelector('[data-test="consumer-sheet"] output')?.textContent)
      .toBe('1:0:reel:reel:original:1:2:2:8')

    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()
    expect(target.querySelector('[data-test="consumer-sheet"] output')?.textContent)
      .toBe('2:1:reel:reel:original:0:1:2:8')

    const closeButton = target.querySelector<HTMLElement>('[data-test="consumer-close"]')!
    closeButton.focus()
    closeButton.click()
    await flushPromises()
    expect(instance.getState().reelInfoSheet.enabled).toBe(false)
    expect(target.querySelector('[data-test="consumer-sheet"]')).toBeNull()
    expect(document.activeElement).toBe(focusAnchor)
  })

  it('uses a modal overlay on phones and makes the reel inert', async () => {
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(390)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(844)
    const instance = track(createVibe({
      target,
      layout: 'reel',
      initialPage: { items: [item(1)], next: null },
      reelInfoSheet: { component: InfoSheet, enabled: true },
    }))
    await instance.mount()
    await flushPromises()

    expect(target.querySelector('.reel-layout')?.getAttribute('data-info-sheet-mode'))
      .toBe('overlay')
    expect(target.querySelector('.reel-info-sheet')?.getAttribute('role')).toBe('dialog')
    expect(target.querySelector('.reel-layout-main')?.hasAttribute('inert')).toBe(true)
  })

  it('closes a masonry reel while preserving the sheet state for the next reel', async () => {
    const instance = track(createVibe({
      target,
      initialPage: { items: [item(1), item(2), item(3)], next: null },
      reelInfoSheet: { component: InfoSheet, enabled: true },
    }))
    await instance.mount()
    await flushPromises()

    const masonry = target.querySelector<HTMLElement>('.masonry-feed')!
    masonry.scrollTop = 180
    target.querySelector<HTMLElement>('[data-post-id="2"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()

    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
    expect(target.querySelector('[data-test="consumer-sheet"]')).not.toBeNull()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(instance.getState().reelInfoSheet.enabled).toBe(true)
    expect(target.querySelector('.vibe-reel-overlay')).toBeNull()
    expect(target.querySelector('.masonry-feed')).toBe(masonry)
    expect(masonry.scrollTop).toBe(180)

    target.querySelector<HTMLElement>('[data-post-id="3"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
    expect(target.querySelector('[data-test="consumer-sheet"]')).not.toBeNull()
  })

  it('closes only the topmost nested reel on Escape', async () => {
    const parent = track(createVibe({
      target,
      layout: 'reel',
      initialPage: { items: [item(1), item(2)], next: null },
      reelInfoSheet: { component: InfoSheet, enabled: true },
    }))
    await parent.mount()
    await flushPromises()

    const nestedTarget = target.querySelector<HTMLElement>('[data-test="nested-vibe-target"]')!
    const nested = createVibe({
      target: nestedTarget,
      initialPage: { items: [item(11), item(12)], next: null },
    })

    try {
      await nested.mount()
      await flushPromises()
      nestedTarget.querySelector<HTMLElement>('[data-post-id="11"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, detail: 1 }),
      )
      await flushPromises()

      expect(nested.getState().reelOrigin).toBe('masonry')
      expect(parent.getState().reelInfoSheet.enabled).toBe(true)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushPromises()

      expect(nested.getState().reelOrigin).toBeNull()
      expect(nestedTarget.querySelector('.vibe-reel-overlay')).toBeNull()
      expect(parent.getState().reelInfoSheet.enabled).toBe(true)
      expect(parent.getState().activeReelPostId).toBe(1)
      expect(target.querySelector('[data-test="consumer-sheet"]')).not.toBeNull()
    } finally {
      nested.destroy()
    }
  })

  it('clears the sheet state when closing a masonry reel on phones', async () => {
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(390)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(844)
    const instance = track(createVibe({
      target,
      initialPage: { items: [item(1), item(2)], next: null },
      reelInfoSheet: { component: InfoSheet, enabled: true },
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()

    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(target.querySelector('.vibe-reel-overlay')).toBeNull()
    expect(instance.getState().reelInfoSheet.enabled).toBe(false)

    target.querySelector<HTMLElement>('[data-post-id="2"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    expect(target.querySelector('[data-test="consumer-sheet"]')).toBeNull()
  })
})
